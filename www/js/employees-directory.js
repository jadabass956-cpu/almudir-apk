// ============================================================
//  👥 EMPLOYEES DIRECTORY — جدول الموظفين
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { search: '', roleFilter: 'all' };

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

    function _fmtDate(d) {
        if (!d) return '—';
        if (d.toDate) d = d.toDate();
        return new Date(d).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // ═══ فتح الصفحة ═══
    window.openEmployeesDirectory = function() {
        let cont = document.getElementById('page-employees-directory');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-employees-directory';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-employees-directory');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        if (!currentUser?.uid) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">يجب تسجيل الدخول</div>';
            return;
        }

        let employees = [];
        try {
            const snap = await db.collection('users')
                .where('ownerUid', '==', currentUser.uid).get();
            snap.forEach(d => {
                const u = d.data();
                if (u.linkStatus === 'active') {
                    employees.push({ uid: d.id, ...u });
                }
            });
        } catch(e) {
            console.error('[directory]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
            return;
        }

        // ترتيب حسب الاسم
        employees.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'ar'));

        // إحصائيات
        const totalSalaries = employees.reduce((s, e) => s + (Number(e.salary) || 0), 0);
        const withSalary = employees.filter(e => Number(e.salary) > 0);
        const avgSalary = withSalary.length > 0 ? totalSalaries / withSalary.length : 0;

        // فلترة
        let filtered = employees;
        if (_state.search) {
            const q = _state.search.toLowerCase();
            filtered = filtered.filter(e =>
                (e.fullName || '').toLowerCase().includes(q) ||
                (e.roleName || '').toLowerCase().includes(q) ||
                (e.phone || '').includes(q)
            );
        }
        if (_state.roleFilter !== 'all') {
            filtered = filtered.filter(e => e.roleName === _state.roleFilter);
        }

        // قائمة الأدوار الفريدة
        const roles = [...new Set(employees.map(e => e.roleName).filter(Boolean))];

        let listHtml = '';
        if (employees.length === 0) {
            listHtml = `<div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">👥</div>
                <div style="font-size:15px;font-weight:600;">لا يوجد موظفون مرتبطون</div>
                <div style="font-size:13px;margin-top:6px;">اربط موظفين من "الأدوار الوظيفية"</div>
            </div>`;
        } else if (filtered.length === 0) {
            listHtml = `<div style="text-align:center;padding:30px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:32px;margin-bottom:8px;">🔍</div>
                <div style="font-size:13px;">لا نتائج مطابقة</div>
            </div>`;
        } else {
            filtered.forEach(e => { listHtml += _card(e); });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">👥 جدول الموظفين</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">دليل شامل لموظفيك + بياناتهم</p>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${employees.length}</div>
                    <div style="font-size:10px;opacity:0.9;">👥 موظف</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:14px;font-weight:700;">${_fmt(totalSalaries)}</div>
                    <div style="font-size:10px;opacity:0.9;">💰 إجمالي شهري</div>
                </div>
                <div style="background:linear-gradient(135deg,#e67e22,#d35400);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:14px;font-weight:700;">${_fmt(avgSalary)}</div>
                    <div style="font-size:10px;opacity:0.9;">📊 متوسط</div>
                </div>
            </div>

            <input type="text" id="empDirSearch" value="${_esc(_state.search)}" placeholder="🔍 بحث بالاسم / المسمى / الهاتف"
                oninput="_empDirSearch(this.value)"
                style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:10px;font-family:inherit;">

            ${roles.length > 0 ? `
                <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;">
                    <button onclick="_empDirRole('all')" style="flex-shrink:0;padding:7px 14px;background:${_state.roleFilter === 'all' ? '#2c3e50' : 'white'};color:${_state.roleFilter === 'all' ? 'white' : '#2c3e50'};border:1.5px solid ${_state.roleFilter === 'all' ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">📋 الكل (${employees.length})</button>
                    ${roles.map(r => {
                        const count = employees.filter(e => e.roleName === r).length;
                        const active = _state.roleFilter === r;
                        return `<button onclick="_empDirRole('${_esc(r)}')" style="flex-shrink:0;padding:7px 14px;background:${active ? '#2c3e50' : 'white'};color:${active ? 'white' : '#2c3e50'};border:1.5px solid ${active ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🎯 ${_esc(r)} (${count})</button>`;
                    }).join('')}
                </div>
            ` : ''}

            <div style="width:100%;box-sizing:border-box;">${listHtml}</div>
        `;
    }

    function _card(e) {
        const salary = Number(e.salary) || 0;
        const salaryLabel = salary > 0 ? _fmt(salary) : '<span style="color:#999;font-size:11px;">—</span>';
        const salaryType = e.salaryType === 'daily' ? 'يومي' : e.salaryType === 'hourly' ? 'ساعي' : 'شهري';
        const hireDate = e.hireDate ? _fmtDate(e.hireDate) : '';
        const education = e.education || '';
        const experience = e.experience || '';

        return `
            <div onclick="_empDirView('${_esc(e.uid)}')" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid #3498db;box-sizing:border-box;width:100%;cursor:pointer;transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                    <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#3498db,#2980b9);color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">
                        ${_initials(e.fullName)}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#2c3e50;font-size:15px;">${_esc(e.fullName || 'بدون اسم')}</div>
                        ${e.roleName ? `<div style="font-size:12px;color:#666;margin-top:3px;">🎯 ${_esc(e.roleName)}</div>` : ''}
                        ${e.phone ? `<div style="font-size:11px;color:#888;margin-top:2px;direction:ltr;text-align:right;">📞 ${_esc(e.phone)}</div>` : ''}
                    </div>
                    <div style="text-align:left;flex-shrink:0;">
                        <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:700;">${salaryLabel}</div>
                        <div style="font-size:10px;color:#999;margin-top:3px;text-align:center;">${salaryType}</div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#666;">
                    ${education ? `<div>🎓 ${_esc(education)}</div>` : ''}
                    ${experience ? `<div>💼 ${_esc(experience)}</div>` : ''}
                    ${hireDate ? `<div style="grid-column:span 2;">📅 منذ ${hireDate}</div>` : ''}
                </div>
            </div>
        `;
    }

    // ═══ عرض تفاصيل موظف ═══
    window._empDirView = async function(empUid) {
        try {
            const snap = await db.collection('users').doc(empUid).get();
            if (!snap.exists) { alert('الموظف غير موجود'); return; }
            const e = { uid: empUid, ...snap.data() };

            // جلب ملخص الحضور
            let attendance = { totalDays: 0, totalHours: 0, presentToday: false };
            try {
                const today = new Date().toISOString().slice(0, 10);
                const attSnap = await db.collection('users').doc(currentUser.uid)
                    .collection('attendance').doc(today).get();
                if (attSnap.exists) {
                    const records = attSnap.data().records || {};
                    if (records[empUid] && records[empUid].checkIn) {
                        attendance.presentToday = true;
                    }
                }
            } catch(err) {}

            // جلب ملخص الإجازات
            let leaves = { total: 0, approved: 0, pending: 0 };
            try {
                const lSnap = await db.collection('users').doc(currentUser.uid)
                    .collection('leaves')
                    .where('empUid', '==', empUid).get();
                lSnap.forEach(d => {
                    const l = d.data();
                    leaves.total++;
                    if (l.status === 'approved') leaves.approved++;
                    if (l.status === 'pending') leaves.pending++;
                });
            } catch(err) {}

            _showDetailModal(e, attendance, leaves);
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    function _showDetailModal(e, attendance, leaves) {
        const old = document.getElementById('empDirViewModal');
        if (old) old.remove();

        const salary = Number(e.salary) || 0;
        const salaryLabel = salary > 0 ? _fmt(salary) : '—';
        const salaryType = e.salaryType === 'daily' ? 'يومي' : e.salaryType === 'hourly' ? 'ساعي' : 'شهري';

        const modal = document.createElement('div');
        modal.id = 'empDirViewModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:#f8f9fa;border-radius:16px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;padding:18px;box-sizing:border-box;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3 style="margin:0;font-size:17px;">👤 ملف الموظف</h3>
                    <button onclick="document.getElementById('empDirViewModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>

                <!-- البطاقة الرئيسية -->
                <div style="background:white;border-radius:12px;padding:18px;text-align:center;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#3498db,#2980b9);color:white;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;margin:0 auto 12px;">
                        ${_initials(e.fullName)}
                    </div>
                    <div style="font-size:18px;font-weight:700;color:#2c3e50;">${_esc(e.fullName || 'بدون اسم')}</div>
                    ${e.roleName ? `<div style="font-size:13px;color:#666;margin-top:4px;">🎯 ${_esc(e.roleName)}</div>` : ''}
                    ${attendance.presentToday ? '<div style="display:inline-block;background:#27ae60;color:white;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;margin-top:8px;">🟢 حاضر اليوم</div>' : ''}
                </div>

                <!-- الراتب -->
                ${salary > 0 ? `
                    <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:12px;padding:14px;margin-bottom:12px;text-align:center;">
                        <div style="font-size:11px;opacity:0.9;">💰 الراتب (${salaryType})</div>
                        <div style="font-size:24px;font-weight:700;margin-top:4px;">${salaryLabel}</div>
                    </div>
                ` : ''}

                <!-- البيانات الأساسية -->
                <div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                    <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:10px;">📋 البيانات الأساسية</div>
                    <div style="display:grid;gap:8px;">
                        ${e.phone ? `<div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:#666;">📞 الهاتف</span><span style="font-family:monospace;direction:ltr;">${_esc(e.phone)}</span></div>` : ''}
                        ${e.email ? `<div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:#666;">📧 البريد</span><span style="font-size:11px;direction:ltr;">${_esc(e.email)}</span></div>` : ''}
                        ${e.hireDate ? `<div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:#666;">📅 تاريخ التعيين</span><span>${_fmtDate(e.hireDate)}</span></div>` : ''}
                        ${e.nationalId ? `<div style="display:flex;justify-content:space-between;font-size:13px;"><span style="color:#666;">🆔 الهوية</span><span style="font-family:monospace;">${_esc(e.nationalId)}</span></div>` : ''}
                    </div>
                </div>

                <!-- التعليم والخبرة -->
                ${(e.education || e.experience || e.cvText || e.cvUrl) ? `
                    <div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                        <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:10px;">🎓 التعليم والخبرة</div>
                        ${e.education ? `<div style="margin-bottom:8px;font-size:13px;"><span style="color:#666;">🎓 الشهادة:</span> <b>${_esc(e.education)}</b></div>` : ''}
                        ${e.experience ? `<div style="margin-bottom:8px;font-size:13px;"><span style="color:#666;">💼 الخبرة:</span> ${_esc(e.experience)}</div>` : ''}
                        ${e.cvText ? `<div style="background:#f8f9fa;border-radius:8px;padding:10px;font-size:12px;color:#555;white-space:pre-line;margin-top:8px;">${_esc(e.cvText)}</div>` : ''}
                        ${e.cvUrl ? `<a href="${_esc(e.cvUrl)}" target="_blank" style="display:inline-block;margin-top:8px;padding:8px 14px;background:#3498db;color:white;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">📄 فتح السيرة الذاتية</a>` : ''}
                    </div>
                ` : ''}

                <!-- ملخص الحضور والإجازات -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                    <div style="background:white;border-radius:12px;padding:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);text-align:center;">
                        <div style="font-size:20px;font-weight:700;color:#16a085;">${leaves.total}</div>
                        <div style="font-size:11px;color:#666;margin-top:4px;">🏖️ إجمالي الإجازات</div>
                        <div style="font-size:10px;color:#27ae60;margin-top:2px;">${leaves.approved} موافق</div>
                    </div>
                    <div style="background:white;border-radius:12px;padding:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);text-align:center;">
                        <div style="font-size:20px;font-weight:700;color:#f39c12;">${leaves.pending}</div>
                        <div style="font-size:11px;color:#666;margin-top:4px;">⏳ إجازات معلقة</div>
                        <div style="font-size:10px;color:#999;margin-top:2px;">بانتظار قرارك</div>
                    </div>
                </div>

                <!-- الأزرار -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('empDirViewModal').remove(); _empDirEdit('${_esc(e.uid)}')" style="padding:13px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">✏️ تعديل</button>
                    ${e.phone ? `<a href="tel:${_esc(e.phone)}" style="padding:13px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;box-sizing:border-box;">📞 اتصال</a>` : `<button onclick="document.getElementById('empDirViewModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">إغلاق</button>`}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ═══ تعديل بيانات الموظف ═══
    window._empDirEdit = async function(empUid) {
        try {
            const snap = await db.collection('users').doc(empUid).get();
            if (!snap.exists) { alert('غير موجود'); return; }
            const e = snap.data();

            const old = document.getElementById('empDirEditModal');
            if (old) old.remove();

            const modal = document.createElement('div');
            modal.id = 'empDirEditModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;max-width:480px;width:100%;padding:22px;box-sizing:border-box;max-height:92vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h3 style="margin:0;font-size:17px;">✏️ تعديل بيانات الموظف</h3>
                        <button onclick="document.getElementById('empDirEditModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                    </div>

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">👤 الاسم الكامل</label>
                    <input type="text" id="empEdName" value="${_esc(e.fullName || '')}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">🎯 المسمى الوظيفي</label>
                    <input type="text" id="empEdRole" value="${_esc(e.roleName || '')}" placeholder="مثال: شيف، كاشير، نادل" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                        <div>
                            <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💰 الراتب</label>
                            <input type="number" id="empEdSalary" value="${Number(e.salary) || 0}" placeholder="0" min="0" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;">
                        </div>
                        <div>
                            <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📊 نوع الراتب</label>
                            <select id="empEdSalaryType" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;background:white;">
                                <option value="monthly" ${(e.salaryType || 'monthly') === 'monthly' ? 'selected' : ''}>شهري</option>
                                <option value="daily" ${e.salaryType === 'daily' ? 'selected' : ''}>يومي</option>
                                <option value="hourly" ${e.salaryType === 'hourly' ? 'selected' : ''}>ساعي</option>
                            </select>
                        </div>
                    </div>

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📅 تاريخ التعيين</label>
                    <input type="date" id="empEdHireDate" value="${e.hireDate || ''}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">🆔 رقم الهوية (اختياري)</label>
                    <input type="text" id="empEdNationalId" value="${_esc(e.nationalId || '')}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">🎓 الشهادة الدراسية</label>
                    <input type="text" id="empEdEducation" value="${_esc(e.education || '')}" placeholder="مثال: بكالوريا، إجازة جامعية" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💼 الخبرة</label>
                    <input type="text" id="empEdExperience" value="${_esc(e.experience || '')}" placeholder="مثال: 5 سنوات في مطاعم" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📝 نبذة / CV (نص)</label>
                    <textarea id="empEdCvText" rows="4" placeholder="نبذة مختصرة عن الموظف..." style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;resize:vertical;">${_esc(e.cvText || '')}</textarea>

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📄 رابط CV (اختياري)</label>
                    <input type="url" id="empEdCvUrl" value="${_esc(e.cvUrl || '')}" placeholder="https://drive.google.com/..." style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:13px;margin-bottom:16px;direction:ltr;">

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <button onclick="document.getElementById('empDirEditModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                        <button onclick="_empDirSave('${_esc(empUid)}')" style="padding:13px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">💾 حفظ</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } catch(e) { alert('❌ ' + e.message); }
    };

    window._empDirSave = async function(empUid) {
        try {
            const data = {
                fullName: document.getElementById('empEdName').value.trim(),
                roleName: document.getElementById('empEdRole').value.trim(),
                salary: Number(document.getElementById('empEdSalary').value) || 0,
                salaryType: document.getElementById('empEdSalaryType').value,
                hireDate: document.getElementById('empEdHireDate').value || null,
                nationalId: document.getElementById('empEdNationalId').value.trim(),
                education: document.getElementById('empEdEducation').value.trim(),
                experience: document.getElementById('empEdExperience').value.trim(),
                cvText: document.getElementById('empEdCvText').value.trim(),
                cvUrl: document.getElementById('empEdCvUrl').value.trim(),
                hrUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                hrUpdatedBy: currentUser.uid
            };

            if (!data.fullName) { alert('⚠️ الاسم مطلوب'); return; }

            await db.collection('users').doc(empUid).update(data);

            document.getElementById('empDirEditModal').remove();
            if (typeof toast === 'function') toast('✅ تم الحفظ', 'success');

            const c = document.getElementById('page-employees-directory');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    // ═══ Search/Filter ═══
    window._empDirSearch = function(q) {
        _state.search = q;
        const c = document.getElementById('page-employees-directory');
        if (!c) return;
        const active = document.activeElement;
        const wasSearch = active && active.id === 'empDirSearch';
        const ss = wasSearch ? active.selectionStart : 0;
        const se = wasSearch ? active.selectionEnd : 0;
        _render(c);
        if (wasSearch) {
            const n = document.getElementById('empDirSearch');
            if (n) { n.focus(); try { n.setSelectionRange(ss, se); } catch(e) {} }
        }
    };

    window._empDirRole = function(role) {
        _state.roleFilter = role;
        const c = document.getElementById('page-employees-directory');
        if (c) _render(c);
    };

    console.log('👥 [employees-directory] ready');
})();
