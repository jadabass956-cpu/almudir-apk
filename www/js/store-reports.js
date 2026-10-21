// ============================================================
//  💰 STORE REPORTS — تقرير أرباح المتجر
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { period: 'month' };

    const MONTHS_AR = [
        'يناير','فبراير','مارس','أبريل','مايو','يونيو',
        'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
    ];

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function _fmt(n) {
        const v = Math.round(Number(n) || 0);
        const cur = currentUser?.displayCurrency || 'SYP';
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

    // ═══ جلب فواتير المتجر ═══
    function _getStoreSales() {
        const all = (typeof sales !== 'undefined' && Array.isArray(sales)) ? sales : [];
        return all.filter(s => s && (s.isStore === true || s.source === 'store'));
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

    // ═══ حساب الإحصائيات ═══
    function _computeStats(list) {
        const stats = {
            count: list.length,
            sales: 0,
            costs: 0,
            profit: 0,
            vat: 0,
            delivery: 0,
            items: 0,
            byType: { delivery: 0, pickup: 0 },
            byPayment: { cod: 0, online: 0 },
            topItems: {},
            byDay: {}
        };

        list.forEach(inv => {
            const grand = parseFloat(inv.grandTotal) || parseFloat(inv.total) || 0;
            const delivery = parseFloat(inv.deliveryFee) || 0;
            const salesOnly = grand - delivery;
            stats.sales += salesOnly;
            stats.vat += parseFloat(inv.vat) || 0;
            stats.delivery += delivery;

            // نوع الطلب
            if (inv.orderType === 'delivery') stats.byType.delivery++;
            else stats.byType.pickup++;

            // طريقة الدفع
            if (inv.paymentMethod === 'cod' || inv.paymentType === 'cash') stats.byPayment.cod++;
            else stats.byPayment.online++;

            // الأصناف
            let invCost = 0;
            (inv.items || []).forEach(it => {
                const name = it.materialName || it.name || '—';
                const qty = parseFloat(it.qty) || 0;
                const cost = parseFloat(it.costAtSale) || 0;
                const tot = parseFloat(it.total) || (qty * (parseFloat(it.unitPrice) || 0));
                stats.items += qty;
                invCost += cost * qty;
                if (!stats.topItems[name]) stats.topItems[name] = { qty: 0, revenue: 0 };
                stats.topItems[name].qty += qty;
                stats.topItems[name].revenue += tot;
            });
            stats.costs += invCost;

            // اليوم
            const day = inv.date || '—';
            if (!stats.byDay[day]) stats.byDay[day] = { count: 0, total: 0 };
            stats.byDay[day].count++;
            stats.byDay[day].total += grand;
        });

        stats.profit = stats.sales - stats.costs;
        stats.margin = stats.sales > 0 ? (stats.profit / stats.sales) * 100 : 0;
        stats.avgInvoice = stats.count > 0 ? (stats.sales + stats.delivery) / stats.count : 0;

        return stats;
    }

    // ═══ Render ═══
    function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري الحساب...</div>';

        const all = _getStoreSales();
        const list = _filterByPeriod(all);
        const stats = _computeStats(list);

        const periodLabel = _state.period === 'today' ? 'اليوم'
            : _state.period === 'week' ? 'آخر 7 أيام'
            : _state.period === 'month' ? 'آخر 30 يوم' : 'الكل';

        let topItemsHtml = '';
        const topEntries = Object.entries(stats.topItems)
            .map(([name, d]) => ({ name, qty: d.qty, revenue: d.revenue }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 10);

        if (topEntries.length === 0) {
            topItemsHtml = '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">لا توجد مبيعات</div>';
        } else {
            const maxQty = topEntries[0].qty || 1;
            const medals = ['🥇','🥈','🥉'];
            topEntries.forEach((e, idx) => {
                const badge = idx < 3 ? medals[idx] : '<span style="color:#999;font-weight:600;font-size:12px;">' + (idx+1) + '.</span>';
                const pct = (e.qty / maxQty) * 100;
                topItemsHtml += `
                    <div style="margin-bottom:10px;">
                        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                            <span>${badge} ${_esc(e.name)}</span>
                            <span style="color:#27ae60;font-weight:700;">${e.qty}</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg,#3498db,#2980b9);height:100%;width:${pct}%;"></div>
                        </div>
                    </div>`;
            });
        }

        let daysHtml = '';
        const dayEntries = Object.entries(stats.byDay)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7);
        if (dayEntries.length === 0) {
            daysHtml = '<div style="color:#999;text-align:center;padding:15px;font-size:13px;">لا توجد بيانات</div>';
        } else {
            const maxDay = Math.max(...dayEntries.map(e => e[1].total)) || 1;
            dayEntries.forEach(([day, d]) => {
                const pct = (d.total / maxDay) * 100;
                daysHtml += `
                    <div style="margin-bottom:8px;">
                        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                            <span>${_esc(day)} (${d.count} فاتورة)</span>
                            <span style="color:#2c3e50;font-weight:600;">${_shortFmt(d.total)}</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg,#8e44ad,#6c3483);height:100%;width:${pct}%;"></div>
                        </div>
                    </div>`;
            });
        }

        const deliveryPct = stats.count > 0 ? Math.round((stats.byType.delivery / stats.count) * 100) : 0;
        const codPct = stats.count > 0 ? Math.round((stats.byPayment.cod / stats.count) * 100) : 0;

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">💰 تقرير أرباح المتجر</h2>
            <p style="color:#666;font-size:13px;margin:0 0 12px 0;">أداء المتجر الإلكتروني — ${periodLabel}</p>

            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    { id: 'today', label: '📅 اليوم' },
                    { id: 'week', label: '📆 الأسبوع' },
                    { id: 'month', label: '🗓️ الشهر' },
                    { id: 'all', label: '📋 الكل' }
                ].map(p => `
                    <button onclick="_storeRptPeriod('${p.id}')" style="flex-shrink:0;padding:8px 16px;background:${_state.period === p.id ? '#27ae60' : 'white'};color:${_state.period === p.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.period === p.id ? '#27ae60' : '#ddd'};border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">
                        ${p.label}
                    </button>`).join('')}
            </div>

            <!-- KPI الرئيسي -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:12px;padding:14px;">
                    <div style="font-size:11px;opacity:0.9;">💵 المبيعات (صافي)</div>
                    <div style="font-size:18px;font-weight:bold;margin-top:4px;">${_fmt(stats.sales)}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">${stats.count} فاتورة</div>
                </div>
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:12px;padding:14px;">
                    <div style="font-size:11px;opacity:0.9;">📦 التكلفة</div>
                    <div style="font-size:18px;font-weight:bold;margin-top:4px;">${_fmt(stats.costs)}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">${stats.items} صنف</div>
                </div>
            </div>

            <!-- الربح -->
            <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:14px;padding:18px;text-align:center;margin-bottom:15px;box-shadow:0 4px 15px rgba(39,174,96,0.3);">
                <div style="font-size:12px;opacity:0.95;">✅ الربح الصافي</div>
                <div style="font-size:28px;font-weight:bold;margin-top:6px;">${_fmt(stats.profit)}</div>
                <div style="font-size:12px;opacity:0.9;margin-top:6px;">📊 الهامش: <strong>${stats.margin.toFixed(1)}%</strong></div>
            </div>

            <!-- تفاصيل -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:11px;color:#666;">🛵 التوصيل</div>
                    <div style="font-size:15px;font-weight:bold;color:#e67e22;margin-top:4px;">${_fmt(stats.delivery)}</div>
                    <div style="font-size:10px;color:#999;margin-top:2px;">${deliveryPct}% من الطلبات</div>
                </div>
                <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:11px;color:#666;">💰 متوسط الفاتورة</div>
                    <div style="font-size:15px;font-weight:bold;color:#2c3e50;margin-top:4px;">${_fmt(stats.avgInvoice)}</div>
                    <div style="font-size:10px;color:#999;margin-top:2px;">لكل طلب</div>
                </div>
            </div>

            <!-- مقارنة الطلبات -->
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">🎯 مصادر الطلبات</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                            <span>🛵 توصيل</span>
                            <span style="font-weight:700;color:#e67e22;">${stats.byType.delivery}</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                            <div style="background:#e67e22;height:100%;width:${deliveryPct}%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                            <span>🥡 استلام</span>
                            <span style="font-weight:700;color:#3498db;">${stats.byType.pickup}</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                            <div style="background:#3498db;height:100%;width:${100 - deliveryPct}%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- طرق الدفع -->
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">💳 طرق الدفع</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div>
                        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                            <span>💵 نقد</span>
                            <span style="font-weight:700;color:#27ae60;">${codPct}%</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                            <div style="background:#27ae60;height:100%;width:${codPct}%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                            <span>📱 إلكتروني</span>
                            <span style="font-weight:700;color:#3498db;">${100 - codPct}%</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:8px;overflow:hidden;">
                            <div style="background:#3498db;height:100%;width:${100 - codPct}%;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Items -->
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">🏆 أكثر 10 منتجات مبيعاً</h3>
                ${topItemsHtml}
            </div>

            <!-- By Day -->
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">📅 آخر الأيام</h3>
                ${daysHtml}
            </div>

            ${list.length === 0 ? `
                <div style="text-align:center;padding:30px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">📊</div>
                    <div style="font-size:14px;font-weight:600;">لا توجد بيانات</div>
                    <div style="font-size:12px;color:#999;margin-top:6px;">لم تُصدر فواتير متجر في ${periodLabel}</div>
                </div>
            ` : ''}
        `;
    }

    // ═══ Public API ═══
    window.openStoreReports = function() {
        let cont = document.getElementById('page-store-reports');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-store-reports';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-store-reports');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    window._storeRptPeriod = function(p) {
        _state.period = p;
        const c = document.getElementById('page-store-reports');
        if (c) _render(c);
    };

    console.log('💰 [store-reports] ready');
})();
