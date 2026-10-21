// ============================================================
//  🎓 AI CONSOLE — إدخال البيانات من Console
//  أدوات سريعة لإضافة/تعديل/حذف معرفة المساعد
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. HELPERS
// ═══════════════════════════════════════════════════════════
function _aiConsoleReady() {
    if (typeof db === 'undefined' || !db) {
        console.error('❌ Firestore غير متاح');
        return false;
    }
    if (!auth || !auth.currentUser) {
        console.error('❌ يجب تسجيل الدخول');
        return false;
    }
    return true;
}

function _aiConsoleNorm(text) {
    if (typeof aiNorm2 === 'function') {
        try { return aiNorm2(text); } catch(e) {}
    }
    return String(text || '').toLowerCase().trim();
}

async function _aiConsoleSave(collection, data) {
    try {
        const ref = await db.collection(collection).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: 'console'
        });
        return ref.id;
    } catch(e) {
        console.error('❌ فشل الحفظ:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════
//  2. TEACH — كلمات مفتاحية لنوايا موجودة
// ═══════════════════════════════════════════════════════════
/**
 * إضافة كلمات مفتاحية لنية موجودة
 * @param {String|Array} words - الكلمات (مفصولة بمسافات أو مصفوفة)
 * @param {String} intentId - معرّف النية (sales_total, profit, ...)
 * 
 * @example
 *   await aiTeach('شو وضعي اليوم', 'sales_total');
 *   await aiTeach(['شو اخباري', 'شو صار'], 'sales_total');
 */
async function aiTeach(words, intentId) {
    if (!_aiConsoleReady()) return null;
    
    const wordList = typeof words === 'string' 
        ? words.split(/\s+/).filter(w => w)
        : (Array.isArray(words) ? words : []);
    
    if (wordList.length === 0) {
        console.error('❌ لا توجد كلمات');
        return null;
    }
    
    // التحقق من intent
    if (typeof AI_INTENTS === 'undefined') {
        console.error('❌ AI_INTENTS غير محمّلة');
        return null;
    }
    
    const intent = AI_INTENTS.find(i => i.id === intentId);
    if (!intent) {
        console.error('❌ intent غير موجود:', intentId);
        console.log('📋 المتاح:', AI_INTENTS.map(i => i.id).join(', '));
        return null;
    }
    
    // تحديث الذاكرة
    intent.keywords = [...new Set([...intent.keywords, ...wordList])];
    
    // حفظ في Firestore
    const id = await _aiConsoleSave('ai_keywords', {
        words: wordList,
        intentId: intentId,
        type: 'intent_match'
    });
    
    if (id) {
        console.log(`✅ تعليم: "${wordList.join(' ')}" → ${intentId}`);
    }
    return id;
}

// ═══════════════════════════════════════════════════════════
//  3. KNOWLEDGE — معرفة عامة (Q → A)
// ═══════════════════════════════════════════════════════════
/**
 * إضافة معرفة عامة
 * @example
 *   await aiKnowledge('شو اسم التطبيق', 'المدير AI');
 */
async function aiKnowledge(question, answer) {
    if (!_aiConsoleReady()) return null;
    
    if (!question || !answer) {
        console.error('❌ املأ السؤال والجواب');
        return null;
    }
    
    const normalized = _aiConsoleNorm(question);
    const keywords = normalized.split(/\s+/).filter(w => w.length > 1);
    
    const id = await _aiConsoleSave('ai_knowledge', {
        question: question,
        normalized: normalized,
        keywords: keywords,
        answer: answer
    });
    
    if (id) {
        console.log(`✅ معرفة: "${question}" → "${answer.substring(0, 50)}"`);
    }
    return id;
}

// ═══════════════════════════════════════════════════════════
//  4. SYNONYM — مرادف
// ═══════════════════════════════════════════════════════════
/**
 * إضافة مرادف
 * @example
 *   await aiSynonym('مبيع', ['ايراد', 'دخل', 'مدخول']);
 */
async function aiSynonym(canonical, variants) {
    if (!_aiConsoleReady()) return null;
    
    if (!canonical || !Array.isArray(variants)) {
        console.error('❌ استخدم: aiSynonym("مبيع", ["ايراد", "دخل"])');
        return null;
    }
    
    // تحديث الذاكرة
    if (typeof AI_SYNONYMS !== 'undefined') {
        if (!AI_SYNONYMS[canonical]) AI_SYNONYMS[canonical] = [];
        AI_SYNONYMS[canonical] = [...new Set([...AI_SYNONYMS[canonical], ...variants])];
    }
    
    const id = await _aiConsoleSave('ai_keywords', {
        canonical: canonical,
        variants: variants,
        type: 'synonym'
    });
    
    if (id) {
        console.log(`✅ مرادف: "${canonical}" ← [${variants.join(', ')}]`);
    }
    return id;
}

// ═══════════════════════════════════════════════════════════
//  5. INTENT — نية مخصصة
// ═══════════════════════════════════════════════════════════
/**
 * إضافة نية مخصصة
 * @example
 *   await aiIntent('app_info', ['اسم التطبيق', 'شو اسمك'], 'المدير AI');
 */
async function aiIntent(id, keywords, response) {
    if (!_aiConsoleReady()) return null;
    
    if (!id || !Array.isArray(keywords) || !response) {
        console.error('❌ استخدم: aiIntent("id", ["kw1"], "رد")');
        return null;
    }
    
    // تحديث الذاكرة
    if (typeof AI_INTENTS !== 'undefined') {
        const existing = AI_INTENTS.find(i => i.id === id);
        if (existing) {
            existing.keywords = [...new Set([...existing.keywords, ...keywords])];
            console.log(`⚠️ intent موجود — تحديث الكلمات`);
        } else {
            AI_INTENTS.push({
                id: id,
                cat: 'custom',
                keywords: keywords,
                handle: () => response
            });
            console.log(`✅ intent جديد: ${id}`);
        }
    }
    
    const refId = await _aiConsoleSave('ai_keywords', {
        intentId: id,
        words: keywords,
        response: response,
        type: 'custom_intent'
    });
    
    return refId;
}

// ═══════════════════════════════════════════════════════════
//  6. LIST — عرض
// ═══════════════════════════════════════════════════════════
async function aiList(type) {
    if (!_aiConsoleReady()) return;
    
    const cols = type ? [type] : ['ai_keywords', 'ai_knowledge'];
    
    for (const col of cols) {
        try {
            const snap = await db.collection(col).limit(50).get();
            console.log(`\n📋 ${col} (${snap.size}):`);
            if (snap.size === 0) {
                console.log('   (فارغ)');
                continue;
            }
            snap.forEach(d => {
                const data = d.data();
                const preview = data.words 
                    ? `[${data.words.join(', ')}] → ${data.intentId || '?'}`
                    : (data.question 
                        ? `"${data.question}" → "${data.answer?.substring(0, 40)}"`
                        : (data.canonical 
                            ? `"${data.canonical}" ← [${data.variants?.join(', ')}]`
                            : JSON.stringify(data).substring(0, 80)));
                console.log(`   ${d.id.substring(0, 8)}: ${preview}`);
            });
        } catch(e) {
            console.warn(`[ai-console] ${col}:`, e.message);
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  7. DELETE — حذف
// ═══════════════════════════════════════════════════════════
async function aiDelete(collection, docId) {
    if (!_aiConsoleReady()) return false;
    
    try {
        await db.collection(collection).doc(docId).delete();
        console.log('✅ حُذف:', collection, docId);
        return true;
    } catch(e) {
        console.error('❌', e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════
//  8. RELOAD — إعادة تحميل المحرك
// ═══════════════════════════════════════════════════════════
async function aiReload() {
    console.log('🔄 إعادة تحميل المحرك...');
    
    try {
        // إعادة تحميل ai-engine
        if (typeof window._aiEngineLoaded !== 'undefined') {
            window._aiEngineLoaded = false;
        }
        
        if (typeof aiEngineLoad === 'function') {
            await aiEngineLoad();
            console.log('✅ ai-engine مُحدَّث');
        }
        
        if (typeof aiLoadCustomLearnings === 'function') {
            await aiLoadCustomLearnings();
            console.log('✅ ai_learnings مُحدَّث');
        }
    } catch(e) {
        console.warn('[ai-console] reload:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  9. TEST — اختبار
// ═══════════════════════════════════════════════════════════
async function aiTest(question) {
    if (!question) return;
    
    console.log(`\n🧪 اختبار: "${question}"`);
    const reply = await answerAIQuestion(question);
    console.log(`🤖 ${reply}`);
    return reply;
}

// ═══════════════════════════════════════════════════════════
//  10. HELP — دليل مختصر
// ═══════════════════════════════════════════════════════════
function aiHelp() {
    console.log(`
═══════════════════════════════════════════════════════
🎓 AI Console — الأوامر المتاحة
═══════════════════════════════════════════════════════

📚 المعرفة:
  aiKnowledge('شو اسم التطبيق', 'المدير AI')

🎓 التعليم:
  aiTeach('شو وضعي', 'sales_total')

🔄 المرادفات:
  aiSynonym('مبيع', ['ايراد', 'دخل'])

✨ النوايا المخصصة:
  aiIntent('app_info', ['اسم التطبيق'], 'المدير AI')

📋 العرض:
  aiList()              // الكل
  aiList('ai_keywords') // كلمات فقط
  aiList('ai_knowledge')// معرفة فقط

🗑️ الحذف:
  aiDelete('ai_keywords', 'docId')

🔄 إعادة التحميل:
  aiReload()

🧪 الاختبار:
  aiTest('شو مبيعاتي اليوم؟')

📖 الأوامر المتاحة:
  aiHelp()

═══════════════════════════════════════════════════════
`);
}

// ═══════════════════════════════════════════════════════════
//  EXPORT
// ═══════════════════════════════════════════════════════════
window.aiTeach = aiTeach;
window.aiKnowledge = aiKnowledge;
window.aiSynonym = aiSynonym;
window.aiIntent = aiIntent;
window.aiList = aiList;
window.aiDelete = aiDelete;
window.aiReload = aiReload;
window.aiTest = aiTest;
window.aiHelp = aiHelp;

console.log('🎓 [ai-console] v1.0.0 محمّل | اكتب aiHelp() للدليل');
