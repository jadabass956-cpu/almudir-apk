// ============================================================
//  🔔 EXPIRY BANNER — تنبيه أعلى التطبيق
// ============================================================

let _expiryBannerDismissedToday = false;

// ---------- عرض البانر ----------
function checkExpiryBanner() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    if (typeof isAdminUser === 'function' && isAdminUser()) return;

    // تجنّب التكرار اليوم
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('expiryBannerDate') === today) return;

    // افحص المواد
    let expiredCount = 0;
    let soonCount = 0;

    (typeof materials !== 'undefined' ? materials : []).forEach(m => {
        if (!m.expiryDate) return;
        const expD = new Date(m.expiryDate);
        if (isNaN(expD)) return;
        const today0 = new Date(); today0.setHours(0,0,0,0);
        expD.setHours(0,0,0,0);
        const days = Math.ceil((expD - today0) / 86400000);
        if (days <= 0) expiredCount++;
        else if (days <= 7) soonCount++;
    });

    if (expiredCount === 0 && soonCount === 0) {
        _removeExpiryBanner();
        return;
    }

    _showExpiryBanner(expiredCount, soonCount);
}

// ---------- إظهار ----------
function _showExpiryBanner(expiredCount, soonCount) {
    _removeExpiryBanner();

    let bg = '#fff3cd';
    let border = '#f39c12';
    let icon = '⚠️';
    let title = 'تنبيه';
    let parts = [];

    if (expiredCount > 0) {
        bg = '#fef2f2';
        border = '#e74c3c';
        icon = '🚨';
        title = 'تنبيه مهم';
        parts.push(`<b>${expiredCount}</b> مادة منتهية`);
    }
    if (soonCount > 0) {
        parts.push(`<b>${soonCount}</b> تنتهي قريباً`);
    }

    const banner = document.createElement('div');
    banner.id = 'expiryBanner';
    banner.style.cssText = `position:fixed; top:0; left:0; right:0; background:${bg}; color:#2c3e50; border-bottom:3px solid ${border}; padding:10px 15px; z-index:9997; box-shadow:0 2px 8px rgba(0,0,0,0.15); font-size:13px; display:flex; align-items:center; gap:10px;`;
    banner.innerHTML = `
        <div style="font-size:24px;">${icon}</div>
        <div style="flex:1;">
            <div style="font-weight:bold; margin-bottom:2px;">${title}: ${parts.join(' • ')}</div>
            <div style="font-size:11px; color:#666;">راجع المواد في قسم "المواد"</div>
        </div>
        <button onclick="goToExpiredMaterials()" style="padding:6px 12px; background:${border}; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; white-space:nowrap;">عرض</button>
        <button onclick="_dismissExpiryBanner()" style="background:transparent; color:#999; border:none; font-size:18px; cursor:pointer; padding:0 5px;">×</button>
    `;

    document.body.appendChild(banner);
    document.body.style.paddingTop = '70px';
}

function _removeExpiryBanner() {
    const el = document.getElementById('expiryBanner');
    if (el) {
        el.remove();
        document.body.style.paddingTop = '';
    }
}

function _dismissExpiryBanner() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('expiryBannerDate', today);
    _removeExpiryBanner();
}

function goToExpiredMaterials() {
    _removeExpiryBanner();
    if (typeof openPage === 'function') openPage('materials');
    // فلترة المواد المنتهية
    setTimeout(() => {
        if (typeof materials !== 'undefined' && typeof renderMaterialsTable === 'function') {
            const expired = materials.filter(m => {
                if (!m.expiryDate) return false;
                const expD = new Date(m.expiryDate);
                if (isNaN(expD)) return false;
                const today = new Date(); today.setHours(0,0,0,0);
                expD.setHours(0,0,0,0);
                return Math.ceil((expD - today) / 86400000) <= 0;
            });
            renderMaterialsTable(expired);
        }
    }, 300);
}

// ---------- تحميل عند البدء ----------
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            setTimeout(checkExpiryBanner, 3000);
        }
    });
}

console.log('🔔 [expiry-banner] جاهز');
