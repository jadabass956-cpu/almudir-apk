// ============================================================
//  🏖️ EMPLOYEE LEAVES — نظام الإجازات
//  v1.0.0
// ============================================================
(function() {
    'use strict';

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

    function _daysBetween(from, to) {
        if (!from || !to) return 0;
        const d1 = new Date(from + 'T00:00:00');
        const d2 = new Date(to + 'T00:00:00');
        return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    }

    function _getLeaveType(id) {
        return LEAVE_TYPES.find(t => t.id === id) || LEAVE_TYPES[4];
    }

    // ═══════════════════════════════════════════════════════
    //  📝 الموظف — طلب إجازة جديدة
    // ═══════════════════════════════════════════════════════
    window.openLeaveRequest = function() {
        if (!currentUser?.ownerUid) {
            alert('⚠️ أنت غير مرتبط بمدير');
            return;
        }

        const old = document.getElementById('leaveRequestModal');
        if (old) old.remove();

        const today = new Date().toISOString().slice(0, 10);
        const typesHtml = LEAVE_TYPES.map(t => `
            <label style="display:flex;align-items:center;gap:8px;padding:10px;background:#f8f9fa;border:2px solid #ddd;border-radius:10px;cursor:pointer;margin-bottom:6px;font-size:13px;font-weight:600;transition:all 0.15s;" onclick="document.querySelectorAll('#leaveRequestModal .leave-type-label').forEach(l=>{l.style.background='#f8f9fa';l.style.borderColor='#ddd';});this.style.background='#e3f2fd';this.style.borderColor='#3498db';">
                <input type="radio" name="leaveType" value="${t.id}" ${t.id === 'annual' ? 'checked' : ''} style="width:18px;height:18px;accent-color:#3498db;" class="leave-type-label">
                <span>${t.icon} ${t.label}</span>
            </label>
        `).join('');

        const modal = document.createElement('div');
        modal.id = 'leaveRequestModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:460px;width:100%;padding:22px;box-sizing:border-box;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;font-size:17px;">🏖️ طلب إجازة</h3>
                    <button onclick="document.getElementById('leaveRequestModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">نوع الإجازة</label>
                ${typesHtml}

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;margin-top:14px;">📅 من تاريخ</label>
                <input type="date" id="leaveFrom" value="${today}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📅 إلى تاريخ</label>
                <input type="date" id="leaveTo" value="${today}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">📝 سبب الإجازة (اختياري)</label>
                <textarea id="leaveReason" rows="2" placeholder="اشرح السبب..." style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:16px;resize:none;"></textarea>

                <button onclick="_leaveSubmit()" style="width:100%;padding:14px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">📤 إرسال الطلب</button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window._leaveSubmit = async function() {
        const from = document.getElementById('leaveFrom').value;
        const to = document.getElementById('leaveTo').value;
        const reason = document.getElementById('leaveReason').value.trim();
        const type = document.querySelector('input[name="leaveType"]:checked')?.value || 'annual';

        if (!from || !to) { alert('⚠️ حدد التواريخ'); return; }
        if (to < from) { alert('⚠️ تاريخ النهاية قبل البداية'); return; }

        try {
            const ownerUid = currentUser.ownerUid;
            const empUid = currentUser.uid;
            const days = _daysBetween(from, to);

            await db.collection('users').doc(ownerUid)
                .collection('leaves').add({
                    empUid: empUid,
                    empName: currentUser.fullName || '',
                    empRole: currentUser.roleName || '',
                    type: type,
                    from: from,
                    to: to,
                    days: days,
                    reason: reason,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: empUid
                });

            document.getElementById('leaveRequestModal').remove();
            if (typeof toast === 'function') toast('✅ تم إرسال الطلب للمدير', 'success');
            else alert('✅ تم إرسال الطلب للمدير');
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    // ═══════════════════════════════════════════════════════
    //  👤 الموظف — قائمة طلباتي
    // ═══════════════════════════════════════════════════════
    window.openMyLeaves = async function() {
        if (!currentUser?.ownerUid) return;

        const old = document.getElementById('myLeavesModal');
        if (old) old.remove();

        try {
            const snap = await db.collection('users').doc(currentUser.ownerUid)
                .collection('leaves')
                .where('empUid', '==', currentUser.uid)
                .get();

            const leaves = [];
            snap.forEach(d => leaves.push({ id: d.id, ...d.data() }));
            leaves.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

            let html = '';
            if (leaves.length === 0) {
                html = `<div style="text-align:center;padding:30px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">🏖️</div>
                    <div style="font-size:14px;font-weight:600;">لا توجد إجازات</div>
                    <div style="font-size:12px;color:#999;margin-top:6px;">يمكنك طلب إجازة جديدة</div>
                </div>`;
            } else {
                leaves.forEach(l => {
                    const t = _getLeaveType(l.type);
                    const statusColor = {
                        'pending': '#f39c12',
                        'approved': '#27ae60',
                        'rejected': '#e74c3c',
                        'cancelled': '#95a5a6'
                    }[l.status] || '#95a5a6';
                    const statusLabel = {
                        'pending': '⏳ بانتظار',
                        'approved': '✅ موافق',
                        'rejected': '❌ مرفوض',
                        'cancelled': '🚫 ملغي'
                    }[l.status] || l.status;

                    html += `
                        <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${statusColor};">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                <div style="font-weight:700;color:#2c3e50;font-size:14px;">${t.icon} ${_esc(t.label)}</div>
                                <div style="background:${statusColor};color:white;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;">${statusLabel}</div>
                            </div>
                            <div style="font-size:12px;color:#666;">📅 ${_fmtDate(l.from)} → ${_fmtDate(l.to)}</div>
                            <div style="font-size:12px;color:#666;margin-top:3px;">⏱️ ${l.days || 0} يوم</div>
                            ${l.reason ? `<div style="font-size:11px;color:#888;margin-top:6px;">📝 ${_esc(l.reason)}</div>` : ''}
                            ${l.managerNote ? `<div style="font-size:11px;color:#856404;background:#fff8e1;padding:6px;border-radius:6px;margin-top:8px;">💬 رد المدير: ${_esc(l.managerNote)}</div>` : ''}
                        </div>
                    `;
                });
            }

            const modal = document.createElement('div');
            modal.id = 'myLeavesModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
            modal.innerHTML = `
                <div style="background:#f8f9fa;border-radius:16px;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;padding:18px;box-sizing:border-box;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                        <h3 style="margin:0;font-size:17px;">🏖️ إجازاتي (${leaves.length})</h3>
                        <button onclick="document.getElementById('myLeavesModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                    </div>
                    <button onclick="document.getElementById('myLeavesModal').remove(); openLeaveRequest()" style="width:100%;padding:12px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:12px;">➕ طلب إجازة جديدة</button>
                    ${html}
                </div>
            `;
            document.body.appendChild(modal);
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    console.log('🏖️ [employee-leaves] ready');
})();
