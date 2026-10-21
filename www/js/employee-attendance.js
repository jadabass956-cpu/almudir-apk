// ============================================================
//  ⏰ EMPLOYEE ATTENDANCE — تسجيل الحضور للموظف
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    let _scanner = null;
    let _modal = null;

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function _todayStr() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    }

    // ═══ فتح شاشة المسح ═══
    window.openAttendanceScanner = async function() {
        if (!currentUser?.uid) { alert('يجب تسجيل الدخول'); return; }
        if (!currentUser.ownerUid) { alert('⚠️ أنت غير مرتبط بمدير بعد'); return; }

        // ① حالة الموظف اليوم
        const today = _todayStr();
        let todayRecord = null;
        try {
            const snap = await db.collection('users').doc(currentUser.ownerUid)
                .collection('attendance').doc(today).get();
            if (snap.exists) {
                const records = snap.data().records || {};
                todayRecord = records[currentUser.uid] || null;
            }
        } catch(e) { console.warn('[attendance] read:', e.message); }

        _showScannerModal(todayRecord);
    };

    function _showScannerModal(todayRecord) {
        const old = document.getElementById('attendanceScannerModal');
        if (old) old.remove();

        const isCheckedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
        const isDone = todayRecord && todayRecord.checkIn && todayRecord.checkOut;
        const actionLabel = isDone ? 'تسجيل حضور جديد' : (isCheckedIn ? '🕐 تسجيل خروج' : '🕐 تسجيل حضور');

        const modal = document.createElement('div');
        modal.id = 'attendanceScannerModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999999;display:flex;flex-direction:column;';
        modal.innerHTML = `
            <div style="background:#1a1a2e;color:white;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:16px;font-weight:700;">📷 ${actionLabel}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:3px;">وجّه الكاميرا نحو الرمز على الشاشة</div>
                </div>
                <button onclick="closeAttendanceScanner()" style="background:rgba(255,255,255,0.15);border:none;width:40px;height:40px;border-radius:50%;color:white;font-size:18px;cursor:pointer;font-weight:bold;">✖</button>
            </div>
            <div id="qrReader" style="flex:1;background:#000;overflow:hidden;"></div>
            <div style="background:#1a1a2e;color:white;padding:14px;text-align:center;">
                <div id="attendStatus" style="font-size:14px;color:#94a3b8;">📸 جاري تحضير الكاميرا...</div>
            </div>
        `;
        document.body.appendChild(modal);
        _modal = modal;

        // بدء المسح
        setTimeout(() => _startScanner(), 300);
    }

    function _startScanner() {
        if (typeof Html5Qrcode === 'undefined') {
            document.getElementById('attendStatus').textContent = '⚠️ مكتبة المسح غير متاحة';
            return;
        }
        try {
            _scanner = new Html5Qrcode('qrReader');
            _scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => _onScanSuccess(decodedText),
                (errorMsg) => { /* تجاهل */ }
            ).then(() => {
                document.getElementById('attendStatus').textContent = '📸 جاهز — امسح الرمز';
            }).catch(e => {
                document.getElementById('attendStatus').textContent = '❌ ' + (e.message || e);
            });
        } catch(e) {
            document.getElementById('attendStatus').textContent = '❌ ' + e.message;
        }
    }

    async function _onScanSuccess(text) {
        // ① تنظيف التوكن
        const token = String(text || '').trim().toUpperCase();
        if (!/^[A-Z0-9]{4,12}$/.test(token)) {
            document.getElementById('attendStatus').innerHTML = '❌ رمز غير صالح';
            return;
        }

        document.getElementById('attendStatus').innerHTML = '⏳ جاري التحقق...';

        // ② إيقاف المسح مؤقتاً
        try { await _scanner.stop(); } catch(e) {}

        // ③ التحقق من التوكن
        try {
            const snap = await db.collection('public_tablet_sessions').doc(currentUser.ownerUid).get();
            if (!snap.exists) {
                document.getElementById('attendStatus').innerHTML = '❌ لا توجد جلسة تابلت نشطة';
                setTimeout(() => _restartScanner(), 2500);
                return;
            }
            const data = snap.data();
            const now = Date.now();
            const expiresAt = Number(data.expiresAt) || 0;
            const currentToken = String(data.currentToken || '').toUpperCase();
            const previousToken = String(data.previousToken || '').toUpperCase();

            // مقارنة مع التوكن الحالي أو السابق
            const matchesCurrent = (token === currentToken) && (now <= expiresAt);
            const graceMs = 8000;
            const matchesPrevious = (token === previousToken) && (now <= expiresAt + graceMs);

            if (!matchesCurrent && !matchesPrevious) {
                document.getElementById('attendStatus').innerHTML = '❌ الرمز منتهي أو غير صحيح<br><small>امسح الرمز الحالي</small>';
                setTimeout(() => _restartScanner(), 2500);
                return;
            }

            // ④ تحقق من الجهاز (بصمة بسيطة)
            const deviceInfo = _getDeviceInfo();
            const savedDeviceId = localStorage.getItem('emp_device_id');
            let deviceId = savedDeviceId;
            if (!deviceId) {
                deviceId = 'dev_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
                localStorage.setItem('emp_device_id', deviceId);
                localStorage.setItem('emp_device_info', deviceInfo);
            }

            // ⑤ تحديث السجل
            await _writeAttendance();

        } catch(e) {
            console.error('[attendance]', e);
            document.getElementById('attendStatus').innerHTML = '❌ ' + _esc(e.message);
            setTimeout(() => _restartScanner(), 2500);
        }
    }

    function _getDeviceInfo() {
        return {
            ua: navigator.userAgent || '',
            screen: (screen.width || 0) + 'x' + (screen.height || 0),
            lang: navigator.language || '',
            tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || ''
        };
    }

    async function _writeAttendance() {
        const ownerUid = currentUser.ownerUid;
        const empUid = currentUser.uid;
        const today = _todayStr();

        const ref = db.collection('users').doc(ownerUid)
            .collection('attendance').doc(today);

        const snap = await ref.get();
        const records = snap.exists ? (snap.data().records || {}) : {};
        const rec = records[empUid] || {};

        let newRec;
        let actionText;

        if (!rec.checkIn) {
            // تسجيل دخول
            newRec = {
                checkIn: Date.now(),
                checkOut: null,
                hours: 0,
                empName: currentUser.fullName || '',
                empRole: currentUser.roleName || '',
                deviceId: localStorage.getItem('emp_device_id') || ''
            };
            actionText = '✅ تم تسجيل دخولك';
        } else if (!rec.checkOut) {
            // تسجيل خروج
            const inTime = rec.checkIn;
            const outTime = Date.now();
            const hours = (outTime - inTime) / 3600000;
            newRec = {
                ...rec,
                checkOut: outTime,
                hours: Math.round(hours * 100) / 100
            };
            actionText = '✅ تم تسجيل خروجك';
        } else {
            // مسجّل مسبقاً
            document.getElementById('attendStatus').innerHTML = '✅ سجلت حضورك وانصرافك اليوم';
            setTimeout(() => _closeAndRefresh(), 2000);
            return;
        }

        records[empUid] = newRec;
        await ref.set({
            records: records,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const timeStr = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });
        let extra = '';
        if (newRec.checkOut && newRec.checkIn) {
            const h = newRec.hours;
            extra = '<div style="font-size:13px;color:#27ae60;margin-top:6px;">⏱️ ساعات الدوام: ' + h + '</div>';
        } else {
            extra = '<div style="font-size:13px;color:#3498db;margin-top:6px;">🕐 ' + timeStr + '</div>';
        }

        document.getElementById('attendStatus').innerHTML = `
            <div style="font-size:20px;font-weight:700;color:#27ae60;">${actionText}</div>
            ${extra}
        `;
        setTimeout(() => _closeAndRefresh(), 2500);
    }

    function _restartScanner() {
        document.getElementById('attendStatus').textContent = '📸 جاهز — امسح الرمز';
        _startScanner();
    }

    function _closeAndRefresh() {
        window.closeAttendanceScanner();
        // تحديث hub
        const c = document.getElementById('activity-employees-hub');
        if (c && typeof window.renderEmployeeHub === 'function') {
            window.renderEmployeeHub(c);
        }
    }

    window.closeAttendanceScanner = function() {
        try { if (_scanner) { _scanner.stop().then(() => { _scanner.clear(); _scanner = null; }).catch(() => {}); } } catch(e) {}
        const m = document.getElementById('attendanceScannerModal');
        if (m) m.remove();
        _scanner = null;
    };

    // ═══ حالة الحضور اليوم (للعرض في hub) ═══
    window._getTodayAttendance = async function() {
        if (!currentUser?.ownerUid) return null;
        try {
            const snap = await db.collection('users').doc(currentUser.ownerUid)
                .collection('attendance').doc(_todayStr()).get();
            if (!snap.exists) return null;
            const records = snap.data().records || {};
            return records[currentUser.uid] || null;
        } catch(e) { return null; }
    };

    console.log('⏰ [employee-attendance] ready');
})();
