// ============================================================
//  📋 MENU SECTIONS — صفحات كاملة الشاشة
//  v3.0.0 — احترافي
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. DATA
// ═══════════════════════════════════════════════════════════

const SUBMENU_ACCOUNTING = [
    { icon: 'package', label: 'المواد',              action: "openPage('materials')" },
    { icon: 'shopping-cart', label: 'المشتريات والموردون',   action: "openPage('purchases'); setTimeout(loadPurchases, 200);" },
    { icon: 'wallet', label: 'المبيعات',            action: "openPage('sales')" },
    { icon: 'banknote', label: 'كاشير يومي',           action: "openDailyCashierTool()", color: '#f39c12' },
    { icon: 'receipt', label: 'المصروفات',           action: "openPage('expenses')" },
    { icon: 'briefcase', label: 'مسحوبات المالك',       action: "openPage('owner-withdrawals')", color: '#e67e22' },
    { icon: 'package-x', label: 'إتلاف المواد',         action: "openPage('disposals')", color: '#c0392b' },
    { icon: 'users', label: 'الديون',              action: "openPage('debts')" },
    { icon: 'user', label: 'العملاء',              action: "openCustomersPage()" },
    { icon: 'warehouse', label: 'المستودعات',           action: "openPage('warehouses')", color: '#8e44ad' },
    { icon: 'credit-card', label: 'صناديق الدفع',         action: "openPaymentBoxesPage()", color: '#27ae60' },
    { icon: 'trending-up', label: 'تقرير التكلفة',        action: "openPage('cost-history')", color: '#2980b9' },
    { icon: 'tags', label: 'صانع الملصقات',         action: "openPriceTagsTool()", color: '#34495e' },
    { icon: 'bar-chart-3', label: 'التقارير',             action: "openPage('reports')" },
    { icon: 'user-cog', label: 'الأدوار الوظيفية',      action: "openEmployeeRolesPage()", color: '#8e44ad' }
];

const SUBMENU_WORK = {
    'مطعم': [
        { icon: 'utensils', label: 'قائمة الطعام',      action: "openPage('activity-restaurant-menu')", color: '#27ae60' },
        { icon: 'armchair', label: 'طلبات الطاولات',    action: "openPage('activity-restaurant-tables')", color: '#3498db' },
        { icon: 'bike', label: 'طلبات التوصيل',     action: "openPage('activity-restaurant-delivery')", color: '#e67e22' },
        { icon: 'bike', label: 'السائقين',           action: "openPage('activity-restaurant-drivers')", color: '#16a085' },
        { icon: 'chef-hat', label: 'شاشة المطبخ',       action: "openPage('activity-restaurant-kitchen')", color: '#e74c3c' },
        { icon: 'bar-chart-3', label: 'تقارير المطعم',     action: "openPage('activity-restaurant-reports')", color: '#8e44ad' },
        { icon: 'qr-code', label: 'رموز QR للطاولات',   action: "openRestaurantQRManager()", color: '#e67e22' },
        { icon: 'scroll-text', label: 'سجل الفواتير',        action: "openRestaurantInvoicesPage()", color: '#8e44ad' }
    ],
    'سوبر ماركت': [
        { icon: 'bot', label: 'تنبيهات ذكية',         action: "openPage('activity-supermarket-ai-alerts')", color: '#8e44ad' },
        { icon: 'bar-chart-3', label: 'جرد سريع',             action: "openPage('activity-supermarket-inventory')", color: '#c0392b' },
        { icon: 'bike', label: 'طلبات التوصيل',         action: "openPage('activity-supermarket-delivery')", color: '#27ae60' },
        { icon: 'bar-chart-3', label: 'تقرير المتجر',          action: "openPage('activity-supermarket-store-report')", color: '#3498db' },
        { icon: 'wallet', label: 'قائمة أسعار الجملة',    action: "openPage('activity-supermarket-price-list')", color: '#e67e22' },
        { icon: 'folder', label: 'التصنيفات السريعة',     action: "openPage('activity-supermarket-categories')", color: '#8e44ad' }
    ],
    'صيدلية': [
        { icon: 'package', label: 'دفعات الأدوية',      action: "openPage('activity-pharmacy-batches')" },
        { icon: 'file-text', label: 'الوصفات الطبية',     action: "openPage('activity-pharmacy-prescriptions')" },
        { icon: 'clock', label: 'تنبيهات الصلاحية',    action: "openPage('activity-pharmacy-expiry-alerts')" }
    ],
    'اتصالات': [
        { icon: 'receipt', label: 'وصل استلام',      action: "openPage('activity-telecom-receipts')" },
        { icon: 'shield', label: 'كفالة الهواتف',    action: "openPage('activity-telecom-warranties')" },
        { icon: 'wrench', label: 'تسعيرة الخدمات',   action: "openPage('activity-telecom-services')", color: '#2980b9' },
        { icon: 'file-text', label: 'النواقص',          action: "openPage('activity-telecom-shortages')", color: '#e67e22' },
        { icon: 'bar-chart-3', label: 'تقارير الصيانة',    action: "openPage('activity-telecom-reports')" }
    ]
};

// ═══════════════════════════════════════════════════════════
//  2. RENDER ACCOUNTING PAGE — عرض صفحة المحاسبة
// ═══════════════════════════════════════════════════════════
function renderAccountingPage() {
    const container = document.getElementById('accountingMenuList');
    if (!container) return;
    
    container.innerHTML = SUBMENU_ACCOUNTING.map(item => `
        <button onclick="closeMenuAndGo(); ${item.action}"
            style="width:100%; padding:16px 18px; margin-bottom:8px; background:#fff; color:#2c3e50; border:1px solid #e9ecef; border-radius:12px; text-align:right; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:12px; box-shadow:0 2px 6px rgba(0,0,0,0.04);"
            onmouseover="this.style.background='#fff8f0'; this.style.borderColor='#e67e22'; this.style.transform='translateX(-3px)'"
            onmouseout="this.style.background='#fff'; this.style.borderColor='#e9ecef'; this.style.transform='translateX(0)'">
            <span style="width:32px; text-align:center; display:flex; align-items:center; justify-content:center;"><i data-lucide="${item.icon}" style="width:22px; height:22px;"></i></span>
            <span style="flex:1;">${item.label}</span>
            <span style="opacity:0.3; font-size:18px; color:#e67e22;">›</span>
        </button>
    `).join('');
    
    console.log('📋 [menu] صفحة المحاسبة — ' + SUBMENU_ACCOUNTING.length + ' عنصر');

    // 🎨 رسم أيقونات Lucide بعد الحقن
    if (window.lucide) lucide.createIcons();
}

// ═══════════════════════════════════════════════════════════
//  3. RENDER WORK PAGE — عرض صفحة واجهة العمل
// ═══════════════════════════════════════════════════════════
function renderWorkPage() {
    const container = document.getElementById('workMenuList');
    const header = document.getElementById('workMenuHeader');
    if (!container) return;
    
    const activity = currentUser?.businessType;
    const items = SUBMENU_WORK[activity] || [];
    
    if (header) {
        header.textContent = activity ? `🎨 واجهة العمل — ${activity}` : '🎨 واجهة العمل';
    }
    
    if (items.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا توجد واجهة لنشاطك الحالي</div>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <button onclick="closeMenuAndGo(); ${item.action}"
            style="width:100%; padding:16px 18px; margin-bottom:8px; background:#fff; color:#2c3e50; border:1px solid #e9ecef; border-radius:12px; text-align:right; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:12px; box-shadow:0 2px 6px rgba(0,0,0,0.04);"
            onmouseover="this.style.background='#fff8f0'; this.style.borderColor='#e67e22'; this.style.transform='translateX(-3px)'"
            onmouseout="this.style.background='#fff'; this.style.borderColor='#e9ecef'; this.style.transform='translateX(0)'">
            <span style="width:32px; text-align:center; display:flex; align-items:center; justify-content:center;"><i data-lucide="${item.icon}" style="width:22px; height:22px;"></i></span>
            <span style="flex:1;">${item.label}</span>
            <span style="opacity:0.3; font-size:18px; color:#e67e22;">›</span>
        </button>
    `).join('');
    
    console.log('🎨 [menu] صفحة العمل — ' + items.length + ' عنصر');

    // 🎨 رسم أيقونات Lucide بعد الحقن
    if (window.lucide) lucide.createIcons();
}

// ═══════════════════════════════════════════════════════════
//  4. HELPERS
// ═══════════════════════════════════════════════════════════
function closeMenuAndGo() {
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════
//  5. WORK MENU VISIBILITY
// ═══════════════════════════════════════════════════════════
function updateWorkMenuButton() {
    const btn = document.getElementById('workMenuBtn');
    if (!btn) return;
    
    const activity = currentUser?.businessType;
    const hasWork = activity && SUBMENU_WORK[activity] && SUBMENU_WORK[activity].length > 0;
    
    btn.style.display = hasWork ? '' : 'none';
}

function initMenuSections() {
    // ✅ مراقبة مستمرة حتى يظهر currentUser
    let attempts = 0;
    const waiter = setInterval(() => {
        attempts++;
        updateWorkMenuButton();

        const isReady = (typeof currentUser !== 'undefined')
                     && currentUser
                     && currentUser.businessType;

        if (isReady) {
            clearInterval(waiter);
            console.log('✅ [work-menu] جاهز بعد', attempts, 'محاولات | businessType:', currentUser.businessType);
            return;
        }

        if (attempts > 20) {
            clearInterval(waiter);
            console.warn('⚠️ [work-menu] timeout بعد 20 محاولة');
        }
    }, 500);
}

// ═══════════════════════════════════════════════════════════
//  6. EXPORT
// ═══════════════════════════════════════════════════════════
window.renderAccountingPage = renderAccountingPage;
window.renderWorkPage = renderWorkPage;
window.closeMenuAndGo = closeMenuAndGo;
window.updateWorkMenuButton = updateWorkMenuButton;
window.initMenuSections = initMenuSections;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenuSections);
} else {
    initMenuSections();
}

if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(() => {
        // ✅ محاولات متعددة — currentUser يحتاج وقتاً للتحميل
        setTimeout(updateWorkMenuButton, 500);
        setTimeout(updateWorkMenuButton, 2000);
        setTimeout(updateWorkMenuButton, 4000);
    });
}

// ✅ مراقبة تغييرات body class (مثل app-ready)
document.addEventListener('DOMContentLoaded', () => {
    const _wmObserver = new MutationObserver(updateWorkMenuButton);
    _wmObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});

console.log('📋 [menu-sections] v3.0.0 — صفحات كاملة محمّل');
