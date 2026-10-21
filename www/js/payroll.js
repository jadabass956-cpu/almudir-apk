// ============================================================
//  💰 PAYROLL — كشف الرواتب الشهري
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = {
        year: new Date().getFullYear(),
        month: new Date().getMonth(), // 0-11
        data: [],
        loading: false
    };

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

    function _initials(name) {
        if (!name) return '؟';
        return name.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
    }

    function _daysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _dateStr(y, m, d) {
        return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }

    // ═══ فتح الصفحة ═══
    window.openPayroll = function() {
        let cont = document.getElementById('page-payroll');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-payroll';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-payroll');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    // ═══ قراءة الموظفين ═══
    async function _getEmployees() {
        const snap = await db.collection('users')
            .where('ownerUid', '==', currentUser.uid).get();
        const list = [];
        snap.forEach(d => {
            const u = d.data();
            if (u.linkStatus === 'active') {
                list.push({ uid: d.id, ...u });
            }
        });
        return list;
    }

    // ═══ قراءة الحضور لشهر كامل ═══
    async function _getMonthAttendance(year, month) {
        const days = _daysInMonth(year, month);
        const tasks = [];
        for (let d = 1; d <= days; d++) {
            const date = _dateStr(year, month, d);
            tasks.push(
                db.collection('users').doc(currentUser.uid)
                    .collection('attendance').doc(date).get()
                    .then(snap => ({ date, records: snap.exists ? (snap.data().records || {}) : {} }))
                    .catch(() => ({ date, records: {} }))
            );
        }
        const results = await Promise.all(tasks);
        const byDate = {};
        results.forEach(r => { byDate[r.date] = r.records; });
        return byDate;
    }

    // ═══ قراءة الإجازات ═══
    async function _getLeaves() {
        const snap = await db.collection('users').doc(currentUser.uid)
            .collection('leaves').get();
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        return list;
    }

    // ═══ قراءة السلف ═══
    async function _getAdvances() {
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('advances').get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
        } catch(e) {
            return [];
        }
    }

    // ═══ حساب الراتب لكل موظف ═══
    function _calculatePayroll(emp, attendanceByDate, leaves, advances) {
        const year = _state.year;
        const month = _state.month;
        const daysInMonth = _daysInMonth(year, month);
        const monthStr = year + '-' + String(month + 1).padStart(2, '0');

        // ① أيام العمل الفعلية (حسب نوع الراتب)
        const baseSalary = Number(emp.salary) || 0;
        const salaryType = emp.salaryType || 'monthly';

        let workedDays = 0;
        let workedHours = 0;
        let actualCheckins = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const date = _dateStr(year, month, d);
            const rec = attendanceByDate[date]?.[emp.uid];
            if (rec && rec.checkIn) {
                actualCheckins++;
                workedDays++;
                workedHours += Number(rec.hours) || 0;
            }
        }

        // ② حساب الراتب الأساسي المستحق
        let baseDue = 0;
        if (salaryType === 'monthly') {
            baseDue = baseSalary;
        } else if (salaryType === 'daily') {
            baseDue = baseSalary * workedDays;
        } else if (salaryType === 'hourly') {
            baseDue = baseSalary * workedHours;
        }

        // ③ الإجازات — كيف تُحسب؟
        // - إجازة سنوية / مرضية / طارئة → مدفوعة (لا خصم)
        // - بدون راتب → خصم
        // - المعلقة/المرفوضة → لا تأثير
        const empLeaves = leaves.filter(l => l.empUid === emp.uid && l.status === 'approved');
        let paidLeaveDays = 0;
        let unpaidLeaveDays = 0;
        empLeaves.forEach(l => {
            // الإجازة يجب أن تكون ضمن الشهر
            if (l.from && l.to) {
                const lFrom = l.from;
                const lTo = l.to;
                // تحقق إذا كانت الإجازة تتقاطع مع الشهر
                if (lTo.slice(0, 7) < monthStr || lFrom.slice(0, 7) > monthStr) return;
                const d = Number(l.days) || 0;
                if (l.type === 'unpaid') unpaidLeaveDays += d;
                else paidLeaveDays += d;
            }
        });

        // ④ خصم الإجازة بدون راتب (لشهري فقط)
        let unpaidDeduction = 0;
        if (salaryType === 'monthly' && unpaidLeaveDays > 0) {
            const dailyRate = baseSalary / daysInMonth;
            unpaidDeduction = dailyRate * unpaidLeaveDays;
        }

        // ⑤ السلف — خصم من الراتب
        const empAdvances = advances.filter(a => a.empUid === emp.uid && a.status !== 'deducted');
        const advancesTotal = empAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

        // ⑥ الصافي
        const netSalary = baseDue - unpaidDeduction - advancesTotal;

        return {
            uid: emp.uid,
            fullName: emp.fullName || 'بدون اسم',
            roleName: emp.roleName || '',
            phone: emp.phone || '',
            salaryType: salaryType,
            baseSalary: baseSalary,
            workedDays: workedDays,
            workedHours: Math.round(workedHours * 100) / 100,
            actualCheckins: actualCheckins,
            daysInMonth: daysInMonth,
            paidLeaveDays: paidLeaveDays,
            unpaidLeaveDays: unpaidLeaveDays,
            baseDue: Math.round(baseDue),
            unpaidDeduction: Math.round(unpaidDeduction),
            advancesTotal: Math.round(advancesTotal),
            advances: empAdvances,
            netSalary: Math.round(netSalary)
        };
    }

    // ═══ عرض الصفحة ═══
    async function _render(container) {
        if (!container) return;
        if (_state.loading) return;
        _state.loading = true;

        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري حساب الرواتب...</div>';

        try {
            const [employees, attendance, leaves, advances] = await Promise.all([
                _getEmployees(),
                _getMonthAttendance(_state.year, _state.month),
                _getLeaves(),
                _getAdvances()
            ]);

            _state.data = employees.map(e => _calculatePayroll(e, attendance, leaves, advances));
            _state.data.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'ar'));

            _renderContent(container);
        } catch(e) {
            console.error('[payroll]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
        } finally {
            _state.loading = false;
        }
    }

    function _renderContent(container) {
        const data = _state.data;
        const totalBase = data.reduce((s, e) => s + e.baseDue, 0);
        const totalDeductions = data.reduce((s, e) => s + e.unpaidDeduction, 0);
        const totalAdvances = data.reduce((s, e) => s + e.advancesTotal, 0);
        const totalNet = data.reduce((s, e) => s + e.netSalary, 0);

        let listHtml = '';
        if (data.length === 0) {
            listHtml = `<div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">💰</div>
                <div style="font-size:15px;font-weight:600;">لا يوجد موظفون</div>
                <div style="font-size:13px;margin-top:6px;">اربط موظفين أولاً من الأدوار الوظيفية</div>
            </div>`;
        } else {
            data.forEach(e => { listHtml += _card(e); });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">💰 كشف الرواتب</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">حساب تلقائي من سجل الحضور</p>

            <!-- اختيار الشهر -->
            <div style="background:white;border-radius:12px;padding:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <button onclick="_payrollPrevMonth()" style="padding:10px 14px;background:#ecf0f1;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold;">›</button>
                <div style="text-align:center;">
                    <div style="font-size:11px;color:#999;">الشهر</div>
                    <div style="font-size:15px;font-weight:700;color:#2c3e50;">${MONTHS_AR[_state.month]} ${_state.year}</div>
                </div>
                <button onclick="_payrollNextMonth()" style="padding:10px 14px;background:#ecf0f1;border:none;border-radius:8px;font-size:16px;cursor:pointer;font-weight:bold;">‹</button>
            </div>

            <!-- الإحصائيات -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:10px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">💰 إجمالي الأساسي</div>
                    <div style="font-size:15px;font-weight:700;margin-top:4px;">${_fmt(totalBase)}</div>
                </div>
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:10px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">📉 الخصومات</div>
                    <div style="font-size:15px;font-weight:700;margin-top:4px;">${_fmt(totalDeductions)}</div>
                </div>
                <div style="background:linear-gradient(135deg,#f39c12,#e67e22);color:white;border-radius:10px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">💵 السلف</div>
                    <div style="font-size:15px;font-weight:700;margin-top:4px;">${_fmt(totalAdvances)}</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">✅ الصافي</div>
                    <div style="font-size:15px;font-weight:700;margin-top:4px;">${_fmt(totalNet)}</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">
                <button onclick="_payrollRefresh()" style="padding:11px;background:#3498db;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🔄 تحديث</button>
                <button onclick="_payrollPrintAll()" style="padding:11px;background:#34495e;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ طباعة الكل</button>
            </div>

            <div style="width:100%;box-sizing:border-box;">${listHtml}</div>
        `;
    }

    function _card(e) {
        const typeLabel = e.salaryType === 'daily' ? 'يومي' : e.salaryType === 'hourly' ? 'ساعي' : 'شهري';
        const hasDeduction = e.unpaidDeduction > 0;
        const hasAdvances = e.advancesTotal > 0;

        return `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid #27ae60;box-sizing:border-box;width:100%;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3498db,#2980b9);color:white;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;">
                        ${_initials(e.fullName)}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#2c3e50;font-size:14px;">${_esc(e.fullName)}</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">🎯 ${_esc(e.roleName || '—')} • ${typeLabel}</div>
                    </div>
                </div>

                <!-- التفاصيل -->
                <div style="background:#f8f9fa;border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px;">
                    <div style="display:flex;justify-content:space-between;padding:4px 0;">
                        <span style="color:#666;">💰 الأساسي</span>
                        <span style="font-weight:700;color:#2c3e50;">${_fmt(e.baseSalary)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;">
                        <span style="color:#666;">📅 أيام العمل</span>
                        <span style="font-weight:600;">${e.workedDays} / ${e.daysInMonth} يوم</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;">
                        <span style="color:#666;">⏱️ ساعات</span>
                        <span style="font-weight:600;">${e.workedHours} س</span>
                    </div>
                    ${e.paidLeaveDays > 0 ? `
                        <div style="display:flex;justify-content:space-between;padding:4px 0;">
                            <span style="color:#666;">🏖️ إجازة مدفوعة</span>
                            <span style="color:#27ae60;font-weight:600;">${e.paidLeaveDays} يوم</span>
                        </div>
                    ` : ''}
                    ${e.unpaidLeaveDays > 0 ? `
                        <div style="display:flex;justify-content:space-between;padding:4px 0;">
                            <span style="color:#666;">📋 إجازة بدون راتب</span>
                            <span style="color:#e74c3c;font-weight:600;">${e.unpaidLeaveDays} يوم</span>
                        </div>
                    ` : ''}
                </div>

                <!-- المستحق والخصومات -->
                <div style="background:#e8f5e9;border-radius:8px;padding:10px;font-size:12px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;">
                        <span>💵 المستحق</span>
                        <span style="font-weight:700;color:#27ae60;">${_fmt(e.baseDue)}</span>
                    </div>
                    ${hasDeduction ? `
                        <div style="display:flex;justify-content:space-between;padding:3px 0;">
                            <span style="color:#e74c3c;">📉 خصم إجازة</span>
                            <span style="color:#e74c3c;">- ${_fmt(e.unpaidDeduction)}</span>
                        </div>
                    ` : ''}
                    ${hasAdvances ? `
                        <div style="display:flex;justify-content:space-between;padding:3px 0;">
                            <span style="color:#e67e22;">💵 سلف (${e.advances.length} سلفة)</span>
                            <span style="color:#e67e22;font-weight:700;">- ${_fmt(e.advancesTotal)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- الصافي -->
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div style="font-size:12px;opacity:0.95;">💰 الصافي</div>
                    <div style="font-size:18px;font-weight:700;">${_fmt(e.netSalary)}</div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    <button onclick="_payrollPrintOne('${_esc(e.uid)}')" style="padding:10px;background:#34495e;color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ طباعة</button>
                    <button onclick="_payrollPayOne('${_esc(e.uid)}')" style="padding:10px;background:linear-gradient(135deg,#f39c12,#e67e22);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">✅ تسليم</button>
                </div>
            </div>
        `;
    }

    // ═══ Actions ═══
    window._payrollPrevMonth = function() {
        _state.month--;
        if (_state.month < 0) { _state.month = 11; _state.year--; }
        const c = document.getElementById('page-payroll');
        if (c) _render(c);
    };

    window._payrollNextMonth = function() {
        _state.month++;
        if (_state.month > 11) { _state.month = 0; _state.year++; }
        const c = document.getElementById('page-payroll');
        if (c) _render(c);
    };

    window._payrollRefresh = function() {
        const c = document.getElementById('page-payroll');
        if (c) _render(c);
    };

    // ═══ طباعة ═══
    function _printSlip(e) {
        // 🆕 استخدام الطباعة الحرارية
        if (typeof window.ThermalPrint !== 'undefined') {
            try {
                window.ThermalPrint.payroll({
                    ...e,
                    monthLabel: MONTHS_AR[_state.month] + ' ' + _state.year
                }, {
                    name: currentUser?.businessName || 'النشاط',
                    currency: currentUser?.displayCurrency || 'SYP'
                });
                return;
            } catch(err) {
                console.warn('[payroll] thermal fallback:', err);
            }
        }

        // Fallback
        const monthLabel = MONTHS_AR[_state.month] + ' ' + _state.year;
        const bizName = currentUser?.businessName || 'النشاط';
        const typeLabel = e.salaryType === 'daily' ? 'يومي' : e.salaryType === 'hourly' ? 'ساعي' : 'شهري';

        const html = `
            <html dir="rtl"><head><meta charset="UTF-8"><title>قسيمة راتب - ${e.fullName}</title>
            <style>
                * { box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 12px; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 20px; color: #2c3e50; }
                .header .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
                .info { background: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 16px; }
                .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
                .row.total { font-weight: 700; font-size: 15px; border-top: 2px solid #27ae60; padding-top: 10px; margin-top: 8px; color: #27ae60; }
                .row.deduction { color: #e74c3c; }
                .section-title { font-weight: 700; font-size: 14px; color: #2c3e50; margin: 16px 0 8px; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ccc; font-size: 11px; color: #999; }
                .signature { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; }
                .signature div { text-align: center; }
                .signature .line { width: 140px; border-top: 1px solid #2c3e50; margin-top: 30px; }
                @media print { body { padding: 10px; } }
            </style>
            </head><body>
                <div class="header">
                    <h1>${bizName}</h1>
                    <div class="subtitle">قسيمة راتب — ${monthLabel}</div>
                </div>

                <div class="info">
                    <div class="row"><span>👤 الاسم:</span><strong>${_esc(e.fullName)}</strong></div>
                    <div class="row"><span>🎯 الوظيفة:</span><span>${_esc(e.roleName || '—')}</span></div>
                    <div class="row"><span>📊 نوع الراتب:</span><span>${typeLabel}</span></div>
                    <div class="row"><span>💰 الأساسي:</span><span>${_fmt(e.baseSalary)}</span></div>
                </div>

                <div class="section-title">📅 الحضور</div>
                <div class="info">
                    <div class="row"><span>أيام العمل</span><span>${e.workedDays} / ${e.daysInMonth}</span></div>
                    <div class="row"><span>إجمالي الساعات</span><span>${e.workedHours}</span></div>
                    ${e.paidLeaveDays > 0 ? `<div class="row"><span>🏖️ إجازة مدفوعة</span><span>${e.paidLeaveDays} يوم</span></div>` : ''}
                    ${e.unpaidLeaveDays > 0 ? `<div class="row"><span>📋 إجازة بدون راتب</span><span>${e.unpaidLeaveDays} يوم</span></div>` : ''}
                </div>

                <div class="section-title">💰 المستحقات والخصومات</div>
                <div class="info">
                    <div class="row"><span>المستحق الأساسي</span><span>${_fmt(e.baseDue)}</span></div>
                    ${e.unpaidDeduction > 0 ? `<div class="row deduction"><span>خصم إجازة بدون راتب</span><span>- ${_fmt(e.unpaidDeduction)}</span></div>` : ''}
                    ${e.advancesTotal > 0 ? `<div class="row deduction"><span>سلف</span><span>- ${_fmt(e.advancesTotal)}</span></div>` : ''}
                    <div class="row total"><span>💰 الصافي</span><span>${_fmt(e.netSalary)}</span></div>
                </div>

                <div class="signature">
                    <div><div class="line"></div>توقيع الموظف</div>
                    <div><div class="line"></div>توقيع الإدارة</div>
                </div>

                <div class="footer">
                    تم الإصدار في ${new Date().toLocaleString('ar-SY')}
                </div>
            </body></html>
        `;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 500);
    }

    window._payrollPrintOne = function(uid) {
        const e = _state.data.find(x => x.uid === uid);
        if (!e) return;
        _printSlip(e);
    };

    window._payrollPrintAll = function() {
        const data = _state.data;
        if (data.length === 0) { alert('لا يوجد موظفون'); return; }

        // 🆕 استخدام الطباعة الحرارية
        if (typeof window.ThermalPrint !== 'undefined') {
            try {
                window.ThermalPrint.payrollAll(data, MONTHS_AR[_state.month] + ' ' + _state.year, {
                    name: currentUser?.businessName || 'النشاط'
                });
                return;
            } catch(err) {
                console.warn('[payroll] thermal fallback:', err);
            }
        }

        const monthLabel = MONTHS_AR[_state.month] + ' ' + _state.year;
        const bizName = currentUser?.businessName || 'النشاط';

        let html = `<html dir="rtl"><head><meta charset="UTF-8"><title>كشف الرواتب - ${monthLabel}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Arial; padding: 20px; }
            h1 { text-align: center; color: #2c3e50; }
            .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #2c3e50; color: white; padding: 10px 6px; font-size: 12px; text-align: right; }
            td { padding: 10px 6px; border-bottom: 1px solid #eee; font-size: 12px; }
            .total-row { background: #e8f5e9; font-weight: 700; color: #27ae60; }
            .net { color: #27ae60; font-weight: 700; }
            .deduction { color: #e74c3c; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ccc; font-size: 11px; color: #999; }
            @media print { body { padding: 10px; } }
        </style>
        </head><body>
            <h1>${bizName}</h1>
            <div class="subtitle">كشف الرواتب — ${monthLabel}</div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>الوظيفة</th>
                        <th>الأيام</th>
                        <th>الأساسي</th>
                        <th>الخصم</th>
                        <th>السلف</th>
                        <th>الصافي</th>
                    </tr>
                </thead>
                <tbody>`;

        let totalBase = 0, totalDed = 0, totalAdv = 0, totalNet = 0;
        data.forEach((e, i) => {
            totalBase += e.baseDue;
            totalDed += e.unpaidDeduction;
            totalAdv += e.advancesTotal;
            totalNet += e.netSalary;
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${_esc(e.fullName)}</td>
                    <td>${_esc(e.roleName || '—')}</td>
                    <td>${e.workedDays}/${e.daysInMonth}</td>
                    <td>${_fmt(e.baseDue)}</td>
                    <td class="deduction">${e.unpaidDeduction > 0 ? '- ' + _fmt(e.unpaidDeduction) : '—'}</td>
                    <td class="deduction">${e.advancesTotal > 0 ? '- ' + _fmt(e.advancesTotal) : '—'}</td>
                    <td class="net">${_fmt(e.netSalary)}</td>
                </tr>`;
        });

        html += `
                    <tr class="total-row">
                        <td colspan="4">الإجمالي</td>
                        <td>${_fmt(totalBase)}</td>
                        <td>- ${_fmt(totalDed)}</td>
                        <td>- ${_fmt(totalAdv)}</td>
                        <td>${_fmt(totalNet)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="footer">
                تم الإصدار في ${new Date().toLocaleString('ar-SY')}
            </div>
        </body></html>`;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 500);
    };

    // ═══ تسليم الراتب ═══
    window._payrollPayOne = async function(uid) {
        const e = _state.data.find(x => x.uid === uid);
        if (!e) return;

        if (!confirm(`✅ تسليم راتب ${e.fullName}؟\n\n💰 الصافي: ${_fmt(e.netSalary)}\n\nسيُسجَّل في السجل كمدفوع.`)) return;

        try {
            const monthStr = _state.year + '-' + String(_state.month + 1).padStart(2, '0');
            const salaryId = 'salary_' + e.uid + '_' + monthStr;

            await db.collection('users').doc(currentUser.uid)
                .collection('salaries').doc(salaryId).set({
                    empUid: e.uid,
                    empName: e.fullName,
                    empRole: e.roleName,
                    year: _state.year,
                    month: _state.month,
                    monthLabel: MONTHS_AR[_state.month] + ' ' + _state.year,
                    baseSalary: e.baseSalary,
                    salaryType: e.salaryType,
                    workedDays: e.workedDays,
                    workedHours: e.workedHours,
                    paidLeaveDays: e.paidLeaveDays,
                    unpaidLeaveDays: e.unpaidLeaveDays,
                    baseDue: e.baseDue,
                    unpaidDeduction: e.unpaidDeduction,
                    advancesTotal: e.advancesTotal,
                    netSalary: e.netSalary,
                    status: 'paid',
                    paidAt: firebase.firestore.FieldValue.serverTimestamp(),
                    paidBy: currentUser.uid
                });

            // تحديث السلف → deducted
            for (const adv of e.advances) {
                try {
                    await db.collection('users').doc(currentUser.uid)
                        .collection('advances').doc(adv.id).update({
                            status: 'deducted',
                            deductedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            deductedInSalaryId: salaryId
                        });
                } catch(err) {}
            }

            if (typeof toast === 'function') toast('✅ تم تسليم الراتب', 'success');

            // عرض قسيمة
            setTimeout(() => _printSlip(e), 500);
        } catch(err) {
            alert('❌ ' + err.message);
        }
    };

    console.log('💰 [payroll] ready');
})();
