// ============================================================
//  👍 AI FEEDBACK — تعلّم من التصحيح المُعلَن
//  يظهر أزرار التقييم بعد كل رد + يحفظ التصحيح
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. STATE
// ═══════════════════════════════════════════════════════════
let _feedbackLastMessage = null;  // آخر رسالة مساعد
let _feedbackLastQuestion = null;
let _feedbackLastIntent = null;

// ═══════════════════════════════════════════════════════════
//  2. ATTACH — يُستدعى بعد كل رد
// ═══════════════════════════════════════════════════════════
/**
 * @param {HTMLElement} messageDiv - عنصر الرسالة
 * @param {String} question - السؤال الأصلي
 * @param {String} response - نص الرد
 * @param {String} intentId - معرّف النية (اختياري)
 */
function aiFeedbackAttach(messageDiv, question, response, intentId) {
    if (!messageDiv) return;
    
    // حفظ للاستخدام لاحقاً
    _feedbackLastMessage = messageDiv;
    _feedbackLastQuestion = question;
    _feedbackLastIntent = intentId || null;
    
    // لا نُضيف الأزرار لو الرد خطأ
    if (!response || typeof response !== 'string') return;
    
    // لا نُضيف لو الرسالة "المساعد في مرحلة التعلم"
    if (response.includes('مرحلة التعلم')) return;
    
    // لا نُضيف في رسائل الترحيب
    if (response.includes('أهلاً بك') || response.includes('مرحبا بك')) return;
    
    // إنشاء حاوية الأزرار
    const fb = document.createElement('div');
    fb.className = 'ai-feedback-container';
    fb.style.cssText = 'margin-top:8px; padding-top:8px; border-top:1px dashed #ddd; font-size:12px; color:#666;';
    fb.innerHTML = `
        <div style="margin-bottom:6px;">هل الإجابة مفيدة؟</div>
        <div style="display:flex; gap:6px;">
            <button onclick="aiFeedbackGood()" style="flex:1; padding:6px 10px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;">👍 نعم</button>
            <button onclick="aiFeedbackBad()" style="flex:1; padding:6px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;">👎 لا</button>
        </div>
    `;
    
    messageDiv.appendChild(fb);
}

// ═══════════════════════════════════════════════════════════
//  3. GOOD — المستخدم وافق
// ═══════════════════════════════════════════════════════════
async function aiFeedbackGood() {
    // 1) أخفِ الأزرار
    _aiFeedbackHideButtons();
    
    // 2) أظهر شكراً
    _aiFeedbackShowThanks('شكراً لك! يساعدني هذا على التحسّن.');
    
    // 3) سجّل في Firestore (اختياري — للتتبع)
    await _aiFeedbackSave(true, null);
    
    console.log('👍 [ai-feedback] رد إيجابي');
}

// ═══════════════════════════════════════════════════════════
//  4. BAD — المستخدم رفض
// ═══════════════════════════════════════════════════════════
async function aiFeedbackBad() {
    // 1) أخفِ الأزرار
    _aiFeedbackHideButtons();
    
    // 2) اعرض خيارات التصحيح
    _aiFeedbackShowOptions();
    
    console.log('👎 [ai-feedback] رد سلبي');
}

// ═══════════════════════════════════════════════════════════
//  5. SELECT — المستخدم اختار النية الصحيحة
// ═══════════════════════════════════════════════════════════
async function aiFeedbackSelect(intentId, intentLabel) {
    console.log('🔧 [ai-feedback] اختار:', intentId, intentLabel);
    
    // 1) أخفِ الخيارات
    _aiFeedbackHideButtons();
    
    // 2) احفظ التصحيح
    const saved = await _aiFeedbackSave(false, intentId);
    
    // 3) أظهر تأكيداً
    if (saved) {
        _aiFeedbackShowThanks(`شكراً! حفظت أنك تقصد: "${intentLabel}". سأتذكّر ذلك.`);
    } else {
        _aiFeedbackShowThanks('شكراً، سأحاول التحسّن.');
    }
    
    // 4) علّم النمط (اختياري)
    await _aiFeedbackLearnPattern(intentId);
}

// ═══════════════════════════════════════════════════════════
//  6. UI HELPERS
// ═══════════════════════════════════════════════════════════
function _aiFeedbackHideButtons() {
    if (!_feedbackLastMessage) return;
    const fb = _feedbackLastMessage.querySelector('.ai-feedback-container, .ai-feedback-options');
    if (fb) fb.remove();
}

function _aiFeedbackShowThanks(text) {
    if (!_feedbackLastMessage) return;
    const div = document.createElement('div');
    div.style.cssText = 'margin-top:8px; padding:6px 10px; background:#d4edda; color:#155724; border-radius:6px; font-size:12px;';
    div.textContent = '✅ ' + text;
    _feedbackLastMessage.appendChild(div);
}

function _aiFeedbackShowOptions() {
    if (!_feedbackLastMessage) return;
    
    const div = document.createElement('div');
    div.className = 'ai-feedback-options';
    div.style.cssText = 'margin-top:8px; padding-top:8px; border-top:1px dashed #ddd; font-size:12px; color:#666;';
    
    // الخيارات
    const options = [
        { id: 'sales_total',   label: '💰 مبيعات' },
        { id: 'profit',        label: '💵 أرباح' },
        { id: 'expenses',      label: '💸 مصروفات' },
        { id: 'cash',          label: '💼 صندوق' },
        { id: 'stock_value',   label: '📦 مخزون' },
        { id: 'debts',         label: '👥 ديون' },
        { id: 'customer_top',  label: '👑 عملاء' },
        { id: 'material_low',  label: '⚠️ مواد ناقصة' },
        { id: 'other',         label: '📝 أخرى' }
    ];
    
    let html = '<div style="margin-bottom:6px;">ماذا كنت تقصد؟</div>';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">';
    
    options.forEach(o => {
        html += `<button onclick="aiFeedbackSelect('${o.id}', '${o.label}')" style="padding:6px 8px; background:#ecf0f1; color:#2c3e50; border:none; border-radius:6px; cursor:pointer; font-size:11px; text-align:right;">${o.label}</button>`;
    });
    
    html += '</div>';
    html += '<button onclick="_aiFeedbackCancel()" style="width:100%; margin-top:6px; padding:4px; background:transparent; color:#95a5a6; border:none; cursor:pointer; font-size:11px;">إلغاء</button>';
    
    div.innerHTML = html;
    _feedbackLastMessage.appendChild(div);
}

function _aiFeedbackCancel() {
    _aiFeedbackHideButtons();
    _aiFeedbackShowThanks('حسناً، تجاهلت التصحيح.');
}

// ═══════════════════════════════════════════════════════════
//  7. FIRESTORE — حفظ التصحيح
// ═══════════════════════════════════════════════════════════
async function _aiFeedbackSave(wasHelpful, correctIntent) {
    if (typeof db === 'undefined' || !db) return false;
    if (typeof auth === 'undefined' || !auth.currentUser) return false;
    
    try {
        const uid = auth.currentUser.uid;
        
        await db.collection('users').doc(uid)
            .collection('ai_feedback').add({
                question: _feedbackLastQuestion || '',
                predictedIntent: _feedbackLastIntent || 'unknown',
                correctIntent: correctIntent || null,
                wasHelpful: wasHelpful,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('💾 [ai-feedback] محفوظ:', { wasHelpful, correctIntent });
        return true;
    } catch(e) {
        console.warn('[ai-feedback] save:', e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
//  8. LEARN PATTERN — تعلّم نمط جديد
// ═══════════════════════════════════════════════════════════
async function _aiFeedbackLearnPattern(correctIntentId) {
    if (correctIntentId === 'other') return;
    if (typeof db === 'undefined' || !db) return;
    if (typeof auth === 'undefined' || !auth.currentUser) return;
    
    try {
        const uid = auth.currentUser.uid;
        const question = _feedbackLastQuestion || '';
        if (!question) return;
        
        // تطبيع السؤال
        const norm = typeof aiNorm2 === 'function' ? aiNorm2(question) : question;
        if (!norm) return;
        
        // hash بسيط
        let hash = 0;
        for (let i = 0; i < norm.length; i++) {
            hash = ((hash << 5) - hash) + norm.charCodeAt(i);
            hash = hash & hash;
        }
        const docId = 'f_' + Math.abs(hash).toString(36);
        
        // احفظ كتعلّم جديد
        await db.collection('users').doc(uid)
            .collection('ai_learned_intents').doc(docId).set({
                question: question,
                normalized: norm,
                intentId: correctIntentId,
                source: 'feedback',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log('🎓 [ai-feedback] تعلّم نمط:', norm, '→', correctIntentId);
    } catch(e) {
        console.warn('[ai-feedback] learn:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  9. EXPORT
// ═══════════════════════════════════════════════════════════
window.aiFeedbackAttach = aiFeedbackAttach;
window.aiFeedbackGood = aiFeedbackGood;
window.aiFeedbackBad = aiFeedbackBad;
window.aiFeedbackSelect = aiFeedbackSelect;
window._aiFeedbackCancel = _aiFeedbackCancel;

console.log('👍 [ai-feedback] v1.0.0 محمّل');
