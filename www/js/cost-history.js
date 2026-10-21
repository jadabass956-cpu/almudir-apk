// ============================================================
//  📈 COST HISTORY — تقرير التكلفة التاريخي
// ============================================================

// ---------- فتح الصفحة ----------
function loadCostHistoryPage() {
    chRenderMaterialsList();
}

// ---------- عرض قائمة المواد ----------
function chRenderMaterialsList(filterText = '') {
    const list = document.getElementById('chMaterialsList');
    if (!list) return;

    const mats = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
    if (mats.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مواد بعد</div>';
        return;
    }

    // فلترة
    const q = (filterText || '').trim().toLowerCase();
    const filtered = q
        ? mats.filter(m => (m.name || '').toLowerCase().includes(q) || String(m.barcode || '').includes(q))
        : mats;

    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا نتائج للبحث</div>';
        return;
    }

    // ترتيب حسب عدد السجلات تنازلياً (الأكثر تغيّراً أولاً)
    const sorted = [...filtered].sort((a, b) => {
        const ha = (a.costHistory || []).length;
        const hb = (b.costHistory || []).length;
        if (ha !== hb) return hb - ha;
        return (a.name || '').localeCompare(b.name || '');
    });

    let html = '';
    sorted.forEach(m => {
        const cost = parseFloat(m.costSYP) || 0;
        const stock = parseFloat(m.stock) || 0;
        const historyLen = (m.costHistory || []).length;
        const saleSYP = parseFloat(m.saleSYP) || 0;
        const margin = saleSYP > 0 && cost > 0 ? ((saleSYP - cost) / saleSYP * 100) : 0;

        // تغيّر آخر تكلفة
        let lastChange = 0;
        if (historyLen > 0) {
            const last = m.costHistory[historyLen - 1];
            lastChange = parseFloat(last.costChange) || 0;
        }
        const changeColor = lastChange > 0 ? '#e74c3c' : (lastChange < 0 ? '#27ae60' : '#95a5a6');
        const changeIcon = lastChange > 0 ? '🔺' : (lastChange < 0 ? '🔻' : '➖');
        const changeTxt = lastChange !== 0 ? `${changeIcon} ${lastChange.toFixed(1)}%` : '—';

        html += `
        <div onclick="chOpenDetails(${m.id})" style="
            display:flex; align-items:center; gap:10px;
            padding:12px 14px; border-bottom:1px solid #f0f0f0;
            cursor:pointer; transition:background 0.2s;
            " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
            
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; color:#2c3e50; font-size:14px; margin-bottom:3px;">
                    📦 ${_chEsc(m.name || '—')}
                </div>
                <div style="font-size:11px; color:#888;">
                    المخزون: ${stock.toFixed(0)} ${_chEsc(m.unit || '')} • 
                    سجلات التاريخ: ${historyLen}
                </div>
            </div>

            <div style="text-align:left; min-width:80px;">
                <div style="font-weight:bold; color:#2980b9; font-size:14px;">${cost.toFixed(2)}</div>
                <div style="font-size:10px; color:#888;">ل.س</div>
            </div>

            <div style="text-align:center; min-width:70px; color:${changeColor}; font-weight:bold; font-size:12px;">
                ${changeTxt}
            </div>

            <div style="color:#2980b9; font-size:18px;">›</div>
        </div>`;
    });

    list.innerHTML = html;
}

// ---------- فلترة بالمواد ----------
function chFilterMaterials() {
    const q = document.getElementById('chSearch')?.value || '';
    chRenderMaterialsList(q);
}

// ---------- فتح تفاصيل مادة ----------
function chOpenDetails(materialId) {
    const m = materials.find(x => x.id === materialId);
    if (!m) { alert('⚠️ المادة غير موجودة'); return; }

    const cost = parseFloat(m.costSYP) || 0;
    const stock = parseFloat(m.stock) || 0;
    const saleSYP = parseFloat(m.saleSYP) || 0;
    const margin = saleSYP > 0 && cost > 0 ? ((saleSYP - cost) / saleSYP * 100) : 0;

    // بناء قائمة التاريخ
    const history = (m.costHistory || []).slice().sort((a, b) => {
        return (b.date || '').localeCompare(a.date || '');
    });

    let historyHtml = '';
    if (history.length === 0) {
        historyHtml = '<div style="text-align:center; color:#999; padding:20px; font-size:13px;">لا يوجد سجل تاريخي بعد — سيُسجَّل تلقائياً من أول شراء جديد</div>';
    } else {
        historyHtml = `
        <div class="table-responsive" style="margin-top:8px;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <tr style="background:#34495e; color:white;">
                    <th style="padding:6px;">التاريخ</th>
                    <th style="padding:6px;">سعر الشراء</th>
                    <th style="padding:6px;">المتوسط</th>
                    <th style="padding:6px;">الكمية</th>
                    <th style="padding:6px;">المصدر</th>
                    <th style="padding:6px;">التغيير</th>
                </tr>`;
        history.forEach(h => {
            const src = _chSourceLabel(h.source);
            const chg = parseFloat(h.costChange) || 0;
            const chgColor = chg > 0 ? '#e74c3c' : (chg < 0 ? '#27ae60' : '#95a5a6');
            const chgTxt = chg !== 0 ? `${chg > 0 ? '+' : ''}${chg.toFixed(1)}%` : '—';
            historyHtml += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:6px; text-align:center;">${h.date || '—'}</td>
                    <td style="padding:6px; text-align:center; font-weight:600;">${(parseFloat(h.cost) || 0).toFixed(2)}</td>
                    <td style="padding:6px; text-align:center; color:#2980b9;">${(parseFloat(h.avgCost) || 0).toFixed(2)}</td>
                    <td style="padding:6px; text-align:center;">${h.qty || 0}</td>
                    <td style="padding:6px; text-align:center; font-size:11px;">${src}</td>
                    <td style="padding:6px; text-align:center; color:${chgColor}; font-weight:bold;">${chgTxt}</td>
                </tr>`;
        });
        historyHtml += '</table></div>';
    }

    // مقارنة الموردين
    const supplierHtml = chBuildSupplierComparison(m);

    // اقتراح سعر البيع
    const suggestionHtml = chBuildPriceSuggestion(m, cost, saleSYP);

    // بناء Modal
    const modal = document.createElement('div');
    modal.id = 'chDetailsModal';
    modal.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.55); z-index:10000;
        display:flex; align-items:flex-start; justify-content:center;
        padding:20px; overflow-y:auto;
    `;
    modal.onclick = (e) => { if (e.target === modal) chCloseDetails(); };

    modal.innerHTML = `
    <div style="
        background:white; border-radius:14px; padding:20px;
        max-width:640px; width:100%; margin:auto;
        box-shadow:0 10px 40px rgba(0,0,0,0.3);
    ">
        <!-- رأس -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
            <div>
                <h2 style="margin:0; color:#2c3e50; font-size:18px;">📦 ${_chEsc(m.name)}</h2>
                <div style="font-size:12px; color:#888; margin-top:3px;">
                    ${m.barcode ? 'باركود: ' + _chEsc(m.barcode) : ''}
                    ${m.unit ? ' • الوحدة: ' + _chEsc(m.unit) : ''}
                </div>
            </div>
            <button onclick="chCloseDetails()" style="
                background:#e74c3c; color:white; border:none; border-radius:50%;
                width:32px; height:32px; cursor:pointer; font-size:16px;
            ">✕</button>
        </div>

        <!-- بطاقات المعلومات -->
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:15px;">
            <div style="background:#ecf0f1; padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:11px; color:#666;">التكلفة الحالية</div>
                <div style="font-size:16px; font-weight:bold; color:#2980b9; margin-top:3px;">${cost.toFixed(2)}</div>
                <div style="font-size:10px; color:#888;">ل.س</div>
            </div>
            <div style="background:#ecf0f1; padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:11px; color:#666;">المخزون</div>
                <div style="font-size:16px; font-weight:bold; color:#27ae60; margin-top:3px;">${stock.toFixed(0)}</div>
                <div style="font-size:10px; color:#888;">${_chEsc(m.unit || '')}</div>
            </div>
            <div style="background:#ecf0f1; padding:10px; border-radius:8px; text-align:center;">
                <div style="font-size:11px; color:#666;">هامش الربح</div>
                <div style="font-size:16px; font-weight:bold; color:${margin > 0 ? '#27ae60' : '#e74c3c'}; margin-top:3px;">${margin.toFixed(1)}%</div>
                <div style="font-size:10px; color:#888;">سعر البيع: ${saleSYP.toFixed(0)}</div>
            </div>
        </div>

        <!-- تاريخ التكلفة -->
        <h3 style="font-size:14px; color:#34495e; margin:15px 0 5px;">📜 تاريخ تغيّر التكلفة (${history.length})</h3>
        ${historyHtml}

        <!-- مقارنة الموردين -->
        ${supplierHtml}

        <!-- اقتراح سعر البيع -->
        ${suggestionHtml}

        <!-- أزرار -->
        <div style="display:flex; gap:8px; margin-top:15px;">
            <button onclick="chWhatsApp(${m.id})" style="
                flex:1; padding:10px; background:#25D366; color:white;
                border:none; border-radius:8px; cursor:pointer; font-size:13px;
            ">💬 واتساب</button>
            <button onclick="chPrint(${m.id})" style="
                flex:1; padding:10px; background:#34495e; color:white;
                border:none; border-radius:8px; cursor:pointer; font-size:13px;
            ">🖨️ طباعة</button>
            <button onclick="chCloseDetails()" style="
                flex:1; padding:10px; background:#95a5a6; color:white;
                border:none; border-radius:8px; cursor:pointer; font-size:13px;
            ">إغلاق</button>
        </div>
    </div>`;

    document.body.appendChild(modal);
}

// ---------- بناء مقارنة الموردين ----------
function chBuildSupplierComparison(material) {
    if (!Array.isArray(material.costHistory) || material.costHistory.length === 0) {
        return '';
    }

    // جمع آخر سعر لكل مورد
    const bySupplier = {};
    material.costHistory.forEach(h => {
        if (h.source !== 'purchase' || !h.supplierId) return;
        const sid = h.supplierId;
        const cost = parseFloat(h.cost) || 0;
        if (cost <= 0) return;

        if (!bySupplier[sid] || cost < bySupplier[sid].cost) {
            bySupplier[sid] = {
                id: sid,
                name: h.supplierName || '—',
                cost: cost,
                date: h.date || ''
            };
        }
    });

    const list = Object.values(bySupplier).sort((a, b) => a.cost - b.cost);
    if (list.length === 0) return '';

    const best = list[0].cost;

    let rows = '';
    list.forEach((s, i) => {
        const diff = s.cost - best;
        const isBest = i === 0;
        const diffTxt = isBest ? '🏆 الأفضل' : `+${diff.toFixed(2)}`;
        const diffColor = isBest ? '#27ae60' : '#e74c3c';

        rows += `
            <div style="
                display:flex; justify-content:space-between; align-items:center;
                padding:8px 10px; border-bottom:1px solid #f0f0f0; font-size:12px;
            ">
                <div style="flex:1;">
                    🏪 <b>${_chEsc(s.name)}</b>
                    <span style="color:#999; font-size:11px; margin-right:6px;">(${s.date})</span>
                </div>
                <div style="color:#2980b9; font-weight:600;">${s.cost.toFixed(2)} ل.س</div>
                <div style="color:${diffColor}; font-weight:bold; margin-right:8px; min-width:70px; text-align:left;">${diffTxt}</div>
            </div>`;
    });

    const savings = list.length > 1 ? ((list[list.length - 1].cost - best) * 100).toFixed(0) : 0;

    return `
        <h3 style="font-size:14px; color:#34495e; margin:15px 0 5px;">🏪 مقارنة الموردين (${list.length})</h3>
        <div style="background:#f8f9fa; border-radius:8px; overflow:hidden;">
            ${rows}
        </div>
        ${list.length > 1 ? `
        <div style="background:#d4edda; color:#155724; padding:8px 10px; border-radius:6px; font-size:12px; margin-top:6px;">
            💡 وفّر حتى <b>${savings} ل.س</b> لكل 100 وحدة باختيار الأفضل
        </div>` : ''}
    `;
}

// ---------- بناء اقتراح سعر البيع ----------
function chBuildPriceSuggestion(material, cost, currentSale) {
    if (cost <= 0) return '';

    // هامش حالي
    const currentMargin = currentSale > 0 ? ((currentSale - cost) / currentSale) * 100 : 0;

    // اقتراحات
    const forMargin40 = cost / 0.6;  // هامش 40%
    const forMargin30 = cost / 0.7;  // هامش 30%
    const forMargin50 = cost / 0.5;  // هامش 50%

    return `
        <h3 style="font-size:14px; color:#34495e; margin:15px 0 5px;">💡 اقتراح سعر البيع</h3>
        <div style="background:#fff3cd; padding:10px; border-radius:8px; font-size:12px; color:#856404;">
            <div style="margin-bottom:6px;">
                التكلفة الحالية: <b>${cost.toFixed(2)} ل.س</b>
                ${currentSale > 0 ? ` • سعر البيع الحالي: <b>${currentSale.toFixed(0)} ل.س</b> (هامش ${currentMargin.toFixed(1)}%)` : ''}
            </div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:8px;">
                <div style="background:white; padding:6px; border-radius:6px; text-align:center;">
                    <div style="font-size:10px; color:#888;">هامش 30%</div>
                    <div style="font-weight:bold; color:#e67e22;">${forMargin30.toFixed(0)}</div>
                </div>
                <div style="background:white; padding:6px; border-radius:6px; text-align:center;">
                    <div style="font-size:10px; color:#888;">هامش 40%</div>
                    <div style="font-weight:bold; color:#27ae60;">${forMargin40.toFixed(0)}</div>
                </div>
                <div style="background:white; padding:6px; border-radius:6px; text-align:center;">
                    <div style="font-size:10px; color:#888;">هامش 50%</div>
                    <div style="font-weight:bold; color:#3498db;">${forMargin50.toFixed(0)}</div>
                </div>
            </div>
        </div>
    `;
}

// ---------- إغلاق ----------
function chCloseDetails() {
    const m = document.getElementById('chDetailsModal');
    if (m) m.remove();
}

// ---------- واتساب ----------
function chWhatsApp(materialId) {
    const m = materials.find(x => x.id === materialId);
    if (!m) return;

    const cost = parseFloat(m.costSYP) || 0;
    const stock = parseFloat(m.stock) || 0;
    const history = (m.costHistory || []);
    const last = history[history.length - 1];

    let txt = `📈 *تقرير تكلفة: ${m.name}*\n\n`;
    txt += `💰 التكلفة الحالية: ${cost.toFixed(2)} ل.س\n`;
    txt += `📦 المخزون: ${stock} ${m.unit || ''}\n`;

    if (last) {
        txt += `\n📅 آخر تحديث: ${last.date}\n`;
        txt += `💵 سعر الشراء: ${(parseFloat(last.cost) || 0).toFixed(2)}\n`;
        if (last.costChange) {
            const chg = parseFloat(last.costChange);
            txt += `📊 التغيير: ${chg > 0 ? '+' : ''}${chg.toFixed(1)}%\n`;
        }
    }

    txt += `\n📜 عدد سجلات التاريخ: ${history.length}`;

    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}

// ---------- طباعة ----------
function chPrint(materialId) {
    const m = materials.find(x => x.id === materialId);
    if (!m) return;

    const cost = parseFloat(m.costSYP) || 0;
    const stock = parseFloat(m.stock) || 0;
    const history = (m.costHistory || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    let rows = '';
    history.forEach(h => {
        const chg = parseFloat(h.costChange) || 0;
        const chgTxt = chg !== 0 ? `${chg > 0 ? '+' : ''}${chg.toFixed(1)}%` : '—';
        rows += `<tr>
            <td>${h.date || '—'}</td>
            <td>${(parseFloat(h.cost) || 0).toFixed(2)}</td>
            <td>${(parseFloat(h.avgCost) || 0).toFixed(2)}</td>
            <td>${h.qty || 0}</td>
            <td>${_chSourceLabel(h.source)}</td>
            <td>${chgTxt}</td>
        </tr>`;
    });

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>تقرير تكلفة - ${m.name}</title>
<style>
* { font-family: 'Segoe UI', Tahoma; }
body { padding: 20px; }
h1 { color: #2c3e50; text-align: center; }
.info { background: #ecf0f1; padding: 12px; border-radius: 8px; margin-bottom: 15px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 8px; border: 1px solid #ddd; text-align: center; }
th { background: #34495e; color: white; }
</style></head><body>
<h1>📈 ${m.name}</h1>
<div class="info">
    <b>💰 التكلفة الحالية:</b> ${cost.toFixed(2)} ل.س &nbsp;|&nbsp;
    <b>📦 المخزون:</b> ${stock} ${m.unit || ''} &nbsp;|&nbsp;
    <b>📅 ${new Date().toLocaleDateString('ar-SY')}</b>
</div>
<h3>📜 تاريخ تغيّر التكلفة (${history.length})</h3>
<table>
    <tr><th>التاريخ</th><th>سعر الشراء</th><th>المتوسط</th><th>الكمية</th><th>المصدر</th><th>التغيير</th></tr>
    ${rows || '<tr><td colspan="6">لا سجلات</td></tr>'}
</table>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 400);
}

// ---------- أدوات ----------
function _chSourceLabel(src) {
    const labels = {
        'purchase': '🛒 شراء',
        'opening': '📥 افتتاحي',
        'manual': '✏️ يدوي',
        'migration': '🔄 مُرحَّل',
        'adjustment': '⚙️ تعديل'
    };
    return labels[src] || src || '—';
}

function _chEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- تصدير ----------
window.loadCostHistoryPage = loadCostHistoryPage;
window.chRenderMaterialsList = chRenderMaterialsList;
window.chFilterMaterials = chFilterMaterials;
window.chOpenDetails = chOpenDetails;
window.chCloseDetails = chCloseDetails;
window.chWhatsApp = chWhatsApp;
window.chPrint = chPrint;

console.log('📈 [ch] cost-history.js محمّل');
