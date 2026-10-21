// ============================================================
//  👤 CUSTOMER DETAILS — تفاصيل العميل + كشف حساب
// ============================================================

let _custDetCurrentId = null;

// ---------- فتح صفحة التفاصيل ----------
async function openCustomerDetails(customerId) {
    const c = _custCache.find(x => x.id === customerId);
    if (!c) return alert('⚠️ العميل غير موجود');

    _custDetCurrentId = customerId;

    if (typeof openPage === 'function') openPage('customer-details');

    // عبّئ الرأس
    document.getElementById('custDetName').textContent = c.name || '-';
    document.getElementById('custDetPhone').textContent = c.phone || '-';

    const bal = parseFloat(c.balance) || 0;
    const balEl = document.getElementById('custDetBalance');
    if (bal > 0) {
        balEl.textContent = '🔴 مدين لنا: ' + _custDetFmt(bal) + ' ل.س';
        balEl.style.color = '#e74c3c';
    } else if (bal < 0) {
        balEl.textContent = '🟢 علينا له: ' + _custDetFmt(Math.abs(bal)) + ' ل.س';
        balEl.style.color = '#27ae60';
    } else {
        balEl.textContent = '⚪ لا ديون';
        balEl.style.color = '#95a5a6';
    }

    await loadCustomerDetails(customerId);
}

// ---------- تحميل التفاصيل ----------
async function loadCustomerDetails(customerId) {
    const c = _custCache.find(x => x.id === customerId);
    if (!c) return;

    const salesList = document.getElementById('custDetSales');
    const debtsList = document.getElementById('custDetDebts');
    if (!salesList || !debtsList) return;

    salesList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">⏳ جاري التحميل...</div>';
    debtsList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">⏳ جاري التحميل...</div>';

    try {
        const cName = (c.name || '').trim();

        // 1) الفواتير بالاسم
        const custSales = (typeof sales !== 'undefined' ? sales : [])
            .filter(s => !s.isRetail && (s.customer || '').trim() === cName)
            .slice()
            .reverse();

        // 2) الديون بالاسم
        const custDebts = (typeof debts !== 'undefined' ? debts : [])
            .filter(d => (d.name || '').trim() === cName);

        // 3) الإحصائيات
        const totalSales = custSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
        const totalPaid = custSales.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
        const totalDebt = custDebts.reduce((sum, d) => sum + ((parseFloat(d.amount) || 0) - (parseFloat(d.paid) || 0)), 0);

        // 🎬 الرصيد الافتتاحي = الرصيد الحالي - ديون الفواتير
        const currentBalance = parseFloat(c.balance) || 0;
        const salesDebt = custSales.reduce((sum, s) => sum + (parseFloat(s.remaining) || 0), 0);
        const debtsDebt = custDebts.reduce((sum, d) => sum + ((parseFloat(d.amount) || 0) - (parseFloat(d.paid) || 0)), 0);
        const openingBalance = currentBalance - salesDebt - debtsDebt;

        document.getElementById('custDetTotalSales').textContent = _custDetFmt(totalSales);
        document.getElementById('custDetTotalPaid').textContent = _custDetFmt(totalPaid);
        document.getElementById('custDetSalesCount').textContent = custSales.length;
        document.getElementById('custDetDebtsCount').textContent = custDebts.length;
        document.getElementById('custDetRemaining').textContent = _custDetFmt(totalDebt);

        // 🎬 عرض الرصيد الافتتاحي
        const opEl = document.getElementById('custDetOpening');
        const opLabel = document.getElementById('custDetOpeningLabel');
        if (opEl && opLabel) {
            if (Math.abs(openingBalance) < 0.01) {
                opEl.textContent = '0';
                opLabel.textContent = '⚪ لا رصيد افتتاحي';
                opEl.style.color = '#95a5a6';
            } else if (openingBalance > 0) {
                opEl.textContent = _custDetFmt(openingBalance) + ' ل.س';
                opLabel.textContent = '🔴 مدين لنا (رصيد افتتاحي)';
                opEl.style.color = '#e74c3c';
            } else {
                opEl.textContent = _custDetFmt(Math.abs(openingBalance)) + ' ل.س';
                opLabel.textContent = '🟢 علينا له (رصيد افتتاحي)';
                opEl.style.color = '#27ae60';
            }
        }

        // 4) عرض الفواتير
        _custDetRenderSales(custSales);

        // 5) عرض الديون
        _custDetRenderDebts(custDebts);

    } catch(e) {
        console.error('[custDet]', e);
        salesList.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _custDetEsc(e.message) + '</div>';
    }
}

// ---------- عرض الفواتير ----------
function _custDetRenderSales(sales) {
    const list = document.getElementById('custDetSales');
    if (!sales.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد فواتير</div>';
        return;
    }

    let html = '';
    sales.forEach(s => {
        const cur = s.currency === 'USD' ? '$' : 'ل.س';
        const total = parseFloat(s.total) || 0;
        const paid = parseFloat(s.paid) || 0;
        const remaining = parseFloat(s.remaining) || 0;
        const boxName = s.paymentBox && typeof _getBoxName === 'function' ? _getBoxName(s.paymentBox) : '';

        let statusBadge, statusColor;
        if (remaining <= 0) {
            statusBadge = '✅ مكتملة';
            statusColor = '#27ae60';
        } else if (paid > 0) {
            statusBadge = '⏳ جزئية';
            statusColor = '#f39c12';
        } else {
            statusBadge = '🔴 دين';
            statusColor = '#e74c3c';
        }

        html += `
        <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-right:4px solid ${statusColor};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:13px;">📄 ${_custDetEsc(s.invoice || '-')}</div>
                    <div style="font-size:11px; color:#888; margin-top:2px;">📅 ${_custDetEsc(s.date || '-')}</div>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:15px; font-weight:bold; color:#2c3e50;">${_custDetFmt(total)}</div>
                    <div style="font-size:10px; color:#888;">${cur}</div>
                </div>
            </div>
            <div style="background:#f8f9fa; border-radius:6px; padding:8px; font-size:11px; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between;"><span>💵 المدفوع:</span><b>${_custDetFmt(paid)}</b></div>
                ${remaining > 0 ? `<div style="display:flex; justify-content:space-between; color:#e74c3c;"><span>⏳ الباقي:</span><b>${_custDetFmt(remaining)}</b></div>` : ''}
                ${boxName ? `<div style="display:flex; justify-content:space-between; color:#3498db;"><span>💳 الصندوق:</span><b>${_custDetEsc(boxName)}</b></div>` : ''}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="background:${statusColor}; color:white; padding:3px 10px; border-radius:20px; font-size:10px;">${statusBadge}</span>
                <button onclick="openInvoiceDetails(${sales._idx || 0})" style="padding:5px 10px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">👁️ تفاصيل</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

// ---------- عرض الديون ----------
function _custDetRenderDebts(debts) {
    const list = document.getElementById('custDetDebts');
    if (!debts.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد ديون</div>';
        return;
    }

    let html = '';
    debts.forEach(d => {
        const amount = parseFloat(d.amount) || 0;
        const paid = parseFloat(d.paid) || 0;
        const remaining = amount - paid;
        const date = d.date || '-';

        let statusBadge, statusColor;
        if (remaining <= 0) {
            statusBadge = '✅ مسدد';
            statusColor = '#27ae60';
        } else if (paid > 0) {
            statusBadge = '⏳ جزئي';
            statusColor = '#f39c12';
        } else {
            statusBadge = '🔴 لم يُسدد';
            statusColor = '#e74c3c';
        }

        html += `
        <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-right:4px solid ${statusColor};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:13px;">💰 دين</div>
                    <div style="font-size:11px; color:#888; margin-top:2px;">📅 ${_custDetEsc(date)}</div>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:15px; font-weight:bold; color:#e74c3c;">${_custDetFmt(amount)}</div>
                    <div style="font-size:10px; color:#888;">ل.س</div>
                </div>
            </div>
            <div style="background:#f8f9fa; border-radius:6px; padding:8px; font-size:11px; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between;"><span>💵 المسدد:</span><b>${_custDetFmt(paid)}</b></div>
                ${remaining > 0 ? `<div style="display:flex; justify-content:space-between; color:#e74c3c;"><span>⏳ الباقي:</span><b>${_custDetFmt(remaining)}</b></div>` : ''}
            </div>
            <div style="text-align:center;">
                <span style="background:${statusColor}; color:white; padding:3px 10px; border-radius:20px; font-size:10px;">${statusBadge}</span>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

// ---------- كشف حساب واتساب ----------
function shareCustomerStatement() {
    const c = _custCache.find(x => x.id === _custDetCurrentId);
    if (!c) return alert('⚠️ العميل غير موجود');

    const totalSales = document.getElementById('custDetTotalSales')?.textContent || '0';
    const totalPaid = document.getElementById('custDetTotalPaid')?.textContent || '0';
    const remaining = document.getElementById('custDetRemaining')?.textContent || '0';
    const salesCount = document.getElementById('custDetSalesCount')?.textContent || '0';

    const bal = parseFloat(c.balance) || 0;
    let balLine = '';
    if (bal > 0) balLine = `🔴 *مدين لنا:* ${_custDetFmt(bal)} ل.س`;
    else if (bal < 0) balLine = `🟢 *علينا له:* ${_custDetFmt(Math.abs(bal))} ل.س`;
    else balLine = `⚪ *لا ديون*`;

    const today = new Date().toLocaleDateString('ar-SY');
    const businessName = (typeof currentUser !== 'undefined' && currentUser ? currentUser.businessName : '') || 'المدير AI';

    const msg = `📄 *كشف حساب عميل*
━━━━━━━━━━━━━━━━━
👤 *العميل:* ${c.name}
📞 *الهاتف:* ${c.phone || '-'}
📅 *التاريخ:* ${today}

${balLine}

━━━━━━━━━━━━━━━━━
📊 *ملخص الحركات:*
🧾 عدد الفواتير: ${salesCount}
🛒 إجمالي المشتريات: ${totalSales} ل.س
💵 إجمالي المدفوع: ${totalPaid} ل.س
⏳ الدين المتبقي: ${remaining} ل.س

━━━━━━━━━━━━━━━━━
🌟 ${businessName}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ---------- الرجوع ----------
function backToCustomers() {
    openCustomersPage();
}

// ---------- أدوات ----------
function _custDetFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _custDetEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('👤 [customer-details] جاهز');
