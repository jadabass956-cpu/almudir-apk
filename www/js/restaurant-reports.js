// ============================================================
//  📊 RESTAURANT REPORTS — تقارير المطعم
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { period: 'today' };

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function _fmt(n) {
        const v = Math.round(Number(n) || 0);
        let cur = 'SYP';
        try { cur = (typeof currentUser !== 'undefined' && currentUser?.displayCurrency) || 'SYP'; } catch(e) {}
        const label = cur === 'SYP' ? 'ل.س' : cur === 'USD' ? '$' : cur;
        return v.toLocaleString('en-US') + ' ' + label;
    }
    function _shortFmt(n) {
        const v = Math.round(Number(n) || 0);
        if (v >= 1000000) return (v/1000000).toFixed(1) + 'M';
        if (v >= 1000) return (v/1000).toFixed(1) + 'K';
        return String(v);
    }
    function _todayStr() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    }

    function _getSales() {
        const all = (typeof sales !== 'undefined' && Array.isArray(sales))
            ? sales
            : (Array.isArray(window.sales) ? window.sales : []);
        return all.filter(s => s && (s.isRestaurant === true || s.isStore === true || s.source === 'restaurant' || s.source === 'store'));
    }

    function _filterByPeriod(list) {
        const now = new Date();
        const todayStr = _todayStr();
        const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
        const monthAgo = new Date(now.getTime() - 30*24*60*60*1000);
        return list.filter(inv => {
            const d = new Date((inv.date || '') + 'T00:00:00');
            if (_state.period === 'today') return inv.date === todayStr;
            if (_state.period === 'week') return !isNaN(d) && d >= weekAgo;
            if (_state.period === 'month') return !isNaN(d) && d >= monthAgo;
            return true;
        });
    }

    function _computeStats(list) {
        const stats = {
            count: list.length, total: 0, vat: 0, items: 0,
            bySource: { table: 0, delivery: 0, qr: 0, store: 0 },
            topItems: {}, byDay: {}
        };
        list.forEach(inv => {
            const grand = parseFloat(inv.grandTotal) || parseFloat(inv.total) || 0;
            stats.total += grand;
            stats.vat += parseFloat(inv.vat) || 0;

            if (inv.isDelivery === true || inv.driver || inv.address) stats.bySource.delivery++;
            else if (inv.sourceId || (inv.code && String(inv.code).startsWith('TBL'))) stats.bySource.qr++;
            else stats.bySource.table++;

            (inv.items || []).forEach(it => {
                const name = it.materialName || it.name || '—';
                const qty = parseFloat(it.qty) || 0;
                const tot = parseFloat(it.total) || (qty * (parseFloat(it.unitPrice) || 0));
                stats.items += qty;
                if (!stats.topItems[name]) stats.topItems[name] = { qty: 0, revenue: 0 };
                stats.topItems[name].qty += qty;
                stats.topItems[name].revenue += tot;
            });

            const day = inv.date || '—';
            if (!stats.byDay[day]) stats.byDay[day] = { count: 0, total: 0 };
            stats.byDay[day].count++;
            stats.byDay[day].total += grand;
        });
        return stats;
    }

    function _renderKpiCards(stats) {
        return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:12px;padding:14px;">
                    <div style="font-size:11px;opacity:0.9;">💰 الإجمالي</div>
                    <div style="font-size:18px;font-weight:bold;margin-top:4px;">${_fmt(stats.total)}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">${stats.count} فاتورة</div>
                </div>
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:12px;padding:14px;">
                    <div style="font-size:11px;opacity:0.9;">📊 متوسط الفاتورة</div>
                    <div style="font-size:18px;font-weight:bold;margin-top:4px;">${_fmt(stats.count > 0 ? stats.total / stats.count : 0)}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">${stats.items} صنف مباع</div>
                </div>
                <div style="background:linear-gradient(135deg,#e67e22,#d35400);color:white;border-radius:12px;padding:14px;">
                    <div style="font-size:11px;opacity:0.9;">🧾 متوسط الأصناف</div>
                    <div style="font-size:18px;font-weight:bold;margin-top:4px;">${stats.count > 0 ? (stats.items / stats.count).toFixed(1) : '0'}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">لكل فاتورة</div>
                </div>
                <div style="background:linear-gradient(135deg,#8e44ad,#6c3483);color:white;border-radius:12px;padding:14px;">
                    <div style="font-size:11px;opacity:0.9;">🏷️ الضريبة</div>
                    <div style="font-size:18px;font-weight:bold;margin-top:4px;">${_fmt(stats.vat)}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">مُحتسبة</div>
                </div>
            </div>`;
    }

    function _renderTopItems(stats) {
        const entries = Object.entries(stats.topItems)
            .map(([name, d]) => ({ name, qty: d.qty }))
            .sort((a, b) => b.qty - a.qty).slice(0, 10);
        if (entries.length === 0) return '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">لا توجد مبيعات</div>';
        const maxQty = entries[0].qty || 1;
        const medals = ['🥇','🥈','🥉'];
        let html = '';
        entries.forEach((e, idx) => {
            const badge = idx < 3 ? medals[idx] : '<span style="color:#999;font-weight:600;font-size:12px;">' + (idx+1) + '.</span>';
            const pct = (e.qty / maxQty) * 100;
            html += `
                <div style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                        <span>${badge} ${_esc(e.name)}</span>
                        <span style="color:#27ae60;font-weight:700;">${e.qty}</span>
                    </div>
                    <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                        <div style="background:linear-gradient(90deg,#27ae60,#229954);height:100%;width:${pct}%;"></div>
                    </div>
                </div>`;
        });
        return html;
    }

    function _renderSourceBars(stats) {
        const total = stats.count || 1;
        const sources = [
            { label: '🪑 طاولات', color: '#3498db', count: stats.bySource.table },
            { label: '🛵 توصيل',  color: '#e67e22', count: stats.bySource.delivery },
            { label: '📱 QR',     color: '#8e44ad', count: stats.bySource.qr },
            { label: '🏪 متجر',   color: '#27ae60', count: stats.bySource.store || 0 }
        ];
        let html = '';
        sources.forEach(s => {
            const pct = (s.count / total) * 100;
            html += `
                <div style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                        <span>${s.label}</span>
                        <span style="font-weight:700;color:${s.color};">${s.count} <span style="color:#999;font-size:11px;">(${pct.toFixed(0)}%)</span></span>
                    </div>
                    <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                        <div style="background:${s.color};height:100%;width:${pct}%;"></div>
                    </div>
                </div>`;
        });
        return html;
    }

    function _renderByDay(stats) {
        const entries = Object.entries(stats.byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
        if (entries.length === 0) return '<div style="color:#999;text-align:center;padding:15px;font-size:13px;">لا توجد بيانات</div>';
        const maxTotal = Math.max(...entries.map(e => e[1].total)) || 1;
        let html = '';
        entries.forEach(([day, d]) => {
            const pct = (d.total / maxTotal) * 100;
            html += `
                <div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                        <span>${_esc(day)}</span>
                        <span style="color:#2c3e50;font-weight:600;">${_shortFmt(d.total)}</span>
                    </div>
                    <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                        <div style="background:linear-gradient(90deg,#8e44ad,#6c3483);height:100%;width:${pct}%;"></div>
                    </div>
                </div>`;
        });
        return html;
    }

    function _render(container) {
        if (!container) return;
        const all = _getSales();
        const list = _filterByPeriod(all);
        const stats = _computeStats(list);
        const periodLabel = _state.period === 'today' ? 'اليوم'
            : _state.period === 'week' ? 'آخر 7 أيام'
            : _state.period === 'month' ? 'آخر 30 يوم' : 'الكل';

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">📊 تقارير المطعم</h2>
            <p style="color:#666;font-size:13px;margin:0 0 12px 0;">ملخص الأداء — ${periodLabel}</p>

            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;">
                ${['today','week','month','all'].map(p => `
                    <button onclick="_restRptPeriod('${p}')" style="padding:8px 16px;background:${_state.period === p ? '#27ae60' : 'white'};color:${_state.period === p ? 'white' : '#2c3e50'};border:1.5px solid ${_state.period === p ? '#27ae60' : '#ddd'};border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">
                        ${p === 'today' ? '📅 اليوم' : p === 'week' ? '📆 الأسبوع' : p === 'month' ? '🗓️ الشهر' : '📋 الكل'}
                    </button>`).join('')}
            </div>

            ${_renderKpiCards(stats)}

            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">🏆 أكثر 10 أطباق مبيعاً</h3>
                ${_renderTopItems(stats)}
            </div>

            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">🎯 مصادر الطلبات</h3>
                ${_renderSourceBars(stats)}
            </div>

            ${Object.keys(stats.byDay).length > 1 ? `
                <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 12px 0;font-size:15px;">📅 آخر الأيام</h3>
                    ${_renderByDay(stats)}
                </div>
            ` : ''}

            ${list.length === 0 ? `
                <div style="text-align:center;padding:30px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">📊</div>
                    <div style="font-size:14px;font-weight:600;">لا توجد بيانات</div>
                    <div style="font-size:12px;color:#999;margin-top:6px;">لم تُصدر فواتير في ${periodLabel}</div>
                </div>
            ` : ''}
        `;
    }

    window._restRenderReports = function(container) { _render(container); };
    window.openRestaurantReportsPage = function() {
        let cont = document.getElementById('activity-restaurant-reports');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'activity-restaurant-reports';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('activity-restaurant-reports');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };
    window._restRptPeriod = function(p) {
        _state.period = p;
        const c = document.getElementById('activity-restaurant-reports');
        if (c) _render(c);
    };
    console.log('📊 [restaurant-reports] ready');
})();
