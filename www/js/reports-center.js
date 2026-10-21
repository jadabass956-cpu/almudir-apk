// ============================================================
//  📊 REPORTS CENTER — مركز التقارير الشامل
// ============================================================

// ---------- فتح الصفحة ----------
function loadReportsCenter() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const fromEl = document.getElementById('rptFrom');
    const toEl = document.getElementById('rptTo');

    if (fromEl && !fromEl.value) fromEl.value = firstDay.toISOString().slice(0, 10);
    if (toEl && !toEl.value) toEl.value = today.toISOString().slice(0, 10);

    const actions = document.getElementById('rptActions');
    if (actions) actions.style.display = 'none';

    setTimeout(() => generateFullReport(), 200);
}

// ---------- اختصارات سريعة للتاريخ ----------
function rptQuick(preset) {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    let from = '', to = fmt(today);

    if (preset === 'today') {
        from = to;
    } else if (preset === 'yesterday') {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        from = to = fmt(y);
    } else if (preset === 'week') {
        const w = new Date(today);
        const day = w.getDay();
        const diff = day === 6 ? 0 : day + 1;
        w.setDate(w.getDate() - diff);
        from = fmt(w);
    } else if (preset === 'month') {
        from = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (preset === 'year') {
        from = fmt(new Date(today.getFullYear(), 0, 1));
    } else if (preset === 'all') {
        from = '2000-01-01';
        to = '2099-12-31';
    }

    document.getElementById('rptFrom').value = from;
    document.getElementById('rptTo').value = to;
    generateFullReport();
}

// ---------- التقرير الشامل ----------
function generateFullReport() {
    const from = document.getElementById('rptFrom').value;
    const to = document.getElementById('rptTo').value;

    if (!from || !to) { alert('⚠️ اختر من وإلى تاريخ'); return; }
    if (from > to) { alert('⚠️ "من" يجب أن يكون قبل "إلى"'); return; }

    const _inRange = (d) => d && d >= from && d <= to;

    // ═══ 1) المبيعات + COGS + المواد ═══
    const _sales = (typeof sales !== 'undefined' ? sales : []).filter(s => _inRange(s.date));
    const totalSales = _sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const salesCount = _sales.length;

    let totalCOGS = 0;
    const salesByMaterial = {};
    _sales.forEach(s => {
        if (s.items && s.items.length > 0) {
            s.items.forEach(it => {
                const qty = parseFloat(it.qty) || 0;
                const cost = parseFloat(it.costAtSale) || 0;
                totalCOGS += qty * cost;
                const nm = it.materialName || '—';
                if (!salesByMaterial[nm]) salesByMaterial[nm] = { qty: 0, revenue: 0 };
                salesByMaterial[nm].qty += qty;
                salesByMaterial[nm].revenue += parseFloat(it.total) || (qty * (parseFloat(it.unitPrice) || 0));
            });
        } else if (s.materialName) {
            const qty = parseFloat(s.qty) || 0;
            const cost = parseFloat(s.costAtSale) || 0;
            totalCOGS += qty * cost;
            if (!salesByMaterial[s.materialName]) salesByMaterial[s.materialName] = { qty: 0, revenue: 0 };
            salesByMaterial[s.materialName].qty += qty;
            salesByMaterial[s.materialName].revenue += parseFloat(s.total) || 0;
        }
    });

    // ═══ 2) المصروفات ═══
    const _expenses = (typeof expenses !== 'undefined' ? expenses : []).filter(e => _inRange(e.date));
    const totalExpenses = _expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const expensesCount = _expenses.length;

    // ═══ 3) مسحوبات المالك ═══
    const _owner = (typeof ownerWithdrawals !== 'undefined' ? ownerWithdrawals : []).filter(w => _inRange(w.date));
    const totalOwner = _owner.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    const ownerCount = _owner.length;

    // ═══ 4) الإتلافات ═══
    const _dsp = (typeof disposals !== 'undefined' ? disposals : []).filter(d => _inRange(d.date));
    const totalDsp = _dsp.reduce((sum, d) => sum + (parseFloat(d.totalLoss) || 0), 0);
    const dspCount = _dsp.length;

    // ═══ 5) المشتريات ═══
    // ⚠️ المشتريات تُحمَّل من Firestore (async) — نبدأ بمصفوفة فارغة
    const _pur = [];
    const totalPur = _pur.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const purCount = _pur.length;

    // ═══ 6) الربح ═══
    const profit = totalSales - totalExpenses - totalCOGS - totalDsp;
    const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    // ═══ 7) عرض البطاقات ═══
    const fmt = (n) => typeof formatCurrency === 'function'
        ? formatCurrency(n)
        : `${Number(n).toLocaleString('ar-SY')} ل.س`;

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    setTxt('rptSales', fmt(totalSales));
    setTxt('rptSalesCount', salesCount + ' فاتورة');
    setTxt('rptExpenses', fmt(totalExpenses));
    setTxt('rptExpensesCount', expensesCount + ' عملية');
    setTxt('rptOwner', fmt(totalOwner));
    setTxt('rptOwnerCount', ownerCount + ' عملية');
    setTxt('rptDisposals', fmt(totalDsp));
    setTxt('rptDisposalsCount', dspCount + ' عملية');
    setTxt('rptPurchases', fmt(totalPur));
    setTxt('rptPurchasesCount', purCount + ' فاتورة');
    setTxt('rptCOGS', fmt(totalCOGS));
    setTxt('rptProfit', fmt(profit));
    setTxt('rptMargin', 'هامش: ' + margin.toFixed(1) + '%');

    const profitEl = document.getElementById('rptProfit');
    if (profitEl) {
        const parent = profitEl.closest('.rpt-card');
        if (parent) {
            parent.style.background = profit >= 0
                ? 'linear-gradient(135deg, #27ae60, #229954)'
                : 'linear-gradient(135deg, #c0392b, #8e44ad)';
        }
    }

    // ═══ 8) Accordions ═══
    const _fmtD = (d) => typeof formatDate === 'function' ? formatDate(d) : d;

    // 🛍️ المبيعات
    setTxt('rptAccSales', `(${salesCount})`);
    let html = '<tr><th>التاريخ</th><th>الفاتورة</th><th>العميل</th><th>المبلغ</th></tr>';
    _sales.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(s => {
        html += `<tr><td>${_fmtD(s.date)}</td><td>${_rptEsc(s.invoice || '—')}</td><td>${_rptEsc(s.customer || '—')}</td><td>${fmt(s.total)}</td></tr>`;
    });
    if (salesCount === 0) html += '<tr><td colspan="4" style="text-align:center; color:#999; padding:15px;">لا مبيعات في هذه الفترة</td></tr>';
    document.getElementById('rptTblSales').innerHTML = html;

    // 💸 المصروفات
    setTxt('rptAccExp', `(${expensesCount})`);
    html = '<tr><th>التاريخ</th><th>التصنيف</th><th>البيان</th><th>المبلغ</th></tr>';
    _expenses.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(e => {
        html += `<tr><td>${_fmtD(e.date)}</td><td>${_rptEsc(e.category || '—')}</td><td>${_rptEsc(e.desc || '—')}</td><td>${fmt(e.amount)}</td></tr>`;
    });
    if (expensesCount === 0) html += '<tr><td colspan="4" style="text-align:center; color:#999; padding:15px;">لا مصروفات في هذه الفترة</td></tr>';
    document.getElementById('rptTblExp').innerHTML = html;

    // 💼 مسحوبات المالك
    const OW_CAT = (typeof OW_CATEGORIES !== 'undefined') ? OW_CATEGORIES : {};
    setTxt('rptAccOwner', `(${ownerCount})`);
    html = '<tr><th>التاريخ</th><th>البيان</th><th>الفئة</th><th>المبلغ</th></tr>';
    _owner.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(w => {
        html += `<tr><td>${_fmtD(w.date)}</td><td>${_rptEsc(w.desc || '—')}</td><td>${OW_CAT[w.category] || w.category || '—'}</td><td>${fmt(w.amount)}</td></tr>`;
    });
    if (ownerCount === 0) html += '<tr><td colspan="4" style="text-align:center; color:#999; padding:15px;">لا مسحوبات في هذه الفترة</td></tr>';
    document.getElementById('rptTblOwner').innerHTML = html;

    // 📦 الإتلافات
    const DSP_R = (typeof DSP_REASONS !== 'undefined') ? DSP_REASONS : {};
    setTxt('rptAccDsp', `(${dspCount})`);
    html = '<tr><th>التاريخ</th><th>المادة</th><th>الكمية</th><th>السبب</th><th>الخسارة</th></tr>';
    _dsp.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(d => {
        html += `<tr><td>${_fmtD(d.date)}</td><td>${_rptEsc(d.materialName || '—')}</td><td>${d.qty} ${_rptEsc(d.unit || '')}</td><td>${DSP_R[d.reason] || d.reason || '—'}</td><td>${fmt(d.totalLoss)}</td></tr>`;
    });
    if (dspCount === 0) html += '<tr><td colspan="5" style="text-align:center; color:#999; padding:15px;">لا إتلافات في هذه الفترة</td></tr>';
    document.getElementById('rptTblDsp').innerHTML = html;

    // 🛒 المشتريات
    setTxt('rptAccPur', `(${purCount})`);
    html = '<tr><th>التاريخ</th><th>الفاتورة</th><th>المورد</th><th>الإجمالي</th></tr>';
    _pur.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(p => {
        html += `<tr><td>${_fmtD(p.date)}</td><td>${_rptEsc(p.invoice || '—')}</td><td>${_rptEsc(p.supplierName || '—')}</td><td>${fmt(p.total)}</td></tr>`;
    });
    if (purCount === 0) html += '<tr><td colspan="4" style="text-align:center; color:#999; padding:15px;">لا مشتريات في هذه الفترة</td></tr>';
    document.getElementById('rptTblPur').innerHTML = html;

    // 🏆 أفضل المواد
    const topMat = Object.entries(salesByMaterial)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    setTxt('rptAccTop', `(${topMat.length})`);
    html = '<tr><th>المادة</th><th>الكمية</th><th>الإيرادات</th></tr>';
    topMat.forEach(t => {
        html += `<tr><td>${_rptEsc(t.name)}</td><td>${t.qty}</td><td>${fmt(t.revenue)}</td></tr>`;
    });
    if (topMat.length === 0) html += '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">لا بيانات</td></tr>';
    document.getElementById('rptTblTop').innerHTML = html;

    // 🏪 أفضل العملاء
    const byCustomer = {};
    _sales.forEach(s => {
        const cn = (s.customer || '').trim() || 'بدون اسم';
        if (!byCustomer[cn]) byCustomer[cn] = { count: 0, total: 0 };
        byCustomer[cn].count++;
        byCustomer[cn].total += parseFloat(s.total) || 0;
    });
    const topCust = Object.entries(byCustomer)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    setTxt('rptAccCust', `(${topCust.length})`);
    html = '<tr><th>العميل</th><th>عدد الفواتير</th><th>الإجمالي</th></tr>';
    topCust.forEach(c => {
        html += `<tr><td>${_rptEsc(c.name)}</td><td>${c.count}</td><td>${fmt(c.total)}</td></tr>`;
    });
    if (topCust.length === 0) html += '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">لا بيانات</td></tr>';
    document.getElementById('rptTblCust').innerHTML = html;

    // 🛒 المشتريات (async من Firestore)
    _loadPurchasesAsync(from, to, _fmtD, fmt);

    // 🔀 التحويلات
    const _trList = _arr(transfers).filter(t => _inRange(t.date, from, to));
    setTxt('rptAccTransfers', `(${_trList.length})`);
    let _trHtml = '<tr><th>التاريخ</th><th>المادة</th><th>من</th><th>إلى</th><th>الكمية</th></tr>';
    _trList.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(t => {
        _trHtml += `<tr>
            <td>${_fmtD(t.date)}</td>
            <td>${_rptEsc(t.materialName || '—')}</td>
            <td>${_rptEsc(t.fromWhName || '—')}</td>
            <td>${_rptEsc(t.toWhName || '—')}</td>
            <td>${t.qty} ${_rptEsc(t.unit || '')}</td>
        </tr>`;
    });
    if (_trList.length === 0) _trHtml += '<tr><td colspan="5" style="text-align:center; color:#999; padding:15px;">لا تحويلات في هذه الفترة</td></tr>';
    const _trTbl = document.getElementById('rptTblTransfers');
    if (_trTbl) _trTbl.innerHTML = _trHtml;

    // 🏠 توزيع المخزون
    const _whList = _arr(warehouses);
    setTxt('rptAccWh', `(${_whList.length})`);
    let _whHtml = '<tr><th>المستودع</th><th>عدد المواد</th><th>قيمة المخزون</th></tr>';
    _whList.forEach(w => {
        let items = 0, value = 0;
        _arr(materials).forEach(m => {
            const qty = parseFloat(m.stockByWarehouse?.[w.id]) || 0;
            if (qty > 0) {
                items++;
                const cost = parseFloat(m.costSYP) || parseFloat(m.cost) || 0;
                value += qty * cost;
            }
        });
        _whHtml += `<tr>
            <td>${w.icon || '🏠'} ${_rptEsc(w.name)}${w.isDefault ? ' ⭐' : ''}</td>
            <td>${items}</td>
            <td>${fmt(value)}</td>
        </tr>`;
    });
    if (_whList.length === 0) _whHtml += '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">لا مستودعات</td></tr>';
    const _whTbl = document.getElementById('rptTblWh');
    if (_whTbl) _whTbl.innerHTML = _whHtml;

    // 💳 حركات الصناديق (async)
    _loadBoxTransactions(from, to, _fmtD, fmt);

    // إظهار أزرار التصدير
    if (actions) actions.style.display = 'flex';

    if (typeof showToast === 'function') showToast('✅ تم إنشاء التقرير', 'success');
}

// ---------- تحميل المشتريات من Firestore (async) ----------
async function _loadPurchasesAsync(from, to, _fmtD, fmt) {
    const tbl = document.getElementById('rptTblPur');
    const acc = document.getElementById('rptAccPur');
    if (!tbl || !acc) return;

    if (!auth.currentUser) return;

    try {
        const uid = auth.currentUser.uid;
        const snap = await db.collection('users').doc(uid)
            .collection('purchases')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();

        const list = [];
        let total = 0;
        snap.forEach(doc => {
            const p = doc.data();
            // التاريخ: نُفضّل createdAt، نتراجع إلى p.date
            let dt = '';
            if (p.createdAt && p.createdAt.toDate) {
                dt = p.createdAt.toDate().toISOString().slice(0, 10);
            } else if (p.date) {
                dt = p.date;
            }
            if (dt && dt >= from && dt <= to) {
                list.push({ ...p, _date: dt });
                total += parseFloat(p.total) || 0;
            }
        });

        // تحديث البطاقة
        const totalEl = document.getElementById('rptPurchases');
        const countEl = document.getElementById('rptPurchasesCount');
        if (totalEl) totalEl.textContent = fmt(total);
        if (countEl) countEl.textContent = list.length + ' فاتورة';

        // تحديث الجدول
        acc.textContent = `(${list.length})`;
        let html = '<tr><th>التاريخ</th><th>الفاتورة</th><th>المورد</th><th>الإجمالي</th></tr>';
        list.forEach(p => {
            html += `<tr>
                <td>${_fmtD(p._date)}</td>
                <td>${_rptEsc(p.invoice || '—')}</td>
                <td>${_rptEsc(p.supplierName || '—')}</td>
                <td>${fmt(p.total)}</td>
            </tr>`;
        });
        if (list.length === 0) {
            html += '<tr><td colspan="4" style="text-align:center; color:#999; padding:15px;">لا مشتريات في هذه الفترة</td></tr>';
        }
        tbl.innerHTML = html;

        // ⚠️ إعادة حساب الربح (لأن COGS قد تتأثر لو أردنا ربط المشتريات لاحقاً)
        // (نتركه للنسخة القادمة — الربح حالياً مبني على COGS من الفواتير)

        console.log(`🛒 [rpt] حُمّل ${list.length} مشتريات بمبلغ ${total}`);
    } catch (e) {
        console.warn('[rpt] purchases load failed:', e.message);
        acc.textContent = '(غير متاح)';
        tbl.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:15px;">تعذّر تحميل المشتريات</td></tr>';
    }
}

// ---------- تحميل حركات الصناديق ----------
async function _loadBoxTransactions(from, to, _fmtD, fmt) {
    const tbl = document.getElementById('rptTblBox');
    const acc = document.getElementById('rptAccBox');
    if (!tbl || !acc) return;

    if (!auth.currentUser) return;

    try {
        const uid = auth.currentUser.uid;
        const snap = await db.collection('users').doc(uid)
            .collection('box_transactions')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();

        const txs = [];
        snap.forEach(doc => {
            const t = doc.data();
            const dt = t.createdAt && t.createdAt.toDate
                ? t.createdAt.toDate().toISOString().slice(0, 10)
                : (t.date || '');
            if (dt && dt >= from && dt <= to) txs.push({ ...t, _date: dt });
        });

        acc.textContent = `(${txs.length})`;
        let html = '<tr><th>التاريخ</th><th>الصندوق</th><th>النوع</th><th>المبلغ</th><th>الرصيد بعد</th></tr>';
        txs.slice(0, 100).forEach(t => {
            const typeLbl = t.type === 'in' ? '📥 وارد' : '📤 صادر';
            const color = t.type === 'in' ? '#27ae60' : '#e74c3c';
            html += `<tr>
                <td>${_fmtD(t._date)}</td>
                <td>${_rptEsc((t.boxIcon || '💰') + ' ' + (t.boxName || '—'))}</td>
                <td style="color:${color};">${typeLbl}</td>
                <td style="color:${color}; font-weight:bold;">${fmt(t.amount)}</td>
                <td>${fmt(t.balanceAfter)}</td>
            </tr>`;
        });
        if (txs.length === 0) html += '<tr><td colspan="5" style="text-align:center; color:#999; padding:15px;">لا حركات في هذه الفترة</td></tr>';
        tbl.innerHTML = html;
    } catch (e) {
        console.warn('[rpt] box tx failed:', e.message);
        acc.textContent = '(غير متاح)';
        tbl.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:15px;">تعذّر تحميل حركات الصناديق</td></tr>';
    }
}

// ---------- 🖨️ طباعة ----------
function rptPrint() {
    const from = document.getElementById('rptFrom').value;
    const to = document.getElementById('rptTo').value;

    const w = window.open('', '_blank');
    if (!w) { alert('⚠️ يجب السماح بالنوافذ المنبثقة'); return; }

    const content = document.getElementById('reports').cloneNode(true);
    const act = content.querySelector('#rptActions'); if (act) act.remove();
    content.querySelectorAll('details').forEach(d => d.setAttribute('open', ''));

    const userName = (typeof currentUser !== 'undefined' && currentUser ? currentUser.fullName : '') || '';
    const bizName = (typeof currentUser !== 'undefined' && currentUser ? currentUser.businessName : '') || '';

    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>تقرير ${from} → ${to}</title>
<style>
* { font-family: 'Segoe UI', Tahoma, Arial; }
body { padding: 20px; color: #222; }
h1 { text-align: center; color: #2c3e50; margin-bottom: 6px; }
.hdr { text-align: center; color: #666; font-size: 14px; margin-bottom: 20px; }
.rpt-card { background: #f8f9fa !important; color: #222 !important; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px; }
#rptCards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
details { background: #f8f9fa !important; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #eee; }
summary { font-weight: bold; padding: 4px 0; }
table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
th, td { padding: 6px 8px; border: 1px solid #ddd; text-align: right; }
th { background: #2c3e50; color: white; }
@media print { body { padding: 0; } }
</style></head><body>
<h1>📊 تقرير شامل</h1>
<div class="hdr">${bizName ? bizName + ' • ' : ''}${userName ? 'المالك: ' + userName : ''}<br>📅 من ${from} إلى ${to}</div>
${content.innerHTML}
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

// ---------- 📸 PNG ----------
async function rptExportPNG() {
    if (typeof html2canvas !== 'function') {
        alert('⚠️ مكتبة html2canvas غير محمّلة');
        return;
    }

    const target = document.getElementById('reports');
    if (!target) return;

    const actions = document.getElementById('rptActions');
    const oldDisplay = actions ? actions.style.display : '';
    if (actions) actions.style.display = 'none';

    try {
        if (typeof showToast === 'function') showToast('⏳ جاري التصدير...', 'info');

        const canvas = await html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
        });

        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const from = document.getElementById('rptFrom').value;
            const to = document.getElementById('rptTo').value;
            a.href = url;
            a.download = `تقرير_${from}_${to}.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            if (typeof showToast === 'function') showToast('✅ تم التصدير', 'success');
        });
    } catch (e) {
        console.warn('[rpt] PNG:', e.message);
        alert('⚠️ فشل التصدير: ' + e.message);
    } finally {
        if (actions) actions.style.display = oldDisplay;
    }
}

// ---------- 💬 واتساب ----------
function rptWhatsApp() {
    const from = document.getElementById('rptFrom').value;
    const to = document.getElementById('rptTo').value;
    const g = (id) => (document.getElementById(id) || {}).textContent || '0';

    const txt =
`📊 *تقرير شامل*
📅 من ${from} إلى ${to}

💰 المبيعات: ${g('rptSales')} (${g('rptSalesCount')})
💸 المصروفات: ${g('rptExpenses')} (${g('rptExpensesCount')})
💼 مسحوبات المالك: ${g('rptOwner')}
📦 الإتلافات: ${g('rptDisposals')}
🛒 المشتريات: ${g('rptPurchases')}
📦 تكلفة المُباع: ${g('rptCOGS')}

💵 *صافي الربح: ${g('rptProfit')}*
📈 ${g('rptMargin')}`;

    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}

// ---------- أداة ----------
function _rptEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}


// ═══════════════════════════════════════════════════════════
//  📤 دوال التصدير (Excel / PDF / CSV / PNG)
// ═══════════════════════════════════════════════════════════

// ---------- استخراج بيانات accordion معيّن ----------
function _rptGetSectionData(key) {
    const map = {
        sales: { tableId: 'rptTblSales', title: 'المبيعات',     fileName: 'المبيعات' },
        exp:   { tableId: 'rptTblExp',   title: 'المصروفات',    fileName: 'المصروفات' },
        owner: { tableId: 'rptTblOwner', title: 'مسحوبات المالك', fileName: 'مسحوبات_المالك' },
        dsp:   { tableId: 'rptTblDsp',   title: 'الإتلافات',    fileName: 'الإتلافات' },
        pur:   { tableId: 'rptTblPur',   title: 'المشتريات',    fileName: 'المشتريات' },
        top:   { tableId: 'rptTblTop',   title: 'أفضل المواد',  fileName: 'افضل_المواد' },
        cust:  { tableId: 'rptTblCust',  title: 'أفضل العملاء', fileName: 'افضل_العملاء' },
        box:   { tableId: 'rptTblBox',   title: 'حركات الصناديق', fileName: 'حركات_الصناديق' },
        transfers: { tableId: 'rptTblTransfers', title: 'التحويلات', fileName: 'التحويلات' },
        wh:    { tableId: 'rptTblWh',    title: 'توزيع المخزون', fileName: 'المستودعات' }
    };
    const info = map[key];
    if (!info) return null;

    // استخراج البيانات من DOM
    const data = (typeof extractTableData === 'function')
        ? extractTableData(info.tableId)
        : { columns: [], rows: [] };

    return { ...info, ...data, key };
}

// ---------- تصدير accordion واحد ----------
function rptExportSection(key, label) {
    const section = _rptGetSectionData(key);
    if (!section) {
        alert('⚠️ القسم غير معروف');
        return;
    }
    if (section.rows.length === 0) {
        alert('⚠️ لا توجد بيانات في هذا القسم');
        return;
    }

    const from = document.getElementById('rptFrom').value;
    const to   = document.getElementById('rptTo').value;

    if (typeof openExportMenu === 'function') {
        openExportMenu({
            title: `${label} (${from} → ${to})`,
            columns: section.columns,
            rows: section.rows,
            elementId: section.tableId,
            filename: `${section.fileName}_${from}_${to}`
        });
    } else {
        alert('⚠️ نظام التصدير غير محمّل');
    }
}

// ---------- تصدير البطاقات (ملخص) ----------
function rptExportSummary(type) {
    const from = document.getElementById('rptFrom').value;
    const to   = document.getElementById('rptTo').value;

    const g = (id) => (document.getElementById(id) || {}).textContent || '0';

    const columns = ['البند', 'القيمة', 'التفاصيل'];
    const rows = [
        ['💰 إجمالي المبيعات', g('rptSales'), g('rptSalesCount')],
        ['💸 المصروفات', g('rptExpenses'), g('rptExpensesCount')],
        ['💼 مسحوبات المالك', g('rptOwner'), g('rptOwnerCount')],
        ['📦 الإتلافات', g('rptDisposals'), g('rptDisposalsCount')],
        ['🛒 المشتريات', g('rptPurchases'), g('rptPurchasesCount')],
        ['📦 تكلفة المُباع', g('rptCOGS'), 'تكلفة المواد المُباعة'],
        ['💵 صافي الربح', g('rptProfit'), g('rptMargin')]
    ];

    const meta = [
        ['التقرير', 'ملخص شامل'],
        ['من تاريخ', from],
        ['إلى تاريخ', to],
        ['تاريخ الإنشاء', new Date().toLocaleString('ar-SY')]
    ];

    if (type === 'excel' && typeof exportToExcel === 'function') {
        exportToExcel({
            filename: `ملخص_${from}_${to}`,
            sheets: [
                { name: 'المعلومات', data: meta, cols: [{ wch: 20 }, { wch: 25 }] },
                { name: 'الملخص', data: [columns, ...rows], cols: [{ wch: 25 }, { wch: 20 }, { wch: 20 }] }
            ]
        });
    } else if (type === 'pdf' && typeof exportToPDF === 'function') {
        exportToPDF({
            filename: `ملخص_${from}_${to}`,
            title: 'ملخص شامل',
            columns,
            rows,
            meta: { subtitle: `${from} → ${to}`, date: new Date().toLocaleDateString('ar-SY') }
        });
    } else if (type === 'csv' && typeof exportToCSV === 'function') {
        exportToCSV({
            filename: `ملخص_${from}_${to}`,
            data: [columns, ...rows]
        });
    }
}

// ---------- تصدير التقرير الكامل (Excel متعدد الأوراق) ----------
function rptExportFull() {
    if (typeof exportToExcel !== 'function') {
        alert('⚠️ نظام التصدير غير محمّل');
        return;
    }

    const from = document.getElementById('rptFrom').value;
    const to   = document.getElementById('rptTo').value;
    const g = (id) => (document.getElementById(id) || {}).textContent || '0';

    // ═══ 1) ورقة المعلومات ═══
    const infoData = [
        ['التقرير الشامل — المدير AI'],
        [],
        ['من تاريخ', from],
        ['إلى تاريخ', to],
        ['تاريخ الإنشاء', new Date().toLocaleString('ar-SY')],
        [],
        ['📊 ملخص البطاقات'],
        ['البند', 'القيمة', 'التفاصيل'],
        ['💰 إجمالي المبيعات', g('rptSales'), g('rptSalesCount')],
        ['💸 المصروفات', g('rptExpenses'), g('rptExpensesCount')],
        ['💼 مسحوبات المالك', g('rptOwner'), g('rptOwnerCount')],
        ['📦 الإتلافات', g('rptDisposals'), g('rptDisposalsCount')],
        ['🛒 المشتريات', g('rptPurchases'), g('rptPurchasesCount')],
        ['📦 تكلفة المُباع', g('rptCOGS'), ''],
        ['💵 صافي الربح', g('rptProfit'), g('rptMargin')]
    ];

    // ═══ 2) بناء الأوراق من الـ accordions ═══
    const sections = ['sales', 'exp', 'owner', 'dsp', 'pur', 'top', 'cust', 'box', 'transfers', 'wh'];
    const sheets = [
        { name: 'المعلومات', data: infoData, cols: [{ wch: 25 }, { wch: 20 }, { wch: 20 }] }
    ];

    sections.forEach(key => {
        const s = _rptGetSectionData(key);
        if (s && s.rows.length > 0) {
            // اسم الورقة في Excel: حد أقصى 31 حرف، بلا رموز خاصة
            const sheetName = s.fileName.replace(/[\/*?:\[\]]/g, '').substring(0, 31);
            sheets.push({
                name: sheetName,
                data: [s.columns, ...s.rows],
                cols: s.columns.map((c, i) => ({
                    wch: i === 0 ? 20 : Math.max(12, String(c).length + 5)
                }))
            });
        }
    });

    exportToExcel({
        filename: `تقرير_شامل_${from}_${to}`,
        sheets
    });

    if (typeof showToast === 'function') {
        showToast(`✅ تم تصدير ${sheets.length} ورقة Excel`, 'success');
    }
}


// ---------- تصدير ----------
window.loadReportsCenter = loadReportsCenter;
window.generateFullReport = generateFullReport;
window.rptQuick = rptQuick;
window.rptPrint = rptPrint;
window.rptExportPNG = rptExportPNG;
window.rptWhatsApp = rptWhatsApp;
window.rptExportSection = rptExportSection;
window.rptExportFull = rptExportFull;
window.rptExportSummary = rptExportSummary;
window._rptGetSectionData = _rptGetSectionData;
window._loadPurchasesAsync = _loadPurchasesAsync;

console.log('📊 [rpt] reports-center.js محمّل');
