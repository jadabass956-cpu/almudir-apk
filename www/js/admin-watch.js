// ============ 📊 متابعة المشتركين ============
let _watchCache = [];
let _watchFilter = 'all';

async function loadWatchDashboard() {
    const list = document.getElementById('watchList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('users').get();
        const arr = [];
        const now = Date.now();

        snap.forEach(d => {
            const u = d.data();
            const lastAt = u.lastActiveAt?.toDate?.() 
                        || (u.lastActiveAt?.seconds ? new Date(u.lastActiveAt.seconds * 1000) : null);
            const hoursSince = lastAt ? (now - lastAt.getTime()) / 3600000 : 9999;

            arr.push({
                uid: d.id,
                name: u.fullName || u.businessName || 'بدون اسم',
                business: u.businessName || '-',
                phone: u.phone || '',
                governorate: u.location?.governorate || '-',
                status: u.subscriptionStatus || 'trial',
                lastAt: lastAt,
                hoursSince: hoursSince,
                stats: u.stats || {},
                email: u.email || ''
            });
        });

        // ترتيب: الأكثر خمولاً أولاً
        arr.sort((a, b) => b.hoursSince - a.hoursSince);
        _watchCache = arr;

        // لا تحسب المدير (أنت)
        const filtered = arr.filter(u => u.email !== 'jadabass956@gmail.com');
        _updateWatchStats(filtered);
        _renderWatchList();

    } catch(e) {
        console.error('[watch]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + e.message + '</div>';
    }
}

function _updateWatchStats(users) {
    const now = Date.now();
    let newToday = 0, active = 0, idle = 0;

    users.forEach(u => {
        if (u.hoursSince < 24) active++;
        else if (u.hoursSince < 168) idle++;
        // createdAt يفحص من بداية اليوم
        const createdAt = u.stats?.computedAt;
        if (createdAt && (now - createdAt) < 86400000) newToday++;
    });

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('watchStatActive', active);
    set('watchStatIdle', idle);
    set('watchStatTotal', users.length);
}

function _renderWatchList() {
    const list = document.getElementById('watchList');
    if (!list) return;

    let items = _watchCache.filter(u => u.email !== 'jadabass956@gmail.com');

    // فلترة
    if (_watchFilter === 'active') items = items.filter(u => u.hoursSince < 24);
    else if (_watchFilter === 'idle') items = items.filter(u => u.hoursSince >= 24 && u.hoursSince < 168);
    else if (_watchFilter === 'stopped') items = items.filter(u => u.hoursSince >= 168);
    else if (_watchFilter === 'new') items = items.filter(u => u.stats?.computedAt && (Date.now() - u.stats.computedAt) < 86400000);

    if (!items.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا يوجد مشتركون في هذه الفئة</div>';
        return;
    }

    let html = '';
    items.forEach(u => {
        const { label, color, bg } = _watchStatusLabel(u.hoursSince);
        const materials = u.stats.materialsCount || 0;
        const sales = u.stats.salesCount || 0;
        const lastText = u.lastAt ? _watchTimeAgo(u.lastAt) : 'لم يستخدم بعد';

        html += `
        <div style="background:${bg}; border-right:4px solid ${color}; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px;">${u.status === 'expired' ? '🚫' : (u.status === 'active' ? '💚' : '⏳')} 👤 ${_wEsc(u.name)}</div>
                    <div style="font-size:12px; color:#666; margin-top:2px;">🏪 ${_wEsc(u.business)} • 📍 ${_wEsc(u.governorate)}</div>
                    <div style="font-size:12px; color:#888; direction:ltr; text-align:right;">📱 ${_wEsc(u.phone)}</div>
                </div>
                <span style="background:${color}; color:white; padding:3px 10px; border-radius:20px; font-size:11px; white-space:nowrap;">${label}</span>
            </div>
            <div style="background:white; border-radius:8px; padding:10px; margin-bottom:8px; font-size:12px;">
                <div style="color:#555;">📊 ${materials} مادة • ${sales} فاتورة</div>
                <div style="color:#999; font-size:11px; margin-top:4px;">🕒 ${lastText}</div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${u.phone ? `<button onclick="contactWatchUser('${_wEsc(u.phone)}')" style="flex:1; min-width:80px; padding:8px; background:#25d366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">📱 واتساب</button>` : ''}
                <button onclick="openWatchUserSupport('${u.uid}')" style="flex:1; min-width:80px; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">💬 دعم</button>
                ${u.status === 'expired'
                    ? `<button onclick="reactivateUserSubscription('${u.uid}', '${_wEsc(u.name)}')" style="flex:1; min-width:80px; padding:8px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:bold;">✅ تفعيل</button>`
                    : `<button onclick="endUserSubscription('${u.uid}', '${_wEsc(u.name)}')" style="flex:1; min-width:80px; padding:8px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:bold;">🚫 إنهاء</button>`
                }
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function _watchStatusLabel(h) {
    if (h < 24)  return { label: '🟢 نشط',     color: '#27ae60', bg: '#f0fdf4' };
    if (h < 72)  return { label: '🟡 خامل',     color: '#f39c12', bg: '#fffbeb' };
    if (h < 168) return { label: '🟠 متوقف',   color: '#e67e22', bg: '#fff7ed' };
    return         { label: '🔴 غير نشط',  color: '#e74c3c', bg: '#fef2f2' };
}

function _watchTimeAgo(date) {
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return 'قبل ' + m + ' دقيقة';
    const h = Math.floor(m / 60);
    if (h < 24) return 'قبل ' + h + ' ساعة';
    const d = Math.floor(h / 24);
    return 'قبل ' + d + ' يوم';
}

function contactWatchUser(phone) {
    const clean = String(phone).replace(/[^0-9]/g, '');
    if (clean) window.open('https://wa.me/' + clean, '_blank');
}

function openWatchUserSupport(uid) {
    openPage('admin');
    setTimeout(() => {
        if (typeof openSupportConversation === 'function') {
            openSupportConversation(uid);
        }
    }, 300);
}

function switchWatchFilter(f) {
    _watchFilter = f;
    document.querySelectorAll('.watch-filter').forEach(b => {
        const active = b.dataset.filter === f;
        b.classList.toggle('active', active);
        b.style.background = active ? '#3498db' : '#ecf0f1';
        b.style.color = active ? 'white' : '#555';
    });
    _renderWatchList();
}

// ---------- 🚫 إنهاء اشتراك ----------
async function endUserSubscription(uid, name) {
    if (!confirm('⚠️ إنهاء اشتراك "' + name + '"؟\n\n• المستخدم سيرى شاشة الحجب فوراً\n• لن يفقد بياناته\n• يمكن إعادة تفعيله لاحقاً')) return;

    try {
        await db.collection('users').doc(uid).update({
            subscriptionStatus: 'expired',
            expiredAt: firebase.firestore.FieldValue.serverTimestamp(),
            expiredBy: auth.currentUser.uid
        });
        _watchToast('🚫 تم إنهاء اشتراك ' + name, 'warning');
        loadWatchDashboard();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

// ---------- ✅ تفعيل اشتراك ----------
async function reactivateUserSubscription(uid, name, days) {
    if (!days) {
        const choice = prompt('⏱️ اختر المدة (بالأيام):\n\n30 = شهري\n365 = سنوي\n36500 = مدى الحياة', '30');
        if (choice === null) return;
        days = parseInt(choice) || 30;
    }

    if (!confirm('✅ تفعيل اشتراك "' + name + '" لمدة ' + days + ' يوم؟')) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    try {
        await db.collection('users').doc(uid).update({
            subscriptionStatus: 'active',
            subscriptionEndDate: firebase.firestore.Timestamp.fromDate(endDate),
            activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            activatedBy: auth.currentUser.uid
        });
        _watchToast('✅ تم التفعيل لمدة ' + days + ' يوم', 'success');
        loadWatchDashboard();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

// ---------- Toast ----------
function _watchToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        if (typeof showToast === 'function') { showToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    const bg = type === 'success' ? '#27ae60' : (type === 'warning' ? '#f39c12' : '#e74c3c');
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' + bg + '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px; max-width:85vw; text-align:center;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 3000);
}

function _wEsc(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

console.log('📊 [admin-watch] جاهز');
