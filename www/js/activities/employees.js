// ============================================================
//  👤 ACTIVITY: EMPLOYEES — نشاط "موظفين"
//  v1.0.0
// ============================================================

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════
    //  1. REGISTER
    // ═══════════════════════════════════════════════════════
    if (typeof ACTIVITY_REGISTRY !== 'undefined') {
        ACTIVITY_REGISTRY.register({
            id: 'employees',
            name: 'موظفين',
            icon: '👤',
            pages: [
                {
                    id: 'hub',
                    icon: '🏠',
                    title: 'صفحتي',
                    description: 'واجهة الموظف',
                    searchFields: [],
                    unifiedSearch: false,
                    fields: [],
                    itemRenderer: function() { return ''; },
                    pageRenderer: function(container) {
                        renderEmployeeHub(container);
                    }
                }
            ]
        });
    }

    // ═══════════════════════════════════════════════════════
    //  2. STATE HELPER
    // ═══════════════════════════════════════════════════════
    function _getEmployeeState() {
        const u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
        const hasOwner = !!(u.ownerUid);
        const status = u.linkStatus || (hasOwner ? 'active' : null);
        return {
            hasOwner: hasOwner,
            status: status,
            ownerName: u.linkedOwnerName || u.ownerName || '',
            roleName: u.roleName || u.role || '',
            pages: u.rolePages || u.employeePages || u.pages || []
        };
    }

    // ═══════════════════════════════════════════════════════
    //  3. MAIN HUB — يعرض الشاشة المناسبة
    // ═══════════════════════════════════════════════════════
    function renderEmployeeHub(container) {
        if (!container) return;

        const state = _getEmployeeState();

        console.log('👤 [employees] state:', state);

        // ① بلا ownerUid → شاشة إدخال الكود
        if (!state.hasOwner) {
            _renderCodeInputScreen(container);
            return;
        }

        // ② pending → شاشة الانتظار
        if (state.status === 'pending') {
            _renderPendingScreen(container, state);
            return;
        }

        // ③ rejected → شاشة الرفض
        if (state.status === 'rejected') {
            _renderRejectedScreen(container);
            return;
        }

        // ④ revoked → شاشة الإلغاء
        if (state.status === 'revoked') {
            _renderRevokedScreen(container);
            return;
        }

        // ⑤ active → قائمة الصفحات
        _renderEmployeePagesScreen(container, state);
    }

    // ═══════════════════════════════════════════════════════
    //  4. شاشة إدخال الكود
    // ═══════════════════════════════════════════════════════
    function _renderCodeInputScreen(container) {
        const bizName = (currentUser?.businessName || 'موظف');

        container.innerHTML = `
            <div style="max-width:500px;margin:0 auto;padding:20px 15px;">
                <div style="background:white;border-radius:16px;padding:30px 22px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;">
                    <div style="font-size:64px;margin-bottom:12px;">👤</div>
                    <div style="font-size:20px;font-weight:bold;color:#2c3e50;margin-bottom:6px;">أهلاً ${_afEsc(currentUser?.fullName || 'بك')}</div>
                    <div style="font-size:14px;color:#666;margin-bottom:24px;">أنت الآن في نشاط "موظفين"</div>

                    <div style="background:#f0f7ff;border-radius:10px;padding:14px;margin-bottom:20px;border-right:4px solid #3498db;text-align:right;">
                        <div style="font-size:13px;color:#555;line-height:1.7;">
                            🔗 <b>لبدء العمل:</b><br>
                            اطلب من مديرك "كود ارتباط" وأدخله هنا.
                        </div>
                    </div>

                    <div style="text-align:right;margin-bottom:8px;">
                        <label style="font-size:13px;color:#555;font-weight:600;">🔑 كود الارتباط:</label>
                    </div>
                    <input type="text" id="empCodeInput" placeholder="XXX-XXX-XXX" maxlength="11" autocapitalize="characters" autocomplete="off" style="width:100%;padding:18px;border:2px solid #3498db;border-radius:12px;font-size:22px;text-align:center;font-family:'Courier New',monospace;letter-spacing:3px;font-weight:bold;text-transform:uppercase;box-sizing:border-box;margin-bottom:12px;">

                    <button onclick="_empSubmitCode()" id="empSubmitBtn" style="width:100%;padding:16px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(39,174,96,0.3);font-family:inherit;margin-bottom:10px;">
                        ✅ تحقق
                    </button>

                    <button onclick="_empLogout()" style="width:100%;padding:12px;background:#ecf0f1;color:#555;border:none;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">
                        🚪 تسجيل الخروج
                    </button>

                    <div id="empCodeError" style="color:#e74c3c;text-align:center;font-size:13px;margin-top:12px;min-height:18px;"></div>
                </div>
            </div>
        `;

        // تنسيق تلقائي
        setTimeout(() => {
            const inp = document.getElementById('empCodeInput');
            if (inp) {
                inp.focus();
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') window._empSubmitCode();
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

    // ═══════════════════════════════════════════════════════
    //  5. إرسال الكود
    // ═══════════════════════════════════════════════════════
    window._empSubmitCode = async function() {
        const inp = document.getElementById('empCodeInput');
        const err = document.getElementById('empCodeError');
        const btn = document.getElementById('empSubmitBtn');
        if (!inp || !err) return;

        const code = inp.value.trim().toUpperCase();
        if (!code || code.length < 11) {
            err.textContent = '⚠️ أدخل كوداً صحيحاً (XXX-XXX-XXX)';
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحقق...'; }
        err.textContent = '';

        // نستخدم دالة الربط من staff-link-v2.js
        const result = await (typeof linkStaffEmployee === 'function'
            ? linkStaffEmployee(code)
            : { ok: false, error: '⚠️ نظام الربط غير متاح' });

        if (btn) { btn.disabled = false; btn.textContent = '✅ تحقق'; }

        if (!result.ok) {
            err.textContent = result.error;
            return;
        }

        // ✅ نجح → تأكيد
        _showConfirmDialog(result, code);
    };

    // ═══════════════════════════════════════════════════════
    //  6. شاشة التأكيد
    // ═══════════════════════════════════════════════════════
    function _showConfirmDialog(result, code) {
        const modal = document.createElement('div');
        modal.id = 'empConfirmModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';

        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:460px;width:100%;padding:24px;box-sizing:border-box;text-align:center;">
                <div style="font-size:56px;margin-bottom:10px;">🤝</div>
                <div style="font-size:18px;font-weight:bold;color:#2c3e50;margin-bottom:10px;">هل أنت متأكد؟</div>

                <div style="background:#f0f7ff;border-radius:12px;padding:16px;margin-bottom:18px;text-align:right;border-right:4px solid #3498db;">
                    <div style="font-size:13px;color:#666;margin-bottom:6px;">أنت على وشك الانضمام إلى:</div>
                    <div style="font-size:17px;font-weight:700;color:#2c3e50;margin-bottom:10px;">🏪 ${_afEsc(result.ownerName || 'المطعم')}</div>
                    <div style="font-size:13px;color:#555;">
                        🎯 الوظيفة: <b>${_afEsc(result.label || result.role)}</b>
                    </div>
                </div>

                <div style="font-size:12px;color:#999;margin-bottom:16px;">
                    ⚠️ بعد التأكيد، سيُراجع مديرك طلبك.
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button onclick="_empConfirmLink('${_afEsc(code)}')" style="padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">✅ نعم، تأكيد</button>
                    <button onclick="_empCancelLink()" style="padding:14px;background:#ecf0f1;color:#555;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">❌ إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    window._empCancelLink = function() {
        const m = document.getElementById('empConfirmModal');
        if (m) m.remove();
    };

    window._empConfirmLink = async function(code) {
        const m = document.getElementById('empConfirmModal');
        if (m) m.remove();

        // عرض شاشة الانتظار فوراً
        const c = document.getElementById('activity-employees-hub');
        if (c) _renderPendingScreen(c, { ownerName: '', roleName: '' });

        // إعادة تحميل currentUser من Firestore
        try {
            if (typeof auth !== 'undefined' && auth.currentUser) {
                const doc = await db.collection('users').doc(auth.currentUser.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (typeof currentUser === 'object' && currentUser) {
                        Object.assign(currentUser, data);
                    }
                }
            }
        } catch(e) {
            console.warn('[employees] reload user:', e.message);
        }

        if (typeof toast === 'function') {
            toast('⏳ طلبك قيد المراجعة', 'success');
        }

        // إعادة رسم الصفحة
        setTimeout(() => {
            const c2 = document.getElementById('activity-employees-hub');
            if (c2) renderEmployeeHub(c2);
        }, 500);
    };

    // ═══════════════════════════════════════════════════════
    //  7. شاشة الانتظار
    // ═══════════════════════════════════════════════════════
    function _renderPendingScreen(container, state) {
        container.innerHTML = `
            <div style="max-width:500px;margin:0 auto;padding:20px 15px;">
                <div style="background:linear-gradient(135deg,#fff8e1,#ffe0b2);border-radius:16px;padding:30px 22px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;">
                    <div style="font-size:64px;margin-bottom:12px;">⏳</div>
                    <div style="font-size:20px;font-weight:bold;color:#856404;margin-bottom:10px;">طلبك قيد المراجعة</div>
                    <div style="font-size:14px;color:#6c5a00;line-height:1.8;margin-bottom:20px;">
                        تم إرسال طلبك إلى مدير المطعم.<br>
                        سيتم تفعيل حسابك بعد الموافقة.
                    </div>

                    <div style="background:white;border-radius:10px;padding:14px;margin-bottom:20px;font-size:13px;color:#555;line-height:1.7;text-align:right;">
                        📋 <b>تفاصيل:</b><br>
                        👤 ${_afEsc(currentUser?.email || '—')}<br>
                        🏪 ${_afEsc(state.ownerName || currentUser?.linkedOwnerName || '—')}<br>
                        🎯 ${_afEsc(state.roleName || '—')}
                    </div>

                    <div style="font-size:12px;color:#999;margin-bottom:16px;">
                        💡 تواصل مع المدير للمتابعة.
                    </div>

                    <button onclick="_empLogout()" style="width:100%;padding:14px;background:#95a5a6;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
                        🚪 تسجيل الخروج
                    </button>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════
    //  8. شاشة الرفض
    // ═══════════════════════════════════════════════════════
    function _renderRejectedScreen(container) {
        container.innerHTML = `
            <div style="max-width:500px;margin:0 auto;padding:20px 15px;">
                <div style="background:linear-gradient(135deg,#fdecea,#fadbd8);border-radius:16px;padding:30px 22px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;">
                    <div style="font-size:64px;margin-bottom:12px;">❌</div>
                    <div style="font-size:20px;font-weight:bold;color:#c0392b;margin-bottom:10px;">تم رفض طلبك</div>
                    <div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:20px;">
                        لم يوافق المدير على طلب الارتباط.<br>
                        تواصل معه لمعرفة السبب.
                    </div>
                    <button onclick="_empLogout()" style="width:100%;padding:14px;background:#95a5a6;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
                        🚪 تسجيل الخروج
                    </button>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════
    //  9. شاشة الإلغاء
    // ═══════════════════════════════════════════════════════
    function _renderRevokedScreen(container) {
        container.innerHTML = `
            <div style="max-width:500px;margin:0 auto;padding:20px 15px;">
                <div style="background:linear-gradient(135deg,#f8f9fa,#e9ecef);border-radius:16px;padding:30px 22px;box-shadow:0 4px 20px rgba(0,0,0,0.08);text-align:center;">
                    <div style="font-size:64px;margin-bottom:12px;">🚫</div>
                    <div style="font-size:20px;font-weight:bold;color:#c0392b;margin-bottom:10px;">تم إلغاء ارتباطك</div>
                    <div style="font-size:14px;color:#666;line-height:1.8;margin-bottom:20px;">
                        تم إلغاء ارتباطك من المطعم.<br>
                        يمكنك تسجيل الدخول بحساب آخر أو التواصل مع المدير.
                    </div>
                    <button onclick="_empLogout()" style="width:100%;padding:14px;background:#95a5a6;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
                        🚪 تسجيل الخروج
                    </button>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════
    //  10. قائمة الصفحات للموظف
    // ═══════════════════════════════════════════════════════
    function _renderEmployeePagesScreen(container, state) {
        const pages = state.pages || [];

        let pagesHtml = '';
        if (pages.length === 0) {
            pagesHtml = `
                <div style="text-align:center;padding:30px 20px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">📋</div>
                    <div style="font-size:14px;">لم تُحدَّد صفحات بعد</div>
                    <div style="font-size:12px;color:#999;margin-top:6px;">تواصل مع المدير</div>
                </div>
            `;
        } else {
            pages.forEach(pid => {
                const p = (typeof _findPageInCatalog === 'function') ? _findPageInCatalog(pid) : null;
                const label = p ? p.label : pid;
                pagesHtml += `
                    <button onclick="_empOpenPage('${_afEsc(pid)}')" style="width:100%;padding:16px 18px;background:white;border:1px solid #e9ecef;border-radius:12px;text-align:right;font-size:15px;font-weight:600;color:#2c3e50;cursor:pointer;margin-bottom:8px;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,0.04);display:flex;align-items:center;gap:12px;">
                        <span style="flex:1;">${_afEsc(label)}</span>
                        <span style="opacity:0.3;font-size:18px;">›</span>
                    </button>
                `;
            });
        }

        container.innerHTML = `
            <div style="max-width:600px;margin:0 auto;padding:20px 15px;">
                <div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
                    <div style="font-size:42px;margin-bottom:6px;">✅</div>
                    <div style="font-size:16px;font-weight:bold;color:#155724;margin-bottom:6px;">مرحباً ${_afEsc(currentUser?.fullName || '')}</div>
                    <div style="font-size:13px;color:#2e7d32;">
                        🏪 ${_afEsc(state.ownerName || 'المطعم')} • 🎯 ${_afEsc(state.roleName || '—')}
                    </div>
                </div>

                <div id="attendanceCard" style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid #27ae60;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:14px;font-weight:700;color:#2c3e50;">🕐 دوامك اليوم</div>
                            <div id="attendanceDetail" style="font-size:12px;color:#666;margin-top:4px;">جاري التحميل...</div>
                        </div>
                        <button onclick="openAttendanceScanner()" style="padding:11px 18px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 3px 8px rgba(39,174,96,0.3);flex-shrink:0;">
                            📷 سجّل
                        </button>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <button onclick="openLeaveRequest()" style="padding:14px;background:white;border:2px solid #3498db;border-radius:12px;font-size:13px;font-weight:700;color:#2c3e50;cursor:pointer;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                        🏖️ طلب إجازة
                    </button>
                    <button onclick="openMyLeaves()" style="padding:14px;background:white;border:2px solid #8e44ad;border-radius:12px;font-size:13px;font-weight:700;color:#2c3e50;cursor:pointer;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                        📋 إجازاتي
                    </button>
                </div>

                <h3 style="font-size:15px;color:#2c3e50;margin:0 0 12px 0;">📋 صفحاتك (${pages.length})</h3>
                ${pagesHtml}

                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">

                <button onclick="_empLogout()" style="width:100%;padding:12px;background:#ecf0f1;color:#555;border:none;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">
                    🚪 تسجيل الخروج
                </button>
            </div>
        `;
        setTimeout(_loadAttendanceStatus, 100);
    }

    // ═══════════════════════════════════════════════════════
    //  11. فتح صفحة
    // ═══════════════════════════════════════════════════════
    window._empOpenPage = function(pageId) {
        if (!_isPageAllowed(pageId)) {
            if (typeof toast === 'function') toast('🚫 غير مصرح لك بهذه الصفحة', 'error');
            else alert('🚫 غير مصرح لك بهذه الصفحة');
            return;
        }
        if (typeof window.openPage === 'function') {
            window.openPage(pageId);
        }
    };

    // ═══════════════════════════════════════════════════════
    //  🛡️ PERMISSION GUARD — منع الموظف من فتح صفحات غير مصرحة
    // ═══════════════════════════════════════════════════════
    function _isPageAllowed(pageId) {
        // المدير: مسموح له كل شيء
        const isEmp = currentUser && (currentUser.businessType === 'موظفين' || currentUser.ownerUid);
        if (!isEmp) return true;

        // صفحات شخصية دائماً مسموحة
        const alwaysAllowed = [
            'profile', 'support', 'bug-report', 'settings',
            'activity-employees-hub', 'my-subscription'
        ];
        if (alwaysAllowed.indexOf(pageId) >= 0) return true;

        // الصفحات المسموحة من الدور
        const allowed = currentUser.rolePages || currentUser.employeePages || currentUser.pages || [];
        if (allowed.indexOf(pageId) >= 0) return true;

        return false;
    }
    window._isPageAllowed = _isPageAllowed;

    // ═══════════════════════════════════════════════════════
    //  🔒 PATCH openPage — حماية شاملة للموظف
    // ═══════════════════════════════════════════════════════
    function _installEmployeeGuard() {
        if (window._openPagePatched) return;
        if (typeof window.openPage !== 'function') {
            setTimeout(_installEmployeeGuard, 500);
            return;
        }

        const _orig = window.openPage;
        window.openPage = function(pageId) {
            if (!_isPageAllowed(pageId)) {
                console.log('🚫 [guard] منع فتح:', pageId);
                if (typeof toast === 'function') toast('🚫 غير مصرح لك بهذه الصفحة', 'error');
                return;
            }
            return _orig.apply(this, arguments);
        };
        window._openPagePatched = true;
        window._originalOpenPage = _orig;
        console.log('🔒 [employees] guard installed');
    }

    // بدء التثبيت عند تحميل الموظف
    (function waitForAuth() {
        const iv = setInterval(() => {
            if (typeof currentUser !== 'undefined' && currentUser && currentUser.ownerUid) {
                clearInterval(iv);
                _installEmployeeGuard();
            }
        }, 800);
        // محاولة أولى فوراً
        setTimeout(_installEmployeeGuard, 1500);
    })();

    // ═══════════════════════════════════════════════════════
    //  12. طلب الانسحاب
    // ═══════════════════════════════════════════════════════
    window._empRequestLeave = function() {
        const msg = '🚪 طلب الانسحاب من الفريق\\n\\n' +
                    'سيُرسل طلبك إلى المدير.\\n' +
                    'سيتم إلغاء ارتباطك بعد موافقته.\\n\\n' +
                    'هل أنت متأكد؟';
        if (!confirm(msg)) return;

        // يُحفظ الطلب في Firestore
        const uid = auth?.currentUser?.uid;
        const ownerUid = currentUser?.ownerUid;
        if (!uid || !ownerUid || !db) {
            alert('⚠️ لا يمكن إرسال الطلب');
            return;
        }

        db.collection('users').doc(uid).update({
            leaveRequested: true,
            leaveRequestedAt: Date.now()
        }).then(() => {
            if (typeof toast === 'function') toast('✅ تم إرسال الطلب للمدير', 'success');
            // عرض رسالة تأكيد
            alert('✅ تم إرسال طلب الانسحاب للمدير.\\n\\nستُنقل بعد الموافقة.');
        }).catch(e => {
            alert('⚠️ ' + e.message);
        });
    };

    // ═══════════════════════════════════════════════════════
    //  13. تسجيل الخروج
    // ═══════════════════════════════════════════════════════
    window._empLogout = function() {
        if (!confirm('🚪 تسجيل الخروج؟')) return;
        try { localStorage.clear(); } catch(e) {}
        if (typeof auth !== 'undefined' && auth) {
            auth.signOut().then(() => location.reload()).catch(() => location.reload());
        } else {
            location.reload();
        }
    };

    // ═══════════════════════════════════════════════════════
    //  14. فتح صفحة الموظف
    // ═══════════════════════════════════════════════════════
    window.openEmployeesHub = function() {
        let cont = document.getElementById('activity-employees-hub');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'activity-employees-hub';
            cont.style.display = 'none';
            document.body.appendChild(cont);
            console.log('👤 [employees] container created');
        }

        if (typeof openPage === 'function') {
            openPage('activity-employees-hub');
        } else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }

        setTimeout(() => renderEmployeeHub(cont), 100);
    };

    // ═══════════════════════════════════════════════════════
    //  15. HOOK — عند فتح التطبيق (نشاط موظفين)
    // ═══════════════════════════════════════════════════════
    (function autoOpenForEmployees() {
        if (typeof auth === 'undefined' || !auth) return;

        let _opened = false;

        auth.onAuthStateChanged(function(user) {
            if (!user || _opened) return;
            _opened = true;

            // انتظر تحميل currentUser
            let tries = 0;
            const interval = setInterval(async () => {
                tries++;

                // احصل على businessType
                let bt = (typeof currentUser !== 'undefined' && currentUser?.businessType) || '';

                // لو ما محمّل → اقرأ من Firestore
                if (!bt && auth.currentUser) {
                    try {
                        const doc = await db.collection('users').doc(auth.currentUser.uid).get();
                        if (doc.exists) {
                            bt = doc.data().businessType || '';
                            // دمج في currentUser
                            if (typeof currentUser === 'object' && currentUser) {
                                Object.assign(currentUser, doc.data());
                            }
                        }
                    } catch(e) {}
                }

                // فحص النشاط
                if (bt === 'موظفين') {
                    clearInterval(interval);
                    console.log('👤 [employees] نشاط موظفين — فتح الصفحة');
                    setTimeout(() => openEmployeesHub(), 100);
                    return;
                }

                if (tries > 20) {
                    clearInterval(interval);
                }
            }, 500);
        });

        console.log('👤 [employees] v1.0.0 ready');
    })();

    // ═══════════════════════════════════════════════════════
    //  16. EXPORT
    // ═══════════════════════════════════════════════════════
    async function _loadAttendanceStatus() {
        const el = document.getElementById('attendanceDetail');
        if (!el || typeof window._getTodayAttendance !== 'function') return;
        try {
            const rec = await window._getTodayAttendance();
            if (!rec || !rec.checkIn) {
                el.textContent = '❌ لم تسجّل حضورك اليوم';
                el.style.color = '#e74c3c';
            } else if (!rec.checkOut) {
                const t = new Date(rec.checkIn).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });
                el.textContent = '🟢 منذ ' + t;
                el.style.color = '#27ae60';
            } else {
                el.textContent = '✅ ' + rec.hours + ' ساعة';
                el.style.color = '#27ae60';
            }
        } catch(e) { el.textContent = '-'; }
    }

    window.renderEmployeeHub = renderEmployeeHub;

})();
