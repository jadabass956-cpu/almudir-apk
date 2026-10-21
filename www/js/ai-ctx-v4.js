// ============================================================
//  🧠 AI CONTEXT — ذاكرة المحادثة الذكية
//  Follow-up + Correction + Confirmation + Pending Questions
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. STATE — حالة المحادثة
// ═══════════════════════════════════════════════════════════
const AI_CTX = {
    // آخر سؤال
    lastQuestion: null,
    lastIntent: null,
    lastPeriod: null,
    lastCategory: null,
    lastResponse: null,
    
    // سؤال معلق (البوت انتظر إجابة)
    pendingQuestion: null,      // نص السؤال
    pendingType: null,          // 'confirm' | 'clarify' | 'followup'
    pendingOptions: null,       // خيارات (للتوضيح)
    pendingIntentId: null,      // intent المُنتظر
    
    // التصحيح
    awaitingCorrection: false,  // هل ننتظر تصحيح؟
    lastWrongIntent: null,      // intent الخاطئ
    
    // الطابع الزمني
    timestamp: 0
};

// ═══════════════════════════════════════════════════════════
//  2. LIFECYCLE — إدارة السياق
// ═══════════════════════════════════════════════════════════
const AI_CTX_TTL = 5 * 60 * 1000; // 5 دقائق

function aiCtxSet(data) {
    if (!data) return;
    Object.assign(AI_CTX, data, { timestamp: Date.now() });
}

function aiCtxGet() {
    if (Date.now() - AI_CTX.timestamp > AI_CTX_TTL) {
        return null;
    }
    return { ...AI_CTX };
}

function aiCtxClear() {
    Object.keys(AI_CTX).forEach(k => {
        if (k === 'timestamp') {
            AI_CTX[k] = 0;
        } else if (Array.isArray(AI_CTX[k])) {
            AI_CTX[k] = [];
        } else if (typeof AI_CTX[k] === 'object') {
            AI_CTX[k] = null;
        } else if (typeof AI_CTX[k] === 'boolean') {
            AI_CTX[k] = false;
        } else {
            AI_CTX[k] = null;
        }
    });
    console.log('🧠 [ai-context] مُفرَّغ');
}

// ═══════════════════════════════════════════════════════════
//  3. DETECTORS — كشف الأنواع
// ═══════════════════════════════════════════════════════════

// كلمات التأكيد
const AI_CONFIRM_WORDS = new Set([
    'نعم', 'اي', 'ايوه', 'ايوة', 'ايو', 'أجل', 'صحيح', 'صح',  // ✅ FIX-1: ايو
    'تمام', 'اوك', 'أوك', 'اوكي', 'اكيد', 'أكيد',
    'بالضبط', 'ضبط', 'مضبوط', 'طيب', 'يلا', 'هيا',
    'اكمل', 'واصل', 'تابع', 'كمل', 'اه', 'آه'
]);

// كلمات الرفض
const AI_NEGATE_WORDS = new Set([
    'لا', 'لأ', 'ليس', 'مش', 'مانو', 'ماني', 'ما',
    'غلط', 'خطأ', 'خطا', 'مو', 'مب', 'بلاش',
    'الغاء', 'إلغاء', 'توقف', 'وقف', 'بس'
]);

// كلمات التصحيح
// 🔧 FIX-CORR3: كلمات كاملة فقط (بحدود فاصلة)
const AI_CORRECTION_PATTERNS = [
    /(^|\s)وليس(\s|$)/,
    /(^|\s)بل(\s|$)/,
    /(^|\s)بدل(\s|$)/,
    /(^|\s)غلط(\s|$)/,
    /(^|\s)خطا(\s|$)/,
    /(^|\s)خطا(\s|$)/,
    /(^|\s)مب(\s|$)/,      // كلمة كاملة
    /(^|\s)مو(\s|$)/,      // كلمة كاملة (ليست "مواد")
    /(^|\s)مش(\s|$)/,      // كلمة كاملة
    /مش\s+هذا/,
    /مش\s+هيك/,
    /مش\s+هاد/,
    /لا\s+لا/
];

// كلمات فترة فقط
const AI_PERIOD_ONLY = new Set([
    'اليوم', 'يوم', 'امس', 'الاسبوع', 'اسبوع',  // ✅ FIX-2: يوم + اسبوع
    'الشهر', 'شهر', 'السنه', 'سنه', 'سنة', 'عام',
    'كل', 'الكل', 'هلا', 'الان', 'الصبح', 'المسا',
    'هسه', 'هسع', 'هلق', 'حاليا'
]);

function _aiCtxNorm(q) {
    return typeof aiNorm2 === 'function' ? aiNorm2(q) : String(q || '').trim();
}

/**
 * كشف: هل السؤال تأكيد؟
 */
function aiIsConfirmation(question) {
    const n = _aiCtxNorm(question);
    if (!n) return false;
    const words = n.split(/\s+/);
    
    // كلمة تأكيد واحدة
    if (words.length === 1 && AI_CONFIRM_WORDS.has(words[0])) {
        return true;
    }
    
    // بداية بتأكيد (نعم + شيء)
    if (words.length > 0 && AI_CONFIRM_WORDS.has(words[0])) {
        return true;
    }
    
    return false;
}

/**
 * كشف: هل السؤال رفض؟
 */
function aiIsNegation(question) {
    const n = _aiCtxNorm(question);
    if (!n) return false;
    const words = n.split(/\s+/);
    
    if (words.length === 1 && AI_NEGATE_WORDS.has(words[0])) {
        return true;
    }
    
    if (words.length > 0 && AI_NEGATE_WORDS.has(words[0])) {
        return true;
    }
    
    return false;
}

/**
 * كشف: هل السؤال تصحيح؟
 */
function aiIsCorrection(question) {
    const raw = String(question || '').trim();
    const n = _aiCtxNorm(question);
    
    // 🔧 FIX-CORR6: منطق واضح
    
    // 1) عدد الكلمات ≤ 6
    if (raw.split(/\s+/).filter(w => w).length > 6) return false;
    
    // 2) كلمات تصحيح صريحة (صريح تماماً)
    const explicitWords = ['وليس', 'بدل', 'غلط', 'خطا', 'خطأ'];
    const hasExplicitWord = explicitWords.some(w => {
        const re = new RegExp('(^|\\s)' + w + '(\\s|$)');
        return re.test(n);
    });
    
    // 3) patterns واضحة
    const hasPattern = /مش\s+هذا|مش\s+هيك|مش\s+هاد/.test(raw);
    
    // 4) كلمات "مش/مو/مب" (تحتاج سياق)
    const softWords = ['مش', 'مو', 'مب'];
    const hasSoftWord = softWords.some(w => {
        const re = new RegExp('(^|\\s)' + w + '(\\s|$)');
        return re.test(n);
    });
    
    // 5) strongWords (كلمات كيان)
    const strongWords = ['مبيع', 'رصيد', 'مخزون', 'صندوق', 'ربح', 'دين',
                          'عميل', 'مصروف', 'مادة', 'مستودع', 'فاتورة',
                          'إتلاف', 'تحويل', 'مشتري', 'ينفد', 'توقع'];
    const normStrong = strongWords.map(w => _aiCtxNorm(w));
    const strongCount = normStrong.filter(s => s && n.includes(s)).length;
    
    // 📌 المنطق:
    
    // أ) تصحيح صريح (وليس/بدل/غلط/خطأ) → نعم
    if (hasExplicitWord) return true;
    
    // ب) pattern "مش هاد" → نعم
    if (hasPattern) return true;
    
    // ج) "مش/مو/مب" + strongWords → ليس تصحيحاً (سؤال طبيعي)
    if (hasSoftWord && strongCount > 0) return false;
    
    // د) "مش/مو/مب" فقط (بدون strongWords) → نعم
    if (hasSoftWord) return true;
    
    // هـ) لا شيء → ليس تصحيحاً
    return false;
}

/**
 * كشف: هل السؤال فترة فقط؟ ("وبالأمس؟" / "اليوم")
 */
function aiIsPeriodOnly(question) {
    const n = _aiCtxNorm(question);
    if (!n) return false;
    const words = n.split(/\s+/).filter(w => w.length > 1);
    
    if (words.length === 0 || words.length > 3) return false;
    
    // كل الكلمات في قائمة الفترات؟
    const allPeriod = words.every(w => 
        AI_PERIOD_ONLY.has(w) || 
        ['يوم', 'شهر', 'اسبوع', 'سنه', 'عام'].includes(w)
    );
    
    return allPeriod;
}

/**
 * كشف: هل السؤال متابعة؟ ("وبالأمس؟" / "نفس الشي" / "أكثر")
 */
function aiIsFollowUp(question) {
    const raw = String(question || '');
    const n = _aiCtxNorm(question);
    
    // 🔧 FIX-A: أكثر تشدداً
    // 1) عدد الكلمات: ≤ 2 (بدل 3)
    const words = n.split(/\s+/).filter(w => w.length > 1);
    if (words.length > 2) return false;
    
    // 2) لا يحتوي كلمات قوية (فعل/كيان)
    const strongWords = ['مبيع', 'رصيد', 'مخزون', 'صندوق', 'ربح', 'دين',
                          'عميل', 'مصروف', 'ماده', 'مستودع', 'فاتوره', 'اتلاف',
                          'تحويل', 'مشتري'];
    if (words.some(w => strongWords.some(s => w.includes(s)))) return false;
    
    // 3) "و..." في البداية
    if (/^و/.test(n.trim())) return true;
    
    // 4) كلمة فترة فقط
    const hasPeriod = words.some(w => 
        AI_PERIOD_ONLY.has(w) || 
        ['يوم', 'شهر', 'اسبوع', 'سنه', 'عام'].includes(w)
    );
    
    // 5) كلمات ربط
    const linkWords = ['ايضا', 'كمان', 'كذلك', 'نفس', 'مثل'];
    const hasLink = words.some(w => linkWords.includes(w));
    
    return hasPeriod || hasLink;
}

// ═══════════════════════════════════════════════════════════
//  4. APPLY CONTEXT — تطبيق السياق على السؤال
// ═══════════════════════════════════════════════════════════

/**
 * إعادة بناء السؤال الكامل من السياق
 * @returns {Object} { question, period, intentId, isFromContext }
 */
function aiIsSameThing(question) {
    const n = _aiCtxNorm(question);
    if (!n) return false;
    return /نفس\s*ال?شي|نفسه|نفسها|^نفس/.test(n);
}

function aiExtractTargetIntent(question) {
    // نستخدم النص الأصلي (لا المُطبَّع) لأن aiNorm2 يشوّه "الشي" إلى "شش"
    const raw = String(question || '').trim();
    const idx = raw.indexOf('نفس');
    if (idx === -1) return null;
    let rest = raw.substring(idx + 3).trim();
    // أزل "الشي" / "شي" / "شيء"
    rest = rest.replace(/^ال?(?:شي|شيء)\s*/i, '').trim();
    // أزل حروف الجر
    rest = rest.replace(/^(لل|الي|الى|إلى|في|ل|ب|ال)\s*/i, '').trim();
    if (!rest) return null;
    // طبّع النص النهائي للاستعلام
    const n = _aiCtxNorm(rest);
    if (typeof aiScoreIntent === 'function') {
        try {
            const info = aiScoreIntent(n);
            if (info && info.intent) return info.intent.id;
        } catch(e) {}
    }
    return null;
}

function aiCtxExpand(question) {
    const ctx = aiCtxGet();
    // 🔧 FIX: ائتلاف lastIntent مع pendingIntentId (لـ clarify)
    if (!ctx || (!ctx.lastIntent && !ctx.pendingIntentId)) {
        return { question, period: null, intentId: null, isFromContext: false };
    }
    
    // 🔁 فحص "نفس الشي" أولاً (قبل _strongWords)
    if (aiIsSameThing(question)) {
        const _targetId = aiExtractTargetIntent(question);
        if (_targetId) {
            console.log('🔁 [ai-context] نفس الشي:', _targetId);
            return {
                question: ctx.lastQuestion || question,
                period: ctx.lastPeriod,
                intentId: _targetId,
                isFromContext: true,
                sameThing: true
            };
        }
    }

    // 🔧 FIX-A: فحص "سؤال جديد" أولاً
    // إذا السؤال يحتوي كلمة قوية فريدة، فهو سؤال جديد (لا متابعة)
    const _norm = _aiCtxNorm(question);
    const _strongWords = ['مبيع', 'رصيد', 'مخزون', 'صندوق', 'ربح', 'دين',
                          'عميل', 'مصروف', 'ماده', 'مستودع', 'فاتوره', 'اتلاف',
                          'تحويل', 'مشتري', 'ارباح', 'خسار'];
    const _hasStrong = _strongWords.some(s => _norm.includes(s));
    
    // لو سؤال جديد (ليس تصحيح ولا فترة فقط)
    if (_hasStrong && !aiIsCorrection(question) && !aiIsPeriodOnly(question)) {
        return { question, period: null, intentId: null, isFromContext: false };
    }
    
    // 0) 🤔 هل ننتظر توضيحاً؟ (clarify resolution)
    if (ctx.pendingType === 'clarify' && ctx.pendingIntentId) {
        const _clNorm = _aiCtxNorm(question).trim();
        const _clRaw = String(question || '').trim().toLowerCase();
        const _baseIntent = (typeof AI_INTENTS !== 'undefined')
            ? AI_INTENTS.find(i => i.id === ctx.pendingIntentId)
            : null;

        if (_baseIntent && _baseIntent.clarifyMap) {
            // ابحث عن تطابق في الخريطة
            let _resolvedId = null;
            let _matchedKey = null;

            // 1) تطابق مباشر على النص الأصلي (لأن _aiCtxNorm يدمّر "علي" → "عل")
            if (_clRaw && _baseIntent.clarifyMap[_clRaw]) {
                _resolvedId = _baseIntent.clarifyMap[_clRaw];
                _matchedKey = _clRaw;
            }

            // 2) تطابق مباشر على النص المطبّع
            if (!_resolvedId && _clNorm && _baseIntent.clarifyMap[_clNorm]) {
                _resolvedId = _baseIntent.clarifyMap[_clNorm];
                _matchedKey = _clNorm;
            }

            // 3) تطابق جزئي (على النص الأصلي أو المطبّع)
            if (!_resolvedId) {
                for (const [key, targetId] of Object.entries(_baseIntent.clarifyMap)) {
                    const keyLower = String(key).toLowerCase();
                    const keyNorm = _aiCtxNorm(key);
                    const rawMatch = _clRaw && (keyLower === _clRaw || _clRaw.includes(keyLower));
                    const normMatch = _clNorm && keyNorm && _clNorm.includes(keyNorm);
                    if (rawMatch || normMatch) {
                        _resolvedId = targetId;
                        _matchedKey = key;
                        break;
                    }
                }
            }

            if (_resolvedId) {
                console.log('🎯 [ai-context] توضيح مُحَل:', _matchedKey, '→', _resolvedId);
                return {
                    question: ctx.pendingQuestion || question,
                    period: ctx.lastPeriod,
                    intentId: _resolvedId,
                    isFromContext: true,
                    resolvedClarification: true
                };
            }
        }
    }

    // 1) لو تصحيح
    if (aiIsCorrection(question)) {
        return {
            question,
            period: ctx.lastPeriod,
            intentId: null, // سيبحث من جديد
            isFromContext: true,
            correction: true
        };
    }
    
    // 2) لو تأكيد
    if (aiIsConfirmation(question) && ctx.pendingType === 'confirm') {
        return {
            question: ctx.pendingQuestion || question,
            period: ctx.lastPeriod,
            intentId: ctx.pendingIntentId || ctx.lastIntent,
            isFromContext: true,
            confirmed: true
        };
    }
    
    // 3) لو رفض
    if (aiIsNegation(question) && ctx.pendingType) {
        return {
            question,
            period: null,
            intentId: null,
            isFromContext: true,
            negated: true
        };
    }
    
    // 4) لو فترة فقط ("وبالأمس؟")
    if (aiIsPeriodOnly(question) || aiIsFollowUp(question)) {
        const period = typeof aiExtractPeriod === 'function' 
            ? aiExtractPeriod(question) 
            : null;
        
        return {
            question: (ctx.lastQuestion || '') + ' ' + question,
            period: period || ctx.lastPeriod,
            intentId: ctx.lastIntent,
            isFromContext: true,
            followUp: true
        };
    }
    
    // 5) سؤال جديد
    return { question, period: null, intentId: null, isFromContext: false };
}

// ═══════════════════════════════════════════════════════════
//  5. PENDING QUESTION — إدارة الأسئلة المعلقة
// ═══════════════════════════════════════════════════════════

/**
 * حفظ سؤال معلّق (البوت يسأل و ينتظر رد)
 */
function aiCtxSetPending(question, options) {
    aiCtxSet({
        pendingQuestion: question,
        pendingType: 'confirm',
        pendingOptions: options || ['نعم', 'لا'],
        pendingIntentId: null
    });
    console.log('⏳ [ai-context] سؤال معلّق:', question.substring(0, 50));
}

/**
 * حفظ سؤال توضيح
 */
function aiCtxSetClarify(options, intentId) {
    aiCtxSet({
        pendingQuestion: options && options.length > 0 ? options.join(' / ') : 'اختر',
        pendingType: 'clarify',
        pendingOptions: options || [],
        pendingIntentId: intentId || null
    });
    console.log('❓ [ai-context] توضيح:', options);
}

/**
 * حفظ تصحيح مُنتظر
 */
function aiCtxSetCorrection(wrongIntentId) {
    aiCtxSet({
        awaitingCorrection: true,
        lastWrongIntent: wrongIntentId
    });
    console.log('🔧 [ai-context] في انتظار تصحيح');
}

/**
 * حفظ سؤال مُجاب
 */
function aiCtxSetAnswered(question, intentId, period, response) {
    aiCtxSet({
        lastQuestion: question,
        lastIntent: intentId,
        lastPeriod: period,
        lastResponse: response,
        pendingQuestion: null,
        pendingType: null,
        pendingOptions: null,
        pendingIntentId: null,
        awaitingCorrection: false,
        lastWrongIntent: null
    });
}

// ═══════════════════════════════════════════════════════════
//  6. TYPES — مؤشرات الحالة
// ═══════════════════════════════════════════════════════════

function aiCtxHasPending() {
    const ctx = aiCtxGet();
    return !!(ctx && ctx.pendingType);
}

function aiCtxIsAwaitingCorrection() {
    const ctx = aiCtxGet();
    return !!(ctx && ctx.awaitingCorrection);
}

// ═══════════════════════════════════════════════════════════
//  7. EXPORT
// ═══════════════════════════════════════════════════════════
window.aiCtxSet = aiCtxSet;
window.aiCtxGet = aiCtxGet;
window.aiCtxClear = aiCtxClear;
window.aiCtxExpand = aiCtxExpand;
window.aiCtxSetPending = aiCtxSetPending;
window.aiCtxSetClarify = aiCtxSetClarify;
window.aiCtxSetCorrection = aiCtxSetCorrection;
window.aiCtxSetAnswered = aiCtxSetAnswered;
window.aiCtxHasPending = aiCtxHasPending;
window.aiCtxIsAwaitingCorrection = aiCtxIsAwaitingCorrection;

window.aiIsConfirmation = aiIsConfirmation;
window.aiIsNegation = aiIsNegation;
window.aiIsCorrection = aiIsCorrection;
window.aiIsPeriodOnly = aiIsPeriodOnly;
window.aiIsFollowUp = aiIsFollowUp;

console.log('🧠 [ai-context] v1.0.0 محمّل');
