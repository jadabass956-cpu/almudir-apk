// ============================================================
//  🗑️ EXPIRY ACTIONS — إتلاف/تجديد/إرجاع المواد المنتهية
// ============================================================

// ---------- فتح Modal الإجراءات ----------
function openExpiryActions(materialId) {
    const m = (typeof materials !== 'undefined') ? materials.find(x => x.id === materialId) : null;
    if (!m) { alert('⚠️ المادة غير موجودة'); return; }

    // املأ الحقول
    document.getElementById('eaMaterialId').value = materialId;
    document.getElementById('eaMaterialName').textContent = m.name || '-';
    document.getElementById('eaExpiryDate').textContent = m.expiryDate || '-';
    document.getElementById('eaStock').textContent = (m.stock || 0) + ' ' + (m.unit || '');
    document.getElementById('eaBatch').textContent = m.batchNumber || '-';
    document.getElementById('eaNewExpiry').value = '';
    document.getElementById('eaNewQty').value = m.stock || 0;
    document.getElementById('eaReason').value = '';
    document.getElementById('eaRenewSection').style.display = 'none';

    document.getElementById('expiryActionsModal').classList.add('show');
}

function closeExpiryActions() {
    document.getElementById('expiryActionsModal').classList.remove('show');
}

// ---------- اختيار الإجراء ----------
function eaChooseAction(action) {
    document.querySelectorAll('.ea-action-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.action === action);
    });

    document.getElementById('eaSelectedAction').value = action;

    // إظهار/إخفاء قسم التجديد
    const renewSec = document.getElementById('eaRenewSection');
    if (action === 'renew') {
        renewSec.style.display = 'block';
    } else {
        renewSec.style.display = 'none';
    }
}

// ---------- تنفيذ الإجراء ----------
async function eaExecute() {
    const materialId = parseInt(document.getElementById('eaMaterialId').value);
    const action = document.getElementById('eaSelectedAction').value;
    const reason = document.getElementById('eaReason').value.trim();

    if (!action) { alert('⚠️ اختر إجراءً'); return; }

    const m = materials.find(x => x.id === materialId);
    if (!m) { alert('⚠️ المادة غير موجودة'); return; }

    // 🅰️ إتلاف
    if (action === 'dispose') {
        if (!confirm(`🗑️ إتلاف ${m.stock} ${m.unit || ''} من "${m.name}"؟\n\nسيُسجَّل في السجل.`)) return;
        const _eaWhId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : '';
        const _eaQty = m.stock;
        await _eaLog(m, 'dispose', reason, { qty: _eaQty });
        if (typeof adjustStock === 'function') {
            try { adjustStock(m.id, _eaQty, 'subtract', _eaWhId, { reason: 'expiry_dispose' }); }
            catch(e) { m.stock = 0; }
        } else {
            m.stock = 0;
        }
        m.expiryDate = '';
        m.batchNumber = '';
        _eaToast('🗑️ تم الإتلاف بنجاح', 'success');
    }

    // 🔄 تجديد الدفعة
    else if (action === 'renew') {
        const newExpiry = document.getElementById('eaNewExpiry').value;
        const newQty = parseInt(document.getElementById('eaNewQty').value) || 0;

        if (!newExpiry) { alert('⚠️ أدخل تاريخ الصلاحية الجديد'); return; }
        if (newQty <= 0) { alert('⚠️ أدخل الكمية'); return; }

        if (!confirm(`🔄 تجديد "${m.name}"؟\n\nتاريخ جديد: ${newExpiry}\nالكمية: ${newQty}`)) return;

        await _eaLog(m, 'renew', reason, {
            qty: m.stock,
            oldExpiry: m.expiryDate,
            newExpiry: newExpiry,
            newQty: newQty
        });

        const _eaWhId2 = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : '';
        m.expiryDate = newExpiry;
        if (typeof adjustStock === 'function') {
            try { adjustStock(m.id, newQty, 'set', _eaWhId2, { reason: 'expiry_renew' }); }
            catch(e) { m.stock = newQty; }
        } else {
            m.stock = newQty;
        }
        m.batchNumber = (m.batchNumber || '') + ' → تجديد ' + new Date().toISOString().slice(0, 10);
        _eaToast('🔄 تم التجديد بنجاح', 'success');
    }

    // 📤 إرجاع للمورد
    else if (action === 'return') {
        if (!confirm(`📤 إرجاع ${m.stock} ${m.unit || ''} من "${m.name}" للمورد؟`)) return;
        const _eaWhId3 = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : '';
        const _eaQty3 = m.stock;
        await _eaLog(m, 'return', reason, { qty: _eaQty3 });
        if (typeof adjustStock === 'function') {
            try { adjustStock(m.id, _eaQty3, 'subtract', _eaWhId3, { reason: 'expiry_return' }); }
            catch(e) { m.stock = 0; }
        } else {
            m.stock = 0;
        }
        _eaToast('📤 تم تسجيل الإرجاع', 'success');
    }

    // حفظ + تحديث
    if (typeof saveAllData === 'function') await saveAllData();
    if (typeof updateMaterialsTable === 'function') updateMaterialsTable();

    closeExpiryActions();
}

// ---------- تسجيل في Firestore ----------
async function _eaLog(material, action, reason, extra) {
    try {
        const data = {
            uid: auth.currentUser.uid,
            userName: currentUser?.fullName || '',
            businessName: currentUser?.businessName || '',
            materialId: material.id,
            materialName: material.name,
            oldExpiry: material.expiryDate || '',
            batch: material.batchNumber || '',
            action: action,
            reason: reason || '',
            performedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        Object.assign(data, extra || {});

        await db.collection('expiry_disposals').add(data);
        console.log('✅ [expiry] سُجّل:', action);
    } catch(e) {
        console.warn('[expiry] log failed:', e.message);
    }
}

// ---------- Toast ----------
function _eaToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        if (typeof showToast === 'function') { showToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' +
        (type === 'success' ? '#27ae60' : '#e74c3c') +
        '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

console.log('🗑️ [expiry-actions] جاهز');
