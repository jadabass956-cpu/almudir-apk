// ============================================================
//  ALMUDIR — قاعدة الدول والمحافظات
// ============================================================

const LOCATIONS = {
    '+963': { // سوريا
        name: 'سوريا',
        flag: '🇸🇾',
        governorates: [
            'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة',
            'اللاذقية', 'طرطوس', 'إدلب', 'دير الزور',
            'الرقة', 'الحسكة', 'درعا', 'السويداء', 'القنيطرة'
        ]
    },
    '+961': { // لبنان
        name: 'لبنان',
        flag: '🇱🇧',
        governorates: [
            'بيروت', 'جبل لبنان', 'الشمال', 'الجنوب',
            'البقاع', 'النبطية', 'عكار', 'بعلبك الهرمل'
        ]
    },
    '+962': { // الأردن
        name: 'الأردن',
        flag: '🇯🇴',
        governorates: [
            'عمان', 'إربد', 'الزرقاء', 'البلقاء', 'المفرق',
            'الكرك', 'جرش', 'مادبا', 'عجلون', 'معان',
            'الطفيلة', 'العقبة'
        ]
    },
    '+964': { // العراق
        name: 'العراق',
        flag: '🇮🇶',
        governorates: [
            'بغداد', 'البصرة', 'نينوى', 'أربيل', 'السليمانية',
            'دهوك', 'كركوك', 'الأنبار', 'بابل', 'كربلاء',
            'النجف', 'القادسية', 'المثنى', 'واسط', 'ميسان',
            'ذي قار', 'صلاح الدين', 'ديالى'
        ]
    },
    '+90': { // تركيا
        name: 'تركيا',
        flag: '🇹🇷',
        governorates: [
            'إسطنبول', 'أنقرة', 'إزمير', 'غازي عنتاب', 'أضنة',
            'بورصة', 'أنطاليا', 'قونية', 'قيصرية', 'مرسين',
            'شانلي أورفة', 'ديار بكر', 'هاتاي', 'طرابزون'
        ]
    },
    '+966': { // السعودية
        name: 'السعودية',
        flag: '🇸🇦',
        governorates: [
            'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'الشرقية',
            'عسير', 'القصيم', 'تبوك', 'حائل', 'الحدود الشمالية',
            'جازان', 'نجران', 'الباحة', 'الجوف'
        ]
    },
    '+971': { // الإمارات
        name: 'الإمارات',
        flag: '🇦🇪',
        governorates: [
            'أبوظبي', 'دبي', 'الشارقة', 'عجمان',
            'رأس الخيمة', 'الفجيرة', 'أم القيوين'
        ]
    },
    '+20': { // مصر
        name: 'مصر',
        flag: '🇪🇬',
        governorates: [
            'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية',
            'الشرقية', 'المنوفية', 'القليوبية', 'البحيرة',
            'الغربية', 'بورسعيد', 'دمياط', 'الإسماعيلية',
            'السويس', 'كفر الشيخ', 'الفيوم', 'بني سويف',
            'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر',
            'أسوان', 'البحر الأحمر', 'الوادي الجديد',
            'مطروح', 'شمال سيناء', 'جنوب سيناء'
        ]
    }
};

// تحديث قائمة المحافظات حسب الدولة المختارة
function updateGovernoratesList() {
    const countrySel = document.getElementById('regCountry');
    const govInput = document.getElementById('regGovernorate');
    if (!countrySel || !govInput) return;

    const code = countrySel.value;
    const data = LOCATIONS[code];
    if (!data) return;

    // تحويل input إلى select
    if (govInput.tagName === 'INPUT') {
        const sel = document.createElement('select');
        sel.id = 'regGovernorate';
        sel.innerHTML = '<option value="">— اختر المحافظة —</option>' +
            data.governorates.map(g => '<option value="' + g + '">' + g + '</option>').join('');
        govInput.parentNode.replaceChild(sel, govInput);
    } else {
        // تحديث الخيارات
        const currentVal = govInput.value;
        govInput.innerHTML = '<option value="">— اختر المحافظة —</option>' +
            data.governorates.map(g => '<option value="' + g + '">' + g + '</option>').join('');
        if (data.governorates.indexOf(currentVal) !== -1) {
            govInput.value = currentVal;
        }
    }
}

console.log('🌍 [locations] قاعدة الدول جاهزة');
