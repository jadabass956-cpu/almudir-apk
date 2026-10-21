// ============================================================
//  ALMUDIR — قاعدة الدول والتخصيص الجغرافي
// ============================================================

const COUNTRIES = {
    '+963': {
        code: 'SY',
        name: 'سوريا',
        flag: '🇸🇾',
        currency: {
            primary: 'SYP',
            secondary: 'USD',
            rates: { USD: 15000 }
        },
        currencies: {
            SYP: { name: 'ليرة سورية', symbol: 'ل.س', decimals: 0 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 0,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['friday', 'saturday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'ظرف', 'شريط', 'درزن', 'كرتون'],
        expenseCategories: ['فواتير', 'رواتب', 'نقل', 'صيانة', 'إيجار', 'تسويق', 'أخرى'],
        phoneFormat: '9XX XXX XXX'
    },

    '+961': {
        code: 'LB',
        name: 'لبنان',
        flag: '🇱🇧',
        currency: {
            primary: 'LBP',
            secondary: 'USD',
            rates: { USD: 89500 }
        },
        currencies: {
            LBP: { name: 'ليرة لبنانية', symbol: 'ل.ل', decimals: 0 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 11,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['saturday', 'sunday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'ظرف'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'أخرى'],
        phoneFormat: 'XX XXX XXX'
    },

    '+962': {
        code: 'JO',
        name: 'الأردن',
        flag: '🇯🇴',
        currency: {
            primary: 'JOD',
            secondary: 'USD',
            rates: { USD: 0.71 }
        },
        currencies: {
            JOD: { name: 'دينار أردني', symbol: 'د.أ', decimals: 2 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 16,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['friday', 'saturday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'كرتون'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'أخرى'],
        phoneFormat: '7X XXX XXXX'
    },

    '+964': {
        code: 'IQ',
        name: 'العراق',
        flag: '🇮🇶',
        currency: {
            primary: 'IQD',
            secondary: 'USD',
            rates: { USD: 1310 }
        },
        currencies: {
            IQD: { name: 'دينار عراقي', symbol: 'د.ع', decimals: 0 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 0,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['friday', 'saturday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'كرتون', 'كيس'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'أخرى'],
        phoneFormat: '7XX XXX XXXX'
    },

    '+90': {
        code: 'TR',
        name: 'تركيا',
        flag: '🇹🇷',
        currency: {
            primary: 'TRY',
            secondary: 'USD',
            rates: { USD: 34.5 }
        },
        currencies: {
            TRY: { name: 'ليرة تركية', symbol: '₺', decimals: 2 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 20,
        dateFormat: 'DD.MM.YYYY',
        weekend: ['saturday', 'sunday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'باكيت'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'أخرى'],
        phoneFormat: '5XX XXX XXXX'
    },

    '+966': {
        code: 'SA',
        name: 'السعودية',
        flag: '🇸🇦',
        currency: {
            primary: 'SAR',
            secondary: 'USD',
            rates: { USD: 0.27 }
        },
        currencies: {
            SAR: { name: 'ريال سعودي', symbol: '﷼', decimals: 2 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 15,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['friday', 'saturday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'كرتون', 'كيس'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'ضيافة', 'أخرى'],
        phoneFormat: '5X XXX XXXX'
    },

    '+971': {
        code: 'AE',
        name: 'الإمارات',
        flag: '🇦🇪',
        currency: {
            primary: 'AED',
            secondary: 'USD',
            rates: { USD: 0.27 }
        },
        currencies: {
            AED: { name: 'درهم إماراتي', symbol: 'د.إ', decimals: 2 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 5,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['saturday', 'sunday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'كرتون'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'ضيافة', 'أخرى'],
        phoneFormat: '5X XXX XXXX'
    },

    '+20': {
        code: 'EG',
        name: 'مصر',
        flag: '🇪🇬',
        currency: {
            primary: 'EGP',
            secondary: 'USD',
            rates: { USD: 49 }
        },
        currencies: {
            EGP: { name: 'جنيه مصري', symbol: 'ج.م', decimals: 2 },
            USD: { name: 'دولار أمريكي', symbol: '$', decimals: 2 }
        },
        vat: 14,
        dateFormat: 'DD/MM/YYYY',
        weekend: ['friday', 'saturday'],
        units: ['علبة', 'قطعة', 'كيلو', 'غرام', 'لتر', 'كيس'],
        expenseCategories: ['فواتير', 'رواتب', 'إيجار', 'نقل', 'صيانة', 'تسويق', 'أخرى'],
        phoneFormat: '1X XXX XXXX'
    }
};

// ============================================================
//  دوال مساعدة
// ============================================================

function getCountryByPhone(phonePrefix) {
    return COUNTRIES[phonePrefix] || COUNTRIES['+963'];
}

function getCountryByCode(code) {
    return Object.values(COUNTRIES).find(c => c.code === code) || COUNTRIES['+963'];
}

function getCurrentCountry() {
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.countryCode) {
        return getCountryByCode(currentUser.countryCode);
    }
    // احتياطي
    const stored = localStorage.getItem('user_country');
    if (stored) return getCountryByCode(stored);
    return COUNTRIES['+963'];
}

function getCurrentCurrency() {
    const country = getCurrentCountry();
    return country.currencies[country.currency.primary];
}

function getSecondaryCurrency() {
    const country = getCurrentCountry();
    return country.currencies[country.currency.secondary];
}

function getCurrentUnits() {
    return getCurrentCountry().units;
}

function getCurrentExpenseCategories() {
    return getCurrentCountry().expenseCategories;
}

function getCurrentVAT() {
    return getCurrentCountry().vat;
}


// ============================================================
//  ✨ دوال تنسيق التاريخ حسب البلد
// ============================================================

/**
 * تنسيق التاريخ حسب البلد
 * @param {string|Date|Object} date - التاريخ (نص YYYY-MM-DD، Date، أو Firestore Timestamp)
 * @returns {string} - تاريخ منسّق (مثال: 12/09/2026)
 */
function formatDate(date) {
    if (!date) return '—';
    
    let d;
    try {
        // Firestore Timestamp
        if (date && typeof date === 'object' && typeof date.toDate === 'function') {
            d = date.toDate();
        }
        // Date object
        else if (date instanceof Date) {
            d = date;
        }
        // Firestore Timestamp (بنية .seconds)
        else if (date && typeof date === 'object' && typeof date.seconds === 'number') {
            d = new Date(date.seconds * 1000);
        }
        // نص
        else {
            d = new Date(date);
        }
        
        if (isNaN(d.getTime())) return String(date);
    } catch (e) {
        return String(date);
    }
    
    const country = getCurrentCountry();
    const format = (country && country.dateFormat) ? country.dateFormat : 'DD/MM/YYYY';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    if (format === 'DD.MM.YYYY') {
        return day + '.' + month + '.' + year;
    }
    // الافتراضي
    return day + '/' + month + '/' + year;
}

/**
 * تنسيق التاريخ مع الوقت
 */
function formatDateTime(date) {
    if (!date) return '—';
    const datePart = formatDate(date);
    if (datePart === '—') return datePart;
    
    try {
        let d;
        if (date && typeof date === 'object' && typeof date.toDate === 'function') {
            d = date.toDate();
        } else if (date instanceof Date) {
            d = date;
        } else if (date && typeof date === 'object' && typeof date.seconds === 'number') {
            d = new Date(date.seconds * 1000);
        } else {
            d = new Date(date);
        }
        if (isNaN(d.getTime())) return datePart;
        
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return datePart + ' ' + hours + ':' + minutes;
    } catch (e) {
        return datePart;
    }
}

console.log('🌍 [countries] جاهز —', Object.keys(COUNTRIES).length, 'دول');
