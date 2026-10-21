// ============================================================
//  📱 RESTAURANT QR — قائمة طعام عبر QR للطاولات
//  v1.0.0 — 21 سبتمبر 2026
// ============================================================

(function() {
    'use strict';

    const QR_BASE_URL = 'https://jasoft-8bae9.web.app/customer.html';

    // ═══ توليد رمز فريد ═══
    function _qrGenCode(tableNumber) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const p1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
        return `TBL${tableNumber}-${p1}`;
    }

    // ═══ توليد صورة QR → dataURL ═══
    function _qrRender(text, size) {
        return new Promise((resolve) => {
            const div = document.createElement('div');
            try {
                new QRCode(div, {
                    text: text,
                    width: size || 220,
                    height: size || 220,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
                setTimeout(() => {
                    const canvas = div.querySelector('canvas');
                    const img = div.querySelector('img');
                    if (canvas) { resolve(canvas.toDataURL('image/png')); return; }
                    if (img) { resolve(img.src); return; }
                    resolve('');
                }, 150);
            } catch(e) {
                console.error('[qr]', e);
                resolve('');
            }
        });
    }

    function _qrCopy(text) {
        const done = () => { if (typeof toast === 'function') toast('✅ تم النسخ', 'success'); else alert('✅ تم النسخ'); };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(done).catch(() => _qrCopyFallback(text, done));
        } else {
            _qrCopyFallback(text, done);
        }
    }
    function _qrCopyFallback(text, cb) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch(e) {}
        ta.remove(); cb();
    }

    function _qrBuildUrl(code) {
        return QR_BASE_URL + '?table=' + encodeURIComponent(code);
    }

    // ═══ فتح الصفحة ═══
    window.openRestaurantQRManager = async function() {
        let cont = document.getElementById('page-restaurant-qr');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-restaurant-qr';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-restaurant-qr');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _qrRenderPage(cont), 100);
    };

    // ═══ عرض الصفحة ═══
    async function _qrRenderPage(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        if (!currentUser?.uid || !db) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">يجب تسجيل الدخول</div>';
            return;
        }

        // ① عدد الطاولات (من إعدادات المطعم — افتراضي 20)
        const tableCount = Math.max(1, parseInt(window._restTableCount) || 20);

        // ② اقرأ الأكواد الموجودة — مفتاحها رقم الطاولة
        const codesByNum = {};   // {tableNumber: code}
        try {
            const snap = await db.collection('public_tables')
                .where('ownerUid', '==', currentUser.uid).get();
            snap.forEach(d => {
                const data = d.data();
                const num = data.tableNumber;
                if (num != null) codesByNum[num] = d.id;
            });
        } catch(e) { console.warn('[qr] codes:', e); }

        window._qrCodesByNum = codesByNum;
        window._qrTableCount = tableCount;

        // ③ عرض بطاقة لكل رقم طاولة
        let tableCardsHtml = '';
        for (let i = 1; i <= tableCount; i++) {
            const code = codesByNum[i] || null;
            tableCardsHtml += _qrTableCard(i, code);
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">📱 رمز QR للطاولات</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">${tableCount} طاولة — عندما يمسح العميل الرمز، يفتح قائمة الطعام ويطلب مباشرة</p>
            <div style="background:linear-gradient(135deg,#fff8e1,#ffe0b2);border-radius:12px;padding:14px;margin-bottom:15px;border:2px solid #f39c12;">
                <div style="font-size:13px;color:#856404;line-height:1.7;margin-bottom:10px;">
                    <b>💡 خطوتان:</b><br>
                    ① اضغط <b>📤 نشر القائمة</b> — ليرى العملاء الأطباق<br>
                    ② اضغط <b>🔄 توليد الرموز</b> — لإنشاء QR لكل طاولة
                </div>
                <button onclick="_qrPublishMenu()" style="width:100%;padding:14px;background:linear-gradient(135deg,#e67e22,#d35400);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(230,126,34,0.3);">📤 نشر القائمة للعملاء</button>
                <div id="qrPublishStatus" style="font-size:12px;color:#856404;text-align:center;margin-top:8px;min-height:16px;"></div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:15px;">
                <button onclick="_qrGenerateAll()" style="padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">🔄 توليد الرموز</button>
                <button onclick="_qrPrintAll()" style="padding:12px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ طباعة الكل</button>
            </div>
            <div id="qrTablesList" style="display:grid;gap:10px;">${tableCardsHtml}</div>
        `;

        for (let i = 1; i <= tableCount; i++) {
            const code = codesByNum[i];
            if (code) _qrAttachImage(code);
        }
    }

    function _qrTableCard(tableNumber, code) {
        if (!code) {
            return `
                <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid #95a5a6;">
                    <div style="font-weight:700;color:#2c3e50;font-size:15px;margin-bottom:8px;">🪑 طاولة ${tableNumber}</div>
                    <div style="font-size:12px;color:#999;margin-bottom:10px;">لا يوجد رمز بعد</div>
                    <button onclick="_qrGenerateOne(${tableNumber})" style="width:100%;padding:10px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✨ إنشاء رمز</button>
                </div>
            `;
        }
        return `
            <div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid #27ae60;">
                <div style="font-weight:700;color:#2c3e50;font-size:15px;margin-bottom:4px;">🪑 طاولة ${tableNumber}</div>
                <div style="font-size:11px;color:#666;font-family:monospace;margin-bottom:8px;">🔑 ${code}</div>
                <div style="text-align:center;margin-bottom:10px;">
                    <div id="qr-img-${code}" style="display:inline-block;padding:8px;background:#fff;border:2px solid #27ae60;border-radius:8px;min-width:180px;min-height:180px;"></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px;">
                    <button onclick="_qrCopyLink('${code}')" style="padding:8px;background:#3498db;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">📋 نسخ</button>
                    <button onclick="_qrPrint('${code}', ${tableNumber})" style="padding:8px;background:#34495e;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🖨️ طباعة</button>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
                    <button onclick="_qrShareWA('${code}', ${tableNumber})" style="padding:8px;background:#25D366;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">📱 واتساب</button>
                    <button onclick="_qrDeleteCode('${code}')" style="padding:8px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🗑️ حذف</button>
                </div>
            </div>
        `;
    }

    async function _qrAttachImage(code) {
        const el = document.getElementById('qr-img-' + code);
        if (!el) return;
        el.innerHTML = '<div style="color:#999;padding:20px;">⏳</div>';
        const dataUrl = await _qrRender(_qrBuildUrl(code), 180);
        if (!dataUrl) { el.innerHTML = '<div style="color:#e74c3c;padding:20px;">❌</div>'; return; }
        el.innerHTML = `<img src="${dataUrl}" style="width:180px;height:180px;display:block;" data-code="${code}">`;
    }

    window._qrGenerateOne = async function(tableNumber) {
        try {
            if (!currentUser?.uid || !db) return;
            const code = _qrGenCode(tableNumber);
            await db.collection('public_tables').doc(code).set({
                ownerUid: currentUser.uid,
                tableNumber: tableNumber,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            const c = document.getElementById('page-restaurant-qr');
            if (c) _qrRenderPage(c);
        } catch(e) {
            console.error('[qr]', e);
            alert('❌ ' + e.message);
        }
    };

    window._qrGenerateAll = async function() {
        const tableCount = window._qrTableCount || 20;
        const codesByNum = window._qrCodesByNum || {};
        const missing = [];
        for (let i = 1; i <= tableCount; i++) {
            if (!codesByNum[i]) missing.push(i);
        }
        if (missing.length === 0) { alert('✅ كل الطاولات لها رموز'); return; }
        if (!confirm(`توليد ${missing.length} رمز؟`)) return;
        for (const num of missing) {
            const code = _qrGenCode(num);
            try {
                await db.collection('public_tables').doc(code).set({
                    ownerUid: currentUser.uid,
                    tableNumber: num,
                    active: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch(e) { console.error(e); }
        }
        const c = document.getElementById('page-restaurant-qr');
        if (c) _qrRenderPage(c);
    };

    window._qrCopyLink = function(code) { _qrCopy(_qrBuildUrl(code)); };

    window._qrPrint = async function(code, tableNumber) {
        const dataUrl = await _qrRender(_qrBuildUrl(code), 400);
        const w = window.open('', '_blank');
        w.document.write(`<html><head><title>QR طاولة ${tableNumber}</title></head><body style="text-align:center;font-family:Arial;padding:30px;"><h1 style="margin:0;">مطعم</h1><h2>طاولة ${tableNumber}</h2><p>امسح الرمز لعرض القائمة والطلب</p><img src="${dataUrl}" style="width:400px;height:400px;"/><p style="font-size:12px;color:#666;">${code}</p><scr` + `ipt>setTimeout(() => window.print(), 500);</scr` + `ipt></body></html>`);
        w.document.close();
    };

    window._qrPrintAll = async function() {
        const tableCount = window._qrTableCount || 20;
        const codesByNum = window._qrCodesByNum || {};
        const list = [];
        for (let i = 1; i <= tableCount; i++) {
            if (codesByNum[i]) list.push({ num: i, code: codesByNum[i] });
        }
        if (list.length === 0) { alert('لا توجد رموز للطباعة'); return; }
        const w = window.open('', '_blank');
        let html = '<html><head><title>QR الطاولات</title></head><body style="font-family:Arial;padding:20px;"><h1 style="text-align:center;">رموز QR للطاولات</h1>';
        for (const item of list) {
            const dataUrl = await _qrRender(_qrBuildUrl(item.code), 300);
            html += `<div style="text-align:center;page-break-after:always;padding:20px;"><h2>طاولة ${item.num}</h2><img src="${dataUrl}" style="width:300px;height:300px;"/><p style="font-size:11px;color:#666;">${item.code}</p></div>`;
        }
        html += '<scr' + 'ipt>setTimeout(() => window.print(), 1000);</scr' + 'ipt></body></html>';
        w.document.write(html);
        w.document.close();
    };

    window._qrShareWA = function(code, tableNumber) {
        const url = _qrBuildUrl(code);
        const text = `🍽️ مرحباً\n\nرابط قائمة الطعام لطاولة ${tableNumber}:\n${url}\n\nامسح رمز QR أو اضغط الرابط`;
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    };

    window._qrDeleteCode = async function(code) {
        if (!confirm('🗑️ حذف رمز الطاولة؟')) return;
        try {
            await db.collection('public_tables').doc(code).delete();
            const c = document.getElementById('page-restaurant-qr');
            if (c) _qrRenderPage(c);
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    // ═══ نشر القائمة للعملاء ═══
    window._qrPublishMenu = async function() {
        const statusEl = document.getElementById('qrPublishStatus');
        const setStatus = (msg, color) => {
            if (statusEl) {
                statusEl.textContent = msg;
                statusEl.style.color = color || '#856404';
            }
        };
        try {
            if (!currentUser?.uid || !db) {
                setStatus('❌ يجب تسجيل الدخول', '#e74c3c');
                return;
            }
            setStatus('⏳ جاري قراءة الأطباق...', '#3498db');

            // ① اقرأ الأطباق من activities/restaurant/menu
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            let items = [];
            try {
                const snap = await db.collection('users').doc(uid)
                    .collection('activities').doc('restaurant')
                    .collection('pages').doc('menu')
                    .collection('items').get();
                snap.forEach(d => {
                    const data = d.data();
                    items.push({
                        id: d.id,
                        itemName: data.itemName || '',
                        category: data.category || 'main',
                        price: Number(data.price) || 0,
                        description: data.description || '',
                        available: data.available !== false,
                        portionSize: data.portionSize || '',
                        image: data.image || null
                    });
                });
            } catch(e) {
                console.warn('[publish] read items:', e.message);
            }

            if (items.length === 0) {
                setStatus('⚠️ لا توجد أطباق — أضفها من "قائمة الطعام" أولاً', '#e74c3c');
                return;
            }

            setStatus(`⏳ نشر ${items.length} طبق...`, '#3498db');

            // ② اقرأ اسم المطعم والعملة
            const bizName = (typeof settings !== 'undefined' && settings?.businessName)
                || currentUser?.businessName || 'مطعم';
            const currency = (typeof settings !== 'undefined' && settings?.currency)
                || currentUser?.displayCurrency || 'SYP';
            const currencyLabel = currency === 'SYP' ? 'ل.س'
                : currency === 'USD' ? '$'
                : currency === 'SAR' ? 'ر.س'
                : currency === 'AED' ? 'د.إ'
                : currency === 'EGP' ? 'ج.م'
                : currency === 'TRY' ? '₺'
                : currency === 'LBP' ? 'ل.ل'
                : currency;

            // ③ اكتب public_menus/{uid}
            await db.collection('public_menus').doc(uid).set({
                ownerUid: uid,
                businessName: bizName,
                currency: currencyLabel,
                items: items,
                itemsCount: items.length,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                publishedBy: currentUser.uid
            }, { merge: true });

            setStatus(`✅ تم نشر ${items.length} طبق`, '#27ae60');
            if (typeof toast === 'function') toast(`✅ تم نشر ${items.length} طبق`, 'success');
            else alert(`✅ تم نشر ${items.length} طبق`);

        } catch(e) {
            console.error('[publish]', e);
            setStatus('❌ ' + e.message, '#e74c3c');
        }
    };

    console.log('📱 [restaurant-qr] ready');
})();
