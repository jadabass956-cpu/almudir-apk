// ============================================================
//  👤 CUSTOMER APP — واجهة العميل
//  v1.0.0
// ============================================================

(function() {
    'use strict';

    // ═══ Firebase Init ═══
    const firebaseConfig = {
        apiKey: "AIzaSyB08RzcPJe9B1gElNfgqS-hr-C8eTROQLw",
        authDomain: "jasoft-8bae9.firebaseapp.com",
        projectId: "jasoft-8bae9",
        storageBucket: "jasoft-8bae9.firebasestorage.app",
        messagingSenderId: "263989164835",
        appId: "1:263989164835:web:1fa891e67b032d8503aa96",
        measurementId: "G-VG4844PBW6"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // ═══ State ═══
    const state = {
        user: null,
        userData: null,
        location: {
            governorate: '',
            town: '',
            district: ''
        },
        gpsLocation: null,
        stores: [],
        filteredStores: [],
        currentTab: 'home',
        currentCat: 'all',
        currentSearch: '',
        loading: true,
        // 🆕 Browse state
        browseMode: 'stores',
        browseSort: 'rating',
        allProducts: [],
        // 🆕 Guest state
        isGuest: false,
        nonCustomerType: null,
        // 🆕 Orders state
        orders: [],
        ordersFilter: 'all',
        ordersLoading: false,
        // 🆕 Cart state
        cart: {},          // { [itemId]: { id, name, price, qty, image } }
        cartStore: null,   // { ownerUid, businessName, ... } — المتجر الحالي للسلة
        cartType: 'store', // 'store' | 'table'
        cartTableCode: null, // رمز الطاولة (إن وُجد)
        // 🆕 Votes state (للتصويت على المنتجات)
        itemVotes: {},
        // 🆕 Pinned stores (المتاجر المثبّتة — LocalStorage)
        pinnedStores: []
    };

    // ═══ Helpers ═══
    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c]));
    }

    function _getCatIcon(type) {
        const map = {
            'مطعم': '🍽️',
            'صيدلية': '💊',
            'سوبر ماركت': '🛒',
            'اتصالات': '📱',
            'موظفين': '👥',
            'متجر عام': '🏪',
            'خدمات': '🔧'
        };
        return map[type] || '🏪';
    }

    function _calcDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const toRad = (d) => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function _fmtDistance(km) {
        if (km == null) return '';
        if (km < 1) return Math.round(km * 1000) + ' م';
        return km.toFixed(1) + ' كم';
    }

    function _toast(msg, type) {
        console.log('[toast]', msg);
        try {
            // أنشئ عنصر toast إذا لم يوجد
            let toast = document.getElementById('customerToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'customerToast';
                document.body.appendChild(toast);
            }
            // 🎨 الألوان حسب النوع
            const themes = {
                success: { bg: 'linear-gradient(135deg,#27ae60,#2ecc71)', shadow: 'rgba(39,174,96,0.4)' },
                error:   { bg: 'linear-gradient(135deg,#c0392b,#e74c3c)', shadow: 'rgba(231,76,60,0.4)' },
                warning: { bg: 'linear-gradient(135deg,#d68910,#f39c12)', shadow: 'rgba(243,156,18,0.4)' },
                info:    { bg: 'linear-gradient(135deg,#2c3e50,#34495e)', shadow: 'rgba(52,73,94,0.4)' }
            };
            const theme = themes[type] || themes.info;

            toast.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%) translateY(20px);'
                + 'background:' + theme.bg + ';color:white;padding:14px 24px;border-radius:28px;'
                + 'font-size:14px;font-weight:900;font-family:inherit;z-index:999999;'
                + 'box-shadow:0 12px 32px ' + theme.shadow + ', 0 4px 12px rgba(0,0,0,0.2);'
                + 'opacity:0;transition:opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);'
                + 'max-width:88%;text-align:center;line-height:1.5;'
                + 'letter-spacing:-0.2px;direction:rtl;';
            toast.textContent = msg;

            // إظهار بحركة slide-up
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateX(-50%) translateY(0)';
                });
            });

            // إخفاء تلقائي بعد 3 ثوان
            clearTimeout(window._customerToastTimer);
            window._customerToastTimer = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
            }, 3000);
        } catch(e) {
            console.warn('[toast] error:', e);
        }
    }
    // ═══════════════════════════════════════════════
    // 🛒 دوال السلة الأساسية
    // ═══════════════════════════════════════════════

    function _cartSave() {
        try {
            localStorage.setItem('customer_cart', JSON.stringify({
                cart: state.cart,
                cartStore: state.cartStore,
                cartType: state.cartType,
                cartTableCode: state.cartTableCode
            }));
        } catch(e) {
            console.warn('[cart-save]', e);
        }
    }

    function _cartLoad() {
        try {
            const raw = localStorage.getItem('customer_cart');
            if (!raw) return;
            const data = JSON.parse(raw);
            state.cart = data.cart || {};
            state.cartStore = data.cartStore || null;
            state.cartType = data.cartType || 'store';
            state.cartTableCode = data.cartTableCode || null;
            console.log('🛒 [cart] loaded:', Object.keys(state.cart).length, 'items');
        } catch(e) {
            console.warn('[cart-load]', e);
        }
    }

    function _cartClear() {
        state.cart = {};
        state.cartStore = null;
        state.cartType = 'store';
        state.cartTableCode = null;
        try {
            localStorage.removeItem('customer_cart');
        } catch(e) {}
    }

    function _cartCount() {
        return Object.values(state.cart || {}).reduce((s, x) => s + (Number(x.qty) || 0), 0);
    }

    function _cartTotal() {
        return Object.values(state.cart || {}).reduce((s, x) => s + ((Number(x.qty) || 0) * (Number(x.price) || 0)), 0);
    }

    function _cartHas(itemId) {
        return !!(state.cart && state.cart[itemId]);
    }

    // 🆕 إضافة منتج للسلة
    function _cartAdd(itemId, productInfo, storeInfo, mode) {
        if (!itemId || !productInfo) return false;

        // إذا كانت السلة من متجر مختلف → نسأل
        const newStoreUid = storeInfo ? storeInfo.ownerUid : null;
        const currentStoreUid = state.cartStore ? state.cartStore.ownerUid : null;

        if (currentStoreUid && newStoreUid && currentStoreUid !== newStoreUid) {
            if (!confirm('⚠️ سلتك تحتوي على منتجات من متجر آخر.\n\nهل تريد إفراغ السلة والبدء من جديد؟')) {
                return false;
            }
            _cartClear();
        }

        // احفظ معلومات المتجر
        if (storeInfo) {
            state.cartStore = storeInfo;
        }
        state.cartType = mode || 'store';
        if (mode === 'table') {
            state.cartTableCode = storeInfo ? storeInfo._tableCode : null;
        }

        // أضف أو حدّث
        if (state.cart[itemId]) {
            state.cart[itemId].qty = (Number(state.cart[itemId].qty) || 0) + 1;
        } else {
            state.cart[itemId] = {
                id: itemId,
                name: productInfo.itemName || productInfo.name || 'منتج',
                price: Number(productInfo.price) || 0,
                qty: 1,
                image: productInfo.image || null
            };
        }

        _cartSave();
        return true;
    }

    function _cartChangeQty(itemId, delta) {
        if (!state.cart || !state.cart[itemId]) return;
        const item = state.cart[itemId];
        item.qty = (Number(item.qty) || 0) + Number(delta);

        if (item.qty <= 0) {
            delete state.cart[itemId];
        }
        _cartSave();
    }

    function _cartRemove(itemId) {
        if (!state.cart || !state.cart[itemId]) return;
        delete state.cart[itemId];
        _cartSave();
    }

    function _cartFindProduct(itemId) {
        return (state.allProducts || []).find(p => p.id === itemId);
    }


    // ═══ Content Renderers ═══
    // 🎬 إخفاء الـ Splash (بعد التحميل)
    function _hideSplash() {
        const splash = document.getElementById('shop1stSplash');
        if (!splash) return;
        splash.classList.add('hide');
        setTimeout(() => { splash.remove(); }, 500);
    }

    function _renderLoading() {
        document.getElementById('appContent').innerHTML = `
            <div class="loading-screen">
                <div class="loading-spinner"></div>
                <div>جاري التحميل...</div>
            </div>`;
    }

    function _renderEmpty(icon, title, desc) {
        return `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <div class="title">${_esc(title)}</div>
                <div class="desc">${_esc(desc)}</div>
            </div>`;
    }

    // ═══ Location Bar ═══
    function _renderLocationBar() {
        const hasGps = !!state.gpsLocation;
        const loc = state.location;
        const locText = [loc.governorate, loc.town].filter(Boolean).join(' — ') || 'غير محدد';

        return `
            <div class="location-bar">
                <div class="loc-icon">${hasGps ? '📍' : '🏘️'}</div>
                <div class="loc-text">
                    ${hasGps ? 'موقعك الحالي' : 'بلدتك'}
                    <small>${_esc(locText)}${hasGps ? ' — مرتب بالمسافة' : ' — فعّل GPS للترتيب'}</small>
                </div>
                ${!hasGps ? `<button onclick="_requestGPS()" style="background:white;border:none;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;color:#1565c0;cursor:pointer;font-family:inherit;">فعّل</button>` : ''}
            </div>`;
    }

    // ═══ Store Card ═══
    function _renderStoreCard(store) {
        const type = store.businessType || '';
        const icon = _getCatIcon(type);
        const name = store.businessName || 'متجر';
        const phone = store.phone || '';
        const loc = store.location || {};
        const locText = [loc.governorate, loc.town].filter(Boolean).join(' · ');

        // المسافة (إن توفرت)
        let distText = '';
        let distValue = null;
        if (state.gpsLocation && store.storeLocation && store.storeLocation.lat) {
            distValue = _calcDistance(
                state.gpsLocation.lat, state.gpsLocation.lng,
                Number(store.storeLocation.lat), Number(store.storeLocation.lng)
            );
            distText = _fmtDistance(distValue);
        }

        // مفتوح؟
        const openInfo = _isStoreOpen(store);

        // 📌 حالة التثبيت
        const pinned = _isPinned(store.ownerUid);
        const pinBtn = '<button onclick="event.stopPropagation();_togglePin(\'' + _esc(store.ownerUid || '') + '\')" '
            + 'title="' + (pinned ? 'إلغاء التثبيت' : 'تثبيت المتجر') + '" '
            + 'style="position:absolute;top:10px;left:10px;width:34px;height:34px;border-radius:50%;'
            + 'background:' + (pinned ? 'linear-gradient(135deg,#f39c12,#e67e22)' : 'rgba(255,255,255,0.9)') + ';'
            + 'color:' + (pinned ? 'white' : '#7f8c8d') + ';'
            + 'border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;'
            + 'box-shadow:0 2px 8px rgba(0,0,0,' + (pinned ? '0.25' : '0.12') + ');'
            + 'font-family:inherit;z-index:2;transition:all 0.2s;'
            + 'backdrop-filter:blur(6px);">'
            + (pinned ? '📌' : '📍')
            + '</button>';

        return `
            <div class="store-card" onclick="_openStore('${_esc(store.ownerUid || '')}')" style="position:relative;">
                ${pinBtn}
                <div class="store-logo" ${store.coverImage ? `style="background-image:url('${_esc(store.coverImage)}');"` : ''}>${store.coverImage ? '' : icon}</div>
                <div class="store-info">
                    <div class="store-name">${_esc(name)}</div>
                    <div class="store-meta">
                        ${type ? `<span>${icon} ${_esc(type)}</span>` : ''}
                        ${distText ? `<span>📍 ${distText}</span>` : (locText ? `<span>📍 ${_esc(locText)}</span>` : '')}
                        ${store.ratingsCount > 0 ? `<span>⭐ ${Number(store.avgRating || 0).toFixed(1)}</span>` : ''}
                    </div>
                    <span class="store-status ${openInfo.cls}">${openInfo.text}</span>
                </div>
            </div>`;
    }

    // ═══ Is Store Open? ═══
    function _isStoreOpen(store) {
        if (store.acceptOrders === false) {
            return { open: false, cls: 'closed', text: '⛔ متوقف مؤقتاً' };
        }
        if (store.open24_7 === true) {
            return { open: true, cls: 'open', text: '🟢 مفتوح 24/7' };
        }

        const now = new Date();
        const day = now.getDay();
        const time = now.toTimeString().slice(0, 5);
        const workingDays = Array.isArray(store.workingDays) ? store.workingDays : [0,1,2,3,4,5,6];
        const openTime = store.openTime || '10:00';
        const closeTime = store.closeTime || '23:00';

        if (!workingDays.includes(day)) {
            return { open: false, cls: 'closed', text: '📅 مغلق اليوم' };
        }
        if (time < openTime || time > closeTime) {
            return { open: false, cls: 'closed', text: '🌙 مغلق الآن' };
        }
        return { open: true, cls: 'open', text: `🟢 مفتوح حتى ${closeTime}` };
    }

    // ═══ Load Stores ═══
    async function _loadStores() {
        try {
            const snap = await db.collection('public_menus').limit(200).get();
            const stores = [];
            const allProducts = [];
            snap.forEach(d => {
                const data = d.data();
                // تجاهل المتاجر الفارغة
                if (!data.businessName) return;

                const storeInfo = {
                    ownerUid: d.id,
                    businessName: data.businessName || '',
                    businessType: data.businessType || '',
                    phone: data.phone || '',
                    location: data.location || {},
                    storeLocation: data.storeLocation || null,
                    coverImage: data.coverImage || null,
                    ratingsCount: Number(data.ratingsCount) || 0,
                    avgRating: Number(data.avgRating) || 0,
                    acceptOrders: data.acceptOrders !== false,
                    open24_7: data.open24_7 === true,
                    openTime: data.openTime || '10:00',
                    closeTime: data.closeTime || '23:00',
                    workingDays: Array.isArray(data.workingDays) ? data.workingDays : [0,1,2,3,4,5,6],
                    themeColor: data.themeColor || null,
                    lastReviews: Array.isArray(data.lastReviews) ? data.lastReviews : [],
                    description: data.businessDescription || data.description || '',
                    distanceFeePerKm: Number(data.distanceFeePerKm) || 0,
                    useGPS: data.useGPS === true,
                    prepTime: Number(data.prepTime) || 30,
                    deliveryFee: Number(data.deliveryFee) || 0,
                    useZones: data.useZones === true
                };
                stores.push(storeInfo);

                // 🆕 اجمع المنتجات من هذا المتجر
                const items = Array.isArray(data.items) ? data.items : [];
                items.forEach(item => {
                    if (!item || !item.itemName) return;
                    if (item.available === false) return;
                    if (Number(item.stock) <= 0 && item.stock !== undefined && item.stock !== null) return;

                    allProducts.push({
                        id: item.id,
                        itemName: item.itemName,
                        description: item.description || '',
                        price: Number(item.price) || 0,
                        priceUSD: Number(item.priceUSD) || 0,
                        image: item.image || null,
                        category: item.category || '',
                        stock: item.stock,
                        likes: Number(item.likes) || 0,
                        dislikes: Number(item.dislikes) || 0,
                        // 🎁 عرض خاص
                        onSale: item.onSale === true,
                        oldPrice: Number(item.oldPrice) || 0,
                        store: {
                            ownerUid: storeInfo.ownerUid,
                            businessName: storeInfo.businessName,
                            businessType: storeInfo.businessType,
                            coverImage: storeInfo.coverImage,
                            storeLocation: storeInfo.storeLocation,
                            location: storeInfo.location
                        }
                    });
                });
            });
            state.stores = stores;
            state.allProducts = allProducts;
            console.log('📦 [customer] loaded:', stores.length, 'stores,', allProducts.length, 'products');
            _applyFiltersAndSort();
        } catch (e) {
            console.error('[loadStores]', e);
            state.stores = [];
            state.filteredStores = [];
        }
    }

    // ═══ Filter + Sort ═══
    function _applyFiltersAndSort() {
        let list = [...state.stores];

        // فلترة حسب النشاط
        if (state.currentCat !== 'all') {
            list = list.filter(s => s.businessType === state.currentCat);
        }

        // فلترة حسب البحث
        if (state.currentSearch) {
            const q = state.currentSearch.toLowerCase().trim();
            list = list.filter(s => {
                const name = (s.businessName || '').toLowerCase();
                const type = (s.businessType || '').toLowerCase();
                return name.includes(q) || type.includes(q);
            });
        }

        // 🏛️ فلترة حسب المحافظة والبلدة (عند فشل GPS)
        if (!state.gpsLocation && state.location && state.location.governorate) {
            const gov = state.location.governorate;
            const town = state.location.town;

            // ① محاولة فلترة حسب المحافظة + البلدة
            let local = list.filter(s => {
                const sLoc = s.location || {};
                return sLoc.governorate === gov && sLoc.town === town;
            });

            // ② إن لم يجد → فلترة حسب المحافظة فقط
            if (local.length === 0) {
                local = list.filter(s => {
                    const sLoc = s.location || {};
                    return sLoc.governorate === gov;
                });
            }

            // ③ إن وجد نتائج → استخدمها
            if (local.length > 0) {
                list = local;
                console.log('🏛️ [filter] location:', gov, '/', town, '→', local.length, 'stores');
            } else {
                console.log('🏛️ [filter] no stores in', gov, '— showing all');
            }
        }

        // الترتيب
        if (state.gpsLocation) {
            // حسب المسافة + الأقرب أولاً
            list.forEach(s => {
                if (s.storeLocation && s.storeLocation.lat) {
                    s._distance = _calcDistance(
                        state.gpsLocation.lat, state.gpsLocation.lng,
                        Number(s.storeLocation.lat), Number(s.storeLocation.lng)
                    );
                } else {
                    s._distance = null;
                }
            });
            list.sort((a, b) => {
                // الأقرب أولاً
                if (a._distance != null && b._distance != null) return a._distance - b._distance;
                if (a._distance != null) return -1;
                if (b._distance != null) return 1;
                // ثم حسب التقييم
                return (b.avgRating || 0) - (a.avgRating || 0);
            });
        } else {
            // حسب التقييم
            list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        }

        // إعطاء الأولوية للمتاجر المفتوحة
        list.sort((a, b) => {
            const aOpen = _isStoreOpen(a).open ? 1 : 0;
            const bOpen = _isStoreOpen(b).open ? 1 : 0;
            return bOpen - aOpen;
        });

        state.filteredStores = list;
    }

    // ═══ Render Home ═══
    function _renderHome() {
        const content = document.getElementById('appContent');
        let html = '';

        html += _renderLocationBar();

        // 🗺️ خريطة مصغّرة تفاعلية
        html += '<div id="homeMiniMap" style="width:100%;height:200px;border-radius:14px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;position:relative;background:#ecf0f1;">'
            + '<div style="position:absolute;top:10px;right:10px;z-index:500;background:white;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:800;color:#8e44ad;box-shadow:0 2px 8px rgba(0,0,0,0.15);pointer-events:none;">🗺️ المتاجر قريبة منك</div>'
            + '</div>';

        // قسم الأقرب / نفس البلدة
        const list = state.filteredStores;
        if (list.length === 0) {
            html += _renderEmpty('🏪', 'لا توجد متاجر', 'لم نجد متاجر مطابقة. جرّب تغيير الفلتر أو البحث.');
        } else {
            // 📌 فصل المثبّتة عن الباقي
            const pinned = list.filter(s => _isPinned(s.ownerUid));
            const rest = list.filter(s => !_isPinned(s.ownerUid));

            // قسم المثبّتة (إن وُجدت)
            if (pinned.length > 0) {
                html += '<div class="section-title" style="display:flex;align-items:center;justify-content:space-between;"><span>📌 المتاجر المثبّتة <span class="badge" style="background:linear-gradient(135deg,#f39c12,#e67e22);">' + pinned.length + '</span></span></div>';
                pinned.forEach(s => { html += _renderStoreCard(s); });
            }

            // قسم الباقي
            if (rest.length > 0) {
                const title = pinned.length > 0 ? '🏪 باقي المتاجر' : '🏪 أقرب المتاجر إليك';
                html += '<div class="section-title" style="display:flex;align-items:center;justify-content:space-between;"><span>' + title + ' <span class="badge">' + rest.length + '</span></span></div>';
                rest.forEach(s => { html += _renderStoreCard(s); });
            }
        }

        content.innerHTML = html;

        // 🗺️ رسم الخريطة بعد إدراج HTML
        setTimeout(_renderHomeMiniMap, 100);
    }

    // ═══ GPS ═══
    window._requestGPS = function() {
        if (!navigator.geolocation) {
            alert('⚠️ المتصفح لا يدعم الموقع');
            return;
        }
        _toast('📍 جاري تحديد موقعك...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                state.gpsLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                    updatedAt: Date.now()
                };
                console.log('📍 [customer] GPS:', state.gpsLocation);
                _applyFiltersAndSort();
                _renderHome();
            },
            (err) => {
                console.warn('[customer] GPS error:', err);
                let msg = '⚠️ لم نتمكن من تحديد موقعك';
                if (err.code === 1) msg = '🚫 تم رفض إذن الموقع';
                else if (err.code === 2) msg = '📡 الموقع غير متاح';
                else if (err.code === 3) msg = '⏱️ انتهت المهلة';
                _toast(msg);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    };

    // ═══ Actions ═══
    // ⏱️ التحديث التلقائي لـ "طلباتي"
    let _ordersRefreshTimer = null;
    const ORDERS_REFRESH_MS = 30000; // 30 ثانية

    function _startOrdersAutoRefresh() {
        _stopOrdersAutoRefresh(); // نظّف أولاً
        console.log('⏱️ [orders] auto-refresh started (every ' + (ORDERS_REFRESH_MS/1000) + 's)');
        _ordersRefreshTimer = setInterval(async function() {
            // تحقق: هل ما زلنا على تبويب طلباتي؟
            if (state.currentTab !== 'orders') {
                _stopOrdersAutoRefresh();
                return;
            }
            // تحقق: هل المستخدم موجود؟
            if (!state.user || state.isGuest) return;

            try {
                // اجلب الطلبات الجديدة بدون إعادة رسم كامل
                const snap = await db.collection('public_orders')
                    .where('customerUid', '==', state.user.uid)
                    .limit(100)
                    .get();

                const freshOrders = snap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data,
                        createdAt: data.createdAt && data.createdAt.toMillis
                            ? data.createdAt.toMillis()
                            : (typeof data.createdAt === 'number' ? data.createdAt : 0)
                    };
                }).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);

                // 🎯 اكتشف التغييرات
                const oldMap = {};
                (state.orders || []).forEach(o => { oldMap[o.id] = o; });

                let changed = false;
                const statusLabels = {
                    'accepted': '✅ تم قبول طلبك',
                    'rejected': '❌ تم رفض الطلب',
                    'delivered': '📦 تم تسليم الطلب',
                    'preparing': '👨‍🍳 جاري التحضير',
                    'on_the_way': '🚗 الطلب في الطريق'
                };
                let statusToastMsg = null;

                freshOrders.forEach(newO => {
                    const old = oldMap[newO.id];
                    if (old && old.status !== newO.status && statusLabels[newO.status]) {
                        changed = true;
                        if (!statusToastMsg) statusToastMsg = statusLabels[newO.status];
                    } else if (!old) {
                        // طلب جديد ظهر (نادر — لا يفترض)
                        changed = true;
                    }
                });

                if (changed) {
                    console.log('🔄 [orders] changes detected — re-rendering');
                    state.orders = freshOrders;
                    if (statusToastMsg) {
                        _toast(statusToastMsg, 'success');
                    }
                    _renderOrders();
                } else {
                    console.log('✓ [orders] no changes');
                }
            } catch(e) {
                console.warn('[orders] auto-refresh failed:', e.message);
                // إذا فشل الاستعلام (Index محذوف) → أوقف المؤقت لتجنّب spam
                if (e.message && e.message.includes('index')) {
                    _stopOrdersAutoRefresh();
                }
            }
        }, ORDERS_REFRESH_MS);
    }

    function _stopOrdersAutoRefresh() {
        if (_ordersRefreshTimer) {
            clearInterval(_ordersRefreshTimer);
            _ordersRefreshTimer = null;
            console.log('⏱️ [orders] auto-refresh stopped');
        }
    }

    window._onTab = async function(tab) {
        state.currentTab = tab;
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // ⏳ انتظر اكتمال onAuthStateChanged (حتى 3 ثواني)
        if (state.loading && ['orders','profile'].includes(tab)) {
            console.log('⏳ [onTab] waiting for auth...');
            let tries = 0;
            while (state.loading && tries < 30) {
                await new Promise(r => setTimeout(r, 100));
                tries++;
            }
            console.log('✅ [onTab] auth ready, tries=' + tries);
        }

        // ⏱️ إدارة التحديث التلقائي
        if (tab === 'orders') {
            // ابدأ التحديث التلقائي فقط للعميل الحقيقي
            if (state.user && !state.isGuest) {
                _startOrdersAutoRefresh();
            }
        } else {
            // أوقفه عند مغادرة الطلبات
            _stopOrdersAutoRefresh();
        }

        if (tab === 'home') _renderHome();
        else if (tab === 'browse') _renderBrowse();
        else if (tab === 'orders') _renderOrders();
        else if (tab === 'profile') _renderProfile();
    };

    window._onCatFilter = function(cat, btn) {
        state.currentCat = cat;
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        if (btn) btn.classList.add('active');
        _applyFiltersAndSort();
        if (state.currentTab === 'home') _renderHome();
        else if (state.currentTab === 'browse') _renderBrowse();
    };

    window._onSearch = function(q) {
        state.currentSearch = q;
        _applyFiltersAndSort();
        if (state.currentTab === 'home') _renderHome();
        else if (state.currentTab === 'browse') _renderBrowse();
    };

    window._onHeaderAction = function() {
        _toast('🔔 لا توجد إشعارات جديدة');
    };

    window._openStore = function(uid) {
        if (!uid) return;

        // 🔐 التحقق من نوع الحساب (تاجر/موظف لا يدخلون)
        if (state.nonCustomerType) {
            _showWrongAccountType(state.nonCustomerType);
            return;
        }

        // ✅ عميل شرعي → افتح المتجر **داخل التطبيق**
        _renderStoreView(uid);
    };

    // ═══════════════════════════════════════════════
    // 🏪 عرض المتجر داخل التطبيق
    // ═══════════════════════════════════════════════
    let _currentStoreUid = null;
    let _currentStoreCategory = 'all';

    // 🏪 Overlay للمتجر — يُنشأ ديناميكياً (فوق الرئيسية)
    function _getStoreOverlay() {
        let overlay = document.getElementById('storeOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'storeOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#f5f7fa;z-index:1000;overflow-y:auto;transform:translateX(100%);transition:transform 0.3s ease;';
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    // 🎨 دالة تفتيح/تعتيم الألوان
    function _darkenColor(hex, amount) {
        try {
            if (!hex) return '#6a2d8a';
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
            const amt = amount || 30;
            const r = Math.max(0, parseInt(hex.substr(0,2), 16) - amt);
            const g = Math.max(0, parseInt(hex.substr(2,2), 16) - amt);
            const b = Math.max(0, parseInt(hex.substr(4,2), 16) - amt);
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        } catch(e) { return '#6a2d8a'; }
    }

    async function _renderStoreView(uid) {
        const container = _getStoreOverlay();
        requestAnimationFrame(() => { container.style.transform = 'translateX(0)'; });
        _currentStoreUid = uid;
        _currentStoreCategory = 'all';

        container.innerHTML = '<div style="padding: 60px 20px; text-align: center; color: #8e44ad;"><div style="font-size: 40px; margin-bottom: 12px;">⏳</div><div style="font-size: 15px; font-weight: 700;">جاري فتح المتجر...</div></div>';

        const store = (state.stores || []).find(s => s.ownerUid === uid);
        if (!store) {
            container.innerHTML = '<div class="empty-state" style="padding: 60px 20px; text-align: center;"><div style="font-size: 64px; margin-bottom: 16px;">🏪</div><div style="font-size: 18px; font-weight: 800; color: #2c3e50;">المتجر غير متوفر</div><div style="font-size: 14px; color: #7f8c8d; margin-top: 8px;">ربما تم إغلاقه أو حذفه</div><button onclick="_closeStoreView()" style="margin-top: 20px; background:#8e44ad; color:white; border:none; border-radius:10px; padding:10px 24px; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit;">← رجوع</button></div>';
            return;
        }

        const products = (state.allProducts || []).filter(p => p.store && p.store.ownerUid === uid);
        const cats = {};
        products.forEach(p => {
            const c = p.category || 'main';
            if (!cats[c]) cats[c] = 0;
            cats[c]++;
        });

        const name = store.businessName || 'متجر';
        const description = store.businessDescription || store.description || '';
        const type = store.businessType || '';
        const icon = _getCatIcon(type);
        const loc = store.location || {};
        const locText = [loc.governorate, loc.town].filter(Boolean).join(' · ');
        const phone = store.phone || '';
        const cleanPhone = String(phone || '').replace(/\D/g, '').replace(/^963/, '').replace(/^0+/, '');
        const openInfo = _isStoreOpen(store);
        const rating = store.avgRating ? Number(store.avgRating).toFixed(1) : '—';
        const ratingsCount = store.ratingsCount || 0;

        // 🎨 الألوان
        const themeColor = store.themeColor || '#8e44ad';
        const themeColorDark = _darkenColor(themeColor, 30);
        const themeColorSoft = _darkenColor(themeColor, -30);

        // 📏 المسافة
        let distanceText = '';
        if (state.gpsLocation && store.storeLocation && store.storeLocation.lat) {
            const d = _calcDistance(state.gpsLocation.lat, state.gpsLocation.lng, Number(store.storeLocation.lat), Number(store.storeLocation.lng));
            if (d !== null && d !== undefined) distanceText = _fmtDistance(d);
        }

        // 🛵 رسوم التوصيل
        const distanceFeePerKm = Number(store.distanceFeePerKm) || 0;
        const deliveryFee = store.useGPS && distanceText ? distanceFeePerKm + ' ل.س/كم' : (Number(store.deliveryFee) || 0) + ' ل.س';
        const prepTime = Number(store.prepTime) || 30;

        // 🎨 CSS Variables للحاوية
        container.style.setProperty('--store-primary', themeColor);
        container.style.setProperty('--store-primary-dark', themeColorDark);
        container.style.setProperty('--store-primary-soft', themeColorSoft);

        const catsHtml = Object.keys(cats).length > 1
            ? '<div style="display:flex; gap:8px; overflow-x:auto; padding: 12px 14px; background:white; border-bottom:1px solid #e9ecef; scrollbar-width:none;">' +
              '<button onclick="_setStoreCategory(\'all\')" data-cat="all" class="store-cat-chip active" style="background:linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ');color:white;border:1.5px solid ' + themeColor + ';border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;">📋 الكل (' + products.length + ')</button>' +
              Object.keys(cats).map(c => {
                  const catIcon = _getCatIcon(c);
                  return '<button onclick="_setStoreCategory(\'' + _esc(c) + '\')" data-cat="' + _esc(c) + '" class="store-cat-chip" style="background:white;color:#2c3e50;border:1.5px solid #e9ecef;border-radius:20px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;">' + catIcon + ' ' + _esc(c) + ' (' + cats[c] + ')</button>';
              }).join('') +
              '</div>'
            : '';

        const productsHtml = products.length === 0
            ? '<div style="text-align:center;padding:60px 20px;color:#95a5a6;font-size:14px;">📭 لا توجد منتجات حالياً</div>'
            : '<div style="display:flex;flex-direction:column;gap:10px;padding:12px;">' +
              products.map(p => _renderProductCard(p, themeColor)).join('') +
              '</div>';

        // 🎨 خلفية الغلاف
        const coverBg = store.coverImage
            ? "background-image: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.7)), url('" + _esc(store.coverImage) + "'); background-size: cover; background-position: center;"
            : 'background: linear-gradient(135deg, ' + themeColor + ', ' + themeColorDark + ');';

        // ☎️ سطر الهاتف
        const phoneLine = cleanPhone ? '<a href="tel:+963' + cleanPhone + '" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.25);color:white;text-decoration:none;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;backdrop-filter:blur(8px);">☎️ ' + _esc(phone) + '</a>' : '';

        // ⭐ قسم التقييمات
        const allReviews = Array.isArray(store.lastReviews) ? store.lastReviews : [];
        const reviews = allReviews.filter(r => r.visible !== false);
        let reviewsHtml = '';
        if (ratingsCount > 0 && reviews.length > 0) {
            const starsFull = Math.round(Number(rating) || 0);
            const starStr = '⭐'.repeat(starsFull) + '☆'.repeat(5 - starsFull);

            const reviewCards = reviews.slice(0, 3).map(function(r) {
                const rStars = '⭐'.repeat(Number(r.rating) || 0) + '☆'.repeat(5 - (Number(r.rating) || 0));
                const cName = r.customerName || 'عميل';
                const initial = cName.trim().charAt(0) || '؟';
                const comment = r.comment ? _esc(r.comment) : '';
                const when = r.createdAt ? _timeAgo(r.createdAt) : '';
                return '<div style="background:#f8f9fa;border-radius:12px;padding:12px;margin-bottom:8px;border-right:3px solid ' + themeColor + ';">'
                    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
                        + '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ');color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;flex-shrink:0;">' + _esc(initial) + '</div>'
                        + '<div style="flex:1;min-width:0;">'
                            + '<div style="font-size:13px;font-weight:800;color:#2c3e50;">' + _esc(cName) + '</div>'
                            + '<div style="font-size:14px;letter-spacing:1px;">' + rStars + '</div>'
                        + '</div>'
                        + (when ? '<div style="font-size:11px;color:#95a5a6;flex-shrink:0;">' + _esc(when) + '</div>' : '')
                    + '</div>'
                    + (comment ? '<div style="font-size:13px;color:#4a5568;line-height:1.6;font-style:italic;">"' + comment + '"</div>' : '')
                    + (r.ownerReply ? '<div style="background:#f0f8ff;border-right:3px solid #3498db;border-radius:8px;padding:10px;margin-top:8px;"><div style="font-size:11px;color:#2980b9;font-weight:700;margin-bottom:4px;">🏪 رد المتجر:</div><div style="font-size:12px;color:#2c3e50;line-height:1.6;">' + _esc(r.ownerReply) + '</div></div>' : '')
                    + '</div>';
            }).join('');

            const moreBtn = reviews.length > 3
                ? '<button onclick="_openAllReviews(\'' + _esc(uid) + '\')" style="width:100%;background:white;border:2px solid ' + themeColor + ';color:' + themeColor + ';border-radius:10px;padding:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;margin-top:4px;">عرض كل التقييمات (' + reviews.length + ') ←</button>'
                : '';

            reviewsHtml = '<div style="background:white;border-radius:14px;padding:14px;margin:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'
                    + '<div style="font-size:15px;font-weight:900;color:#2c3e50;">⭐ آراء العملاء</div>'
                    + '<div style="text-align:left;">'
                        + '<div style="font-size:18px;font-weight:900;color:' + themeColor + ';line-height:1;">' + rating + '</div>'
                        + '<div style="font-size:10px;color:#7f8c8d;">' + ratingsCount + ' تقييم</div>'
                    + '</div>'
                + '</div>'
                + reviewCards
                + moreBtn
                + '</div>';
        }

        // 📝 سطر الوصف
        const descLine = description ? '<div style="font-size:12px;opacity:0.9;margin-bottom:8px;max-width:90%;">' + _esc(description) + '</div>' : '';

        // 🛵 بطاقة التوصيل
        const deliveryCard = (distanceText || deliveryFee !== '0 ل.س')
            ? '<div style="background:white;border-radius:14px;padding:14px;margin:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;">'
                + '<span style="color:#7f8c8d;font-weight:700;">📍 المسافة</span>'
                + '<span style="font-weight:900;color:#2c3e50;">' + (distanceText || '—') + '</span>'
                + '</div>'
                + '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;border-top:1px dashed #e9ecef;">'
                + '<span style="color:#7f8c8d;font-weight:700;">🛵 رسوم التوصيل</span>'
                + '<span style="font-weight:900;color:' + themeColor + ';">' + deliveryFee + '</span>'
                + '</div>'
                + '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;border-top:1px dashed #e9ecef;">'
                + '<span style="color:#7f8c8d;font-weight:700;">⏱️ يصل خلال</span>'
                + '<span style="font-weight:900;color:#2c3e50;">' + prepTime + ' دقيقة</span>'
                + '</div>'
                + '</div>'
            : '';

        container.innerHTML =
            '<div style="padding-bottom: 100px; background:#f5f7fa; min-height:100vh;">'

            // 🎨 الغلاف الكبير
            + '<div style="' + coverBg + ' min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px 18px 18px; color: white; position: relative;">'

                // زر الرجوع
                + '<button onclick="_closeStoreView()" style="position:absolute;top:16px;left:16px;background:rgba(255,255,255,0.25);backdrop-filter:blur(10px);color:white;border:none;border-radius:50%;width:40px;height:40px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;">←</button>'

                // حالة المتجر
                + '<span style="position:absolute; top:20px; right:18px; background:' + (openInfo.cls === 'open' ? '#27ae60' : '#e74c3c') + '; color:white; font-size:11px; font-weight:800; padding:5px 14px; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">' + openInfo.text + '</span>'

                + '<div style="width:100%;">'
                    + '<div style="font-size: 26px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.55); margin-bottom: 8px;">' + _esc(name) + '</div>'
                    + descLine
                    + '<div style="font-size: 13px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">'
                        + (type ? '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-weight:700;backdrop-filter:blur(6px);">' + icon + ' ' + _esc(type) + '</span>' : '')
                        + (locText ? '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-weight:700;backdrop-filter:blur(6px);">📍 ' + _esc(locText) + '</span>' : '')
                        + (ratingsCount > 0 ? '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-weight:700;backdrop-filter:blur(6px);">⭐ ' + rating + ' (' + ratingsCount + ')</span>' : '')
                        + phoneLine
                    + '</div>'
                + '</div>'
            + '</div>'

            // 🛵 بطاقة التوصيل
            + deliveryCard

            // ⭐ التقييمات
            + reviewsHtml

            // 🎯 الفئات
            + catsHtml

            // 🛒 المنتجات
            + productsHtml

            + '</div>';

        // 🛒 حدّث FAB السلة
        _updateCartFab();
    }

    function _renderProductCard(p, themeColor) {
        themeColor = themeColor || '#8e44ad';
        const themeColorDark = _darkenColor(themeColor, 30);
        const price = Number(p.price) || 0;
        const priceUSD = Number(p.priceUSD) || 0;
        // 🎁 عرض خاص
        const onSale = p.onSale === true && Number(p.oldPrice) > price;
        const oldPrice = onSale ? Number(p.oldPrice) : 0;

        // 🖼️ صورة المنتج (مربع صغير)
        const img = p.image
            ? '<div style="width:100px;height:100px;flex-shrink:0;background-image:url(\'' + _esc(p.image) + '\');background-size:cover;background-position:center;border-radius:14px;"></div>'
            : '<div style="width:100px;height:100px;flex-shrink:0;background:#f5f7fa;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:44px;">📦</div>';

        const votes = _getItemVotes(p.id);
        const likes = votes.likes;
        const dislikes = votes.dislikes;
        const myVote = votes.myVote;
        const likeActive = myVote === 'like';
        const dislikeActive = myVote === 'dislike';
        const inCart = _cartHas(p.id);
        const cartQty = inCart ? state.cart[p.id].qty : 0;

        // 🛒 زر السلة
        const btnHtml = inCart
            ? '<div style="display:flex;align-items:center;gap:4px;background:#f5f7fa;border-radius:10px;padding:4px;">'
                + '<button onclick="event.stopPropagation();_pmCartDec(\'' + _esc(p.id) + '\')" style="width:28px;height:28px;background:white;color:#2c3e50;border:none;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 1px 3px rgba(0,0,0,0.08);">−</button>'
                + '<span style="min-width:26px;text-align:center;font-size:13px;font-weight:900;color:#2c3e50;">' + cartQty + '</span>'
                + '<button onclick="event.stopPropagation();_pmAddProductToCart(\'' + _esc(p.id) + '\')" style="width:28px;height:28px;background:linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ');color:white;border:none;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;">+</button>'
                + '</div>'
            : '<button onclick="event.stopPropagation();_pmAddProductToCart(\'' + _esc(p.id) + '\')" style="background:linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ');color:white;border:none;border-radius:12px;padding:11px 18px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,0.18);">🛒 اطلب</button>';

        // 💵 سطر السعر
        const priceHtml = '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px;flex-wrap:wrap;">'
            + (onSale ? '<span style="font-size:12px;color:#95a5a6;text-decoration:line-through;">' + oldPrice.toLocaleString('en-US') + ' ل.س</span>' : '')
            + '<span style="font-size:18px;font-weight:900;color:' + (onSale ? '#e74c3c' : themeColor) + ';">' + price.toLocaleString('en-US') + ' <span style="font-size:12px;font-weight:700;">ل.س</span></span>'
            + (onSale ? '<span style="font-size:14px;" title="عرض خاص">🎁</span>' : '')
            + (priceUSD > 0 ? '<span style="font-size:11px;color:#95a5a6;">$' + priceUSD.toFixed(2) + '</span>' : '')
            + '</div>';

        // 👍👎 التصويتات
        const votesHtml = '<div style="display:flex;gap:4px;">'
            + '<button onclick="event.stopPropagation();_pmVote(\'' + _esc(p.id) + '\',\'like\')" ' + (likeActive ? 'disabled' : '') + ' style="background:' + (likeActive ? 'linear-gradient(135deg,#27ae60,#2ecc71)' : '#f5f7fa') + ';color:' + (likeActive ? 'white' : '#7f8c8d') + ';border:none;border-radius:9px;padding:5px 12px;font-size:12px;font-weight:800;cursor:' + (likeActive ? 'default' : 'pointer') + ';font-family:inherit;display:inline-flex;align-items:center;gap:4px;">👍 ' + likes + '</button>'
            + '<button onclick="event.stopPropagation();_pmVote(\'' + _esc(p.id) + '\',\'dislike\')" ' + (dislikeActive ? 'disabled' : '') + ' style="background:' + (dislikeActive ? 'linear-gradient(135deg,#e74c3c,#c0392b)' : '#f5f7fa') + ';color:' + (dislikeActive ? 'white' : '#7f8c8d') + ';border:none;border-radius:9px;padding:5px 12px;font-size:12px;font-weight:800;cursor:' + (dislikeActive ? 'default' : 'pointer') + ';font-family:inherit;display:inline-flex;align-items:center;gap:4px;">👎 ' + dislikes + '</button>'
            + '</div>';

        return '<div style="background:white;border-radius:16px;padding:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);display:flex;gap:14px;align-items:center;">'

            // 📦 الصورة
            + '<div onclick="_pmAddProductToCart(\'' + _esc(p.id) + '\')" style="cursor:pointer;flex-shrink:0;">' + img + '</div>'

            // 📝 التفاصيل
            + '<div style="flex:1;min-width:0;cursor:pointer;" onclick="_pmAddProductToCart(\'' + _esc(p.id) + '\')">'
                + '<div style="font-size:15px;font-weight:900;color:#2c3e50;margin-bottom:8px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + _esc(p.itemName) + '</div>'
                + priceHtml
                + votesHtml
            + '</div>'

            // 🛒 زر السلة
            + '<div style="flex-shrink:0;">' + btnHtml + '</div>'

            + '</div>';
    }

    // ═══════════════════════════════════════════════
    // 🍽️ عرض طاولة مطعم (QR — بدون تسجيل)
    // ═══════════════════════════════════════════════
    let _currentTableCode = null;
    let _currentTableOwnerUid = null;
    let _currentTableNumber = null;
    let _currentTableCategory = 'all';

    async function _openTableMode(code) {
        const container = _getStoreOverlay();
        _currentTableCode = code;
        _currentTableCategory = 'all';

        // ✨ اعرض overlay
        requestAnimationFrame(() => {
            container.style.transform = 'translateX(0)';
        });

        // حالة التحميل
        container.innerHTML = `
            <div style="padding: 60px 20px; text-align: center; color: #8e44ad;">
                <div style="font-size: 40px; margin-bottom: 12px;">🍽️</div>
                <div style="font-size: 15px; font-weight: 700;">جاري فتح الطاولة...</div>
            </div>`;

        try {
            // ① اقرأ الطاولة
            const tSnap = await db.collection('public_tables').doc(code).get();
            if (!tSnap.exists) {
                container.innerHTML = `
                    <div style="padding: 60px 20px; text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 16px;">🚫</div>
                        <div style="font-size: 18px; font-weight: 800; color: #2c3e50;">هذا الرمز غير صالح</div>
                        <div style="font-size: 14px; color: #7f8c8d; margin-top: 8px;">ربما تم حذفه أو تعطيله</div>
                        <button onclick="_closeTableMode()" style="margin-top: 20px; background:#8e44ad; color:white; border:none; border-radius:10px; padding:10px 24px; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit;">← رجوع</button>
                    </div>`;
                return;
            }
            const tData = tSnap.data();
            if (tData.active === false) {
                container.innerHTML = `
                    <div style="padding: 60px 20px; text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 16px;">🔒</div>
                        <div style="font-size: 18px; font-weight: 800; color: #2c3e50;">الطاولة معطّلة</div>
                        <div style="font-size: 14px; color: #7f8c8d; margin-top: 8px;">راجع النادل</div>
                        <button onclick="_closeTableMode()" style="margin-top: 20px; background:#8e44ad; color:white; border:none; border-radius:10px; padding:10px 24px; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit;">← رجوع</button>
                    </div>`;
                return;
            }

            _currentTableOwnerUid = tData.ownerUid;
            _currentTableNumber = tData.tableNumber;

            // ② ابحث عن المتجر
            const store = (state.stores || []).find(s => s.ownerUid === _currentTableOwnerUid);
            if (!store) {
                container.innerHTML = `
                    <div style="padding: 60px 20px; text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 16px;">🏪</div>
                        <div style="font-size: 18px; font-weight: 800; color: #2c3e50;">المطعم غير متوفر</div>
                        <button onclick="_closeTableMode()" style="margin-top: 20px; background:#8e44ad; color:white; border:none; border-radius:10px; padding:10px 24px; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit;">← رجوع</button>
                    </div>`;
                return;
            }

            // ③ المنتجات
            const products = (state.allProducts || []).filter(p =>
                p.store && p.store.ownerUid === _currentTableOwnerUid
            );

            // ④ التصنيفات
            const cats = {};
            products.forEach(p => {
                const c = p.category || 'main';
                if (!cats[c]) cats[c] = 0;
                cats[c]++;
            });

            // ⑤ معلومات
            const name = store.businessName || 'مطعم';
            const type = store.businessType || '';
            const icon = _getCatIcon(type);
            const rating = store.avgRating ? Number(store.avgRating).toFixed(1) : '—';
            const ratingsCount = store.ratingsCount || 0;

            // ⑥ التصنيفات HTML
            const catsHtml = Object.keys(cats).length > 1
                ? '<div style="display:flex; gap:6px; overflow-x:auto; padding: 10px 12px; background:white; border-bottom:1px solid #f0f0f0;">' +
                  '<button onclick="_setTableCategory(\'all\')" data-cat="all" class="table-cat-chip active" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:20px;padding:7px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;">📋 الكل (' + products.length + ')</button>' +
                  Object.keys(cats).map(c => {
                      const catIcon = _getCatIcon(c);
                      return '<button onclick="_setTableCategory(\'' + _esc(c) + '\')" data-cat="' + _esc(c) + '" class="table-cat-chip" style="background:#f5f7fa;color:#7f8c8d;border:none;border-radius:20px;padding:7px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;">' + catIcon + ' ' + _esc(c) + ' (' + cats[c] + ')</button>';
                  }).join('') +
                  '</div>'
                : '';

            // ⑦ المنتجات
            const productsHtml = products.length === 0
                ? '<div style="text-align:center;padding:60px 20px;color:#95a5a6;font-size:14px;">📭 لا توجد أصناف حالياً</div>'
                : '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));gap:12px;padding:12px;">' +
                  products.map(p => _renderTableProductCard(p)).join('') +
                  '</div>';

            // ⑧ البناء النهائي
            container.innerHTML = `
                <div style="padding-bottom: 100px; min-height: 100vh; background: #f5f7fa;">
                    <div style="display:flex;align-items:center;gap:10px;padding:12px;background:white;border-bottom:1px solid #f0f0f0;position:sticky;top:0;z-index:100;">
                        <button onclick="_closeTableMode()" style="background:#f5f7fa;border:none;border-radius:10px;padding:8px 14px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;color:#2c3e50;">← خروج</button>
                        <div style="font-size:15px;font-weight:800;color:#2c3e50;">🍽️ طاولة #${_esc(String(_currentTableNumber))}</div>
                    </div>

                    <div style="background:linear-gradient(135deg, #8e44ad, #9b59b6); color:white; padding:20px; text-align:center;">
                        <div style="font-size:32px;margin-bottom:8px;">🪑</div>
                        <div style="font-size:22px;font-weight:900;margin-bottom:6px;">طاولة #${_esc(String(_currentTableNumber))}</div>
                        <div style="font-size:14px;opacity:0.9;">${icon} ${_esc(name)}</div>
                        ${ratingsCount > 0 ? '<div style="font-size:13px;opacity:0.9;margin-top:4px;">⭐ ' + rating + ' (' + ratingsCount + ')</div>' : ''}
                    </div>

                    <div style="background:#27ae60;color:white;padding:8px;text-align:center;font-size:12px;font-weight:800;">
                        ✅ الطاولة مفتوحة — اطلب الآن
                    </div>

                    ${catsHtml}
                    ${productsHtml}
                </div>`;
        } catch(e) {
            console.error('[table-mode]', e);
            container.innerHTML = `
                <div style="padding: 60px 20px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 16px;">❌</div>
                    <div style="font-size: 18px; font-weight: 800; color: #2c3e50;">حدث خطأ</div>
                    <div style="font-size: 14px; color: #7f8c8d; margin-top: 8px;">${_esc(e.message || 'حاول مرة أخرى')}</div>
                    <button onclick="_closeTableMode()" style="margin-top: 20px; background:#8e44ad; color:white; border:none; border-radius:10px; padding:10px 24px; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit;">← رجوع</button>
                </div>`;
        }
    }

    // 🎴 بطاقة منتج (لوضع الطاولة)
    function _renderTableProductCard(p) {
        const price = Number(p.price) || 0;
        const img = p.image
            ? `<div style="width:100%;height:120px;background-image:url('${_esc(p.image)}');background-size:cover;background-position:center;border-radius:10px;margin-bottom:8px;"></div>`
            : `<div style="width:100%;height:120px;background:#f5f7fa;border-radius:10px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:44px;">📦</div>`;

        return `
            <div onclick="_tableAddToCart('${_esc(p.id)}')" style="background:white;border-radius:14px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;">
                ${img}
                <div style="font-size:13px;font-weight:800;color:#2c3e50;margin-bottom:4px;min-height:34px;line-height:1.3;">${_esc(p.itemName)}</div>
                <div style="font-size:14px;font-weight:900;color:#27ae60;margin-bottom:6px;">${price.toLocaleString('en-US')} ل.س</div>
                <button onclick="event.stopPropagation();_tableAddToCart('${_esc(p.id)}')" style="width:100%;background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;border-radius:8px;padding:8px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;">🛒 اطلب</button>
            </div>`;
    }

    // 🔄 تغيير تصنيف الطاولة
    window._setTableCategory = function(cat) {
        _currentTableCategory = cat;
        document.querySelectorAll('.table-cat-chip').forEach(btn => {
            const isActive = btn.dataset.cat === cat;
            btn.style.background = isActive ? 'linear-gradient(135deg,#8e44ad,#9b59b6)' : '#f5f7fa';
            btn.style.color = isActive ? 'white' : '#7f8c8d';
        });
    };

    // 🛒 إضافة منتج للسلة (طاولة)
    window._tableAddToCart = function(productId) {
        const product = _cartFindProduct(productId);
        if (!product) {
            _toast('⚠️ الصنف غير متوفر');
            return;
        }

        const storeInfo = product.store ? {
            ownerUid: product.store.ownerUid,
            businessName: product.store.businessName,
            businessType: product.store.businessType,
            _tableCode: _currentTableCode
        } : (state.cartStore || null);

        const added = _cartAdd(productId, product, storeInfo, 'table');

        if (added) {
            _toast('🛒 أُضيف للطاولة');
            console.log('🍽️ [table-cart] added:', productId);
            _updateCartFab();
        }
    };

    // ⬅️ إغلاق وضع الطاولة
    window._closeTableMode = function() {
        _currentTableCode = null;
        _currentTableOwnerUid = null;
        _currentTableNumber = null;
        _currentTableCategory = 'all';
        const overlay = document.getElementById('storeOverlay');
        if (overlay) {
            overlay.style.transform = 'translateX(100%)';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    };

    // ═══════════════════════════════════════════════
    // 👍👎 التصويت + 🛒 دوال السلة الحقيقية
    // ═══════════════════════════════════════════════

    function _loadItemVotes() {
        try {
            const raw = localStorage.getItem('customer_itemVotes');
            state.itemVotes = raw ? JSON.parse(raw) : {};
        } catch(e) {
            state.itemVotes = {};
        }
    }

    function _saveItemVotes() {
        try {
            localStorage.setItem('customer_itemVotes', JSON.stringify(state.itemVotes || {}));
        } catch(e) {}
    }

    // ═══ 📌 المتاجر المثبّتة (Pinned Stores) ═══
    function _loadPinnedStores() {
        try {
            const raw = localStorage.getItem('customer_pinnedStores');
            state.pinnedStores = raw ? JSON.parse(raw) : [];
        } catch(e) {
            state.pinnedStores = [];
        }
    }

    function _savePinnedStores() {
        try {
            localStorage.setItem('customer_pinnedStores', JSON.stringify(state.pinnedStores || []));
        } catch(e) {}
    }

    function _isPinned(uid) {
        return (state.pinnedStores || []).indexOf(uid) !== -1;
    }

    window._togglePin = function(uid) {
        if (!uid) return;
        state.pinnedStores = state.pinnedStores || [];
        const idx = state.pinnedStores.indexOf(uid);
        if (idx === -1) {
            state.pinnedStores.push(uid);
            _toast('📌 تم تثبيت المتجر', 'success');
        } else {
            state.pinnedStores.splice(idx, 1);
            _toast('📍 تم إلغاء التثبيت', 'info');
        }
        _savePinnedStores();
        if (state.currentTab === 'home') _renderHome();
        else if (state.currentTab === 'browse') _renderBrowse();
    };

    function _getItemVotes(itemId) {
        const p = (state.allProducts || []).find(x => x.id === itemId);
        const likes = p ? (Number(p.likes) || 0) : 0;
        const dislikes = p ? (Number(p.dislikes) || 0) : 0;
        const myVote = (state.itemVotes && state.itemVotes[itemId]) || null;
        return { likes, dislikes, myVote };
    }

    window._pmVote = async function(itemId, voteType) {
        if (!itemId || !voteType) return;
        if (voteType !== 'like' && voteType !== 'dislike') return;

        // 🔒 قفل — لمنع الضغط السريع (300ms)
        window._pmVoteLock = window._pmVoteLock || {};
        if (window._pmVoteLock[itemId]) return;

        const product = (state.allProducts || []).find(x => x.id === itemId);
        if (!product || !product.store) {
            _toast('⚠️ المنتج غير متوفر');
            return;
        }

        const ownerUid = product.store.ownerUid;
        const currentVote = (state.itemVotes && state.itemVotes[itemId]) || null;

        // 🎯 منطق التبديل
        const isSame = currentVote === voteType;
        const isSwap = currentVote && currentVote !== voteType;
        const oldVote = currentVote;

        // ⚡ حساب likes/dislikes محلياً (Optimistic)
        const oldLikes = Number(product.likes) || 0;
        const oldDislikes = Number(product.dislikes) || 0;
        let newLikes = oldLikes;
        let newDislikes = oldDislikes;

        if (isSame) {
            if (voteType === 'like') newLikes = Math.max(0, newLikes - 1);
            else newDislikes = Math.max(0, newDislikes - 1);
        } else if (isSwap) {
            if (oldVote === 'like') newLikes = Math.max(0, newLikes - 1);
            if (oldVote === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
            if (voteType === 'like') newLikes++;
            else newDislikes++;
        } else {
            if (voteType === 'like') newLikes++;
            else newDislikes++;
        }

        // ⚡ تحديث محلي فوري
        state.itemVotes = state.itemVotes || {};
        if (isSame) {
            delete state.itemVotes[itemId];
        } else {
            state.itemVotes[itemId] = voteType;
        }
        _saveItemVotes();
        product.likes = newLikes;
        product.dislikes = newDislikes;

        // 🔒 ضع القفل
        window._pmVoteLock[itemId] = true;

        // ⚡ إعادة رسم فورية
        if (_currentStoreUid) {
            _refreshStoreProducts();
        }

        // ⚡ toast فوري
        if (isSame) {
            _toast('🔕 تم إلغاء تصويتك', 'info');
        } else if (isSwap) {
            _toast(voteType === 'like' ? '👍 تم تغيير تصويتك' : '👎 تم تغيير تصويتك', 'success');
        } else {
            _toast(voteType === 'like' ? '👍 شكراً!' : '👎 شكراً على الملاحظة', 'success');
        }

        // ⚡ فكّ القفل بعد 300ms
        setTimeout(() => {
            if (window._pmVoteLock) delete window._pmVoteLock[itemId];
        }, 300);

        // ⚡ في الخلفية: Firestore
        (async () => {
            try {
                const menuRef = db.collection('public_menus').doc(ownerUid);
                const menuSnap = await menuRef.get();
                if (!menuSnap.exists) throw new Error('menu not found');

                const menuData = menuSnap.data();
                const items = Array.isArray(menuData.items) ? menuData.items : [];
                const idx = items.findIndex(it => it.id === itemId);
                if (idx < 0) throw new Error('item not found');

                const item = items[idx];
                let likes = Number(item.likes) || 0;
                let dislikes = Number(item.dislikes) || 0;

                if (isSame) {
                    if (voteType === 'like') likes = Math.max(0, likes - 1);
                    else dislikes = Math.max(0, dislikes - 1);
                } else if (isSwap) {
                    if (oldVote === 'like') likes = Math.max(0, likes - 1);
                    if (oldVote === 'dislike') dislikes = Math.max(0, dislikes - 1);
                    if (voteType === 'like') likes++;
                    else dislikes++;
                } else {
                    if (voteType === 'like') likes++;
                    else dislikes++;
                }

                items[idx] = Object.assign({}, item, { likes: likes, dislikes: dislikes });
                await menuRef.update({ items: items });

                // مزامنة القيم النهائية
                product.likes = likes;
                product.dislikes = dislikes;

                console.log('👍 [vote] synced', voteType, '| likes:', likes, '| dislikes:', dislikes);
            } catch(e) {
                console.error('[vote]', e);
                _toast('⚠️ فشل التصويت', 'error');

                // تراجع
                if (state.itemVotes) {
                    if (oldVote) state.itemVotes[itemId] = oldVote;
                    else delete state.itemVotes[itemId];
                    _saveItemVotes();
                }
                product.likes = oldLikes;
                product.dislikes = oldDislikes;

                if (_currentStoreUid) {
                    _refreshStoreProducts();
                }
            }
        })();
    };

    window._pmAddProductToCart = function(productId) {
        const product = _cartFindProduct(productId);
        if (!product) {
            _toast('⚠️ المنتج غير متوفر');
            return;
        }

        const storeInfo = product.store ? {
            ownerUid: product.store.ownerUid,
            businessName: product.store.businessName,
            businessType: product.store.businessType
        } : (state.cartStore || null);

        const mode = state.cartType || 'store';

        const added = _cartAdd(productId, product, storeInfo, mode);

        if (added) {
            _toast('🛒 أُضيف للسلة');
            console.log('🛒 [cart] added:', productId);
            _updateCartFab();
            if (_currentStoreUid) {
                _refreshStoreProducts();
            }
        }
    };

    window._pmCartDec = function(productId) {
        _cartChangeQty(productId, -1);
        _toast('🗑️ تم التعديل');
        _updateCartFab();
        if (_currentStoreUid) {
            _refreshStoreProducts();
        }
    };

    // ═══════════════════════════════════════════════
    // 🛒 FAB السلة العائم
    // ═══════════════════════════════════════════════

    function _updateCartFab() {
        const count = _cartCount();
        let fab = document.getElementById('cartFab');

        if (count === 0) {
            if (fab) fab.remove();
            return;
        }

        // ✨ CSS بنفس نمط المساعد الذكي (تُحقن مرة واحدة فقط)
        if (!document.getElementById('_cartFabStyles')) {
            const style = document.createElement('style');
            style.id = '_cartFabStyles';
            style.textContent = [
                '@keyframes _cartFloat {',
                '  0%, 100% { transform: translateY(0) rotate(0deg); box-shadow: 0 4px 14px rgba(102,126,234,0.45), 0 0 0 0 rgba(102,126,234,0.35); }',
                '  25%      { transform: translateY(-6px) rotate(-2deg); }',
                '  50%      { transform: translateY(-12px) rotate(0deg); box-shadow: 0 16px 28px rgba(102,126,234,0.55), 0 0 0 10px rgba(102,126,234,0); }',
                '  75%      { transform: translateY(-6px) rotate(2deg); }',
                '}',
                '@keyframes _cartGlow {',
                '  0%, 100% { box-shadow: 0 4px 14px rgba(102,126,234,0.45), 0 0 0 0 rgba(102,126,234,0.4); }',
                '  50%      { box-shadow: 0 12px 24px rgba(102,126,234,0.55), 0 0 0 14px rgba(102,126,234,0); }',
                '}',
                '#cartFab {',
                '  animation: _cartFloat 5s ease-in-out infinite;',
                '  will-change: transform, box-shadow;',
                '  transition: transform 0.3s ease, box-shadow 0.3s ease;',
                '  transform-origin: center;',
                '}',
                '#cartFab svg {',
                '  display: block;',
                '  transition: transform 0.3s ease;',
                '  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));',
                '}',
                '#cartFab:hover svg {',
                '  transform: scale(1.06) rotate(-3deg);',
                '}',
                '#cartFab:active svg {',
                '  transform: scale(0.94);',
                '}',
                '#cartFab::after {',
                '  content: "";',
                '  position: absolute;',
                '  inset: -4px;',
                '  border-radius: 50%;',
                '  background: radial-gradient(circle, rgba(102,126,234,0.35) 0%, transparent 70%);',
                '  z-index: -1;',
                '  animation: _cartGlow 3s ease-in-out infinite;',
                '  pointer-events: none;',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        }

        // ✨ SVG أيقونة السلة — بنفس نمط المساعد الذكي
        const cartSvg = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="width:34px;height:34px;display:block;pointer-events:none;" aria-hidden="true">'
            + '<path d="M3 6 L7 6 L10.5 21 C10.7 22.2 11.7 23 12.9 23 L23.5 23 C24.7 23 25.7 22.2 25.9 21 L28.5 9.5 L8 9.5" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
            + '<circle cx="13.5" cy="16" r="1.3" fill="white"/>'
            + '<circle cx="18" cy="16" r="1.3" fill="white"/>'
            + '<circle cx="22.5" cy="16" r="1.3" fill="white"/>'
            + '<circle cx="13.5" cy="27.5" r="1.6" fill="white"/>'
            + '<circle cx="23.5" cy="27.5" r="1.6" fill="white"/>'
            + '<path d="M26.5 2 L27.2 4 L29 4.7 L27.2 5.4 L26.5 7.4 L25.8 5.4 L24 4.7 L25.8 4 Z" fill="#FFD54A" stroke="#FFD54A" stroke-width="0.5" stroke-linejoin="round"/>'
            + '<circle cx="29" cy="8" r="0.8" fill="#FFD54A"/>'
            + '</svg>';

        if (!fab) {
            fab = document.createElement('button');
            fab.id = 'cartFab';
            fab.onclick = _openCartModal;
            fab.title = 'السلة';
            fab.style.cssText = 'position:fixed;bottom:24px;right:24px;width:62px;height:62px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:2147483647;cursor:pointer;padding:0;user-select:none;-webkit-tap-highlight-color:transparent;font-family:inherit;';
            document.body.appendChild(fab);
        }

        // 🎨 لون البادج حسب العدد
        let badgeBg = '#e74c3c';
        if (count >= 10) badgeBg = '#c0392b';
        else if (count >= 5) badgeBg = '#e67e22';

        fab.innerHTML = cartSvg + '<span id="cartFabCount" style="position:absolute;top:-2px;right:-2px;background:' + badgeBg + ';color:white;border-radius:50%;min-width:22px;height:22px;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2.5px solid white;padding:0 4px;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,0.2);">' + count + '</span>';
    }

    // ═══════════════════════════════════════════════
    // 🛒 Modal السلة
    // ═══════════════════════════════════════════════

    window._openCartModal = function() {
        // إذا لا يوجد متجر → ابحث عن المنتجات
        if (_cartCount() === 0) {
            _toast('🛒 السلة فارغة');
            return;
        }

        // احذف modal قديم
        const old = document.getElementById('cartModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'cartModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;';

        // زر الخلفية
        modal.onclick = (e) => {
            if (e.target === modal) _closeCartModal();
        };

        modal.innerHTML = _buildCartModalHtml();
        document.body.appendChild(modal);

        // امنع التمرير في الخلفية
        document.body.style.overflow = 'hidden';
    };

    window._closeCartModal = function() {
        const modal = document.getElementById('cartModal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
    };

    function _buildCartModalHtml() {
        const items = Object.values(state.cart || {});
        const total = _cartTotal();
        const count = _cartCount();

        const itemsHtml = items.map(item => `
            <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f0f0f0;">
                <div style="width:50px;height:50px;border-radius:10px;background:${item.image ? `url('${_esc(item.image)}') center/cover` : '#f5f7fa'};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${item.image ? '' : '📦'}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:800;color:#2c3e50;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(item.name)}</div>
                    <div style="font-size:12px;color:#27ae60;font-weight:800;">${Number(item.price).toLocaleString('en-US')} ل.س</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <button onclick="_cartModalDec('${_esc(item.id)}')" style="width:32px;height:32px;background:#f5f7fa;color:#2c3e50;border:none;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;">−</button>
                    <span style="min-width:30px;text-align:center;font-size:14px;font-weight:900;color:#2c3e50;">${item.qty}</span>
                    <button onclick="_cartModalInc('${_esc(item.id)}')" style="width:32px;height:32px;background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;border:none;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;">+</button>
                </div>
            </div>`).join('');

        return `
            <div style="background:white;width:100%;max-width:500px;border-radius:20px 20px 0 0;max-height:90vh;overflow-y:auto;animation:slideUp 0.3s ease;">
                <style>
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                </style>
                <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:white;z-index:10;">
                    <div style="font-size:18px;font-weight:900;color:#2c3e50;">🛒 سلتك <span style="background:#8e44ad;color:white;border-radius:12px;padding:2px 10px;font-size:13px;">${count}</span></div>
                    <button onclick="_closeCartModal()" style="background:#f5f7fa;border:none;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;font-family:inherit;color:#7f8c8d;">✕</button>
                </div>

                <div>${itemsHtml}</div>

                <div style="padding:20px;background:#f5f7fa;position:sticky;bottom:0;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <span style="font-size:14px;color:#7f8c8d;font-weight:700;">المجموع:</span>
                        <span style="font-size:20px;font-weight:900;color:#27ae60;">${total.toLocaleString('en-US')} ل.س</span>
                    </div>
                    <button onclick="_openCheckout()" style="width:100%;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:12px;padding:14px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(142,68,173,0.4);">📤 إتمام الطلب</button>
                </div>
            </div>`;
    }

    window._cartModalInc = function(itemId) {
        _cartChangeQty(itemId, 1);
        _refreshCartModal();
    };

    window._cartModalDec = function(itemId) {
        _cartChangeQty(itemId, -1);
        _refreshCartModal();
    };

    function _refreshCartModal() {
        const modal = document.getElementById('cartModal');
        if (!modal) return;

        if (_cartCount() === 0) {
            _closeCartModal();
            _updateCartFab();
            return;
        }

        modal.innerHTML = _buildCartModalHtml();
        _updateCartFab();
    }

    // ═══════════════════════════════════════════════
    // 📤 إتمام الطلب (نموذج + إرسال)
    // ═══════════════════════════════════════════════

    window._openCheckout = function() {
        const count = _cartCount();
        if (count === 0) {
            _toast('🛒 السلة فارغة');
            return;
        }

        // اغلقي modal السلة إن وُجد
        const cartModal = document.getElementById('cartModal');
        if (cartModal) cartModal.remove();
        document.body.style.overflow = '';

        // احذف modal قديم
        const old = document.getElementById('checkoutModal');
        if (old) old.remove();

        // بيانات محفوظة سابقاً
        const saved = state.customerData || {};

        const modal = document.createElement('div');
        modal.id = 'checkoutModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:flex-end;justify-content:center;';

        modal.innerHTML = `
            <div style="background:white;border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:95vh;overflow-y:auto;padding:20px;box-sizing:border-box;animation:slideUp 0.3s ease;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;font-size:18px;font-weight:900;color:#2c3e50;">📤 إتمام الطلب</h3>
                    <button onclick="_closeCheckout()" style="background:#ecf0f1;border:none;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;font-family:inherit;">✕</button>
                </div>

                <label style="display:block;font-size:13px;font-weight:800;color:#555;margin-bottom:6px;">👤 الاسم</label>
                <input type="text" id="coName" value="${_esc(saved.name || '')}" placeholder="اسمك الكامل" style="width:100%;padding:12px;border:1.5px solid #e9ecef;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                <label style="display:block;font-size:13px;font-weight:800;color:#555;margin-bottom:6px;">📞 رقم الهاتف</label>
                <input type="tel" id="coPhone" value="${_esc(saved.phone || '')}" placeholder="09XX XXX XXX" style="width:100%;padding:12px;border:1.5px solid #e9ecef;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;direction:ltr;text-align:right;">

                <label style="display:block;font-size:13px;font-weight:800;color:#555;margin-bottom:6px;">🏙️ المنطقة / الحي</label>
                <input type="text" id="coTown" value="${_esc(saved.town || '')}" placeholder="مثال: المزة، شارع الجلاء" style="width:100%;padding:12px;border:1.5px solid #e9ecef;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;">

                <label style="display:block;font-size:13px;font-weight:800;color:#555;margin-bottom:6px;">🏠 تفاصيل العنوان (اختياري)</label>
                <textarea id="coDetails" rows="2" placeholder="بناية، طابق، علامة مميزة..." style="width:100%;padding:12px;border:1.5px solid #e9ecef;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:12px;resize:none;">${_esc(saved.details || '')}</textarea>

                <label style="display:block;font-size:13px;font-weight:800;color:#555;margin-bottom:6px;">📝 ملاحظة (اختياري)</label>
                <textarea id="coNote" rows="2" placeholder="أي ملاحظة للمتجر..." style="width:100%;padding:12px;border:1.5px solid #e9ecef;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;margin-bottom:16px;resize:none;"></textarea>

                <div style="background:#f5f7fa;border-radius:12px;padding:14px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:6px;">
                        <span>عدد العناصر:</span>
                        <span style="font-weight:800;">${count}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:6px;">
                        <span>طريقة الدفع:</span>
                        <span style="font-weight:800;">💵 نقد عند التسليم</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:900;color:#27ae60;border-top:1px solid #e0e0e0;padding-top:8px;margin-top:8px;">
                        <span>المجموع:</span>
                        <span>${_cartTotal().toLocaleString('en-US')} ل.س</span>
                    </div>
                </div>

                <button id="coSubmitBtn" onclick="_submitOrder()" style="width:100%;padding:15px;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:12px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(142,68,173,0.35);">📤 إرسال الطلب</button>
            </div>`;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // 🔒 Auto-fill للعميل المسجّل: الاسم والهاتف من الحساب (مقفلان)
        // الفائدة: التقييم يعرض الاسم الحقيقي + منع الانتحال + تجربة أفضل
        if (state.user && state.userData) {
            const nameEl = document.getElementById('coName');
            const phoneEl = document.getElementById('coPhone');

            if (nameEl && state.userData.fullName) {
                nameEl.value = state.userData.fullName;
                nameEl.readOnly = true;
                nameEl.style.background = '#f5f7fa';
                nameEl.style.color = '#7f8c8d';
                nameEl.style.cursor = 'not-allowed';
                nameEl.title = 'يُستخدم اسم حسابك — للتعديل: الملف الشخصي';
            }
            if (phoneEl && state.userData.phone) {
                phoneEl.value = state.userData.phone;
                phoneEl.readOnly = true;
                phoneEl.style.background = '#f5f7fa';
                phoneEl.style.color = '#7f8c8d';
                phoneEl.style.cursor = 'not-allowed';
                phoneEl.title = 'يُستخدم رقم حسابك — للتعديل: الملف الشخصي';
            }

            // التركيز على العنوان (لأن الاسم والهاتف مقفلان)
            setTimeout(() => document.getElementById('coTown')?.focus(), 200);
        } else {
            // زائر (غير مسجّل) — التركيز على الاسم
            setTimeout(() => document.getElementById('coName')?.focus(), 200);
        }
    };

    window._closeCheckout = function() {
        const modal = document.getElementById('checkoutModal');
        if (modal) modal.remove();
        document.body.style.overflow = '';
    };

    window._submitOrder = async function() {
        const btn = document.getElementById('coSubmitBtn');
        const name = (document.getElementById('coName')?.value || '').trim();
        const phone = (document.getElementById('coPhone')?.value || '').trim();
        const town = (document.getElementById('coTown')?.value || '').trim();
        const details = (document.getElementById('coDetails')?.value || '').trim();
        const note = (document.getElementById('coNote')?.value || '').trim();

        // ═══ التحقق ═══
        if (!name || name.length < 2) {
            _toast('⚠️ أدخل اسمك');
            return;
        }
        if (!phone || phone.length < 7) {
            _toast('⚠️ أدخل رقم هاتف صحيح');
            return;
        }
        if (!town) {
            _toast('⚠️ أدخل المنطقة');
            return;
        }

        // احفظ محلياً للطلبات القادمة
        state.customerData = { name, phone, town, details };
        try { localStorage.setItem('customer_data', JSON.stringify(state.customerData)); } catch(e) {}

        // عطّل الزر
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ جاري الإرسال...';
        }

        try {
            const items = Object.values(state.cart || {});
            const total = _cartTotal();
            const storeUid = state.cartStore ? state.cartStore.ownerUid : null;

            if (!storeUid) {
                _toast('⚠️ خطأ: المتجر غير معروف');
                if (btn) { btn.disabled = false; btn.textContent = '📤 إرسال الطلب'; }
                return;
            }

            // 🆕 بنية الطلب
            const orderData = {
                ownerUid: storeUid,
                customerUid: state.user ? state.user.uid : null,
                type: 'delivery',
                mode: 'store',
                items: items.map(i => ({
                    id: i.id,
                    name: i.name,
                    price: Number(i.price) || 0,
                    qty: Number(i.qty) || 0
                })),
                subtotal: total,
                total: total,
                customer: {
                    name: name,
                    phone: phone,
                    town: town,
                    details: details
                },
                customerNote: note,
                status: 'new',
                paymentMethod: 'cod',
                paymentMethodName: 'نقد عند التسليم',
                storeName: state.cartStore ? (state.cartStore.businessName || '') : '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // 📤 أرسل إلى Firestore
            const ref = await db.collection('public_orders').add(orderData);
            console.log('✅ [order] created:', ref.id);

            // 💾 احفظ في pm_activeOrders (للـ polling)
            try {
                const active = JSON.parse(localStorage.getItem('pm_activeOrders') || '[]');
                active.push({
                    orderId: ref.id,
                    ownerUid: storeUid,
                    mode: 'store',
                    createdAt: Date.now()
                });
                localStorage.setItem('pm_activeOrders', JSON.stringify(active.slice(-10)));
            } catch(e) {}

            // 🧹 فرّغ السلة
            _cartClear();
            _updateCartFab();
            _closeCheckout();

            // ✅ شاشة النجاح
            _showOrderSuccess(ref.id, total, name);

        } catch(e) {
            console.error('[submit-order]', e);
            _toast('❌ فشل الإرسال: ' + (e.message || 'خطأ'));
            if (btn) { btn.disabled = false; btn.textContent = '📤 إرسال الطلب'; }
        }
    };

    // ═══════════════════════════════════════════════
    // ✅ شاشة النجاح
    // ═══════════════════════════════════════════════
    function _showOrderSuccess(orderId, total, customerName) {
        const shortId = String(orderId).slice(-6).toUpperCase();

        const modal = document.createElement('div');
        modal.id = 'successModal';
        modal.style.cssText = 'position:fixed;inset:0;background:white;z-index:20000;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;';

        modal.innerHTML = `
            <div style="max-width:400px;width:100%;text-align:center;padding:20px;">
                <div style="font-size:80px;margin-bottom:20px;">✅</div>
                <h2 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#2c3e50;">تم إرسال طلبك!</h2>
                <p style="margin:0 0 20px;font-size:14px;color:#7f8c8d;line-height:1.7;">
                    شكراً ${_esc(customerName)}!<br>
                    سيتم التواصل معك قريباً لتأكيد الطلب.
                </p>

                <div style="background:#f5f7fa;border-radius:14px;padding:16px;margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#555;">
                        <span>رقم الطلب:</span>
                        <strong style="color:#8e44ad;font-family:monospace;">#${_esc(shortId)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;color:#555;border-top:1px solid #e0e0e0;">
                        <span>الإجمالي:</span>
                        <strong style="color:#27ae60;">${Number(total).toLocaleString('en-US')} ل.س</strong>
                    </div>
                </div>

                <button onclick="document.getElementById('successModal').remove();window.location.href='customer.html?tab=orders';" style="width:100%;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:10px;box-shadow:0 4px 14px rgba(142,68,173,0.4);">
                    📋 عرض طلباتي
                </button>

                <button onclick="document.getElementById('successModal').remove();_closeStoreView();" style="width:100%;background:#f5f7fa;color:#2c3e50;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;">
                    🏠 العودة للرئيسية
                </button>
            </div>`;

        document.body.appendChild(modal);
    }

    // تحميل بيانات العميل المحفوظة
    try {
        const saved = localStorage.getItem('customer_data');
        if (saved) state.customerData = JSON.parse(saved);
    } catch(e) {}


    _loadItemVotes();
    _loadPinnedStores();

    window._closeStoreView = function() {
        _currentStoreUid = null;
        _currentStoreCategory = 'all';
        // ✨ أخفِ الـ overlay بحركة انزلاق
        const overlay = document.getElementById('storeOverlay');
        if (overlay) {
            overlay.style.transform = 'translateX(100%)';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    };

    window._setStoreCategory = function(cat) {
        // 🎨 استخدم لون المتجر للأزرار النشطة
        const store = (state.stores || []).find(s => s.ownerUid === _currentStoreUid);
        const themeColor = (store && store.themeColor) ? store.themeColor : '#8e44ad';
        const themeColorDark = _darkenColor(themeColor, 30);
        _currentStoreCategory = cat;
        document.querySelectorAll('.store-cat-chip').forEach(btn => {
            const isActive = btn.dataset.cat === cat;
            btn.style.background = isActive
                ? ('linear-gradient(135deg,' + themeColor + ',' + themeColorDark + ')')
                : '#f5f7fa';
            btn.style.color = isActive ? 'white' : '#7f8c8d';
        });
        _refreshStoreProducts();
    };

    function _refreshStoreProducts() {
        const uid = _currentStoreUid;
        if (!uid) return;
        const cat = _currentStoreCategory;
        const products = (state.allProducts || []).filter(p => {
            if (!p.store || p.store.ownerUid !== uid) return false;
            if (cat === 'all') return true;
            return (p.category || 'main') === cat;
        });

        // 🎯 ابحث في #storeOverlay (المتجر) وليس #appContent
        const overlay = document.getElementById('storeOverlay');
        if (!overlay) return;

        // ابحث عن حاوية المنتجات — div بـ flex-direction:column
        const allDivs = overlay.querySelectorAll('div');
        let container = null;
        for (const div of allDivs) {
            const style = div.getAttribute('style') || '';
            if (style.includes('flex-direction:column') && style.includes('gap:')) {
                // تأكد أنها ليست حاوية الفئات
                if (!style.includes('overflow-x')) {
                    container = div;
                    break;
                }
            }
        }

        if (!container) {
            console.warn('[refresh] container not found');
            return;
        }

        // 🎨 احصل على themeColor من المتجر
        const store = (state.stores || []).find(s => s.ownerUid === uid);
        const themeColor = (store && store.themeColor) ? store.themeColor : '#8e44ad';

        // 🎯 أعد الرسم
        container.innerHTML = products.length === 0
            ? '<div style="text-align:center;padding:40px;color:#95a5a6;">📭 لا توجد منتجات في هذه الفئة</div>'
            : products.map(p => _renderProductCard(p, themeColor)).join('');

        console.log('[refresh] rendered', products.length, 'products');
    }



    // 🔐 شاشة طلب التسجيل
    // 🔐 شاشة خطأ نوع الحساب
    function _showWrongAccountType(type) {
        document.getElementById('wrongTypeModal')?.remove();

        const typeLabel = type === 'merchant' ? 'تاجر 🏪' : type === 'employee' ? 'موظف 👨‍💼' : type;
        const modal = document.createElement('div');
        modal.id = 'wrongTypeModal';
        modal.style.cssText = 'position:fixed;inset:0;background:#1a1a2e;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

        modal.innerHTML = `
            <div style="background:white;border-radius:20px;max-width:400px;width:100%;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                <div style="font-size:56px;margin-bottom:14px;">⚠️</div>
                <div style="font-size:18px;font-weight:900;color:#2c3e50;margin-bottom:10px;">
                    أنت مسجّل كـ ${_esc(typeLabel)}
                </div>
                <div style="font-size:13px;color:#7f8c8d;line-height:1.8;margin-bottom:24px;">
                    هذا التطبيق مخصص للعملاء فقط.<br>
                    الرجاء استخدام التطبيق المخصص لإدارة متجرك.
                </div>

                <button onclick="_signOut()" style="width:100%;padding:14px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:12px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(231,76,60,0.35);">
                    🚪 تسجيل الخروج
                </button>
            </div>`;
        document.body.appendChild(modal);
    }

    // 🚀 الانتقال للتسجيل
    window._goToSignup = function() {
        try {
            localStorage.setItem('customer_return_url', location.pathname + location.search);
            location.href = 'customer-login.html';
        } catch(e) {
            location.href = 'customer-login.html';
        }
    };

    window._goToLogin = function() {
        try {
            localStorage.setItem('customer_return_url', location.pathname + location.search);
            location.href = 'customer-login.html';
        } catch(e) {
            location.href = 'customer-login.html';
        }
    };

    // ═══ 🛍️ BROWSE — صفحة التسوق ═══
    function _renderBrowse() {
        const content = document.getElementById('appContent');
        const mode = state.browseMode;

        let html = '';

        // 🔄 تبويب: متاجر / منتجات
        html += `
            <div class="browse-tabs">
                <button class="browse-tab ${mode === 'stores' ? 'active' : ''}" onclick="_setBrowseMode('stores')">
                    🏪 المتاجر
                </button>
                <button class="browse-tab ${mode === 'products' ? 'active' : ''}" onclick="_setBrowseMode('products')">
                    📦 المنتجات
                </button>
            </div>`;

        // 🔄 الترتيب
        html += `
            <div class="browse-sort">
                <label style="font-size:11px;font-weight:700;color:#7f8c8d;margin-bottom:4px;display:block;">الترتيب:</label>
                <select id="browseSortSelect" onchange="_setBrowseSort(this.value)" style="width:100%;padding:10px 12px;border:1.5px solid #e9ecef;border-radius:10px;font-family:inherit;font-size:12.5px;font-weight:700;background:white;color:#2c3e50;cursor:pointer;">
                    <option value="rating" ${state.browseSort === 'rating' ? 'selected' : ''}>⭐ الأعلى تقييماً</option>
                    <option value="distance" ${state.browseSort === 'distance' ? 'selected' : ''}>📍 الأقرب إليك</option>
                    <option value="newest" ${state.browseSort === 'newest' ? 'selected' : ''}>🆕 الأحدث</option>
                    ${mode === 'products' ? `<option value="cheapest" ${state.browseSort === 'cheapest' ? 'selected' : ''}>💰 الأرخص أولاً</option>` : ''}
                </select>
            </div>`;

        // 📊 النتائج
        if (mode === 'stores') {
            html += _renderStoresBrowse();
        } else {
            html += _renderProductsBrowse();
        }

        content.innerHTML = html;
    }

    // 🏪 عرض المتاجر
    function _renderStoresBrowse() {
        let list = [...state.filteredStores];

        // 🔄 الترتيب
        if (state.browseSort === 'rating') {
            list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        } else if (state.browseSort === 'distance') {
            list.sort((a, b) => {
                const da = a._distance != null ? a._distance : 999999;
                const db = b._distance != null ? b._distance : 999999;
                return da - db;
            });
        } else if (state.browseSort === 'newest') {
            // لا يوجد createdAt حالياً — ترتيب أبجدي
            list.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));
        }

        if (list.length === 0) {
            return _renderEmpty('🏪', 'لا توجد متاجر', 'جرّب تغيير الفلتر أو البحث');
        }

        let html = `<div class="section-title">🏪 المتاجر <span class="badge">${list.length}</span></div>`;
        list.forEach(s => { html += _renderStoreCard(s); });
        return html;
    }

    // 📦 عرض المنتجات
    function _renderProductsBrowse() {
        let list = [...state.allProducts];

        // 🔍 البحث
        if (state.currentSearch) {
            const q = state.currentSearch.toLowerCase().trim();
            list = list.filter(p => {
                const name = (p.itemName || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                const store = (p.store.businessName || '').toLowerCase();
                return name.includes(q) || desc.includes(q) || store.includes(q);
            });
        }

        // 🏷️ الفلترة حسب النشاط
        if (state.currentCat !== 'all') {
            list = list.filter(p => p.store.businessType === state.currentCat);
        }

        // 🔄 الترتيب
        if (state.browseSort === 'rating') {
            list.sort((a, b) => (b.store.avgRating || 0) - (a.store.avgRating || 0));
        } else if (state.browseSort === 'distance') {
            list.sort((a, b) => {
                const da = a.store._distance != null ? a.store._distance : 999999;
                const db = b.store._distance != null ? b.store._distance : 999999;
                return da - db;
            });
        } else if (state.browseSort === 'cheapest') {
            list.sort((a, b) => a.price - b.price);
        }

        if (list.length === 0) {
            return _renderEmpty('📦', 'لا توجد منتجات', 'جرّب تغيير الفلتر أو البحث');
        }

        let html = `<div class="section-title">📦 المنتجات <span class="badge">${list.length}</span></div>`;

        // اعرض أول 50 منتج (للأداء)
        list.slice(0, 50).forEach(p => { html += _renderBrowseProductCard(p); });
        if (list.length > 50) {
            html += `<div style="text-align:center;color:#999;font-size:12px;padding:14px;">يعرض 50 من ${list.length} — استخدم البحث للتضييق</div>`;
        }
        return html;
    }

    // 📦 بطاقة المنتج (للتصفح — نسخة مبسطة)
    function _renderBrowseProductCard(p) {
        const store = p.store || {};
        const type = store.businessType || '';
        const icon = _getCatIcon(type);
        const storeName = store.businessName || 'متجر';

        // 📍 المسافة
        let distText = '';
        if (state.gpsLocation && store.storeLocation && store.storeLocation.lat) {
            const d = _calcDistance(
                state.gpsLocation.lat, state.gpsLocation.lng,
                Number(store.storeLocation.lat), Number(store.storeLocation.lng)
            );
            distText = _fmtDistance(d);
        }

        const imgHtml = p.image
            ? `<div class="product-img" style="background-image:url('${_esc(p.image)}')"></div>`
            : `<div class="product-img product-img-ph">${icon}</div>`;

        return `
            <div class="product-card" onclick="_openStore('${_esc(store.ownerUid || '')}')">
                ${imgHtml}
                <div class="product-info">
                    <div class="product-name">${_esc(p.itemName)}</div>
                    <div class="product-store">
                        ${icon} ${_esc(storeName)}
                        ${distText ? ` · 📍 ${distText}` : ''}
                    </div>
                    ${p.description ? `<div class="product-desc">${_esc(p.description)}</div>` : ''}
                    <div class="product-bottom">
                        <div class="product-price">${Number(p.price).toLocaleString('en-US')} ل.س${p.priceUSD > 0 ? ` <span class="product-price-usd">$${Number(p.priceUSD).toFixed(2)}</span>` : ''}</div>
                        <button class="product-add" onclick="event.stopPropagation(); _openStore('${_esc(store.ownerUid || '')}')">🛒 اطلب</button>
                    </div>
                </div>
            </div>`;
    }

    // 🔄 تغيير الوضع
    window._setBrowseMode = function(mode) {
        state.browseMode = mode;
        // إعادة تعيين الترتيب إذا لم يكن مناسباً
        if (mode === 'stores' && state.browseSort === 'cheapest') {
            state.browseSort = 'rating';
        }
        _renderBrowse();
    };

    window._setBrowseSort = function(sort) {
        state.browseSort = sort;
        _renderBrowse();
    };
    // 🆕 جلب الطلبات من Firestore
    async function _loadOrders() {
        if (!state.user || !state.user.uid) return [];

        state.ordersLoading = true;
        try {
            // نستعلم بالـ customerUid (بدون Index — ترتيب محلي)
            const snap = await db.collection('public_orders')
                .where('customerUid', '==', state.user.uid)
                .limit(100)
                .get();

            const orders = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    createdAt: data.createdAt && data.createdAt.toMillis
                        ? data.createdAt.toMillis()
                        : (typeof data.createdAt === 'number' ? data.createdAt : 0)
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50);

            state.orders = orders;
            console.log('📋 [orders] loaded:', orders.length);
            return orders;
        } catch(e) {
            console.error('[orders] load failed:', e);
            // 🆘 Fallback: إذا فشل الاستعلام → استخدم pm_activeOrders
            try {
                const localRaw = localStorage.getItem('pm_activeOrders') || '[]';
                const localList = JSON.parse(localRaw);

                if (localList.length > 0) {
                    console.log('🆘 [orders] fallback to local:', localList.length);

                    // اجلب كل طلب من Firestore بالـ doc(id)
                    const fetchPromises = localList.map(async (entry) => {
                        try {
                            const doc = await db.collection('public_orders').doc(entry.orderId).get();
                            if (!doc.exists) return null;
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data,
                                createdAt: data.createdAt && data.createdAt.toMillis
                                    ? data.createdAt.toMillis()
                                    : (typeof data.createdAt === 'number' ? data.createdAt : 0)
                            };
                        } catch(err) {
                            return null;
                        }
                    });

                    const results = await Promise.all(fetchPromises);
                    const valid = results.filter(o => o && o.customerUid === state.user.uid)
                        .sort((a, b) => b.createdAt - a.createdAt);

                    state.orders = valid;
                    console.log('🆘 [orders] fallback loaded:', valid.length);
                    return valid;
                }
            } catch(fallbackErr) {
                console.warn('[orders] fallback failed:', fallbackErr);
            }

            state.orders = [];
            return [];
        } finally {
            state.ordersLoading = false;
        }
    }

    async function _renderOrders() {
        const container = document.getElementById('appContent');

        if (!state.user) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 60px 20px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🔐</div>
                    <div style="font-size: 20px; font-weight: 800; color: #2c3e50; margin-bottom: 8px;">سجّل دخولك</div>
                    <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 24px;">لعرض طلباتك السابقة وتتبعها</div>
                    <button onclick="_goToLogin()" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:12px;padding:12px 28px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(142,68,173,0.4);">🔐 تسجيل الدخول</button>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div style="padding: 60px 20px; text-align: center; color: #8e44ad;">
                <div style="font-size: 40px; margin-bottom: 12px;">⏳</div>
                <div style="font-size: 15px; font-weight: 700;">جاري تحميل الطلبات...</div>
            </div>`;

        const orders = await _loadOrders();

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 60px 20px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 16px;">📋</div>
                    <div style="font-size: 20px; font-weight: 800; color: #2c3e50; margin-bottom: 8px;">لا توجد طلبات بعد</div>
                    <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 24px;">ابدأ التسوق من المتاجر القريبة</div>
                    <button onclick="_onTab('home')" style="background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:12px;padding:12px 28px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(142,68,173,0.4);">🏠 تصفح المتاجر</button>
                </div>`;
            return;
        }

        const filter = state.ordersFilter || 'all';
        const filtered = _filterOrders(orders, filter);
        const tabsHtml = _renderOrderTabs(orders.length, filter);
        const cardsHtml = filtered.length === 0
            ? `<div style="text-align:center;padding:40px 20px;color:#95a5a6;font-size:14px;">لا توجد طلبات في هذه الفئة</div>`
            : filtered.map(o => _renderOrderCard(o)).join('');

        container.innerHTML = `
            <div style="padding: 16px 12px 100px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                    <h2 style="margin:0;font-size:20px;font-weight:900;color:#2c3e50;">📋 طلباتي</h2>
                    <span style="background:#ecf0f1;color:#7f8c8d;font-size:12px;font-weight:800;padding:4px 10px;border-radius:20px;">${orders.length} طلب</span>
                </div>
                ${tabsHtml}
                ${cardsHtml}
            </div>`;
    }

    function _filterOrders(orders, filter) {
        if (filter === 'all') return orders;
        if (filter === 'active') return orders.filter(o => ['new', 'accepted', 'preparing', 'delivering'].includes(o.status));
        if (filter === 'completed') return orders.filter(o => o.status === 'delivered');
        if (filter === 'rejected') return orders.filter(o => o.status === 'rejected');
        return orders;
    }

    function _renderOrderTabs(totalCount, activeFilter) {
        const filters = [
            { id: 'all', label: 'الكل', icon: '📋' },
            { id: 'active', label: 'نشطة', icon: '🔵' },
            { id: 'completed', label: 'مكتملة', icon: '✅' },
            { id: 'rejected', label: 'مرفوضة', icon: '❌' }
        ];
        return '<div style="display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;">' +
            filters.map(f => {
                const active = f.id === activeFilter;
                const bg = active ? 'linear-gradient(135deg,#8e44ad,#9b59b6)' : '#f5f7fa';
                const color = active ? 'white' : '#7f8c8d';
                return `<button onclick="_setOrdersFilter('${f.id}')" style="background:${bg};color:${color};border:none;border-radius:20px;padding:8px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap;">${f.icon} ${f.label}</button>`;
            }).join('') +
        '</div>';
    }

    function _renderOrderCard(order) {
        const statusInfo = _getStatusInfo(order.status);
        const orderIdShort = '#' + (order.id || '').slice(-6).toUpperCase();
        const total = Number(order.total || order.grandTotal || 0);
        const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
        const timeAgo = _timeAgo(order.createdAt);
        const storeName = order.storeName || order.businessName || 'متجر';
        const itemsText = itemsCount === 1 ? '1 عنصر' : (itemsCount === 2 ? '2 عنصران' : itemsCount + ' عناصر');
        // 🚗 السائق + أزرار تواصل (اتصال + واتساب)
        let driverLine = '';
        if (order.driverName) {
            const rawPhone = String(order.driverPhone || '').replace(/\D/g, '');
            const cleanPhone = rawPhone.startsWith('963') ? rawPhone : ('963' + rawPhone.replace(/^0+/, ''));
            const telLink = rawPhone ? `tel:+${cleanPhone}` : null;
            const waLink = rawPhone ? `https://wa.me/${cleanPhone}` : null;

            const callBtn = telLink
                ? `<a href="${telLink}" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;background:#2196F3;color:white;text-decoration:none;font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;box-shadow:0 2px 6px rgba(33,150,243,0.35);">📞 اتصال</a>`
                : '';
            const waBtn = waLink
                ? `<a href="${waLink}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;background:#25D366;color:white;text-decoration:none;font-size:11px;font-weight:800;padding:5px 10px;border-radius:8px;box-shadow:0 2px 6px rgba(37,211,102,0.35);">💬 واتساب</a>`
                : '';

            driverLine = `<div style="font-size:12px;color:#3498db;margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span>🚗 السائق: ${_esc(order.driverName)}</span>
                ${callBtn}
                ${waBtn}
            </div>`;
        }

        return `
            <div onclick="_openOrderDetails('${order.id}')" style="background:white;border-radius:16px;padding:14px 16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05);cursor:pointer;border-right:4px solid ${statusInfo.color};">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div style="font-size:13px;font-weight:900;color:#2c3e50;">${orderIdShort}</div>
                    <span style="background:${statusInfo.bg};color:${statusInfo.color};font-size:11px;font-weight:800;padding:3px 10px;border-radius:12px;">${statusInfo.icon} ${statusInfo.label}</span>
                </div>
                <div style="font-size:14px;font-weight:800;color:#2c3e50;margin-bottom:4px;">🏪 ${_esc(storeName)}</div>
                <div style="font-size:13px;color:#7f8c8d;margin-bottom:6px;">🛒 ${itemsText} · ${total.toLocaleString('en-US')} ل.س</div>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#95a5a6;">
                    <span>🕐 ${timeAgo}</span>
                    ${order.paymentMethodName ? '<span>💳 ' + _esc(order.paymentMethodName) + '</span>' : ''}
                </div>
                ${driverLine}
            </div>`;
    }

    function _getStatusInfo(status) {
        const map = {
            'new': { label: 'جديد', icon: '🔵', color: '#3498db', bg: '#eaf4fd' },
            'accepted': { label: 'مقبول', icon: '✅', color: '#27ae60', bg: '#eafaf1' },
            'preparing': { label: 'قيد التحضير', icon: '👨‍🍳', color: '#f39c12', bg: '#fef5e7' },
            'delivering': { label: 'في الطريق', icon: '🚗', color: '#e67e22', bg: '#fdf2e9' },
            'delivered': { label: 'مكتمل', icon: '🎉', color: '#27ae60', bg: '#eafaf1' },
            'rejected': { label: 'مرفوض', icon: '❌', color: '#e74c3c', bg: '#fdedec' },
            'cancelled': { label: 'ملغى', icon: '🚫', color: '#95a5a6', bg: '#ecf0f1' }
        };
        return map[status] || map['new'];
    }

    function _timeAgo(timestamp) {
        if (!timestamp) return '—';
        const diff = Date.now() - timestamp;
        const sec = Math.floor(diff / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (sec < 60) return 'الآن';
        if (min < 60) return 'منذ ' + min + ' دقيقة';
        if (hr < 24) return 'منذ ' + hr + ' ساعة';
        if (day < 7) return 'منذ ' + day + ' يوم';
        return new Date(timestamp).toLocaleDateString('ar-SY');
    }

    window._setOrdersFilter = function(filter) {
        state.ordersFilter = filter;
        _renderOrders();
    };

    window._openOrderDetails = function(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) {
            _toast('الطلب غير موجود', 'warning');
            return;
        }
        const statusInfo = _getStatusInfo(order.status);
        const total = Number(order.total || order.grandTotal || 0);
        const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
        const itemsText = itemsCount === 1 ? '1 عنصر' : (itemsCount === 2 ? '2 عنصران' : itemsCount + ' عناصر');
        const orderIdShort = '#' + (order.id || '').slice(-6).toUpperCase();
        const timeAgo = _timeAgo(order.createdAt);
        const isDelivered = order.status === 'delivered';
        const hasReview = order.review && order.review.rating;

        // بيانات السائق
        let driverBlock = '';
        if (order.driverName) {
            const rawPhone = String(order.driverPhone || '').replace(/\D/g, '');
            const cleanPhone = rawPhone.startsWith('963') ? rawPhone : ('963' + rawPhone.replace(/^0+/, ''));
            const callBtn = rawPhone ? '<a href="tel:+' + cleanPhone + '" style="display:inline-flex;align-items:center;gap:4px;background:#2196F3;color:white;text-decoration:none;font-size:12px;font-weight:800;padding:8px 14px;border-radius:10px;">📞 اتصال</a>' : '';
            const waBtn = rawPhone ? '<a href="https://wa.me/' + cleanPhone + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;background:#25D366;color:white;text-decoration:none;font-size:12px;font-weight:800;padding:8px 14px;border-radius:10px;">💬 واتساب</a>' : '';
            driverBlock = '<div style="background:#f8f9fa;border-radius:12px;padding:14px;margin-bottom:12px;">'
                + '<div style="font-size:12px;color:#7f8c8d;font-weight:800;margin-bottom:8px;">🚗 السائق</div>'
                + '<div style="font-size:14px;font-weight:900;color:#2c3e50;margin-bottom:10px;">' + _esc(order.driverName) + '</div>'
                + '<div style="display:flex;gap:8px;">' + callBtn + waBtn + '</div>'
                + '</div>';
        }

        // قسم التقييم
        let reviewBlock = '';
        if (isDelivered) {
            if (hasReview) {
                // عرض التقييم الموجود
                const stars = '⭐'.repeat(Number(order.review.rating || 0)) + '☆'.repeat(5 - Number(order.review.rating || 0));
                reviewBlock = '<div style="background:#e8f5e9;border-radius:12px;padding:14px;margin-bottom:12px;">'
                    + '<div style="font-size:12px;color:#2e7d32;font-weight:800;margin-bottom:6px;">✅ قيّمت هذا الطلب</div>'
                    + '<div style="font-size:18px;margin-bottom:6px;">' + stars + '</div>'
                    + (order.review.comment ? '<div style="font-size:13px;color:#2c3e50;font-style:italic;">"' + _esc(order.review.comment) + '"</div>' : '')
                    + '</div>';
            } else {
                // Modal التقييم
                reviewBlock = '<div style="background:#f3e5f5;border-right:4px solid #8e44ad;border-radius:12px;padding:14px;margin-bottom:12px;">'
                    + '<div style="font-size:14px;font-weight:900;color:#6a1b9a;margin-bottom:10px;text-align:center;">⭐ قيّم تجربتك</div>'
                    + '<div style="text-align:center;font-size:32px;margin-bottom:12px;" id="_ratingStars">'
                    + '<span onclick="_setStarRating(1)" style="cursor:pointer;">☆</span>'
                    + '<span onclick="_setStarRating(2)" style="cursor:pointer;">☆</span>'
                    + '<span onclick="_setStarRating(3)" style="cursor:pointer;">☆</span>'
                    + '<span onclick="_setStarRating(4)" style="cursor:pointer;">☆</span>'
                    + '<span onclick="_setStarRating(5)" style="cursor:pointer;">☆</span>'
                    + '</div>'
                    + '<input type="hidden" id="_ratingValue" value="0" />'
                    + '<textarea id="_reviewComment" placeholder="اكتب تعليقك (اختياري)..." style="width:100%;padding:10px;border:2px solid #e1bee7;border-radius:10px;font-size:13px;font-family:inherit;box-sizing:border-box;margin-bottom:10px;resize:vertical;min-height:60px;"></textarea>'
                    + '<button onclick="_submitOrderReview(\'' + order.id + '\')" id="_submitReviewBtn" style="width:100%;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;">💾 إرسال التقييم</button>'
                    + '</div>';
            }
        }

        // زر إعادة الطلب
        let reorderBlock = '';
        if (isDelivered && Array.isArray(order.items) && order.items.length > 0) {
            reorderBlock = '<button onclick="_reorderFromOrder(\'' + order.id + '\')" style="width:100%;background:white;border:2px solid #8e44ad;color:#8e44ad;border-radius:12px;padding:12px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:8px;">🔁 إعادة الطلب</button>';
        }

        // Modal
        const html = '<div id="_orderDetailsModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)this.remove();">'
            + '<div style="background:white;border-radius:24px 24px 0 0;width:100%;max-width:500px;max-height:88vh;overflow-y:auto;">'
            + '<div style="padding:18px 20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2;border-radius:24px 24px 0 0;">'
            + '<div style="font-size:16px;font-weight:900;color:#2c3e50;">📋 تفاصيل الطلب ' + orderIdShort + '</div>'
            + '<button onclick="document.getElementById(\'_orderDetailsModal\').remove()" style="background:#ecf0f1;border:none;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>'
            + '</div>'
            + '<div style="padding:16px;">'

            // معلومات أساسية
            + '<div style="background:linear-gradient(135deg,#f8f4fc,#f3e5f5);border-radius:14px;padding:16px;margin-bottom:12px;">'
            + '<div style="font-size:16px;font-weight:900;color:#2c3e50;margin-bottom:6px;">🏪 ' + _esc(order.storeName || order.businessName || 'متجر') + '</div>'
            + '<div style="font-size:12px;color:#7f8c8d;margin-bottom:8px;">🕐 ' + timeAgo + '</div>'
            + '<span style="display:inline-block;background:' + statusInfo.bg + ';color:' + statusInfo.color + ';font-size:12px;font-weight:900;padding:5px 12px;border-radius:20px;">' + statusInfo.icon + ' ' + statusInfo.label + '</span>'
            + '</div>'

            // المنتجات
            + '<div style="background:#f8f9fa;border-radius:12px;padding:14px;margin-bottom:12px;">'
            + '<div style="font-size:12px;color:#7f8c8d;font-weight:800;margin-bottom:6px;">🛒 المنتجات</div>'
            + '<div style="font-size:14px;font-weight:800;color:#2c3e50;">' + itemsText + '</div>'
            + '</div>'

            // السائق
            + driverBlock

            // المبلغ
            + '<div style="background:#f8f9fa;border-radius:12px;padding:14px;margin-bottom:12px;">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<div style="font-size:13px;color:#7f8c8d;font-weight:800;">💰 الإجمالي</div>'
            + '<div style="font-size:20px;font-weight:900;color:#8e44ad;">' + total.toLocaleString('en-US') + ' ل.س</div>'
            + '</div>'
            + (order.paymentMethodName ? '<div style="font-size:12px;color:#7f8c8d;margin-top:6px;text-align:left;">💳 ' + _esc(order.paymentMethodName) + '</div>' : '')
            + '</div>'

            // التقييم
            + reviewBlock

            // إعادة الطلب
            + reorderBlock

            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    };

    window._setStarRating = function(stars) {
        const container = document.getElementById('_ratingStars');
        if (!container) return;
        const spans = container.querySelectorAll('span');
        spans.forEach(function(span, idx) {
            span.textContent = idx < stars ? '⭐' : '☆';
        });
        const hidden = document.getElementById('_ratingValue');
        if (hidden) hidden.value = stars;
    };

    window._submitOrderReview = async function(orderId) {
        const ratingEl = document.getElementById('_ratingValue');
        const commentEl = document.getElementById('_reviewComment');
        const btn = document.getElementById('_submitReviewBtn');
        const rating = ratingEl ? Number(ratingEl.value) : 0;
        const comment = commentEl ? (commentEl.value || '').trim() : '';

        if (!rating || rating < 1 || rating > 5) {
            _toast('⚠️ اختر عدد النجوم أولاً', 'warning');
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري الإرسال...'; }

        try {
            const order = state.orders.find(o => o.id === orderId);
            if (!order) throw new Error('الطلب غير موجود');

            const customerNameForReview = (order.customer && order.customer.name)
                ? order.customer.name
                : ((state.userData && state.userData.fullName) ? state.userData.fullName : 'عميل');

            const review = {
                rating: rating,
                comment: comment || '',
                customerName: customerNameForReview,
                visible: true
            };

            // ① حفظ في الطلب
            await db.collection('public_orders').doc(orderId).update({ review: review });

            // ② تحديث المتجر (avgRating + ratingsCount)
            const ownerUid = order.ownerUid;
            if (ownerUid) {
                try {
                    const menuRef = db.collection('public_menus').doc(ownerUid);
                    const menuSnap = await menuRef.get();
                    if (menuSnap.exists) {
                        const menuData = menuSnap.data();
                        const oldCount = Number(menuData.ratingsCount || 0);
                        const oldAvg = Number(menuData.avgRating || 0);
                        const newCount = oldCount + 1;
                        const newAvg = ((oldAvg * oldCount) + rating) / newCount;
                        
                        // آخر 5 تقييمات للعرض
                        const lastReviews = Array.isArray(menuData.lastReviews) ? menuData.lastReviews.slice(0, 4) : [];
                        lastReviews.unshift({
                            orderId: orderId,
                            rating: rating,
                            comment: comment || null,
                            customerName: state.userData ? state.userData.fullName : 'عميل',
                            visible: true,
                            createdAt: Date.now()
                        });

                        await menuRef.update({
                            avgRating: Math.round(newAvg * 10) / 10,
                            ratingsCount: newCount,
                            lastReviews: lastReviews.slice(0, 5)
                        });
                    }
                } catch(menuErr) {
                    console.warn('[submitReview] menu update failed:', menuErr);
                }
            }

            // ③ تحديث state المحلي
            if (state.orders) {
                const idx = state.orders.findIndex(o => o.id === orderId);
                if (idx > -1) {
                    state.orders[idx].review = {
                        rating: rating,
                        comment: comment || null
                    };
                }
            }

            _toast('✅ شكراً لتقييمك!', 'success');
            const modal = document.getElementById('_orderDetailsModal');
            if (modal) modal.remove();
            setTimeout(function() { _renderOrders(); }, 300);
        } catch(e) {
            console.error('[submitReview]', e);
            _toast('❌ فشل الإرسال — حاول لاحقاً', 'error');
            if (btn) { btn.disabled = false; btn.textContent = '💾 إرسال التقييم'; }
        }
    };

    window._reorderFromOrder = async function(orderId) {
        const order = state.orders.find(o => o.id === orderId);
        if (!order) {
            _toast('الطلب غير موجود', 'warning');
            return;
        }
        const items = Array.isArray(order.items) ? order.items : [];
        if (items.length === 0) {
            _toast('⚠️ لا توجد منتجات في هذا الطلب', 'warning');
            return;
        }

        try {
            // إغلاق Modal التفاصيل
            const modal = document.getElementById('_orderDetailsModal');
            if (modal) modal.remove();

            // بناء السلة من items
            const newCart = {};
            items.forEach(function(it) {
                const id = it.id || it.itemId || String(Date.now() + Math.random());
                newCart[id] = {
                    id: id,
                    name: it.name || it.title || 'منتج',
                    price: Number(it.price || 0),
                    qty: Number(it.qty || it.quantity || 1),
                    image: it.image || null
                };
            });

            // تحميل المتجر الحالي
            const ownerUid = order.ownerUid;
            if (!ownerUid) throw new Error('متجر غير معروف');

            // جلب بيانات المتجر
            let storeData = null;
            try {
                const snap = await db.collection('public_menus').doc(ownerUid).get();
                if (snap.exists) storeData = snap.data();
            } catch(e) { console.warn('[reorder] store fetch:', e); }

            // تحديث state
            state.cart = newCart;
            state.cartStore = {
                ownerUid: ownerUid,
                businessName: (storeData && storeData.businessName) || order.storeName || 'متجر'
            };
            state.cartType = 'store';
            state.cartTableCode = null;

            // حفظ في localStorage (إن كانت الدالة موجودة)
            if (typeof _saveCart === 'function') {
                try { _saveCart(); } catch(e) {}
            } else {
                try { localStorage.setItem('pm_cart', JSON.stringify({ cart: newCart, store: state.cartStore, type: 'store' })); } catch(e) {}
            }

            _toast('🔁 أُضيفت المنتجات للسلة', 'success');
            setTimeout(function() {
                if (typeof _renderStoreView === 'function' && ownerUid) {
                    _renderStoreView(ownerUid);
                } else if (typeof _openCartModal === 'function') {
                    _openCartModal();
                } else {
                    _onTab('browse');
                }
            }, 500);
        } catch(e) {
            console.error('[reorder]', e);
            _toast('❌ فشل إعادة الطلب', 'error');
        }
    };

    // ═══ Map: المتاجر على الخريطة ═══
    let _storesMapInstance = null;

    window._openStoresMap = function() {
        // تحقق من وجود Leaflet
        if (typeof L === 'undefined') {
            _toast('⚠️ الخريطة غير محمّلة — تحقق من الإنترنت', 'warning');
            return;
        }

        // المتاجر مع موقع
        const storesWithLoc = (state.filteredStores && state.filteredStores.length > 0
            ? state.filteredStores
            : state.stores || []
        ).filter(s => s.storeLocation && s.storeLocation.lat && s.storeLocation.lng);

        if (storesWithLoc.length === 0) {
            _toast('⚠️ لا توجد متاجر بموقع محدد', 'warning');
            return;
        }

        // إنشاء Modal
        const html = '<div id="_storesMapModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:stretch;justify-content:center;">'
            + '<div style="background:white;width:100%;max-width:700px;display:flex;flex-direction:column;position:relative;">'

            // Header
            + '<div style="padding:14px 18px;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 14px rgba(142,68,173,0.3);">'
            + '<div style="font-size:16px;font-weight:900;">🗺️ المتاجر على الخريطة</div>'
            + '<button onclick="_closeStoresMap()" style="background:rgba(255,255,255,0.2);color:white;border:none;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>'
            + '</div>'

            // Map container
            + '<div id="_storesMapContainer" style="flex:1;min-height:400px;"></div>'

            // Footer info
            + '<div style="padding:10px 16px;background:#f8f9fa;border-top:1px solid #ecf0f1;text-align:center;font-size:11px;color:#7f8c8d;">'
            + '📍 ' + storesWithLoc.length + ' متجر على الخريطة'
            + '</div>'

            + '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);

        // إنشاء الخريطة
        setTimeout(function() {
            try {
                // مركز الخريطة: موقعك أو أول متجر
                let centerLat = 35.0;
                let centerLng = 36.7;
                if (state.gpsLocation && state.gpsLocation.lat) {
                    centerLat = state.gpsLocation.lat;
                    centerLng = state.gpsLocation.lng;
                } else if (storesWithLoc[0].storeLocation) {
                    centerLat = Number(storesWithLoc[0].storeLocation.lat);
                    centerLng = Number(storesWithLoc[0].storeLocation.lng);
                }

                _storesMapInstance = L.map('_storesMapContainer', {
                    zoomControl: true,
                    attributionControl: false
                }).setView([centerLat, centerLng], 12);

                // Tiles (OSM)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(_storesMapInstance);

                // علامة موقعك
                if (state.gpsLocation && state.gpsLocation.lat) {
                    const myIcon = L.divIcon({
                        className: 'my-location-marker',
                        html: '<div style="width:20px;height:20px;background:#2196F3;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(33,150,243,0.6);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    L.marker([state.gpsLocation.lat, state.gpsLocation.lng], { icon: myIcon })
                        .addTo(_storesMapInstance)
                        .bindPopup('<div style="text-align:center;font-weight:800;font-size:13px;">📍 موقعك</div>');
                }

                // علامات المتاجر
                const bounds = [];
                storesWithLoc.forEach(function(store) {
                    const lat = Number(store.storeLocation.lat);
                    const lng = Number(store.storeLocation.lng);
                    bounds.push([lat, lng]);

                    const storeName = store.businessName || 'متجر';
                    const ownerUid = store.ownerUid || '';
                    const distText = store._distance ? ' · ' + _fmtDistance(store._distance) : '';
                    const coverImg = store.coverImage || '';

                    // 🎨 علامة المتجر — HTML مدمج: صورة + اسم
                    let avatarHtml;
                    if (coverImg) {
                        avatarHtml = '<div style="width:48px;height:48px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px rgba(142,68,173,0.6);overflow:hidden;background:white;"><img src="' + coverImg + '" style="width:100%;height:100%;object-fit:cover;transform:rotate(45deg) scale(1.42);display:block;" /></div>';
                    } else {
                        avatarHtml = '<div style="width:48px;height:48px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#8e44ad,#9b59b6);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 14px rgba(142,68,173,0.6);font-size:20px;"><span style="transform:rotate(45deg);">🏪</span></div>';
                    }

                    const labelHtml = '<div style="background:white;border-radius:10px;padding:3px 8px;font-size:11px;font-weight:800;color:#8e44ad;box-shadow:0 2px 8px rgba(0,0,0,0.18);white-space:nowrap;margin-top:3px;max-width:140px;overflow:hidden;text-overflow:ellipsis;">' + _esc(storeName) + '</div>';

                    const innerHtml = '<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">'
                        + avatarHtml
                        + labelHtml
                        + '</div>';

                    const storeIcon = L.divIcon({
                        className: 'store-map-marker',
                        html: innerHtml,
                        iconSize: [50, 82],
                        iconAnchor: [25, 36],
                        popupAnchor: [0, -36]
                    });

                    const popupHtml = '<div style="min-width:180px;text-align:right;direction:rtl;">'
                        + '<div style="font-weight:900;font-size:14px;color:#2c3e50;margin-bottom:4px;">🏪 ' + _esc(storeName) + '</div>'
                        + '<div style="font-size:11px;color:#7f8c8d;margin-bottom:8px;">' + _esc(store.businessType || '') + distText + '</div>'
                        + '<button onclick="_closeStoresMap();_openStore(\'' + ownerUid + '\')" style="width:100%;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">فتح المتجر ←</button>'
                        + '</div>';

                    L.marker([lat, lng], { icon: storeIcon })
                        .addTo(_storesMapInstance)
                        .bindPopup(popupHtml);
                });

                // اضبط الحدود لترى كل العلامات
                if (bounds.length > 1) {
                    _storesMapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
                }

                // حل مشكلة العرض داخل Modal
                setTimeout(function() {
                    if (_storesMapInstance) _storesMapInstance.invalidateSize();
                }, 200);

            } catch(err) {
                console.error('[storesMap]', err);
                _toast('❌ فشل تحميل الخريطة', 'error');
                _closeStoresMap();
            }
        }, 100);
    };

    window._closeStoresMap = function() {
        const modal = document.getElementById('_storesMapModal');
        if (modal) modal.remove();
        if (_storesMapInstance) {
            try { _storesMapInstance.remove(); } catch(e) {}
            _storesMapInstance = null;
        }
    };

    // ═══ 🗺️ الخريطة المصغّرة للرئيسية ═══
    let _homeMiniMapInstance = null;
    let _homeMiniMapMarkers = [];

    function _renderHomeMiniMap() {
        const container = document.getElementById('homeMiniMap');
        if (!container) return;

        // تحقق من وجود Leaflet
        if (typeof L === 'undefined') {
            console.warn('[homeMiniMap] Leaflet not loaded');
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#7f8c8d;font-size:12px;font-weight:700;">⚠️ الخريطة غير محمّلة</div>';
            return;
        }

        // 🧹 نظّف الخريطة السابقة
        if (_homeMiniMapInstance) {
            try { _homeMiniMapInstance.remove(); } catch(e) {}
            _homeMiniMapInstance = null;
            _homeMiniMapMarkers = [];
        }

        // المتاجر مع موقع
        const stores = (state.filteredStores || state.stores || [])
            .filter(s => s.storeLocation && s.storeLocation.lat && s.storeLocation.lng);

        // مركز الخريطة
        let centerLat = 35.0;
        let centerLng = 36.7;
        let zoom = 12;
        if (state.gpsLocation && state.gpsLocation.lat) {
            centerLat = state.gpsLocation.lat;
            centerLng = state.gpsLocation.lng;
            zoom = 13;
        } else if (stores.length > 0) {
            centerLat = Number(stores[0].storeLocation.lat);
            centerLng = Number(stores[0].storeLocation.lng);
        }

        try {
            _homeMiniMapInstance = L.map('homeMiniMap', {
                zoomControl: false,
                attributionControl: false
            }).setView([centerLat, centerLng], zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(_homeMiniMapInstance);

            // 🔵 موقع المستخدم
            if (state.gpsLocation && state.gpsLocation.lat) {
                const myIcon = L.divIcon({
                    className: 'home-my-location',
                    html: '<div style="width:16px;height:16px;background:#2196F3;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(33,150,243,0.6);"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                L.marker([state.gpsLocation.lat, state.gpsLocation.lng], { icon: myIcon })
                    .addTo(_homeMiniMapInstance)
                    .bindPopup('<div style="text-align:center;font-weight:800;font-size:12px;">📍 موقعك</div>');
            }

            // 🏪 علامات المتاجر
            const bounds = [];
            stores.forEach(function(store) {
                const lat = Number(store.storeLocation.lat);
                const lng = Number(store.storeLocation.lng);
                bounds.push([lat, lng]);

                const storeName = store.businessName || 'متجر';
                const ownerUid = store.ownerUid || '';
                const coverImg = store.coverImage || '';

                // 🎨 علامة المتجر — HTML مدمج: صورة + اسم
                let avatarHtml;
                if (coverImg) {
                    avatarHtml = '<div style="width:42px;height:42px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(142,68,173,0.6);overflow:hidden;background:white;"><img src="' + coverImg + '" style="width:100%;height:100%;object-fit:cover;transform:rotate(45deg) scale(1.42);display:block;" /></div>';
                } else {
                    avatarHtml = '<div style="width:42px;height:42px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#8e44ad,#9b59b6);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 12px rgba(142,68,173,0.6);font-size:18px;"><span style="transform:rotate(45deg);">🏪</span></div>';
                }

                const labelHtml = '<div style="background:white;border-radius:10px;padding:3px 8px;font-size:11px;font-weight:800;color:#8e44ad;box-shadow:0 2px 8px rgba(0,0,0,0.18);white-space:nowrap;margin-top:3px;max-width:120px;overflow:hidden;text-overflow:ellipsis;">' + _esc(storeName) + '</div>';

                const innerHtml = '<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;">'
                    + avatarHtml
                    + labelHtml
                    + '</div>';

                const storeIcon = L.divIcon({
                    className: 'home-store-marker',
                    html: innerHtml,
                    iconSize: [44, 76],
                    iconAnchor: [22, 32],
                    popupAnchor: [0, -32]
                });

                const popupHtml = '<div style="min-width:150px;text-align:right;direction:rtl;">'
                    + '<div style="font-weight:900;font-size:12px;color:#2c3e50;margin-bottom:6px;">🏪 ' + _esc(storeName) + '</div>'
                    + '<button onclick="_openStore(\'' + ownerUid + '\')" style="width:100%;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:8px;padding:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">فتح المتجر ←</button>'
                    + '</div>';

                const marker = L.marker([lat, lng], { icon: storeIcon })
                    .addTo(_homeMiniMapInstance)
                    .bindPopup(popupHtml);

                _homeMiniMapMarkers.push(marker);
            });

            // اضبط الحدود
            if (bounds.length > 0 && state.gpsLocation) {
                bounds.push([state.gpsLocation.lat, state.gpsLocation.lng]);
            }
            if (bounds.length > 1) {
                _homeMiniMapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
            }

            // حل مشكلة الحجم
            setTimeout(function() {
                if (_homeMiniMapInstance) _homeMiniMapInstance.invalidateSize();
            }, 200);

            console.log('🗺️ [homeMiniMap] rendered with', stores.length, 'stores');
        } catch(err) {
            console.error('[homeMiniMap]', err);
            container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#7f8c8d;font-size:12px;font-weight:700;">⚠️ تعذّر تحميل الخريطة</div>';
        }
    }

    // 🧹 تنظيف عند مغادرة الرئيسية
    function _destroyHomeMiniMap() {
        if (_homeMiniMapInstance) {
            try { _homeMiniMapInstance.remove(); } catch(e) {}
            _homeMiniMapInstance = null;
            _homeMiniMapMarkers = [];
        }
    }

    // ⭐ عرض كل التقييمات
    window._openAllReviews = function(uid) {
        const store = (state.stores || []).find(s => s.ownerUid === uid);
        if (!store) return;
        const reviews = Array.isArray(store.lastReviews) ? store.lastReviews.filter(r => r.visible !== false) : [];
        const rating = store.avgRating ? Number(store.avgRating).toFixed(1) : '—';
        const ratingsCount = store.ratingsCount || 0;
        const themeColor = store.themeColor || '#8e44ad';

        const reviewsHtml = reviews.map(function(r) {
            const rStars = '⭐'.repeat(Number(r.rating) || 0) + '☆'.repeat(5 - (Number(r.rating) || 0));
            const cName = r.customerName || 'عميل';
            const initial = cName.trim().charAt(0) || '؟';
            const comment = r.comment ? _esc(r.comment) : '';
            const when = r.createdAt ? _timeAgo(r.createdAt) : '';
            return '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">'
                + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
                    + '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,' + themeColor + ',' + _darkenColor(themeColor, 30) + ');color:white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex-shrink:0;">' + _esc(initial) + '</div>'
                    + '<div style="flex:1;">'
                        + '<div style="font-size:14px;font-weight:800;color:#2c3e50;">' + _esc(cName) + '</div>'
                        + '<div style="font-size:15px;letter-spacing:1px;">' + rStars + '</div>'
                    + '</div>'
                    + (when ? '<div style="font-size:11px;color:#95a5a6;">' + _esc(when) + '</div>' : '')
                + '</div>'
                + (comment ? '<div style="font-size:13px;color:#4a5568;line-height:1.7;font-style:italic;">"' + comment + '"</div>' : '')
                + (r.ownerReply ? '<div style="background:#f0f8ff;border-right:3px solid #3498db;border-radius:8px;padding:10px;margin-top:8px;"><div style="font-size:11px;color:#2980b9;font-weight:700;margin-bottom:4px;">🏪 رد المتجر:</div><div style="font-size:12px;color:#2c3e50;line-height:1.6;">' + _esc(r.ownerReply) + '</div></div>' : '')
                + '</div>';
        }).join('');

        const html = '<div id="_allReviewsModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)this.remove();">'
            + '<div style="background:#f5f7fa;border-radius:24px 24px 0 0;width:100%;max-width:500px;max-height:88vh;overflow-y:auto;">'
            + '<div style="padding:18px 20px;border-bottom:1px solid #e9ecef;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2;border-radius:24px 24px 0 0;">'
            + '<div>'
                + '<div style="font-size:17px;font-weight:900;color:#2c3e50;">⭐ كل التقييمات</div>'
                + '<div style="font-size:12px;color:#7f8c8d;margin-top:2px;">' + rating + ' · ' + ratingsCount + ' تقييم</div>'
            + '</div>'
            + '<button onclick="document.getElementById(\'_allReviewsModal\').remove()" style="background:#ecf0f1;border:none;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>'
            + '</div>'
            + '<div style="padding:16px;">' + reviewsHtml + '</div>'
            + '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    };

    function _renderProfile() {
        const ud = state.userData || {};
        const user = state.user || {};
        const isVerified = user.emailVerified === true;

        // إحصائيات
        const ordersCount = (state.orders || []).length;
        const ratedOrders = (state.orders || []).filter(o => o.review && o.review.rating);
        const avgRating = ratedOrders.length > 0
            ? (ratedOrders.reduce((s, o) => s + Number(o.review.rating || 0), 0) / ratedOrders.length).toFixed(1)
            : '—';

        // تاريخ العضوية
        let memberSince = '—';
        try {
            const created = user.metadata && user.metadata.creationTime;
            if (created) {
                const d = new Date(created);
                const months = Math.max(1, Math.round((Date.now() - d.getTime()) / (1000*60*60*24*30)));
                memberSince = months < 12 ? (months + ' شهر') : (Math.floor(months/12) + ' سنة');
            }
        } catch(e) {}

        // أفاتار (أول حرف)
        const fullName = ud.fullName || user.displayName || 'مستخدم';
        const initial = fullName.trim().charAt(0) || '؟';

        // الموقع
        const loc = ud.location || {};
        const locText = [loc.governorate, loc.town, loc.district].filter(Boolean).join(' — ') || 'غير محدد';

        // زر التوثيق
        const verifyHtml = isVerified
            ? '<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;">✅ موثّق</span>'
            : '<button onclick="_resendVerification()" style="background:#fff3e0;color:#e65100;border:1px solid #ffcc80;font-size:11px;font-weight:800;padding:5px 12px;border-radius:20px;cursor:pointer;font-family:inherit;">⚠️ أعد إرسال رابط التفعيل</button>';

        document.getElementById('appContent').innerHTML = `
            <div style="padding:16px 12px 100px;">
                <div style="background:linear-gradient(135deg,#8e44ad,#9b59b6);border-radius:20px;padding:24px 20px;text-align:center;color:white;box-shadow:0 6px 20px rgba(142,68,173,0.35);margin-bottom:16px;">
                    <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:36px;font-weight:900;border:3px solid rgba(255,255,255,0.4);">${_esc(initial)}</div>
                    <div style="font-size:20px;font-weight:900;margin-bottom:6px;">${_esc(fullName)}</div>
                    <div style="font-size:13px;opacity:0.9;margin-bottom:4px;">📱 ${_esc(ud.phone || '—')}</div>
                    <div style="font-size:13px;opacity:0.9;margin-bottom:12px;">📧 ${_esc(ud.email || user.email || '—')}</div>
                    ${verifyHtml}
                </div>

                <div style="font-size:14px;font-weight:900;color:#2c3e50;margin:16px 4px 10px;">📊 إحصائياتي</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
                    <div style="background:white;border-radius:14px;padding:14px 8px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size:22px;margin-bottom:4px;">🛍️</div>
                        <div style="font-size:18px;font-weight:900;color:#8e44ad;">${ordersCount}</div>
                        <div style="font-size:11px;color:#7f8c8d;font-weight:700;">طلب</div>
                    </div>
                    <div style="background:white;border-radius:14px;padding:14px 8px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size:22px;margin-bottom:4px;">⭐</div>
                        <div style="font-size:18px;font-weight:900;color:#f39c12;">${avgRating}</div>
                        <div style="font-size:11px;color:#7f8c8d;font-weight:700;">متوسط</div>
                    </div>
                    <div style="background:white;border-radius:14px;padding:14px 8px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size:22px;margin-bottom:4px;">📅</div>
                        <div style="font-size:14px;font-weight:900;color:#3498db;line-height:1.2;">${memberSince}</div>
                        <div style="font-size:11px;color:#7f8c8d;font-weight:700;">عضو</div>
                    </div>
                </div>

                <div style="font-size:14px;font-weight:900;color:#2c3e50;margin:16px 4px 10px;">📍 موقعي</div>
                <div style="background:white;border-radius:14px;padding:14px 16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    <div style="font-size:20px;">🗺️</div>
                    <div style="flex:1;font-size:13px;font-weight:700;color:#2c3e50;">${_esc(locText)}</div>
                </div>

                <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:12px;">
                    <div onclick="_editName()" style="padding:16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;cursor:pointer;">
                        <div style="font-size:20px;">✏️</div>
                        <div style="flex:1;font-size:14px;font-weight:800;color:#2c3e50;">تعديل الاسم</div>
                        <div style="color:#bdc3c7;font-size:18px;">‹</div>
                    </div>
                    <div onclick="_contactSupport()" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;">
                        <div style="font-size:20px;">💬</div>
                        <div style="flex:1;font-size:14px;font-weight:800;color:#2c3e50;">الدعم والمساعدة</div>
                        <div style="color:#bdc3c7;font-size:18px;">‹</div>
                    </div>
                </div>

                <div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:12px;">
                    <div onclick="_openNotifications()" style="padding:16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;cursor:pointer;">
                        <div style="font-size:20px;">🔔</div>
                        <div style="flex:1;font-size:14px;font-weight:800;color:#2c3e50;">الإشعارات</div>
                        <div id="_notifBadge" style="font-size:11px;color:#8e44ad;font-weight:800;background:#f3e5f5;padding:3px 10px;border-radius:20px;">مفعّلة</div>
                        <div style="color:#bdc3c7;font-size:18px;">‹</div>
                    </div>
                    <div onclick="_toggleDarkMode()" style="padding:16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;cursor:pointer;">
                        <div style="font-size:20px;">🌙</div>
                        <div style="flex:1;font-size:14px;font-weight:800;color:#2c3e50;">الوضع الليلي</div>
                        <div id="_darkModeState" style="font-size:11px;color:#7f8c8d;font-weight:800;background:#ecf0f1;padding:3px 10px;border-radius:20px;">معطّل</div>
                        <div style="color:#bdc3c7;font-size:18px;">‹</div>
                    </div>
                    <div onclick="_openPrivacy()" style="padding:16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;cursor:pointer;">
                        <div style="font-size:20px;">📜</div>
                        <div style="flex:1;font-size:14px;font-weight:800;color:#2c3e50;">سياسة الخصوصية</div>
                        <div style="color:#bdc3c7;font-size:18px;">‹</div>
                    </div>
                    <div onclick="_openTerms()" style="padding:16px;display:flex;align-items:center;gap:12px;cursor:pointer;">
                        <div style="font-size:20px;">📋</div>
                        <div style="flex:1;font-size:14px;font-weight:800;color:#2c3e50;">شروط الخدمة</div>
                        <div style="color:#bdc3c7;font-size:18px;">‹</div>
                    </div>
                </div>

                <button onclick="_signOut()" style="width:100%;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:14px;padding:14px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:16px;">🚪 تسجيل الخروج</button>

                <div style="text-align:center;font-size:11px;color:#95a5a6;font-weight:700;">Shop1st — الإصدار 1.0.0</div>
            </div>`;

        // 🔄 تحديث حالات الأزرار
        _updateNotifBadge();
        _updateDarkModeState();
    }

    // ═══ Profile Actions ═══
    window._editName = function() {
        const ud = state.userData || {};
        const currentName = ud.fullName || (state.user && state.user.displayName) || '';
        const html = `
            <div id="_nameModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target===this)this.remove();">
                <div style="background:white;border-radius:20px;padding:24px;width:100%;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
                    <div style="font-size:18px;font-weight:900;color:#2c3e50;margin-bottom:16px;text-align:center;">✏️ تعديل الاسم</div>
                    <input id="_nameInput" type="text" value="${_esc(currentName)}" placeholder="الاسم الكامل" style="width:100%;padding:14px;border:2px solid #ecf0f1;border-radius:12px;font-size:15px;font-family:inherit;font-weight:700;box-sizing:border-box;margin-bottom:14px;text-align:right;" />
                    <div style="display:flex;gap:8px;">
                        <button onclick="document.getElementById('_nameModal').remove()" style="flex:1;background:#ecf0f1;color:#7f8c8d;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;">إلغاء</button>
                        <button onclick="_saveName()" id="_nameSaveBtn" style="flex:2;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;">💾 حفظ</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(function(){ 
            const inp = document.getElementById('_nameInput');
            if (inp) inp.focus();
        }, 100);
    };

    window._saveName = async function() {
        const input = document.getElementById('_nameInput');
        const btn = document.getElementById('_nameSaveBtn');
        const newName = (input && input.value ? input.value : '').trim();

        if (!newName || newName.length < 2) {
            _toast('⚠️ الاسم قصير جداً', 'warning');
            return;
        }
        if (newName.length > 50) {
            _toast('⚠️ الاسم طويل جداً', 'warning');
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري الحفظ...'; }

        try {
            const user = state.user;
            if (!user) throw new Error('لا يوجد مستخدم');

            // ① تحديث Firebase Auth
            await user.updateProfile({ displayName: newName });

            // ② تحديث Firestore
            await db.collection('users').doc(user.uid).update({
                fullName: newName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // ③ تحديث state المحلي
            if (state.userData) state.userData.fullName = newName;

            _toast('✅ تم حفظ الاسم', 'success');
            const m = document.getElementById('_nameModal');
            if (m) m.remove();
            _renderProfile();
        } catch(e) {
            console.error('[saveName]', e);
            _toast('❌ فشل الحفظ — تحقق من الاتصال', 'error');
            if (btn) { btn.disabled = false; btn.textContent = '💾 حفظ'; }
        }
    };

    window._contactSupport = function() {
        const ownerPhone = '963994456264';
        const ud = state.userData || {};
        const user = state.user || {};
        const msg = encodeURIComponent(
            'مرحباً، أنا ' + (ud.fullName || 'مستخدم') + ' من تطبيق Shop1st.\n' +
            '📧 ' + (ud.email || user.email || '') + '\n' +
            '📱 ' + (ud.phone || '')
        );
        window.open('https://wa.me/' + ownerPhone + '?text=' + msg, '_blank');
    };

    window._resendVerification = async function() {
        try {
            const user = state.user;
            if (!user) return;
            await user.sendEmailVerification();
            _toast('✅ أُرسل رابط التفعيل لبريدك', 'success');
        } catch(e) {
            console.error('[resendVerification]', e);
            _toast('❌ فشل الإرسال — حاول لاحقاً', 'error');
        }
    };

    window._signOut = async function() {
        if (!confirm('هل تريد تسجيل الخروج؟')) return;

        // ① امسح الجلسة المحلية فوراً
        try {
            localStorage.removeItem('pm_pendingCart');
            localStorage.removeItem('pm_notif_prefs');
            sessionStorage.clear();
        } catch(e) {}

        try {
            // ② تسجيل الخروج من Firebase
            await auth.signOut();
            _toast('👋 إلى اللقاء', 'info');
        } catch(e) {
            console.error('[signOut]', e);
        }

        // ③ انتقل لصفحة تسجيل الدخول — replace() لا يحفظ في history
        setTimeout(function() {
            // 🚀 Cache busting: يُجبر المتصفح على إعادة التحميل
            window.location.replace('customer-login.html');
        }, 500);
    };

    // ═══ Notifications Prefs ═══
    const NOTIF_DEFAULTS = { orders: true, offers: true, support: true, sound: false };

    function _getNotifPrefs() {
        try {
            const raw = localStorage.getItem('pm_notif_prefs');
            if (!raw) return Object.assign({}, NOTIF_DEFAULTS);
            return Object.assign({}, NOTIF_DEFAULTS, JSON.parse(raw));
        } catch(e) {
            return Object.assign({}, NOTIF_DEFAULTS);
        }
    }

    function _updateNotifBadge() {
        const prefs = _getNotifPrefs();
        const active = [prefs.orders, prefs.offers, prefs.support].filter(Boolean).length;
        const badge = document.getElementById('_notifBadge');
        if (!badge) return;
        if (active === 0) {
            badge.textContent = 'معطّلة';
            badge.style.background = '#fee2e2';
            badge.style.color = '#dc2626';
        } else {
            badge.textContent = 'مفعّلة (' + active + '/3)';
            badge.style.background = '#f3e5f5';
            badge.style.color = '#8e44ad';
        }
    }

    window._openNotifications = function() {
        const prefs = _getNotifPrefs();
        function row(key, icon, title, desc, on) {
            const bg = on ? '#e8f5e9' : '#ecf0f1';
            const fg = on ? '#2e7d32' : '#95a5a6';
            const label = on ? 'ON' : 'OFF';
            return '<div onclick="_toggleNotif(\'' + key + '\', this)" data-key="' + key + '" data-on="' + (on ? '1' : '0') + '" style="padding:16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px;cursor:pointer;">'
                + '<div style="font-size:22px;">' + icon + '</div>'
                + '<div style="flex:1;"><div style="font-size:14px;font-weight:800;color:#2c3e50;">' + title + '</div>'
                + '<div style="font-size:12px;color:#7f8c8d;margin-top:2px;">' + desc + '</div></div>'
                + '<div class="_notifSwitch" style="background:' + bg + ';color:' + fg + ';font-size:11px;font-weight:900;padding:5px 12px;border-radius:20px;min-width:44px;text-align:center;">' + label + '</div></div>';
        }
        const html = '<div id="_notifModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)this.remove();">'
            + '<div style="background:white;border-radius:24px 24px 0 0;width:100%;max-width:500px;max-height:85vh;overflow-y:auto;padding-bottom:20px;">'
            + '<div style="padding:20px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:2;">'
            + '<div style="font-size:18px;font-weight:900;color:#2c3e50;">🔔 الإشعارات</div>'
            + '<button onclick="document.getElementById(\'_notifModal\').remove()" style="background:#ecf0f1;border:none;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;font-family:inherit;">✕</button>'
            + '</div>'
            + '<div>'
            + row('orders', '📦', 'إشعارات الطلبات', 'تحديثات حالة طلبك', prefs.orders)
            + row('offers', '🎁', 'إشعارات العروض', 'خصومات من المتاجر', prefs.offers)
            + row('support', '💬', 'إشعارات الدعم', 'ردود الدعم والمساعدة', prefs.support)
            + row('sound', '🔊', 'إشعارات صوتية', 'تشغيل صوت عند الإشعار', prefs.sound)
            + '</div>'
            + '<div style="padding:16px;">'
            + '<div style="background:#f3e5f5;border-right:4px solid #8e44ad;border-radius:10px;padding:12px 14px;font-size:12px;color:#6a1b9a;line-height:1.6;">'
            + '<b>ℹ️ ملاحظة:</b> الإشعارات الفورية (Push) ستُفعَّل عند إطلاق التطبيق الرسمي (APK) قريباً. تفضيلاتك محفوظة ومزامَنة.'
            + '</div></div>'
            + '<div style="padding:0 16px 16px;">'
            + '<button onclick="_saveNotifPrefs()" style="width:100%;background:linear-gradient(135deg,#8e44ad,#9b59b6);color:white;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(142,68,173,0.35);">💾 حفظ التفضيلات</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    };

    window._toggleNotif = function(key, el) {
        const cur = el.getAttribute('data-on') === '1';
        const next = !cur;
        el.setAttribute('data-on', next ? '1' : '0');
        const sw = el.querySelector('._notifSwitch');
        if (sw) {
            sw.textContent = next ? 'ON' : 'OFF';
            sw.style.background = next ? '#e8f5e9' : '#ecf0f1';
            sw.style.color = next ? '#2e7d32' : '#95a5a6';
        }
    };

    window._saveNotifPrefs = async function() {
        const modal = document.getElementById('_notifModal');
        if (!modal) return;
        const prefs = {};
        modal.querySelectorAll('[data-key]').forEach(function(el) {
            prefs[el.getAttribute('data-key')] = el.getAttribute('data-on') === '1';
        });
        try { localStorage.setItem('pm_notif_prefs', JSON.stringify(prefs)); } catch(e) {}
        try {
            if (state.user && !state.isGuest) {
                await db.collection('users').doc(state.user.uid)
                    .collection('settings').doc('notifications')
                    .set(Object.assign({}, prefs, {
                        platform: 'web',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }), { merge: true });
            }
        } catch(e) { console.warn('[saveNotifPrefs] firestore:', e); }
        _toast('✅ تم حفظ تفضيلات الإشعارات', 'success');
        modal.remove();
        _updateNotifBadge();
    };

    window._requestPushPermission = async function() {
        console.log('🔔 [FCM] placeholder — سيُفعَّل في APK');
        return { granted: false, reason: 'web_only' };
    };

    window._registerFCMToken = async function(token) {
        console.log('🔔 [FCM] token received (APK only):', token);
        if (!state.user || !token) return;
        try {
            await db.collection('users').doc(state.user.uid)
                .collection('settings').doc('notifications')
                .set({ fcmToken: token, platform: 'android' }, { merge: true });
        } catch(e) { console.warn('[registerFCMToken]', e); }
    };

    window._openPrivacy = function() {
        location.href = 'privacy.html';
    };

    window._openTerms = function() {
        location.href = 'terms.html';
    };

    // ═══ Dark Mode ═══
    window._toggleDarkMode = function() {
        const cur = document.body.classList.contains('dark-mode');
        const next = !cur;
        if (next) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        try { localStorage.setItem('pm_dark_mode', next ? '1' : '0'); } catch(e) {}
        _updateDarkModeState();
        _toast(next ? '🌙 الوضع الليلي مُفعَّل' : '☀️ الوضع النهاري', 'info');
    };

    function _updateDarkModeState() {
        const el = document.getElementById('_darkModeState');
        if (!el) return;
        const on = document.body.classList.contains('dark-mode');
        el.textContent = on ? 'مفعّل' : 'معطّل';
        el.style.background = on ? '#4a148c' : '#ecf0f1';
        el.style.color = on ? 'white' : '#7f8c8d';
    }

    function _applyStoredDarkMode() {
        try {
            if (localStorage.getItem('pm_dark_mode') === '1') {
                document.body.classList.add('dark-mode');
            }
        } catch(e) {}
    }

    // ═══ Auth Listener ═══
    // 🏠 / 🏪 دالة ذكية: الرئيسية أو المتجر (حسب ?store=)
    function _renderHomeOrStore() {
        try {
            const params = new URLSearchParams(window.location.search);

            // 🆕 احترم ?tab= — قارئها يعرض التبويب مباشرة
            const tab = (params.get('tab') || '').trim();
            if (['home', 'browse', 'orders', 'profile'].includes(tab)) {
                console.log('🔗 [home-or-store] deferring to ?tab:', tab);
                return;
            }

            const storeUid = (params.get('store') || params.get('o') || '').trim();
            if (storeUid && state.stores && state.stores.find(s => s.ownerUid === storeUid)) {
                console.log('🏪 [customer] auto-opening store:', storeUid);
                if (typeof _renderStoreView === 'function') {
                    _renderStoreView(storeUid);
                    return;
                }
            }
        } catch(e) {
            console.warn('[home-or-store]', e);
        }
        _renderHome();
    }

    auth.onAuthStateChanged(async (user) => {
        state.loading = false;

        // ═══ ① لا مستخدم — إعادة توجيه للدخول ═══
        if (!user) {
            console.log('🔒 [customer] no user — redirecting to login');
            location.href = 'customer-login.html';
            return;
        }

        // ═══ ② البريد غير مفعّل — إعادة توجيه ═══
        if (!user.emailVerified) {
            console.log('[customer] email not verified');
            alert('⚠️ يرجى تفعيل بريدك الإلكتروني أولاً');
            await auth.signOut();
            location.href = 'customer-login.html';
            return;
        }

        // ═══ ③ مسجّل + مفعّل ═══
        try {
            const snap = await db.collection('users').doc(user.uid).get();
            if (!snap.exists) {
                console.warn('[customer] user doc missing');
                location.href = 'customer-login.html';
                return;
            }
            const data = snap.data();

            // 🔒 التحقق من accountType — منع التاجر/الموظف من Shop1st
            if (data.accountType !== 'customer') {
                console.log('[customer] not a customer account:', data.accountType);
                state.nonCustomerType = data.accountType;
                state.user = user;
                state.userData = data;
                _hideSplash();
                _showWrongAccountType(data.accountType);
                return;
            }

            // عميل حقيقي
            state.isGuest = false;
            state.user = user;
            state.userData = data;
            state.location = {
                governorate: data.location?.governorate || '',
                town: data.location?.town || '',
                district: data.location?.district || ''
            };

            console.log('✅ [customer] user loaded:', state.location);

            await _loadStores();
            _renderHomeOrStore();
            _hideSplash();

            // طلب GPS تلقائياً
            setTimeout(() => {
                if (navigator.geolocation) {
                    window._requestGPS();
                }
            }, 1500);

        } catch (e) {
            console.error('[customer] init:', e);
            location.href = 'customer-login.html';
        }
    });

    console.log('👤 [customer-app] v1.0.0 محمّل');

    // 🔗 قراءة ?tab= من URL عند التحميل (يفتح تبويباً تلقائياً)
    window.addEventListener('DOMContentLoaded', function() {
        try {
            const p = new URLSearchParams(window.location.search);
            const tab = (p.get('tab') || '').trim();
            if (['home', 'browse', 'orders', 'profile'].includes(tab)) {
                // ننتظر حتى يجهز _onTab ثم نستدعيه (سيُنظّم الانتظار بنفسه)
                let tries = 0;
                const tryTab = function() {
                    tries++;
                    if (typeof _onTab === 'function') {
                        console.log('🔗 [customer-app] auto-tab:', tab, 'tries=' + tries);
                        _onTab(tab);
                    } else if (tries < 20) {
                        setTimeout(tryTab, 100);
                    }
                };
                setTimeout(tryTab, 450);
            }
        } catch(e) {
            console.warn('[auto-tab]', e);
        }
    });

    // 🏪 قراءة ?store= لفتح متجر مباشرة (الرابط الذي يشاركه التاجر)
    window.addEventListener('DOMContentLoaded', function() {
        try {
            const p = new URLSearchParams(window.location.search);
            const storeUid = (p.get('store') || p.get('o') || '').trim();
            if (!storeUid) return;

            console.log('🏪 [customer-app] auto-store:', storeUid);

            // ننتظر على مراحل: auth → loadStores → نفتح المتجر
            let _tries = 0;
            const _tryOpen = function() {
                _tries++;
                // ننتظر حتى يتم تحميل المتاجر
                if (state.stores && state.stores.length > 0) {
                    if (typeof _openStore === 'function') {
                        console.log('🏪 [customer-app] opening store after delay...');
                        // ✨ نترك الرئيسية تظهر أولاً، ثم ننتقل للمتجر
                        if (typeof _toast === 'function') {
                            _toast('🏪 جاري فتح المتجر...');
                        }
                        setTimeout(function() {
                            _openStore(storeUid);
                        }, 1500);
                    }
                    return;
                }
                // نعيد المحاولة حتى 10 مرات (5 ثوانٍ)
                if (_tries < 10) {
                    setTimeout(_tryOpen, 500);
                } else {
                    console.warn('[auto-store] timeout — stores not loaded');
                }
            };
            setTimeout(_tryOpen, 800);
        } catch(e) {
            console.warn('[auto-store]', e);
        }
    });

    // 🍽️ قراءة ?table= لفتح طاولة مطعم (QR الطاولات)
    window.addEventListener('DOMContentLoaded', function() {
        try {
            const p = new URLSearchParams(window.location.search);
            const tableCode = (p.get('table') || p.get('c') || '').trim();
            if (!tableCode) return;

            console.log('🍽️ [customer-app] auto-table:', tableCode);

            // احفظه للاستخدام بعد التحميل
            state._pendingTable = tableCode;

            let _tries = 0;
            const _tryOpen = function() {
                _tries++;
                // ننتظر حتى يتم تحميل المتاجر (نحتاج ownerUid للطاولة)
                if (state.stores && state.stores.length > 0) {
                    if (typeof _openTableMode === 'function') {
                        console.log('🍽️ [customer-app] opening table mode...');
                        _openTableMode(tableCode);
                    } else {
                        console.warn('[auto-table] _openTableMode غير جاهزة بعد');
                    }
                    return;
                }
                if (_tries < 10) {
                    setTimeout(_tryOpen, 500);
                } else {
                    console.warn('[auto-table] timeout — stores not loaded');
                }
            };
            setTimeout(_tryOpen, 800);
        } catch(e) {
            console.warn('[auto-table]', e);
        }
    });
})();
