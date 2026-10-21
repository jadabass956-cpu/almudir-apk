// ============================================================
//  📅 EXPIRY MANAGER — إدارة الصلاحيات
//  تحميل config + فحص + إجبار + حجب بيع
// ============================================================

let _activityConfig = {};
let _activityConfigLoaded = false;

// ---------- تحميل القائمة ----------
async function loadActivityConfig() {
    if (_activityConfigLoaded) return;
    try {
        const snap = await db.collection('activity_config').get();
        _activityConfig = {};
        snap.forEach(d => {
            _activityConfig[d.id] = d.data();
        });
        _activityConfigLoaded = true;
        console.log('📅 [expiry] محمّل:', Object.keys(_activityConfig).length, 'نشاط');

        // 🎯 تطبيق الحقول الديناميكية على صفحة المواد (إن كانت مفتوحة)
        if (typeof applyActivityFieldsVisibility === 'function') {
            setTimeout(() => {
                try {
                    applyActivityFieldsVisibility();
                    console.log('🎯 [expiry] طبّق الحقول الديناميكية');
                } catch(e) { console.warn('[fields]', e.message); }
            }, 100);
        }
    } catch(e) {
        console.warn('[expiry] load failed:', e.message);
    }
}

// ---------- دالة تطبيع شاملة ----------
function _normalizeActivityType(s) {
    return String(s || '').trim()
        .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/[\u0623\u0625\u0622]/g, '\u0627')
        .replace(/\u0629/g, '\u0647')
        .replace(/\u0649/g, '\u064A');
}

function _findActivityConfig(type) {
    if (!type || !_activityConfig) return null;
    const normType = _normalizeActivityType(type);
    if (!normType) return null;

    // ① مطابقة مباشرة
    for (const key in _activityConfig) {
        const cfg = _activityConfig[key];
        if (!cfg) continue;
        if (_normalizeActivityType(key) === normType) return cfg;
        if (_normalizeActivityType(cfg.name) === normType) return cfg;
        if (_normalizeActivityType(cfg.activityId) === normType) return cfg;
    }

    // ② مطابقة جزئية
    for (const key in _activityConfig) {
        const cfg = _activityConfig[key];
        if (!cfg) continue;
        const nk = _normalizeActivityType(key);
        const nn = _normalizeActivityType(cfg.name);
        if ((nk && (nk.includes(normType) || normType.includes(nk))) ||
            (nn && (nn.includes(normType) || normType.includes(nn)))) {
            return cfg;
        }
    }

    return null;
}

// ---------- هل نشاط المستخدم يتطلب صلاحية؟ ----------
function requiresExpiry() {
    try {
        if (typeof currentUser === 'undefined' || !currentUser) return false;
        const type = (currentUser.businessType || '').trim();
        if (!type) return false;
        const cfg = _findActivityConfig(type);
        return cfg ? !!cfg.requiresExpiry : false;
    } catch(e) {
        console.warn('[expiry] requiresExpiry:', e.message);
        return false;
    }
}

// ---------- هل النشاط يتطلب باركود؟ ----------
function requiresBarcode() {
    try {
        if (typeof currentUser === 'undefined' || !currentUser) return false;
        const type = (currentUser.businessType || '').trim();
        if (!type) return false;
        const cfg = _findActivityConfig(type);
        return cfg ? !!cfg.requiresBarcode : false;
    } catch(e) {
        console.warn('[expiry] requiresBarcode:', e.message);
        return false;
    }
}

// ---------- هل المادة منتهية؟ ----------
function isMaterialExpired(material) {
    if (!material || !material.expiryDate) return false;
    const expD = new Date(material.expiryDate);
    if (isNaN(expD)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expD.setHours(0, 0, 0, 0);
    // 🆕 متشدّد: ينتهي اليوم = منتهي (لا تبعه)
    return expD <= today;
}

// ---------- أيام متبقية ----------
function daysUntilExpiry(material) {
    if (!material || !material.expiryDate) return null;
    const expD = new Date(material.expiryDate);
    if (isNaN(expD)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expD.setHours(0, 0, 0, 0);
    return Math.ceil((expD - today) / 86400000);
}

// ---------- تسجيل محاولة بيع مادة منتهية ----------
async function logExpiryViolation(material, invoice) {
    try {
        await db.collection('expiry_violations').add({
            uid: auth.currentUser.uid,
            userName: currentUser?.fullName || 'غير معروف',
            businessName: currentUser?.businessName || '',
            businessType: currentUser?.businessType || '',
            materialId: material.id,
            materialName: material.name,
            expiryDate: material.expiryDate,
            attemptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            invoice: invoice || '',
            blocked: true
        });
        console.log('⚠️ [expiry] تم تسجيل المحاولة');
    } catch(e) {
        console.warn('[expiry] log failed:', e.message);
    }
}

// ---------- تحميل عند البدء ----------
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            loadActivityConfig();
        }
    });
} else {
    // محاولة عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof currentUser !== 'undefined' && currentUser?.businessType) {
                loadActivityConfig();
            }
        }, 1000);
    });
}

// تصدير للاستخدام
window.expiryManager = {
    load: loadActivityConfig,
    requires: requiresExpiry,
    isExpired: isMaterialExpired,
    daysLeft: daysUntilExpiry,
    logViolation: logExpiryViolation,
    requiresBarcode: requiresBarcode,
    getConfig: () => _activityConfig,
    isLoaded: () => _activityConfigLoaded
};

// 🆕 تصدير الدوال والبيانات globally
window.requiresBarcode = requiresBarcode;
window.requiresExpiry = requiresExpiry;
window.loadActivityConfig = loadActivityConfig;
window._getActivityConfig = () => _activityConfig;
window._isActivityConfigLoaded = () => _activityConfigLoaded;

console.log('📅 [expiry-manager] جاهز');
