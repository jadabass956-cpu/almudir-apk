// ============================================================
//  🖥️ TABLET MANAGER — إدارة أجهزة التابلت
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function _generateToken(len) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const bytes = new Uint8Array(len || 32);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => chars[b % chars.length]).join('');
    }

    function _generateDeviceId() {
        return 'tbl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function _copy(text, msg) {
        const done = () => { if (typeof toast === 'function') toast(msg || '✅ تم النسخ', 'success'); else alert('✅ تم النسخ'); };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(done).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); } catch(e) {}
                ta.remove(); done();
            });
        } else {
            const ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch(e) {}
            ta.remove(); done();
        }
    }

    // ═══ فتح صفحة الإدارة ═══
    window.openTabletManager = async function() {
        let cont = document.getElementById('page-tablet-manager');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-tablet-manager';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-tablet-manager');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        await _render(cont);
    };

    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        if (!currentUser?.uid || !db) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">يجب تسجيل الدخول</div>';
            return;
        }

        let devices = [];
        try {
            const snap = await db.collection('public_tablet_devices')
                .where('ownerUid', '==', currentUser.uid).get();
            snap.forEach(d => devices.push({ id: d.id, ...d.data() }));
            devices.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
        } catch(e) {
            console.error('[tablet-manager]', e);
        }

        let devicesHtml = '';
        if (devices.length === 0) {
            devicesHtml = `
                <div style="text-align:center;padding:30px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">🖥️</div>
                    <div style="font-size:15px;font-weight:600;">لا توجد أجهزة تابلت</div>
                    <div style="font-size:13px;margin-top:6px;">أنشئ رابطاً وافتحه على التابلت</div>
                </div>`;
        } else {
            devices.forEach(d => {
                const created = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('ar-SY') : '—';
                const lastSeen = d.lastSeenAt?.toDate ? d.lastSeenAt.toDate().toLocaleString('ar-SY') : 'لم يُفتح بعد';
                const isActive = d.active === true;
                const url = `https://jasoft-8bae9.web.app/tablet.html?o=${currentUser.uid}&d=${d.id}&k=${d.token}`;

                devicesHtml += `
                    <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${isActive ? '#27ae60' : '#95a5a6'};">
                        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:700;color:#2c3e50;font-size:15px;">🖥️ ${_esc(d.label || 'تابلت')}</div>
                                <div style="font-size:11px;color:#666;margin-top:3px;">📅 أُنشئ: ${_esc(created)}</div>
                                <div style="font-size:11px;color:#666;">🕐 آخر ظهور: ${_esc(lastSeen)}</div>
                            </div>
                            <div style="text-align:left;">
                                <span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${isActive ? '#d4edda' : '#f8d7da'};color:${isActive ? '#155724' : '#721c24'};">
                                    ${isActive ? '✅ نشط' : '🚫 معطّل'}
                                </span>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                            <button onclick="_tabletCopyUrl('${_esc(url)}')" style="padding:9px;background:#3498db;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">📋 نسخ الرابط</button>
                            <button onclick="_tabletTestUrl('${_esc(url)}')" style="padding:9px;background:#8e44ad;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🧪 اختبار</button>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;">
                            <button onclick="_tabletRename('${_esc(d.id)}', '${_esc((d.label||'').replace(/'/g,"\\\\'"))}')" style="padding:9px;background:#f39c12;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">✏️ تسمية</button>
                            <button onclick="_tabletDelete('${_esc(d.id)}', '${_esc((d.label||'تابلت').replace(/'/g,"\\\\'"))}')" style="padding:9px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🗑️ إلغاء</button>
                        </div>
                    </div>`;
            });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">🖥️ شاشات التابلت</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">أنشئ روابط للتابلت — يعرض QR للحضور + إحصائيات</p>

            <button onclick="_tabletCreate()" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:15px;box-shadow:0 3px 10px rgba(39,174,96,0.3);">
                ➕ إنشاء شاشة تابلت جديدة
            </button>

            <div>${devicesHtml}</div>

            <div style="background:#fff8e1;border-radius:10px;padding:12px;margin-top:15px;border-right:4px solid #f39c12;">
                <div style="font-size:12px;color:#856404;line-height:1.7;">
                    💡 <b>كيف يعمل؟</b><br>
                    ① اضغط "إنشاء شاشة تابلت جديدة"<br>
                    ② انسخ الرابط وافتحه على التابلت<br>
                    ③ ضع التابلت عند المدخل<br>
                    ④ الموظفون يمسحون QR لتسجيل الحضور<br>
                    ⑤ ألغِ الرابط إذا فُقد التابلت
                </div>
            </div>
        `;
    }

    // ═══ إنشاء جهاز جديد ═══
    window._tabletCreate = async function() {
        const label = prompt('📝 اسم الشاشة:', 'تابلت المدخل');
        if (label === null) return;
        const cleanLabel = (label || '').trim() || 'تابلت';

        try {
            const deviceId = _generateDeviceId();
            const token = _generateToken(32);

            await db.collection('public_tablet_devices').doc(deviceId).set({
                ownerUid: currentUser.uid,
                label: cleanLabel,
                token: token,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const url = `https://jasoft-8bae9.web.app/tablet.html?o=${currentUser.uid}&d=${deviceId}&k=${token}`;

            // عرض modal بالرابط + QR
            _showCreatedModal(cleanLabel, url);

            // إعادة تحميل
            const c = document.getElementById('page-tablet-manager');
            if (c) _render(c);
        } catch(e) {
            console.error(e);
            alert('❌ ' + e.message);
        }
    };

    function _showCreatedModal(label, url) {
        const old = document.getElementById('tabletCreatedModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'tabletCreatedModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:480px;width:100%;padding:22px;box-sizing:border-box;text-align:center;">
                <div style="font-size:48px;margin-bottom:10px;">✅</div>
                <h2 style="margin:0 0 8px;font-size:18px;color:#27ae60;">تم إنشاء الشاشة!</h2>
                <p style="color:#666;font-size:13px;margin:0 0 15px;">"${_esc(label)}"</p>

                <div id="tabletQrBox" style="text-align:center;margin-bottom:15px;padding:12px;background:#f8f9fa;border-radius:12px;">
                    <div style="font-size:12px;color:#666;margin-bottom:8px;">📱 امسح لعرض الرابط</div>
                    <div id="tabletQrContainer" style="display:inline-block;padding:8px;background:white;border-radius:8px;"></div>
                </div>

                <div style="background:#f0f7ff;border:1px solid #3498db;border-radius:10px;padding:10px;margin-bottom:12px;word-break:break-all;font-size:11px;font-family:monospace;color:#2c3e50;text-align:left;direction:ltr;">
                    ${_esc(url)}
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <button onclick="_tabletCopyUrl('${_esc(url)}')" style="padding:12px;background:#3498db;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">📋 نسخ</button>
                    <button onclick="_tabletTestUrl('${_esc(url)}')" style="padding:12px;background:#8e44ad;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🧪 افتح هنا</button>
                </div>

                <button onclick="document.getElementById('tabletCreatedModal').remove()" style="width:100%;padding:12px;background:#95a5a6;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;">إغلاق</button>
            </div>
        `;
        document.body.appendChild(modal);

        // عرض QR
        setTimeout(() => {
            const el = document.getElementById('tabletQrContainer');
            if (el && typeof QRCode !== 'undefined') {
                el.innerHTML = '';
                new QRCode(el, { text: url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.H });
            }
        }, 150);
    }

    // ═══ نسخ الرابط ═══
    window._tabletCopyUrl = function(url) {
        _copy(url, '✅ تم نسخ رابط التابلت');
    };

    // ═══ اختبار ═══
    window._tabletTestUrl = function(url) {
        window.open(url, '_blank');
    };

    // ═══ تسمية ═══
    window._tabletRename = async function(deviceId, currentLabel) {
        const newLabel = prompt('📝 الاسم الجديد:', currentLabel || 'تابلت');
        if (newLabel === null) return;
        try {
            await db.collection('public_tablet_devices').doc(deviceId).update({
                label: (newLabel || '').trim() || 'تابلت'
            });
            const c = document.getElementById('page-tablet-manager');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    // ═══ إلغاء ═══
    window._tabletDelete = async function(deviceId, label) {
        if (!confirm('🗑️ إلغاء "' + label + '"؟\\n\\nالتابلت سيتوقف عن العمل فوراً.')) return;
        try {
            await db.collection('public_tablet_devices').doc(deviceId).delete();
            if (typeof toast === 'function') toast('✅ تم الإلغاء', 'success');
            const c = document.getElementById('page-tablet-manager');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    console.log('🖥️ [tablet-manager] ready');
})();
