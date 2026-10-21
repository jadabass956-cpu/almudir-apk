// ============================================================
//  ALMUDIR — ترجمة رسائل Firebase إلى العربية
// ============================================================

const FIREBASE_ERRORS = {
    // ===== تسجيل الدخول =====
    'auth/invalid-email': '📧 البريد الإلكتروني غير صحيح',
    'auth/user-disabled': '🚫 هذا الحساب معطّل',
    'auth/user-not-found': '❌ لا يوجد حساب بهذا البريد',
    'auth/wrong-password': '🔑 كلمة المرور غير صحيحة',
    'auth/invalid-login-credentials': '❌ البريد أو كلمة المرور غير صحيحة',
    'auth/invalid-credential': '❌ البريد أو كلمة المرور غير صحيحة',
    'INVALID_LOGIN_CREDENTIALS': '❌ البريد أو كلمة المرور غير صحيحة',
    'INVALID_PASSWORD': '🔑 كلمة المرور غير صحيحة',
    'EMAIL_NOT_FOUND': '❌ لا يوجد حساب بهذا البريد',

    // ===== إنشاء حساب =====
    'auth/email-already-in-use': '📧 هذا البريد مستخدم مسبقاً',
    'auth/weak-password': '⚠️ كلمة المرور ضعيفة — يجب أن تكون 6 أحرف على الأقل',
    'auth/operation-not-allowed': '🚫 هذه العملية غير مسموحة حالياً',

    // ===== إعادة تعيين كلمة المرور =====
    'auth/missing-email': '📧 يرجى إدخال البريد الإلكتروني',
    'auth/user-token-expired': '⏰ انتهت صلاحية الجلسة — سجّل الدخول من جديد',

    // ===== الشبكة والحدود =====
    'auth/network-request-failed': '🌐 تعذر الاتصال — تحقق من الإنترنت',
    'auth/too-many-requests': '⏳ محاولات كثيرة — حاول بعد قليل',
    

    // ===== أخطاء تسجيل الدخول (المُعمَّمة 2024+) =====
    'auth/internal-error': '❌ البريد أو كلمة المرور غير صحيحة',
    'auth/invalid-credential': '❌ البريد أو كلمة المرور غير صحيحة',
    'auth/invalid-login-credentials': '❌ البريد أو كلمة المرور غير صحيحة',

    // ===== Firestore =====
    'unavailable': '🌐 الخدمة غير متوفرة مؤقتاً — حاول لاحقاً',
    'permission-denied': '🔒 لا تملك صلاحية لهذا الإجراء',
    'not-found': '📭 البيانات المطلوبة غير موجودة',
    'deadline-exceeded': '⏰ انتهت مهلة الاتصال',

    // ===== عمليات أخرى =====
    'auth/requires-recent-login': '🔑 يجب تسجيل الدخول مجدداً لهذه العملية',
    'auth/email-already-exists': '📧 البريد مستخدم مسبقاً',
    'auth/phone-number-already-exists': '📱 رقم الهاتف مستخدم مسبقاً'
};

/**
 * ترجمة أي خطأ من Firebase إلى العربية
 * @param {Object|Error|string} error - كائن الخطأ
 * @returns {string} - الرسالة المترجمة
 */
function getArabicError(error) {
    if (!error) return 'حدث خطأ غير معروف';

    // إذا كان نصاً
    if (typeof error === 'string') {
        // ابحث عن أي مفتاح داخل النص
        for (const key of Object.keys(FIREBASE_ERRORS)) {
            if (error.includes(key)) return FIREBASE_ERRORS[key];
        }
        return '❌ ' + error;
    }

    // إذا كان كائناً
    const code = error.code || '';
    const msg = error.message || '';

    // الأولوية: الكود الدقيق
    if (code && FIREBASE_ERRORS[code]) {
        return FIREBASE_ERRORS[code];
    }

    // البحث في الرسالة
    if (msg) {
        for (const key of Object.keys(FIREBASE_ERRORS)) {
            if (msg.includes(key)) return FIREBASE_ERRORS[key];
        }
    }

    // احتياطي
    if (msg) return '❌ ' + msg;
    return '❌ حدث خطأ غير متوقع';
}

console.log('🌐 [error-messages] جاهز —', Object.keys(FIREBASE_ERRORS).length, 'رسالة');
