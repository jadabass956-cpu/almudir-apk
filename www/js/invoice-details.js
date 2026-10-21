// ============================================================
//  📄 INVOICE DETAILS — صفحة تفاصيل الفاتورة
// ============================================================

let _invDetCurrentIndex = null;

// ---------- فتح صفحة التفاصيل ----------
function openInvoiceDetails(index) {
    const s = sales[index];
    if (!s) return alert('⚠️ الفاتورة غير موجودة');

    _invDetCurrentIndex = index;

    if (typeof openPage === 'function') openPage('invoice-details');
    setTimeout(() => renderInvoiceDetails(s, index), 200);
}

// ---------- عرض التفاصيل ----------
function renderInvoiceDetails(sale, index) {
    const container = document.getElementById('invDetContent');
    if (!container) return;

    const cur = sale.currency === 'USD' ? '$' : 'ل.س';
    const isRetail = sale.isRetail;
    const total = parseFloat(sale.total || sale.grandTotal || 0);
    const paid = parseFloat(sale.paid || 0);
    const remaining = parseFloat(sale.remaining || 0);
    const totalCost = parseFloat(sale.totalCost || 0);
    const profit = parseFloat(sale.profit || 0);
    const vat = parseFloat(sale.vat || 0);
    const vatRate = sale.vatRate || 0;
    const profitMargin = total > 0 ? Math.round((profit / total) * 100) : 0;

    // حالة الفاتورة
    let statusBadge, statusColor;
    if (remaining <= 0) {
        statusBadge = '✅ مكتملة';
        statusColor = '#27ae60';
    } else if (paid > 0) {
        statusBadge = '⏳ جزئية';
        statusColor = '#f39c12';
    } else {
        statusBadge = '🔴 دين كامل';
        statusColor = '#e74c3c';
    }

    // الصندوق
    const boxName = sale.paymentBox && typeof _getBoxName === 'function' 
        ? _getBoxName(sale.paymentBox) 
        : '';

    // المواد
    let itemsHtml = '';
    (sale.items || []).forEach(it => {
        const qty = parseFloat(it.qty || 0);
        const unitPrice = parseFloat(it.unitPrice || 0);
        const itemTotal = parseFloat(it.total || 0);
        const costAtSale = parseFloat(it.costAtSale || 0);
        const itemCost = costAtSale * qty;
        const itemProfit = itemTotal - itemCost;
        const itemMargin = itemTotal > 0 ? Math.round((itemProfit / itemTotal) * 100) : 0;

        itemsHtml += `
        <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-right:4px solid #3498db;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px;">📦 ${_invDetEsc(it.materialName || 'بدون اسم')}</div>
                    <div style="font-size:12px; color:#888; margin-top:2px;">${qty} ${_invDetEsc(it.unit || '')} × ${_invDetFmt(unitPrice)} ${cur}</div>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:16px; font-weight:bold; color:#2c3e50;">${_invDetFmt(itemTotal)}</div>
                    <div style="font-size:10px; color:#888;">${cur}</div>
                </div>
            </div>
            ${costAtSale > 0 ? `
            <div style="background:#f8f9fa; border-radius:6px; padding:8px; font-size:11px;">
                <div style="display:flex; justify-content:space-between;"><span>💰 التكلفة:</span><b>${_invDetFmt(itemCost)}</b></div>
                <div style="display:flex; justify-content:space-between; color:${itemProfit > 0 ? '#27ae60' : '#e74c3c'};"><span>✅ الربح:</span><b>${_invDetFmt(itemProfit)} (${itemMargin}%)</b></div>
            </div>` : ''}
        </div>`;
    });

    // القصة المالية
    const storyHtml = `
        <div style="background:#f0f7ff; border-radius:12px; padding:15px; margin-bottom:15px;">
            <div style="font-weight:bold; color:#2980b9; margin-bottom:10px;">💰 القصة المالية</div>
            <div style="font-size:13px; line-height:2;">
                <div style="display:flex; justify-content:space-between;">
                    <span>📥 دخل (المدفوع):</span>
                    <b style="color:#27ae60;">+ ${_invDetFmt(paid)} ${cur}</b>
                </div>
                ${totalCost > 0 ? `
                <div style="display:flex; justify-content:space-between;">
                    <span>📦 تكلفة المواد:</span>
                    <b style="color:#e74c3c;">- ${_invDetFmt(totalCost)} ${cur}</b>
                </div>
                <div style="border-top:1px dashed #ccc; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between;">
                    <span>✅ الربح الفعلي:</span>
                    <b style="color:${profit > 0 ? '#27ae60' : '#e74c3c'}; font-size:15px;">${_invDetFmt(profit)} ${cur} (${profitMargin}%)</b>
                </div>` : ''}
            </div>
        </div>`;

    // بيانات أساسية
    const infoHtml = `
        <div style="background:white; border-radius:12px; padding:15px; margin-bottom:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-weight:bold; color:#2c3e50; font-size:16px;">📄 ${_invDetEsc(sale.invoice || '-')}</div>
                <span style="background:${statusColor}; color:white; padding:4px 10px; border-radius:20px; font-size:12px;">${statusBadge}</span>
            </div>
            <div style="font-size:13px; color:#555; line-height:2;">
                <div style="display:flex; justify-content:space-between;"><span>📅 التاريخ:</span><b>${_invDetEsc(sale.date || '-')}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>👤 العميل:</span><b>${_invDetEsc(sale.customer || 'بدون اسم')}</b></div>
                ${isRetail ? '<div style="display:flex; justify-content:space-between; color:#f39c12;"><span>🛒 النوع:</span><b>بيع مفرق</b></div>' : ''}
                <div style="display:flex; justify-content:space-between;"><span>💰 الإجمالي:</span><b style="color:#2c3e50;">${_invDetFmt(total)} ${cur}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>💵 المدفوع:</span><b style="color:#27ae60;">${_invDetFmt(paid)} ${cur}</b></div>
                ${remaining > 0 ? `<div style="display:flex; justify-content:space-between; color:#e74c3c;"><span>⏳ الباقي:</span><b>${_invDetFmt(remaining)} ${cur}</b></div>` : ''}
                ${vat > 0 ? `<div style="display:flex; justify-content:space-between; color:#f39c12;"><span>💰 VAT (${vatRate}%):</span><b>${_invDetFmt(vat)} ${cur}</b></div>` : ''}
            </div>
        </div>`;

    // الروابط
    let linksHtml = '<div style="background:white; border-radius:12px; padding:15px; margin-bottom:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">';
    linksHtml += '<div style="font-weight:bold; color:#2c3e50; margin-bottom:10px;">🔗 مرتبط بـ</div>';
    
    if (boxName) {
        linksHtml += `
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:#f0f7ff; border-radius:8px; margin-bottom:6px;">
            <div style="font-size:20px;">💳</div>
            <div style="flex:1;">
                <div style="font-size:12px; color:#666;">الصندوق</div>
                <div style="font-weight:bold; color:#3498db; font-size:13px;">${_invDetEsc(boxName)}</div>
            </div>
        </div>`;
    }

    if (sale.customer && sale.customer !== 'بيع مفرق') {
        linksHtml += `
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:#fef3c7; border-radius:8px;">
            <div style="font-size:20px;">👤</div>
            <div style="flex:1;">
                <div style="font-size:12px; color:#666;">العميل</div>
                <div style="font-weight:bold; color:#92400e; font-size:13px;">${_invDetEsc(sale.customer)}</div>
            </div>
        </div>`;
    }
    
    linksHtml += '</div>';

    // الإجراءات
    const _returnBtn = isRetail ? '' : `
            <button onclick="openReturnForm(${index})" style="padding:12px; background:#e67e22; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; grid-column: span 2;">↩️ إرجاع مبيعات</button>`;

    const actionsHtml = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:15px;">
            <button onclick="printSavedInvoice(${index})" style="padding:12px; background:#27ae60; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">🖨️ طباعة</button>
            <button onclick="exportSavedInvoiceAsPNG(${index})" style="padding:12px; background:#3498db; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">📤 تصدير PNG</button>
            <button onclick="shareInvoiceWhatsApp(${index})" style="padding:12px; background:#25d366; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">📱 واتساب</button>
            <button onclick="editSale(${index}); openPage('sales');" style="padding:12px; background:#f39c12; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">✏️ تعديل</button>
            ${_returnBtn}
        </div>`;

    // رأس الصفحة
    const headerHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 style="margin:0;">📄 تفاصيل الفاتورة</h2>
            <button onclick="openPage('sales')" style="padding:8px 15px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">↩️ رجوع</button>
        </div>`;

    container.innerHTML = headerHtml + infoHtml + storyHtml + linksHtml + actionsHtml + 
        `<h3 style="color:#2c3e50;">📦 المواد (${(sale.items || []).length})</h3>` + itemsHtml;
}

// ---------- مشاركة واتساب لفاتورة معينة ----------
function shareInvoiceWhatsApp(index) {
    const s = sales[index];
    if (!s) return alert('⚠️ الفاتورة غير موجودة');

    const cur = s.currency === 'USD' ? '$' : 'ل.س';
    const boxName = s.paymentBox && typeof _getBoxName === 'function' ? _getBoxName(s.paymentBox) : '';

    let itemsText = '';
    (s.items || []).forEach(it => {
        itemsText += `   • ${it.materialName} × ${it.qty} ${it.unit || ''} — ${it.total} ${cur}\n`;
    });

    const msg = `🧾 *فاتورة ${s.invoice}*
📅 التاريخ: ${s.date}
👤 العميل: ${s.customer || 'بدون اسم'}

📦 *المواد:*
${itemsText}
💰 *الإجمالي:* ${s.total} ${cur}
💵 *المدفوع:* ${s.paid} ${cur}
${s.remaining > 0 ? `⏳ *الباقي:* ${s.remaining} ${cur}\n` : ''}${boxName ? `💳 *الصندوق:* ${boxName}\n` : ''}
🌟 شكراً لتعاملكم معنا`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// ---------- أدوات ----------
function _invDetFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _invDetEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('📄 [invoice-details] جاهز');
