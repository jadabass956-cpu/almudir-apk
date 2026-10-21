// ============================================================
//  🧠 AI ENGINE — محرك المعرفة المرن
//  الكلمات المفتاحية + قاعدة المعرفة + المتابعة الذكية
// ============================================================

let _aiKeywordsCache = [];
let _aiKnowledgeCache = [];
let _aiEngineLoaded = false;
let _lastFollowUpContext = null;

// ---------- تحميل البيانات من Firestore ----------
async function aiEngineLoad() {
    if (_aiEngineLoaded) return;
    try {
        const [kwSnap, knSnap] = await Promise.all([
            db.collection('ai_keywords').get(),
            db.collection('ai_knowledge').get()
        ]);

        _aiKeywordsCache = [];
        kwSnap.forEach(d => _aiKeywordsCache.push({ id: d.id, ...d.data() }));

        _aiKnowledgeCache = [];
        knSnap.forEach(d => _aiKnowledgeCache.push({ id: d.id, ...d.data() }));

        // ترتيب حسب الأولوية (1 = الأعلى)
        _aiKeywordsCache.sort((a, b) => (a.priority || 99) - (b.priority || 99));
        _aiKnowledgeCache.sort((a, b) => (a.priority || 99) - (b.priority || 99));

        _aiEngineLoaded = true;
        console.log('🧠 [ai-engine] محمّل:', {
            keywords: _aiKeywordsCache.length,
            knowledge: _aiKnowledgeCache.length
        });
    } catch(e) {
        console.warn('[ai-engine] load failed:', e.message);
    }
}

// ---------- تطبيع عربي (يستخدم aiNorm إن وُجدت) ----------
function _aiNorm(text) {
    if (typeof aiNorm === 'function') return aiNorm(text);
    return String(text || '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[ًٌٍَُِّْـ]/g, '')
        .toLowerCase()
        .trim();
}

// ---------- مطابقة كلمات مفتاحية ----------
function _matchKeywords(query) {
    if (!_aiKeywordsCache.length) return null;
    const q = _aiNorm(query);
    const words = q.split(/\s+/).filter(w => w.length > 1);

    let best = null;
    let bestScore = 0;

    _aiKeywordsCache.forEach(kw => {
        if (!kw.words || !kw.words.length) return;
        let score = 0;
        kw.words.forEach(kwWord => {
            const kwNorm = _aiNorm(kwWord);
            if (words.some(w => w.includes(kwNorm) || kwNorm.includes(w))) {
                score += 1;
            }
        });
        if (score > bestScore) {
            bestScore = score;
            best = kw;
        }
    });

    return bestScore > 0 ? best : null;
}

// ---------- مطابقة قاعدة المعرفة ----------
function _matchKnowledge(query) {
    if (!_aiKnowledgeCache.length) return null;
    const q = _aiNorm(query);
    const words = q.split(/\s+/).filter(w => w.length > 1);

    let best = null;
    let bestScore = 0;

    _aiKnowledgeCache.forEach(kn => {
        if (!kn.keywords || !kn.keywords.length) return;
        let score = 0;
        kn.keywords.forEach(kw => {
            const kwNorm = _aiNorm(kw);
            if (words.some(w => w.includes(kwNorm) || kwNorm.includes(w))) {
                score += 1;
            }
        });
        if (score > bestScore) {
            bestScore = score;
            best = kn;
        }
    });

    return bestScore > 0 ? best : null;
}

// ---------- تنفيذ الـ action (جلب البيانات) ----------
async function _runAction(actionName, query) {
    try {
        // نمرّر الـ query كسياق للفترة الزمنية
        const ctx = { query: query, period: _detectPeriod(query) };

        // ✅ 1) أولاً: جرّب AI_INTENTS (23 نية من ai-assistant.js)
        if (typeof AI_INTENTS !== 'undefined' && Array.isArray(AI_INTENTS)) {
            const it = AI_INTENTS.find(x => x.id === actionName);
            if (it && typeof it.handle === 'function') {
                return it.handle(query, ctx.period);
            }
        }

        // ✅ 2) ثانياً: الدوال القديمة (backward compatibility)
        // خرائط الدوال المتاحة
        const actions = {
            'getSales':      () => _getSalesData(ctx),
            'getProfit':     () => _getProfitData(ctx),
            'getMaterials':  () => _getMaterialsData(ctx),
            'getDebts':      () => _getDebtsData(ctx),
            'getExpenses':   () => _getExpensesData(ctx),
            'getTopProduct': () => _getTopProductData(ctx),
            'getTopCustomer':() => _getTopCustomerData(ctx),
            'getTodaySummary': () => _getTodaySummary(ctx),
            'custom':        () => ctx.query
        };

        if (actions[actionName]) return await actions[actionName]();
        return '';
    } catch(e) {
        console.warn('[ai-engine] action failed:', actionName, e.message);
        return '';
    }
}

// ---------- كشف الفترة ----------
function _detectPeriod(q) {
    const n = _aiNorm(q);
    if (n.includes('اليوم') || n.includes('النهارده')) return 'today';
    if (n.includes('امس')) return 'yesterday';
    if (n.includes('الاسبوع') || n.includes('هالاسبوع')) return 'week';
    if (n.includes('الشهر') || n.includes('هالشهر')) return 'month';
    if (n.includes('السنه') || n.includes('العام') || n.includes('السنة')) return 'year';
    return 'all';
}

// ---------- دوال جلب البيانات ----------
function _filterByPeriod(items, dateField, period) {
    if (period === 'all') return items;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let ref = new Date(today);
    switch(period) {
        case 'today': ref = today; break;
        case 'yesterday': ref.setDate(ref.getDate() - 1); break;
        case 'week': ref.setDate(ref.getDate() - 7); break;
        case 'month': ref.setDate(ref.getDate() - 30); break;
        case 'year': ref.setFullYear(ref.getFullYear() - 1); break;
    }
    return items.filter(item => {
        const d = item[dateField];
        if (!d) return true;
        const dt = new Date(d);
        if (isNaN(dt)) return true;
        if (period === 'yesterday') {
            const yest = new Date(today); yest.setDate(yest.getDate() - 1);
            return dt >= yest && dt < today;
        }
        return dt >= ref;
    });
}

function _getSalesData(ctx) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return 'لا توجد بيانات مبيعات.';
    const filtered = _filterByPeriod(sales, 'date', ctx.period);
    if (!filtered.length) return 'لا توجد مبيعات في هذه الفترة.';

    let total = 0;
    let profit = 0;
    filtered.forEach(s => {
        const amt = parseFloat(s.total || s.amount || 0) || 0;
        total += amt;
        // 🆕 استخدم totalCost إن وُجد
        if (s.totalCost !== undefined) {
            profit += amt - parseFloat(s.totalCost);
        } else {
            let c = 0;
            (s.items || []).forEach(it => {
                c += parseFloat(it.costAtSale || 0) * parseFloat(it.qty || 0);
            });
            profit += amt - c;
        }
    });

    const avg = Math.round(total / Math.max(filtered.length, 1));
    const periodName = _periodArabic(ctx.period);

    return `📊 *مبيعاتك ${periodName}:*\n` +
           `💰 الإجمالي: ${_fmtNum(total)} ل.س\n` +
           `📈 الربح التقريبي: ${_fmtNum(profit)} ل.س\n` +
           `🧾 عدد الفواتير: ${filtered.length}\n` +
           `📊 متوسط الفاتورة: ${_fmtNum(avg)} ل.س`;
}

function _getProfitData(ctx) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return 'لا توجد بيانات.';
    const filtered = _filterByPeriod(sales, 'date', ctx.period);
    if (!filtered.length) return 'لا توجد مبيعات في هذه الفترة.';

    let total = 0, cost = 0;
    filtered.forEach(s => {
        total += parseFloat(s.total || s.amount || 0) || 0;
        // 🆕 استخدم totalCost إن وُجد، وإلا احسب من items
        if (s.totalCost !== undefined) {
            cost += parseFloat(s.totalCost) || 0;
        } else {
            (s.items || []).forEach(it => {
                cost += parseFloat(it.costAtSale || 0) * parseFloat(it.qty || 0);
            });
        }
    });
    const profit = total - cost;
    const margin = total > 0 ? Math.round((profit / total) * 100) : 0;

    return `📈 *أرباحك ${_periodArabic(ctx.period)}:*\n` +
           `💵 صافي الربح: ${_fmtNum(profit)} ل.س\n` +
           `📊 نسبة الربح: ${margin}%\n` +
           `💰 إجمالي المبيعات: ${_fmtNum(total)} ل.س`;
}

function _getMaterialsData(ctx) {
    if (typeof materials === 'undefined' || !Array.isArray(materials)) return 'لا توجد مواد.';
    const total = materials.length;
    const lowStock = materials.filter(m => (m.stock || 0) < 5).length;
    const outStock = materials.filter(m => (m.stock || 0) <= 0).length;
    return `📦 *مخزونك:*\n` +
           `🔢 إجمالي المواد: ${total}\n` +
           `⚠️ مواد قاربت على النفاد: ${lowStock}\n` +
           `❌ مواد نفذت: ${outStock}`;
}

function _getDebtsData(ctx) {
    if (typeof debts === 'undefined' || !Array.isArray(debts)) return 'لا توجد ديون.';
    const total = debts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    return `💸 *ديونك:*\n` +
           `💰 الإجمالي: ${_fmtNum(total)} ل.س\n` +
           `👥 عدد العملاء المدينين: ${debts.length}`;
}

function _getExpensesData(ctx) {
    if (typeof expenses === 'undefined' || !Array.isArray(expenses)) return 'لا توجد مصروفات.';
    const filtered = _filterByPeriod(expenses, 'date', ctx.period);
    const total = filtered.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    return `💸 *مصروفاتك ${_periodArabic(ctx.period)}:*\n` +
           `💰 الإجمالي: ${_fmtNum(total)} ل.س\n` +
           `🧾 عدد العمليات: ${filtered.length}`;
}

function _getTopProductData(ctx) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return 'لا توجد بيانات.';
    const counts = {};
    sales.forEach(s => {
        (s.items || []).forEach(it => {
            const n = it.name || 'غير معروف';
            counts[n] = (counts[n] || 0) + (it.qty || 1);
        });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return 'لا توجد مبيعات بعد.';
    return `🏆 *الأكثر مبيعاً:*\n` +
           sorted.slice(0, 5).map(([n, c], i) => `${i+1}. ${n} — ${c} وحدة`).join('\n');
}

function _getTopCustomerData(ctx) {
    if (typeof sales === 'undefined' || !Array.isArray(sales)) return 'لا توجد بيانات.';
    const counts = {};
    sales.forEach(s => {
        const n = s.customer || 'غير معروف';
        counts[n] = (counts[n] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return 'لا يوجد عملاء.';
    return `👑 *أفضل عملائك:*\n` +
           sorted.slice(0, 3).map(([n, c], i) => `${i+1}. ${n} — ${c} فاتورة`).join('\n');
}

function _getTodaySummary(ctx) {
    const periodName = _periodArabic('today');
    let out = `📅 *ملخص اليوم:*\n`;
    out += `\n${_getSalesData({ period: 'today' })}`;
    return out;
}

// ---------- أدوات مساعدة ----------
function _periodArabic(p) {
    return { today: 'اليوم', yesterday: 'أمس', week: 'هذا الأسبوع', month: 'هذا الشهر', year: 'هذه السنة', all: '' }[p] || '';
}

function _fmtNum(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

// ---------- الرد الرئيسي ----------
async function aiEngineRespond(query) {
    if (!_aiEngineLoaded) await aiEngineLoad();

    // 0) هل ننتظر متابعة؟
    if (_lastFollowUpContext && _isAffirmative(query)) {
        const ctx = _lastFollowUpContext;
        _lastFollowUpContext = null;
        if (ctx.type === 'knowledge' && ctx.knowledgeId) {
            const kn = _aiKnowledgeCache.find(k => k.id === ctx.knowledgeId);
            if (kn) return `💡 *${kn.title}*\n\n${kn.content}`;
        }
    }

    // 1) جرّب keyword
    const kw = _matchKeywords(query);
    if (kw) {
        let response = kw.intro ? kw.intro + '\n\n' : '';

        if (kw.type === 'data' || kw.type === 'mixed') {
            const data = await _runAction(kw.action, query);
            if (data) response += data;
        }

        if ((kw.type === 'text' || kw.type === 'mixed') && kw.linkedKnowledgeId) {
            const kn = _aiKnowledgeCache.find(k => k.id === kw.linkedKnowledgeId);
            if (kn) response += '\n\n💡 ' + kn.title + ':\n' + kn.content;
        }

        if (kw.followUp) {
            response += '\n\n' + kw.followUp;
            if (kw.linkedKnowledgeId) {
                _lastFollowUpContext = { type: 'knowledge', knowledgeId: kw.linkedKnowledgeId };
            }
        }

        return response.trim();
    }

    // 2) جرّب knowledge
    const kn = _matchKnowledge(query);
    if (kn) {
        return `💡 *${kn.title}*\n\n${kn.content}`;
    }

    // 3) لم يُعثر
    return null;
}

// ---------- "نعم" / "أوكي" / "تمام" ----------
function _isAffirmative(q) {
    const n = _aiNorm(q);
    return ['نعم','اجل','اي','ايوه','تمام','اوكي','ok','yes','yep','sure','طبعا','اكيد'].some(w => n === w || n.startsWith(w));
}

// ---------- تحديث الكاش ----------
function aiEngineReload() {
    _aiEngineLoaded = false;
    _aiKeywordsCache = [];
    _aiKnowledgeCache = [];
    return aiEngineLoad();
}

console.log('🧠 [ai-engine] جاهز');
