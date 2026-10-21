// ============================================================
//  🍽️ ACTIVITY: RESTAURANT — نشاط المطعم
//  v1.0.0
// ============================================================

ACTIVITY_REGISTRY.register({
    id: 'restaurant',
    name: 'مطعم',
    icon: '🍽️',
    pages: [

        // ═══════════════════════════════════════════════════
        //  🍽️ قائمة الطعام (المنيو)
        // ═══════════════════════════════════════════════════
        {
            id: 'menu',
            icon: '🍽️',
            title: 'قائمة الطعام',
            printTitle: 'قائمة الطعام',
            description: 'أطباق المطعم + الأسعار',
            addLabel: '➕ إضافة طبق',
            searchPlaceholder: 'ابحث باسم الطبق / التصنيف...',
            emptyIcon: '🍽️',
            autoNumber: false,
            printSize: 'thermal',
            searchFields: ['itemName', 'category', 'description'],
            primaryField: 'itemName',
            secondaryField: 'category',
            amountField: 'price',
            stats: [
                { icon: '📋', label: 'الكل',
                  compute: (items) => items.length,
                  bg: '#ecf0f1', color: '#2c3e50', filterId: 'all' },
                { icon: '✅', label: 'متوفر',
                  compute: (items) => items.filter(x => x.available !== false).length,
                  bg: '#d4edda', color: '#155724', filterId: 'available' },
                { icon: '❌', label: 'غير متوفر',
                  compute: (items) => items.filter(x => x.available === false).length,
                  bg: '#f8d7da', color: '#721c24', filterId: 'unavailable' },
                { icon: '💰', label: 'متوسط السعر',
                  compute: (items) => {
                      if (!items.length) return '0';
                      const sum = items.reduce((s, x) => s + (parseFloat(x.price) || 0), 0);
                      return typeof _afFmt === 'function' ? _afFmt(sum / items.length) : (sum / items.length).toFixed(0);
                  },
                  bg: '#d1ecf1', color: '#0c5460' }
            ],
            filters: [
                { id: 'all', label: 'الكل' },
                { id: 'appetizers', label: '🥗 مقبلات' },
                { id: 'main', label: '🥘 أطباق رئيسية' },
                { id: 'grill', label: '🍖 مشاوي' },
                { id: 'chicken', label: '🍗 دجاج' },
                { id: 'fastfood', label: '🥪 ساندويشات' },
                { id: 'salads', label: '🥗 سلطات' },
                { id: 'soups', label: '🍲 شوربات' },
                { id: 'drinks', label: '🥤 مشروبات' },
                { id: 'juices', label: '🍹 عصائر' },
                { id: 'desserts', label: '🍰 حلويات' }
            ],
            fields: [
                { name: 'itemName', label: 'اسم الطبق', type: 'text', required: true, icon: '🍽️', placeholder: 'مثال: شاورما دجاج / كباب حلبي' },
                { name: 'category', label: 'التصنيف', type: 'select', icon: '🏷️', required: true, default: 'main',
                  options: [
                      { value: 'appetizers', label: '🥗 مقبلات' },
                      { value: 'main',       label: '🥘 أطباق رئيسية' },
                      { value: 'grill',      label: '🍖 مشاوي' },
                      { value: 'chicken',    label: '🍗 دجاج' },
                      { value: 'fastfood',   label: '🥪 ساندويشات' },
                      { value: 'salads',     label: '🥗 سلطات' },
                      { value: 'soups',      label: '🍲 شوربات' },
                      { value: 'drinks',     label: '🥤 مشروبات' },
                      { value: 'juices',     label: '🍹 عصائر' },
                      { value: 'desserts',   label: '🍰 حلويات' }
                  ]},
                { name: 'price', label: 'سعر البيع', type: 'number', required: true, icon: '💰', placeholder: '0', min: 0 },
                { name: 'cost', label: 'التكلفة (اختياري)', type: 'number', icon: '💵', placeholder: '0', min: 0 },
                { name: 'portionSize', label: 'الحجم / الكمية', type: 'text', icon: '⚖️', placeholder: 'وسط / كبير / طبق عادي' },
                { name: 'prepTime', label: 'وقت التحضير (دقيقة)', type: 'number', icon: '⏱️', placeholder: '15', min: 0, default: 15 },
                { name: 'description', label: 'الوصف', type: 'textarea', icon: '📝', rows: 2, placeholder: 'مكونات الطبق...' },
                { name: 'available', label: 'متوفر للبيع', type: 'checkbox', default: true, checkboxLabel: 'الطبق متوفر' },
                { name: 'showInStore', label: '🛒 عرض في المتجر', type: 'checkbox', default: false, checkboxLabel: 'عرض هذا الطبق في المتجر الإلكتروني' },
                { name: 'image', label: '🖼️ صورة الطبق', type: 'image', hint: 'تُضغط تلقائياً 250×250 — حجم أقل من 60KB' }
            ],

            itemRenderer: function(item) {
                const catLabels = {
                    'appetizers': '🥗 مقبلات', 'main': '🥘 أطباق رئيسية', 'grill': '🍖 مشاوي',
                    'chicken': '🍗 دجاج', 'fastfood': '🥪 ساندويشات', 'salads': '🥗 سلطات',
                    'soups': '🍲 شوربات', 'drinks': '🥤 مشروبات', 'juices': '🍹 عصائر',
                    'desserts': '🍰 حلويات'
                };
                const cat = catLabels[item.category] || '📦';
                const price = item.price ? _afFmt(item.price) : '—';
                const cost = item.cost ? _afFmt(item.cost) : '';
                const profit = (item.price && item.cost) ? (parseFloat(item.price) - parseFloat(item.cost)) : 0;
                const isAvail = item.available !== false;

                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:${isAvail ? 'white' : '#fef5f5'};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">🍽️ ${_afEsc(item.itemName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">${cat}${item.portionSize ? ' • ⚖️ ' + _afEsc(item.portionSize) : ''}${item.prepTime ? ' • ⏱️ ' + item.prepTime + ' دقيقة' : ''}</div>
                            ${item.description ? `<div style="font-size:11px; color:#999; margin-top:4px;">${_afEsc(item.description.substring(0, 80))}${item.description.length > 80 ? '...' : ''}</div>` : ''}
                            ${!isAvail ? '<div style="display:inline-block; margin-top:5px; background:#e74c3c; color:white; padding:2px 10px; border-radius:10px; font-size:10px; font-weight:600;">❌ غير متوفر</div>' : ''}
                        </div>
                        <div style="text-align:left; flex-shrink:0;">
                            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; padding:6px 14px; border-radius:10px; font-size:14px; font-weight:700; white-space:nowrap;">${price}</div>
                            ${profit > 0 ? `<div style="font-size:10px; color:#666; margin-top:5px; text-align:center;">ربح: ${_afFmt(profit)}</div>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px;">
                        <button onclick="activityOpenForm('restaurant', 'menu', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="_restToggleAvail('${item.id}')" style="padding:7px 4px; background:${isAvail ? '#95a5a6' : '#27ae60'}; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="${isAvail ? 'إخفاء' : 'إظهار'}">${isAvail ? '🚫' : '✅'}</button>
                        <button onclick="activityPrintItem('restaurant', 'menu', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة">🖨️</button>
                        <button onclick="activityConfirmDelete('restaurant', 'menu', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                </div>`;
            }
        },

        // ═══════════════════════════════════════════════════
        //  🪑 الطلبات (طاولات)
        // ═══════════════════════════════════════════════════
        {
            id: 'tables',
            icon: '🪑',
            title: 'طلبات الطاولات',
            description: 'طلبات مباشرة من الزبائن',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _restRenderTables(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  🛵 التوصيل
        // ═══════════════════════════════════════════════════
        {
            id: 'delivery',
            icon: '🛵',
            title: 'طلبات التوصيل',
            description: 'طلبات التوصيل للمنزل',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _restRenderDelivery(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  🏍️ السائقين
        // ═══════════════════════════════════════════════════
        {
            id: 'drivers',
            icon: '🏍️',
            title: 'السائقين',
            description: 'إدارة قائمة السائقين',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _restRenderDrivers(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  🍳 المطبخ
        // ═══════════════════════════════════════════════════
        {
            id: 'kitchen',
            icon: '🍳',
            title: 'شاشة المطبخ',
            description: 'عرض حي لطلبات التحضير',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                _restRenderKitchen(container);
            }
        },

        // ═══════════════════════════════════════════════════
        //  📊 التقارير
        // ═══════════════════════════════════════════════════
        {
            id: 'reports',
            icon: '📊',
            title: 'تقارير المطعم',
            description: 'ملخص المبيعات والأطباق',
            searchFields: [],
            unifiedSearch: false,
            fields: [],
            itemRenderer: function() { return ''; },
            pageRenderer: function(container) {
                if (typeof window._restRenderReports === 'function') {
                    window._restRenderReports(container);
                } else {
                    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>';
                    let _tries = 0;
                    const _iv = setInterval(() => {
                        _tries++;
                        if (typeof window._restRenderReports === 'function') {
                            clearInterval(_iv);
                            window._restRenderReports(container);
                        } else if (_tries > 10) {
                            clearInterval(_iv);
                            container.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">⚠️ تقارير المطعم غير متاحة</div>';
                        }
                    }, 200);
                }
            }
        }
    ]
});

console.log('🍽️ [restaurant] registered | 5 pages');


// ═══════════════════════════════════════════════════════════
//  🛠️ TOGGLE AVAILABILITY — إظهار/إخفاء طبق
// ═══════════════════════════════════════════════════════════
async function _restToggleAvail(docId) {
    try {
        const items = (typeof _activityCache !== 'undefined' && _activityCache.getAll)
            ? _activityCache.getAll('menu') : [];
        const item = items.find(x => x.id === docId);
        if (!item) { alert('⚠️ الطبق غير موجود'); return; }

        const newAvail = item.available === false;
        const msg = newAvail ? '✅ إظهار هذا الطبق؟' : '🚫 إخفاء هذا الطبق من القائمة؟';
        if (!confirm(msg)) return;

        if (typeof activityUpdate === 'function') {
            await activityUpdate('restaurant', 'menu', docId, { available: newAvail });
        } else if (typeof activitySaveItem === 'function') {
            await activitySaveItem('restaurant', 'menu', docId, { available: newAvail });
        }

        if (typeof activityRefresh === 'function') activityRefresh('restaurant', 'menu');
        if (typeof toast === 'function') toast(newAvail ? '✅ الطبق ظاهر' : '🚫 الطبق مخفي', 'success');

    } catch(e) {
        console.error('[restaurant] toggle:', e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._restToggleAvail = _restToggleAvail;


// ═══════════════════════════════════════════════════════════
//  🪑 TABLES — طلبات الطاولات
// ═══════════════════════════════════════════════════════════
window._restTablesState = [];

async function _restRenderTables(container) {
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>';

    try {
        const tables = await activityGetAll('restaurant', 'tables', 200);
        window._restTablesState = tables || [];
        _restRenderTablesList(container);
    } catch(e) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">خطأ: ' + e.message + '</div>';
    }
}

function _restRenderTablesList(container) {
    const tables = window._restTablesState || [];
    const tableCount = window._restTableCount || 20;

    // ─── تصنيف الطاولات ───
    const occupied = [];       // active + ready
    const needCleaning = [];   // paid

    tables.forEach(t => {
        const num = parseInt(String(t.tableNumber).trim());
        if (isNaN(num)) return;
        if (t.status === 'paid') needCleaning.push(t);
        else if (t.status === 'active' || t.status === 'ready') occupied.push(t);
    });

    // خرائط سريعة
    const occMap = {};
    occupied.forEach(t => { occMap[String(parseInt(String(t.tableNumber).trim()))] = t; });
    const cleanMap = {};
    needCleaning.forEach(t => { cleanMap[String(parseInt(String(t.tableNumber).trim()))] = t; });

    const availableCount = Math.max(0, tableCount - occupied.length - needCleaning.length);

    let html = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">🪑 إدارة الطاولات</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">اضغط على الطاولة للتحكم</p>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:22px; font-weight:bold;">${availableCount}</div>
                <div style="font-size:11px; opacity:0.9;">🟢 متاحة</div>
            </div>
            <div style="background:linear-gradient(135deg,#e67e22,#d35400); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:22px; font-weight:bold;">${occupied.length}</div>
                <div style="font-size:11px; opacity:0.9;">🟠 مشغولة</div>
            </div>
            <div style="background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:22px; font-weight:bold;">${needCleaning.length}</div>
                <div style="font-size:11px; opacity:0.9;">🟡 تنظيف</div>
            </div>
        </div>

        <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:15px; text-align:center;">
            <div style="font-size:12px; color:#555; margin-bottom:8px; font-weight:600;">🪑 خريطة الطاولات (${tableCount})</div>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;">
    `;

    // ─── شبكة الطاولات ───
    for (let i = 1; i <= tableCount; i++) {
        const key = String(i);
        const isOccupied = !!occMap[key];
        const isDirty = !!cleanMap[key];

        let bg, border, icon, onClick;
        if (isOccupied) {
            const isReady = occMap[key].status === 'ready';
            bg = isReady ? '#fff8e1' : '#fff3e0';
            border = isReady ? '#f39c12' : '#e67e22';
            icon = isReady ? '🟡' : '🟠';
            onClick = `_restTableClick(${i})`;
        } else if (isDirty) {
            bg = '#fff8e1';
            border = '#f39c12';
            icon = '🧹';
            onClick = `_restTableClick(${i})`;
        } else {
            bg = 'white';
            border = '#27ae60';
            icon = '🟢';
            onClick = `_restTableClick(${i})`;
        }

        html += `
            <button onclick="${onClick}" style="padding:10px 4px; background:${bg}; border:2px solid ${border}; border-radius:10px; cursor:pointer; font-family:inherit; transition:transform 0.1s; display:flex; flex-direction:column; align-items:center; gap:2px;">
                <div style="font-size:18px; font-weight:bold; color:#2c3e50;">${i}</div>
                <div style="font-size:14px;">${icon}</div>
            </button>
        `;
    }

    html += `
            </div>
            <div style="display:flex; justify-content:center; gap:10px; margin-top:10px; font-size:11px;">
                <span>🟢 متاحة</span>
                <span>🟠 مشغولة</span>
                <span>🟡 جاهزة/تنظيف</span>
                <span>🧹 تحتاج تنظيف</span>
            </div>
        </div>
    `;

    // ─── قائمة الطاولات المشغولة (تفاصيل) ───
    if (occupied.length > 0) {
        html += '<h3 style="font-size:15px; color:#2c3e50; margin-bottom:10px;">🟠 الطاولات المشغولة</h3>';
        occupied.sort((a, b) => (parseInt(a.tableNumber) || 0) - (parseInt(b.tableNumber) || 0));

        occupied.forEach(t => {
            const isReady = t.status === 'ready';
            const total = parseFloat(t.total) || 0;
            const itemsCount = (t.items || []).length;
            const roundsCount = (t.rounds || []).length || (itemsCount > 0 ? 1 : 0);
            const timeStr = t.openedAt ? _restTimeAgo(new Date(t.openedAt).getTime()) : '';
            const bg = isReady ? '#fff8e1' : '#fff3e0';
            const border = isReady ? '#f39c12' : '#e67e22';

            html += `
                <div onclick="_restOpenTable('${t.id}')" style="background:${bg}; border:2px solid ${border}; border-radius:12px; padding:12px; margin-bottom:10px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:46px; height:46px; background:${border}; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:bold; flex-shrink:0;">${_afEsc(t.tableNumber || '?')}</div>
                            <div>
                                <div style="font-weight:bold; color:#2c3e50; font-size:15px;">طاولة ${_afEsc(t.tableNumber || '?')}</div>
                                <div style="font-size:11px; color:#666; margin-top:2px;">
                                    ${t.customerName ? '👤 ' + _afEsc(t.customerName) + ' • ' : ''}
                                    ${t.guests ? '👥 ' + t.guests + ' • ' : ''}
                                    ${timeStr}
                                </div>
                            </div>
                        </div>
                        <div style="text-align:left;">
                            <div style="background:${border}; color:white; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600;">${isReady ? '🟡 جاهزة' : '🟠 مشغولة'}</div>
                            <div style="font-size:14px; font-weight:bold; color:#27ae60; margin-top:5px; text-align:center;">${_afFmt(total)}</div>
                            <div style="font-size:10px; color:#999; text-align:center;">📦 ${itemsCount} طبق${roundsCount > 1 ? ' • ' + roundsCount + ' دورات' : ''}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // ─── قائمة الطاولات التي تحتاج تنظيف ───
    if (needCleaning.length > 0) {
        html += '<h3 style="font-size:15px; color:#2c3e50; margin:20px 0 10px 0;">🧹 تحتاج تنظيف</h3>';
        needCleaning.sort((a, b) => (parseInt(a.tableNumber) || 0) - (parseInt(b.tableNumber) || 0));

        needCleaning.forEach(t => {
            const total = parseFloat(t.grandTotal) || parseFloat(t.total) || 0;
            const invoice = t.invoice || '';
            const paidStr = t.paidAt ? new Date(t.paidAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '';

            html += `
                <div style="background:#fff8e1; border:2px solid #f39c12; border-radius:12px; padding:12px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:46px; height:46px; background:#f39c12; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:bold;">${_afEsc(t.tableNumber || '?')}</div>
                            <div>
                                <div style="font-weight:bold; color:#2c3e50; font-size:15px;">طاولة ${_afEsc(t.tableNumber || '?')}</div>
                                <div style="font-size:11px; color:#666; margin-top:2px;">${invoice ? '📄 ' + _afEsc(invoice) + ' • ' : ''}${paidStr}</div>
                            </div>
                        </div>
                        <div style="text-align:left;">
                            <div style="font-size:13px; font-weight:bold; color:#27ae60;">${_afFmt(total)}</div>
                            <div style="font-size:10px; color:#666;">مدفوعة</div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:2fr 1fr; gap:6px;">
                        <button onclick="_restCleanTable('${t.id}')" style="padding:11px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">✅ تم التنظيف</button>
                        <button onclick="_restPrintPaidInvoice('${invoice}', '${t.id}')" style="padding:11px; background:#34495e; color:white; border:none; border-radius:8px; font-size:13px; cursor:pointer;">🖨️</button>
                    </div>
                </div>
            `;
        });
    }

    // ─── زر تعديل عدد الطاولات ───
    html += `
        <button onclick="_restSetTableCount()" style="width:100%; margin-top:15px; padding:10px; background:#95a5a6; color:white; border:none; border-radius:8px; font-size:12px; cursor:pointer;">
            ⚙️ تعديل عدد الطاولات (${tableCount})
        </button>
    `;

    container.innerHTML = html;
}

// ─── عند الضغط على طاولة ───
function _restTableClick(num) {
    const tables = window._restTablesState || [];
    const t = tables.find(x => String(parseInt(String(x.tableNumber).trim())) === String(num));

    if (!t) {
        // متاحة → فتح
        _restOpenTableByNum(num);
    } else if (t.status === 'paid') {
        // تحتاج تنظيف
        if (confirm('🧹 تنظيف طاولة ' + num + '؟')) {
            _restCleanTable(t.id);
        }
    } else {
        // مشغولة → فتح
        _restOpenTable(t.id);
    }
}

// ─── فتح طاولة برقم ───

async function _restOpenNewTable() {
    const tableNumber = prompt('🪑 رقم الطاولة:', '');
    if (!tableNumber) return;

    const customerName = prompt('👤 اسم الزبون (اختياري):', '') || '';
    const guests = prompt('👥 عدد الأشخاص (اختياري):', '') || '';

    try {
        const record = {
            tableNumber: String(tableNumber).trim(),
            customerName: customerName.trim(),
            guests: guests ? parseInt(guests) : null,
            items: [],
            total: 0,
            status: 'active',
            openedAt: Date.now()
        };

        if (typeof activityAdd === 'function') {
            await activityAdd('restaurant', 'tables', record);
        }

        if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'tables');
        if (typeof toast === 'function') toast('✅ طاولة ' + tableNumber + ' مفتوحة', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-tables');
            if (c) _restRenderTables(c);
        }, 500);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}


// ─── فتح طاولة برقم ───
async function _restOpenTableByNum(num) {
    const customerName = prompt('👤 اسم الزبون (اختياري):', '') || '';
    const guests = prompt('👥 عدد الأشخاص (اختياري):', '') || '';

    try {
        const record = {
            tableNumber: String(num),
            customerName: customerName.trim(),
            guests: guests ? parseInt(guests) : null,
            items: [],
            rounds: [],
            total: 0,
            kitchenStatus: 'new',
            status: 'active',
            openedAt: Date.now(),
            createdAt: Date.now()
        };

        if (typeof activityAdd === 'function') {
            await activityAdd('restaurant', 'tables', record);
        } else {
            alert('⚠️ activityAdd غير متاحة');
            return;
        }

        if (typeof toast === 'function') toast('✅ طاولة ' + num + ' مفتوحة', 'success');

        // تحديث
        const all = await activityGetAll('restaurant', 'tables', 200);
        window._restTablesState = all || [];
        const c = document.getElementById('activity-restaurant-tables');
        if (c) _restRenderTablesList(c);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._restOpenTableByNum = _restOpenTableByNum;


// ─── تنظيف الطاولة ───
async function _restCleanTable(tableId) {
    if (!tableId) { alert('⚠️ معرّف الطاولة مفقود'); return; }
    if (!confirm('🧹 تأكيد تنظيف الطاولة؟')) return;

    try {
        // ① حذف من Firestore
        if (typeof activityDelete === 'function') {
            await activityDelete('restaurant', 'tables', tableId);
            console.log('🗑️ [clean] deleted from Firestore:', tableId);
        } else {
            alert('⚠️ activityDelete غير متاحة');
            return;
        }

        // ② إعادة الجلب من Firestore (تأكيد)
        let all = [];
        try {
            all = await activityGetAll('restaurant', 'tables', 200);
        } catch(e) {
            console.warn('[clean] refetch:', e.message);
        }

        // ③ تحقق: هل الطاولة لا تزال موجودة؟
        const stillExists = (all || []).some(x => x.id === tableId);
        if (stillExists) {
            alert('⚠️ الطاولة لم تُحذف من Firestore!\n\n' +
                  'هذا يعني مشكلة في Firestore Rules.\n' +
                  'تحقق من Console.');
            return;
        }

        // ④ تحديث الحالة المحلية
        window._restTablesState = all || [];

        if (typeof toast === 'function') {
            toast('✅ تم التنظيف — الطاولة متاحة', 'success');
        } else {
            alert('✅ تم التنظيف');
        }

        // ⑤ إعادة العرض
        const c = document.getElementById('activity-restaurant-tables');
        if (c) _restRenderTablesList(c);

    } catch(e) {
        console.error('[clean]', e);
        alert('⚠️ خطأ في التنظيف: ' + e.message);
    }
}

window._restCleanTable = _restCleanTable;


// ─── تعديل عدد الطاولات ───
function _restSetTableCount() {
    const current = window._restTableCount || 20;
    const val = prompt('🔢 عدد الطاولات في المطعم:', String(current));
    if (!val) return;
    const n = parseInt(val);
    if (isNaN(n) || n < 1 || n > 100) {
        alert('⚠️ أدخل رقماً بين 1 و 100');
        return;
    }
    window._restTableCount = n;
    try { localStorage.setItem('restTableCount', String(n)); } catch(e) {}
    if (typeof toast === 'function') toast('✅ العدد: ' + n, 'success');

    const c = document.getElementById('activity-restaurant-tables');
    if (c) _restRenderTablesList(c);
}

window._restSetTableCount = _restSetTableCount;

// تحميل عدد الطاولات
try {
    const saved = localStorage.getItem('restTableCount');
    window._restTableCount = saved ? parseInt(saved) : 20;
} catch(e) {
    window._restTableCount = 20;
}

async function _restOpenTable(tableId) {
    // ✅ جلب من Firestore مباشرة (تحديث حي)
    let t = null;
    try {
        if (typeof activityGetAll === 'function') {
            const all = await activityGetAll('restaurant', 'tables', 200);
            window._restTablesState = all || [];
            t = (all || []).find(x => x.id === tableId);
        }
    } catch(e) {
        console.warn('[restaurant] refresh failed:', e.message);
    }

    // احتياطي: من الحالة المحلية
    if (!t) {
        t = (window._restTablesState || []).find(x => x.id === tableId);
    }
    if (!t) { alert('⚠️ الطاولة غير موجودة'); return; }

    const isReady = t.status === 'ready';
    const total = parseFloat(t.total) || 0;
    const items = t.items || [];

    let itemsHtml = '';
    if (items.length === 0) {
        itemsHtml = '<div style="text-align:center; padding:15px; color:#999;">لا توجد أطباق</div>';
    } else {
        items.forEach(it => {
            itemsHtml += `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; font-size:13px;">
                    <span>${_afEsc(it.name || '—')} × ${it.qty || 1}</span>
                    <span style="font-weight:600; color:#27ae60;">${_afFmt((parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0))}</span>
                </div>
            `;
        });
    }

    const modal = document.createElement('div');
    modal.id = 'restTableModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; max-width:500px; width:100%; max-height:90vh; overflow-y:auto; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:18px;">🪑 طاولة ${_afEsc(t.tableNumber || '?')}</h2>
                <button onclick="document.getElementById('restTableModal').remove()" style="background:#ecf0f1; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
            </div>

            ${t.customerName ? `<div style="font-size:13px; color:#666; margin-bottom:10px;">👤 ${_afEsc(t.customerName)}</div>` : ''}
            ${t.guests ? `<div style="font-size:13px; color:#666; margin-bottom:10px;">👥 ${t.guests} أشخاص</div>` : ''}

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:12px;">
                <h4 style="margin:0 0 8px 0; font-size:13px; color:#2c3e50;">📋 الأطباق (${items.length})</h4>
                ${itemsHtml}
                <div style="display:flex; justify-content:space-between; padding:10px 0 0 0; margin-top:10px; border-top:2px solid #27ae60; font-size:16px; font-weight:bold;">
                    <span>الإجمالي:</span>
                    <span style="color:#27ae60;">${_afFmt(total)}</span>
                </div>
            </div>

            <button onclick="_restAddItemsModal('${t.id}')" style="width:100%; padding:14px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; margin-bottom:8px; box-shadow:0 3px 10px rgba(52,152,219,0.3);">
                ➕ إضافة أطباق
            </button>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                <button onclick="document.getElementById('restTableModal').remove(); _restPrintTableOrder('${t.id}')" style="padding:12px; background:linear-gradient(135deg,#34495e,#2c3e50); color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">🖨️ طباعة</button>
                <button onclick="document.getElementById('restTableModal').remove(); _restDeleteTable('${t.id}')" style="padding:12px; background:#e74c3c; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">🗑️ حذف</button>
            </div>

            ${!isReady ? `
                <button onclick="document.getElementById('restTableModal').remove(); _restMarkReady('${t.id}')" style="width:100%; padding:12px; background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:8px;">🟡 تعليم كجاهزة</button>
            ` : ''}

            <button onclick="document.getElementById('restTableModal').remove(); _restPayTable('${t.id}')" style="width:100%; padding:14px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer;">💵 تسجيل الدفع + إغلاق</button>
        </div>
    `;

    document.body.appendChild(modal);
}

async function _restMarkReady(tableId) {
    try {
        if (typeof activityUpdate === 'function') {
            await activityUpdate('restaurant', 'tables', tableId, { status: 'ready', readyAt: Date.now() });
        }
        if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'tables');
        if (typeof toast === 'function') toast('🟡 الطاولة جاهزة', 'success');
        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-tables');
            if (c) _restRenderTables(c);
        }, 500);
    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _restPayTable(tableId) {
    // ✅ ضبط النوع
    window._restCurrentType = 'table';
    window._restPaymentType = 'table';

    const t = (window._restTablesState || []).find(x => x.id === tableId);
    if (!t) return;

    const total = parseFloat(t.total) || 0;
    if (total <= 0) {
        if (!confirm('⚠️ الطاولة بدون أطباق\n\nهل تُريد إغلاقها بدون دفع؟')) return;
        try {
            await activityUpdate('restaurant', 'tables', tableId, {
                status: 'paid', paidAt: Date.now(), paidAmount: 0, paymentType: 'empty'
            });
            if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'tables');
            setTimeout(() => {
                const c = document.getElementById('activity-restaurant-tables');
                if (c) _restRenderTables(c);
            }, 500);
        } catch(e) { alert('⚠️ ' + e.message); }
        return;
    }

    _restPaymentModal(tableId, t, total);
}

// ═══════════════════════════════════════════════════════════
//  💵 PAYMENT MODAL — نافذة الدفع الكاملة
// ═══════════════════════════════════════════════════════════
function _restPaymentModal(tableId, table, total) {
    // ✅ VAT حسب الدولة
    window._restVatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
    window._restVatAmount = window._restVatRate > 0 ? total * (window._restVatRate / 100) : 0;
    window._restGrandTotal = total + window._restVatAmount;

    // الصندوق الافتراضي
    const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) ? _pbCache : [];
    let boxOptions = '<option value="">— بدون صندوق —</option>';
    boxes.forEach(b => {
        boxOptions += `<option value="${b.id}">${b.icon || '💰'} ${_afEsc(b.name || '—')} (${_afFmt(b.balance || 0)})</option>`;
    });
    // الصندوق الافتراضي (أول صندوق)
    if (boxes.length > 0) {
        boxOptions = boxOptions.replace(`<option value="${boxes[0].id}">`, `<option value="${boxes[0].id}" selected>`);
    }

    // العملاء
    const allCustomers = (typeof window.customers !== 'undefined' && Array.isArray(window.customers)) ? window.customers : [];
    let customerOptions = '<option value="">— اختر عميل —</option>';
    allCustomers.slice(0, 50).forEach(c => {
        customerOptions += `<option value="${c.id}">${_afEsc(c.name || '—')}${c.phone ? ' • ' + _afEsc(c.phone) : ''}</option>`;
    });

    // آخر فاتورة
    const saleCount = (typeof sales !== 'undefined' && Array.isArray(sales))
        ? sales.filter(s => s.invoice && s.invoice.startsWith('REST-')).length + 1 : 1;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const invoicePreview = `REST-${yyyy}${mm}${dd}-${String(saleCount).padStart(3, '0')}`;

    const modal = document.createElement('div');
    modal.id = 'restPaymentModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:9999999; display:flex; align-items:center; justify-content:center; padding:10px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; max-width:520px; width:100%; max-height:95vh; overflow-y:auto; padding:20px; box-sizing:border-box;">

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:18px;">💵 تسجيل الدفع</h2>
                <button onclick="document.getElementById('restPaymentModal').remove()" style="background:#ecf0f1; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
            </div>

            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:12px; padding:15px; margin-bottom:15px; text-align:center;">
                <div style="font-size:13px; opacity:0.9;">🪑 طاولة ${_afEsc(table.tableNumber || '?')}</div>
                ${table.customerName ? `<div style="font-size:12px; opacity:0.85; margin-top:3px;">👤 ${_afEsc(table.customerName)}</div>` : ''}
                <div style="font-size:28px; font-weight:bold; margin-top:8px;">${_afFmt(_restGrandTotal)}</div>
                <div style="font-size:11px; opacity:0.8; margin-top:3px;">💰 الإجمالي المطلوب</div>
                ${_restVatRate > 0 ? `<div style="font-size:10px; opacity:0.7; margin-top:3px;">(يتضمن ضريبة ${_restVatRate}%)</div>` : ''}
            </div>

            <div style="font-size:12px; color:#999; text-align:center; margin-bottom:15px;">
                📄 رقم الفاتورة: <b style="color:#3498db;">${invoicePreview}</b>
            </div>

            <div style="margin-bottom:12px;">
                <label style="display:block; font-size:13px; color:#555; font-weight:600; margin-bottom:6px;">💳 الصندوق</label>
                <select id="restPayBox" style="width:100%; padding:11px; border:1px solid #ddd; border-radius:8px; background:white; font-size:14px; box-sizing:border-box;">
                    ${boxOptions}
                </select>
            </div>

            <div style="margin-bottom:12px;">
                <label style="display:block; font-size:13px; color:#555; font-weight:600; margin-bottom:6px;">💵 طريقة الدفع</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <label style="padding:12px; background:#e8f5e9; border:2px solid #27ae60; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:600;" id="restPayCashLabel">
                        <input type="radio" name="restPayType" value="cash" checked onchange="_restUpdatePayUI()"> 💵 نقدي
                    </label>
                    <label style="padding:12px; background:white; border:2px solid #ddd; border-radius:8px; text-align:center; cursor:pointer; font-size:13px; font-weight:600;" id="restPayCreditLabel">
                        <input type="radio" name="restPayType" value="credit" onchange="_restUpdatePayUI()"> 💳 آجل
                    </label>
                </div>
            </div>

            <div id="restPayCustomerWrap" style="margin-bottom:12px; display:none;">
                <label style="display:block; font-size:13px; color:#555; font-weight:600; margin-bottom:6px;">👤 العميل</label>
                <select id="restPayCustomer" style="width:100%; padding:11px; border:1px solid #ddd; border-radius:8px; background:white; font-size:14px; box-sizing:border-box;">
                    ${customerOptions}
                </select>
                <div style="font-size:11px; color:#999; margin-top:4px;">💡 سيُضاف الدين على حساب العميل</div>
            </div>

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:15px;">
                <div style="font-size:12px; color:#666; margin-bottom:8px;">📊 تفاصيل:</div>
                <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0;">
                    <span>عدد الأطباق:</span>
                    <span>${(table.items || []).length}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0;">
                    <span>المجموع:</span>
                    <span>${_afFmt(total)}</span>
                </div>
                ${_restVatRate > 0 ? `
                <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0; color:#e67e22;">
                    <span>💸 الضريبة (${_restVatRate}%):</span>
                    <span>${_afFmt(_restVatAmount)}</span>
                </div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:15px; padding:8px 0 0 0; border-top:2px solid #27ae60; margin-top:6px;">
                    <span style="font-weight:700;">الإجمالي:</span>
                    <span style="font-weight:bold; color:#27ae60; font-size:17px;">${_afFmt(_restGrandTotal)}</span>
                </div>
            </div>

            <button onclick="_restConfirmPayment('${tableId}', ${total})" style="width:100%; padding:15px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 3px 10px rgba(39,174,96,0.3);">
                ✅ تأكيد الدفع ${_restVatRate > 0 ? '(' + _afFmt(_restGrandTotal) + ')' : ''}
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    console.log('💵 [restaurant] payment modal opened for table', table.tableNumber);
}

function _restUpdatePayUI() {
    const type = document.querySelector('input[name="restPayType"]:checked')?.value;
    const custWrap = document.getElementById('restPayCustomerWrap');
    const cashLbl = document.getElementById('restPayCashLabel');
    const creditLbl = document.getElementById('restPayCreditLabel');

    if (type === 'credit') {
        if (custWrap) custWrap.style.display = 'block';
        if (cashLbl) { cashLbl.style.background = 'white'; cashLbl.style.borderColor = '#ddd'; }
        if (creditLbl) { creditLbl.style.background = '#fdecea'; creditLbl.style.borderColor = '#e74c3c'; }
    } else {
        if (custWrap) custWrap.style.display = 'none';
        if (cashLbl) { cashLbl.style.background = '#e8f5e9'; cashLbl.style.borderColor = '#27ae60'; }
        if (creditLbl) { creditLbl.style.background = 'white'; creditLbl.style.borderColor = '#ddd'; }
    }
}

async function _restConfirmPayment(targetId, total) {
    // ✅ تحديد النوع (طاولة أو توصيل)
    const targetType = window._restCurrentType || window._restPaymentType || 'table';

    let table = null;
    if (targetType === 'delivery') {
        table = (window._restDeliveryState || []).find(x => x.id === targetId);
        if (!table) {
            // محاولة جلب من Firestore
            try {
                const all = await activityGetAll('restaurant', 'delivery', 200);
                window._restDeliveryState = all || [];
                table = (all || []).find(x => x.id === targetId);
            } catch(e) {}
        }
        if (!table) { alert('⚠️ طلب التوصيل غير موجود'); return; }
        // تحديث tableNumber ليعرض "🛵 توصيل"
        table.tableNumber = table.tableNumber || '🛵 توصيل';
    } else {
        table = (window._restTablesState || []).find(x => x.id === targetId);
        if (!table) { alert('⚠️ الطاولة غير موجودة'); return; }
    }

    const boxId = document.getElementById('restPayBox')?.value || '';
    const payType = document.querySelector('input[name="restPayType"]:checked')?.value || 'cash';
    const customerId = payType === 'credit' ? (document.getElementById('restPayCustomer')?.value || '') : '';

    // فحص
    if (payType === 'credit' && !customerId) {
        alert('⚠️ اختر العميل للدين');
        return;
    }
    if (payType === 'cash' && !boxId) {
        if (!confirm('⚠️ لم تختر صندوقاً\n\nهل تُريد المتابعة بدون إضافة المبلغ للصندوق؟')) return;
    }

    // تأكيد
    const payTypeLabel = payType === 'cash' ? '💵 نقدي' : '💳 آجل';
    const confirmMsg = '💵 تأكيد الدفع\n\n🪑 طاولة ' + table.tableNumber + '\n💰 الإجمالي: ' + _afFmt(total) + '\n💳 الدفع: ' + payTypeLabel + '\n\nمتابعة؟';
    if (!confirm(confirmMsg)) return;

    try {
        // ─── رقم الفاتورة ───
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const _salesList = (typeof sales !== 'undefined' && Array.isArray(sales))
            ? sales
            : (Array.isArray(window.sales) ? window.sales : []);
        const saleCount = _salesList.filter(s => s.invoice && s.invoice.startsWith('REST-')).length + 1;
        const invoice = `REST-${yyyy}${mm}${dd}-${String(saleCount).padStart(3, '0')}`;
        // ✅ التاريخ بتوقيت محلي (لا UTC)
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // ✅ VAT حسب الدولة
        const vatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
        const vatAmount = vatRate > 0 ? total * (vatRate / 100) : 0;
        const grandTotal = total + vatAmount;

        // ─── المبيعات ───
        const saleItems = (table.items || []).map(it => ({
            materialName: it.name || '—',
            qty: parseFloat(it.qty) || 0,
            unitPrice: parseFloat(it.price) || 0,
            costAtSale: parseFloat(it.cost) || 0,
            total: (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0),
            menuItemId: it.menuItemId || null
        }));

        const paid = payType === 'cash' ? grandTotal : 0;
        const remaining = payType === 'credit' ? grandTotal : 0;

        const customerName = table.customerName || (customerId ? ((window.customers || []).find(c => String(c.id) === String(customerId))?.name || 'عميل') : ('طاولة ' + table.tableNumber));

        const newSale = {
            invoice: invoice,
            date: todayStr,
            customer: customerName,
            items: saleItems,
            total: total,
            paid: paid,
            remaining: remaining,
            vat: vatAmount,
            vatRate: vatRate,
            grandTotal: grandTotal,
            isRestaurant: true,
            source: 'restaurant',
            sourceId: targetId,
            tableNumber: table.tableNumber,
            paymentBox: boxId,
            paymentType: payType,
            customerId: customerId || null,
            isDelivery: table.isDelivery || false,
            driver: table.driver || '',
            address: table.address || '',
            area: table.area || '',
            deliveryFee: parseFloat(table.deliveryFee) || 0
        };

        if (typeof sales !== 'undefined' && Array.isArray(sales)) {
            sales.push(newSale);
        }

        // ✅ حفظ الفاتورة على الطاولة لضمان الربط
        try {
            await activityUpdate('restaurant', targetType === 'delivery' ? 'delivery' : 'tables', targetId, {
                invoice: invoice,
                paidAt: Date.now(),
                paidAmount: paid,
                status: 'paid',
                vatRate: vatRate,
                vat: vatAmount,
                grandTotal: grandTotal
            });
            if (table) {
                table.invoice = invoice;
                table.status = 'paid';
                table.paidAt = Date.now();
            }
        } catch(e) { console.warn('[rest] update table:', e.message); }

        // ─── إضافة للصندوق ───
        if (payType === 'cash' && boxId && paid > 0) {
            if (typeof pbAdjustBalance === 'function') {
                await pbAdjustBalance(boxId, paid, 'add', {
                    reason: 'restaurant',
                    reasonLabel: 'دفع طاولة ' + table.tableNumber + ' — ' + invoice,
                    relatedId: invoice
                });
            }
        }

        // ─── إضافة دين للعميل ───
        if (payType === 'credit' && customerId && remaining > 0) {
            // تحديث العميل
            if (typeof customers !== 'undefined' && Array.isArray(customers)) {
                const cust = customers.find(c => String(c.id) === String(customerId));
                if (cust) {
                    cust.balance = (parseFloat(cust.balance) || 0) + remaining;
                }
            }

            // تسجيل الحركة
            if (typeof db !== 'undefined' && typeof currentUser !== 'undefined' && currentUser?.uid) {
                try {
                    await db.collection('users').doc(_getEffectiveUid()).collection('customer_transactions').add({
                        customerId: customerId,
                        type: 'debit',
                        amount: remaining,
                        description: 'طلب مطعم — طاولة ' + table.tableNumber + ' — ' + invoice,
                        relatedId: invoice,
                        date: todayStr,
                        createdAt: Date.now()
                    });
                } catch(e) {
                    console.warn('[restaurant] customer tx:', e.message);
                }
            }
        }

        // ─── تحديث الهدف (طاولة أو توصيل) ───
        const updatePayload = {
            status: 'paid',
            paidAt: Date.now(),
            paidAmount: paid,
            remainingAmount: remaining,
            paymentType: payType,
            invoice: invoice,
            paymentBox: boxId,
            customerId: customerId || null,
            vat: vatAmount,
            vatRate: vatRate,
            grandTotal: grandTotal
        };

        if (targetType === 'delivery') {
            await activityUpdate('restaurant', 'delivery', targetId, updatePayload);
        } else {
            await activityUpdate('restaurant', 'tables', targetId, updatePayload);
        }

        // ─── حفظ ───
        if (typeof saveAllData === 'function') await saveAllData();

        // ─── إغلاق Modal ───
        const m = document.getElementById('restPaymentModal');
        if (m) m.remove();

        // ─── إشعار ───
        if (typeof showSuccessToast === 'function') {
            const details = [
                { icon: '📄', label: 'الفاتورة', value: invoice },
                { icon: '🪑', label: 'الطاولة', value: table.tableNumber },
                { icon: '💰', label: 'الإجمالي', value: _afFmt(grandTotal) },
                { icon: payType === 'cash' ? '💵' : '💳', label: 'الدفع', value: payTypeLabel }
            ];
            if (payType === 'credit' && customerName) {
                details.push({ icon: '👤', label: 'العميل', value: customerName });
            }
            showSuccessToast({
                title: '✅ تم الدفع بنجاح',
                details: details,
                actions: [
                    { label: '🖨️ طباعة', icon: '🖨️', onClick: () => _restPrintReceipt(invoice, targetId) },
                    { label: '✅ إغلاق', icon: '✓', style: 'light', onClick: () => {} }
                ],
                duration: 8000
            });
        } else {
            alert('✅ تم الدفع\n📄 ' + invoice + '\n💰 ' + _afFmt(total));
        }

        // ─── تحديث القائمة ───
        if (targetType === 'delivery') {
            if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'delivery');
            setTimeout(() => {
                const c = document.getElementById('activity-restaurant-delivery');
                if (c) _restRenderDelivery(c);
            }, 500);
        } else {
            if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'tables');
            setTimeout(() => {
                const c = document.getElementById('activity-restaurant-tables');
                if (c) _restRenderTables(c);
            }, 500);
        }

    } catch(e) {
        console.error('[restaurant] payment:', e);
        alert('⚠️ خطأ في الدفع: ' + e.message);
    }
}

function _restPrintReceipt(invoice, tableId) {
    // ─── البحث في كل المصادر ───
    let sale = null;

    // 🆕 ① الأفضل: ابحث بالـ tableId في _restTablesState أولاً
    (function() {
        const allTables = window._restTablesState || [];
        let t = tableId ? allTables.find(x => x.id === tableId) : null;
        if (!t) t = allTables.find(x => x.invoice === invoice);
        if (!t) {
            const allDels = window._restDeliveryState || [];
            t = allDels.find(x => x.invoice === invoice);
        }
        if (t) {
            sale = {
                invoice: t.invoice || invoice,
                date: t.paidAt ? new Date(t.paidAt).toISOString().slice(0, 10) : '',
                customer: t.customerName || '',
                items: (t.items || []).map(it => ({
                    materialName: it.name || '—',
                    qty: parseFloat(it.qty) || 0,
                    unitPrice: parseFloat(it.price) || 0,
                    total: (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)
                })),
                total: parseFloat(t.total) || 0,
                vat: parseFloat(t.vat) || 0,
                vatRate: parseFloat(t.vatRate) || 0,
                grandTotal: parseFloat(t.grandTotal) || parseFloat(t.total) || 0,
                paymentType: t.paymentType || 'cash',
                paymentBox: t.paymentBox || '',
                tableNumber: t.tableNumber,
                deliveryFee: parseFloat(t.deliveryFee) || 0,
                driver: t.driver || '',
                address: t.address || '',
                area: t.area || ''
            };
        }
    })();

    if (!sale && typeof window.sales !== 'undefined' && Array.isArray(window.sales)) {
        sale = window.sales.find(s => s.invoice === invoice);
    }
    if (!sale) {
        try {
            if (typeof sales !== 'undefined' && Array.isArray(sales)) {
                sale = sales.find(s => s.invoice === invoice);
            }
        } catch(e) {}
    }
    if (!sale) {
        const allTables = window._restTablesState || [];
        let t = tableId ? allTables.find(x => x.id === tableId) : null;
        if (!t) t = allTables.find(x => x.invoice === invoice);
        if (!t) {
            const allDels = window._restDeliveryState || [];
            t = allDels.find(x => x.invoice === invoice);
        }
        if (t) {
            sale = {
                invoice: t.invoice,
                date: t.paidAt ? new Date(t.paidAt).toISOString().slice(0, 10) : '',
                customer: t.customerName || '',
                items: (t.items || []).map(it => ({
                    materialName: it.name || '—',
                    qty: parseFloat(it.qty) || 0,
                    unitPrice: parseFloat(it.price) || 0,
                    total: (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)
                })),
                total: parseFloat(t.total) || 0,
                vat: parseFloat(t.vat) || 0,
                vatRate: parseFloat(t.vatRate) || 0,
                grandTotal: parseFloat(t.grandTotal) || parseFloat(t.total) || 0,
                paymentType: t.paymentType || 'cash',
                paymentBox: t.paymentBox || '',
                tableNumber: t.tableNumber,
                deliveryFee: parseFloat(t.deliveryFee) || 0,
                driver: t.driver || '',
                address: t.address || '',
                area: t.area || ''
            };
        }
    }

    if (!sale) { alert('⚠️ الفاتورة غير موجودة'); return; }

    // 🆕 استخدام الطباعة الحرارية الموحّدة
    if (typeof window.ThermalPrint !== 'undefined') {
        try {
            window.ThermalPrint.restaurant(sale, {
                name: currentUser?.businessName || 'المطعم',
                description: currentUser?.businessDescription || '',
                phone: currentUser?.phone || '',
                address: (typeof _afFormatLocation === 'function') ? _afFormatLocation(currentUser?.location) : '',
                signature: currentUser?.ownerSignature || ''
            });
            return;
        } catch(e) {
            console.warn('[rest-print] thermal fallback:', e);
        }
    }

    // Fallback: الطباعة القديمة
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'المطعم';
    const bizPhone = biz.phone || '';
    const bizDesc = biz.businessDescription || '';
    const bizLocation = (typeof _afFormatLocation === 'function') ? _afFormatLocation(biz.location) : '';
    const signature = biz.ownerSignature || '';

    // ─── التاريخ والوقت ───
    const now = new Date();
    const dateStr = sale.date || (
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0')
    );
    const printTime = now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });

    // ─── VAT ───
    const vatRate = parseFloat(sale.vatRate) || 0;
    const vatAmount = parseFloat(sale.vat) || 0;
    const subtotal = parseFloat(sale.total) || 0;
    const deliveryFee = parseFloat(sale.deliveryFee) || 0;
    const grandTotal = parseFloat(sale.grandTotal) || (subtotal + vatAmount);

    // ─── العميل ───
    let customerName = (sale.customer || '').trim();
    if (!customerName || customerName === ('طاولة ' + sale.tableNumber)) {
        customerName = 'زائر';
    }

    // ─── نوع الفاتورة: طاولة أم توصيل؟ ───
    const isDelivery = sale.source === 'restaurant' && (
        sale.isDelivery === true ||
        (sale.tableNumber && String(sale.tableNumber).indexOf('توصيل') >= 0) ||
        !!sale.driver ||
        !!sale.address ||
        !!sale.deliveryFee
    ) && !sale.tableNumber?.match(/^\d+$/);

    // fallback: نستنتج من حقول التوصيل
    const hasDeliveryFields = !!(sale.driver || sale.address || parseFloat(sale.deliveryFee) > 0);
    const isTableNumber = sale.tableNumber && /^[0-9]+$/.test(String(sale.tableNumber).trim());
    const invoiceType = (isDelivery || (hasDeliveryFields && !isTableNumber)) ? 'delivery' : 'table';

    // اسم السائق / العنوان
    const driverName = sale.driver || '';
    const address = sale.address || '';
    const area = sale.area || '';

    // ─── الصندوق ───
    let boxName = '';
    if (sale.paymentBox && typeof _getBoxName === 'function') {
        try { boxName = _getBoxName(sale.paymentBox); } catch(e) {}
    }

    // ─── الأصناف (نص monospace) ───
    let itemsHtml = '';
    (sale.items || []).forEach(it => {
        const lineTotal = _afFmt(it.total);
        itemsHtml += `
            <tr>
                <td style="padding:2px 0; text-align:right; font-size:11px; vertical-align:top;">${_afEsc(it.materialName)}</td>
                <td style="padding:2px 0; text-align:center; font-size:11px; width:30px;">${it.qty}</td>
                <td style="padding:2px 0; text-align:left; font-size:11px; width:55px; direction:ltr;">${lineTotal}</td>
            </tr>
        `;
    });

    const payIcon = sale.paymentType === 'credit' ? '💳' : '💵';
    const payLabel = sale.paymentType === 'credit' ? 'آجل' : 'نقدي';

    const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة ${_afEsc(sale.invoice)}</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'Courier New', 'Tahoma', monospace;
                    direction: rtl;
                    background: #f0f0f0;
                    padding: 10px;
                    display: flex;
                    justify-content: center;
                }
                .receipt {
                    background: white;
                    width: 280px;
                    padding: 12px 10px;
                    font-size: 11px;
                    line-height: 1.4;
                    color: #000;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .lg { font-size: 14px; }
                .sm { font-size: 10px; }
                .xs { font-size: 9px; }
                .dashed {
                    border-top: 1px dashed #000;
                    margin: 6px 0;
                }
                .solid {
                    border-top: 1px solid #000;
                    margin: 6px 0;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    padding: 1px 0;
                }
                .row-key { color: #333; }
                .row-val { font-weight: bold; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .total-line {
                    font-size: 14px;
                    font-weight: bold;
                    padding: 6px 0;
                    text-align: center;
                    border: 1px solid #000;
                    border-radius: 3px;
                    margin-top: 4px;
                }
                .pay-status {
                    font-weight: bold;
                    font-size: 12px;
                    padding: 4px 0;
                    text-align: center;
                    border: 1px dashed #000;
                    margin: 6px 0;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                        display: block;
                    }
                    .receipt {
                        width: 80mm;
                        padding: 2mm;
                        font-size: 10px;
                        margin: 0 auto;
                    }
                    @page {
                        size: 80mm auto;
                        margin: 2mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">

                <!-- رأس -->
                <div class="center">
                    <div class="lg bold">🍽️ ${_afEsc(bizName)}</div>
                    ${bizDesc ? `<div class="xs" style="color:#555;">${_afEsc(bizDesc)}</div>` : ''}
                    ${bizPhone ? `<div class="sm">📞 ${_afEsc(bizPhone)}</div>` : ''}
                    ${bizLocation ? `<div class="xs" style="color:#555;">📍 ${_afEsc(bizLocation)}</div>` : ''}
                </div>

                <div class="dashed"></div>

                <!-- معلومات الفاتورة -->
                <div class="row">
                    <span class="row-key">📄 رقم:</span>
                    <span class="row-val sm">${_afEsc(sale.invoice)}</span>
                </div>
                <div class="row">
                    <span class="row-key">📅 التاريخ:</span>
                    <span>${dateStr}</span>
                </div>
                <div class="row">
                    <span class="row-key">⏰ الوقت:</span>
                    <span>${printTime}</span>
                </div>
                ${invoiceType === 'table' ? `
                <div class="row">
                    <span class="row-key">🪑 الطاولة:</span>
                    <span class="bold">${_afEsc(sale.tableNumber || '—')}</span>
                </div>
                ` : `
                <div class="row">
                    <span class="row-key">🛵 نوع الطلب:</span>
                    <span class="bold">توصيل للمنزل</span>
                </div>
                `}
                <div class="row">
                    <span class="row-key">👤 الزبون:</span>
                    <span>${_afEsc(customerName)}</span>
                </div>
                ${invoiceType === 'delivery' && address ? `
                <div class="row">
                    <span class="row-key">📍 العنوان:</span>
                    <span class="sm" style="text-align:left;">${_afEsc(address)}${area ? ' — ' + _afEsc(area) : ''}</span>
                </div>` : ''}
                ${invoiceType === 'delivery' && driverName ? `
                <div class="row">
                    <span class="row-key">🏍️ السائق:</span>
                    <span class="bold">${_afEsc(driverName)}</span>
                </div>` : ''}
                ${boxName ? `<div class="row"><span class="row-key">💳 الصندوق:</span><span>${_afEsc(boxName)}</span></div>` : ''}

                <div class="dashed"></div>

                <!-- جدول الأصناف -->
                <table>
                    <thead>
                        <tr style="border-bottom: 1px solid #000;">
                            <th style="text-align:right; padding:3px 0; font-size:10px;">الطبق</th>
                            <th style="text-align:center; padding:3px 0; font-size:10px; width:30px;">عدد</th>
                            <th style="text-align:left; padding:3px 0; font-size:10px; width:55px;">إجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="dashed"></div>

                <!-- المجاميع -->
                <div class="row">
                    <span class="row-key">المجموع:</span>
                    <span>${_afFmt(subtotal)}</span>
                </div>

                ${deliveryFee > 0 ? `
                <div class="row">
                    <span class="row-key">🛵 توصيل:</span>
                    <span>${_afFmt(deliveryFee)}</span>
                </div>` : ''}

                ${vatRate > 0 ? `
                <div class="row">
                    <span class="row-key">💸 ضريبة ${vatRate}%:</span>
                    <span>${_afFmt(vatAmount)}</span>
                </div>` : ''}

                <div class="solid"></div>

                <div class="total-line">
                    💰 الإجمالي: ${_afFmt(grandTotal)}
                </div>

                <!-- حالة الدفع -->
                <div class="pay-status">
                    ${payIcon} ${payLabel === 'آجل' ? 'دين آجل — لم يُدفع' : 'مدفوع نقدي'}
                </div>

                <div class="dashed"></div>

                ${invoiceType === 'delivery' ? `
                <!-- مكان التوقيع للتوصيل -->
                <div style="margin-top:8px;">
                    <div class="sm" style="text-align:right; margin-bottom:4px;">✍️ توقيع المستلم:</div>
                    <div style="border-bottom:1px dotted #000; height:22px;"></div>
                    <div class="xs" style="color:#888; text-align:right; margin-top:2px;">الاسم: ______________________</div>
                </div>

                <div style="margin-top:10px;">
                    <div class="sm" style="text-align:right; margin-bottom:4px;">🏍️ توقيع السائق:</div>
                    <div style="border-bottom:1px dotted #000; height:22px;"></div>
                </div>
                ` : ''}

                <div class="dashed"></div>

                <!-- Footer -->
                <div class="center">
                    <div class="sm bold">🌟 ${invoiceType === 'delivery' ? 'شكراً لطلبكم' : 'شكراً لزيارتكم'}</div>
                    <div class="xs" style="color:#555; margin-top:2px;">نتشرف بخدمتكم دائماً</div>
                    ${signature ? `<div class="xs" style="margin-top:4px;">✍️ ${_afEsc(signature)}</div>` : ''}
                    <div class="xs" style="color:#888; margin-top:6px;">🕐 طُبعت: ${printTime}</div>
                </div>

            </div>
        </body>
        </html>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('⚠️ اسمح بالنوافذ المنبثقة'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
}

window._restPrintReceipt = _restPrintReceipt;

async function _restDeleteTable(tableId) {
    if (!confirm('🗑️ حذف هذه الطاولة نهائياً؟')) return;
    try {
        if (typeof activityDelete === 'function') {
            await activityDelete('restaurant', 'tables', tableId);
        }
        if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'tables');
        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-tables');
            if (c) _restRenderTables(c);
        }, 500);
    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

function _restPrintTableOrder(tableId) {
    const t = (window._restTablesState || []).find(x => x.id === tableId);
    if (!t) return;

    const items = t.items || [];
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'المطعم';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });

    let itemsHtml = '';
    let total = 0;
    items.forEach(it => {
        const qty = parseFloat(it.qty) || 1;
        const price = parseFloat(it.price) || 0;
        const subtotal = qty * price;
        total += subtotal;
        itemsHtml += `
            <tr>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:right;">${_afEsc(it.name)}</td>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:center;">${qty}</td>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:left;">${price.toLocaleString('en-US')}</td>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:left;">${subtotal.toLocaleString('en-US')}</td>
            </tr>
        `;
    });

    const html = `
        <div style="font-family:Tahoma,Arial,sans-serif; direction:rtl; max-width:300px; margin:0 auto; padding:15px;">
            <div style="text-align:center; border-bottom:2px solid #2c3e50; padding-bottom:10px; margin-bottom:10px;">
                <h1 style="margin:0; font-size:20px;">🍽️ ${bizName}</h1>
                <div style="font-size:12px; color:#666; margin-top:5px;">طلب طاولة</div>
            </div>

            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:12px; font-size:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>🪑 طاولة:</strong>
                    <strong style="font-size:18px;">${_afEsc(t.tableNumber)}</strong>
                </div>
                ${t.customerName ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>👤 الزبون:</span><span>${_afEsc(t.customerName)}</span></div>` : ''}
                ${t.guests ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>👥 الأشخاص:</span><span>${t.guests}</span></div>` : ''}
                <div style="display:flex; justify-content:space-between;">
                    <span>⏰ الوقت:</span>
                    <span>${timeStr}</span>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
                <thead>
                    <tr style="background:#2c3e50; color:white;">
                        <th style="padding:5px; text-align:right;">الطبق</th>
                        <th style="padding:5px; text-align:center;">عدد</th>
                        <th style="padding:5px; text-align:left;">سعر</th>
                        <th style="padding:5px; text-align:left;">إجمالي</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>

            <div style="background:#27ae60; color:white; padding:12px; border-radius:8px; display:flex; justify-content:space-between; font-size:16px; font-weight:bold;">
                <span>💰 الإجمالي:</span>
                <span>${total.toLocaleString('en-US')} ل.س</span>
            </div>

            <div style="text-align:center; margin-top:15px; font-size:11px; color:#666;">
                🍽️ شكراً لزيارتكم<br>
                ${now.toLocaleDateString('ar-SY')}
            </div>
        </div>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('⚠️ اسمح بالنوافذ المنبثقة'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
}

window._restRenderTables = _restRenderTables;
window._restOpenNewTable = _restOpenNewTable;
window._restOpenTable = _restOpenTable;
window._restMarkReady = _restMarkReady;
window._restPayTable = _restPayTable;
window._restDeleteTable = _restDeleteTable;
window._restPrintTableOrder = _restPrintTableOrder;


// ═══════════════════════════════════════════════════════════
//  🍽️ ADD ITEMS TO TABLE — إضافة أطباق للطاولة
// ═══════════════════════════════════════════════════════════
window._restCartState = {};
window._restCurrentTableId = null;

async function _restAddItemsModal(targetId, targetType) {
    targetType = targetType || 'table';
    window._restCurrentTableId = targetId;
    window._restCurrentType = targetType;
    window._restCartState = {};

    // ✅ جلب المنيو من Firestore مباشرة (بدلاً من الكاش)
    let menuItems = [];
    try {
        if (typeof activityGetAll === 'function') {
            const all = await activityGetAll('restaurant', 'menu', 500);
            menuItems = (all || []).filter(m => m.available !== false);
            console.log('🍽️ [restaurant] menu loaded:', menuItems.length, 'items');
        }
    } catch(e) {
        console.warn('[restaurant] menu load failed:', e.message);
    }

    // احتياطي: من الكاش
    if (menuItems.length === 0 && typeof _activityCache !== 'undefined' && _activityCache.getAll) {
        menuItems = _activityCache.getAll('menu').filter(m => m.available !== false);
    }

    if (menuItems.length === 0) {
        alert('⚠️ لا توجد أطباق في المنيو\n\nأضف أطباقاً أولاً من "قائمة الطعام"');
        return;
    }

    // ✅ خزّن المنيو للاستخدام لاحقاً
    window._restMenuCache = menuItems;

    const cats = {
        'appetizers': '🥗 مقبلات', 'main': '🥘 أطباق رئيسية', 'grill': '🍖 مشاوي',
        'chicken': '🍗 دجاج', 'fastfood': '🥪 ساندويشات', 'salads': '🥗 سلطات',
        'soups': '🍲 شوربات', 'drinks': '🥤 مشروبات', 'juices': '🍹 عصائر',
        'desserts': '🍰 حلويات'
    };

    const modal = document.createElement('div');
    modal.id = 'restAddItemsModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999999; display:flex; align-items:center; justify-content:center; padding:10px;';

    modal.innerHTML = `
        <div style="background:#f8f9fa; border-radius:14px; max-width:600px; width:100%; max-height:95vh; display:flex; flex-direction:column; overflow:hidden;">

            <!-- رأس -->
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <h2 style="margin:0; font-size:17px;">🍽️ إضافة أطباق</h2>
                <button onclick="document.getElementById('restAddItemsModal').remove()" style="background:rgba(255,255,255,0.2); border:none; width:34px; height:34px; border-radius:50%; color:white; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
            </div>

            <!-- بحث -->
            <div style="padding:12px; background:white; border-bottom:1px solid #eee;">
                <input type="text" id="restItemsSearch" placeholder="🔍 ابحث عن طبق..." oninput="_restFilterItems()" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; font-size:14px; box-sizing:border-box;">
            </div>

            <!-- قائمة الأطباق -->
            <div id="restItemsList" style="flex:1; overflow-y:auto; padding:10px; background:white;">
                ${menuItems.map(m => `
                    <div class="rest-item-row" data-cat="${_afEsc(m.category || '')}" data-name="${_afEsc((m.itemName || '').toLowerCase())}" data-price="${m.price || 0}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid #f0f0f0;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:600; color:#2c3e50; font-size:14px;">${_afEsc(m.itemName || '—')}</div>
                            <div style="font-size:11px; color:#999; margin-top:2px;">
                                ${cats[m.category] || '📦'} • ${_afFmt(m.price || 0)}
                            </div>
                        </div>
                        <div class="rest-item-controls" data-id="${m.id}" data-price="${m.price || 0}" data-name="${_afEsc(m.itemName || '')}">
                            <button onclick="_restCartDec('${m.id}', ${m.price || 0}, this)" style="background:#e74c3c; color:white; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">−</button>
                            <span class="rest-item-qty" style="display:inline-block; min-width:30px; text-align:center; font-weight:bold; font-size:14px; color:#2c3e50;">0</span>
                            <button onclick="_restCartAdd('${m.id}', ${m.price || 0}, this)" style="background:#27ae60; color:white; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- السلة -->
            <div id="restCartSummary" style="padding:12px 15px; background:#fff8e1; border-top:2px solid #f39c12;">
                <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:4px;">
                    <span style="font-weight:600;">🛒 السلة:</span>
                    <span id="restCartCount" style="font-weight:600;">0 طبق</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:bold; color:#27ae60; margin-bottom:12px;">
                    <span>💰 الإجمالي:</span>
                    <span id="restCartTotal">0</span>
                </div>
                <button onclick="_restConfirmAddItems()" id="restCartConfirmBtn" disabled style="width:100%; padding:14px; background:#95a5a6; color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:not-allowed;">✅ تأكيد الإضافة</button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
    console.log('🍽️ [restaurant] add items modal opened');
}

function _restCartAdd(id, price, btn) {
    if (!window._restCartState) window._restCartState = {};
    const qty = (window._restCartState[id] || 0) + 1;
    window._restCartState[id] = qty;
    _restUpdateItemQty(id, qty);
    _restUpdateCartSummary();
}

function _restCartDec(id, price, btn) {
    if (!window._restCartState) window._restCartState = {};
    const qty = Math.max(0, (window._restCartState[id] || 0) - 1);
    if (qty === 0) delete window._restCartState[id];
    else window._restCartState[id] = qty;
    _restUpdateItemQty(id, qty);
    _restUpdateCartSummary();
}

function _restUpdateItemQty(id, qty) {
    const controls = document.querySelector('.rest-item-controls[data-id="' + id + '"]');
    if (controls) {
        const qtyEl = controls.querySelector('.rest-item-qty');
        if (qtyEl) qtyEl.textContent = qty;
        if (qty > 0) {
            controls.parentElement.style.background = '#e8f5e9';
        } else {
            controls.parentElement.style.background = '';
        }
    }
}

function _restUpdateCartSummary() {
    const cart = window._restCartState || {};
    const menuItems = window._restMenuCache || [];

    let totalQty = 0;
    let totalPrice = 0;

    Object.keys(cart).forEach(id => {
        const item = menuItems.find(m => String(m.id) === String(id));
        if (!item) return;
        const q = cart[id];
        totalQty += q;
        totalPrice += q * (parseFloat(item.price) || 0);
    });

    const countEl = document.getElementById('restCartCount');
    const totalEl = document.getElementById('restCartTotal');
    const btn = document.getElementById('restCartConfirmBtn');

    if (countEl) countEl.textContent = totalQty + ' طبق';
    if (totalEl) totalEl.textContent = _afFmt(totalPrice);

    if (btn) {
        if (totalQty > 0) {
            btn.disabled = false;
            btn.style.background = 'linear-gradient(135deg,#27ae60,#229954)';
            btn.style.cursor = 'pointer';
            btn.textContent = '✅ تأكيد الإضافة (' + totalQty + ')';
        } else {
            btn.disabled = true;
            btn.style.background = '#95a5a6';
            btn.style.cursor = 'not-allowed';
            btn.textContent = '✅ تأكيد الإضافة';
        }
    }
}

function _restFilterItems() {
    const q = (document.getElementById('restItemsSearch')?.value || '').trim().toLowerCase();
    document.querySelectorAll('.rest-item-row').forEach(row => {
        const name = row.dataset.name || '';
        row.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
    });
}

async function _restConfirmAddItems() {
    const cart = window._restCartState || {};
    const targetId = window._restCurrentTableId;
    const targetType = window._restCurrentType || 'table';
    if (!targetId) { alert('⚠️ لم يُحدّد الهدف'); return; }

    const menuItems = window._restMenuCache || [];

    const newItems = [];
    Object.keys(cart).forEach(id => {
        const item = menuItems.find(m => String(m.id) === String(id));
        if (!item) return;
        newItems.push({
            menuItemId: item.id,
            name: item.itemName,
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0,
            qty: cart[id]
        });
    });

    if (newItems.length === 0) { alert('⚠️ لم تختر أي طبق'); return; }

    // جلب البيانات حسب النوع
    let target = null;
    let currentDeliveryFee = 0;

    if (targetType === 'delivery') {
        target = (window._restDeliveryState || []).find(x => x.id === targetId);
        if (!target) { alert('⚠️ الطلب غير موجود'); return; }
        currentDeliveryFee = parseFloat(target.deliveryFee) || 0;
    } else {
        target = (window._restTablesState || []).find(x => x.id === targetId);
        if (!target) { alert('⚠️ الطاولة غير موجودة'); return; }
    }

    // ✅ الدورات الحالية (مع دعم البيانات القديمة)
    const existingRounds = _restGetRounds(target);

    // ✅ إنشاء دورة جديدة
    const newRound = {
        roundId: 'round-' + Date.now(),
        roundNumber: existingRounds.length + 1,
        items: newItems.map(it => ({ ...it })),
        total: newItems.reduce((s, it) => s + ((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)), 0),
        kitchenStatus: 'new',
        createdAt: Date.now(),
        startedAt: null,
        readyAt: null,
        servedAt: null
    };

    const allRounds = [...existingRounds, newRound];
    const flatItems = _restFlattenRounds(allRounds);
    const itemsTotal = _restTotalRounds(allRounds);
    const grandTotal = itemsTotal + currentDeliveryFee;

    try {
        const payload = {
            rounds: allRounds,
            items: flatItems,
            total: itemsTotal,
            grandTotal: grandTotal,
            kitchenStatus: 'new'
        };

        if (targetType === 'delivery') {
            await activityUpdate('restaurant', 'delivery', targetId, payload);

            const idx = (window._restDeliveryState || []).findIndex(x => x.id === targetId);
            if (idx >= 0) {
                Object.assign(window._restDeliveryState[idx], payload);
            }

            if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'delivery');
            if (typeof toast === 'function') toast('✅ دورة ' + newRound.roundNumber + ' — ' + newItems.length + ' طبق', 'success');

            const m = document.getElementById('restAddItemsModal');
            if (m) m.remove();

            setTimeout(() => {
                _restOpenDelivery(targetId);
            }, 200);

            setTimeout(() => {
                const c = document.getElementById('activity-restaurant-delivery');
                if (c) _restRenderDelivery(c);
            }, 600);

        } else {
            await activityUpdate('restaurant', 'tables', targetId, payload);

            const idx = (window._restTablesState || []).findIndex(x => x.id === targetId);
            if (idx >= 0) {
                Object.assign(window._restTablesState[idx], payload);
            }

            if (typeof activityLoadList === 'function') activityLoadList('restaurant', 'tables');
            if (typeof toast === 'function') toast('✅ دورة ' + newRound.roundNumber + ' — ' + newItems.length + ' طبق', 'success');

            const m = document.getElementById('restAddItemsModal');
            if (m) m.remove();

            setTimeout(() => {
                _restOpenTable(targetId);
            }, 200);

            setTimeout(() => {
                const c = document.getElementById('activity-restaurant-tables');
                if (c) _restRenderTables(c);
            }, 600);
        }

    } catch(e) {
        console.error('[restaurant] add items:', e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._restAddItemsModal = _restAddItemsModal;
window._restCartAdd = _restCartAdd;
window._restCartDec = _restCartDec;
window._restFilterItems = _restFilterItems;
window._restConfirmAddItems = _restConfirmAddItems;


// ═══════════════════════════════════════════════════════════
//  🖨️ PRINT PAID INVOICE — طباعة فاتورة مدفوعة
// ═══════════════════════════════════════════════════════════
function _restPrintPaidInvoice(invoice, tableId) {
    if (!invoice) {
        alert('⚠️ لا يوجد رقم فاتورة');
        return;
    }
    // نمرّر الـ tableId للدالة لاستخدامه كاحتياطي
    if (typeof _restPrintReceipt === 'function') {
        _restPrintReceipt(invoice, tableId);
    } else {
        alert('⚠️ دالة الطباعة غير متاحة');
    }
}

// ═══════════════════════════════════════════════════════════
//  🗑️ DELETE PAID TABLE — حذف طاولة مدفوعة
// ═══════════════════════════════════════════════════════════
async function _restDeletePaidTable(tableId) {
    const t = (window._restTablesState || []).find(x => x.id === tableId);
    if (!t) { alert('⚠️ الطاولة غير موجودة'); return; }

    const total = parseFloat(t.total) || 0;
    const invoice = t.invoice || '';

    const confirmMsg = '🗑️ حذف طاولة مدفوعة؟\n\n' +
        '🪑 طاولة ' + t.tableNumber + '\n' +
        '📄 ' + (invoice || '—') + '\n' +
        '💰 ' + _afFmt(total) + '\n\n' +
        '⚠️ سيُحذف السجل من طلبات الطاولات فقط\n' +
        'الفاتورة تبقى في المبيعات';

    if (!confirm(confirmMsg)) return;

    try {
        if (typeof activityDelete === 'function') {
            await activityDelete('restaurant', 'tables', tableId);
        }

        // إزالة من الحالة المحلية
        const idx = (window._restTablesState || []).findIndex(x => x.id === tableId);
        if (idx >= 0) window._restTablesState.splice(idx, 1);

        if (typeof toast === 'function') toast('✅ تم حذف الطاولة', 'success');
        else alert('✅ تم الحذف');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-tables');
            if (c) _restRenderTables(c);
        }, 300);

    } catch(e) {
        console.error('[restaurant] delete paid:', e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._restPrintPaidInvoice = _restPrintPaidInvoice;
window._restDeletePaidTable = _restDeletePaidTable;


// ═══════════════════════════════════════════════════════════
//  🛵 RESTAURANT DELIVERY — طلبات التوصيل
// ═══════════════════════════════════════════════════════════
window._restDeliveryState = [];

async function _restRenderDelivery(container) {
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>';

    try {
        const deliveries = await activityGetAll('restaurant', 'delivery', 200);
        window._restDeliveryState = deliveries || [];
        _restRenderDeliveryList(container);
    } catch(e) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">خطأ: ' + e.message + '</div>';
    }
}

function _restRenderDeliveryList(container) {
    const deliveries = window._restDeliveryState || [];
    const preparing = deliveries.filter(d => d.status === 'preparing').length;
    const onway = deliveries.filter(d => d.status === 'onway').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;

    let html = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">🛵 طلبات التوصيل</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">توصيل للأماكن والبيوت</p>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:20px; font-weight:bold;">${preparing}</div>
                <div style="font-size:11px; opacity:0.9;">🟡 قيد التحضير</div>
            </div>
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:20px; font-weight:bold;">${onway}</div>
                <div style="font-size:11px; opacity:0.9;">🛵 بالطريق</div>
            </div>
            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:10px; padding:12px; text-align:center;">
                <div style="font-size:20px; font-weight:bold;">${delivered}</div>
                <div style="font-size:11px; opacity:0.9;">✅ تم التسليم</div>
            </div>
        </div>

        <button onclick="_restOpenNewDelivery()" style="width:100%; padding:14px; background:linear-gradient(135deg,#e67e22,#d35400); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 3px 10px rgba(230,126,34,0.3); margin-bottom:15px;">
            ➕ طلب توصيل جديد
        </button>
    `;

    const openOrders = deliveries.filter(d => d.status === 'preparing' || d.status === 'onway');
    if (openOrders.length > 0) {
        html += '<h3 style="font-size:15px; color:#2c3e50; margin-bottom:10px;">🔥 طلبات نشطة</h3>';
        openOrders.forEach(d => {
            const isOnWay = d.status === 'onway';
            const total = parseFloat(d.grandTotal) || parseFloat(d.total) || 0;
            const itemsCount = (d.items || []).length;
            const timeStr = d.createdAt ? new Date(d.createdAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '';
            const bg = isOnWay ? '#e3f2fd' : '#fff8e1';
            const border = isOnWay ? '#3498db' : '#f39c12';

            html += `
                <div onclick="_restOpenDelivery('${d.id}')" style="background:${bg}; border:2px solid ${border}; border-radius:12px; padding:14px; margin-bottom:10px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">👤 ${_afEsc(d.customerName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">📞 ${_afEsc(d.customerPhone || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ${_afEsc(d.address || '—')}${d.area ? ' • ' + _afEsc(d.area) : ''}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">⏰ ${timeStr} • 📦 ${itemsCount} طبق${d.driver ? ' • 🚗 ' + _afEsc(d.driver) : ''}</div>
                        </div>
                        <div style="text-align:left; flex-shrink:0;">
                            <div style="background:${border}; color:white; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${isOnWay ? '🛵 بالطريق' : '🟡 قيد التحضير'}</div>
                            <div style="font-size:14px; font-weight:bold; color:#27ae60; margin-top:6px; text-align:center;">${_afFmt(total)}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div style="text-align:center; padding:30px; color:#999; background:#f8f9fa; border-radius:10px;">لا توجد طلبات نشطة</div>';
    }

    // آخر المسلّمة
    const deliveredList = deliveries.filter(d => d.status === 'delivered').sort((a, b) => {
        const ta = a.deliveredAt ? new Date(a.deliveredAt).getTime() : 0;
        const tb = b.deliveredAt ? new Date(b.deliveredAt).getTime() : 0;
        return tb - ta;
    }).slice(0, 5);

    if (deliveredList.length > 0) {
        html += '<h3 style="font-size:15px; color:#2c3e50; margin:20px 0 10px 0;">📜 آخر المسلّمة</h3>';
        deliveredList.forEach(d => {
            const total = parseFloat(d.grandTotal) || parseFloat(d.total) || 0;
            const invoice = d.invoice || '';
            html += `
                <div style="background:#f8f9fa; border-radius:8px; padding:10px 12px; margin-bottom:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="color:#2c3e50; font-weight:600; font-size:13px;">👤 ${_afEsc(d.customerName || '—')}</span>
                        <span style="color:#27ae60; font-weight:bold; font-size:14px;">${_afFmt(total)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#666;">
                        <span>${invoice ? '📄 ' + _afEsc(invoice) : ''}</span>
                        <button onclick="_restPrintPaidInvoice('${invoice}', null)" style="padding:5px 10px; background:#34495e; color:white; border:none; border-radius:5px; font-size:10px; cursor:pointer;">🖨️ طباعة</button>
                    </div>
                </div>
            `;
        });
    }

    // ✅ المدفوعة اليوم (آخر 5)
    const paidToday = deliveries.filter(d => d.status === 'paid').sort((a, b) => {
        const ta = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const tb = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        return tb - ta;
    }).slice(0, 5);

    if (paidToday.length > 0) {
        html += '<h3 style="font-size:15px; color:#2c3e50; margin:20px 0 10px 0;">✅ المدفوعة</h3>';
        paidToday.forEach(d => {
            const total = parseFloat(d.grandTotal) || parseFloat(d.total) || 0;
            const invoice = d.invoice || '';
            const payIcon = d.paymentType === 'credit' ? '💳' : '💵';
            const payLabel = d.paymentType === 'credit' ? 'آجل' : 'نقدي';
            const remaining = parseFloat(d.remainingAmount) || 0;
            const timeStr = d.paidAt ? new Date(d.paidAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '';

            html += `
                <div style="background:#e8f5e9; border:1px solid #27ae60; border-radius:8px; padding:10px 12px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="color:#2c3e50; font-weight:600; font-size:13px;">👤 ${_afEsc(d.customerName || '—')}</span>
                        <span style="color:#27ae60; font-weight:bold; font-size:14px;">${_afFmt(total)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#666; margin-bottom:8px; flex-wrap:wrap; gap:4px;">
                        <span>${payIcon} ${payLabel}${invoice ? ' • ' + _afEsc(invoice) : ''}${timeStr ? ' • ' + timeStr : ''}</span>
                        ${remaining > 0 ? `<span style="color:#e74c3c; font-weight:600;">💳 دين: ${_afFmt(remaining)}</span>` : ''}
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                        <button onclick="_restPrintPaidInvoice('${invoice}', '${d.id}')" style="padding:8px; background:#34495e; color:white; border:none; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">🖨️ طباعة</button>
                        <button onclick="_restDeletePaidDelivery('${d.id}')" style="padding:8px; background:#e74c3c; color:white; border:none; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">🗑️ حذف</button>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

async function _restOpenNewDelivery() {
    const name = prompt('👤 اسم الزبون:', '');
    if (!name) return;

    const phone = prompt('📞 رقم الهاتف:', '');
    if (!phone) return;

    const address = prompt('📍 العنوان التفصيلي:', '');
    if (!address) return;

    const area = prompt('🏘️ المنطقة / الحي (اختياري):', '') || '';
    const deliveryFee = parseFloat(prompt('🛵 أجرة التوصيل (اختياري):', '0')) || 0;

    // ✅ عرض قائمة السائقين
    let driver = '';
    try {
        const drivers = await activityGetAll('restaurant', 'drivers', 100);
        window._restDriversState = drivers || [];
        if (drivers.length > 0) {
            let driverMsg = '🏍️ اختر السائق:\n\n';
            driverMsg += '0 = 🚫 بدون سائق\n';
            drivers.forEach((d, i) => {
                const typeLabel = d.type === 'employee' ? '🏢' : d.type === 'company' ? '📦' : '🚗';
                driverMsg += (i + 1) + ' = ' + typeLabel + ' ' + d.name;
                if (d.phone) driverMsg += ' • ' + d.phone;
                driverMsg += '\n';
            });
            driverMsg += '\nأدخل الرقم:';

            const driverChoice = prompt(driverMsg, '');
            const idx = parseInt(driverChoice) - 1;
            if (idx >= 0 && idx < drivers.length) {
                driver = drivers[idx].name;
            }
        }
    } catch(e) {
        console.warn('[restaurant] drivers load:', e.message);
    }

    try {
        const record = {
            customerName: name.trim(),
            customerPhone: phone.trim(),
            address: address.trim(),
            area: area.trim(),
            deliveryFee: deliveryFee,
            driver: driver,
            items: [],
            total: 0,
            grandTotal: deliveryFee,
            status: 'preparing',
            createdAt: Date.now()
        };

        if (typeof activityAdd === 'function') {
            await activityAdd('restaurant', 'delivery', record);
        }

        if (typeof toast === 'function') toast('✅ تم إنشاء الطلب', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-delivery');
            if (c) _restRenderDelivery(c);
        }, 500);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _restOpenDelivery(deliveryId) {
    let d = null;
    try {
        const all = await activityGetAll('restaurant', 'delivery', 200);
        window._restDeliveryState = all || [];
        d = (all || []).find(x => x.id === deliveryId);
    } catch(e) {
        console.warn(e);
    }
    if (!d) d = (window._restDeliveryState || []).find(x => x.id === deliveryId);
    if (!d) { alert('⚠️ الطلب غير موجود'); return; }

    const isOnWay = d.status === 'onway';
    const items = d.items || [];
    const total = parseFloat(d.total) || 0;
    const fee = parseFloat(d.deliveryFee) || 0;
    const grandTotal = parseFloat(d.grandTotal) || (total + fee);

    let itemsHtml = '';
    if (items.length === 0) {
        itemsHtml = '<div style="text-align:center; padding:15px; color:#999;">لا توجد أطباق</div>';
    } else {
        items.forEach(it => {
            itemsHtml += `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; font-size:13px;">
                    <span>${_afEsc(it.name || '—')} × ${it.qty || 1}</span>
                    <span style="font-weight:600; color:#27ae60;">${_afFmt((parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0))}</span>
                </div>
            `;
        });
    }

    const modal = document.createElement('div');
    modal.id = 'restDeliveryModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; max-width:500px; width:100%; max-height:90vh; overflow-y:auto; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:18px;">🛵 طلب توصيل</h2>
                <button onclick="document.getElementById('restDeliveryModal').remove()" style="background:#ecf0f1; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
            </div>

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:12px; font-size:13px;">
                <div style="font-weight:600; color:#2c3e50; margin-bottom:6px;">👤 ${_afEsc(d.customerName || '—')}</div>
                <div style="color:#666;">📞 ${_afEsc(d.customerPhone || '—')}</div>
                <div style="color:#666; margin-top:3px;">📍 ${_afEsc(d.address || '—')}${d.area ? ' • ' + _afEsc(d.area) : ''}</div>
                ${d.driver ? `<div style="color:#8e44ad; margin-top:3px;">🚗 السائق: ${_afEsc(d.driver)}</div>` : ''}
            </div>

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:12px;">
                <h4 style="margin:0 0 8px 0; font-size:13px; color:#2c3e50;">📋 الأطباق (${items.length})</h4>
                ${itemsHtml}
                ${fee > 0 ? `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee; font-size:13px;"><span>🛵 أجرة التوصيل</span><span style="font-weight:600; color:#e67e22;">${_afFmt(fee)}</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; padding:10px 0 0 0; margin-top:10px; border-top:2px solid #27ae60; font-size:16px; font-weight:bold;">
                    <span>الإجمالي:</span>
                    <span style="color:#27ae60;">${_afFmt(grandTotal)}</span>
                </div>
            </div>

            <button onclick="document.getElementById('restDeliveryModal').remove(); _restAddItemsToDelivery('${d.id}')" style="width:100%; padding:14px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; margin-bottom:8px;">
                ➕ إضافة أطباق
            </button>

            <button onclick="document.getElementById('restDeliveryModal').remove(); _restAssignDriver('${d.id}')" style="width:100%; padding:12px; background:linear-gradient(135deg,#16a085,#138d75); color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:8px;">
                🏍️ ${d.driver ? 'تغيير السائق (حالياً: ' + _afEsc(d.driver) + ')' : 'تعيين سائق'}
            </button>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                <button onclick="document.getElementById('restDeliveryModal').remove(); _restPrintDeliveryOrder('${d.id}')" style="padding:12px; background:#34495e; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">🖨️ طباعة</button>
                <button onclick="document.getElementById('restDeliveryModal').remove(); _restDeleteDelivery('${d.id}')" style="padding:12px; background:#e74c3c; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">🗑️ حذف</button>
            </div>

            ${!isOnWay ? `
                <button onclick="document.getElementById('restDeliveryModal').remove(); _restMarkDeliveryOnWay('${d.id}')" style="width:100%; padding:12px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:8px;">🛵 إرسال مع السائق</button>
            ` : ''}

            <button onclick="document.getElementById('restDeliveryModal').remove(); _restPayDelivery('${d.id}')" style="width:100%; padding:14px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer;">💵 تسجيل الدفع + إغلاق</button>
        </div>
    `;

    document.body.appendChild(modal);
}

async function _restMarkDeliveryOnWay(id) {
    try {
        await activityUpdate('restaurant', 'delivery', id, {
            status: 'onway',
            onwayAt: Date.now()
        });
        if (typeof toast === 'function') toast('🛵 الطلب بالطريق', 'success');
        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-delivery');
            if (c) _restRenderDelivery(c);
        }, 500);
    } catch(e) {
        alert('⚠️ ' + e.message);
    }
}

async function _restDeleteDelivery(id) {
    if (!confirm('🗑️ حذف الطلب؟')) return;
    try {
        await activityDelete('restaurant', 'delivery', id);
        if (typeof toast === 'function') toast('✅ تم الحذف', 'success');
        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-delivery');
            if (c) _restRenderDelivery(c);
        }, 500);
    } catch(e) {
        alert('⚠️ ' + e.message);
    }
}

function _restPrintDeliveryOrder(id) {
    const d = (window._restDeliveryState || []).find(x => x.id === id);
    if (!d) { alert('⚠️ الطلب غير موجود'); return; }

    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'المطعم';
    const items = d.items || [];
    const total = parseFloat(d.total) || 0;
    const fee = parseFloat(d.deliveryFee) || 0;
    const grandTotal = parseFloat(d.grandTotal) || (total + fee);

    let itemsHtml = '';
    items.forEach(it => {
        itemsHtml += `
            <tr>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:right;">${_afEsc(it.name)}</td>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:center;">${it.qty || 1}</td>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:left;">${_afFmt(it.price || 0)}</td>
                <td style="padding:5px; border-bottom:1px dashed #ccc; text-align:left;">${_afFmt((parseFloat(it.qty) || 1) * (parseFloat(it.price) || 0))}</td>
            </tr>
        `;
    });

    const html = `
        <div style="font-family:Tahoma,Arial,sans-serif; direction:rtl; max-width:300px; margin:0 auto; padding:15px;">
            <div style="text-align:center; border-bottom:2px solid #2c3e50; padding-bottom:10px; margin-bottom:10px;">
                <h1 style="margin:0; font-size:20px;">🍽️ ${bizName}</h1>
                <div style="font-size:12px; color:#666; margin-top:5px;">طلب توصيل</div>
            </div>

            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:12px; font-size:12px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>👤 الزبون:</span><b>${_afEsc(d.customerName || '—')}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>📞 الهاتف:</span><b>${_afEsc(d.customerPhone || '—')}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>📍 العنوان:</span><b>${_afEsc(d.address || '—')}</b></div>
                ${d.area ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>🏘️ المنطقة:</span><b>${_afEsc(d.area)}</b></div>` : ''}
                ${d.driver ? `<div style="display:flex; justify-content:space-between;"><span>🚗 السائق:</span><b>${_afEsc(d.driver)}</b></div>` : ''}
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
                <thead>
                    <tr style="background:#2c3e50; color:white;">
                        <th style="padding:5px; text-align:right;">الطبق</th>
                        <th style="padding:5px; text-align:center;">عدد</th>
                        <th style="padding:5px; text-align:left;">سعر</th>
                        <th style="padding:5px; text-align:left;">إجمالي</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>

            ${fee > 0 ? `
                <div style="background:#fff8e1; padding:8px; border-radius:6px; margin-bottom:8px; font-size:12px; display:flex; justify-content:space-between;">
                    <span>🛵 أجرة التوصيل:</span>
                    <b>${_afFmt(fee)}</b>
                </div>
            ` : ''}

            <div style="background:#27ae60; color:white; padding:12px; border-radius:8px; display:flex; justify-content:space-between; font-size:16px; font-weight:bold;">
                <span>💰 الإجمالي:</span>
                <span>${_afFmt(grandTotal)}</span>
            </div>

            <div style="text-align:center; margin-top:15px; font-size:11px; color:#666;">
                🍽️ شكراً لزيارتكم
            </div>
        </div>
    `;

    const w = window.open('', '_blank');
    if (!w) { alert('⚠️ اسمح بالنوافذ المنبثقة'); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
}

// ─── ربط إضافة الأطباق للتوصيل ───
async function _restAddItemsToDelivery(deliveryId) {
    // ✅ جلب المنيو من Firestore
    let menuItems = [];
    try {
        if (typeof activityGetAll === 'function') {
            const all = await activityGetAll('restaurant', 'menu', 500);
            menuItems = (all || []).filter(m => m.available !== false);
        }
    } catch(e) {
        console.warn('[restaurant] menu load:', e.message);
    }

    // احتياطي: من الكاش
    if (menuItems.length === 0 && typeof _activityCache !== 'undefined' && _activityCache.getAll) {
        menuItems = _activityCache.getAll('menu').filter(m => m.available !== false);
    }

    if (menuItems.length === 0) {
        alert('⚠️ لا توجد أطباق في المنيو\n\nأضف أطباقاً من "قائمة الطعام"');
        return;
    }

    window._restMenuCache = menuItems;
    // ✅ نستخدم اسم الدالة الصحيح مع نوع delivery
    _restAddItemsModal(deliveryId, 'delivery');
}

async function _restPayDelivery(deliveryId) {
    // ✅ تحديث النوع قبل الفتح
    window._restCurrentType = 'delivery';
    window._restPaymentType = 'delivery';

    const d = (window._restDeliveryState || []).find(x => x.id === deliveryId);
    if (!d) { alert('⚠️ الطلب غير موجود'); return; }

    const total = parseFloat(d.total) || 0;
    const fee = parseFloat(d.deliveryFee) || 0;
    const grandTotal = parseFloat(d.grandTotal) || (total + fee);

    if (grandTotal <= 0) {
        if (!confirm('⚠️ الطلب بدون مبلغ\n\nإغلاق؟')) return;
    }

    _restDeliveryPaymentModal(deliveryId, d, grandTotal);
}

function _restDeliveryPaymentModal(deliveryId, delivery, total) {
    // ✅ نُعيد استخدام payment modal مع بيانات التوصيل
    const deliveryData = {
        id: deliveryId,
        tableNumber: '🛵 توصيل',
        customerName: delivery.customerName,
        items: delivery.items || [],
        total: parseFloat(delivery.total) || 0,
        deliveryFee: parseFloat(delivery.deliveryFee) || 0,
        isDelivery: true
    };

    _restPaymentModal(deliveryId, deliveryData, total);
}

window._restRenderDelivery = _restRenderDelivery;
window._restOpenNewDelivery = _restOpenNewDelivery;
window._restOpenDelivery = _restOpenDelivery;
window._restMarkDeliveryOnWay = _restMarkDeliveryOnWay;
window._restDeleteDelivery = _restDeleteDelivery;
window._restPrintDeliveryOrder = _restPrintDeliveryOrder;
window._restAddItemsToDelivery = _restAddItemsToDelivery;
window._restPayDelivery = _restPayDelivery;


// ═══════════════════════════════════════════════════════════
//  🏍️ DRIVERS — إدارة السائقين
// ═══════════════════════════════════════════════════════════
window._restDriversState = [];

const _restDriverTypes = {
    'employee':  { label: '🏢 موظف (راتب)',      color: '#3498db', bg: '#e3f2fd' },
    'freelance': { label: '🚗 مستقل (بأجرة)',    color: '#e67e22', bg: '#fff3e0' },
    'company':   { label: '📦 شركة توصيل',       color: '#8e44ad', bg: '#f3e5f5' }
};

async function _restRenderDrivers(container) {
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>';

    try {
        const drivers = await activityGetAll('restaurant', 'drivers', 100);
        window._restDriversState = drivers || [];

        // جلب التوصيلات لحساب الإحصائيات
        let deliveries = [];
        try {
            deliveries = await activityGetAll('restaurant', 'delivery', 500);
        } catch(e) {}

        _restRenderDriversList(container, deliveries);
    } catch(e) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">خطأ: ' + e.message + '</div>';
    }
}

function _restRenderDriversList(container, deliveries) {
    const drivers = window._restDriversState || [];
    deliveries = deliveries || [];

    // إحصائيات لكل سائق
    const stats = {};
    deliveries.forEach(d => {
        const name = (d.driver || '').trim();
        if (!name) return;
        if (!stats[name]) stats[name] = { count: 0, fees: 0, lastDate: 0 };
        stats[name].count++;
        stats[name].fees += parseFloat(d.deliveryFee) || 0;
        const t = d.createdAt ? new Date(d.createdAt).getTime() : 0;
        if (t > stats[name].lastDate) stats[name].lastDate = t;
    });

    let html = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">🏍️ السائقين</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">إدارة السائقين + إحصائياتهم</p>

        <button onclick="_restAddDriver()" style="width:100%; padding:14px; background:linear-gradient(135deg,#e67e22,#d35400); color:white; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; box-shadow:0 3px 10px rgba(230,126,34,0.3); margin-bottom:15px;">
            ➕ إضافة سائق جديد
        </button>
    `;

    if (drivers.length === 0) {
        html += '<div style="text-align:center; padding:30px; color:#999; background:#f8f9fa; border-radius:10px;">لا يوجد سائقون بعد</div>';
        container.innerHTML = html;
        return;
    }

    drivers.forEach(d => {
        const typeInfo = _restDriverTypes[d.type] || _restDriverTypes.freelance;
        const st = stats[d.name] || { count: 0, fees: 0, lastDate: 0 };
        const lastStr = st.lastDate
            ? new Date(st.lastDate).toLocaleDateString('ar-SY')
            : 'لا يوجد';

        html += `
            <div style="background:white; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.05); border-right:4px solid ${typeInfo.color};">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:10px;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:16px;">${_afEsc(d.name || '—')}</div>
                        ${d.phone ? `<div style="font-size:12px; color:#666; margin-top:3px; direction:ltr; text-align:right;">📞 ${_afEsc(d.phone)}</div>` : ''}
                        <div style="font-size:11px; color:${typeInfo.color}; background:${typeInfo.bg}; padding:3px 10px; border-radius:10px; display:inline-block; margin-top:6px; font-weight:600;">${typeInfo.label}</div>
                    </div>
                    <div style="text-align:left; flex-shrink:0;">
                        <div style="background:${typeInfo.color}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600;">📦 ${st.count} طلب</div>
                    </div>
                </div>

                <div style="background:#f8f9fa; border-radius:8px; padding:10px; margin-bottom:10px; display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                    <div>
                        <div style="color:#666; font-size:10px;">💰 إجمالي أجرة</div>
                        <div style="font-weight:bold; color:#27ae60; margin-top:2px;">${_afFmt(st.fees)}</div>
                    </div>
                    <div>
                        <div style="color:#666; font-size:10px;">🕐 آخر طلب</div>
                        <div style="font-weight:600; color:#2c3e50; margin-top:2px;">${lastStr}</div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px;">
                    <button onclick="_restDriverWhatsApp('${d.id}')" style="padding:8px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب">📱</button>
                    <button onclick="_restDriverDetails('${d.id}')" style="padding:8px 4px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تفاصيل الطلبات">📊</button>
                    <button onclick="_restEditDriver('${d.id}')" style="padding:8px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                    <button onclick="_restDeleteDriver('${d.id}')" style="padding:8px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function _restAddDriver() {
    const name = prompt('👤 اسم السائق:', '');
    if (!name || !name.trim()) return;

    const phone = prompt('📞 رقم الهاتف:', '') || '';

    const typeChoice = prompt(
        '🏷️ نوع العلاقة:\n\n' +
        '1 = 🏢 موظف (راتب)\n' +
        '2 = 🚗 مستقل (بأجرة)\n' +
        '3 = 📦 شركة توصيل\n\n' +
        'أدخل الرقم:',
        '2'
    );

    const typeMap = { '1': 'employee', '2': 'freelance', '3': 'company' };
    const type = typeMap[typeChoice] || 'freelance';

    const notes = prompt('📝 ملاحظات (اختياري):', '') || '';

    try {
        await activityAdd('restaurant', 'drivers', {
            name: name.trim(),
            phone: phone.trim(),
            type: type,
            notes: notes.trim(),
            createdAt: Date.now()
        });

        if (typeof toast === 'function') toast('✅ تم إضافة السائق', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-drivers');
            if (c) _restRenderDrivers(c);
        }, 500);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _restEditDriver(driverId) {
    const d = (window._restDriversState || []).find(x => x.id === driverId);
    if (!d) { alert('⚠️ السائق غير موجود'); return; }

    const name = prompt('👤 اسم السائق:', d.name || '');
    if (!name) return;

    const phone = prompt('📞 رقم الهاتف:', d.phone || '') || '';

    const currentTypeNum = d.type === 'employee' ? '1' : d.type === 'company' ? '3' : '2';
    const typeChoice = prompt(
        '🏷️ نوع العلاقة:\n\n' +
        '1 = 🏢 موظف (راتب)\n' +
        '2 = 🚗 مستقل (بأجرة)\n' +
        '3 = 📦 شركة توصيل\n\n' +
        'أدخل الرقم:',
        currentTypeNum
    );

    const typeMap = { '1': 'employee', '2': 'freelance', '3': 'company' };
    const type = typeMap[typeChoice] || d.type || 'freelance';

    const notes = prompt('📝 ملاحظات:', d.notes || '') || '';

    try {
        await activityUpdate('restaurant', 'drivers', driverId, {
            name: name.trim(),
            phone: phone.trim(),
            type: type,
            notes: notes.trim()
        });

        if (typeof toast === 'function') toast('✅ تم التعديل', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-drivers');
            if (c) _restRenderDrivers(c);
        }, 500);

    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _restDeleteDriver(driverId) {
    const d = (window._restDriversState || []).find(x => x.id === driverId);
    if (!d) return;

    if (!confirm('🗑️ حذف السائق: ' + d.name + '؟\n\n(الطلبات السابقة لن تتأثر)')) return;

    try {
        await activityDelete('restaurant', 'drivers', driverId);
        if (typeof toast === 'function') toast('✅ تم الحذف', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-drivers');
            if (c) _restRenderDrivers(c);
        }, 500);

    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

function _restDriverWhatsApp(driverId) {
    const d = (window._restDriversState || []).find(x => x.id === driverId);
    if (!d || !d.phone) { alert('⚠️ لا يوجد رقم هاتف'); return; }

    const phone = String(d.phone).replace(/[^0-9]/g, '');
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'المطعم';

    const msg = '👋 مرحباً ' + (d.name || '') + '\nمن ' + bizName;
    const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
}

async function _restDriverDetails(driverId) {
    const d = (window._restDriversState || []).find(x => x.id === driverId);
    if (!d) return;

    let deliveries = [];
    try {
        deliveries = await activityGetAll('restaurant', 'delivery', 500);
    } catch(e) {}

    const myDeliveries = deliveries.filter(x => (x.driver || '').trim() === d.name);
    const totalFees = myDeliveries.reduce((s, x) => s + (parseFloat(x.deliveryFee) || 0), 0);

    let listHtml = '';
    if (myDeliveries.length === 0) {
        listHtml = '<div style="text-align:center; padding:20px; color:#999;">لا توجد طلبات</div>';
    } else {
        myDeliveries.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        myDeliveries.slice(0, 20).forEach(x => {
            const dateStr = x.createdAt ? new Date(x.createdAt).toLocaleString('ar-SY') : '';
            const total = parseFloat(x.grandTotal) || parseFloat(x.total) || 0;
            const fee = parseFloat(x.deliveryFee) || 0;

            listHtml += `
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:6px; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:600; color:#2c3e50;">👤 ${_afEsc(x.customerName || '—')}</span>
                        <span style="font-weight:bold; color:#27ae60;">${_afFmt(total)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:4px; color:#666; font-size:10px;">
                        <span>🕐 ${dateStr}</span>
                        <span>🛵 أجرة: ${_afFmt(fee)}</span>
                    </div>
                </div>
            `;
        });
    }

    const modal = document.createElement('div');
    modal.id = 'restDriverDetailsModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999999; display:flex; align-items:center; justify-content:center; padding:15px;';

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; max-width:520px; width:100%; max-height:90vh; overflow-y:auto; padding:20px;">

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:18px;">🏍️ ${_afEsc(d.name)}</h2>
                <button onclick="document.getElementById('restDriverDetailsModal').remove()" style="background:#ecf0f1; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
            </div>

            ${d.phone ? `<div style="font-size:13px; color:#666; margin-bottom:10px;">📞 ${_afEsc(d.phone)}</div>` : ''}

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:22px; font-weight:bold;">${myDeliveries.length}</div>
                    <div style="font-size:11px; opacity:0.9;">📦 إجمالي الطلبات</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:10px; padding:14px; text-align:center;">
                    <div style="font-size:18px; font-weight:bold;">${_afFmt(totalFees)}</div>
                    <div style="font-size:11px; opacity:0.9;">💰 إجمالي الأجرة</div>
                </div>
            </div>

            <h3 style="font-size:14px; color:#2c3e50; margin:15px 0 10px 0;">📋 آخر الطلبات (20):</h3>
            <div style="max-height:300px; overflow-y:auto;">${listHtml}</div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:15px;">
                <button onclick="document.getElementById('restDriverDetailsModal').remove(); _restDriverWhatsApp('${d.id}')" style="padding:12px; background:#25D366; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">📱 واتساب</button>
                <button onclick="document.getElementById('restDriverDetailsModal').remove(); _restEditDriver('${d.id}')" style="padding:12px; background:#f39c12; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">✏️ تعديل</button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);
}

// ─── Helper: قائمة السائقين (للاستخدام في التوصيل) ───
async function _restGetDriversForSelect() {
    try {
        if (window._restDriversState && window._restDriversState.length > 0) {
            return window._restDriversState;
        }
        const drivers = await activityGetAll('restaurant', 'drivers', 100);
        window._restDriversState = drivers || [];
        return window._restDriversState;
    } catch(e) {
        return [];
    }
}

window._restRenderDrivers = _restRenderDrivers;
window._restAddDriver = _restAddDriver;
window._restEditDriver = _restEditDriver;
window._restDeleteDriver = _restDeleteDriver;
window._restDriverWhatsApp = _restDriverWhatsApp;
window._restDriverDetails = _restDriverDetails;
window._restGetDriversForSelect = _restGetDriversForSelect;


// ═══════════════════════════════════════════════════════════
//  🏍️ ASSIGN DRIVER — تعيين سائق لطلب
// ═══════════════════════════════════════════════════════════
async function _restAssignDriver(deliveryId) {
    let drivers = [];
    try {
        drivers = await activityGetAll('restaurant', 'drivers', 100);
        window._restDriversState = drivers || [];
    } catch(e) {
        console.warn(e);
    }

    if (drivers.length === 0) {
        if (confirm('⚠️ لا يوجد سائقون مسجّلون\\n\\nهل تُريد إضافة سائق جديد الآن؟')) {
            if (typeof _restAddDriver === 'function') {
                _restAddDriver();
            }
        }
        return;
    }

    const d = (window._restDeliveryState || []).find(x => x.id === deliveryId);
    const currentDriver = d ? (d.driver || '') : '';

    const modal = document.createElement('div');
    modal.id = 'restAssignDriverModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999999; display:flex; align-items:center; justify-content:center; padding:15px;';

    let listHtml = '';
    drivers.forEach(dr => {
        const typeLabel = dr.type === 'employee' ? '🏢 موظف' : dr.type === 'company' ? '📦 شركة' : '🚗 مستقل';
        const isCurrent = dr.name === currentDriver;
        listHtml += `
            <button onclick="_restSetDriver('${deliveryId}', '${_afEsc(dr.name).replace(/'/g, "\\'")}')" style="width:100%; text-align:right; padding:12px 14px; background:${isCurrent ? '#d5f4e6' : 'white'}; border:2px solid ${isCurrent ? '#16a085' : '#ddd'}; border-radius:10px; cursor:pointer; margin-bottom:6px; font-family:inherit;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:600; color:#2c3e50; font-size:14px;">${_afEsc(dr.name)}${isCurrent ? ' ✓' : ''}</div>
                        <div style="font-size:11px; color:#666; margin-top:2px;">${typeLabel}${dr.phone ? ' • ' + _afEsc(dr.phone) : ''}</div>
                    </div>
                    <span style="font-size:20px;">🏍️</span>
                </div>
            </button>
        `;
    });

    modal.innerHTML = `
        <div style="background:white; border-radius:14px; max-width:480px; width:100%; max-height:90vh; overflow-y:auto; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:18px;">🏍️ اختر السائق</h2>
                <button onclick="document.getElementById('restAssignDriverModal').remove()" style="background:#ecf0f1; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
            </div>

            ${listHtml}

            <button onclick="_restClearDriver('${deliveryId}')" style="width:100%; padding:12px; background:#95a5a6; color:white; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; margin-top:8px;">
                🚫 إزالة السائق
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

async function _restSetDriver(deliveryId, driverName) {
    try {
        await activityUpdate('restaurant', 'delivery', deliveryId, {
            driver: driverName
        });

        // تحديث الحالة المحلية
        const idx = (window._restDeliveryState || []).findIndex(x => x.id === deliveryId);
        if (idx >= 0) {
            window._restDeliveryState[idx].driver = driverName;
        }

        const m = document.getElementById('restAssignDriverModal');
        if (m) m.remove();

        if (typeof toast === 'function') toast('✅ السائق: ' + driverName, 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-delivery');
            if (c) _restRenderDelivery(c);
        }, 400);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

async function _restClearDriver(deliveryId) {
    if (!confirm('🚫 إزالة السائق من هذا الطلب؟')) return;

    try {
        await activityUpdate('restaurant', 'delivery', deliveryId, {
            driver: ''
        });

        const idx = (window._restDeliveryState || []).findIndex(x => x.id === deliveryId);
        if (idx >= 0) {
            window._restDeliveryState[idx].driver = '';
        }

        const m = document.getElementById('restAssignDriverModal');
        if (m) m.remove();

        if (typeof toast === 'function') toast('✅ تم إزالة السائق', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-delivery');
            if (c) _restRenderDelivery(c);
        }, 400);

    } catch(e) {
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._restAssignDriver = _restAssignDriver;
window._restSetDriver = _restSetDriver;
window._restClearDriver = _restClearDriver;


// ═══════════════════════════════════════════════════════════
//  🗑️ DELETE PAID DELIVERY — حذف طلب توصيل مدفوع
// ═══════════════════════════════════════════════════════════
async function _restDeletePaidDelivery(deliveryId) {
    const d = (window._restDeliveryState || []).find(x => x.id === deliveryId);
    if (!d) { alert('⚠️ الطلب غير موجود'); return; }

    const invoice = d.invoice || '';
    const total = parseFloat(d.grandTotal) || parseFloat(d.total) || 0;

    const confirmMsg = '🗑️ حذف طلب مدفوع؟\n\n' +
        '👤 ' + (d.customerName || '—') + '\n' +
        '📄 ' + (invoice || '—') + '\n' +
        '💰 ' + _afFmt(total) + '\n\n' +
        '⚠️ سيُحذف السجل من طلبات التوصيل فقط\n' +
        'الفاتورة تبقى في المبيعات';

    if (!confirm(confirmMsg)) return;

    try {
        await activityDelete('restaurant', 'delivery', deliveryId);

        const idx = (window._restDeliveryState || []).findIndex(x => x.id === deliveryId);
        if (idx >= 0) window._restDeliveryState.splice(idx, 1);

        if (typeof toast === 'function') toast('✅ تم حذف الطلب', 'success');

        setTimeout(() => {
            const c = document.getElementById('activity-restaurant-delivery');
            if (c) _restRenderDelivery(c);
        }, 300);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

window._restDeletePaidDelivery = _restDeletePaidDelivery;


// ═══════════════════════════════════════════════════════════
//  🍳 KITCHEN DISPLAY — شاشة المطبخ
// ═══════════════════════════════════════════════════════════
window._restKitchenRefreshTimer = null;

async function _restRenderKitchen(container) {
    if (!container) return;

    container.innerHTML = `
        <div style="background:linear-gradient(135deg,#2c3e50,#34495e); color:white; border-radius:12px; padding:14px 16px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:18px; font-weight:bold;">🍳 شاشة المطبخ</div>
                <div style="font-size:11px; opacity:0.8; margin-top:2px;">عرض حي — تحديث تلقائي</div>
            </div>
            <div style="text-align:left;">
                <div id="restKitchenClock" style="font-size:20px; font-weight:bold; font-family:monospace;">--:--</div>
                <div style="font-size:10px; opacity:0.7; text-align:center;">⏰ الآن</div>
            </div>
        </div>

        <div id="restKitchenStats" style="margin-bottom:15px;"></div>
        <div id="restKitchenList">
            <div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>
        </div>
    `;

    // تحديث الساعة
    _restKitchenUpdateClock();
    setInterval(_restKitchenUpdateClock, 30000);

    await _restKitchenRefresh();

    // تحديث تلقائي كل 30 ثانية
    if (window._restKitchenRefreshTimer) clearInterval(window._restKitchenRefreshTimer);
    window._restKitchenRefreshTimer = setInterval(() => {
        const c = document.getElementById('activity-restaurant-kitchen');
        if (!c || c.style.display === 'none') {
            clearInterval(window._restKitchenRefreshTimer);
            window._restKitchenRefreshTimer = null;
            return;
        }
        _restKitchenRefresh();
    }, 30000);
}

function _restKitchenUpdateClock() {
    const el = document.getElementById('restKitchenClock');
    if (el) {
        const now = new Date();
        el.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
}

async function _restKitchenRefresh() {
    const listEl = document.getElementById('restKitchenList');
    const statsEl = document.getElementById('restKitchenStats');
    if (!listEl) return;

    try {
        const [tables, deliveries] = await Promise.all([
            activityGetAll('restaurant', 'tables', 200).catch(() => []),
            activityGetAll('restaurant', 'delivery', 200).catch(() => [])
        ]);

        // ─── تجميع كل الدورات ───
        const allRounds = [];

        (tables || []).forEach(t => {
            if (t.status === 'paid') return;
            const rounds = _restGetRounds(t);
            rounds.forEach(r => {
                if (r.kitchenStatus === 'served') return;
                if (!r.items || r.items.length === 0) return;
                allRounds.push({
                    ...r,
                    orderType: 'table',
                    orderId: t.id,
                    source: '🪑 طاولة ' + (t.tableNumber || '?'),
                    customer: t.customerName || ''
                });
            });
        });

        (deliveries || []).forEach(d => {
            if (d.status !== 'preparing') return;
            const rounds = _restGetRounds(d);
            rounds.forEach(r => {
                if (r.kitchenStatus === 'served') return;
                if (!r.items || r.items.length === 0) return;
                allRounds.push({
                    ...r,
                    orderType: 'delivery',
                    orderId: d.id,
                    source: '🛵 توصيل',
                    customer: d.customerName || '',
                    driver: d.driver || ''
                });
            });
        });

        // ترتيب: cooking → new → ready
        const priority = { 'cooking': 1, 'new': 2, 'ready': 3 };
        allRounds.sort((a, b) => {
            const pa = priority[a.kitchenStatus] || 99;
            const pb = priority[b.kitchenStatus] || 99;
            if (pa !== pb) return pa - pb;
            return (a.createdAt || 0) - (b.createdAt || 0);
        });

        // إحصائيات
        let totalItems = 0, cookingItems = 0, readyItems = 0;
        allRounds.forEach(r => {
            (r.items || []).forEach(it => {
                totalItems++;
                const st = it.itemStatus || 'new';
                if (st === 'cooking') cookingItems++;
                if (st === 'ready') readyItems++;
            });
        });

        if (statsEl) {
            statsEl.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
                    <div style="background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border-radius:10px; padding:10px; text-align:center;">
                        <div style="font-size:22px; font-weight:bold;">${totalItems - cookingItems - readyItems}</div>
                        <div style="font-size:11px; opacity:0.9;">🟡 أصناف جديدة</div>
                    </div>
                    <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:10px; padding:10px; text-align:center;">
                        <div style="font-size:22px; font-weight:bold;">${cookingItems}</div>
                        <div style="font-size:11px; opacity:0.9;">🟠 قيد الطبخ</div>
                    </div>
                    <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:10px; padding:10px; text-align:center;">
                        <div style="font-size:22px; font-weight:bold;">${readyItems}</div>
                        <div style="font-size:11px; opacity:0.9;">✅ جاهزة</div>
                    </div>
                </div>
                ${allRounds.length > 0 ? `<div style="background:#f8f9fa; border-radius:8px; padding:8px 12px; font-size:12px; color:#666; text-align:center;">🍽️ <b>${allRounds.length}</b> دورة • 📦 <b>${totalItems}</b> صنف</div>` : ''}
            `;
        }

        if (allRounds.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:50px; color:#27ae60; background:#e8f5e9; border-radius:12px; font-size:16px;">✅<br><br>لا توجد دورات نشطة</div>';
            return;
        }

        // ─── عرض كل دورة ───
        let html = '';
        allRounds.forEach(r => {
            const mins = Math.floor((Date.now() - (r.createdAt || Date.now())) / 60000);
            const timeStr = _restTimeAgo(r.createdAt);

            // حالة الدورة
            const items = r.items || [];
            const allItemsReady = items.length > 0 && items.every(it => it.itemStatus === 'ready');
            const anyCooking = items.some(it => it.itemStatus === 'cooking');

            let borderColor, bgColor, statusLabel, statusColor;
            if (allItemsReady) {
                borderColor = '#27ae60'; bgColor = '#e8f5e9';
                statusLabel = '✅ جاهزة بالكامل'; statusColor = '#27ae60';
            } else if (anyCooking) {
                if (mins >= 20) { borderColor = '#e74c3c'; bgColor = '#fdecea'; }
                else { borderColor = '#3498db'; bgColor = '#e3f2fd'; }
                statusLabel = '🟠 قيد التحضير'; statusColor = '#3498db';
            } else {
                if (mins >= 15) { borderColor = '#e74c3c'; bgColor = '#fdecea'; }
                else if (mins >= 10) { borderColor = '#e67e22'; bgColor = '#fff3e0'; }
                else if (mins >= 5) { borderColor = '#f39c12'; bgColor = '#fff8e1'; }
                else { borderColor = '#f1c40f'; bgColor = '#fef9e7'; }
                statusLabel = '🟡 جديدة'; statusColor = '#f39c12';
            }

            // معلومات العميل
            let customerInfo = '';
            if (r.orderType === 'delivery') {
                customerInfo = r.customer ? '👤 ' + _afEsc(r.customer) : '';
                if (r.driver) customerInfo += ' • 🏍️ ' + _afEsc(r.driver);
            } else if (r.customer) {
                customerInfo = '👤 ' + _afEsc(r.customer);
            }

            // الأصناف مع أزرار منفصلة
            let itemsHtml = '';
            items.forEach((it, idx) => {
                const st = it.itemStatus || 'new';
                const itemName = _afEsc(it.name || '—');
                const qty = it.qty || 1;
                const itemId = it.menuItemId || ('item-' + idx);

                let itemBg = '#fff8e1';
                let itemBorder = '#f39c12';
                let statusIcon = '🟡';
                let itemBtn = '';

                if (st === 'ready') {
                    itemBg = '#e8f5e9'; itemBorder = '#27ae60'; statusIcon = '✅';
                    itemBtn = `<span style="font-size:11px; color:#27ae60; font-weight:bold;">✓ جاهز</span>`;
                } else if (st === 'cooking') {
                    itemBg = '#e3f2fd'; itemBorder = '#3498db'; statusIcon = '🟠';
                    itemBtn = `<button onclick="_restItemReady('${r.orderType}', '${r.orderId}', '${r.roundId}', ${idx})" style="padding:6px 12px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">✅ جاهز</button>`;
                } else {
                    itemBtn = `<button onclick="_restItemStart('${r.orderType}', '${r.orderId}', '${r.roundId}', ${idx})" style="padding:6px 12px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;">🟢 ابدأ</button>`;
                }

                itemsHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:${itemBg}; border:1px solid ${itemBorder}; border-radius:8px; margin-bottom:6px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:14px; color:#2c3e50; font-weight:600;">${statusIcon} ${itemName}</div>
                            <div style="font-size:11px; color:#666; margin-top:2px;">الكمية: × ${qty}</div>
                        </div>
                        <div style="flex-shrink:0;">
                            ${itemBtn}
                        </div>
                    </div>
                `;
            });

            // زر الإجراء العام
            let actionBtn = '';
            if (allItemsReady) {
                actionBtn = `
                    <button onclick="_restKitchenMarkServed('${r.orderType}', '${r.orderId}', '${r.roundId}')" style="width:100%; padding:12px; background:linear-gradient(135deg,#95a5a6,#7f8c8d); color:white; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; margin-top:8px;">
                        ✔️ تم التقديم
                    </button>
                `;
            } else if (anyCooking || readyItems > 0) {
                actionBtn = `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:8px;">
                        <button onclick="_restRoundStartAll('${r.orderType}', '${r.orderId}', '${r.roundId}')" style="padding:10px; background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">
                            🔥 ابدأ المتبقي
                        </button>
                        <button onclick="_restRoundReadyAll('${r.orderType}', '${r.orderId}', '${r.roundId}')" style="padding:10px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">
                            ✅ جاهز الكل
                        </button>
                    </div>
                `;
            } else {
                actionBtn = `
                    <button onclick="_restRoundStartAll('${r.orderType}', '${r.orderId}', '${r.roundId}')" style="width:100%; padding:12px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; margin-top:8px;">
                        🟢 ابدأ الكل
                    </button>
                `;
            }

            html += `
                <div style="background:${bgColor}; border:2px solid ${borderColor}; border-radius:12px; padding:14px; margin-bottom:12px; box-shadow:0 3px 8px rgba(0,0,0,0.08);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:8px; border-bottom:2px solid ${borderColor};">
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:17px; font-weight:bold; color:#2c3e50;">
                                ${_afEsc(r.source)}
                                <span style="font-size:13px; color:${borderColor}; margin-right:6px;">— دورة ${r.roundNumber}</span>
                            </div>
                            ${customerInfo ? `<div style="font-size:12px; color:#666; margin-top:3px;">${customerInfo}</div>` : ''}
                        </div>
                        <div style="text-align:left; flex-shrink:0;">
                            <div style="background:${statusColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${statusLabel}</div>
                            <div style="font-size:12px; color:${borderColor}; font-weight:bold; margin-top:5px; text-align:center;">⏱️ ${timeStr}</div>
                        </div>
                    </div>

                    <div style="margin-bottom:8px;">
                        ${itemsHtml}
                    </div>

                    ${actionBtn}
                </div>
            `;
        });

        listEl.innerHTML = html;

    } catch(e) {
        console.error('[kitchen]', e);
        if (listEl) listEl.innerHTML = '<div style="text-align:center; padding:40px; color:#e74c3c;">خطأ: ' + e.message + '</div>';
    }
}

// ─── التحكم في صنف فردي ───
async function _restItemStart(type, orderId, roundId, itemIdx) {
    return _restUpdateItemStatus(type, orderId, roundId, itemIdx, 'cooking');
}

async function _restItemReady(type, orderId, roundId, itemIdx) {
    return _restUpdateItemStatus(type, orderId, roundId, itemIdx, 'ready');
}

async function _restUpdateItemStatus(type, orderId, roundId, itemIdx, newStatus) {
    try {
        const pageId = type === 'delivery' ? 'delivery' : 'tables';
        const orders = await activityGetAll('restaurant', pageId, 200);
        const order = (orders || []).find(x => x.id === orderId);
        if (!order) return;

        const rounds = _restGetRounds(order);
        const round = rounds.find(r => r.roundId === roundId);
        if (!round) return;

        const item = round.items[itemIdx];
        if (!item) return;

        item.itemStatus = newStatus;
        if (newStatus === 'cooking') item.itemStartedAt = Date.now();
        if (newStatus === 'ready') item.itemReadyAt = Date.now();

        // فحص: كل أصناف الدورة جاهزة؟
        const allReady = round.items.every(it => (it.itemStatus || 'new') === 'ready');
        if (allReady) {
            round.kitchenStatus = 'ready';
            round.readyAt = Date.now();
            _restPlayReadySound();
            if (typeof toast === 'function') {
                toast('✅ الدورة ' + round.roundNumber + ' جاهزة بالكامل', 'success');
            }
        } else if (round.kitchenStatus === 'new') {
            round.kitchenStatus = 'cooking';
        }

        const payload = { rounds: rounds };

        // للطاولات: تحديث status لو كل الدورات جاهزة
        if (type === 'table') {
            const allRoundsReady = rounds.every(r => r.kitchenStatus === 'ready' || r.kitchenStatus === 'served');
            if (allRoundsReady) {
                payload.status = 'ready';
                payload.readyAt = Date.now();
            }
        }

        await activityUpdate('restaurant', pageId, orderId, payload);
        setTimeout(_restKitchenRefresh, 300);

    } catch(e) {
        console.error(e);
        alert('⚠️ خطأ: ' + e.message);
    }
}

// ─── ابدأ كل الأصناف المتبقية ───
async function _restRoundStartAll(type, orderId, roundId) {
    try {
        const pageId = type === 'delivery' ? 'delivery' : 'tables';
        const orders = await activityGetAll('restaurant', pageId, 200);
        const order = (orders || []).find(x => x.id === orderId);
        if (!order) return;

        const rounds = _restGetRounds(order);
        const round = rounds.find(r => r.roundId === roundId);
        if (!round) return;

        let changed = 0;
        round.items.forEach(it => {
            if ((it.itemStatus || 'new') !== 'ready') {
                it.itemStatus = 'cooking';
                it.itemStartedAt = it.itemStartedAt || Date.now();
                changed++;
            }
        });

        if (changed > 0) {
            round.kitchenStatus = 'cooking';
            await activityUpdate('restaurant', pageId, orderId, { rounds: rounds });
            if (typeof toast === 'function') toast('🟢 بدأ الطبخ — ' + changed + ' صنف', 'success');
        }

        setTimeout(_restKitchenRefresh, 300);

    } catch(e) {
        console.error(e);
    }
}

// ─── جاهز الكل ───
async function _restRoundReadyAll(type, orderId, roundId) {
    try {
        const pageId = type === 'delivery' ? 'delivery' : 'tables';
        const orders = await activityGetAll('restaurant', pageId, 200);
        const order = (orders || []).find(x => x.id === orderId);
        if (!order) return;

        const rounds = _restGetRounds(order);
        const round = rounds.find(r => r.roundId === roundId);
        if (!round) return;

        round.items.forEach(it => {
            if ((it.itemStatus || 'new') !== 'ready') {
                it.itemStatus = 'ready';
                it.itemReadyAt = Date.now();
            }
        });

        round.kitchenStatus = 'ready';
        round.readyAt = Date.now();

        const payload = { rounds: rounds };

        // للطاولات: فحص كل الدورات
        if (type === 'table') {
            const allRoundsReady = rounds.every(r => r.kitchenStatus === 'ready' || r.kitchenStatus === 'served');
            if (allRoundsReady) {
                payload.status = 'ready';
                payload.readyAt = Date.now();
            }
        }

        await activityUpdate('restaurant', pageId, orderId, payload);

        _restPlayReadySound();
        if (typeof toast === 'function') {
            toast('✅ دورة ' + round.roundNumber + ' جاهزة بالكامل', 'success');
        }

        setTimeout(_restKitchenRefresh, 300);

    } catch(e) {
        console.error(e);
    }
}

// ─── تعليم الدورة كمقدَّمة ───
async function _restKitchenMarkServed(type, orderId, roundId) {
    try {
        const pageId = type === 'delivery' ? 'delivery' : 'tables';
        const orders = await activityGetAll('restaurant', pageId, 200);
        const order = (orders || []).find(x => x.id === orderId);
        if (!order) return;

        const rounds = _restGetRounds(order);
        const round = rounds.find(r => r.roundId === roundId);
        if (!round) return;

        round.kitchenStatus = 'served';
        round.servedAt = Date.now();

        await activityUpdate('restaurant', pageId, orderId, { rounds: rounds });

        if (typeof toast === 'function') toast('✔️ تم تقديم الدورة ' + round.roundNumber, 'success');
        setTimeout(_restKitchenRefresh, 300);

    } catch(e) {
        console.error(e);
    }
}

// ─── Helper قديم (للتوافق) ───
async function _restKitchenStart(type, orderId, roundId) {
    return _restRoundStartAll(type, orderId, roundId);
}

async function _restKitchenMarkReady(type, orderId, roundId) {
    return _restRoundReadyAll(type, orderId, roundId);
}

// ─── تسجيل كل الدوال في window ───
window._restKitchenStart = _restKitchenStart;
window._restKitchenMarkReady = _restKitchenMarkReady;
window._restKitchenMarkServed = _restKitchenMarkServed;
window._restItemStart = _restItemStart;
window._restItemReady = _restItemReady;
window._restRoundStartAll = _restRoundStartAll;
window._restRoundReadyAll = _restRoundReadyAll;

window._restRenderKitchen = _restRenderKitchen;
window._restKitchenRefresh = _restKitchenRefresh;
window._restKitchenStart = _restKitchenStart;
window._restKitchenMarkReady = _restKitchenMarkReady;


// ═══════════════════════════════════════════════════════════
//  🎯 ROUNDS HELPERS — نظام الدورات
// ═══════════════════════════════════════════════════════════

// صوت إشعار جاهز
function _restPlayReadySound() {
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        // نغمة مزدوجة
        const now = ctx.currentTime;
        [0, 0.15, 0.3].forEach((offset, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = i === 2 ? 1200 : 880;
            gain.gain.setValueAtTime(0, now + offset);
            gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
        });
    } catch(e) {
        console.warn('[sound]', e.message);
    }
}

// استخراج الدورات (مع دعم البيانات القديمة)
function _restGetRounds(order) {
    if (!order) return [];

    // لو فيها rounds (جديد)
    if (Array.isArray(order.rounds) && order.rounds.length > 0) {
        return order.rounds.map((r, i) => ({
            roundId: r.roundId || ('round-' + (i+1)),
            roundNumber: r.roundNumber || (i+1),
            items: r.items || [],
            total: parseFloat(r.total) || 0,
            kitchenStatus: r.kitchenStatus || 'new',
            createdAt: r.createdAt || Date.now(),
            startedAt: r.startedAt || null,
            readyAt: r.readyAt || null,
            servedAt: r.servedAt || null
        }));
    }

    // لو فيها items فقط (قديم) → الدورة 1
    if (Array.isArray(order.items) && order.items.length > 0) {
        return [{
            roundId: 'round-1',
            roundNumber: 1,
            items: order.items,
            total: order.items.reduce((s, it) => s + ((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0)), 0),
            kitchenStatus: order.kitchenStatus || 'new',
            createdAt: order.createdAt || order.openedAt || Date.now(),
            startedAt: order.cookingStartedAt || null,
            readyAt: order.kitchenReadyAt || null,
            servedAt: null
        }];
    }

    return [];
}

// الأصناف مسطحة (للتوافق)
function _restFlattenRounds(rounds) {
    const all = [];
    (rounds || []).forEach(r => {
        (r.items || []).forEach(it => all.push(it));
    });
    return all;
}

// إجمالي كل الدورات
function _restTotalRounds(rounds) {
    return (rounds || []).reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
}

// حساب الوقت المنقضي بشكل صحيح
function _restTimeAgo(timestamp) {
    if (!timestamp) return 'الآن';
    const ms = Date.now() - Number(timestamp);
    if (isNaN(ms) || ms < 0) return 'الآن';
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'الآن';
    if (mins === 1) return 'منذ دقيقة';
    if (mins < 60) return 'منذ ' + mins + ' د';
    const hrs = Math.floor(mins / 60);
    return 'منذ ' + hrs + ' س';
}

window._restPlayReadySound = _restPlayReadySound;
window._restGetRounds = _restGetRounds;
window._restFlattenRounds = _restFlattenRounds;
window._restTotalRounds = _restTotalRounds;
window._restTimeAgo = _restTimeAgo;
console.log('🎯 [restaurant] rounds helpers ready');
