
// ===== ALMUDIR: Firebase Persistence =====
// يجبر Firebase على حفظ الجلسة محلياً (LOCAL) حتى بعد إغلاق التطبيق
(async () => {
    try {
        if (auth && auth.setPersistence && firebase.auth.Auth.Persistence) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            console.log('✅ Firebase persistence = LOCAL');
        }
    } catch (e) {
        console.warn('setPersistence failed:', e);
    }
})();
// ===== END =====

const ADMIN_EMAIL = 'jadabass956@gmail.com';
// ==================== المتغيرات العامة ====================
let currentUser = null; // بيانات المستخدم من Firestore

// ==================== 👁️ دوال المساعدة ====================
// إظهار/إخفاء كلمة المرور
window._toggleAuthPass = function() {
    const input = document.getElementById('authPassword');
    const btn = document.getElementById('authPassToggle');
    if (!input || !btn) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.style.opacity = '1';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.style.opacity = '0.6';
    }
};

// 👁️ إظهار/إخفاء كلمة مرور التسجيل
window._toggleRegPass = function(fieldId, btn) {
    const input = document.getElementById(fieldId);
    if (!input || !btn) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.style.opacity = '1';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.style.opacity = '0.6';
    }
};

// ==================== دوال إظهار الشاشات ====================
// 🚫 Modal حاجب عند محاولة عميل دخول واجهة التاجر
function _showCustomerBlockModal() {
    document.getElementById('customerBlockModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'customerBlockModal';
    modal.style.cssText = 'position:fixed;inset:0;background:#1a1a2e;z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;direction:rtl;';

    modal.innerHTML = `
        <div style="background:white;border-radius:20px;max-width:400px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
            <div style="font-size:56px;margin-bottom:14px;">👤</div>
            <div style="font-size:18px;font-weight:900;color:#2c3e50;margin-bottom:10px;">
                أنت مسجّل كـ عميل
            </div>
            <div style="font-size:13px;color:#7f8c8d;line-height:1.8;margin-bottom:24px;">
                هذا التطبيق مخصص للتجار والموظفين.<br>
                الرجاء استخدام التطبيق المخصص للتسوق.
            </div>

            <button onclick="_customerBlockSignOut()" style="width:100%;padding:14px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:12px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(231,76,60,0.35);">
                🚪 تسجيل الخروج
            </button>
        </div>`;
    document.body.appendChild(modal);
}

async function _customerBlockSignOut() {
    try {
        await auth.signOut();
        currentUser = null;
        document.getElementById('customerBlockModal')?.remove();
        showLogin();
    } catch(e) {
        console.warn('[customer block signOut]', e);
        location.reload();
    }
}
window._customerBlockSignOut = _customerBlockSignOut;

function showLogin() {
    document.body.classList.add('login-screen');
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.remove('show');
    const menuBtn = document.getElementById('mainMenuBtn');
    if (menuBtn) menuBtn.style.display = 'none';
    hideLoading();
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('subscriptionSection').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'none';
}

// ═══ 🛒 CUSTOMER SIGNUP — دعم ?signup=customer و ?login=customer ═══
function _handleCustomerAuthParams() {
    try {
        const params = new URLSearchParams(location.search);
        const signup = params.get('signup');
        const login = params.get('login');

        // ① تسجيل جديد كعميل
        if (signup === 'customer') {
            console.log('🛒 [auth] customer signup mode');
            showRegister();

            // اختر "customer" تلقائياً
            setTimeout(() => {
                if (typeof window._regSelectAccountType === 'function') {
                    window._regSelectAccountType('customer');
                }
            }, 300);

            return true;
        }

        // ② دخول كعميل
        if (login === 'customer') {
            console.log('🛒 [auth] customer login mode');
            showLogin();
            return true;
        }

        return false;
    } catch (e) {
        console.warn('[auth] params:', e);
        return false;
    }
}
window._handleCustomerAuthParams = _handleCustomerAuthParams;


function showRegister() {
    document.body.classList.add('login-screen');
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.remove('show');
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('subscriptionSection').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'none';
}

function showSubscriptionScreen() {
    // ✨ استخدم شاشة الحجب الجديدة إن وُجدت
    if (typeof showExpiredFullScreen === 'function') {
        try {
            // أخفِ الأقسام القديمة
            ['authSection','registerSection','mainContainer'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            const old = document.getElementById('subscriptionSection');
            if (old) old.style.display = 'none';

            showExpiredFullScreen();
            return;
        } catch(e) {
            console.warn('[showSubscriptionScreen] fallback to old:', e.message);
        }
    }

    // Fallback — النسخة القديمة
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.remove('show');
    hideLoading();
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('subscriptionSection').style.display = 'block';
    document.getElementById('mainContainer').style.display = 'none';
}

function showApp() {
    document.body.classList.remove('login-screen');
    document.body.classList.add('app-ready');
    const menuBtn = document.getElementById('mainMenuBtn');
    if (menuBtn) menuBtn.style.display = 'block';
    hideLoading();
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('subscriptionSection').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    openPage('analytics');
    updateAllTables();
}

// ==================== دوال المصادقة ====================


// ============================================================
//  ✨ التحقق الفوري من تطابق كلمة المرور
// ============================================================
function checkPasswordMatch() {
    const pass = document.getElementById('regPassword');
    const confirm = document.getElementById('regPasswordConfirm');
    const msg = document.getElementById('passMatchMsg');
    if (!pass || !confirm || !msg) return;

    if (!confirm.value) {
        msg.style.display = 'none';
        return;
    }

    if (pass.value === confirm.value) {
        msg.style.display = 'block';
        msg.style.color = '#27ae60';
        msg.textContent = '✅ كلمتا المرور متطابقتان';
        confirm.style.borderColor = '#27ae60';
    } else {
        msg.style.display = 'block';
        msg.style.color = '#e74c3c';
        msg.textContent = '❌ كلمتا المرور غير متطابقتين';
        confirm.style.borderColor = '#e74c3c';
    }
}



// ============================================================
//  ✨ تحديث رمز الهاتف حسب الدولة
// ============================================================
function updatePhonePrefix() {
    const country = document.getElementById('regCountry');
    const prefix = document.getElementById('regPhonePrefix');
    if (!country || !prefix) return;
    
    const code = country.value;
    // امسح القائمة الحالية
    prefix.innerHTML = '';
    // أضف الرمز الجديد
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code;
    prefix.appendChild(opt);
}

// ═══════════════════════════════════════════════════════
//  🎯 SELECT WHO — تاجر أم موظف؟
// ═══════════════════════════════════════════════════════
// 👤 اختيار نوع الحساب في التسجيل
let _regAccountType = null;
let _regBusinessType = null;

window._regSelectAccountType = function(type) {
    _regAccountType = type;

    // تحديث شكل البطاقات
    document.querySelectorAll('.acc-type-card').forEach(card => {
        const isSelected = card.dataset.type === type;
        card.style.background = isSelected ? '#f0f7ff' : 'white';
        card.style.borderColor = isSelected ? '#667eea' : '#e9ecef';
        card.style.transform = isSelected ? 'translateY(-2px)' : 'none';
        card.style.boxShadow = isSelected ? '0 6px 16px rgba(102,126,234,0.25)' : 'none';
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = isSelected;
    });

    // تفعيل/إبطال قسم النشاط التجاري
    const bizSection = document.getElementById('regBusinessSection');
    const hint = document.getElementById('regBusinessHint');
    if (bizSection) {
        const isMerchant = type === 'merchant';
        bizSection.style.opacity = isMerchant ? '1' : '0.4';
        bizSection.style.pointerEvents = isMerchant ? 'auto' : 'none';

        if (!isMerchant) {
            // إلغاء اختيار أي نشاط
            _regBusinessType = null;
            document.querySelectorAll('.biz-type-card').forEach(card => {
                card.style.background = 'white';
                card.style.borderColor = '#e9ecef';
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });
        }

        if (hint) {
            hint.textContent = isMerchant ? '' : '(يتفعّل للتاجر فقط)';
        }
    }

    // حقول الموقع — مخفية للموظف
    const hideLocation = (type === 'employee');
    ['regGovernorate', 'regTown', 'regDistrict'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = hideLocation ? 'none' : '';
    });

    console.log('🎯 [register] نوع الحساب:', type);
};

window._regSelectBusiness = function(bizType) {
    _regBusinessType = bizType;

    document.querySelectorAll('.biz-type-card').forEach(card => {
        const isSelected = card.dataset.biz === bizType;
        card.style.background = isSelected ? '#e8f5e9' : 'white';
        card.style.borderColor = isSelected ? '#27ae60' : '#e9ecef';
        card.style.transform = isSelected ? 'translateY(-2px)' : 'none';
        card.style.boxShadow = isSelected ? '0 6px 16px rgba(39,174,96,0.25)' : 'none';
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = isSelected;
    });

    console.log('🎯 [register] النشاط:', bizType);
};

// الدالة القديمة (للتوافق مع كود قديم)
function handleRegBusinessTypeChange() {
    if (_regBusinessType) _regSelectBusiness(_regBusinessType);
}
window.handleRegBusinessTypeChange = handleRegBusinessTypeChange;


async function register() {
    const fullName = document.getElementById('regFullName').value.trim();
    const phone = (function() {
        const prefix = document.getElementById('regPhonePrefix');
        const phone = document.getElementById('regPhone');
        const prefixVal = prefix ? prefix.value : '';
        const phoneVal = phone ? phone.value.trim() : '';
        return prefixVal + phoneVal;
    })();
        const country = document.getElementById('regCountry') ? document.getElementById('regCountry').value : '+963';
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm') ? document.getElementById('regPasswordConfirm').value : '';

        // 🔐 قوة كلمة المرور
        if (!password || password.length < 8) {
            alert('⚠️ كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }
        if (!/[a-z]/.test(password)) {
            alert('⚠️ كلمة المرور يجب أن تحتوي على حرف صغير (a-z)');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            alert('⚠️ كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)');
            return;
        }
        if (!/[0-9]/.test(password)) {
            alert('⚠️ كلمة المرور يجب أن تحتوي على رقم (0-9)');
            return;
        }
        if (password !== passwordConfirm) {
            alert('❌ كلمتا المرور غير متطابقتين\n\nيرجى التأكد من كتابة نفس كلمة المرور في الحقلين.');
            return;
        }
    const agreed = document.getElementById('regAgree').checked;

    // 👤 التحقق من اختيار نوع الحساب
    if (!_regAccountType) {
        alert('⚠️ يرجى اختيار نوع الحساب: تاجر ، موظف ، أو مستخدم');
        return;
    }

    // 🏪 التحقق من اختيار النشاط للتاجر فقط
    if (_regAccountType === 'merchant' && !_regBusinessType) {
        alert('⚠️ يرجى اختيار النشاط التجاري');
        return;
    }

    const _bizType = _regBusinessType || '';
    const regType = _regAccountType;  // merchant | employee | customer

    let governorate = '', town = '', district = '', businessType = _bizType;

    if (regType === 'employee') {
        // موظف: لا يحتاج حقول تجارية أو موقع
        businessType = 'موظفين';
        governorate = '-';
        town = '-';
        district = '-';
    } else if (regType === 'customer') {
        // 🆕 مستخدم (عميل): يحتاج الموقع لكن ليس النشاط التجاري
        businessType = 'عميل';
        governorate = document.getElementById('regGovernorate').value.trim();
        town = document.getElementById('regTown').value.trim();
        district = document.getElementById('regDistrict').value.trim();

        if (!governorate || !town || !district) {
            document.getElementById('registerError').textContent = 'الرجاء تعبئة المحافظة والبلدة والحي';
            return;
        }
    } else if (regType === 'merchant') {
        // تاجر: كل الحقول إلزامية
        governorate = document.getElementById('regGovernorate').value.trim();
        town = document.getElementById('regTown').value.trim();
        district = document.getElementById('regDistrict').value.trim();

        if (!businessType) {
            document.getElementById('registerError').textContent = 'الرجاء اختيار النشاط التجاري';
            return;
        }
        if (!governorate || !town || !district) {
            document.getElementById('registerError').textContent = 'الرجاء تعبئة المحافظة والبلدة والحي';
            return;
        }
    } else {
        document.getElementById('registerError').textContent = '⚠️ يرجى اختيار نوع الحساب';
        return;
    }

    // فحص الحقول الأساسية
    if (!fullName || !phone || !email || !password || !agreed) {
        document.getElementById('registerError').textContent = 'الرجاء تعبئة جميع الحقول والموافقة على الشروط';
        return;
    }

    if (regType === 'trader' && (!governorate || !town || !district)) {
        document.getElementById('registerError').textContent = 'الرجاء تعبئة المحافظة والبلدة والحي';
        return;
    }

    try {
        // 🔍 فحص phone_registry — منع التسجيل المزدوج
        const _rawDigits = phone.replace(/\D/g, '');
        const _cc = (typeof getSelectedCountryCode === 'function' ? getSelectedCountryCode() : '+963').replace('+', '');
        const _withoutCC = _rawDigits.startsWith(_cc) ? _rawDigits.slice(_cc.length) : _rawDigits;
        const _normalizedPhone = _cc + _withoutCC.replace(/^0+/, '');

        try {
            const _regSnap = await db.collection('phone_registry').doc(_normalizedPhone).get();
            if (_regSnap.exists) {
                const _existing = _regSnap.data();
                document.getElementById('registerError').textContent =
                    _existing.accountType === regType
                        ? '📱 هذا الرقم مسجّل مسبقاً'
                        : '⚠️ هذا الرقم مسجّل بنوع حساب مختلف — استخدم رقماً آخر';
                return;
            }
        } catch(_e) { console.warn('[phone_registry check]', _e); }

        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        // إرسال رابط التفعيل إلى البريد الإلكتروني
        await cred.user.sendEmailVerification();
        const _userDoc = {
            fullName,
            phone,
            email,
            location: { governorate, town, district },
            businessType,
            accountType: regType,  // 🆕 merchant | employee | customer
            countryCode: getSelectedCountryCode(),
            countryPhonePrefix: getSelectedCountryPhonePrefix(),
            agreedToTerms: true,
            isEmployee: regType === 'employee',
            businessTypeLocked: false  // سيُقفل بعد أول استخدام
        };
        // 👤 الموظفون لا يحصلون على اشتراك تجريبي — اشتراكهم مرتبط بالمدير
        // 🆕 المستخدم (العميل) لا يحتاج اشتراكاً — يتسوق مجاناً
        if (regType === 'merchant') {
            _userDoc.trialStartDate = firebase.firestore.FieldValue.serverTimestamp();
            _userDoc.subscriptionStatus = 'trial';
        }
        await db.collection('users').doc(uid).set(_userDoc);

        // 📱 حفظ في phone_registry (لمنع التسجيل المزدوج)
        try {
            await db.collection('phone_registry').doc(_normalizedPhone).set({
                uid: uid,
                accountType: regType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(_e) { console.warn('[phone_registry save]', _e); }

        // 📧 رسالة حسب نوع الحساب
        let _successMsg = '✅ تم إنشاء الحساب بنجاح!\n\n';
        _successMsg += '📧 أرسلنا رابط تفعيل إلى:\n' + email + '\n\n';
        _successMsg += '⚠️ يجب الضغط على الرابط قبل الدخول.\n';
        _successMsg += '📌 افحص مجلد الرسائل غير المرغوب فيها (Spam) إذا لم تجدها.';

        if (regType === 'employee') {
            _successMsg += '\n\n👥 بعد التفعيل، ستنتظر ربطك بمتجر صاحب العمل.';
        } else if (regType === 'customer') {
            _successMsg += '\n\n🛒 بعد التفعيل، ستدخل مباشرةً إلى واجهة التسوق.';
        } else if (regType === 'merchant') {
            _successMsg += '\n\n🏪 بعد التفعيل، ستدخل مباشرةً إلى لوحة التاجر.';
        }

        alert(_successMsg);

        // 🔐 اخراج من الحساب (لن يدخل قبل التفعيل)
        await auth.signOut();
        showLogin();
    } catch (error) {
        document.getElementById('registerError').textContent = getArabicError(error);
    }
}

async function login() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    try {
        const cred = await auth.signInWithEmailAndPassword(email, password);

        // 🔐 التحقق من تفعيل البريد
        if (!cred.user.emailVerified) {
            // أرسل رابط تفعيل جديد
            try { await cred.user.sendEmailVerification(); } catch(e) { console.warn('[login] verification resend:', e.message); }

            await auth.signOut();
            alert('⚠️ بريدك لم يُفعّل بعد!\n\n' +
                  '📧 أرسلنا رابط تفعيل إلى:\n' + email + '\n\n' +
                  'يرجى الضغط على الرابط ثم العودة للدخول.\n\n' +
                  '📌 افحص مجلد الرسائل غير المرغوب فيها (Spam).');
            return;
        }

        await checkSubscriptionAndShowApp();
    } catch (error) {
        document.getElementById('loginError').textContent = getArabicError(error);
    }
}

async function logout() {
    document.body.classList.remove('app-ready');
    document.body.classList.remove('employee-mode');
    stopListeningToUserData();
    await auth.signOut();
    currentUser = null;
    showLogin();
}

// ==================== فحص الاشتراك ====================
async function checkSubscriptionAndShowApp() {
    document.body.classList.remove('loading');
    const user = auth.currentUser;
    if (!user) {
        showLogin();
        return;
    }
    try {
        // 🚫 فحص الحظر أولاً — قبل أي شيء
        try {
            const _banSnap = await db.collection('banned_users').doc(user.uid).get();
            if (_banSnap.exists) {
                alert('🚫 تم حذف حسابك من قبل الإدارة.\n\nللتواصل: +963 994 456 264');
                await auth.signOut();
                showLogin();
                return;
            }
        } catch(_be) { console.warn('[auth] ban check:', _be.message); }

        // رفض الدخول إذا كان البريد غير مفعّل
        if (!user.emailVerified) {
            alert('يرجى تفعيل بريدك الإلكتروني أولاً.\nتم إرسال رابط التفعيل إلى بريدك.\nإذا لم تجد الرسالة في البريد الوارد، افحص مجلد الرسائل غير المرغوب فيها (Spam).');
            await user.sendEmailVerification();
            await auth.signOut();
            showLogin();
            return;
        }

        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            currentUser = doc.data();
            currentUser.uid = user.uid;

            // 🚫 فحص الحظر (disabled flag)
            if (currentUser.disabled === true) {
                alert('🚫 تم حظر حسابك من قبل الإدارة.\n\nللتواصل: +963 994 456 264');
                await auth.signOut();
                showLogin();
                return;
            }

            _applyUserMode();

            // 🛒 العميل (مستخدم) → منع الدخول لواجهة التاجر (Modal حاجب)
            if (currentUser.accountType === 'customer') {
                console.log('🛒 [auth] customer — blocking access');
                document.body.classList.remove('loading');
                _showCustomerBlockModal();
                return;
            }

            // 👤 الموظفون لا يخضعون لنظام الاشتراك — اشتراكهم مرتبط بالمدير
            if (currentUser.isEmployee === true || currentUser.businessType === 'موظفين') {
                await loadAllDataFromFirestore();
                listenToUserData();
                checkPinOnLoad();
                checkAdminAccess();
                if (typeof showExpiryReminder === 'function') setTimeout(showExpiryReminder, 1500);
                if (window.OneSignalDeferred) {
                    OneSignalDeferred.push(async function(OneSignal) {
                    try {
                        await OneSignal.login(auth.currentUser.uid);
                        console.log('🔔 [OneSignal] ربط موظف:', auth.currentUser.uid);
                        const subId = OneSignal.User?.PushSubscription?.id;
                        if (subId) {
                            await db.collection('users').doc(auth.currentUser.uid)
                                .collection('data').doc('main')
                                .set({ oneSignalId: subId }, { merge: true });
                        }
                        // 🔔 طلب إذن الإشعارات
                        const _permE = OneSignal.Notifications?.permission;
                        if (!_permE) {
                            setTimeout(async () => {
                                try { await OneSignal.Notifications.requestPermission(); }
                                catch(_e) { console.warn('[OneSignal] موظف perm:', _e.message); }
                            }, 4000);
                        }
                    } catch(e) {
                        console.warn('[OneSignal] موظف:', e.message);
                    }
                });
                }
                return;
            }

            // التأكد من وجود trialStartDate
            if (!currentUser.trialStartDate) {
                await db.collection('users').doc(user.uid).update({
                    trialStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                    subscriptionStatus: 'trial'
                });
                currentUser.trialStartDate = new Date();
            }

            let trialStart = currentUser.trialStartDate.toDate ? currentUser.trialStartDate.toDate() : new Date(currentUser.trialStartDate.seconds * 1000 || Date.now());
            const trialEnd = trialStart.getTime() + 7 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            const _st = currentUser.subscriptionStatus || 'trial';
            let _valid = false;
            if (_st === 'active') {
                const _e = currentUser.subscriptionEndDate;
                const _em = _e ? (_e.toDate ? _e.toDate().getTime() : (_e.seconds ? _e.seconds * 1000 : new Date(_e).getTime())) : 0;
                _valid = _em > now;
            } else if (_st === 'trial') {
                _valid = now < trialEnd;
            } else if (_st === 'lifetime') {
                _valid = true;
            }
            if (_valid) {
                await loadAllDataFromFirestore();
                listenToUserData();
    checkPinOnLoad();
    checkAdminAccess();
    if (typeof showExpiryReminder === 'function') setTimeout(showExpiryReminder, 1500);
    // ربط المستخدم بـ OneSignal
    if (window.OneSignalDeferred) {
        OneSignalDeferred.push(async function(OneSignal) {
            try {
                await OneSignal.login(auth.currentUser.uid);
                console.log('🔔 [OneSignal] تم الربط:', auth.currentUser.uid);
                const subId = OneSignal.User?.PushSubscription?.id;
                if (subId) {
                    await db.collection('users').doc(auth.currentUser.uid)
                        .collection('data').doc('main')
                        .set({ oneSignalId: subId }, { merge: true });
                    console.log('🔔 [OneSignal] ID محفوظ:', subId);
                }
                // 🔔 طلب إذن الإشعارات إذا لم يكن ممنوحاً
                const _perm = OneSignal.Notifications?.permission;
                console.log('🔔 [OneSignal] الإذن الحالي:', _perm);
                if (!_perm) {
                    setTimeout(async () => {
                        try {
                            await OneSignal.Notifications.requestPermission();
                        } catch(_e) {
                            console.warn('[OneSignal] requestPermission:', _e.message);
                        }
                    }, 4000);
                }
            } catch(e) {
                console.warn('[OneSignal] فشل:', e.message);
            }
        });
        // 🔔 تشغيل التنبيهات الذكية
        if (typeof aiScheduleAlertsCheck === 'function') {
            setTimeout(() => {
                try { aiScheduleAlertsCheck(); }
                catch(_e) { console.warn('[ai-alerts] schedule:', _e.message); }
            }, 3000);
        }
    }
            } else {
                showSubscriptionScreen();
            }
        } else {
            // إنشاء بيانات مستخدم جديدة تلقائيًا
            await db.collection('users').doc(user.uid).set({
                trialStartDate: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionStatus: 'trial',
                displayCurrency: 'SYP',
                businessName: '',
                ownerSignature: ''
            });
            // 🛡️ حفظ trialStart في 3 أماكن
            const _nowMs = Date.now();
            localStorage.setItem('trialStart_' + user.uid, _nowMs.toString());
            if (typeof subMetaSet === 'function') subMetaSet(user.uid, 'trialStart', _nowMs);
            try {
                await db.collection('users').doc(user.uid).update({
                    trialStartDate: firebase.firestore.Timestamp.fromDate(new Date(_nowMs)),
                    firstSeenAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch(e) { console.warn('[auth] trialStart fs update:', e.message); }
            currentUser = await _buildCurrentUserSafe(user);
            _applyUserMode();
            await loadAllDataFromFirestore();
            checkPinOnLoad();
        }
    } catch (error) {
        console.error('Error in checkSubscriptionAndShowApp:', error);

        // 🛡️ حماية: trialStart مفقود + offline = محاولة غش
        if (error && error.message === 'SECURITY_MISSING_TRIAL_START') {
            alert('⚠️ يلزم الاتصال بالإنترنت مرة واحدة\n\nلم نتمكن من التحقق من اشتراكك.\nيرجى فتح الإنترنت والمحاولة مجدداً.');
            try { await auth.signOut(); } catch(e) {}
            location.reload();
            return;
        }

        // fallback عام — عرض التطبيق
        try { currentUser = await _buildCurrentUserSafe(user); } catch(e) {}
        if (!currentUser) {
            currentUser = { uid: user.uid, subscriptionStatus: 'trial', trialStartDate: new Date() };
        }
        try { await loadAllDataFromFirestore(); } catch(e) {}
        checkPinOnLoad();
    }
}

// ==================== فحص رمز PIN عند الدخول ====================
// ============================================================
//  🛡️ بناء currentUser آمن (Firestore-first)
// ============================================================
async function _buildCurrentUserSafe(user, isNewUser) {
    const uid = user.uid;

    // 1) Firestore أولاً
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.trialStartDate) {
                const t = data.trialStartDate.toDate ? data.trialStartDate.toDate()
                                                    : new Date(data.trialStartDate);
                console.log('🛡️ [auth] trialStart من Firestore');
                const ms = t.getTime();
                localStorage.setItem('trialStart_' + uid, ms.toString());
                if (typeof subMetaSet === 'function') subMetaSet(uid, 'trialStart', ms);
                return {
                    uid: uid,
                    subscriptionStatus: data.subscriptionStatus || 'trial',
                    subscriptionEndDate: data.subscriptionEndDate || null,
                    trialStartDate: t,
                    ...data
                };
            }
        }
    } catch(e) { console.warn('[auth] firestore read fail:', e.message); }

    // 2) localStorage
    const _tc = localStorage.getItem('trialStart_' + uid);
    if (_tc) {
        console.log('🛡️ [auth] trialStart من localStorage');
        return { uid: uid, subscriptionStatus: 'trial', trialStartDate: new Date(parseInt(_tc)) };
    }

    // 3) IndexedDB
    if (typeof subMetaGet === 'function') {
        const _idb = await subMetaGet(uid, 'trialStart');
        if (_idb) {
            console.log('🛡️ [auth] trialStart من IndexedDB');
            localStorage.setItem('trialStart_' + uid, _idb.toString());
            return { uid: uid, subscriptionStatus: 'trial', trialStartDate: new Date(_idb) };
        }
    }

    // 4) غش محتمل
    if (!isNewUser && !navigator.onLine) {
        console.error('🛡️ [auth] SECURITY: trialStart مفقود + offline');
        throw new Error('SECURITY_MISSING_TRIAL_START');
    }

    // 5) مستخدم جديد
    console.log('🛡️ [auth] trialStart جديد');
    const nowMs = Date.now();
    localStorage.setItem('trialStart_' + uid, nowMs.toString());
    if (typeof subMetaSet === 'function') subMetaSet(uid, 'trialStart', nowMs);
    return { uid: uid, subscriptionStatus: 'trial', trialStartDate: new Date(nowMs) };
}

function _applyUserMode() {
    try {
        const isEmp = currentUser &&
            (currentUser.businessType === 'موظفين' || currentUser.isEmployee === true);
        if (isEmp) document.body.classList.add('employee-mode');
        else document.body.classList.remove('employee-mode');

        // إظهار زر "متجري الإلكتروني" (للمدير فقط)
        const storeBtn = document.getElementById('myStoreBtn');
        if (storeBtn) {
            storeBtn.style.display = isEmp ? 'none' : '';
        }
    } catch(e) { console.warn('[mode]', e); }
}

function _openDefaultPage() {
    if (currentUser && currentUser.businessType === 'موظفين'
        && typeof window.openEmployeesHub === 'function') {
        window.openEmployeesHub();
    } else {
        openPage('analytics');
    }
}

function checkPinOnLoad() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('subscriptionSection').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';

    if (settings.pin) {
        document.body.classList.add('pin-locked');
        showModal('أدخل رمز PIN للدخول', function(input) {
            if (input === settings.pin) {
                document.body.classList.remove('pin-locked');
                hideModal();
                _openDefaultPage();
                updateAllTables();
            } else {
                alert('رمز PIN غير صحيح');
                checkPinOnLoad();
            }
        }, true);
        // إخفاء الصفحات حتى إدخال الرمز الصحيح
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    } else {
        document.body.classList.remove('pin-locked');
        _openDefaultPage();
        updateAllTables();
    }
}

// استعادة كلمة المرور
async function resetPassword() {
    const email = document.getElementById('authEmail').value.trim();
    if (!email) {
        alert('يرجى إدخال بريدك الإلكتروني أولاً');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        alert('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
    } catch (error) {
        alert(getArabicError(error));
    }
}


// فحص المدير وإظهار أزرار الإدارة
function checkAdminAccess() {
    const user = auth.currentUser;
    if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const adminNavBtn = document.getElementById('adminNavBtn');
        const adminDropBtn = document.getElementById('adminDropBtn');
        const adminNotifBtn = document.getElementById('adminNotifBtn');
        if (adminNavBtn) adminNavBtn.style.display = 'block';
        if (adminDropBtn) adminDropBtn.style.display = 'block';
        if (adminNotifBtn) adminNotifBtn.style.display = 'block';
        console.log('تم تفعيل وضع المدير');
    } else {
        console.log('المستخدم ليس مديراً:', user ? user.email : 'لا يوجد');
    }
}


// فحص الجلسة تلقائياً عند فتح التطبيق
// ===== ALMUDIR: Auth Restoration v4 (Fast) =====
(async () => {
    const t0 = performance.now();
    console.log('🔐 [Auth] بدء استعادة الجلسة');

    // اضبط Persistence
    try {
        if (auth && auth.setPersistence && firebase.auth.Auth.Persistence) {
            await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        }
    } catch (e) { console.warn('setPersistence:', e); }

    let resolved = false;
    let debounceTimer = null;

    const commitAuth = async () => {
        if (resolved) return;
        resolved = true;
        const elapsed = Math.round(performance.now() - t0);
        console.log('⏱️ [Auth] حُسم بعد', elapsed, 'ms');

        const currentUser = auth.currentUser;
        if (!currentUser) {
            // 🛒 فحص إذا كان المستخدم قادماً من customer.html
            if (typeof _handleCustomerAuthParams === 'function' && _handleCustomerAuthParams()) {
                hideLoading();
                return;
            }
            showLogin();
            hideLoading();
            return;
        }

        console.log('✅ [Auth] مستخدم:', currentUser.email);

        // ⚡ اعرض التطبيق فوراً — لا تنتظر Firestore
        const mainApp = document.getElementById('mainApp');
        const loginScreen = document.getElementById('loginScreen');
        const authSection = document.getElementById('authSection');
        if (mainApp) mainApp.style.display = 'block';
        if (loginScreen) loginScreen.style.display = 'none';
        if (authSection) authSection.style.display = 'none';
        hideLoading();

        // ثم افحص الاشتراك في الخلفية (بدون حجب الواجهة)
        try {
            await checkSubscriptionAndShowApp();
            console.log('✅ [Auth] الاشتراك سليم بعد',
                Math.round(performance.now() - t0), 'ms');
        } catch (error) {
            console.warn('⚠️ [Auth] خطأ الاشتراك:', error);
            // لا نُخرج المستخدم — هو مسجّل دخول بالفعل
        }
        // ✨ إزالة حالة التحميل بعد الجاهزية
        document.body.classList.remove('loading');

    };

    // 🚀 إذا كان currentUser متاحاً فوراً → لا تنتظر
    if (auth.currentUser) {
        console.log('⚡ [Auth] currentUser فوري');
        commitAuth();
        return;
    }

    // وإلا — debounce قصير جداً
    auth.onAuthStateChanged((user) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(commitAuth, 350);
    });

    // شبكة الأمان: بعد 2.5 ثانية، اعرض على أي حال
    setTimeout(() => {
        if (!resolved) {
            console.warn('⏰ [Auth] Timeout — عرض احتياطي');
            commitAuth();
        }
    }, 2500);
})();
// ===== END =====



function hideLoading() {
    const loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'none';
}
function showLoading() {
    const loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'flex';
}


// ============================================================
//  ✨ ALMUDIR — Sidebar Header Loader
// ============================================================
function updateSidebarHeader() {
    document.body.classList.remove('loading');
    const user = auth.currentUser;
    if (!user) return;

    // 1) البريد
    const emailEl = document.getElementById('sidebarEmail');
    if (emailEl) emailEl.textContent = user.email || '—';

    // 2) الاسم + البريد من Firestore
    const nameEl    = document.getElementById('sidebarName');
    const busEl     = document.getElementById('sidebarBusiness');
    const avatarEl  = document.getElementById('sidebarAvatar');
    const statusEl  = document.getElementById('sidebarStatus');
    const dotEl     = document.getElementById('sidebarStatusDot');
    const textEl    = document.getElementById('sidebarStatusText');

    // اسم المحل من الإعدادات
    const bizName = (typeof settings !== 'undefined' && settings.businessName)
        ? settings.businessName : 'نشاطي التجاري';

    if (busEl) busEl.textContent = bizName;

    // أول حرف من اسم المحل كصورة رمزية
    if (avatarEl) {
        const firstChar = (bizName || 'م').trim().charAt(0);
        avatarEl.textContent = firstChar;
    }

    // من Firestore — إذا currentUser يحمل البيانات
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.fullName) {
        if (nameEl) nameEl.textContent = currentUser.fullName;
        if (avatarEl) avatarEl.textContent = currentUser.fullName.trim().charAt(0);
    } else {
        if (nameEl) nameEl.textContent = '—';
    }

    // ✨ الموقع من Firestore
    try {
        const locEl = document.getElementById('sidebarLocation');
        const locTxtEl = document.getElementById('sidebarLocationText');
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.location) {
            const loc = currentUser.location;
            const parts = [loc.governorate, loc.town].filter(Boolean);
            if (parts.length > 0 && locTxtEl && locEl) {
                locTxtEl.textContent = parts.join(' - ');
                locEl.style.display = 'flex';
            }
        }
    } catch (e) { console.warn('[sidebar] location:', e); }

    // 3) حالة الاشتراك
    try {
        const now = new Date();
        let status = 'unknown';
        let label = '—';

        const subStatus = currentUser ? currentUser.subscriptionStatus : null;
        const trialStart = currentUser && currentUser.trialStartDate
            ? (currentUser.trialStartDate.toDate ? currentUser.trialStartDate.toDate() : new Date(currentUser.trialStartDate))
            : null;

        if (subStatus === 'active') {
            status = 'green';
            const end = currentUser.subscriptionEndDate
                ? (currentUser.subscriptionEndDate.toDate ? currentUser.subscriptionEndDate.toDate() : new Date(currentUser.subscriptionEndDate))
                : null;
            label = end ? 'اشتراك نشط حتى ' + (typeof formatDate === 'function' ? formatDate(end) : end.toLocaleDateString('ar-EG')) : 'اشتراك نشط';
        } else if (subStatus === 'trial' && trialStart) {
            const diffDays = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
            const remain = 7 - diffDays;
            if (remain > 0) {
                status = 'yellow';
                label = 'تجريبي — ' + remain + ' يوم متبقٍ';
            } else {
                status = 'red';
                label = 'انتهت الفترة التجريبية';
            }
        } else {
            status = 'yellow';
            label = 'غير محدد';
        }

        if (dotEl) { dotEl.className = 'status-dot ' + status; }
        if (textEl) { textEl.textContent = label; }
    } catch (e) {
        console.warn('[updateSidebarHeader] status:', e);
    }
}
// END Sidebar Header Loader

/* ============================================================
   ✨ ALMUDIR: Unified Floating Buttons Controller
   يتحكم في زر القائمة + زر AI
   يحترم: loading + qr-open
   ============================================================ */
(function() {
    function updateButtons() {
        var body = document.body;
        var user = (typeof currentUser !== 'undefined' && currentUser) || (typeof auth !== 'undefined' && auth.currentUser);

        // 🚫 حالة الإخفاء — تحميل أو قارئ باركود
        // ✅ فحص الواجهة الفعلية
        var mc = document.getElementById('mainContainer');
        var mainVisible = mc && getComputedStyle(mc).display !== 'none';

        // ✅ إزالة login-screen العالق إذا الواجهة ظاهرة
        if (mainVisible && body.classList.contains('login-screen')) {
            body.classList.remove('login-screen');
            console.log('🔓 [UI] login-screen أُزيل (الواجهة ظاهرة)');
        }

        var shouldHide = body.classList.contains('loading')
                      || (body.classList.contains('login-screen') && !mainVisible)
                      || body.classList.contains('qr-open');

        var menu = document.getElementById('mainMenuBtn');
        var ai = document.getElementById('aiChatBtn');

        // 🔗 وضع الموظف — لا شيء
        if (body.classList.contains('staff-mode')) {
            if (menu) menu.style.display = 'none';
            if (ai) ai.style.display = 'none';
            return;
        }

        if (shouldHide || (!user && !mainVisible)) {
            // أخفِ الزرين
            if (menu) menu.style.display = 'none';
            if (ai) ai.style.display = 'none';
        } else {
            // أظهر الزرين
            if (menu) menu.style.display = 'block';
            if (ai) ai.style.display = 'flex';
        }
    }

    // تشغيل فوري
    updateButtons();

    // كل 800ms — توازن بين الاستجابة والسرعة
    setInterval(updateButtons, 800);

    // عند أي تغيير في الـ class
    var observer = new MutationObserver(updateButtons);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
/* END Unified Controller */

// ============================================================
//  ✨ Auto Wizard — عرض قالب النشاط بعد الدخول
// ============================================================
(function() {
    if (typeof auth === 'undefined' || !auth) {
        console.warn('[autoWizard] auth غير معرّف');
        return;
    }

    let _wizardShown = false;

    auth.onAuthStateChanged(function(user) {
        if (!user || _wizardShown) return;

        // انتظر تحميل البيانات
        setTimeout(function() {
            // التأكد من الجاهزية
            if (typeof currentUser === 'undefined' || !currentUser) {
                console.log('[autoWizard] currentUser غير جاهز');
                return;
            }
            if (typeof showActivityWelcome !== 'function') {
                console.log('[autoWizard] showActivityWelcome غير معرّفة');
                return;
            }

            // تحقق من عدم الإنجاز
            if (currentUser.wizardCompleted) {
                console.log('[autoWizard] مُنجز مسبقاً (Firestore)');
                return;
            }
            if (localStorage.getItem('wizard_' + user.uid)) {
                console.log('[autoWizard] مُنجز مسبقاً (localStorage)');
                return;
            }

            console.log('[autoWizard] 🎯 محاولة عرض القالب...');

            _wizardShown = true;

            Promise.resolve(showActivityWelcome())
                .catch(function(e) {
                    console.warn('[autoWizard] فشل:', e);
                });
        }, 4000); // انتظر 4 ثواني (بيانات + قوالب)
    });

    console.log('🎯 [autoWizard] جاهز');
})();


// ============================================================
//  ✨ استخراج كود الدولة من النموذج
// ============================================================
function getSelectedCountryPhonePrefix() {
    const sel = document.getElementById('regCountry');
    return sel ? sel.value : '+963';
}

function getSelectedCountryCode() {
    const prefix = getSelectedCountryPhonePrefix();
    if (typeof COUNTRIES !== 'undefined' && COUNTRIES[prefix]) {
        return COUNTRIES[prefix].code;
    }
    return 'SY';
}


// ============================================================
//  ✨ AUTO-LOGIN HANDLER — إصلاح استعادة الجلسة
// ============================================================
(function() {
    if (typeof auth === 'undefined' || !auth) return;
    
    let _handled = false;
    
    auth.onAuthStateChanged(async function(user) {
        if (!user) {
            if (!document.body.classList.contains('app-ready')) {
                console.log('🔒 [auth-state] لا مستخدم');
            }
            return;
        }
        
        console.log('🔐 [auth-state] user:', user.email);
        
        if (_handled) return;
        
        if (document.body.classList.contains('app-ready')) {
            console.log('✅ [auth-state] التطبيق جاهز مسبقاً');
            _handled = true;
            return;
        }
        
        _handled = true;
        setTimeout(async function() {
            try {
                console.log('🔄 [auth-state] استعادة الجلسة...');
                await checkSubscriptionAndShowApp();
            } catch(e) {
                console.warn('[auth-state] فشل:', e.message);
            }
        }, 300);
    });
    
    console.log('🔐 [auth-state] جاهز');
})();


// ═══════════════════════════════════════════════════════════
//  🛡️ Failsafe — ضمان ظهور الواجهة خلال 8 ثواني
//  يعمل حتى لو فشل Firestore (شبكة/DNS)
// ═══════════════════════════════════════════════════════════
setTimeout(function() {
    try {
        var _u = (typeof firebase !== 'undefined' && firebase.auth) 
            ? firebase.auth().currentUser : null;
        var _auth = document.getElementById('authSection');
        var _main = document.getElementById('mainContainer');
        
        var _authVis = _auth && _auth.style.display === 'block';
        var _mainVis = _main && _main.style.display !== 'none' && _main.style.display !== '';
        
        if (_authVis || _mainVis) return;
        
        console.log('🛡️ [Failsafe] UI لم يظهر — إنقاذ');
        
        if (_u) {
            // مسجّل دخول → اعرض الواجهة
            if (_auth) _auth.style.display = 'none';
            if (_main) _main.style.display = 'block';
            document.body.classList.remove('login-screen');
            document.body.classList.remove('loading');
            document.body.classList.remove('pin-locked');
            if (typeof openPage === 'function') {
                try { openPage('analytics'); } catch(e) {}
            }
        } else {
            // غير مسجّل → شاشة الدخول
            if (_auth) _auth.style.display = 'block';
            if (_main) _main.style.display = 'none';
            document.body.classList.add('login-screen');
        }
    } catch(e) {
        console.warn('[Failsafe]', e);
    }
}, 8000);

// 🎯 تصدير
// window.selectWho — محذوف (النظام الجديد لا يحتاجه)
