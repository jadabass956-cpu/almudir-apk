// ============================================================
//  ALMUDIR AI — لوحة تعليم المساعد
// ============================================================

let _aiPatterns = [];
let _aiLearnings = [];
let _aiCurrentPatternId = null;

// ---------- فتح الصفحة ----------
function aiTrainingInit() {
    console.log('🎓 [AI Training] تحميل...');
    aiLoadStats();
    aiLoadPatterns();
    aiLoadLearnings();
}

// ---------- الإحصائيات ----------
async function aiLoadStats() {
    try {
        const p = await db.collection('ai_patterns').get();
        const l = await db.collection('ai_learnings').get();
        let pending = 0, totalAsks = 0;
        p.forEach(d => {
            if ((d.data().status || 'pending') === 'pending') pending++;
            totalAsks += (d.data().asked_count || 1);
        });
        document.getElementById('aiStatPending').textContent = pending;
        document.getElementById('aiStatLearned').textContent = l.size;
        document.getElementById('aiStatTotal').textContent = p.size;
        document.getElementById('aiStatAsks').textContent = totalAsks;
    } catch (e) {
        console.warn('[AI Training] stats:', e);
    }
}

// ---------- تحميل الأنماط ----------
async function aiLoadPatterns() {
    const list = document.getElementById('aiPendingList');
    if (!list) return;
    list.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">جاري التحميل...</div>';
    try {
        const snap = await db.collection('ai_patterns').get();
        _aiPatterns = [];
        snap.forEach(d => {
            const data = d.data();
            if ((data.status || 'pending') === 'pending') {
                _aiPatterns.push({ id: d.id, ...data });
            }
        });
        _aiPatterns.sort((a, b) => (b.asked_count || 0) - (a.asked_count || 0));
        aiRenderPending();
    } catch (e) {
        list.innerHTML = '<div style="color:#e74c3c;padding:20px;">خطأ: ' + e.message + '</div>';
    }
}

function aiRenderPending() {
    const list = document.getElementById('aiPendingList');
    if (!list) return;
    if (!_aiPatterns.length) {
        list.innerHTML = '<div style="color:#999;text-align:center;padding:30px;">✅ لا توجد أسئلة تنتظر التعليم</div>';
        return;
    }
    list.innerHTML = _aiPatterns.map(p => {
        const count = p.asked_count || 1;
        const users = (p.user_uids || []).length;
        return `
        <div style="background:#fff; border:1px solid #eee; border-right:4px solid #f39c12; border-radius:10px; padding:15px; margin:10px 0;">
            <div style="font-weight:bold; font-size:15px; color:#2c3e50; margin-bottom:8px;">
                "${_aiEscape(p.question || p.normalized || '')}"
            </div>
            <div style="color:#666; font-size:13px; margin-bottom:10px;">
                📊 ${count} مرة &nbsp;|&nbsp; 👥 ${users} مستخدم &nbsp;|&nbsp; 🕐 آخر مرة
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                <button onclick="aiLinkIntent('${p.id}')" style="padding:8px; background:#3498db; color:white; border:none; border-radius:6px; font-size:13px; cursor:pointer;">🎯 اربط</button>
                <button onclick="aiReplyCustom('${p.id}')" style="padding:8px; background:#27ae60; color:white; border:none; border-radius:6px; font-size:13px; cursor:pointer;">✍️ رد</button>
                <button onclick="aiIgnorePattern('${p.id}')" style="padding:8px; background:#95a5a6; color:white; border:none; border-radius:6px; font-size:13px; cursor:pointer;">🗑️ تجاهل</button>
            </div>
        </div>`;
    }).join('');
}

// ---------- تحميل التعلّمات ----------
async function aiLoadLearnings() {
    const list = document.getElementById('aiLearnedList');
    if (!list) return;
    list.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">جاري التحميل...</div>';
    try {
        const snap = await db.collection('ai_learnings').get();
        _aiLearnings = [];
        snap.forEach(d => _aiLearnings.push({ id: d.id, ...d.data() }));
        aiRenderLearned();
    } catch (e) {
        list.innerHTML = '<div style="color:#e74c3c;padding:20px;">خطأ: ' + e.message + '</div>';
    }
}

function aiRenderLearned() {
    const list = document.getElementById('aiLearnedList');
    if (!list) return;
    if (!_aiLearnings.length) {
        list.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">لم يتم تعليم أي سؤال بعد</div>';
        return;
    }
    list.innerHTML = _aiLearnings.map(l => {
        const action = l.action === 'link' ? '🎯 مرتبط بـ ' + (l.target_intent || '?')
                     : l.action === 'custom' ? '✍️ رد مخصص'
                     : l.action === 'keyword' ? '🔑 كلمة مفتاحية'
                     : '🚫 تم تجاهله';
        return `
        <div style="background:#f0fdf4; border:1px solid #d1fae5; border-radius:8px; padding:12px; margin:8px 0;">
            <div style="font-weight:bold; color:#2c3e50; font-size:14px;">"${_aiEscape(l.original_question || '')}"</div>
            <div style="color:#27ae60; font-size:12px; margin-top:5px;">${action}</div>
            <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="aiEditLearning('${l.id}')" style="padding:6px 12px; background:#3498db; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer;">✏️ تعديل</button>
                <button onclick="aiDeleteLearning('${l.id}')" style="padding:6px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer;">🗑️ حذف</button>
            </div>
        </div>`;
    }).join('');
}

// ---------- الإجراءات ----------
function aiLinkIntent(patternId) {
    const p = _aiPatterns.find(x => x.id === patternId);
    if (!p) return;
    _aiCurrentPatternId = patternId;
    document.getElementById('aiLinkQuestion').textContent = p.question || p.normalized || '';

    // 🧠 تعبئة الكلمات المفتاحية تلقائياً
    const autoWords = aiExtractKeywords(p.question || p.normalized || '');
    document.getElementById('aiTeachWords').value = autoWords.join('\n');
    document.getElementById('aiTeachType').value = 'data';
    document.getElementById('aiTeachAction').value = '';
    document.getElementById('aiTeachIntro').value = '';
    document.getElementById('aiTeachFollowUp').value = '';
    document.getElementById('aiTeachPriority').value = 5;

    // 🧠 تعبئة دالة action من AIE_ACTIONS
    const actSel = document.getElementById('aiTeachAction');
    if (typeof AIE_ACTIONS !== 'undefined') {
        actSel.innerHTML = '<option value="">— اختر الدالة —</option>' +
            AIE_ACTIONS.map(a => '<option value="' + a.value + '">' + a.label + '</option>').join('');
    }

    // 🔗 تعبئة قائمة قاعدة المعرفة
    const knSel = document.getElementById('aiTeachLinkedKn');
    if (knSel) {
        knSel.innerHTML = '<option value="">— بدون ربط —</option>';
        db.collection('ai_knowledge').get().then(snap => {
            snap.forEach(d => {
                const data = d.data();
                knSel.innerHTML += '<option value="' + d.id + '">📚 ' + _aiEscape(data.title || '') + '</option>';
            });
        }).catch(e => console.warn('ai_knowledge load:', e));
    }

    document.getElementById('aiLinkModal').classList.add('show');
}

function aiCloseLink() {
    document.getElementById('aiLinkModal').classList.remove('show');
}

async function aiSaveLink() {
    const p = _aiPatterns.find(x => x.id === _aiCurrentPatternId);
    if (!p) return;

    // 📥 قراءة الحقول
    const wordsRaw = document.getElementById('aiTeachWords').value.trim();
    const words = wordsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    if (!words.length) return alert('⚠️ أدخل كلمة مفتاحية واحدة على الأقل');

    const type = document.getElementById('aiTeachType').value || 'data';
    const action = document.getElementById('aiTeachAction').value.trim();
    const intro = document.getElementById('aiTeachIntro').value.trim();
    const followUp = document.getElementById('aiTeachFollowUp').value.trim();
    const linkedKnowledgeId = document.getElementById('aiTeachLinkedKn').value || '';
    const priority = parseInt(document.getElementById('aiTeachPriority').value) || 5;

    // لو type يحتاج action
    if ((type === 'data' || type === 'mixed') && !action) {
        return alert('⚠️ اختر دالة البيانات (action)');
    }

    try {
        // 1) احفظ في ai_keywords
        const kwRef = await db.collection('ai_keywords').add({
            words: words,
            type: type,
            action: action || 'custom',
            intro: intro,
            followUp: followUp,
            linkedKnowledgeId: linkedKnowledgeId,
            priority: priority,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdFrom: 'training'
        });

        // 2) حدّث ai_patterns
        await db.collection('ai_patterns').doc(_aiCurrentPatternId).update({
            status: 'learned',
            learnedAt: firebase.firestore.FieldValue.serverTimestamp(),
            learnedAs: 'keyword',
            keyword_id: kwRef.id
        });

        // 3) سجّل في ai_learnings (للتوثيق)
        await db.collection('ai_learnings').add({
            pattern_id: _aiCurrentPatternId,
            original_question: p.question || p.normalized || '',
            keywords: words,
            action: 'keyword',
            keyword_id: kwRef.id,
            added_by: auth.currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('✅ تم التعليم بنجاح!');
        aiCloseLink();
        aiTrainingInit();

        // 4) أعد تحميل محرك المعرفة
        if (typeof aiEngineReload === 'function') {
            aiEngineReload().then(() => console.log('🧠 ai-engine reloaded'));
        }
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
        console.error('[aiSaveLink]', e);
    }
}

function aiReplyCustom(patternId) {
    const p = _aiPatterns.find(x => x.id === patternId);
    if (!p) return;
    _aiCurrentPatternId = patternId;
    document.getElementById('aiReplyQuestion').textContent = p.question || p.normalized || '';
    document.getElementById('aiReplyKeywords').value = aiExtractKeywords(p.question || p.normalized || '').join(', ');
    document.getElementById('aiReplyText').value = '';
    document.getElementById('aiReplyModal').classList.add('show');
}

function aiCloseReply() {
    document.getElementById('aiReplyModal').classList.remove('show');
}

async function aiSaveReply() {
    const p = _aiPatterns.find(x => x.id === _aiCurrentPatternId);
    if (!p) return;
    const keywordsRaw = document.getElementById('aiReplyKeywords').value.trim();
    const reply = document.getElementById('aiReplyText').value.trim();
    if (!keywordsRaw || !reply) {
        alert('⚠️ أدخل الكلمات المفتاحية والرد');
        return;
    }
    const keywords = keywordsRaw.split(',').map(x => x.trim()).filter(Boolean);
    try {
        await db.collection('ai_learnings').add({
            pattern_id: _aiCurrentPatternId,
            original_question: p.question || p.normalized || '',
            keywords: keywords,
            action: 'custom',
            custom_response: reply,
            added_by: auth.currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('ai_patterns').doc(_aiCurrentPatternId).update({
            status: 'learned'
        });
        alert('✅ تم حفظ الرد!');
        aiCloseReply();
        aiTrainingInit();
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

async function aiIgnorePattern(patternId) {
    if (!confirm('حذف هذا السؤال من القائمة؟')) return;
    try {
        await db.collection('ai_patterns').doc(patternId).update({ status: 'ignored' });
        aiTrainingInit();
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

// ---------- 🗑️ حذف تعليم ----------
async function aiDeleteLearning(learningId) {
    if (!confirm('🗑️ حذف هذا التعليم؟\n\nسيتم:\n• حذف السجل من ai_learnings\n• حذف keyword المرتبط (إن وُجد)\n• إعادة السؤال إلى قائمة الانتظار')) return;

    try {
        const learnDoc = await db.collection('ai_learnings').doc(learningId).get();
        if (!learnDoc.exists) {
            alert('❌ التعليم غير موجود');
            return;
        }
        const data = learnDoc.data();

        // 1) احذف keyword المرتبط
        if (data.keyword_id) {
            try {
                await db.collection('ai_keywords').doc(data.keyword_id).delete();
                console.log('✅ keyword محذوف:', data.keyword_id);
            } catch(e) { console.warn('keyword delete:', e.message); }
        }

        // 2) احذف من ai_learnings
        await db.collection('ai_learnings').doc(learningId).delete();

        // 3) أعد السؤال إلى pending
        if (data.pattern_id) {
            try {
                await db.collection('ai_patterns').doc(data.pattern_id).update({
                    status: 'pending',
                    learnedAt: firebase.firestore.FieldValue.delete()
                });
            } catch(e) { console.warn('pattern reset:', e.message); }
        }

        alert('✅ تم الحذف بنجاح');
        aiTrainingInit();
        if (typeof aiEngineReload === 'function') aiEngineReload();
    } catch(e) {
        alert('❌ خطأ: ' + e.message);
        console.error('[aiDeleteLearning]', e);
    }
}

// ---------- ✏️ تعديل تعليم ----------
async function aiEditLearning(learningId) {
    try {
        const learnDoc = await db.collection('ai_learnings').doc(learningId).get();
        if (!learnDoc.exists) return alert('❌ التعليم غير موجود');
        const data = learnDoc.data();

        // 1) احذف القديم (keyword)
        if (data.keyword_id) {
            try {
                await db.collection('ai_keywords').doc(data.keyword_id).delete();
            } catch(e) { console.warn('keyword delete:', e.message); }
        }

        // 2) احذف من ai_learnings
        await db.collection('ai_learnings').doc(learningId).delete();

        // 3) أعد السؤال إلى pending
        if (data.pattern_id) {
            await db.collection('ai_patterns').doc(data.pattern_id).update({
                status: 'pending',
                learnedAt: firebase.firestore.FieldValue.delete()
            });
        }

        alert('✅ تم حذف التعليم — السؤال في قائمة الانتظار.\nيمكنك الآن تعليمه من جديد.');
        aiTrainingInit();
        if (typeof aiEngineReload === 'function') aiEngineReload();
    } catch(e) {
        alert('❌ خطأ: ' + e.message);
    }
}

// ---------- استخراج كلمات مفتاحية بسيط ----------
function aiExtractKeywords(text) {
    const n = aiNorm(text);
    const words = n.split(/\s+/).filter(w => w.length >= 3);
    return words.slice(0, 5);
}

// ---------- Escape HTML ----------
function _aiEscape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

console.log('🎓 [ai-training] جاهز');
