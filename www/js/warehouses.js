// ============================================================
//  📦 WAREHOUSES — نظام المستودعات المبسّط
// ============================================================

// ═══════════════════════════════════════════════════════════
//  🔧 Helpers — دوال مساعدة
// ═══════════════════════════════════════════════════════════

/**
 * يُرجع ID المستودع الافتراضي
 */
function getDefaultWarehouseId() {
    if (typeof warehouses === 'undefined' || !Array.isArray(warehouses) || warehouses.length === 0) {
        return 'wh_main';
    }
    const def = warehouses.find(w => w.isDefault === true);
    return def ? def.id : warehouses[0].id;
}

/**
 * يُرجع كائن المستودع الافتراضي
 */
function getDefaultWarehouse() {
    const id = getDefaultWarehouseId();
    return (warehouses || []).find(w => w.id === id) || null;
}

/**
 * يُرجع مستودعاً بالـ ID
 */
function getWarehouse(id) {
    return (warehouses || []).find(w => w.id === id) || null;
}

/**
 * هل عند المستخدم أكثر من مستودع؟
 */
function hasMultipleWarehouses() {
    return Array.isArray(warehouses) && warehouses.length > 1;
}

/**
 * هل يجب إظهار dropdown اختيار المستودع؟
 */
function shouldShowWarehouseSelect() {
    return hasMultipleWarehouses();
}

// ═══════════════════════════════════════════════════════════
//  🔐 Migration — تهيئة المستودعات للمواد القديمة
// ═══════════════════════════════════════════════════════════

/**
 * يتأكد أن المادة عندها stockByWarehouse
 */
function ensureWarehouseFields(material) {
    if (!material) return;
    if (!material.stockByWarehouse || typeof material.stockByWarehouse !== 'object') {
        const defId = getDefaultWarehouseId();
        material.stockByWarehouse = { [defId]: parseFloat(material.stock) || 0 };
    }
}

/**
 * يُشغَّل مرة واحدة عند التحميل — يُهاجر كل المواد
 */
function migrateMaterialsToWarehouses() {
    if (typeof materials === 'undefined' || !Array.isArray(materials)) return;
    if (typeof warehouses === 'undefined' || !Array.isArray(warehouses)) return;

    // إذا لم يكن هناك مستودعات — أنشئ الافتراضي
    if (warehouses.length === 0) {
        warehouses = [{
            id: 'wh_main',
            name: 'المستودع الرئيسي',
            type: 'main',
            address: '',
            notes: '',
            isDefault: true,
            createdAt: new Date().toISOString()
        }];
        console.log('🏗️ [wh] أُنشئ المستودع الافتراضي');
    }

    // هاجر المواد
    let migrated = 0;
    materials.forEach(m => {
        if (!m.stockByWarehouse || typeof m.stockByWarehouse !== 'object') {
            const defId = getDefaultWarehouseId();
            m.stockByWarehouse = { [defId]: parseFloat(m.stock) || 0 };
            migrated++;
        }
    });

    if (migrated > 0) {
        console.log(`📦 [wh] هاجر ${migrated} مادة إلى المستودعات`);
    }
}

// ═══════════════════════════════════════════════════════════
//  💰 Core — إدارة المخزون
// ═══════════════════════════════════════════════════════════

/**
 * يُعدّل مخزون مادة في مستودع معيّن
 * @param {Number} materialId
 * @param {Number} qty
 * @param {String} operation - 'add' | 'subtract' | 'set'
 * @param {String} warehouseId - (اختياري) — افتراضي = المستودع الافتراضي
 * @param {Object} meta - (اختياري) — للتوثيق
 * @returns {Object} { total, byWarehouse } أو null
 */
function adjustStock(materialId, qty, operation, warehouseId, meta) {
    const mat = (materials || []).find(m => m.id === materialId);
    if (!mat) {
        console.warn('[wh] المادة غير موجودة:', materialId);
        return null;
    }

    // تهيئة stockByWarehouse إن لم تكن موجودة
    ensureWarehouseFields(mat);

    // المستودع
    const whId = warehouseId || getDefaultWarehouseId();
    const current = parseFloat(mat.stockByWarehouse[whId]) || 0;
    const amount = parseFloat(qty) || 0;

    // التحقق من الرصيد السالب
    if (operation === 'subtract' && amount > current) {
        const err = new Error(`الرصيد غير كافٍ في "${getWarehouse(whId)?.name || whId}" — المتاح: ${current}، المطلوب: ${amount}`);
        err.code = 'INSUFFICIENT_WAREHOUSE_STOCK';
        err.available = current;
        err.required = amount;
        err.warehouseId = whId;
        err.materialId = materialId;
        throw err;
    }

    // التنفيذ
    let newVal = current;
    if (operation === 'add') {
        newVal = current + amount;
    } else if (operation === 'subtract') {
        newVal = current - amount;
    } else if (operation === 'set') {
        newVal = amount;
    } else {
        console.warn('[wh] عملية غير معروفة:', operation);
        return null;
    }

    // ضمان عدم السالب (set)
    if (newVal < 0) newVal = 0;

    mat.stockByWarehouse[whId] = newVal;

    // تحديث الإجمالي
    updateMaterialTotalStock(mat);

    // 🔄 إبطال كاش التحليلات
    if (typeof AnalyticsEngine !== 'undefined') {
        AnalyticsEngine.invalidate('warehouses');
    }

    // توثيق (اختياري)
    if (meta && typeof meta === 'object' && meta.log) {
        _whLog(materialId, whId, operation, amount, newVal, meta);
    }

    return {
        total: mat.stock,
        byWarehouse: { ...mat.stockByWarehouse },
        warehouseId: whId,
        newValue: newVal
    };
}

/**
 * يُحدّث material.stock (الإجمالي) من المجموع
 */
function updateMaterialTotalStock(material) {
    if (!material) return 0;
    if (!material.stockByWarehouse) {
        material.stock = parseFloat(material.stock) || 0;
        return material.stock;
    }
    const total = Object.values(material.stockByWarehouse)
        .reduce((s, v) => s + (parseFloat(v) || 0), 0);
    material.stock = total;
    return total;
}

/**
 * رصيد مادة في مستودع
 */
function getStockInWarehouse(materialId, warehouseId) {
    const mat = (materials || []).find(m => m.id === materialId);
    if (!mat) return 0;
    if (!mat.stockByWarehouse) return 0;
    return parseFloat(mat.stockByWarehouse[warehouseId]) || 0;
}

/**
 * إجمالي رصيد مادة
 */
function getTotalStock(materialId) {
    const mat = (materials || []).find(m => m.id === materialId);
    if (!mat) return 0;
    if (!mat.stockByWarehouse) return parseFloat(mat.stock) || 0;
    return Object.values(mat.stockByWarehouse)
        .reduce((s, v) => s + (parseFloat(v) || 0), 0);
}

/**
 * تحويل مخزون بين مستودعين
 */
function transferStock(materialId, fromWhId, toWhId, qty, meta) {
    if (fromWhId === toWhId) {
        throw new Error('لا يمكن التحويل لنفس المستودع');
    }
    const amount = parseFloat(qty) || 0;
    if (amount <= 0) {
        throw new Error('الكمية يجب أن تكون أكبر من صفر');
    }

    // سحب
    adjustStock(materialId, amount, 'subtract', fromWhId, {
        ...meta,
        log: true,
        reason: 'transfer_out',
        relatedWh: toWhId
    });

    // إيداع
    adjustStock(materialId, amount, 'add', toWhId, {
        ...meta,
        log: true,
        reason: 'transfer_in',
        relatedWh: fromWhId
    });

    return true;
}

// ═══════════════════════════════════════════════════════════
//  📋 CRUD — إدارة المستودعات
// ═══════════════════════════════════════════════════════════

/**
 * فتح صفحة المستودعات
 */
function loadWarehousesPage() {
    renderWarehouses();
    _whUpdateMenuVisibility();
}

/**
 * عرض قائمة المستودعات
 */
function renderWarehouses() {
    const container = document.getElementById('warehousesList');
    if (!container) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مستودعات — أضف واحداً</div>';
        return;
    }

    let html = '';
    list.forEach(w => {
        const isDef = w.isDefault === true;
        const materialCount = (materials || []).filter(m => m.stockByWarehouse && m.stockByWarehouse[w.id] > 0).length;

        html += `
        <div style="
            background:white; border-radius:12px; padding:14px; margin-bottom:10px;
            box-shadow:0 2px 6px rgba(0,0,0,0.06);
            border-right:4px solid ${isDef ? '#27ae60' : '#3498db'};
        ">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:15px; margin-bottom:4px;">
                        🏠 ${_whEsc(w.name)}
                        ${isDef ? '<span style="background:#27ae60; color:white; font-size:10px; padding:2px 8px; border-radius:10px; margin-right:6px;">افتراضي</span>' : ''}
                    </div>
                    <div style="font-size:12px; color:#666;">
                        ${w.type === 'main' ? '🏭 رئيسي' : w.type === 'branch' ? '🏪 فرع' : w.type === 'transit' ? '🚚 عبور' : '📦 عام'}
                        ${w.address ? ' • 📍 ' + _whEsc(w.address) : ''}
                    </div>
                    <div style="font-size:11px; color:#888; margin-top:4px;">
                        📊 ${materialCount} مادة • ${(materials || []).length} إجمالي
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:4px;">
                    ${!isDef ? `<button onclick="setDefaultWarehouse('${w.id}')" style="padding:6px 10px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">⭐ تعيين افتراضي</button>` : ''}
                    <button onclick="openWarehouseForm('${w.id}')" style="padding:6px 10px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">✏️ تعديل</button>
                    ${list.length > 1 ? `<button onclick="deleteWarehouse('${w.id}')" style="padding:6px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">🗑️ حذف</button>` : ''}
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

/**
 * فتح نموذج إضافة/تعديل مستودع
 */
function openWarehouseForm(id) {
    const isEdit = !!id;
    const w = isEdit ? getWarehouse(id) : null;
    if (isEdit && !w) { alert('⚠️ المستودع غير موجود'); return; }

    // إزالة modal قديم
    const old = document.getElementById('whFormModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'whFormModal';
    modal.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.55); z-index:10002;
        display:flex; align-items:center; justify-content:center;
        padding:20px;
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
    <div style="background:white; border-radius:14px; padding:20px; max-width:420px; width:100%;">
        <h3 style="margin:0 0 15px 0; color:#2c3e50; font-size:16px;">
            ${isEdit ? '✏️ تعديل مستودع' : '➕ إضافة مستودع'}
        </h3>

        <label style="font-size:12px; color:#666;">اسم المستودع *</label>
        <input type="text" id="whName" value="${w ? _whEsc(w.name) : ''}" placeholder="مثال: المخزن الرئيسي" 
               style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">

        <label style="font-size:12px; color:#666;">النوع</label>
        <select id="whType" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">
            <option value="main" ${!w || w.type === 'main' ? 'selected' : ''}>🏭 رئيسي</option>
            <option value="branch" ${w && w.type === 'branch' ? 'selected' : ''}>🏪 فرع</option>
            <option value="transit" ${w && w.type === 'transit' ? 'selected' : ''}>🚚 عبور</option>
            <option value="general" ${w && w.type === 'general' ? 'selected' : ''}>📦 عام</option>
        </select>

        <label style="font-size:12px; color:#666;">العنوان (اختياري)</label>
        <input type="text" id="whAddress" value="${w && w.address ? _whEsc(w.address) : ''}" placeholder="مثال: دمشق - المزة"
               style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">

        <label style="font-size:12px; color:#666;">ملاحظات (اختياري)</label>
        <input type="text" id="whNotes" value="${w && w.notes ? _whEsc(w.notes) : ''}" 
               style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">

        ${isEdit ? '' : `
        <label style="font-size:12px; color:#666; display:flex; align-items:center; gap:6px; margin-bottom:15px;">
            <input type="checkbox" id="whSetDefault"> تعيين كمستودع افتراضي
        </label>`}

        <div style="display:flex; gap:8px;">
            <button onclick="saveWarehouse('${id || ''}')" style="flex:1; padding:12px; background:#27ae60; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:bold;">💾 حفظ</button>
            <button onclick="document.getElementById('whFormModal').remove()" style="flex:1; padding:12px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">إلغاء</button>
        </div>
    </div>`;

    document.body.appendChild(modal);

    setTimeout(() => document.getElementById('whName')?.focus(), 100);
}

/**
 * حفظ مستودع
 */
async function saveWarehouse(editId) {
    const name = (document.getElementById('whName')?.value || '').trim();
    const type = document.getElementById('whType')?.value || 'general';
    const address = (document.getElementById('whAddress')?.value || '').trim();
    const notes = (document.getElementById('whNotes')?.value || '').trim();
    const setDef = document.getElementById('whSetDefault')?.checked || false;

    if (!name) { alert('⚠️ أدخل اسم المستودع'); return; }

    if (editId) {
        // تعديل
        const w = getWarehouse(editId);
        if (!w) { alert('⚠️ المستودع غير موجود'); return; }
        w.name = name;
        w.type = type;
        w.address = address;
        w.notes = notes;
        console.log('✏️ [wh] عُدّل:', editId);
    } else {
        // إضافة جديدة
        const newWh = {
            id: 'wh_' + Date.now(),
            name,
            type,
            address,
            notes,
            isDefault: false,
            createdAt: new Date().toISOString()
        };

        if (!Array.isArray(warehouses)) warehouses = [];
        warehouses.push(newWh);

        // تعيين افتراضي إن اختير، أو إن كان الأول
        if (setDef || warehouses.length === 1) {
            _whSetDefaultInternal(newWh.id);
        }

        // تهيئة المواد بالحقل الجديد
        if (Array.isArray(materials)) {
            materials.forEach(m => ensureWarehouseFields(m));
        }

        console.log('➕ [wh] أُضيف:', newWh.id);
    }

    // حفظ
    if (typeof saveAllData === 'function') await saveAllData();

    // إغلاق Modal
    const modal = document.getElementById('whFormModal');
    if (modal) modal.remove();

    // تحديث الواجهة
    renderWarehouses();
    _whUpdateMenuVisibility();

    if (typeof showToast === 'function') {
        showToast('✅ تم حفظ المستودع', 'success');
    }
}

/**
 * تعيين مستودع كافتراضي
 */
async function setDefaultWarehouse(id) {
    if (!confirm('تعيين هذا المستودع كافتراضي؟')) return;
    _whSetDefaultInternal(id);
    if (typeof saveAllData === 'function') await saveAllData();
    renderWarehouses();
    if (typeof showToast === 'function') showToast('⭐ تم تعيين المستودع الافتراضي', 'success');
}

function _whSetDefaultInternal(id) {
    (warehouses || []).forEach(w => { w.isDefault = (w.id === id); });
}

/**
 * حذف مستودع
 */
async function deleteWarehouse(id) {
    const w = getWarehouse(id);
    if (!w) return;

    if (warehouses.length <= 1) {
        alert('⚠️ لا يمكن حذف المستودع الوحيد');
        return;
    }

    if (w.isDefault) {
        alert('⚠️ لا يمكن حذف المستودع الافتراضي — عيّن غيره أولاً');
        return;
    }

    // تحقق من وجود مخزون
    const usedMaterials = (materials || []).filter(m =>
        m.stockByWarehouse && parseFloat(m.stockByWarehouse[id]) > 0
    );

    if (usedMaterials.length > 0) {
        alert(`⚠️ لا يمكن الحذف — ${usedMaterials.length} مادة تحتوي مخزوناً في هذا المستودع.\n\nحوّل المخزون أولاً أو احذفه.`);
        return;
    }

    if (!confirm(`حذف المستودع "${w.name}"؟`)) return;

    const idx = warehouses.findIndex(x => x.id === id);
    if (idx === -1) return;
    warehouses.splice(idx, 1);

    // إزالة الحقل من المواد
    (materials || []).forEach(m => {
        if (m.stockByWarehouse && m.stockByWarehouse[id] !== undefined) {
            delete m.stockByWarehouse[id];
        }
    });

    if (typeof saveAllData === 'function') await saveAllData();

    renderWarehouses();
    _whUpdateMenuVisibility();
    if (typeof showToast === 'function') showToast('🗑️ تم حذف المستودع', 'info');
}

/**
 * إظهار/إخفاء زر القائمة
 */
function _whUpdateMenuVisibility() {
    const btn = document.getElementById('whMenuBtn');
    if (!btn) return;
    // نُظهر الزر دائماً (ليتمكن المستخدم من إضافة مستودعات)
    btn.style.display = '';
}

// ═══════════════════════════════════════════════════════════
//  🎨 UI Components — dropdown المستودع
// ═══════════════════════════════════════════════════════════

/**
 * يملأ dropdown اختيار المستودع
 */
function renderWarehouseSelect(elementId, selectedId) {
    const sel = document.getElementById(elementId);
    if (!sel) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    if (list.length === 0) {
        sel.innerHTML = '<option value="">لا مستودعات</option>';
        return;
    }

    const defId = getDefaultWarehouseId();
    const selId = selectedId || defId;

    let html = '';
    list.forEach(w => {
        const isSel = w.id === selId;
        html += `<option value="${w.id}" ${isSel ? 'selected' : ''}>🏠 ${_whEsc(w.name)}${w.isDefault ? ' ⭐' : ''}</option>`;
    });
    sel.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
//  📝 Log — توثيق الحركات
// ═══════════════════════════════════════════════════════════

async function _whLog(materialId, warehouseId, operation, amount, newVal, meta) {
    try {
        if (!auth || !auth.currentUser) return;
        const uid = _getEffectiveUid();
        await db.collection('users').doc(uid).collection('warehouse_log').add({
            materialId,
            warehouseId,
            warehouseName: getWarehouse(warehouseId)?.name || '',
            operation,
            amount,
            newValue: newVal,
            reason: meta.reason || 'adjustment',
            reasonLabel: meta.reasonLabel || '',
            relatedId: meta.relatedId || '',
            relatedWh: meta.relatedWh || '',
            userName: (typeof currentUser !== 'undefined' && currentUser ? currentUser.fullName : '') || '',
            performedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.warn('[wh] log failed:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  🛠️ أدوات
// ═══════════════════════════════════════════════════════════

function _whEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ═══════════════════════════════════════════════════════════
//  🌐 تصدير للنافذة
// ═══════════════════════════════════════════════════════════

// Helpers
window.getDefaultWarehouseId = getDefaultWarehouseId;
window.getDefaultWarehouse = getDefaultWarehouse;
window.getWarehouse = getWarehouse;
window.hasMultipleWarehouses = hasMultipleWarehouses;
window.shouldShowWarehouseSelect = shouldShowWarehouseSelect;

// Migration
window.ensureWarehouseFields = ensureWarehouseFields;
window.migrateMaterialsToWarehouses = migrateMaterialsToWarehouses;

// Core
window.adjustStock = adjustStock;
window.updateMaterialTotalStock = updateMaterialTotalStock;
window.getStockInWarehouse = getStockInWarehouse;
window.getTotalStock = getTotalStock;
window.transferStock = transferStock;

// CRUD
window.loadWarehousesPage = loadWarehousesPage;
window.renderWarehouses = renderWarehouses;
window.openWarehouseForm = openWarehouseForm;
window.saveWarehouse = saveWarehouse;
window.setDefaultWarehouse = setDefaultWarehouse;
window.deleteWarehouse = deleteWarehouse;

// UI
window.renderWarehouseSelect = renderWarehouseSelect;

// ═══════════════════════════════════════════════════════════
//  🔄 Refresh All Selects
// ═══════════════════════════════════════════════════════════
function _whRefreshAllSelects() {
    const calls = [
        ['_populateSaleWarehouseSelect', 'بيع'],
        ['_purPopulateWarehouse', 'شراء'],
        ['_dspPopulateWarehouse', 'إتلاف'],
        ['_osPopulateWarehouse', 'رصيد افتتاحي'],
        ['_retPopulateWarehouse', 'إرجاع مبيعات'],
        ['_purRetPopulateWarehouse', 'مرتجع مشتريات']
    ];
    
    calls.forEach(([fn, label]) => {
        if (typeof window[fn] === 'function') {
            try {
                window[fn]();
                console.log(`🔄 [wh] تحديث dropdown ${label}`);
            } catch(e) {
                console.warn(`[wh] ${label}:`, e.message);
            }
        }
    });
}

window._whRefreshAllSelects = _whRefreshAllSelects;

// ═══════════════════════════════════════════════════════════
//  🔀 TRANSFERS — التحويلات بين المستودعات
// ═══════════════════════════════════════════════════════════

// ---------- فتح صفحة التحويلات ----------
function loadTransfersPage() {
    renderTransfers();
}

// ---------- عرض قائمة التحويلات ----------
function renderTransfers() {
    const container = document.getElementById('whTransfersList');
    if (!container) return;

    const list = (typeof transfers !== 'undefined' && Array.isArray(transfers)) ? transfers.slice() : [];
    list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا تحويلات بعد</div>';
        return;
    }

    let html = '';
    list.forEach((t, idx) => {
        const fromWh = getWarehouse(t.fromWhId);
        const toWh = getWarehouse(t.toWhId);
        const fromName = fromWh ? fromWh.name : '—';
        const toName = toWh ? toWh.name : '—';

        html += `
        <div style="
            background:white; border-radius:12px; padding:12px 14px; margin-bottom:10px;
            box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid #3498db;
        ">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px; margin-bottom:4px;">
                        📦 ${_whEsc(t.materialName || '—')}
                    </div>
                    <div style="font-size:12px; color:#666; margin-bottom:4px;">
                        🏠 ${_whEsc(fromName)} <span style="color:#3498db; font-weight:bold;">→</span> 🏠 ${_whEsc(toName)}
                    </div>
                    <div style="font-size:11px; color:#888;">
                        🔢 الكمية: <b>${t.qty} ${_whEsc(t.unit || '')}</b> • 📅 ${t.date || '—'}
                    </div>
                    ${t.notes ? `<div style="font-size:11px; color:#666; margin-top:4px;">📝 ${_whEsc(t.notes)}</div>` : ''}
                </div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    <button onclick="deleteTransfer(${idx})" style="padding:6px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">🗑️ حذف</button>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

// ---------- فتح نموذج التحويل ----------
function openTransferForm() {
    const old = document.getElementById('whTransferFormModal');
    if (old) old.remove();

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];
    if (list.length < 2) {
        alert('⚠️ يجب أن يكون لديك مستودعان على الأقل');
        return;
    }

    const matOptions = (typeof materials !== 'undefined' ? materials : [])
        .filter(m => parseFloat(m.stock) > 0)
        .map(m => `<option value="${m.id}">${_whEsc(m.name)} (${parseFloat(m.stock)||0} ${_whEsc(m.unit||'')})</option>`)
        .join('');

    const whOptions = list.map(w => 
        `<option value="${w.id}" ${w.isDefault ? 'selected' : ''}>🏠 ${_whEsc(w.name)}${w.isDefault ? ' ⭐' : ''}</option>`
    ).join('');

    const modal = document.createElement('div');
    modal.id = 'whTransferFormModal';
    modal.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.55); z-index:10003;
        display:flex; align-items:center; justify-content:center;
        padding:20px; overflow-y:auto;
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
    <div style="background:white; border-radius:14px; padding:20px; max-width:440px; width:100%; margin:auto;">
        <h3 style="margin:0 0 15px 0; color:#2c3e50; font-size:16px;">🔀 تحويل جديد</h3>

        <label style="font-size:12px; color:#666;">📦 المادة</label>
        <select id="trMaterial" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">
            ${matOptions || '<option value="">لا مواد متوفرة</option>'}
        </select>

        <label style="font-size:12px; color:#666;">🏠 من مستودع</label>
        <select id="trFromWh" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">
            ${whOptions}
        </select>

        <label style="font-size:12px; color:#666;">🏠 إلى مستودع</label>
        <select id="trToWh" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">
            ${whOptions}
        </select>

        <label style="font-size:12px; color:#666;">🔢 الكمية</label>
        <input type="number" id="trQty" min="1" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:10px;">

        <label style="font-size:12px; color:#666;">📝 ملاحظات (اختياري)</label>
        <input type="text" id="trNotes" placeholder="مثال: نقل للمخزن الرئيسي" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; margin-bottom:15px;">

        <div style="display:flex; gap:8px;">
            <button onclick="saveTransfer()" style="flex:1; padding:12px; background:#3498db; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:bold;">🔄 تنفيذ التحويل</button>
            <button onclick="document.getElementById('whTransferFormModal').remove()" style="flex:1; padding:12px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">إلغاء</button>
        </div>
    </div>`;

    document.body.appendChild(modal);
}

// ---------- حفظ التحويل ----------
async function saveTransfer() {
    const matId = parseInt(document.getElementById('trMaterial')?.value);
    const fromWhId = document.getElementById('trFromWh')?.value;
    const toWhId = document.getElementById('trToWh')?.value;
    const qty = parseFloat(document.getElementById('trQty')?.value) || 0;
    const notes = (document.getElementById('trNotes')?.value || '').trim();

    // فحوص
    if (!matId) { alert('⚠️ اختر مادة'); return; }
    if (!fromWhId || !toWhId) { alert('⚠️ اختر المستودعين'); return; }
    if (fromWhId === toWhId) { alert('⚠️ لا يمكن التحويل لنفس المستودع'); return; }
    if (qty <= 0) { alert('⚠️ أدخل كمية صحيحة'); return; }

    const mat = (typeof materials !== 'undefined') ? materials.find(m => m.id === matId) : null;
    if (!mat) { alert('⚠️ المادة غير موجودة'); return; }

    // فحص الرصيد
    const avail = getStockInWarehouse(matId, fromWhId);
    if (avail < qty) {
        alert(`🚫 الرصيد غير كافٍ في المصدر\n\nالمتاح: ${avail} ${mat.unit || ''}\nالمطلوب: ${qty}`);
        return;
    }

    const fromWh = getWarehouse(fromWhId);
    const toWh = getWarehouse(toWhId);

    if (!confirm(`🔄 تأكيد التحويل؟\n\n📦 ${mat.name}\n🔢 الكمية: ${qty} ${mat.unit || ''}\n🏠 من: ${fromWh?.name}\n🏠 إلى: ${toWh?.name}`)) return;

    // التنفيذ
    try {
        transferStock(matId, fromWhId, toWhId, qty, {
            reason: 'transfer',
            reasonLabel: `تحويل: ${mat.name}`
        });
    } catch (e) {
        alert('🚫 فشل التحويل:\n' + e.message);
        return;
    }

    // سجل التحويل
    const transfer = {
        id: 'tr_' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        materialId: mat.id,
        materialName: mat.name,
        unit: mat.unit || '',
        qty,
        fromWhId,
        fromWhName: fromWh?.name || '',
        toWhId,
        toWhName: toWh?.name || '',
        notes,
        createdAt: new Date().toISOString()
    };

    if (typeof transfers !== 'undefined' && Array.isArray(transfers)) {
        transfers.push(transfer);
    } else {
        window.transfers = [transfer];
    }

    if (typeof saveAllData === 'function') await saveAllData();
    if (typeof updateMaterialsTable === 'function') updateMaterialsTable();

    // إغلاق
    const modal = document.getElementById('whTransferFormModal');
    if (modal) modal.remove();

    // تحديث
    renderTransfers();

    if (typeof showSuccessToast === 'function') {
        showSuccessToast({
            title: '🔄 تم التحويل بنجاح',
            details: [
                { icon: '📦', label: 'المادة', value: mat.name },
                { icon: '🔢', label: 'الكمية', value: qty + ' ' + (mat.unit || '') },
                { icon: '🏠', label: 'من', value: fromWh?.name },
                { icon: '🏠', label: 'إلى', value: toWh?.name }
            ],
            duration: 6000
        });
    } else if (typeof showToast === 'function') {
        showToast('🔄 تم التحويل بنجاح', 'success');
    }
}

// ---------- حذف تحويل (عكس العملية) ----------
async function deleteTransfer(index) {
    if (typeof requirePassword === 'function') {
        requirePassword(async () => { await _doDeleteTransfer(index); });
    } else {
        if (!confirm('إلغاء هذا التحويل؟ سيُعاد المخزون للمصدر.')) return;
        await _doDeleteTransfer(index);
    }
}

async function _doDeleteTransfer(index) {
    if (typeof transfers === 'undefined' || !Array.isArray(transfers)) return;
    const t = transfers[index];
    if (!t) return;

    // عكس التحويل
    try {
        transferStock(t.materialId, t.toWhId, t.fromWhId, t.qty, {
            reason: 'transfer_reversed',
            reasonLabel: `إلغاء تحويل: ${t.materialName}`
        });
    } catch(e) {
        console.warn('[wh] reverse transfer failed:', e.message);
    }

    transfers.splice(index, 1);
    if (typeof saveAllData === 'function') await saveAllData();
    if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
    renderTransfers();

    if (typeof showToast === 'function') showToast('🗑️ تم إلغاء التحويل', 'info');
}

window.loadTransfersPage = loadTransfersPage;
window.renderTransfers = renderTransfers;
window.openTransferForm = openTransferForm;
window.saveTransfer = saveTransfer;
window.deleteTransfer = deleteTransfer;

console.log('📦 [wh] warehouses.js محمّل');
