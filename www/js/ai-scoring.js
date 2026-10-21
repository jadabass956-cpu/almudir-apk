// ============================================================
//  🎯 AI SCORING — نظام الدرجات المتقدم
//  Keyword Strength + Match Types + Context + Historical
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. KEYWORD STRENGTH — قوة الكلمات
// ═══════════════════════════════════════════════════════════
const AI_STRENGTH = {
    high: 10,    // كلمات مميزة (صندوق، عمولة، ضريبة)
    medium: 5,   // كلمات شائعة (مبيع، ربح، دين)
    low: 2       // كلمات عامة (وضع، ملخص، إجمالي)
};

// تصنيف الكلمات
const AI_KEYWORD_LEVELS = {
    high: new Set([
        'صندوق', 'صناديق', 'عمولة', 'ضريبة', 'اشتراك',
        'مسحوبات', 'إتلاف', 'إتلافات', 'مستودع', 'مستودعات',
        'تحويل', 'تحويلات', 'فاتورة', 'فواتير', 'مورد',
        'مصروف', 'مصروفات', 'مشتريات', 'شراء'
    ]),
    medium: new Set([
        'مبيع', 'مبيعات', 'بيع', 'ربح', 'أرباح', 'خسارة',
        'دين', 'ديون', 'عميل', 'عملاء', 'مادة', 'مواد',
        'مخزون', 'مخزن', 'رصيد', 'أرصدة', 'سعر', 'أسعار'
    ]),
    low: new Set([
        'وضع', 'ملخص', 'إجمالي', 'أفضل', 'أكثر', 'فترة',
        'تاريخ', 'مستخدم', 'مستخدمين', 'كمية', 'كميات'
    ]),
    // ✅ FIX-PREDICT: كلمات التنبؤ (قوة عالية)
    predict: new Set([
        'توقع', 'توقعات', 'تنبؤ', 'اتوقع', 'سيولة', 'تدفق', 'ينفد'
    ])
};

// ═══════════════════════════════════════════════════════════
//  2. MATCH TYPES — أنواع المطابقة
// ═══════════════════════════════════════════════════════════
const AI_MATCH_WEIGHTS = {
    exact: 1.5,      // مطابقة تامة
    word: 1.3,       // مطابقة كلمة كاملة
    startsWith: 1.2, // يبدأ بـ
    includes: 1.0    // يحتوي
};

// ═══════════════════════════════════════════════════════════
//  3. THRESHOLDS — الحدود
// ═══════════════════════════════════════════════════════════
const AI_THRESHOLDS = {
    execute: 0.65,   // ✅ 0.75 → 0.65
    clarify: 0.40,   // ✅ 0.45 → 0.40
    log: 0.20
};

// ═══════════════════════════════════════════════════════════
//  4. CONTEXT MEMORY — ذاكرة السياق
// ═══════════════════════════════════════════════════════════
const _aiContext = {
    lastIntent: null,
    lastPeriod: null,
    lastCategory: null,
    lastScore: 0,
    timestamp: 0
};

// تخزين السياق
function aiSetContext(intent, period) {
    if (!intent) return;
    _aiContext.lastIntent = intent.id;
    _aiContext.lastCategory = intent.cat;
    _aiContext.lastPeriod = period;
    _aiContext.lastScore = intent._lastScore || 0;
    _aiContext.timestamp = Date.now();
}

// قراءة السياق
function aiGetContext() {
    // انتهت صلاحية السياق بعد 5 دقائق
    if (Date.now() - _aiContext.timestamp > 5 * 60 * 1000) {
        return null;
    }
    return { ..._aiContext };
}

// ═══════════════════════════════════════════════════════════
//  5. HISTORY — نجاح تاريخي
// ═══════════════════════════════════════════════════════════
const _aiHistory = new Map(); // intentId → { success, attempts }

function aiRecordHistory(intentId, success) {
    if (!_aiHistory.has(intentId)) {
        _aiHistory.set(intentId, { success: 0, attempts: 0 });
    }
    const h = _aiHistory.get(intentId);
    h.attempts++;
    if (success) h.success++;
}

function aiGetHistoryBonus(intentId) {
    const h = _aiHistory.get(intentId);
    if (!h || h.attempts < 3) return 0;
    const rate = h.success / h.attempts;
    if (rate >= 0.8) return 1.5;
    if (rate >= 0.5) return 0.5;
    return 0;
}

// ═══════════════════════════════════════════════════════════
//  6. KEYWORD MATCHING — حساب درجة الكلمة
// ═══════════════════════════════════════════════════════════
function _aiKeywordStrength(kw) {
    const n = typeof aiNorm2 === 'function' ? aiNorm2(kw) : kw;
    if (AI_KEYWORD_LEVELS.predict?.has(n)) return AI_STRENGTH.high;  // ✅ predict عالية
    if (AI_KEYWORD_LEVELS.high.has(n))   return AI_STRENGTH.high;
    if (AI_KEYWORD_LEVELS.medium.has(n)) return AI_STRENGTH.medium;
    if (AI_KEYWORD_LEVELS.low.has(n))    return AI_STRENGTH.low;
    return n.length >= 5 ? AI_STRENGTH.medium : AI_STRENGTH.low;
}

function _aiMatchKeyword(queryWords, queryNorm, kw) {
    const kwn = typeof aiNorm2 === 'function' ? aiNorm2(kw) : kw;
    if (!kwn) return 0;
    
    const kwWords = kwn.split(/\s+/).filter(w => w.length > 1);
    if (kwWords.length === 0) return 0;
    
    const strength = _aiKeywordStrength(kw);
    
    // كلمة مركبة (مثل: "عدد الفواتير")
    if (kwWords.length > 1) {
        if (queryNorm.includes(kwn)) {
            return strength * AI_MATCH_WEIGHTS.exact;
        }
        return 0;
    }
    
    // كلمة مفردة
    const kwWord = kwWords[0];
    let bestMatch = 0;
    
    for (const w of queryWords) {
        if (w === kwWord) {
            bestMatch = Math.max(bestMatch, AI_MATCH_WEIGHTS.exact);
        } else if (w.startsWith(kwWord) || kwWord.startsWith(w)) {
            if (w.length > 2 && kwWord.length > 2) {
                bestMatch = Math.max(bestMatch, AI_MATCH_WEIGHTS.startsWith);
            }
        } else if (w.length > 3 && kwWord.length > 3) {
            if (w.includes(kwWord) || kwWord.includes(w)) {
                bestMatch = Math.max(bestMatch, AI_MATCH_WEIGHTS.includes);
            }
        }
    }
    
    return strength * bestMatch;
}

// ═══════════════════════════════════════════════════════════
//  7. MAIN SCORING — الدالة الرئيسية
// ═══════════════════════════════════════════════════════════
function aiScoreIntent(question) {
    if (!question || typeof AI_INTENTS === 'undefined') return null;
    
    // 1) تطبيع السؤال
    const norm = typeof aiNorm2 === 'function' ? aiNorm2(question) : question;
    const words = norm.split(/\s+/).filter(w => w.length > 1);
    
    if (words.length === 0) {
        return { intent: null, score: 0, confidence: 'none', action: 'log' };
    }
    
    // 2) كشف الفترة
    const period = typeof aiExtractPeriod === 'function' 
        ? aiExtractPeriod(question) 
        : null;
    
    // 3) السياق
    const ctx = aiGetContext();
    
    // 4) حساب الدرجة لكل intent
    const candidates = [];
    
    for (const intent of AI_INTENTS) {
        let rawScore = 0;
        const bd = { keyword: 0, period: 0, context: 0, history: 0 };
        
        // 4.1) المطابقة بالكلمات
        for (const kw of intent.keywords || []) {
            const s = _aiMatchKeyword(words, norm, kw);
            rawScore += s;
            bd.keyword += s;
        }
        
        if (rawScore === 0) continue;  // لا يوجد تطابق
        
        // 4.2a) مكافأة predict ✅ FIX-PREDICT
        if (intent.cat === 'predict') {
            bd.predict = 3;
            rawScore += 3;  // أولوية للتنبؤ
        }
        
        // 4.2) مكافأة الفترة
        if (period && intent.cat) {
            if ((intent.id.includes('period') || intent.id.includes('time')) 
                && period !== 'all') {
                bd.period = 2;
                rawScore += 2;
            }
        }
        
        // 4.3) مكافأة السياق
        if (ctx && ctx.lastIntent) {
            if (ctx.lastCategory === intent.cat) {
                bd.context = 1.5;
                rawScore += 1.5;
            }
            // مكافأة إذا كان نفس الـ intent (متابعة)
            if (ctx.lastIntent === intent.id) {
                bd.context += 1.5;
                rawScore += 1.5;
            }
        }
        
        // 4.4) مكافأة التاريخ
        const histBonus = aiGetHistoryBonus(intent.id);
        if (histBonus > 0) {
            bd.history = histBonus;
            rawScore += histBonus;
        }
        
        candidates.push({
            intent,
            score: rawScore,
            breakdown: bd
        });
    }
    
    if (candidates.length === 0) {
        return { intent: null, score: 0, confidence: 'none', action: 'log', period };
    }
    
    // 5) ترتيب وإيجاد الأفضل
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const second = candidates[1];
    
    // 6) حساب الثقة (نسبة للحد الأقصى)
    const maxPossible = 15;  // ✅ مُعدَّل: 15 بدل 20
    const normalized = Math.min(best.score / maxPossible, 1);
    
    // 7) اتخاذ القرار
    let action = 'log';
    let confidence = 'low';
    
    if (normalized >= AI_THRESHOLDS.execute) {
        action = 'execute';
        confidence = 'high';
    } else if (normalized >= AI_THRESHOLDS.clarify) {
        action = 'clarify';
        confidence = 'medium';
    }
    
    // إذا الأفضل متقارب مع الثاني → clarify
    if (second && (best.score - second.score) < 1 && best.score > 2) {
        action = 'clarify';
        confidence = 'medium';
    }
    
    // 8) تخزين السياق
    if (action === 'execute' || action === 'clarify') {
        aiSetContext(best.intent, period);
    }
    
    return {
        intent: best.intent,
        score: best.score,
        normalized: parseFloat(normalized.toFixed(3)),
        confidence,
        action,
        period,
        breakdown: best.breakdown,
        alternatives: candidates.slice(1, 3).map(c => ({
            id: c.intent.id,
            score: c.score
        }))
    };
}

// ═══════════════════════════════════════════════════════════
//  8. HELPERS — أدوات
// ═══════════════════════════════════════════════════════════
function aiScoreTest(question) {
    const r = aiScoreIntent(question);
    if (!r) return 'لا نتيجة';
    if (!r.intent) return `فشل (action=${r.action})`;
    
    return `→ ${r.intent.id} | score=${r.score.toFixed(1)} | ${r.confidence} | ${r.action}`;
}

function aiClearContext() {
    _aiContext.lastIntent = null;
    _aiContext.lastCategory = null;
    _aiContext.lastPeriod = null;
    _aiContext.timestamp = 0;
}

// ═══════════════════════════════════════════════════════════
//  9. EXPORT
// ═══════════════════════════════════════════════════════════
window.aiScoreIntent = aiScoreIntent;
window.aiScoreTest = aiScoreTest;
window.aiSetContext = aiSetContext;
window.aiGetContext = aiGetContext;
window.aiClearContext = aiClearContext;
window.aiRecordHistory = aiRecordHistory;
window.AI_STRENGTH = AI_STRENGTH;
window.AI_KEYWORD_LEVELS = AI_KEYWORD_LEVELS;
window.AI_THRESHOLDS = AI_THRESHOLDS;

console.log('🎯 [ai-scoring] v1.0.0 محمّل');
