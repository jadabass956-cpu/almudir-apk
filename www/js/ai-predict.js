// ============================================================
//  🔮 AI PREDICT — التنبؤ الإحصائي الخفيف
//  Weighted Moving Average + Confidence + Inventory
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. HELPERS — أدوات مساعدة
// ═══════════════════════════════════════════════════════════
const AI_PREDICT = {
    minDaysForPrediction: 7,
    minDaysForGoodPrediction: 30,
    confidenceThreshold: 0.15,   // variance
    predictionCache: new Map(),
    cacheTTL: 60 * 1000          // دقيقة
};

function _aiPredictToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function _aiPredictDateStr(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * يحسب مجموع مبيعات آخر N يوم
 */
function _aiSumSalesLastDays(days, includeRetail) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return 0;
    
    const today = _aiPredictToday();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days + 1);
    const fromStr = _aiPredictDateStr(fromDate);
    
    return sales
        .filter(s => {
            if (!includeRetail && s.isRetail) return false;
            return s.date >= fromStr;
        })
        .reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
}

/**
 * يحسب مجموع مصروفات آخر N يوم
 */
function _aiSumExpensesLastDays(days) {
    if (typeof expenses === 'undefined' || !Array.isArray(expenses)) return 0;
    
    const today = _aiPredictToday();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days + 1);
    const fromStr = _aiPredictDateStr(fromDate);
    
    return expenses
        .filter(e => e.date >= fromStr)
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
}

/**
 * يحسب مجموع مبيعات نهار مُعيّن (0=الأحد, 6=السبت)
 */
function _aiSumSalesByDayOfWeek(dow, weeks, includeRetail) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return [];
    
    const today = _aiPredictToday();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - (weeks * 7));
    const fromStr = _aiPredictDateStr(fromDate);
    
    // جميع الفواتير في الفترة
    const filtered = sales.filter(s => {
        if (!includeRetail && s.isRetail) return false;
        if (s.date < fromStr) return false;
        const d = new Date(s.date);
        return d.getDay() === dow;
    });
    
    // مجموعة قيم يومية
    const byDate = {};
    filtered.forEach(s => {
        byDate[s.date] = (byDate[s.date] || 0) + (parseFloat(s.total) || 0);
    });
    
    return Object.values(byDate);
}

/**
 * المتوسط
 */
function _aiAvg(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ═══════════════════════════════════════════════════════════
//  2. CONFIDENCE — حساب الثقة
// ═══════════════════════════════════════════════════════════
function _aiConfidence(avg3, avg7, avg30) {
    if (avg30 === 0) return { level: 'none', variance: 0, score: 0 };
    
    const v1 = Math.abs(avg3 - avg30) / avg30;
    const v2 = Math.abs(avg7 - avg30) / avg30;
    const variance = Math.max(v1, v2);
    
    let level = 'low';
    let score = 0.4;
    
    if (variance < 0.15) {
        level = 'high';
        score = 0.85;
    } else if (variance < 0.40) {
        level = 'medium';
        score = 0.65;
    }
    
    return { level, variance: parseFloat(variance.toFixed(3)), score };
}

// ═══════════════════════════════════════════════════════════
//  3. PREDICT SALES — تنبؤ المبيعات
// ═══════════════════════════════════════════════════════════
/**
 * تنبؤ مبيعات الغد
 * @returns {Object} { prediction, lowerBound, upperBound, confidence, ... }
 */
function aiPredictTomorrow() {
    // 1) متوسطات آخر 3/7/30 يوم
    const sum3  = _aiSumSalesLastDays(3);
    const sum7  = _aiSumSalesLastDays(7);
    const sum30 = _aiSumSalesLastDays(30);
    
    const avg3  = sum3 / 3;
    const avg7  = sum7 / 7;
    const avg30 = sum30 / 30;
    
    // 2) هل البيانات كافية؟
    const daysAvailable = _aiDataDaysAvailable();
    if (daysAvailable < AI_PREDICT.minDaysForPrediction) {
        return {
            ok: false,
            reason: 'insufficient_data',
            message: `أحتاج ${AI_PREDICT.minDaysForPrediction - daysAvailable} أيام إضافية على الأقل`,
            daysAvailable
        };
    }
    
    // 3) المتوسط المرجّح
    const weighted = (0.5 * avg3) + (0.3 * avg7) + (0.2 * avg30);
    
    // 4) Multiplier يوم الأسبوع (الغد)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dow = tomorrow.getDay();
    const dowValues = _aiSumSalesByDayOfWeek(dow, 8);
    const dowAvg = _aiAvg(dowValues);
    const dowMultiplier = (dowAvg > 0 && avg30 > 0) ? (dowAvg / avg30) : 1;
    
    // 5) التنبؤ النهائي
    const prediction = Math.round(weighted * dowMultiplier);
    
    // 6) نطاق الثقة (±15%)
    const spread = 0.15;
    const lowerBound = Math.round(prediction * (1 - spread));
    const upperBound = Math.round(prediction * (1 + spread));
    
    // 7) الثقة
    const confidence = _aiConfidence(avg3, avg7, avg30);
    
    return {
        ok: true,
        prediction,
        lowerBound,
        upperBound,
        confidence,
        breakdown: {
            avg3: Math.round(avg3),
            avg7: Math.round(avg7),
            avg30: Math.round(avg30),
            weighted: Math.round(weighted),
            dowMultiplier: parseFloat(dowMultiplier.toFixed(2)),
            dayName: _aiDayName(dow)
        }
    };
}

/**
 * عدد الأيام المتوفرة في المبيعات
 */
function _aiDataDaysAvailable() {
    if (typeof sales === 'undefined' || !Array.isArray(sales) || sales.length === 0) return 0;
    
    // أقدم تاريخ
    const dates = sales.map(s => s.date).filter(d => d).sort();
    if (dates.length === 0) return 0;
    
    const oldest = new Date(dates[0]);
    const now = _aiPredictToday();
    const diff = Math.floor((now - oldest) / (1000 * 60 * 60 * 24));
    return Math.min(diff + 1, 365);
}

function _aiDayName(dow) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dow] || '—';
}

// ═══════════════════════════════════════════════════════════
//  4. INVENTORY PREDICTION — تنبؤ المخزون
// ═══════════════════════════════════════════════════════════
/**
 * يحسب معدل الاستهلاك اليومي لمادة
 */
function _aiAvgDailyUsage(materialId, days) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return 0;
    
    const today = _aiPredictToday();
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - days + 1);
    const fromStr = _aiPredictDateStr(fromDate);
    
    let totalQty = 0;
    sales.forEach(s => {
        if (s.date < fromStr) return;
        if (!Array.isArray(s.items)) return;
        s.items.forEach(it => {
            if (it.materialId === materialId) {
                totalQty += parseFloat(it.qty) || 0;
            }
        });
    });
    
    return totalQty / days;
}

/**
 * تنبؤ استنفاد المخزون لكل مادة
 * @param {Number} limit - عدد النتائج (افتراضي 10)
 */
function aiPredictInventory(limit) {
    limit = limit || 10;
    if (typeof materials === 'undefined' || !Array.isArray(materials)) return [];
    
    const results = materials.map(m => {
        const dailyUse = _aiAvgDailyUsage(m.id, 30);
        const stock = parseFloat(m.stock) || 0;
        
        if (dailyUse === 0) {
            return {
                materialId: m.id,
                materialName: m.name,
                stock,
                dailyUse: 0,
                daysLeft: Infinity,
                needsReorder: false,
                status: 'stable'
            };
        }
        
        const daysLeft = Math.round(stock / dailyUse);
        const reorderPoint = Math.round(dailyUse * 7 + 5); // 7 أيام + أمان
        const needsReorder = stock < reorderPoint;
        
        let status = 'good';
        if (daysLeft <= 3) status = 'critical';
        else if (daysLeft <= 7) status = 'warning';
        else if (daysLeft <= 14) status = 'attention';
        
        return {
            materialId: m.id,
            materialName: m.name,
            stock,
            dailyUse: parseFloat(dailyUse.toFixed(2)),
            daysLeft,
            reorderPoint,
            needsReorder,
            status
        };
    });
    
    // ترتيب حسب الأيام المتبقية
    results.sort((a, b) => a.daysLeft - b.daysLeft);
    
    return results.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════
//  5. CASH FLOW PREDICTION — تنبؤ التدفق
// ═══════════════════════════════════════════════════════════
function aiPredictCashFlow(days) {
    days = days || 7;
    
    const avgSales = _aiSumSalesLastDays(30) / 30;
    const avgExpenses = _aiSumExpensesLastDays(30) / 30;
    
    const expectedIn = Math.round(avgSales * days);
    const expectedOut = Math.round(avgExpenses * days);
    const netChange = expectedIn - expectedOut;
    
    // الرصيد الحالي
    let currentBalance = 0;
    if (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) {
        currentBalance = _pbCache.reduce((s, b) => s + (parseFloat(b.balance) || 0), 0);
    }
    
    const predictedBalance = currentBalance + netChange;
    
    return {
        currentBalance,
        days,
        expectedIn,
        expectedOut,
        netChange,
        predictedBalance,
        trend: netChange > 0 ? 'positive' : (netChange < 0 ? 'negative' : 'stable')
    };
}

// ═══════════════════════════════════════════════════════════
//  6. FIRESTORE — حفظ التنبؤات
// ═══════════════════════════════════════════════════════════
async function aiSavePrediction(type, prediction) {
    if (typeof db === 'undefined' || !db) return false;
    if (typeof auth === 'undefined' || !auth.currentUser) return false;
    
    try {
        const uid = auth.currentUser.uid;
        
        await db.collection('users').doc(uid)
            .collection('ai_predictions').add({
                type,
                target: 'tomorrow',
                prediction: prediction.prediction || 0,
                lowerBound: prediction.lowerBound || 0,
                upperBound: prediction.upperBound || 0,
                confidence: prediction.confidence?.level || 'low',
                confidenceScore: prediction.confidence?.score || 0,
                breakdown: prediction.breakdown || null,
                method: 'weighted_ma',
                basedOnDays: 30,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('💾 [ai-predict] محفوظ:', type);
        return true;
    } catch(e) {
        console.warn('[ai-predict] save:', e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
//  7. FORMAT — تنسيق للعرض
// ═══════════════════════════════════════════════════════════
function aiPredictFormatSales() {
    const r = aiPredictTomorrow();
    
    if (!r.ok) {
        return `🔮 لا أملك بيانات كافية لتوقع المبيعات.\n📊 ${r.message}`;
    }
    
    const _fmt = (n) => typeof formatCurrency === 'function' 
        ? formatCurrency(n) 
        : n.toLocaleString('ar-SY') + ' ل.س';
    
    const conf = r.confidence;
    const confEmoji = conf.level === 'high' ? '🟢' : (conf.level === 'medium' ? '🟡' : '🟠');
    const confText = conf.level === 'high' ? 'عالية' 
                   : conf.level === 'medium' ? 'متوسطة' : 'منخفضة';
    
    return `🔮 *توقع مبيعات ${r.breakdown.dayName}*\n\n` +
           `📊 النطاق المتوقع: ${_fmt(r.lowerBound)} — ${_fmt(r.upperBound)}\n` +
           `🎯 المتوسط: ${_fmt(r.prediction)}\n\n` +
           `📈 مبني على:\n` +
           `   • آخر 3 أيام: ${_fmt(r.breakdown.avg3)}\n` +
           `   • آخر 7 أيام: ${_fmt(r.breakdown.avg7)}\n` +
           `   • آخر 30 يوم: ${_fmt(r.breakdown.avg30)}\n\n` +
           `${confEmoji} الثقة: ${confText}`;
}

function aiPredictFormatInventory() {
    const list = aiPredictInventory(5);
    if (list.length === 0) return '📦 لا توجد بيانات كافية';
    
    let out = '📦 *توقع المخزون*\n\n';
    
    const critical = list.filter(m => m.status === 'critical');
    const warning = list.filter(m => m.status === 'warning');
    
    if (critical.length > 0) {
        out += '🔴 *حرج (≤ 3 أيام):*\n';
        critical.forEach(m => {
            out += `   • ${m.materialName}: ${m.daysLeft} يوم (${m.stock} متبقي)\n`;
        });
        out += '\n';
    }
    
    if (warning.length > 0) {
        out += '🟡 *تحذير (≤ 7 أيام):*\n';
        warning.forEach(m => {
            out += `   • ${m.materialName}: ${m.daysLeft} يوم\n`;
        });
        out += '\n';
    }
    
    if (critical.length === 0 && warning.length === 0) {
        out += '✅ جميع المواد بحالة جيدة\n';
    }
    
    return out;
}

function aiPredictFormatCashFlow(days) {
    const r = aiPredictCashFlow(days);
    
    const _fmt = (n) => typeof formatCurrency === 'function' 
        ? formatCurrency(n) 
        : n.toLocaleString('ar-SY') + ' ل.س';
    
    const trendEmoji = r.trend === 'positive' ? '📈' : (r.trend === 'negative' ? '📉' : '➡️');
    
    return `💵 *توقع التدفق النقدي (${r.days} أيام)*\n\n` +
           `💰 الرصيد الحالي: ${_fmt(r.currentBalance)}\n\n` +
           `📥 متوقع داخل: ${_fmt(r.expectedIn)}\n` +
           `📤 متوقع خارج: ${_fmt(r.expectedOut)}\n` +
           `━━━━━━━━━━━━\n` +
           `${trendEmoji} التغيير: ${_fmt(r.netChange)}\n` +
           `🎯 الرصيد المتوقع: ${_fmt(r.predictedBalance)}`;
}

// ═══════════════════════════════════════════════════════════
//  8. EXPORT
// ═══════════════════════════════════════════════════════════
window.aiPredictTomorrow = aiPredictTomorrow;
window.aiPredictInventory = aiPredictInventory;
window.aiPredictCashFlow = aiPredictCashFlow;
window.aiPredictFormatSales = aiPredictFormatSales;
window.aiPredictFormatInventory = aiPredictFormatInventory;
window.aiPredictFormatCashFlow = aiPredictFormatCashFlow;
window.aiSavePrediction = aiSavePrediction;

console.log('🔮 [ai-predict] v1.0.0 محمّل');
