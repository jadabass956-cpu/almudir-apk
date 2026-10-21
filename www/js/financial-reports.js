// ============================================================
//  💰 FINANCIAL REPORTS — التقرير المالي الشامل
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { period: 'month' };

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
        if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1) + 'M';
        if (Math.abs(v) >= 1000) return (v/1000).toFixed(1) + 'K';
        return String(v);
    }
    function _todayStr() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    }
    function _dateStr(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const day = String(d.getDate()).padStart(2,'0');
        return y + '-' + m + '-' + day;
    }
    function _getDateRange() {
        const now = new Date();
        let from = null, to = null;
        if (_state.period === 'today') {
            from = _todayStr(); to = _todayStr();
        } else if (_state.period === 'week') {
            const d = new Date(now); d.setDate(d.getDate() - 6);
            from = _dateStr(d); to = _todayStr();
        } else if (_state.period === 'month') {
            const d = new Date(now); d.setDate(d.getDate() - 29);
            from = _dateStr(d); to = _todayStr();
        } else if (_state.period === 'quarter') {
            const d = new Date(now); d.setDate(d.getDate() - 89);
            from = _dateStr(d); to = _todayStr();
        } else if (_state.period === 'year') {
            const d = new Date(now); d.setDate(d.getDate() - 364);
            from = _dateStr(d); to = _todayStr();
        }
        return { from, to };
    }
    function _inRange(dateStr, range) {
        if (!range.from) return true;
        if (!dateStr) return false;
        return dateStr >= range.from && dateStr <= range.to;
    }

    // ═══ جمع البيانات ═══
    function _collectData(range) {
        const data = {
            // الإيرادات
            salesRevenue: 0,
            storeRevenue: 0,
            restaurantRevenue: 0,
            totalRevenue: 0,
            // COGS
            totalCost: 0,
            // المصروفات
            expenses: 0,
            expensesByCategory: {},
            // المشتريات
            purchasesTotal: 0,
            purchasesPaid: 0,
            // المدفوعات
            totalPaid: 0,
            totalReceivables: 0,
            totalPayables: 0,
            // مسحوبات
            ownerWithdrawals: 0,
            // الإتلاف
            disposalsCost: 0,
            // الفواتير
            invoiceCount: 0,
            // لكل يوم
            byDay: {},
            byMonth: {}
        };

        // ═══ المبيعات (بيع + مطعم + متجر) ═══
        const salesList = (typeof sales !== 'undefined' && Array.isArray(sales)) ? sales : [];
        salesList.forEach(s => {
            if (!s || !_inRange(s.date, range)) return;

            const grand = Number(s.grandTotal) || Number(s.total) || 0;
            const paid = Number(s.paid) || 0;
            const remaining = Number(s.remaining) || 0;

            data.totalRevenue += grand;
            data.totalPaid += paid;
            data.totalReceivables += remaining;
            data.invoiceCount++;

            // COGS
            let cost = 0;
            (s.items || []).forEach(it => {
                const qty = Number(it.qty) || 0;
                const c = Number(it.costAtSale) || 0;
                cost += c * qty;
            });
            data.totalCost += cost;

            // تصنيف
            if (s.isStore === true || s.source === 'store') {
                data.storeRevenue += grand;
            } else if (s.isRestaurant === true || s.source === 'restaurant') {
                data.restaurantRevenue += grand;
            } else {
                data.salesRevenue += grand;
            }

            // يومي
            const day = s.date || '—';
            if (!data.byDay[day]) data.byDay[day] = { revenue: 0, cost: 0, expenses: 0 };
            data.byDay[day].revenue += grand;
            data.byDay[day].cost += cost;

            // شهري
            const month = (s.date || '').slice(0, 7);
            if (month) {
                if (!data.byMonth[month]) data.byMonth[month] = { revenue: 0, cost: 0, expenses: 0 };
                data.byMonth[month].revenue += grand;
                data.byMonth[month].cost += cost;
            }
        });

        // ═══ المصروفات ═══
        const expList = (typeof expenses !== 'undefined' && Array.isArray(expenses)) ? expenses : [];
        expList.forEach(e => {
            if (!e || !_inRange(e.date, range)) return;
            const amt = Number(e.amount) || 0;
            data.expenses += amt;
            const cat = e.category || 'غير مصنّف';
            data.expensesByCategory[cat] = (data.expensesByCategory[cat] || 0) + amt;
            const day = e.date;
            if (day && data.byDay[day]) data.byDay[day].expenses += amt;
            else if (day) {
                if (!data.byDay[day]) data.byDay[day] = { revenue: 0, cost: 0, expenses: 0 };
                data.byDay[day].expenses += amt;
            }
        });

        // ═══ المشتريات ═══
        const purList = (typeof purchases !== 'undefined' && Array.isArray(purchases)) ? purchases : [];
        purList.forEach(p => {
            if (!p) return;
            const dateStr = p.date || (p.createdAt?.toDate?.() ? _dateStr(p.createdAt.toDate()) : null);
            if (!_inRange(dateStr, range)) return;
            data.purchasesTotal += Number(p.total) || 0;
            data.purchasesPaid += Number(p.paid) || 0;
            data.totalPayables += Number(p.remaining) || 0;
        });

        // ═══ مسحوبات المالك ═══
        const wList = (typeof ownerWithdrawals !== 'undefined' && Array.isArray(ownerWithdrawals)) ? ownerWithdrawals : [];
        wList.forEach(w => {
            if (!w || !_inRange(w.date, range)) return;
            data.ownerWithdrawals += Number(w.amount) || 0;
        });

        // ═══ الإتلافات ═══
        const dList = (typeof disposals !== 'undefined' && Array.isArray(disposals)) ? disposals : [];
        dList.forEach(d => {
            if (!d || !_inRange(d.date, range)) return;
            (d.items || []).forEach(it => {
                const qty = Number(it.qty) || 0;
                const cost = Number(it.costAtSale) || Number(it.cost) || 0;
                data.disposalsCost += cost * qty;
            });
        });

        // ═══ الحسابات النهائية ═══
        data.grossProfit = data.totalRevenue - data.totalCost;
        data.grossMargin = data.totalRevenue > 0 ? (data.grossProfit / data.totalRevenue) * 100 : 0;
        data.netProfit = data.grossProfit - data.expenses - data.disposalsCost;
        data.netMargin = data.totalRevenue > 0 ? (data.netProfit / data.totalRevenue) * 100 : 0;
        data.cashProfit = data.netProfit - data.ownerWithdrawals;

        return data;
    }

    // ═══ الرصيد النقدي (من الصناديق) ═══
    async function _getCashBalance() {
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('payment_boxes').get();
            let total = 0;
            let count = 0;
            snap.forEach(d => {
                const b = d.data();
                if (b.active === false) return;
                total += Number(b.balance) || 0;
                count++;
            });
            return { total, count };
        } catch(e) {
            return { total: 0, count: 0 };
        }
    }

    // ═══ Render ═══
    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحليل المالي...</div>';

        try {
            const range = _getDateRange();
            const data = _collectData(range);
            const cash = await _getCashBalance();
            data.cashBalance = cash.total;
            data.cashBoxes = cash.count;

            _renderContent(container, data, range);
        } catch(e) {
            console.error('[financial]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
        }
    }

    function _renderContent(container, data, range) {
        const periodLabel = _state.period === 'today' ? 'اليوم'
            : _state.period === 'week' ? 'آخر 7 أيام'
            : _state.period === 'month' ? 'آخر 30 يوم'
            : _state.period === 'quarter' ? 'آخر 90 يوم'
            : _state.period === 'year' ? 'آخر سنة' : 'الكل';

        // حالة الربح
        const isProfit = data.netProfit >= 0;
        const profitColor = isProfit ? '#27ae60' : '#e74c3c';
        const profitBg = isProfit ? 'linear-gradient(135deg,#27ae60,#229954)' : 'linear-gradient(135deg,#e74c3c,#c0392b)';

        // ترتيب المصروفات
        const expEntries = Object.entries(data.expensesByCategory)
            .map(([name, amt]) => ({ name, amt }))
            .sort((a, b) => b.amt - a.amt);
        const maxExp = expEntries.length > 0 ? expEntries[0].amt : 1;

        let expensesHtml = '';
        if (expEntries.length === 0) {
            expensesHtml = '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">لا توجد مصروفات</div>';
        } else {
            expEntries.slice(0, 8).forEach(e => {
                const pct = (e.amt / maxExp) * 100;
                expensesHtml += `
                    <div style="margin-bottom:10px;">
                        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                            <span>📄 ${_esc(e.name)}</span>
                            <span style="color:#e74c3c;font-weight:700;">${_fmt(e.amt)}</span>
                        </div>
                        <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg,#e74c3c,#c0392b);height:100%;width:${pct}%;"></div>
                        </div>
                    </div>`;
            });
        }

        // آخر الأيام
        const dayEntries = Object.entries(data.byDay)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7);

        let daysHtml = '';
        if (dayEntries.length === 0) {
            daysHtml = '<div style="color:#999;text-align:center;padding:15px;font-size:13px;">لا توجد بيانات</div>';
        } else {
            dayEntries.forEach(([day, d]) => {
                const net = d.revenue - d.cost - d.expenses;
                const netColor = net >= 0 ? '#27ae60' : '#e74c3c';
                daysHtml += `
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #eee;font-size:12px;">
                        <span style="color:#666;">${_esc(day)}</span>
                        <div style="text-align:left;">
                            <div style="color:#3498db;">📈 ${_shortFmt(d.revenue)}</div>
                            <div style="color:${netColor};font-weight:700;">💰 ${_shortFmt(net)}</div>
                        </div>
                    </div>`;
            });
        }

        // نسب الإيرادات
        const totalRev = data.totalRevenue || 1;
        const salesPct = (data.salesRevenue / totalRev) * 100;
        const restPct = (data.restaurantRevenue / totalRev) * 100;
        const storePct = (data.storeRevenue / totalRev) * 100;

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">💰 التقرير المالي الشامل</h2>
            <p style="color:#666;font-size:13px;margin:0 0 12px 0;">نظرة كاملة على أداء النشاط — ${periodLabel}</p>

            <!-- فترة -->
            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    { id: 'today', label: '📅 اليوم' },
                    { id: 'week', label: '📆 الأسبوع' },
                    { id: 'month', label: '🗓️ الشهر' },
                    { id: 'quarter', label: '📊 90 يوم' },
                    { id: 'year', label: '📈 سنة' },
                    { id: 'all', label: '📋 الكل' }
                ].map(p => `
                    <button onclick="_finRptPeriod('${p.id}')" style="flex-shrink:0;padding:8px 16px;background:${_state.period === p.id ? '#2c3e50' : 'white'};color:${_state.period === p.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.period === p.id ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">
                        ${p.label}
                    </button>`).join('')}
            </div>

            <!-- ═══ الإيرادات ═══ -->
            <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:14px;padding:16px;margin-bottom:12px;">
                <div style="font-size:12px;opacity:0.9;">💵 إجمالي الإيرادات</div>
                <div style="font-size:26px;font-weight:700;margin-top:6px;">${_fmt(data.totalRevenue)}</div>
                <div style="font-size:11px;opacity:0.9;margin-top:6px;">${data.invoiceCount} فاتورة</div>
            </div>

            <!-- ═══ هيكل التكلفة ═══ -->
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">📊 هيكل التكلفة</h3>
                <div style="display:grid;gap:8px;font-size:13px;">
                    <div style="display:flex;justify-content:space-between;padding:6px 0;">
                        <span style="color:#666;">💵 الإيرادات</span>
                        <span style="font-weight:700;color:#27ae60;">${_fmt(data.totalRevenue)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #eee;">
                        <span style="color:#666;">📦 تكلفة المواد (COGS)</span>
                        <span style="font-weight:700;color:#e74c3c;">- ${_fmt(data.totalCost)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:6px 0;background:#e8f5e9;border-radius:6px;padding:8px;">
                        <span style="font-weight:700;">✅ الربح الإجمالي</span>
                        <span style="font-weight:700;color:#27ae60;">${_fmt(data.grossProfit)}</span>
                    </div>
                    <div style="text-align:center;font-size:11px;color:#666;padding:2px 0;">
                        هامش إجمالي: <b style="color:#27ae60;">${data.grossMargin.toFixed(1)}%</b>
                    </div>

                    <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed #eee;">
                        <span style="color:#666;">📄 المصروفات</span>
                        <span style="font-weight:700;color:#e74c3c;">- ${_fmt(data.expenses)}</span>
                    </div>
                    ${data.disposalsCost > 0 ? `
                        <div style="display:flex;justify-content:space-between;padding:6px 0;">
                            <span style="color:#666;">📦 الإتلافات</span>
                            <span style="font-weight:700;color:#e74c3c;">- ${_fmt(data.disposalsCost)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- ═══ الربح الصافي ═══ -->
            <div style="background:${profitBg};color:white;border-radius:14px;padding:18px;text-align:center;margin-bottom:12px;box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                <div style="font-size:13px;opacity:0.95;">${isProfit ? '✅ الربح الصافي' : '❌ الخسارة الصافية'}</div>
                <div style="font-size:30px;font-weight:700;margin-top:6px;">${_fmt(Math.abs(data.netProfit))}</div>
                <div style="font-size:12px;opacity:0.9;margin-top:6px;">📊 هامش صافي: <b>${data.netMargin.toFixed(1)}%</b></div>
            </div>

            <!-- ═══ KPI إضافية ═══ -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:11px;color:#666;">💳 الرصيد النقدي</div>
                    <div style="font-size:15px;font-weight:700;color:#27ae60;margin-top:4px;">${_fmt(data.cashBalance)}</div>
                    <div style="font-size:10px;color:#999;margin-top:2px;">${data.cashBoxes} صندوق</div>
                </div>
                <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:11px;color:#666;">💰 صافي بعد السحب</div>
                    <div style="font-size:15px;font-weight:700;color:#3498db;margin-top:4px;">${_fmt(data.cashProfit)}</div>
                    <div style="font-size:10px;color:#999;margin-top:2px;">سحب: ${_shortFmt(data.ownerWithdrawals)}</div>
                </div>
                <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:11px;color:#666;">📥 مديونية العملاء</div>
                    <div style="font-size:15px;font-weight:700;color:#e67e22;margin-top:4px;">${_fmt(data.totalReceivables)}</div>
                    <div style="font-size:10px;color:#999;margin-top:2px;">مستحقة لك</div>
                </div>
                <div style="background:white;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:11px;color:#666;">📤 مديونية الموردين</div>
                    <div style="font-size:15px;font-weight:700;color:#e74c3c;margin-top:4px;">${_fmt(data.totalPayables)}</div>
                    <div style="font-size:10px;color:#999;margin-top:2px;">مستحقة عليك</div>
                </div>
            </div>

            <!-- ═══ مصادر الإيرادات ═══ -->
            ${data.totalRevenue > 0 ? `
                <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <h3 style="margin:0 0 12px 0;font-size:15px;">🎯 مصادر الإيرادات</h3>
                    ${data.salesRevenue > 0 ? `
                        <div style="margin-bottom:10px;">
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                                <span>🛒 مبيعات عادية</span>
                                <span style="font-weight:700;color:#3498db;">${_fmt(data.salesRevenue)} <span style="color:#999;font-size:11px;">(${salesPct.toFixed(0)}%)</span></span>
                            </div>
                            <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                                <div style="background:#3498db;height:100%;width:${salesPct}%;"></div>
                            </div>
                        </div>` : ''}
                    ${data.restaurantRevenue > 0 ? `
                        <div style="margin-bottom:10px;">
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                                <span>🍽️ المطعم (طاولات/توصيل)</span>
                                <span style="font-weight:700;color:#e67e22;">${_fmt(data.restaurantRevenue)} <span style="color:#999;font-size:11px;">(${restPct.toFixed(0)}%)</span></span>
                            </div>
                            <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                                <div style="background:#e67e22;height:100%;width:${restPct}%;"></div>
                            </div>
                        </div>` : ''}
                    ${data.storeRevenue > 0 ? `
                        <div style="margin-bottom:10px;">
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                                <span>🏪 المتجر الإلكتروني</span>
                                <span style="font-weight:700;color:#27ae60;">${_fmt(data.storeRevenue)} <span style="color:#999;font-size:11px;">(${storePct.toFixed(0)}%)</span></span>
                            </div>
                            <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                                <div style="background:#27ae60;height:100%;width:${storePct}%;"></div>
                            </div>
                        </div>` : ''}
                </div>
            ` : ''}

            <!-- ═══ المصروفات ═══ -->
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">📄 المصروفات حسب الفئة</h3>
                ${expensesHtml}
                ${data.expenses > 0 ? `
                    <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:10px;border-top:2px solid #e74c3c;font-weight:700;font-size:14px;">
                        <span>الإجمالي</span>
                        <span style="color:#e74c3c;">${_fmt(data.expenses)}</span>
                    </div>
                ` : ''}
            </div>

            <!-- ═══ آخر الأيام ═══ -->
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 12px 0;font-size:15px;">📅 آخر الأيام</h3>
                ${daysHtml}
            </div>

            <!-- ═══ أزرار ═══ -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">
                <button onclick="_finRptRefresh()" style="padding:12px;background:#3498db;color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🔄 تحديث</button>
                <button onclick="_finRptPrint()" style="padding:12px;background:#34495e;color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ طباعة</button>
            </div>

            <div style="background:#f0f7ff;border-radius:10px;padding:12px;border-right:4px solid #3498db;">
                <div style="font-size:11px;color:#555;line-height:1.7;">
                    💡 <b>كيف تُحسب الأرباح؟</b><br>
                    💵 الإيرادات = المبيعات (بيع + مطعم + متجر)<br>
                    📦 COGS = تكلفة المواد المباعة<br>
                    ✅ الربح الإجمالي = الإيرادات - COGS<br>
                    📄 الربح الصافي = الإجمالي - المصروفات - الإتلاف
                </div>
            </div>
        `;
    }

    // ═══ API ═══
    window.openFinancialReports = function() {
        let cont = document.getElementById('page-financial-reports');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-financial-reports';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-financial-reports');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    window._finRptPeriod = function(p) {
        _state.period = p;
        const c = document.getElementById('page-financial-reports');
        if (c) _render(c);
    };

    window._finRptRefresh = function() {
        const c = document.getElementById('page-financial-reports');
        if (c) _render(c);
    };

    window._finRptPrint = function() {
        // طباعة بسيطة
        const c = document.getElementById('page-financial-reports');
        if (!c) return;
        const w = window.open('', '_blank');
        if (!w) return alert('⚠️ السماح بالنوافذ المنبثقة');
        w.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>التقرير المالي</title>');
        w.document.write('<style>body{font-family:Arial;padding:20px;} h1{text-align:center;} .section{margin:15px 0;padding:12px;border:1px solid #ddd;border-radius:8px;} .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;} .total{font-weight:bold;font-size:18px;padding:10px 0;border-top:2px solid #000;}</style>');
        w.document.write('</head><body>');
        w.document.write('<h1>💰 التقرير المالي</h1>');
        w.document.write('<p style="text-align:center;color:#666;">' + new Date().toLocaleString('ar-SY') + '</p>');
        w.document.write('</body></html>');
        w.document.close();
        setTimeout(() => w.print(), 500);
    };

    console.log('💰 [financial-reports] ready');
})();
