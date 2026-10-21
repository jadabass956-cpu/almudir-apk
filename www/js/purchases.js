// ============================================================
//  🛒 PURCHASES — فواتير الشراء + دفعات الموردين
// ============================================================

let _purItems = [];        // مواد الفاتورة الحالية
let _purCache = [];

// ---------- فتح نموذج شراء جديد ----------
function openPurchaseForm(supplierId) {
    _purItems = [];

    // تعبئة قائمة الموردين
    if (typeof populateSupplierSelect === 'function') {
        setTimeout(() => populateSupplierSelect(supplierId || ''), 100);
    }

    // تعبئة قائمة المواد
    _purPopulateMaterials();

    // تعبئة الصناديق
    _purPopulateBoxes();
    // 📦 تعبئة المستودعات
    setTimeout(() => {
        if (typeof _purPopulateWarehouse === 'function') _purPopulateWarehouse();
    }, 200);

    // التاريخ اليوم
    const d = new Date();
    document.getElementById('purDate').value = d.toISOString().slice(0, 10);

    // تصفير الحقول
    document.getElementById('purInvoice').value = 'PUR-' + Date.now().toString().slice(-8);
    document.getElementById('purPaid').value = 0;
    document.getElementById('purNotes').value = '';

    // عرض
    _purRenderItems();

    // فتح Modal مباشرة (بلا تغيير الصفحة)
    setTimeout(() => {
        const modal = document.getElementById('purchaseFormModal');
        if (modal) modal.classList.add('show');
    }, 100);
}

function closePurchaseForm() {
    document.getElementById('purchaseFormModal').classList.remove('show');
    _purItems = [];
}

// ---------- ملء قائمة المواد ----------
function _purPopulateMaterials() {
    const sel = document.getElementById('purMaterial');
    if (!sel) return;

    let html = '<option value="">— اختر مادة —</option>';
    (typeof materials !== 'undefined' ? materials : []).forEach(m => {
        html += `<option value="${m.id}" data-name="${_purEsc(m.name)}" data-cost="${m.costSYP || 0}" data-unit="${_purEsc(m.unit || '')}" data-type="${_purEsc(m.type || '')}" data-barcode="${_purEsc(m.barcode || '')}">${_purEsc(m.name)} ${m.unit ? '(' + m.unit + ')' : ''}</option>`;
    });
    html += '<option value="__new__" style="color:#27ae60; font-weight:bold;">➕ إضافة مادة جديدة</option>';

    sel.innerHTML = html;
}

// ---------- ملء قائمة الصناديق ----------
function _purPopulateWarehouse() {
    const wrap = document.getElementById('purWarehouseWrap');
    const sel = document.getElementById('purWarehouse');
    if (!wrap || !sel) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    if (list.length <= 1) {
        wrap.style.display = 'none';
        const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : (list[0]?.id || '');
        sel.innerHTML = `<option value="${defId}">${list[0]?.name || 'افتراضي'}</option>`;
        return;
    }

    wrap.style.display = 'block';
    const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : list[0].id;

    let html = '';
    list.forEach(w => {
        const isSel = w.id === defId;
        html += `<option value="${w.id}" ${isSel ? 'selected' : ''}>🏠 ${w.name}${w.isDefault ? ' ⭐' : ''}</option>`;
    });
    sel.innerHTML = html;

    console.log(`📦 [pur-wh] عُبّئ ${list.length} مستودعات`);
}

function _purPopulateBoxes() {
    const sel = document.getElementById('purBox');
    if (!sel) return;

    let html = '<option value="">— بدون صندوق —</option>';
    (typeof _pbCache !== 'undefined' ? _pbCache : []).forEach(b => {
        html += `<option value="${b.id}">${b.icon || '💰'} ${_purEsc(b.name)}</option>`;
    });
    sel.innerHTML = html;
}

// ---------- اختيار المادة ----------
function purMaterialChanged() {
    const sel = document.getElementById('purMaterial');
    const opt = sel.options[sel.selectedIndex];

    if (opt.value === '__new__') {
        // 🆕 فتح modal أنيق
        sel.value = '';
        _purOpenNewMaterialModal();
        return;
    }

    // مادة موجودة
    if (opt.value) {
        document.getElementById('purCost').value = opt.dataset.cost || 0;
        document.getElementById('purQty').value = '';
    }
}

// ═══════════════════════════════════════════════════════
//  🆕 NEW MATERIAL MODAL — إضافة مادة من داخل المشتريات
// ═══════════════════════════════════════════════════════
function _purOpenNewMaterialModal() {
    const old = document.getElementById('purNewMatModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'purNewMatModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';
    modal.innerHTML = `
        <div style="background:white;border-radius:14px;max-width:420px;width:100%;max-height:92vh;overflow-y:auto;padding:20px;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #e67e22;">
                <h3 style="margin:0;font-size:16px;color:#2c3e50;">➕ إضافة مادة جديدة</h3>
                <button onclick="document.getElementById('purNewMatModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
            </div>

            <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">📝 اسم المادة *</label>
            <input type="text" id="purNewMatName" placeholder="مثال: أرز بسمتي 1كغ" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;font-size:14px;">

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div>
                    <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">📏 الوحدة</label>
                    <select id="purNewMatUnit" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;font-family:inherit;font-size:14px;background:white;">
                        <option value="قطعة">قطعة</option>
                        <option value="كيلو">كيلو</option>
                        <option value="غرام">غرام</option>
                        <option value="طن">طن</option>
                        <option value="شوال">شوال</option>
                        <option value="علبة">علبة</option>
                        <option value="ظرف">ظرف</option>
                        <option value="متر">متر</option>
                        <option value="لتر">لتر</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🏷️ النوع</label>
                    <input type="text" id="purNewMatType" placeholder="اختياري" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;font-family:inherit;font-size:14px;">
                </div>
            </div>

            <!-- 💰 طريقة التسعير -->
            <div style="background:#e8f5e9;border-radius:10px;padding:10px;margin-bottom:12px;border-right:3px solid #27ae60;">
                <label style="display:block;font-size:12px;font-weight:600;color:#2c3e50;margin-bottom:6px;">💰 طريقة التسعير</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
                    <label style="padding:8px;background:white;border:2px solid #27ae60;border-radius:6px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;" id="purPricingSypLabel">
                        <input type="radio" name="purPricingMode" value="syp" checked onchange="_purSetPricingMode('syp')"> 🇸🇾 ليرة
                    </label>
                    <label style="padding:8px;background:white;border:2px solid #ddd;border-radius:6px;text-align:center;cursor:pointer;font-size:11px;font-weight:600;" id="purPricingUsdLabel">
                        <input type="radio" name="purPricingMode" value="usd" onchange="_purSetPricingMode('usd')"> 💵 دولار
                    </label>
                </div>
                <div id="purExchangeHint" style="font-size:10px;color:#666;text-align:center;display:none;">
                    💱 سعر الصرف: <span id="purCurrentRate" style="font-weight:700;color:#27ae60;">—</span> ل.س
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div>
                    <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;" id="purCostLabel">💰 التكلفة (ل.س)</label>
                    <input type="number" id="purNewMatCost" placeholder="0" min="0" step="0.01" oninput="_purAutoSuggestSale()" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;font-family:inherit;font-size:14px;text-align:center;">
                </div>
                <div>
                    <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;" id="purSaleLabel">💵 سعر البيع (ل.س)</label>
                    <input type="number" id="purNewMatSale" placeholder="0" min="0" step="0.01" oninput="_purUpdateCalcSYP()" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;font-family:inherit;font-size:14px;text-align:center;">
                </div>
            </div>

            <!-- 💱 عرض السعر المحسوب (USD فقط) -->
            <div id="purCalcWrap" style="display:none;background:#f0f7ff;border-radius:8px;padding:10px;margin-bottom:12px;border-right:3px solid #3498db;">
                <div style="font-size:11px;color:#0c5460;margin-bottom:4px;">💵 السعر بالليرة (محسوب):</div>
                <div id="purCalcSYP" style="font-size:16px;font-weight:700;color:#2d4c6e;text-align:center;">—</div>
            </div>

            <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">📊 الحد الأدنى للمخزون</label>
            <input type="number" id="purNewMatMinStock" placeholder="0" min="0" value="5" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;font-size:14px;text-align:center;">

            <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🏷️ الباركود (اختياري)</label>
            <input type="text" id="purNewMatBarcode" placeholder="امسح أو أدخل يدوياً" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:16px;font-family:inherit;font-size:14px;direction:ltr;text-align:right;">

            <div id="purNewMatError" style="color:#e74c3c;text-align:center;font-size:12px;margin-bottom:10px;min-height:18px;"></div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <button onclick="document.getElementById('purNewMatModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                <button onclick="_purSaveNewMaterial()" style="padding:13px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">✅ إضافة واختيار</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // اقتراح البيع عند التحميل
    setTimeout(() => {
        document.getElementById('purNewMatName')?.focus();
        // تعبئة التكلفة من حقل المشتريات الحالي إن وُجد
        const currentCost = document.getElementById('purCost')?.value;
        if (currentCost && Number(currentCost) > 0) {
            const costEl = document.getElementById('purNewMatCost');
            if (costEl) costEl.value = currentCost;
            _purAutoSuggestSale();
        }
        // تعبئة سعر الصرف الحالي
        _purSetPricingMode('syp');
    }, 150);
}

// ═══ وضع التسعير ═══
function _purGetPricingMode() {
    const el = document.querySelector('input[name="purPricingMode"]:checked');
    return el ? el.value : 'syp';
}

function _purSetPricingMode(mode) {
    const sypLabel = document.getElementById('purPricingSypLabel');
    const usdLabel = document.getElementById('purPricingUsdLabel');
    const hint = document.getElementById('purExchangeHint');
    const rateEl = document.getElementById('purCurrentRate');
    const costLabel = document.getElementById('purCostLabel');
    const saleLabel = document.getElementById('purSaleLabel');
    const calcWrap = document.getElementById('purCalcWrap');

    if (mode === 'usd') {
        if (sypLabel) { sypLabel.style.borderColor = '#ddd'; sypLabel.style.background = 'white'; }
        if (usdLabel) { usdLabel.style.borderColor = '#3498db'; usdLabel.style.background = '#e3f2fd'; }
        if (hint) hint.style.display = 'block';
        if (costLabel) costLabel.textContent = '💰 التكلفة ($)';
        if (saleLabel) saleLabel.textContent = '💵 سعر البيع ($)';
        if (calcWrap) calcWrap.style.display = 'block';

        const rate = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;
        if (rateEl) rateEl.textContent = rate > 0 ? rate.toFixed(2) : '⚠️ غير محدد';

        // فوري — حساب
        _purUpdateCalcSYP();
    } else {
        if (sypLabel) { sypLabel.style.borderColor = '#27ae60'; sypLabel.style.background = 'white'; }
        if (usdLabel) { usdLabel.style.borderColor = '#ddd'; usdLabel.style.background = 'white'; }
        if (hint) hint.style.display = 'none';
        if (costLabel) costLabel.textContent = '💰 التكلفة (ل.س)';
        if (saleLabel) saleLabel.textContent = '💵 سعر البيع (ل.س)';
        if (calcWrap) calcWrap.style.display = 'none';
    }
}

function _purUpdateCalcSYP() {
    const mode = _purGetPricingMode();
    if (mode !== 'usd') return;
    const costUSD = parseFloat(document.getElementById('purNewMatCost')?.value) || 0;
    const saleUSD = parseFloat(document.getElementById('purNewMatSale')?.value) || 0;
    const rate = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;
    const calcEl = document.getElementById('purCalcSYP');
    if (!calcEl) return;

    if (rate <= 0) {
        calcEl.textContent = '⚠️ حدد سعر الصرف في الإعدادات';
        calcEl.style.color = '#e74c3c';
        return;
    }
    if (costUSD <= 0 && saleUSD <= 0) {
        calcEl.textContent = '—';
        return;
    }
    const costSYP = costUSD * rate;
    const saleSYP = saleUSD * rate;
    calcEl.innerHTML = 'شراء: <b>' + costSYP.toFixed(2) + '</b> ل.س<br>بيع: <b>' + saleSYP.toFixed(2) + '</b> ل.س';
    calcEl.style.color = '#2d4c6e';
}

function _purAutoSuggestSale() {
    const cost = parseFloat(document.getElementById('purNewMatCost').value) || 0;
    const saleEl = document.getElementById('purNewMatSale');
    if (saleEl && !saleEl.value && cost > 0) {
        saleEl.value = Math.round(cost * 1.3 * 100) / 100;
    }
    // 💱 تحديث الحساب في وضع الدولار
    _purUpdateCalcSYP();
}

async function _purSaveNewMaterial() {
    const errEl = document.getElementById('purNewMatError');
    const setErr = (msg) => { if (errEl) errEl.textContent = msg; };

    const name = document.getElementById('purNewMatName').value.trim();
    const unit = document.getElementById('purNewMatUnit').value || 'قطعة';
    const type = document.getElementById('purNewMatType').value.trim();
    const cost = parseFloat(document.getElementById('purNewMatCost').value) || 0;
    const sale = parseFloat(document.getElementById('purNewMatSale').value) || 0;
    const minStock = parseFloat(document.getElementById('purNewMatMinStock').value) || 0;
    const barcode = document.getElementById('purNewMatBarcode').value.trim();

    // فحص
    if (!name || name.length < 2) {
        setErr('⚠️ أدخل اسم المادة');
        return;
    }
    if (cost <= 0) {
        setErr('⚠️ أدخل سعر التكلفة');
        return;
    }

    try {
        // 💱 تحديد الوضع
        const _mode = _purGetPricingMode();
        const _rate = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;

        let costSYP = cost, costUSD = 0;
        let saleSYP = sale, saleUSD = 0;

        if (_mode === 'usd') {
            if (_rate <= 0) {
                setErr('⚠️ حدد سعر الصرف أولاً من الإعدادات');
                return;
            }
            costUSD = cost;
            costSYP = Math.round(cost * _rate * 100) / 100;
            saleUSD = sale;
            saleSYP = Math.round(sale * _rate * 100) / 100;
        }

        // إنشاء المادة
        const newMat = {
            id: (typeof materialId !== 'undefined' ? materialId++ : Date.now()),
            barcode: barcode,
            name: name,
            type: type,
            unit: unit,
            stock: 0,
            minStock: minStock,
            costSYP: costSYP,
            costUSD: costUSD,
            saleSYP: saleSYP,
            saleUSD: saleUSD,
            pricingMode: _mode
        };

        materials.push(newMat);

        // حفظ في Firestore
        if (typeof saveAllData === 'function') {
            await saveAllData();
        }

        // إغلاق modal
        document.getElementById('purNewMatModal').remove();

        // إعادة تحميل القائمة واختيار المادة الجديدة
        _purPopulateMaterials();
        const sel = document.getElementById('purMaterial');
        if (sel) sel.value = newMat.id;

        // تعبئة التكلفة والكمية
        document.getElementById('purCost').value = costSYP;
        document.getElementById('purQty').value = '';

        // إشعار
        if (typeof toast === 'function') toast('✅ تمت إضافة: ' + name, 'success');
        console.log('✅ [pur-new-mat] مادة جديدة:', newMat);

    } catch(e) {
        setErr('❌ ' + e.message);
        console.error('[pur-new-mat]', e);
    }
}

// ---------- إضافة مادة للفاتورة ----------
function purAddItem() {
    const sel = document.getElementById('purMaterial');
    const matId = parseInt(sel.value);
    const qty = parseFloat(document.getElementById('purQty').value) || 0;
    const cost = parseFloat(document.getElementById('purCost').value) || 0;

    if (!matId || qty <= 0 || cost <= 0) {
        alert('⚠️ اختر مادة وأدخل كمية وسعراً صحيحاً');
        return;
    }

    const mat = materials.find(m => m.id === matId);
    if (!mat) return alert('المادة غير موجودة');

    // فحص مكرر
    const existing = _purItems.find(i => i.materialId === matId);
    if (existing) {
        existing.qty += qty;
        existing.total = existing.qty * existing.unitPrice;
    } else {
        _purItems.push({
            materialId: matId,
            materialName: mat.name,
            unit: mat.unit || '',
            qty: qty,
            unitPrice: cost,
            total: qty * cost
        });
    }

    _purRenderItems();

    // تصفير
    document.getElementById('purQty').value = '';
    sel.value = '';
    document.getElementById('purCost').value = '';
}

// ---------- عرض مواد الفاتورة ----------
function _purRenderItems() {
    const container = document.getElementById('purItemsList');
    if (!container) return;

    if (!_purItems.length) {
        container.innerHTML = '<div style="text-align:center; color:#999; padding:15px;">أضف مواد للفاتورة</div>';
        document.getElementById('purTotal').textContent = '0';
        return;
    }

    let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
    html += '<tr style="background:#f8f9fa;"><th style="padding:8px; text-align:right;">المادة</th><th style="padding:8px;">الكمية</th><th style="padding:8px;">السعر</th><th style="padding:8px;">الإجمالي</th><th style="padding:8px;"></th></tr>';

    let total = 0;
    _purItems.forEach((it, idx) => {
        total += it.total;
        html += `<tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px; text-align:right;">${_purEsc(it.materialName)}</td>
            <td style="padding:8px; text-align:center;">${it.qty} ${_purEsc(it.unit)}</td>
            <td style="padding:8px; text-align:center;">${_purFmt(it.unitPrice)}</td>
            <td style="padding:8px; text-align:center; font-weight:bold;">${_purFmt(it.total)}</td>
            <td style="padding:8px; text-align:center;"><button onclick="purRemoveItem(${idx})" style="background:#e74c3c; color:white; border:none; border-radius:4px; width:24px; height:24px; cursor:pointer; font-size:12px;">✕</button></td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;

    document.getElementById('purTotal').textContent = _purFmt(total);
}

function purRemoveItem(idx) {
    _purItems.splice(idx, 1);
    _purRenderItems();
}

// ---------- حفظ الفاتورة ----------
async function savePurchase() {
    const supplierId = document.getElementById('purchaseSupplier')?.value || '';
    const supplierName = document.getElementById('purchaseSupplier')?.options[document.getElementById('purchaseSupplier').selectedIndex]?.text || '';
    const invoice = document.getElementById('purInvoice').value.trim();
    const date = document.getElementById('purDate').value;
    const paid = parseFloat(document.getElementById('purPaid').value) || 0;
    const boxId = document.getElementById('purBox')?.value || '';
    const notes = document.getElementById('purNotes').value.trim();

    if (!supplierId) return alert('⚠️ اختر المورد');
    if (!invoice) return alert('⚠️ أدخل رقم الفاتورة');
    if (!date) return alert('⚠️ أدخل التاريخ');
    if (_purItems.length === 0) return alert('⚠️ أضف مادة واحدة على الأقل');

    const total = _purItems.reduce((s, i) => s + i.total, 0);
    const remaining = total - paid;

    if (paid < 0) return alert('⚠️ المبلغ المدفوع لا يمكن أن يكون سالباً');
    if (paid > total) return alert('⚠️ المدفوع أكبر من الإجمالي!');

    if (!confirm(`🛒 تأكيد حفظ فاتورة الشراء؟\n\nالمورد: ${supplierName.replace('🏭 ','')}\nالإجمالي: ${_purFmt(total)} ل.س\nالمدفوع: ${_purFmt(paid)} ل.س\nالباقي: ${_purFmt(remaining)} ل.س`)) return;

    try {
        const uid = _getEffectiveUid();

        // 1) تحديث المخزون + التكلفة (متوسط مرجّح) + سجل تاريخي
        for (const item of _purItems) {
            const mat = materials.find(m => m.id === item.materialId);
            if (!mat) continue;

            const oldQty  = parseFloat(mat.stock)   || 0;
            const oldCost = parseFloat(mat.costSYP) || 0;
            const newQty  = parseFloat(item.qty)    || 0;
            const newPrice = parseFloat(item.unitPrice) || 0;

            // 💰 متوسط التكلفة المرجّح
            const totalQty = oldQty + newQty;
            const newAvgCost = totalQty > 0
                ? ((oldQty * oldCost) + (newQty * newPrice)) / totalQty
                : newPrice;

            // 📸 توثيق قبل/بعد في بند الفاتورة
            item.costBefore = oldCost;
            item.costAfter  = newAvgCost;

            // 📜 إضافة بند تاريخي
            if (!Array.isArray(mat.costHistory)) mat.costHistory = [];
            mat.costHistory.push({
                date: date,
                cost: newPrice,        // سعر الشراء الفعلي
                avgCost: newAvgCost,   // المتوسط بعد الإضافة
                qty: newQty,
                source: 'purchase',
                invoice: invoice,
                supplierId: supplierId,
                supplierName: (supplierName || '').replace('🏭 ', '').trim(),
                costBefore: oldCost,
                costChange: oldCost > 0 ? ((newPrice - oldCost) / oldCost) * 100 : 0,
                createdAt: new Date().toISOString()
            });

            // 🔄 تحديث المخزون (في المستودع) والتكلفة (موحّدة)
            const _purWhId = (typeof getDefaultWarehouseId === 'function')
                ? (document.getElementById('purWarehouse')?.value || getDefaultWarehouseId())
                : '';

            if (typeof adjustStock === 'function') {
                try {
                    // تعيين الرصيد مباشرة (يحسب totalQty = oldQty + newQty)
                    adjustStock(mat.id, totalQty, 'set', _purWhId, {
                        reason: 'purchase',
                        reasonLabel: 'فاتورة: ' + invoice
                    });
                } catch(e) {
                    console.warn('[pur] adjustStock:', e.message);
                    // fallback
                    mat.stock = totalQty;
                }
            } else {
                mat.stock = totalQty;
            }
            mat.costSYP = newAvgCost;
            mat.costUpdatedAt = new Date().toISOString();
        }

        // 2) حفظ الفاتورة
        const _purWhIdForSave = (typeof getDefaultWarehouseId === 'function')
            ? (document.getElementById('purWarehouse')?.value || getDefaultWarehouseId())
            : '';

        const purchaseData = {
            invoice: invoice,
            date: date,
            supplierId: supplierId,
            supplierName: supplierName.replace('🏭 ', ''),
            warehouseId: _purWhIdForSave,
            items: _purItems.map(i => ({ ...i })),
            total: total,
            paid: paid,
            remaining: remaining,
            boxId: boxId,
            notes: notes,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(uid).collection('purchases').add(purchaseData);

        // 3) خصم من الصندوق (مع فحص الرصيد)
        if (boxId && paid > 0) {
            // 🚫 فحص الرصيد أولاً
            const _box = (_pbCache || []).find(b => b.id === boxId);
            if (!_box) {
                throw new Error('الصندوق غير موجود');
            }
            const _bal = parseFloat(_box.balance) || 0;
            if (paid > _bal) {
                alert(
                    `🚫 الرصيد غير كافٍ!\n\n` +
                    `💳 ${_box.name}\n` +
                    `💰 المتاح: ${_purFmt(_bal)} ل.س\n` +
                    `💵 المطلوب: ${_purFmt(paid)} ل.س\n` +
                    `⏳ النقص: ${_purFmt(paid - _bal)} ل.س\n\n` +
                    `💡 قلّل المدفوع إلى ${_purFmt(_bal)} ل.س أو أقل — والباقي يصبح ديناً على المورد.`
                );
                throw new Error('الرصيد غير كافٍ');
            }

            if (typeof pbAdjustBalance === 'function') {
                await pbAdjustBalance(boxId, paid, 'subtract', {
                    reason: 'purchase',
                    reasonLabel: 'شراء من: ' + purchaseData.supplierName,
                    relatedId: invoice
                });
            }
        }

        // 4) دين المورد (إن كان فيه باقي)
        if (remaining > 0 && typeof supAdjustBalance === 'function') {
            await supAdjustBalance(supplierId, remaining, 'add');
        }

        // 5) حفظ المواد
        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();

        // 6) Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const _boxName = boxId && typeof _getBoxName === 'function' ? _getBoxName(boxId) : '';
            const _details = [
                { icon: '🏭', label: 'المورد', value: purchaseData.supplierName },
                { icon: '📄', label: 'الفاتورة', value: invoice },
                { icon: '💰', label: 'الإجمالي', value: _purFmt(total) + ' ل.س' },
                { icon: '💵', label: 'المدفوع', value: _purFmt(paid) + ' ل.س' }
            ];
            if (remaining > 0) _details.push({ icon: '⏳', label: 'الباقي', value: _purFmt(remaining) + ' ل.س' });
            if (boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: 'تم حفظ فاتورة الشراء!',
                details: _details,
                duration: 7000
            });
        }

        closePurchaseForm();
        if (typeof loadSuppliers === 'function') loadSuppliers();

    } catch(e) {
        console.error('[pur] save:', e);
        alert('❌ ' + e.message);
    }
}

// ---------- افتح الشراء من المورد ----------
function openPurchaseFromSupplier(supplierId) {
    openPurchaseForm(supplierId);
}

// ---------- أدوات ----------
function _purFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _purEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('🛒 [purchases] جاهز');

// ---------- تحميل فواتير الشراء ----------
async function loadPurchases() {
    const list = document.getElementById('purchasesList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('users').doc(_getEffectiveUid())
            .collection('purchases')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        if (snap.empty) {
            list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا توجد فواتير شراء بعد</div>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const p = doc.data();
            const dateStr = p.createdAt?.toDate?.()?.toLocaleDateString('ar-SY') || p.date || '-';
            const boxName = p.boxId && typeof _getBoxName === 'function' ? _getBoxName(p.boxId) : '';

            html += `
            <div style="background:white; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid #27ae60;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:14px;">📄 ${_purEsc(p.invoice || '-')}</div>
                        <div style="font-size:12px; color:#666; margin-top:3px;">🏭 ${_purEsc(p.supplierName || '-')}</div>
                        <div style="font-size:11px; color:#999;">📅 ${dateStr}</div>
                    </div>
                    <div style="text-align:left;">
                        <div style="font-size:16px; font-weight:bold; color:#27ae60;">${_purFmt(p.total || 0)}</div>
                        <div style="font-size:10px; color:#888;">ل.س</div>
                    </div>
                </div>
                <div style="background:#f8f9fa; border-radius:8px; padding:8px; font-size:12px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between;"><span>💵 المدفوع:</span><b>${_purFmt(p.paid || 0)}</b></div>
                    ${p.remaining > 0 ? `<div style="display:flex; justify-content:space-between; color:#e74c3c;"><span>⏳ الباقي:</span><b>${_purFmt(p.remaining)}</b></div>` : ''}
                    ${boxName ? `<div style="display:flex; justify-content:space-between; color:#3498db;"><span>💳 الصندوق:</span><b>${_purEsc(boxName)}</b></div>` : ''}
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:6px;">
                    <button onclick="openPurchaseDetails('${doc.id}')" style="padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;" title="تفاصيل">👁️</button>
                    <button onclick="openPurchaseDetailsPrint('${doc.id}')" style="padding:8px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;" title="طباعة">🖨️</button>
                    <button onclick="openPurchaseDetailsWhatsApp('${doc.id}')" style="padding:8px; background:#25d366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;" title="واتساب">📱</button>
                    <button onclick="openPurchaseReturnAsync('${doc.id}')" style="padding:8px; background:#e67e22; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;" title="مرتجع">↩️</button>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch(e) {
        console.error('[pur] load:', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _purEsc(e.message) + '</div>';
    }
}

// ---------- تبديل التبويب ----------
function switchPurchaseTab(tab) {
    const purchBtn = document.getElementById('purTabPurchases');
    const supBtn = document.getElementById('purTabSuppliers');
    const purchSection = document.getElementById('purSectionPurchases');
    const supSection = document.getElementById('purSectionSuppliers');

    if (!purchBtn || !supBtn || !purchSection || !supSection) return;

    if (tab === 'purchases') {
        purchBtn.style.background = '#27ae60';
        purchBtn.style.color = 'white';
        supBtn.style.background = '#ecf0f1';
        supBtn.style.color = '#555';
        purchSection.style.display = 'block';
        supSection.style.display = 'none';
        if (typeof loadPurchases === 'function') loadPurchases();
    } else {
        supBtn.style.background = '#27ae60';
        supBtn.style.color = 'white';
        purchBtn.style.background = '#ecf0f1';
        purchBtn.style.color = '#555';
        supSection.style.display = 'block';
        purchSection.style.display = 'none';
        if (typeof loadSuppliers === 'function') loadSuppliers();
    }
}

console.log('🔄 [purchase-tabs] جاهز');
