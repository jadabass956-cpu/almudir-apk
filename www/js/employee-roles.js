// ============================================================
//  🎭 EMPLOYEE ROLES — إدارة الأدوار الوظيفية
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. قائمة الصفحات (منسّقة حسب المجموعة)
// ═══════════════════════════════════════════════════════════
window.ROLE_PAGES_CATALOG = {
    accounting: {
        icon: '💰',
        label: 'المحاسبة',
        pages: [
            { id: 'sales',                 label: '💰 المبيعات' },
            { id: 'reports',               label: '📊 التقارير' },
            { id: 'statistics',            label: '📈 الإحصائيات' },
            { id: 'materials',             label: '📦 المواد' },
            { id: 'payment-boxes',         label: '💳 صناديق الدفع' },
            { id: 'customers',             label: '👤 العملاء' },
            { id: 'expenses',              label: '📄 المصروفات' },
            { id: 'debts',                 label: '👥 الديون' },
            { id: 'warehouses',            label: '📦 المستودعات' },
            { id: 'purchases',             label: '🛒 المشتريات' },
            { id: 'cost-history',          label: '📈 تقرير التكلفة' }
        ]
    },
    restaurant: {
        icon: '🍽️',
        label: 'المطعم',
        pages: [
            { id: 'activity-restaurant-tables',      label: '🪑 طلبات الطاولات' },
            { id: 'activity-restaurant-kitchen',     label: '🍳 شاشة المطبخ' },
            { id: 'activity-restaurant-delivery',    label: '🛵 طلبات التوصيل' },
            { id: 'activity-restaurant-menu',        label: '🍽️ قائمة الطعام' },
            { id: 'activity-restaurant-drivers',     label: '🏍️ السائقين' },
            { id: 'activity-restaurant-price-list',  label: '💰 قائمة أسعار الجملة' },
            { id: 'activity-restaurant-categories',  label: '📂 التصنيفات' },
            { id: 'activity-restaurant-reports',     label: '📊 تقارير المطعم' }
        ]
    },
    pharmacy: {
        icon: '💊',
        label: 'الصيدلية',
        pages: [
            { id: 'activity-pharmacy-batches',         label: '📦 دفعات الأدوية' },
            { id: 'activity-pharmacy-prescriptions',   label: '📝 الوصفات الطبية' },
            { id: 'activity-pharmacy-expiry-alerts',   label: '⏰ تنبيهات الصلاحية' }
        ]
    },
    telecom: {
        icon: '📱',
        label: 'الاتصالات',
        pages: [
            { id: 'activity-telecom-receipts',    label: '📄 وصل استلام' },
            { id: 'activity-telecom-warranties',  label: '🛡️ كفالة الهواتف' },
            { id: 'activity-telecom-services',    label: '🛠️ تسعيرة الخدمات' },
            { id: 'activity-telecom-shortages',   label: '📝 النواقص' },
            { id: 'activity-telecom-reports',     label: '📊 تقارير الصيانة' }
        ]
    },
    supermarket: {
        icon: '🛒',
        label: 'السوبرماركت',
        pages: [
            { id: 'activity-supermarket-delivery',      label: '🛵 طلبات التوصيل' },
            { id: 'activity-supermarket-store-report',  label: '📊 تقرير المتجر' },
            { id: 'activity-supermarket-price-list',    label: '💰 قائمة أسعار الجملة' },
            { id: 'activity-supermarket-categories',    label: '📂 التصنيفات' },
            { id: 'activity-supermarket-inventory',     label: '📊 جرد سريع' },
            { id: 'activity-supermarket-ai-alerts',     label: '🤖 تنبيهات ذكية' }
        ]
    },
    personal: {
        icon: '👤',
        label: 'شخصي',
        pages: [
            { id: 'profile',      label: '👤 ملفي' },
            { id: 'support',      label: '💬 الدعم' },
            { id: 'bug-report',   label: '🐛 الإبلاغ عن مشكلة' }
        ]
    }
};

// ═══════════════════════════════════════════════════════════
//  🎭 ROLE TEMPLATES — قوالب جاهزة للأدوار
// ═══════════════════════════════════════════════════════════
window.ROLE_TEMPLATES = [
    {
        id: 'chef',
        icon: '👨‍🍳',
        name: 'شيف',
        prefix: 'SHF',
        color: '#e74c3c',
        description: 'شاشة المطبخ فقط',
        pages: ['activity-restaurant-kitchen']
    },
    {
        id: 'waiter',
        icon: '🪑',
        name: 'نادل',
        prefix: 'NDL',
        color: '#3498db',
        description: 'الطاولات + التوصيل',
        pages: ['activity-restaurant-tables', 'activity-restaurant-delivery']
    },
    {
        id: 'cashier',
        icon: '💳',
        name: 'كاشير',
        prefix: 'KSR',
        color: '#27ae60',
        description: 'الطاولات + التقارير',
        pages: ['activity-restaurant-tables', 'activity-restaurant-reports']
    },
    {
        id: 'driver',
        icon: '🛵',
        name: 'سائق توصيل',
        prefix: 'DRV',
        color: '#e67e22',
        description: 'طلبات التوصيل فقط',
        pages: ['activity-restaurant-delivery']
    },
    {
        id: 'seller',
        icon: '🏪',
        name: 'بائع',
        prefix: 'BAE',
        color: '#3498db',
        description: 'المبيعات + العملاء',
        pages: ['sales', 'customers']
    },
    {
        id: 'warehouse',
        icon: '📦',
        name: 'أمين مستودع',
        prefix: 'MST',
        color: '#8e44ad',
        description: 'المواد + المستودعات',
        pages: ['materials', 'warehouses']
    },
    {
        id: 'pharmacist',
        icon: '💊',
        name: 'صيدلي',
        prefix: 'PHR',
        color: '#e91e63',
        description: 'دفعات + وصفات + صلاحية',
        pages: ['activity-pharmacy-batches', 'activity-pharmacy-prescriptions', 'activity-pharmacy-expiry-alerts']
    },
    {
        id: 'tech',
        icon: '📱',
        name: 'فني اتصالات',
        prefix: 'TCH',
        color: '#16a085',
        description: 'وصل + كفالة + صيانة',
        pages: ['activity-telecom-receipts', 'activity-telecom-warranties', 'activity-telecom-services']
    }
];

// ═══════════════════════════════════════════════════════════
//  🎯 خريطة النشاط → المجموعات المسموحة
//  المدير يرى فقط: المحاسبة + نشاطه + شخصي
// ═══════════════════════════════════════════════════════════
window._activityToCategories = {
    'مطعم':          ['accounting', 'restaurant', 'personal'],
    'سوبر ماركت':    ['accounting', 'supermarket', 'personal'],
    'صيدلية':        ['accounting', 'pharmacy', 'personal'],
    'اتصالات':       ['accounting', 'telecom', 'personal']
    // 'متجر عام' / 'خدمات' / 'أخرى' → fallback: ['accounting', 'personal']
};

window._getAllowedCategories = function() {
    try {
        // محاولة عدة مصادر (بترتيب الأولوية)
        let bt = '';
        if (window.currentUser && window.currentUser.businessType) {
            bt = window.currentUser.businessType;
        } else if (typeof currentUser !== 'undefined' && currentUser && currentUser.businessType) {
            bt = currentUser.businessType;
        } else if (typeof settings !== 'undefined' && settings && settings.businessType) {
            bt = settings.businessType;
        }
        console.log('🎭 [roles] businessType source:', bt);
        const allowed = window._activityToCategories[bt];
        if (allowed) return allowed;
        return ['accounting', 'personal'];
    } catch(e) {
        console.warn('🎭 [roles] err:', e.message);
        return ['accounting', 'personal'];
    }
};



// ═══════════════════════════════════════════════════════════
//  1.b توليد البادئة تلقائياً من الاسم
// ═══════════════════════════════════════════════════════════
window._autoGeneratePrefix = function(name) {
    if (!name || !name.trim()) return '';

    // تنظيف الاسم (إزالة الإيموجي والمسافات)
    let clean = name.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '')
                    .replace(/[\s\-_]+/g, ' ')
                    .trim();

    // خريطة كلمات عربية → بادئة
    const map = {
        // مطعم
        'مطبخ':    'MTP', 'طاهي':   'TAH', 'شيف':    'SHF',
        'نادل':    'NDL', 'ويتر':   'WTR',
        'سائق':    'SRQ', 'دليفري': 'DLV',
        'كاشير':   'KSH', 'صندوق':  'SND',
        'محاسب':   'MHS', 'حسابات': 'HSB',
        'مخزون':   'MHZ', 'مستودع': 'MST',
        'مدير':    'MDR', 'مشرف':   'MSH',
        // صيدلية
        'صيدلي':   'SDL', 'صيدلاني':'SDL',
        'مساعد':   'MSA',
        // اتصالات
        'فني':     'FNY', 'تقني':   'TQN',
        'صيانة':   'SYN',
        // سوبرماركت
        'رفوف':    'RFW', 'بائع':   'BAE',
        // عام
        'موظف':    'EMP', 'عامل':   'AML',
        'أمين':    'AMN', 'امين':   'AMN',
        'مشتريات':'MSH', 'مبيعات':  'MBE',
        'توصيل':   'WSL'
    };

    // بحث بالاسم الكامل
    if (map[clean]) return map[clean];

    // بحث بكلمة واحدة من الاسم
    const words = clean.split(' ');
    for (const w of words) {
        if (map[w]) return map[w];
    }

    // fallback: أول 3 أحرف لاتينية من ترجمة صوتية
    const translit = {
        'ا':'A','أ':'A','إ':'A','آ':'A','ب':'B','ت':'T','ث':'TH','ج':'J','ح':'H','خ':'KH',
        'د':'D','ذ':'Z','ر':'R','ز':'Z','س':'S','ش':'SH','ص':'S','ض':'D','ط':'T','ظ':'Z',
        'ع':'A','غ':'G','ف':'F','ق':'Q','ك':'K','ل':'L','م':'M','ن':'N','ه':'H','و':'W',
        'ي':'Y','ى':'A','ة':'H','ء':'A'
    };
    let transliterated = '';
    for (const ch of clean) {
        if (translit[ch]) transliterated += translit[ch];
        else if (/[a-zA-Z0-9]/.test(ch)) transliterated += ch.toUpperCase();
        if (transliterated.length >= 3) break;
    }

    return transliterated.substring(0, 3) || 'EMP';
};

// ═══════════════════════════════════════════════════════════
//  2. Cache
// ═══════════════════════════════════════════════════════════
window._employeeRolesCache = [];

// ═══════════════════════════════════════════════════════════
//  3. تحميل الأدوار من Firestore
// ═══════════════════════════════════════════════════════════
async function loadEmployeeRoles() {
    if (!currentUser?.uid || !db) return [];
    try {
        const snap = await db.collection('users').doc(currentUser.uid)
            .collection('employee_roles').get();
        const roles = [];
        snap.forEach(d => roles.push({ id: d.id, ...d.data() }));
        roles.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        window._employeeRolesCache = roles;
        return roles;
    } catch(e) {
        console.warn('[employee-roles] load:', e.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════
//  4. حفظ دور (إضافة/تعديل)
// ═══════════════════════════════════════════════════════════
async function saveEmployeeRole(role) {
    if (!currentUser?.uid || !db) throw new Error('لا يوجد مستخدم');
    if (!role.name || !role.name.trim()) throw new Error('المسمى الوظيفي مطلوب');
    if (!role.prefix || role.prefix.length < 2 || role.prefix.length > 4) {
        throw new Error('البادئة 2-4 أحرف');
    }
    if (!role.pages || role.pages.length === 0) {
        throw new Error('اختر صفحة واحدة على الأقل');
    }

    const id = role.id || ('role-' + Date.now());
    const data = {
        name: role.name.trim(),
        prefix: role.prefix.trim().toUpperCase(),
        pages: role.pages,
        createdAt: role.createdAt || Date.now(),
        updatedAt: Date.now()
    };

    await db.collection('users').doc(currentUser.uid)
        .collection('employee_roles').doc(id).set(data, { merge: true });

    return id;
}

// ═══════════════════════════════════════════════════════════
//  5. حذف دور
// ═══════════════════════════════════════════════════════════
async function deleteEmployeeRole(roleId) {
    if (!currentUser?.uid || !db) return;
    await db.collection('users').doc(currentUser.uid)
        .collection('employee_roles').doc(roleId).delete();
}

// ═══════════════════════════════════════════════════════════
//  6. فتح الصفحة
// ═══════════════════════════════════════════════════════════
function openEmployeeRolesPage() {
    let cont = document.getElementById('page-employee-roles');
    if (!cont) {
        cont = document.createElement('div');
        cont.className = 'page';
        cont.id = 'page-employee-roles';
        cont.style.display = 'none';
        document.body.appendChild(cont);
    }
    if (typeof openPage === 'function') {
        openPage('page-employee-roles');
    } else {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        cont.style.display = 'block';
    }
    setTimeout(() => renderEmployeeRolesPage(cont), 150);
}

// ═══════════════════════════════════════════════════════════
//  7. عرض الصفحة
// ═══════════════════════════════════════════════════════════
async function _loadPendingStaffRequests() {
    if (!currentUser?.uid || !db) return [];
    try {
        const snap = await db.collection('public_link_codes')
            .where('ownerUid', '==', currentUser.uid)
            .where('status', '==', 'pending_approval')
            .get();
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.usedAt || 0) - (a.usedAt || 0));
        return list;
    } catch(e) {
        console.warn('[roles] pending:', e.message);
        return [];
    }
}

async function _loadLinkedEmployees() {
    if (!currentUser?.uid || !db) return [];
    try {
        const snap = await db.collection('users')
            .where('ownerUid', '==', currentUser.uid)
            .get();
        const list = [];
        snap.forEach(d => {
            const data = d.data();
            if (data.linkStatus === 'active') {
                list.push({ id: d.id, ...data });
            }
        });
        list.sort((a, b) => (b.linkedAt || 0) - (a.linkedAt || 0));
        console.log('👥 [roles] موظفون مرتبطون:', list.length);
        return list;
    } catch(e) {
        console.error('[roles] linked error:', e.message);
        return [];
    }
}

function _renderLinkedEmployeesHtml(employees) {
    if (!employees || employees.length === 0) return '';
    let html = `
        <div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:12px;padding:14px;margin-bottom:15px;border:2px solid #27ae60;">
            <div style="font-weight:700;color:#155724;font-size:15px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">👥</span>
                <span>الموظفون المرتبطون (${employees.length})</span>
            </div>
    `;
    employees.forEach(emp => {
        const linkedAt = emp.linkedAt ? new Date(emp.linkedAt).toLocaleDateString('ar-SY') : '';
        const roleName = emp.roleName || emp.role || '—';
        const empName = emp.fullName || emp.email || 'موظف';
        const phone = emp.phone || '';
        html += `
            <div style="background:white;border-radius:10px;padding:12px;margin-bottom:8px;">
                <div style="font-weight:700;color:#2c3e50;font-size:14px;margin-bottom:4px;">👤 ${_afEsc(empName)}</div>
                <div style="font-size:12px;color:#666;margin-bottom:8px;">
                    🎯 ${_afEsc(roleName)}<br>
                    ${phone ? '📱 ' + _afEsc(phone) + '<br>' : ''}
                    🕐 مرتبط منذ: ${_afEsc(linkedAt)}
                </div>
                <button onclick="_revokeEmployeeFromRoles('${_afEsc(emp.id)}', '${_afEsc(empName).replace(/'/g, "\\'")}')" style="width:100%;padding:10px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🚫 فك الارتباط</button>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

window._revokeEmployeeFromRoles = async function(employeeUid, employeeName) {
    if (!confirm('🚫 فك ارتباط "' + employeeName + '"؟\n\n• سيفقد الوصول فوراً\n• ستُحذف بياناته المرتبطة\n• البيانات نفسها محفوظة')) return;
    try {
        // ① تحديث الموظف
        await db.collection('users').doc(employeeUid).update({
            ownerUid: firebase.firestore.FieldValue.delete(),
            roleId: firebase.firestore.FieldValue.delete(),
            roleName: firebase.firestore.FieldValue.delete(),
            rolePages: firebase.firestore.FieldValue.delete(),
            linkStatus: 'revoked',
            revokedAt: Date.now(),
            revokedBy: currentUser.uid
        });

        // ② إعادة الكود للحالة "متاح"
        const codes = await db.collection('public_link_codes')
            .where('usedBy', '==', employeeUid).get();
        const batch = db.batch();
        codes.forEach(c => {
            batch.update(c.ref, {
                status: 'available',
                usedBy: null,
                usedAt: null
            });
        });
        if (!codes.empty) await batch.commit();

        alert('✅ تم فك الارتباط عن ' + employeeName);
        const cont = document.getElementById('page-employee-roles');
        if (cont) renderEmployeeRolesPage(cont);
    } catch(e) {
        console.error(e);
        alert('❌ ' + e.message);
    }
};

function _renderPendingRequestsHtml(pending) {
    if (!pending || pending.length === 0) return '';
    let html = `
        <div style="background:linear-gradient(135deg,#fff8e1,#ffe0b2);border-radius:12px;padding:14px;margin-bottom:15px;border:2px solid #f39c12;">
            <div style="font-weight:700;color:#856404;font-size:15px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">🔔</span>
                <span>طلبات بانتظار موافقتك (${pending.length})</span>
            </div>
    `;
    pending.forEach(c => {
        const usedAt = c.usedAt ? new Date(c.usedAt).toLocaleString('ar-SY') : '';
        const roleLabel = c.roleName || c.role || '—';
        const empLabel = c.label || c.employeeEmail || 'موظف جديد';
        html += `
            <div style="background:white;border-radius:10px;padding:12px;margin-bottom:8px;">
                <div style="font-weight:700;color:#2c3e50;font-size:14px;margin-bottom:4px;">👤 ${_afEsc(empLabel)}</div>
                <div style="font-size:12px;color:#666;margin-bottom:8px;">
                    🎭 ${_afEsc(roleLabel)}<br>
                    🔑 ${_afEsc(c.id)}<br>
                    🕐 ${_afEsc(usedAt)}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    <button onclick="_approveStaffFromRoles('${_afEsc(c.id)}')" style="padding:10px;background:linear-gradient(135deg,#3b82f6,#60a5fa);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✅ موافقة</button>
                    <button onclick="_rejectStaffFromRoles('${_afEsc(c.id)}')" style="padding:10px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">❌ رفض</button>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

window._approveStaffFromRoles = async function(code) {
    if (typeof window._staffApprove === 'function') {
        await window._staffApprove(code);
        setTimeout(() => {
            const c = document.getElementById('page-employee-roles');
            if (c && typeof renderEmployeeRolesPage === 'function') renderEmployeeRolesPage(c);
        }, 800);
    } else {
        alert('⚠️ دالة الموافقة غير متاحة');
    }
};

window._rejectStaffFromRoles = async function(code) {
    if (typeof window._staffReject === 'function') {
        await window._staffReject(code);
        setTimeout(() => {
            const c = document.getElementById('page-employee-roles');
            if (c && typeof renderEmployeeRolesPage === 'function') renderEmployeeRolesPage(c);
        }, 800);
    } else {
        alert('⚠️ دالة الرفض غير متاحة');
    }
};

async function renderEmployeeRolesPage(container) {
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

    const roles = await loadEmployeeRoles();
    const pending = await _loadPendingStaffRequests();
    const employees = await _loadLinkedEmployees();

    let listHtml = '';
    if (roles.length === 0) {
        listHtml = `
            <div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">🎭</div>
                <div style="font-size:15px;font-weight:600;color:#2c3e50;margin-bottom:6px;">لا توجد أدوار بعد</div>
                <div style="font-size:13px;">أضف أول دور وظيفي لموظفيك</div>
            </div>
        `;
    } else {
        roles.forEach(r => {
            const pagesLabels = (r.pages || []).map(pid => {
                const page = _findPageInCatalog(pid);
                return page ? page.label : pid;
            }).join(' • ');

            listHtml += `
                <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid #8e44ad;">
                    <div style="margin-bottom:10px;">
                        <div style="font-weight:700;color:#2c3e50;font-size:16px;">${_afEsc(r.name)}</div>
                        <div style="font-size:11px;color:#666;margin-top:3px;font-family:monospace;">
                            🔑 ${_afEsc(r.prefix)}-XXX-XXX
                        </div>
                        <div style="font-size:11px;color:#888;margin-top:6px;line-height:1.5;">
                            📄 ${pagesLabels}
                        </div>
                    </div>
                    <button onclick="_createStaffCodeForRole('${_afEsc(r.id)}')" style="width:100%;padding:10px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:6px;">🔗 إنشاء كود ارتباط</button>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <button onclick="_showAddRoleForm('${_afEsc(r.id)}')" style="padding:8px;background:#3498db;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">✏️ تعديل</button>
                        <button onclick="_deleteEmployeeRole('${_afEsc(r.id)}', '${_afEsc(r.name)}')" style="padding:8px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🗑️ حذف</button>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = `
        <h2 style="margin:0 0 6px 0;font-size:20px;"><i data-lucide="users"></i> الأدوار الوظيفية</h2>
        <p style="color:#666;font-size:13px;margin:0 0 15px 0;">أنشئ أدواراً لموظفيك — وحدّد صفحاتهم</p>

        ${_renderPendingRequestsHtml(pending)}
        ${_renderLinkedEmployeesHtml(employees)}

        <button onclick="openTabletManager()" style="width:100%;padding:12px;background:linear-gradient(135deg,#0f172a 0%,#1e40af 60%,#3b82f6 100%);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
            <i data-lucide="monitor"></i> شاشات الحضور (تابلت)
        </button>

        <button onclick="openAttendanceManager()" style="width:100%;padding:12px;background:linear-gradient(135deg,#0f172a 0%,#1e40af 60%,#3b82f6 100%);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
            <i data-lucide="clipboard-list"></i> سجل الحضور
        </button>

        <button onclick="openLeavesManager()" style="width:100%;padding:12px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
            <i data-lucide="umbrella"></i> إدارة الإجازات
        </button>

        <button onclick="openEmployeesDirectory()" style="width:100%;padding:12px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
            <i data-lucide="users"></i> جدول الموظفين
        </button>

        <button onclick="openPayroll()" style="width:100%;padding:12px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
            <i data-lucide="wallet"></i> كشف الرواتب
        </button>

        <button onclick="openHRReports()" style="width:100%;padding:12px;background:linear-gradient(135deg,#3b82f6,#60a5fa);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;font-family:inherit;">
            <i data-lucide="bar-chart-3"></i> تقارير الأداء
        </button>

        <button onclick="openFinancialReports()" style="width:100%;padding:12px;background:linear-gradient(135deg,#0f172a 0%,#1e40af 60%,#3b82f6 100%);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:12px;font-family:inherit;">
            <i data-lucide="wallet"></i> التقرير المالي الشامل
        </button>

        <button onclick="openAdvances()" style="width:100%;padding:12px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:12px;font-family:inherit;">
            <i data-lucide="banknote"></i> السلف
        </button>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <button onclick="_showTemplatesModal()" style="padding:14px 10px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(243,156,18,0.3);font-family:inherit;">
                <i data-lucide="layout-template"></i> قوالب جاهزة
            </button>
            <button onclick="_showAddRoleForm()" style="padding:14px 10px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(30,64,175,0.3);font-family:inherit;">
                <i data-lucide="plus"></i> دور جديد
            </button>
        </div>

        ${listHtml}

        <div style="background:#f0f7ff;border-radius:10px;padding:12px;margin-top:15px;border-right:4px solid #3498db;">
            <div style="font-size:12px;color:#555;line-height:1.7;">
                💡 <b>كيف يعمل؟</b><br>
                • أنشئ دوراً لكل وظيفة في مطعمك<br>
                • حدّد الصفحات التي يحتاجها الموظف<br>
                • اضغط <b>🔗 إنشاء كود ارتباط</b> على الدور<br>
                • أرسل الكود للموظف عبر واتساب<br>
                • الموظف يفتح التطبيق → يرى صفحاته فقط
            </div>
        </div>

        <div style="text-align:center;margin-top:15px;">
            <button onclick="_cleanOldCodes()" style="padding:8px 16px;background:#95a5a6;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:inherit;">🧹 تنظيف الأكواد القديمة</button>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function _findPageInCatalog(pageId) {
    for (const catKey in window.ROLE_PAGES_CATALOG) {
        const cat = window.ROLE_PAGES_CATALOG[catKey];
        const found = (cat.pages || []).find(p => p.id === pageId);
        if (found) return found;
    }
    return null;
}

// ═══════════════════════════════════════════════════════════
//  8. نموذج إضافة/تعديل دور
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  🎭 TEMPLATES MODAL — عرض القوالب الجاهزة
// ═══════════════════════════════════════════════════════════
window._showTemplatesModal = function() {
    const old = document.getElementById('templatesModal');
    if (old) old.remove();

    const templates = window.ROLE_TEMPLATES || [];

    // فلترة القوالب حسب النشاط الحالي (اختياري — نعرض كل شيء لكن الأكثر صلة أولاً)
    const bizType = currentUser?.businessType || '';
    let sortedTemplates = [...templates];

    // ترتيب: قوالب النشاط الحالي أولاً
    const relevantIds = {
        'مطعم': ['chef', 'waiter', 'cashier', 'driver'],
        'صيدلية': ['pharmacist', 'seller'],
        'سوبر ماركت': ['seller', 'warehouse'],
        'اتصالات': ['tech', 'seller']
    }[bizType] || [];

    sortedTemplates.sort((a, b) => {
        const aR = relevantIds.indexOf(a.id) >= 0 ? 0 : 1;
        const bR = relevantIds.indexOf(b.id) >= 0 ? 0 : 1;
        return aR - bR;
    });

    let cardsHtml = '';
    sortedTemplates.forEach(t => {
        const isRelevant = relevantIds.indexOf(t.id) >= 0;
        const pagesCount = (t.pages || []).length;
        cardsHtml += `
            <div onclick="_applyTemplate('${_afEsc(t.id)}')" style="background:white;border-radius:12px;padding:12px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${t.color};cursor:pointer;transition:transform 0.1s;${isRelevant ? 'border:2px solid ' + t.color + ';' : ''}" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <div style="width:44px;height:44px;border-radius:50%;background:${t.color}20;color:${t.color};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">
                        ${t.icon}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#2c3e50;font-size:14px;">${_afEsc(t.name)}</div>
                        <div style="font-size:11px;color:#666;margin-top:2px;">${_afEsc(t.description || '')}</div>
                    </div>
                    ${isRelevant ? '<div style="background:' + t.color + ';color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;">مُقترح</div>' : ''}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;">
                    <span>🔑 ${_afEsc(t.prefix)}</span>
                    <span>📄 ${pagesCount} صفحة</span>
                </div>
            </div>
        `;
    });

    const modal = document.createElement('div');
    modal.id = 'templatesModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';
    modal.innerHTML = `
        <div style="background:#f8f9fa;border-radius:16px;max-width:520px;width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#f39c12,#e67e22);color:white;padding:16px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h2 style="margin:0;font-size:17px;"><i data-lucide="layout-template"></i> قوالب جاهزة</h2>
                    <div style="font-size:11px;opacity:0.9;margin-top:3px;">اختر قالباً — يُملأ النموذج تلقائياً</div>
                </div>
                <button onclick="document.getElementById('templatesModal').remove()" style="background:rgba(255,255,255,0.2);border:none;width:36px;height:36px;border-radius:50%;color:white;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:14px;">
                <div style="display:grid;gap:10px;">${cardsHtml}</div>
                <div style="background:#fff8e1;border-radius:10px;padding:12px;margin-top:14px;border-right:4px solid #f39c12;">
                    <div style="font-size:11px;color:#856404;line-height:1.7;">
                        💡 <b>كيف يعمل؟</b><br>
                        ① اختر القالب المناسب<br>
                        ② يُفتح النموذج بالبيانات مُملأة<br>
                        ③ عدّل ما تشاء (الاسم، البادئة، الصفحات)<br>
                        ④ احفظ → أنشئ كود للدور
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// ═══════════════════════════════════════════════════════════
//  ✅ APPLY TEMPLATE — تطبيق القالب وفتح النموذج
// ═══════════════════════════════════════════════════════════
window._applyTemplate = async function(templateId) {
    const template = (window.ROLE_TEMPLATES || []).find(t => t.id === templateId);
    if (!template) {
        alert('❌ القالب غير موجود');
        return;
    }

    // أغلق modal القوالب
    const tModal = document.getElementById('templatesModal');
    if (tModal) tModal.remove();

    // افتح نموذج إضافة دور جديد
    await window._showAddRoleForm();

    // املأ الحقول تلقائياً بعد فتح النموذج
    setTimeout(() => {
        const nameEl = document.getElementById('roleNameInput');
        const prefixEl = document.getElementById('rolePrefixInput');
        if (nameEl) nameEl.value = template.name || '';
        if (prefixEl) prefixEl.value = template.prefix || '';

        // ضع علامة على الصفحات المطلوبة
        const pages = template.pages || [];
        document.querySelectorAll('#roleFormModal input[type="checkbox"][data-page]').forEach(cb => {
            const pageId = cb.dataset.page;
            const shouldCheck = pages.indexOf(pageId) >= 0;
            cb.checked = shouldCheck;

            // تحديث خلفية الـ label
            const label = cb.closest('label');
            if (label) {
                if (shouldCheck) {
                    label.style.background = '#e8f5e9';
                    label.style.borderColor = '#27ae60';
                } else {
                    label.style.background = '#f8f9fa';
                    label.style.borderColor = '#ddd';
                }
            }
        });

        console.log('✅ [template] تم تطبيق القالب:', template.name);
    }, 350);
};

window._showAddRoleForm = async function(roleId) {
    const old = document.getElementById('roleFormModal');
    if (old) old.remove();

    let existing = null;
    if (roleId) {
        existing = (window._employeeRolesCache || []).find(r => r.id === roleId) || { id: roleId };
    }

    const name = existing?.name || '';
    const prefix = existing?.prefix || '';
    const selectedPages = existing?.pages || [];

    let catalogHtml = '';
    const _allowedCats = (typeof window._getAllowedCategories === 'function')
        ? window._getAllowedCategories()
        : ['accounting', 'personal'];
    for (const catKey of _allowedCats) {
        const cat = window.ROLE_PAGES_CATALOG[catKey];
        if (!cat) continue;
        catalogHtml += `
            <div style="margin-bottom:12px;">
                <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #eee;">
                    ${cat.icon} ${cat.label}
                </div>
                ${cat.pages.map(p => `
                    <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:${selectedPages.includes(p.id) ? '#e8f5e9' : '#f8f9fa'};border:1.5px solid ${selectedPages.includes(p.id) ? '#27ae60' : '#ddd'};border-radius:8px;margin-bottom:4px;cursor:pointer;font-size:13px;">
                        <input type="checkbox" data-page="${p.id}" ${selectedPages.includes(p.id) ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#27ae60;">
                        <span>${p.label}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    const modal = document.createElement('div');
    modal.id = 'roleFormModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:10px;';

    modal.innerHTML = `
        <div style="background:#f8f9fa;border-radius:14px;max-width:520px;width:100%;max-height:95vh;display:flex;flex-direction:column;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#8e44ad,#6c3483);color:white;padding:15px;display:flex;justify-content:space-between;align-items:center;">
                <h2 style="margin:0;font-size:17px;">${roleId ? '<i data-lucide="edit"></i> تعديل دور' : '<i data-lucide="plus"></i> دور جديد'}</h2>
                <button onclick="document.getElementById('roleFormModal').remove()" style="background:rgba(255,255,255,0.2);border:none;width:34px;height:34px;border-radius:50%;color:white;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>
            </div>
            <div style="flex:1;overflow-y:auto;padding:15px;background:white;">
                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">📛 المسمى الوظيفي</label>
                <input type="text" id="roleNameInput" value="${_afEsc(name)}" placeholder="مثال: مطبخ — كاشير — محاسب" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;">

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🔑 البادئة (للكود)</label>
                <input type="text" id="rolePrefixInput" value="${_afEsc(prefix)}" placeholder="MTP" maxlength="4" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:4px;font-family:monospace;text-transform:uppercase;text-align:center;font-size:16px;font-weight:bold;letter-spacing:4px;">
                <div style="font-size:11px;color:#999;margin-bottom:15px;">💡 2-4 أحرف — تظهر في الكود (MTP-XXX-XXX)</div>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:8px;">📄 الصفحات المسموحة</label>
                ${catalogHtml}
            </div>
            <div style="padding:12px;background:#f8f9fa;border-top:1px solid #eee;">
                <button onclick="_saveRoleForm('${roleId || ''}')" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
                    💾 حفظ
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        // ① ربط checkbox
        document.querySelectorAll('#roleFormModal input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', function() {
                const label = this.closest('label');
                if (this.checked) {
                    label.style.background = '#e8f5e9';
                    label.style.borderColor = '#27ae60';
                } else {
                    label.style.background = '#f8f9fa';
                    label.style.borderColor = '#ddd';
                }
            });
        });

        // ② توليد البادئة تلقائياً عند كتابة الاسم
        const nameInput = document.getElementById('roleNameInput');
        const prefixInput = document.getElementById('rolePrefixInput');
        let prefixManuallyEdited = !!existing?.prefix; // لو كان تعديل → لا نُغيّرها

        if (prefixInput) {
            // لو المستخدم عدّل البادئة يدوياً → نتوقف عن التوليد
            prefixInput.addEventListener('input', () => {
                prefixManuallyEdited = true;
            });
        }

        if (nameInput && prefixInput) {
            nameInput.addEventListener('input', function() {
                if (prefixManuallyEdited) return;
                const generated = window._autoGeneratePrefix(this.value);
                if (generated) prefixInput.value = generated;
            });

            // لو الحقل فارغ + الاسم موجود → ولّد فوراً
            if (!prefixInput.value && nameInput.value) {
                prefixInput.value = window._autoGeneratePrefix(nameInput.value);
            }
        }
    }, 100);
};

// ═══════════════════════════════════════════════════════════
//  9. حفظ النموذج
// ═══════════════════════════════════════════════════════════
window._saveRoleForm = async function(roleId) {
    const nameEl = document.getElementById('roleNameInput');
    const prefixEl = document.getElementById('rolePrefixInput');
    if (!nameEl || !prefixEl) return;

    const name = nameEl.value.trim();
    const prefix = prefixEl.value.trim().toUpperCase();

    const pages = [];
    document.querySelectorAll('#roleFormModal input[type="checkbox"]:checked').forEach(cb => {
        pages.push(cb.dataset.page);
    });

    if (!name) { alert('⚠️ أدخل المسمى الوظيفي'); return; }
    if (prefix.length < 2 || prefix.length > 4) { alert('⚠️ البادئة 2-4 أحرف'); return; }
    if (pages.length === 0) { alert('⚠️ اختر صفحة واحدة على الأقل'); return; }

    try {
        await saveEmployeeRole({ id: roleId, name, prefix, pages });
        const modal = document.getElementById('roleFormModal');
        if (modal) modal.remove();
        if (typeof toast === 'function') toast('✅ تم الحفظ', 'success');
        const cont = document.getElementById('page-employee-roles');
        if (cont) renderEmployeeRolesPage(cont);
    } catch(e) {
        alert('⚠️ ' + e.message);
    }
};

// ═══════════════════════════════════════════════════════════
//  10. حذف دور
// ═══════════════════════════════════════════════════════════
window._deleteEmployeeRole = async function(roleId, name) {
    if (!confirm('🗑️ حذف الدور: "' + name + '"؟\n\n⚠️ الموظفون بهذا الدور لن يستطيعوا الدخول.')) return;
    try {
        await deleteEmployeeRole(roleId);
        if (typeof toast === 'function') toast('✅ تم الحذف', 'success');
        const cont = document.getElementById('page-employee-roles');
        if (cont) renderEmployeeRolesPage(cont);
    } catch(e) {
        alert('⚠️ ' + e.message);
    }
};

// ═══════════════════════════════════════════════════════════
//  11. EXPORT
// ═══════════════════════════════════════════════════════════
window.openEmployeeRolesPage = openEmployeeRolesPage;
window.loadEmployeeRoles = loadEmployeeRoles;
window.saveEmployeeRole = saveEmployeeRole;
window.deleteEmployeeRole = deleteEmployeeRole;
// ═══════════════════════════════════════════════════════════
//  🔗 إنشاء كود ارتباط لدور معين
// ═══════════════════════════════════════════════════════════
function _genRoleCode(prefix) {
    const clean = (prefix || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'GEN';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const p1 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    const p2 = Array.from({length:3}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    return `${clean}-${p1}-${p2}`;
}

window._createStaffCodeForRole = async function(roleId) {
    if (!currentUser?.uid || !db) { alert('يجب تسجيل الدخول'); return; }
    try {
        const doc = await db.collection('users').doc(currentUser.uid)
            .collection('employee_roles').doc(roleId).get();
        if (!doc.exists) { alert('❌ الدور غير موجود'); return; }
        const role = doc.data();

        const old = document.getElementById('roleCodeModal');
        if (old) old.remove();

        const initialCode = _genRoleCode(role.prefix);
        const modal = document.createElement('div');
        modal.id = 'roleCodeModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:460px;width:100%;padding:20px;box-sizing:border-box;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="margin:0;font-size:17px;">🔗 كود لدور: ${_afEsc(role.name)}</h2>
                    <button onclick="document.getElementById('roleCodeModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>
                </div>

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">👤 اسم الموظف (اختياري)</label>
                <input type="text" id="roleCodeLabel" placeholder="مثال: أحمد — مطبخ" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:12px;font-family:inherit;">

                <label style="display:block;font-size:13px;color:#555;font-weight:600;margin-bottom:6px;">🔑 الكود</label>
                <div style="display:flex;gap:8px;margin-bottom:15px;">
                    <input type="text" id="roleCodeValue" readonly value="${initialCode}" style="flex:1;padding:12px;border:2px solid #3498db;border-radius:8px;font-size:16px;text-align:center;font-family:'Courier New',monospace;letter-spacing:2px;font-weight:bold;background:#f0f7ff;box-sizing:border-box;">
                    <button onclick="_regenerateRoleCode('${_afEsc(role.prefix)}')" style="padding:0 14px;background:#3498db;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;" title="توليد جديد">🎲</button>
                </div>

                <button onclick="_saveRoleCode('${_afEsc(roleId)}')" style="width:100%;padding:14px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;">
                    💾 إنشاء الكود
                </button>

                <div id="roleCodeError" style="color:#e74c3c;text-align:center;font-size:12px;margin-top:10px;min-height:18px;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => document.getElementById('roleCodeLabel')?.focus(), 100);
    } catch(e) {
        alert('❌ ' + e.message);
    }
};

window._regenerateRoleCode = function(prefix) {
    const el = document.getElementById('roleCodeValue');
    if (el) el.value = _genRoleCode(prefix);
};

window._saveRoleCode = async function(roleId) {
    const code = document.getElementById('roleCodeValue')?.value?.trim();
    const label = document.getElementById('roleCodeLabel')?.value?.trim() || '';
    const errEl = document.getElementById('roleCodeError');

    if (!code) { errEl.textContent = 'الكود فارغ'; return; }

    try {
        errEl.textContent = '⏳ جاري الحفظ...';

        const roleDoc = await db.collection('users').doc(currentUser.uid)
            .collection('employee_roles').doc(roleId).get();
        const role = roleDoc.data() || {};

        await db.collection('public_link_codes').doc(code).set({
            ownerUid: currentUser.uid,
            code: code,
            roleId: roleId,
            roleName: role.name || '',
            rolePrefix: role.prefix || '',
            rolePages: role.pages || [],
            label: label,
            status: 'available',
            active: true,
            usedBy: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid
        });

        _showCodeCreatedModal(code, role.name || '', label);
    } catch(e) {
        errEl.textContent = '❌ ' + e.message;
    }
};

function _showCodeCreatedModal(code, roleName, label) {
    const old = document.getElementById('roleCodeModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'roleCodeModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
    modal.innerHTML = `
        <div style="background:white;border-radius:14px;max-width:460px;width:100%;padding:20px;box-sizing:border-box;text-align:center;">
            <div style="font-size:48px;margin-bottom:10px;">✅</div>
            <h2 style="margin:0 0 10px 0;font-size:20px;color:#27ae60;">تم إنشاء الكود!</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">دور: <b>${_afEsc(roleName)}</b></p>

            <div style="background:#f0f7ff;border:2px dashed #3498db;border-radius:10px;padding:15px;margin-bottom:15px;">
                <div style="font-size:11px;color:#666;margin-bottom:6px;">الكود</div>
                <div style="font-size:24px;font-family:'Courier New',monospace;font-weight:bold;color:#2c3e50;letter-spacing:3px;">${_afEsc(code)}</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <button onclick="_copyRoleCode('${_afEsc(code)}')" style="padding:12px;background:#3498db;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">📋 نسخ</button>
                <button onclick="_shareRoleCodeWA('${_afEsc(code)}', '${_afEsc(roleName)}', '${_afEsc(label)}')" style="padding:12px;background:#25D366;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">📱 واتساب</button>
            </div>

            <button onclick="document.getElementById('roleCodeModal').remove()" style="width:100%;padding:12px;background:#95a5a6;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;">إغلاق</button>
        </div>
    `;
    document.body.appendChild(modal);
}

window._copyRoleCode = function(code) {
    const done = () => alert('✅ تم النسخ');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = code;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            done();
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
    }
};

window._shareRoleCodeWA = function(code, roleName, label) {
    const biz = (typeof settings !== 'undefined' && settings?.businessName) || currentUser?.businessName || '';
    const parts = [];
    parts.push('مرحباً' + (label ? ' ' + label : '') + '،');
    parts.push('');
    parts.push('🔗 كود الارتباط الخاص بك:');
    parts.push(code);
    parts.push('');
    parts.push('🎭 الدور: ' + roleName);
    if (biz) parts.push('🏢 النشاط: ' + biz);
    parts.push('');
    parts.push('📱 افتح التطبيق → سجّل الدخول → أدخل الكود.');
    const text = parts.join('\n');
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
};

// ═══════════════════════════════════════════════════════════
//  🧹 تنظيف الأكواد القديمة (بلا roleId)
// ═══════════════════════════════════════════════════════════
window._cleanOldCodes = async function() {
    if (!currentUser?.uid || !db) return;
    if (!confirm('⚠️ حذف كل الأكواد القديمة (التي ليس لها roleId)؟\n\nهذا لا يحذف الأدوار، فقط الأكواد القديمة.')) return;

    try {
        const snap = await db.collection('public_link_codes')
            .where('ownerUid', '==', currentUser.uid).get();

        let deleted = 0;
        const batch = db.batch();
        snap.forEach(d => {
            const data = d.data();
            if (!data.roleId) {
                batch.delete(d.ref);
                deleted++;
            }
        });

        if (deleted === 0) { alert('لا توجد أكواد قديمة'); return; }

        await batch.commit();
        alert('✅ تم حذف ' + deleted + ' كود قديم');
    } catch(e) {
        alert('❌ ' + e.message);
    }
};

window.renderEmployeeRolesPage = renderEmployeeRolesPage;

console.log('🎭 [employee-roles] v1.0.0 ready');
