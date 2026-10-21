// ============================================================
//  🔔 STORE NOTIFICATIONS — تنبيهات فورية لطلبات المتجر
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const POLL_INTERVAL = 25000;   // 25 ثانية
    const BADGE_ID = 'storeNotifBadge';
    let _lastCount = -1;           // -1 = أول مرة
    let _audioCtx = null;
    let _audioUnlocked = false;
    let _pollTimer = null;
    let _initialized = false;

    // ═══ تهيئة الصوت ═══
    function _initAudio() {
        if (_audioCtx) return _audioCtx;
        try {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { console.warn('[notif] audio:', e); }
        return _audioCtx;
    }

    function _unlockAudio() {
        const ctx = _initAudio();
        if (!ctx || _audioUnlocked) return;
        if (ctx.state === 'suspended') ctx.resume().then(() => { _audioUnlocked = true; }).catch(() => {});
        else _audioUnlocked = true;
    }

    // استمع لأول تفاعل من المستخدم لفتح الصوت
    ['click', 'touchstart', 'keydown'].forEach(ev => {
        document.addEventListener(ev, _unlockAudio, { once: true, passive: true });
    });

    // ═══ صوت جرس (بلا ملفات) ═══
    function _beep(ctx, freq, startTime, duration, vol) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(vol || 0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    function _playChime() {
        const ctx = _initAudio();
        if (!ctx) return;
        try {
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            // نغمة ثلاثية (Do - Mi - Sol)
            _beep(ctx, 523.25, now,        0.18, 0.3); // C5
            _beep(ctx, 659.25, now + 0.14, 0.18, 0.3); // E5
            _beep(ctx, 783.99, now + 0.28, 0.25, 0.35); // G5
        } catch(e) { console.warn('[notif] chime:', e); }
    }

    // ═══ اهتزاز ═══
    function _vibrate() {
        if (navigator.vibrate) {
            try { navigator.vibrate([200, 100, 200]); } catch(e) {}
        }
    }

    // ═══ Toast ═══
    function _showToast(count) {
        const old = document.getElementById('storeNotifToast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.id = 'storeNotifToast';
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#e67e22,#d35400);color:white;padding:14px 22px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:2147483640;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:12px;animation:slideDown 0.3s ease-out;max-width:90vw;box-sizing:border-box;';

        toast.innerHTML = `
            <span style="font-size:26px;">🔔</span>
            <div style="flex:1;min-width:0;">
                <div>طلب جديد!</div>
                <div style="font-size:12px;opacity:0.9;font-weight:400;margin-top:3px;">${count} طلب بانتظار المراجعة</div>
            </div>
            <span style="font-size:22px;">›</span>
        `;

        toast.onclick = function() {
            toast.remove();
            if (typeof window.openStoreOrders === 'function') {
                window.openStoreOrders();
            } else if (typeof window.openMyStore === 'function') {
                window.openMyStore();
            }
        };

        // إضافة animation
        if (!document.getElementById('storeNotifAnim')) {
            const style = document.createElement('style');
            style.id = 'storeNotifAnim';
            style.textContent = '@keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }';
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }
        }, 6000);
    }

    // ═══ Badge على ☰ ═══
    function _updateBadge(count) {
        const menuBtn = document.getElementById('mainMenuBtn');
        if (!menuBtn) return;

        let badge = document.getElementById(BADGE_ID);
        if (count <= 0) {
            if (badge) badge.remove();
            return;
        }

        if (!badge) {
            badge = document.createElement('div');
            badge.id = BADGE_ID;
            badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#e74c3c;color:white;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;display:flex;align-items:center;justify-content:center;padding:0 5px;box-shadow:0 2px 6px rgba(231,76,60,0.5);border:2px solid white;z-index:10;';
            menuBtn.style.position = 'relative';
            menuBtn.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : String(count);
    }

    // ═══ Polling ═══
    async function _pollOrders() {
        try {
            if (!window.db || !window.currentUser?.uid) return;
            // الموظف لا يحتاج هذه التنبيهات
            if (currentUser.ownerUid) return;
            // المتجر فقط
            const bizType = currentUser.businessType || '';
            // (ندعم كل الأنشطة — لا قيد)

            const snap = await db.collection('public_orders')
                .where('ownerUid', '==', currentUser.uid)
                .where('mode', '==', 'store')
                .where('status', '==', 'new')
                .get();

            const count = snap.size;
            _updateBadge(count);

            // أول قراءة = لا تنبيه
            if (_lastCount === -1) {
                _lastCount = count;
                return;
            }

            // إذا زاد العدد → نُنبّه
            if (count > _lastCount) {
                _playChime();
                _vibrate();
                _showToast(count);
                console.log('🔔 [notif] طلب جديد — العدد:', count);
            }

            _lastCount = count;
        } catch(e) {
            // صمت — لا نُزعج المستخدم بأخطاء الشبكة
            if (e.code !== 'unavailable') console.warn('[notif]', e.message);
        }
    }

    // ═══ بدء ═══
    function _start() {
        if (_initialized) return;
        // لا تعمل للموظف
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.ownerUid) {
            console.log('🔔 [notif] موظف — لا تنبيهات');
            return;
        }
        _initialized = true;
        console.log('🔔 [notif] started');

        // تأخير أول استدعاء
        setTimeout(_pollOrders, 3000);

        if (_pollTimer) clearInterval(_pollTimer);
        _pollTimer = setInterval(_pollOrders, POLL_INTERVAL);

        // استمع لتغيير الصفحة → تحديث
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) _pollOrders();
        });
    }

    // انتظر جهوزية currentUser
    let _tries = 0;
    const _waitAuth = setInterval(() => {
        _tries++;
        if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
            clearInterval(_waitAuth);
            _start();
        } else if (_tries > 30) {
            clearInterval(_waitAuth);
        }
    }, 800);

    // واجهة عامة للتحكم
    window._storeNotifToggle = function(enabled) {
        if (_pollTimer) clearInterval(_pollTimer);
        if (enabled) {
            _pollTimer = setInterval(_pollOrders, POLL_INTERVAL);
        }
    };

    window._storeNotifRefresh = _pollOrders;

    console.log('🔔 [store-notifications] loaded');
})();
