// ============================================================
//  📤 ACTIVITY ACTIONS — طباعة + PNG + واتساب + تصدير
//  v2.0.0 — نسخة موحّدة نظيفة
// ============================================================

// ═══════════════════════════════════════════════════════════
//  🎯 HELPERS — معرفة في البداية (مهم!)
// ═══════════════════════════════════════════════════════════

function _afLabelValue(field, value) {
    try {
        if (value === null || value === undefined || value === '') return '';
        if (field && field.type === 'select' && Array.isArray(field.options)) {
            const opt = field.options.find(o => o.value === value);
            if (opt) return opt.label;
        }
        if (field && field.type === 'checkbox') return value ? '✅ نعم' : '❌ لا';
        return value;
    } catch(e) { return value; }
}

function _afFormatLocation(loc) {
    try {
        if (!loc) return '';
        if (typeof loc === 'string') return loc;
        if (typeof loc === 'object') {
            const parts = [];
            if (loc.governorate) parts.push(loc.governorate);
            if (loc.town) parts.push(loc.town);
            if (loc.district) parts.push(loc.district);
            return parts.join(' - ');
        }
        return '';
    } catch(e) { return ''; }
}

function _afSafeStr(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return '';
}

function _afEsc(s) {
    if (s === null || s === undefined) return '';
    if (typeof s === 'object') {
        if (s.toDate) {
            try { return s.toDate().toLocaleDateString('ar-SY'); }
            catch(e) { return '—'; }
        }
        return '';
    }
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _afDate(ts) {
    if (!ts) return '—';
    try {
        let d;
        if (ts.toDate) d = ts.toDate();
        else if (ts.seconds) d = new Date(ts.seconds * 1000);
        else if (ts instanceof Date) d = ts;
        else d = new Date(ts);
        
        if (isNaN(d.getTime())) return '—';
        if (typeof formatDate === 'function') return formatDate(d);
        return d.toLocaleDateString('ar-SY');
    } catch(e) { return '—'; }
}

function _afFmt(n) {
    return typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n).toLocaleString('ar-SY') + ' ل.س';
}

// ═══════════════════════════════════════════════════════════
//  1. PRINT — طباعة
// ═══════════════════════════════════════════════════════════

function activityPrintItem(activityId, pageId, docId) {
    try {
        const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
        if (!entry) { alert('⚠️ القسم غير موجود'); return; }
        
        const item = _activityCache.getAll(pageId).find(x => x.id === docId);
        if (!item) { alert('⚠️ الوثيقة غير موجودة'); return; }
        
        const { activity, pageConfig } = entry;
        
        // مخصص؟
        let html;
        if (typeof pageConfig.printRenderer === 'function') {
            html = pageConfig.printRenderer(item, activity, pageConfig);
        } else {
            html = _activityDefaultPrintHTML(item, activity, pageConfig);
        }
        
        _activityDoPrint(html, pageConfig);
    } catch(e) {
        console.error('[print] error:', e);
        alert('❌ فشل الطباعة: ' + e.message);
    }
}

function _activityDoPrint(contentHTML, pageConfig) {
    try {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('⚠️ اسمح بالنوافذ المنبثقة');
            return;
        }
        
        const isThermal = pageConfig && pageConfig.printSize === 'thermal';
        const pageSize = isThermal ? '@page { size: 80mm auto; margin: 2mm; }' : '@page { size: A4; margin: 15mm; }';
        const bodyWidth = isThermal ? '76mm' : '100%';
        const fontSize = isThermal ? '11px' : '13px';
        
        const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>طباعة</title>
<style>
* { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; box-sizing: border-box; }
${pageSize}
body { width: ${bodyWidth}; margin: 0 auto; padding: 8px; color: #000; font-size: ${fontSize}; }
.header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 8px; margin-bottom: 10px; }
.header h1 { font-size: 18px; margin: 0 0 4px 0; }
.header .sub { font-size: 11px; color: #555; }
.row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ccc; }
.row .label { color: #333; font-weight: 600; }
.row .value { font-weight: bold; text-align: left; }
.footer { margin-top: 15px; text-align: center; font-size: 10px; color: #777; border-top: 1px dashed #999; padding-top: 8px; }
.signatures { margin-top: 20px; display: flex; justify-content: space-between; font-size: 11px; }
@media print { body { padding: 0; } }
</style>
</head>
<body>
${contentHTML}
</body>
</html>`;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        
        setTimeout(() => {
            try { printWindow.focus(); printWindow.print(); }
            catch(e) { console.warn('[print] focus:', e); }
        }, 600);
        
        console.log('🖨️ [print] opened:', isThermal ? 'thermal' : 'A4');
    } catch(e) {
        console.error('[print] error:', e);
        alert('❌ فشل الطباعة: ' + e.message);
    }
}

function _activityDefaultPrintHTML(item, activity, pageConfig) {
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const sett = (typeof settings !== 'undefined' && settings) ? settings : {};
    
    const bizName = _afSafeStr(biz.businessName) || _afSafeStr(sett.businessName) || 'المدير AI';
    const bizDesc = _afSafeStr(biz.businessDescription) || _afSafeStr(sett.businessDescription);
    const bizLocation = _afFormatLocation(biz.location) || _afFormatLocation(sett.location);
    const signature = _afSafeStr(sett.ownerSignature) || _afSafeStr(biz.ownerSignature);
    
    let html = `
        <div class="header">
            <h1>${_afEsc(bizName)}</h1>
            ${bizDesc ? `<div class="sub">${_afEsc(bizDesc)}</div>` : ''}
            ${bizLocation ? `<div class="sub">📍 ${_afEsc(bizLocation)}</div>` : ''}
            <div style="margin-top:6px; font-size:14px; font-weight:bold;">${_afEsc(pageConfig.printTitle || pageConfig.title)}</div>
        </div>
    `;
    
    html += `
        <div class="row">
            <span class="label">📄 رقم الوثيقة:</span>
            <span class="value">${_afEsc(item.number || '-')}</span>
        </div>
        <div class="row">
            <span class="label">📅 التاريخ:</span>
            <span class="value">${_afDate(item.createdAt)}</span>
        </div>
    `;
    
    if (Array.isArray(pageConfig.fields)) {
        pageConfig.fields.forEach(field => {
            const rawVal = item[field.name];
            if (rawVal === '' || rawVal === null || rawVal === undefined) return;
            
            let displayVal = _afLabelValue(field, rawVal);
            
            // للحقول النقدية
            if (field.type === 'number' && (field.name.toLowerCase().includes('cost') || field.name.toLowerCase().includes('amount'))) {
                displayVal = _afFmt(rawVal);
            }
            
            html += `
                <div class="row">
                    <span class="label">${field.icon || ''} ${_afEsc(field.label)}:</span>
                    <span class="value">${_afEsc(displayVal)}</span>
                </div>
            `;
        });
    }
    
    html += `
        <div class="signatures">
            <div>توقيع المستلم: ....................</div>
            <div>${signature ? '✍️ ' + _afEsc(signature) : 'توقيع المركز: ....................'}</div>
        </div>
    `;
    
    html += `
        <div class="footer">
            تم إنشاء الوثيقة بواسطة المدير AI<br>
            ${new Date().toLocaleString('ar-SY')}
        </div>
    `;
    
    return html;
}

// ═══════════════════════════════════════════════════════════
//  2. PNG EXPORT
// ═══════════════════════════════════════════════════════════

async function activityPNGItem(activityId, pageId, docId) {
    if (typeof html2canvas !== 'function') {
        alert('⚠️ html2canvas غير محمّل');
        return;
    }
    
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const item = _activityCache.getAll(pageId).find(x => x.id === docId);
    if (!item) return;
    
    const temp = document.createElement('div');
    temp.style.cssText = 'position:fixed; top:-9999px; left:0; width:420px; padding:20px; background:white; font-family: "Segoe UI", Tahoma, Arial, sans-serif; direction:rtl;';
    temp.innerHTML = _activityDefaultPrintHTML(item, entry.activity, entry.pageConfig);
    document.body.appendChild(temp);
    
    try {
        if (typeof showToast === 'function') showToast('📸 جاري التصدير...', 'info');
        
        const canvas = await html2canvas(temp, { backgroundColor: '#ffffff', scale: 2, logging: false });
        
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${item.number || 'doc'}_${Date.now()}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            if (typeof showToast === 'function') showToast('✅ تم التصدير', 'success');
        });
    } catch(e) {
        console.error('[activity] PNG:', e);
        alert('❌ فشل التصدير');
    } finally {
        temp.remove();
    }
}

// ═══════════════════════════════════════════════════════════
//  3. WHATSAPP
// ═══════════════════════════════════════════════════════════

function activityWhatsAppItem(activityId, pageId, docId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const item = _activityCache.getAll(pageId).find(x => x.id === docId);
    if (!item) return;
    
    const { activity, pageConfig } = entry;
    
    let text;
    if (typeof pageConfig.whatsappRenderer === 'function') {
        text = pageConfig.whatsappRenderer(item, activity, pageConfig);
    } else {
        text = _activityDefaultWhatsAppText(item, activity, pageConfig);
    }
    
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
}

function _activityDefaultWhatsAppText(item, activity, pageConfig) {
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = _afSafeStr(biz.businessName) || 'المدير AI';
    
    let lines = [];
    lines.push(`*${bizName}*`);
    lines.push(`_${pageConfig.title}_`);
    lines.push('');
    lines.push(`📄 رقم: *${item.number || '-'}*`);
    lines.push(`📅 التاريخ: ${_afDate(item.createdAt)}`);
    lines.push('');
    
    if (Array.isArray(pageConfig.fields)) {
        pageConfig.fields.forEach(field => {
            const rawVal = item[field.name];
            if (!rawVal && rawVal !== 0) return;
            const val = _afLabelValue(field, rawVal);
            lines.push(`${field.icon || ''} ${field.label}: ${val}`);
        });
    }
    
    lines.push('');
    lines.push('شكراً لتعاملكم معنا 🌟');
    
    return lines.join('\n');
}


// ═══════════════════════════════════════════════════════════
//  📤 WHATSAPP READY — "جهازك جاهز"
// ═══════════════════════════════════════════════════════════
function activityWhatsAppReady(activityId, pageId, docId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const item = _activityCache.getAll(pageId).find(x => x.id === docId);
    if (!item) return;
    
    const { activity, pageConfig } = entry;
    
    // قالب مخصص؟
    let text;
    if (typeof pageConfig.whatsappReadyRenderer === 'function') {
        text = pageConfig.whatsappReadyRenderer(item, activity, pageConfig);
    } else {
        text = _activityDefaultReadyText(item, activity, pageConfig);
    }
    
    const url = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
}

function _activityDefaultReadyText(item, activity, pageConfig) {
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const bizName = _afSafeStr(biz.businessName) || 'المدير AI';
    const bizLoc = _afFormatLocation(biz.location);
    const bizPhone = _afSafeStr(biz.phone) || _afSafeStr(biz.customerPhone) || '';
    
    const cost = item.expectedCost ? _afFmt(item.expectedCost) : '';
    const adv = item.paidAdvance ? parseFloat(item.paidAdvance) : 0;
    const finalCost = parseFloat(item.expectedCost) || 0;
    const remaining = finalCost - adv;
    
    let lines = [];
    lines.push(`عزيزي ${item.customerName || 'العميل'} 👋`);
    lines.push('');
    lines.push(`📱 *جهازك جاهز للتسليم* ✅`);
    lines.push('');
    lines.push(`📄 رقم الوصل: *${item.number || '-'}*`);
    lines.push(`📱 الجهاز: ${item.deviceModel || item.deviceType || '—'}`);
    
    if (item.deviceSerial) lines.push(`🔢 السيريال: ${item.deviceSerial}`);
    if (item.issue) lines.push(`🔧 العطل: ${item.issue}`);
    
    lines.push('');
    
    if (finalCost > 0) {
        lines.push(`💰 التكلفة الإجمالية: *${cost}*`);
        if (adv > 0) {
            lines.push(`✅ المدفوع (عربون): ${_afFmt(adv)}`);
            lines.push(`💵 المتبقي عند التسليم: *${_afFmt(remaining)}*`);
        }
    }
    
    lines.push('');
    lines.push(`📍 ${bizName}${bizLoc ? ' — ' + bizLoc : ''}`);
    lines.push(`🕐 يرجى الحضور خلال ساعات العمل`);
    lines.push('');
    lines.push('شكراً لثقتك بنا 🌟');
    
    return lines.join('\n');
}


// ═══════════════════════════════════════════════════════════
//  📱 SMS READY — فتح تطبيق الرسائل مع النص جاهز
// ═══════════════════════════════════════════════════════════
function activitySMSReady(activityId, pageId, docId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const item = _activityCache.getAll(pageId).find(x => x.id === docId);
    if (!item) return;
    
    const { activity, pageConfig } = entry;
    
    // رقم الهاتف
    const rawPhone = item.customerPhone || '';
    if (!rawPhone) {
        alert('⚠️ لا يوجد رقم هاتف للعميل');
        return;
    }
    
    // 🎯 تنظيف الرقم + إضافة رمز الدولة
    const phone = _afFormatPhone(rawPhone);
    if (!phone) {
        alert('⚠️ رقم الهاتف غير صحيح');
        return;
    }
    
    // نص الرسالة (نفس قالب الواتساب — لكن بلا * لأن SMS لا يدعمها)
    let text;
    if (typeof pageConfig.smsReadyRenderer === 'function') {
        text = pageConfig.smsReadyRenderer(item, activity, pageConfig);
    } else if (typeof _activityDefaultReadyText === 'function') {
        text = _activityDefaultReadyText(item, activity, pageConfig)
            .replace(/\*/g, '')  // إزالة * من SMS
            .replace(/_(.*?)_/g, '$1'); // إزالة _ من SMS
    } else {
        text = `جهازك جاهز للتسليم — ${item.number || ''}`;
    }
    
    // 🎯 فتح تطبيق SMS
    // Android: sms:PHONE?body=TEXT
    // iOS: sms:PHONE&body=TEXT
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const url = `sms:${phone}${separator}body=${encodeURIComponent(text)}`;
    
    console.log('📱 [sms] فتح:', phone);
    window.location.href = url;
}

// 🎯 تنسيق رقم الهاتف (تنظيف + رمز الدولة)
function _afFormatPhone(raw) {
    if (!raw) return '';
    
    // تنظيف: إزالة كل ما ليس رقماً أو +
    let phone = String(raw).replace(/[^0-9+]/g, '');
    
    // إذا كان يبدأ بـ + — نُبقيه
    if (phone.startsWith('+')) return phone;
    
    // إذا كان يبدأ بـ 00 — نحوّله إلى +
    if (phone.startsWith('00')) return '+' + phone.substring(2);
    
    // 🎯 للسعودية (966+) — إذا بدأ بـ 05 → 9665...
    // 🇸🇾 سوريا: 09XX → +963 9XX
    // نُحدد الدولة من currentUser
    
    const country = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.country : null;
    const countryCode = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.countryCode : null;
    
    // خريطة رموز الدول
    const dialCodes = {
        'سوريا': '963',
        'لبنان': '961',
        'الأردن': '962',
        'العراق': '964',
        'تركيا': '90',
        'السعودية': '966',
        'الإمارات': '971',
        'مصر': '20'
    };
    
    const code = dialCodes[country] || '963';
    
    // إذا الرقم يبدأ بصفر — نُزيله ونضيف رمز الدولة
    if (phone.startsWith('0')) {
        return '+' + code + phone.substring(1);
    }
    
    // إذا كان الرقم بلا رمز دولة — نضيفه
    if (phone.length <= 10) {
        return '+' + code + phone;
    }
    
    return phone;
}

// ═══════════════════════════════════════════════════════════
//  4. EXPORT ALL
// ═══════════════════════════════════════════════════════════

function activityExportAll(activityId, pageId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const items = _activityCache.getAll(pageId);
    if (items.length === 0) {
        alert('⚠️ لا توجد بيانات');
        return;
    }
    
    const fields = entry.pageConfig.fields || [];
    const headers = ['الرقم', 'التاريخ', ...fields.map(f => f.label)];
    const rows = items.map(item => {
        const row = [item.number || '-', _afDate(item.createdAt)];
        fields.forEach(f => {
            let val = item[f.name];
            if (f.type === 'checkbox') val = val ? 'نعم' : 'لا';
            else val = _afLabelValue(f, val);
            row.push(val || '');
        });
        return row;
    });
    
    const modal = document.createElement('div');
    modal.id = 'activityExportModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;';
    modal.innerHTML = `
        <div style="background:white; border-radius:14px; padding:20px; max-width:380px; width:100%;">
            <h3 style="margin:0 0 15px 0; font-size:16px;">📤 تصدير ${items.length} وثيقة</h3>
            <div style="display:grid; gap:8px;">
                <button onclick="activityDoExport('excel')" style="padding:12px; background:#27ae60; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">📊 Excel</button>
                <button onclick="activityDoExport('pdf')" style="padding:12px; background:#c0392b; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">📄 PDF</button>
                <button onclick="activityDoExport('csv')" style="padding:12px; background:#2980b9; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">📋 CSV</button>
                <button onclick="document.getElementById('activityExportModal').remove()" style="padding:10px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer;">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    window._afExportData = { headers, rows, title: entry.pageConfig.title };
}

function activityDoExport(type) {
    const data = window._afExportData;
    if (!data) return;
    
    document.getElementById('activityExportModal')?.remove();
    
    if (type === 'excel' && typeof exportToExcel === 'function') {
        exportToExcel({
            filename: data.title,
            sheets: [{ name: data.title.substring(0, 31), data: [data.headers, ...data.rows],
                cols: data.headers.map((h, i) => ({ wch: i === 0 ? 18 : 15 })) }]
        });
    } else if (type === 'pdf' && typeof exportToPDF === 'function') {
        exportToPDF({ filename: data.title, title: data.title, columns: data.headers, rows: data.rows,
            meta: { date: new Date().toLocaleDateString('ar-SY') } });
    } else if (type === 'csv' && typeof exportToCSV === 'function') {
        exportToCSV({ filename: data.title, data: [data.headers, ...data.rows] });
    }
}


// ═══════════════════════════════════════════════════════════
//  🖨️ PRINT INTERNAL — الطباعة الداخلية (للتاجر)
//  تُظهر: تكلفة القطع + الربح + الهامش
// ═══════════════════════════════════════════════════════════
function activityPrintInternal(activityId, pageId, docId) {
    try {
        const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
        if (!entry) return;
        
        const item = _activityCache.getAll(pageId).find(x => x.id === docId);
        if (!item) { alert('⚠️ الوثيقة غير موجودة'); return; }
        
        const { activity, pageConfig } = entry;
        
        // قالب مخصص؟
        let html;
        if (typeof pageConfig.internalPrintRenderer === 'function') {
            html = pageConfig.internalPrintRenderer(item, activity, pageConfig);
        } else {
            html = _activityInternalPrintHTML(item, activity, pageConfig);
        }
        
        _activityDoPrint(html, pageConfig);
    } catch(e) {
        console.error('[print-internal] error:', e);
        alert('❌ فشل الطباعة: ' + e.message);
    }
}

function _activityInternalPrintHTML(item, activity, pageConfig) {
    const biz = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const sett = (typeof settings !== 'undefined' && settings) ? settings : {};
    
    const bizName = _afSafeStr(biz.businessName) || 'المدير AI';
    const bizLoc = _afFormatLocation(biz.location);
    
    // ═══ معلومات الوثيقة ═══
    let html = `
        <div class="header">
            <div style="background:#e74c3c; color:white; padding:4px 12px; border-radius:12px; display:inline-block; font-size:11px; font-weight:bold; margin-bottom:6px;">🔒 نسخة داخلية — للتاجر فقط</div>
            <h1>${_afEsc(bizName)}</h1>
            ${bizLoc ? `<div class="sub">📍 ${_afEsc(bizLoc)}</div>` : ''}
            <div style="margin-top:6px; font-size:14px; font-weight:bold;">${_afEsc(pageConfig.printTitle || pageConfig.title)}</div>
        </div>
    `;
    
    // ═══ الرقم + التاريخ ═══
    html += `
        <div class="row">
            <span class="label">📄 رقم الوثيقة:</span>
            <span class="value">${_afEsc(item.number || '-')}</span>
        </div>
        <div class="row">
            <span class="label">📅 التاريخ:</span>
            <span class="value">${_afDate(item.createdAt)}</span>
        </div>
    `;
    
    // ═══ معلومات العميل ═══
    if (item.customerName) {
        html += `
            <div class="row">
                <span class="label">👤 العميل:</span>
                <span class="value">${_afEsc(item.customerName)}</span>
            </div>
        `;
    }
    if (item.customerPhone) {
        html += `
            <div class="row">
                <span class="label">📞 الهاتف:</span>
                <span class="value" style="font-family:monospace; direction:ltr;">${_afEsc(item.customerPhone)}</span>
            </div>
        `;
    }
    
    // ═══ الجهاز ═══
    if (item.deviceModel || item.deviceType) {
        html += `
            <div class="row">
                <span class="label">📱 الجهاز:</span>
                <span class="value">${_afEsc(item.deviceModel || item.deviceType)}</span>
            </div>
        `;
    }
    if (item.deviceSerial) {
        html += `
            <div class="row">
                <span class="label">🔢 السيريال:</span>
                <span class="value" style="font-family:monospace;">${_afEsc(item.deviceSerial)}</span>
            </div>
        `;
    }
    if (item.issue) {
        html += `
            <div class="row">
                <span class="label">🔧 العطل:</span>
                <span class="value">${_afEsc(item.issue)}</span>
            </div>
        `;
    }
    
    // ═══ قطع الغيار ═══
    const parts = Array.isArray(item.parts) ? item.parts : [];
    if (parts.length > 0) {
        html += `
            <div style="margin-top:12px; padding:8px; background:#fff3cd; border-right:3px solid #f39c12; border-radius:6px;">
                <div style="font-weight:bold; font-size:12px; margin-bottom:6px;">🔧 قطع الغيار المستخدمة</div>
                <table style="width:100%; font-size:11px; border-collapse:collapse;">
                    <tr style="background:#f0e5c5;">
                        <th style="padding:4px; text-align:right;">القطعة</th>
                        <th style="padding:4px; text-align:center;">الكمية</th>
                        <th style="padding:4px; text-align:center;">التكلفة</th>
                        <th style="padding:4px; text-align:center;">الإجمالي</th>
                    </tr>
        `;
        parts.forEach(p => {
            const qty = parseFloat(p.qty) || 1;
            const cost = parseFloat(p.cost) || 0;
            const total = qty * cost;
            html += `
                <tr>
                    <td style="padding:4px; border-bottom:1px dashed #ddd;">${_afEsc(p.name || '—')}</td>
                    <td style="padding:4px; border-bottom:1px dashed #ddd; text-align:center;">${qty}</td>
                    <td style="padding:4px; border-bottom:1px dashed #ddd; text-align:center;">${_afFmt(cost)}</td>
                    <td style="padding:4px; border-bottom:1px dashed #ddd; text-align:center;">${_afFmt(total)}</td>
                </tr>
            `;
        });
        html += `</table></div>`;
    }
    
    // ═══ الملخص المالي ═══
    const expectedCost = parseFloat(item.expectedCost) || 0;
    const actualCost = parseFloat(item.actualCost) || 0;
    const finalCost = actualCost || expectedCost;
    const partsTotal = parseFloat(item.partsTotal) || 0;
    const profit = finalCost - partsTotal;
    const margin = finalCost > 0 ? (profit / finalCost * 100) : 0;
    
    html += `
        <div style="margin-top:12px; padding:10px; background:#e8f5e9; border-radius:8px; border:2px solid #27ae60;">
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #ccc; font-size:13px;">
                <span>💰 التكلفة المتوقعة للعميل:</span>
                <span style="font-weight:bold;">${_afFmt(expectedCost)}</span>
            </div>
            ${actualCost > 0 && actualCost !== expectedCost ? `
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #ccc; font-size:13px;">
                <span>💵 التكلفة النهائية:</span>
                <span style="font-weight:bold;">${_afFmt(actualCost)}</span>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #ccc; font-size:13px; color:#c0392b;">
                <span>🔧 تكلفة القطع:</span>
                <span style="font-weight:bold;">${partsTotal > 0 ? '- ' + _afFmt(partsTotal) : '0'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:8px 0; font-size:15px; font-weight:bold; color:#27ae60;">
                <span>📊 الربح الفعلي:</span>
                <span>${_afFmt(profit)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#666;">
                <span>📈 هامش الربح:</span>
                <span>${margin.toFixed(1)}%</span>
            </div>
        </div>
    `;
    
    // ═══ ملاحظات ═══
    if (item.notes) {
        html += `
            <div style="margin-top:10px; padding:8px; background:#f8f9fa; border-radius:6px; font-size:11px;">
                <b>📝 ملاحظات:</b> ${_afEsc(item.notes)}
            </div>
        `;
    }
    
    // ═══ Footer ═══
    html += `
        <div class="footer">
            🔒 نسخة داخلية — ${bizName}<br>
            ${new Date().toLocaleString('ar-SY')}
        </div>
    `;
    
    return html;
}

// ═══════════════════════════════════════════════════════════
//  5. EXPORT
// ═══════════════════════════════════════════════════════════

window._afLabelValue = _afLabelValue;
window._afFormatLocation = _afFormatLocation;
window._afSafeStr = _afSafeStr;
window._afEsc = _afEsc;
window._afDate = _afDate;
window._afFmt = _afFmt;

window.activityPrintInternal = activityPrintInternal;
window.activityPrintItem = activityPrintItem;
window.activityPNGItem = activityPNGItem;
window.activityWhatsAppItem = activityWhatsAppItem;
window.activityWhatsAppReady = activityWhatsAppReady;
window.activitySMSReady = activitySMSReady;
window._afFormatPhone = _afFormatPhone;
window.activityExportAll = activityExportAll;
window.activityDoExport = activityDoExport;

console.log('📤 [activity-actions] v2.0.0 محمّل');
