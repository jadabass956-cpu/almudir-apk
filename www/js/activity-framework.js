// ============================================================
//  🏗️ ACTIVITY FRAMEWORK — إطار الأنشطة الموحّد
//  نظام يسمح بإضافة أي نشاط تجاري بسهولة
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. REGISTRY — سجل الأنشطة
// ═══════════════════════════════════════════════════════════
const ACTIVITY_REGISTRY = {
    activities: new Map(),
    pages: new Map(),

    register(config) {
        if (!config || !config.id) {
            console.error('❌ [activity] missing id');
            return false;
        }
        this.activities.set(config.id, config);
        
        if (Array.isArray(config.pages)) {
            config.pages.forEach(page => {
                const pageId = `activity-${config.id}-${page.id}`;
                this.pages.set(pageId, {
                    activityId: config.id,
                    pageConfig: page,
                    activity: config
                });
                console.log(`📄 [activity] page: ${pageId}`);
            });
        }
        
        console.log(`✅ [activity] registered: ${config.icon || ''} ${config.name}`);
        return true;
    },

    get(id) { return this.activities.get(id); },
    getPage(pageId) { return this.pages.get(pageId); },
    has(id) { return this.activities.has(id); },
    list() { return Array.from(this.activities.values()); }
};

// ═══════════════════════════════════════════════════════════
//  2. PAGE OPENER — فتح صفحة نشاط
// ═══════════════════════════════════════════════════════════
function openActivityPage(pageId) {
    const entry = ACTIVITY_REGISTRY.getPage(pageId);
    if (!entry) return false;
    
    console.log('🎯 [activity] open:', pageId);
    
    let container = document.getElementById(pageId);
    if (!container) {
        container = document.createElement('div');
        container.className = 'page';
        container.id = pageId;
        document.body.appendChild(container);
        console.log('   ✅ container created');
    }
    
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    container.style.display = 'block';
    
    // إخفاء/إظهار زر الرجوع
    const backBtn = document.getElementById('globalBackBtn');
    if (backBtn) backBtn.style.display = 'flex';
    
    renderActivityPage(entry.activity, entry.pageConfig, container);
    
    document.querySelectorAll('.main-nav button, .dropdown-menu button').forEach(b => b.classList.remove('active'));
    
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.remove('show');
    
    return true;
}

// ═══════════════════════════════════════════════════════════
//  3. RENDER — بناء محتوى الصفحة
// ═══════════════════════════════════════════════════════════
function renderActivityPage(activity, pageConfig, container) {
    // 🎯 صفحة مخصصة بالكامل؟
    if (typeof pageConfig.pageRenderer === 'function') {
        try {
            pageConfig.pageRenderer(container, activity, pageConfig);
            return;
        } catch(e) {
            console.error('[activity] pageRenderer error:', e);
            container.innerHTML = '<div style="padding:30px; text-align:center; color:#e74c3c;">⚠️ خطأ في تحميل الصفحة</div>';
            return;
        }
    }
    
    // ⬇️ الافتراضي: عنوان + زر + بحث + قائمة
    const html = `
        <h2 style="margin:0 0 6px 0; font-size:20px;">${pageConfig.icon || ''} ${pageConfig.title}</h2>
        ${pageConfig.description ? `<p style="color:#666; font-size:13px; margin:0 0 15px 0;">${pageConfig.description}</p>` : ''}
        
        <div style="display:flex; gap:8px; margin-bottom:15px;">
            <button onclick="activityOpenForm('${activity.id}', '${pageConfig.id}')" 
                style="flex:1; padding:14px; background:linear-gradient(135deg, #27ae60, #229954); color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:bold; box-shadow:0 3px 10px rgba(39,174,96,0.25);">
                ➕ ${pageConfig.addLabel || 'إضافة جديد'}
            </button>
            ${pageConfig.unifiedSearch !== false ? `
            <button onclick="openSerialSearchModal('${activity.id}')" 
                style="padding:14px 16px; background:linear-gradient(135deg, #e67e22, #d35400); color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:bold; box-shadow:0 3px 10px rgba(230,126,34,0.25);"
                title="🔍 بحث موحّد بالسيريال">
                🔍
            </button>` : ''}
        </div>
        
        <div style="margin-bottom:15px;">
            <input type="text" id="activitySearch-${pageConfig.id}" 
                placeholder="🔍 ${pageConfig.searchPlaceholder || 'ابحث...'}"
                oninput="activityFilter('${activity.id}', '${pageConfig.id}', this.value)"
                style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">
        </div>
        
        <div id="activityStats-${pageConfig.id}" style="margin-bottom:15px;"></div>
        
        <div id="activityList-${pageConfig.id}" style="background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
            <div style="text-align:center; padding:30px; color:#999;">⏳ جاري التحميل...</div>
        </div>
    `;
    container.innerHTML = html;
    activityLoadList(activity.id, pageConfig.id);
}

// ═══════════════════════════════════════════════════════════
//  4. STORAGE — CRUD
// ═══════════════════════════════════════════════════════════
// 🎯 مسار متداخل — مدعوم في Rules
function activityRef(activityId, pageId) {
    if (!auth?.currentUser) return null;
    const uid = _getEffectiveUid();
    return db.collection('users').doc(uid)
        .collection('activities').doc(activityId)
        .collection('pages').doc(pageId)
        .collection('items');
}

// للتوافق مع الكود القديم
function _activityColName(activityId, pageId) {
    return `activities/${activityId}/pages/${pageId}/items`;
}

async function activityGenerateNumber(activityId, pageId, prefix) {
    if (!prefix) prefix = 'DOC';
    if (!auth?.currentUser) return `${prefix}-${Date.now()}`;
    
    const uid = _getEffectiveUid();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayPrefix = `${prefix}-${today}`;
    
    try {
        const ref = activityRef(activityId, pageId);
        if (!ref) return `${todayPrefix}-001`;
        
        const snap = await ref.get();
        let count = 0;
        snap.forEach(d => {
            const n = d.data().number || '';
            if (n.startsWith(todayPrefix)) count++;
        });
        
        const next = count + 1;
        return `${todayPrefix}-${String(next).padStart(3, '0')}`;
    } catch(e) {
        console.warn('[activity] number:', e.message);
        return `${todayPrefix}-${String(Date.now()).slice(-3)}`;
    }
}

async function activityAdd(activityId, pageId, data) {
    if (!auth?.currentUser) return null;
    const uid = _getEffectiveUid();
    const col = _activityColName(activityId, pageId);
    
    try {
        const ref = activityRef(activityId, pageId);
        if (!ref) return null;
        
        const doc = await ref.add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('💾 [activity] saved:', doc.id);
        return doc.id;
    } catch(e) {
        console.error('[activity] add:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════
//  🔑 _getEffectiveUid — uid الفعلي (ownerUid للموظف)
// ═══════════════════════════════════════════════════════════
function _getEffectiveUid() {
    // إذا كان الموظف مرتبطاً بمدير → نستخدم ownerUid
    if (typeof currentUser !== 'undefined' && currentUser?.ownerUid) {
        return currentUser.ownerUid;
    }
    // وإلا → auth.currentUser.uid
    if (auth?.currentUser) {
        return auth.currentUser.uid;
    }
    return null;
}

async function activityGetAll(activityId, pageId, limit) {
    limit = limit || 200;
    if (!auth?.currentUser) return [];
    const uid = _getEffectiveUid();
    const col = _activityColName(activityId, pageId);
    
    try {
        const ref = activityRef(activityId, pageId);
        if (!ref) return [];
        
        let snap;
        try {
            snap = await ref.orderBy('createdAt', 'desc').limit(limit).get();
        } catch(e) {
            // fallback: بلا orderBy
            snap = await ref.limit(limit).get();
        }
        
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));
        
        // ترتيب يدوي
        items.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
        });
        
        return items;
    } catch(e) {
        console.warn('[activity] getAll:', e.message);
        return [];
    }
}

async function activityUpdate(activityId, pageId, docId, data) {
    if (!auth?.currentUser || !docId) return false;
    const uid = _getEffectiveUid();
    const col = _activityColName(activityId, pageId);
    
    try {
        const ref = activityRef(activityId, pageId);
        if (!ref) return false;
        
        await ref.doc(docId).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✏️ [activity] updated:', docId);
        return true;
    } catch(e) {
        console.error('[activity] update:', e.message);
        return false;
    }
}

async function activityDelete(activityId, pageId, docId) {
    if (!auth?.currentUser || !docId) return false;
    const uid = _getEffectiveUid();
    const col = _activityColName(activityId, pageId);
    
    try {
        const ref = activityRef(activityId, pageId);
        if (!ref) return false;
        
        await ref.doc(docId).delete();
        console.log('🗑️ [activity] deleted:', docId);
        return true;
    } catch(e) {
        console.error('[activity] delete:', e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
//  5. CACHE — ذاكرة مؤقتة
// ═══════════════════════════════════════════════════════════
const _activityCache = {
    data: {},
    filtered: {},
    query: {},
    
    set(pageId, items) {
        this.data[pageId] = items;
        this.filtered[pageId] = items;
    },
    get(pageId) { return this.filtered[pageId] || []; },
    getAll(pageId) { return this.data[pageId] || []; },
    setQuery(pageId, q) { this.query[pageId] = q; },
    getQuery(pageId) { return this.query[pageId] || ''; }
};

// ═══════════════════════════════════════════════════════════
//  6. LOAD & FILTER
// ═══════════════════════════════════════════════════════════
async function activityLoadList(activityId, pageId) {
    const listEl = document.getElementById(`activityList-${pageId}`);
    if (!listEl) return;
    
    listEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">⏳ جاري التحميل...</div>';
    
    const items = await activityGetAll(activityId, pageId);
    _activityCache.set(pageId, items);
    
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (entry) {
        renderActivityList(entry.activity, entry.pageConfig, items);
        renderActivityStats(entry.activity, entry.pageConfig, items);
    }
    
    console.log(`📋 [activity] ${pageId}: ${items.length} items`);
}

function activityFilter(activityId, pageId, query) {
    const all = _activityCache.getAll(pageId);
    const q = String(query || '').trim().toLowerCase();
    _activityCache.setQuery(pageId, q);
    
    let filtered = all;
    if (q) {
        const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
        const fields = entry?.pageConfig?.searchFields || ['name'];
        
        filtered = all.filter(item => 
            fields.some(f => String(item[f] || '').toLowerCase().includes(q))
        );
    }
    
    _activityCache.filtered[pageId] = filtered;
    
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (entry) renderActivityList(entry.activity, entry.pageConfig, filtered);
}

function renderActivityStats(activity, pageConfig, items) {
    const el = document.getElementById(`activityStats-${pageConfig.id}`);
    if (!el) return;
    
    const stats = pageConfig.stats;
    if (!Array.isArray(stats) || stats.length === 0) {
        el.innerHTML = '';
        return;
    }
    
    const currentFilter = _activityQuickFilterState[pageConfig.id] || null;
    
    let html = '<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">';
    stats.forEach((stat, idx) => {
        const value = typeof stat.compute === 'function' ? stat.compute(items) : items.length;
        const filterId = stat.filterId || null;
        const isActive = filterId && currentFilter === filterId;
        const clickable = filterId ? `onclick="activityQuickFilter('${activity.id}', '${pageConfig.id}', '${filterId}')" style="cursor:pointer;"` : '';
        const activeStyle = isActive ? 'border:2px solid #e67e22; box-shadow:0 0 0 3px rgba(230,126,34,0.15);' : '';
        
        html += `
            <div ${clickable} style="background:${stat.bg || '#f8f9fa'}; padding:10px 12px; border-radius:8px; transition:all 0.2s; ${activeStyle}">
                <div style="font-size:11px; color:#666;">${stat.icon || ''} ${stat.label}</div>
                <div style="font-size:16px; font-weight:bold; color:${stat.color || '#2c3e50'}; margin-top:3px;">${value}</div>
                ${filterId ? `<div style="font-size:9px; color:#999; margin-top:2px;">👆 اضغط للفلترة</div>` : ''}
            </div>
        `;
    });
    html += '</div>';
    el.innerHTML = html;
}


// ═══════════════════════════════════════════════════════════
//  🔍 SEARCH UNIFIED — البحث الموحّد بالسيريال
// ═══════════════════════════════════════════════════════════

async function activitySearchSerial(activityId, query) {
    const activity = ACTIVITY_REGISTRY.get(activityId);
    if (!activity || !Array.isArray(activity.pages)) return [];
    
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    
    const results = [];
    for (const page of activity.pages) {
        try {
            const items = await activityGetAll(activityId, page.id);
            const matched = items.filter(item => {
                const serial = String(item.deviceSerial || '').toLowerCase();
                const imei = String(item.deviceIMEI || '').toLowerCase();
                const num = String(item.number || '').toLowerCase();
                return serial.includes(q) || imei.includes(q) || num.includes(q);
            });
            matched.forEach(m => results.push({ 
                ...m, 
                _pageId: page.id, 
                _pageConfig: page 
            }));
        } catch(e) {
            console.warn('[search]', page.id, e.message);
        }
    }
    
    // ترتيب حسب التاريخ
    results.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return tb - ta;
    });
    
    return results;
}

function openSerialSearchModal(activityId) {
    const activity = ACTIVITY_REGISTRY.get(activityId);
    if (!activity) return;
    
    document.getElementById('serialSearchModal')?.remove();
    
    const modal = document.createElement('div');
    modal.id = 'serialSearchModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.55); z-index:99999; display:flex; align-items:flex-start; justify-content:center; padding:20px; overflow-y:auto;';
    
    modal.innerHTML = `
        <div style="background:white; border-radius:14px; padding:20px; max-width:520px; width:100%; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; font-size:17px;">🔍 بحث موحّد</h3>
                <button onclick="document.getElementById('serialSearchModal').remove()" style="background:#e74c3c; color:white; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:16px;">✕</button>
            </div>
            
            <div style="background:#e8f5e9; padding:10px 12px; border-radius:8px; margin-bottom:15px; font-size:12px; color:#27ae60;">
                💡 ابحث بالسيريال / IMEI / رقم الوثيقة في كل السجلات
            </div>
            
            <div style="display:flex; gap:8px; margin-bottom:15px;">
                <input type="text" id="serialSearchInput" placeholder="أدخل السيريال..." 
                    onkeypress="if(event.key==='Enter') doSerialSearch('${activityId}')"
                    style="flex:1; padding:12px; border:1px solid #ddd; border-radius:8px; font-family:monospace; font-size:14px; direction:ltr; text-align:right;">
                <button onclick="doSerialSearch('${activityId}')" style="padding:12px 20px; background:#e67e22; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px;">🔍</button>
            </div>
            
            <div id="serialSearchResults" style="max-height:50vh; overflow-y:auto;">
                <div style="text-align:center; padding:30px; color:#999;">💡 أدخل السيريال للبحث</div>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
    
    setTimeout(() => document.getElementById('serialSearchInput')?.focus(), 200);
}

async function doSerialSearch(activityId, query) {
    if (!query) query = document.getElementById('serialSearchInput')?.value || '';
    
    const resultsEl = document.getElementById('serialSearchResults');
    if (!resultsEl) return;
    
    if (!query.trim()) {
        resultsEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">💡 أدخل السيريال</div>';
        return;
    }
    
    resultsEl.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">⏳ جاري البحث...</div>';
    
    const results = await activitySearchSerial(activityId, query);
    
    if (results.length === 0) {
        resultsEl.innerHTML = `
            <div style="text-align:center; padding:30px; color:#999;">
                <div style="font-size:40px; margin-bottom:10px;">📭</div>
                <div>لا توجد نتائج</div>
                <div style="font-size:12px; margin-top:5px; font-family:monospace;">${_afEsc(query)}</div>
            </div>
        `;
        return;
    }
    
    let html = `<div style="background:#e8f5e9; padding:10px 14px; border-radius:8px; margin-bottom:10px; font-size:13px; color:#27ae60; font-weight:600;">
        ✅ ${results.length} نتيجة
    </div>`;
    
    results.forEach(item => {
        const pageConfig = item._pageConfig;
        const pageId = item._pageId;
        
        html += `
            <div style="padding:12px; border:1px solid #e9ecef; border-radius:10px; margin-bottom:8px; background:#f8f9fa;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <div style="font-size:11px; background:#e67e22; color:white; padding:2px 8px; border-radius:10px;">
                        ${pageConfig.icon || ''} ${pageConfig.title}
                    </div>
                    <div style="font-size:11px; color:#999;">${_afDate(item.createdAt)}</div>
                </div>
                <div style="font-weight:bold; color:#2c3e50; font-size:14px; margin-bottom:4px;">
                    👤 ${_afEsc(item.customerName || '—')}
                </div>
                <div style="font-size:12px; color:#666;">
                    📞 ${_afEsc(item.customerPhone || '—')} • 📱 ${_afEsc(item.deviceModel || '—')}
                </div>
                <div style="font-size:11px; color:#999; margin-top:4px; font-family:monospace;">
                    📄 ${_afEsc(item.number || '—')} • 🔢 ${_afEsc(item.deviceSerial || '—')}
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-top:8px;">
                    <button onclick="document.getElementById('serialSearchModal').remove(); activityViewItem('${activityId}', '${pageId}', '${item.id}')"
                        style="padding:6px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">👁️ عرض</button>
                    <button onclick="document.getElementById('serialSearchModal').remove(); activityPrintItem('${activityId}', '${pageId}', '${item.id}')"
                        style="padding:6px; background:#34495e; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">🖨️ طباعة</button>
                    <button onclick="document.getElementById('serialSearchModal').remove(); openPage('activity-${activityId}-${pageId}')"
                        style="padding:6px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">↗️ فتح</button>
                </div>
            </div>
        `;
    });
    
    resultsEl.innerHTML = html;
}


// ═══════════════════════════════════════════════════════════
//  ⚡ QUICK FILTER — فلترة سريعة (للبطاقات)
// ═══════════════════════════════════════════════════════════

let _activityQuickFilterState = {};

function activityQuickFilter(activityId, pageId, filterId) {
    const key = pageId;
    
    // إذا نفس الفلتر → إلغاء
    if (_activityQuickFilterState[key] === filterId) {
        _activityQuickFilterState[key] = null;
        filterId = null;
    } else {
        _activityQuickFilterState[key] = filterId;
    }
    
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const all = _activityCache.getAll(pageId);
    const query = _activityCache.getQuery(pageId) || '';
    
    // فلترة أولى: البحث
    let filtered = all;
    if (query) {
        const fields = entry.pageConfig.searchFields || ['name'];
        filtered = all.filter(item => 
            fields.some(f => String(item[f] || '').toLowerCase().includes(query.toLowerCase()))
        );
    }
    
    // فلترة ثانية: Quick Filter
    if (filterId && entry.pageConfig.quickFilters) {
        const filter = entry.pageConfig.quickFilters.find(f => f.id === filterId);
        if (filter && typeof filter.compute === 'function') {
            filtered = filtered.filter(filter.compute);
        }
    }
    
    _activityCache.filtered[pageId] = filtered;
    renderActivityList(entry.activity, entry.pageConfig, filtered);
    renderActivityStats(entry.activity, entry.pageConfig, all);
    
    console.log(`⚡ [filter] ${pageId}: ${filterId || 'الكل'} → ${filtered.length}`);
}

function activityClearQuickFilter(pageId) {
    _activityQuickFilterState[pageId] = null;
}

// تحديث البطاقات لتكون قابلة للنقر
function _activityStatsClickable(activityId, pageId, filterId) {
    return `onclick="activityQuickFilter('${activityId}', '${pageId}', '${filterId}')" style="cursor:pointer;"`;
}

// ═══════════════════════════════════════════════════════════
//  7. HOOK openPage — للتفاعل التلقائي
// ═══════════════════════════════════════════════════════════
(function hookOpenPage() {
    if (window._activityOpenPageHooked) return;
    window._activityOpenPageHooked = true;
    
    const _originalOpenPage = window.openPage;
    
    window.openPage = function(page) {
        // 🎯 جرّب صفحات الأنشطة أولاً
        if (page && page.startsWith('activity-') && openActivityPage(page)) {
            return;
        }
        
        // fallback
        if (typeof _originalOpenPage === 'function') {
            _originalOpenPage(page);
        }
    };
    
    console.log('🎣 [activity] openPage hooked');
})();

// ═══════════════════════════════════════════════════════════
//  8. EXPORT
// ═══════════════════════════════════════════════════════════
window.activityRef = activityRef;
window.activityQuickFilter = activityQuickFilter;
window._activityStatsClickable = _activityStatsClickable;
window.activitySearchSerial = activitySearchSerial;
window.openSerialSearchModal = openSerialSearchModal;
window.doSerialSearch = doSerialSearch;
window.ACTIVITY_REGISTRY = ACTIVITY_REGISTRY;
window.openActivityPage = openActivityPage;
window.activityAdd = activityAdd;
window.activityGetAll = activityGetAll;
window.activityUpdate = activityUpdate;
window.activityDelete = activityDelete;
window.activityGenerateNumber = activityGenerateNumber;
window.activityLoadList = activityLoadList;
window.activityFilter = activityFilter;
window.renderActivityStats = renderActivityStats;
window._activityCache = _activityCache;

console.log('🏗️ [activity-framework] v1.0.0 محمّل');
