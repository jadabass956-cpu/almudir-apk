// ============================================================
//  💵 ADVANCES — نظام السلف
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { filter: 'active', empFilter: 'all' };

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

    function _fmtDate(ts) {
        if (!ts) return '—';
        if (ts.toDate) ts = ts.toDate();
        return new Date(ts).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function _timeAgo(ts) {
        if (!ts) return '';
        if (ts.toDate) ts = ts.toDate();
        const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
        if (diff < 1) return 'الآن';
        if (diff < 60) return diff + ' د';
        if (diff < 1440) return Math.floor(diff / 60) + ' س';
        return Math.floor(diff / 1440) + ' ي';
    }

    // ═══ فتح الصفحة ═══
    window.openAdvances = function() {
        let cont = document.getElementById('page-advances');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-advances';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-advances');
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

        let advances = [];
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('advances').get();
            snap.forEach(d => advances.push({ id: d.id, ...d.data() }));
            advances.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
        } catch(e) {
            console.error('[advances]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
            return;
        }

        // إحصائيات
        const stats = { active: 0, deducted: 0, cancelled: 0 };
        let totalActive = 0;
        let totalDeducted = 0;
        advances.forEach(a => {
            const amt = Number(a.amount) || 0;
            if (a.status === 'active') { stats.active++; totalActive += amt; }
            else if (a.status === 'deducted') { stats.deducted++; totalDeducted += amt; }
            else if (a.status === 'cancelled') { stats.cancelled++; }
        });

        // قائمة الموظفين (من advances الحالية)
        const employees = [...new Map(advances.map(a => [a.empUid, { uid: a.empUid, name: a.empName }])).values()];

        // فلترة
        let filtered = advances;
        if (_state.filter !== 'all') {
            filtered = filtered.filter(a => a.status === _state.filter);
        }
        if (_state.empFilter !== 'all') {
            filtered = filtered.filter(a => a.empUid === _state.empFilter);
        }

        let listHtml = '';
        if (advances.length === 0) {
            listHtml = `<div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">💵</div>
                <div style="font-size:15px;font-weight:600;">لا توجد سلف</div>
                <div style="font-size:13px;margin-top:6px;">أضف سلفة لأي موظف</div>
            </div>`;
        } else if (filtered.length === 0) {
            listHtml = `<div style="text-align:center;padding:30px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:32px;margin-bottom:8px;">🔍</div>
                <div style="font-size:13px;">لا نتائج مطابقة</div>
            </div>`;
        } else {
            filtered.forEach(a => { listHtml += _card(a); });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">💵 السلف</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">إدارة سلف الموظفين — تُخصم تلقائياً من الرواتب عند التسليم</p>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#e67e22,#d35400);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:12px;font-weight:700;">${_fmt(totalActive)}</div>
                    <div style="font-size:10px;opacity:0.9;margin-top:4px;">⏳ نشطة (${stats.active})</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:12px;font-weight:700;">${_fmt(totalDeducted)}</div>
                    <div style="font-size:10px;opacity:0.9;margin-top:4px;">✅ مخصومة (${stats.deducted})</div>
                </div>
                <div style="background:linear-gradient(135deg,#95a5a6,#7f8c8d);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.cancelled}</div>
                    <div style="font-size:10px;opacity:0.9;">🚫 ملغاة</div>
                </div>
            </div>

            <button onclick="_advAdd()" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:15px;box-shadow:0 3px 10px rgba(39,174,96,0.3);">➕ إضافة سلفة</button>

            <div style="display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    { id: 'active', label: '⏳ نشطة' },
                    { id: 'deducted', label: '✅ مخصومة' },
                    { id: 'cancelled', label: '🚫 ملغاة' },
                    { id: 'all', label: '📋 الكل' }
                ].map(t => `<button onclick="_advFilter('${t.id}')" style="flex-shrink:0;padding:8px 14px;background:${_state.filter === t.id ? '#2c3e50' : 'white'};color:${_state.filter === t.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.filter === t.id ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">${t.label}</button>`).join('')}
            </div>

            ${employees.length > 1 ? `
                <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;">
                    <button onclick="_advEmpFilter('all')" style="flex-shrink:0;padding:7px 14px;background:${_state.empFilter === 'all' ? '#8e44ad' : 'white'};color:${_state.empFilter === 'all' ? 'white' : '#8e44ad'};border:1.5px solid ${_state.empFilter === 'all' ? '#8e44ad' : '#ddd'};border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">👥 الكل</button>
                    ${employees.map(emp => `<button onclick="_advEmpFilter('${_esc(emp.uid)}')" style="flex-shrink:0;padding:7px 14px;background:${_state.empFilter === emp.uid ? '#8e44ad' : 'white'};color:${_state.empFilter === emp.uid ? 'white' : '#8e44ad'};border:1.5px solid ${_state.empFilter === emp.uid ? '#8e44ad' : '#ddd'};border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">👤 ${_esc(emp.name || 'موظف')}</button>`).join('')}
                </div>
            ` : ''}

            <div style="width:100%;box-sizing:border-box;">${listHtml}</div>
        `;
    }

    function _card(a) {
        const statusColor = {
            'active': '#e67e22',
            'deducted': '#27ae60',
            'cancelled': '#95a5a6'
        }[a.status] || '#95a5a6';

        const statusLabel = {
            'active': '⏳ نشطة',
            'deducted': '✅ مخصومة',
            'cancelled': '🚫 ملغاة'
        }[a.status] || a.status;

        const actionsHtml = a.status === 'active' ? `
            <div style="background:#e8f5e9;border-radius:8px;padding:8px;margin-top:8px;font-size:11px;color:#155724;text-align:center;">
                ⏱️ ستُخصم تلقائياً عند تسليم الراتب
            </div>
            <button onclick="_advCancel('${_esc(a.id)}')" style="width:100%;margin-top:6px;padding:9px;background:#95a5a6;color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">🚫 إلغاء السلفة</button>
        ` : '';

        return `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${statusColor};box-sizing:border-box;width:100%;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;gap:8px;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#e67e22,#d35400);color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;">
                            ${_initials(a.empName)}
                        </div>
                        <div style="min-width:0;flex:1;">
                            <div style="font-weight:700;color:#2c3e50;font-size:14px;">${_esc(a.empName || 'موظف')}</div>
                            <div style="font-size:11px;color:#666;margin-top:2px;">📅 ${_fmtDate(a.createdAt)}</div>
                        </div>
                    </div>
                    <div style="text-align:left;flex-shrink:0;">
                        <div style="background:${statusColor};color:white;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;">${statusLabel}</div>
                        <div style="font-size:10px;color:#999;margin-top:4px;text-align:center;">${_timeAgo(a.createdAt)}</div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#fff8e1,#ffe0b2);border-radius:8px;padding:10px;margin-bottom:8px;text-align:center;">
                    <div style="font-size:11px;color:#856404;">المبلغ</div>
                    <div style="font-size:20px;font-weight:700;color:#d35400;margin-top:2px;">${_fmt(a.amount)}</div>
                </div>

                ${a.reason ? `<div style="font-size:11px;color:#666;background:#f8f9fa;padding:6px;border-radius:6px;margin-bottom:8px;">📝 ${_esc(a.reason)}</div>` : ''}

                ${a.status === 'deducted' ? `<div style="font-size:11px;color:#27ae60;background:#e8f5e9;padding:6px;border-radius:6px;">✅ خُصمت في ${_fmtDate(a.deductedAt)}</div>` : ''}

                ${actionsHtml}
            </div>
        `;
    }

    // ═══ إضافة سلفة ═══
    window._advAdd = async function() {
        let employees = [];
        try {
            const snap = await db.collection('users')
                .where('ownerUid', '==', currentUser.uid).get();
            snap.forEach(d => {
                const u = d.data();
                if (u.linkStatus === 'active') {
                    employees.push({ uid: d.id, name: u.fullName || 'موظف', role: u.roleName || '' });
                }
            });
        } catch(e) { alert('❌ ' + e.message); return; }

        if (employees.length === 0) {
            alert('⚠️ لا يوجد موظفون نشطون');
            return;
        }

        const old = document.getElementById('advAddModal');
        if (old) old.remove();

        const empOptions = employees.map(e => `<option value="${_esc(e.uid)}">${_esc(e.name)} — ${_esc(e.role)}</option>`).join('');

        const modal = document.createElement('div');
        modal.id = 'advAddModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:420px;width:100%;padding:22px;box-sizing:border-box;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;font-size:17px;">💵 إضافة سلفة</h3>
                    <button onclick="document.getElementById('advAddModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">👤 الموظف</label>
                <select id="advEmp" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;background:white;margin-bottom:12px;">
                    ${empOptions}
                </select>

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💰 المبلغ</label>
                <input type="number" id="advAmount" placeholder="0" min="0" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:16px;font-weight:700;text-align:center;margin-bottom:12px;">

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📝 السبب (اختياري)</label>
                <textarea id="advReason" rows="2" placeholder="مثال: ظرف طارئ" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:16px;resize:none;"></textarea>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('advAddModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                    <button onclick="_advSave()" style="padding:13px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">💾 حفظ</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('advAmount')?.focus(), 150);
    };

    window._advSave = async function() {
        const empUid = document.getElementById('advEmp').value;
        const amount = Number(document.getElementById('advAmount').value) || 0;
        const reason = document.getElementById('advReason').value.trim();

        if (!empUid) { alert('⚠️ اختر موظفاً'); return; }
        if (amount <= 0) { alert('⚠️ أدخل مبلغاً صحيحاً'); return; }

        try {
            const empSnap = await db.collection('users').doc(empUid).get();
            const emp = empSnap.exists ? empSnap.data() : {};

            await db.collection('users').doc(currentUser.uid)
                .collection('advances').add({
                    empUid: empUid,
                    empName: emp.fullName || 'موظف',
                    empRole: emp.roleName || '',
                    amount: amount,
                    reason: reason,
                    status: 'active',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: currentUser.uid
                });

            document.getElementById('advAddModal').remove();
            if (typeof toast === 'function') toast('✅ تم إضافة السلفة', 'success');

            const c = document.getElementById('page-advances');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    // ═══ إلغاء السلفة ═══
    window._advCancel = async function(advId) {
        if (!confirm('🚫 إلغاء هذه السلفة؟')) return;
        try {
            await db.collection('users').doc(currentUser.uid)
                .collection('advances').doc(advId).update({
                    status: 'cancelled',
                    cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
                    cancelledBy: currentUser.uid
                });
            if (typeof toast === 'function') toast('✅ تم الإلغاء', 'success');
            const c = document.getElementById('page-advances');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    // ═══ فلاتر ═══
    window._advFilter = function(f) {
        _state.filter = f;
        const c = document.getElementById('page-advances');
        if (c) _render(c);
    };

    window._advEmpFilter = function(uid) {
        _state.empFilter = uid;
        const c = document.getElementById('page-advances');
        if (c) _render(c);
    };

    console.log('💵 [advances] ready');
})();
