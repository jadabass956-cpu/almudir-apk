// ============ 💳 إدارة طرق الدفع ============
let _pmCache = [];

async function loadPaymentMethodsAdmin() {
    const list = document.getElementById('pmAdminList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';
    try {
        const snap = await db.collection('payment_methods').get();
        const arr = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => (a.order || 0) - (b.order || 0));
        _pmCache = arr;
        renderPMAdmin();
    } catch(e) {
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + e.message + '</div>';
    }
}

function renderPMAdmin() {
    const list = document.getElementById('pmAdminList');
    if (!list) return;
    if (!_pmCache.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا توجد طرق دفع</div>';
        return;
    }
    let html = '';
    _pmCache.forEach(m => {
        const active = m.isActive !== false;
        const c = active ? '#27ae60' : '#e74c3c';
        const lbl = active ? '✅ مُفعّل' : '⛔ معطّل';
        html += '<div style="background:#fff; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ' + c + ';">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-weight:bold; color:#2c3e50; font-size:15px;">' + (m.icon || '💳') + ' ' + _pmEsc(m.name || '-') + '</div>' +
                    '<div style="font-size:12px; color:#777; direction:ltr; text-align:right; margin-top:3px;">' + _pmEsc(m.accountNumber || '-') + '</div>' +
                    '<div style="font-size:12px; color:#777;">👤 ' + _pmEsc(m.accountName || '-') + '</div>' +
                '</div>' +
                '<span style="background:' + c + '; color:white; padding:3px 10px; border-radius:20px; font-size:11px; white-space:nowrap;">' + lbl + '</span>' +
            '</div>' +
            '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
                '<button onclick="openPMEditor(\'' + m.id + '\')" style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">✏️ تعديل</button>' +
                '<button onclick="togglePM(\'' + m.id + '\')" style="flex:1; padding:8px; background:' + (active ? '#e67e22' : '#27ae60') + '; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">' + (active ? '⛔ تعطيل' : '✅ تفعيل') + '</button>' +
                '<button onclick="movePM(\'' + m.id + '\', -1)" style="padding:8px 12px; background:#95a5a6; color:white; border:none; border-radius:6px; cursor:pointer;">↑</button>' +
                '<button onclick="movePM(\'' + m.id + '\', 1)" style="padding:8px 12px; background:#95a5a6; color:white; border:none; border-radius:6px; cursor:pointer;">↓</button>' +
                '<button onclick="deletePM(\'' + m.id + '\')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">🗑️</button>' +
            '</div>' +
        '</div>';
    });
    list.innerHTML = html;
}

function openPMEditor(id) {
    const m = id ? _pmCache.find(x => x.id === id) : null;
    document.getElementById('pmModalTitle').textContent = m ? '✏️ تعديل طريقة الدفع' : '➕ إضافة طريقة دفع';
    document.getElementById('pmId').value = m ? m.id : '';
    document.getElementById('pmIcon').value = m ? (m.icon || '💳') : '💳';
    document.getElementById('pmName').value = m ? (m.name || '') : '';
    document.getElementById('pmAccount').value = m ? (m.accountNumber || '') : '';
    document.getElementById('pmAccountName').value = m ? (m.accountName || '') : '';
    document.getElementById('pmInstructions').value = m ? (m.instructions || '') : '';
    document.getElementById('pmOrder').value = m ? (m.order || 0) : (_pmCache.length + 1);
    document.getElementById('pmActive').checked = m ? (m.isActive !== false) : true;
    document.getElementById('pmEditorModal').classList.add('show');
}

function closePMEditor() { document.getElementById('pmEditorModal').classList.remove('show'); }

async function savePM() {
    const id = document.getElementById('pmId').value;
    const data = {
        icon: document.getElementById('pmIcon').value.trim() || '💳',
        name: document.getElementById('pmName').value.trim(),
        accountNumber: document.getElementById('pmAccount').value.trim(),
        accountName: document.getElementById('pmAccountName').value.trim(),
        instructions: document.getElementById('pmInstructions').value.trim(),
        order: parseInt(document.getElementById('pmOrder').value) || 0,
        isActive: document.getElementById('pmActive').checked
    };
    if (!data.name) return alert('⚠️ الاسم مطلوب');
    if (!data.accountNumber) return alert('⚠️ رقم الحساب مطلوب');
    try {
        if (id) {
            await db.collection('payment_methods').doc(id).update(data);
            _adminToast('✅ تم التعديل', 'success');
        } else {
            await db.collection('payment_methods').add(data);
            _adminToast('✅ تمت الإضافة', 'success');
        }
        closePMEditor();
        loadPaymentMethodsAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

async function deletePM(id) {
    if (!confirm('⚠️ حذف نهائي؟')) return;
    try {
        await db.collection('payment_methods').doc(id).delete();
        _adminToast('🗑️ تم الحذف', 'success');
        loadPaymentMethodsAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

async function togglePM(id) {
    const m = _pmCache.find(x => x.id === id);
    if (!m) return;
    try {
        await db.collection('payment_methods').doc(id).update({ isActive: m.isActive === false });
        loadPaymentMethodsAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

async function movePM(id, dir) {
    const idx = _pmCache.findIndex(x => x.id === id);
    const sw = idx + dir;
    if (sw < 0 || sw >= _pmCache.length) return;
    const a = _pmCache[idx], b = _pmCache[sw];
    try {
        await db.collection('payment_methods').doc(a.id).update({ order: b.order || sw });
        await db.collection('payment_methods').doc(b.id).update({ order: a.order || idx });
        loadPaymentMethodsAdmin();
    } catch(e) { alert('❌ ' + e.message); }
}

function _pmEsc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Helper: Toast آمن
function _adminToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window._adminToast(msg, type); return; }
        if (typeof showToast === 'function') { _adminToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    const bg = type === 'success' ? '#27ae60' : (type === 'warning' ? '#f39c12' : '#e74c3c');
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' + bg + '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-family:inherit; font-size:14px; max-width:85vw; text-align:center;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

console.log('💳 [admin-payment-methods] جاهز');
