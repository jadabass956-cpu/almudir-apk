// ============================================================
//  💰 PROFIT ANALYTICS — الأرباح الفعلية
// ============================================================

let _paCurrentPeriod = 'today';
let _paProfitChart = null;

// ═══════════════════════════════════════════════════════════════
// 🎨 SVG Icons Helper — أيقونات Lucide في strings
// ═══════════════════════════════════════════════════════════════
const _paIcon = {
    wallet:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
    package:      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    check:        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    alert:        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    chart:        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
    trendingUp:   '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    trendingDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>',
    trophy:       '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    calendar:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-left:4px;"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
};

const PA_PERIODS = [
    { id: 'today',  label: '📅 اليوم',   days: 1   },
    { id: 'week',   label: '📅 الأسبوع', days: 7   },
    { id: 'month',  label: '📅 الشهر',   days: 30  },
    { id: 'year',   label: '📅 السنة',   days: 365 }
];

function renderProfitAnalytics() {
    const container = document.getElementById('profitAnalyticsContainer');
    if (!container) return;

    const data = _paComputeProfit(_paCurrentPeriod);
    const comparison = _paComparePrevious(_paCurrentPeriod, data);
    const insights = _paSmartInsights(_paCurrentPeriod, data, comparison);
    const topMats = _paTopProfitableMaterials(_paCurrentPeriod, 5);

    let html = `
        <h2>${_paIcon.wallet} الأرباح الفعلية</h2>
        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:15px;">
            ${PA_PERIODS.map(p => {
                const active = p.id === _paCurrentPeriod;
                return `<button onclick="switchPAPeriod('${p.id}')"
                    style="padding:8px 16px; border:none; border-radius:20px; cursor:pointer; font-size:13px;
                           background:${active ? '#27ae60' : '#ecf0f1'};
                           color:${active ? 'white' : '#555'};
                           font-weight:${active ? 'bold' : 'normal'};">
                    ${p.label}
                </button>`;
            }).join('')}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
            <div style="background:linear-gradient(135deg,#3498db,#2980b9); color:white; border-radius:12px; padding:14px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">${_paIcon.wallet} المبيعات</div>
                <div style="font-size:20px; font-weight:bold; margin-top:4px;">${_paFmt(data.totalSales)}</div>
                <div style="font-size:10px; opacity:0.85;">ل.س</div>
            </div>
            <div style="background:linear-gradient(135deg,#e74c3c,#c0392b); color:white; border-radius:12px; padding:14px; text-align:center;">
                <div style="font-size:11px; opacity:0.9;">${_paIcon.package} التكلفة</div>
                <div style="font-size:20px; font-weight:bold; margin-top:4px;">${_paFmt(data.totalCost)}</div>
                <div style="font-size:10px; opacity:0.85;">ل.س</div>
            </div>
            <div style="background:linear-gradient(135deg,#27ae60,#229954); color:white; border-radius:12px; padding:14px; text-align:center; grid-column: span 2;">
                <div style="font-size:12px; opacity:0.95;">${_paIcon.check} الربح الفعلي</div>
                <div style="font-size:28px; font-weight:bold; margin-top:4px;">${_paFmt(data.profit)} ل.س</div>
                <div style="font-size:11px; opacity:0.9; margin-top:4px;">
                    ${_paIcon.chart} الهامش: <strong>${data.margin}%</strong>
                    ${comparison.direction ? ` • ${comparison.direction} ${Math.abs(comparison.change)}% عن السابق` : ''}
                </div>
            </div>
            <div style="background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border-radius:12px; padding:14px; text-align:center; grid-column: span 2;">
                <div style="font-size:12px; opacity:0.95;">${_paIcon.wallet} الضريبة (VAT ${data.vatRate}%)</div>
                <div style="font-size:22px; font-weight:bold; margin-top:4px;">${_paFmt(data.totalVAT)} ل.س</div>
                <div style="font-size:11px; opacity:0.9; margin-top:4px;">
                    ${data.totalVAT > 0 ? 'يجب توريدها للدولة' : ('لا توجد ضريبة مطبّقة في ' + _paCountryName())}
                </div>
            </div>
        </div>
        <h3>${_paIcon.trendingUp} اتجاه الأرباح</h3>
        <div style="background:white; border-radius:12px; padding:10px; margin-bottom:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <canvas id="paProfitChart" height="120"></canvas>
        </div>
        <h3>💡 رؤى ذكية</h3>
        <div style="background:#f8f9fa; border-radius:12px; padding:15px; margin-bottom:15px; font-size:13px; line-height:1.9; color:#2c3e50;">
            ${insights.length
                ? insights.map(i => `<div style="margin-bottom:6px;">${i}</div>`).join('')
                : '<div style="color:#999;">لا توجد بيانات كافية للتحليل</div>'}
        </div>
        <h3>${_paIcon.trophy} أفضل المواد ربحاً</h3>
        <div style="background:white; border-radius:12px; padding:15px; margin-bottom:15px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            ${topMats.length
                ? topMats.map((m, i) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:${i < topMats.length-1 ? '1px solid #eee' : 'none'};">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:13px;">${i+1}. ${_paEsc(m.name)}</div>
                            <div style="font-size:11px; color:#888;">${m.qty} وحدة • هامش ${m.margin}%</div>
                        </div>
                        <div style="font-weight:bold; color:#27ae60; font-size:14px; white-space:nowrap;">+${_paFmt(m.profit)} ل.س</div>
                    </div>`).join('')
                : '<div style="text-align:center; color:#999; padding:20px;">لا توجد مبيعات في هذه الفترة</div>'}
        </div>
    `;
    container.innerHTML = html;
    setTimeout(() => _paRenderChart(_paCurrentPeriod), 100);
}

function _paComputeProfit(periodId) {
    const days = PA_PERIODS.find(p => p.id === periodId)?.days || 1;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);
    
    // 📊 استخدام AnalyticsEngine للأرقام
    if (typeof AnalyticsEngine !== 'undefined') {
        const ctx = { from: fromDate.toISOString().slice(0, 10) };
        
        const totalSales = AnalyticsEngine.get('sales.total', ctx) || 0;
        const totalCost  = AnalyticsEngine.get('sales.cogs', ctx) || 0;
        const totalVAT   = AnalyticsEngine.get('sales.vat', ctx) || 0;
        const expenses   = AnalyticsEngine.get('expenses.total', ctx) || 0;
        const disposals  = AnalyticsEngine.get('disposals.total', ctx) || 0;
        const count      = AnalyticsEngine.get('sales.count', ctx) || 0;
        
        // 💵 الربح الصافي الحقيقي
        const profit = totalSales - totalCost - expenses - disposals;
        const margin = totalSales > 0 ? Math.round((profit / totalSales) * 100) : 0;
        const vatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
        
        return { 
            totalSales, 
            totalCost, 
            totalVAT, 
            vatRate, 
            profit, 
            margin, 
            count, 
            fromDate,
            // 🆕 حقول إضافية
            expenses,
            disposals
        };
    }
    
    // 🔙 Fallback (الطريقة القديمة)
    const filtered = (typeof sales !== 'undefined' ? sales : []).filter(s => {
        const d = new Date(s.date);
        return !isNaN(d) && d >= fromDate;
    });
    let totalSales = 0, totalCost = 0, totalVAT = 0;
    filtered.forEach(s => {
        totalSales += parseFloat(s.total || s.amount || 0) || 0;
        totalVAT += parseFloat(s.vat || s.vatAmount || 0) || 0;
        if (s.totalCost !== undefined && s.totalCost > 0) {
            totalCost += parseFloat(s.totalCost);
        } else {
            (s.items || []).forEach(it => {
                let c = parseFloat(it.costAtSale || 0);
                if (!c && typeof materials !== 'undefined' && Array.isArray(materials)) {
                    const mat = materials.find(m => m.id === it.materialId);
                    if (mat) c = parseFloat((s.currency === 'USD' ? mat.costUSD : mat.costSYP) || 0);
                }
                totalCost += c * parseFloat(it.qty || 0);
            });
        }
    });
    const profit = totalSales - totalCost;
    const margin = totalSales > 0 ? Math.round((profit / totalSales) * 100) : 0;
    const vatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
    return { totalSales, totalCost, totalVAT, vatRate, profit, margin, count: filtered.length, fromDate };
}

function _paComparePrevious(periodId, current) {
    const days = PA_PERIODS.find(p => p.id === periodId)?.days || 1;
    const prevEnd = new Date();
    prevEnd.setDate(prevEnd.getDate() - days);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - (days * 2));
    prevStart.setHours(0, 0, 0, 0);
    const prevSales = (typeof sales !== 'undefined' ? sales : []).filter(s => {
        const d = new Date(s.date);
        return !isNaN(d) && d >= prevStart && d <= prevEnd;
    });
    let prevTotal = 0, prevCost = 0;
    prevSales.forEach(s => {
        prevTotal += parseFloat(s.total || 0);
        if (s.totalCost !== undefined && s.totalCost > 0) {
            prevCost += parseFloat(s.totalCost);
        } else {
            (s.items || []).forEach(it => {
                let c = parseFloat(it.costAtSale || 0);
                if (!c && typeof materials !== 'undefined') {
                    const mat = materials.find(m => m.id === it.materialId);
                    if (mat) c = parseFloat((s.currency === 'USD' ? mat.costUSD : mat.costSYP) || 0);
                }
                prevCost += c * parseFloat(it.qty || 0);
            });
        }
    });
    const prevProfit = prevTotal - prevCost;
    if (prevProfit === 0 && current.profit === 0) return { change: 0, direction: '' };
    if (prevProfit === 0) return { change: 100, direction: 'أعلى بـ' };
    const change = Math.round(((current.profit - prevProfit) / Math.abs(prevProfit)) * 100);
    return { change: Math.abs(change), direction: change >= 0 ? 'أعلى بـ' : 'أقل بـ' };
}

function _paSmartInsights(periodId, data, comparison) {
    const insights = [];
    if (data.count === 0) return ['📊 لا توجد مبيعات في هذه الفترة — ابدأ بالبيع لتظهر التحليلات.'];
    if (comparison.direction) {
        const emoji = comparison.direction.includes('أعلى') ? _paIcon.check : _paIcon.alert;
        insights.push(`${emoji} أرباحك ${comparison.direction.replace('📈 ', '').replace('📉 ', '')} <b>${comparison.change}%</b> عن الفترة السابقة.`);
    }
    if (data.margin >= 50) insights.push(`🌟 هامش ربحك ممتاز (<b>${data.margin}%</b>) — استمر على هذا النهج.`);
    else if (data.margin >= 30) insights.push(`📊 هامش ربحك جيد (<b>${data.margin}%</b>) — يمكن تحسينه بـ 5-10%.`);
    else if (data.margin > 0) insights.push(`⚠️ هامش ربحك منخفض (<b>${data.margin}%</b>) — راجع أسعار البيع أو الشراء.`);
    else insights.push(`🚨 تنبيه: أرباحك في هذه الفترة <b>سلبية</b> — راجع المصروفات والأسعار.`);
    if (data.count > 0) {
        const avg = Math.round(data.profit / data.count);
        insights.push(`${_paIcon.chart} متوسط ربح الفاتورة: <b>${_paFmt(avg)}</b> ل.س`);
    }
    // 💰 VAT
    if (data.totalVAT && data.totalVAT > 0) {
        insights.push(`${_paIcon.wallet} ضريبة VAT محصّلة: <b>${_paFmt(data.totalVAT)}</b> ل.س — يجب توريدها للدولة.`);
    }
    const top = _paTopProfitableMaterials(periodId, 1);
    if (top.length > 0) insights.push(`${_paIcon.trophy} أكثر مادة تحقق ربحاً: <b>${_paEsc(top[0].name)}</b> (${top[0].margin}% هامش)`);
    return insights;
}

function _paTopProfitableMaterials(periodId, limit) {
    const days = PA_PERIODS.find(p => p.id === periodId)?.days || 1;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    fromDate.setHours(0, 0, 0, 0);
    const map = {};
    (typeof sales !== 'undefined' ? sales : []).forEach(s => {
        const d = new Date(s.date);
        if (isNaN(d) || d < fromDate) return;
        (s.items || []).forEach(it => {
            const key = it.materialId || it.materialName;
            if (!map[key]) map[key] = { name: it.materialName || 'بدون اسم', qty: 0, sales: 0, cost: 0 };
            const qty = parseFloat(it.qty || 0);
            const unitPrice = parseFloat(it.unitPrice || 0);
            let cost = parseFloat(it.costAtSale || 0);
            if (!cost && typeof materials !== 'undefined') {
                const mat = materials.find(m => m.id === it.materialId);
                if (mat) cost = parseFloat((s.currency === 'USD' ? mat.costUSD : mat.costSYP) || 0);
            }
            map[key].qty += qty;
            map[key].sales += unitPrice * qty;
            map[key].cost += cost * qty;
        });
    });
    const arr = Object.values(map).map(m => ({
        name: m.name, qty: Math.round(m.qty),
        profit: m.sales - m.cost,
        margin: m.sales > 0 ? Math.round(((m.sales - m.cost) / m.sales) * 100) : 0
    }));
    arr.sort((a, b) => b.profit - a.profit);
    return arr.slice(0, limit || 5);
}

function _paRenderChart(periodId) {
    const canvas = document.getElementById('paProfitChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const days = PA_PERIODS.find(p => p.id === periodId)?.days || 1;
    const now = new Date();
    let groups = [];
    if (days <= 1) {
        groups = Array.from({ length: 24 }, (_, h) => ({ label: h + ':00', profit: 0 }));
        (typeof sales !== 'undefined' ? sales : []).forEach(s => {
            const d = new Date(s.date);
            if (isNaN(d)) return;
            if (d.toDateString() !== now.toDateString()) return;
            const h = d.getHours();
            if (h >= 0 && h < 24) groups[h].profit += _paSaleProfit(s);
        });
    } else {
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            groups.push({ label: d.getDate() + '/' + (d.getMonth() + 1), dateStr: d.toDateString(), profit: 0 });
        }
        (typeof sales !== 'undefined' ? sales : []).forEach(s => {
            const d = new Date(s.date);
            if (isNaN(d)) return;
            const grp = groups.find(g => g.dateStr === d.toDateString());
            if (grp) grp.profit += _paSaleProfit(s);
        });
    }
    const labels = groups.map(g => g.label);
    const data = groups.map(g => Math.round(g.profit));
    if (_paProfitChart) { try { _paProfitChart.destroy(); } catch(e) {} }
    _paProfitChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'الربح الفعلي (ل.س)',
                data: data,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39,174,96,0.15)',
                tension: 0.4, fill: true, pointRadius: 3,
                pointBackgroundColor: '#27ae60'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: v => {
                            if (v >= 1000000) return (v/1000000).toFixed(1) + 'M';
                            if (v >= 1000) return (v/1000).toFixed(0) + 'K';
                            return v;
                        }
                    }
                }
            }
        }
    });
}

function _paSaleProfit(s) {
    const total = parseFloat(s.total || 0);
    let cost = 0;
    if (s.totalCost !== undefined && s.totalCost > 0) {
        cost = parseFloat(s.totalCost);
    } else {
        (s.items || []).forEach(it => {
            let c = parseFloat(it.costAtSale || 0);
            if (!c && typeof materials !== 'undefined') {
                const mat = materials.find(m => m.id === it.materialId);
                if (mat) c = parseFloat((s.currency === 'USD' ? mat.costUSD : mat.costSYP) || 0);
            }
            cost += c * parseFloat(it.qty || 0);
        });
    }
    return total - cost;
}

function switchPAPeriod(periodId) {
    _paCurrentPeriod = periodId;
    renderProfitAnalytics();
}

function _paFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}
function _paCountryName() {
    try {
        const code = (typeof currentUser !== 'undefined' && currentUser && currentUser.country)
                   || localStorage.getItem('selectedCountry')
                   || 'SY';
        if (typeof COUNTRIES !== 'undefined' && COUNTRIES[code]) {
            return COUNTRIES[code].name || code;
        }
        const map = { SY: 'سوريا', LB: 'لبنان', JO: 'الأردن', IQ: 'العراق', TR: 'تركيا', SA: 'السعودية', AE: 'الإمارات', EG: 'مصر' };
        return map[code] || code;
    } catch(e) { return 'سوريا'; }
}

function _paEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
console.log('💰 [profit-analytics] جاهز');
