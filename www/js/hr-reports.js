// ============================================================
//  📊 HR REPORTS — تقارير الموارد البشرية المتقدمة
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = {
        period: 'month',
        sortBy: 'hours',
        filterEmployee: 'all'
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
    function _initials(name) {
        if (!name) return '؟';
        return name.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
    }
    function _fmtHours(h) {
        const v = Number(h) || 0;
        const hours = Math.floor(v);
        const mins = Math.round((v - hours) * 60);
        if (mins === 0) return hours + ' س';
        return hours + 'س ' + mins + 'د';
    }
    function _fmtMinutes(h) {
        const v = Number(h) || 0;
        return Math.round(v * 60) + ' د';
    }
    function _dateStr(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const day = String(d.getDate()).padStart(2,'0');
        return y + '-' + m + '-' + day;
    }

    // ═══ قائمة الموظفين ═══
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

    // ═══ قراءة الحضور لعدد أيام ═══
    async function _getAttendance(daysBack) {
        const days = [];
        const today = new Date();
        for (let i = 0; i < daysBack; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(_dateStr(d));
        }

        const tasks = days.map(date => 
            db.collection('users').doc(currentUser.uid)
                .collection('attendance').doc(date).get()
                .then(snap => ({ date, records: snap.exists ? (snap.data().records || {}) : {} }))
                .catch(() => ({ date, records: {} }))
        );

        const results = await Promise.all(tasks);
        const out = {};
        results.forEach(r => { out[r.date] = r.records; });
        return { days, byDate: out };
    }

    // ═══ قراءة الإجازات ═══
    async function _getLeaves() {
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('leaves').get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
        } catch(e) { return []; }
    }

    // ═══ قراءة السلف ═══
    async function _getAdvances() {
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('advances').get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
        } catch(e) { return []; }
    }

    // ═══ فترة الأيام ═══
    function _getDaysBack() {
        if (_state.period === 'today') return 1;
        if (_state.period === 'week') return 7;
        if (_state.period === 'month') return 30;
        if (_state.period === 'quarter') return 90;
        return 30;
    }

    // ═══ حساب أداء كل موظف ═══
    function _computeEmployeeStats(emp, attendance, days, leaves, advances) {
        const stats = {
            uid: emp.uid,
            fullName: emp.fullName || 'بدون اسم',
            roleName: emp.roleName || '',
            phone: emp.phone || '',
            salary: Number(emp.salary) || 0,
            // الحضور
            daysWorked: 0,
            totalHours: 0,
            avgHoursPerDay: 0,
            // التأخيرات (بعد 09:00)
            lates: 0,
            totalLateMinutes: 0,
            // الحضور المبكر
            earlyDays: 0,
            // الغيابات (يوم بدون checkIn)
            absences: 0,
            // الإجازات المستخدمة
            leavesUsed: 0,
            leavesPaid: 0,
            leavesUnpaid: 0,
            // السلف النشطة
            activeAdvances: 0,
            // تقييم
            score: 0,
            stars: 0
        };

        // ═══ الحضور اليومي ═══
        const todayStr = _dateStr(new Date());
        days.forEach(date => {
            const rec = attendance[date]?.[emp.uid];
            if (rec && rec.checkIn) {
                stats.daysWorked++;
                const hours = Number(rec.hours) || 0;
                stats.totalHours += hours;

                // حساب التأخير (09:00 = 540 دقيقة)
                const inDate = new Date(rec.checkIn);
                const inMinutes = inDate.getHours() * 60 + inDate.getMinutes();
                const lateBy = inMinutes - (9 * 60);
                if (lateBy > 5) {
                    stats.lates++;
                    stats.totalLateMinutes += lateBy;
                } else if (lateBy < -30) {
                    stats.earlyDays++;
                }
            } else if (date !== todayStr) {
                // يوم مرّ بدون حضور
                // نتحقق: هل كان يوم إجازة؟
                const onLeave = leaves.some(l => 
                    l.empUid === emp.uid &&
                    l.status === 'approved' &&
                    date >= l.from && date <= l.to
                );
                if (!onLeave) stats.absences++;
            }
        });

        stats.avgHoursPerDay = stats.daysWorked > 0 
            ? stats.totalHours / stats.daysWorked 
            : 0;

        // ═══ الإجازات ═══
        leaves.filter(l => l.empUid === emp.uid && l.status === 'approved').forEach(l => {
            const d = Number(l.days) || 0;
            stats.leavesUsed += d;
            if (l.type === 'unpaid') stats.leavesUnpaid += d;
            else stats.leavesPaid += d;
        });

        // ═══ السلف النشطة ═══
        advances.filter(a => a.empUid === emp.uid && a.status === 'active').forEach(a => {
            stats.activeAdvances += Number(a.amount) || 0;
        });

        // ═══ التقييم (نسبة مئوية) ═══
        const expectedDays = days.length;
        const attendanceRate = expectedDays > 0 ? (stats.daysWorked / expectedDays) * 100 : 0;

        // حساب نجمات (0-5)
        let score = 0;

        // ① الحضور (40%)
        score += (attendanceRate / 100) * 40;

        // ② التأخير (20%)
        const lateRatio = stats.daysWorked > 0 ? stats.lates / stats.daysWorked : 0;
        score += (1 - Math.min(1, lateRatio * 2)) * 20;

        // ③ الغياب (20%)
        const absenceRatio = expectedDays > 0 ? stats.absences / expectedDays : 0;
        score += (1 - Math.min(1, absenceRatio * 3)) * 20;

        // ④ الساعات الإضافية (20%)
        const avgHours = stats.avgHoursPerDay;
        if (avgHours >= 8) score += 20;
        else if (avgHours >= 6) score += 15;
        else if (avgHours >= 4) score += 10;
        else if (avgHours > 0) score += 5;

        stats.score = Math.round(score * 10) / 10;

        // نجمات (من 5)
        stats.stars = Math.round((score / 100) * 5 * 2) / 2;

        stats.attendanceRate = Math.round(attendanceRate * 10) / 10;

        return stats;
    }

    // ═══ Render ═══
    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحليل...</div>';

        try {
            const daysBack = _getDaysBack();
            const [employees, attendanceData, leaves, advances] = await Promise.all([
                _getEmployees(),
                _getAttendance(daysBack),
                _getLeaves(),
                _getAdvances()
            ]);

            if (employees.length === 0) {
                container.innerHTML = `
                    <h2 style="margin:0 0 6px 0;font-size:20px;">📊 تقارير الموارد البشرية</h2>
                    <div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                        <div style="font-size:48px;margin-bottom:10px;">👥</div>
                        <div style="font-size:15px;font-weight:600;">لا يوجد موظفون مرتبطون</div>
                        <div style="font-size:13px;margin-top:6px;">اربط موظفين من "الأدوار الوظيفية"</div>
                    </div>`;
                return;
            }

            const stats = employees.map(e => 
                _computeEmployeeStats(e, attendanceData.byDate, attendanceData.days, leaves, advances)
            );

            _renderContent(container, stats, daysBack);
        } catch(e) {
            console.error('[hr-reports]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
        }
    }

    function _renderContent(container, stats, daysBack) {
        // ترتيب
        let sorted = [...stats];
        if (_state.sortBy === 'hours') sorted.sort((a, b) => b.totalHours - a.totalHours);
        else if (_state.sortBy === 'days') sorted.sort((a, b) => b.daysWorked - a.daysWorked);
        else if (_state.sortBy === 'score') sorted.sort((a, b) => b.score - a.score);
        else if (_state.sortBy === 'lates') sorted.sort((a, b) => a.lates - b.lates);
        else if (_state.sortBy === 'absences') sorted.sort((a, b) => a.absences - b.absences);

        // إحصائيات عامة
        const totals = {
            employees: stats.length,
            hours: stats.reduce((s, x) => s + x.totalHours, 0),
            days: stats.reduce((s, x) => s + x.daysWorked, 0),
            lates: stats.reduce((s, x) => s + x.lates, 0),
            absences: stats.reduce((s, x) => s + x.absences, 0),
            avgScore: stats.length > 0 ? stats.reduce((s, x) => s + x.score, 0) / stats.length : 0
        };

        const periodLabel = _state.period === 'today' ? 'اليوم'
            : _state.period === 'week' ? 'آخر 7 أيام'
            : _state.period === 'month' ? 'آخر 30 يوم'
            : _state.period === 'quarter' ? 'آخر 90 يوم' : 'الشهر';

        const topPerformer = sorted.length > 0 && sorted[0].score > 0 
            ? [...stats].sort((a, b) => b.score - a.score)[0] 
            : null;

        let topBanner = '';
        if (topPerformer) {
            topBanner = `
                <div style="background:linear-gradient(135deg,#f39c12,#e67e22);color:white;border-radius:14px;padding:16px;margin-bottom:15px;box-shadow:0 4px 15px rgba(243,156,18,0.3);">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="font-size:42px;">🏆</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:11px;opacity:0.9;">أفضل موظف — ${periodLabel}</div>
                            <div style="font-size:18px;font-weight:700;margin-top:3px;">${_esc(topPerformer.fullName)}</div>
                            <div style="font-size:12px;opacity:0.9;margin-top:4px;">
                                ⭐ ${topPerformer.stars}/5 • ${_fmtHours(topPerformer.totalHours)} • ${topPerformer.daysWorked} يوم
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        let listHtml = '';
        sorted.forEach((e, idx) => {
            listHtml += _renderEmployeeCard(e, idx);
        });

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">📊 تقارير الموارد البشرية</h2>
            <p style="color:#666;font-size:13px;margin:0 0 12px 0;">أداء وإنتاجية الموظفين — ${periodLabel}</p>

            <!-- فترة -->
            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    { id: 'today', label: '📅 اليوم' },
                    { id: 'week', label: '📆 الأسبوع' },
                    { id: 'month', label: '🗓️ الشهر' },
                    { id: 'quarter', label: '📊 90 يوم' }
                ].map(p => `
                    <button onclick="_hrRptPeriod('${p.id}')" style="flex-shrink:0;padding:8px 16px;background:${_state.period === p.id ? '#2c3e50' : 'white'};color:${_state.period === p.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.period === p.id ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">
                        ${p.label}
                    </button>`).join('')}
            </div>

            ${topBanner}

            <!-- KPI عام -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:12px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">👥 الموظفون</div>
                    <div style="font-size:20px;font-weight:700;margin-top:4px;">${totals.employees}</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:12px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">⏱️ ساعات العمل</div>
                    <div style="font-size:18px;font-weight:700;margin-top:4px;">${Math.round(totals.hours)}</div>
                </div>
                <div style="background:linear-gradient(135deg,#e67e22,#d35400);color:white;border-radius:12px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">⏰ التأخيرات</div>
                    <div style="font-size:18px;font-weight:700;margin-top:4px;">${totals.lates}</div>
                </div>
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:12px;padding:12px;">
                    <div style="font-size:11px;opacity:0.9;">❌ الغيابات</div>
                    <div style="font-size:18px;font-weight:700;margin-top:4px;">${totals.absences}</div>
                </div>
            </div>

            <!-- متوسط التقييم -->
            <div style="background:linear-gradient(135deg,#8e44ad,#6c3483);color:white;border-radius:12px;padding:14px;text-align:center;margin-bottom:15px;">
                <div style="font-size:12px;opacity:0.9;">⭐ متوسط تقييم الفريق</div>
                <div style="font-size:24px;font-weight:700;margin-top:4px;">${totals.avgScore.toFixed(1)} / 100</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">${'⭐'.repeat(Math.round(totals.avgScore / 20))}</div>
            </div>

            <!-- الترتيب -->
            <div style="display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    { id: 'hours', label: '⏱️ ساعات' },
                    { id: 'days', label: '📅 أيام' },
                    { id: 'score', label: '⭐ تقييم' },
                    { id: 'lates', label: '⏰ تأخير أقل' },
                    { id: 'absences', label: '❌ غياب أقل' }
                ].map(s => `
                    <button onclick="_hrRptSort('${s.id}')" style="flex-shrink:0;padding:7px 12px;background:${_state.sortBy === s.id ? '#27ae60' : 'white'};color:${_state.sortBy === s.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.sortBy === s.id ? '#27ae60' : '#ddd'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">
                        ${s.label}
                    </button>`).join('')}
            </div>

            <div style="width:100%;box-sizing:border-box;">${listHtml}</div>
        `;
    }

    function _renderEmployeeCard(e, idx) {
        const medals = ['🥇','🥈','🥉'];
        const rank = idx < 3 ? medals[idx] : '<span style="color:#999;font-weight:700;font-size:14px;">' + (idx+1) + '.</span>';

        // لون التقييم
        let scoreColor = '#95a5a6';
        if (e.score >= 85) scoreColor = '#27ae60';
        else if (e.score >= 70) scoreColor = '#3498db';
        else if (e.score >= 50) scoreColor = '#f39c12';
        else if (e.score > 0) scoreColor = '#e74c3c';

        // نجمات
        const starsHtml = '⭐'.repeat(Math.floor(e.stars)) + (e.stars % 1 >= 0.5 ? '½' : '');

        return `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${scoreColor};box-sizing:border-box;width:100%;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="font-size:20px;flex-shrink:0;width:32px;text-align:center;">${rank}</div>
                    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,${scoreColor},${scoreColor});color:white;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;">
                        ${_initials(e.fullName)}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#2c3e50;font-size:14px;">${_esc(e.fullName)}</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">🎯 ${_esc(e.roleName || '—')}</div>
                    </div>
                    <div style="text-align:left;flex-shrink:0;">
                        <div style="background:${scoreColor};color:white;padding:4px 10px;border-radius:8px;font-size:13px;font-weight:700;">${e.score}</div>
                        <div style="font-size:10px;color:#666;margin-top:3px;text-align:center;">${starsHtml}</div>
                    </div>
                </div>

                <!-- التفاصيل -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;">
                    <div style="background:#f8f9fa;border-radius:6px;padding:6px 8px;">
                        <div style="color:#666;font-size:10px;">⏱️ الساعات</div>
                        <div style="font-weight:700;color:#2c3e50;">${_fmtHours(e.totalHours)}</div>
                    </div>
                    <div style="background:#f8f9fa;border-radius:6px;padding:6px 8px;">
                        <div style="color:#666;font-size:10px;">📅 الأيام</div>
                        <div style="font-weight:700;color:#2c3e50;">${e.daysWorked}</div>
                    </div>
                    <div style="background:${e.lates > 0 ? '#fff3cd' : '#e8f5e9'};border-radius:6px;padding:6px 8px;">
                        <div style="color:#666;font-size:10px;">⏰ التأخيرات</div>
                        <div style="font-weight:700;color:${e.lates > 0 ? '#856404' : '#155724'};">${e.lates}${e.totalLateMinutes > 0 ? ' (' + _fmtMinutes(e.totalLateMinutes/60) + ')' : ''}</div>
                    </div>
                    <div style="background:${e.absences > 0 ? '#ffebee' : '#e8f5e9'};border-radius:6px;padding:6px 8px;">
                        <div style="color:#666;font-size:10px;">❌ الغيابات</div>
                        <div style="font-weight:700;color:${e.absences > 0 ? '#c62828' : '#2e7d32'};">${e.absences}</div>
                    </div>
                </div>

                <!-- شريط التقييم -->
                <div style="margin-top:10px;">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:#666;margin-bottom:4px;">
                        <span>نسبة الحضور</span>
                        <span style="font-weight:700;color:${scoreColor};">${e.attendanceRate}%</span>
                    </div>
                    <div style="background:#ecf0f1;border-radius:6px;height:6px;overflow:hidden;">
                        <div style="background:${scoreColor};height:100%;width:${Math.min(100, e.attendanceRate)}%;"></div>
                    </div>
                </div>

                ${(e.leavesUsed > 0 || e.activeAdvances > 0) ? `
                    <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #eee;font-size:11px;color:#666;display:flex;flex-wrap:wrap;gap:8px;">
                        ${e.leavesUsed > 0 ? '<span>🏖️ ' + e.leavesUsed + ' يوم إجازة</span>' : ''}
                        ${e.activeAdvances > 0 ? '<span>💵 سلف نشطة: ' + e.activeAdvances.toLocaleString() + ' ل.س</span>' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ═══ API ═══
    window.openHRReports = function() {
        let cont = document.getElementById('page-hr-reports');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-hr-reports';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-hr-reports');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    window._hrRptPeriod = function(p) {
        _state.period = p;
        const c = document.getElementById('page-hr-reports');
        if (c) _render(c);
    };

    window._hrRptSort = function(s) {
        _state.sortBy = s;
        const c = document.getElementById('page-hr-reports');
        if (c) _render(c);
    };

    console.log('📊 [hr-reports] ready');
})();
