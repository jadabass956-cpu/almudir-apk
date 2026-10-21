// ============================================================
//  ↩️ PURCHASE RETURNS — مرتجع مشتريات
// ============================================================

let _purRetCurrentPurchase = null;
let _purRetItems = [];

// ---------- فتح Modal المرتجع ----------
function openPurchaseReturn(purchaseId) {
    // ابحث عن الفاتورة
    const purchase = _purRetFindPurchase(purchaseId);
    if (!purchase) return alert('⚠️ الفاتورة غير موجودة');

    _purRetCurrentPurchase = purchase;
    _purRetItems = [];

    // املأ الرأس
    document.getElementById('purRetInvoice').textContent = purchase.invoice || '-';
    document.getElementById('purRetSupplier').textContent = purchase.supplierName || '-';
    document.getElementById('purRetTotal').textContent = (purchase.total || 0) + ' ل.س';

    // عرض المواد
    _purRetRenderItems();

    // تصفير
    document.getElementById('purRetNote').value = '';

    // تعبئة الصناديق
    _purRetPopulateBoxes();

    document.getElementById('purchaseReturnModal').classList.add('show');
}

// ---------- 📦 تعبئة قائمة المستودعات ----------
function _purRetPopulateWarehouse() {
    const wrap = document.getElementById('purRetWarehouseWrap');
    const sel = document.getElementById('purRetWarehouse');
    if (!wrap || !sel) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    if (list.length <= 1) {
        wrap.style.display = 'none';
        const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : (list[0]?.id || '');
        sel.innerHTML = `<option value="${defId}">${list[0]?.name || 'افتراضي'}</option>`;
        return;
    }

    // افتراضي: مستودع الشراء الأصلي
    let defaultWhId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : list[0].id;
    if (_purRetCurrentPurchase && _purRetCurrentPurchase.warehouseId) {
        defaultWhId = _purRetCurrentPurchase.warehouseId;
    }

    wrap.style.display = 'block';
    let html = '';
    list.forEach(w => {
        const isSel = w.id === defaultWhId;
        html += `<option value="${w.id}" ${isSel ? 'selected' : ''}>🏠 ${w.name}${w.isDefault ? ' ⭐' : ''}</option>`;
    });
    sel.innerHTML = html;
    console.log(`📦 [purRet-wh] عُبّئ ${list.length} مستودعات`);
}

function _purRetFindPurchase(id) {
    // ابحث في Firestore cache أو DOM
    // سنستخدم cache من loadPurchases
    if (window._purCache) {
        return window._purCache.find(p => p.id === id);
    }
    return null;
}

async function openPurchaseReturnAsync(purchaseId) {
    try {
        const doc = await db.collection('users').doc(_getEffectiveUid())
            .collection('purchases').doc(purchaseId).get();
        if (!doc.exists) return alert('⚠️ الفاتورة غير موجودة');
        
        const purchase = { id: doc.id, ...doc.data() };
        _purRetCurrentPurchase = purchase;
        _purRetItems = [];

        document.getElementById('purRetInvoice').textContent = purchase.invoice || '-';
        document.getElementById('purRetSupplier').textContent = purchase.supplierName || '-';
        document.getElementById('purRetTotal').textContent = (purchase.total || 0) + ' ل.س';

        _purRetRenderItems();
        document.getElementById('purRetNote').value = '';
        _purRetPopulateBoxes();

        document.getElementById('purchaseReturnModal').classList.add('show');
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

function closePurchaseReturn() {
    document.getElementById('purchaseReturnModal').classList.remove('show');
    _purRetCurrentPurchase = null;
    _purRetItems = [];
}

// ---------- عرض المواد ----------
function _purRetRenderItems() {
    const s = _purRetCurrentPurchase;
    if (!s) return;

    const container = document.getElementById('purRetItemsList');
    if (!container) return;

    let html = '';
    (s.items || []).forEach((it, idx) => {
        const unitPrice = parseFloat(it.unitPrice) || 0;
        const maxQty = parseFloat(it.qty) || 0;
        const existing = _purRetItems.find(r => r.materialId === it.materialId);
        const checked = existing ? 'checked' : '';
        const qtyVal = existing ? existing.qty : maxQty;

        html += `
        <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; border:2px solid ${existing ? '#e67e22' : '#e0e0e0'};">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <input type="checkbox" id="purRetItem_${idx}" ${checked} onchange="togglePurRetItem(${idx})" style="width:20px; height:20px;">
                <label for="purRetItem_${idx}" style="flex:1; font-weight:bold; color:#2c3e50; font-size:14px; cursor:pointer;">
                    📦 ${_purRetEsc(it.materialName)}
                </label>
                <div style="font-size:13px; color:#666;">${unitPrice} ل.س</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding-right:30px;">
                <label style="font-size:12px; color:#666;">الكمية المُرجَعة:</label>
                <input type="number" id="purRetQty_${idx}" value="${qtyVal}" min="1" max="${maxQty}" 
                       oninput="updatePurRetQty(${idx})" 
                       style="width:80px; padding:6px; border:1px solid #ddd; border-radius:6px; text-align:center;" 
                       ${existing ? '' : 'disabled'}>
                <span style="font-size:11px; color:#999;">من ${maxQty}</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    _purRetCalcTotal();
}

function togglePurRetItem(idx) {
    const s = _purRetCurrentPurchase;
    const it = s.items[idx];
    const cb = document.getElementById('purRetItem_' + idx);
    const qtyInput = document.getElementById('purRetQty_' + idx);

    if (cb.checked) {
        qtyInput.disabled = false;
        const existing = _purRetItems.find(r => r.materialId === it.materialId);
        if (!existing) {
            _purRetItems.push({
                materialId: it.materialId,
                materialName: it.materialName,
                unit: it.unit || '',
                qty: parseFloat(qtyInput.value) || parseFloat(it.qty) || 0,
                unitPrice: parseFloat(it.unitPrice) || 0
            });
        }
    } else {
        qtyInput.disabled = true;
        _purRetItems = _purRetItems.filter(r => r.materialId !== it.materialId);
    }

    _purRetRenderItems();
}

function updatePurRetQty(idx) {
    const s = _purRetCurrentPurchase;
    const it = s.items[idx];
    const qtyInput = document.getElementById('purRetQty_' + idx);
    const newQty = parseFloat(qtyInput.value) || 0;

    const rec = _purRetItems.find(r => r.materialId === it.materialId);
    if (rec) rec.qty = newQty;

    _purRetCalcTotal();
}

function _purRetCalcTotal() {
    let total = 0;
    _purRetItems.forEach(r => {
        total += r.qty * r.unitPrice;
    });

    document.getElementById('purRetAmount').textContent = _purRetFmt(total) + ' ل.س';
}

// ---------- الصناديق ----------
function _purRetPopulateBoxes() {
    const sel = document.getElementById('purRetBox');
    if (!sel) return;

    let html = '<option value="">— اختر صندوق —</option>';
    (typeof _pbCache !== 'undefined' ? _pbCache : []).forEach(b => {
        html += `<option value="${b.id}">${b.icon || '💰'} ${_purRetEsc(b.name)}</option>`;
    });
    sel.innerHTML = html;
}

function _purRetChangeMethod() {
    const method = document.querySelector('input[name="purRetMethod"]:checked')?.value || 'cash';
    const boxWrap = document.getElementById('purRetBoxWrap');
    if (boxWrap) {
        boxWrap.style.display = (method === 'cash') ? 'block' : 'none';
    }
}

// ---------- حفظ المرتجع ----------
async function savePurchaseReturn() {
    const s = _purRetCurrentPurchase;
    if (!s) return alert('⚠️ الفاتورة غير موجودة');
    if (_purRetItems.length === 0) return alert('⚠️ اختر مادة واحدة على الأقل');

    // 🎯 الطريقة
    let method = 'cash';
    if (document.getElementById('purRetDebtOption')?.checked) method = 'debt';
    else if (document.getElementById('purRetCreditOption')?.checked) method = 'credit';

    // 🎯 الصندوق (إن نقدي)
    let boxId = '';
    if (method === 'cash') {
        boxId = document.getElementById('purRetBox')?.value || '';
        if (!boxId) return alert('⚠️ اختر صندوق لاسترجاع المبلغ');
    }

    const note = document.getElementById('purRetNote').value.trim();

    const totalRefund = _purRetItems.reduce((sum, r) => sum + (r.qty * r.unitPrice), 0);

    if (!confirm(`↩️ تأكيد المرتجع؟\n\n📄 ${s.invoice}\n🏭 ${s.supplierName}\n💰 المبلغ: ${_purRetFmt(totalRefund)} ل.س`)) return;

    try {
        const uid = auth.currentUser.uid;

        // 1) افحص المخزون (لا نسمح بسالب)
        for (const r of _purRetItems) {
            const mat = materials.find(m => m.id === r.materialId);
            if (!mat) continue;
            if ((mat.stock || 0) < r.qty) {
                alert(`🚫 لا يمكن إرجاع ${r.qty} ${r.unit} من "${mat.name}"\n\nالمخزون الحالي: ${mat.stock}\nالسبب: قد يكون تم بيع بعضها`);
                return;
            }
        }

        // 2) نقص المخزون (من مستودع الفاتورة الأصلية)
        const _purRetWhId = document.getElementById('purRetWarehouse')?.value 
            || s.warehouseId 
            || (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : '');
        _purRetItems.forEach(r => {
            const mat = materials.find(m => m.id === r.materialId);
            if (!mat) return;
            if (typeof adjustStock === 'function') {
                try {
                    adjustStock(mat.id, r.qty, 'subtract', _purRetWhId, {
                        reason: 'purchase_return',
                        reasonLabel: 'مرتجع شراء: ' + s.invoice
                    });
                } catch(e) {
                    console.warn('[pr] adjustStock:', e.message);
                    mat.stock -= r.qty;
                }
            } else {
                mat.stock -= r.qty;
            }
        });

        // 3) سجّل المرتجع
        const returnData = {
            purchaseInvoice: s.invoice,
            supplierId: s.supplierId || '',
            supplierName: s.supplierName || '',
            items: _purRetItems.map(r => ({ ...r })),
            total: totalRefund,
            method: method,
            boxId: boxId,
            note: note,
            date: new Date().toISOString().slice(0, 10),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(uid).collection('purchase_returns').add(returnData);

        // 4) عدّل رصيد الصندوق (إن نقدي - إضافة)
        if (method === 'cash' && boxId && totalRefund > 0) {
            await pbAdjustBalance(boxId, totalRefund, 'add', {
                reason: 'purchase_return',
                reasonLabel: '↩️ مرتجع مشتريات من: ' + (s.supplierName || ''),
                relatedId: s.invoice
            });
        }

        // 5) عدّل رصيد المورد (إن debt/credit)
        if ((method === 'debt' || method === 'credit') && s.supplierId) {
            if (method === 'debt') {
                // خصم من دين المورد (نحن ندين له أقل)
                if (typeof supAdjustBalance === 'function') {
                    await supAdjustBalance(s.supplierId, totalRefund, 'subtract');
                }
            } else {
                // رصيد دائن (لنا عنده)
                if (typeof supAdjustBalance === 'function') {
                    await supAdjustBalance(s.supplierId, totalRefund, 'add');
                }
            }
        }

        // 6) احفظ
        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
        if (typeof loadPurchases === 'function') loadPurchases();
        if (typeof loadSuppliers === 'function') loadSuppliers();

        // 7) Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const methodText = method === 'cash' ? '💵 استرجاع نقدي' : (method === 'debt' ? '🏭 خصم دين مورد' : '💼 رصيد دائن');
            const _boxName = boxId && typeof _getBoxName === 'function' ? _getBoxName(boxId) : '';
            const _details = [
                { icon: '📄', label: 'الفاتورة', value: s.invoice },
                { icon: '🏭', label: 'المورد', value: s.supplierName },
                { icon: '💰', label: 'المبلغ', value: _purRetFmt(totalRefund) + ' ل.س' },
                { icon: '📦', label: 'المواد', value: _purRetItems.length + ' مادة' },
                { icon: '💳', label: 'الطريقة', value: methodText }
            ];
            if (_boxName) _details.push({ icon: '💼', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: '↩️ تم المرتجع بنجاح!',
                details: _details,
                duration: 7000
            });
        }

        closePurchaseReturn();

    } catch(e) {
        console.error('[purRet]', e);
        alert('❌ ' + e.message);
    }
}

// ---------- أدوات ----------
function _purRetFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _purRetEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('↩️ [purchase-returns] جاهز');
