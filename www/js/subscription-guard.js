// ============ 🛡️ حماية الاشتراكات ============
// يُستخدم في: openPage (للحجب) + auth.js (للبانر)

function isAdminUser() {
    try {
        return auth.currentUser && auth.currentUser.email &&
               auth.currentUser.email.toLowerCase() === 'jadabass956@gmail.com';
    } catch(e) { return false; }
}

function getTrialStartSafe() {
    if (typeof currentUser === 'undefined' || !currentUser) return null;
    const t = currentUser.trialStartDate;
    if (t) {
        if (t.toDate) return t.toDate().getTime();
        if (t.seconds) return t.seconds * 1000;
        const d = new Date(t);
        if (!isNaN(d)) return d.getTime();
    }
    const cached = localStorage.getItem('trialStart_' + currentUser.uid);
    return cached ? parseInt(cached) : null;
}

function isSubscriptionExpired() {
    if (typeof currentUser === 'undefined' || !currentUser) return false;
    if (isAdminUser()) return false;

    const status = currentUser.subscriptionStatus || 'trial';
    const now = Date.now();

    if (status === 'expired') return true;

    if (status === 'active') {
        const e = currentUser.subscriptionEndDate;
        if (!e) return false;
        const endMs = e.toDate ? e.toDate().getTime() : (e.seconds ? e.seconds * 1000 : new Date(e).getTime());
        return endMs < now;
    }

    if (status === 'trial') {
        const startMs = getTrialStartSafe();
        if (!startMs) return false;
        return (now - startMs) >= (7 * 86400000);
    }

    return false;
}

const EXPIRED_ALLOWED_PAGES = ['my-subscription', 'profile'];

function guardPageAccess(page) {
    if (!isSubscriptionExpired()) return true;
    if (EXPIRED_ALLOWED_PAGES.includes(page)) return true;
    if (typeof showExpiredFullScreen === 'function') showExpiredFullScreen();
    return false;
}

// ---------- شاشة الحجب الكاملة ----------
function showExpiredFullScreen() {
    if (isAdminUser()) return;

    let blk = document.getElementById('expiredFullScreen');
    if (!blk) {
        blk = document.createElement('div');
        blk.id = 'expiredFullScreen';
        blk.style.cssText = 'position:fixed; inset:0; background:linear-gradient(135deg,#e67e22,#d35400); z-index:99998; overflow-y:auto; padding:20px 15px; color:white;';
        blk.innerHTML = `
            <div style="max-width:480px; margin:20px auto;">
                <div style="text-align:center;">
                    <div style="font-size:72px; line-height:1;">⏰</div>
                    <h1 style="font-size:22px; margin:12px 0 6px;">انتهى اشتراكك</h1>
                    <p style="opacity:0.95; font-size:13px; margin-bottom:22px;">
                        لمواصلة استخدام <b>المدير AI</b>،<br>يرجى اختيار إحدى الباقات
                    </p>
                </div>
                <div id="expiredPlansList" style="text-align:right;">
                    <div style="text-align:center; padding:20px; opacity:0.85;">⏳ جاري تحميل الباقات...</div>
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button onclick="logout()" style="padding:12px 30px; background:rgba(255,255,255,0.15); color:white; border:1px solid rgba(255,255,255,0.6); border-radius:10px; font-size:14px; cursor:pointer;">
                        🚪 تسجيل الخروج
                    </button>
                </div>
            </div>`;
        document.body.appendChild(blk);
    } else {
        blk.style.display = 'block';
    }

    // إخفاء كل شيء آخر
    ['authSection','registerSection','mainContainer','subscriptionSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    _loadExpiredPlans();
}

async function _loadExpiredPlans() {
    const list = document.getElementById('expiredPlansList');
    if (!list) return;
    try {
        const snap = await db.collection('subscription_plans').get();
        const plans = [];
        snap.forEach(d => {
            const p = d.data();
            if (p.isActive !== false) plans.push({ id: d.id, ...p });
        });
        plans.sort((a, b) => (a.order || 0) - (b.order || 0));

        if (!plans.length) {
            list.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.85;">لا توجد باقات متاحة حالياً</div>';
            return;
        }

        let html = '';
        plans.forEach(p => {
            const feats = (p.features || []).slice(0, 3).map(f =>
                '<div style="font-size:12px; color:#555; margin-bottom:3px;">✅ ' + _guardEsc(f) + '</div>'
            ).join('');
            html += `
                <div style="background:white; color:#2c3e50; border-radius:14px; padding:16px; margin-bottom:12px; box-shadow:0 4px 14px rgba(0,0,0,0.18); border-right:4px solid ${p.isPopular ? '#f39c12' : '#3498db'};">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                        <div style="font-size:34px;">${p.icon || '💎'}</div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; font-size:16px;">${_guardEsc(p.name || '')}</div>
                            <div style="font-size:12px; color:#777;">${_guardEsc(p.durationText || '')}</div>
                        </div>
                        <div style="font-size:20px; font-weight:bold; color:#e67e22; white-space:nowrap;">${p.price} ${p.currency || 'USD'}</div>
                    </div>
                    ${feats}
                    <button onclick="openSubscribeFromExpired('${p.id}')" style="width:100%; padding:12px; background:#27ae60; color:white; border:none; border-radius:10px; font-size:14px; font-weight:bold; cursor:pointer; margin-top:10px;">
                        💳 اشترك الآن
                    </button>
                </div>`;
        });
        list.innerHTML = html;
    } catch(e) {
        console.error('[guard] plans:', e);
        list.innerHTML = '<div style="text-align:center; padding:20px;">تعذّر التحميل — حاول لاحقاً</div>';
    }
}

function openSubscribeFromExpired(planId) {
    const blk = document.getElementById('expiredFullScreen');
    if (blk) blk.style.display = 'none';

    // 🔑 أظهر mainContainer مؤقتاً ليظهر Modal الاشتراك
    const main = document.getElementById('mainContainer');
    if (main) main.style.display = 'block';

    if (typeof startSubscribe === 'function') {
        startSubscribe(planId);
    } else {
        alert('⚠️ خطأ: دالة الاشتراك غير متوفرة');
    }
}

// 🔑 عند إغلاق Modal الاشتراك — أعِد الحجب إن كان المستخدم منتهياً
function restoreExpiredScreenIfNeeded() {
    const main = document.getElementById('mainContainer');
    const sub = document.getElementById('subscribeModal');
    const blk = document.getElementById('expiredFullScreen');

    // إذا Modal مغلق والمستخدم منتهي → أعِد الحجب
    if (sub && !sub.classList.contains('show')) {
        if (typeof isSubscriptionExpired === 'function' && isSubscriptionExpired()) {
            if (main) main.style.display = 'none';
            if (blk) blk.style.display = 'block';
        }
    }
}

// ---------- بانر تذكير قبل 3 أيام ----------
function showExpiryReminder() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    if (isAdminUser()) return;
    if (document.getElementById('expiryBanner')) return;

    const status = currentUser.subscriptionStatus || 'trial';
    let endMs = null;

    if (status === 'trial') {
        const s = getTrialStartSafe();
        if (s) endMs = s + 7 * 86400000;
    } else if (status === 'active') {
        const e = currentUser.subscriptionEndDate;
        if (e) endMs = e.toDate ? e.toDate().getTime() : (e.seconds ? e.seconds * 1000 : new Date(e).getTime());
    }

    if (!endMs) return;
    const daysLeft = Math.ceil((endMs - Date.now()) / 86400000);
    if (daysLeft > 3 || daysLeft <= 0) return;

    const b = document.createElement('div');
    b.id = 'expiryBanner';
    b.innerHTML = '⚠️ اشتراكك ينتهي بعد <b>' + daysLeft + ' يوم</b> — <span style="text-decoration:underline; cursor:pointer;" onclick="openPage(\'my-subscription\')">اشترك الآن</span>';
    b.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#f39c12; color:white; text-align:center; padding:9px 12px; font-size:13px; z-index:9997; box-shadow:0 2px 8px rgba(0,0,0,0.25);';
    document.body.appendChild(b);
}

function _guardEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('🛡️ [subscription-guard] جاهز');
