// ============================================================
//  💊 ACTIVITY: PHARMACY — نشاط الصيدلية
//  دفعات + وصفات + تنبيهات صلاحية
//  v1.0.0
// ============================================================

ACTIVITY_REGISTRY.register({
    id: 'pharmacy',
    name: 'الصيدلية',
    icon: '💊',
    pages: [
        // ═══════════════════════════════════════════════════
        //  📦 دفعات الأدوية
        // ═══════════════════════════════════════════════════
        {
            id: 'batches',
            icon: '📦',
            title: 'دفعات الأدوية',
            printTitle: 'وصل استلام دفعة',
            description: 'استلام دفعة دواء + تتبع الصلاحية',
            addLabel: '➕ استلام دفعة جديدة',
            searchPlaceholder: 'ابحث بالاسم / رقم الدفعة / المورد...',
            emptyIcon: '📦',
            autoNumber: true,
            numberPrefix: 'BAT',
            printSize: 'thermal',
            searchFields: ['number', 'materialName', 'batchNumber', 'supplier'],
            primaryField: 'materialName',
            secondaryField: 'batchNumber',
            amountField: 'costBase',
            stats: [
                { icon: '📦', label: 'الكل', compute: (items) => items.length, bg: '#ecf0f1', color: '#2c3e50', filterId: 'all' },
                { 
                    icon: '⏰', label: 'قريبة انتهاء', 
                    compute: (items) => {
                        const now = new Date();
                        const soon = new Date(); soon.setDate(now.getDate() + 90);
                        return items.filter(x => x.expiryDate && new Date(x.expiryDate) >= now && new Date(x.expiryDate) <= soon).length;
                    }, 
                    bg: '#fff3cd', color: '#856404', filterId: 'soon'
                },
                { 
                    icon: '❌', label: 'منتهية', 
                    compute: (items) => {
                        const now = new Date();
                        return items.filter(x => x.expiryDate && new Date(x.expiryDate) < now).length;
                    }, 
                    bg: '#f8d7da', color: '#721c24', filterId: 'expired'
                },
                { 
                    icon: '💰', label: 'قيمة الدفعات',
                    compute: (items) => {
                        const total = items.reduce((s, x) => s + ((parseFloat(x.qty) || 0) * (parseFloat(x.costBase) || 0)), 0);
                        return typeof formatCurrency === 'function' ? formatCurrency(total) : total.toLocaleString('ar-SY');
                    },
                    bg: '#d1ecf1', color: '#0c5460'
                }
            ],
            
            quickFilters: [
                { id: 'all', label: 'الكل', compute: () => true },
                { 
                    id: 'soon', label: 'قريبة انتهاء',
                    compute: (item) => {
                        if (!item.expiryDate) return false;
                        const now = new Date();
                        const soon = new Date(); soon.setDate(now.getDate() + 90);
                        const end = new Date(item.expiryDate);
                        return end >= now && end <= soon;
                    }
                },
                { 
                    id: 'expired', label: 'منتهية',
                    compute: (item) => {
                        if (!item.expiryDate) return false;
                        return new Date(item.expiryDate) < new Date();
                    }
                }
            ],
            
            fields: [
                {
                    name: 'materialId',
                    label: 'الدواء',
                    type: 'select',
                    required: true,
                    icon: '💊',
                    options: [] // يُملأ ديناميكياً
                },
                { name: 'qty', label: 'الكمية', type: 'number', required: true, icon: '🔢', placeholder: '0', min: 1 },
                { name: 'costBase', label: 'تكلفة الوحدة', type: 'number', required: true, icon: '💰', placeholder: '0', min: 0 },
                { name: 'expiryDate', label: 'تاريخ انتهاء الصلاحية', type: 'date', required: true, icon: '⏰' },
                { name: 'batchNumber', label: 'رقم الدفعة', type: 'text', icon: '🏷️', placeholder: 'B-2026-001' },
                { name: 'supplier', label: 'المورد', type: 'text', icon: '🏪', placeholder: 'اختياري' },
                { name: 'notes', label: 'ملاحظات', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],
            
            onFormOpen: function(editData) {
                if (editData) return;
                // ملء قائمة الأدوية
                setTimeout(() => {
                    const sel = document.getElementById('af-materialId');
                    if (!sel || typeof materials === 'undefined') return;
                    
                    let html = '<option value="">— اختر دواء —</option>';
                    [...materials].sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(m => {
                        html += `<option value="${m.id}">${_afEsc(m.name)} ${m.unit ? '(' + _afEsc(m.unit) + ')' : ''}</option>`;
                    });
                    sel.innerHTML = html;
                    
                    // التاريخ افتراضي: بعد سنة
                    const exp = document.getElementById('af-expiryDate');
                    if (exp && !exp.value) {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        exp.value = d.toISOString().slice(0, 10);
                    }
                }, 200);
            },
            
            beforeSave: function(data, docId) {
                // تأكد من وجود materialId
                if (!data.materialId) {
                    alert('⚠️ يجب اختيار دواء');
                    return false;
                }
                
                const mid = parseInt(data.materialId);
                const mat = typeof materials !== 'undefined' ? materials.find(x => x.id === mid) : null;
                if (!mat) {
                    alert('⚠️ الدواء غير موجود');
                    return false;
                }
                
                data.materialId = mid;
                data.materialName = mat.name || '—';
                data.unit = mat.unit || '';
                data.totalValue = (parseFloat(data.qty) || 0) * (parseFloat(data.costBase) || 0);
                
                return data;
            },
            
            afterSave: async function(data, docId, wasEdit) {
                // ✏️ إضافة الدفعة للمخزون
                if (!wasEdit && data.materialId && data.qty > 0) {
                    try {
                        const whId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : '';
                        if (typeof adjustStock === 'function') {
                            adjustStock(data.materialId, data.qty, 'add', whId, {
                                reason: 'pharmacy_batch',
                                reasonLabel: 'دفعة: ' + (data.number || '')
                            });
                        }
                        
                        // تحديث costHistory
                        const mat = materials.find(m => m.id === data.materialId);
                        if (mat && data.costBase > 0) {
                            if (!Array.isArray(mat.costHistory)) mat.costHistory = [];
                            mat.costHistory.push({
                                date: data.date || new Date().toISOString().slice(0, 10),
                                cost: parseFloat(data.costBase) || 0,
                                avgCost: parseFloat(data.costBase) || 0,
                                qty: parseFloat(data.qty) || 0,
                                source: 'pharmacy',
                                batch: data.batchNumber || '',
                                expiryDate: data.expiryDate || '',
                                createdAt: new Date().toISOString()
                            });
                        }
                        
                        if (typeof saveAllData === 'function') await saveAllData();
                        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
                        
                        console.log('💊 [pharmacy] batch added to stock:', data.qty);
                    } catch(e) {
                        console.warn('[pharmacy] stock:', e.message);
                    }
                }
                
                // 🎯 مزامنة material.expiryDate مع أقرب دفعة
                if (data.materialId) {
                    await _pharmSyncMaterialExpiry(data.materialId);
                }
            },
            
            // 🎯 بعد الحذف — مزامنة
            afterDelete: async function(item, activityId, pageId) {
                if (item && item.materialId) {
                    console.log('🗑️ [pharmacy] batch deleted:', item.number);
                    await _pharmSyncMaterialExpiry(item.materialId);
                }
            },
            
            itemRenderer: function(item) {
                // حساب حالة الصلاحية
                let expiryStatus = 'good';
                let expiryLabel = '✅ سليم';
                let expiryColor = '#27ae60';
                
                if (item.expiryDate) {
                    const now = new Date();
                    const exp = new Date(item.expiryDate);
                    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
                    
                    if (daysLeft < 0) {
                        expiryStatus = 'expired';
                        expiryLabel = '❌ منتهي';
                        expiryColor = '#e74c3c';
                    } else if (daysLeft <= 30) {
                        expiryStatus = 'critical';
                        expiryLabel = '⚠️ ' + daysLeft + ' يوم';
                        expiryColor = '#e74c3c';
                    } else if (daysLeft <= 90) {
                        expiryStatus = 'warning';
                        expiryLabel = '⏰ ' + Math.ceil(daysLeft / 30) + ' شهر';
                        expiryColor = '#f39c12';
                    } else {
                        expiryLabel = '✅ ' + Math.ceil(daysLeft / 30) + ' شهر';
                    }
                }
                
                const dateStr = _afDate(item.createdAt);
                const value = (parseFloat(item.qty) || 0) * (parseFloat(item.costBase) || 0);
                
                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">💊 ${_afEsc(item.materialName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">
                                🔢 ${item.qty} ${_afEsc(item.unit || '')} • 💰 ${_afFmt(item.costBase || 0)}
                            </div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">
                                📄 ${_afEsc(item.number || '—')} • 🏷️ ${_afEsc(item.batchNumber || '—')}
                            </div>
                        </div>
                        <div style="text-align:left; min-width:100px;">
                            <div style="background:${expiryColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${expiryLabel}</div>
                            <div style="font-size:10px; color:#666; margin-top:6px; text-align:center;">${_afEsc(item.expiryDate || '—')}</div>
                        </div>
                    </div>
                    
                    ${item.supplier ? `<div style="font-size:11px; color:#666; margin-bottom:8px;">🏪 ${_afEsc(item.supplier)}</div>` : ''}
                    
                    <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:4px;">
                        <button onclick="activityViewItem('pharmacy', 'batches', '${item.id}')" style="padding:7px 4px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="عرض">👁️</button>
                        <button onclick="activityPrintItem('pharmacy', 'batches', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة">🖨️</button>
                        <button onclick="activityWhatsAppItem('pharmacy', 'batches', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب">💬</button>
                        <button onclick="activityOpenForm('pharmacy', 'batches', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="activityConfirmDelete('pharmacy', 'batches', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                </div>`;
            }
        },
        
        // ═══════════════════════════════════════════════════
        //  📝 الوصفات الطبية
        // ═══════════════════════════════════════════════════
        {
            id: 'prescriptions',
            icon: '📝',
            title: 'الوصفات الطبية',
            printTitle: 'وصفة طبية',
            description: 'تسجيل وصفات الأطباء + صرف الأدوية',
            addLabel: '➕ وصفة جديدة',
            searchPlaceholder: 'ابحث بالمريض / الطبيب / رقم الوصفة...',
            emptyIcon: '📝',
            autoNumber: true,
            numberPrefix: 'PRS',
            printSize: 'thermal',
            searchFields: ['number', 'patientName', 'patientPhone', 'doctorName', 'diagnosis'],
            primaryField: 'patientName',
            secondaryField: 'doctorName',
            amountField: 'total',
            stats: [
                { icon: '📝', label: 'الكل', compute: (items) => items.length, bg: '#ecf0f1', color: '#2c3e50', filterId: 'all' },
                { 
                    icon: '💰', label: 'قيمة الوصفات',
                    compute: (items) => {
                        const total = items.reduce((s, x) => s + (parseFloat(x.total) || 0), 0);
                        return typeof formatCurrency === 'function' ? formatCurrency(total) : total.toLocaleString('ar-SY');
                    },
                    bg: '#d4edda', color: '#155724'
                },
                { 
                    icon: '👨‍⚕️', label: 'عدد الأطباء',
                    compute: (items) => {
                        const docs = new Set();
                        items.forEach(x => { if (x.doctorName) docs.add(x.doctorName); });
                        return docs.size;
                    },
                    bg: '#d1ecf1', color: '#0c5460'
                },
                { 
                    icon: '📊', label: 'متوسط',
                    compute: (items) => {
                        if (items.length === 0) return '0';
                        const total = items.reduce((s, x) => s + (parseFloat(x.total) || 0), 0);
                        return typeof formatCurrency === 'function' ? formatCurrency(Math.round(total / items.length)) : Math.round(total / items.length);
                    },
                    bg: '#fff3cd', color: '#856404'
                }
            ],
            
            quickFilters: [
                { id: 'all', label: 'الكل', compute: () => true },
                { id: 'dispensed', label: 'مصروفة', compute: (item) => item.status === 'dispensed' },
                { id: 'new', label: 'جديدة', compute: (item) => item.status === 'new' || !item.status }
            ],
            
            fields: [
                { name: 'patientName', label: 'اسم المريض', type: 'text', required: true, icon: '👤', placeholder: 'الاسم الثلاثي' },
                { name: 'patientPhone', label: 'رقم الهاتف', type: 'tel', icon: '📞', placeholder: 'اختياري' },
                { name: 'patientAge', label: 'العمر', type: 'number', icon: '📅', placeholder: 'اختياري', min: 0, max: 120 },
                { name: 'doctorName', label: 'اسم الطبيب', type: 'text', required: true, icon: '👨‍⚕️', placeholder: 'د. ...' },
                { name: 'diagnosis', label: 'التشخيص', type: 'textarea', icon: '🩺', rows: 2, placeholder: 'اختياري' },
                { 
                    name: 'status', 
                    label: 'الحالة', 
                    type: 'select', 
                    icon: '📊',
                    default: 'new',
                    options: [
                        { value: 'new', label: '🆕 جديدة' },
                        { value: 'dispensed', label: '✅ تم الصرف' },
                        { value: 'cancelled', label: '❌ ملغاة' }
                    ]
                },
                { name: 'notes', label: 'ملاحظات', type: 'textarea', icon: '📝', rows: 2, placeholder: 'اختياري' }
            ],
            
            // 🎯 قسم الأدوية (مثل القطع في الاتصالات)
            formExtra: `
                <div style="border-top:2px dashed #ddd; margin-top:15px; padding-top:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <label style="font-size:13px; color:#555; font-weight:600;">
                            💊 الأدوية الموصوفة
                        </label>
                        <button type="button" onclick="_pharmAddMedicine()" 
                            style="padding:6px 12px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">
                            ➕ إضافة دواء
                        </button>
                    </div>
                    
                    <div id="pharmMedicinesList"></div>
                    
                    <div id="pharmTotal" style="display:none; background:#e8f5e9; padding:10px 14px; border-radius:8px; border-right:3px solid #27ae60; margin-top:10px; font-size:14px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>💰 إجمالي الوصفة:</span>
                            <span id="pharmTotalVal" style="font-weight:bold; color:#27ae60;">0</span>
                        </div>
                    </div>
                </div>
            `,
            
            onFormOpen: function(editData) {
                _pharmInit(editData);
                
                // ملء قائمة الأدوية (dynamic)
                setTimeout(() => {
                    if (typeof materials === 'undefined') return;
                    _pharmMaterialsCache = [...materials].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                }, 100);
            },
            
            beforeSave: function(data, docId) {
                const meds = window._pharmMedicinesState || [];
                if (meds.length === 0) {
                    alert('⚠️ أضف دواءً واحداً على الأقل');
                    return false;
                }
                
                data.medicines = meds.map(m => ({ ...m }));
                data.total = meds.reduce((s, m) => s + ((parseFloat(m.qty) || 0) * (parseFloat(m.unitPrice) || 0)), 0);
                
                // 🎯 احفظ الحالة السابقة لكشف الانتقال
                if (docId) {
                    const old = _activityCache.getAll('prescriptions').find(x => x.id === docId);
                    window._pharmOldStatus = old ? (old.status || 'new') : 'new';
                    window._pharmOldDocId = docId;
                } else {
                    window._pharmOldStatus = 'new';
                    window._pharmOldDocId = null;
                }
                
                return data;
            },
            
            afterSave: async function(data, docId, wasEdit) {
                const oldStatus = window._pharmOldStatus || 'new';
                const newStatus = data.status || 'new';
                
                console.log('💊 [pharmacy] status transition:', oldStatus, '→', newStatus);
                
                // 🎯 انتقال إلى "تم الصرف" (من أي حالة أخرى)
                const justDispensed = (newStatus === 'dispensed' && oldStatus !== 'dispensed');
                
                // 🎯 عكس الانتقال (من "تم الصرف" لحالة أخرى) → إرجاع
                const justUnDispensed = (oldStatus === 'dispensed' && newStatus !== 'dispensed');
                
                if (justDispensed) {
                    // ✅ خصم + فاتورة
                    await _pharmDispense(data, docId);
                } else if (justUnDispensed) {
                    // ↩️ إرجاع
                    await _pharmUnDispense(data, docId);
                }
                
                // 🧹 تنظيف
                window._pharmOldStatus = null;
                window._pharmOldDocId = null;
            },
            
            // 🖨️ طباعة مخصصة للوصفة (مع الجرعات)
            printRenderer: function(item, activity, pageConfig) {
                return _pharmPrintPrescription(item, pageConfig);
            },
            
            // 💬 واتساب مخصص (مع الجرعات)
            whatsappRenderer: function(item, activity, pageConfig) {
                return _pharmWhatsAppPrescription(item);
            },
            
            itemRenderer: function(item) {
                const dateStr = _afDate(item.createdAt);
                const medsCount = (item.medicines || []).length;
                
                const statusLabels = {
                    'new': '🆕 جديدة',
                    'dispensed': '✅ تم الصرف',
                    'cancelled': '❌ ملغاة'
                };
                const statusColors = {
                    'new': '#3498db',
                    'dispensed': '#27ae60',
                    'cancelled': '#e74c3c'
                };
                const sLabel = statusLabels[item.status] || '🆕 جديدة';
                const sColor = statusColors[item.status] || '#3498db';
                
                return `
                <div style="padding:14px; border-bottom:1px solid #f0f0f0; background:white;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:8px;">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">👤 ${_afEsc(item.patientName || '—')}</div>
                            <div style="font-size:12px; color:#666; margin-top:3px;">👨‍⚕️ ${_afEsc(item.doctorName || '—')}</div>
                            <div style="font-size:11px; color:#999; margin-top:4px;">
                                📄 ${_afEsc(item.number || '—')} • 💊 ${medsCount} دواء
                            </div>
                        </div>
                        <div style="text-align:left; min-width:100px;">
                            <div style="background:${sColor}; color:white; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:600; white-space:nowrap;">${sLabel}</div>
                            <div style="font-weight:bold; color:#27ae60; font-size:14px; margin-top:6px; text-align:center;">${_afFmt(item.total || 0)}</div>
                        </div>
                    </div>
                    
                    ${item.diagnosis ? `<div style="font-size:11px; color:#666; margin-bottom:6px;">🩺 ${_afEsc((item.diagnosis || '').substring(0, 60))}</div>` : ''}
                    
                    <!-- 💊 قائمة الأدوية + الجرعات -->
                    ${Array.isArray(item.medicines) && item.medicines.length > 0 ? `
                    <div style="background:#f8f9fa; padding:8px 10px; border-radius:8px; margin-bottom:8px; border-right:3px solid #3498db;">
                        ${item.medicines.slice(0, 3).map(med => {
                            const dosageTxt = typeof _pharmFormatDosage === 'function' ? _pharmFormatDosage(med) : '';
                            return `
                            <div style="padding:4px 0; border-bottom:1px dashed #e9ecef;">
                                <div style="font-size:11px; color:#2c3e50; display:flex; justify-content:space-between; font-weight:600;">
                                    <span>💊 ${_afEsc(med.materialName || '—')}</span>
                                    <span style="color:#e67e22;">× ${med.qty}</span>
                                </div>
                                ${dosageTxt ? `<div style="font-size:10px; color:#856404; margin-top:2px;">📋 ${_afEsc(dosageTxt)}</div>` : ''}
                            </div>`;
                        }).join('')}
                        ${item.medicines.length > 3 ? `
                            <div style="font-size:10px; color:#999; margin-top:4px; text-align:center; border-top:1px dashed #ddd; padding-top:4px;">
                                + ${item.medicines.length - 3} دواء آخر...
                            </div>
                        ` : ''}
                    </div>` : ''}
                    
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:4px;">
                        <button onclick="activityViewItem('pharmacy', 'prescriptions', '${item.id}')" style="padding:7px 4px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="عرض">👁️</button>
                        <button onclick="activityPrintItem('pharmacy', 'prescriptions', '${item.id}')" style="padding:7px 4px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="طباعة">🖨️</button>
                        <button onclick="activityWhatsAppItem('pharmacy', 'prescriptions', '${item.id}')" style="padding:7px 4px; background:#25D366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="واتساب">💬</button>
                        <button onclick="activitySMSReady('pharmacy', 'prescriptions', '${item.id}')" style="padding:7px 4px; background:#2980b9; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="SMS">📱</button>
                        <button onclick="activityOpenForm('pharmacy', 'prescriptions', '${item.id}')" style="padding:7px 4px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تعديل">✏️</button>
                        <button onclick="activityConfirmDelete('pharmacy', 'prescriptions', '${item.id}')" style="padding:7px 4px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="حذف">🗑️</button>
                    </div>
                </div>`;
            }
        },
        
        // ═══════════════════════════════════════════════════
        //  ⏰ تنبيهات الصلاحية (صفحة مخصصة)
        // ═══════════════════════════════════════════════════
        {
            id: 'expiry-alerts',
            icon: '⏰',
            title: 'تنبيهات الصلاحية',
            description: 'الأدوية المنتهية + قريبة الانتهاء',
            addLabel: '🔄 تحديث',
            emptyIcon: '⏰',
            searchFields: ['materialName'],
            unifiedSearch: false,
            fields: [],
            
            itemRenderer: function() { return ''; },
            
            pageRenderer: function(container, activity, pageConfig) {
                _renderPharmacyAlerts(container);
            }
        }
    ]
});

// ═══════════════════════════════════════════════════════════
//  💊 PRESCRIPTION MEDICINES — إدارة أدوية الوصفة
// ═══════════════════════════════════════════════════════════

window._pharmMedicinesState = [];
let _pharmMaterialsCache = [];

function _pharmInit(editData) {
    if (editData && Array.isArray(editData.medicines)) {
        window._pharmMedicinesState = editData.medicines.map(m => ({ ...m }));
    } else {
        window._pharmMedicinesState = [];
    }
    _pharmRender();
}

function _pharmAddMedicine() {
    window._pharmMedicinesState.push({ 
        materialId: '', 
        materialName: '', 
        qty: 1, 
        unitPrice: 0, 
        unit: '',
        // 💊 تعليمات الجرعة
        dosage: '',          // "3 مرات يومياً" أو "قرص كل 8 ساعات"
        timing: 'any',       // before / after / with / any
        duration: '',        // "7 أيام"
        dosageNotes: ''      // ملاحظات إضافية
    });
    _pharmRender();
}

function _pharmUpdateMedicine(idx, field, value) {
    if (!window._pharmMedicinesState[idx]) return;
    
    if (field === 'materialId') {
        const mid = parseInt(value);
        const mat = _pharmMaterialsCache.find(m => m.id === mid);
        if (mat) {
            window._pharmMedicinesState[idx].materialId = mid;
            window._pharmMedicinesState[idx].materialName = mat.name || '';
            window._pharmMedicinesState[idx].unit = mat.unit || '';
            const sale = parseFloat(mat.saleSYP) || 0;
            if (sale > 0) window._pharmMedicinesState[idx].unitPrice = sale;
        }
    } else if (field === 'qty' || field === 'unitPrice') {
        window._pharmMedicinesState[idx][field] = parseFloat(value) || 0;
    } else {
        window._pharmMedicinesState[idx][field] = value;
    }
    
    _pharmRender();
}

function _pharmRemoveMedicine(idx) {
    if (!confirm('🗑️ حذف هذا الدواء؟')) return;
    window._pharmMedicinesState.splice(idx, 1);
    _pharmRender();
}

function _pharmRender() {
    const listEl = document.getElementById('pharmMedicinesList');
    if (!listEl) return;
    
    const meds = window._pharmMedicinesState || [];
    
    if (meds.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding:15px; color:#999; font-size:12px; background:#f8f9fa; border-radius:8px;">لا توجد أدوية — اضغط "➕ إضافة دواء"</div>';
        _pharmUpdateTotal();
        return;
    }
    
    // خيارات التوقيت
    const timingOpts = [
        { v: 'any', l: 'أي وقت' },
        { v: 'before', l: 'قبل الأكل' },
        { v: 'after', l: 'بعد الأكل' },
        { v: 'with', l: 'مع الأكل' },
        { v: 'empty', l: 'على معدة فارغة' }
    ];
    
    let html = '';
    
    meds.forEach((m, idx) => {
        const total = (parseFloat(m.qty) || 0) * (parseFloat(m.unitPrice) || 0);
        
        // خيارات الأدوية
        let opts = '<option value="">— اختر —</option>';
        _pharmMaterialsCache.forEach(mat => {
            opts += `<option value="${mat.id}" ${m.materialId === mat.id ? 'selected' : ''}>${_afEsc(mat.name)}</option>`;
        });
        
        // رؤوس توقيت
        let timingHtml = '';
        timingOpts.forEach(t => {
            const sel = m.timing === t.v ? 'selected' : '';
            timingHtml += `<option value="${t.v}" ${sel}>${t.l}</option>`;
        });
        
        html += `
            <div style="background:#f8f9fa; border-radius:10px; padding:10px; margin-bottom:10px; border:1px solid #e9ecef;">
                
                <!-- 📋 رؤوس الأعمدة -->
                <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr 40px; gap:6px; margin-bottom:4px;">
                    <div style="font-size:10px; color:#666; font-weight:600;">💊 الدواء</div>
                    <div style="font-size:10px; color:#666; font-weight:600; text-align:center;">🔢 الكمية</div>
                    <div style="font-size:10px; color:#666; font-weight:600; text-align:center;">💰 السعر</div>
                    <div style="font-size:10px; color:#666; font-weight:600; text-align:center;">📊 الإجمالي</div>
                    <div></div>
                </div>
                
                <!-- السطر الأول: الدواء + الكمية + السعر + الإجمالي -->
                <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr 40px; gap:6px; align-items:center; margin-bottom:8px;">
                    <select onchange="_pharmUpdateMedicine(${idx}, 'materialId', this.value)"
                        style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; font-family:inherit; background:white;">
                        ${opts}
                    </select>
                    <input type="number" value="${m.qty || 1}" min="1"
                        onchange="_pharmUpdateMedicine(${idx}, 'qty', this.value)"
                        style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; text-align:center;">
                    <input type="number" value="${m.unitPrice || 0}" min="0"
                        onchange="_pharmUpdateMedicine(${idx}, 'unitPrice', this.value)"
                        style="padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px; text-align:center;">
                    <div style="text-align:center; font-size:12px; font-weight:bold; color:#27ae60; padding:8px;">
                        ${typeof formatCurrency === 'function' ? formatCurrency(total) : total.toLocaleString('ar-SY')}
                    </div>
                    <button type="button" onclick="_pharmRemoveMedicine(${idx})"
                        style="padding:8px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">🗑️</button>
                </div>
                
                <!-- 💊 السطر الثاني: تعليمات الجرعة -->
                <div style="border-top:1px dashed #ddd; padding-top:8px;">
                    <div style="font-size:10px; color:#666; font-weight:600; margin-bottom:4px;">💊 تعليمات الجرعة</div>
                    
                    <!-- رؤوس صغيرة -->
                    <div style="display:grid; grid-template-columns:2fr 1.5fr 1fr 2fr; gap:6px; margin-bottom:4px;">
                        <div style="font-size:9px; color:#999;">الجرعة</div>
                        <div style="font-size:9px; color:#999; text-align:center;">التوقيت</div>
                        <div style="font-size:9px; color:#999; text-align:center;">المدة</div>
                        <div style="font-size:9px; color:#999;">ملاحظة</div>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:2fr 1.5fr 1fr 2fr; gap:6px;">
                        <input type="text" value="${_afEsc(m.dosage || '')}" 
                            onchange="_pharmUpdateMedicine(${idx}, 'dosage', this.value)"
                            placeholder="مثال: 3 مرات يومياً"
                            style="padding:6px; border:1px solid #ddd; border-radius:6px; font-size:11px; font-family:inherit;">
                        <select onchange="_pharmUpdateMedicine(${idx}, 'timing', this.value)"
                            style="padding:6px; border:1px solid #ddd; border-radius:6px; font-size:11px; font-family:inherit; background:white;">
                            ${timingHtml}
                        </select>
                        <input type="text" value="${_afEsc(m.duration || '')}" 
                            onchange="_pharmUpdateMedicine(${idx}, 'duration', this.value)"
                            placeholder="7 أيام"
                            style="padding:6px; border:1px solid #ddd; border-radius:6px; font-size:11px; text-align:center; font-family:inherit;">
                        <input type="text" value="${_afEsc(m.dosageNotes || '')}" 
                            onchange="_pharmUpdateMedicine(${idx}, 'dosageNotes', this.value)"
                            placeholder="عند اللزوم"
                            style="padding:6px; border:1px solid #ddd; border-radius:6px; font-size:11px; font-family:inherit;">
                    </div>
                </div>
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    _pharmUpdateTotal();
}

function _pharmUpdateTotal() {
    const meds = window._pharmMedicinesState || [];
    const total = meds.reduce((s, m) => s + ((parseFloat(m.qty) || 0) * (parseFloat(m.unitPrice) || 0)), 0);
    
    const totalEl = document.getElementById('pharmTotal');
    const totalValEl = document.getElementById('pharmTotalVal');
    
    if (totalEl && totalValEl) {
        if (total > 0) {
            totalEl.style.display = 'block';
            totalValEl.textContent = (typeof formatCurrency === 'function') ? formatCurrency(total) : total.toLocaleString('ar-SY') + ' ل.س';
        } else {
            totalEl.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  ⏰ PHARMACY ALERTS — تنبيهات الصلاحية
// ═══════════════════════════════════════════════════════════

async function _renderPharmacyAlerts(container) {
    container.innerHTML = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">⏰ تنبيهات الصلاحية</h2>
        <p style="color:#666; font-size:13px; margin:0 0 15px 0;">متابعة الأدوية المنتهية وقريبة الانتهاء</p>
        
        <div id="pharmAlertsContent">
            <div style="text-align:center; padding:40px; color:#999;">⏳ جاري التحميل...</div>
        </div>
    `;
    
    await _pharmAlertsGenerate();
}

async function _pharmAlertsGenerate() {
    const container = document.getElementById('pharmAlertsContent');
    if (!container) return;
    
    const batches = await activityGetAll('pharmacy', 'batches', 1000);
    
    const now = new Date();
    const expired = [];
    const critical30 = [];
    const warning90 = [];
    const good = [];
    
    batches.forEach(b => {
        if (!b.expiryDate) return;
        const exp = new Date(b.expiryDate);
        const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        
        const item = { ...b, daysLeft };
        
        if (daysLeft < 0) expired.push(item);
        else if (daysLeft <= 30) critical30.push(item);
        else if (daysLeft <= 90) warning90.push(item);
        else good.push(item);
    });
    
    // ترتيب حسب قرب الانتهاء
    expired.sort((a, b) => a.daysLeft - b.daysLeft);
    critical30.sort((a, b) => a.daysLeft - b.daysLeft);
    warning90.sort((a, b) => a.daysLeft - b.daysLeft);
    
    const totalValueExpired = expired.reduce((s, x) => s + ((parseFloat(x.qty) || 0) * (parseFloat(x.costBase) || 0)), 0);
    
    const _fmt = (n) => typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n).toLocaleString('ar-SY') + ' ل.س';
    
    let html = `
        <!-- بطاقات إحصائية -->
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg, #e74c3c, #c0392b); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">❌ منتهية</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${expired.length}</div>
                ${totalValueExpired > 0 ? `<div style="font-size:10px; opacity:0.8; margin-top:2px;">خسارة: ${_fmt(totalValueExpired)}</div>` : ''}
            </div>
            <div style="background:linear-gradient(135deg, #f39c12, #e67e22); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">⚠️ تنتهي خلال 30 يوم</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${critical30.length}</div>
            </div>
            <div style="background:linear-gradient(135deg, #f1c40f, #f39c12); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">⏰ تنتهي خلال 90 يوم</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${warning90.length}</div>
            </div>
            <div style="background:linear-gradient(135deg, #27ae60, #229954); color:white; padding:14px; border-radius:12px;">
                <div style="font-size:11px; opacity:0.9;">✅ سليمة</div>
                <div style="font-size:24px; font-weight:bold; margin-top:4px;">${good.length}</div>
            </div>
        </div>
    `;
    
    // قسم المنتهية
    if (expired.length > 0) {
        html += `
            <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; border-right:3px solid #e74c3c; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 10px 0; font-size:14px; color:#c0392b;">❌ منتهية (${expired.length})</h3>
                ${expired.map(b => _pharmAlertRow(b, '#e74c3c')).join('')}
            </div>
        `;
    }
    
    // قسم حرج
    if (critical30.length > 0) {
        html += `
            <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; border-right:3px solid #f39c12; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 10px 0; font-size:14px; color:#e67e22;">⚠️ تنتهي خلال 30 يوم (${critical30.length})</h3>
                ${critical30.map(b => _pharmAlertRow(b, '#f39c12')).join('')}
            </div>
        `;
    }
    
    // قسم تحذيري
    if (warning90.length > 0) {
        html += `
            <div style="background:white; padding:14px; border-radius:12px; margin-bottom:12px; border-right:3px solid #f1c40f; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 10px 0; font-size:14px; color:#b7950b;">⏰ تنتهي خلال 90 يوم (${warning90.length})</h3>
                ${warning90.map(b => _pharmAlertRow(b, '#f1c40f')).join('')}
            </div>
        `;
    }
    
    if (expired.length === 0 && critical30.length === 0 && warning90.length === 0) {
        html += `
            <div style="background:#e8f5e9; padding:30px; border-radius:12px; text-align:center;">
                <div style="font-size:48px; margin-bottom:10px;">✅</div>
                <div style="color:#27ae60; font-weight:600;">جميع الأدوية بحالة جيدة</div>
            </div>
        `;
    }
    
    // زر التصدير
    html += `
        <button onclick="_pharmAlertsExport(${JSON.stringify({expired: expired.length, critical30: critical30.length, warning90: warning90.length, good: good.length}).replace(/"/g, '&quot;')})" 
            style="width:100%; margin-top:15px; padding:14px; background:linear-gradient(135deg, #34495e, #2c3e50); color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:bold;">
            📤 تصدير تنبيهات الصلاحية
        </button>
    `;
    
    container.innerHTML = html;
    window._pharmAlertsData = { expired, critical30, warning90, good };
}

function _pharmAlertRow(b, color) {
    const _fmt = (n) => typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n).toLocaleString('ar-SY') + ' ل.س';
    const val = (parseFloat(b.qty) || 0) * (parseFloat(b.costBase) || 0);
    
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed #eee; font-size:12px;">
            <div style="flex:1; min-width:0;">
                <div style="font-weight:bold; color:#2c3e50;">${_afEsc(b.materialName)}</div>
                <div style="font-size:11px; color:#666; margin-top:2px;">
                    📄 ${_afEsc(b.number || '—')} • 🔢 ${b.qty} ${_afEsc(b.unit || '')}
                </div>
                <div style="font-size:10px; color:#999; margin-top:2px;">
                    🏷️ ${_afEsc(b.batchNumber || '—')} • 📅 ${b.expiryDate}
                </div>
            </div>
            <div style="text-align:left; min-width:100px;">
                <div style="background:${color}; color:white; padding:3px 8px; border-radius:10px; font-size:10px; text-align:center; margin-bottom:4px;">
                    ${b.daysLeft < 0 ? 'منتهي منذ ' + Math.abs(b.daysLeft) + ' يوم' : b.daysLeft + ' يوم'}
                </div>
                <div style="font-weight:bold; color:#c0392b; font-size:11px; text-align:center;">${_fmt(val)}</div>
            </div>
        </div>
    `;
}

async function _pharmAlertsExport(stats) {
    const data = window._pharmAlertsData;
    if (!data) return;
    
    const headers = ['الحالة', 'المادة', 'رقم الدفعة', 'الكمية', 'الوحدة', 'تاريخ الانتهاء', 'الأيام المتبقية', 'القيمة'];
    const rows = [];
    
    data.expired.forEach(b => {
        rows.push(['منتهية', b.materialName, b.batchNumber || '', b.qty, b.unit || '', b.expiryDate, b.daysLeft, (parseFloat(b.qty) || 0) * (parseFloat(b.costBase) || 0)]);
    });
    data.critical30.forEach(b => {
        rows.push(['تنتهي قريباً', b.materialName, b.batchNumber || '', b.qty, b.unit || '', b.expiryDate, b.daysLeft, (parseFloat(b.qty) || 0) * (parseFloat(b.costBase) || 0)]);
    });
    data.warning90.forEach(b => {
        rows.push(['تحذير', b.materialName, b.batchNumber || '', b.qty, b.unit || '', b.expiryDate, b.daysLeft, (parseFloat(b.qty) || 0) * (parseFloat(b.costBase) || 0)]);
    });
    
    if (typeof openExportMenu === 'function') {
        openExportMenu({
            title: 'تنبيهات الصلاحية',
            columns: headers,
            rows: rows,
            filename: 'تنبيهات_الصلاحية'
        });
    }
}

// تصدير
window._pharmAddMedicine = _pharmAddMedicine;
window._pharmUpdateMedicine = _pharmUpdateMedicine;
window._pharmRemoveMedicine = _pharmRemoveMedicine;
window._renderPharmacyAlerts = _renderPharmacyAlerts;
window._pharmAlertsExport = _pharmAlertsExport;

console.log('💊 [pharmacy] activity registered | 3 pages');


// ═══════════════════════════════════════════════════════════
//  📅 SYNC — مزامنة material.expiryDate مع الدفعات
// ═══════════════════════════════════════════════════════════

async function _pharmSyncMaterialExpiry(materialId) {
    if (!materialId || typeof materials === 'undefined' || !Array.isArray(materials)) return;
    
    const matId = parseInt(materialId);
    const material = materials.find(m => m.id === matId);
    if (!material) {
        console.warn('[pharmacy] sync: المادة غير موجودة:', materialId);
        return;
    }
    
    try {
        // جلب كل الدفعات
        const allBatches = await activityGetAll('pharmacy', 'batches', 1000);
        
        // الدفعات النشطة لهذه المادة (لها كمية + تاريخ صلاحية)
        const activeBatches = allBatches.filter(b => 
            parseInt(b.materialId) === matId && 
            (parseFloat(b.qty) || 0) > 0 &&
            b.expiryDate
        );
        
        const oldExpiry = material.expiryDate || '';
        
        if (activeBatches.length === 0) {
            material.expiryDate = '';
        } else {
            // أقرب تاريخ انتهاء (FEFO)
            activeBatches.sort((a, b) => 
                String(a.expiryDate).localeCompare(String(b.expiryDate))
            );
            material.expiryDate = activeBatches[0].expiryDate || '';
        }
        
        // إضافة batchNumber أيضاً (الأقرب)
        if (activeBatches.length > 0) {
            material.batchNumber = activeBatches[0].batchNumber || '';
        } else {
            material.batchNumber = '';
        }
        
        if (oldExpiry !== material.expiryDate) {
            console.log('📅 [pharmacy] sync:', material.name, '→', material.expiryDate || '—');
            
            if (typeof saveAllData === 'function') await saveAllData();
            if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
            
            // إعادة فحص البانر
            if (typeof checkExpiryBanner === 'function') {
                setTimeout(checkExpiryBanner, 500);
            }
        }
    } catch(e) {
        console.warn('[pharmacy] sync:', e.message);
    }
}

window._pharmSyncMaterialExpiry = _pharmSyncMaterialExpiry;


// ═══════════════════════════════════════════════════════════
//  ✅ DISPENSE — صرف الوصفة (خصم + فاتورة)
// ═══════════════════════════════════════════════════════════
async function _pharmDispense(data, docId) {
    try {
        const uid = auth.currentUser.uid;
        const whId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : '';
        
        // ═══ 1) خصم من المخزون ═══
        for (const med of (data.medicines || [])) {
            if (typeof adjustStock === 'function' && med.materialId && med.qty > 0) {
                try {
                    adjustStock(parseInt(med.materialId), parseFloat(med.qty), 'subtract', whId, {
                        reason: 'prescription',
                        reasonLabel: 'وصفة: ' + (data.number || ''),
                        relatedId: docId
                    });
                    console.log('📦 [pharmacy] خُصم:', med.materialName, med.qty);
                } catch(e) {
                    console.warn('[pharmacy] stock deduct:', e.message);
                }
            }
        }
        
        // ═══ 2) إضافة للمبيعات (مع منع التكرار) ═══
        if (typeof sales !== 'undefined' && Array.isArray(sales)) {
            const invoiceNum = 'PRS-' + (data.number || docId.substring(0, 8));
            
            // 🚫 منع التكرار
            const exists = sales.find(s => s.invoice === invoiceNum);
            if (exists) {
                console.log('⏭️ [pharmacy] فاتورة موجودة مسبقاً:', invoiceNum);
            } else {
                sales.push({
                    invoice: invoiceNum,
                    date: new Date().toISOString().slice(0, 10),
                    customer: data.patientName || 'مريض',
                    items: (data.medicines || []).map(m => ({
                        materialId: parseInt(m.materialId) || 0,
                        materialName: m.materialName || '—',
                        qty: parseFloat(m.qty) || 0,
                        unit: m.unit || '',
                        unitPrice: parseFloat(m.unitPrice) || 0,
                        costAtSale: (() => {
                            const mat = materials.find(x => x.id === parseInt(m.materialId));
                            return mat ? (parseFloat(mat.costSYP) || 0) : 0;
                        })(),
                        total: (parseFloat(m.qty) || 0) * (parseFloat(m.unitPrice) || 0)
                    })),
                    total: parseFloat(data.total) || 0,
                    paid: parseFloat(data.total) || 0,
                    remaining: 0,
                    isPrescription: true,
                    source: 'pharmacy',
                    sourceId: docId,
                    doctorName: data.doctorName || '',
                    patientName: data.patientName || ''
                });
                
                console.log('💰 [pharmacy] فاتورة أُضيفت للمبيعات:', invoiceNum, '=', data.total);
            }
        }
        
        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
        
        if (typeof showToast === 'function') {
            showToast('✅ تم الصرف + تسجيل في المبيعات', 'success');
        }
        
        console.log('✅ [pharmacy] dispensed:', data.number, '|', data.total, 'ل.س');
    } catch(e) {
        console.error('[pharmacy] dispense error:', e);
    }
}

// ═══════════════════════════════════════════════════════════
//  ↩️ UN-DISPENSE — عكس الصرف (إرجاع للمخزون + حذف الفاتورة)
// ═══════════════════════════════════════════════════════════
async function _pharmUnDispense(data, docId) {
    try {
        const whId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : '';
        
        // ═══ 1) إرجاع للمخزون ═══
        for (const med of (data.medicines || [])) {
            if (typeof adjustStock === 'function' && med.materialId && med.qty > 0) {
                try {
                    adjustStock(parseInt(med.materialId), parseFloat(med.qty), 'add', whId, {
                        reason: 'prescription_reversed',
                        reasonLabel: 'إلغاء صرف: ' + (data.number || ''),
                        relatedId: docId
                    });
                } catch(e) {
                    console.warn('[pharmacy] stock return:', e.message);
                }
            }
        }
        
        // ═══ 2) حذف الفاتورة من المبيعات ═══
        if (typeof sales !== 'undefined' && Array.isArray(sales)) {
            const invoiceNum = 'PRS-' + (data.number || docId.substring(0, 8));
            const idx = sales.findIndex(s => s.invoice === invoiceNum);
            if (idx !== -1) {
                sales.splice(idx, 1);
                console.log('🗑️ [pharmacy] حُذفت الفاتورة:', invoiceNum);
            }
        }
        
        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
        
        if (typeof showToast === 'function') {
            showToast('↩️ تم إلغاء الصرف', 'info');
        }
    } catch(e) {
        console.error('[pharmacy] un-dispense error:', e);
    }
}

window._pharmDispense = _pharmDispense;
window._pharmUnDispense = _pharmUnDispense;


// ═══════════════════════════════════════════════════════════
//  💊 DOSAGE HELPER — صياغة الجرعة العربية
// ═══════════════════════════════════════════════════════════

function _pharmFormatDosage(med) {
    const timingLabels = {
        'any': 'أي وقت',
        'before': 'قبل الأكل',
        'after': 'بعد الأكل',
        'with': 'مع الأكل',
        'empty': 'على معدة فارغة'
    };
    
    const parts = [];
    
    if (med.dosage) parts.push(med.dosage);
    if (med.timing && med.timing !== 'any') parts.push(timingLabels[med.timing] || '');
    if (med.duration) parts.push('لمدة ' + med.duration);
    if (med.dosageNotes) parts.push('(' + med.dosageNotes + ')');
    
    return parts.filter(p => p).join(' • ');
}

window._pharmFormatDosage = _pharmFormatDosage;


// ═══════════════════════════════════════════════════════════
//  🖨️ PRINT PRESCRIPTION — طباعة وصفة كاملة
// ═══════════════════════════════════════════════════════════
function _pharmPrintPrescription(item, pageConfig) {
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const sett = (typeof settings !== 'undefined' && settings) ? settings : {};
    
    const bizName = _afSafeStr(biz.businessName) || 'المدير AI';
    const bizDesc = _afSafeStr(biz.businessDescription) || '';
    const bizLoc = _afFormatLocation(biz.location);
    const bizPhone = _afSafeStr(biz.phone) || '';
    const signature = _afSafeStr(sett.ownerSignature) || _afSafeStr(biz.ownerSignature);
    
    // ═══ رأس ═══
    let html = `
        <div class="header">
            <h1>${_afEsc(bizName)}</h1>
            ${bizDesc ? `<div class="sub">${_afEsc(bizDesc)}</div>` : ''}
            ${bizLoc ? `<div class="sub">📍 ${_afEsc(bizLoc)}</div>` : ''}
            ${bizPhone ? `<div class="sub">📞 ${_afEsc(bizPhone)}</div>` : ''}
            <div style="margin-top:8px; font-size:15px; font-weight:bold; background:#e8f5e9; padding:4px 12px; border-radius:8px; display:inline-block;">💊 وصفة طبية</div>
        </div>
    `;
    
    // ═══ رقم + تاريخ ═══
    html += `
        <div class="row">
            <span class="label">📄 رقم الوصفة:</span>
            <span class="value">${_afEsc(item.number || '-')}</span>
        </div>
        <div class="row">
            <span class="label">📅 التاريخ:</span>
            <span class="value">${_afDate(item.createdAt)}</span>
        </div>
    `;
    
    // ═══ المريض ═══
    html += `
        <div style="margin-top:10px; padding:8px; background:#f8f9fa; border-radius:6px;">
            <div style="font-size:11px; color:#666; font-weight:bold; margin-bottom:4px;">👤 معلومات المريض</div>
            <div class="row" style="border:none; padding:3px 0;">
                <span class="label">الاسم:</span>
                <span class="value">${_afEsc(item.patientName || '—')}</span>
            </div>
            ${item.patientPhone ? `
            <div class="row" style="border:none; padding:3px 0;">
                <span class="label">الهاتف:</span>
                <span class="value" style="font-family:monospace;">${_afEsc(item.patientPhone)}</span>
            </div>` : ''}
            ${item.patientAge ? `
            <div class="row" style="border:none; padding:3px 0;">
                <span class="label">العمر:</span>
                <span class="value">${_afEsc(item.patientAge)} سنة</span>
            </div>` : ''}
            <div class="row" style="border:none; padding:3px 0;">
                <span class="label">الطبيب:</span>
                <span class="value">👨‍⚕️ ${_afEsc(item.doctorName || '—')}</span>
            </div>
            ${item.diagnosis ? `
            <div class="row" style="border:none; padding:3px 0;">
                <span class="label">التشخيص:</span>
                <span class="value">🩺 ${_afEsc(item.diagnosis)}</span>
            </div>` : ''}
        </div>
    `;
    
    // ═══ جدول الأدوية ═══
    const meds = Array.isArray(item.medicines) ? item.medicines : [];
    html += `
        <div style="margin-top:12px;">
            <div style="background:#27ae60; color:white; padding:6px 10px; border-radius:6px; font-weight:bold; font-size:12px; margin-bottom:6px;">
                💊 الأدوية الموصوفة (${meds.length})
            </div>
    `;
    
    if (meds.length === 0) {
        html += '<div style="text-align:center; padding:15px; color:#999;">لا توجد أدوية</div>';
    } else {
        html += `
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
                <tr style="background:#34495e; color:white;">
                    <th style="padding:5px; text-align:right;">الدواء</th>
                    <th style="padding:5px; text-align:center;">الكمية</th>
                    <th style="padding:5px; text-align:center;">السعر</th>
                    <th style="padding:5px; text-align:center;">الإجمالي</th>
                </tr>
        `;
        meds.forEach((m, i) => {
            const total = (parseFloat(m.qty) || 0) * (parseFloat(m.unitPrice) || 0);
            const dosageTxt = _pharmFormatDosage(m);
            
            html += `
                <tr style="background:${i % 2 === 0 ? 'white' : '#f8f9fa'}; border-bottom:1px solid #eee;">
                    <td style="padding:6px; text-align:right;">
                        <div style="font-weight:bold; color:#2c3e50;">💊 ${_afEsc(m.materialName || '—')}</div>
                        ${dosageTxt ? `<div style="font-size:10px; color:#856404; margin-top:2px; padding:2px 4px; background:#fff3cd; border-radius:3px; display:inline-block;">📋 ${_afEsc(dosageTxt)}</div>` : ''}
                    </td>
                    <td style="padding:6px; text-align:center;">${m.qty} ${_afEsc(m.unit || '')}</td>
                    <td style="padding:6px; text-align:center;">${_afFmt(m.unitPrice || 0)}</td>
                    <td style="padding:6px; text-align:center; font-weight:bold; color:#27ae60;">${_afFmt(total)}</td>
                </tr>
            `;
        });
        html += `</table>`;
        
        // ═══ المجموع ═══
        html += `
            <div style="margin-top:10px; padding:10px; background:#e8f5e9; border-radius:8px; border:2px solid #27ae60;">
                <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:bold; color:#27ae60;">
                    <span>💰 الإجمالي:</span>
                    <span>${_afFmt(item.total || 0)}</span>
                </div>
            </div>
        `;
    }
    
    // ═══ توقيعات ═══
    html += `
        <div style="margin-top:20px; display:flex; justify-content:space-between; font-size:11px;">
            <div>
                <div style="color:#666;">توقيع الطبيب:</div>
                <div style="margin-top:20px; border-top:1px dashed #999; width:120px;"></div>
            </div>
            <div>
                <div style="color:#666;">${signature ? '✍️ ' + _afEsc(signature) : 'توقيع الصيدلي:'}</div>
                <div style="margin-top:20px; border-top:1px dashed #999; width:120px;"></div>
            </div>
        </div>
    `;
    
    // ═══ Footer ═══
    html += `
        <div class="footer">
            ${_afEsc(bizName)} — تم إنشاؤها بواسطة المدير AI<br>
            ${new Date().toLocaleString('ar-SY')}
        </div>
    `;
    
    return html;
}

// ═══════════════════════════════════════════════════════════
//  💬 WHATSAPP PRESCRIPTION — رسالة الوصفة
// ═══════════════════════════════════════════════════════════
function _pharmWhatsAppPrescription(item) {
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = _afSafeStr(biz.businessName) || 'المدير AI';
    
    const meds = Array.isArray(item.medicines) ? item.medicines : [];
    
    let lines = [];
    lines.push(`*${bizName}*`);
    lines.push(`_وصفة طبية_`);
    lines.push('');
    lines.push(`📄 رقم: *${item.number || '-'}*`);
    lines.push(`📅 التاريخ: ${_afDate(item.createdAt)}`);
    lines.push('');
    lines.push(`👤 المريض: ${item.patientName || '—'}`);
    lines.push(`👨‍⚕️ الطبيب: ${item.doctorName || '—'}`);
    if (item.diagnosis) {
        lines.push(`🩺 التشخيص: ${item.diagnosis}`);
    }
    lines.push('');
    lines.push(`💊 *الأدوية (${meds.length}):*`);
    lines.push('━━━━━━━━━━━━━━━━━━');
    
    meds.forEach((m, i) => {
        lines.push(`*${i + 1}. ${m.materialName || '—'}*`);
        lines.push(`   🔢 الكمية: ${m.qty} ${m.unit || ''}`);
        
        const dosageTxt = _pharmFormatDosage(m);
        if (dosageTxt) {
            lines.push(`   📋 ${dosageTxt}`);
        }
        lines.push('');
    });
    
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`💰 *الإجمالي: ${_afFmt(item.total || 0)}*`);
    lines.push('');
    lines.push('💊 اتبع التعليمات بدقة');
    lines.push('🌟 شفاءً عاجلاً');
    
    return lines.join('\n');
}

window._pharmPrintPrescription = _pharmPrintPrescription;
window._pharmWhatsAppPrescription = _pharmWhatsAppPrescription;
