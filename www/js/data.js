// ==================== البيانات ====================
let materials = [];
let sales = [];
let expenses = [];
let debts = [];
let ownerWithdrawals = [];
let disposals = [];
let warehouses = [];
let transfers = [];
let settings = {
    displayCurrency: 'SYP',
    password: 'admin',
    pin: '',
    businessName: '',
    businessDescription: '',
    ownerSignature: '',
    // 💱 سعر الصرف
    exchangeRate: 0,
    exchangeRateUpdatedAt: null
};

let materialId = 1;
let editingMaterialId = null;
let editingSaleIndex = null;
let editingExpenseIndex = null;
let editingDebtIndex = null;

// ==================== دوال التخزين ====================
async function saveAllData() {
    if (!currentUser) return;
    const uid = _getEffectiveUid();
    await db.collection('users').doc(uid).collection('data').doc('main').set({
        materials,
        sales,
        expenses,
        debts,
        ownerWithdrawals,
        disposals,
        warehouses,
        transfers,
        settings
    }, { merge: true });
}

async function loadAllDataFromFirestore() {
    if (!currentUser) {
        console.warn('loadAllDataFromFirestore: لا يوجد currentUser');
        return;
    }
    const uid = _getEffectiveUid();
    try {
        const doc = await db.collection('users').doc(uid).collection('data').doc('main').get();
        if (doc.exists) {
            const data = doc.data();
            materials = data.materials || [];
            sales = data.sales || [];
            expenses = data.expenses || [];
            debts = data.debts || [];
            ownerWithdrawals = data.ownerWithdrawals || [];
            disposals = data.disposals || [];
            warehouses = data.warehouses || [];
            transfers = data.transfers || [];
            settings = data.settings || settings;
            materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
            // حفظ نسخة محلية من البيانات
            await saveLocalData(uid, { materials, sales, expenses, debts, ownerWithdrawals, disposals, warehouses, transfers, settings });
            if (typeof updateAllTables === 'function') updateAllTables();
            
            // 🔄 تحديث dropdowns المستودعات (إن كانت صفحة مفتوحة)
            if (typeof _whRefreshAllSelects === 'function') {
                setTimeout(() => _whRefreshAllSelects(), 500);
            }
        } else {
            // لا توجد بيانات في Firestore، نجرب IndexedDB
            const localData = await loadLocalData(uid);
            if (localData) {
                materials = localData.materials || [];
                sales = localData.sales || [];
                expenses = localData.expenses || [];
                debts = localData.debts || [];
                ownerWithdrawals = localData.ownerWithdrawals || [];
                disposals = localData.disposals || [];
                warehouses = localData.warehouses || [];
                transfers = localData.transfers || [];
                settings = localData.settings || settings;
                materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
                if (typeof updateAllTables === 'function') updateAllTables();
            } else {
                materials = [];
                sales = [];
                expenses = [];
                debts = [];
                ownerWithdrawals = [];
                disposals = [];
                warehouses = [];
                transfers = [];
                await saveAllData();
            }
        }
    } catch (error) {
        console.warn('تعذر الوصول إلى Firestore، جاري القراءة من IndexedDB...', error);
        const localData = await loadLocalData(uid);
        if (localData) {
            materials = localData.materials || [];
            sales = localData.sales || [];
            expenses = localData.expenses || [];
            debts = localData.debts || [];
            ownerWithdrawals = localData.ownerWithdrawals || [];
            disposals = localData.disposals || [];
            warehouses = localData.warehouses || [];
            transfers = localData.transfers || [];
            settings = localData.settings || settings;
            materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
            if (typeof updateAllTables === 'function') updateAllTables();
        }
    }
}

// ==================== دوال العملات ====================
function saveSettings() {
    settings.displayCurrency = document.getElementById('displayCurrency').value;
    saveAllData();
    updateAllTables();
}

function loadSettings() {
    document.getElementById('displayCurrency').value = settings.displayCurrency || 'SYP';
    // 💱 سعر الصرف
    const erEl = document.getElementById('exchangeRateInput');
    if (erEl) erEl.value = settings.exchangeRate || '';
    const erInfo = document.getElementById('exchangeRateInfo');
    if (erInfo && settings.exchangeRateUpdatedAt) {
        const d = new Date(settings.exchangeRateUpdatedAt);
        erInfo.textContent = '📅 آخر تحديث: ' + d.toLocaleDateString('ar-SY') + ' — ' + d.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
    }
    loadBusinessInfo();
}

function loadBusinessInfo() {
    document.getElementById('businessName').value = settings.businessName || '';
    document.getElementById('businessDescription').value = settings.businessDescription || '';
    document.getElementById('ownerSignature').value = settings.ownerSignature || '';
}

function saveBusinessInfo() {
    settings.businessName = document.getElementById('businessName').value.trim();
    settings.businessDescription = document.getElementById('businessDescription').value.trim();
    settings.ownerSignature = document.getElementById('ownerSignature').value.trim();
    saveAllData();
}

// ═══════════════════════════════════════════════════════
//  💱 EXCHANGE RATE — سعر الصرف والحساب التلقائي
// ═══════════════════════════════════════════════════════

function getExchangeRate() {
    return Number(settings.exchangeRate) || 0;
}

// حساب السعر بالليرة من الدولار
function calcSYPFromUSD(priceUSD) {
    const rate = getExchangeRate();
    if (!rate || rate <= 0) return 0;
    const v = Number(priceUSD) * rate;
    return Math.round(v * 100) / 100;
}

// حساب السعر بالدولار من الليرة
function calcUSDFromSYP(priceSYP) {
    const rate = getExchangeRate();
    if (!rate || rate <= 0) return 0;
    const v = Number(priceSYP) / rate;
    return Math.round(v * 100) / 100;
}

// تنسيق الرقم بمنزلتين عشريتين
function _fmtPrice(n) {
    return (Number(n) || 0).toFixed(2);
}

// حفظ سعر الصرف
function saveExchangeRate() {
    const el = document.getElementById('exchangeRateInput');
    if (!el) return;
    const rate = Number(el.value) || 0;
    if (rate <= 0) {
        alert('⚠️ أدخل سعراً صحيحاً');
        return;
    }

    const prevRate = Number(settings.exchangeRate) || 0;

    // 📜 حفظ في السجل
    if (!Array.isArray(settings.exchangeRateHistory)) {
        settings.exchangeRateHistory = [];
    }

    // نضيف فقط إذا تغيّر السعر
    if (rate !== prevRate) {
        settings.exchangeRateHistory.unshift({
            rate: rate,
            previousRate: prevRate,
            date: Date.now(),
            user: (typeof currentUser !== 'undefined' && currentUser?.fullName) || auth?.currentUser?.email || 'المدير',
            note: ''
        });

        // نُبقي آخر 100 سجل فقط
        if (settings.exchangeRateHistory.length > 100) {
            settings.exchangeRateHistory = settings.exchangeRateHistory.slice(0, 100);
        }
    }

    settings.exchangeRate = rate;
    settings.exchangeRateUpdatedAt = Date.now();
    saveAllData();

    // تحديث info
    if (typeof loadSettings === 'function') {
        try { loadSettings(); } catch(e) {}
    }

    if (typeof toast === 'function') toast('✅ تم حفظ سعر الصرف', 'success');
    else alert('✅ تم حفظ سعر الصرف');
}

// ═══════════════════════════════════════════════════════════
//  📜 EXCHANGE RATE HISTORY — سجل سعر الصرف
// ═══════════════════════════════════════════════════════════
function getExchangeRateHistory() {
    if (!Array.isArray(settings.exchangeRateHistory)) return [];
    return settings.exchangeRateHistory;
}

function clearExchangeRateHistory() {
    if (!confirm('🗑️ حذف كل السجل التاريخي لسعر الصرف؟\n\n(لا يؤثر على السعر الحالي)')) return;
    settings.exchangeRateHistory = [];
    saveAllData();
    if (typeof toast === 'function') toast('✅ تم حذف السجل', 'success');
    if (typeof _renderExchangeHistory === 'function') _renderExchangeHistory();
}

function _fmtHistoryDate(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / 86400000);

    let timeLabel = d.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
    let dateLabel = d.toLocaleDateString('ar-SY', { day: 'numeric', month: 'short' });

    if (days === 0) return 'اليوم — ' + timeLabel;
    if (days === 1) return 'أمس — ' + timeLabel;
    if (days < 7) return 'منذ ' + days + ' أيام — ' + dateLabel;
    return dateLabel + ' ' + d.getFullYear();
}

function _calcChange(prev, curr) {
    if (!prev || prev <= 0) return null;
    const diff = curr - prev;
    const pct = (diff / prev) * 100;
    return {
        diff: diff,
        pct: pct,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    };
}

window.saveExchangeRate = saveExchangeRate;
window.getExchangeRateHistory = getExchangeRateHistory;
window.clearExchangeRateHistory = clearExchangeRateHistory;
window._fmtHistoryDate = _fmtHistoryDate;
window._calcChange = _calcChange;

function convertToBase(amount, fromCurrency) {
    return amount;
}

function convertFromBase(amount, toCurrency) {
    return amount;
}

function formatCurrency(amount, currency) {
    currency = currency || settings.displayCurrency;
    if (currency === 'USD') return `$${Number(amount).toFixed(2)}`;
    else return `${Number(amount).toFixed(0)} ل.س`;
}

// ==================== مزامنة فورية ====================
let unsubscribeUserData = null;

function listenToUserData() {
    if (!currentUser || !currentUser.uid) return;
    const uid = _getEffectiveUid();
    const docRef = db.collection('users').doc(uid).collection('data').doc('main');

    unsubscribeUserData = docRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            materials = data.materials || [];
            sales = data.sales || [];
            expenses = data.expenses || [];
            debts = data.debts || [];
            ownerWithdrawals = data.ownerWithdrawals || [];
            disposals = data.disposals || [];
            warehouses = data.warehouses || [];
            transfers = data.transfers || [];
            settings = data.settings || settings;
            materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
            updateAllTables();
        }
    }, (error) => {
        console.error('خطأ في المزامنة الفورية:', error);
    });
}

function stopListeningToUserData() {
    if (unsubscribeUserData) {
        unsubscribeUserData();
        unsubscribeUserData = null;
    }
}

// ==================== المزامنة عند عودة الاتصال ====================
window.addEventListener('online', async () => {
    console.log('✅ تم استعادة الاتصال');
    // Firebase Persistence + IndexedDB يزامنان تلقائياً
});
