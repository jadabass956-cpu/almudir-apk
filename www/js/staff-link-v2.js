console.log("═══════ ✅ STAFF-LINK-V2 LOADED ═══════");
// ============================================================
//  🔗 STAFF LINK v2.0.0 — كود الارتباط
//  وفق تصميم المدير: قاعدة عامة + ربط بحساب المدير
// ============================================================

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════
    //  1. VIEWS — الواجهات المتاحة
    // ═══════════════════════════════════════════════════════
    window.STAFF_LINK_VIEWS = {
        waiter: {
            icon: '🪑',
            label: 'إدارة الطاولات',
            description: 'للنادل والمشرف',
            target: 'activity-restaurant-tables',
            color: '#3498db',
            codePrefix: 'WTR'
        },
        kitchen: {
            icon: '🍳',
            label: 'شاشة المطبخ',
            description: 'للشيف',
            target: 'activity-restaurant-kitchen',
            color: '#e67e22',
            codePrefix: 'KIT'
        },
        driver: {
            icon: '🛵',
            label: 'طلبات التوصيل',
            description: 'للسائق',
            target: 'activity-restaurant-delivery',
            color: '#27ae60',
            codePrefix: 'DRV'
        }
    };

    // ═══════════════════════════════════════════════════════
    //  2. STATE
    // ═══════════════════════════════════════════════════════
    let _staffCode = null;
    let _staffOwnerUid = null;
    let _staffView = null;
    let _appMode = null;

    // ═══════════════════════════════════════════════════════
    //  3. STORAGE
    // ═══════════════════════════════════════════════════════
    function _currentUid() {
        return (typeof auth !== 'undefined' && auth?.currentUser) ? auth.currentUser.uid : null;
    }

    function saveSession(code, ownerUid, view) {
        const uid = _currentUid();
        if (!uid) return;
        try {
            localStorage.setItem('app_mode_' + uid, 'staff');
            localStorage.setItem('staff_code_' + uid, code || '');
            localStorage.setItem('staff_owner_uid_' + uid, ownerUid || '');
            localStorage.setItem('staff_view_' + uid, view || '');
        } catch(e) {}
        _staffCode = code;
        _staffOwnerUid = ownerUid;
        _staffView = view;
        _appMode = 'staff';
    }

    function saveAdminMode() {
        const uid = _currentUid();
        if (!uid) return;
        try { localStorage.setItem('app_mode_' + uid, 'admin'); } catch(e) {}
        _appMode = 'admin';
    }

    function loadSession() {
        const uid = _currentUid();
        if (!uid) {
            _staffCode = _staffOwnerUid = _staffView = _appMode = null;
            return;
        }
        try {
            _appMode = localStorage.getItem('app_mode_' + uid);
            _staffCode = localStorage.getItem('staff_code_' + uid);
            _staffOwnerUid = localStorage.getItem('staff_owner_uid_' + uid);
            _staffView = localStorage.getItem('staff_view_' + uid);
        } catch(e) {}
    }

    function clearSession() {
        const uid = _currentUid();
        if (uid) {
            try {
                ['app_mode_', 'staff_code_', 'staff_owner_uid_', 'staff_view_'].forEach(k => {
                    localStorage.removeItem(k + uid);
                });
            } catch(e) {}
        }
        _staffCode = _staffOwnerUid = _staffView = _appMode = null;
    }

    // ═══════════════════════════════════════════════════════
    //  4. CODE GENERATION — مع بادئة الدور
    // ═══════════════════════════════════════════════════════
    function generateCode(role) {
        const view = window.STAFF_LINK_VIEWS[role];
        const prefix = (view && view.codePrefix) || 'GEN';
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const g = () => {
            let s = '';
            for (let i = 0; i < 3; i++) s += chars[Math.floor(Math.random() * chars.length)];
            return s;
        };
        return prefix + '-' + g() + '-' + g();
    }

    // ═══════════════════════════════════════════════════════
    //  5. VERIFY CODE — يقرأ من public_link_codes
    // ═══════════════════════════════════════════════════════
    async function verifyCode(code) {
        code = String(code).trim().toUpperCase();
        if (!code || !db) return null;

        try {
            const doc = await db.collection('public_link_codes').doc(code).get();
            if (!doc.exists) {
                console.log('❌ [staff-link] كود غير موجود:', code);
                return null;
            }

            const data = doc.data();

            // فحص الحالة (available فقط)
            if (data.status && data.status !== 'available') {
                console.log('⚠️ [staff-link] الكود غير متاح:', data.status);
                return null;
            }

            // فحص قديم (backward compat)
            if (data.active === false && !data.status) {
                return null;
            }

            return {
                code: code,
                ownerUid: data.ownerUid,
                ownerName: data.ownerName || 'المطعم',
                ownerEmail: data.ownerEmail,
                role: data.role,                  // نظام قديم
                roleId: data.roleId,              // 🆕 نظام جديد
                roleName: data.roleName,          // 🆕
                rolePages: data.rolePages || [],  // 🆕
                label: data.label || '',
                employeeEmail: data.employeeEmail || null
            };
        } catch(e) {
            console.warn('[staff-link] verify error:', e.message);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  6. CREATE CODE — للمدير فقط
    // ═══════════════════════════════════════════════════════
    async function createLinkCode(role, label, employeeEmail) {
        if (!currentUser?.uid || !db) throw new Error('لا يوجد مستخدم');
        if (!employeeEmail || !employeeEmail.includes('@')) {
            throw new Error('البريد الإلكتروني إلزامي');
        }

        const code = generateCode(role);

        await db.collection('public_link_codes').doc(code).set({
            ownerUid: currentUser.uid,
            ownerEmail: currentUser.email || '',
            ownerName: currentUser.businessName || 'المطعم',
            role: role,
            label: label || '',
            employeeEmail: employeeEmail.trim().toLowerCase(),
            status: 'available',
            createdAt: Date.now(),
            usedAt: null,
            usedBy: null,
            approvedAt: null,
            rejectedAt: null
        });

        console.log('✅ [staff-link] كود جديد:', code);
        return code;
    }

    // ═══════════════════════════════════════════════════════
    //  7. LINK EMPLOYEE — ربط الموظف بالمدير
    // ═══════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════
    //  🏢 تحميل بيانات المطعم من حساب المدير
    //  (يُستدعى عند ربط الموظف أو استئناف الجلسة)
    // ═══════════════════════════════════════════════════════
    async function _loadOwnerBusinessInfo(ownerUid) {
        if (!ownerUid || !db) return null;
        try {
            const doc = await db.collection('users').doc(ownerUid).get();
            if (!doc.exists) {
                console.warn('⚠️ [staff-link] المدير غير موجود');
                return null;
            }

            const d = doc.data();

            // ✅ دمج بيانات المطعم في currentUser
            if (typeof currentUser !== 'undefined' && currentUser) {
                currentUser.businessName        = d.businessName || '';
                currentUser.businessDescription = d.businessDescription || '';
                currentUser.phone               = d.phone || '';
                currentUser.location            = d.location || null;
                currentUser.ownerSignature      = d.ownerSignature || '';
                currentUser.displayCurrency     = d.displayCurrency || 'SYP';
                currentUser.countryCode         = d.countryCode || '';
                currentUser.countryPhonePrefix  = d.countryPhonePrefix || '';
                if (!currentUser.businessType) {
                    currentUser.businessType = d.businessType || '';
                }

                console.log('🏢 [staff-link] تم دمج بيانات المطعم:',
                    { name: currentUser.businessName, phone: currentUser.phone });
            }

            // ✅ حفظ نسخة في localStorage (لاستخدامها عند فتح متصفح جديد)
            try {
                localStorage.setItem('owner_biz_info', JSON.stringify({
                    businessName: d.businessName || '',
                    businessDescription: d.businessDescription || '',
                    phone: d.phone || '',
                    location: d.location || null,
                    ownerSignature: d.ownerSignature || '',
                    displayCurrency: d.displayCurrency || 'SYP',
                    countryCode: d.countryCode || '',
                    countryPhonePrefix: d.countryPhonePrefix || '',
                    cachedAt: Date.now()
                }));
            } catch(e) {}

            return d;
        } catch(e) {
            console.warn('[staff-link] load owner info:', e.message);
            return null;
        }
    }

    async function linkEmployee(code) {
        const result = await verifyCode(code);
        if (!result) {
            return { ok: false, error: '❌ الكود غير صحيح أو مستخدم' };
        }

        // 🔒 فحص البريد (اختياري — فقط إذا كان الكود مقيّداً)
        if (result.employeeEmail) {
            if (!currentUser?.email) {
                return { ok: false, error: '⚠️ لا يوجد بريد في حسابك' };
            }
            if (result.employeeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
                return { ok: false, error: '🔒 هذا الكود مخصص لموظف آخر: ' + result.employeeEmail };
            }
        }

        // تحديث حساب الموظف — حالة الانتظار
        try {
            const _updates = {
                ownerUid: result.ownerUid,
                linkStatus: 'pending',
                linkedAt: Date.now(),
                linkCodeUsed: code,
                linkedOwnerName: result.ownerName || ''
            };
            // نظام جديد — roleId + rolePages
            if (result.roleId) {
                _updates.roleId = result.roleId;
                _updates.roleName = result.roleName || '';
                _updates.rolePages = result.rolePages || [];
            }
            // نظام قديم — role (فقط إذا كانت معرّفة)
            if (result.role) {
                _updates.role = result.role;
            }
            await db.collection('users').doc(currentUser.uid).update(_updates);
        } catch(e) {
            console.error('[staff-link] update user:', e);
            return { ok: false, error: '⚠️ فشل تحديث الحساب: ' + e.message };
        }

        // 🏢 تحميل بيانات المطعم من حساب المدير
        await _loadOwnerBusinessInfo(result.ownerUid);

        // تحديث الكود → pending_approval
        try {
            await db.collection('public_link_codes').doc(code).update({
                usedAt: Date.now(),
                usedBy: currentUser.uid,
                status: 'pending_approval'
            });
        } catch(e) {
            console.warn('[staff-link] consume code:', e.message);
        }

        return { ok: true, pending: true, ...result };
    }

    // ═══════════════════════════════════════════════════════
    //  8. ROLE SELECTOR — "من أنت؟"
    // ═══════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════
    //  🚫 شاشة "تم إلغاء الارتباط"
    // ═══════════════════════════════════════════════════════
    function showRevokedScreen() {
        const overlay = document.createElement('div');
        overlay.id = 'revokedOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#f8f9fa,#e9ecef);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML = `
            <div style="max-width:440px;width:100%;background:white;border-radius:20px;padding:30px 24px;box-shadow:0 10px 40px rgba(0,0,0,0.15);text-align:center;">
                <div style="font-size:64px;margin-bottom:10px;">🚫</div>
                <div style="font-size:20px;font-weight:bold;color:#c0392b;margin-bottom:10px;">تم إلغاء ارتباطك</div>
                <div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:20px;">
                    تم إلغاء ارتباطك من المطعم.<br>
                    تواصل مع المدير إذا كان هناك خطأ.
                </div>
                <button onclick="_pendingLogout()" style="width:100%;padding:14px;background:#95a5a6;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
                    🚪 تسجيل الخروج
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window.showRevokedScreen = showRevokedScreen;

    function showRoleSelector() {
        const old = document.getElementById('roleSelectorOverlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'roleSelectorOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#f8f9fa,#e9ecef);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

        overlay.innerHTML = `
            <div style="max-width:440px;width:100%;background:white;border-radius:20px;padding:30px 24px;box-shadow:0 10px 40px rgba(0,0,0,0.15);">
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="font-size:56px;margin-bottom:8px;">🍽️</div>
                    <div style="font-size:20px;font-weight:bold;color:#2c3e50;">${_afEsc(currentUser?.businessName || 'المطعم')}</div>
                    <div style="font-size:14px;color:#666;margin-top:6px;">من أنت؟</div>
                </div>
                <button onclick="_staffChooseAdmin()" style="width:100%;padding:18px;background:linear-gradient(135deg,#2c3e50,#34495e);color:white;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:12px;font-family:inherit;">
                    <span style="font-size:26px;">👑</span><span>المدير</span>
                </button>
                <button onclick="_staffChooseEmployee()" style="width:100%;padding:18px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;font-family:inherit;">
                    <span style="font-size:26px;">👤</span><span>موظف (لدي كود)</span>
                </button>
                <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;line-height:1.6;">
                    💡 يُحفظ اختيارك على هذا الجهاز
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window._staffChooseAdmin = function() {
        const o = document.getElementById('roleSelectorOverlay');
        if (o) o.remove();
        saveAdminMode();
        console.log('👑 [staff-link] وضع المدير');
    };

    window._staffChooseEmployee = function() {
        const o = document.getElementById('roleSelectorOverlay');
        if (o) o.remove();
        showStaffLinkPrompt();
    };

    // ═══════════════════════════════════════════════════════
    //  9. CODE PROMPT — إدخال الكود
    // ═══════════════════════════════════════════════════════
    function showStaffLinkPrompt() {
        const old = document.getElementById('staffLinkPromptOverlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'staffLinkPromptOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#f8f9fa,#e9ecef);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;';

        overlay.innerHTML = `
            <div style="max-width:400px;width:100%;background:white;border-radius:20px;padding:28px 22px;box-shadow:0 10px 40px rgba(0,0,0,0.15);">
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="font-size:44px;margin-bottom:8px;">🔗</div>
                    <div style="font-size:18px;font-weight:bold;color:#2c3e50;">أدخل كود الارتباط</div>
                    <div style="font-size:12px;color:#666;margin-top:6px;">الكود من المدير</div>
                </div>
                <input type="text" id="staffLinkInput" placeholder="XXX-XXX-XXX" maxlength="11" autocapitalize="characters" autocomplete="off" style="width:100%;padding:18px;border:2px solid #3498db;border-radius:12px;font-size:22px;text-align:center;font-family:'Courier New',monospace;letter-spacing:3px;font-weight:bold;text-transform:uppercase;box-sizing:border-box;margin-bottom:12px;">
                <button onclick="_staffLinkSubmit()" id="staffLinkSubmitBtn" style="width:100%;padding:16px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
                    ✅ دخول
                </button>
                <button onclick="_staffLinkCancel()" style="width:100%;padding:12px;background:#95a5a6;color:white;border:none;border-radius:12px;font-size:13px;cursor:pointer;font-family:inherit;">
                    ← رجوع
                </button>
                <div id="staffLinkError" style="color:#e74c3c;text-align:center;font-size:12px;margin-top:10px;min-height:18px;"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            const inp = document.getElementById('staffLinkInput');
            if (inp) {
                inp.focus();
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') window._staffLinkSubmit();
                });
                inp.addEventListener('input', e => {
                    let v = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    let formatted = '';
                    for (let i = 0; i < v.length; i++) {
                        if (i === 3 || i === 6) formatted += '-';
                        formatted += v[i];
                    }
                    e.target.value = formatted;
                });
            }
        }, 100);
    }

    window._staffLinkCancel = function() {
        const o = document.getElementById('staffLinkPromptOverlay');
        if (o) o.remove();
    };

    window._staffLinkSubmit = async function() {
        const inp = document.getElementById('staffLinkInput');
        const err = document.getElementById('staffLinkError');
        const btn = document.getElementById('staffLinkSubmitBtn');
        if (!inp || !err) return;

        const code = inp.value.trim().toUpperCase();
        if (!code || code.length < 11) {
            err.textContent = '⚠️ أدخل كوداً صحيحاً (XXX-XXX-XXX)';
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحقق...'; }
        err.textContent = '';

        const result = await linkEmployee(code);

        if (btn) { btn.disabled = false; btn.textContent = '✅ دخول'; }

        if (!result.ok) {
            err.textContent = result.error;
            return;
        }

        // ✅ حالة الانتظار
        if (result.pending) {
            const overlay = document.getElementById('staffLinkPromptOverlay');
            if (overlay) overlay.remove();
            showPendingApprovalScreen(result);
            return;
        }

        // الوضع القديم (backup)
        saveSession(code, result.ownerUid, result.role);
        const overlay = document.getElementById('staffLinkPromptOverlay');
        if (overlay) {
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
        setTimeout(() => applyStaffView(result.role), 400);
    };

    // ═══════════════════════════════════════════════════════
    //  🟡 شاشة الانتظار
    // ═══════════════════════════════════════════════════════
    function showPendingApprovalScreen(result) {
        const overlay = document.createElement('div');
        overlay.id = 'pendingApprovalOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#fff8e1,#ffe0b2);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;';

        overlay.innerHTML = `
            <div style="max-width:440px;width:100%;background:white;border-radius:20px;padding:30px 24px;box-shadow:0 10px 40px rgba(0,0,0,0.15);text-align:center;">
                <div style="font-size:64px;margin-bottom:10px;">⏳</div>
                <div style="font-size:20px;font-weight:bold;color:#2c3e50;margin-bottom:10px;">طلبك قيد المراجعة</div>
                <div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:20px;">
                    تم إرسال طلبك إلى مدير المطعم.<br>
                    سيتم تفعيل حسابك بعد الموافقة.
                </div>
                <div style="background:#fff8e1;border-radius:10px;padding:14px;font-size:13px;color:#856404;text-align:right;line-height:1.7;margin-bottom:20px;">
                    📋 <b>تفاصيل الطلب:</b><br>
                    👤 البريد: ${_afEsc(currentUser?.email || '—')}<br>
                    🎯 الواجهة: ${_afEsc(result.label || result.role)}<br>
                    🏢 المطعم: ${_afEsc(result.ownerName || '—')}
                </div>
                <div style="font-size:12px;color:#999;line-height:1.6;margin-bottom:20px;">
                    💡 تواصل مع المدير للمتابعة.<br>
                    سيُطلب منك إعادة تسجيل الدخول بعد الموافقة.
                </div>
                <button onclick="_pendingLogout()" style="width:100%;padding:14px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
                    🚪 تسجيل الخروج
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window._pendingLogout = function() {
        if (!confirm('🚪 تسجيل الخروج؟\n\nيمكنك تسجيل الدخول لاحقاً بعد موافقة المدير.')) return;
        clearSession();
        if (typeof auth !== 'undefined' && auth) {
            auth.signOut().then(() => location.reload());
        } else {
            location.reload();
        }
    };

    // ═══════════════════════════════════════════════════════
    //  🟢 شاشة الرفض
    // ═══════════════════════════════════════════════════════
    function showRejectedScreen() {
        const overlay = document.createElement('div');
        overlay.id = 'rejectedOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#fdecea,#fadbd8);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;';

        overlay.innerHTML = `
            <div style="max-width:440px;width:100%;background:white;border-radius:20px;padding:30px 24px;box-shadow:0 10px 40px rgba(0,0,0,0.15);text-align:center;">
                <div style="font-size:64px;margin-bottom:10px;">❌</div>
                <div style="font-size:20px;font-weight:bold;color:#c0392b;margin-bottom:10px;">تم رفض طلبك</div>
                <div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:20px;">
                    لم يوافق المدير على طلب الارتباط.<br>
                    تواصل معه لمعرفة السبب.
                </div>
                <button onclick="_pendingLogout()" style="width:100%;padding:14px;background:#95a5a6;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
                    🚪 تسجيل الخروج
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    window.showPendingApprovalScreen = showPendingApprovalScreen;
    window.showRejectedScreen = showRejectedScreen;

    // ═══════════════════════════════════════════════════════
    //  10. APPLY VIEW
    // ═══════════════════════════════════════════════════════
    let _allowedTarget = null;

    function applyStaffView(view) {
        const viewInfo = window.STAFF_LINK_VIEWS[view];
        if (!viewInfo) {
            console.warn('[staff-link] view غير معروفة:', view);
            return;
        }
        _allowedTarget = viewInfo.target;

        document.body.classList.add('staff-mode');

        // إخفاء فوري
        _hideChrome();

        // إخفاء متكرر (لأن auth.js interval يُعيدها)
        if (window._staffHideInterval) clearInterval(window._staffHideInterval);
        window._staffHideInterval = setInterval(_hideChrome, 500);

        const oldBadge = document.getElementById('staffModeBadge');
        if (oldBadge) oldBadge.remove();

        const badge = document.createElement('div');
        badge.id = 'staffModeBadge';
        badge.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);background:' + viewInfo.color + ';color:white;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;z-index:99999;box-shadow:0 3px 10px rgba(0,0,0,0.2);display:flex;align-items:center;gap:6px;cursor:pointer;';
        badge.innerHTML = `<span>${viewInfo.icon}</span> <span>${viewInfo.label}</span>`;
        badge.title = 'اضغط للخروج';
        badge.onclick = window._staffLogout;
        document.body.appendChild(badge);

        // ⑤ فتح الصفحة
        let _opened = false;

        function _tryOpenPage() {
            if (_opened) return true;
            if (!document.body.classList.contains('app-ready')) return false;

            _hideChrome();

            try {
                if (typeof window._originalOpenPage === 'function') {
                    window._originalOpenPage(viewInfo.target);
                } else if (typeof window.openPage === 'function') {
                    window.openPage(viewInfo.target);
                } else if (typeof window.openActivityPage === 'function') {
                    window.openActivityPage(viewInfo.target);
                }
                _opened = true;
                window._staffLinkOpened = true;
                console.log('✅ [staff-link] فُتحت:', viewInfo.target);
            } catch(e) {
                console.error('[staff-link] open error:', e);
            }

            setTimeout(_hideChrome, 100);
            setTimeout(_hideChrome, 500);
            setTimeout(_hideChrome, 1000);
            setTimeout(_hideChrome, 2000);
            return _opened;
        }

        // محاولة فورية
        if (_tryOpenPage()) return;

        // MutationObserver لمراقبة app-ready
        const _obs = new MutationObserver(() => {
            if (document.body.classList.contains('app-ready')) {
                if (_tryOpenPage()) _obs.disconnect();
            }
        });
        _obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        // محاولات دورية
        let attempts = 0;
        const tryOpen = setInterval(() => {
            attempts++;
            if (_tryOpenPage()) {
                clearInterval(tryOpen);
                _obs.disconnect();
                return;
            }
            if (attempts > 80) {
                clearInterval(tryOpen);
                _obs.disconnect();
                console.warn('[staff-link] timeout');
                if (typeof window._originalOpenPage === 'function') {
                    try { window._originalOpenPage(viewInfo.target); } catch(e) {}
                }
            }
        }, 300);
    }

    // ─── helper مشترك ───
    function _hideChrome() {
        const m = document.getElementById('mainMenuBtn');
        const a = document.getElementById('aiChatBtn');
        const b = document.getElementById('globalBackBtn');
        if (m) m.style.setProperty('display', 'none', 'important');
        if (a) a.style.setProperty('display', 'none', 'important');
        if (b) b.style.setProperty('display', 'none', 'important');
    }

    // ═══════════════════════════════════════════════════════
    //  11. NAVIGATION GUARD
    // ═══════════════════════════════════════════════════════
    function installNavigationGuard() {
        if (typeof window.openPage !== 'function') return;
        if (window._openPagePatched) return;
        window._openPagePatched = true;

        // نحفظ الأصلي أولاً (لاستخدامه في الفتح)
        if (!window._originalOpenPage) {
            window._originalOpenPage = window.openPage;
        }

        window.openPage = function(page) {
            if (document.body.classList.contains('staff-mode') && _allowedTarget) {
                if (page !== _allowedTarget && page !== 'login' && page !== 'register') {
                    console.warn('🚫 [staff-link] منع التنقل:', page);
                    return;
                }
            }
            return window._originalOpenPage.apply(this, arguments);
        };
    }

    // ═══════════════════════════════════════════════════════
    //  12. LOGOUT
    // ═══════════════════════════════════════════════════════
    window._staffLogout = function() {
        if (!confirm('🚪 خروج من وضع الموظف؟\n\nسيُطلب منك إعادة الدخول.')) return;

        // 🆕 احفظ flag "خروج متعمد"
        try {
            const uid = auth?.currentUser?.uid;
            if (uid) {
                localStorage.setItem('staff_logout_' + uid, '1');
            }
            // احفظ flag عام أيضاً
            localStorage.setItem('staff_logout_global', '1');
        } catch(e) {}

        clearSession();
        document.body.classList.remove('staff-mode');
        const badge = document.getElementById('staffModeBadge');
        if (badge) badge.remove();

        // إظهار ☰ + 🤖 مؤقتاً
        try {
            const m = document.getElementById('mainMenuBtn');
            const a = document.getElementById('aiChatBtn');
            if (m) m.style.display = 'block';
            if (a) a.style.display = 'flex';
        } catch(e) {}

        setTimeout(() => location.reload(), 200);
    };

    // ═══════════════════════════════════════════════════════
    //  13. CHECK ON START
    // ═══════════════════════════════════════════════════════
    async function checkStaffLinkOnStart() {
    // ═══════════════════════════════════════════════════════
    //  ① اقرأ ownerUid من Firestore مباشرة (لو currentUser مو محمّل)
    // ═══════════════════════════════════════════════════════
    let ownerUid = null;
    let bizType = '';

    // من currentUser (لو محمّل)
    if (typeof currentUser !== 'undefined' && currentUser) {
        ownerUid = currentUser.ownerUid || null;
        bizType = (currentUser.businessType || '').trim();
    }

    // لو currentUser مو محمّل — اقرأ من Firestore مباشرة
    if (!bizType && auth?.currentUser) {
        try {
            const doc = await db.collection('users').doc(auth.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                bizType = (data.businessType || '').trim();
                ownerUid = data.ownerUid || null;
                console.log('📥 [staff-link] قرأنا من Firestore:', { bizType, ownerUid });
            }
        } catch(e) {
            console.warn('[staff-link] read user:', e.message);
        }
    }

    console.log('🔍 [staff-link] bizType =', bizType, '| ownerUid =', ownerUid);

    // فحص: مطعم؟
    const isRestaurant = bizType.includes('مطعم') || bizType.includes('كافيه') || bizType.includes('كافي');
    if (!isRestaurant) {
        console.log('⏭️ [staff-link] ليس مطعم — تخطي');
        return;
    }

    // ═══════════════════════════════════════════════════════
    //  ② فحص localStorage
    // ═══════════════════════════════════════════════════════
    loadSession();

    // 🆕 فحص flag "خروج متعمد" — قبل أي شيء
    try {
        const uid = auth?.currentUser?.uid;
        const logoutFlag = (uid && localStorage.getItem('staff_logout_' + uid) === '1')
                        || localStorage.getItem('staff_logout_global') === '1';

        if (logoutFlag) {
            console.log('🚪 [staff-link] يوجد flag خروج — مسح + عرض "من أنت؟"');

            // امسح الـ flags
            if (uid) localStorage.removeItem('staff_logout_' + uid);
            localStorage.removeItem('staff_logout_global');

            // امسح أي session قديم
            clearSession();

            // أزل staff-mode
            try {
                document.body.classList.remove('staff-mode');
                const badge = document.getElementById('staffModeBadge');
                if (badge) badge.remove();
                const m = document.getElementById('mainMenuBtn');
                const a = document.getElementById('aiChatBtn');
                if (m) m.style.display = 'block';
                if (a) a.style.display = 'flex';
            } catch(e) {}

            return;
        }
    } catch(e) {
        console.warn('[staff-link] logout flag check:', e.message);
    }

    // ③ وضع الموظف من localStorage — لكن نتحقق من Firestore أولاً!
    if (_appMode === 'staff' && _staffView) {
        console.log('🔍 [staff-link] استئناف — نتحقق من Firestore...');

        // ① اقرأ الحالة الفعلية من Firestore
        let realRole = null, realStatus = null, realOwnerUid = null;
        try {
            const doc = await db.collection('users').doc(auth.currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                realRole = data.role;
                realStatus = data.linkStatus || (data.ownerUid ? 'active' : null);
                realOwnerUid = data.ownerUid;
            }
        } catch(e) {
            console.warn('[staff-link] read user:', e.message);
        }

        console.log('🔍 [staff-link] Firestore:', { realRole, realStatus, realOwnerUid });

        // 🟢 الموظف لا يزال مُفعّلاً
        if (realRole && realOwnerUid && (realStatus === 'active' || !realStatus)) {
            console.log('✅ [staff-link] استئناف مؤكَّد من Firestore:', realRole);

            // 🏢 تحميل بيانات المطعم
            await _loadOwnerBusinessInfo(realOwnerUid);

            // تحديث localStorage (في حال تغيّر شيء)
            saveSession(_staffCode || 'linked', realOwnerUid, realRole);
            applyStaffView(realRole);
            return;
        }

        // 🔴 الموظف أُزيل → شاشة "تم الإلغاء"
        console.log('🚫 [staff-link] الموظف أُزيل');

        // إذا الحالة كانت 'revoked' → شاشة مخصصة
        if (realStatus === 'revoked') {
            clearSession();
            showRevokedScreen();
            return;
        }

        // غير ذلك → شاشة عادية
        clearSession();
        try {
            document.body.classList.remove('staff-mode');
            const badge = document.getElementById('staffModeBadge');
            if (badge) badge.remove();
            const m = document.getElementById('mainMenuBtn');
            const a = document.getElementById('aiChatBtn');
            if (m) m.style.display = 'block';
            if (a) a.style.display = 'flex';
        } catch(e) {}
        return;
    }

    // ④ المدير
    if (_appMode === 'admin') {
        console.log('👑 [staff-link] وضع المدير');
        return;
    }

    // ═══════════════════════════════════════════════════════
    //  ⑤ فحص: هل الموظف مرتبط فعلاً؟ (في Firestore)
    // ═══════════════════════════════════════════════════════
    if (ownerUid) {
        const role = (currentUser?.role) || (await getRoleFromFirestore());
        const linkStatus = currentUser?.linkStatus || (await getLinkStatusFromFirestore());

        console.log('🔍 [staff-link] ownerUid:', ownerUid, '| role:', role, '| status:', linkStatus);

        // 🟡 قيد المراجعة
        if (linkStatus === 'pending') {
            console.log('⏳ [staff-link] قيد المراجعة');
            showPendingApprovalScreen({
                role: role || 'unknown',
                label: currentUser?.linkCodeUsed || 'قيد المراجعة',
                ownerName: currentUser?.linkedOwnerName || 'المطعم'
            });
            return;
        }

        // 🔴 مرفوض
        if (linkStatus === 'rejected') {
            console.log('❌ [staff-link] مرفوض');
            showRejectedScreen();
            return;
        }

        // 🟢 مُفعّل (أو backward compat)
        if (role && (linkStatus === 'active' || !linkStatus)) {
            console.log('✅ [staff-link] موظف مُفعّل — الدور:', role);

            // 🏢 تحميل بيانات المطعم من حساب المدير
            await _loadOwnerBusinessInfo(ownerUid);

            saveSession('linked', ownerUid, role);
            applyStaffView(role);
            return;
        }
    }

    // ⑥ لا يوجد اختيار → اسأل
    console.log('❓ [staff-link] عرض شاشة "من أنت؟"');
}

async function getLinkStatusFromFirestore() {
    if (!auth?.currentUser) return null;
    try {
        const doc = await db.collection('users').doc(auth.currentUser.uid).get();
        if (doc.exists) return doc.data().linkStatus || null;
    } catch(e) {}
    return null;
}

async function getRoleFromFirestore() {
    if (!auth?.currentUser) return null;
    try {
        const doc = await db.collection('users').doc(auth.currentUser.uid).get();
        if (doc.exists) return doc.data().role || null;
    } catch(e) {}
    return null;
}

    // ═══════════════════════════════════════════════════════
    //  14. MANAGER PAGE
    // ═══════════════════════════════════════════════════════
    window.openStaffLinkManager = async function() {
        let cont = document.getElementById('page-staff-links');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-staff-links';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') {
            openPage('page-staff-links');
        } else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        await renderStaffLinkManager(cont);
    };

    async function renderStaffLinkManager(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        let codes = [];
        try {
            const snap = await db.collection('public_link_codes')
                .where('ownerUid', '==', currentUser.uid)
                .get();
            snap.forEach(d => codes.push({ id: d.id, ...d.data() }));
            codes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch(e) {
            console.warn('[staff-link] load:', e.message);
        }

        // 🆕 طلبات الموافقة
        const pendingCodes = codes.filter(c => c.status === 'pending_approval');
        let pendingHtml = '';
        if (pendingCodes.length > 0) {
            pendingHtml = `
                <div style="background:linear-gradient(135deg,#fff8e1,#ffe0b2);border-radius:12px;padding:14px;margin-bottom:15px;border:2px solid #f39c12;">
                    <div style="font-weight:700;color:#856404;font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                        <span style="font-size:20px;">🔔</span>
                        <span>طلبات بانتظار موافقتك (${pendingCodes.length})</span>
                    </div>
            `;
            pendingCodes.forEach(c => {
                const vi = window.STAFF_LINK_VIEWS[c.role] || {};
                const usedAt = c.usedAt ? new Date(c.usedAt).toLocaleString('ar-SY') : '';
                pendingHtml += `
                    <div style="background:white;border-radius:10px;padding:12px;margin-bottom:8px;">
                        <div style="font-weight:700;color:#2c3e50;font-size:14px;margin-bottom:6px;">${_afEsc(c.label || '—')}</div>
                        <div style="font-size:12px;color:#666;margin-bottom:8px;">
                            📧 ${_afEsc(c.employeeEmail || '—')}<br>
                            ${vi.icon || ''} ${vi.label || c.role}<br>
                            🕐 ${usedAt}
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                            <button onclick="_staffApprove('${_afEsc(c.id)}')" style="padding:10px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">✅ موافقة</button>
                            <button onclick="_staffReject('${_afEsc(c.id)}')" style="padding:10px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">❌ رفض</button>
                        </div>
                    </div>
                `;
            });
            pendingHtml += '</div>';
        }

        let listHtml = '';
        if (codes.length === 0) {
            listHtml = '<div style="text-align:center;padding:30px;color:#999;background:#f8f9fa;border-radius:10px;">لا توجد أكواد بعد</div>';
        } else {
            codes.forEach(c => {
                const vi = window.STAFF_LINK_VIEWS[c.role] || {};
                const active = c.active !== false;
                const usedBy = c.usedBy || null;
                listHtml += `
                    <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${active ? (vi.color || '#666') : '#999'};opacity:${active ? '1' : '0.7'};">
                        <div style="margin-bottom:8px;">
                            <div style="font-weight:bold;color:#2c3e50;font-size:15px;">${_afEsc(c.label || '—')}</div>
                            <div style="font-size:11px;color:#666;margin-top:3px;">${vi.icon || ''} ${vi.label || c.role}</div>
                            <div style="font-size:15px;color:#3498db;font-weight:700;font-family:'Courier New',monospace;letter-spacing:2px;margin-top:6px;">${_afEsc(c.id)}</div>
                            ${c.employeeEmail ? `<div style="font-size:10px;color:#666;margin-top:4px;">📧 ${_afEsc(c.employeeEmail)}</div>` : ''}
                            ${!active ? '<div style="display:inline-block;margin-top:6px;background:#95a5a6;color:white;padding:2px 8px;border-radius:10px;font-size:10px;">✅ مُستخدم</div>' : '<div style="display:inline-block;margin-top:6px;background:#27ae60;color:white;padding:2px 8px;border-radius:10px;font-size:10px;">🟢 فعّال</div>'}
                        </div>
                        <div style="display:grid;grid-template-columns:${c.usedBy ? '2fr 1fr 1fr' : '1fr 1fr 1fr'};gap:6px;">
                            ${c.usedBy ? `
                                <button onclick="_staffRevokeEmployee('${_afEsc(c.id)}')" style="padding:8px 4px;background:#f39c12;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">🚫 إلغاء الارتباط</button>
                                <button onclick="_staffCopyWhatsApp('${_afEsc(c.id)}', '${_afEsc(c.label || '')}')" style="padding:8px 4px;background:#25D366;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">📱</button>
                                <button onclick="_staffDeleteCode('${_afEsc(c.id)}')" style="padding:8px 4px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">🗑️</button>
                            ` : `
                                <button onclick="_staffCopyCode('${_afEsc(c.id)}')" style="padding:8px 4px;background:#3498db;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">📋 نسخ</button>
                                <button onclick="_staffCopyWhatsApp('${_afEsc(c.id)}', '${_afEsc(c.label || '')}')" style="padding:8px 4px;background:#25D366;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">📱 واتساب</button>
                                <button onclick="_staffDeleteCode('${_afEsc(c.id)}')" style="padding:8px 4px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">🗑️ حذف</button>
                            `}
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">🔗 أكواد الموظفين</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">أنشئ كوداً لكل موظف — وحدّد واجهته</p>

            ${pendingHtml}

            <button onclick="_staffShowCreateForm()" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:15px;box-shadow:0 3px 10px rgba(39,174,96,0.3);">
                ➕ إنشاء كود جديد
            </button>

            <div style="background:#f0f7ff;border-radius:10px;padding:12px;margin-bottom:15px;border-right:4px solid #3498db;">
                <div style="font-size:12px;color:#555;line-height:1.7;">
                    💡 <b>كيف يعمل؟</b><br>
                    • أنشئ كوداً لكل موظف<br>
                    • حدّد بريده (اختياري — للأمان)<br>
                    • أرسل الكود له<br>
                    • الموظف يُدخل الكود → يفتح واجهته فقط<br>
                    • الكود يُستهلك بعد الاستخدام
                </div>
            </div>

            ${listHtml}
        `;
    }

    window._staffShowCreateForm = function() {
        const old = document.getElementById('staffCreateModal');
        if (old) old.remove();

        let viewOptions = '';
        Object.entries(window.STAFF_LINK_VIEWS).forEach(([key, vi]) => {
            viewOptions += `<option value="${key}">${vi.icon} ${vi.label}</option>`;
        });

        const modal = document.createElement('div');
        modal.id = 'staffCreateModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';

        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:460px;width:100%;padding:20px;box-sizing:border-box;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="margin:0;font-size:18px;">🔗 كود جديد</h2>
                    <button onclick="document.getElementById('staffCreateModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>
                </div>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">👤 اسم الموظف</label>
                <input type="text" id="staffNewLabel" placeholder="مثال: أحمد — نادل" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;">

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">📧 بريد الموظف (اختياري)</label>
                <input type="email" id="staffNewEmail" placeholder="ahmad@example.com" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;direction:ltr;text-align:right;">
                <div style="font-size:11px;color:#999;margin-top:-8px;margin-bottom:12px;">💡 يُقيّد الكود بهذا البريد فقط</div>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🎯 الواجهة</label>
                <select id="staffNewView" onchange="_staffRegenerateCode()" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;background:white;box-sizing:border-box;margin-bottom:12px;font-family:inherit;">
                    ${viewOptions}
                </select>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🔑 الكود</label>
                <div style="display:flex;gap:8px;margin-bottom:15px;">
                    <input type="text" id="staffNewCode" readonly style="flex:1;padding:12px;border:2px solid #3498db;border-radius:8px;font-size:16px;text-align:center;font-family:'Courier New',monospace;letter-spacing:2px;font-weight:bold;background:#f0f7ff;box-sizing:border-box;">
                    <button onclick="_staffRegenerateCode()" style="padding:0 14px;background:#3498db;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;" title="توليد جديد">🎲</button>
                </div>

                <button onclick="_staffCreateSubmit()" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
                    💾 إنشاء الكود
                </button>

                <div id="staffCreateError" style="color:#e74c3c;text-align:center;font-size:12px;margin-top:10px;min-height:18px;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        window._staffRegenerateCode();
        setTimeout(() => document.getElementById('staffNewLabel')?.focus(), 100);
    };

    window._staffRegenerateCode = function() {
        const el = document.getElementById('staffNewCode');
        const viewEl = document.getElementById('staffNewView');
        if (el) {
            const role = viewEl?.value || 'waiter';
            el.value = generateCode(role);
        }
    };

    window._staffCreateSubmit = async function() {
        const label = document.getElementById('staffNewLabel')?.value?.trim() || '';
        const email = document.getElementById('staffNewEmail')?.value?.trim() || '';
        const role = document.getElementById('staffNewView')?.value || 'waiter';
        const code = document.getElementById('staffNewCode')?.value?.trim() || '';
        const err = document.getElementById('staffCreateError');

        if (!label) { if (err) err.textContent = '⚠️ أدخل اسم الموظف'; return; }
        if (!code) { if (err) err.textContent = '⚠️ الكود مفقود'; return; }

        if (err) err.textContent = '⏳ جاري الحفظ...';

        try {
            // فحص التكرار
            const existing = await db.collection('public_link_codes').doc(code).get();
            if (existing.exists) {
                if (err) err.textContent = '⚠️ الكود موجود — أعد التوليد';
                window._staffRegenerateCode();
                return;
            }

            await createLinkCode(role, label, email || null);

            const modal = document.getElementById('staffCreateModal');
            if (modal) modal.remove();

            if (typeof toast === 'function') toast('✅ تم إنشاء الكود: ' + code, 'success');

            const container = document.getElementById('page-staff-links');
            if (container) renderStaffLinkManager(container);

        } catch(e) {
            console.error(e);
            if (err) err.textContent = '❌ خطأ: ' + e.message;
        }
    };

    window._staffCopyCode = function(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                if (typeof toast === 'function') toast('✅ تم نسخ: ' + code, 'success');
                else alert('✅ ' + code);
            }).catch(() => prompt('انسخ الكود:', code));
        } else {
            prompt('انسخ الكود:', code);
        }
    };

    window._staffCopyWhatsApp = function(code, label) {
        const bizName = currentUser?.businessName || 'المطعم';
        const msg = `👋 مرحباً ${label}\n\n🔗 كود الدخول إلى ${bizName}:\n\n*${code}*\n\n📱 حمّل التطبيق ثم:\n1. سجّل حسابك\n2. أدخل الكود\n3. سيفتح على واجهتك مباشرة\n\n🔒 الكود خاص بك — لا تشاركه`;
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    };

    window._staffDeleteCode = async function(code) {
        // ① جلب بيانات الكود أولاً
        let usedBy = null;
        try {
            const codeDoc = await db.collection('public_link_codes').doc(code).get();
            if (codeDoc.exists) {
                usedBy = codeDoc.data().usedBy;
            }
        } catch(e) {}

        const msg = usedBy
            ? '🗑️ حذف الكود: ' + code + '؟\n\n⚠️ سيُلغى ارتباط الموظف فوراً!\n\nلا يمكن التراجع.'
            : '🗑️ حذف الكود: ' + code + '؟\n\nلا يمكن التراجع.';

        if (!confirm(msg)) return;

        try {
            // ② حذف الكود
            await db.collection('public_link_codes').doc(code).delete();

            // ③ إذا كان مستخدماً — نُلغي ارتباط الموظف
            if (usedBy) {
                try {
                    await db.collection('users').doc(usedBy).update({
                        ownerUid: null,
                        role: null,
                        linkStatus: 'revoked',
                        revokedAt: Date.now()
                    });
                    console.log('✅ [staff-link] تم إلغاء ارتباط الموظف:', usedBy);
                } catch(e) {
                    console.warn('[staff-link] revoke user:', e.message);
                }
            }

            if (typeof toast === 'function') {
                toast(usedBy ? '✅ تم الحذف وإلغاء الارتباط' : '✅ تم الحذف', 'success');
            }

            const container = document.getElementById('page-staff-links');
            if (container) renderStaffLinkManager(container);
        } catch(e) {
            alert('⚠️ ' + e.message);
        }
    };

    // ═══════════════════════════════════════════════════════
    //  🚫 إلغاء ارتباط موظف مرتبط (بدون حذف الكود)
    // ═══════════════════════════════════════════════════════
    window._staffRevokeEmployee = async function(code) {
        if (!confirm('🚫 إلغاء ارتباط هذا الموظف؟\n\nسيُطرد فوراً من التطبيق.')) return;

        try {
            const codeDoc = await db.collection('public_link_codes').doc(code).get();
            if (!codeDoc.exists) { alert('⚠️ الكود غير موجود'); return; }
            const codeData = codeDoc.data();

            if (!codeData.usedBy) { alert('⚠️ لا يوجد موظف مرتبط'); return; }

            // ① تحديث حساب الموظف
            await db.collection('users').doc(codeData.usedBy).update({
                ownerUid: null,
                role: null,
                linkStatus: 'revoked',
                revokedAt: Date.now()
            });

            // ② إعادة الكود للحالة "متاح"
            await db.collection('public_link_codes').doc(code).update({
                status: 'available',
                usedAt: null,
                usedBy: null
            });

            if (typeof toast === 'function') toast('✅ تم إلغاء الارتباط', 'success');

            const container = document.getElementById('page-staff-links');
            if (container) renderStaffLinkManager(container);

        } catch(e) {
            alert('⚠️ ' + e.message);
        }
    };



    // ═══════════════════════════════════════════════════════
    //  ✅ موافقة / ❌ رفض
    // ═══════════════════════════════════════════════════════
    window._staffApprove = async function(code) {
        if (!confirm('✅ موافقة على هذا الموظف؟\n\nسيتم تفعيل حساب الموظف فوراً.')) return;

        try {
            // ① جلب بيانات الكود
            const codeDoc = await db.collection('public_link_codes').doc(code).get();
            if (!codeDoc.exists) {
                alert('⚠️ الكود غير موجود');
                return;
            }
            const codeData = codeDoc.data();

            // ② تحديث الكود
            await db.collection('public_link_codes').doc(code).update({
                status: 'active',
                approvedAt: Date.now()
            });

            // ③ تفعيل حساب الموظف
            if (codeData.usedBy) {
                await db.collection('users').doc(codeData.usedBy).update({
                    linkStatus: 'active',
                    approvedAt: Date.now()
                });
            }

            if (typeof toast === 'function') toast('✅ تم تفعيل الموظف', 'success');
            else alert('✅ تم التفعيل');

            const container = document.getElementById('page-staff-links');
            if (container) renderStaffLinkManager(container);

        } catch(e) {
            console.error(e);
            alert('⚠️ خطأ: ' + e.message);
        }
    };

    window._staffReject = async function(code) {
        if (!confirm('❌ رفض هذا الطلب؟\n\nسيُحذف الطلب ولا يمكن التراجع.')) return;

        try {
            const codeDoc = await db.collection('public_link_codes').doc(code).get();
            if (!codeDoc.exists) return;
            const codeData = codeDoc.data();

            // ① تحديث الكود
            await db.collection('public_link_codes').doc(code).update({
                status: 'rejected',
                rejectedAt: Date.now()
            });

            // ② تحديث حساب الموظف
            if (codeData.usedBy) {
                await db.collection('users').doc(codeData.usedBy).update({
                    linkStatus: 'rejected',
                    rejectedAt: Date.now(),
                    ownerUid: null
                });
            }

            if (typeof toast === 'function') toast('❌ تم الرفض', 'success');
            else alert('تم الرفض');

            const container = document.getElementById('page-staff-links');
            if (container) renderStaffLinkManager(container);

        } catch(e) {
            console.error(e);
            alert('⚠️ خطأ: ' + e.message);
        }
    };

    // ═══════════════════════════════════════════════════════
    //  15. EXPORT
    // ═══════════════════════════════════════════════════════
    window._loadOwnerBusinessInfo = _loadOwnerBusinessInfo;
    window.checkStaffLinkOnStart = checkStaffLinkOnStart;
    window.showRoleSelector = showRoleSelector;
    window.showStaffLinkPrompt = showStaffLinkPrompt;
    window.applyStaffView = applyStaffView;
    window.verifyStaffCode = verifyCode;
    window.generateStaffCode = generateCode;
    window.createStaffLinkCode = createLinkCode;
    window.linkStaffEmployee = linkEmployee;

    // ═══════════════════════════════════════════════════════
    //  16. INIT
    // ═══════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════
    //  ⚡ EARLY HIDE — قبل أي شيء (بلا انتظار)
    // ═══════════════════════════════════════════════════════
    (function earlyHide() {
        try {
            // نحتاج uid من auth — لكن auth قد لا يكون جاهزاً
            // نستخدم المسار القديم + الجديد
            let mode = null;
            try {
                const uid = (typeof auth !== 'undefined' && auth?.currentUser) ? auth.currentUser.uid : null;
                if (uid) mode = localStorage.getItem('app_mode_' + uid);
                if (!mode) mode = localStorage.getItem('app_mode');
            } catch(e) {}
            if (mode !== 'staff') return;

            console.log('⚡ [staff-link] وضع الموظف — إخفاء فوري');

            // ① أضف class للـ body فوراً
            const applyHide = () => {
                if (!document.body) return;
                document.body.classList.add('staff-mode');

                const m = document.getElementById('mainMenuBtn');
                const a = document.getElementById('aiChatBtn');
                const b = document.getElementById('globalBackBtn');
                if (m) m.style.setProperty('display', 'none', 'important');
                if (a) a.style.setProperty('display', 'none', 'important');
                if (b) b.style.setProperty('display', 'none', 'important');

                // 🏢 تطبيق بيانات المطعم المخزّنة مؤقتاً
                try {
                    const cached = localStorage.getItem('owner_biz_info');
                    if (cached && typeof currentUser !== 'undefined' && currentUser) {
                        const info = JSON.parse(cached);
                        if (info.businessName && !currentUser.businessName) {
                            currentUser.businessName = info.businessName;
                            currentUser.phone = info.phone || '';
                            currentUser.location = info.location || null;
                            currentUser.ownerSignature = info.ownerSignature || '';
                        }
                    }
                } catch(e) {}
            };

            applyHide();

            // ② أعِد المحاولة عند ظهور العناصر
            if (document.body) {
                const obs = new MutationObserver(applyHide);
                obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            }

            // ③ فوراً عند DOMContentLoaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    applyHide();
                    // محاولات سريعة
                    setTimeout(applyHide, 50);
                    setTimeout(applyHide, 200);
                    setTimeout(applyHide, 500);
                });
            } else {
                applyHide();
            }

            // ④ تثبيت دوري
            const hideInterval = setInterval(applyHide, 300);

            // ⑤ Safety Net — لو 15 ثانية مرت بلا فتح → أظهر ☰
            window._staffSafetyTimeout = setTimeout(() => {
                if (window._staffLinkOpened === true) return;
                console.warn('⚠️ [staff-link] SAFETY — الصفحة لم تُفتح — إظهار ☰');

                document.body.classList.remove('staff-mode');
                clearInterval(hideInterval);

                const m = document.getElementById('mainMenuBtn');
                const a = document.getElementById('aiChatBtn');
                if (m) { m.style.display = 'block'; m.style.removeProperty('display'); }
                if (a) { a.style.display = 'flex'; a.style.removeProperty('display'); }

                const badge = document.getElementById('staffModeBadge');
                if (badge) badge.remove();

                if (typeof toast === 'function') {
                    toast('⚠️ تعذّر فتح الواجهة — تم التعطيل', 'error');
                }
            }, 15000);
        } catch(e) {
            console.warn('[staff-link] earlyHide:', e.message);
        }
    })();

    // ═══════════════════════════════════════════════════════
    //  INIT — تقليل التأخير من 3000 إلى 500
    // ═══════════════════════════════════════════════════════
    if (typeof auth !== 'undefined' && auth) {
        let _checked = false;
        auth.onAuthStateChanged(function(user) {
            if (!user || _checked) return;
            _checked = true;

            // محاولات متعددة (لأن currentUser قد يتأخر)
            let tries = 0;
            const interval = setInterval(async () => {
                tries++;

                // تحقق: هل currentUser محمّل الآن؟
                const ready = (typeof currentUser !== 'undefined' && currentUser)
                           || auth?.currentUser;

                if (ready) {
                    clearInterval(interval);
                    try {
                        await checkStaffLinkOnStart();
                    } catch(e) {
                        console.warn('[staff-link] init:', e.message);
                    }
                    installNavigationGuard();
                }

                if (tries > 20) {
                    clearInterval(interval);
                    console.warn('[staff-link] timeout — لم يُحمَّل currentUser');
                }
            }, 500);  // كل 500ms
        });
    }

    console.log('🔗 [staff-link] v2.1.0 ready — early hide');
})();
