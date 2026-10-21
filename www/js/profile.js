// ============================================================
//  ALMUDIR — الملف الشخصي للمستخدم
// ============================================================

// ---------- تهيئة الصفحة ----------
function profileInit() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        alert('يجب تسجيل الدخول');
        return;
    }

    // 0) 🌍 عرض اسم الدولة (مقفلة)
    const countryNameField = document.getElementById('profileCountryName');
    if (countryNameField && typeof getCurrentCountry === 'function') {
        const country = getCurrentCountry();
        countryNameField.value = country.flag + ' ' + country.name;
        console.log('🌍 [profile] الدولة:', country.name);
    }

    // 1) الاسم + البريد
    const nameField = document.getElementById('profileFullName');
    const emailField = document.getElementById('profileEmail');
    const avatar = document.getElementById('profileAvatar');
    const subStatus = document.getElementById('profileSubStatus');

    if (nameField) {
        // إذا fullName = 'المدير' أو فارغ — استخدم بيانات أخرى
        nameField.value = currentUser.fullName || '';
    }
    if (emailField) emailField.value = (auth.currentUser && auth.currentUser.email) || '';

    if (avatar) {
        // استخدم businessName أولاً، ثم fullName
        let letter = 'م';
        if (typeof settings !== 'undefined' && settings.businessName) {
            letter = settings.businessName.trim().charAt(0);
        } else if (currentUser.fullName) {
            letter = currentUser.fullName.trim().charAt(0);
        } else if (currentUser.businessType) {
            letter = currentUser.businessType.trim().charAt(0);
        }
        avatar.textContent = letter;
    }

    // 2) حالة الاشتراك
    if (subStatus) {
        // 👤 الموظفون لا يخضعون لنظام الاشتراك
        const _isEmp = currentUser.isEmployee === true || currentUser.businessType === 'موظفين';
        if (_isEmp) {
            subStatus.innerHTML = '👤 <strong>حساب موظف</strong>';
            subStatus.style.color = '#3498db';
        } else {
        const s = currentUser.subscriptionStatus || 'trial';
        if (s === 'active') {
            const end = currentUser.subscriptionEndDate
                ? (currentUser.subscriptionEndDate.toDate ? currentUser.subscriptionEndDate.toDate() : new Date(currentUser.subscriptionEndDate))
                : null;
            subStatus.innerHTML = '🟢 <strong>اشتراك نشط</strong>' + (end ? ' — حتى ' + (typeof formatDate === 'function' ? formatDate(end) : end.toLocaleDateString('ar-SY')) : '');
            subStatus.style.color = '#27ae60';
        } else if (s === 'trial') {
            const start = currentUser.trialStartDate
                ? (currentUser.trialStartDate.toDate ? currentUser.trialStartDate.toDate() : new Date(currentUser.trialStartDate))
                : null;
            if (start) {
                const days = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
                const remain = Math.max(0, 7 - days);
                subStatus.innerHTML = '🟡 <strong>تجريبي</strong> — ' + remain + ' يوم متبقٍ';
                subStatus.style.color = '#f39c12';
            }
        } else {
            subStatus.innerHTML = '🔴 <strong>الاشتراك منتهي</strong>';
            subStatus.style.color = '#e74c3c';
        }
        }  // نهاية else الموظفين
    }

    // 3) الهاتف — دمج/فصل الرمز
    const phone = currentUser.phone || '';
    const phonePrefix = document.getElementById('profilePhonePrefix');
    const phoneNumber = document.getElementById('profilePhoneNumber');

    // 🚫 قفل الدولة — لا يمكن التغيير
    if (phonePrefix) {
        phonePrefix.disabled = true;
        phonePrefix.style.background = '#f5f5f5';
        phonePrefix.style.cursor = 'not-allowed';
        phonePrefix.title = 'لا يمكن تغيير الدولة بعد التسجيل';
    }

    if (phonePrefix && phoneNumber) {
        // الافتراضي: سوريا
        // قائمة الرموز المعروفة (الأطول أولاً)
        const KNOWN_PREFIXES = ['+966', '+971', '+963', '+961', '+962', '+964', '+90', '+20'];
        
        let detectedPrefix = '+963';
        let restNumber = phone;

        if (phone && phone.charAt(0) === '+') {
            // ابحث عن أول رمز مطابق
            for (let i = 0; i < KNOWN_PREFIXES.length; i++) {
                const p = KNOWN_PREFIXES[i];
                if (phone.indexOf(p) === 0) {
                    detectedPrefix = p;
                    restNumber = phone.substring(p.length);
                    break;
                }
            }
        }

        // تأكد أن الرمز موجود في القائمة
        let prefixExists = false;
        for (let i = 0; i < phonePrefix.options.length; i++) {
            if (phonePrefix.options[i].value === detectedPrefix) {
                prefixExists = true;
                break;
            }
        }
        if (!prefixExists) {
            const opt = document.createElement('option');
            opt.value = detectedPrefix;
            opt.textContent = detectedPrefix;
            phonePrefix.appendChild(opt);
        }

        phonePrefix.value = detectedPrefix;
        phoneNumber.value = restNumber;
        
        console.log('[Profile] Phone parsed:', detectedPrefix, '|', restNumber);
    }

    // 4) بيانات النشاط (من settings)
    const bizName = document.getElementById('profileBusinessName');
    const bizType = document.getElementById('profileBusinessType');
    const bizDesc = document.getElementById('profileBusinessDescription');
    const bizSignature = document.getElementById('profileOwnerSignature');

    // ✨ قراءة من currentUser أولاً ثم settings
    if (bizName) bizName.value = currentUser.businessName || (typeof settings !== 'undefined' ? settings.businessName : '') || '';
    if (bizType) bizType.value = currentUser.businessType || (typeof settings !== 'undefined' ? settings.businessType : '') || '';
    if (bizDesc) bizDesc.value = currentUser.businessDescription || (typeof settings !== 'undefined' ? settings.businessDescription : '') || '';
    if (bizSignature) bizSignature.value = currentUser.ownerSignature || (typeof settings !== 'undefined' ? settings.ownerSignature : '') || '';

    // 5) تهيئة المحافظات أولاً
    if (typeof updateProfileGovernorates === 'function') {
        updateProfileGovernorates();
    }

    // 6) تحميل الموقع (بعد تهيئة القائمة)
    setTimeout(() => {
        const gov = document.getElementById('profileGovernorate');
        const town = document.getElementById('profileTown');
        const district = document.getElementById('profileDistrict');

        if (currentUser.location) {
            if (gov && currentUser.location.governorate) gov.value = currentUser.location.governorate;
            if (town) town.value = currentUser.location.town || '';
            if (district) district.value = currentUser.location.district || '';
        }
    }, 150);
}

// ---------- تحديث المحافظات حسب الدولة ----------
function updateProfileGovernorates() {
    const prefixSel = document.getElementById('profilePhonePrefix');
    const govSel = document.getElementById('profileGovernorate');
    if (!prefixSel || !govSel) return;

    const code = prefixSel.value;
    if (typeof LOCATIONS === 'undefined' || !LOCATIONS[code]) return;

    const data = LOCATIONS[code];
    const currentVal = govSel.value;

    govSel.innerHTML = '<option value="">— اختر المحافظة —</option>' +
        data.governorates.map(g => '<option value="' + g + '">' + g + '</option>').join('');

    if (data.governorates.indexOf(currentVal) !== -1) {
        govSel.value = currentVal;
    }
}

// ---------- حفظ التغييرات ----------
async function profileSave() {
    const btn = event && event.target ? event.target : null;
    if (btn) { btn.disabled = true; btn.textContent = 'جاري الحفظ...'; }

    try {
        const uid = auth.currentUser.uid;

        // 1) جمع البيانات
        const fullName = (document.getElementById('profileFullName').value || '').trim();
        const phonePrefix = (document.getElementById('profilePhonePrefix').value || '').trim();
        const phoneNumber = (document.getElementById('profilePhoneNumber').value || '').trim();
        const businessName = (document.getElementById('profileBusinessName').value || '').trim();
        const businessType = (document.getElementById('profileBusinessType').value || '').trim();
        const businessDescription = (document.getElementById('profileBusinessDescription').value || '').trim();
        const ownerSignature = (document.getElementById('profileOwnerSignature').value || '').trim();
        const governorate = (document.getElementById('profileGovernorate').value || '').trim();
        const town = (document.getElementById('profileTown').value || '').trim();
        const district = (document.getElementById('profileDistrict').value || '').trim();

        // 2) تحقق
        if (!fullName || fullName.length < 3) {
            alert('⚠️ الاسم يجب أن يكون 3 أحرف على الأقل');
            return;
        }
        if (!phoneNumber) {
            alert('⚠️ أدخل رقم الهاتف');
            return;
        }

        const fullPhone = phonePrefix + phoneNumber.replace(/\D/g, '');

        // 🛡️ حماية: موظف لا يعدل بيانات النشاط التجاري
        const _isEmp = currentUser && (currentUser.businessType === 'موظفين' || currentUser.isEmployee === true);

        // 3) حفظ في Firestore
        const _payload = {
            fullName: fullName,
            phone: fullPhone,
            location: {
                governorate: governorate,
                town: town,
                district: district
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!_isEmp) {
            _payload.businessName = businessName;
            _payload.businessDescription = businessDescription;
            _payload.ownerSignature = ownerSignature;
            _payload.businessType = businessType;
        }
        await db.collection('users').doc(uid).update(_payload);

        // 4) تحديث settings (المحلية)
        if (typeof settings !== 'undefined') {
            settings.businessName = businessName;
            settings.businessDescription = businessDescription;
            settings.ownerSignature = ownerSignature;
            if (typeof saveAllData === 'function') await saveAllData();
        }

        // 5) تحديث currentUser محلياً
        currentUser.fullName = fullName;
        currentUser.phone = fullPhone;
        if (!_isEmp) {
            currentUser.businessName = businessName;
            currentUser.businessDescription = businessDescription;
            currentUser.ownerSignature = ownerSignature;
            currentUser.businessType = businessType;
        }
        currentUser.location = {
            governorate: governorate,
            town: town,
            district: district
        };

        // 6) تحديث رأس القائمة
        if (typeof updateSidebarHeader === 'function') {
            updateSidebarHeader();
        }

        // 7) تحديث الصورة الرمزية
        const avatar = document.getElementById('profileAvatar');
        if (avatar) avatar.textContent = fullName.charAt(0);

        // 8) رسالة نجاح
        if (typeof showToast === 'function') {
            showToast('✅ تم حفظ التغييرات بنجاح', 'success');
        } else {
            alert('✅ تم حفظ التغييرات بنجاح');
        }

    } catch (e) {
        console.error('[Profile] save failed:', e);
        alert('❌ خطأ في الحفظ: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💾 حفظ التغييرات'; }
    }
}

console.log('👤 [profile] جاهز');
