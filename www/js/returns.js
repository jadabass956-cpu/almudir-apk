// ============================================================
//  ↩️ RETURNS — إرجاع مبيعات
// ============================================================

let _retCurrentSaleIndex = null;
let _retItems = [];       // المواد المُرجَعة: [{ materialId, qty, unitPrice, costAtSale }]

// ---------- فتح Modal الإرجاع ----------
function openReturnForm(saleIndex) {
    const s = sales[saleIndex];
    if (!s) return alert('⚠️ الفاتورة غير موجودة');
    if (s.isRetail) return alert('⚠️ لا يمكن إرجاع البيع المفرق من هنا');

    _retCurrentSaleIndex = saleIndex;
    _retItems = [];

    // املأ الرأس
    document.getElementById('retInvoice').textContent = s.invoice || '-';
    document.getElementById('retCustomer').textContent = s.customer || '-';
    document.getElementById('retTotal').textContent = (s.total || 0) + ' ' + (s.currency === 'USD' ? '$' : 'ل.س');

    // عرض المواد
    _retRenderItems();

    // تصفير
    document.getElementById('retNote').value = '';
    document.getElementById('retCashOption').checked = true;

    // تعبئة الصناديق (للإرجاع النقدي)
    _retPopulateBoxes();

    document.getElementById('returnModal').classList.add('show');
}

function closeReturnForm() {
    document.getElementById('returnModal').classList.remove('show');
    _retCurrentSaleIndex = null;
    _retItems = [];
}

// ---------- عرض المواد ----------
function _retRenderItems() {
    const s = sales[_retCurrentSaleIndex];
    if (!s) return;

    const container = document.getElementById('retItemsList');
    if (!container) return;

    let html = '';
    (s.items || []).forEach((it, idx) => {
        const cur = s.currency === 'USD' ? '$' : 'ل.س';
        const unitPrice = parseFloat(it.unitPrice) || 0;
        const maxQty = parseFloat(it.qty) || 0;
        const existing = _retItems.find(r => r.materialId === it.materialId);
        const checked = existing ? 'checked' : '';
        const qtyVal = existing ? existing.qty : maxQty;

        html += `
        <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; border:2px solid ${existing ? '#e74c3c' : '#e0e0e0'};">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <input type="checkbox" id="retItem_${idx}" ${checked} onchange="toggleRetItem(${idx})" style="width:20px; height:20px;">
                <label for="retItem_${idx}" style="flex:1; font-weight:bold; color:#2c3e50; font-size:14px; cursor:pointer;">
                    📦 ${_retEsc(it.materialName)}
                </label>
                <div style="font-size:13px; color:#666;">${unitPrice} ${cur}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding-right:30px;">
                <label style="font-size:12px; color:#666;">الكمية المُرجَعة:</label>
                <input type="number" id="retQty_${idx}" value="${qtyVal}" min="1" max="${maxQty}" 
                       oninput="updateRetQty(${idx})" 
                       style="width:80px; padding:6px; border:1px solid #ddd; border-radius:6px; text-align:center;" 
                       ${existing ? '' : 'disabled'}>
                <span style="font-size:11px; color:#999;">من ${maxQty}</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    _retCalcTotal();
}

function toggleRetItem(idx) {
    const s = sales[_retCurrentSaleIndex];
    const it = s.items[idx];
    const cb = document.getElementById('retItem_' + idx);
    const qtyInput = document.getElementById('retQty_' + idx);

    if (cb.checked) {
        qtyInput.disabled = false;
        const existing = _retItems.find(r => r.materialId === it.materialId);
        if (!existing) {
            _retItems.push({
                materialId: it.materialId,
                materialName: it.materialName,
                unit: it.unit || '',
                qty: parseFloat(qtyInput.value) || parseFloat(it.qty) || 0,
                unitPrice: parseFloat(it.unitPrice) || 0,
                costAtSale: parseFloat(it.costAtSale) || 0
            });
        }
    } else {
        qtyInput.disabled = true;
        _retItems = _retItems.filter(r => r.materialId !== it.materialId);
    }

    _retRenderItems();
}

function updateRetQty(idx) {
    const s = sales[_retCurrentSaleIndex];
    const it = s.items[idx];
    const qtyInput = document.getElementById('retQty_' + idx);
    const newQty = parseFloat(qtyInput.value) || 0;

    const rec = _retItems.find(r => r.materialId === it.materialId);
    if (rec) rec.qty = newQty;

    _retCalcTotal();
}

function _retCalcTotal() {
    let total = 0;
    _retItems.forEach(r => {
        total += r.qty * r.unitPrice;
    });

    const s = sales[_retCurrentSaleIndex];
    const cur = s.currency === 'USD' ? '$' : 'ل.س';

    document.getElementById('retAmount').textContent = _retFmt(total) + ' ' + cur;

    // ابحث عن دين هذه الفاتورة
    const remaining = parseFloat(s.remaining) || 0;
    const debtInfo = document.getElementById('retDebtInfo');
    if (debtInfo) {
        if (remaining > 0) {
            debtInfo.textContent = `⚠️ على هذه الفاتورة دين: ${_retFmt(remaining)} ${cur}`;
            debtInfo.style.display = 'block';
        } else {
            debtInfo.style.display = 'none';
        }
    }
}

// ---------- الصناديق ----------
function _retPopulateBoxes() {
    const sel = document.getElementById('retBox');
    if (!sel) return;

    let html = '<option value="">— اختر صندوق —</option>';
    (typeof _pbCache !== 'undefined' ? _pbCache : []).forEach(b => {
        html += `<option value="${b.id}">${b.icon || '💰'} ${_retEsc(b.name)}</option>`;
    });
    sel.innerHTML = html;
}

// ---------- حفظ الإرجاع ----------
async function saveReturn() {
    const s = sales[_retCurrentSaleIndex];
    if (!s) return alert('⚠️ الفاتورة غير موجودة');
    if (_retItems.length === 0) return alert('⚠️ اختر مادة واحدة على الأقل');

    // 🎯 الطريقة
    let method = 'cash';
    if (document.getElementById('retDebtOption')?.checked) method = 'debt';
    else if (document.getElementById('retCreditOption')?.checked) method = 'credit';

    // 🎯 الصندوق (إن نقدي)
    let boxId = '';
    if (method === 'cash') {
        boxId = document.getElementById('retBox')?.value || '';
        if (!boxId) return alert('⚠️ اختر صندوق الإرجاع النقدي');
    }

    const note = document.getElementById('retNote').value.trim();
    const cur = s.currency === 'USD' ? '$' : 'ل.س';

    const totalRefund = _retItems.reduce((sum, r) => sum + (r.qty * r.unitPrice), 0);

    if (!confirm(`↩️ تأكيد الإرجاع؟\n\n📄 ${s.invoice}\n💰 المبلغ: ${_retFmt(totalRefund)} ${cur}\n📦 ${_retItems.length} مادة`)) return;

    try {
        const uid = auth.currentUser.uid;

        // 1) زد المخزون (في مستودع الفاتورة الأصلية)
        const _retWhId = document.getElementById('retWarehouse')?.value 
            || s.warehouseId 
            || (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : '');
        _retItems.forEach(r => {
            const mat = materials.find(m => m.id === r.materialId);
            if (!mat) return;
            if (typeof adjustStock === 'function') {
                try {
                    adjustStock(mat.id, r.qty, 'add', _retWhId, {
                        reason: 'sale_return',
                        reasonLabel: 'إرجاع فاتورة: ' + s.invoice
                    });
                } catch(e) {
                    console.warn('[ret] adjustStock:', e.message);
                    mat.stock = (mat.stock || 0) + r.qty;
                }
            } else {
                mat.stock = (mat.stock || 0) + r.qty;
            }
        });

        // 2) سجّل الإرجاع
        const returnData = {
            saleInvoice: s.invoice,
            saleIndex: _retCurrentSaleIndex,
            customer: s.customer || '',
            currency: s.currency || 'SYP',
            items: _retItems.map(r => ({ ...r })),
            total: totalRefund,
            method: method,
            boxId: boxId,
            note: note,
            date: new Date().toISOString().slice(0, 10),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(uid).collection('returns').add(returnData);

        // 3) تعديل رصيد الصندوق (إن نقدي)
        if (method === 'cash' && boxId && totalRefund > 0) {
            const _box = (_pbCache || []).find(b => b.id === boxId);
            if (_box) {
                const _bal = parseFloat(_box.balance) || 0;
                if (totalRefund > _bal) {
                    alert(`🚫 الرصيد غير كافٍ في "${_box.name}"!\n\nالمتاح: ${_retFmt(_bal)}\nالمطلوب: ${_retFmt(totalRefund)}`);
                    // تراجع: أعد المخزون (عكس العملية)
                    _retItems.forEach(r => {
                        const mat = materials.find(m => m.id === r.materialId);
                        if (!mat) return;
                        if (typeof adjustStock === 'function') {
                            try {
                                adjustStock(mat.id, r.qty, 'subtract', _retWhId, { reason: 'return_rollback' });
                            } catch(e) { mat.stock = (mat.stock || 0) - r.qty; }
                        } else {
                            mat.stock = (mat.stock || 0) - r.qty;
                        }
                    });
                    return;
                }
                await pbAdjustBalance(boxId, totalRefund, 'subtract', {
                    reason: 'return',
                    reasonLabel: '↩️ إرجاع فاتورة ' + s.invoice,
                    relatedId: s.invoice
                });
            }
        }

        // 4) تعديل رصيد العميل (إن debt/credit)
        if ((method === 'debt' || method === 'credit') && s.customer) {
            const cust = (typeof findCustomerByName === 'function') ? findCustomerByName(s.customer) : null;
            if (cust) {
                if (method === 'debt') {
                    // خصم من دين العميل
                    await custAdjustBalance(cust.id, totalRefund, 'subtract');
                } else {
                    // رصيد دائن (علينا له)
                    await custAdjustBalance(cust.id, totalRefund, 'add');
                }
            }
        }

        // 5) عدّل الدين المرتبط بالفاتورة
        if (method === 'debt' && (s.remaining || 0) > 0) {
            const debtIdx = debts.findIndex(d => 
                d.name === s.customer && 
                Math.abs(d.amount - (s.remaining || 0)) < 0.01
            );
            if (debtIdx >= 0) {
                debts[debtIdx].amount = Math.max(0, debts[debtIdx].amount - totalRefund);
            }
        }

        // 6) حدّث الفاتورة نفسها
        s.returnedAmount = (s.returnedAmount || 0) + totalRefund;
        s.returnedItems = s.returnedItems || [];
        _retItems.forEach(r => s.returnedItems.push({ ...r }));

        // 7) احفظ كل شيء
        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
        if (typeof updateSalesTable === 'function') updateSalesTable();
        if (typeof updateDebtsTable === 'function') updateDebtsTable();

        // 8) Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const _boxName = boxId && typeof _getBoxName === 'function' ? _getBoxName(boxId) : '';
            const methodText = method === 'cash' ? '💵 نقدي' : (method === 'debt' ? '👤 خصم دين' : '💰 رصيد دائن');
            const _details = [
                { icon: '📄', label: 'الفاتورة', value: s.invoice },
                { icon: '💰', label: 'المبلغ', value: _retFmt(totalRefund) + ' ' + cur },
                { icon: '📦', label: 'المواد', value: _retItems.length + ' مادة' },
                { icon: '💳', label: 'الطريقة', value: methodText }
            ];
            if (_boxName) _details.push({ icon: '💼', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: '↩️ تم الإرجاع بنجاح!',
                details: _details,
                duration: 7000
            });
        }

        closeReturnForm();

        // 9) حدّث صفحة تفاصيل الفاتورة إن كانت مفتوحة
        if (typeof renderInvoiceDetails === 'function' && _invDetCurrentIndex !== null) {
            setTimeout(() => renderInvoiceDetails(sales[_invDetCurrentIndex], _invDetCurrentIndex), 200);
        }

    } catch(e) {
        console.error('[return]', e);
        alert('❌ ' + e.message);
    }
}

// ---------- أدوات ----------
// ---------- 📦 تعبئة قائمة المستودعات ----------
function _retPopulateWarehouse() {
    const wrap = document.getElementById('retWarehouseWrap');
    const sel = document.getElementById('retWarehouse');
    if (!wrap || !sel) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    if (list.length <= 1) {
        wrap.style.display = 'none';
        const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : (list[0]?.id || '');
        sel.innerHTML = `<option value="${defId}">${list[0]?.name || 'افتراضي'}</option>`;
        return;
    }

    // افتراضي: مستودع الفاتورة الأصلية (إن وُجد)
    let defaultWhId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : list[0].id;
    if (_retCurrentSaleIndex !== null && _retCurrentSaleIndex !== undefined) {
        const sale = (typeof sales !== 'undefined' && sales[_retCurrentSaleIndex]) ? sales[_retCurrentSaleIndex] : null;
        if (sale && sale.warehouseId) defaultWhId = sale.warehouseId;
    }

    wrap.style.display = 'block';
    let html = '';
    list.forEach(w => {
        const isSel = w.id === defaultWhId;
        html += `<option value="${w.id}" ${isSel ? 'selected' : ''}>🏠 ${w.name}${w.isDefault ? ' ⭐' : ''}</option>`;
    });
    sel.innerHTML = html;
    console.log(`📦 [ret-wh] عُبّئ ${list.length} مستودعات`);
}

function _retFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _retEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- ربط زر الرجوع ----------
function _retChangeMethod() {
    const method = document.querySelector('input[name="retMethod"]:checked')?.value || 'cash';
    const boxWrap = document.getElementById('retBoxWrap');
    if (boxWrap) {
        boxWrap.style.display = (method === 'cash') ? 'block' : 'none';
    }
}

console.log('↩️ [returns] جاهز');
