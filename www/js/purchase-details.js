// ============================================================
//  📄 PURCHASE DETAILS — تفاصيل فاتورة الشراء
// ============================================================

let _purDetCurrent = null;

// ---------- فتح تفاصيل فاتورة الشراء ----------
async function openPurchaseDetails(purchaseId) {
    try {
        const doc = await db.collection('users').doc(_getEffectiveUid())
            .collection('purchases').doc(purchaseId).get();
        if (!doc.exists) return alert('⚠️ الفاتورة غير موجودة');

        _purDetCurrent = { id: doc.id, ...doc.data() };
        renderPurchaseDetailsModal(_purDetCurrent);
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

// ---------- Modal التفاصيل ----------
function renderPurchaseDetailsModal(p) {
    const old = document.getElementById('purchaseDetailsModal');
    if (old) old.remove();

    const boxName = p.boxId && typeof _getBoxName === 'function' ? _getBoxName(p.boxId) : '';
    const dateText = p.createdAt?.toDate?.()?.toLocaleDateString('ar-SY') || p.date || '-';
    const total = parseFloat(p.total) || 0;
    const paid = parseFloat(p.paid) || 0;
    const remaining = parseFloat(p.remaining) || 0;

    let itemsHtml = '';
    (p.items || []).forEach(it => {
        const qty = parseFloat(it.qty) || 0;
        const unitPrice = parseFloat(it.unitPrice) || 0;
        const itemTotal = parseFloat(it.total) || (qty * unitPrice);

        itemsHtml += `
        <div style="background:#f8f9fa; border-radius:8px; padding:10px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold; color:#2c3e50; font-size:13px;">📦 ${_purDetEsc(it.materialName || '-')}</div>
                <div style="font-size:11px; color:#888; margin-top:2px;">${qty} ${_purDetEsc(it.unit || '')} × ${_purDetFmt(unitPrice)} ل.س</div>
            </div>
            <div style="font-weight:bold; color:#27ae60; font-size:14px;">${_purDetFmt(itemTotal)} ل.س</div>
        </div>`;
    });

    const modal = document.createElement('div');
    modal.id = 'purchaseDetailsModal';
    modal.className = 'modal-overlay show';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:2147483646; display:flex; align-items:center; justify-content:center; padding:20px; direction:rtl;';

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; padding:20px; max-width:520px; width:100%; max-height:90vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#2c3e50;">📄 تفاصيل فاتورة الشراء</h3>
                <button id="purDetClose" style="background:#e74c3c; color:white; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:16px;">✕</button>
            </div>

            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:12px; padding:15px; margin-bottom:12px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">💰 إجمالي الفاتورة</div>
                <div style="font-size:26px; font-weight:bold; margin-top:4px;">${_purDetFmt(total)} ل.س</div>
            </div>

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span>📄 رقم الفاتورة:</span>
                    <b>${_purDetEsc(p.invoice || '-')}</b>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span>📅 التاريخ:</span>
                    <b>${dateText}</b>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span>🏭 المورد:</span>
                    <b>${_purDetEsc(p.supplierName || '-')}</b>
                </div>
                ${boxName ? `<div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span>💳 الصندوق:</span>
                    <b>${_purDetEsc(boxName)}</b>
                </div>` : ''}
            </div>

            <div style="background:#f0f7ff; border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span>💵 المدفوع:</span>
                    <b style="color:#27ae60;">${_purDetFmt(paid)} ل.س</b>
                </div>
                ${remaining > 0 ? `<div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px; color:#e74c3c;">
                    <span>⏳ الباقي (دين للمورد):</span>
                    <b>${_purDetFmt(remaining)} ل.س</b>
                </div>` : '<div style="text-align:center; color:#27ae60; font-size:12px; padding-top:6px;">✅ مكتملة الدفع</div>'}
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-weight:bold; color:#2c3e50; margin-bottom:8px;">📦 المواد (${(p.items || []).length})</div>
                ${itemsHtml || '<div style="text-align:center; color:#999; padding:15px;">لا توجد مواد</div>'}
            </div>

            ${p.notes ? `
            <div style="background:#fef3c7; border-radius:8px; padding:10px; margin-bottom:12px;">
                <div style="font-size:11px; color:#92400e; font-weight:bold; margin-bottom:4px;">📝 ملاحظات:</div>
                <div style="font-size:12px; color:#666;">${_purDetEsc(p.notes)}</div>
            </div>` : ''}

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <button id="purDetPrint" style="padding:12px; background:#27ae60; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">🖨️ طباعة</button>
                <button id="purDetWhatsApp" style="padding:12px; background:#25d366; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">📱 واتساب</button>
                <button id="purDetReturn" style="padding:12px; background:#e67e22; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; grid-column: span 2;">↩️ إرجاع للمورد</button>
                <button id="purDetClose2" style="padding:12px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px; grid-column: span 2;">إغلاق</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // ربط الأحداث
    const close = () => modal.remove();
    document.getElementById('purDetClose').onclick = close;
    document.getElementById('purDetClose2').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    document.getElementById('purDetPrint').onclick = () => {
        printPurchaseDetails(_purDetCurrent);
    };

    document.getElementById('purDetWhatsApp').onclick = () => {
        sharePurchaseWhatsApp(_purDetCurrent);
    };

    document.getElementById('purDetReturn').onclick = () => {
        close();
        if (typeof openPurchaseReturnAsync === 'function') {
            openPurchaseReturnAsync(_purDetCurrent.id);
        }
    };
}

// ---------- طباعة تفاصيل الفاتورة ----------
function printPurchaseDetails(p) {
    if (!p) return;

    // 🆕 استخدام الطباعة الحرارية
    if (typeof window.ThermalPrint !== 'undefined') {
        try {
            const _bi = (typeof getBusinessInfo === 'function') ? getBusinessInfo() : {};
            window.ThermalPrint.purchase({
                invoice: p.invoice,
                date: p.date,
                createdAt: p.createdAt,
                supplierName: p.supplierName || p.supplier,
                items: p.items || [],
                total: p.total,
                paid: p.paid,
                remaining: p.remaining,
                paymentMethod: p.paymentMethod
            }, {
                name: _bi.name || 'النشاط',
                currency: settings?.displayCurrency || 'SYP'
            });
            return;
        } catch(e) {
            console.warn('[purchase-print] thermal fallback:', e);
        }
    }

    const boxName = p.boxId && typeof _getBoxName === 'function' ? _getBoxName(p.boxId) : '';
    const dateText = p.createdAt?.toDate?.()?.toLocaleDateString('ar-SY') || p.date || '-';
    const total = parseFloat(p.total) || 0;
    const paid = parseFloat(p.paid) || 0;
    const remaining = parseFloat(p.remaining) || 0;
    const businessName = (typeof getBusinessInfo === 'function' ? getBusinessInfo().name : '') || 'المدير AI';

    let itemsRows = '';
    (p.items || []).forEach(it => {
        const qty = parseFloat(it.qty) || 0;
        const unitPrice = parseFloat(it.unitPrice) || 0;
        const itemTotal = parseFloat(it.total) || (qty * unitPrice);
        itemsRows += `<tr>
            <td>${it.materialName || '-'}</td>
            <td>${qty} ${it.unit || ''}</td>
            <td>${unitPrice} ل.س</td>
            <td>${itemTotal} ل.س</td>
        </tr>`;
    });

    const w = window.open('', '_blank');
    if (!w) return alert('⚠️ يرجى السماح بالنوافذ المنبثقة');

    w.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة شراء ${p.invoice}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
                .invoice { position: relative; border: 2px solid #333; padding: 25px; max-width: 500px; margin: auto; background: white; }
                .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 60px; color: rgba(0,0,0,0.05); font-weight: bold; }
                .content { position: relative; z-index: 1; }
                .biz { font-size: 22px; font-weight: bold; text-align: center; margin-bottom: 5px; color: #2c3e50; }
                .title { font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0; color: #27ae60; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
                th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                th { background: #27ae60; color: white; }
                .totals { margin-top: 15px; padding-top: 10px; border-top: 2px dashed #ccc; }
                .totals .row { font-size: 14px; padding: 4px 0; }
                .grand { font-size: 18px; font-weight: bold; color: #27ae60; }
            </style>
        </head>
        <body>
            <div class="invoice">
                <div class="watermark">المدير AI</div>
                <div class="content">
                    <div class="biz">${businessName}</div>
                    <div class="title">📦 فاتورة شراء</div>

                    <div class="row"><span>📄 رقم الفاتورة:</span><b>${p.invoice || '-'}</b></div>
                    <div class="row"><span>📅 التاريخ:</span><b>${dateText}</b></div>
                    <div class="row"><span>🏭 المورد:</span><b>${p.supplierName || '-'}</b></div>
                    ${boxName ? `<div class="row"><span>💳 الصندوق:</span><b>${boxName}</b></div>` : ''}

                    <table>
                        <tr><th>المادة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
                        ${itemsRows}
                    </table>

                    <div class="totals">
                        <div class="row grand"><span>💰 الإجمالي:</span><span>${_purDetFmt(total)} ل.س</span></div>
                        <div class="row"><span>💵 المدفوع:</span><span>${_purDetFmt(paid)} ل.س</span></div>
                        ${remaining > 0 ? `<div class="row" style="color:#e74c3c;"><span>⏳ الباقي:</span><span>${_purDetFmt(remaining)} ل.س</span></div>` : ''}
                    </div>

                    ${p.notes ? `<div style="margin-top:15px; padding:10px; background:#fef3c7; border-radius:6px; font-size:12px;">📝 ${p.notes}</div>` : ''}

                    <div style="margin-top:30px; text-align: center; font-size: 11px; color: #999;">
                        🌟 تم إنشاء الفاتورة بواسطة المدير AI 🌟
                    </div>
                </div>
            </div>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>
    `);
    w.document.close();
}

// ---------- مشاركة واتساب ----------
function sharePurchaseWhatsApp(p) {
    if (!p) return;

    const boxName = p.boxId && typeof _getBoxName === 'function' ? _getBoxName(p.boxId) : '';
    const total = parseFloat(p.total) || 0;
    const paid = parseFloat(p.paid) || 0;
    const remaining = parseFloat(p.remaining) || 0;

    let itemsText = '';
    (p.items || []).forEach(it => {
        itemsText += `   • ${it.materialName} × ${it.qty} ${it.unit || ''}\n`;
    });

    const businessName = (typeof getBusinessInfo === 'function' ? getBusinessInfo().name : '') || 'المدير AI';

    const msg = `📦 *فاتورة شراء*
━━━━━━━━━━━━━━━━━
📄 *الفاتورة:* ${p.invoice}
📅 *التاريخ:* ${p.date || '-'}
🏭 *المورد:* ${p.supplierName || '-'}
${boxName ? `💳 *الصندوق:* ${boxName}\n` : ''}
━━━━━━━━━━━━━━━━━
📦 *المواد:*
${itemsText}
━━━━━━━━━━━━━━━━━
💰 *الإجمالي:* ${_purDetFmt(total)} ل.س
💵 *المدفوع:* ${_purDetFmt(paid)} ل.س
${remaining > 0 ? `⏳ *الباقي:* ${_purDetFmt(remaining)} ل.س\n` : '✅ *مدفوعة بالكامل*\n'}
━━━━━━━━━━━━━━━━━
🌟 ${businessName}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ---------- أدوات ----------
function _purDetFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _purDetEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('📄 [purchase-details] جاهز');

// ---------- دوال مختصرة للأزرار ----------
async function openPurchaseDetailsPrint(id) {
    try {
        const doc = await db.collection('users').doc(_getEffectiveUid())
            .collection('purchases').doc(id).get();
        if (!doc.exists) return alert('⚠️ الفاتورة غير موجودة');
        printPurchaseDetails({ id: doc.id, ...doc.data() });
    } catch(e) { alert('❌ ' + e.message); }
}

async function openPurchaseDetailsWhatsApp(id) {
    try {
        const doc = await db.collection('users').doc(_getEffectiveUid())
            .collection('purchases').doc(id).get();
        if (!doc.exists) return alert('⚠️ الفاتورة غير موجودة');
        sharePurchaseWhatsApp({ id: doc.id, ...doc.data() });
    } catch(e) { alert('❌ ' + e.message); }
}
