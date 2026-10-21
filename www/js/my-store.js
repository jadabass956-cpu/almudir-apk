// ============================================================
//  🏪 MY STORE — متجري الإلكتروني (رابط عام)
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // ═══ فتح الصفحة ═══
    window.openMyStore = function() {
        let cont = document.getElementById('page-my-store');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-my-store';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-my-store');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => {
            _render(cont);
            // ⭐ تحميل شارة التقييمات
            if (typeof window._storeLoadReviewsBadge === 'function') {
                window._storeLoadReviewsBadge();
            }
        }, 100);
    };

    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        if (!currentUser?.uid) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">يجب تسجيل الدخول</div>';
            return;
        }

        const bizName = currentUser.businessName || 'متجري';
        const bizType = currentUser.businessType || '';
        const phone = currentUser.phone || '';

        // تحقق من البيانات الأساسية
        const hasInfo = !!(currentUser.businessName && currentUser.phone);
        const hasMenu = await _checkMenu();

        let warningsHtml = '';
        if (!hasInfo) {
            warningsHtml += `
                <div style="background:#fff3cd;border-right:4px solid #f39c12;border-radius:8px;padding:12px;margin-bottom:10px;font-size:13px;color:#856404;">
                    ⚠️ <b>أكمل معلومات نشاطك</b><br>
                    <span style="font-size:12px;">من "الملف الشخصي" — اسم المحل + رقم الهاتف</span>
                </div>`;
        }
        if (!hasMenu) {
            warningsHtml += `
                <div style="background:#f8d7da;border-right:4px solid #e74c3c;border-radius:8px;padding:12px;margin-bottom:10px;font-size:13px;color:#721c24;">
                    ⚠️ <b>لا توجد منتجات منشورة</b><br>
                    <span style="font-size:12px;">${bizType === 'مطعم' ? 'انشر القائمة من "رموز QR للطاولات"' : 'أضف منتجات أولاً'}</span>
                </div>`;
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">🏪 متجري الإلكتروني</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">متجرك الإلكتروني — يستقبل الطلبات من العملاء</p>

            ${warningsHtml}

            <div style="background:linear-gradient(135deg,#fff8e1,#ffe0b2);border-radius:12px;padding:14px;margin-bottom:15px;border:2px solid #f39c12;">
                <div style="font-size:13px;color:#856404;line-height:1.7;margin-bottom:10px;">
                    <b>📦 الخطوة 1:</b> انشر منتجاتك ليظهرها المتجر للعملاء
                </div>
                <button onclick="_storePublishItems()" style="width:100%;padding:14px;background:linear-gradient(135deg,#e67e22,#d35400);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(230,126,34,0.3);">
                    🔄 نشر / تحديث المتجر
                </button>
                <div id="storePublishStatus" style="font-size:12px;color:#856404;text-align:center;margin-top:8px;min-height:16px;"></div>
            </div>

            <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:15px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="font-size:14px;font-weight:700;color:#2c3e50;">⭐ تقييمات العملاء</div>
                    <div id="storeReviewsBadge" style="font-size:11px;font-weight:700;background:linear-gradient(135deg,#f39c12,#e67e22);color:white;padding:3px 10px;border-radius:12px;">—</div>
                </div>
                <div style="font-size:12px;color:#666;margin-bottom:12px;">اعرض التقييمات والتعليقات من عملائك</div>
                <button onclick="_storeOpenReviews()" style="width:100%;padding:12px;background:linear-gradient(135deg,#f39c12,#e67e22);color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">💬 عرض التقييمات</button>
            </div>

            <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:15px;">
                <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:12px;">⚙️ إعدادات المتجر</div>
                <div style="font-size:12px;color:#666;margin-bottom:12px;">الحد الأدنى للطلب، رسوم التوصيل، ساعات العمل</div>
                <button onclick="_storeOpenSettings()" style="width:100%;padding:12px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">⚙️ فتح الإعدادات</button>
            </div>

            <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:15px;">
                <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:12px;">👁️ معاينة المتجر</div>
                <div style="font-size:12px;color:#666;margin-bottom:12px;">شاهد متجرك كما يراه العميل</div>
                <button onclick="_storePreviewModal()" style="width:100%;padding:12px;background:linear-gradient(135deg,#8e44ad,#6c3483);color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">👁️ معاينة المتجر</button>
            </div>

            <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:15px;">
                <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:12px;">📋 طلبات المتجر</div>
                <div style="font-size:12px;color:#666;margin-bottom:10px;">إدارة الطلبات القادمة من الرابط العام</div>
                <button onclick="openStoreOrders()" style="width:100%;padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">📋 عرض الطلبات</button>
            </div>

            <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:15px;">
                <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:12px;">💰 تقرير الأرباح</div>
                <div style="font-size:12px;color:#666;margin-bottom:10px;">الأرباح والمنتجات الأكثر مبيعاً</div>
                <button onclick="openStoreReports()" style="width:100%;padding:12px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">💰 عرض التقرير</button>
            </div>

            <div style="background:#f0f7ff;border-radius:10px;padding:12px;border-right:4px solid #3498db;">
                <div style="font-size:12px;color:#555;line-height:1.7;">
                    💡 <b>كيف يعمل؟</b><br>
                    ① انسخ الرابط وشاركه مع عملائك<br>
                    ② أو اطبع QR وضعه في واجهة المحل<br>
                    ③ العميل يطلب → يصلك الطلب هنا<br>
                    ④ تتصل للتأكيد → ترسل → تستلم المبلغ
                </div>
            </div>
        `;

    }

    async function _checkMenu() {
        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const snap = await db.collection('public_menus').doc(uid).get();
            if (!snap.exists) return false;
            const data = snap.data();
            return (data.items || []).length > 0;
        } catch(e) {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  📤 نشر المنتجات → public_menus
    // ═══════════════════════════════════════════════════════
    // 👁️ معاينة المتجر (مطابقة لواجهة العميل — بلا iframe)
    window._storePreviewModal = async function() {
        document.getElementById('_storePreviewModal')?.remove();

        const modal = document.createElement('div');
        modal.id = '_storePreviewModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:10px;';
        modal.onclick = (e) => { if (e.target === modal) window._storeClosePreview(); };

        modal.innerHTML = `
            <div style="width:100%;max-width:480px;height:92vh;background:white;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                <div style="background:#2c3e50;color:white;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                    <div style="font-size:14px;font-weight:800;">👁️ معاينة متجرك</div>
                    <button onclick="_storeClosePreview()" style="background:rgba(255,255,255,0.15);border:none;width:32px;height:32px;border-radius:50%;color:white;font-size:16px;cursor:pointer;font-weight:bold;font-family:inherit;">✕</button>
                </div>
                <div id="_spBody" style="flex:1;overflow-y:auto;background:#f5f7fa;">
                    <div style="text-align:center;color:#8e44ad;padding:80px 40px;">
                        <div style="font-size:44px;margin-bottom:12px;">⏳</div>
                        <div style="font-size:14px;font-weight:700;">جاري التحميل...</div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const snap = await db.collection('public_menus').doc(uid).get();

            const body = document.getElementById('_spBody');
            if (!body) return;

            if (!snap.exists) {
                body.innerHTML = '<div style="text-align:center;padding:80px 40px;color:#7f8c8d;"><div style="font-size:64px;margin-bottom:14px;">📭</div><div style="font-size:16px;font-weight:800;color:#2c3e50;margin-bottom:8px;">لم يُنشر المتجر بعد</div><div style="font-size:13px;line-height:1.6;">اضغط "🔄 نشر / تحديث المتجر"<br>لتعرضه للعملاء</div></div>';
                return;
            }

            const d = snap.data();
            const items = Array.isArray(d.items) ? d.items : [];
            const name = d.businessName || 'متجري';
            const type = d.businessType || '';
            const desc = d.businessDescription || '';
            const themeColor = d.themeColor || '#8e44ad';
            const themeColorDark = _storeDarkenHex(themeColor, 30);
            const cover = d.coverImage || null;
            const rating = d.avgRating ? Number(d.avgRating).toFixed(1) : '—';
            const ratingsCount = Number(d.ratingsCount) || 0;
            const loc = d.location || {};
            const locText = [loc.governorate, loc.town].filter(Boolean).join(' · ');
            const acceptOrders = d.acceptOrders !== false;
            const open24_7 = d.open24_7 === true;
            const closeTime = d.closeTime || '23:00';
            const deliveryFee = (Number(d.deliveryFee) || 0) + ' ل.س';
            const prepTime = Number(d.prepTime) || 30;

            const coverBg = cover
                ? "background-image: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.7)), url('" + _storeEsc(cover) + "'); background-size: cover; background-position: center;"
                : 'background: linear-gradient(135deg, ' + themeColor + ', ' + themeColorDark + ');';

            // ⭐ التقييمات
            const reviews = (Array.isArray(d.lastReviews) ? d.lastReviews : []).filter(r => r.visible !== false);
            let reviewsHtml = '';
            if (ratingsCount > 0 && reviews.length > 0) {
                const reviewCards = reviews.slice(0, 3).map(function(r) {
                    const rStars = '⭐'.repeat(Number(r.rating) || 0) + '☆'.repeat(5 - (Number(r.rating) || 0));
                    const cName = r.customerName || 'عميل';
                    const initial = cName.trim().charAt(0) || '؟';
                    const comment = r.comment ? _storeEsc(r.comment) : '';
                    return '<div style="background:#f8f9fa;border-radius:12px;padding:12px;margin-bottom:8px;border-right:3px solid ' + themeColor + ';">'
                        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
                            + '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ');color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;flex-shrink:0;">' + _storeEsc(initial) + '</div>'
                            + '<div style="flex:1;min-width:0;">'
                                + '<div style="font-size:13px;font-weight:800;color:#2c3e50;">' + _storeEsc(cName) + '</div>'
                                + '<div style="font-size:14px;letter-spacing:1px;">' + rStars + '</div>'
                            + '</div>'
                        + '</div>'
                        + (comment ? '<div style="font-size:13px;color:#4a5568;line-height:1.6;font-style:italic;">"' + comment + '"</div>' : '')
                        + (r.ownerReply ? '<div style="background:#f0f8ff;border-right:3px solid #3498db;border-radius:8px;padding:10px;margin-top:8px;"><div style="font-size:11px;color:#2980b9;font-weight:700;margin-bottom:4px;">🏪 رد المتجر:</div><div style="font-size:12px;color:#2c3e50;line-height:1.6;">' + _storeEsc(r.ownerReply) + '</div></div>' : '')
                        + '</div>';
                }).join('');

                reviewsHtml = '<div style="background:white;border-radius:14px;padding:14px;margin:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">'
                    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
                        + '<div style="font-size:15px;font-weight:900;color:#2c3e50;">⭐ آراء العملاء</div>'
                        + '<div style="text-align:left;">'
                            + '<div style="font-size:18px;font-weight:900;color:' + themeColor + ';line-height:1;">' + rating + '</div>'
                            + '<div style="font-size:10px;color:#7f8c8d;">' + ratingsCount + ' تقييم</div>'
                        + '</div>'
                    + '</div>'
                    + reviewCards
                    + '</div>';
            }

            // 🛵 بطاقة التوصيل
            const deliveryCard = '<div style="background:white;border-radius:14px;padding:14px;margin:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">'
                + '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:#7f8c8d;font-weight:700;">🛵 رسوم التوصيل</span><span style="font-weight:900;color:' + themeColor + ';">' + deliveryFee + '</span></div>'
                + '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-top:1px dashed #e9ecef;"><span style="color:#7f8c8d;font-weight:700;">⏱️ يصل خلال</span><span style="font-weight:900;color:#2c3e50;">' + prepTime + ' دقيقة</span></div>'
                + '</div>';

            // 🎯 الفئات
            const cats = {};
            items.forEach(p => { const c = p.category || 'main'; if (!cats[c]) cats[c] = 0; cats[c]++; });
            const catsHtml = Object.keys(cats).length > 1
                ? '<div style="display:flex;gap:8px;overflow-x:auto;padding:12px 14px;background:white;border-bottom:1px solid #e9ecef;">'
                    + '<span style="background:linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ');color:white;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;font-family:inherit;white-space:nowrap;">📋 الكل (' + items.length + ')</span>'
                    + Object.keys(cats).map(c => '<span style="background:white;color:#2c3e50;border:1.5px solid #e9ecef;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;font-family:inherit;white-space:nowrap;">' + _storeEsc(c) + ' (' + cats[c] + ')</span>').join('')
                    + '</div>'
                : '';

            // 📦 المنتجات
            const itemsHtml = items.length === 0
                ? '<div style="text-align:center;padding:40px 20px;color:#95a5a6;font-size:14px;">📭 لا توجد منتجات</div>'
                : items.map(function(it) {
                    const img = it.image
                        ? '<div style="width:100px;height:100px;flex-shrink:0;background-image:url(\'' + _storeEsc(it.image) + '\');background-size:cover;background-position:center;border-radius:14px;"></div>'
                        : '<div style="width:100px;height:100px;flex-shrink:0;background:#f5f7fa;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:44px;">📦</div>';
                    const price = Number(it.price) || 0;
                    const avail = it.available !== false;
                    return '<div style="background:white;border-radius:16px;padding:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);display:flex;gap:14px;align-items:center;opacity:' + (avail ? '1' : '0.5') + ';">'
                        + img
                        + '<div style="flex:1;min-width:0;">'
                            + '<div style="font-size:15px;font-weight:900;color:#2c3e50;margin-bottom:8px;line-height:1.3;">' + _storeEsc(it.itemName || '') + '</div>'
                            + '<div style="font-size:18px;font-weight:900;color:' + themeColor + ';">' + price.toLocaleString('en-US') + ' <span style="font-size:12px;font-weight:700;">ل.س</span></div>'
                        + '</div>'
                    + '</div>';
                }).join('');

            body.innerHTML = `
                <div style="width:100%;padding-bottom:20px;background:#f5f7fa;min-height:100%;">
                    <div style="${coverBg} min-height:220px;display:flex;flex-direction:column;justify-content:flex-end;padding:20px 18px 18px;color:white;position:relative;">
                        <span style="position:absolute;top:20px;right:18px;background:${acceptOrders ? '#27ae60' : '#e74c3c'};color:white;font-size:11px;font-weight:800;padding:5px 14px;border-radius:20px;">${acceptOrders ? (open24_7 ? '🟢 مفتوح 24/7' : '🟢 مفتوح حتى ' + closeTime) : '⛔ متوقف مؤقتاً'}</span>
                        <div style="font-size:26px;font-weight:900;text-shadow:0 2px 10px rgba(0,0,0,0.55);margin-bottom:8px;">${_storeEsc(name)}</div>
                        ${desc ? '<div style="font-size:13px;opacity:0.9;margin-bottom:8px;max-width:90%;">' + _storeEsc(desc) + '</div>' : ''}
                        <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:13px;">
                            ${type ? '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-weight:700;">' + _storeEsc(type) + '</span>' : ''}
                            ${locText ? '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-weight:700;">📍 ' + _storeEsc(locText) + '</span>' : ''}
                            ${ratingsCount > 0 ? '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-weight:700;">⭐ ' + rating + ' (' + ratingsCount + ')</span>' : ''}
                        </div>
                    </div>
                    ${deliveryCard}
                    ${reviewsHtml}
                    ${catsHtml}
                    <div style="display:flex;flex-direction:column;gap:10px;padding:12px;">${itemsHtml}</div>
                    <div style="text-align:center;padding:12px 14px;">
                        <div style="background:#e8f4fd;border:1px solid #3498db;border-radius:10px;padding:10px;font-size:11px;color:#2c3e50;line-height:1.6;">ℹ️ معاينة للقراءة فقط — كما يراها العميل</div>
                    </div>
                </div>`;
        } catch(e) {
            console.error('[preview]', e);
            const body = document.getElementById('_spBody');
            if (body) body.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;"><div style="font-size:44px;margin-bottom:12px;">❌</div><div style="font-size:14px;font-weight:700;">فشل التحميل</div><div style="font-size:12px;margin-top:8px;color:#7f8c8d;">' + _storeEsc(e.message || '') + '</div></div>';
        }
    };

    window._storeClosePreview = function() {
        document.getElementById('_storePreviewModal')?.remove();
    };

    window._storePublishItems = async function() {
        const statusEl = document.getElementById('storePublishStatus');
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

            const bizType = (currentUser.businessType || '').trim();
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;

            setStatus('⏳ جاري قراءة المنتجات...', '#3498db');

            let items = [];
            let sourceType = '';

            // ═══ مطعم: من activities/restaurant/menu ═══
            if (bizType === 'مطعم') {
                sourceType = 'menu';
                try {
                    const snap = await db.collection('users').doc(uid)
                        .collection('activities').doc('restaurant')
                        .collection('pages').doc('menu')
                        .collection('items').get();
                    snap.forEach(d => {
                        const x = d.data();
                        // 🛒 فقط الأطباق المُعلّمة للنشر
                        if (x.showInStore !== true) return;
                        items.push({
                            id: d.id,
                            itemName: x.itemName || '',
                            category: x.category || 'main',
                            price: Number(x.price) || 0,
                            description: x.description || '',
                            available: x.available !== false,
                            portionSize: x.portionSize || '',
                            prepTime: x.prepTime || 0,
                            image: x.image || null
                        });
                    });
                } catch(e) {
                    console.warn('[store] menu read:', e.message);
                }
            }
            // ═══ باقي الأنشطة: من materials ═══
            else {
                sourceType = 'inventory';
                try {
                    const doc = await db.collection('users').doc(uid)
                        .collection('data').doc('main').get();
                    if (doc.exists) {
                        const data = doc.data();
                        const mats = data.materials || [];
                        mats.forEach(m => {
                            // 🛒 فقط المواد المُعلّمة للنشر
                            if (m.showInStore !== true) return;
                            items.push({
                                id: 'mat_' + (m.id || Math.random().toString(36).slice(2)),
                                itemName: m.name || '',
                                category: m.category || m.type || 'عام',
                                price: Number(m.saleSYP) || 0,
                                priceUSD: Number(m.saleUSD) || 0,
                                stock: Number(m.stock) || 0,
                                unit: m.unit || '',
                                barcode: m.barcode || '',
                                materialId: m.id || null,
                                expiryDate: m.expiryDate || '',
                                image: m.image || null,
                                available: (Number(m.stock) || 0) > 0,
                                // 🎁 عرض خاص
                                onSale: m.onSale === true,
                                oldPrice: Number(m.oldPriceSYP) || 0
                            });
                        });
                    }
                } catch(e) {
                    console.warn('[store] materials read:', e.message);
                }
            }

            if (items.length === 0) {
                setStatus('⚠️ لا توجد منتجات — أضفها أولاً', '#e74c3c');
                return;
            }

            setStatus(`⏳ نشر ${items.length} منتج...`, '#3498db');

            // اسم المتجر والعملة
            const bizName = currentUser.businessName || 'متجري';
            const currency = currentUser.displayCurrency || 'SYP';
            const currencyLabel = currency === 'SYP' ? 'ل.س'
                : currency === 'USD' ? '$'
                : currency === 'SAR' ? 'ر.س'
                : currency === 'AED' ? 'د.إ'
                : currency === 'EGP' ? 'ج.م'
                : currency === 'TRY' ? '₺'
                : currency === 'LBP' ? 'ل.ل'
                : currency;

            // ═══ كتابة public_menus ═══
            await db.collection('public_menus').doc(uid).set({
                ownerUid: uid,
                businessType: bizType,
                businessName: bizName,
                businessDescription: currentUser.businessDescription || '',
                phone: currentUser.phone || '',
                location: currentUser.location || null,
                currency: currencyLabel,
                source: sourceType,
                items: items,
                itemsCount: items.length,
                prepTime: settings?.prepTime || 30,
                deliveryTime: settings?.deliveryTime || 20,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                publishedBy: currentUser.uid
            }, { merge: true });

            setStatus(`✅ تم نشر ${items.length} منتج`, '#27ae60');
            if (typeof toast === 'function') toast(`✅ تم نشر ${items.length} منتج`, 'success');

        } catch(e) {
            console.error('[store publish]', e);
            setStatus('❌ ' + e.message, '#e74c3c');
        }
    };

    // ═══════════════════════════════════════════════════════
    //  ⚙️ إعدادات المتجر
    // ═══════════════════════════════════════════════════════
    window._storeOpenSettings = async function() {
        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const snap = await db.collection('public_menus').doc(uid).get();
            const data = snap.exists ? snap.data() : {};

            const deliveryFee = Number(data.deliveryFee) || 0;
            const prepTime = Number(data.prepTime) || 30;
            const deliveryTime = Number(data.deliveryTime) || 20;
            const minOrder = Number(data.minOrder) || 0;

            // 🆕 المناطق + GPS
            window._storeZones = Array.isArray(data.zones) ? [...data.zones] : [];
            window._storeLocation = data.storeLocation || null;
            // 🔒 قفل الموقع — يُفعّل تلقائياً إن كان محفوظاً
            window._storeLocationLocked = !!data.storeLocation;
            const openTime = data.openTime || '10:00';
            const closeTime = data.closeTime || '23:00';
            const workingDays = data.workingDays || [0,1,2,3,4,5,6];
            const acceptOrders = data.acceptOrders !== false;

            // 💳 طرق الدفع
            window._storePaymentMethods = Array.isArray(data.paymentMethods) ? [...data.paymentMethods] : [];

            const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
            const daysHtml = days.map((d, i) => `
                <label style="display:inline-block;padding:6px 12px;margin:2px;background:${workingDays.includes(i) ? '#27ae60' : '#ecf0f1'};color:${workingDays.includes(i) ? 'white' : '#555'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;">
                    <input type="checkbox" class="store-day" value="${i}" ${workingDays.includes(i) ? 'checked' : ''} style="display:none;" onchange="this.parentElement.style.background=this.checked?'#27ae60':'#ecf0f1';this.parentElement.style.color=this.checked?'white':'#555';">
                    ${d}
                </label>
            `).join('');

            const old = document.getElementById('storeSettingsModal');
            if (old) old.remove();

            const modal = document.createElement('div');
            modal.id = 'storeSettingsModal';
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
            modal.innerHTML = `
                <div style="background:white;border-radius:16px;max-width:480px;width:100%;padding:22px;box-sizing:border-box;max-height:92vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <h3 style="margin:0;font-size:17px;">⚙️ إعدادات المتجر</h3>
                        <button onclick="document.getElementById('storeSettingsModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                    </div>

                    <div id="storeFixedFeeRow">
                        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">🛵 رسوم التوصيل (ثابتة)</label>
                        <input type="number" id="storeDeliveryFee" value="${deliveryFee}" placeholder="0" min="0" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:14px;">
                    </div>

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">⏱️ وقت التحضير (دقيقة)</label>
                    <input type="number" id="storePrepTime" value="${prepTime}" placeholder="30" min="0" max="180" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:14px;">

                    <div id="storeDeliveryTimeRow">
                        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">🚗 وقت التوصيل (دقيقة)</label>
                        <input type="number" id="storeDeliveryTime" value="${deliveryTime}" placeholder="20" min="0" max="180" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:14px;">
                    </div>

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">⚠️ الحد الأدنى للطلب</label>
                    <input type="number" id="storeMinOrder" value="${minOrder}" placeholder="0" min="0" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:14px;">

                    <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">🕐 ساعات العمل</label>

                    <!-- 🆕 خيار 24/7 -->
                    <label style="display:flex;align-items:center;gap:10px;padding:12px;background:#e8f5e9;border:2px solid #27ae60;border-radius:10px;cursor:pointer;margin-bottom:10px;">
                        <input type="checkbox" name="store24_7" value="yes" ${(data.open24_7===true)?'checked':''} onchange="_storeToggle247(this.checked)" style="width:20px;height:20px;accent-color:#27ae60;cursor:pointer;">
                        <div style="flex:1;">
                            <div style="font-size:13px;font-weight:700;color:#1b5e20;">🟢 مفتوح 24/7</div>
                            <div style="font-size:11px;color:#2e7d32;margin-top:2px;">يعمل دون انقطاع طوال الأسبوع</div>
                        </div>
                    </label>

                    <div id="storeRegularHoursBlock" style="display:${(data.open24_7===true)?'none':'block'};">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
                            <div>
                                <div style="font-size:11px;color:#666;margin-bottom:4px;">من</div>
                                <input type="time" id="storeOpenTime" value="${openTime}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;">
                            </div>
                            <div>
                                <div style="font-size:11px;color:#666;margin-bottom:4px;">إلى</div>
                                <input type="time" id="storeCloseTime" value="${closeTime}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;">
                            </div>
                        </div>
                    </div>

                    <div id="storeDaysBlock" style="display:${(data.open24_7===true)?'none':'block'};">
                        <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">📅 أيام العمل</label>
                        <div style="margin-bottom:14px;">${daysHtml}</div>
                    </div>

                    <label id="storeAcceptLabel" style="display:flex;align-items:center;gap:12px;padding:16px;background:${acceptOrders ? '#e8f5e9' : '#ffebee'};border:2px solid ${acceptOrders ? '#27ae60' : '#e74c3c'};border-radius:12px;cursor:pointer;margin-bottom:16px;transition:all 0.2s;">
                        <input type="checkbox" id="storeAcceptOrders" ${acceptOrders ? 'checked' : ''} style="width:24px;height:24px;accent-color:#27ae60;cursor:pointer;" onchange="_storeToggleAccept(this.checked)">
                        <div style="flex:1;">
                            <div id="storeAcceptTitle" style="font-size:15px;font-weight:700;color:${acceptOrders ? '#1b5e20' : '#b71c1c'};margin-bottom:3px;">${acceptOrders ? '✅ الطلبات مقبولة' : '⭕ استقبال الطلبات متوقف'}</div>
                            <div id="storeAcceptDesc" style="font-size:11px;color:#666;">${acceptOrders ? 'سيتم استقبال طلبات جديدة' : 'لن تُستقبل أي طلبات جديدة'}</div>
                        </div>
                    </label>

                    <label id="storeCodLabel" style="display:flex;align-items:center;gap:12px;padding:16px;background:${(data.codEnabled !== false) ? '#e8f5e9' : '#ffebee'};border:2px solid ${(data.codEnabled !== false) ? '#27ae60' : '#e74c3c'};border-radius:12px;cursor:pointer;margin-bottom:12px;transition:all 0.2s;">
                        <input type="checkbox" id="storeCodEnabled" ${(data.codEnabled !== false) ? 'checked' : ''} style="width:24px;height:24px;accent-color:#27ae60;cursor:pointer;" onchange="_storeToggleCod(this.checked)">
                        <div style="flex:1;">
                            <div id="storeCodTitle" style="font-size:15px;font-weight:700;color:${(data.codEnabled !== false) ? '#1b5e20' : '#b71c1c'};margin-bottom:3px;">${(data.codEnabled !== false) ? '✅ الدفع عند التسليم مفعّل' : '❌ الدفع عند التسليم معطّل'}</div>
                            <div id="storeCodDesc" style="font-size:11px;color:#666;">${(data.codEnabled !== false) ? 'يمكن للعميل الدفع نقداً عند التسليم' : 'العميل يجب أن يدفع إلكترونياً'}</div>
                        </div>
                    </label>

                    <div style="border-top:2px dashed #ddd;margin:16px 0;"></div>

                    <label id="storeAutoPayLabel" style="display:flex;align-items:center;gap:12px;padding:16px;background:#f8f9fa;border:2px solid #ddd;border-radius:12px;cursor:pointer;margin-bottom:12px;transition:all 0.2s;">
                        <input type="checkbox" id="storeAutoPayEnabled" style="width:24px;height:24px;accent-color:#8e44ad;cursor:pointer;" onchange="_storeToggleAutoPay(this.checked)">
                        <div style="flex:1;">
                            <div id="storeAutoPayTitle" style="font-size:15px;font-weight:700;color:#555;margin-bottom:3px;">⚪ الدفع التلقائي (API) معطّل</div>
                            <div style="font-size:11px;color:#666;">تحقق تلقائي عبر شام / سيريتل / API Syria</div>
                        </div>
                    </label>

                    <div id="storeAutoPayBody" style="display:none;padding:14px;background:#f5f0fa;border-radius:12px;border:2px dashed #8e44ad;margin-bottom:12px;">
                        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">🏢 المزود</div>
                        <select id="storeAutoPayProvider" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:inherit;font-size:13px;margin-bottom:10px;background:white;">
                            <option value="api-syria">API Syria (موحّد — شام + سيريتل)</option>
                            <option value="sham">شام كاش (مباشر)</option>
                            <option value="syriatel">سيريتل كاش (مباشر)</option>
                        </select>

                        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">🔑 مفتاح API</div>
                        <div style="position:relative;margin-bottom:10px;">
                            <input type="password" id="storeAutoPayApiKey" placeholder="أدخل مفتاح API" style="width:100%;padding:10px 42px 10px 10px;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:13px;direction:ltr;text-align:right;box-sizing:border-box;">
                            <button type="button" onclick="_storeToggleApiKeyVisibility()" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);background:transparent;border:none;font-size:16px;cursor:pointer;padding:4px 8px;">👁️</button>
                        </div>

                        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">🆔 معرّف المحفظة</div>
                        <input type="text" id="storeAutoPayWalletId" placeholder="Wallet ID / Merchant ID" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:monospace;font-size:13px;direction:ltr;text-align:right;box-sizing:border-box;margin-bottom:10px;">

                        <button type="button" onclick="_storeTestAutoPay()" style="width:100%;padding:10px;background:linear-gradient(135deg,#8e44ad,#6a1b9a);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;">🧪 اختبار الاتصال</button>

                        <div id="storeAutoPayStatus" style="font-size:11px;color:#666;text-align:center;padding:8px;background:white;border-radius:6px;">⚪ لم يتم الاختبار بعد</div>

                        <div style="font-size:10px;color:#888;margin-top:10px;text-align:center;line-height:1.6;">🔐 المفاتيح تُخزّن مشفّرة (AES-256-GCM)<br>لا يمكن قراءتها من خارج حسابك</div>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div style="font-size:14px;font-weight:700;color:#2c3e50;">💳 طرق الدفع الإلكتروني</div>
                        <button onclick="_storeAddPaymentMethod()" style="padding:8px 14px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">➕ إضافة</button>
                    </div>

                    <div id="storePaymentMethodsList" style="margin-bottom:14px;">
                        ${(function() {
                            const methods = Array.isArray(data.paymentMethods) ? data.paymentMethods : [];
                            if (methods.length === 0) {
                                return '<div style="text-align:center;padding:20px;background:#f8f9fa;border-radius:8px;color:#999;font-size:12px;">لا توجد طرق دفع إلكتروني</div>';
                            }
                            return methods.map((m, idx) => _renderPaymentMethodRow(m, idx)).join('');
                        })()}
                    </div>

                    
                    <!-- 🗺️ مناطق التوصيل -->
                    <div style="border-top:2px dashed #ddd; margin:15px 0;"></div>
                    <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:10px;">🗺️ مناطق التوصيل</div>

                    <label style="display:flex;align-items:center;gap:8px;padding:12px;background:#fff8e1;border-radius:10px;cursor:pointer;margin-bottom:10px;">
                        <input type="checkbox" id="storeUseZones" ${(data.useZones===true)?'checked':''} onchange="document.getElementById('storeZonesBlock').style.display=this.checked?'block':'none';" style="width:20px;height:20px;accent-color:#f39c12;">
                        <span style="font-size:13px;font-weight:600;">🗺️ تفعيل مناطق التوصيل</span>
                    </label>

                    <div id="storeZonesBlock" style="display:${(data.useZones===true)?'block':'none'};margin-bottom:14px;">
                        <div style="font-size:11px;color:#856404;margin-bottom:8px;">💡 حدد مناطق التوصيل — كل منطقة لها وقت ورسوم</div>
                        <button type="button" onclick="_storeOpenZonesEditor()" style="width:100%;padding:12px;background:linear-gradient(135deg,#f39c12,#e67e22);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
                            🗺️ إدارة المناطق (<span id="storeZonesCount">${Array.isArray(data.zones)?data.zones.length:0}</span>)
                        </button>
                    </div>

                    <!-- 📍 GPS -->
                    <div style="border-top:2px dashed #ddd; margin:15px 0;"></div>
                    <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:10px;">📍 حساب المسافة (GPS)</div>

                    <label style="display:flex;align-items:center;gap:8px;padding:12px;background:#e3f2fd;border-radius:10px;cursor:pointer;margin-bottom:10px;">
                        <input type="checkbox" id="storeUseGPS" onchange="_storeToggleGPS(this.checked)" ${(data.useGPS===true)?'checked':''} style="width:20px;height:20px;accent-color:#3498db;">
                        <span style="font-size:13px;font-weight:600;">📍 حساب المسافة تلقائياً</span>
                    </label>

                    <div style="font-size:11px;color:#0d47a1;margin-bottom:10px;">💡 يحتاج تحديد موقع المطعم. يعمل بلا Google Maps.</div>

                    ${data.storeLocation
                        ? '<div style="width:100%;padding:14px;background:#f0f8ff;border:2px solid #3498db;border-radius:10px;text-align:center;margin-bottom:8px;">'
                            + '<div style="font-size:13px;font-weight:800;color:#2c3e50;margin-bottom:6px;">📍 موقع المتجر</div>'
                            + '<div style="font-size:12px;color:#3498db;font-weight:700;font-family:monospace;direction:ltr;">' + Number(data.storeLocation.lat).toFixed(4) + ', ' + Number(data.storeLocation.lng).toFixed(4) + '</div>'
                            + '<div style="font-size:12px;color:#e67e22;font-weight:800;margin-top:8px;">🔒 الموقع مقفل نهائياً</div>'
                            + '<div style="font-size:10px;color:#7f8c8d;margin-top:3px;line-height:1.5;">لتعديل الموقع، تواصل مع الإدارة</div>'
                        + '</div>'
                        : '<button type="button" onclick="_storeOpenMapPicker()" style="width:100%;padding:14px;background:linear-gradient(135deg,#8e44ad,#6a1b9a);color:white;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:8px;box-shadow:0 4px 12px rgba(142,68,173,0.3);">📍 تحديد موقع المتجر على الخريطة</button>'
                    }

                    <!-- 💰 سعر التوصيل حسب المسافة -->
                    <div style="background:#e8f5e9;border:2px solid #27ae60;border-radius:12px;padding:12px;margin-top:12px;">
                        <div style="font-size:13px;font-weight:700;color:#1b5e20;margin-bottom:8px;">💰 تسعير التوصيل (حسب المسافة)</div>

                        <label style="display:block;font-size:12px;font-weight:600;color:#2c3e50;margin-bottom:4px;">🛵 سعر 1 كم (ل.س)</label>
                        <input type="number" id="storeDistanceFeePerKm" value="${Number(data.distanceFeePerKm) || 1000}" min="0" step="50" placeholder="مثال: 1000" style="width:100%;padding:10px;border:2px solid #e9ecef;border-radius:8px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:10px;background:white;">

                        <div style="font-size:11px;color:#0d47a1;line-height:1.6;background:white;padding:8px;border-radius:6px;">
                            💡 مثال: إذا كان السعر <b>1,000 ل.س</b> والمسافة <b>10 كم</b><br>
                            → الرسوم = <b>10,000 ل.س</b>
                        </div>
                    </div>

                    <div style="border-top:2px dashed #ddd;margin:16px 0;"></div>

                    <!-- 🚗 السائقون -->
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <div style="font-size:14px;font-weight:700;color:#2c3e50;">🚗 السائقون (يظهر للعميل بعد القبول)</div>
                        <button type="button" onclick="_storeAddDriver()" style="padding:8px 14px;background:linear-gradient(135deg,#8e44ad,#6a1b9a);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">➕ إضافة</button>
                    </div>

                    <div id="storeDriversList" style="margin-bottom:14px;background:#f8f9fa;border-radius:10px;padding:10px;min-height:50px;">
                        <div style="text-align:center;color:#999;font-size:12px;padding:15px;">لا يوجد سائقون بعد</div>
                    </div>

                    <div style="font-size:11px;color:#888;text-align:center;margin-bottom:14px;">💡 السائق يختاره التاجر عند قبول الطلب</div>

                    <div style="border-top:2px dashed #ddd;margin:16px 0;"></div>

                    <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:10px;">🖼️ صورة غلاف المتجر</div>

                    <div id="storeCoverPreview" style="border-radius:12px;margin-bottom:10px;height:140px;background:#f8f9fa;border:2px dashed #ddd;display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;color:#999;font-size:13px;">لا توجد صورة</div>

                    <div style="display:flex;gap:8px;margin-bottom:8px;">
                        <button type="button" onclick="document.getElementById('storeCoverInput').click()" style="flex:1;padding:10px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">📷 اختيار صورة</button>
                        <button type="button" onclick="_storeClearCover()" style="padding:10px 14px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🗑️</button>
                    </div>
                    <input type="file" id="storeCoverInput" accept="image/*" style="display:none;" onchange="_storeOnCoverPick(this)">

                    <div style="font-size:11px;color:#888;text-align:center;margin-bottom:14px;">💡 الحجم المثالي: 1200×600 — يُضغط تلقائياً قبل الحفظ</div>

                    <div style="border-top:2px dashed #ddd;margin:16px 0;"></div>

                    <div style="font-size:14px;font-weight:700;color:#2c3e50;margin-bottom:10px;">🎨 لون المتجر</div>

                    <div id="storeThemePreview" style="border-radius:12px;padding:16px;margin-bottom:12px;text-align:center;color:white;background:linear-gradient(135deg,#e67e22,#d35400);transition:all 0.2s;">
                        <div style="font-size:15px;font-weight:700;margin-bottom:4px;">معاينة اللون</div>
                        <div style="font-size:11px;opacity:0.9;">هكذا سيظهر رأس صفحة متجرك</div>
                    </div>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;justify-content:center;">
                        <button type="button" onclick="_storeSetTheme('#e67e22')" data-theme="#e67e22" style="width:44px;height:44px;border-radius:50%;border:3px solid #ddd;background:#e67e22;cursor:pointer;padding:0;transition:all 0.15s;" title="برتقالي"></button>
                        <button type="button" onclick="_storeSetTheme('#2980b9')" data-theme="#2980b9" style="width:44px;height:44px;border-radius:50%;border:3px solid #ddd;background:#2980b9;cursor:pointer;padding:0;transition:all 0.15s;" title="أزرق"></button>
                        <button type="button" onclick="_storeSetTheme('#27ae60')" data-theme="#27ae60" style="width:44px;height:44px;border-radius:50%;border:3px solid #ddd;background:#27ae60;cursor:pointer;padding:0;transition:all 0.15s;" title="أخضر"></button>
                        <button type="button" onclick="_storeSetTheme('#8e44ad')" data-theme="#8e44ad" style="width:44px;height:44px;border-radius:50%;border:3px solid #ddd;background:#8e44ad;cursor:pointer;padding:0;transition:all 0.15s;" title="بنفسجي"></button>
                        <button type="button" onclick="_storeSetTheme('#c0392b')" data-theme="#c0392b" style="width:44px;height:44px;border-radius:50%;border:3px solid #ddd;background:#c0392b;cursor:pointer;padding:0;transition:all 0.15s;" title="أحمر"></button>
                        <button type="button" onclick="_storeSetTheme('#2c3e50')" data-theme="#2c3e50" style="width:44px;height:44px;border-radius:50%;border:3px solid #ddd;background:#2c3e50;cursor:pointer;padding:0;transition:all 0.15s;" title="أسود"></button>
                        <label style="width:44px;height:44px;border-radius:50%;border:3px dashed #8e44ad;cursor:pointer;display:flex;align-items:center;justify-content:center;background:white;font-size:18px;transition:all 0.15s;" title="لون مخصص">
                            🎨
                            <input type="color" id="storeThemeCustom" value="#e67e22" oninput="_storeSetTheme(this.value); this.parentElement.style.borderColor='#2c3e50'; this.parentElement.style.borderStyle='solid';" style="display:none;">
                        </label>
                    </div>

                    <div style="font-size:11px;color:#888;text-align:center;margin-bottom:14px;">اختر لوناً لمتجرك — يُطبّق على صفحة العميل</div>

                    <button onclick="_storeSaveSettings()" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">💾 حفظ الإعدادات</button>
                </div>
            `;
            document.body.appendChild(modal);

            // 🆕 GPS: طلب الموقع تلقائياً إذا كان مفعّلاً
            if (data.useGPS === true && typeof window._storeSetLocation === 'function') {
                window._storeSetLocation();
            }

            // 💰 تطبيق وضع التسعير (يُخفي الحقول القديمة عند GPS)
            if (typeof window._storeTogglePricingMode === 'function') {
                window._storeTogglePricingMode(data.useGPS === true);
            }

            // 🚗 تحميل السائقين
            window._storeDrivers = Array.isArray(data.drivers) ? [...data.drivers] : [];
            if (typeof window._storeRefreshDriversList === 'function') {
                window._storeRefreshDriversList();
            }

            // 🔐 تحميل إعدادات الدفع التلقائي
            if (typeof window._storeLoadAutoPay === 'function') {
                window._storeLoadAutoPay();
            }

            // 🎨 تحميل لون المتجر
            window._storeThemeColor = data.themeColor || '#e67e22';
            window._storeCoverImage = data.coverImage || null;
            setTimeout(() => {
                if (typeof window._storeUpdateThemeUI === 'function') {
                    window._storeUpdateThemeUI();
                }
                if (typeof window._storeUpdateCoverUI === 'function') {
                    window._storeUpdateCoverUI();
                }
            }, 60);
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    window._storeSaveSettings = async function() {
        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const deliveryFee = Number(document.getElementById('storeDeliveryFee').value) || 0;
            const minOrder = Number(document.getElementById('storeMinOrder').value) || 0;
            const openTime = document.getElementById('storeOpenTime').value || '10:00';
            const closeTime = document.getElementById('storeCloseTime').value || '23:00';
            const acceptOrders = document.getElementById('storeAcceptOrders').checked;

            const workingDays = [];
            document.querySelectorAll('.store-day').forEach(cb => {
                if (cb.checked) workingDays.push(Number(cb.value));
            });

            const codEnabled = document.getElementById('storeCodEnabled')?.checked !== false;
            const open24_7 = document.querySelector('input[name="store24_7"]:checked')?.value === 'yes';
            const prepTime = Number(document.getElementById('storePrepTime')?.value) || 30;
            const deliveryTime = Number(document.getElementById('storeDeliveryTime')?.value) || 20;
            const useZones = document.getElementById('storeUseZones')?.checked === true;
            const useGPS = document.getElementById('storeUseGPS')?.checked === true;
            // 💰 سعر التوصيل حسب المسافة
            const distanceFeePerKm = Number(document.getElementById('storeDistanceFeePerKm')?.value) || 1000;

            await db.collection('public_menus').doc(uid).update({
                deliveryFee: deliveryFee,
                distanceFeePerKm: distanceFeePerKm,
                drivers: window._storeDrivers || [],
                prepTime: prepTime,
                deliveryTime: deliveryTime,
                useZones: useZones,
                useGPS: useGPS,
                zones: window._storeZones || [],
                storeLocation: window._storeLocation || null,
                minOrder: minOrder,
                openTime: openTime,
                closeTime: closeTime,
                workingDays: workingDays,
                acceptOrders: acceptOrders,
                open24_7: open24_7,
                codEnabled: codEnabled,
                paymentMethods: window._storePaymentMethods || [],
                themeColor: window._storeThemeColor || '#e67e22',
                coverImage: window._storeCoverImage || null,
                settingsUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 🔐 حفظ إعدادات الدفع التلقائي (مشفّرة)
            if (typeof window._storeSaveAutoPay === 'function') {
                await window._storeSaveAutoPay(uid);
            }

            document.getElementById('storeSettingsModal').remove();
            if (typeof toast === 'function') toast('✅ تم حفظ الإعدادات', 'success');
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    // ═══════════════════════════════════════════════════════
    //  💳 PAYMENT METHODS — إدارة طرق الدفع
    // ═══════════════════════════════════════════════════════
    window._storePaymentMethods = window._storePaymentMethods || [];

    function _renderPaymentMethodRow(m, idx) {
        return `
            <div style="background:#f8f9fa;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;">${_esc(m.icon || '💳')} ${_esc(m.name || '')}</div>
                    <div style="font-size:11px;color:#666;font-family:monospace;direction:ltr;text-align:right;">${_esc(m.account || '')}</div>
                </div>
                <button type="button" onclick="_storeRemovePaymentMethod(${idx})" style="padding:6px 10px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">🗑️</button>
            </div>
        `;
    }

    window._storeAddPaymentMethod = function() {
        const name = prompt('📛 اسم طريقة الدفع:\n(مثال: شام كاش، سيرياتيل كاش، بنك)');
        if (!name) return;
        const account = prompt('🔢 رقم الحساب / الهاتف:\n(مثال: 0944 456 264)', '');
        if (!account) return;
        const icon = prompt('🎨 أيقونة (اختياري):\n(مثال: 📱 لشام كاش، 🏦 للبنك)', '💳') || '💳';

        window._storePaymentMethods.push({
            id: 'pm_' + Date.now().toString(36),
            name: name.trim(),
            account: account.trim(),
            icon: icon.trim(),
            active: true
        });

        _refreshPaymentMethodsList();
    };

    window._storeRemovePaymentMethod = function(idx) {
        if (!confirm('🗑️ حذف هذه الطريقة؟')) return;
        window._storePaymentMethods.splice(idx, 1);
        _refreshPaymentMethodsList();
    };

    function _refreshPaymentMethodsList() {
        const list = document.getElementById('storePaymentMethodsList');
        if (!list) return;
        if (window._storePaymentMethods.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:20px;background:#f8f9fa;border-radius:8px;color:#999;font-size:12px;">لا توجد طرق دفع إلكتروني</div>';
            return;
        }
        list.innerHTML = window._storePaymentMethods.map((m, i) => _renderPaymentMethodRow(m, i)).join('');
    }

    // 🆕 GPS: تحديد موقع المطعم
    window._storeSetLocation = function() {
        const statusEl = document.getElementById('storeLocationStatus');
        if (!navigator.geolocation) {
            if (statusEl) statusEl.textContent = '❌ المتصفح لا يدعم تحديد الموقع';
            return;
        }
        if (statusEl) statusEl.textContent = '⏳ جاري تحديد الموقع...';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = Math.round(pos.coords.latitude * 10000) / 10000;
                const lng = Math.round(pos.coords.longitude * 10000) / 10000;
                window._storeLocation = { lat: lat, lng: lng, accuracy: Math.round(pos.coords.accuracy), updatedAt: Date.now() };
                if (statusEl) statusEl.textContent = '✅ موقع المطعم (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
                console.log('📍 [my-store] location updated:', window._storeLocation);
            },
            (err) => {
                let msg = '❌ فشل تحديد الموقع';
                if (err.code === 1) msg = '❌ تم رفض إذن الموقع — فعّل الإذن من إعدادات المتصفح';
                else if (err.code === 2) msg = '❌ الموقع غير متاح — تأكد من تشغيل GPS';
                else if (err.code === 3) msg = '❌ انتهت مهلة تحديد الموقع';
                if (statusEl) statusEl.textContent = msg;
                console.warn('📍 [my-store] geolocation error:', err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    };

    // 🗺️ فتح خريطة اختيار الموقع
    let _mapPickerInstance = null;
    let _mapPickerMarker = null;

    window._storeOpenMapPicker = function() {
        // 🔒 منع التعديل إن كان الموقع مقفلاً
        if (window._storeLocationLocked) {
            alert('🔒 موقع متجرك مقفل\n\nتم حفظ الموقع مسبقاً ولا يمكن تعديله.\nلتغيير الموقع، تواصل مع الإدارة.');
            return;
        }
        // 🧹 نظّف أي Modal سابق عالق (يمنع فتح خريطة جديدة)
        const oldModal = document.getElementById('_mapPickerModal');
        if (oldModal) {
            oldModal.remove();
            console.log('🧹 [mapPicker] cleaned old modal');
        }
        if (_mapPickerInstance) {
            try { _mapPickerInstance.remove(); } catch(e) {}
            _mapPickerInstance = null;
        }
        _mapPickerMarker = null;

        if (typeof L === 'undefined') {
            alert('❌ الخريطة غير محمّلة — تحقق من الإنترنت');
            return;
        }

        // الموقع الحالي أو الافتراضي (سوريا - دمشق)
        let initLat = 33.5138;
        let initLng = 36.2765;
        if (window._storeLocation && window._storeLocation.lat) {
            initLat = Number(window._storeLocation.lat);
            initLng = Number(window._storeLocation.lng);
        } else if (navigator.geolocation) {
            // نحاول قراءة GPS بصمت
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    initLat = pos.coords.latitude;
                    initLng = pos.coords.longitude;
                },
                () => {},
                { timeout: 2000 }
            );
        }

        const html = '<div id="_mapPickerModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2147483647;display:flex;align-items:stretch;justify-content:center;isolation:isolate;">'
            + '<div style="background:white;width:100%;max-width:700px;display:flex;flex-direction:column;position:relative;">'

            // Header
            + '<div style="padding:14px 18px;background:linear-gradient(135deg,#8e44ad,#6a1b9a);color:white;display:flex;align-items:center;justify-content:space-between;">'
            + '<div style="font-size:15px;font-weight:900;">🗺️ ضبط موقع المطعم على الخريطة</div>'
            + '<button onclick="_storeCloseMapPicker()" style="background:rgba(255,255,255,0.2);color:white;border:none;width:34px;height:34px;border-radius:50%;font-size:15px;cursor:pointer;font-family:inherit;">✕</button>'
            + '</div>'

            // Info
            + '<div style="padding:10px 16px;background:#f3e5f5;color:#6a1b9a;font-size:12px;text-align:center;font-weight:700;border-bottom:1px solid #e1bee7;">'
            + '💡 اسحب العلامة 🏪 أو انقر على الموقع الصحيح'
            + '</div>'

            // Map
            + '<div id="_mapPickerContainer" style="flex:1;min-height:400px;"></div>'

            // Coordinates display
            + '<div id="_mapPickerCoords" style="padding:8px 16px;background:#f8f9fa;border-top:1px solid #ecf0f1;text-align:center;font-size:12px;color:#2c3e50;font-weight:700;font-family:monospace;">—</div>'

            // Buttons
            + '<div style="padding:12px 16px;background:white;display:flex;gap:8px;border-top:1px solid #ecf0f1;">'
            + '<button onclick="_storeMapUseMyLocation()" style="flex:1;padding:12px;background:#3498db;color:white;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">📍 موقعي الحالي</button>'
            + '<button onclick="_storeSaveMapLocation()" style="flex:2;padding:12px;background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">💾 حفظ الموقع</button>'
            + '</div>'

            + '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);

        // إنشاء الخريطة
        setTimeout(function() {
            try {
                _mapPickerInstance = L.map('_mapPickerContainer').setView([initLat, initLng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19, attribution: '© OpenStreetMap'
                }).addTo(_mapPickerInstance);

                const markerIcon = L.divIcon({
                    className: 'picker-marker',
                    html: '<div style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(142,68,173,0.55);border:3px solid white;"><span style="transform:rotate(45deg);font-size:20px;">🏪</span></div>',
                    iconSize: [44, 44], iconAnchor: [22, 44]
                });

                _mapPickerMarker = L.marker([initLat, initLng], {
                    icon: markerIcon, draggable: true
                }).addTo(_mapPickerInstance);

                function updateCoords(lat, lng) {
                    const el = document.getElementById('_mapPickerCoords');
                    if (el) el.textContent = '📍 الإحداثيات: ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
                }
                updateCoords(initLat, initLng);

                _mapPickerMarker.on('dragend', function(e) {
                    const p = e.target.getLatLng();
                    updateCoords(p.lat, p.lng);
                });

                _mapPickerInstance.on('click', function(e) {
                    _mapPickerMarker.setLatLng(e.latlng);
                    updateCoords(e.latlng.lat, e.latlng.lng);
                });

                setTimeout(function() {
                    if (_mapPickerInstance) _mapPickerInstance.invalidateSize();
                }, 200);
            } catch(err) {
                console.error('[mapPicker]', err);
                alert('❌ فشل تحميل الخريطة');
                _storeCloseMapPicker();
            }
        }, 100);
    };

    window._storeCloseMapPicker = function() {
        const modal = document.getElementById('_mapPickerModal');
        if (modal) modal.remove();
        if (_mapPickerInstance) {
            try { _mapPickerInstance.remove(); } catch(e) {}
            _mapPickerInstance = null;
        }
        _mapPickerMarker = null;
    };

    window._storeMapUseMyLocation = function() {
        if (!navigator.geolocation || !_mapPickerMarker || !_mapPickerInstance) {
            alert('❌ تحديد الموقع غير مدعوم');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                _mapPickerMarker.setLatLng([lat, lng]);
                _mapPickerInstance.setView([lat, lng], 17);
                const el = document.getElementById('_mapPickerCoords');
                if (el) el.textContent = '📍 الإحداثيات: ' + lat.toFixed(5) + ', ' + lng.toFixed(5);
            },
            (err) => {
                alert('❌ فشل قراءة موقعك — تحقق من الإذن');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    // ⚠️ تأكيد حفظ الموقع (تحذير قبل القفل النهائي)
    window._storeSaveMapLocation = function() {
        document.getElementById('_locConfirmModal')?.remove();

        const modal = document.createElement('div');
        modal.id = '_locConfirmModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;direction:rtl;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div style="background:white;border-radius:20px;max-width:400px;width:100%;padding:26px 22px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                <div style="font-size:52px;margin-bottom:12px;">⚠️</div>
                <div style="font-size:17px;font-weight:900;color:#2c3e50;margin-bottom:14px;">تأكيد حفظ الموقع</div>
                <div style="background:#fff3cd;border:1.5px solid #f39c12;border-radius:12px;padding:14px;margin-bottom:20px;text-align:right;">
                    <div style="font-size:12px;color:#856404;line-height:1.8;">
                        <b>⚠️ تنبيه مهم:</b><br>
                        • لن تتمكن من تعديل موقع المتجر <b>بعد الحفظ</b>.<br>
                        • لتعديله مستقبلاً، ستحتاج لتقديم <b>طلب للإدارة</b>.
                    </div>
                </div>
                <button onclick="_storeDoSaveMapLocation()" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:12px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 14px rgba(39,174,96,0.35);">✓ نعم، احفظ الموقع</button>
                <button onclick="document.getElementById('_locConfirmModal').remove()" style="width:100%;padding:12px;background:#f5f7fa;color:#7f8c8d;border:none;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">← إلغاء</button>
            </div>`;
        document.body.appendChild(modal);
    };

    // 💾 الحفظ الفعلي للموقع (يُستدعى من الـ Modal)
    window._storeDoSaveMapLocation = async function() {
        document.getElementById('_locConfirmModal')?.remove();
        if (!_mapPickerMarker) {
            alert('❌ لا توجد علامة على الخريطة');
            return;
        }
        const pos = _mapPickerMarker.getLatLng();
        const lat = Math.round(pos.lat * 100000) / 100000;
        const lng = Math.round(pos.lng * 100000) / 100000;

        window._storeLocation = {
            lat: lat,
            lng: lng,
            accuracy: 5,
            updatedAt: Date.now(),
            source: 'map_picker'
        };

        const statusEl = document.getElementById('storeLocationStatus');
        if (statusEl) {
            statusEl.textContent = 'موقع المطعم (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
        }

        console.log('📍 [my-store] map picker set:', window._storeLocation);

        // 💾 حفظ مباشر في Firestore — لا ننتظر زر حفظ الإعدادات
        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            if (!uid) throw new Error('لا يوجد مستخدم');

            await db.collection('public_menus').doc(uid).update({
                storeLocation: window._storeLocation,
                locationLocked: true,
                locationSetAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // 🔒 فعّل القفل فوراً في الجلسة الحالية
            window._storeLocationLocked = true;

            console.log('✅ [my-store] storeLocation saved to Firestore');
            _storeCloseMapPicker();

            if (typeof window._toast === 'function') {
                window._toast('✅ تم حفظ الموقع ونشره للعملاء', 'success');
            } else {
                alert('✅ تم حفظ الموقع ونشره');
            }
        } catch(e) {
            console.error('❌ [my-store] save failed:', e);
            if (typeof window._toast === 'function') {
                window._toast('❌ فشل حفظ الموقع — حاول مرة أخرى', 'error');
            } else {
                alert('❌ فشل حفظ الموقع: ' + (e.message || ''));
            }
        }
    };

    // 🆕 GPS: تبديل تلقائي عند تفعيل checkbox
    window._storeToggleGPS = function(checked) {
        const statusEl = document.getElementById('storeLocationStatus');
        if (statusEl) {
            if (window._storeLocation && window._storeLocation.lat) {
                statusEl.textContent = 'موقع المطعم (' + Number(window._storeLocation.lat).toFixed(4) + ', ' + Number(window._storeLocation.lng).toFixed(4) + ')';
            } else {
                statusEl.textContent = 'تحديد موقع المطعم على الخريطة';
            }
        }
        // 💰 تحديث وضع التسعير
        if (typeof window._storeTogglePricingMode === 'function') {
            window._storeTogglePricingMode(checked === true);
        }
    };

    // 💰 إظهار/إخفاء حقول التسعير الثابت
    window._storeTogglePricingMode = function(useGPS) {
        const fixedFeeRow = document.getElementById('storeFixedFeeRow');
        const deliveryTimeRow = document.getElementById('storeDeliveryTimeRow');
        if (fixedFeeRow) fixedFeeRow.style.display = useGPS ? 'none' : 'block';
        if (deliveryTimeRow) deliveryTimeRow.style.display = useGPS ? 'none' : 'block';
    };

    // 🟢 تبديل 24/7 — إخفاء/إظهار ساعات + أيام العمل
    window._storeToggle247 = function(enabled) {
        const regularBlock = document.getElementById('storeRegularHoursBlock');
        const daysBlock = document.getElementById('storeDaysBlock');
        if (regularBlock) regularBlock.style.display = enabled ? 'none' : 'block';
        if (daysBlock) daysBlock.style.display = enabled ? 'none' : 'block';
    };

    // 🚗 إدارة السائقين
    function _storeEscDriver(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    window._storeRefreshDriversList = function() {
        const list = document.getElementById('storeDriversList');
        if (!list) return;
        const drivers = window._storeDrivers || [];

        if (drivers.length === 0) {
            list.innerHTML = '<div style="text-align:center;color:#999;font-size:12px;padding:15px;">لا يوجد سائقون بعد</div>';
            return;
        }

        list.innerHTML = drivers.map((d, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:white;border:1px solid #e9ecef;border-radius:8px;padding:10px;margin-bottom:6px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;color:#2c3e50;margin-bottom:2px;">👤 ${_storeEscDriver(d.name || 'سائق')}</div>
                    <div style="font-size:11px;color:#666;direction:ltr;text-align:right;font-family:monospace;">📞 ${_storeEscDriver(d.phone || '—')}</div>
                </div>
                <button type="button" onclick="_storeDeleteDriver(${i})" style="padding:6px 10px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;">🗑️</button>
            </div>
        `).join('');
    };

    window._storeAddDriver = function() {
        const name = prompt('👤 اسم السائق:', '');
        if (!name || !name.trim()) return;
        const phone = prompt('📞 رقم الهاتف:', '');
        if (phone === null) return;

        if (!Array.isArray(window._storeDrivers)) window._storeDrivers = [];
        window._storeDrivers.push({
            id: 'drv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: name.trim(),
            phone: (phone || '').trim()
        });
        window._storeRefreshDriversList();
    };

    window._storeDeleteDriver = function(idx) {
        const d = window._storeDrivers?.[idx];
        if (!d) return;
        if (!confirm('🗑️ حذف السائق "' + (d.name || '') + '"?')) return;
        window._storeDrivers.splice(idx, 1);
        window._storeRefreshDriversList();
    };

    // 🆕 UI: تبديل استقبال الطلبات
    window._storeToggleAccept = function(on) {
        const label = document.getElementById('storeAcceptLabel');
        if (!label) return;
        label.style.background = on ? '#e8f5e9' : '#ffebee';
        label.style.borderColor = on ? '#27ae60' : '#e74c3c';
        const t = document.getElementById('storeAcceptTitle');
        const d = document.getElementById('storeAcceptDesc');
        if (t) { t.textContent = on ? '✅ الطلبات مقبولة' : '⭕ استقبال الطلبات متوقف'; t.style.color = on ? '#1b5e20' : '#b71c1c'; }
        if (d) { d.textContent = on ? 'سيتم استقبال طلبات جديدة' : 'لن تُستقبل أي طلبات جديدة'; }
    };

    // 🆕 UI: تبديل الدفع عند التسليم
    window._storeToggleCod = function(on) {
        const label = document.getElementById('storeCodLabel');
        if (!label) return;
        label.style.background = on ? '#e8f5e9' : '#ffebee';
        label.style.borderColor = on ? '#27ae60' : '#e74c3c';
        const t = document.getElementById('storeCodTitle');
        const d = document.getElementById('storeCodDesc');
        if (t) { t.textContent = on ? '✅ الدفع عند التسليم مفعّل' : '❌ الدفع عند التسليم معطّل'; t.style.color = on ? '#1b5e20' : '#b71c1c'; }
        if (d) { d.textContent = on ? 'يمكن للعميل الدفع نقداً عند التسليم' : 'العميل يجب أن يدفع إلكترونياً'; }
    };

    // ═══════════════════════════════════════════════════════
    //  🤖 AUTO PAYMENT (API) — تشفير + حفظ + تحميل
    // ═══════════════════════════════════════════════════════

    // ───── 🔐 تشفير: PBKDF2 → AES-GCM 256 ─────
    async function _storeDeriveKey(uid) {
        const enc = new TextEncoder();
        const salt = enc.encode('almudir_salt_v1');
        const km = await crypto.subtle.importKey(
            'raw', enc.encode(uid + '|almudir-key-v1'),
            { name: 'PBKDF2' }, false, ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
            km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
    }

    function _storeBufToB64(buf) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
    }

    function _storeB64ToBuf(b64) {
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    }

    async function _storeEncrypt(text, uid) {
        if (!text) return null;
        try {
            const key = await _storeDeriveKey(uid);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const cipher = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                new TextEncoder().encode(text)
            );
            return { v: 1, iv: _storeBufToB64(iv), data: _storeBufToB64(cipher) };
        } catch (e) {
            console.error('[encrypt]', e);
            return null;
        }
    }

    async function _storeDecrypt(obj, uid) {
        if (!obj || !obj.iv || !obj.data) return '';
        try {
            const key = await _storeDeriveKey(uid);
            const plain = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: _storeB64ToBuf(obj.iv) },
                key,
                _storeB64ToBuf(obj.data)
            );
            return new TextDecoder().decode(plain);
        } catch (e) {
            console.error('[decrypt]', e);
            return '';
        }
    }

    // ───── 🎨 UI: تبديل الدفع التلقائي ─────
    window._storeToggleAutoPay = function(on) {
        const label = document.getElementById('storeAutoPayLabel');
        const body = document.getElementById('storeAutoPayBody');
        const title = document.getElementById('storeAutoPayTitle');
        if (label) {
            label.style.background = on ? '#f5f0fa' : '#f8f9fa';
            label.style.borderColor = on ? '#8e44ad' : '#ddd';
        }
        if (title) {
            title.textContent = on ? '🟣 الدفع التلقائي (API) مفعّل' : '⚪ الدفع التلقائي (API) معطّل';
            title.style.color = on ? '#6a1b9a' : '#555';
        }
        if (body) body.style.display = on ? 'block' : 'none';
    };

    window._storeToggleApiKeyVisibility = function() {
        const el = document.getElementById('storeAutoPayApiKey');
        if (!el) return;
        el.type = el.type === 'password' ? 'text' : 'password';
    };

    // ───── 💾 حفظ (مشفّر) ─────
    window._storeSaveAutoPay = async function(uid) {
        try {
            const enabled = document.getElementById('storeAutoPayEnabled')?.checked === true;
            const provider = document.getElementById('storeAutoPayProvider')?.value || 'api-syria';
            const walletId = document.getElementById('storeAutoPayWalletId')?.value.trim() || '';
            const apiKeyRaw = document.getElementById('storeAutoPayApiKey')?.value.trim() || '';

            // المفتاح: إذا لم يُعدَّل → نحتفظ بالمشفر القديم
            let apiKeyEncrypted = null;
            if (apiKeyRaw) {
                apiKeyEncrypted = await _storeEncrypt(apiKeyRaw, uid);
            } else {
                const snap = await db.collection('merchant_secrets').doc(uid).get();
                if (snap.exists) {
                    apiKeyEncrypted = snap.data()?.autoPayment?.apiKeyEncrypted || null;
                }
            }

            await db.collection('merchant_secrets').doc(uid).set({
                autoPayment: {
                    enabled: enabled,
                    provider: provider,
                    walletId: walletId,
                    apiKeyEncrypted: apiKeyEncrypted,
                    verified: false,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                },
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 🌐 علامة عامة في public_menus (يقرأها العميل)
            try {
                await db.collection('public_menus').doc(uid).update({
                    autoPaymentEnabled: enabled,
                    autoPaymentProvider: enabled ? provider : null,
                    autoPaymentUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (ePub) {
                console.warn('[public_menus autoPay]', ePub);
            }

            return true;
        } catch (e) {
            console.error('[save autoPay]', e);
            return false;
        }
    };

    // ───── 📥 تحميل عند فتح الإعدادات ─────
    window._storeLoadAutoPay = async function() {
        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const snap = await db.collection('merchant_secrets').doc(uid).get();
            if (!snap.exists) return;
            const ap = snap.data()?.autoPayment;
            if (!ap) return;

            const cb = document.getElementById('storeAutoPayEnabled');
            const prov = document.getElementById('storeAutoPayProvider');
            const wid = document.getElementById('storeAutoPayWalletId');
            const apiKeyEl = document.getElementById('storeAutoPayApiKey');
            const status = document.getElementById('storeAutoPayStatus');

            if (cb) cb.checked = ap.enabled === true;
            if (prov) prov.value = ap.provider || 'api-syria';
            if (wid) wid.value = ap.walletId || '';
            if (apiKeyEl && ap.apiKeyEncrypted) {
                const dec = await _storeDecrypt(ap.apiKeyEncrypted, uid);
                if (dec) apiKeyEl.value = dec;
            }
            if (status) {
                if (ap.verified === true) {
                    status.textContent = '✅ مُتحقّق سابقاً';
                    status.style.color = '#27ae60';
                } else if (ap.enabled) {
                    status.textContent = '⚠️ مُعدّ — يحتاج اختبار';
                    status.style.color = '#f39c12';
                } else {
                    status.textContent = '⚪ لم يتم الاختبار بعد';
                    status.style.color = '#666';
                }
            }

            if (typeof window._storeToggleAutoPay === 'function') {
                window._storeToggleAutoPay(ap.enabled === true);
            }
        } catch (e) {
            console.error('[load autoPay]', e);
        }
    };

    // ───── 🧪 اختبار الاتصال ─────
    window._storeTestAutoPay = async function() {
        const status = document.getElementById('storeAutoPayStatus');
        const apiKey = document.getElementById('storeAutoPayApiKey')?.value.trim();
        const walletId = document.getElementById('storeAutoPayWalletId')?.value.trim();
        const provider = document.getElementById('storeAutoPayProvider')?.value;

        if (!apiKey) {
            if (status) { status.textContent = '❌ أدخل مفتاح API'; status.style.color = '#e74c3c'; }
            return;
        }
        if (!walletId) {
            if (status) { status.textContent = '❌ أدخل معرّف المحفظة'; status.style.color = '#e74c3c'; }
            return;
        }

        if (status) { status.textContent = '⏳ جاري الاختبار...'; status.style.color = '#3498db'; }

        // MVP: التحقق الفعلي يحتاج Cloud Functions — نتحقق من صحة الحقول
        await new Promise(r => setTimeout(r, 600));

        if (status) {
            status.textContent = '✅ المفاتيح مكتملة — التحقق الفعلي عند أول طلب (Cloud Functions)';
            status.style.color = '#27ae60';
        }
    };

    // ═══════════════════════════════════════════════════════
    //  🗺️ ZONES EDITOR — إدارة مناطق التوصيل
    //  البنية: { id, name, eta, fee, active }
    // ═══════════════════════════════════════════════════════

    window._storeOpenZonesEditor = function() {
        // نافذة قديمة؟ احذفها
        document.getElementById('storeZonesModal')?.remove();

        // إخفاء نافذة الإعدادات مؤقتاً (حل مشكلة الطبقات)
        const settingsModal = document.getElementById('storeSettingsModal');
        if (settingsModal) settingsModal.style.visibility = 'hidden';

        const zones = Array.isArray(window._storeZones) ? window._storeZones : [];

        const modal = document.createElement('div');
        modal.id = 'storeZonesModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;font-family:inherit;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:520px;width:100%;padding:20px;margin:auto;direction:rtl;box-shadow:0 8px 40px rgba(0,0,0,0.35);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="font-size:18px;font-weight:800;color:#2c3e50;">🗺️ مناطق التوصيل</div>
                    <button onclick="_storeCloseZonesEditor()" style="background:#eee;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;font-weight:700;">×</button>
                </div>

                <button onclick="_storeAddZone()" style="width:100%;padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:14px;">➕ إضافة منطقة جديدة</button>

                <div id="storeZonesList" style="margin-bottom:14px;"></div>

                <button onclick="_storeCloseZonesEditor(true)" style="width:100%;padding:14px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">✅ تم — حفظ المناطق</button>

                <div style="font-size:11px;color:#888;text-align:center;margin-top:10px;">💡 لا تنسَ الضغط على "حفظ الإعدادات" بعد الإغلاق</div>
            </div>`;
        document.body.appendChild(modal);

        window._storeRefreshZonesList();
    };

    window._storeCloseZonesEditor = function(save) {
        document.getElementById('storeZonesModal')?.remove();
        const settingsModal = document.getElementById('storeSettingsModal');
        if (settingsModal) settingsModal.style.visibility = 'visible';
        if (save) _storeSaveZones();
    };

    window._storeRefreshZonesList = function() {
        const list = document.getElementById('storeZonesList');
        if (!list) return;
        const zones = window._storeZones || [];

        if (zones.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:24px;background:#f8f9fa;border-radius:10px;color:#999;font-size:13px;">لا توجد مناطق بعد<br><span style="font-size:11px;">اضغط "➕ إضافة منطقة" للبدء</span></div>';
            return;
        }

        list.innerHTML = zones.map((z, i) => `
            <div style="background:${z.active !== false ? '#e8f5e9' : '#ffebee'};border:1px solid ${z.active !== false ? '#27ae60' : '#e74c3c'};border-radius:10px;padding:12px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="font-size:14px;font-weight:700;color:${z.active !== false ? '#1b5e20' : '#b71c1c'};">${_escZ(z.name || 'منطقة')}</div>
                    <div style="display:flex;gap:4px;">
                        <button onclick="_storeToggleZoneActive(${i})" style="padding:4px 8px;background:${z.active !== false ? '#f39c12' : '#27ae60'};color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">${z.active !== false ? '⏸️ إيقاف' : '▶️ تفعيل'}</button>
                        <button onclick="_storeEditZone(${i})" style="padding:4px 8px;background:#3498db;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">✏️</button>
                        <button onclick="_storeDeleteZone(${i})" style="padding:4px 8px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">🗑️</button>
                    </div>
                </div>
                <div style="font-size:11px;color:#555;display:flex;gap:12px;">
                    <span>⏱️ ${Number(z.eta) || 0} د</span>
                    <span>🛵 ${Number(z.fee) || 0} ل.س</span>
                </div>
            </div>
        `).join('');
    };

    function _escZ(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    window._storeAddZone = function() {
        const name = prompt('📍 اسم المنطقة (مثال: المزة، كفرسوسة):', '');
        if (!name || !name.trim()) return;
        const etaStr = prompt('⏱️ وقت التوصيل بالدقائق:', '30');
        if (etaStr === null) return;
        const eta = Number(etaStr) || 30;
        const feeStr = prompt('🛵 رسوم التوصيل (ل.س):', '0');
        if (feeStr === null) return;
        const fee = Number(feeStr) || 0;

        if (!Array.isArray(window._storeZones)) window._storeZones = [];
        window._storeZones.push({
            id: 'z_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: name.trim(),
            eta: eta,
            fee: fee,
            active: true
        });
        window._storeRefreshZonesList();
        _storeUpdateZonesCount();
    };

    window._storeEditZone = function(idx) {
        const z = window._storeZones?.[idx];
        if (!z) return;
        const name = prompt('📍 اسم المنطقة:', z.name || '');
        if (name === null) return;
        const etaStr = prompt('⏱️ وقت التوصيل بالدقائق:', String(z.eta || 30));
        if (etaStr === null) return;
        const feeStr = prompt('🛵 رسوم التوصيل (ل.س):', String(z.fee || 0));
        if (feeStr === null) return;

        window._storeZones[idx] = {
            ...z,
            name: name.trim() || z.name,
            eta: Number(etaStr) || 30,
            fee: Number(feeStr) || 0
        };
        window._storeRefreshZonesList();
    };

    window._storeDeleteZone = function(idx) {
        const z = window._storeZones?.[idx];
        if (!z) return;
        if (!confirm('🗑️ حذف منطقة "' + (z.name || '؟') + '"؟')) return;
        window._storeZones.splice(idx, 1);
        window._storeRefreshZonesList();
        _storeUpdateZonesCount();
    };

    window._storeToggleZoneActive = function(idx) {
        const z = window._storeZones?.[idx];
        if (!z) return;
        window._storeZones[idx] = { ...z, active: z.active === false ? true : false };
        window._storeRefreshZonesList();
    };

    window._storeSaveZones = function() {
        _storeUpdateZonesCount();
        if (typeof toast === 'function') toast('✅ المناطق محدّثة — لا تنسَ حفظ الإعدادات', 'success');
    };

    function _storeUpdateZonesCount() {
        const el = document.getElementById('storeZonesCount');
        if (el) el.textContent = (window._storeZones || []).length;
    }

    // ═══════════════════════════════════════════════════════
    //  🎨 THEME COLOR — لون المتجر الديناميكي
    // ═══════════════════════════════════════════════════════

    function _storeDarkenHex(hex, amount) {
        const num = parseInt(hex.slice(1), 16);
        const R = Math.max(0, ((num >> 16) & 0xff) - amount);
        const G = Math.max(0, ((num >> 8) & 0xff) - amount);
        const B = Math.max(0, (num & 0xff) - amount);
        return '#' + [R, G, B].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    window._storeSetTheme = function(color) {
        if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return;
        window._storeThemeColor = color;
        window._storeUpdateThemeUI();
    };

    window._storeUpdateThemeUI = function() {
        const color = window._storeThemeColor || '#e67e22';
        const preview = document.getElementById('storeThemePreview');
        if (preview) {
            preview.style.background = 'linear-gradient(135deg, ' + color + ', ' + _storeDarkenHex(color, 40) + ')';
        }
        const modal = document.getElementById('storeSettingsModal');
        if (!modal) return;
        modal.querySelectorAll('[data-theme]').forEach(btn => {
            if (btn.dataset.theme === color) {
                btn.style.borderColor = '#2c3e50';
                btn.style.transform = 'scale(1.12)';
                btn.style.boxShadow = '0 0 0 2px white, 0 0 0 4px ' + color;
            } else {
                btn.style.borderColor = '#ddd';
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
            }
        });
    };

    // ═══════════════════════════════════════════════════════
    //  🖼️ COVER IMAGE — صورة غلاف المتجر (Base64 مضغوط)
    // ═══════════════════════════════════════════════════════

    window._storeOnCoverPick = async function(input) {
        const file = input?.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await _storeCompressCover(file);
            window._storeCoverImage = dataUrl;
            window._storeUpdateCoverUI();
        } catch (e) {
            alert('❌ ' + (e.message || e));
        } finally {
            input.value = '';
        }
    };

    async function _storeCompressCover(file) {
        if (!file.type.startsWith('image/')) throw new Error('الملف ليس صورة');
        const rawDataUrl = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = () => rej(new Error('فشل قراءة الملف'));
            r.readAsDataURL(file);
        });
        const img = await new Promise((res, rej) => {
            const im = new Image();
            im.onload = () => res(im);
            im.onerror = () => rej(new Error('فشل تحميل الصورة'));
            im.src = rawDataUrl;
        });
        const MAX_W = 1200, MAX_H = 600;
        const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL('image/jpeg', 0.8);
        const sizeKB = Math.round(out.length * 3 / 4 / 1024);
        if (sizeKB > 350) {
            throw new Error('الصورة كبيرة جداً (' + sizeKB + 'KB) — جرّب صورة أصغر');
        }
        return out;
    }

    window._storeClearCover = function() {
        if (!window._storeCoverImage) return;
        if (!confirm('🗑️ حذف صورة الغلاف؟')) return;
        window._storeCoverImage = null;
        window._storeUpdateCoverUI();
    };

    window._storeUpdateCoverUI = function() {
        const preview = document.getElementById('storeCoverPreview');
        if (!preview) return;
        const img = window._storeCoverImage;
        if (img) {
            preview.style.backgroundImage = "url('" + img + "')";
            preview.style.borderStyle = 'solid';
            preview.style.borderColor = '#27ae60';
            preview.textContent = '';
        } else {
            preview.style.backgroundImage = '';
            preview.style.borderStyle = 'dashed';
            preview.style.borderColor = '#ddd';
            preview.textContent = 'لا توجد صورة';
        }
    };

    // ═══════════════════════════════════════════════════════
    //  ⭐ REVIEWS — تقييمات العملاء (للتاجر)
    // ═══════════════════════════════════════════════════════

    function _storeEsc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function _storeFmtDate(ts) {
        if (!ts) return '—';
        let d;
        try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch(e) { return '—'; }
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'الآن';
        if (mins < 60) return 'منذ ' + mins + ' د';
        if (hours < 24) return 'منذ ' + hours + ' س';
        if (days < 30) return 'منذ ' + days + ' يوم';
        return d.toLocaleDateString('ar-EG');
    }

    window._storeLoadReviewsBadge = async function() {
        try {
            const badge = document.getElementById('storeReviewsBadge');
            if (!badge) return;
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const snap = await db.collection('public_menus').doc(uid).get();
            const m = snap.data() || {};
            const count = Number(m.ratingsCount) || 0;
            const avg = Number(m.avgRating) || 0;
            if (count > 0) {
                badge.textContent = '⭐ ' + avg.toFixed(1) + ' · ' + count;
            } else {
                badge.textContent = 'لا تقييمات';
            }
        } catch(e) {
            console.warn('[reviews badge]', e);
        }
    };

    window._storeOpenReviews = async function() {
        document.getElementById('storeReviewsModal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'storeReviewsModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;font-family:inherit;direction:rtl;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:560px;width:100%;padding:20px;margin:auto;box-shadow:0 8px 40px rgba(0,0,0,0.35);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="font-size:18px;font-weight:800;color:#2c3e50;">⭐ تقييمات العملاء</div>
                    <button onclick="document.getElementById('storeReviewsModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>
                <div id="storeReviewsSummary" style="background:linear-gradient(135deg,#fffbf0,#fff3d6);border:2px solid #f39c12;border-radius:12px;padding:14px;margin-bottom:14px;text-align:center;">
                    <div style="font-size:12px;color:#7d4e00;margin-bottom:4px;">جاري التحميل...</div>
                </div>
                <div id="storeReviewsList"></div>
            </div>`;
        document.body.appendChild(modal);

        try {
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            // بدون orderBy — تجنبّ الحاجة لـ index مركّب
            const snap = await db.collection('public_orders')
                .where('ownerUid', '==', uid)
                .limit(200)
                .get();

            const reviews = [];
            snap.forEach(d => {
                const x = d.data();
                if (x.review && x.review.rating) {
                    reviews.push({
                        orderId: d.id,
                        review: x.review,
                        customer: x.customer,
                        _ts: (x.review.createdAt && x.review.createdAt.toMillis) ? x.review.createdAt.toMillis() : 0
                    });
                }
            });
            // ترتيب في JS — الأحدث أولاً
            reviews.sort((a, b) => b._ts - a._ts);

            const summaryEl = document.getElementById('storeReviewsSummary');
            const listEl = document.getElementById('storeReviewsList');

            if (reviews.length === 0) {
                if (summaryEl) summaryEl.innerHTML = '<div style="font-size:14px;color:#888;">لا توجد تقييمات بعد</div>';
                return;
            }

            const avg = reviews.reduce((s, r) => s + (Number(r.review.rating) || 0), 0) / reviews.length;
            if (summaryEl) {
                summaryEl.innerHTML = `
                    <div style="font-size:28px;font-weight:800;color:#e67e22;">⭐ ${avg.toFixed(1)}</div>
                    <div style="font-size:12px;color:#7d4e00;margin-top:4px;">من ${reviews.length} تقييم</div>`;
            }

            if (listEl) {
                listEl.innerHTML = reviews.map(r => {
                    const stars = '★'.repeat(Number(r.review.rating) || 0);
                    const emptyStars = '☆'.repeat(5 - (Number(r.review.rating) || 0));
                    const visible = r.review.visible !== false;
                    const name = r.review.customerName || r.customer?.name || 'عميل';
                    return `
                        <div style="background:${visible ? '#fff' : '#f8f9fa'};border:1px solid ${visible ? '#e9ecef' : '#ddd'};border-radius:12px;padding:14px;margin-bottom:10px;${visible ? '' : 'opacity:0.55;'}">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <div style="font-size:14px;font-weight:700;color:#2c3e50;">👤 ${_storeEsc(name)}</div>
                                <div style="font-size:13px;color:#f39c12;letter-spacing:1px;">${stars}${emptyStars}</div>
                            </div>
                            ${r.review.comment ? `<div style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px;">${_storeEsc(r.review.comment)}</div>` : ''}
                            ${r.review.ownerReply ? `<div style="background:#f0f8ff;border-right:3px solid #3498db;border-radius:8px;padding:10px;margin-bottom:8px;"><div style="font-size:11px;color:#2980b9;font-weight:700;margin-bottom:4px;">🏪 ردّك:</div><div style="font-size:13px;color:#2c3e50;line-height:1.6;">${_storeEsc(r.review.ownerReply)}</div></div>` : ''}
                            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                                <div style="font-size:11px;color:#999;">🕐 ${_storeFmtDate(r.review.createdAt)}</div>
                                <div style="display:flex;gap:6px;">
                                    <button onclick="_storeReplyToReview('${_storeEsc(r.orderId)}')" style="padding:5px 10px;background:#3498db;color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">${r.review.ownerReply ? '✏️ تعديل الرد' : '💬 رد'}</button>
                                    <button onclick="_storeToggleReview('${_storeEsc(r.orderId)}', ${visible})" style="padding:5px 10px;background:${visible ? '#f39c12' : '#27ae60'};color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">${visible ? '🙈 إخفاء' : '👁️ إظهار'}</button>
                                </div>
                            </div>
                        </div>`;
                }).join('');
            }
        } catch(e) {
            console.error('[reviews]', e);
            const listEl = document.getElementById('storeReviewsList');
            if (listEl) listEl.innerHTML = '<div style="color:#e74c3c;text-align:center;padding:20px;">❌ فشل التحميل: ' + _storeEsc(e.message) + '</div>';
        }
    };

    window._storeToggleReview = async function(orderId, currentlyVisible) {
        const newVisible = !currentlyVisible;

        // ⚡ Optimistic UI: رد فوري (0ms)
        if (typeof toast === 'function') {
            toast(newVisible ? '👁️ تم إظهار التقييم' : '🙈 تم إخفاء التقييم', 'success');
        }
        document.getElementById('storeReviewsModal')?.remove();

        // ⚡ في الخلفية: Firestore + مزامنة + إعادة رسم
        (async () => {
            try {
                await db.collection('public_orders').doc(orderId).update({
                    'review.visible': newVisible
                });

                // 🔄 مزامنة lastReviews
                try {
                    const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
                    const menuRef = db.collection('public_menus').doc(uid);
                    const menuSnap = await menuRef.get();
                    if (menuSnap.exists) {
                        const menuData = menuSnap.data();
                        const lastReviews = Array.isArray(menuData.lastReviews) ? menuData.lastReviews : [];
                        const idx = lastReviews.findIndex(r => r.orderId === orderId);
                        if (idx >= 0) {
                            lastReviews[idx] = Object.assign({}, lastReviews[idx], { visible: newVisible });
                            await menuRef.update({ lastReviews: lastReviews });
                            console.log('✅ [toggle] lastReviews synced');
                        } else {
                            console.warn('⚠️ [toggle] orderId not in lastReviews — تقييم قديم');
                        }
                    }
                } catch(syncErr) {
                    console.warn('⚠️ [toggle] sync failed:', syncErr);
                }

                window._storeOpenReviews();
            } catch(e) {
                console.error('[toggleReview]', e);
                if (typeof toast === 'function') toast('⚠️ فشل تغيير الرؤية', 'error');
                window._storeOpenReviews();
            }
        })();
    };

    // 💬 فتح modal كتابة/تعديل الرد
    window._storeReplyToReview = async function(orderId) {
        document.getElementById('storeReplyModal')?.remove();
        
        let currentReply = '';
        try {
            const snap = await db.collection('public_orders').doc(orderId).get();
            if (snap.exists) {
                const data = snap.data();
                currentReply = (data.review && data.review.ownerReply) || '';
            }
        } catch(e) {
            console.warn('[reply] fetch failed:', e);
        }
        
        const modal = document.createElement('div');
        modal.id = 'storeReplyModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;direction:rtl;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:500px;width:100%;padding:20px;box-shadow:0 8px 40px rgba(0,0,0,0.35);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="font-size:17px;font-weight:800;color:#2c3e50;">💬 ردّك على التقييم</div>
                    <button onclick="document.getElementById('storeReplyModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>
                <textarea id="storeReplyText" maxlength="200" placeholder="اكتب ردّك هنا..." style="width:100%;min-height:120px;padding:12px;border:2px solid #e9ecef;border-radius:10px;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box;line-height:1.6;">${_storeEsc(currentReply)}</textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                    <span id="storeReplyCounter" style="font-size:11px;color:#95a5a6;">0 / 200</span>
                    <span style="font-size:11px;color:#95a5a6;">يظهر للعميل تحت تعليقه</span>
                </div>
                <div style="display:flex;gap:8px;margin-top:16px;">
                    ${currentReply ? '<button onclick="_storeDeleteReply(\'' + orderId + '\')" style="flex:1;padding:12px;background:#e74c3c;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">🗑️ حذف الرد</button>' : ''}
                    <button onclick="_storeSaveReply('${orderId}')" style="flex:2;padding:12px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">💾 حفظ الرد</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        
        const textarea = document.getElementById('storeReplyText');
        const counter = document.getElementById('storeReplyCounter');
        const updateCounter = () => {
            const len = textarea.value.length;
            counter.textContent = len + ' / 200';
            counter.style.color = len >= 190 ? '#e74c3c' : (len >= 150 ? '#f39c12' : '#95a5a6');
        };
        textarea.addEventListener('input', updateCounter);
        updateCounter();
        setTimeout(() => textarea.focus(), 100);
    };

    // 💾 حفظ الرد
    window._storeSaveReply = async function(orderId) {
        const textarea = document.getElementById('storeReplyText');
        if (!textarea) return;

        const reply = textarea.value.trim();
        if (reply.length === 0) {
            alert('⚠️ اكتب الرد أولاً');
            return;
        }
        if (reply.length > 200) {
            alert('⚠️ الرد طويل جداً (200 حرف كحد أقصى)');
            return;
        }

        // ⚡ Optimistic UI: رد فوري (0ms)
        if (typeof toast === 'function') toast('✅ تم حفظ الرد', 'success');
        document.getElementById('storeReplyModal')?.remove();
        document.getElementById('storeReviewsModal')?.remove();

        // ⚡ في الخلفية: Firestore + إعادة رسم
        (async () => {
            try {
                await db.collection('public_orders').doc(orderId).update({
                    'review.ownerReply': reply
                });

                // 🔄 مزامنة lastReviews في public_menus
                try {
                    const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
                    const menuRef = db.collection('public_menus').doc(uid);
                    const menuSnap = await menuRef.get();
                    if (menuSnap.exists) {
                        const menuData = menuSnap.data();
                        const lastReviews = Array.isArray(menuData.lastReviews) ? menuData.lastReviews : [];
                        const idx = lastReviews.findIndex(r => r.orderId === orderId);
                        if (idx >= 0) {
                            lastReviews[idx] = Object.assign({}, lastReviews[idx], { ownerReply: reply });
                            await menuRef.update({ lastReviews: lastReviews });
                            console.log('✅ [reply] lastReviews synced');
                        } else {
                            console.warn('⚠️ [reply] orderId not found in lastReviews — تقييم قديم');
                        }
                    }
                } catch(syncErr) {
                    console.warn('⚠️ [reply] lastReviews sync failed:', syncErr);
                }

                window._storeOpenReviews();
            } catch(e) {
                console.error('[saveReply]', e);
                if (typeof toast === 'function') toast('⚠️ فشل حفظ الرد', 'error');
                window._storeOpenReviews();
            }
        })();
    };

    // 🗑️ حذف الرد
    window._storeDeleteReply = async function(orderId) {
        if (!confirm('⚠️ هل تريد حذف الرد؟')) return;

        // ⚡ Optimistic UI: رد فوري (0ms)
        if (typeof toast === 'function') toast('🗑️ تم حذف الرد', 'success');
        document.getElementById('storeReplyModal')?.remove();
        document.getElementById('storeReviewsModal')?.remove();

        // ⚡ في الخلفية: Firestore + إعادة رسم
        (async () => {
            try {
                await db.collection('public_orders').doc(orderId).update({
                    'review.ownerReply': firebase.firestore.FieldValue.delete()
                });

                // 🔄 إزالة ownerReply من lastReviews
                try {
                    const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
                    const menuRef = db.collection('public_menus').doc(uid);
                    const menuSnap = await menuRef.get();
                    if (menuSnap.exists) {
                        const menuData = menuSnap.data();
                        const lastReviews = Array.isArray(menuData.lastReviews) ? menuData.lastReviews : [];
                        const idx = lastReviews.findIndex(r => r.orderId === orderId);
                        if (idx >= 0) {
                            const updated = Object.assign({}, lastReviews[idx]);
                            delete updated.ownerReply;
                            lastReviews[idx] = updated;
                            await menuRef.update({ lastReviews: lastReviews });
                            console.log('✅ [deleteReply] lastReviews synced');
                        }
                    }
                } catch(syncErr) {
                    console.warn('⚠️ [deleteReply] lastReviews sync failed:', syncErr);
                }

                window._storeOpenReviews();
            } catch(e) {
                console.error('[deleteReply]', e);
                if (typeof toast === 'function') toast('⚠️ فشل حذف الرد', 'error');
                window._storeOpenReviews();
            }
        })();
    };

    console.log('🏪 [my-store] ready');
})();
