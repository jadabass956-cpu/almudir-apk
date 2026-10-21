// ============================================================
//  ALMUDIR — نظام إشعارات المدير
// ============================================================

const ADMIN_NOTIF = {
    supportCount: 0,
    bugCount: 0,
    lastSeenSupport: parseInt(localStorage.getItem('admin_lastSupport') || '0'),
    lastSeenBug: parseInt(localStorage.getItem('admin_lastBug') || '0'),
    initialized: false,
    soundEnabled: true
};

// ---------- تهيئة ----------
async function adminNotifInit() {
    try {
        if (typeof auth === 'undefined' || !auth.currentUser) return;
        if (auth.currentUser.email !== 'jadabass956@gmail.com') return;
        if (ADMIN_NOTIF.initialized) return;

        ADMIN_NOTIF.initialized = true;
        console.log('🔔 [Notif] بدء المراقبة...');

        // طلب إذن الإشعارات
        if ('Notification' in window && Notification.permission === 'default') {
            try { Notification.requestPermission(); } catch(e) {}
        }

        // مراقبة محادثات الدعم
        db.collection('support_conversations').onSnapshot(snap => {
            let count = 0;
            snap.forEach(doc => {
                const messages = doc.data().messages || [];
                messages.forEach(msg => {
                    if (msg.sender === 'user' && (msg.timestamp || 0) > ADMIN_NOTIF.lastSeenSupport) {
                        count++;
                    }
                });
            });

            // تنبيه عند الزيادة
            if (count > ADMIN_NOTIF.supportCount && ADMIN_NOTIF.supportCount > 0) {
                adminNotifAlert('💬 رسالة دعم جديدة', 'لديك رسالة جديدة من مستخدم');
            }

            ADMIN_NOTIF.supportCount = count;
            adminNotifUpdateBadge();
        }, err => console.warn('Support listener:', err.message));

        // مراقبة البلاغات
        db.collection('bug_reports').where('status', '==', 'new').onSnapshot(snap => {
            const count = snap.size;

            if (count > ADMIN_NOTIF.bugCount && ADMIN_NOTIF.bugCount > 0) {
                adminNotifAlert('🐛 بلاغ جديد', 'وصل بلاغ مشكلة جديد');
            }

            ADMIN_NOTIF.bugCount = count;
            adminNotifUpdateBadge();
        }, err => console.warn('Bug listener:', err.message));

    } catch (e) {
        console.warn('[Notif]', e);
    }
}

// ---------- التنبيه المركّب ----------
function adminNotifAlert(title, body) {
    adminNotifPlaySound();
    adminNotifShowBrowser(title, body);
    adminNotifToast(title, body);
}

// ---------- الصوت ----------
function adminNotifPlaySound() {
    if (!ADMIN_NOTIF.soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        function beep(freq, delay, duration) {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            }, delay);
        }

        // صوت "دينغ-دونغ"
        beep(880, 0, 0.15);
        beep(1100, 180, 0.25);
    } catch (e) {
        console.warn('Sound failed:', e);
    }
}

// ---------- إشعار المتصفح ----------
function adminNotifShowBrowser(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
        const n = new Notification(title, {
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-96.png',
            tag: 'almudir-' + Date.now(),
            requireInteraction: false
        });
        setTimeout(() => n.close(), 8000);
    } catch (e) {}
}

// ---------- Toast داخلي ----------
function adminNotifToast(title, body) {
    let toast = document.getElementById('adminNotifToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminNotifToast';
        toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#2c3e50; color:white; padding:14px 22px; border-radius:12px; box-shadow:0 6px 20px rgba(0,0,0,0.3); z-index:999999; max-width:90%; text-align:center; font-family:Arial; direction:rtl;';
        document.body.appendChild(toast);
    }

    toast.innerHTML = '<div style="font-size:16px; font-weight:bold; margin-bottom:5px;">' + title + '</div>' +
                      '<div style="font-size:13px; opacity:0.9;">' + body + '</div>';
    toast.style.display = 'block';
    toast.style.opacity = '1';

    clearTimeout(window._adminToastTimer);
    window._adminToastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 5000);
}

// ---------- Badge على زر الإدارة ----------
function adminNotifUpdateBadge() {
    const total = ADMIN_NOTIF.supportCount + ADMIN_NOTIF.bugCount;

    // الزر في القائمة الجانبية
    const btn = document.getElementById('adminDropBtn');
    if (btn) {
        const old = btn.querySelector('.notif-badge');
        if (old) old.remove();

        if (total > 0) {
            const badge = document.createElement('span');
            badge.className = 'notif-badge';
            badge.textContent = total > 99 ? '99+' : total;
            badge.style.cssText = 'background:#e74c3c; color:white; border-radius:10px; padding:2px 8px; font-size:11px; margin-right:5px; font-weight:bold; display:inline-block; min-width:18px; text-align:center;';
            btn.appendChild(badge);
        }
    }

    // شريط الأيقونة (favicon) — اختياري
    // (نتركه لاحقاً)
}

// ---------- تعليم كمقروء ----------
function adminNotifMarkSeen() {
    ADMIN_NOTIF.lastSeenSupport = Date.now();
    ADMIN_NOTIF.lastSeenBug = Date.now();
    localStorage.setItem('admin_lastSupport', ADMIN_NOTIF.lastSeenSupport);
    localStorage.setItem('admin_lastBug', ADMIN_NOTIF.lastSeenBug);

    ADMIN_NOTIF.supportCount = 0;
    ADMIN_NOTIF.bugCount = 0;
    adminNotifUpdateBadge();

    // إزالة Toast
    const toast = document.getElementById('adminNotifToast');
    if (toast) toast.style.display = 'none';

    console.log('✅ تم تعليم الكل كمقروء');
}

// ---------- تشغيل عند بدء التطبيق ----------
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(adminNotifInit, 3000);
    setTimeout(adminNotifInit, 6000);
});

if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(user => {
        if (user && user.email === 'jadabass956@gmail.com') {
            ADMIN_NOTIF.initialized = false;
            setTimeout(adminNotifInit, 2000);
        }
    });
}

console.log('🔔 [admin-notif] جاهز');
