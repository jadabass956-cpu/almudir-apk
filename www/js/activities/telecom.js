// ============================================================
//  📱 ACTIVITY: TELECOM — نشاط الاتصالات والصيانة
//  v1.0.0
// ============================================================

ACTIVITY_REGISTRY.register({
    id: 'telecom',
    name: 'الاتصالات والصيانة',
    icon: '📱',
    pages: [
        // ═══════════════════════════════════════════════════
        //  📄 وصل استلام
        // ═══════════════════════════════════════════════════
        {
            id: 'receipts',
            icon: '📄',
            title: 'وصل استلام',
            printTitle: 'وصل استلام جهاز',
            description: 'استلام الأجهزة للصيانة + متابعة الحالة',
            addLabel: '➕ استلام جهاز جديد',
            searchPlaceholder: 'ابحث بالاسم / رقم السند / نوع الجهاز...',
            emptyIcon: '📄',
            autoNumber: true,
            numberPrefix: 'RCP',
            printSize: 'thermal',
            searchFields: ['number', 'customerName', 'customerPhone', 'deviceModel', 'deviceSerial'],
            primaryField: 'customerName',
            secondaryField: 'deviceModel',
            amountField: 'expectedCost',
            stats: [
                { 
                    icon: '📋', label: 'الكل', 
                    compute: (items) => items.length, 
                    bg: '#ecf0f1', color: '#2c3e50',
                    filterId: 'all'
                },
                { 
                    icon: '⏰', label: 'متأخرة', 
                    compute: (items) => {
                        const today = new Date().toISOString().slice(0, 10);
                        return items.filter(x => {
                            if (!x.expectedDate) return false;
                            if (x.status === 'delivered' || x.status === 'cancelled') return false;
                            return x.expectedDate < today;
                        }).length;
                    }, 
                    bg: '#f8d7da', color: '#721c24',
                    filterId: 'overdue'
                },
                { 
                    icon: '✅', label: 'جاهز', 
                    compute: (items) => items.filter(x => x.status === 'ready').length, 
                    bg: '#d4edda', color: '#155724',
                    filterId: 'ready'
                },
                { 
                    icon: '💰', label: 'إجمالي', 
                    compute: (items) => {
                        const total = items.reduce((s, x) => s + (parseFloat(x.expectedCost) || 0), 0);
                        return typeof formatCurrency === 'function' ? formatCurrency(total) : total.toLocaleString('ar-SY');
                    }, 
                    bg: '#d1ecf1', color: '#0c5460'
                    // لا فلتر — بطاقة معلومة
                }
            ],
            
            // 🔧 قسم القطع في النموذج
            formExtra: `
                <div style="border-top:2px dashed #ddd; margin-top:15px; padding-top:15px;">

                    <!-- 🔷 PATTERN GRID -->
                    <div id="telecomPatternWrap" style="display:none; margin-bottom:15px; padding:12px; background:#f8f9fa; border-radius:10px; border:1px dashed #3498db;">
                        <div style="text-align:center; font-size:12px; color:#666; margin-bottom:10px; font-weight:600;">
                            🔷 المس النقاط بالترتيب
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(3, 60px); gap:16px; justify-content:center; margin:0 auto; max-width:220px;">
                            <button type="button" class="tp-dot" data-p="1" onclick="_telecomPatternTap(1)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">1</button>
                            <button type="button" class="tp-dot" data-p="2" onclick="_telecomPatternTap(2)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">2</button>
                            <button type="button" class="tp-dot" data-p="3" onclick="_telecomPatternTap(3)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">3</button>
                            <button type="button" class="tp-dot" data-p="4" onclick="_telecomPatternTap(4)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">4</button>
                            <button type="button" class="tp-dot" data-p="5" onclick="_telecomPatternTap(5)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">5</button>
                            <button type="button" class="tp-dot" data-p="6" onclick="_telecomPatternTap(6)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">6</button>
                            <button type="button" class="tp-dot" data-p="7" onclick="_telecomPatternTap(7)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">7</button>
                            <button type="button" class="tp-dot" data-p="8" onclick="_telecomPatternTap(8)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">8</button>
                            <button type="button" class="tp-dot" data-p="9" onclick="_telecomPatternTap(9)" style="width:60px; height:60px; border-radius:50%; border:2px solid #3498db; background:white; color:#3498db; font-size:18px; font-weight:bold; cursor:pointer; font-family:inherit; transition:all 0.15s;">9</button>
                        </div>
                        <div id="telecomPatternSeq" style="text-align:center; margin-top:14px; font-size:14px; font-weight:600; color:#2980b9; min-height:22px; font-family:monospace; direction:ltr;"></div>
                        <div style="text-align:center; margin-top:10px;">
                            <button type="button" onclick="_telecomPatternClear()" style="padding:7px 16px; background:#95a5a6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-family:inherit;">🔄 مسح النمط</button>
                        </div>
                    </div>

                    <div style="border-top:1px dashed #ddd; margin-bottom:12px;"></div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <label style="font-size:13px; color:#555; font-weight:600;">
                            🔧 قطع الغيار المستخدمة <span style="color:#999; font-weight:400;">(اختياري)</span>
                        </label>
                        <button type="button" onclick="_telecomAddPart()" 
                            style="padding:6px 12px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">
                            ➕ إضافة قطعة
                        </button>
                    </div>
                    
                    <div id="telecomPartsList"></div>
                    
                    <div id="telecomPartsTotal" style="display:none; background:#fff3cd; padding:10px 14px; border-radius:8px; border-right:3px solid #f39c12; margin-top:10px; font-size:13px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>💰 إجمالي تكلفة القطع:</span>
                            <span id="telecomPartsTotalVal" style="font-weight:bold; color:#c0392b;">0</span>
                        </div>
                    </div>
                </div>
            `,
            
            // 🎯 عند فتح النموذج — تهيئة القطع
            onFormOpen: function(editData) {
                _telecomPartsInit(editData);
                _telecomLockInit(editData);
            },
            
            // 🎯 قبل الحفظ — حساب الإجماليات
            beforeSave: function(data, docId) {
                const parts = window._telecomPartsState || [];
                data.parts = parts.map(p => ({ ...p }));
                data.partsTotal = parts.reduce((s, p) => s + ((parseFloat(p.cost) || 0) * (parseFloat(p.qty) || 1)), 0);
                
                // حساب الربح الفعلي
                const finalCost = parseFloat(data.actualCost) || parseFloat(data.expectedCost) || 0;
                data.profit = finalCost - data.partsTotal;
                data.profitMargin = finalCost > 0 ? ((data.profit / finalCost) * 100) : 0;
                
                return data;
            },
            
            // ⚡ Quick Filters
            quickFilters: [
                { 
                    id: 'all', 
                    label: 'الكل',
                    compute: () => true
                },
                { 
                    id: 'overdue', 
                    label: 'متأخرة',
                    compute: (item) => {
                        const today = new Date().toISOString().slice(0, 10);
                        if (!item.expectedDate) return false;
                        if (item.status === 'delivered' || item.status === 'cancelled') return false;
                        return item.expectedDate < today;
                    }
                },
                { 
                    id: 'ready', 
                    label: 'جاهز',
                    compute: (item) => item.status === 'ready'
                },
                { 
                    id: 'delivered', 
                    label: 'تم التسليم',
                    compute: (item) => item.status === 'delivered'
                }
            ],
            fields: [
                { name: 'customerName', label: 'اسم العميل الثلاثي', type: 'text', required: true, icon: '👤', placeholder: 'أحمد محمد علي' },
                { name: 'customerPhone', label: 'رقم الهاتف', type: 'tel', required: true, icon: '📞', placeholder: '09XXXXXXXX' },
                { name: 'customerPhone2', label: 'هاتف بديل', type: 'tel', icon: '📱', placeholder: 'اختياري' },
                { name: 'deviceType', label: 'نوع الجهاز', type: 'text', required: true, icon: '📱', placeholder: 'Samsung / iPhone / ...' },
                { name: 'deviceModel', label: 'الموديل', type: 'text', icon: '🏷️', placeholder: 'A50 / iPhone 12' },
                { name: 'deviceSerial', label: 'السيريال / IMEI', type: 'text', icon: '🔢', placeholder: 'اختياري' },
                { name: 'deviceColor', label: 'اللون', type: 'text', icon: '🎨', placeholder: 'أسود / أبيض' },
                { name: 'issue', label: 'نوع العطل', type: 'textarea', required: true, icon: '🔧', rows: 3, placeholder: 'وصف المشكلة...' },
                { name: 'accessories', label: 'الملحقات مع الجهاز', type: 'text', icon: '🎒', placeholder: 'حماية، سيلكون، شاحن، سماعة' },
                { name: 'expectedCost', label: 'التكلفة المتوقعة', type: 'number', icon: '💰', placeholder: '0', min: 0 },
                { name: 'paidAdvance', label: 'عربون (اختياري)', type: 'number', icon: '💵', placeholder: '0', min: 0 },
                { name: 'actualCost', label: 'التكلفة النهائية (عند التسليم)', type: 'number', icon: '💵', placeholder: '0', min: 0, hint: 'قد تختلف عن المتوقعة' },
                { name: 'expectedDate', label: 'تاريخ التسليم المتوقع', type: 'date', icon: '📅' },
                { name: 'status', label: 'حالة الجهاز', type: 'select', icon: '📊', default: 'received',
                    options: [
                        { value: 'received', label: '📥 مستلم' },
                        { value: 'diagnosing', label: '🔍 قيد الفحص' },
                        { value: 'waiting_parts', label: '⏳ بانتظار قطع' },
                        { value: 'repairing', label: '🔧 قيد الإصلاح' },
                        { value: 'ready', label: '✅ جاهز للتسليم' },
                        { value: 'delivered', label: '📤 تم التسليم' },
                        { value: 'cancelled', label: '❌ ملغي' }
                    ]
                },
                { name: 'lockType', label: 'نوع القفل', type: 'select', icon: '🔐',
                  default: 'none',
                  onchange: '_telecomLockTypeChange()',
                  options: [
                      { value: 'none',      label: '🚫 لا يوجد رمز' },
                      { value: 'pin',       label: '🔢 PIN / رقم سري' },
                      { value: 'password',  label: '🔤 كلمة مرور' },
                      { value: 'pattern',   label: '🔷 نمط (Pattern)' },
                      { value: 'biometric', label: '👆 بصمة / Face ID' }
                  ]
                },
                { name: 'lockValue', label: 'الرمز', type: 'text', icon: '🔑',
                  placeholder: 'أدخل الرمز...',
                  hint: '💡 للنمط: استخدم الشبكة أدناه' },
                { name: 'notes', label: 'ملاحظات الفني', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],
            itemRenderer: function(item) {
                const labels = {
                    'received': '📥 مستلم', 'diagnosing': '🔍 قيد الفحص', 'waiting_parts': '⏳ بانتظار قطع',
                    'repairing': '🔧 قيد الإصلاح', 'ready': '✅ جاهز', 'delivered': '📤 تم التسليم', 'cancelled': '❌ ملغي'
                };
                const colors = {
                    'received': '#3498db', 'diagnosing': '#f39c12', 'waiting_parts': '#e67e22',
                    'repairing': '#9b59b6', 'ready': '#27ae60', 'delivered': '#2c3e50', 'cancelled': '#e74c3c'
                };
                const sLabel = labels[item.status] || '—';
                const sColor = colors[item.status] || '#666';
                const dateStr = _afDate(item.createdAt);
                const cost = item.expectedCost ? _afFmt(item.expectedCost) : '';
                
                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">👤 ${_afEsc(item.customerName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">📞 ${_afEsc(item.customerPhone || '—')} • 📱 ${_afEsc(item.deviceModel || item.deviceType || '—')}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">📄 ${_afEsc(item.number || '—')} • 📅 ${dateStr}</div>
                        </div>
                        <div style="text-align:left;">
                            <div style="background:${sColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${sLabel}</div>
                            ${cost ? `<div style="font-weight:bold; color:#27ae60; font-size:13px; margin-top:6px; text-align:center;">${cost}</div>` : ''}
                        </div>
                    </div>
                    <div style="font-size:11px; color:#c0392b; margin-bottom:8px;">🔧 ${_afEsc((item.issue || '').substring(0, 60))}${item.issue && item.issue.length > 60 ? '...' : ''}</div>
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:4px; margin-bottom:${item.status === 'ready' ? '6px' : '0'};">
                        <button onclick="activityViewItem('telecom', 'receipts', '${item.id}')" style="padding:7px 4px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="عرض">👁️</button>
                        <button onclick="activityPrintItem('telecom', 'receipts', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة عادية (للعميل)">🖨️</button>
                        <button onclick="activityPrintInternal('telecom', 'receipts', '${item.id}')" style="padding:7px 4px; background:#c0392b; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="نسخة داخلية (مع الربح)">🔒</button>
                        <button onclick="activityWhatsAppItem('telecom', 'receipts', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب — الوصل">💬</button>
                        <button onclick="activityOpenForm('telecom', 'receipts', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="activityConfirmDelete('telecom', 'receipts', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                    ${item.status === 'ready' ? `
                    <div style="display:grid; grid-template-columns:2fr 1fr; gap:6px;">
                        <button onclick="activityWhatsAppReady('telecom', 'receipts', '${item.id}')" 
                            style="padding:10px; background:linear-gradient(135deg, #27ae60, #229954); color:white; border:none; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold; box-shadow:0 2px 6px rgba(39,174,96,0.3);">
                            💬 واتساب
                        </button>
                        <button onclick="activitySMSReady('telecom', 'receipts', '${item.id}')" 
                            style="padding:10px; background:linear-gradient(135deg, #3498db, #2980b9); color:white; border:none; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold; box-shadow:0 2px 6px rgba(52,152,219,0.3);"
                            title="فتح تطبيق الرسائل">
                            📱 SMS
                        </button>
                    </div>` : ''}
                </div>`;
            },
            afterSave: async function(data, docId, wasEdit) {
                console.log('🎯 [telecom] saved:', data.number);
                if (data.status === 'delivered' && !wasEdit) {
                    const finalCost = parseFloat(data.expectedCost) || 0;
                    if (finalCost > 0 && typeof sales !== 'undefined' && Array.isArray(sales)) {
                        try {
                            sales.push({
                                invoice: 'SRV-' + (data.number || docId.substring(0, 8)),
                                date: new Date().toISOString().slice(0, 10),
                                customer: data.customerName || 'عميل',
                                items: [{ materialName: 'خدمة صيانة: ' + (data.deviceModel || data.deviceType || 'جهاز'), qty: 1, unitPrice: finalCost, costAtSale: 0, total: finalCost }],
                                total: finalCost, paid: finalCost, remaining: 0,
                                isService: true, source: 'telecom', sourceId: docId
                            });
                            if (typeof saveAllData === 'function') await saveAllData();
                            console.log('💾 [telecom] أُضيف إلى المبيعات:', finalCost);
                        } catch(e) { console.warn('[telecom] sales push:', e.message); }
                    }
                }
            }
        },
        // ═══════════════════════════════════════════════════
        //  🛡️ كفالة الهواتف
        // ═══════════════════════════════════════════════════
        {
            id: 'warranties',
            icon: '🛡️',
            title: 'كفالة الهواتف',
            printTitle: 'شهادة كفالة',
            description: 'تسجيل الأجهزة المباعة + متابعة الكفالة',
            addLabel: '➕ إضافة كفالة جديدة',
            searchPlaceholder: 'ابحث بالاسم / السيريال / رقم الكفالة...',
            emptyIcon: '🛡️',
            autoNumber: true,
            numberPrefix: 'WR',
            printSize: 'thermal',
            searchFields: ['number', 'customerName', 'customerPhone', 'deviceModel', 'deviceSerial'],
            primaryField: 'customerName',
            secondaryField: 'deviceModel',
            stats: [
                { icon: '🛡️', label: 'الكل', compute: (items) => items.length, bg: '#ecf0f1', color: '#2c3e50' },
                { icon: '📱', label: 'بالسيريال', compute: (items) => items.filter(x => x.deviceSerial).length, bg: '#e8f5e9', color: '#27ae60' },
                { icon: '⏰', label: 'قريبة انتهاء', compute: (items) => {
                    const now = new Date(); const soon = new Date(); soon.setDate(now.getDate() + 30);
                    return items.filter(x => x.endDate && new Date(x.endDate) >= now && new Date(x.endDate) <= soon).length;
                }, bg: '#fef3cd', color: '#856404' },
                { icon: '❌', label: 'منتهية', compute: (items) => {
                    const now = new Date();
                    return items.filter(x => x.endDate && new Date(x.endDate) < now).length;
                }, bg: '#f8d7da', color: '#721c24' }
            ],
            fields: [
                { name: 'customerName', label: 'اسم العميل الثلاثي', type: 'text', required: true, icon: '👤', placeholder: 'أحمد محمد علي' },
                { name: 'customerPhone', label: 'رقم الهاتف', type: 'tel', required: true, icon: '📞', placeholder: '09XXXXXXXX' },
                { name: 'deviceType', label: 'نوع الجهاز', type: 'text', required: true, icon: '📱', placeholder: 'Samsung / iPhone' },
                { name: 'deviceModel', label: 'الموديل', type: 'text', required: true, icon: '🏷️', placeholder: 'A50 / iPhone 12' },
                { name: 'deviceSerial', label: 'السيريال / IMEI', type: 'text', required: true, icon: '🔢', placeholder: 'رقم السيريال' },
                { name: 'deviceColor', label: 'اللون', type: 'text', icon: '🎨', placeholder: 'أسود / أبيض' },
                { name: 'warrantyType', label: 'نوع الكفالة', type: 'select', icon: '🛡️', default: 'both',
                    options: [
                        { value: 'software', label: '💻 سوفت وير' },
                        { value: 'hardware', label: '🔧 هاردوير' },
                        { value: 'both', label: '🛡️ سوفت-هاردوير' },
                        { value: 'none', label: '❌ بدون كفالة' }
                    ]
                },
                { name: 'startDate', label: 'بداية الكفالة', type: 'date', required: true, icon: '📅', default: new Date().toISOString().slice(0, 10) },
                { name: 'durationMonths', label: 'مدة الكفالة (بالأشهر)', type: 'number', required: true, icon: '⏰', placeholder: '12', min: 1, default: 12 },
                { name: 'endDate', label: 'نهاية الكفالة', type: 'date', required: true, icon: '📅' },
                { name: 'invoiceNumber', label: 'رقم فاتورة الشراء', type: 'text', icon: '🧾', placeholder: 'اختياري' },
                { name: 'notes', label: 'ملاحظات', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],
            itemRenderer: function(item) {
                const now = new Date();
                let sLabel = '✅ نشطة', sColor = '#27ae60';
                if (item.endDate) {
                    const end = new Date(item.endDate);
                    if (end < now) { sLabel = '❌ منتهية'; sColor = '#e74c3c'; }
                    else {
                        const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                        if (days <= 30) { sLabel = '⏰ ' + days + ' يوم'; sColor = '#f39c12'; }
                        else { sLabel = '✅ ' + Math.ceil(days / 30) + ' شهر'; }
                    }
                }
                const typeLabels = { 'software': '💻 سوفت وير', 'hardware': '🔧 هاردوير', 'both': '🛡️ كامل', 'none': '❌ لا يوجد' };
                const dateStr = _afDate(item.createdAt);
                
                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">👤 ${_afEsc(item.customerName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">📞 ${_afEsc(item.customerPhone || '—')} • 📱 ${_afEsc(item.deviceModel || '—')}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">🔢 ${_afEsc(item.deviceSerial || '—')} • 📄 ${_afEsc(item.number || '—')}</div>
                        </div>
                        <div style="text-align:left; min-width:90px;">
                            <div style="background:${sColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${sLabel}</div>
                            <div style="font-size:10px; color:#666; margin-top:6px; text-align:center;">${typeLabels[item.warrantyType] || ''}</div>
                        </div>
                    </div>
                    <div style="font-size:11px; color:#666; margin-bottom:8px;">📅 من ${item.startDate || '—'} إلى ${item.endDate || '—'}</div>
                    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px;">
                        <button onclick="activityViewItem('telecom', 'warranties', '${item.id}')" style="padding:7px 4px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="عرض">👁️</button>
                        <button onclick="activityPrintItem('telecom', 'warranties', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة">🖨️</button>
                        <button onclick="activityWhatsAppItem('telecom', 'warranties', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب">💬</button>
                        <button onclick="activityOpenForm('telecom', 'warranties', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="activityConfirmDelete('telecom', 'warranties', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                </div>`;
            },
            onFormOpen: function(editData) {
                if (editData) return;
                const startEl = document.getElementById('af-startDate');
                const durEl = document.getElementById('af-durationMonths');
                const endEl = document.getElementById('af-endDate');
                const updateEnd = () => {
                    if (!startEl || !durEl || !endEl) return;
                    const start = startEl.value;
                    const months = parseInt(durEl.value) || 0;
                    if (start && months > 0) {
                        const d = new Date(start);
                        d.setMonth(d.getMonth() + months);
                        endEl.value = d.toISOString().slice(0, 10);
                    }
                };
                startEl?.addEventListener('change', updateEnd);
                durEl?.addEventListener('input', updateEnd);
                updateEnd();
            }
        },
        
        // ═══════════════════════════════════════════════════
        //  🛠️ تسعيرة الخدمات
        // ═══════════════════════════════════════════════════
        {
            id: 'services',
            icon: '🛠️',
            title: 'تسعيرة الخدمات',
            printTitle: 'قائمة أسعار الخدمات',
            description: 'أنواع الصيانة + الأسعار الثابتة',
            addLabel: '➕ إضافة خدمة',
            searchPlaceholder: 'ابحث باسم الخدمة / الماركة...',
            emptyIcon: '🛠️',
            autoNumber: false,
            printSize: 'thermal',
            searchFields: ['serviceName', 'deviceType', 'brand'],
            primaryField: 'serviceName',
            secondaryField: 'deviceType',
            amountField: 'price',
            stats: [
                { icon: '📋', label: 'الكل',
                  compute: (items) => items.length,
                  bg: '#ecf0f1', color: '#2c3e50' },
                { icon: '💰', label: 'الأغلى',
                  compute: (items) => {
                      if (!items.length) return '—';
                      const m = items.reduce((a, b) => (parseFloat(a.price) || 0) > (parseFloat(b.price) || 0) ? a : b);
                      return typeof _afFmt === 'function' ? _afFmt(m.price) : (m.price || 0);
                  },
                  bg: '#fdecea', color: '#c0392b' },
                { icon: '📊', label: 'متوسط السعر',
                  compute: (items) => {
                      if (!items.length) return '0';
                      const sum = items.reduce((s, x) => s + (parseFloat(x.price) || 0), 0);
                      const avg = sum / items.length;
                      return typeof _afFmt === 'function' ? _afFmt(avg) : avg.toFixed(0);
                  },
                  bg: '#e8f5e9', color: '#27ae60' },
                { icon: '📱', label: 'أجهزة',
                  compute: (items) => {
                      const s = new Set(items.map(x => (x.deviceType || '').trim()).filter(Boolean));
                      return s.size;
                  },
                  bg: '#d1ecf1', color: '#0c5460' }
            ],
            fields: [
                { name: 'serviceName', label: 'اسم الخدمة / الإصلاح', type: 'text', required: true, icon: '🛠️', placeholder: 'تغيير شاشة / تبديل بطارية / سوفتوير' },
                { name: 'deviceType', label: 'نوع الجهاز', type: 'text', icon: '📱', placeholder: 'iPhone 12 / Samsung A50' },
                { name: 'brand', label: 'الماركة', type: 'text', icon: '🏷️', placeholder: 'Apple / Samsung / Xiaomi' },
                { name: 'price', label: 'السعر', type: 'number', required: true, icon: '💰', placeholder: '0', min: 0 },
                { name: 'duration', label: 'المدة المتوقعة', type: 'select', icon: '⏱️', default: '1d',
                  options: [
                      { value: '30m',  label: '⚡ أقل من ساعة' },
                      { value: '2h',   label: '⏰ ساعتان' },
                      { value: 'same', label: '📅 نفس اليوم' },
                      { value: '1d',   label: '📆 يوم واحد' },
                      { value: '2d',   label: '📆 يومان' },
                      { value: '3d',   label: '📆 3 أيام' },
                      { value: 'week', label: '📅 أسبوع' }
                  ]
                },
                { name: 'warrantyMonths', label: 'كفالة الإصلاح (بالأشهر)', type: 'number', icon: '🛡️', placeholder: '0', min: 0, default: 0, hint: '0 = بلا كفالة' },
                { name: 'notes', label: 'ملاحظات', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],
            itemRenderer: function(item) {
                const price = item.price ? _afFmt(item.price) : '—';
                const durLabels = {
                    '30m': '⚡ < ساعة', '2h': '⏰ ساعتان', 'same': '📅 نفس اليوم',
                    '1d': '📆 يوم', '2d': '📆 يومان', '3d': '📆 3 أيام', 'week': '📅 أسبوع'
                };
                const dur = durLabels[item.duration] || '—';
                const warranty = parseFloat(item.warrantyMonths) || 0;

                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">🛠️ ${_afEsc(item.serviceName || '—')}</div>
                            ${item.deviceType ? `<div style="font-size:12px; color:#666; margin-top:3px;">📱 ${_afEsc(item.deviceType)}${item.brand ? ' • 🏷️ ' + _afEsc(item.brand) : ''}</div>` : ''}
                            <div style="font-size:11px; color:#999; margin-top:4px;">⏱️ ${dur}${warranty > 0 ? ' • 🛡️ ' + warranty + ' شهر' : ''}</div>
                        </div>
                        <div style="text-align:left;">
                            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; padding:6px 14px; border-radius:10px; font-size:14px; font-weight:700; white-space:nowrap;">${price}</div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px;">
                        <button onclick="activityOpenForm('telecom', 'services', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">✏️ تعديل</button>
                        <button onclick="activityWhatsAppItem('telecom', 'services', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">💬 واتساب</button>
                        <button onclick="activityConfirmDelete('telecom', 'services', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">🗑️ حذف</button>
                    </div>
                </div>`;
            }
        },
        // ═══════════════════════════════════════════════════
        //  📊 تقارير الصيانة
        // ═══════════════════════════════════════════════════
        //  📝 النواقص — مواد يطلبها الزبائن وغير متوفرة
        // ═══════════════════════════════════════════════════
        {
            id: 'shortages',
            icon: '📝',
            title: 'النواقص',
            printTitle: 'قائمة النواقص',
            description: 'مواد يطلبها الزبائن وغير متوفرة',
            addLabel: '➕ إضافة ناقص',
            searchPlaceholder: 'ابحث باسم المادة / الزبون...',
            emptyIcon: '📝',
            autoNumber: true,
            numberPrefix: 'SH',
            printSize: 'thermal',
            searchFields: ['number', 'itemName', 'customerName', 'customerPhone'],
            primaryField: 'itemName',
            secondaryField: 'customerName',
            amountField: 'expectedPrice',
            stats: [
                { icon: '📋', label: 'الكل',
                  compute: (items) => items.length,
                  bg: '#ecf0f1', color: '#2c3e50', filterId: 'all' },
                { icon: '⏳', label: 'قيد الانتظار',
                  compute: (items) => items.filter(x => x.status === 'pending').length,
                  bg: '#fff3cd', color: '#856404', filterId: 'pending' },
                { icon: '📦', label: 'تم الطلب',
                  compute: (items) => items.filter(x => x.status === 'ordered').length,
                  bg: '#d1ecf1', color: '#0c5460', filterId: 'ordered' },
                { icon: '✅', label: 'وصل',
                  compute: (items) => items.filter(x => x.status === 'arrived').length,
                  bg: '#d4edda', color: '#155724', filterId: 'arrived' },
                { icon: '💰', label: 'إجمالي متوقع',
                  compute: (items) => {
                      const t = items.reduce((s, x) => s + (parseFloat(x.expectedPrice) || 0) * (parseFloat(x.quantity) || 1), 0);
                      return typeof formatCurrency === 'function' ? formatCurrency(t) : t.toLocaleString('ar-SY');
                  },
                  bg: '#d1ecf1', color: '#0c5460' }
            ],
            filters: [
                { id: 'all', label: 'الكل' },
                { id: 'pending', label: 'قيد الانتظار' },
                { id: 'ordered', label: 'تم الطلب' },
                { id: 'arrived', label: 'وصل' },
                { id: 'delivered', label: 'سُلّم' },
                { id: 'cancelled', label: 'ملغي' }
            ],
            fields: [
                { name: 'itemName', label: 'اسم المادة المطلوبة', type: 'text', required: true, icon: '📦', placeholder: 'شاشة آيفون 12 / بطارية Samsung A50' },
                { name: 'customerName', label: 'اسم الزبون', type: 'text', required: true, icon: '👤', placeholder: 'أحمد محمد علي' },
                { name: 'customerPhone', label: 'رقم الهاتف', type: 'tel', required: true, icon: '📞', placeholder: '09XXXXXXXX' },
                { name: 'quantity', label: 'الكمية', type: 'number', required: true, icon: '🔢', placeholder: '1', min: 1, default: 1 },
                { name: 'expectedPrice', label: 'السعر المتوقع للزبون', type: 'number', icon: '💰', placeholder: '0', min: 0 },
                { name: 'advancePayment', label: 'عربون (اختياري)', type: 'number', icon: '💵', placeholder: '0', min: 0 },
                { name: 'requestedDate', label: 'تاريخ الطلب', type: 'date', icon: '📅', default: new Date().toISOString().slice(0, 10) },
                { name: 'expectedDate', label: 'التاريخ المتوقع للوصول', type: 'date', icon: '📆' },
                { name: 'status', label: 'الحالة', type: 'select', icon: '📊', default: 'pending',
                  options: [
                      { value: 'pending', label: '⏳ قيد الانتظار' },
                      { value: 'ordered', label: '📦 تم الطلب' },
                      { value: 'arrived', label: '✅ وصل' },
                      { value: 'delivered', label: '📤 تم التسليم' },
                      { value: 'cancelled', label: '❌ ملغي' }
                  ]},
                { name: 'supplier', label: 'المورد / المصدر', type: 'text', icon: '🏪', placeholder: 'اختياري' },
                { name: 'notes', label: 'ملاحظات', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],
            itemRenderer: function(item) {
                const labels = {
                    'pending': '⏳ قيد الانتظار', 'ordered': '📦 تم الطلب', 'arrived': '✅ وصل',
                    'delivered': '📤 تم التسليم', 'cancelled': '❌ ملغي'
                };
                const colors = {
                    'pending': '#f39c12', 'ordered': '#3498db', 'arrived': '#27ae60',
                    'delivered': '#2c3e50', 'cancelled': '#e74c3c'
                };
                const sLabel = labels[item.status] || '—';
                const sColor = colors[item.status] || '#666';
                const dateStr = _afDate(item.createdAt);
                const price = item.expectedPrice ? _afFmt(item.expectedPrice) : '';
                const qty = parseFloat(item.quantity) || 1;
                const advance = parseFloat(item.advancePayment) || 0;

                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">📦 ${_afEsc(item.itemName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">👤 ${_afEsc(item.customerName || '—')} • 📞 ${_afEsc(item.customerPhone || '—')}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">📄 ${_afEsc(item.number || '—')} • 📅 ${dateStr}</div>
                            <div style="font-size:11px; color:#e67e22; margin-top:3px;">🔢 الكمية: ${qty}${advance > 0 ? ` • 💵 عربون: ${_afFmt(advance)}` : ''}</div>
                        </div>
                        <div style="text-align:left;">
                            <div style="background:${sColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${sLabel}</div>
                            ${price ? `<div style="font-weight:bold; color:#27ae60; font-size:13px; margin-top:6px; text-align:center;">${price}</div>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px;">
                        <button onclick="activityViewItem('telecom', 'shortages', '${item.id}')" style="padding:7px 4px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="عرض">👁️</button>
                        <button onclick="activityPrintItem('telecom', 'shortages', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة">🖨️</button>
                        <button onclick="activityWhatsAppItem('telecom', 'shortages', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب">💬</button>
                        <button onclick="activityOpenForm('telecom', 'shortages', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="activityConfirmDelete('telecom', 'shortages', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                </div>`;
            }
        },

        // ═══════════════════════════════════════════════════
        {
            id: 'reports',
            icon: '📊',
            title: 'تقارير الصيانة',
            description: 'تحليل شامل لأجهزة الصيانة + الأداء',
            addLabel: '🔄 تحديث التقارير',
            emptyIcon: '📊',
            searchFields: ['number', 'customerName'],
            unifiedSearch: false,
            fields: [],
            
            // 🎨 عرض مخصص — تقرير شامل
            itemRenderer: function() {
                return ''; // لن نستخدم القائمة العادية
            },
            
            // 🎯 عرض مخصص للصفحة كاملة
            pageRenderer: function(container, activity, pageConfig) {
                _renderTelecomReports(container);
            }
        }
    ]
});

console.log('📱 [telecom] activity registered | 3 pages');

// ═══════════════════════════════════════════════════════════
//  📊 TELECOM REPORTS — تقارير الصيانة
// ═══════════════════════════════════════════════════════════

async function _renderTelecomReports(container) {
    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">📊 تقارير الصيانة</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">تحليل شامل لأداء الصيانة</p>
        
        <div style="background:#f8f9fa; padding:12px; border-radius:10px; margin-bottom:15px;">
            <label style="display:block; font-size:13px; color:#555; margin-bottom:6px; font-weight:600;">📅 الفترة</label>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="_telecomReportsRange(7, this)" class="rpt-range-btn" style="padding:8px 14px; background:white; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">آخر 7 أيام</button>
                <button onclick="_telecomReportsRange(30, this)" class="rpt-range-btn" style="padding:8px 14px; background:#e67e22; color:white; border:1px solid #e67e22; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600;">آخر 30 يوم</button>
                <button onclick="_telecomReportsRange(90, this)" class="rpt-range-btn" style="padding:8px 14px; background:white; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">آخر 3 أشهر</button>
                <button onclick="_telecomReportsRange(365, this)" class="rpt-range-btn" style="padding:8px 14px; background:white; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">آخر سنة</button>
                <button onclick="_telecomReportsRange(0, this)" class="rpt-range-btn" style="padding:8px 14px; background:white; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:12px;">الكل</button>
            </div>
        </div>
        
        <div id="telecomReportContent">
            <div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>
        </div>
    `;
    
    await _telecomReportsGenerate(30, container.querySelector('.rpt-range-btn:nth-child(2)'));
}

async function _telecomReportsRange(days, btn) {
    // Active state
    document.querySelectorAll('.rpt-range-btn').forEach(b => {
        b.style.background = 'white';
        b.style.color = '#333';
        b.style.fontWeight = '400';
        b.style.borderColor = '#ddd';
    });
    if (btn) {
        btn.style.background = '#e67e22';
        btn.style.color = 'white';
        btn.style.fontWeight = '600';
        btn.style.borderColor = '#e67e22';
    }
    
    await _telecomReportsGenerate(days);
}

async function _telecomReportsGenerate(days) {
    const container = document.getElementById('telecomReportContent');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>';
    
    // ═══ جلب البيانات ═══
    const receipts = await activityGetAll('telecom', 'receipts', 500);
    const warranties = await activityGetAll('telecom', 'warranties', 500);
    
    // فلترة بالفترة
    let cutoff = null;
    if (days > 0) {
        cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
    }
    
    const inRange = (item) => {
        if (!cutoff) return true;
        const ts = item.createdAt?.toMillis?.() || 0;
        return ts >= cutoff.getTime();
    };
    
    const r = receipts.filter(inRange);
    const w = warranties.filter(inRange);
    
    // ═══ حساب الإحصائيات ═══
    const total = r.length;
    const delivered = r.filter(x => x.status === 'delivered').length;
    const cancelled = r.filter(x => x.status === 'cancelled').length;
    const ready = r.filter(x => x.status === 'ready').length;
    const inProgress = r.filter(x => ['received','diagnosing','waiting_parts','repairing'].includes(x.status)).length;
    
    // متأخرة
    const today = new Date().toISOString().slice(0, 10);
    const overdue = r.filter(x => x.expectedDate && x.expectedDate < today && !['delivered','cancelled'].includes(x.status)).length;
    
    // 💰 الدخل من الصيانة
    const totalRevenue = r.filter(x => x.status === 'delivered').reduce((s, x) => s + (parseFloat(x.expectedCost) || 0), 0);
    const avgRevenue = delivered > 0 ? totalRevenue / delivered : 0;
    
    // ⏰ متوسط وقت الإصلاح (بالأيام)
    let avgDays = 0;
    const deliveredItems = r.filter(x => x.status === 'delivered' && x.createdAt && x.deliveredAt);
    if (deliveredItems.length > 0) {
        const totalDays = deliveredItems.reduce((sum, x) => {
            const start = x.createdAt?.toMillis?.() || 0;
            const end = x.deliveredAt?.toMillis?.() || start;
            return sum + ((end - start) / (1000 * 60 * 60 * 24));
        }, 0);
        avgDays = totalDays / deliveredItems.length;
    }
    
    // 🔧 الأكثر عطلاً (موديلات)
    const byModel = {};
    r.forEach(x => {
        const model = x.deviceModel || x.deviceType || 'غير محدد';
        byModel[model] = (byModel[model] || 0) + 1;
    });
    const topModels = Object.entries(byModel).sort((a,b) => b[1]-a[1]).slice(0, 5);
    
    // 🔧 الأكثر عطلاً (أنواع أعطال)
    const byIssue = {};
    r.forEach(x => {
        if (!x.issue) return;
        const issue = x.issue.substring(0, 40);
        byIssue[issue] = (byIssue[issue] || 0) + 1;
    });
    const topIssues = Object.entries(byIssue).sort((a,b) => b[1]-a[1]).slice(0, 5);
    
    // 📊 الحالات
    const statusCount = {
        'received': r.filter(x => x.status === 'received').length,
        'diagnosing': r.filter(x => x.status === 'diagnosing').length,
        'waiting_parts': r.filter(x => x.status === 'waiting_parts').length,
        'repairing': r.filter(x => x.status === 'repairing').length,
        'ready': ready,
        'delivered': delivered,
        'cancelled': cancelled
    };
    
    // 🎨 HTML
    const _fmt = (n) => typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n).toLocaleString('ar-SY') + ' ل.س';
    
    let html = `
        <!-- بطاقات رئيسية -->
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg, #3498db, #2980b9); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">📋 إجمالي الأجهزة</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${total}</div>
            </div>
            <div style="background:linear-gradient(135deg, #27ae60, #229954); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">💰 دخل الصيانة</div>
                <div style="font-size:18px; font-weight:bold; margin-top:4px;">${_fmt(totalRevenue)}</div>
                <div style="font-size:10px; opacity:0.8; margin-top:2px;">متوسط: ${_fmt(avgRevenue)}</div>
            </div>
            <div style="background:linear-gradient(135deg, #9b59b6, #8e44ad); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">⏰ متوسط الإصلاح</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${avgDays.toFixed(1)}</div>
                <div style="font-size:10px; opacity:0.8; margin-top:2px;">يوم</div>
            </div>
            <div style="background:linear-gradient(135deg, ${overdue > 0 ? '#e74c3c, #c0392b' : '#f39c12, #e67e22'}); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">⏰ متأخرة</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${overdue}</div>
            </div>
        </div>
        
        <!-- توزيع الحالات -->
        <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <h3 style="margin:0 0 12px 0; font-size:14px; color:#2c3e50;">📊 توزيع الحالات</h3>
            ${Object.entries(statusCount).map(([key, val]) => {
                if (val === 0) return '';
                const labels = {
                    'received': '📥 مستلم', 'diagnosing': '🔍 قيد الفحص', 'waiting_parts': '⏳ بانتظار قطع',
                    'repairing': '🔧 قيد الإصلاح', 'ready': '✅ جاهز', 'delivered': '📤 تم التسليم', 'cancelled': '❌ ملغي'
                };
                const colors = {
                    'received': '#3498db', 'diagnosing': '#f39c12', 'waiting_parts': '#e67e22',
                    'repairing': '#9b59b6', 'ready': '#27ae60', 'delivered': '#2c3e50', 'cancelled': '#e74c3c'
                };
                const pct = total > 0 ? (val / total * 100) : 0;
                return `
                    <div style="margin-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span>${labels[key] || key}</span>
                            <span style="font-weight:bold;">${val} (${pct.toFixed(0)}%)</span>
                        </div>
                        <div style="background:#f0f0f0; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="background:${colors[key] || '#666'}; height:100%; width:${pct}%;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <!-- الأكثر عطلاً (موديلات) -->
        ${topModels.length > 0 ? `
        <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <h3 style="margin:0 0 10px 0; font-size:14px; color:#2c3e50;">🔧 أكثر الموديلات أعطالاً</h3>
            ${topModels.map(([model, count], i) => `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #eee; font-size:13px;">
                    <span>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📱'} ${_afEsc(model)}</span>
                    <span style="font-weight:bold; color:#e67e22;">${count}</span>
                </div>
            `).join('')}
        </div>` : ''}
        
        <!-- الأكثر عطلاً (أنواع أعطال) -->
        ${topIssues.length > 0 ? `
        <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <h3 style="margin:0 0 10px 0; font-size:14px; color:#2c3e50;">🔧 أكثر الأعطال تكراراً</h3>
            ${topIssues.map(([issue, count], i) => `
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #eee; font-size:13px;">
                    <span>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔧'} ${_afEsc(issue)}</span>
                    <span style="font-weight:bold; color:#c0392b;">${count}</span>
                </div>
            `).join('')}
        </div>` : ''}
        
        <!-- الكفالات -->
        <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <h3 style="margin:0 0 10px 0; font-size:14px; color:#2c3e50;">🛡️ الكفالات</h3>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
                <div style="background:#e8f5e9; padding:10px; border-radius:8px; text-align:center;">
                    <div style="font-size:11px; color:#666;">إجمالي</div>
                    <div style="font-size:18px; font-weight:bold; color:#27ae60;">${w.length}</div>
                </div>
                <div style="background:#fff3cd; padding:10px; border-radius:8px; text-align:center;">
                    <div style="font-size:11px; color:#666;">قريبة انتهاء</div>
                    <div style="font-size:18px; font-weight:bold; color:#856404;">${w.filter(x => {
                        if (!x.endDate) return false;
                        const end = new Date(x.endDate);
                        const now = new Date();
                        const soon = new Date(); soon.setDate(now.getDate() + 30);
                        return end >= now && end <= soon;
                    }).length}</div>
                </div>
            </div>
        </div>
        
        <!-- تصدير -->
        <button onclick="_telecomReportsExport()" 
            style="width:100%; padding:14px; background:linear-gradient(135deg, #34495e, #2c3e50); color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:bold;">
            📤 تصدير التقرير
        </button>
    `;
    
    container.innerHTML = html;
    
    // تخزين للتصدير
    window._telecomReportsData = {
        total, delivered, cancelled, ready, inProgress, overdue,
        totalRevenue, avgRevenue, avgDays,
        topModels, topIssues, statusCount,
        receipts: r, warranties: w
    };
}

async function _telecomReportsExport() {
    const data = window._telecomReportsData;
    if (!data) return;
    
    const _fmt = (n) => Number(n).toLocaleString('ar-SY');
    
    const headers = ['البند', 'القيمة'];
    const rows = [
        ['📋 إجمالي الأجهزة', data.total],
        ['✅ تم التسليم', data.delivered],
        ['🔧 قيد العمل', data.inProgress],
        ['✅ جاهز', data.ready],
        ['❌ ملغي', data.cancelled],
        ['⏰ متأخرة', data.overdue],
        ['', ''],
        ['💰 دخل الصيانة', data.totalRevenue],
        ['💵 متوسط الإصلاح', Math.round(data.avgRevenue)],
        ['⏰ متوسط الأيام', data.avgDays.toFixed(1)],
        ['', ''],
        ['🛡️ إجمالي الكفالات', data.warranties.length]
    ];
    
    if (typeof openExportMenu === 'function') {
        openExportMenu({
            title: 'تقرير الصيانة',
            columns: headers,
            rows: rows,
            filename: 'تقرير_الصيانة'
        });
    } else {
        alert('⚠️ نظام التصدير غير محمّل');
    }
}

window._renderTelecomReports = _renderTelecomReports;
window._telecomReportsRange = _telecomReportsRange;
window._telecomReportsExport = _telecomReportsExport;


// ═══════════════════════════════════════════════════════════
//  🔧 TELECOM PARTS — إدارة قطع الغيار
// ═══════════════════════════════════════════════════════════

window._telecomPartsState = [];

function _telecomPartsInit(editData) {
    if (editData && Array.isArray(editData.parts)) {
        window._telecomPartsState = editData.parts.map(p => ({ ...p }));
    } else {
        window._telecomPartsState = [];
    }
    _telecomPartsRender();
}

function _telecomAddPart() {
    window._telecomPartsState.push({ name: '', cost: 0, qty: 1 });
    _telecomPartsRender();
}

function _telecomUpdatePart(idx, field, value) {
    if (!window._telecomPartsState[idx]) return;
    if (field === 'cost' || field === 'qty') {
        window._telecomPartsState[idx][field] = parseFloat(value) || 0;
    } else {
        window._telecomPartsState[idx][field] = value;
    }
    _telecomPartsUpdateTotal();
}

function _telecomRemovePart(idx) {
    if (!confirm('🗑️ حذف هذه القطعة؟')) return;
    window._telecomPartsState.splice(idx, 1);
    _telecomPartsRender();
}

function _telecomPartsRender() {
    const listEl = document.getElementById('telecomPartsList');
    if (!listEl) return;
    
    const parts = window._telecomPartsState || [];
    
    if (parts.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:15px; color:#999; font-size:12px; background:#f8f9fa; border-radius:8px;">لا توجد قطع — اضغط "➕ إضافة قطعة"</div>';
        _telecomPartsUpdateTotal();
        return;
    }
    
    let html = '';
    
    // 🎯 رؤوس الحقول
    html += `
        <div class="parts-header" style="display:grid; grid-template-columns:2fr 1fr 1fr 40px; gap:6px; margin-bottom:4px; padding:0 8px;">
            <div style="font-size:10px; color:#666; font-weight:600; text-align:right;">القطعة</div>
            <div style="font-size:10px; color:#666; font-weight:600; text-align:center;">التكلفة</div>
            <div style="font-size:10px; color:#666; font-weight:600; text-align:center;">الكمية</div>
            <div></div>
        </div>
    `;
    
    parts.forEach((p, idx) => {
        html += `
            <div style="display:grid; grid-template-columns:2fr 1fr 1fr 40px; gap:6px; margin-bottom:6px; align-items:center; background:#f8f9fa; padding:8px; border-radius:8px;">
                <input type="text" value="${_afEsc(p.name || '')}" 
                    onchange="_telecomUpdatePart(${idx}, 'name', this.value)"
                    placeholder="اسم القطعة"
                    style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; font-family:inherit;">
                <input type="number" value="${p.cost || 0}" min="0"
                    onchange="_telecomUpdatePart(${idx}, 'cost', this.value)"
                    placeholder="التكلفة"
                    style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; text-align:center;">
                <input type="number" value="${p.qty || 1}" min="1"
                    onchange="_telecomUpdatePart(${idx}, 'qty', this.value)"
                    placeholder="الكمية"
                    style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; text-align:center;">
                <button type="button" onclick="_telecomRemovePart(${idx})"
                    style="padding:8px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">🗑️</button>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    _telecomPartsUpdateTotal();
}

function _telecomPartsUpdateTotal() {
    const parts = window._telecomPartsState || [];
    const total = parts.reduce((s, p) => s + ((parseFloat(p.cost) || 0) * (parseFloat(p.qty) || 1)), 0);
    
    const totalEl = document.getElementById('telecomPartsTotal');
    const totalValEl = document.getElementById('telecomPartsTotalVal');
    
    if (totalEl && totalValEl) {
        if (total > 0) {
            totalEl.style.display = 'block';
            totalValEl.textContent = (typeof formatCurrency === 'function') ? formatCurrency(total) : total.toLocaleString('ar-SY') + ' ل.س';
        } else {
            totalEl.style.display = 'none';
        }
    }
    
    window._telecomPartsTotal = total;
}

window._telecomAddPart = _telecomAddPart;
window._telecomUpdatePart = _telecomUpdatePart;
window._telecomRemovePart = _telecomRemovePart;
window._telecomPartsRender = _telecomPartsRender;


// ═══════════════════════════════════════════════════════════
//  📤 BULK SEND — إرسال جماعي للمورد
// ═══════════════════════════════════════════════════════════

function openShortagesBulkSend() {
    const items = (typeof _activityCache !== 'undefined' && _activityCache.getAll)
        ? _activityCache.getAll('shortages') : [];

    if (!items.length) {
        alert('⚠️ لا توجد نواقص للإرسال');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'shortageBulkModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';

    modal.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:20px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">' +
            '<h2 style="margin:0;font-size:18px;color:#2c3e50;">📤 إرسال جماعي للمورد</h2>' +
            '<button onclick="closeShortageBulk()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>' +
        '</div>' +

        '<div style="margin-bottom:12px;">' +
            '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600;">🏪 المورد</label>' +
            '<select id="sbSupplier" onchange="_sbUpdatePreview()" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;font-family:inherit;background:white;font-size:14px;">' +
                '<option value="">— اختر المورد —</option>' +
            '</select>' +
        '</div>' +

        '<div style="margin-bottom:12px;">' +
            '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600;">📊 الحالة</label>' +
            '<div style="display:flex;gap:6px;">' +
                '<label style="flex:1;padding:10px;background:#fff8f0;border:2px solid #e67e22;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;">' +
                    '<input type="radio" name="sbStatus" value="pending" checked onchange="_sbUpdatePreview()"> ⏳ قيد الانتظار' +
                '</label>' +
                '<label style="flex:1;padding:10px;background:#f8f9fa;border:2px solid #ddd;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;">' +
                    '<input type="radio" name="sbStatus" value="active" onchange="_sbUpdatePreview()"> 🔵 النشطة' +
                '</label>' +
            '</div>' +
        '</div>' +

        '<div style="margin-bottom:12px;">' +
            '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600;">🎨 طريقة العرض</label>' +
            '<div style="display:flex;gap:6px;">' +
                '<label style="flex:1;padding:10px;background:#fff8f0;border:2px solid #e67e22;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;">' +
                    '<input type="radio" name="sbLayout" value="grouped" checked onchange="_sbUpdatePreview()"> 📦 مجمّع' +
                '</label>' +
                '<label style="flex:1;padding:10px;background:#f8f9fa;border:2px solid #ddd;border-radius:8px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;">' +
                    '<input type="radio" name="sbLayout" value="detailed" onchange="_sbUpdatePreview()"> 📋 مفصّل' +
                '</label>' +
            '</div>' +
        '</div>' +

        '<div style="margin-bottom:12px;">' +
            '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;font-weight:600;">👁️ معاينة الرسالة</label>' +
            '<div id="sbPreview" style="background:#f8f9fa;border:1px dashed #ccc;border-radius:8px;padding:12px;font-size:12px;color:#2c3e50;white-space:pre-wrap;font-family:monospace;direction:rtl;text-align:right;max-height:220px;overflow-y:auto;line-height:1.6;"></div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
            '<button onclick="_sbSendWhatsApp()" style="padding:13px;background:linear-gradient(135deg,#25D366,#1da851);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">📱 إرسال واتساب</button>' +
            '<button onclick="_sbCopyText()" style="padding:13px;background:#3498db;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">📋 نسخ النص</button>' +
        '</div>' +
    '</div>';

    document.body.appendChild(modal);
    _sbPopulateSuppliers();
    _sbUpdatePreview();
}

function closeShortageBulk() {
    const m = document.getElementById('shortageBulkModal');
    if (m) m.remove();
}

function _sbPopulateSuppliers() {
    const sel = document.getElementById('sbSupplier');
    if (!sel) return;
    const suppliers = (typeof _supCache !== 'undefined' && Array.isArray(_supCache)) ? _supCache : [];
    suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = '🏭 ' + (s.name || '-') + (s.phone ? ' • ' + s.phone : '');
        sel.appendChild(opt);
    });
    if (suppliers.length > 0) sel.value = suppliers[0].id;
}

function _sbGetFiltered() {
    const items = (typeof _activityCache !== 'undefined' && _activityCache.getAll)
        ? _activityCache.getAll('shortages') : [];
    const r = document.querySelector('input[name="sbStatus"]:checked');
    const sv = r ? r.value : 'pending';
    if (sv === 'pending') return items.filter(it => it.status === 'pending');
    return items.filter(it => ['pending','ordered','arrived'].includes(it.status));
}

function _sbBuildMessage() {
    const items = _sbGetFiltered();
    if (!items.length) return '';
    const rl = document.querySelector('input[name="sbLayout"]:checked');
    const layout = rl ? rl.value : 'grouped';
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = biz.businessName || 'المدير AI';
    const d = new Date();
    const ds = String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();

    const lines = [];
    lines.push('🛒 *طلبية مواد ناقصة*');
    lines.push('📅 ' + ds);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━');

    let tQty = 0, tPrice = 0;

    if (layout === 'grouped') {
        const g = {};
        items.forEach(it => {
            const k = (it.itemName || '').trim() || '—';
            if (!g[k]) g[k] = { qty: 0, price: 0 };
            const q = parseFloat(it.quantity) || 1;
            g[k].qty += q;
            g[k].price += (parseFloat(it.expectedPrice) || 0) * q;
        });
        let i = 1;
        Object.keys(g).forEach(k => {
            lines.push(i + '. ' + k + '   × ' + g[k].qty);
            tQty += g[k].qty;
            tPrice += g[k].price;
            i++;
        });
    } else {
        let i = 1;
        items.forEach(it => {
            const q = parseFloat(it.quantity) || 1;
            lines.push(i + '. ' + (it.itemName || '—') + ' × ' + q);
            lines.push('   👤 ' + (it.customerName || '—'));
            tQty += q;
            tPrice += (parseFloat(it.expectedPrice) || 0) * q;
            i++;
        });
    }

    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('📊 إجمالي: ' + tQty + ' قطعة');
    if (tPrice > 0) lines.push('💰 التكلفة: ' + tPrice.toLocaleString('ar-SY') + ' ل.س');
    lines.push('');
    lines.push('📍 من: ' + bizName);
    return lines.join('\n');
}

function _sbUpdatePreview() {
    const el = document.getElementById('sbPreview');
    if (!el) return;
    const items = _sbGetFiltered();
    if (!items.length) {
        el.textContent = '⚠️ لا توجد مواد مطابقة';
        return;
    }
    el.textContent = _sbBuildMessage();
}

function _sbSendWhatsApp() {
    const sel = document.getElementById('sbSupplier');
    if (!sel || !sel.value) { alert('⚠️ اختر المورد'); return; }
    const sup = (typeof _supCache !== 'undefined') ? _supCache.find(s => s.id === sel.value) : null;
    if (!sup) { alert('⚠️ المورد غير موجود'); return; }
    if (!sup.phone) { alert('⚠️ لا يوجد رقم لهذا المورد'); return; }
    const msg = _sbBuildMessage();
    if (!msg) { alert('⚠️ لا توجد مواد'); return; }
    const phone = String(sup.phone).replace(/[^0-9]/g, '');
    const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
    setTimeout(function() {
        if (confirm('📤 هل تريد تعليم كل المواد المرسلة كـ "تم الطلب"؟')) {
            _sbMarkAsOrdered();
        } else {
            closeShortageBulk();
        }
    }, 600);
}

async function _sbMarkAsOrdered() {
    const items = _sbGetFiltered();
    let ok = 0, fail = 0;
    for (const it of items) {
        try {
            if (typeof activityUpdate === 'function') {
                await activityUpdate('telecom', 'shortages', it.id, { status: 'ordered' });
                ok++;
            } else if (typeof activitySaveItem === 'function') {
                await activitySaveItem('telecom', 'shortages', it.id, { status: 'ordered' });
                ok++;
            } else {
                console.warn('[bulk] لا توجد دالة تحديث');
                fail++;
            }
        } catch(e) {
            console.warn('[bulk]', e);
            fail++;
        }
    }
    alert('✅ تم تحديث: ' + ok + (fail > 0 ? ' | ❌ فشل: ' + fail : ''));
    closeShortageBulk();
    if (typeof activityRefresh === 'function') activityRefresh('telecom', 'shortages');
}

function _sbCopyText() {
    const msg = _sbBuildMessage();
    if (!msg) { alert('⚠️ لا شيء لنسخه'); return; }
    if (navigator.clipboard) {
        navigator.clipboard.writeText(msg).then(function(){ alert('✅ تم النسخ'); }).catch(function(){ _sbFallbackCopy(msg); });
    } else {
        _sbFallbackCopy(msg);
    }
}

function _sbFallbackCopy(t) {
    const ta = document.createElement('textarea');
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); alert('✅ تم النسخ'); } catch(e) { alert('❌ فشل'); }
    document.body.removeChild(ta);
}

// ─── Auto-inject button into shortages page ───
(function initShortagesBulkInjector() {
    function tryInject() {
        const page = document.getElementById('activity-telecom-shortages');
        if (!page || page.style.display === 'none') return;
        if (page.querySelector('#sbBulkBtnRow')) return;

        const row = document.createElement('div');
        row.id = 'sbBulkBtnRow';
        row.style.cssText = 'margin:12px 0;';
        row.innerHTML = '<button onclick="openShortagesBulkSend()" style="width:100%;padding:13px;background:linear-gradient(135deg,#25D366,#1da851);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 3px 10px rgba(37,211,102,0.3);">📤 إرسال جماعي للمورد</button>';

        page.insertBefore(row, page.firstChild);
        console.log('✅ [shortages-bulk] زر الإرسال مُضاف');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setInterval(tryInject, 1000);
        });
    } else {
        setInterval(tryInject, 1000);
    }
})();

window.openShortagesBulkSend = openShortagesBulkSend;
window.closeShortageBulk = closeShortageBulk;
window._sbUpdatePreview = _sbUpdatePreview;
window._sbSendWhatsApp = _sbSendWhatsApp;
window._sbCopyText = _sbCopyText;


// ═══════════════════════════════════════════════════════════
//  🔐 PATTERN LOCK — رمز قفل الجهاز
// ═══════════════════════════════════════════════════════════
let _telecomPatternSeq = [];

function _telecomLockInit(editData) {
    setTimeout(function() {
        const typeEl = document.getElementById('af-lockType');
        const valueEl = document.getElementById('af-lockValue');
        if (!typeEl) return;

        if (editData) {
            typeEl.value = editData.lockType || 'none';
            if (valueEl) valueEl.value = editData.lockValue || '';
            _telecomPatternSeq = (typeEl.value === 'pattern' && editData.lockValue)
                ? String(editData.lockValue).split('-').map(x => parseInt(x)).filter(x => x >= 1 && x <= 9)
                : [];
        } else {
            _telecomPatternSeq = [];
        }

        _telecomLockTypeChange();
        _telecomPatternRender();
    }, 150);
}

function _telecomLockTypeChange() {
    const typeEl = document.getElementById('af-lockType');
    const valueEl = document.getElementById('af-lockValue');
    const valueWrap = valueEl ? valueEl.closest('.af-field') : null;
    const patternWrap = document.getElementById('telecomPatternWrap');
    const type = typeEl ? typeEl.value : 'none';

    if (valueWrap) valueWrap.style.display = 'none';
    if (patternWrap) patternWrap.style.display = 'none';

    if (type === 'none' || type === 'biometric') {
        if (valueEl) valueEl.value = '';
        _telecomPatternSeq = [];
    } else if (type === 'pattern') {
        if (patternWrap) patternWrap.style.display = 'block';
        _telecomPatternRender();
    } else {
        if (valueWrap) valueWrap.style.display = 'block';
        if (valueEl) {
            valueEl.placeholder = type === 'pin' ? 'مثال: 1234' : 'مثال: ahmad123';
        }
    }
}

function _telecomPatternTap(n) {
    n = parseInt(n);
    if (!n || n < 1 || n > 9) return;
    if (_telecomPatternSeq.indexOf(n) >= 0) return;
    _telecomPatternSeq.push(n);
    _telecomPatternRender();
}

function _telecomPatternClear() {
    _telecomPatternSeq = [];
    _telecomPatternRender();
}

function _telecomPatternRender() {
    const dots = document.querySelectorAll('.tp-dot');
    for (let i = 0; i < dots.length; i++) {
        const btn = dots[i];
        const p = parseInt(btn.dataset.p);
        const idx = _telecomPatternSeq.indexOf(p);
        if (idx >= 0) {
            btn.style.background = '#3498db';
            btn.style.color = 'white';
            btn.style.borderColor = '#2980b9';
            btn.style.transform = 'scale(1.08)';
            btn.textContent = String(idx + 1);
        } else {
            btn.style.background = 'white';
            btn.style.color = '#3498db';
            btn.style.borderColor = '#3498db';
            btn.style.transform = 'scale(1)';
            btn.textContent = String(p);
        }
    }
    const seqEl = document.getElementById('telecomPatternSeq');
    if (seqEl) {
        if (_telecomPatternSeq.length === 0) {
            seqEl.textContent = '— لا يوجد نمط —';
            seqEl.style.color = '#95a5a6';
        } else {
            seqEl.textContent = _telecomPatternSeq.join(' → ');
            seqEl.style.color = '#2980b9';
        }
    }
    const valueEl = document.getElementById('af-lockValue');
    if (valueEl) {
        valueEl.value = _telecomPatternSeq.join('-');
    }
}

window._telecomLockInit = _telecomLockInit;
window._telecomLockTypeChange = _telecomLockTypeChange;
window._telecomPatternTap = _telecomPatternTap;
window._telecomPatternClear = _telecomPatternClear;
