// ============================================================
//  🏖️ LEAVES ADMIN — لوحة إدارة الإجازات للمدير
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { filter: 'pending' };

    const LEAVE_TYPES = [
        { id: 'annual',    icon: '🏖️', label: 'إجازة سنوية' },
        { id: 'sick',      icon: '🤒', label: 'إجازة مرضية' },
        { id: 'emergency', icon: '🚨', label: 'ظرف طارئ' },
        { id: 'unpaid',    icon: '📋', label: 'بدون راتب' },
        { id: 'other',     icon: '📝', label: 'أخرى' }
    ];

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function _fmtDate(d) {
        if (!d) return '—';
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('ar-SY', { weekday: 'short', day: 'numeric', month: 'short' });
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

    function _getLeaveType(id) {
        return LEAVE_TYPES.find(t => t.id === id) || LEAVE_TYPES[4];
    }

    // ═══ فتح الصفحة ═══
    window.openLeavesManager = function() {
        let cont = document.getElementById('page-leaves-admin');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-leaves-admin';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-leaves-admin');
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

        let leaves = [];
        try {
            const snap = await db.collection('users').doc(currentUser.uid)
                .collection('leaves').get();
            snap.forEach(d => leaves.push({ id: d.id, ...d.data() }));
            leaves.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
        } catch(e) {
            console.error('[leaves-admin]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
            return;
        }

        // إحصائيات
        const stats = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
        leaves.forEach(l => { if (stats[l.status] !== undefined) stats[l.status]++; });

        // فلترة
        const filtered = _state.filter === 'all'
            ? leaves
            : leaves.filter(l => l.status === _state.filter);

        // بناء القائمة
        let listHtml = '';
        if (filtered.length === 0) {
            const emptyMsg = _state.filter === 'pending' ? 'لا توجد طلبات معلقة' : 'لا توجد إجازات';
            listHtml = `<div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">🏖️</div>
                <div style="font-size:14px;font-weight:600;">${emptyMsg}</div>
                <div style="font-size:12px;color:#999;margin-top:6px;">ستظهر هنا طلبات الإجازات</div>
            </div>`;
        } else {
            filtered.forEach(l => { listHtml += _leaveCard(l); });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">🏖️ إدارة الإجازات</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">طلبات الإجازات من الموظفين</p>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#f39c12,#e67e22);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.pending}</div>
                    <div style="font-size:10px;opacity:0.9;">⏳ معلقة</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.approved}</div>
                    <div style="font-size:10px;opacity:0.9;">✅ موافق</div>
                </div>
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.rejected}</div>
                    <div style="font-size:10px;opacity:0.9;">❌ مرفوضة</div>
                </div>
                <div style="background:linear-gradient(135deg,#95a5a6,#7f8c8d);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.cancelled}</div>
                    <div style="font-size:10px;opacity:0.9;">🚫 ملغاة</div>
                </div>
            </div>

            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    { id: 'pending', label: '⏳ معلقة' },
                    { id: 'approved', label: '✅ موافق' },
                    { id: 'rejected', label: '❌ مرفوضة' },
                    { id: 'all', label: '📋 الكل' }
                ].map(t => `<button onclick="_leaveAdmFilter('${t.id}')" style="flex-shrink:0;padding:8px 14px;background:${_state.filter === t.id ? '#2c3e50' : 'white'};color:${_state.filter === t.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.filter === t.id ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">${t.label}</button>`).join('')}
            </div>

            <div style="width:100%;box-sizing:border-box;">${listHtml}</div>
        `;
    }

    function _leaveCard(l) {
        const t = _getLeaveType(l.type);
        const statusColor = {
            'pending': '#f39c12',
            'approved': '#27ae60',
            'rejected': '#e74c3c',
            'cancelled': '#95a5a6'
        }[l.status] || '#95a5a6';
        const statusLabel = {
            'pending': '⏳ معلقة',
            'approved': '✅ موافقة',
            'rejected': '❌ مرفوضة',
            'cancelled': '🚫 ملغاة'
        }[l.status] || l.status;

        let actionsHtml = '';
        if (l.status === 'pending') {
            actionsHtml = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">
                    <button onclick="_leaveAdmApprove('${_esc(l.id)}')" style="padding:11px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✅ موافقة</button>
                    <button onclick="_leaveAdmReject('${_esc(l.id)}')" style="padding:11px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">❌ رفض</button>
                </div>
            `;
        }

        return `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${statusColor};box-sizing:border-box;width:100%;">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;gap:8px;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#2c3e50;font-size:14px;">👤 ${_esc(l.empName || 'موظف')}</div>
                        <div style="font-size:11px;color:#666;margin-top:3px;">🎯 ${_esc(l.empRole || '—')}</div>
                    </div>
                    <div style="text-align:left;flex-shrink:0;">
                        <div style="background:${statusColor};color:white;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;">${statusLabel}</div>
                        <div style="font-size:10px;color:#999;margin-top:4px;">${_timeAgo(l.createdAt)}</div>
                    </div>
                </div>

                <div style="background:#f8f9fa;border-radius:8px;padding:10px;margin-bottom:8px;">
                    <div style="font-size:13px;font-weight:700;color:#2c3e50;margin-bottom:6px;">${t.icon} ${_esc(t.label)}</div>
                    <div style="font-size:12px;color:#666;">📅 ${_fmtDate(l.from)} → ${_fmtDate(l.to)}</div>
                    <div style="font-size:12px;color:#666;margin-top:3px;">⏱️ <b>${l.days || 0}</b> يوم</div>
                    ${l.reason ? `<div style="font-size:11px;color:#888;margin-top:6px;">📝 ${_esc(l.reason)}</div>` : ''}
                </div>

                ${l.managerNote ? `<div style="font-size:11px;color:#856404;background:#fff8e1;padding:6px;border-radius:6px;margin-bottom:8px;">💬 ردّك: ${_esc(l.managerNote)}</div>` : ''}

                ${actionsHtml}
            </div>
        `;
    }

    // ═══ Actions ═══
    window._leaveAdmFilter = function(f) {
        _state.filter = f;
        const c = document.getElementById('page-leaves-admin');
        if (c) _render(c);
    };

    window._leaveAdmApprove = function(leaveId) {
        const old = document.getElementById('leaveActionModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'leaveActionModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:420px;width:100%;padding:22px;box-sizing:border-box;">
                <h3 style="margin:0 0 16px;font-size:17px;">✅ موافقة على الإجازة</h3>
                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💬 ملاحظة (اختياري)</label>
                <textarea id="leaveNoteInput" rows="2" placeholder="مثال: إجازة موافق عليها" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:16px;resize:none;"></textarea>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('leaveActionModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                    <button onclick="_leaveAdmConfirm('${_esc(leaveId)}', 'approved')" style="padding:13px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✅ تأكيد</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('leaveNoteInput')?.focus(), 150);
    };

    window._leaveAdmReject = function(leaveId) {
        const old = document.getElementById('leaveActionModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'leaveActionModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:420px;width:100%;padding:22px;box-sizing:border-box;">
                <h3 style="margin:0 0 16px;font-size:17px;">❌ رفض الإجازة</h3>
                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💬 سبب الرفض (اختياري)</label>
                <textarea id="leaveNoteInput" rows="2" placeholder="اشرح السبب للموظف..." style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:16px;resize:none;"></textarea>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('leaveActionModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                    <button onclick="_leaveAdmConfirm('${_esc(leaveId)}', 'rejected')" style="padding:13px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">❌ تأكيد الرفض</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('leaveNoteInput')?.focus(), 150);
    };

    window._leaveAdmConfirm = async function(leaveId, status) {
        const note = document.getElementById('leaveNoteInput')?.value.trim() || '';
        try {
            await db.collection('users').doc(currentUser.uid)
                .collection('leaves').doc(leaveId).update({
                    status: status,
                    managerNote: note,
                    [`${status}At`]: firebase.firestore.FieldValue.serverTimestamp(),
                    [`${status}By`]: currentUser.uid
                });

            document.getElementById('leaveActionModal').remove();
            if (typeof toast === 'function') {
                toast(status === 'approved' ? '✅ تم قبول الإجازة' : '✅ تم رفض الإجازة', 'success');
            }
            const c = document.getElementById('page-leaves-admin');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    console.log('🏖️ [leaves-admin] ready');
})();
