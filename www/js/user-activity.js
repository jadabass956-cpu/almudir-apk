// ============ 📊 تتبع نشاط المستخدم ============
// يُحدّث lastActiveAt + stats في users/{uid}
// لا يعتمد على تعديل app.js

let _lastTouchTime = 0;
const _TOUCH_INTERVAL = 5 * 60 * 1000; // 5 دقائق

// ---------- تحديث الحقول في Firestore ----------
async function touchLastActive(force) {
    if (typeof auth === 'undefined' || !auth.currentUser) return;
    if (typeof db === 'undefined') return;

    const now = Date.now();
    if (!force && (now - _lastTouchTime) < _TOUCH_INTERVAL) return;
    _lastTouchTime = now;

    const uid = auth.currentUser.uid;
    try {
        await db.collection('users').doc(uid).update({
            lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('📊 [activity] lastActiveAt محدّث');
    } catch(e) {
        console.warn('[activity] touch failed:', e.message);
    }
}

// ---------- حساب stats من currentUser ----------
function computeStats() {
    if (typeof currentUser === 'undefined' || !currentUser) return null;
    const s = {
        materialsCount: Array.isArray(currentUser.materials) ? currentUser.materials.length : 0,
        salesCount:     Array.isArray(currentUser.sales)     ? currentUser.sales.length     : 0,
        expensesCount:  Array.isArray(currentUser.expenses)  ? currentUser.expenses.length  : 0,
        debtsCount:     Array.isArray(currentUser.debts)     ? currentUser.debts.length     : 0,
        customersCount: Array.isArray(currentUser.customers) ? currentUser.customers.length : 0,
        computedAt:     Date.now()
    };

    // آخر فاتورة
    if (s.salesCount > 0) {
        const last = currentUser.sales[currentUser.sales.length - 1];
        s.lastInvoiceAt = last?.date || null;
    }

    return s;
}

// ---------- رفع stats إلى Firestore ----------
async function pushStats(force) {
    if (typeof auth === 'undefined' || !auth.currentUser) return;
    if (typeof db === 'undefined') return;

    const stats = computeStats();
    if (!stats) return;

    const uid = auth.currentUser.uid;
    try {
        await db.collection('users').doc(uid).update({
            stats: stats,
            lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('📊 [activity] stats رُفعت:', stats);
    } catch(e) {
        console.warn('[activity] pushStats failed:', e.message);
    }
}

// ---------- مراقبة الأحداث ----------
function _setupActivityTracking() {
    // 1) عند العودة إلى الصفحة
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            touchLastActive();
            pushStats();
        }
    });

    // 2) عند كل نقرة (مع throttle)
    document.addEventListener('click', () => touchLastActive(), { passive: true });

    // 3) كل 5 دقائق
    setInterval(() => {
        touchLastActive();
    }, _TOUCH_INTERVAL);

    // 4) كل 30 دقيقة → ارفع stats
    setInterval(() => {
        pushStats();
    }, 30 * 60 * 1000);

    console.log('📊 [activity] المراقبة نشطة');
}

// ---------- الربط بـ Firebase Auth ----------
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // عند كل تسجيل دخول: تأخير بسيط حتى تُحمَّل البيانات
            setTimeout(() => {
                touchLastActive(true);
                pushStats(true);
            }, 3000);

            // ابدأ المراقبة (مرة واحدة فقط)
            if (!window._activitySetupDone) {
                window._activitySetupDone = true;
                _setupActivityTracking();
            }
        }
    });
}

// ---------- عند إغلاق الصفحة ----------
window.addEventListener('beforeunload', () => {
    if (typeof pushStats === 'function') {
        pushStats(); // fire-and-forget
    }
});

// تصدير للاستخدام الخارجي (اختياري)
window.touchLastActive = touchLastActive;
window.pushStats = pushStats;

console.log('📊 [user-activity] جاهز');
