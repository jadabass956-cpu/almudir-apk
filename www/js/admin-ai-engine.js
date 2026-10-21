// ============================================================
//  🧠 لوحة إدارة محرّك المعرفة (AI Engine)
//  إدارة الكلمات المفتاحية + قاعدة المعرفة
// ============================================================

let _aieKwCache = [];
let _aieKnCache = [];
let _aieFilter = 'all';

// قائمة الـ actions — ديناميكية من AI_INTENTS (23 نية)
const AIE_CAT_ICONS = {
    sales:'💰', profit:'📈', expense:'💸', debt:'💳',
    customer:'👥', material:'📦', stock:'🏪', cash:'💵',
    advice:'💡', predict:'🔮', alerts:'🚨'
};
const AIE_INTENT_LABELS = {
    sales_total:'إجمالي المبيعات', sales_retail:'مبيعات المفرق', sales_count:'عدد الفواتير',
    profit:'صافي الربح',
    expenses_summary:'ملخص المصروفات', expenses_top:'أكبر مصروف', expenses_recent:'آخر المصروفات',
    debts_customers:'ديون العملاء', debts_suppliers:'ديون الموردين',
    customer_top:'أفضل عميل',
    material_top:'أكثر مادة مبيعة', material_low:'المواد القليلة',
    stock_value:'قيمة المخزون',
    cash:'رصيد الصندوق',
    advice_profit:'نصائح الأرباح',
    predict_sales:'توقع المبيعات', predict_inventory:'توقع المخزون', predict_cash:'توقع السيولة',
    alerts_check:'التنبيهات'
};

function getAIEActions() {
    const out = [];
    if (typeof AI_INTENTS !== 'undefined' && Array.isArray(AI_INTENTS)) {
        AI_INTENTS.forEach(it => {
            if (it.cat === 'meta') return;
            if (it.needsClarify) return;
            const icon = AIE_CAT_ICONS[it.cat] || '•';
            const label = AIE_INTENT_LABELS[it.id] || it.id;
            out.push({ value: it.id, label: `${icon} ${label} — ${it.id}` });
        });
    }
    out.push({ value: 'custom', label: '✍️ custom — بدون بيانات (نص فقط)' });
    return out;
}

// ---------- تحميل ----------
async function loadAIEngineAdmin() {
    const list = document.getElementById('aieKeywordsList');
    const knList = document.getElementById('aieKnowledgeList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';
    if (knList) knList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">⏳ جاري التحميل...</div>';

    try {
        const [kwSnap, knSnap] = await Promise.all([
            db.collection('ai_keywords').get(),
            db.collection('ai_knowledge').get()
        ]);

        _aieKwCache = [];
        kwSnap.forEach(d => _aieKwCache.push({ id: d.id, ...d.data() }));
        _aieKwCache.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        _aieKnCache = [];
        knSnap.forEach(d => _aieKnCache.push({ id: d.id, ...d.data() }));
        _aieKnCache.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        _aieUpdateStats();
        _aieRenderKeywords();
        _aieRenderKnowledge();

    } catch(e) {
        console.error('[aie]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _aieEsc(e.message) + '</div>';
    }
}

function _aieUpdateStats() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('aieKwCount', _aieKwCache.length);
    set('aieKnCount', _aieKnCache.length);
}

// ---------- عرض الكلمات المفتاحية ----------
function _aieRenderKeywords() {
    const list = document.getElementById('aieKeywordsList');
    if (!list) return;

    let items = _aieKwCache;
    if (_aieFilter !== 'all') items = items.filter(k => k.type === _aieFilter);

    if (!items.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد كلمات مفتاحية</div>';
        return;
    }

    let html = '';
    items.forEach(k => {
        const typeBadge = _aieTypeBadge(k.type);
        const linked = k.linkedKnowledgeId
            ? _aieKnCache.find(x => x.id === k.linkedKnowledgeId)
            : null;
        const linkedText = linked ? '🔗 ' + _aieEsc(linked.title) : '';

        html += `
        <div style="background:#fff; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ${typeBadge.color};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px;">
                        🔑 ${_aieEsc((k.words || []).join('، '))}
                    </div>
                    <div style="font-size:11px; color:#777; margin-top:4px;">
                        ${typeBadge.label} • ⚙️ ${_aieEsc(k.action || '-')} • 🔢 ${k.priority || 99}
                    </div>
                    ${linkedText ? '<div style="font-size:11px; color:#3498db; margin-top:3px;">' + linkedText + '</div>' : ''}
                    ${k.followUp ? '<div style="font-size:11px; color:#888; margin-top:3px; font-style:italic;">💬 ' + _aieEsc(k.followUp.substring(0, 60)) + (k.followUp.length > 60 ? '...' : '') + '</div>' : ''}
                </div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="openAieKwEditor('${k.id}')" style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">✏️ تعديل</button>
                <button onclick="aieDeleteKeyword('${k.id}')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">🗑️</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

// ---------- عرض قاعدة المعرفة ----------
function _aieRenderKnowledge() {
    const list = document.getElementById('aieKnowledgeList');
    if (!list) return;

    if (!_aieKnCache.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد معرفة بعد</div>';
        return;
    }

    let html = '';
    _aieKnCache.forEach(k => {
        html += `
        <div style="background:#fff; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid #8e44ad;">
            <div style="font-weight:bold; color:#2c3e50; font-size:14px; margin-bottom:4px;">📚 ${_aieEsc(k.title || '-')}</div>
            <div style="font-size:11px; color:#777; margin-bottom:6px;">
                🏷️ ${_aieEsc(k.category || '-')} • 🔑 ${_aieEsc((k.keywords || []).join('، '))}
            </div>
            <div style="background:#f8f9fa; border-radius:6px; padding:8px; font-size:12px; color:#555; max-height:100px; overflow:hidden; white-space:pre-wrap; margin-bottom:8px;">
                ${_aieEsc((k.content || '').substring(0, 150))}${(k.content || '').length > 150 ? '...' : ''}
            </div>
            <div style="display:flex; gap:6px;">
                <button onclick="openAieKnEditor('${k.id}')" style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">✏️ تعديل</button>
                <button onclick="aieDeleteKnowledge('${k.id}')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">🗑️</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

// ---------- فلاتر ----------
function aieSetFilter(f) {
    _aieFilter = f;
    document.querySelectorAll('.aie-filter').forEach(b => {
        const active = b.dataset.filter === f;
        b.classList.toggle('active', active);
        b.style.background = active ? '#3498db' : '#ecf0f1';
        b.style.color = active ? 'white' : '#555';
    });
    _aieRenderKeywords();
}

function _aieTypeBadge(t) {
    if (t === 'data')  return { label: '📊 بيانات',  color: '#27ae60' };
    if (t === 'text')  return { label: '💡 نصية',    color: '#8e44ad' };
    if (t === 'mixed') return { label: '🎯 مختلط',   color: '#e67e22' };
    return { label: '❓ غير محدد', color: '#95a5a6' };
}

// ---------- محرر الكلمات ----------
function openAieKwEditor(id) {
    const k = id ? _aieKwCache.find(x => x.id === id) : null;
    document.getElementById('aieKwModalTitle').textContent = k ? '✏️ تعديل كلمة مفتاحية' : '➕ كلمة مفتاحية جديدة';
    document.getElementById('aieKwId').value = k ? k.id : '';
    document.getElementById('aieKwWords').value = k ? (k.words || []).join('\n') : '';
    document.getElementById('aieKwType').value = k ? (k.type || 'data') : 'data';
    _aiePopulateActionSelect(k ? k.action : '');
    document.getElementById('aieKwIntro').value = k ? (k.intro || '') : '';
    document.getElementById('aieKwFollowUp').value = k ? (k.followUp || '') : '';
    document.getElementById('aieKwPriority').value = k ? (k.priority || 1) : (_aieKwCache.length + 1);
    _aiePopulateKnowledgeSelect(k ? k.linkedKnowledgeId : '');
    document.getElementById('aieKwEditorModal').classList.add('show');
}

function closeAieKwEditor() { document.getElementById('aieKwEditorModal').classList.remove('show'); }

function _aiePopulateActionSelect(selected) {
    const sel = document.getElementById('aieKwAction');
    if (!sel) return;
    let html = '<option value="">— اختر الدالة —</option>';
    getAIEActions().forEach(a => {
        const sel_attr = (a.value === selected) ? ' selected' : '';
        html += `<option value="${a.value}"${sel_attr}>${a.label}</option>`;
    });
    sel.innerHTML = html;
}

function _aiePopulateKnowledgeSelect(selected) {
    const sel = document.getElementById('aieKwLinkedKnowledge');
    if (!sel) return;
    let html = '<option value="">— بدون ربط —</option>';
    _aieKnCache.forEach(k => {
        const sel_attr = (k.id === selected) ? ' selected' : '';
        html += `<option value="${k.id}"${sel_attr}>📚 ${_aieEsc(k.title || 'بدون عنوان')}</option>`;
    });
    sel.innerHTML = html;
}

async function saveAieKeyword() {
    const id = document.getElementById('aieKwId').value;
    const wordsRaw = document.getElementById('aieKwWords').value.trim();
    const words = wordsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    if (!words.length) return alert('⚠️ أدخل كلمة مفتاحية واحدة على الأقل');

    const action = document.getElementById('aieKwAction').value.trim();
    if (!action) return alert('⚠️ حدد دالة البيانات (action)');

    const data = {
        words: words,
        type: document.getElementById('aieKwType').value || 'data',
        action: action,
        intro: document.getElementById('aieKwIntro').value.trim(),
        followUp: document.getElementById('aieKwFollowUp').value.trim(),
        linkedKnowledgeId: document.getElementById('aieKwLinkedKnowledge').value || '',
        priority: parseInt(document.getElementById('aieKwPriority').value) || 1
    };

    try {
        if (id) {
            await db.collection('ai_keywords').doc(id).update(data);
            _aieToast('✅ تم التعديل', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('ai_keywords').add(data);
            _aieToast('✅ تمت الإضافة', 'success');
        }
        closeAieKwEditor();
        loadAIEngineAdmin();
        if (typeof aiEngineReload === 'function') aiEngineReload();
    } catch(e) { alert('❌ ' + e.message); }
}

async function aieDeleteKeyword(id) {
    if (!confirm('🗑️ حذف هذه الكلمة المفتاحية؟')) return;
    try {
        await db.collection('ai_keywords').doc(id).delete();
        _aieToast('🗑️ تم الحذف', 'success');
        loadAIEngineAdmin();
        if (typeof aiEngineReload === 'function') aiEngineReload();
    } catch(e) { alert('❌ ' + e.message); }
}

// ---------- محرر المعرفة ----------
function openAieKnEditor(id) {
    const k = id ? _aieKnCache.find(x => x.id === id) : null;
    document.getElementById('aieKnModalTitle').textContent = k ? '✏️ تعديل معرفة' : '➕ معرفة جديدة';
    document.getElementById('aieKnId').value = k ? k.id : '';
    document.getElementById('aieKnTitle').value = k ? (k.title || '') : '';
    document.getElementById('aieKnCategory').value = k ? (k.category || '') : '';
    document.getElementById('aieKnKeywords').value = k ? (k.keywords || []).join('\n') : '';
    document.getElementById('aieKnContent').value = k ? (k.content || '') : '';
    document.getElementById('aieKnPriority').value = k ? (k.priority || 1) : (_aieKnCache.length + 1);
    document.getElementById('aieKnEditorModal').classList.add('show');
}

function closeAieKnEditor() { document.getElementById('aieKnEditorModal').classList.remove('show'); }

async function saveAieKnowledge() {
    const id = document.getElementById('aieKnId').value;
    const title = document.getElementById('aieKnTitle').value.trim();
    if (!title) return alert('⚠️ أدخل عنوان المعرفة');

    const keywordsRaw = document.getElementById('aieKnKeywords').value.trim();
    const keywords = keywordsRaw.split('\n').map(s => s.trim()).filter(Boolean);

    const data = {
        title: title,
        category: document.getElementById('aieKnCategory').value.trim(),
        keywords: keywords,
        content: document.getElementById('aieKnContent').value.trim(),
        priority: parseInt(document.getElementById('aieKnPriority').value) || 1
    };

    try {
        if (id) {
            await db.collection('ai_knowledge').doc(id).update(data);
            _aieToast('✅ تم التعديل', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('ai_knowledge').add(data);
            _aieToast('✅ تمت الإضافة', 'success');
        }
        closeAieKnEditor();
        loadAIEngineAdmin();
        if (typeof aiEngineReload === 'function') aiEngineReload();
    } catch(e) { alert('❌ ' + e.message); }
}

async function aieDeleteKnowledge(id) {
    if (!confirm('🗑️ حذف هذه المعرفة؟')) return;
    try {
        await db.collection('ai_knowledge').doc(id).delete();
        _aieToast('🗑️ تم الحذف', 'success');
        loadAIEngineAdmin();
        if (typeof aiEngineReload === 'function') aiEngineReload();
    } catch(e) { alert('❌ ' + e.message); }
}

// ---------- أدوات ----------
function _aieToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        if (typeof showToast === 'function') { showToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    const bg = type === 'success' ? '#27ae60' : '#e74c3c';
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' + bg + '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

function _aieEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- فتح اللوحة ----------
function openAIEngineAdmin() {
    if (typeof openPage === 'function') openPage('ai-engine-admin');
    setTimeout(loadAIEngineAdmin, 200);
}

console.log('🧠 [admin-ai-engine] جاهز');
