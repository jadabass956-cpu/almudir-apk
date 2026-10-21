// ============================================================
//  🖨️ THERMAL PRINT — طباعة حرارية موحّدة (80mm)
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    // ═══ الأنماط الموحّدة ═══
    const CSS = `
        @page { size: 80mm auto; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body {
            font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            width: 72mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            color: #000;
            background: #fff;
            line-height: 1.4;
            direction: rtl;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .big { font-size: 20px; font-weight: 700; }
        .xl { font-size: 26px; font-weight: 700; }
        .small { font-size: 11px; }
        .muted { color: #555; }
        .biz-name { font-size: 18px; font-weight: 700; margin-bottom: 2px; text-align: center; }
        .biz-info { font-size: 11px; text-align: center; margin-bottom: 2px; }
        .doc-title { font-size: 15px; font-weight: 700; text-align: center; margin: 6px 0; padding: 4px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
        .sep-dash { border-top: 1px dashed #000; margin: 5px 0; }
        .sep-solid { border-top: 2px solid #000; margin: 6px 0; }
        .sep-double { border-top: 3px double #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        table th { text-align: right; font-weight: 700; padding: 3px 2px; border-bottom: 1px solid #000; font-size: 11px; }
        table th.c { text-align: center; }
        table td { padding: 3px 2px; vertical-align: top; }
        table td.c { text-align: center; }
        table td.l { text-align: left; }
        table td.r { text-align: right; }
        .item-row td { border-bottom: 1px dotted #999; }
        .totals { margin-top: 6px; }
        .totals .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
        .totals .row.grand { font-size: 18px; font-weight: 700; padding: 6px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 4px; }
        .totals .row.discount { color: #333; }
        .totals .row.vat { color: #333; }
        .qr-wrap { text-align: center; margin: 8px 0; }
        .qr-wrap img { width: 90px; height: 90px; }
        .footer { text-align: center; font-size: 11px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #000; }
        .badge { display: inline-block; padding: 2px 8px; border: 1px solid #000; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .no-print { display: none; }
        @media print {
            body { width: 72mm; padding: 2mm; }
            .no-print { display: none !important; }
        }
        @media screen {
            body { background: #f0f0f0; box-shadow: 0 0 20px rgba(0,0,0,0.2); margin: 20px auto; }
            .no-print { display: block; text-align: center; padding: 10px; background: #27ae60; color: white; border: none; width: 100%; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 20px; }
        }
    `;

    // ═══ أدوات مساعدة ═══
    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function _num(n) {
        const v = Math.round(Number(n) || 0);
        return v.toLocaleString('en-US');
    }

    function _fmtDate(d) {
        if (!d) return new Date().toLocaleDateString('ar-SY');
        if (d.toDate) d = d.toDate();
        if (typeof d === 'string') {
            const parts = d.split('-');
            if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
        }
        return new Date(d).toLocaleDateString('ar-SY');
    }

    function _fmtTime() {
        return new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
    }

    function _line(char) {
        return '<div class="sep-' + (char || 'dash') + '"></div>';
    }

    function _row(label, value, cls) {
        return '<div class="row ' + (cls || '') + '"><span>' + _esc(label) + '</span><span class="bold">' + _esc(value) + '</span></div>';
    }

    // ═══ بناء HTML الفاتورة ═══
    function _buildReceiptHTML(data) {
        const biz = data.business || {};
        const inv = data.invoice || {};
        const items = data.items || [];
        const totals = data.totals || {};
        const payment = data.payment || {};
        const opts = data.options || {};

        let html = '';

        // ═══ Header — النشاط ═══
        html += '<div class="center">';
        if (biz.name) html += '<div class="biz-name">' + _esc(biz.name) + '</div>';
        if (biz.description) html += '<div class="biz-info">' + _esc(biz.description) + '</div>';
        if (biz.phone) html += '<div class="biz-info">📞 ' + _esc(biz.phone) + '</div>';
        if (biz.address) html += '<div class="biz-info">📍 ' + _esc(biz.address) + '</div>';
        html += '</div>';

        // ═══ عنوان المستند ═══
        if (opts.docTitle) {
            html += '<div class="doc-title">' + _esc(opts.docTitle) + '</div>';
        }

        // ═══ معلومات الفاتورة ═══
        html += '<div style="font-size:12px;margin-top:6px;">';
        if (inv.number) html += '<div><b>رقم:</b> ' + _esc(inv.number) + '</div>';
        if (inv.date) html += '<div><b>التاريخ:</b> ' + _esc(_fmtDate(inv.date)) + ' — ' + _esc(_fmtTime()) + '</div>';
        if (inv.customer) html += '<div><b>العميل:</b> ' + _esc(inv.customer) + '</div>';
        if (inv.tableNumber) html += '<div><b>الطاولة:</b> ' + _esc(inv.tableNumber) + '</div>';
        if (inv.driver) html += '<div><b>السائق:</b> ' + _esc(inv.driver) + '</div>';
        if (inv.address) html += '<div><b>العنوان:</b> ' + _esc(inv.address) + '</div>';
        if (inv.orderType) {
            const otLabel = inv.orderType === 'delivery' ? '🛵 توصيل' : inv.orderType === 'pickup' ? '🥡 استلام' : '🪑 طاولة';
            html += '<div><b>النوع:</b> ' + otLabel + '</div>';
        }
        html += '</div>';

        html += _line('dash');

        // ═══ الأصناف ═══
        html += '<table>';
        html += '<thead><tr>';
        html += '<th>الصنف</th>';
        html += '<th class="c">كمية</th>';
        html += '<th class="c">سعر</th>';
        html += '<th class="c">إجمالي</th>';
        html += '</tr></thead><tbody>';

        items.forEach(it => {
            const name = it.materialName || it.name || '—';
            const qty = it.qty || 0;
            const price = Number(it.unitPrice) || 0;
            const total = Number(it.total) || (qty * price);
            html += '<tr class="item-row">';
            html += '<td>' + _esc(name) + '</td>';
            html += '<td class="c">' + qty + (it.unit ? ' ' + _esc(it.unit) : '') + '</td>';
            html += '<td class="c">' + _num(price) + '</td>';
            html += '<td class="c bold">' + _num(total) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';

        html += _line('dash');

        // ═══ الإجمالي ═══
        const symbol = totals.symbol || 'ل.س';
        html += '<div class="totals">';
        html += _row('عدد الأصناف:', items.length + '');
        if (totals.subtotal && totals.subtotal !== totals.grandTotal) {
            html += _row('المجموع:', _num(totals.subtotal) + ' ' + symbol);
        }
        if (Number(totals.discount) > 0) {
            html += _row('الخصم:', '- ' + _num(totals.discount) + ' ' + symbol, 'discount');
        }
        if (Number(totals.delivery) > 0) {
            html += _row('🛵 التوصيل:', _num(totals.delivery) + ' ' + symbol, 'discount');
        }
        if (Number(totals.vat) > 0) {
            html += _row('الضريبة (' + (totals.vatRate || 0) + '%):', _num(totals.vat) + ' ' + symbol, 'vat');
        }
        html += '<div class="row grand"><span>الإجمالي</span><span>' + _num(totals.grandTotal || totals.subtotal) + ' ' + symbol + '</span></div>';

        if (payment.paid !== undefined && payment.paid !== null) {
            html += _row('المدفوع:', _num(payment.paid) + ' ' + symbol);
        }
        if (payment.remaining !== undefined && payment.remaining !== null && Number(payment.remaining) > 0) {
            html += _row('الباقي:', _num(payment.remaining) + ' ' + symbol);
        }
        if (payment.method) {
            const methodLabel = payment.method === 'cash' ? '💵 نقد' :
                                payment.method === 'credit' ? '📋 آجل' :
                                payment.method === 'cod' ? '💵 عند التسليم' :
                                payment.method;
            html += _row('طريقة الدفع:', methodLabel);
        }
        if (payment.boxName) {
            html += _row('الصندوق:', payment.boxName);
        }
        if (payment.transactionNumber) {
            html += _row('رقم العملية:', payment.transactionNumber);
        }
        html += '</div>';

        // ═══ QR اختياري ═══
        if (opts.qr && inv.number) {
            const qrData = encodeURIComponent((biz.name || '') + '|' + inv.number + '|' + (totals.grandTotal || 0));
            html += '<div class="qr-wrap"><img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + qrData + '" alt="QR"></div>';
        }

        // ═══ التذييل ═══
        if (opts.footer !== false) {
            html += '<div class="footer">';
            if (opts.footerText) html += '<div>' + _esc(opts.footerText) + '</div>';
            else html += '<div>شكراً لتعاملكم معنا 🙏</div>';
            if (biz.signature) html += '<div style="margin-top:4px;">' + _esc(biz.signature) + '</div>';
            html += '<div class="small muted" style="margin-top:6px;">' + _fmtTime() + ' — ' + _fmtDate(new Date()) + '</div>';
            html += '</div>';
        }

        return html;
    }

    // ═══ الطباعة ═══
    function _print(html, autoClose) {
        const w = window.open('', '_blank', 'width=400,height=700');
        if (!w) { alert('⚠️ الرجاء السماح بالنوافذ المنبثقة'); return; }

        w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>طباعة</title><style>' + CSS + '</style></head><body>');
        w.document.write(html);
        w.document.write('<button class="no-print" onclick="window.print()">🖨️ طباعة</button>');
        w.document.write('</body></html>');
        w.document.close();

        setTimeout(() => {
            w.focus();
            w.print();
            if (autoClose !== false) {
                setTimeout(() => { try { w.close(); } catch(e) {} }, 500);
            }
        }, 400);
    }

    // ═══════════════════════════════════════════════════════
    //  🌐 PUBLIC API
    // ═══════════════════════════════════════════════════════
    window.ThermalPrint = {
        // طباعة فاتورة موحّدة
        receipt: function(data) {
            const html = _buildReceiptHTML(data);
            _print(html, data.options?.autoClose);
        },

        // فاتورة بيع عادية
        sale: function(sale, biz) {
            const currency = sale.currency || 'SYP';
            const symbol = currency === 'USD' ? '$' : 'ل.س';

            const items = (sale.items || []).map(it => ({
                materialName: it.materialName,
                qty: it.qty,
                unit: it.unit || '',
                unitPrice: it.unitPrice,
                total: it.total
            }));

            window.ThermalPrint.receipt({
                business: {
                    name: biz?.name || 'المتجر',
                    description: biz?.description || '',
                    phone: biz?.phone || '',
                    address: biz?.address || '',
                    signature: biz?.signature || ''
                },
                invoice: {
                    number: sale.invoice,
                    date: sale.date,
                    customer: sale.customer
                },
                items: items,
                totals: {
                    subtotal: sale.total,
                    grandTotal: sale.grandTotal || sale.total,
                    vat: sale.vat,
                    vatRate: sale.vatRate,
                    delivery: sale.deliveryFee,
                    discount: sale.discount,
                    symbol: symbol
                },
                payment: {
                    paid: sale.paid,
                    remaining: sale.remaining,
                    method: sale.paymentType,
                    boxName: (typeof _getBoxName === 'function') ? _getBoxName(sale.paymentBox) : '',
                    transactionNumber: sale.transactionNumber
                },
                options: {
                    docTitle: '🧾 فاتورة مبيعات',
                    qr: true,
                    footer: true,
                    footerText: 'شكراً لتعاملكم معنا 🙏'
                }
            });
        },

        // فاتورة مطعم
        restaurant: function(sale, biz) {
            const items = (sale.items || []).map(it => ({
                materialName: it.name || it.materialName,
                qty: it.qty,
                unit: '',
                unitPrice: it.price || it.unitPrice,
                total: it.total || (it.qty * (it.price || it.unitPrice || 0))
            }));

            const isDelivery = sale.isDelivery || sale.driver || sale.address;
            const tableNum = sale.tableNumber;
            const docTitle = isDelivery ? '🛵 فاتورة توصيل' : ('🪑 طاولة ' + (tableNum || '?'));

            window.ThermalPrint.receipt({
                business: {
                    name: biz?.name || 'المطعم',
                    description: biz?.description || '',
                    phone: biz?.phone || '',
                    address: biz?.address || '',
                    signature: biz?.signature || ''
                },
                invoice: {
                    number: sale.invoice,
                    date: sale.date,
                    customer: sale.customer || (isDelivery ? 'عميل توصيل' : 'زائر'),
                    tableNumber: !isDelivery ? tableNum : '',
                    driver: sale.driver || '',
                    address: sale.address || '',
                    orderType: isDelivery ? 'delivery' : 'table'
                },
                items: items,
                totals: {
                    subtotal: sale.total,
                    grandTotal: sale.grandTotal || sale.total,
                    vat: sale.vat,
                    vatRate: sale.vatRate,
                    delivery: sale.deliveryFee,
                    symbol: 'ل.س'
                },
                payment: {
                    method: sale.paymentType,
                    boxName: (typeof _getBoxName === 'function') ? _getBoxName(sale.paymentBox) : ''
                },
                options: {
                    docTitle: docTitle,
                    qr: false,
                    footer: true,
                    footerText: '🍽️ شكراً لزيارتكم'
                }
            });
        },

        // قسيمة راتب
        payroll: function(slip, biz) {
            const currency = (biz?.currency || 'SYP');
            const symbol = currency === 'USD' ? '$' : 'ل.س';

            let html = '';
            html += '<div class="center"><div class="biz-name">' + _esc(biz?.name || 'النشاط') + '</div>';
            html += '<div class="doc-title">💰 قسيمة راتب</div></div>';

            html += '<div style="font-size:12px;margin-top:6px;">';
            html += '<div><b>الموظف:</b> ' + _esc(slip.fullName || '') + '</div>';
            html += '<div><b>الوظيفة:</b> ' + _esc(slip.roleName || '—') + '</div>';
            html += '<div><b>الشهر:</b> ' + _esc(slip.monthLabel || '') + '</div>';
            html += '</div>';

            html += _line('dash');
            html += '<div class="totals">';
            html += _row('نوع الراتب:', slip.salaryType === 'daily' ? 'يومي' : slip.salaryType === 'hourly' ? 'ساعي' : 'شهري');
            html += _row('الراتب الأساسي:', _num(slip.baseSalary) + ' ' + symbol);
            html += _row('أيام العمل:', slip.workedDays + ' / ' + slip.daysInMonth);
            html += _row('الساعات:', slip.workedHours + '');
            if (Number(slip.paidLeaveDays) > 0) html += _row('إجازة مدفوعة:', slip.paidLeaveDays + ' يوم');
            if (Number(slip.unpaidLeaveDays) > 0) html += _row('إجازة بدون راتب:', slip.unpaidLeaveDays + ' يوم');

            html += _line('dash');
            html += _row('المستحق:', _num(slip.baseDue) + ' ' + symbol);
            if (Number(slip.unpaidDeduction) > 0) html += _row('خصم إجازة:', '- ' + _num(slip.unpaidDeduction) + ' ' + symbol, 'discount');
            if (Number(slip.advancesTotal) > 0) html += _row('سلف:', '- ' + _num(slip.advancesTotal) + ' ' + symbol, 'discount');

            html += '<div class="row grand"><span>الصافي</span><span>' + _num(slip.netSalary) + ' ' + symbol + '</span></div>';
            html += '</div>';

            html += '<div class="footer">';
            html += '<div style="margin-top:20px;display:flex;justify-content:space-between;font-size:11px;">';
            html += '<div style="text-align:center;"><div style="border-top:1px solid #000;width:80px;padding-top:4px;">توقيع الموظف</div></div>';
            html += '<div style="text-align:center;"><div style="border-top:1px solid #000;width:80px;padding-top:4px;">توقيع الإدارة</div></div>';
            html += '</div>';
            html += '<div class="small muted" style="margin-top:12px;">' + _fmtTime() + ' — ' + _fmtDate(new Date()) + '</div>';
            html += '</div>';

            _print(html);
        },

        // كشف رواتب جماعي
        payrollAll: function(list, monthLabel, biz) {
            let html = '';
            html += '<div class="center"><div class="biz-name">' + _esc(biz?.name || 'النشاط') + '</div>';
            html += '<div class="doc-title">💰 كشف الرواتب — ' + _esc(monthLabel) + '</div></div>';

            html += '<table style="font-size:11px;">';
            html += '<thead><tr><th>الاسم</th><th class="c">الأيام</th><th class="c">الصافي</th></tr></thead><tbody>';

            let totalNet = 0;
            list.forEach(e => {
                totalNet += e.netSalary;
                html += '<tr class="item-row"><td>' + _esc(e.fullName) + '</td><td class="c">' + e.workedDays + '/' + e.daysInMonth + '</td><td class="c bold">' + _num(e.netSalary) + '</td></tr>';
            });

            html += '</tbody></table>';
            html += '<div class="totals"><div class="row grand"><span>الإجمالي</span><span>' + _num(totalNet) + ' ل.س</span></div></div>';
            html += '<div class="footer"><div class="small muted">' + _fmtTime() + ' — ' + _fmtDate(new Date()) + '</div></div>';

            _print(html);
        },

        // 🆕 سند دين / سداد
        debt: function(debt, biz) {
            const currency = biz?.currency || 'SYP';
            const symbol = currency === 'USD' ? '$' : 'ل.س';
            const original = Number(debt.amount) || 0;
            const paid = Number(debt.paid) || 0;
            const remaining = original - paid;
            const isFullyPaid = remaining <= 0;

            let html = '';
            html += '<div class="center"><div class="biz-name">' + _esc(biz?.name || 'النشاط') + '</div>';
            html += '<div class="doc-title">' + (isFullyPaid ? '✅ سند سداد' : '📋 سند دين') + '</div></div>';

            html += '<div style="font-size:13px;margin-top:8px;">';
            html += '<div style="padding:4px 0;"><b>👤 الاسم:</b> ' + _esc(debt.name || '') + '</div>';
            if (debt.phone) html += '<div style="padding:4px 0;"><b>📞 الهاتف:</b> ' + _esc(debt.phone) + '</div>';
            html += '<div style="padding:4px 0;"><b>📅 التاريخ:</b> ' + _esc(_fmtDate(debt.date)) + '</div>';
            if (debt.description) html += '<div style="padding:4px 0;"><b>📝 البيان:</b> ' + _esc(debt.description) + '</div>';
            html += '</div>';

            html += _line('dash');

            html += '<div class="totals">';
            html += _row('القيمة الأصلية:', _num(original) + ' ' + symbol);
            html += _row('المسدد:', _num(paid) + ' ' + symbol);
            html += '<div class="row grand"><span>' + (isFullyPaid ? '✅ مسدد كاملاً' : 'الباقي') + '</span><span>' + _num(isFullyPaid ? 0 : remaining) + ' ' + symbol + '</span></div>';
            html += '</div>';

            if (debt.dueDate) {
                html += '<div style="text-align:center;font-size:12px;margin-top:8px;padding:6px;background:#fff3cd;border-radius:6px;">⏰ موعد الاستحقاق: <b>' + _esc(_fmtDate(debt.dueDate)) + '</b></div>';
            }

            html += '<div class="footer">';
            html += '<div style="display:flex;justify-content:space-between;font-size:11px;margin-top:20px;">';
            html += '<div style="text-align:center;"><div style="border-top:1px solid #000;width:90px;padding-top:4px;">توقيع الطرف الثاني</div></div>';
            html += '<div style="text-align:center;"><div style="border-top:1px solid #000;width:90px;padding-top:4px;">توقيع الطرف الأول</div></div>';
            html += '</div>';
            html += '<div class="small muted" style="margin-top:12px;">' + _fmtTime() + ' — ' + _fmtDate(new Date()) + '</div>';
            html += '</div>';

            _print(html);
        },

        // 🆕 فاتورة شراء
        purchase: function(purchase, biz) {
            const currency = biz?.currency || 'SYP';
            const symbol = currency === 'USD' ? '$' : 'ل.س';
            const items = purchase.items || [];
            const total = Number(purchase.total) || 0;
            const paid = Number(purchase.paid) || 0;
            const remaining = Number(purchase.remaining) || (total - paid);

            let html = '';
            html += '<div class="center"><div class="biz-name">' + _esc(biz?.name || 'النشاط') + '</div>';
            html += '<div class="doc-title">📥 فاتورة شراء</div></div>';

            html += '<div style="font-size:12px;margin-top:6px;">';
            html += '<div><b>رقم:</b> ' + _esc(purchase.invoice || '-') + '</div>';
            html += '<div><b>التاريخ:</b> ' + _esc(_fmtDate(purchase.date || purchase.createdAt)) + '</div>';
            if (purchase.supplierName) html += '<div><b>المورد:</b> ' + _esc(purchase.supplierName) + '</div>';
            html += '</div>';

            html += _line('dash');

            // الأصناف
            html += '<table><thead><tr>';
            html += '<th>المادة</th><th class="c">كمية</th><th class="c">سعر</th><th class="c">إجمالي</th>';
            html += '</tr></thead><tbody>';

            items.forEach(it => {
                const name = it.materialName || it.name || '—';
                const qty = it.qty || 0;
                const price = Number(it.unitPrice) || 0;
                const total = Number(it.total) || (qty * price);
                html += '<tr class="item-row">';
                html += '<td>' + _esc(name) + '</td>';
                html += '<td class="c">' + qty + (it.unit ? ' ' + _esc(it.unit) : '') + '</td>';
                html += '<td class="c">' + _num(price) + '</td>';
                html += '<td class="c bold">' + _num(total) + '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';

            html += _line('dash');

            html += '<div class="totals">';
            html += _row('عدد الأصناف:', items.length + '');
            html += '<div class="row grand"><span>الإجمالي</span><span>' + _num(total) + ' ' + symbol + '</span></div>';
            if (paid > 0) html += _row('المدفوع:', _num(paid) + ' ' + symbol);
            if (remaining > 0) html += _row('الباقي:', _num(remaining) + ' ' + symbol, 'discount');
            if (purchase.paymentMethod) html += _row('طريقة الدفع:', purchase.paymentMethod === 'cash' ? '💵 نقد' : purchase.paymentMethod === 'credit' ? '📋 آجل' : purchase.paymentMethod);
            html += '</div>';

            html += '<div class="footer">';
            html += '<div>شكراً لتعاملكم 🙏</div>';
            html += '<div class="small muted" style="margin-top:6px;">' + _fmtTime() + ' — ' + _fmtDate(new Date()) + '</div>';
            html += '</div>';

            _print(html);
        },

        // نسخ منخفضة المستوى (للحالات الخاصة)
        _build: _buildReceiptHTML,
        _print: _print,
        _esc: _esc,
        _num: _num
    };

    console.log('🖨️ [thermal-print] ready');
})();
