// ============================================================
//  🏪 ACTIVITY: SUPERMARKET — نشاط السوبرماركت
//  v1.0.0
// ============================================================

ACTIVITY_REGISTRY.register({
    id: 'supermarket',
    name: 'سوبر ماركت',
    icon: '🏪',
    pages: [

        // ═══════════════════════════════════════════════════
        //  🛵 طلبات التوصيل
        // ═══════════════════════════════════════════════════
        {
            id: 'delivery',
            icon: '🛵',
            title: 'طلبات التوصيل',
            printTitle: 'طلب توصيل',
            description: 'طلبات الزبائن مع التوصيل للمنزل',
            addLabel: '➕ طلب جديد',
            searchPlaceholder: 'ابحث برقم الطلب / اسم / هاتف / عنوان...',
            emptyIcon: '🛵',
            autoNumber: true,
            numberPrefix: 'DEL',
            printSize: 'thermal',
            searchFields: ['number', 'customerName', 'customerPhone', 'address', 'area'],
            primaryField: 'customerName',
            secondaryField: 'address',
            amountField: 'total',
            stats: [
                { icon: '📋', label: 'الكل',
                  compute: (items) => items.length,
                  bg: '#ecf0f1', color: '#2c3e50', filterId: 'all' },
                { icon: '🟡', label: 'قيد التحضير',
                  compute: (items) => items.filter(x => x.status === 'preparing').length,
                  bg: '#fff3cd', color: '#856404', filterId: 'preparing' },
                { icon: '🟠', label: 'بالطريق',
                  compute: (items) => items.filter(x => x.status === 'onway').length,
                  bg: '#ffe5cc', color: '#c0392b', filterId: 'onway' },
                { icon: '✅', label: 'تم التسليم',
                  compute: (items) => items.filter(x => x.status === 'delivered').length,
                  bg: '#d4edda', color: '#155724', filterId: 'delivered' }
            ],
            filters: [
                { id: 'all', label: 'الكل' },
                { id: 'preparing', label: 'قيد التحضير' },
                { id: 'onway', label: 'بالطريق' },
                { id: 'delivered', label: 'تم التسليم' },
                { id: 'cancelled', label: 'ملغي' }
            ],
            fields: [
                { name: 'customerName', label: 'اسم الزبون', type: 'text', required: true, icon: '👤', placeholder: 'أحمد محمد علي' },
                { name: 'customerPhone', label: 'رقم الهاتف', type: 'tel', required: true, icon: '📞', placeholder: '09XXXXXXXX' },
                { name: 'address', label: 'العنوان التفصيلي', type: 'text', required: true, icon: '📍', placeholder: 'الشارع / رقم البناء / الطابق' },
                { name: 'area', label: 'المنطقة / الحي', type: 'text', icon: '🏘️', placeholder: 'المزة / الميدان / ...' },
                { name: 'status', label: 'حالة الطلب', type: 'select', icon: '📊', default: 'preparing',
                  options: [
                      { value: 'preparing', label: '🟡 قيد التحضير' },
                      { value: 'onway',     label: '🟠 بالطريق' },
                      { value: 'delivered', label: '✅ تم التسليم' },
                      { value: 'cancelled', label: '❌ ملغي' }
                  ]},
                { name: 'driver', label: 'السائق / العامل', type: 'text', icon: '🚗', placeholder: 'اختياري' },
                { name: 'paymentType', label: 'طريقة الدفع', type: 'select', icon: '💳', default: 'cash',
                  options: [
                      { value: 'cash',  label: '💵 نقدي عند التسليم' },
                      { value: 'credit', label: '💳 آجل (دين)' },
                      { value: 'paid',  label: '✅ مدفوع مسبقاً' }
                  ]},
                { name: 'deliveryFee', label: 'أجرة التوصيل', type: 'number', icon: '🛵', placeholder: '0', min: 0, default: 0 },
                { name: 'notes', label: 'ملاحظات', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],

            // 🎯 قائمة المواد في الطلب
            formExtra: `
                <div style="border-top:2px dashed #ddd; margin-top:15px; padding-top:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <label style="font-size:13px; color:#555; font-weight:600;">
                            📦 المواد المطلوبة <span style="color:#e74c3c;">*</span>
                        </label>
                        <button type="button" onclick="_smAddItem()"
                            style="padding:6px 12px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">
                            ➕ إضافة مادة
                        </button>
                    </div>
                    <div id="smItemsList"></div>
                    <div id="smItemsTotal" style="display:none; background:#e8f5e9; padding:10px 14px; border-radius:8px; border-right:3px solid #27ae60; margin-top:10px; font-size:14px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="font-weight:600;">💰 إجمالي المواد:</span>
                            <span id="smItemsTotalVal" style="font-weight:bold; color:#27ae60;">0</span>
                        </div>
                    </div>
                </div>
            `,

            onFormOpen: function(editData) {
                _smItemsInit(editData);
            },

            beforeSave: function(data, docId) {
                const items = window._smItemsState || [];
                data.items = items.map(it => ({ ...it }));
                data.total = items.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
            },

            afterSave: async function(data, docId, wasEdit) {
                console.log('🛵 [supermarket] saved:', data.number);
            },

            itemRenderer: function(item) {
                const statusLabels = {
                    'preparing': '🟡 قيد التحضير', 'onway': '🟠 بالطريق',
                    'delivered': '✅ تم التسليم', 'cancelled': '❌ ملغي'
                };
                const statusColors = {
                    'preparing': '#f39c12', 'onway': '#e67e22',
                    'delivered': '#27ae60', 'cancelled': '#e74c3c'
                };
                const sl = statusLabels[item.status] || '—';
                const sc = statusColors[item.status] || '#666';
                const dateStr = _afDate(item.createdAt);
                const total = item.total ? _afFmt(item.total) : '';
                const itemsCount = (item.items || []).length;

                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">👤 ${_afEsc(item.customerName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">📞 ${_afEsc(item.customerPhone || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${_afEsc(item.address || '—')}${item.area ? ' • ' + _afEsc(item.area) : ''}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">📄 ${_afEsc(item.number || '—')} • 📅 ${dateStr} • 📦 ${itemsCount} مادة</div>
                            ${item.driver ? `<div style="font-size:11px; color:#8e44ad; margin-top:2px;">🚗 السائق: ${_afEsc(item.driver)}</div>` : ''}
                        </div>
                        <div style="text-align:left; flex-shrink:0;">
                            <div style="background:${sc}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${sl}</div>
                            ${total ? `<div style="font-weight:bold; color:#27ae60; font-size:13px; margin-top:6px; text-align:center;">${total}</div>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px;">
                        <button onclick="activityOpenForm('supermarket', 'delivery', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="activityWhatsAppItem('supermarket', 'delivery', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب">💬</button>
                        <button onclick="activityPrintItem('supermarket', 'delivery', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة">🖨️</button>
                        <button onclick="activityConfirmDelete('supermarket', 'delivery', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                </div>`;
            }
        },

        // ═══════════════════════════════════════════════════
        //  📊 جرد سريع
        // ═══════════════════════════════════════════════════
        {
            id: 'inventory',
            icon: '📊',
            title: 'جرد سريع',
            description: 'جرد المخزون + كشف الفروقات',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _smRenderInventory(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  📊 تقرير المتجر
        // ═══════════════════════════════════════════════════
        {
            id: 'store-report',
            icon: '📊',
            title: 'تقرير المتجر',
            description: 'ملخص يومي للمبيعات',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _smRenderStoreReport(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  💰 قائمة أسعار الجملة
        // ═══════════════════════════════════════════════════
        {
            id: 'price-list',
            icon: '💰',
            title: 'قائمة أسعار الجملة',
            description: 'أسعار المفرق والجملة',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _smRenderPriceList(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  🤖 تنبيهات ذكية
        // ═══════════════════════════════════════════════════
        {
            id: 'ai-alerts',
            icon: '🤖',
            title: 'تنبيهات ذكية',
            description: 'تحليل تلقائي للمخزون والمبيعات',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _smRenderAIAlerts(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  🏷️ التصنيفات السريعة
        // ═══════════════════════════════════════════════════
        {
            id: 'categories',
            icon: '🏷️',
            title: 'التصنيفات السريعة',
            description: 'عرض المواد حسب التصنيف',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _smRenderCategories(container);
            }
        }
    ]
});

console.log('🏪 [supermarket] registered | 4 pages');


// ============================================================
//  📦 DELIVERY ITEMS — إدارة المواد داخل الطلب
// ============================================================
window._smItemsState = [];

function _smItemsInit(editData) {
    if (editData && Array.isArray(editData.items)) {
        window._smItemsState = editData.items.map(it => ({ ...it }));
    } else {
        window._smItemsState = [];
    }
    setTimeout(_smItemsRender, 100);
}

function _smAddItem() {
    window._smItemsState.push({
        materialId: null,
        name: '',
        qty: 1,
        unit: '',
        unitPrice: 0,
        priceType: 'retail',
        total: 0
    });
    _smItemsRender();
}

function _smUpdateItem(idx, field, value) {
    if (!window._smItemsState[idx]) return;
    const it = window._smItemsState[idx];

    if (field === 'materialId') {
        const m = (typeof materials !== 'undefined' && materials.find) ? materials.find(x => x.id === parseInt(value)) : null;
        if (m) {
            it.materialId = m.id;
            it.name = m.name;
            it.unit = m.unit || '';
            // السعر الافتراضي حسب نوع السعر
            if (it.priceType === 'wholesale' && m.wholesaleSYP) {
                it.unitPrice = m.wholesaleSYP;
            } else {
                it.unitPrice = m.saleSYP || 0;
            }
        } else {
            it.materialId = null;
            it.name = '';
            it.unit = '';
            it.unitPrice = 0;
        }
    } else if (field === 'priceType') {
        it.priceType = value;
        // إعادة حساب السعر
        const m = (typeof materials !== 'undefined' && materials.find) ? materials.find(x => x.id === it.materialId) : null;
        if (m) {
            if (value === 'wholesale' && m.wholesaleSYP) {
                it.unitPrice = m.wholesaleSYP;
            } else {
                it.unitPrice = m.saleSYP || 0;
            }
        }
    } else {
        it[field] = (field === 'qty' || field === 'unitPrice') ? (parseFloat(value) || 0) : value;
    }

    it.total = (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0);
    _smItemsRender();
}

function _smRemoveItem(idx) {
    if (!confirm('🗑️ حذف هذه المادة؟')) return;
    window._smItemsState.splice(idx, 1);
    _smItemsRender();
}

function _smItemsRender() {
    const list = document.getElementById('smItemsList');
    if (!list) return;

    const items = window._smItemsState || [];

    if (items.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:15px; color:#999; font-size:12px; background:#f8f9fa; border-radius:8px;">لا توجد مواد — اضغط "➕ إضافة مادة"</div>';
        _smItemsTotal();
        return;
    }

    // خيارات المواد
    const matOptions = (typeof materials !== 'undefined' && Array.isArray(materials))
        ? materials.map(m => `<option value="${m.id}" ${m.stock <= 0 ? 'disabled' : ''}>${_afEsc(m.name)}${m.stock <= 0 ? ' (نفد)' : ''}</option>`).join('')
        : '';

    let html = '';
    items.forEach((it, idx) => {
        html += `
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:8px; border-right:3px solid #3498db;">
                <div style="display:grid; grid-template-columns:1fr auto; gap:6px; margin-bottom:6px;">
                    <select onchange="_smUpdateItem(${idx}, 'materialId', this.value)" style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; background:white;">
                        <option value="">— اختر مادة —</option>
                        ${matOptions}
                    </select>
                    <button type="button" onclick="_smRemoveItem(${idx})" style="padding:8px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">🗑️</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                    <div>
                        <div style="font-size:10px; color:#666; margin-bottom:2px;">الكمية</div>
                        <input type="number" value="${it.qty}" min="0" step="0.001" onchange="_smUpdateItem(${idx}, 'qty', this.value)" style="width:100%; padding:7px; border:1px solid #ddd; border-radius:6px; font-size:12px; text-align:center; box-sizing:border-box;">
                    </div>
                    <div>
                        <div style="font-size:10px; color:#666; margin-bottom:2px;">سعر</div>
                        <input type="number" value="${it.unitPrice}" min="0" onchange="_smUpdateItem(${idx}, 'unitPrice', this.value)" style="width:100%; padding:7px; border:1px solid #ddd; border-radius:6px; font-size:12px; text-align:center; box-sizing:border-box;">
                    </div>
                    <div>
                        <div style="font-size:10px; color:#666; margin-bottom:2px;">الإجمالي</div>
                        <div style="padding:7px; background:#e8f5e9; border-radius:6px; font-size:12px; font-weight:bold; color:#27ae60; text-align:center;">${_afFmt(it.total || 0)}</div>
                    </div>
                </div>
                <div style="margin-top:6px;">
                    <select onchange="_smUpdateItem(${idx}, 'priceType', this.value)" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; font-size:11px; background:white;">
                        <option value="retail" ${it.priceType !== 'wholesale' ? 'selected' : ''}>💰 سعر مفرق</option>
                        <option value="wholesale" ${it.priceType === 'wholesale' ? 'selected' : ''}>🏷️ سعر جملة</option>
                    </select>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    // تعيين القيم المحددة للمواد
    setTimeout(() => {
        const selects = list.querySelectorAll('select[onchange*="materialId"]');
        selects.forEach((sel, i) => {
            if (items[i] && items[i].materialId) {
                sel.value = items[i].materialId;
            }
        });
    }, 50);

    _smItemsTotal();
}

function _smItemsTotal() {
    const items = window._smItemsState || [];
    const total = items.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
    const wrap = document.getElementById('smItemsTotal');
    const valEl = document.getElementById('smItemsTotalVal');
    if (wrap && valEl) {
        if (total > 0) {
            wrap.style.display = 'block';
            valEl.textContent = _afFmt(total);
        } else {
            wrap.style.display = 'none';
        }
    }
    window._smItemsTotalVal = total;
}

window._smAddItem = _smAddItem;
window._smUpdateItem = _smUpdateItem;
window._smRemoveItem = _smRemoveItem;
window._smItemsRender = _smItemsRender;


// ═══════════════════════════════════════════════════════════
//  📊 STORE REPORT — تقرير المتجر
// ═══════════════════════════════════════════════════════════
window._smReportPeriod = 'today';

function _smRenderStoreReport(container) {
    if (!container) return;
    if (!window._smReportPeriod) window._smReportPeriod = 'today';

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">📊 تقرير المتجر</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">ملخص مبيعاتك اليومية</p>

        <div style="background:#f8f9fa; padding:12px; border-radius:10px; margin-bottom:15px;">
            <label style="display:block; font-size:13px; color:#555; margin-bottom:6px; font-weight:600;">📅 الفترة</label>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="_smSetReportPeriod('today', this)" class="sm-rpt-btn" data-p="today" style="padding:8px 14px; background:white; color:#333; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">اليوم</button>
                <button onclick="_smSetReportPeriod('week', this)" class="sm-rpt-btn" data-p="week" style="padding:8px 14px; background:white; color:#333; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">هذا الأسبوع</button>
                <button onclick="_smSetReportPeriod('month', this)" class="sm-rpt-btn" data-p="month" style="padding:8px 14px; background:white; color:#333; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">هذا الشهر</button>
                <button onclick="_smSetReportPeriod('all', this)" class="sm-rpt-btn" data-p="all" style="padding:8px 14px; background:white; color:#333; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">الكل</button>
            </div>
        </div>

        <div id="smReportStats"></div>
        <div id="smReportTop" style="margin-top:15px;"></div>
        <div id="smReportRecent" style="margin-top:15px;"></div>
    `;

    setTimeout(_smUpdateStoreReport, 100);
}

function _smSetReportPeriod(period, btn) {
    window._smReportPeriod = period;
    document.querySelectorAll('.sm-rpt-btn').forEach(b => {
        b.style.background = 'white';
        b.style.color = '#333';
        b.style.borderColor = '#ddd';
        b.style.fontWeight = '400';
    });
    if (btn) {
        btn.style.background = '#e67e22';
        btn.style.color = 'white';
        btn.style.borderColor = '#e67e22';
        btn.style.fontWeight = '600';
    }
    _smUpdateStoreReport();
}

function _smGetPeriodStart(period) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (period === 'today') return startOfDay;
    if (period === 'week') return startOfDay - (7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return 0;
}

function _smUpdateStoreReport() {
    const period = window._smReportPeriod || 'today';
    const since = _smGetPeriodStart(period);

    const allSales = (typeof window.sales !== 'undefined' && Array.isArray(window.sales)) ? window.sales : [];
    const filtered = allSales.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date).getTime();
        return d >= since;
    });

    const total = filtered.reduce((sum, s) => sum + (parseFloat(s.grandTotal) || parseFloat(s.total) || 0), 0);
    const count = filtered.length;
    const retail = filtered.filter(s => s.isRetail).length;
    const delivery = filtered.filter(s => s.source === 'delivery' || s.isDelivery).length;

    const productCounts = {};
    filtered.forEach(s => {
        (s.items || []).forEach(it => {
            const name = it.materialName || 'غير معروف';
            if (!productCounts[name]) productCounts[name] = { qty: 0, total: 0, unit: it.unit || '' };
            productCounts[name].qty += parseFloat(it.qty) || 0;
            productCounts[name].total += parseFloat(it.total) || 0;
        });
    });
    const top = Object.entries(productCounts).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

    // ─── الإحصائيات ───
    const statsHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:12px; padding:15px; text-align:center; box-shadow:0 3px 10px rgba(39,174,96,0.3);">
                <div style="font-size:24px; font-weight:bold;">${_afFmt(total)}</div>
                <div style="font-size:12px; opacity:0.9;">💰 إجمالي المبيعات</div>
            </div>
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:12px; padding:15px; text-align:center; box-shadow:0 3px 10px rgba(52,152,219,0.3);">
                <div style="font-size:24px; font-weight:bold;">${count}</div>
                <div style="font-size:12px; opacity:0.9;">📦 عدد الفواتير</div>
            </div>
            <div style="background:linear-gradient(135deg,#e67e22,#d35400); color:white; border-radius:12px; padding:15px; text-align:center; box-shadow:0 3px 10px rgba(230,126,34,0.3);">
                <div style="font-size:20px; font-weight:bold;">${retail}</div>
                <div style="font-size:12px; opacity:0.9;">🏪 مبيعات مفرق</div>
            </div>
            <div style="background:linear-gradient(135deg,#8e44ad,#6c3483); color:white; border-radius:12px; padding:15px; text-align:center; box-shadow:0 3px 10px rgba(142,68,173,0.3);">
                <div style="font-size:20px; font-weight:bold;">${delivery}</div>
                <div style="font-size:12px; opacity:0.9;">🛵 طلبات توصيل</div>
            </div>
        </div>
    `;

    // ─── الأكثر بيعاً ───
    let topHTML = '';
    if (top.length === 0) {
        topHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مبيعات في هذه الفترة</div>';
    } else {
        topHTML = '<h3 style="font-size:15px; color:#2c3e50; margin-bottom:10px;">🏆 الأكثر بيعاً</h3>';
        top.forEach(([name, data], i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
            topHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:${i < 3 ? '#fff8e1' : '#f8f9fa'}; border-radius:8px; margin-bottom:6px; border-right:3px solid ${i === 0 ? '#f39c12' : '#ddd'};">
                    <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                        <span style="font-weight:bold; font-size:14px;">${medal}</span>
                        <span style="font-size:13px; color:#2c3e50; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${_afEsc(name)}</span>
                    </div>
                    <div style="text-align:left; flex-shrink:0;">
                        <div style="font-size:12px; font-weight:bold; color:#27ae60;">× ${data.qty.toFixed(2)} ${_afEsc(data.unit || '')}</div>
                        <div style="font-size:10px; color:#999;">${_afFmt(data.total)}</div>
                    </div>
                </div>
            `;
        });
    }

    // ─── آخر الفواتير ───
    let recentHTML = '';
    const recent = filtered.slice(-5).reverse();
    if (recent.length > 0) {
        recentHTML = '<h3 style="font-size:15px; color:#2c3e50; margin-bottom:10px;">🕐 آخر الفواتير</h3>';
        recent.forEach(s => {
            const time = s.date || '';
            const inv = s.invoice || '—';
            const tot = parseFloat(s.grandTotal) || parseFloat(s.total) || 0;
            recentHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:#f8f9fa; border-radius:8px; margin-bottom:5px; font-size:12px;">
                    <span style="color:#3498db; font-weight:600;">📄 ${_afEsc(inv)}</span>
                    <span style="color:#666;">👤 ${_afEsc(s.customer || 'بيع مفرق')}</span>
                    <span style="color:#27ae60; font-weight:bold;">${_afFmt(tot)}</span>
                </div>
            `;
        });
    }

    const statsEl = document.getElementById('smReportStats');
    const topEl = document.getElementById('smReportTop');
    const recentEl = document.getElementById('smReportRecent');
    if (statsEl) statsEl.innerHTML = statsHTML;
    if (topEl) topEl.innerHTML = topHTML;
    if (recentEl) recentEl.innerHTML = recentHTML;

    // تمييز الزر النشط
    document.querySelectorAll('.sm-rpt-btn').forEach(b => {
        if (b.dataset.p === period) {
            b.style.background = '#e67e22';
            b.style.color = 'white';
            b.style.borderColor = '#e67e22';
            b.style.fontWeight = '600';
        } else {
            b.style.background = 'white';
            b.style.color = '#333';
            b.style.borderColor = '#ddd';
            b.style.fontWeight = '400';
        }
    });
}

window._smRenderStoreReport = _smRenderStoreReport;
window._smSetReportPeriod = _smSetReportPeriod;
window._smUpdateStoreReport = _smUpdateStoreReport;


// ═══════════════════════════════════════════════════════════
//  💰 PRICE LIST — قائمة أسعار الجملة
// ═══════════════════════════════════════════════════════════
window._smPriceListFilter = 'all';

function _smRenderPriceList(container) {
    if (!container) return;

    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const cats = [...new Set(mats.map(m => m.category).filter(Boolean))].sort();

    let catOptions = '<option value="all">🏷️ كل التصنيفات</option>';
    cats.forEach(c => {
        catOptions += `<option value="${_afEsc(c)}">${_afEsc(c)}</option>`;
    });

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">💰 قائمة أسعار الجملة</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">أسعار المفرق والجملة لكل مادة</p>

        <div style="background:#f8f9fa; padding:12px; border-radius:10px; margin-bottom:15px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                <select id="smPlCategory" onchange="_smUpdatePriceList()" style="padding:10px; border:1px solid #ddd; border-radius:8px; background:white; font-size:13px;">
                    ${catOptions}
                </select>
                <input type="text" id="smPlSearch" placeholder="🔍 بحث..." oninput="_smUpdatePriceList()" style="padding:10px; border:1px solid #ddd; border-radius:8px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                <button onclick="_smPriceListWhatsApp()" style="padding:11px 6px; background:linear-gradient(135deg,#25D366,#1da851); color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">📱 واتساب</button>
                <button onclick="_smPriceListPrint()" style="padding:11px 6px; background:linear-gradient(135deg,#34495e,#2c3e50); color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">🖨️ طباعة</button>
                <button onclick="_smPriceListCopy()" style="padding:11px 6px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">📋 نسخ</button>
            </div>
        </div>

        <div id="smPriceListTable"></div>
    `;

    setTimeout(_smUpdatePriceList, 100);
}

function _smGetFilteredPriceList() {
    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const cat = document.getElementById('smPlCategory')?.value || 'all';
    const q = (document.getElementById('smPlSearch')?.value || '').trim().toLowerCase();

    return mats.filter(m => {
        if (cat !== 'all' && m.category !== cat) return false;
        if (q) {
            const search = (m.name || '').toLowerCase() + ' ' + (m.category || '').toLowerCase();
            if (!search.includes(q)) return false;
        }
        return true;
    });
}

function _smUpdatePriceList() {
    const tableEl = document.getElementById('smPriceListTable');
    if (!tableEl) return;

    const mats = _smGetFilteredPriceList();

    if (mats.length === 0) {
        tableEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مواد مطابقة</div>';
        return;
    }

    let html = `
        <div style="background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                    <tr style="background:linear-gradient(135deg,#2c3e50,#34495e); color:white;">
                        <th style="padding:10px 8px; text-align:right;">المادة</th>
                        <th style="padding:10px 8px; text-align:center;">مفرق</th>
                        <th style="padding:10px 8px; text-align:center;">جملة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let lastCat = null;
    mats.forEach((m, i) => {
        if (m.category && m.category !== lastCat) {
            lastCat = m.category;
            html += `
                <tr style="background:#f0f7ff;">
                    <td colspan="3" style="padding:8px 12px; font-weight:bold; color:#3498db; font-size:12px; border-top:1px solid #e9ecef;">🏷️ ${_afEsc(m.category)}</td>
                </tr>
            `;
        }
        const bg = i % 2 === 0 ? 'white' : '#fafafa';
        const stockBadge = (m.stock || 0) <= 0 ? ' <span style="color:#e74c3c; font-size:10px;">(نفد)</span>' : '';
        const saleS = m.saleSYP || 0;
        const wholeS = m.wholesaleSYP || 0;

        html += `
            <tr style="background:${bg}; border-bottom:1px solid #f0f0f0;">
                <td style="padding:9px 10px; text-align:right;">${_afEsc(m.name || '—')}${stockBadge}</td>
                <td style="padding:9px 6px; text-align:center; color:#27ae60; font-weight:600;">${saleS > 0 ? _afFmt(saleS) : '—'}</td>
                <td style="padding:9px 6px; text-align:center; color:#e67e22; font-weight:600;">${wholeS > 0 ? _afFmt(wholeS) : '—'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div style="text-align:center; padding:12px; color:#666; font-size:12px; margin-top:10px;">
            📊 إجمالي: <b style="color:#3498db;">${mats.length}</b> مادة
        </div>
    `;

    tableEl.innerHTML = html;
}

function _smBuildPriceListText() {
    const mats = _smGetFilteredPriceList();
    if (mats.length === 0) return '';

    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'متجرنا';
    const d = new Date();
    const ds = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();

    const lines = [];
    lines.push('💰 *قائمة أسعار الجملة*');
    lines.push('📅 ' + ds);
    lines.push('🏪 ' + bizName);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');

    let currentCat = null;
    mats.forEach(m => {
        if (m.category && m.category !== currentCat) {
            currentCat = m.category;
            lines.push('');
            lines.push('*🏷️ ' + currentCat + '*');
        }
        const saleS = m.saleSYP || 0;
        const wholeS = m.wholesaleSYP || 0;
        let line = '▪️ ' + (m.name || '—');
        if (saleS > 0) line += '  |  💰 ' + saleS.toLocaleString('ar-SY');
        if (wholeS > 0) line += '  →  🏷️ ' + wholeS.toLocaleString('ar-SY');
        lines.push(line);
    });

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('📍 للاستفسار: ' + (biz.phone || '—'));
    return lines.join('\n');
}

function _smPriceListWhatsApp() {
    const text = _smBuildPriceListText();
    if (!text) { alert('⚠️ لا توجد مواد'); return; }
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
}

function _smPriceListCopy() {
    const text = _smBuildPriceListText();
    if (!text) { alert('⚠️ لا توجد مواد'); return; }
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            if (typeof toast === 'function') toast('✅ تم النسخ', 'success');
            else alert('✅ تم النسخ');
        }).catch(() => _smPriceListFallbackCopy(text));
    } else {
        _smPriceListFallbackCopy(text);
    }
}

function _smPriceListFallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); alert('✅ تم النسخ'); } catch(e) { alert('❌ فشل'); }
    document.body.removeChild(ta);
}

function _smPriceListPrint() {
    const mats = _smGetFilteredPriceList();
    if (mats.length === 0) { alert('⚠️ لا توجد مواد'); return; }

    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'متجرنا';
    const d = new Date();
    const ds = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();

    let html = `
        <div style="font-family:Tahoma,Arial,sans-serif; direction:rtl; padding:20px; max-width:800px; margin:0 auto;">
            <div style="text-align:center; margin-bottom:20px; padding-bottom:15px; border-bottom:3px solid #e67e22;">
                <h1 style="margin:0; color:#2c3e50; font-size:22px;">🏪 ${bizName}</h1>
                <div style="margin-top:5px; color:#666; font-size:14px;">💰 قائمة أسعار الجملة — ${ds}</div>
                ${biz.phone ? `<div style="margin-top:3px; color:#666; font-size:12px;">📞 ${biz.phone}</div>` : ''}
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                    <tr style="background:#2c3e50; color:white;">
                        <th style="padding:10px; text-align:right; border:1px solid #34495e;">المادة</th>
                        <th style="padding:10px; text-align:center; border:1px solid #34495e;">سعر المفرق</th>
                        <th style="padding:10px; text-align:center; border:1px solid #34495e;">سعر الجملة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let lastCat = null;
    mats.forEach((m, i) => {
        if (m.category && m.category !== lastCat) {
            lastCat = m.category;
            html += `<tr><td colspan="3" style="padding:6px 10px; background:#f0f7ff; color:#3498db; font-weight:bold; border:1px solid #ddd;">🏷️ ${_afEsc(m.category)}</td></tr>`;
        }
        const bg = i % 2 === 0 ? 'white' : '#fafafa';
        html += `
            <tr style="background:${bg};">
                <td style="padding:8px 10px; text-align:right; border:1px solid #ddd;">${_afEsc(m.name)}</td>
                <td style="padding:8px 10px; text-align:center; border:1px solid #ddd; color:#27ae60;">${m.saleSYP ? _afFmt(m.saleSYP) : '—'}</td>
                <td style="padding:8px 10px; text-align:center; border:1px solid #ddd; color:#e67e22; font-weight:bold;">${m.wholesaleSYP ? _afFmt(m.wholesaleSYP) : '—'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="text-align:center; margin-top:15px; padding-top:12px; border-top:1px solid #ddd; color:#999; font-size:11px;">
                📊 ${mats.length} مادة — تم الإنشاء بواسطة المدير AI
            </div>
        </div>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('⚠️ الرجاء السماح بالنوافذ المنبثقة'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
}

window._smRenderPriceList = _smRenderPriceList;
window._smUpdatePriceList = _smUpdatePriceList;
window._smPriceListWhatsApp = _smPriceListWhatsApp;
window._smPriceListCopy = _smPriceListCopy;
window._smPriceListPrint = _smPriceListPrint;


// ═══════════════════════════════════════════════════════════
//  🏷️ QUICK CATEGORIES — التصنيفات السريعة
// ═══════════════════════════════════════════════════════════
window._smCategoryOpen = null;

function _smRenderCategories(container) {
    if (!container) return;
    window._smCategoryOpen = null;

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">🏷️ التصنيفات السريعة</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">تصفح المواد حسب التصنيف</p>
        <div id="smCatStats" style="margin-bottom:15px;"></div>
        <div id="smCatGrid"></div>
        <div id="smCatDetail" style="margin-top:15px;"></div>
    `;

    setTimeout(_smUpdateCategories, 100);
}

function _smUpdateCategories() {
    const gridEl = document.getElementById('smCatGrid');
    const statsEl = document.getElementById('smCatStats');
    const detailEl = document.getElementById('smCatDetail');
    if (!gridEl) return;

    if (window._smCategoryOpen) {
        _smRenderCategoryDetail(window._smCategoryOpen);
        if (statsEl) statsEl.innerHTML = '';
        gridEl.innerHTML = '';
        return;
    }

    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];

    if (mats.length === 0) {
        gridEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مواد بعد</div>';
        return;
    }

    const cats = {};
    mats.forEach(m => {
        const c = m.category || '— بدون تصنيف —';
        if (!cats[c]) cats[c] = { count: 0, totalStock: 0, lowStock: 0 };
        cats[c].count++;
        cats[c].totalStock += parseFloat(m.stock) || 0;
        if ((parseFloat(m.stock) || 0) <= (parseFloat(m.minStock) || 0)) cats[c].lowStock++;
    });

    const catList = Object.entries(cats).sort((a, b) => b[1].count - a[1].count);

    let statsHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:22px; font-weight:bold;">${mats.length}</div>
                <div style="font-size:11px; opacity:0.9;">📦 إجمالي المواد</div>
            </div>
            <div style="background:linear-gradient(135deg,#8e44ad,#6c3483); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:22px; font-weight:bold;">${catList.length}</div>
                <div style="font-size:11px; opacity:0.9;">🏷️ تصنيفات</div>
            </div>
        </div>
    `;
    if (statsEl) statsEl.innerHTML = statsHTML;

    let html = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">';
    catList.forEach(([name, data]) => {
        const isEmpty = data.count === 0;
        const hasLow = data.lowStock > 0;
        const bg = hasLow ? 'linear-gradient(135deg,#fff3cd,#ffe5b4)' : 'white';
        const border = hasLow ? '#f39c12' : '#e9ecef';

        html += `
            <button onclick="_smOpenCategory('${_afEsc(name).replace(/'/g, '&apos;')}')" style="text-align:right; padding:15px; background:${bg}; border:2px solid ${border}; border-radius:12px; cursor:pointer; font-family:inherit; box-shadow:0 2px 6px rgba(0,0,0,0.04); transition:all 0.2s;">
                <div style="font-size:22px; margin-bottom:5px;">${_smCatIcon(name)}</div>
                <div style="font-weight:bold; color:#2c3e50; font-size:14px; margin-bottom:4px;">${_afEsc(name)}</div>
                <div style="font-size:12px; color:#666; display:flex; justify-content:space-between; align-items:center;">
                    <span>${data.count} مادة</span>
                    ${hasLow ? `<span style="color:#e67e22; font-size:10px;">⚠️ ${data.lowStock}</span>` : ''}
                </div>
            </button>
        `;
    });
    html += '</div>';

    gridEl.innerHTML = html;
    if (detailEl) detailEl.innerHTML = '';
}

function _smCatIcon(name) {
    const map = {
        'خضار وفواكه': '🥬', 'ألبان وأجبان': '🥛', 'مخبوزات': '🍞',
        'مشروبات': '🥤', 'حلويات وسكاكر': '🍫', 'معلبات': '🥫',
        'منظفات': '🧴', 'لحوم ودواجن': '🍖', 'أسماك': '🐟',
        'بيض': '🥚', 'مكسرات': '🥜', 'توابل وبهارات': '🧂',
        'مجمّدات': '❄️', 'مستلزمات منزلية': '🏠', 'أخرى': '📦'
    };
    return map[name] || '📦';
}

function _smOpenCategory(catName) {
    window._smCategoryOpen = catName;
    _smRenderCategoryDetail(catName);
}

function _smCloseCategory() {
    window._smCategoryOpen = null;
    _smUpdateCategories();
}

function _smRenderCategoryDetail(catName) {
    const detailEl = document.getElementById('smCatDetail');
    const gridEl = document.getElementById('smCatGrid');
    const statsEl = document.getElementById('smCatStats');
    if (!detailEl) return;

    if (gridEl) gridEl.innerHTML = '';
    if (statsEl) statsEl.innerHTML = '';

    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const items = mats.filter(m => (m.category || '— بدون تصنيف —') === catName);

    if (items.length === 0) {
        detailEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مواد في هذا التصنيف</div>';
        return;
    }

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <button onclick="_smCloseCategory()" style="padding:8px 14px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">← رجوع</button>
            <h3 style="margin:0; font-size:16px; color:#2c3e50;">${_smCatIcon(catName)} ${_afEsc(catName)} (${items.length})</h3>
        </div>
        <div style="display:grid; gap:8px;">
    `;

    items.forEach(m => {
        const stock = parseFloat(m.stock) || 0;
        const minS = parseFloat(m.minStock) || 0;
        const isLow = stock <= minS;
        const isEmpty = stock <= 0;
        const badge = isEmpty ? '<span style="background:#e74c3c; color:white; padding:2px 8px; border-radius:10px; font-size:10px;">نفد</span>' :
                      isLow ? `<span style="background:#f39c12; color:white; padding:2px 8px; border-radius:10px; font-size:10px;">⚠️ منخفض</span>` :
                      '<span style="background:#27ae60; color:white; padding:2px 8px; border-radius:10px; font-size:10px;">متوفر</span>';

        html += `
            <div style="background:white; padding:12px 14px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; border-right:3px solid ${isEmpty ? '#e74c3c' : isLow ? '#f39c12' : '#27ae60'};">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afEsc(m.name)}</div>
                    <div style="font-size:11px; color:#666; margin-top:3px;">
                        📦 ${stock} ${_afEsc(m.unit || '')}
                        ${m.saleSYP ? ' • 💰 ' + _afFmt(m.saleSYP) : ''}
                    </div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    ${badge}
                    <button onclick="if(typeof openPage==='function'){openPage('sales'); setTimeout(()=>{const s=document.getElementById('saleMaterial');if(s){s.value='${m.id}';if(typeof updateMaterialSelect==='function')updateMaterialSelect();if(typeof calcTotal==='function')calcTotal();}},500);}" style="padding:6px 10px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;" title="بيع سريع">🛒</button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    detailEl.innerHTML = html;
}

window._smRenderCategories = _smRenderCategories;
window._smOpenCategory = _smOpenCategory;
window._smCloseCategory = _smCloseCategory;
window._smUpdateCategories = _smUpdateCategories;


// ═══════════════════════════════════════════════════════════
//  💰 CASHIER — كاشير يومي
// ═══════════════════════════════════════════════════════════

async function _smRenderCashier(container) {
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>';

    const today = new Date().toISOString().slice(0, 10);
    const docId = 'cashier-' + today;

    let record = null;
    try {
        if (typeof currentUser !== 'undefined' && currentUser?.uid && typeof db !== 'undefined') {
            const doc = await db.collection('users').doc(_getEffectiveUid())
                .collection('cashier').doc(docId).get();
            if (doc.exists) record = doc.data();
        }
    } catch(e) {
        console.warn('[cashier] load:', e.message);
    }

    if (!record) {
        _smRenderCashierStart(container, today);
    } else if (record.status === 'open') {
        await _smRenderCashierOpen(container, record, docId);
    } else {
        await _smRenderCashierClosed(container, record, docId);
    }
}

function _smRenderCashierStart(container, today) {
    const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) ? _pbCache : [];
    const total = boxes.reduce((s, b) => s + (parseFloat(b.balance) || 0), 0);

    let boxList = '';
    if (boxes.length === 0) {
        boxList = '<div style="text-align:center; padding:15px; color:#999; background:#f8f9fa; border-radius:8px;">لا توجد صناديق — أنشئ صندوقاً أولاً</div>';
    } else {
        boxList = boxes.map(b => `
            <div style="display:flex; justify-content:space-between; padding:8px 12px; background:#f8f9fa; border-radius:6px; margin-bottom:4px; font-size:13px;">
                <span>${b.icon || '💰'} ${_afEsc(b.name || '—')}</span>
                <span style="font-weight:bold; color:#27ae60;">${_afFmt(b.balance || 0)}</span>
            </div>
        `).join('');
    }

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">💰 كاشير يومي</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">${today}</p>

        <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:12px; padding:20px; text-align:center; margin-bottom:15px; box-shadow:0 4px 14px rgba(52,152,219,0.3);">
            <div style="font-size:12px; opacity:0.9; margin-bottom:6px;">💰 الرصيد الافتتاحي المتوقع</div>
            <div style="font-size:32px; font-weight:bold;">${_afFmt(total)}</div>
            <div style="font-size:11px; opacity:0.85; margin-top:6px;">(مجموع كل الصناديق)</div>
        </div>

        <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:15px;">
            <div style="font-size:13px; color:#555; font-weight:600; margin-bottom:8px;">🏦 تفاصيل الصناديق</div>
            ${boxList}
        </div>

        <button onclick="_smOpenDay('${today}')" style="width:100%; padding:15px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 3px 10px rgba(39,174,96,0.3);">
            ☀️ بدء اليوم
        </button>
    `;
}

async function _smRenderCashierOpen(container, record, docId) {
    const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) ? _pbCache : [];
    const currentTotal = boxes.reduce((s, b) => s + (parseFloat(b.balance) || 0), 0);
    const openingTotal = record.openingTotal || 0;
    const diff = currentTotal - openingTotal;

    const openedAt = record.openedAt ? new Date(record.openedAt) : null;
    const timeStr = openedAt ? openedAt.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '—';

    let boxList = '';
    boxes.forEach(b => {
        const opening = (record.openingBoxes || []).find(x => x.id === b.id);
        const openingBal = opening ? (opening.balance || 0) : 0;
        const change = (b.balance || 0) - openingBal;
        const changeColor = change > 0 ? '#27ae60' : change < 0 ? '#e74c3c' : '#666';
        const changeSign = change > 0 ? '+' : '';
        boxList += `
            <div style="padding:10px 12px; background:#f8f9fa; border-radius:8px; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px; font-weight:600;">${b.icon || '💰'} ${_afEsc(b.name || '—')}</span>
                    <span style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afFmt(b.balance || 0)}</span>
                </div>
                <div style="font-size:11px; color:${changeColor}; margin-top:4px; text-align:left;">
                    الافتتاحي: ${_afFmt(openingBal)} • التغيير: ${changeSign}${_afFmt(change)}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">💰 كاشير يومي</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">🟢 اليوم مفتوح — فُتح الساعة ${timeStr}</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:12px; padding:14px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">💰 الرصيد الافتتاحي</div>
                <div style="font-size:18px; font-weight:bold; margin-top:4px;">${_afFmt(openingTotal)}</div>
            </div>
            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:12px; padding:14px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">💰 الرصيد الحالي</div>
                <div style="font-size:18px; font-weight:bold; margin-top:4px;">${_afFmt(currentTotal)}</div>
            </div>
        </div>

        <div style="background:${diff >= 0 ? '#e8f5e9' : '#fdecea'}; border-radius:10px; padding:14px; text-align:center; margin-bottom:15px; border-right:4px solid ${diff >= 0 ? '#27ae60' : '#e74c3c'};">
            <div style="font-size:12px; color:#666;">📊 حركة اليوم</div>
            <div style="font-size:22px; font-weight:bold; color:${diff >= 0 ? '#27ae60' : '#e74c3c'}; margin-top:4px;">${diff >= 0 ? '+' : ''}${_afFmt(diff)}</div>
        </div>

        <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:15px;">
            <div style="font-size:13px; color:#555; font-weight:600; margin-bottom:8px;">🏦 تفاصيل الصناديق</div>
            ${boxList}
        </div>

        <button onclick="_smCloseDay('${docId}')" style="width:100%; padding:15px; background:linear-gradient(135deg,#e67e22,#d35400); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 3px 10px rgba(230,126,34,0.3);">
            🌙 إغلاق اليوم
        </button>
    `;
}

async function _smRenderCashierClosed(container, record, docId) {
    const diff = record.difference || 0;
    const diffColor = Math.abs(diff) < 100 ? '#27ae60' : diff > 0 ? '#3498db' : '#e74c3c';
    const diffLabel = Math.abs(diff) < 100 ? '✅ مطابق' : diff > 0 ? '📈 زيادة' : '📉 نقص';

    const closedAt = record.closedAt ? new Date(record.closedAt) : null;
    const timeStr = closedAt ? closedAt.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '—';

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">💰 كاشير يومي</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">✅ اليوم مغلق — ${timeStr}</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:12px; padding:14px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">📊 المتوقع</div>
                <div style="font-size:18px; font-weight:bold; margin-top:4px;">${_afFmt(record.expectedClosing || 0)}</div>
            </div>
            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:12px; padding:14px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">💵 الفعلي</div>
                <div style="font-size:18px; font-weight:bold; margin-top:4px;">${_afFmt(record.actualClosing || 0)}</div>
            </div>
        </div>

        <div style="background:${diffColor}1A; border:2px solid ${diffColor}; border-radius:10px; padding:14px; text-align:center; margin-bottom:15px;">
            <div style="font-size:12px; color:#666;">${diffLabel}</div>
            <div style="font-size:26px; font-weight:bold; color:${diffColor}; margin-top:4px;">${diff >= 0 ? '+' : ''}${_afFmt(diff)}</div>
        </div>

        <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:15px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; padding:5px 0;">
                <span style="color:#666;">💰 الرصيد الافتتاحي:</span>
                <span style="font-weight:600;">${_afFmt(record.openingTotal || 0)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-top:1px dashed #ddd;">
                <span style="color:#666;">📊 المتوقع:</span>
                <span style="font-weight:600;">${_afFmt(record.expectedClosing || 0)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-top:1px dashed #ddd;">
                <span style="color:#666;">💵 الفعلي:</span>
                <span style="font-weight:600;">${_afFmt(record.actualClosing || 0)}</span>
            </div>
        </div>

        ${record.notes ? `
        <div style="background:#fff8e1; border-radius:10px; padding:12px; margin-bottom:15px; font-size:12px;">
            <div style="color:#666; margin-bottom:4px;">📝 ملاحظات:</div>
            <div style="color:#2c3e50;">${_afEsc(record.notes)}</div>
        </div>` : ''}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <button onclick="_smReopenDay('${docId}')" style="padding:12px; background:#f39c12; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">
                🔄 إعادة فتح
            </button>
            <button onclick="_smPrintCashierReport('${docId}')" style="padding:12px; background:#34495e; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">
                🖨️ طباعة
            </button>
        </div>
    `;
}

async function _smOpenDay(today) {
    const ok = confirm('☀️ بدء اليوم؟\n\nسيتم تسجيل الرصيد الحالي كرصيد افتتاحي لليوم.');
    if (!ok) return;

    const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) ? _pbCache : [];
    const total = boxes.reduce((s, b) => s + (parseFloat(b.balance) || 0), 0);
    const docId = 'cashier-' + today;

    const record = {
        date: today,
        openedAt: Date.now(),
        openingTotal: total,
        openingBoxes: boxes.map(b => ({ id: b.id, name: b.name, balance: parseFloat(b.balance) || 0 })),
        status: 'open'
    };

    try {
        await db.collection('users').doc(_getEffectiveUid()).collection('cashier').doc(docId).set(record);
        if (typeof toast === 'function') toast('✅ تم بدء اليوم', 'success');
        else alert('✅ تم بدء اليوم');
        setTimeout(() => _smRenderCashier(document.getElementById('smCashier') || document.querySelector('[id$="cashier"]') || document.getElementById('activity-supermarket-cashier')), 100);
        // re-render
        _smRefreshCashier();
    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _smCloseDay(docId) {
    const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) ? _pbCache : [];
    const expected = boxes.reduce((s, b) => s + (parseFloat(b.balance) || 0), 0);

    const input = prompt(
        '🌙 إغلاق اليوم\n\n' +
        '📊 المتوقع: ' + _afFmt(expected) + ' ل.س\n\n' +
        '💵 أدخل المبلغ الفعلي الذي عددته:',
        String(Math.round(expected))
    );
    if (input === null) return;

    const actual = parseFloat(input);
    if (isNaN(actual)) {
        alert('⚠️ الرجاء إدخال رقم صحيح');
        return;
    }

    const notes = prompt('📝 ملاحظات (اختياري):\n(سبب الفرق إن وُجد)', '');
    const diff = actual - expected;

    try {
        await db.collection('users').doc(_getEffectiveUid()).collection('cashier').doc(docId).update({
            closedAt: Date.now(),
            expectedClosing: expected,
            actualClosing: actual,
            difference: diff,
            status: 'closed',
            notes: notes || '',
            closingBoxes: boxes.map(b => ({ id: b.id, name: b.name, balance: parseFloat(b.balance) || 0 }))
        });

        if (typeof toast === 'function') {
            const msg = Math.abs(diff) < 100 ? '✅ مطابق' : (diff > 0 ? '📈 زيادة ' + _afFmt(diff) : '📉 نقص ' + _afFmt(Math.abs(diff)));
            toast('تم الإغلاق — ' + msg, diff >= 0 ? 'success' : 'error');
        } else {
            alert('✅ تم إغلاق اليوم\nالفرق: ' + (diff >= 0 ? '+' : '') + _afFmt(diff));
        }

        _smRefreshCashier();
    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _smReopenDay(docId) {
    if (!confirm('🔄 إعادة فتح اليوم؟\n\nسيُحذف الإغلاق السابق.')) return;

    try {
        await db.collection('users').doc(_getEffectiveUid()).collection('cashier').doc(docId).update({
            closedAt: null,
            expectedClosing: null,
            actualClosing: null,
            difference: null,
            status: 'open',
            notes: ''
        });
        _smRefreshCashier();
    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

function _smRefreshCashier() {
    const container = document.getElementById('activity-supermarket-cashier');
    if (container) {
        _smRenderCashier(container);
    }
}

async function _smPrintCashierReport(docId) {
    try {
        const doc = await db.collection('users').doc(_getEffectiveUid()).collection('cashier').doc(docId).get();
        if (!doc.exists) { alert('⚠️ لم يُجد'); return; }

        const r = doc.data();
        const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
        const bizName = biz.businessName || 'متجرنا';
        const diff = r.difference || 0;
        const diffLabel = Math.abs(diff) < 100 ? '✅ مطابق' : diff > 0 ? '📈 زيادة' : '📉 نقص';
        const diffColor = Math.abs(diff) < 100 ? '#27ae60' : diff > 0 ? '#3498db' : '#e74c3c';

        let boxesHtml = '';
        (r.openingBoxes || []).forEach(b => {
            const closing = (r.closingBoxes || []).find(x => x.id === b.id);
            const cb = closing ? (closing.balance || 0) : 0;
            const change = cb - (b.balance || 0);
            boxesHtml += `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">${_afEsc(b.name)}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${_afFmt(b.balance)}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${_afFmt(cb)}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center; color:${change >= 0 ? '#27ae60' : '#e74c3c'}; font-weight:bold;">${change >= 0 ? '+' : ''}${_afFmt(change)}</td>
                </tr>
            `;
        });

        const html = `
            <div style="font-family:Tahoma,Arial,sans-serif; direction:rtl; padding:20px; max-width:700px; margin:0 auto;">
                <div style="text-align:center; padding-bottom:15px; border-bottom:3px solid #e67e22; margin-bottom:15px;">
                    <h1 style="margin:0; color:#2c3e50; font-size:22px;">🏪 ${bizName}</h1>
                    <div style="margin-top:6px; color:#666; font-size:15px;">💰 تقرير كاشير يومي</div>
                    <div style="color:#666; font-size:13px;">📅 ${r.date}</div>
                </div>

                <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
                    <tr style="background:#2c3e50; color:white;">
                        <th style="padding:10px; text-align:right; border:1px solid #34495e;">الصندوق</th>
                        <th style="padding:10px; text-align:center; border:1px solid #34495e;">الافتتاحي</th>
                        <th style="padding:10px; text-align:center; border:1px solid #34495e;">الختامي</th>
                        <th style="padding:10px; text-align:center; border:1px solid #34495e;">التغيير</th>
                    </tr>
                    ${boxesHtml}
                </table>

                <div style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
                        <span>💰 الرصيد الافتتاحي:</span>
                        <span style="font-weight:bold;">${_afFmt(r.openingTotal || 0)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px; border-top:1px dashed #ccc;">
                        <span>📊 المتوقع:</span>
                        <span style="font-weight:bold;">${_afFmt(r.expectedClosing || 0)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px; border-top:1px dashed #ccc;">
                        <span>💵 الفعلي:</span>
                        <span style="font-weight:bold;">${_afFmt(r.actualClosing || 0)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:10px 0; margin-top:8px; border-top:2px solid ${diffColor}; font-size:16px;">
                        <span style="color:${diffColor}; font-weight:bold;">${diffLabel}:</span>
                        <span style="color:${diffColor}; font-weight:bold;">${diff >= 0 ? '+' : ''}${_afFmt(diff)}</span>
                    </div>
                </div>

                ${r.notes ? `
                <div style="background:#fff8e1; padding:12px; border-radius:8px; margin-bottom:15px;">
                    <div style="font-weight:bold; margin-bottom:4px;">📝 ملاحظات:</div>
                    <div>${_afEsc(r.notes)}</div>
                </div>` : ''}

                <div style="text-align:center; padding-top:12px; border-top:1px solid #ddd; color:#999; font-size:11px;">
                    تم الإنشاء بواسطة المدير AI — ${new Date().toLocaleString('ar-SY')}
                </div>
            </div>
        `;

        const w = window.open('', '_blank');
        if (!w) { alert('⚠️ اسمح بالنوافذ المنبثقة'); return; }
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.focus(); w.print(); }, 500);

    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._smRenderCashier = _smRenderCashier;
window._smOpenDay = _smOpenDay;
window._smCloseDay = _smCloseDay;
window._smReopenDay = _smReopenDay;
window._smPrintCashierReport = _smPrintCashierReport;


// ═══════════════════════════════════════════════════════════
//  🏷️ PRICE TAGS — ملصقات الأسعار
// ═══════════════════════════════════════════════════════════

function _smRenderPriceTags(container) {
    if (!container) return;

    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const cats = [...new Set(mats.map(m => m.category).filter(Boolean))].sort();

    let catOptions = '<option value="all">🏷️ كل التصنيفات</option>';
    cats.forEach(c => {
        catOptions += `<option value="${_afEsc(c)}">${_afEsc(c)}</option>`;
    });

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">🏷️ ملصقات الأسعار</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">طباعة ملصقات جاهزة للرفوف (A4)</p>

        <div style="background:#f8f9fa; padding:12px; border-radius:10px; margin-bottom:15px;">

            <div style="margin-bottom:10px;">
                <label style="display:block; font-size:12px; color:#555; font-weight:600; margin-bottom:5px;">🔍 اختيار المواد</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                    <select id="smTagCategory" onchange="_smUpdateTagsPreview()" style="padding:10px; border:1px solid #ddd; border-radius:8px; background:white; font-size:13px;">
                        ${catOptions}
                    </select>
                    <input type="text" id="smTagSearch" placeholder="🔍 بحث..." oninput="_smUpdateTagsPreview()" style="padding:10px; border:1px solid #ddd; border-radius:8px; font-size:13px;">
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <label style="display:block; font-size:12px; color:#555; font-weight:600; margin-bottom:5px;">📐 حجم الملصق</label>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                    <label style="padding:9px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:12px;">
                        <input type="radio" name="smTagSize" value="small" onchange="_smUpdateTagsPreview()"> صغير
                        <div style="font-size:10px; color:#999;">30/A4</div>
                    </label>
                    <label style="padding:9px; background:#fff8f0; border:2px solid #e67e22; border-radius:8px; text-align:center; cursor:pointer; font-size:12px;" id="smTagMedLabel">
                        <input type="radio" name="smTagSize" value="medium" checked onchange="_smUpdateTagsPreview()"> متوسط
                        <div style="font-size:10px; color:#999;">20/A4</div>
                    </label>
                    <label style="padding:9px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:12px;">
                        <input type="radio" name="smTagSize" value="large" onchange="_smUpdateTagsPreview()"> كبير
                        <div style="font-size:10px; color:#999;">12/A4</div>
                    </label>
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <label style="display:block; font-size:12px; color:#555; font-weight:600; margin-bottom:5px;">💰 نوع السعر</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                    <label style="padding:9px; background:#fff8f0; border:2px solid #e67e22; border-radius:8px; text-align:center; cursor:pointer; font-size:12px;" id="smTagRetailLabel">
                        <input type="radio" name="smTagType" value="retail" checked onchange="_smUpdateTagsPreview()"> 💰 مفرق
                    </label>
                    <label style="padding:9px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:12px;" id="smTagWholesaleLabel">
                        <input type="radio" name="smTagType" value="wholesale" onchange="_smUpdateTagsPreview()"> 🏷️ جملة
                    </label>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <label style="display:block; font-size:12px; color:#555; font-weight:600; margin-bottom:5px;">📄 عدد النسخ لكل مادة</label>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:6px;">
                    <label style="padding:9px; background:#fff8f0; border:2px solid #e67e22; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:600;" id="smTagCopy1Label">
                        <input type="radio" name="smTagCopies" value="1" checked onchange="_smUpdateTagsPreview()"> 1×
                    </label>
                    <label style="padding:9px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:600;" id="smTagCopy2Label">
                        <input type="radio" name="smTagCopies" value="2" onchange="_smUpdateTagsPreview()"> 2×
                    </label>
                    <label style="padding:9px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:600;" id="smTagCopy3Label">
                        <input type="radio" name="smTagCopies" value="3" onchange="_smUpdateTagsPreview()"> 3×
                    </label>
                    <label style="padding:9px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:600;" id="smTagCopy4Label">
                        <input type="radio" name="smTagCopies" value="4" onchange="_smUpdateTagsPreview()"> 4×
                    </label>
                </div>
            </div>

            <button onclick="_smPrintPriceTags()" style="width:100%; padding:13px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 3px 10px rgba(39,174,96,0.3);">
                🖨️ طباعة الملصقات
            </button>

            <div id="smTagsSummary" style="text-align:center; margin-top:10px; font-size:12px; color:#666; font-weight:600;"></div>
        </div>

        <div id="smTagsPreview"></div>
    `;

    setTimeout(_smUpdateTagsPreview, 100);
}

function _smGetFilteredTagsMats() {
    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const cat = document.getElementById('smTagCategory')?.value || 'all';
    const q = (document.getElementById('smTagSearch')?.value || '').trim().toLowerCase();

    return mats.filter(m => {
        if (cat !== 'all' && m.category !== cat) return false;
        if (q) {
            const search = (m.name || '').toLowerCase() + ' ' + (m.category || '').toLowerCase();
            if (!search.includes(q)) return false;
        }
        return true;
    });
}

function _smGetTagSettings() {
    const sizeEl = document.querySelector('input[name="smTagSize"]:checked');
    const typeEl = document.querySelector('input[name="smTagType"]:checked');
    const copiesEl = document.querySelector('input[name="smTagCopies"]:checked');
    return {
        size: sizeEl ? sizeEl.value : 'medium',
        type: typeEl ? typeEl.value : 'retail',
        copies: copiesEl ? parseInt(copiesEl.value) : 1
    };
}

function _smUpdateTagsPreview() {
    const mats = _smGetFilteredTagsMats();
    const s = _smGetTagSettings();

    // تحديث ألوان الراديو
    _smUpdateRadioColors();

    const summary = document.getElementById('smTagsSummary');
    if (summary) {
        const perPage = s.size === 'small' ? 30 : s.size === 'large' ? 12 : 20;
        const totalStickers = mats.length * s.copies;
        const pages = Math.ceil(totalStickers / perPage);
        summary.innerHTML = '📊 <b>' + mats.length + '</b> مادة × <b>' + s.copies + '</b> نسخة = <b>' + totalStickers + '</b> ملصق • <b>' + pages + '</b> صفحة A4';
    }

    const previewEl = document.getElementById('smTagsPreview');
    if (!previewEl) return;

    if (mats.length === 0) {
        previewEl.innerHTML = '<div style="text-align:center; padding:20px; color:#999; background:#f8f9fa; border-radius:8px;">لا توجد مواد مطابقة</div>';
        return;
    }

    // معاينة أول 6 ملصقات
    const samples = mats.slice(0, 6);
    let html = '<div style="font-size:12px; color:#666; margin-bottom:8px; font-weight:600;">👁️ معاينة (أول 6):</div>';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">';

    samples.forEach(m => {
        const price = s.type === 'wholesale' ? (m.wholesaleSYP || 0) : (m.saleSYP || 0);
        const typeLabel = s.type === 'wholesale' ? 'جملة' : 'مفرق';
        const typeColor = s.type === 'wholesale' ? '#e67e22' : '#27ae60';
        html += `
            <div style="border:2px solid #34495e; border-radius:8px; padding:8px 6px; background:white; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size:11px; font-weight:bold; color:#2c3e50; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${_afEsc(m.name || '—')}</div>
                <div style="border-top:1px dashed #ddd; margin:4px 0;"></div>
                <div style="font-size:15px; font-weight:bold; color:${typeColor};">${_afFmt(price)}</div>
                <div style="font-size:9px; color:${typeColor}; font-weight:600;">ل.س ${typeLabel}</div>
            </div>
        `;
    });

    html += '</div>';
    previewEl.innerHTML = html;
}

function _smUpdateRadioColors() {
    // حجم الملصق
    ['small', 'medium', 'large'].forEach(v => {
        const lbl = document.getElementById('smTag' + v.charAt(0).toUpperCase() + v.slice(1) + 'Label');
        if (!lbl) return;
        const checked = document.querySelector('input[name="smTagSize"][value="' + v + '"]')?.checked;
        lbl.style.background = checked ? '#fff8f0' : 'white';
        lbl.style.borderColor = checked ? '#e67e22' : '#ddd';
    });
    // نوع السعر
    ['retail', 'wholesale'].forEach(v => {
        const lbl = document.getElementById('smTag' + v.charAt(0).toUpperCase() + v.slice(1) + 'Label');
        if (!lbl) return;
        const checked = document.querySelector('input[name="smTagType"][value="' + v + '"]')?.checked;
        lbl.style.background = checked ? '#fff8f0' : 'white';
        lbl.style.borderColor = checked ? '#e67e22' : '#ddd';
    });
    // عدد النسخ
    ['1', '2', '3', '4'].forEach(v => {
        const lbl = document.getElementById('smTagCopy' + v + 'Label');
        if (!lbl) return;
        const checked = document.querySelector('input[name="smTagCopies"][value="' + v + '"]')?.checked;
        lbl.style.background = checked ? '#fff8f0' : 'white';
        lbl.style.borderColor = checked ? '#e67e22' : '#ddd';
    });
}

function _smPrintPriceTags() {
    const mats = _smGetFilteredTagsMats();
    const s = _smGetTagSettings();

    if (mats.length === 0) {
        alert('⚠️ لا توجد مواد');
        return;
    }

    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'متجرنا';

    // تكرار المواد حسب عدد النسخ
    let allStickers = [];
    mats.forEach(m => {
        for (let i = 0; i < s.copies; i++) {
            allStickers.push(m);
        }
    });

    // إعدادات الحجم
    const sizeConf = {
        small: { cols: 5, perPage: 30, w: 38, h: 42, nameFs: 11, priceFs: 18, unitFs: 9, bizFs: 8 },
        medium: { cols: 4, perPage: 20, w: 48, h: 52, nameFs: 13, priceFs: 22, unitFs: 10, bizFs: 9 },
        large: { cols: 3, perPage: 12, w: 63, h: 68, nameFs: 15, priceFs: 28, unitFs: 11, bizFs: 10 }
    };
    const conf = sizeConf[s.size] || sizeConf.medium;

    const typeLabel = s.type === 'wholesale' ? 'جملة' : 'مفرق';
    const typeColor = s.type === 'wholesale' ? '#c0392b' : '#1e8449';
    const typeBg = s.type === 'wholesale' ? '#fdecea' : '#e8f5e9';

    let stickersHtml = '';
    allStickers.forEach(m => {
        const price = s.type === 'wholesale' ? (m.wholesaleSYP || 0) : (m.saleSYP || 0);
        stickersHtml += `
            <div class="sticker" style="
                width:${conf.w}mm;
                height:${conf.h}mm;
                padding:2mm;
                box-sizing:border-box;
                display:flex;
                flex-direction:column;
                justify-content:space-between;
                border:1px dashed #bbb;
                border-radius:3mm;
                background:white;
                overflow:hidden;
                page-break-inside:avoid;
            ">
                <div style="text-align:center; padding:1mm 1mm 0 1mm;">
                    <div style="font-size:${conf.bizFs}pt; color:#7f8c8d; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${_afEsc(bizName)}</div>
                    <div style="border-top:1px solid #ddd; margin:1mm 0;"></div>
                    <div style="font-size:${conf.nameFs}pt; color:#2c3e50; font-weight:bold; line-height:1.1; min-height:${conf.nameFs * 1.2}pt; max-height:${conf.nameFs * 2.4}pt; overflow:hidden;">${_afEsc(m.name || '—')}</div>
                </div>
                <div style="text-align:center; padding:0 1mm;">
                    <div style="font-size:${conf.priceFs}pt; font-weight:bold; color:${typeColor}; line-height:1;">${_afFormatNumberForTag(price)}</div>
                    <div style="display:inline-block; font-size:${conf.unitFs}pt; font-weight:bold; color:${typeColor}; background:${typeBg}; padding:0.5mm 2mm; border-radius:2mm; margin-top:0.5mm;">ل.س ${typeLabel}</div>
                </div>
                <div style="text-align:center; font-size:${conf.bizFs}pt; color:#95a5a6;">${new Date().toLocaleDateString('ar-SY')}</div>
            </div>
        `;
    });

    const printHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>ملصقات الأسعار</title>
            <style>
                @page { size: A4; margin: 8mm; }
                * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Tahoma, Arial, 'Segoe UI', sans-serif;
                    direction: rtl;
                    background: white;
                }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(${conf.cols}, ${conf.w}mm);
                    gap: 1mm;
                    justify-content: center;
                    page-break-inside: auto;
                }
                .sticker { page-break-inside: avoid; }
                @media print {
                    body { margin: 0; }
                    .grid { gap: 1mm; }
                }
                @media screen {
                    body { background: #f0f0f0; padding: 10mm; }
                    .grid { background: white; padding: 5mm; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                }
            </style>
        </head>
        <body>
            <div class="grid">
                ${stickersHtml}
            </div>
        </body>
        </html>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('⚠️ اسمح بالنوافذ المنبثقة'); return; }
    w.document.open();
    w.document.write(printHtml);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 700);
}

function _afFormatNumberForTag(n) {
    n = parseFloat(n) || 0;
    return n.toLocaleString('en-US');
}

window._smRenderPriceTags = _smRenderPriceTags;
window._smUpdateTagsPreview = _smUpdateTagsPreview;
window._smPrintPriceTags = _smPrintPriceTags;


// ═══════════════════════════════════════════════════════════
//  🌐 STANDALONE TOOLS — أدوات عامة (للمحاسبة)
//  صانع الملصقات + كاشير يومي — متاحة لكل الأنشطة
// ═══════════════════════════════════════════════════════════

function openDailyCashierTool() {
    let cont = document.getElementById('tool-daily-cashier');
    if (!cont) {
        cont = document.createElement('div');
        cont.className = 'page';
        cont.id = 'tool-daily-cashier';
        cont.style.display = 'none';
        document.body.appendChild(cont);
        console.log('🛠️ [tools] أنشأنا صفحة tool-daily-cashier');
    }
    if (typeof openPage === 'function') {
        openPage('tool-daily-cashier');
    } else {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        cont.style.display = 'block';
    }
    setTimeout(function() {
        if (typeof _smRenderCashier === 'function') _smRenderCashier(cont);
    }, 150);
}

function openPriceTagsTool() {
    let cont = document.getElementById('tool-price-tags');
    if (!cont) {
        cont = document.createElement('div');
        cont.className = 'page';
        cont.id = 'tool-price-tags';
        cont.style.display = 'none';
        document.body.appendChild(cont);
        console.log('🛠️ [tools] أنشأنا صفحة tool-price-tags');
    }
    if (typeof openPage === 'function') {
        openPage('tool-price-tags');
    } else {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        cont.style.display = 'block';
    }
    setTimeout(function() {
        if (typeof _smRenderPriceTags === 'function') _smRenderPriceTags(cont);
    }, 150);
}

window.openDailyCashierTool = openDailyCashierTool;
window.openPriceTagsTool = openPriceTagsTool;
console.log('🛠️ [tools] كاشير + ملصقات متاحة لكل الأنشطة');


// ═══════════════════════════════════════════════════════════
//  📊 INVENTORY — جرد سريع
// ═══════════════════════════════════════════════════════════
window._smInvState = null;

function _smRenderInventory(container) {
    if (!container) return;

    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const cats = [...new Set(mats.map(m => m.category).filter(Boolean))].sort();

    let catOptions = '<option value="all">🏷️ كل التصنيفات</option>';
    cats.forEach(c => {
        catOptions += `<option value="${_afEsc(c)}">${_afEsc(c)}</option>`;
    });

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">📊 جرد سريع</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">عدّ المواد + كشف الفروقات تلقائياً</p>

        <div style="background:#f8f9fa; padding:12px; border-radius:10px; margin-bottom:15px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                <select id="smInvCategory" onchange="_smRefreshInventory()" style="padding:10px; border:1px solid #ddd; border-radius:8px; background:white; font-size:13px;">
                    ${catOptions}
                </select>
                <input type="text" id="smInvSearch" placeholder="🔍 بحث..." oninput="_smRefreshInventory()" style="padding:10px; border:1px solid #ddd; border-radius:8px; font-size:13px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
                <button onclick="_smFillAllCurrent()" style="padding:10px 6px; background:#3498db; color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">✅ ملء الكل</button>
                <button onclick="_smClearAllCounts()" style="padding:10px 6px; background:#95a5a6; color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">🗑️ مسح الكل</button>
                <button onclick="_smViewInventoryHistory()" style="padding:10px 6px; background:#8e44ad; color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">📜 السجل</button>
            </div>
        </div>

        <div id="smInvStats" style="margin-bottom:15px;"></div>
        <div id="smInvList"></div>

        <div id="smInvSaveBar" style="position:sticky; bottom:10px; margin-top:15px; display:none;">
            <button onclick="_smSaveInventory()" style="width:100%; padding:15px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(39,174,96,0.4);">
                💾 حفظ الجرد
            </button>
        </div>
    `;

    // تهيئة الحالة
    window._smInvState = {
        items: {},
        started: Date.now()
    };

    setTimeout(_smRefreshInventory, 100);
}

function _smGetInvFilteredMats() {
    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const cat = document.getElementById('smInvCategory')?.value || 'all';
    const q = (document.getElementById('smInvSearch')?.value || '').trim().toLowerCase();

    return mats.filter(m => {
        if (cat !== 'all' && m.category !== cat) return false;
        if (q) {
            const search = (m.name || '').toLowerCase() + ' ' + (m.category || '').toLowerCase();
            if (!search.includes(q)) return false;
        }
        return true;
    });
}

function _smRefreshInventory() {
    const mats = _smGetInvFilteredMats();
    const statsEl = document.getElementById('smInvStats');
    const listEl = document.getElementById('smInvList');
    const saveBar = document.getElementById('smInvSaveBar');
    if (!listEl) return;

    const state = window._smInvState || { items: {} };

    let counted = 0, withDiff = 0, positive = 0, negative = 0, totalValueDiff = 0;

    mats.forEach(m => {
        const st = state.items[m.id];
        if (st && st.actual !== null && st.actual !== undefined) {
            counted++;
            const expected = parseFloat(m.stock) || 0;
            const diff = st.actual - expected;
            if (Math.abs(diff) > 0.001) {
                withDiff++;
                const cost = parseFloat(m.costSYP) || 0;
                totalValueDiff += diff * cost;
                if (diff > 0) positive++;
                else negative++;
            }
        }
    });

    // الإحصائيات
    if (statsEl) {
        statsEl.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                <div style="background:#ecf0f1; border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:20px; font-weight:bold; color:#2c3e50;">${mats.length}</div>
                    <div style="font-size:11px; color:#666;">📦 كلي</div>
                </div>
                <div style="background:${counted > 0 ? '#e8f5e9' : '#ecf0f1'}; border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:20px; font-weight:bold; color:#27ae60;">${counted}</div>
                    <div style="font-size:11px; color:#666;">✅ معدود</div>
                </div>
                <div style="background:${withDiff > 0 ? '#fdecea' : '#ecf0f1'}; border-radius:10px; padding:10px; text-align:center;">
                    <div style="font-size:20px; font-weight:bold; color:${withDiff > 0 ? '#e74c3c' : '#666'};">${withDiff}</div>
                    <div style="font-size:11px; color:#666;">⚠️ فروقات</div>
                </div>
            </div>
            ${withDiff > 0 ? `
                <div style="background:${totalValueDiff >= 0 ? '#e8f5e9' : '#fdecea'}; border-radius:8px; padding:8px 12px; margin-top:8px; font-size:12px; text-align:center; color:${totalValueDiff >= 0 ? '#27ae60' : '#e74c3c'}; font-weight:600;">
                    💰 قيمة الفرق الإجمالي: ${totalValueDiff >= 0 ? '+' : ''}${_afFmt(totalValueDiff)}
                </div>
            ` : ''}
        `;
    }

    // القائمة
    if (mats.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مواد مطابقة</div>';
        if (saveBar) saveBar.style.display = 'none';
        return;
    }

    let html = '';
    mats.forEach(m => {
        const expected = parseFloat(m.stock) || 0;
        const st = state.items[m.id] || { actual: null, notes: '' };
        const actual = st.actual;
        const hasCount = actual !== null && actual !== undefined;
        const diff = hasCount ? (actual - expected) : 0;
        const hasDiff = hasCount && Math.abs(diff) > 0.001;
        const diffColor = !hasCount ? '#999' : Math.abs(diff) < 0.001 ? '#27ae60' : diff > 0 ? '#3498db' : '#e74c3c';

        html += `
            <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; box-shadow:0 2px 6px rgba(0,0,0,0.05); border-right:3px solid ${diffColor};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:8px;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afEsc(m.name || '—')}</div>
                        <div style="font-size:11px; color:#666; margin-top:2px;">
                            ${m.category ? '🏷️ ' + _afEsc(m.category) + ' • ' : ''}💵 ${_afFmt(m.costSYP || 0)}
                        </div>
                    </div>
                    <div style="text-align:left; flex-shrink:0;">
                        <div style="font-size:10px; color:#999;">المتوقع</div>
                        <div style="font-size:14px; font-weight:bold; color:#666;">${expected} ${_afEsc(m.unit || '')}</div>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center;">
                    <div>
                        <input type="number" min="0" step="0.001" placeholder="الكمية الفعلية..." value="${hasCount ? actual : ''}"
                            onchange="_smSetInvCount(${m.id}, this.value)"
                            style="width:100%; padding:10px; border:2px solid ${hasCount ? diffColor : '#ddd'}; border-radius:8px; font-size:14px; text-align:center; font-weight:600; box-sizing:border-box; background:${hasCount ? diffColor + '10' : 'white'};">
                    </div>
                    <div style="min-width:100px; text-align:center;">
                        ${hasCount ? `
                            <div style="font-size:11px; color:#999;">الفرق</div>
                            <div style="font-size:16px; font-weight:bold; color:${diffColor};">
                                ${Math.abs(diff) < 0.001 ? '✅ 0' : (diff > 0 ? '+' : '') + diff.toFixed(2)}
                            </div>
                        ` : `
                            <div style="font-size:11px; color:#999;">لم يُعدّ</div>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
    if (saveBar) saveBar.style.display = counted > 0 ? 'block' : 'none';
}

function _smSetInvCount(materialId, value) {
    if (!window._smInvState) window._smInvState = { items: {}, started: Date.now() };
    const v = value === '' ? null : parseFloat(value);
    window._smInvState.items[materialId] = { actual: isNaN(v) ? null : v };
    _smRefreshInventory();
}

function _smFillAllCurrent() {
    if (!confirm('✅ ملء كل المواد بالرصيد الحالي؟\n\nهذا يجعلها "معدودة" بدون فروقات — للمراجعة فقط.')) return;

    const mats = _smGetInvFilteredMats();
    if (!window._smInvState) window._smInvState = { items: {}, started: Date.now() };

    mats.forEach(m => {
        window._smInvState.items[m.id] = { actual: parseFloat(m.stock) || 0 };
    });

    _smRefreshInventory();
}

function _smClearAllCounts() {
    if (!confirm('🗑️ مسح كل العدّادات؟')) return;
    window._smInvState = { items: {}, started: Date.now() };
    _smRefreshInventory();
}

async function _smSaveInventory() {
    const mats = _smGetInvFilteredMats();
    const state = window._smInvState;
    if (!state) return;

    const counted = mats.filter(m => {
        const st = state.items[m.id];
        return st && st.actual !== null && st.actual !== undefined;
    });

    if (counted.length === 0) {
        alert('⚠️ لم تُعدّ أي مادة');
        return;
    }

    const withDiff = counted.filter(m => {
        const expected = parseFloat(m.stock) || 0;
        const actual = state.items[m.id].actual;
        return Math.abs(actual - expected) > 0.001;
    });

    const totalValueDiff = withDiff.reduce((s, m) => {
        const expected = parseFloat(m.stock) || 0;
        const actual = state.items[m.id].actual;
        const cost = parseFloat(m.costSYP) || 0;
        return s + (actual - expected) * cost;
    }, 0);

    const confirmMsg = withDiff.length === 0
        ? '✅ كل المواد مطابقة!\n\nسيُحفظ السجل بدون تعديلات.'
        : `⚠️ ${withDiff.length} مادة فيها فرق\n💰 قيمة الفرق: ${totalValueDiff >= 0 ? '+' : ''}${_afFmt(totalValueDiff)}\n\nسيتم تعديل الأرصدة تلقائياً.`;

    if (!confirm(confirmMsg + '\n\nهل تُريد الحفظ؟')) return;

    const date = new Date().toISOString().slice(0, 10);
    const ts = Date.now();
    const docId = 'inv-' + date + '-' + ts;

    // ─── تعديل المخزون ───
    let adjusted = 0, failed = 0;
    for (const m of counted) {
        const actual = state.items[m.id].actual;
        const expected = parseFloat(m.stock) || 0;
        if (Math.abs(actual - expected) < 0.001) continue;

        try {
            if (typeof adjustStock === 'function' && typeof getDefaultWarehouseId === 'function') {
                adjustStock(m.id, actual, 'set', getDefaultWarehouseId(), {
                    reason: 'inventory_adjustment',
                    reasonLabel: 'جرد سريع',
                    relatedId: docId
                });
                adjusted++;
            }
        } catch(e) {
            console.warn('[inventory] adjust failed:', m.name, e.message);
            failed++;
        }
    }

    // ─── حفظ السجل ───
    const items = counted.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit || '',
        category: m.category || '',
        expected: parseFloat(m.stock) || 0,
        actual: state.items[m.id].actual,
        diff: state.items[m.id].actual - (parseFloat(m.stock) || 0),
        cost: parseFloat(m.costSYP) || 0
    }));

    const record = {
        date: date,
        createdAt: ts,
        items: items,
        countedCount: counted.length,
        diffCount: withDiff.length,
        totalValueDiff: totalValueDiff,
        adjusted: adjusted,
        failed: failed
    };

    try {
        if (typeof currentUser !== 'undefined' && currentUser?.uid && typeof db !== 'undefined') {
            await db.collection('users').doc(_getEffectiveUid()).collection('inventory').doc(docId).set(record);
        }

        // تحديث الجدول
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
        if (typeof saveAllData === 'function') await saveAllData();

        if (typeof toast === 'function') {
            toast('✅ تم حفظ الجرد — ' + counted.length + ' مادة', 'success');
        } else {
            alert('✅ تم الحفظ\nمعدود: ' + counted.length + '\nمعدّل: ' + adjusted);
        }

        // إعادة تعيين
        window._smInvState = { items: {}, started: Date.now() };
        _smRefreshInventory();

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ في الحفظ: ' + e.message);
    }
}

async function _smViewInventoryHistory() {
    if (typeof currentUser === 'undefined' || !currentUser?.uid) return;

    try {
        const snapshot = await db.collection('users').doc(_getEffectiveUid()).collection('inventory')
            .orderBy('createdAt', 'desc').limit(20).get();

        if (snapshot.empty) {
            alert('📜 لا يوجد سجل بعد');
            return;
        }

        let html = '<h3 style="margin:0 0 10px 0;">📜 سجل الجرد (آخر 20)</h3>';
        html += '<div style="max-height:60vh; overflow-y:auto;">';

        snapshot.forEach(doc => {
            const r = doc.data();
            const dateStr = new Date(r.createdAt || 0).toLocaleString('ar-SY');
            const diffColor = r.diffCount > 0 ? '#e74c3c' : '#27ae60';
            const valColor = r.totalValueDiff >= 0 ? '#27ae60' : '#e74c3c';

            html += `
                <div style="background:white; border-radius:8px; padding:10px 12px; margin-bottom:6px; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-right:3px solid ${diffColor};">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-size:12px; color:#666;">📅 ${dateStr}</div>
                            <div style="font-size:12px; color:#2c3e50; margin-top:3px;">
                                ✅ ${r.countedCount || 0} معدود • ⚠️ ${r.diffCount || 0} فرق
                            </div>
                        </div>
                        <div style="text-align:left;">
                            <div style="font-size:10px; color:#999;">قيمة الفرق</div>
                            <div style="font-size:13px; font-weight:bold; color:${valColor};">
                                ${r.totalValueDiff >= 0 ? '+' : ''}${_afFmt(r.totalValueDiff || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        html += `<button onclick="document.getElementById('smInvHistoryModal').remove()" style="width:100%; padding:12px; margin-top:10px; background:#95a5a6; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">إغلاق</button>`;

        const modal = document.createElement('div');
        modal.id = 'smInvHistoryModal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px;';
        modal.innerHTML = '<div style="background:#f8f9fa; border-radius:14px; padding:18px; max-width:500px; width:100%; max-height:85vh; overflow-y:auto;">' + html + '</div>';
        document.body.appendChild(modal);

    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._smRenderInventory = _smRenderInventory;
window._smRefreshInventory = _smRefreshInventory;
window._smSetInvCount = _smSetInvCount;
window._smFillAllCurrent = _smFillAllCurrent;
window._smClearAllCounts = _smClearAllCounts;
window._smSaveInventory = _smSaveInventory;
window._smViewInventoryHistory = _smViewInventoryHistory;


// ═══════════════════════════════════════════════════════════
//  🤖 AI ALERTS — تنبيهات ذكية للسوبرماركت
// ═══════════════════════════════════════════════════════════

function _smRenderAIAlerts(container) {
    if (!container) return;

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">🤖 تنبيهات ذكية</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">تحليل تلقائي لموادك ومبيعاتك</p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:15px;">
            <button onclick="_smRefreshAIAlerts()" style="padding:10px; background:#3498db; color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">🔄 تحديث</button>
            <button onclick="_smExportAIAlerts()" style="padding:10px; background:#25D366; color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">📱 واتساب</button>
        </div>

        <div id="smAIStats" style="margin-bottom:15px;"></div>
        <div id="smAIList">
            <div style="text-align:center; padding:30px; color:#999;">⏳ جاري التحليل...</div>
        </div>
    `;

    setTimeout(_smRefreshAIAlerts, 100);
}

function _smRefreshAIAlerts() {
    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const allSales = (typeof window.sales !== 'undefined' && Array.isArray(window.sales)) ? window.sales : [];

    // ─── تحليل المبيعات ───
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // لكل مادة: آخر بيع + كمية مبيعة آخر 30 يوم
    const salesByMaterial = {};
    allSales.forEach(s => {
        if (!s.date) return;
        const saleTime = new Date(s.date).getTime();
        const daysAgo = (now - saleTime) / DAY;
        (s.items || []).forEach(it => {
            const name = (it.materialName || '').trim();
            if (!name) return;
            if (!salesByMaterial[name]) {
                salesByMaterial[name] = { lastSale: 0, sold30: 0, sold90: 0, total: 0 };
            }
            const rec = salesByMaterial[name];
            if (saleTime > rec.lastSale) rec.lastSale = saleTime;
            const q = parseFloat(it.qty) || 0;
            if (daysAgo <= 30) rec.sold30 += q;
            if (daysAgo <= 90) rec.sold90 += q;
        });
    });

    // ─── تصنيفات التنبيهات ───
    const lowStock = [];      // 🟡 نقص
    const outOfStock = [];    // 🔴 نفد
    const dead = [];          // 😴 راكدة
    const profitable = [];    // 🟢 الأعلى ربحاً
    const predictions = [];   // 📈 توقعات

    mats.forEach(m => {
        const stock = parseFloat(m.stock) || 0;
        const minStock = parseFloat(m.minStock) || 0;
        const cost = parseFloat(m.costSYP) || 0;
        const sale = parseFloat(m.saleSYP) || 0;
        const stats = salesByMaterial[m.name] || { lastSale: 0, sold30: 0, sold90: 0 };

        // 🔴 نفد
        if (stock <= 0) {
            outOfStock.push({ m, stats });
        }
        // 🟡 نقص
        else if (minStock > 0 && stock <= minStock) {
            lowStock.push({ m, stats });
        }

        // 😴 راكدة (لها رصيد لكن لا تبيع منذ 30+ يوم)
        if (stock > 0 && stats.lastSale > 0) {
            const daysSinceLastSale = Math.floor((now - stats.lastSale) / DAY);
            if (daysSinceLastSale >= 30) {
                dead.push({ m, stats, daysSinceLastSale });
            }
        }
        // لم تُبع أبداً + لها رصيد
        else if (stock > 0 && stats.lastSale === 0 && cost > 0) {
            dead.push({ m, stats, daysSinceLastSale: -1 });
        }

        // 🟢 الأعلى ربحاً
        if (cost > 0 && sale > cost) {
            const margin = ((sale - cost) / sale) * 100;
            if (margin >= 20) {
                profitable.push({ m, margin, profit: sale - cost });
            }
        }

        // 📈 توقعات المخزون
        if (stock > 0 && stats.sold30 > 0) {
            const dailyRate = stats.sold30 / 30;
            if (dailyRate > 0) {
                const daysLeft = stock / dailyRate;
                if (daysLeft <= 30) {
                    predictions.push({ m, dailyRate, daysLeft });
                }
            }
        }
    });

    // ترتيب
    dead.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);
    profitable.sort((a, b) => b.margin - a.margin);
    predictions.sort((a, b) => a.daysLeft - b.daysLeft);

    // ─── الإحصائيات ───
    const statsEl = document.getElementById('smAIStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b); color:white; border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:22px; font-weight:bold;">${outOfStock.length + lowStock.length}</div>
                    <div style="font-size:11px; opacity:0.9;">⚠️ تحتاج طلب</div>
                </div>
                <div style="background:linear-gradient(135deg,#95a5a6,#7f8c8d); color:white; border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:22px; font-weight:bold;">${dead.length}</div>
                    <div style="font-size:11px; opacity:0.9;">😴 راكدة</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:22px; font-weight:bold;">${profitable.length}</div>
                    <div style="font-size:11px; opacity:0.9;">🟢 عالية الربح</div>
                </div>
                <div style="background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:22px; font-weight:bold;">${predictions.length}</div>
                    <div style="font-size:11px; opacity:0.9;">📈 تنبؤات</div>
                </div>
            </div>
        `;
    }

    // ─── القائمة ───
    const listEl = document.getElementById('smAIList');
    if (!listEl) return;

    let html = '';

    // 🔴 نفد تماماً
    if (outOfStock.length > 0) {
        html += _smAIRenderSection('🔴 نفدت — اطلب فوراً', outOfStock, '#e74c3c', 'out');
    }

    // 🟡 نقص
    if (lowStock.length > 0) {
        html += _smAIRenderSection('🟡 على وشك النفاد', lowStock, '#f39c12', 'low');
    }

    // 📈 تنبؤات
    if (predictions.length > 0) {
        html += _smAIRenderPredictions(predictions);
    }

    // 😴 راكدة
    if (dead.length > 0) {
        html += _smAIRenderDead(dead);
    }

    // 🟢 الأعلى ربحاً
    if (profitable.length > 0) {
        html += _smAIRenderProfitable(profitable);
    }

    // لا شيء
    if (!html) {
        html = '<div style="text-align:center; padding:40px; color:#27ae60; background:#e8f5e9; border-radius:10px;">✅ كل شيء ممتاز!<br><br>لا توجد تنبيهات حالياً</div>';
    }

    listEl.innerHTML = html;
}

function _smAIRenderSection(title, items, color, type) {
    let html = `<div style="margin-bottom:15px;">
        <div style="background:${color}; color:white; padding:10px 14px; border-radius:10px 10px 0 0; font-weight:600; font-size:14px;">${title} (${items.length})</div>
        <div style="background:white; border-radius:0 0 10px 10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">`;

    items.forEach(({ m, stats }) => {
        const stock = parseFloat(m.stock) || 0;
        const min = parseFloat(m.minStock) || 0;
        const unit = m.unit || '';

        html += `
            <div style="padding:12px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afEsc(m.name)}</div>
                    <div style="font-size:11px; color:#666; margin-top:2px;">
                        ${m.category ? '🏷️ ' + _afEsc(m.category) + ' • ' : ''}الحد الأدنى: ${min} ${unit}
                    </div>
                </div>
                <div style="text-align:center; flex-shrink:0; padding-left:8px;">
                    <div style="font-size:20px; font-weight:bold; color:${color};">${stock}</div>
                    <div style="font-size:10px; color:#999;">${unit}</div>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}

function _smAIRenderPredictions(items) {
    let html = `<div style="margin-bottom:15px;">
        <div style="background:linear-gradient(135deg,#f39c12,#e67e22); color:white; padding:10px 14px; border-radius:10px 10px 0 0; font-weight:600; font-size:14px;">📈 توقعات المخزون (${items.length})</div>
        <div style="background:white; border-radius:0 0 10px 10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">`;

    items.slice(0, 10).forEach(({ m, dailyRate, daysLeft }) => {
        const days = Math.floor(daysLeft);
        const urgency = days <= 3 ? '#e74c3c' : days <= 7 ? '#f39c12' : '#3498db';
        const unit = m.unit || '';

        html += `
            <div style="padding:12px; border-bottom:1px solid #f0f0f0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afEsc(m.name)}</div>
                        <div style="font-size:11px; color:#666; margin-top:2px;">
                            معدل البيع: ${dailyRate.toFixed(2)} ${unit}/يوم
                        </div>
                    </div>
                    <div style="text-align:center; flex-shrink:0; padding-left:8px;">
                        <div style="font-size:20px; font-weight:bold; color:${urgency};">${days}</div>
                        <div style="font-size:10px; color:#999;">يوم متبقي</div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}

function _smAIRenderDead(items) {
    let html = `<div style="margin-bottom:15px;">
        <div style="background:linear-gradient(135deg,#95a5a6,#7f8c8d); color:white; padding:10px 14px; border-radius:10px 10px 0 0; font-weight:600; font-size:14px;">😴 راكدة — لا تبيع (${items.length})</div>
        <div style="background:white; border-radius:0 0 10px 10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">`;

    items.slice(0, 10).forEach(({ m, daysSinceLastSale }) => {
        const stock = parseFloat(m.stock) || 0;
        const cost = parseFloat(m.costSYP) || 0;
        const lockedValue = stock * cost;
        const daysText = daysSinceLastSale === -1 ? 'لم تُبع أبداً' : `منذ ${daysSinceLastSale} يوم`;

        html += `
            <div style="padding:12px; border-bottom:1px solid #f0f0f0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afEsc(m.name)}</div>
                        <div style="font-size:11px; color:#666; margin-top:2px;">🕐 ${daysText}</div>
                        <div style="font-size:11px; color:#999; margin-top:2px;">الرصيد: ${stock} ${_afEsc(m.unit || '')}</div>
                    </div>
                    <div style="text-align:left; flex-shrink:0;">
                        <div style="font-size:10px; color:#999;">رأس مال معلّق</div>
                        <div style="font-size:13px; font-weight:bold; color:#e74c3c;">${_afFmt(lockedValue)}</div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}

function _smAIRenderProfitable(items) {
    let html = `<div style="margin-bottom:15px;">
        <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; padding:10px 14px; border-radius:10px 10px 0 0; font-weight:600; font-size:14px;">🟢 الأعلى ربحاً (${items.length})</div>
        <div style="background:white; border-radius:0 0 10px 10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.05);">`;

    items.slice(0, 10).forEach(({ m, margin, profit }) => {
        html += `
            <div style="padding:12px; border-bottom:1px solid #f0f0f0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${_afEsc(m.name)}</div>
                        <div style="font-size:11px; color:#666; margin-top:2px;">
                            تكلفة: ${_afFmt(m.costSYP || 0)} • بيع: ${_afFmt(m.saleSYP || 0)}
                        </div>
                    </div>
                    <div style="text-align:center; flex-shrink:0; padding-left:8px;">
                        <div style="font-size:18px; font-weight:bold; color:#27ae60;">${margin.toFixed(0)}%</div>
                        <div style="font-size:10px; color:#999;">ربح ${_afFmt(profit)}</div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div></div>';
    return html;
}

function _smExportAIAlerts() {
    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    const allSales = (typeof window.sales !== 'undefined' && Array.isArray(window.sales)) ? window.sales : [];
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // نفس التحليل السريع
    const salesByMaterial = {};
    allSales.forEach(s => {
        if (!s.date) return;
        const t = new Date(s.date).getTime();
        (s.items || []).forEach(it => {
            const name = (it.materialName || '').trim();
            if (!name) return;
            if (!salesByMaterial[name]) salesByMaterial[name] = { lastSale: 0, sold30: 0 };
            const rec = salesByMaterial[name];
            if (t > rec.lastSale) rec.lastSale = t;
            if ((now - t) / DAY <= 30) rec.sold30 += parseFloat(it.qty) || 0;
        });
    });

    const outOfStock = [], lowStock = [], dead = [], predictions = [];
    mats.forEach(m => {
        const stock = parseFloat(m.stock) || 0;
        const min = parseFloat(m.minStock) || 0;
        const stats = salesByMaterial[m.name] || { lastSale: 0, sold30: 0 };

        if (stock <= 0) outOfStock.push(m);
        else if (min > 0 && stock <= min) lowStock.push(m);

        if (stock > 0 && stats.lastSale > 0) {
            const d = Math.floor((now - stats.lastSale) / DAY);
            if (d >= 30) dead.push({ m, d });
        }

        if (stock > 0 && stats.sold30 > 0) {
            const rate = stats.sold30 / 30;
            const daysLeft = stock / rate;
            if (daysLeft <= 30) predictions.push({ m, daysLeft, rate });
        }
    });

    predictions.sort((a, b) => a.daysLeft - b.daysLeft);
    dead.sort((a, b) => b.d - a.d);

    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'متجرنا';
    const d = new Date();
    const ds = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();

    const lines = [];
    lines.push('🤖 *تنبيهات ذكية*');
    lines.push('🏪 ' + bizName);
    lines.push('📅 ' + ds);
    lines.push('');

    if (outOfStock.length > 0) {
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('🔴 *نفدت — اطلب فوراً* (' + outOfStock.length + ')');
        outOfStock.slice(0, 15).forEach(m => {
            lines.push('▪️ ' + m.name);
        });
    }

    if (lowStock.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('🟡 *على وشك النفاد* (' + lowStock.length + ')');
        lowStock.slice(0, 15).forEach(m => {
            lines.push('▪️ ' + m.name + ' — ' + m.stock + ' ' + (m.unit || ''));
        });
    }

    if (predictions.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('📈 *تنبؤات*');
        predictions.slice(0, 10).forEach(p => {
            lines.push('▪️ ' + p.m.name + ' — يكفي ' + Math.floor(p.daysLeft) + ' يوم');
        });
    }

    if (dead.length > 0) {
        lines.push('');
        lines.push('━━━━━━━━━━━━━━━━━━');
        lines.push('😴 *راكدة — لا تبيع* (' + dead.length + ')');
        dead.slice(0, 10).forEach(dd => {
            lines.push('▪️ ' + dd.m.name + ' — منذ ' + dd.d + ' يوم');
        });
    }

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('📍 ' + bizName);

    const text = lines.join('\n');
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
}

window._smRenderAIAlerts = _smRenderAIAlerts;
window._smRefreshAIAlerts = _smRefreshAIAlerts;
window._smExportAIAlerts = _smExportAIAlerts;
