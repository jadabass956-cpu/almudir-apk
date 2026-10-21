// ============================================================
//  📋 ATTENDANCE ADMIN — لوحة إدارة الحضور للمدير
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { period: 'today', date: null };

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function _todayStr() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    }
    function _fmtTime(ts) {
        if (!ts) return '—';
        return new Date(ts).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    function _fmtDate(day) {
        if (!day) return '—';
        const d = new Date(day + 'T00:00:00');
        return d.toLocaleDateString('ar-SY', { weekday: 'long', day: 'numeric', month: 'short' });
    }
    function _fmtHours(h) {
        const v = Number(h) || 0;
        const hours = Math.floor(v);
        const mins = Math.round((v - hours) * 60);
        if (mins === 0) return hours + ' س';
        return hours + 'س ' + mins + 'د';
    }

    // ═══ جلب الموظفين المرتبطين ═══
    async function _getEmployees() {
        // استعلام بسيط (بلا Composite Index) + فلترة يدوية
        try {
            const snap = await db.collection('users')
                .where('ownerUid', '==', currentUser.uid)
                .get();
            const list = [];
            snap.forEach(d => {
                const data = d.data();
                if (data.linkStatus !== 'active') return;
                list.push({
                    uid: d.id,
                    name: data.fullName || data.email || 'موظف',
                    roleName: data.roleName || '',
                    phone: data.phone || ''
                });
            });
            return list;
        } catch(e) {
            console.error('[attendance-admin] employees:', e.message);
            return [];
        }
    }

    // ═══ قراءة سجل يوم واحد ═══
    async function _getDayRecords(date) {
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('attendance').doc(date).get();
            if (!snap.exists) return {};
            return snap.data().records || {};
        } catch(e) {
            console.warn('[attendance] read:', e.message);
            return {};
        }
    }

    // ═══ قراءة نطاق أيام ═══
    async function _getRangeRecords(fromDate, toDate) {
        // اقرأ سجلات آخر 30 يوم
        const out = {};
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const tasks = [];
        let d = new Date(start);
        while (d <= end) {
            const y = d.getFullYear();
            const m = String(d.getMonth()+1).padStart(2,'0');
            const day = String(d.getDate()).padStart(2,'0');
            const date = y + '-' + m + '-' + day;
            tasks.push(
                db.collection('users').doc(currentUser.uid)
                    .collection('attendance').doc(date).get()
                    .then(snap => ({ date, data: snap.exists ? (snap.data().records || {}) : {} }))
                    .catch(() => ({ date, data: {} }))
            );
            d.setDate(d.getDate() + 1);
        }
        const results = await Promise.all(tasks);
        results.forEach(r => { out[r.date] = r.data; });
        return out;
    }

    // ═══ الحصول على التواريخ حسب الفترة ═══
    function _getDates() {
        const today = new Date();
        if (_state.period === 'today') {
            return { from: _todayStr(), to: _todayStr(), days: 1 };
        }
        if (_state.period === 'week') {
            const from = new Date(today);
            from.setDate(from.getDate() - 6);
            return { from: _dateStr(from), to: _todayStr(), days: 7 };
        }
        if (_state.period === 'month') {
            const from = new Date(today);
            from.setDate(from.getDate() - 29);
            return { from: _dateStr(from), to: _todayStr(), days: 30 };
        }
        return { from: _todayStr(), to: _todayStr(), days: 1 };
    }
    function _dateStr(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const day = String(d.getDate()).padStart(2,'0');
        return y + '-' + m + '-' + day;
    }

    // ═══ Render ═══
    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        if (!currentUser?.uid) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">يجب تسجيل الدخول</div>';
            return;
        }

        try {
            const employees = await _getEmployees();

            if (employees.length === 0) {
                container.innerHTML = `
                    <h2 style="margin:0 0 6px 0;font-size:20px;">📋 إدارة الحضور</h2>
                    <div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                        <div style="font-size:48px;margin-bottom:10px;">👥</div>
                        <div style="font-size:15px;font-weight:600;">لا يوجد موظفون مرتبطون</div>
                        <div style="font-size:13px;margin-top:6px;">اربط موظفين أولاً من الأدوار الوظيفية</div>
                    </div>`;
                return;
            }

            const dates = _getDates();
            const records = dates.days === 1
                ? { [dates.from]: await _getDayRecords(dates.from) }
                : await _getRangeRecords(dates.from, dates.to);

            let html = `
                <h2 style="margin:0 0 6px 0;font-size:20px;">📋 إدارة الحضور</h2>
                <p style="color:#666;font-size:13px;margin:0 0 12px 0;">متابعة حضور الموظفين + تعديل يدوي</p>

                <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;">
                    ${[
                        { id: 'today', label: '📅 اليوم' },
                        { id: 'week',  label: '📆 الأسبوع' },
                        { id: 'month', label: '🗓️ الشهر' }
                    ].map(p => `
                        <button onclick="_attAdmPeriod('${p.id}')" style="padding:8px 16px;background:${_state.period === p.id ? '#2c3e50' : 'white'};color:${_state.period === p.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.period === p.id ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">
                            ${p.label}
                        </button>`).join('')}
                </div>

                <button onclick="_attAdmAddManual()" style="width:100%;padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:15px;box-shadow:0 3px 8px rgba(39,174,96,0.3);">
                    ➕ تسجيل حضور يدوي
                </button>
            `;

            // حساب الإحصائيات
            const stats = _computeStats(employees, records, dates);
            html += _renderStats(stats);

            // عرض حسب الفترة
            if (dates.days === 1) {
                html += _renderDayView(employees, records[dates.from] || {}, dates.from);
            } else {
                html += _renderRangeView(employees, records, dates);
            }

            container.innerHTML = html;
        } catch(e) {
            console.error('[attendance-admin]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
        }
    }

    function _computeStats(employees, records, dates) {
        let totalSessions = 0;
        let totalHours = 0;
        const presentToday = new Set();

        Object.keys(records).forEach(date => {
            const dayRecords = records[date] || {};
            Object.keys(dayRecords).forEach(empUid => {
                const rec = dayRecords[empUid];
                if (rec && rec.checkIn) {
                    totalSessions++;
                    totalHours += Number(rec.hours) || 0;
                    if (date === _todayStr()) presentToday.add(empUid);
                }
            });
        });

        return {
            totalEmployees: employees.length,
            totalSessions,
            totalHours: Math.round(totalHours * 100) / 100,
            presentToday: presentToday.size,
            absentToday: employees.length - presentToday.size,
            days: dates.days
        };
    }

    function _renderStats(s) {
        return `
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${s.presentToday}</div>
                    <div style="font-size:10px;opacity:0.9;margin-top:3px;">✅ حاضر اليوم</div>
                </div>
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${s.absentToday}</div>
                    <div style="font-size:10px;opacity:0.9;margin-top:3px;">❌ غائب اليوم</div>
                </div>
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${s.totalHours.toFixed(0)}</div>
                    <div style="font-size:10px;opacity:0.9;margin-top:3px;">⏱️ ساعات (${s.days}ي)</div>
                </div>
            </div>
        `;
    }

    function _renderDayView(employees, dayRecords, date) {
        let html = `
            <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <div style="font-weight:700;font-size:14px;color:#2c3e50;margin-bottom:12px;">
                    📅 ${_fmtDate(date)}
                </div>
        `;

        // ترتيب: حاضرون أولاً
        const sorted = [...employees].sort((a, b) => {
            const aP = dayRecords[a.uid]?.checkIn ? 1 : 0;
            const bP = dayRecords[b.uid]?.checkIn ? 1 : 0;
            return bP - aP;
        });

        sorted.forEach(e => {
            const rec = dayRecords[e.uid];
            let statusHtml;
            let rowBorder = '#e74c3c';

            if (!rec || !rec.checkIn) {
                statusHtml = '<div style="color:#e74c3c;font-size:12px;">❌ لم يحضر</div>';
            } else if (!rec.checkOut) {
                statusHtml = `<div style="color:#f39c12;font-size:12px;">🟢 منذ ${_fmtTime(rec.checkIn)}</div>`;
                rowBorder = '#f39c12';
            } else {
                statusHtml = `<div style="color:#27ae60;font-size:12px;">✅ ${_fmtTime(rec.checkIn)} → ${_fmtTime(rec.checkOut)}</div>
                    <div style="color:#27ae60;font-size:11px;font-weight:700;margin-top:2px;">⏱️ ${_fmtHours(rec.hours)}</div>`;
                rowBorder = '#27ae60';
            }

            html += `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8f9fa;border-radius:8px;margin-bottom:6px;border-right:3px solid ${rowBorder};">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:#2c3e50;font-size:13px;">${_esc(e.name)}</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">🎯 ${_esc(e.roleName || '—')}</div>
                        ${statusHtml}
                    </div>
                    <div style="display:flex;gap:5px;flex-shrink:0;">
                        <button onclick="_attAdmEdit('${_esc(e.uid)}', '${_esc(date)}')" style="padding:7px 11px;background:#3498db;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">✏️ تعديل</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    function _renderRangeView(employees, records, dates) {
        // إجمالي كل موظف في الفترة
        const totals = {};
        employees.forEach(e => { totals[e.uid] = { hours: 0, days: 0, name: e.name, role: e.roleName }; });
        Object.keys(records).forEach(date => {
            const dayRec = records[date] || {};
            Object.keys(dayRec).forEach(empUid => {
                const rec = dayRec[empUid];
                if (rec && rec.checkIn) {
                    if (!totals[empUid]) totals[empUid] = { hours: 0, days: 0, name: rec.empName || 'موظف', role: rec.empRole || '' };
                    totals[empUid].hours += Number(rec.hours) || 0;
                    totals[empUid].days += 1;
                }
            });
        });

        const sorted = Object.keys(totals)
            .map(uid => ({ uid, ...totals[uid] }))
            .sort((a, b) => b.hours - a.hours);

        let html = `
            <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <div style="font-weight:700;font-size:14px;color:#2c3e50;margin-bottom:12px;">
                    📊 إجمالي الفترة (${dates.days} يوم)
                </div>
        `;

        sorted.forEach((t, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
            html += `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8f9fa;border-radius:8px;margin-bottom:6px;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:#2c3e50;font-size:13px;">${medal} ${_esc(t.name)}</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">🎯 ${_esc(t.role || '—')} • 📅 ${t.days} يوم</div>
                    </div>
                    <div style="font-weight:700;color:#27ae60;font-size:14px;flex-shrink:0;">
                        ${_fmtHours(t.hours)}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    // ═══ Public API ═══
    window.openAttendanceManager = function() {
        let cont = document.getElementById('page-attendance-admin');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-attendance-admin';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-attendance-admin');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    window._attAdmPeriod = function(p) {
        _state.period = p;
        const c = document.getElementById('page-attendance-admin');
        if (c) _render(c);
    };

    // ═══ تعديل سجل موظف في يوم ═══
    window._attAdmEdit = async function(empUid, date) {
        const employees = await _getEmployees();
        const emp = employees.find(e => e.uid === empUid);
        if (!emp) { alert('❌ الموظف غير موجود'); return; }

        const records = await _getDayRecords(date);
        const rec = records[empUid] || {};

        const inTime = rec.checkIn ? new Date(rec.checkIn).toISOString().slice(11, 16) : '';
        const outTime = rec.checkOut ? new Date(rec.checkOut).toISOString().slice(11, 16) : '';

        const old = document.getElementById('attEditModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'attEditModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:420px;width:100%;padding:20px;box-sizing:border-box;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h3 style="margin:0;font-size:16px;">✏️ تعديل الحضور</h3>
                    <button onclick="document.getElementById('attEditModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>
                </div>
                <div style="background:#f8f9fa;border-radius:10px;padding:12px;margin-bottom:15px;">
                    <div style="font-weight:700;color:#2c3e50;font-size:14px;">👤 ${_esc(emp.name)}</div>
                    <div style="font-size:12px;color:#666;margin-top:3px;">📅 ${_fmtDate(date)}</div>
                </div>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🕐 وقت الدخول</label>
                <input type="time" id="attEditIn" value="${_esc(inTime)}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;font-size:14px;">

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🕐 وقت الخروج</label>
                <input type="time" id="attEditOut" value="${_esc(outTime)}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:15px;font-family:inherit;font-size:14px;">

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('attEditModal').remove()" style="padding:12px;background:#95a5a6;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                    <button onclick="_attAdmSaveEdit('${_esc(empUid)}', '${_esc(date)}')" style="padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">💾 حفظ</button>
                </div>

                <button onclick="_attAdmDeleteRecord('${_esc(empUid)}', '${_esc(date)}')" style="width:100%;padding:10px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:10px;">🗑️ حذف السجل</button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window._attAdmSaveEdit = async function(empUid, date) {
        const inTime = document.getElementById('attEditIn').value;
        const outTime = document.getElementById('attEditOut').value;

        try {
            const ref = db.collection('users').doc(currentUser.uid)
                .collection('attendance').doc(date);
            const snap = await ref.get();
            const records = snap.exists ? (snap.data().records || {}) : {};

            const emp = await db.collection('users').doc(empUid).get();
            const empName = emp.exists ? (emp.data().fullName || '') : '';
            const empRole = emp.exists ? (emp.data().roleName || '') : '';

            let rec = records[empUid] || { empName, empRole };
            let checkIn = rec.checkIn;
            let checkOut = rec.checkOut;

            if (inTime) {
                const [h, m] = inTime.split(':').map(Number);
                const d = new Date(date + 'T00:00:00');
                d.setHours(h, m, 0, 0);
                checkIn = d.getTime();
            } else {
                checkIn = null;
            }

            if (outTime) {
                const [h, m] = outTime.split(':').map(Number);
                const d = new Date(date + 'T00:00:00');
                d.setHours(h, m, 0, 0);
                checkOut = d.getTime();
            } else {
                checkOut = null;
            }

            if (!checkIn) {
                delete records[empUid];
            } else {
                const hours = checkOut ? (checkOut - checkIn) / 3600000 : 0;
                records[empUid] = {
                    ...rec,
                    checkIn,
                    checkOut,
                    hours: Math.round(hours * 100) / 100,
                    empName,
                    empRole,
                    editedBy: currentUser.uid,
                    editedAt: Date.now()
                };
            }

            await ref.set({ records, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            document.getElementById('attEditModal').remove();

            if (typeof toast === 'function') toast('✅ تم الحفظ', 'success');
            const c = document.getElementById('page-attendance-admin');
            if (c) _render(c);
        } catch(e) {
            console.error(e);
            alert('❌ ' + e.message);
        }
    };

    window._attAdmDeleteRecord = async function(empUid, date) {
        if (!confirm('🗑️ حذف سجل هذا الموظف لهذا اليوم؟')) return;
        try {
            const ref = db.collection('users').doc(currentUser.uid)
                .collection('attendance').doc(date);
            const snap = await ref.get();
            if (!snap.exists) return;
            const records = snap.data().records || {};
            delete records[empUid];
            await ref.set({ records, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            document.getElementById('attEditModal').remove();
            if (typeof toast === 'function') toast('✅ تم الحذف', 'success');
            const c = document.getElementById('page-attendance-admin');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    // ═══ تسجيل حضور يدوي ═══
    window._attAdmAddManual = async function() {
        const employees = await _getEmployees();
        if (employees.length === 0) { alert('لا يوجد موظفون'); return; }

        const options = employees.map(e => `<option value="${_esc(e.uid)}">${_esc(e.name)} — ${_esc(e.roleName || '')}</option>`).join('');

        const old = document.getElementById('attManualModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'attManualModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:420px;width:100%;padding:20px;box-sizing:border-box;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h3 style="margin:0;font-size:16px;">➕ تسجيل يدوي</h3>
                    <button onclick="document.getElementById('attManualModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>
                </div>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">👤 الموظف</label>
                <select id="attManualEmp" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;font-size:14px;background:white;">
                    ${options}
                </select>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">📅 التاريخ</label>
                <input type="date" id="attManualDate" value="${_todayStr()}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;font-size:14px;">

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">
                    <div>
                        <label style="display:block;font-size:12px;color:#555;font-weight:600;margin-bottom:5px;">🕐 دخول</label>
                        <input type="time" id="attManualIn" value="08:00" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;font-family:inherit;">
                    </div>
                    <div>
                        <label style="display:block;font-size:12px;color:#555;font-weight:600;margin-bottom:5px;">🕐 خروج</label>
                        <input type="time" id="attManualOut" value="22:00" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;font-family:inherit;">
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('attManualModal').remove()" style="padding:12px;background:#95a5a6;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                    <button onclick="_attAdmSaveManual()" style="padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">💾 حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window._attAdmSaveManual = async function() {
        const empUid = document.getElementById('attManualEmp').value;
        const date = document.getElementById('attManualDate').value;
        const inTime = document.getElementById('attManualIn').value;
        const outTime = document.getElementById('attManualOut').value;

        if (!empUid || !date) { alert('أكمل البيانات'); return; }

        try {
            const emp = await db.collection('users').doc(empUid).get();
            const empName = emp.exists ? (emp.data().fullName || '') : '';
            const empRole = emp.exists ? (emp.data().roleName || '') : '';

            const ref = db.collection('users').doc(currentUser.uid)
                .collection('attendance').doc(date);
            const snap = await ref.get();
            const records = snap.exists ? (snap.data().records || {}) : {};

            const d1 = new Date(date + 'T00:00:00');
            const [h1, m1] = inTime.split(':').map(Number);
            d1.setHours(h1, m1, 0, 0);

            const d2 = new Date(date + 'T00:00:00');
            const [h2, m2] = outTime.split(':').map(Number);
            d2.setHours(h2, m2, 0, 0);

            const hours = (d2.getTime() - d1.getTime()) / 3600000;

            records[empUid] = {
                checkIn: d1.getTime(),
                checkOut: d2.getTime(),
                hours: Math.round(hours * 100) / 100,
                empName, empRole,
                manual: true,
                addedBy: currentUser.uid,
                addedAt: Date.now()
            };

            await ref.set({ records, lastUpdated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            document.getElementById('attManualModal').remove();
            if (typeof toast === 'function') toast('✅ تم الحفظ', 'success');
            const c = document.getElementById('page-attendance-admin');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    console.log('📋 [attendance-admin] ready');
})();
