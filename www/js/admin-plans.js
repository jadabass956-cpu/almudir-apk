// ============ 📦 إدارة الخطط ============
let _plansCache = [];

async function loadPlansAdmin() {
    const list = document.getElementById('plansAdminList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';
    try {
        const snap = await db.collection('subscription_plans').get();
        const arr = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => (a.order || 0) - (b.order || 0));
        _plansCache = arr;
        renderPlansAdmin();
    } catch(e) {
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + e.message + '</div>';
    }
}

function renderPlansAdmin() {
    const list = document.getElementById('plansAdminList');
    if (!list) return;
    if (!_plansCache.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا توجد خطط</div>';
        return;
    }
    let html = '';
    _plansCache.forEach(p => {
        const active = p.isActive !== false;
        const c = active ? '#27ae60' : '#e74c3c';
        const lbl = active ? '✅ مُفعّل' : '⛔ معطّل';
        const price = p.price + ' ' + (p.currency || 'USD');
        const days = p.durationDays ? (p.durationDays + ' يوم') : (p.durationText || '-');
        html += '<div style="background:#fff; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ' + c + ';">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-weight:bold; color:#2c3e50; font-size:15px;">' + (p.icon || '💎') + ' ' + _plansEsc(p.name) + '</div>' +
                    '<div style="font-size:14px; color:#e67e22; font-weight:bold; margin-top:3px;">💰 ' + price + '</div>' +
                    '<div style="font-size:11px; color:#777;">📅 ' + _plansEsc(days) + (p.isPopular ? ' • ⭐ الأكثر طلباً' : '') + '</div>' +
                '</div>' +
                '<span style="background:' + c + '; color:white; padding:3px 10px; border-radius:20px; font-size:11px; white-space:nowrap;">' + lbl + '</span>' +
            '</div>' +
            '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                '<button onclick="openPlanEditor(\'' + p.id + '\')" style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">✏️ تعديل</button>' +
                '<button onclick="togglePlan(\'' + p.id + '\')" style="flex:1; padding:8px; background:' + (active ? '#e67e22' : '#27ae60') + '; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">' + (active ? '⛔ تعطيل' : '✅ تفعيل') + '</button>' +
                '<button onclick="deletePlan(\'' + p.id + '\')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">🗑️</button>' +
            '</div>' +
        '</div>';
    });
    list.innerHTML = html;
}

function openPlanEditor(id) {
    const p = id ? _plansCache.find(x => x.id === id) : null;
    document.getElementById('plansModalTitle').textContent = p ? '✏️ تعديل الخطة' : '➕ إضافة خطة';
    document.getElementById('planId').value = p ? p.id : '';
    document.getElementById('planIcon').value = p ? (p.icon || '💎') : '💎';
    document.getElementById('planName').value = p ? (p.name || '') : '';
    document.getElementById('planPrice').value = p ? (p.price || 0) : 3;
    document.getElementById('planCurrency').value = p ? (p.currency || 'USD') : 'USD';
    document.getElementById('planDurationDays').value = p ? (p.durationDays || 30) : 30;
    document.getElementById('planDurationText').value = p ? (p.durationText || '') : '';
    document.getElementById('planFeatures').value = p ? (p.features || []).join('\n') : '';
    document.getElementById('planOrder').value = p ? (p.order || 0) : (_plansCache.length + 1);
    document.getElementById('planActive').checked = p ? (p.isActive !== false) : true;
    document.getElementById('planPopular').checked = p ? !!p.isPopular : false;
    document.getElementById('plansEditorModal').classList.add('show');
}

function closePlanEditor() { document.getElementById('plansEditorModal').classList.remove('show'); }

async function savePlan() {
    const id = document.getElementById('planId').value;
    const fRaw = document.getElementById('planFeatures').value.trim();
    const data = {
        icon: document.getElementById('planIcon').value.trim() || '💎',
        name: document.getElementById('planName').value.trim(),
        price: parseFloat(document.getElementById('planPrice').value) || 0,
        currency: document.getElementById('planCurrency').value.trim() || 'USD',
        durationDays: parseInt(document.getElementById('planDurationDays').value) || 30,
        durationText: document.getElementById('planDurationText').value.trim(),
        features: fRaw ? fRaw.split('\n').map(s => s.trim()).filter(Boolean) : [],
        order: parseInt(document.getElementById('planOrder').value) || 0,
        isActive: document.getElementById('planActive').checked,
        isPopular: document.getElementById('planPopular').checked
    };
    if (!data.name) return alert('⚠️ الاسم مطلوب');
    if (data.price <= 0) return alert('⚠️ السعر يجب > 0');
    try {
        if (id) {
            await db.collection('subscription_plans').doc(id).update(data);
            _adminToastPlans('✅ تم التعديل', 'success');
        } else {
            await db.collection('subscription_plans').add(data);
            _adminToastPlans('✅ تمت الإضافة', 'success');
        }
        closePlanEditor();
        loadPlansAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

async function deletePlan(id) {
    if (!confirm('⚠️ حذف نهائي؟\n(المشتركون الحاليون لا يتأثرون)')) return;
    try {
        await db.collection('subscription_plans').doc(id).delete();
        _adminToastPlans('🗑️ تم الحذف', 'success');
        loadPlansAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

async function togglePlan(id) {
    const p = _plansCache.find(x => x.id === id);
    if (!p) return;
    try {
        await db.collection('subscription_plans').doc(id).update({ isActive: p.isActive === false });
        loadPlansAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

function _plansEsc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Helper: Toast آمن
function _adminToastPlans(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window._adminToastPlans(msg, type); return; }
        if (typeof showToast === 'function') { _adminToastPlans(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    const bg = type === 'success' ? '#27ae60' : (type === 'warning' ? '#f39c12' : '#e74c3c');
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' + bg + '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-family:inherit; font-size:14px; max-width:85vw; text-align:center;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

console.log('📦 [admin-plans] جاهز');
