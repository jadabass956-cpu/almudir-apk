// ============================================================
//  🏭 SUPPLIERS — إدارة الموردين
// ============================================================

let _supCache = [];

// ---------- تحميل ----------
async function loadSuppliers() {
    const list = document.getElementById('supList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('users').doc(_getEffectiveUid())
            .collection('suppliers').get();
        _supCache = [];
        snap.forEach(d => _supCache.push({ id: d.id, ...d.data() }));
        _supCache.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

        _supRender();
        _supUpdateStats();
    } catch(e) {
        console.error('[sup]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _supEsc(e.message) + '</div>';
    }
}

function _supRender() {
    const list = document.getElementById('supList');
    if (!list) return;

    if (!_supCache.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا يوجد موردون — أضف أول مورد</div>';
        return;
    }

    let html = '';
    _supCache.forEach(s => {
        const bal = parseFloat(s.balance) || 0;
        const balColor = bal > 0 ? '#e74c3c' : (bal < 0 ? '#27ae60' : '#95a5a6');
        const balText = bal > 0 ? `🔴 علينا له: ${_supFmt(bal)}` : (bal < 0 ? `🟢 لنا عنده: ${_supFmt(Math.abs(bal))}` : '⚪ لا ديون');
        const balIcon = '';

        html += `
        <div style="background:white; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ${balColor};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:15px;">🏭 ${_supEsc(s.name || '-')}</div>
                    ${s.phone ? `<div style="font-size:12px; color:#888; direction:ltr; text-align:right; margin-top:3px;">📞 ${_supEsc(s.phone)}</div>` : ''}
                    <div style="font-size:13px; color:${balColor}; font-weight:bold; margin-top:6px;">${balIcon} ${balText}</div>
                    ${s.notes ? `<div style="font-size:11px; color:#999; margin-top:4px;">${_supEsc(s.notes)}</div>` : ''}
                </div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="openPurchaseFromSupplier('${s.id}')" style="flex:1; min-width:90px; padding:8px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">🛒 شراء</button>
                <button onclick="openSupplierPayment('${s.id}')" style="flex:1; min-width:90px; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">💳 دفعة</button>
                <button onclick="openSupplierDetails('${s.id}')" style="padding:8px 12px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer;">👁️</button>
                <button onclick="openSupEditor('${s.id}')" style="padding:8px 12px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer;">✏️</button>
                <button onclick="supDelete('${s.id}')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">🗑️</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function _supUpdateStats() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const totalDebt = _supCache.reduce((sum, s) => {
        const b = parseFloat(s.balance) || 0;
        return sum + (b > 0 ? b : 0);
    }, 0);
    set('supCount', _supCache.length);
    set('supDebt', _supFmt(totalDebt));
    // 🆕 المعرّفات الجديدة في صفحة المشتريات
    set('supCount2', _supCache.length);
    set('supDebt2', _supFmt(totalDebt));
}

// ---------- محرر ----------
function openSupEditor(id) {
    const s = id ? _supCache.find(x => x.id === id) : null;

    document.getElementById('supModalTitle').textContent = s ? '✏️ تعديل مورد' : '➕ إضافة مورد';
    document.getElementById('supId').value = s ? s.id : '';
    document.getElementById('supName').value = s ? (s.name || '') : '';
    document.getElementById('supPhone').value = s ? (s.phone || '') : '';
    document.getElementById('supNotes').value = s ? (s.notes || '') : '';

    // 🎯 نوع الرصيد (موجب = علينا له)
    const bal = s ? (parseFloat(s.balance) || 0) : 0;
    let balType = 'none';
    let balAmount = 0;
    if (bal > 0) { balType = 'debit'; balAmount = bal; }
    else if (bal < 0) { balType = 'credit'; balAmount = Math.abs(bal); }

    document.querySelectorAll('input[name="supBalType"]').forEach(r => {
        r.checked = r.value === balType;
    });
    document.getElementById('supBalance').value = balAmount;

    document.getElementById('supEditorModal').classList.add('show');
}

function closeSupEditor() {
    document.getElementById('supEditorModal').classList.remove('show');
}

async function saveSup() {
    const id = document.getElementById('supId').value;
    const name = document.getElementById('supName').value.trim();
    if (!name) return alert('⚠️ أدخل اسم المورد');

    // 🎯 قراءة نوع الرصيد
    const balTypeEl = document.querySelector('input[name="supBalType"]:checked');
    const balType = balTypeEl ? balTypeEl.value : 'none';
    const balAmount = parseFloat(document.getElementById('supBalance').value) || 0;

    // 🎯 للمورد: موجب = علينا له
    let finalBalance = 0;
    if (balType === 'debit') finalBalance = Math.abs(balAmount);       // علينا له (+)
    else if (balType === 'credit') finalBalance = -Math.abs(balAmount); // لنا عنده (-)

    const data = {
        name: name,
        phone: document.getElementById('supPhone').value.trim(),
        notes: document.getElementById('supNotes').value.trim(),
        balance: finalBalance,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const ref = db.collection('users').doc(_getEffectiveUid()).collection('suppliers');
        if (id) {
            await ref.doc(id).update(data);
            _supToast('✅ تم التعديل', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await ref.add(data);
            _supToast('✅ تمت الإضافة', 'success');
        }
        closeSupEditor();
        loadSuppliers();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

async function supDelete(id) {
    const s = _supCache.find(x => x.id === id);
    if (!s) return;

    const bal = parseFloat(s.balance) || 0;
    let msg = `🗑️ حذف "${s.name}"؟`;
    if (bal !== 0) {
        msg += `\n\n⚠️ الرصيد: ${_supFmt(Math.abs(bal))} ل.س`;
    }
    if (!confirm(msg)) return;

    try {
        await db.collection('users').doc(_getEffectiveUid()).collection('suppliers').doc(id).delete();
        _supToast('🗑️ تم الحذف', 'success');
        loadSuppliers();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

// ---------- ملء قائمة الموردين في نوافذ أخرى ----------
function populateSupplierSelect(selectedId) {
    const sel = document.getElementById('purchaseSupplier');
    if (!sel) return;
    let html = '<option value="">— اختر المورد —</option>';
    _supCache.forEach(s => {
        const sel_attr = s.id === selectedId ? ' selected' : '';
        html += `<option value="${s.id}"${sel_attr}>🏭 ${_supEsc(s.name)}</option>`;
    });
    sel.innerHTML = html;
}

// ---------- تحديث رصيد مورد ----------
async function supAdjustBalance(supplierId, amount, operation) {
    // operation: 'add' (زيادة دين) | 'subtract' (تخفيض دين)
    if (!supplierId) return;
    try {
        const ref = db.collection('users').doc(_getEffectiveUid())
            .collection('suppliers').doc(supplierId);
        const doc = await ref.get();
        if (!doc.exists) return;

        const current = parseFloat(doc.data().balance) || 0;
        const newBalance = operation === 'subtract' ? current - amount : current + amount;

        await ref.update({
            balance: newBalance,
            lastTransaction: firebase.firestore.FieldValue.serverTimestamp()
        });

        // تحديث cache
        const _cs = _supCache.find(x => x.id === supplierId);
        if (_cs) _cs.balance = newBalance;

        console.log('🏭 [sup] رصيد المورد:', supplierId, '→', newBalance);
    } catch(e) {
        console.warn('[sup] adjust:', e.message);
    }
}

// ---------- أدوات ----------
function _supFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _supEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function _supToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        if (typeof showToast === 'function') { showToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' +
        (type === 'success' ? '#27ae60' : '#e74c3c') +
        '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px; max-width:85vw; text-align:center;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

// ---------- فتح الصفحة ----------
function openSuppliersPage() {
    // ✅ اذهب لصفحة المشتريات + تبويب الموردين
    if (typeof openPage === 'function') openPage('purchases');
    setTimeout(() => {
        if (typeof switchPurchaseTab === 'function') {
            switchPurchaseTab('suppliers');
        } else {
            loadSuppliers();
        }
    }, 200);
}

// ---------- تحميل عند البدء ----------
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) setTimeout(loadSuppliers, 1500);
    });
}

console.log('🏭 [suppliers] جاهز');

// ============================================================
//  💳 SUPPLIER PAYMENTS — دفعات الموردين
// ============================================================

function openSupplierPayment(supplierId) {
    const s = _supCache.find(x => x.id === supplierId);
    if (!s) return alert('⚠️ المورد غير موجود');

    document.getElementById('supPaySupplierId').value = supplierId;
    document.getElementById('supPaySupplierName').textContent = s.name || '-';
    document.getElementById('supPayCurrentDebt').textContent = _supFmt(s.balance || 0) + ' ل.س';

    // التاريخ اليوم
    document.getElementById('supPayDate').value = new Date().toISOString().slice(0, 10);

    // المبلغ الافتراضي = الدين
    const debt = parseFloat(s.balance) || 0;
    document.getElementById('supPayAmount').value = debt > 0 ? debt : 0;

    // الصندوق
    _supPopulateBoxes();
    document.getElementById('supPayNotes').value = '';

    document.getElementById('supPaymentModal').classList.add('show');
}

function closeSupPayment() {
    document.getElementById('supPaymentModal').classList.remove('show');
}

function _supPopulateBoxes() {
    const sel = document.getElementById('supPayBox');
    if (!sel) return;

    let html = '<option value="">— اختر صندوق —</option>';
    (typeof _pbCache !== 'undefined' ? _pbCache : []).forEach(b => {
        html += `<option value="${b.id}">${b.icon || '💰'} ${_supEsc(b.name)} (${_supFmt(b.balance || 0)})</option>`;
    });
    sel.innerHTML = html;
}

async function saveSupPayment() {
    const supplierId = document.getElementById('supPaySupplierId').value;
    const amount = parseFloat(document.getElementById('supPayAmount').value) || 0;
    const boxId = document.getElementById('supPayBox').value;
    const date = document.getElementById('supPayDate').value;
    const notes = document.getElementById('supPayNotes').value.trim();

    if (!supplierId) return alert('⚠️ اختر المورد');
    if (amount <= 0) return alert('⚠️ أدخل مبلغاً صحيحاً');
    if (!date) return alert('⚠️ اختر التاريخ');

    const supplier = _supCache.find(x => x.id === supplierId);
    if (!supplier) return alert('⚠️ المورد غير موجود');

    const debt = parseFloat(supplier.balance) || 0;
    if (amount > debt) {
        if (!confirm(`⚠️ المبلغ أكبر من الدين!\n\nالدين الحالي: ${_supFmt(debt)} ل.س\nالمبلغ: ${_supFmt(amount)} ل.س\n\nهل أنت متأكد؟`)) return;
    }

    // 💳 فحص رصيد الصندوق (دفعة = إضافة للصندوق؟ لا — هذا دفع للمورد، ننقص من الصندوق؟)
    // ملاحظة: دفع مورد = المال يخرج من الصندوق ← ننقص
    if (boxId) {
        const _box = (_pbCache || []).find(b => b.id === boxId);
        if (!_box) return alert('⚠️ الصندوق غير موجود');
        const _bal = parseFloat(_box.balance) || 0;
        if (amount > _bal) {
            return alert(
                `🚫 الرصيد غير كافٍ!\n\n` +
                `💳 ${_box.name}\n` +
                `💰 المتاح: ${_supFmt(_bal)} ل.س\n` +
                `💵 المطلوب: ${_supFmt(amount)} ل.س\n` +
                `⏳ النقص: ${_supFmt(amount - _bal)} ل.س`
            );
        }
    }

    if (!confirm(`💳 تأكيد الدفعة؟\n\n🏭 ${supplier.name}\n💰 المبلغ: ${_supFmt(amount)} ل.س\n💳 الصندوق: ${boxId ? 'محدد' : 'بدون'}`)) return;

    try {
        const uid = _getEffectiveUid();

        // 1) سجّل الدفعة
        await db.collection('users').doc(uid).collection('supplier_payments').add({
            supplierId: supplierId,
            supplierName: supplier.name,
            amount: amount,
            boxId: boxId,
            date: date,
            notes: notes,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2) أنقص دين المورد
        await supAdjustBalance(supplierId, amount, 'subtract');

        // 3) أنقص من الصندوق (دفعة = خروج مال)
        if (boxId) {
            if (typeof pbAdjustBalance === 'function') {
                await pbAdjustBalance(boxId, amount, 'subtract', {
                    reason: 'supplier_payment',
                    reasonLabel: 'دفعة للمورد: ' + supplier.name,
                    relatedId: 'SP-' + Date.now()
                });
            }
        }

        // 4) Toast
        if (typeof showSuccessToast === 'function') {
            const _boxName = boxId && typeof _getBoxName === 'function' ? _getBoxName(boxId) : '';
            const _remaining = Math.max(0, debt - amount);
            const _details = [
                { icon: '🏭', label: 'المورد', value: supplier.name },
                { icon: '💰', label: 'المبلغ', value: _supFmt(amount) + ' ل.س' },
                { icon: '📊', label: 'الدين المتبقي', value: _supFmt(_remaining) + ' ل.س' }
            ];
            if (boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: 'تم تسجيل الدفعة بنجاح!',
                details: _details,
                duration: 7000
            });
        }

        closeSupPayment();
        loadSuppliers();

    } catch(e) {
        console.error('[sup] payment:', e);
        alert('❌ ' + e.message);
    }
}

console.log('💳 [supplier-payments] جاهز');
