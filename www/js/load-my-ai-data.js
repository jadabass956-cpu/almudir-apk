// ============================================================
//  🚀 LOAD MY AI DATA — تحميل دفعة كبيرة
//  يقرأ MY_AI_DATA ويحفظه في Firestore
// ============================================================

(async function loadMyAIData() {
    console.log('═══════════════════════════════════');
    console.log('🚀 تحميل بيانات المساعد');
    console.log('═══════════════════════════════════');
    
    // ═══ التحقق ═══
    if (typeof MY_AI_DATA === 'undefined') {
        console.error('❌ ملف my-ai-data.js غير محمّل!');
        console.error('   افتح Console والصق محتوى الملف أولاً');
        return;
    }
    
    if (typeof db === 'undefined' || !db) {
        console.error('❌ Firestore غير متاح');
        return;
    }
    
    if (!auth || !auth.currentUser) {
        console.error('❌ يجب تسجيل الدخول أولاً');
        return;
    }
    
    const data = MY_AI_DATA;
    const settings = data.settings || {};
    const skipEmpty = settings.skipEmpty !== false;
    
    let counts = {
        knowledge: 0,
        synonyms: 0,
        teaching: 0,
        customIntents: 0,
        skipped: 0,
        errors: 0
    };
    
    // ═══════════════════════════════════════════════════
    //  1) المعرفة
    // ═══════════════════════════════════════════════════
    if (data.knowledge && data.knowledge.length > 0) {
        console.log('\n📚 حفظ المعرفة...');
        
        for (const item of data.knowledge) {
            if (!item.q || !item.a) {
                if (skipEmpty) { counts.skipped++; continue; }
                counts.errors++;
                continue;
            }
            
            try {
                const norm = typeof aiNorm2 === 'function' 
                    ? aiNorm2(item.q) 
                    : item.q.toLowerCase();
                
                const keywords = norm.split(/\s+/).filter(w => w.length > 1);
                
                await db.collection('ai_knowledge').add({
                    question: item.q,
                    normalized: norm,
                    keywords: keywords,
                    answer: item.a,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'my-ai-data'
                });
                
                counts.knowledge++;
                if (settings.showDetails) {
                    console.log(`  ✅ ${item.q} → ${item.a.substring(0, 40)}`);
                }
            } catch(e) {
                console.error(`  ❌ ${item.q}:`, e.message);
                counts.errors++;
            }
        }
        
        console.log(`  📊 محفوظ: ${counts.knowledge}`);
    }
    
    // ═══════════════════════════════════════════════════
    //  2) المرادفات
    // ═══════════════════════════════════════════════════
    if (data.synonyms && data.synonyms.length > 0) {
        console.log('\n🔄 حفظ المرادفات...');
        
        for (const item of data.synonyms) {
            if (!item.canonical || !item.variants || item.variants.length === 0) {
                if (skipEmpty) { counts.skipped++; continue; }
                counts.errors++;
                continue;
            }
            
            try {
                await db.collection('ai_keywords').add({
                    canonical: item.canonical,
                    variants: item.variants,
                    type: 'synonym',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'my-ai-data'
                });
                
                // تحديث الذاكرة
                if (typeof AI_SYNONYMS !== 'undefined') {
                    if (!AI_SYNONYMS[item.canonical]) AI_SYNONYMS[item.canonical] = [];
                    AI_SYNONYMS[item.canonical] = [...new Set([
                        ...AI_SYNONYMS[item.canonical],
                        ...item.variants
                    ])];
                }
                
                counts.synonyms++;
                if (settings.showDetails) {
                    console.log(`  ✅ ${item.canonical} ← [${item.variants.length} مرادف]`);
                }
            } catch(e) {
                console.error(`  ❌ ${item.canonical}:`, e.message);
                counts.errors++;
            }
        }
        
        console.log(`  📊 محفوظ: ${counts.synonyms}`);
    }
    
    // ═══════════════════════════════════════════════════
    //  3) التعليم
    // ═══════════════════════════════════════════════════
    if (data.teaching && data.teaching.length > 0) {
        console.log('\n🎓 حفظ التعليم...');
        
        for (const item of data.teaching) {
            if (!item.words || !item.intentId) {
                if (skipEmpty) { counts.skipped++; continue; }
                counts.errors++;
                continue;
            }
            
            try {
                const words = item.words.split(/\s+/).filter(w => w);
                
                // التحقق من intent
                const intent = AI_INTENTS.find(i => i.id === item.intentId);
                if (!intent) {
                    console.warn(`  ⚠️ intent غير موجود: ${item.intentId}`);
                    counts.errors++;
                    continue;
                }
                
                await db.collection('ai_keywords').add({
                    words: words,
                    intentId: item.intentId,
                    type: 'intent_match',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'my-ai-data'
                });
                
                // تحديث الذاكرة
                intent.keywords = [...new Set([...intent.keywords, ...words])];
                
                counts.teaching++;
                if (settings.showDetails) {
                    console.log(`  ✅ "${item.words}" → ${item.intentId}`);
                }
            } catch(e) {
                console.error(`  ❌ ${item.words}:`, e.message);
                counts.errors++;
            }
        }
        
        console.log(`  📊 محفوظ: ${counts.teaching}`);
    }
    
    // ═══════════════════════════════════════════════════
    //  4) النوايا المخصصة
    // ═══════════════════════════════════════════════════
    if (data.customIntents && data.customIntents.length > 0) {
        console.log('\n✨ حفظ النوايا المخصصة...');
        
        for (const item of data.customIntents) {
            if (!item.id || !item.keywords || item.keywords.length === 0 || !item.response) {
                if (skipEmpty) { counts.skipped++; continue; }
                counts.errors++;
                continue;
            }
            
            try {
                // إضافة في الذاكرة
                if (typeof AI_INTENTS !== 'undefined') {
                    const existing = AI_INTENTS.find(i => i.id === item.id);
                    if (existing) {
                        existing.keywords = [...new Set([...existing.keywords, ...item.keywords])];
                    } else {
                        AI_INTENTS.push({
                            id: item.id,
                            cat: 'custom',
                            keywords: item.keywords,
                            handle: () => item.response
                        });
                    }
                }
                
                await db.collection('ai_keywords').add({
                    intentId: item.id,
                    words: item.keywords,
                    response: item.response,
                    type: 'custom_intent',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: 'my-ai-data'
                });
                
                counts.customIntents++;
                if (settings.showDetails) {
                    console.log(`  ✅ ${item.id}`);
                }
            } catch(e) {
                console.error(`  ❌ ${item.id}:`, e.message);
                counts.errors++;
            }
        }
        
        console.log(`  📊 محفوظ: ${counts.customIntents}`);
    }
    
    // ═══════════════════════════════════════════════════
    //  5) إعادة تحميل المحرك
    // ═══════════════════════════════════════════════════
    if (settings.autoReload) {
        console.log('\n🔄 إعادة تحميل المحرك...');
        
        if (typeof window._aiEngineLoaded !== 'undefined') {
            window._aiEngineLoaded = false;
        }
        
        if (typeof aiEngineLoad === 'function') {
            try {
                await aiEngineLoad();
                console.log('  ✅ ai-engine مُحدَّث');
            } catch(e) {
                console.warn('  ⚠️', e.message);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════
    //  6) التقرير النهائي
    // ═══════════════════════════════════════════════════
    console.log('');
    console.log('═══════════════════════════════════');
    console.log('📊 التقرير النهائي');
    console.log('═══════════════════════════════════');
    console.log(`📚 معرفة:         ${counts.knowledge}`);
    console.log(`🔄 مرادفات:       ${counts.synonyms}`);
    console.log(`🎓 تعليم:         ${counts.teaching}`);
    console.log(`✨ نوايا مخصصة:   ${counts.customIntents}`);
    console.log(`⏭️ متخطى:        ${counts.skipped}`);
    console.log(`❌ أخطاء:         ${counts.errors}`);
    console.log('═══════════════════════════════════');
    
    const total = counts.knowledge + counts.synonyms + 
                  counts.teaching + counts.customIntents;
    console.log(`🎉 الإجمالي: ${total} عنصر محفوظ`);
    
    // اختبار سريع
    if (settings.testAfter) {
        console.log('');
        console.log('🧪 اختبار سريع:');
        if (counts.knowledge > 0 && data.knowledge[0].q) {
            try {
                const reply = await answerAIQuestion(data.knowledge[0].q);
                console.log(`  "${data.knowledge[0].q}"`);
                console.log(`  → ${reply.substring(0, 150)}`);
            } catch(e) {
                console.warn('  اختبار فشل:', e.message);
            }
        }
    }
    
    console.log('');
    console.log('═══════════════════════════════════');
    console.log('✅ اكتمل التحميل!');
    console.log('═══════════════════════════════════');
    
    return counts;
})();
