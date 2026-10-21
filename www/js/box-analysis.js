// ============================================================
//  📊 BOX ANALYSIS — تحليل حركة الصندوق
// ============================================================

let _boxAnalyCurrentId = null;
let _boxAnalyDays = 30;
let _boxAnalyChart = null;

// ---------- فتح صفحة التحليل ----------
function openBoxAnalysis(boxId) {
    const b = (_pbCache || []).find(x => x.id === boxId);
    if (!b) return alert('⚠️ الصندوق غير موجود');

    _boxAnalyCurrentId = boxId;
    _boxAnalyDays = 30;

    if (typeof openPage === 'function') openPage('box-analysis');
    setTimeout(() => _loadBoxAnalysis(), 200);
}

// ---------- تحميل البيانات ----------
async function _loadBoxAnalysis() {
    const b = (_pbCache || []).find(x => x.id === _boxAnalyCurrentId);
    if (!b) return;

    const container = document.getElementById('boxAnalyContent');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const uid = auth.currentUser.uid;
        const snap = await db.collection('users').doc(uid)
            .collection('box_transactions')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();

        const all = [];
        snap.forEach(d => all.push({ id: d.id, ...d.data() }));

        // فلترة حسب الصندوق
        const boxTx = all.filter(t => t.boxId === _boxAnalyCurrentId);

        // فلترة زمنية
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - _boxAnalyDays);

        const filtered = boxTx.filter(t => {
            const d = t.createdAt?.toDate?.();
            return d && d >= cutoff;
        });

        // حساب المجاميع
        const sums = {
            in: 0, out: 0,
            sales: 0, retail: 0,
            debt: 0, expense: 0,
            purchase: 0, supplierPayment: 0,
            transfer: 0,
            other: 0
        };

        filtered.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            const r = t.reason || 'other';
            if (t.type === 'in') {
                sums.in += amt;
                if (r === 'sale') sums.sales += amt;
                else if (r === 'retail') sums.retail += amt;
                else if (r === 'debt') sums.debt += amt;
                else if (r === 'transfer') sums.transfer += amt;
                else sums.other += amt;
            } else {
                sums.out += amt;
                if (r === 'expense') sums.expense += amt;
                else if (r === 'purchase') sums.purchase += amt;
                else if (r === 'supplier_payment') sums.supplierPayment += amt;
                else if (r === 'transfer') sums.transfer += amt;
                else sums.other += amt;
            }
        });

        const netFlow = sums.in - sums.out;

        // رسم بياني يومي
        await _renderBoxAnalyChart(filtered);

        // عرض
        _renderBoxAnalysis(b, sums, netFlow, filtered);
    } catch(e) {
        console.error('[boxAnaly]', e);
        container.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _boxEsc(e.message) + '</div>';
    }
}

// ---------- عرض التحليل ----------
function _renderBoxAnalysis(box, sums, netFlow, transactions) {
    const container = document.getElementById('boxAnalyContent');
    const currentBalance = parseFloat(box.balance) || 0;
    const cur = box.currency || 'SYP';

    // الرأس
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 style="margin:0;">📊 تحليل الصندوق</h2>
            <button onclick="openPage('payment-boxes')" style="padding:8px 15px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">↩️ رجوع</button>
        </div>

        <div style="background:linear-gradient(135deg,${box.color || '#3498db'},${_boxDarken(box.color || '#3498db')}); color:white; border-radius:14px; padding:20px; margin-bottom:15px; text-align:center;">
            <div style="font-size:32px; margin-bottom:6px;">${box.icon || '💰'}</div>
            <div style="font-size:20px; font-weight:bold;">${_boxEsc(box.name)}</div>
            <div style="font-size:11px; opacity:0.9; margin-top:6px;">💰 الرصيد الحالي</div>
            <div style="font-size:28px; font-weight:bold; margin-top:4px;">${_boxFmt(currentBalance)} ${cur}</div>
        </div>

        <div style="display:flex; gap:6px; justify-content:center; margin-bottom:15px; flex-wrap:wrap;">
            ${[7, 30, 90, 365].map(d => {
                const active = d === _boxAnalyDays;
                const lbl = d === 7 ? '7 أيام' : d === 30 ? 'شهر' : d === 90 ? '3 أشهر' : 'سنة';
                return `<button onclick="switchBoxAnalyPeriod(${d})" style="padding:8px 14px; border:none; border-radius:20px; cursor:pointer; font-size:12px; background:${active ? '#3498db' : '#ecf0f1'}; color:${active ? 'white' : '#555'}; font-weight:${active ? 'bold' : 'normal'};">📅 ${lbl}</button>`;
            }).join('')}
        </div>
    `;

    // ملخص
    html += `
        <div style="background:white; border-radius:12px; padding:15px; margin-bottom:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <div style="font-weight:bold; color:#2c3e50; margin-bottom:12px; font-size:15px;">📊 ملخص الحركات (آخر ${_boxAnalyDays} يوم)</div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
                <div style="background:#f0fdf4; border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:11px; color:#27ae60;">📥 الدخل</div>
                    <div style="font-size:18px; font-weight:bold; color:#27ae60; margin-top:3px;">+${_boxFmt(sums.in)}</div>
                    <div style="font-size:10px; color:#888;">${cur}</div>
                </div>
                <div style="background:#fef2f2; border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:11px; color:#e74c3c;">📤 الخرج</div>
                    <div style="font-size:18px; font-weight:bold; color:#e74c3c; margin-top:3px;">-${_boxFmt(sums.out)}</div>
                    <div style="font-size:10px; color:#888;">${cur}</div>
                </div>
            </div>

            <div style="background:${netFlow >= 0 ? '#e8f5e9' : '#fef2f2'}; border-radius:10px; padding:12px; text-align:center; margin-bottom:12px;">
                <div style="font-size:12px; color:#555;">💎 صافي التدفق</div>
                <div style="font-size:22px; font-weight:bold; color:${netFlow >= 0 ? '#27ae60' : '#e74c3c'}; margin-top:3px;">
                    ${netFlow >= 0 ? '+' : ''}${_boxFmt(netFlow)} ${cur}
                </div>
            </div>

            <div style="border-top:1px dashed #e0e0e0; padding-top:10px;">
                <div style="font-size:12px; color:#666; margin-bottom:6px;">📥 تفصيل الدخل:</div>
                ${sums.sales > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>🛒 مبيعات</span><b style="color:#27ae60;">+${_boxFmt(sums.sales)}</b></div>` : ''}
                ${sums.retail > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>🛒 بيع مفرق</span><b style="color:#27ae60;">+${_boxFmt(sums.retail)}</b></div>` : ''}
                ${sums.debt > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>👥 دفعات عملاء</span><b style="color:#27ae60;">+${_boxFmt(sums.debt)}</b></div>` : ''}
                ${sums.transfer > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>🔄 تحويلات داخلة</span><b style="color:#27ae60;">+${_boxFmt(sums.transfer)}</b></div>` : ''}
                ${sums.other > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>📋 أخرى</span><b style="color:#27ae60;">+${_boxFmt(sums.other)}</b></div>` : ''}

                <div style="font-size:12px; color:#666; margin:10px 0 6px;">📤 تفصيل الخرج:</div>
                ${sums.expense > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>💸 مصروفات</span><b style="color:#e74c3c;">-${_boxFmt(sums.expense)}</b></div>` : ''}
                ${sums.purchase > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>🛒 مشتريات</span><b style="color:#e74c3c;">-${_boxFmt(sums.purchase)}</b></div>` : ''}
                ${sums.supplierPayment > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>🏭 دفعات موردين</span><b style="color:#e74c3c;">-${_boxFmt(sums.supplierPayment)}</b></div>` : ''}
                ${sums.transfer > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>🔄 تحويلات خارجة</span><b style="color:#e74c3c;">-${_boxFmt(sums.transfer)}</b></div>` : ''}
                ${sums.other > 0 ? `<div style="display:flex; justify-content:space-between; padding:3px 0; font-size:12px;"><span>📋 أخرى</span><b style="color:#e74c3c;">-${_boxFmt(sums.other)}</b></div>` : ''}
            </div>
        </div>

        <div style="background:white; border-radius:12px; padding:15px; margin-bottom:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <div style="font-weight:bold; color:#2c3e50; margin-bottom:10px; font-size:15px;">📈 حركة الرصيد اليومية</div>
            <canvas id="boxAnalyChart" height="120"></canvas>
        </div>

        <div style="background:white; border-radius:12px; padding:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <div style="font-weight:bold; color:#2c3e50; margin-bottom:10px; font-size:15px;">📋 آخر 20 حركة</div>
            <div id="boxAnalyRecentTx">
                ${_renderRecentTx(transactions.slice(0, 20))}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ---------- آخر الحركات ----------
function _renderRecentTx(items) {
    if (!items.length) {
        return '<div style="text-align:center; color:#999; padding:20px;">لا توجد حركات</div>';
    }

    let html = '';
    items.forEach(t => {
        const date = t.createdAt?.toDate?.()?.toLocaleString('ar-SY', {dateStyle: 'short', timeStyle: 'short'}) || '-';
        const isIn = t.type === 'in';
        const sign = isIn ? '+' : '-';
        const color = isIn ? '#27ae60' : '#e74c3c';
        const bg = isIn ? '#f0fdf4' : '#fef2f2';
        const icon = isIn ? '📥' : '📤';

        html += `
        <div style="background:${bg}; border-radius:8px; padding:10px; margin-bottom:6px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="flex:1; min-width:0;">
                    <div style="font-size:12px; font-weight:bold; color:#2c3e50;">
                        ${icon} ${_boxEsc(t.reasonLabel || t.reason || 'حركة')}
                    </div>
                    <div style="font-size:10px; color:#888; margin-top:3px;">🕒 ${date}</div>
                </div>
                <div style="text-align:left; margin-right:8px;">
                    <div style="font-size:14px; font-weight:bold; color:${color};">${sign}${_boxFmt(t.amount || 0)}</div>
                    <div style="font-size:10px; color:#888;">${_boxEsc(t.currency || 'SYP')}</div>
                </div>
            </div>
        </div>`;
    });
    return html;
}

// ---------- الرسم البياني ----------
async function _renderBoxAnalyChart(transactions) {
    if (typeof Chart === 'undefined') return;

    // تجميع يومي
    const days = _boxAnalyDays;
    const groups = {};
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        groups[key] = { label: d.getDate() + '/' + (d.getMonth() + 1), balance: 0, date: key };
    }

    // أحدث رصيد معروف
    let runningBalance = 0;
    const sortedAsc = [...transactions].reverse();
    if (sortedAsc.length > 0) {
        runningBalance = parseFloat(sortedAsc[0].balanceBefore) || 0;
    }

    // حساب الحركة اليومية
    transactions.forEach(t => {
        const d = t.createdAt?.toDate?.();
        if (!d) return;
        const key = d.toISOString().slice(0, 10);
        if (groups[key]) {
            const amt = parseFloat(t.amount) || 0;
            groups[key].balance += (t.type === 'in' ? amt : -amt);
        }
    });

    // ترتيب
    const labels = [];
    const values = [];
    Object.keys(groups).sort().forEach(k => {
        labels.push(groups[k].label);
        runningBalance += groups[k].balance;
        values.push(Math.round(runningBalance));
    });

    const canvas = document.getElementById('boxAnalyChart');
    if (!canvas) return;

    if (_boxAnalyChart) {
        try { _boxAnalyChart.destroy(); } catch(e) {}
    }

    _boxAnalyChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'الرصيد',
                data: values,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52,152,219,0.15)',
                tension: 0.4,
                fill: true,
                pointRadius: 2,
                pointBackgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: v => {
                            if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1) + 'M';
                            if (Math.abs(v) >= 1000) return (v/1000).toFixed(0) + 'K';
                            return v;
                        }
                    }
                }
            }
        }
    });
}

// ---------- تبديل الفترة ----------
function switchBoxAnalyPeriod(days) {
    _boxAnalyDays = days;
    _loadBoxAnalysis();
}

// ---------- أدوات ----------
function _boxFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _boxEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function _boxDarken(hex) {
    // غامق بسيط للون
    if (!hex || hex.length < 7) return '#2c3e50';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.max(0, r - 40);
    const dg = Math.max(0, g - 40);
    const db = Math.max(0, b - 40);
    return '#' + [dr, dg, db].map(x => x.toString(16).padStart(2, '0')).join('');
}

console.log('📊 [box-analysis] جاهز');
