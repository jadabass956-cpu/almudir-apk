// ============================================================
//  ALMUDIR AI — المساعد الذكي المحلي
//  نظام intent-based مع كلمات مفتاحية + تعلم
// ============================================================

// ============================================================
//  1. تطبيع النص العربي
// ============================================================
function aiNorm(t) {
    // 🔤 استخدام aiNorm2 المُحسّن
    if (typeof aiNorm2 === 'function') {
        try { return aiNorm2(t); } catch(e) {}
    }
    // fallback
    return String(t || '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[ًٌٍَُِّْـ]/g, '')
        .toLowerCase()
        .trim();
}

// ============================================================
//  2. كشف الفترة الزمنية
// ============================================================
function aiPeriod(q) {
    // 🕒 استخدام aiExtractPeriod
    if (typeof aiExtractPeriod === 'function') {
        try {
            const p = aiExtractPeriod(q);
            if (p) return p;
        } catch(e) {}
    }
    // fallback
    const n = aiNorm(q);
    if (n.includes('اليوم')) return 'today';
    if (n.includes('امس')) return 'yesterday';
    if (n.includes('الاسبوع') || n.includes('اسبوع')) return 'week';
    if (n.includes('الشهر') || n.includes('شهر')) return 'month';
    if (n.includes('السنه') || n.includes('سنة') || n.includes('العام')) return 'year';
    return 'all';
}

function aiPeriodName(p) {
    return { today: 'اليوم', yesterday: 'أمس', week: 'هذا الأسبوع',
             month: 'هذا الشهر', year: 'هذه السنة', all: 'كل الوقت' }[p] || 'كل الوقت';
}

function aiInPeriod(dateStr, period) {
    if (period === 'all') return true;
    if (!dateStr) return false;
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let ref = new Date(today);
    switch (period) {
        case 'today':     return d >= today;
        case 'yesterday': ref.setDate(ref.getDate() - 1); return d >= ref && d < today;
        case 'week':      ref.setDate(ref.getDate() - 7); return d >= ref;
        case 'month':     return d >= new Date(now.getFullYear(), now.getMonth(), 1);
        case 'year':      return d >= new Date(now.getFullYear(), 0, 1);
    }
    return true;
}

// إجمالي الفاتورة — يوحّد مع صفحة الأرباح (getSaleGrandTotal)
function _saleAmt(x) {
    if (!x) return 0;
    if (typeof getSaleGrandTotal === 'function') {
        return getSaleGrandTotal(x);
    }
    return x.total || 0;
}

// ============================================================
//  3. التعريفات (Intents)
// ============================================================
const AI_INTENTS = [
    // ====== المبيعات ======
    {
        id: 'sales_total', cat: 'sales',
        keywords: ['مبيعات', 'بعت', 'بيع', 'مبيع', 'بعنا', 'مبيعاتي'],
        handle: (q, p) => {
            const list = sales.filter(s => !s.isRetail && aiInPeriod(s.date, p));
            if (!list.length) return '📊 لا توجد مبيعات في ' + aiPeriodName(p);
            const total = list.reduce((s, x) => s + _saleAmt(x), 0);
            const paid  = list.reduce((s, x) => s + (x.paid  || 0), 0);
            return '📊 مبيعات ' + aiPeriodName(p) + '\n' +
                   '💰 الإجمالي: ' + formatCurrency(total) + '\n' +
                   '✅ المدفوع: ' + formatCurrency(paid) + '\n' +
                   '⏳ الباقي: ' + formatCurrency(total - paid) + '\n' +
                   '📦 عدد الفواتير: ' + list.length + '\n' +
                   '📈 متوسط الفاتورة: ' + formatCurrency(Math.round(total / list.length));
        }
    },
    {
        id: 'sales_retail', cat: 'sales',
        keywords: ['مفرق', 'بيع مفرق', 'التجزئه', 'تجزئه'],
        handle: (q, p) => {
            const list = sales.filter(s => s.isRetail && aiInPeriod(s.date, p));
            if (!list.length) return '🛒 لا توجد عمليات بيع مفرق في ' + aiPeriodName(p);
            const total = list.reduce((s, x) => s + _saleAmt(x), 0);
            return '🛒 بيع مفرق ' + aiPeriodName(p) + '\n' +
                   '💰 الإجمالي: ' + formatCurrency(total) + '\n' +
                   '📦 عدد العمليات: ' + list.length;
        }
    },
    {
        id: 'sales_count', cat: 'sales',
        keywords: ['عدد الفواتير', 'كم فاتورة', 'فواتير'],
        handle: (q, p) => {
            const periodList = sales.filter(s => aiInPeriod(s.date, p));
            const reg = periodList.filter(s => !s.isRetail).length;
            const ret = periodList.filter(s => s.isRetail).length;
            return '📄 عدد الفواتير: ' + reg + '\n🛒 عمليات المفرق: ' + ret + '\n📊 الإجمالي: ' + (reg + ret) + '\n📅 ' + aiPeriodName(p);
        }
    },

    // ====== الأرباح ======
    {
        id: 'profit', cat: 'profit',
        keywords: ['ربح', 'ارباح', 'ارباحي', 'أرباح', 'مكسب', 'صافي', 'ربحي', 'كسبت'],  // profit_boost
        handle: (q, p) => {
            const salesList = sales.filter(s => !s.isRetail && aiInPeriod(s.date, p));
            const totalSales = salesList.reduce((s, x) => s + _saleAmt(x), 0);
            const totalCost = salesList.reduce((s, x) => s + (x.totalCost || 0), 0);
            const expList = expenses.filter(e => aiInPeriod(e.date, p));
            const totalExp = expList.reduce((s, x) => s + (x.amount || 0), 0);
            const net = totalSales - totalCost - totalExp;
            const margin = totalSales > 0 ? Math.round((net / totalSales) * 100) : 0;
            return '💰 أرباح ' + aiPeriodName(p) + '\n' +
                   '📈 المبيعات:  ' + formatCurrency(totalSales) + '\n' +
                   '📦 التكلفة:   ' + formatCurrency(totalCost) + '\n' +
                   '📉 المصروفات: ' + formatCurrency(totalExp) + '\n' +
                   '━━━━━━━━━━━━\n' +
                   '💵 الصافي:    ' + formatCurrency(net) + '\n' +
                   '🎯 الهامش:    ' + margin + '%';
        }
    },

    // ====== المصروفات ======
    {
        id: 'expenses', cat: 'expense',
        keywords: ['مصروف', 'مصروفات', 'نفقات'],
        needsClarify: true,
        clarifyOptions: ['ملخص وتصنيفات', 'أكبر مصروف', 'آخر المصروفات'],
        clarifyMap: {
            // خيار 1: الملخص والتصنيفات
            '1': 'expenses_summary',
            'ملخص': 'expenses_summary',
            'الملخص': 'expenses_summary',
            'تصنيف': 'expenses_summary',
            'التصنيف': 'expenses_summary',
            'تصنيفات': 'expenses_summary',
            'كلها': 'expenses_summary',
            'الكل': 'expenses_summary',
            // خيار 2: الأكبر
            '2': 'expenses_top',
            'أكبر': 'expenses_top',
            'اكبر': 'expenses_top',
            'الأكبر': 'expenses_top',
            'أعلى': 'expenses_top',
            'اعلى': 'expenses_top',
            'الأعلى': 'expenses_top',
            // خيار 3: الأحدث
            '3': 'expenses_recent',
            'آخر': 'expenses_recent',
            'اخر': 'expenses_recent',
            'الأخيرة': 'expenses_recent',
            'الأحدث': 'expenses_recent',
            'أحدث': 'expenses_recent'
        }
    },
    {
        id: 'expenses_summary', cat: 'expense',
        keywords: [
            'ملخص المصروفات', 'تصنيف المصروفات',
            'ملخص المصاريف', 'تصنيف المصاريف',
            'ملخص مصروف', 'تصنيف مصروف',
            'ملخص', 'تصنيف'
        ],
        handle: (q, p) => {
            const list = expenses.filter(e => aiInPeriod(e.date, p));
            if (!list.length) return '💸 لا توجد مصروفات في ' + aiPeriodName(p);
            const total = list.reduce((s, x) => s + (x.amount || 0), 0);
            const byCat = {};
            list.forEach(e => { byCat[e.category || 'أخرى'] = (byCat[e.category || 'أخرى'] || 0) + e.amount; });
            const cats = Object.entries(byCat).sort((a,b) => b[1] - a[1])
                .map(x => '  • ' + x[0] + ': ' + formatCurrency(x[1])).join('\n');
            return '💸 مصروفات ' + aiPeriodName(p) + '\n' +
                   '💰 الإجمالي: ' + formatCurrency(total) + '\n' +
                   '📊 حسب التصنيف:\n' + cats;
        }
    },

    {
        id: 'expenses_top', cat: 'expense',
        keywords: [
            'أكبر مصروف', 'اكبر مصروف',
            'أعلى مصروف', 'اعلى مصروف',
            'أكبر', 'اكبر'
        ],
        handle: (q, p) => {
            const list = expenses.filter(e => aiInPeriod(e.date, p));
            if (!list.length) return '💸 لا توجد مصروفات في ' + aiPeriodName(p);
            const top = list.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
            return '🏆 أكبر مصروف ' + aiPeriodName(p) + '\n' +
                   '💰 المبلغ: ' + formatCurrency(top.amount || 0) + '\n' +
                   '📂 التصنيف: ' + (top.category || 'أخرى') + '\n' +
                   '📝 الوصف: ' + (top.desc || '—') + '\n' +
                   '📅 التاريخ: ' + (top.date || '—');
        }
    },
    {
        id: 'expenses_recent', cat: 'expense',
        keywords: [
            'آخر مصروفات', 'اخر مصروفات',
            'آخر مصروف', 'اخر مصروف',
            'الأخيرة', 'الأحدث'
        ],
        handle: (q, p) => {
            const list = expenses.filter(e => aiInPeriod(e.date, p));
            if (!list.length) return '💸 لا توجد مصروفات في ' + aiPeriodName(p);
            const last = list.slice()
                .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
                .slice(0, 5)
                .map(e => '  • ' + (e.date || '—') + ' — ' + (e.desc || e.category || 'مصروف') + ': ' + formatCurrency(e.amount || 0))
                .join('\n');
            return '🕐 آخر المصروفات ' + aiPeriodName(p) + '\n' + last;
        }
    },

    // ====== الديون ======
    {
        id: 'debts', cat: 'debt',
        keywords: [
            'دين', 'ديون', 'مستحق', 'مدين', 'ديوني', 'شو ديوني',
            'مين مديون', 'كم ديوني', 'شو علي دين', 'شو لي دين',
            'ديون العملاء', 'ديون الموردين', 'لي ديون', 'علي ديون'
        ],
        needsClarify: true,
        clarifyOptions: ['ديون العملاء (لي)', 'ديون الموردين (علي)'],
        clarifyMap: {
            '1': 'debts_customers',
            '2': 'debts_suppliers',
            'لي': 'debts_customers',
            'العملاء': 'debts_customers',
            'مين مديون لي': 'debts_customers',
            'لي ديون': 'debts_customers',
            'ديون العملاء': 'debts_customers',
            'علي': 'debts_suppliers',
            'الموردين': 'debts_suppliers',
            'مين مديون علي': 'debts_suppliers',
            'للموردين': 'debts_suppliers',
            'ديون الموردين': 'debts_suppliers'
        }
    },
    {
        id: 'debts_customers', cat: 'debt',
        keywords: [],  // 🔧 فارغة — تُستدعى فقط بعد التوضيح
        handle: () => {
            const active = debts.filter(d => (d.amount - d.paid) > 0);
            if (!active.length) return '✅ لا توجد ديون مستحقة';
            const total = active.reduce((s, d) => s + (d.amount - d.paid), 0);
            const top = active.slice().sort((a,b) => (b.amount - b.paid) - (a.amount - a.paid))[0];
            return '💳 الديون المستحقة لك (من العملاء)\n' +
                   '💰 الإجمالي: ' + formatCurrency(total) + '\n' +
                   '👥 عدد المدينين: ' + active.length + '\n' +
                   '🏆 الأكبر: ' + top.name + ' (' + formatCurrency(top.amount - top.paid) + ')';
        }
    },
    {
        id: 'debts_suppliers', cat: 'debt',
        keywords: [],  // 🔧 فارغة — تُستدعى فقط بعد التوضيح
        handle: () => {
            const suppliers = (typeof suppliersList !== 'undefined' && Array.isArray(suppliersList))
                ? suppliersList.filter(s => (s.balance || 0) > 0)
                : [];
            if (!suppliers.length) return '✅ لا توجد ديون عليك للموردين';
            const total = suppliers.reduce((s, x) => s + (x.balance || 0), 0);
            const top = suppliers.slice().sort((a, b) => (b.balance || 0) - (a.balance || 0))[0];
            return '📥 الديون عليك (للموردين)\n' +
                   '💰 الإجمالي: ' + formatCurrency(total) + '\n' +
                   '👥 عدد الموردين: ' + suppliers.length + '\n' +
                   '🏆 الأكبر: ' + (top.name || 'غير معروف') + ' (' + formatCurrency(top.balance || 0) + ')';
        }
    },

    // ====== العملاء ======
    {
        id: 'customer_top', cat: 'customer',
        keywords: ['افضل عميل', 'احسن عميل', 'اكثر عميل', 'شراء', 'اشترى', 'اشترى اكثر', 'اكثر شراء', 'زبون اكثر', 'افضل زبون', 'احسن زبون', 'مين اشترى', 'مين اشترى اكثر'],
        handle: (q, p) => {
            const map = {};
            sales.filter(s => !s.isRetail && s.customer && aiInPeriod(s.date, p))
                 .forEach(s => { map[s.customer] = (map[s.customer] || 0) + _saleAmt(s); });
            const entries = Object.entries(map).sort((a,b) => b[1] - a[1]);
            if (!entries.length) return '👥 لا يوجد عملاء في ' + aiPeriodName(p);
            const top3 = entries.slice(0, 3).map((x, i) => '  ' + (i+1) + '. ' + x[0] + ': ' + formatCurrency(x[1])).join('\n');
            return '👑 أفضل العملاء — ' + aiPeriodName(p) + '\n' + top3;
        }
    },

    // ====== المواد ======
    {
        id: 'material_top', cat: 'material',
        keywords: ['افضل ماده', 'اكثر ماده', 'اكثر مبيعا', 'افضل منتج', 'اكثر ماد', 'اكثر ماد مبيع', 'ماد مبيع', 'ماد'],
        handle: (q, p) => {
            const map = {};
            sales.filter(s => !s.isRetail && aiInPeriod(s.date, p))
                 .forEach(s => (s.items || []).forEach(it => {
                     map[it.materialName] = (map[it.materialName] || 0) + (it.qty || 0);
                 }));
            const entries = Object.entries(map).sort((a,b) => b[1] - a[1]);
            if (!entries.length) return '📦 لا توجد مبيعات مواد في ' + aiPeriodName(p);
            const top5 = entries.slice(0, 5).map((x, i) => '  ' + (i+1) + '. ' + x[0] + ': ' + x[1]).join('\n');
            return '🏆 المواد الأكثر مبيعاً — ' + aiPeriodName(p) + '\n' + top5;
        }
    },
    {
        id: 'material_low', cat: 'material',
        keywords: ['مواد منخفضه', 'ناقص', 'تحت الحد', 'نقص المخزون', 'مخزون منخفض', 'انخفض', 'انخفضت', 'ماده قليله', 'قليل', 'قليله', 'شو ناقص', 'شو قليل'],
        handle: () => {
            const low = materials.filter(m => (m.stock || 0) < (m.minStock || 0));
            if (!low.length) return '✅ لا توجد مواد تحت الحد الأدنى';
            const list = low.map(m => '  ⚠️ ' + m.name + ': ' + m.stock + ' (الحد: ' + m.minStock + ')').join('\n');
            return '🚨 مواد تحت الحد الأدنى (' + low.length + ')\n' + list;
        }
    },

    // ====== المخزون ======
    {
        id: 'stock_value', cat: 'stock',
        keywords: ['قيمه المخزون', 'راس المال', 'قيمه المواد', 'مخزون'],
        handle: () => {
            const totalSYP = materials.reduce((s, m) => s + ((m.stock || 0) * (m.costSYP || 0)), 0);
            return '📦 قيمة المخزون\n' +
                   '💰 بالليرة السورية: ' + formatCurrency(totalSYP) + '\n' +
                   '📊 عدد الأصناف: ' + materials.length;
        }
    },

    // ====== الصندوق ======
    {
        id: 'cash', cat: 'cash',
        keywords: ['صندوق', 'كاش', 'النقد', 'المال المتوفر'],
        handle: () => {
            const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache))
                ? _pbCache
                : [];
            if (!boxes.length) {
                return '💵 الصناديق غير محمّلة بعد\n' +
                       '💡 افتح صفحة "الصناديق" مرة واحدة لتحميلها';
            }
            let total = 0;
            const lines = boxes.map(b => {
                const bal = parseFloat(b.balance) || 0;
                total += bal;
                return '  ' + (b.icon || '💰') + ' ' + (b.name || '—') + ': ' + formatCurrency(bal);
            }).join('\n');
            return '💵 الصناديق\n' + lines + '\n' +
                   '━━━━━━━━━━━━\n' +
                   '💰 الإجمالي: ' + formatCurrency(total);
        }
    },

    // ====== نصائح ======
    {
        id: 'advice_profit', cat: 'advice',
        keywords: ['زياده ارباح', 'زياده الربح', 'تحسين الارباح', 'كيف اربح', 'وضع يوم', 'وضع', 'وضعي'],
        handle: () => {
            const tips = [];
            const low = materials.filter(m => (m.stock||0) < (m.minStock||0));
            if (low.length) tips.push('• لديك ' + low.length + ' مواد تحت الحد — أعد الطلب قبل النفاد');
            const inactive = {};
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
            sales.forEach(s => { if (s.customer) inactive[s.customer] = true; });
            if (Object.keys(inactive).length > 5) tips.push('• راجع العملاء الخاملين — تواصل معهم بعروض');
            const totalExp = expenses.reduce((s, x) => s + (x.amount||0), 0);
            const totalSales = sales.filter(s => !s.isRetail).reduce((s, x) => s + _saleAmt(x), 0);
            if (totalSales > 0 && totalExp / totalSales > 0.3) tips.push('• مصروفاتك تشكل ' + Math.round(totalExp/totalSales*100) + '% من المبيعات — حاول التقليل');
            if (!tips.length) tips.push('• مبيعاتك في وضع جيد — استمر!');
            return '💡 نصائح لزيادة الأرباح:\n' + tips.join('\n');
        }
    },

    // ====== ترحيب ======
    {
        id: 'greeting', cat: 'meta',
        keywords: ['مرحبا', 'اهلا', 'السلام عليكم', 'هلا', 'صباح'],
        handle: () => 'أهلاً بك! 👋\nأنا مساعدك الذكي. جرب:\n' +
                       '• مبيعات اليوم\n• أرباح الشهر\n• أفضل عميل\n• مواد منخفضة'
    },
    {
        id: 'thanks', cat: 'meta',
        keywords: ['شكرا', 'مشكور', 'الله يعطيك'],
        handle: () => 'العفو! 🌟 أنا هنا دائماً للمساعدة.'
    },
    {
        id: 'alerts_check', cat: 'alerts',
        keywords: ['تنبيهات', 'تنبيه', 'اخطارات', 'تحذيرات', 'شو في جديد', 
                   'في مشاكل', 'مشاكل', 'خطر', 'تحذير'],
        handle: async () => {
            if (typeof aiGetActiveAlerts !== 'function') {
                return '⚠️ ميزة التنبيهات غير محمّلة';
            }
            
            try {
                // جلب من Firestore أولاً
                let alerts = await aiGetActiveAlerts();
                
                // لو ما في — نُشغّل فحص فوري
                if (!alerts || alerts.length === 0) {
                    if (typeof aiRunAlertsCheck === 'function') {
                        const result = await aiRunAlertsCheck(true);
                        if (result.alerts && result.alerts.length > 0) {
                            alerts = result.alerts;
                        }
                    }
                }
                
                if (typeof aiFormatAlerts !== 'function') {
                    return '⚠️ مشكلة في تنسيق التنبيهات';
                }
                
                return aiFormatAlerts(alerts);
            } catch(e) {
                console.warn('[ai-alerts] handle:', e.message);
                return '⚠️ خطأ في جلب التنبيهات';
            }
        }
    },

    // ====== التنبؤ ======
    {
        id: 'predict_sales', cat: 'predict',
        keywords: ['توقع مبيعات', 'توقع المبيعات', 'مبيعات غداً', 'توقعات مبيعات', 'تنبؤ', 'رح ابيع غدا', 'ابيع غدا'],
        handle: () => {
            if (typeof aiPredictFormatSales !== 'function') return '⚠️ ميزة التنبؤ غير محمّلة';
            return aiPredictFormatSales();
        }
    },
    {
        id: 'predict_inventory', cat: 'predict',
        keywords: ['رح ينفد', 'خطر النفاد', 'توقع مخزون', 'متى ينفد', 'ينفد', 'مخزون خطر', 'مواد ناقصة'],
        handle: () => {
            if (typeof aiPredictFormatInventory !== 'function') return '⚠️ ميزة التنبؤ غير محمّلة';
            return aiPredictFormatInventory();
        }
    },
    {
        id: 'predict_cash', cat: 'predict',
        keywords: [
            'توقع رصيد', 'رصيد متوقع', 'توقع رصيدي', 'رصيدي بعد', 'تدفق نقدي',
            'توقع سيوله', 'سيوله', 'كاش متوقع', 'رصيد بعد',
            'توقع السيولة', 'السيولة', 'توقع الكاش', 'توقع النقد', 'سيولة'
        ],
        handle: () => {
            if (typeof aiPredictFormatCashFlow !== 'function') return '⚠️ ميزة التنبؤ غير محمّلة';
            return aiPredictFormatCashFlow(7);
        }
    }
];

// 🌐 تصدير AI_INTENTS عالمياً (للتدريب + محرك المعرفة)
if (typeof window !== 'undefined') {
    window.AI_INTENTS = AI_INTENTS;
}

// ============================================================
//  4. كشف النية
// ============================================================
function aiDetectIntent(question) {
    const n = aiNorm(question);
    if (!n) return null;
    
    const normWords = n.split(/\s+/).filter(w => w.length > 1);
    
    let best = null, bestScore = 0, bestBD = null;
    
    for (const intent of AI_INTENTS) {
        let score = 0;
        const bd = { exact: 0, part: 0 };
        
        for (const kw of intent.keywords) {
            const kwn = aiNorm(kw);
            if (!kwn) continue;
            
            const kwWords = kwn.split(/\s+/);
            
            if (kwWords.length > 1) {
                if (n.includes(kwn)) { score += 3; bd.exact += 3; }
            } else {
                const kwWord = kwWords[0];
                for (const w of normWords) {
                    if (w === kwWord) { score += 2; bd.exact += 2; break; }
                    if (w.length > 3 && kwWord.length > 3 && 
                        (w.includes(kwWord) || kwWord.includes(w))) {
                        score += 1; bd.part += 1; break;
                    }
                }
            }
        }
        
        if (score > bestScore) {
            bestScore = score;
            best = intent;
            bestBD = bd;
        }
    }
    
    if (best) {
        best._lastScore = bestScore;
        best._lastBreakdown = bestBD;
    }
    
    return bestScore >= 1 ? best : null;
}

// ============================================================
//  5. المعالج الرئيسي
// ============================================================
// ============================================================
//  6.5 التعلّمات المخصصة (من لوحة الإدارة)
// ============================================================
let AI_CUSTOM_LEARNINGS = [];

async function aiLoadCustomLearnings() {
    try {
        if (typeof db === 'undefined' || !db) return;
        const snap = await db.collection('ai_learnings').get();
        AI_CUSTOM_LEARNINGS = [];
        snap.forEach(function(d) {
            AI_CUSTOM_LEARNINGS.push(Object.assign({ id: d.id }, d.data()));
        });
        console.log('🎓 [AI] تم تحميل ' + AI_CUSTOM_LEARNINGS.length + ' تعلّم مخصص');
    } catch (e) {
        console.warn('AI learnings load failed:', e);
    }
}

function aiCheckCustomLearnings(question) {
    if (!AI_CUSTOM_LEARNINGS.length) return null;
    const n = aiNorm(question);
    for (let i = 0; i < AI_CUSTOM_LEARNINGS.length; i++) {
        const learning = AI_CUSTOM_LEARNINGS[i];
        // إذا كان الرد مخصص — نطابق الكلمات المفتاحية
        if (learning.action === 'custom' && Array.isArray(learning.keywords)) {
            for (let j = 0; j < learning.keywords.length; j++) {
                const kw = learning.keywords[j];
                if (kw && n.includes(aiNorm(kw))) {
                    return learning.custom_response;
                }
            }
        }
    }
    return null;
}

async function answerAIQuestion(question) {
    try {
        // ═══════════════════════════════════════════════════
        // 🧠 [ai-context] توسيع السؤال من السياق (إن وُجد)
        // ═══════════════════════════════════════════════════
        let ctxInfo = null;
        if (typeof aiCtxExpand === 'function') {
            try {
                ctxInfo = aiCtxExpand(question);
                if (ctxInfo && ctxInfo.isFromContext) {
                    console.log('🧠 [ai-context] توسيع:', {
                        original: question,
                        expanded: ctxInfo.question,
                        intentId: ctxInfo.intentId,
                        period: ctxInfo.period,
                        type: ctxInfo.correction ? 'correction' 
                            : (ctxInfo.confirmed ? 'confirm' 
                            : (ctxInfo.followUp ? 'followup' : 'context'))
                    });
                    
                    // 🤔 معالجة إجابة التوضيح (clarify)
                    if (ctxInfo.resolvedClarification && ctxInfo.intentId) {
                        const _clIntent = AI_INTENTS.find(i => i.id === ctxInfo.intentId);
                        if (_clIntent && typeof _clIntent.handle === 'function') {
                            const _clPeriod = ctxInfo.period || (typeof aiPeriod === 'function' ? aiPeriod(question) : 'all');
                            console.log('🎯 [clarify] تنفيذ بعد توضيح:', ctxInfo.intentId);
                            const _clResponse = await _clIntent.handle(question, _clPeriod);

                            if (typeof aiCtxSetAnswered === 'function') {
                                try {
                                    aiCtxSetAnswered(question, ctxInfo.intentId, _clPeriod, _clResponse);
                                } catch(e) {}
                            }
                            return _clResponse;
                        }
                    }

                    // متابعة فترة ("وبالأمس؟" / "نفس الشي للشهر؟") → نفّذ مباشرة
                    if ((ctxInfo.followUp || ctxInfo.confirmed || ctxInfo.sameThing) && ctxInfo.intentId) {
                        const ctxIntent = AI_INTENTS.find(i => i.id === ctxInfo.intentId);
                        if (ctxIntent && typeof ctxIntent.handle === 'function') {
                            const period = ctxInfo.period || aiPeriod(ctxInfo.question);
                            console.log('🎯 [ai-context] تنفيذ مباشر:', ctxInfo.intentId, '| الفترة:', period);
                            
                            const response = await ctxIntent.handle(ctxInfo.question, period);
                            
                            // حفظ السياق
                            if (typeof aiCtxSetAnswered === 'function') {
                                try {
                                    aiCtxSetAnswered(ctxInfo.question, ctxInfo.intentId, period, response);
                                } catch(e) { console.warn('[ai-context] save:', e.message); }
                            }
                            
                            return response;
                        }
                    }
                }
            } catch(e) {
                console.warn('[ai-context] expand:', e.message);
            }
        }

        // 🔮 [predict] استخدام aiScoreIntent أولاً (للتنبؤ + الدرجات)
        if (typeof aiScoreIntent === 'function') {
            try {
                const _scoreResult = aiScoreIntent(question);
                if (_scoreResult && _scoreResult.action === 'execute' && _scoreResult.intent) {
                    // 🤔 [clarify] إذا النية تحتاج توضيحاً
                    if (_scoreResult.intent.needsClarify && _scoreResult.intent.clarifyOptions) {
                        const _ctxCheck = typeof aiCtxGet === 'function' ? aiCtxGet() : null;
                        if (!_ctxCheck || _ctxCheck.pendingType !== 'clarify') {
                            console.log('🤔 [clarify] توضيح مطلوب:', _scoreResult.intent.id);
                            return await aiClarify(_scoreResult.intent, question);
                        }
                    }

                    // نتحقق من intent يحتاج handle() جديد
                    const _intent = _scoreResult.intent;
                    if (typeof _intent.handle === 'function') {
                        console.log('🎯 [predict] تنفيذ مباشر:', _intent.id);
                        const _period = typeof aiPeriod === 'function' ? aiPeriod(question) : 'all';
                        const _response = await _intent.handle(question, _period);
                        
                        // حفظ السياق
                        if (typeof aiCtxSetAnswered === 'function') {
                            try {
                                aiCtxSetAnswered(question, _intent.id, _period, _response);
                            } catch(e) {}
                        }
                        
                        return _response;
                    }
                }
            } catch(e) {
                console.warn('[predict] score:', e.message);
            }
        }

        // 🧠 جرّب المحرك الجديد (ai-engine) أولاً
        if (typeof aiEngineRespond === 'function') {
            try {
                const _engReply = await aiEngineRespond(question);
                if (_engReply) {
                    console.log('🧠 [ai-engine] ردّ:', question.substring(0, 30));
                    
                    // 🔄 حفظ السياق بعد رد ai-engine
                    if (typeof aiCtxSetAnswered === 'function' && typeof aiDetectIntent === 'function') {
                        try {
                            const _engIntent = aiDetectIntent(question);
                            const _engPeriod = typeof aiPeriod === 'function' ? aiPeriod(question) : 'all';
                            if (_engIntent) {
                                aiCtxSetAnswered(question, _engIntent.id, _engPeriod, _engReply);
                                console.log('🧠 [ai-context] محفوظ (engine):', _engIntent.id, '| الفترة:', _engPeriod);
                            }
                        } catch(e) { console.warn('[ai-context] engine save:', e.message); }
                    }
                    
                    return _engReply;
                }
            } catch(_e) {
                console.warn('[ai-engine] fallback:', _e.message);
            }
        }

        // ✅ نظام الدرجات المتقدم (ai-scoring)
        let intent = null;
        let scoreResult = null;
        
        if (typeof aiScoreIntent === 'function') {
            scoreResult = aiScoreIntent(question);
            
            if (scoreResult && scoreResult.action === 'execute' && scoreResult.intent) {
                // ثقة عالية → نفّذ مباشرة
                intent = scoreResult.intent;
                console.log('🎯 [ai-scoring] execute:', intent.id, '| score:', scoreResult.score.toFixed(1));
            } else if (scoreResult && scoreResult.action === 'clarify' && scoreResult.intent) {
                // ثقة متوسطة → ننفّذ مع تسجيل ملاحظة
                intent = scoreResult.intent;
                console.log('⚠️ [ai-scoring] clarify:', intent.id, '| normalized:', scoreResult.normalized);
            } else {
                // fallback للطريقة القديمة
                intent = aiDetectIntent(question);
                if (intent) console.log('🔙 [fallback] aiDetectIntent:', intent.id);
            }
        } else {
            intent = aiDetectIntent(question);
        }
        
        if (!intent) {
            // 🆕 جرّب التعلّمات المخصصة أولاً
            const custom = aiCheckCustomLearnings(question);
            if (custom) {
                return custom;
            }
            aiLogUnmatched(question);
            return '⚡ المساعد في مرحلة التعلم\n' +
                   '\n' +
                   'اسأل عن:\n' +
                   '  • 💰 مبيعات اليوم\n' +
                   '  • 📈 أرباح الشهر\n' +
                   '  • 👑 أفضل عميل\n' +
                   '  • 🚨 المواد المنخفضة\n' +
                   '  • 💳 الديون\n' +
                   '  • 💵 الصندوق\n' +
                   '\n' +
                   '💡 ملاحظتك ستُساعدني على التحسن';
        }
        const period = aiPeriod(question);
        const response = await intent.handle(question, period);
        
        // 🧠 [ai-context] حفظ السياق للاستخدام المستقبلي
        if (typeof aiCtxSetAnswered === 'function') {
            try {
                aiCtxSetAnswered(question, intent.id, period, response);
                console.log('🧠 [ai-context] محفوظ:', intent.id, '| الفترة:', period);
            } catch(e) {
                console.warn('[ai-context] save:', e.message);
            }
        }
        
        return response;
    } catch (e) {
        console.error('[AI] error:', e);
        return '⚠️ حدث خطأ أثناء المعالجة. حاول مرة أخرى.';
    }
}

// ============================================================
//  6. تسجيل الأسئلة غير المفهومة (للتعلم)
// ============================================================
function aiLogUnmatched(question) {
    try {
        if (typeof db === 'undefined' || !db || typeof auth === 'undefined') return;
        const uid = auth.currentUser && auth.currentUser.uid;
        if (!uid) return;

        const norm = aiNorm(question).slice(0, 200);
        if (!norm) return;

        // إنشاء hash بسيط من النص المُطبّع
        let hash = 0;
        for (let i = 0; i < norm.length; i++) {
            hash = ((hash << 5) - hash) + norm.charCodeAt(i);
            hash = hash & hash;
        }
        const docId = 'p_' + Math.abs(hash).toString(36);

        const ref = db.collection('ai_patterns').doc(docId);

        ref.get().then(function(snap) {
            if (snap.exists) {
                // ✅ السؤال موجود → زيادة العدّاد + إضافة المستخدم
                const data = snap.data();
                const users = data.user_uids || [];
                if (users.indexOf(uid) === -1) users.push(uid);
                ref.update({
                    asked_count: (data.asked_count || 1) + 1,
                    user_uids: users.slice(-50),
                    last_asked: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(function() {});
            } else {
                // 🆕 سؤال جديد
                ref.set({
                    question: String(question).slice(0, 200),
                    normalized: norm,
                    asked_count: 1,
                    user_uids: [uid],
                    status: 'pending',
                    first_asked: firebase.firestore.FieldValue.serverTimestamp(),
                    last_asked: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(function() {});
            }
        }).catch(function() {});
    } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
//  🤔 AI CLARIFY — سؤال توضيحي عند الغموض
// ═══════════════════════════════════════════════════════════════
async function aiClarify(intent, question) {
    if (!intent || !intent.clarifyOptions || !intent.clarifyOptions.length) return null;

    // حفظ السياق
    if (typeof aiCtxSetClarify === 'function') {
        try {
            aiCtxSetClarify(intent.clarifyOptions, intent.id);
        } catch(e) {
            console.warn('[aiClarify] save:', e.message);
        }
    }

    // بناء الرد
    let text = '🤔 سؤالك يحتمل أكثر من معنى:\n\n';
    intent.clarifyOptions.forEach((opt, i) => {
        text += '  ' + (i + 1) + '. ' + opt + '\n';
    });
    text += '\n💡 اكتب أحد الخيارين لأساعدك بدقة';

    return text;
}

window.aiClarify = aiClarify;

// 🚫 [ALMUDIR] الاقتراحات السريعة محذوفة (بناءً على طلب المستخدم)

console.log('🤖 [ai-assistant] جاهز — ' + AI_INTENTS.length + ' intent');

// تحميل التعلّمات المخصصة عند بدء التطبيق
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(aiLoadCustomLearnings, 1500);
    setTimeout(aiLoadCustomLearnings, 4000);
});

// إعادة التحميل عند تسجيل الدخول
if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(function(user) {
        if (user) {
            setTimeout(aiLoadCustomLearnings, 1000);
        }
    });
}
