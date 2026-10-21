// ============================================================
//  📱 TABLET DISPLAY — شاشة الحضور بالـ QR الدوّار
//  v1.0.0 — 21 سبتمبر 2026
// ============================================================
(function() {
    'use strict';

    // ═══ Firebase Init ═══
    const firebaseConfig = {
        apiKey: "AIzaSyB08RzcPJe9B1gElNfgqS-hr-C8eTROQLw",
        authDomain: "jasoft-8bae9.firebaseapp.com",
        projectId: "jasoft-8bae9",
        storageBucket: "jasoft-8bae9.firebasestorage.app",
        messagingSenderId: "263989164835",
        appId: "1:263989164835:web:1fa891e67b032d8503aa96"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // ═══ Config ═══
    const ROTATION_MS = 15000;    // 15 ثانية — توازن بين الأمان والراحة
    const GRACE_MS = 8000;        // 8 ثوان فترة سماح

    // ═══ State ═══
    let ownerUid = null;
    let currentToken = null;
    let previousToken = null;
    let tokenGeneratedAt = 0;
    let expiresAt = 0;
    let rotateTimer = null;
    let countdownTimer = null;
    let clockTimer = null;
    let statsTimer = null;

    // ═══ Helpers ═══
    function _showError(title, msg) {
        document.getElementById('errTitle').textContent = title;
        document.getElementById('errMsg').innerHTML = msg;
        document.getElementById('errorScreen').style.display = 'flex';
    }
    function _hideError() {
        document.getElementById('errorScreen').style.display = 'none';
    }
    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // ═══ Token Generation (Secure) ═══
    function _generateToken() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 32 حرف (بلا I,O,0,1)
        const bytes = new Uint8Array(6);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => chars[b % chars.length]).join('');
    }

    // ═══ Rotation ═══
    async function _rotateToken() {
        previousToken = currentToken;
        currentToken = _generateToken();
        tokenGeneratedAt = Date.now();
        expiresAt = tokenGeneratedAt + ROTATION_MS;

        console.log('[tablet] rotate →', currentToken, '| expires at', new Date(expiresAt).toLocaleTimeString());

        // عرض QR
        _renderQR(currentToken);

        // حفظ في Firestore
        try {
            await db.collection('public_tablet_sessions').doc(ownerUid).set({
                currentToken: currentToken,
                previousToken: previousToken || '',
                expiresAt: expiresAt,
                generatedAt: tokenGeneratedAt,
                rotationSeconds: ROTATION_MS / 1000,
                lastHeartbeat: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch(e) {
            console.warn('[tablet] write failed:', e.message);
        }

        // إعادة تشغيل العداد
        _updateCountdown();
    }

    function _renderQR(token) {
        const el = document.getElementById('qrContainer');
        if (!el) return;
        el.innerHTML = '';
        try {
            new QRCode(el, {
                text: token,
                width: 300,
                height: 300,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            el.classList.remove('loading');
        } catch(e) {
            el.textContent = token;
            console.error('[tablet] QR render:', e);
        }
    }

    function _updateCountdown() {
        const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        const bar = document.getElementById('countdownBar');
        const txt = document.getElementById('countdownText');
        const pct = Math.max(0, Math.min(100, (remaining / (ROTATION_MS/1000)) * 100));
        if (bar) {
            bar.style.width = pct + '%';
            if (remaining <= 5) bar.style.background = '#e74c3c';
            else if (remaining <= 15) bar.style.background = '#f39c12';
            else bar.style.background = '#27ae60';
        }
        if (txt) txt.textContent = remaining + ' ثانية';
    }

    function _updateClock() {
        const now = new Date();
        const tEl = document.getElementById('clockTime');
        const dEl = document.getElementById('clockDate');
        if (tEl) tEl.textContent = now.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        if (dEl) dEl.textContent = now.toLocaleDateString('ar-SY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ═══ Load Business Name ═══
    async function _loadBusiness() {
        try {
            const snap = await db.collection('users').doc(ownerUid).get();
            if (snap.exists) {
                const d = snap.data();
                document.getElementById('bizName').textContent = d.businessName || 'النشاط';
            }
        } catch(e) { console.warn('[tablet] biz:', e.message); }
    }

    // ═══ Load Stats (الحضور) ═══
    async function _loadStats() {
        try {
            const today = new Date();
            const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

            // ① اقرأ قائمة الموظفين المرتبطين
            const empSnap = await db.collection('users')
                .where('ownerUid', '==', ownerUid)
                .where('linkStatus', '==', 'active')
                .get();
            const employees = [];
            empSnap.forEach(d => {
                const data = d.data();
                employees.push({
                    uid: d.id,
                    name: data.fullName || data.email || 'موظف',
                    roleName: data.roleName || '',
                    attendance: null
                });
            });

            // ② اقرأ الحضور اليوم
            try {
                const attSnap = await db.collection('users').doc(ownerUid)
                    .collection('attendance').doc(todayStr).get();
                if (attSnap.exists) {
                    const records = attSnap.data().records || {};
                    employees.forEach(e => {
                        if (records[e.uid]) e.attendance = records[e.uid];
                    });
                }
            } catch(e) { console.warn('[tablet] attendance:', e.message); }

            // ③ حساب الإحصائيات
            let presentCount = 0;
            employees.forEach(e => {
                if (e.attendance && e.attendance.checkIn) presentCount++;
            });
            const total = employees.length;
            const absent = total - presentCount;
            const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

            document.getElementById('statPresent').textContent = presentCount;
            document.getElementById('statAbsent').textContent = absent;
            document.getElementById('statTotal').textContent = total;
            document.getElementById('statPercent').textContent = pct + '%';

            // ④ عرض القائمة
            _renderEmployeesList(employees);
        } catch(e) {
            console.warn('[tablet] stats:', e.message);
            document.getElementById('empList').innerHTML = '<div class="loading">لا توجد بيانات</div>';
        }
    }

    function _renderEmployeesList(employees) {
        const el = document.getElementById('empList');
        if (!el) return;

        if (!employees || employees.length === 0) {
            el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:13px;">لا يوجد موظفون مرتبطون</div>';
            return;
        }

        // ترتيب: الحاضرون أولاً
        employees.sort((a, b) => {
            const aP = a.attendance && a.attendance.checkIn;
            const bP = b.attendance && b.attendance.checkIn;
            if (aP && !bP) return -1;
            if (!aP && bP) return 1;
            return 0;
        });

        let html = '';
        employees.forEach(e => {
            const hasIn = e.attendance && e.attendance.checkIn;
            const hasOut = e.attendance && e.attendance.checkOut;
            let rowClass = 'absent';
            let statusText = '❌ لم يحضر';
            let statusClass = 'red';

            if (hasIn) {
                const inTime = new Date(e.attendance.checkIn).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });
                if (hasOut) {
                    rowClass = 'present';
                    statusText = '✅ ' + inTime + ' → ' + new Date(e.attendance.checkOut).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });
                    statusClass = 'green';
                } else {
                    rowClass = 'late';
                    statusText = '🟢 منذ ' + inTime;
                    statusClass = 'orange';
                }
            }

            html += `
                <div class="emp-row ${rowClass}">
                    <div class="emp-name">${_esc(e.name)}</div>
                    <div class="emp-status ${statusClass}">${_esc(statusText)}</div>
                </div>
            `;
        });
        el.innerHTML = html;
    }

    // ═══ Init ═══
    async function _init() {
        // ① اقرأ ownerUid من URL أو localStorage
        const params = new URLSearchParams(window.location.search);
        ownerUid = params.get('o') || localStorage.getItem('tablet_owner_uid');

        if (!ownerUid) {
            _showError('❌ رابط غير صالح', 'افتح شاشة التابلت من التطبيق.<br>اطلب من المدير فتح الرابط الصحيح.');
            return;
        }

        // احفظ للمرة القادمة
        localStorage.setItem('tablet_owner_uid', ownerUid);
        _hideError();

        // ② حمّل اسم النشاط
        await _loadBusiness();

        // ③ ابدأ الدوران
        await _rotateToken();
        rotateTimer = setInterval(_rotateToken, ROTATION_MS);
        countdownTimer = setInterval(_updateCountdown, 250);
        clockTimer = setInterval(_updateClock, 1000);
        statsTimer = setInterval(_loadStats, 10000);  // كل 10 ثوان
        _updateClock();
        _updateCountdown();

        // ④ حمّل الإحصائيات
        _loadStats();

        console.log('📱 [tablet] ready | owner:', ownerUid);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }
})();
