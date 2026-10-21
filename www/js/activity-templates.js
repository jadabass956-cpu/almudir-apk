// ============================================================
//  ALMUDIR — Wizard إعداد المواد (يقرأ من Firestore)
// ============================================================

// 🗂️ Cache
window.TEMPLATES_CACHE = {};
window.TEMPLATES_LOADED = false;

// ============================================================
//  تحميل القوالب من Firestore
// ============================================================
async function loadActivityTemplates() {
    try {
        const snap = await db.collection('activity_templates').get();
        const cache = {};
        snap.forEach(doc => {
            const d = doc.data();
            if (d.activity) {
                cache[d.activity] = { id: doc.id, ...d };
            }
        });
        window.TEMPLATES_CACHE = cache;
        window.TEMPLATES_LOADED = true;
        console.log('📚 [Templates] loaded:', Object.keys(cache).length, 'activities');
        return cache;
    } catch (e) {
        console.warn('[Templates] load failed:', e);
        return {};
    }
}

// ============================================================
//  الحالة العامة
// ============================================================
let _wizardState = {
    items: [],
    currentIndex: 0,
    completed: [],
    skipped: [],
    activity: '',
    active: false
};

// ============================================================
//  عرض شاشة الترحيب
// ============================================================
async function showActivityWelcome() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const activity = currentUser.businessType;
    if (!activity) return;

    // حمّل القوالب
    if (!window.TEMPLATES_LOADED) {
        await loadActivityTemplates();
    }

    const template = window.TEMPLATES_CACHE[activity];
    if (!template || !template.items || !template.items.length) {
        console.log('ℹ️ لا يوجد قالب لهذا النشاط:', activity);
        return;
    }

    const count = template.items.length;
    const wizardDone = currentUser.wizardCompleted || localStorage.getItem('wizard_' + currentUser.uid) === 'completed';

    // اعرض Modal
    const modal = document.getElementById('activityWelcomeModal');
    if (!modal) return;

    // 🎨 الرأس
    document.getElementById('awIcon').textContent = template.icon || '📦';
    document.getElementById('awTitle').textContent = (template.icon || '') + ' ' + activity;

    // 📊 حالة الإعداد
    const statusBox = document.getElementById('awStatusBox');
    const statusText = document.getElementById('awStatusText');
    if (statusBox && statusText) {
        if (wizardDone) {
            statusText.textContent = '✅ مكتمل';
            statusBox.style.background = '#f0fdf4';
            statusBox.style.borderRightColor = '#27ae60';
            statusText.style.color = '#27ae60';
        } else {
            statusText.textContent = '❌ غير مكتمل';
            statusBox.style.background = '#fef2f2';
            statusBox.style.borderRightColor = '#e74c3c';
            statusText.style.color = '#e74c3c';
        }
    }

    // 📦 عدد المواد في القالب
    document.getElementById('awCount').textContent = count;

    // 📦 عدد المواد الموجودة
    const existingCount = (typeof materials !== 'undefined' ? materials.length : 0);
    const existingRow = document.getElementById('awExistingRow');
    const existingCnt = document.getElementById('awExistingCount');
    if (existingRow && existingCnt) {
        if (existingCount > 0) {
            existingCnt.textContent = existingCount;
            existingRow.style.display = 'block';
        } else {
            existingRow.style.display = 'block';
            existingCnt.textContent = '0';
        }
    }

    // 📦 عنوان الخيارات + معلومات القالب
    const optionsTitle = document.getElementById('awOptionsTitle');
    const fullInfo = document.getElementById('awFullTemplateInfo');
    if (optionsTitle) {
        optionsTitle.textContent = wizardDone ? 'اختر طريقة إضافة الرصيد:' : 'اختر طريقة إعداد الرصيد:';
    }
    if (fullInfo) {
        fullInfo.textContent = 'إضافة ' + count + ' مادة بأرصدة 0';
    }

    modal.classList.add('show');
}

function closeActivityWelcome() {
    if (typeof currentUser !== 'undefined' && currentUser) {
        localStorage.setItem('wizard_' + currentUser.uid, 'skipped');
    }
    const modal = document.getElementById('activityWelcomeModal');
    if (modal) modal.classList.remove('show');
}

// ============================================================
//  بدء الـ Wizard
// ============================================================
async function startActivityWizard() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    const activity = currentUser.businessType;

    if (!window.TEMPLATES_LOADED) {
        await loadActivityTemplates();
    }
    const template = window.TEMPLATES_CACHE[activity];

    if (!template || !template.items || !template.items.length) {
        alert('لا يوجد قالب لهذا النشاط');
        return;
    }

    // ✨ الفلترة الذكية: نميّز الموجود من الجديد
    const allItems = template.items.slice(0, 100);
    const materialsList = (typeof materials !== 'undefined' ? materials : []);

    // 🔍 دالة تنظيف الاسم (تتجاهل المسافات والهمزات والتشكيل)
    function _cleanName(s) {
        if (!s) return '';
        return String(s)
            .replace(/[أإآا]/g, 'ا')
            .replace(/[ىي]/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/[ًٌٍَُِّْـ]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    console.log('🔍 [Wizard] عدد المواد الحالية:', materialsList.length);
    materialsList.forEach((m, i) => {
        console.log('   [' + i + '] "' + (m.name || '') + '" → "' + _cleanName(m.name) + '"');
    });

    const itemsWithMeta = allItems.map(item => {
        const cleanTemplateName = _cleanName(item.name);
        const existing = materialsList.find(m => _cleanName(m.name) === cleanTemplateName);
        
        console.log('   📦 "' + item.name + '" → "' + cleanTemplateName + '" | موجود: ' + (!!existing));
        
        return {
            ...item,
            _isExisting: !!existing,
            _existingId: existing ? existing.id : null,
            _existingStock: existing ? existing.stock : 0,
            _existingSale: existing ? existing.saleSYP : 0,
            _existingCost: existing ? existing.costSYP : 0
        };
    });

    const foundCount = itemsWithMeta.filter(i => i._isExisting).length;
    console.log('✅ [Wizard] ' + foundCount + ' من ' + itemsWithMeta.length + ' موجودة مسبقاً');

    _wizardState = {
        items: itemsWithMeta,
        currentIndex: 0,
        completed: [],       // جديدة تُضاف
        updated: [],         // موجودة تُحدَّث
        skipped: [],
        activity: activity,
        active: true
    };

    document.getElementById('activityWelcomeModal').classList.remove('show');
    document.getElementById('activityWizardModal').classList.add('show');

    renderWizardItem();
}

// ============================================================
//  عرض منتج
// ============================================================
function renderWizardItem() {
    if (!_wizardState.active) return;

    const idx = _wizardState.currentIndex;
    const total = _wizardState.items.length;

    if (idx >= total) {
        showWizardComplete();
        return;
    }

    const item = _wizardState.items[idx];

    const pct = Math.round((idx / total) * 100);
    document.getElementById('awProgressBar').style.width = pct + '%';
    document.getElementById('awProgressText').textContent = (idx + 1) + ' من ' + total;
    document.getElementById('awProgressPct').textContent = pct + '%';

    document.getElementById('awItemName').textContent = item.name || 'بدون اسم';
    document.getElementById('awItemUnit').textContent = 'الوحدة: ' + (item.unit || 'قطعة');

    document.getElementById('awQty').value = '';
    document.getElementById('awCost').value = item.costSYP || '';
    document.getElementById('awSale').value = item.saleSYP || '';

    const bcField = document.getElementById('awBarcode');
    if (bcField) bcField.value = item.barcode || '';

    // شارة موجود مسبقاً
    const existingBadge = document.getElementById('awExistingBadge');
    const nextBtn = document.getElementById('awNextBtn');
    const existingStockEl = document.getElementById('awExistingStock');

    console.log('RENDER-DEBUG item=' + item.name + ' isExisting=' + item._isExisting);

    if (item._isExisting) {
        if (existingBadge) existingBadge.style.display = 'block';
        if (existingStockEl) existingStockEl.textContent = item._existingStock || 0;
        if (nextBtn) {
            nextBtn.innerHTML = '🔄 تحديث الموجود';
            nextBtn.style.background = '#3498db';
        }
        if (document.getElementById('awQty')) {
            document.getElementById('awQty').value = item._existingStock || 0;
        }
        if (document.getElementById('awCost')) {
            document.getElementById('awCost').value = item._existingCost || item.costSYP || '';
        }
        if (document.getElementById('awSale')) {
            document.getElementById('awSale').value = item._existingSale || item.saleSYP || '';
        }
    } else {
        if (existingBadge) existingBadge.style.display = 'none';
        if (nextBtn) {
            nextBtn.innerHTML = '✅ التالي';
            nextBtn.style.background = '#27ae60';
        }
    }

    setTimeout(function() {
        const qty = document.getElementById('awQty');
        if (qty) qty.focus();
    }, 100);
}

// ============================================================
//  التالي
// ============================================================
function wizardNext() {
    const idx = _wizardState.currentIndex;
    const item = _wizardState.items[idx];

    const qty = parseFloat(document.getElementById('awQty').value) || 0;
    const cost = parseFloat(document.getElementById('awCost').value) || 0;
    const sale = parseFloat(document.getElementById('awSale').value) || 0;
    const barcode = (document.getElementById('awBarcode')?.value || '').trim();

    if (qty <= 0 && cost <= 0 && sale <= 0) {
        _wizardState.skipped.push(item.name);
    } else {
        _wizardState.completed.push({
            name: item.name,
            unit: item.unit || 'قطعة',
            stock: qty,
            minStock: Math.max(1, Math.floor(qty * 0.2)),
            costSYP: cost,
            costUSD: 0,
            saleSYP: sale,
            saleUSD: 0,
            barcode: barcode
        });
    }

    _wizardState.currentIndex++;
    renderWizardItem();
}

function wizardSkip() {
    const idx = _wizardState.currentIndex;
    const item = _wizardState.items[idx];
    _wizardState.skipped.push(item.name);
    _wizardState.currentIndex++;
    renderWizardItem();
}

// ============================================================
//  🆕 تخطي الإعداد بالكامل
// ============================================================
function wizardSkipAll() {
    if (!confirm('هل تريد تخطي الإعداد بالكامل؟\n\nيمكنك العودة إليه لاحقاً من الإعدادات.')) return;

    _wizardState.active = false;

    if (typeof currentUser !== 'undefined' && currentUser) {
        localStorage.setItem('wizard_' + currentUser.uid, 'skipped');
    }

    document.getElementById('activityWizardModal').classList.remove('show');
    _wizardState = { items: [], currentIndex: 0, completed: [], skipped: [], activity: '', active: false };

    if (typeof showToast === 'function') {
        showToast('⏭️ تم تخطي الإعداد — يمكنك العودة لاحقاً', 'info');
    }
}

// ============================================================
//  الإنهاء
// ============================================================
function showWizardComplete() {
    _wizardState.active = false;

    const addedCount = _wizardState.completed.length;
    const updatedCount = _wizardState.updated.length;
    const skippedCount = _wizardState.skipped.length;

    document.getElementById('awDoneCount').textContent = addedCount;
    document.getElementById('awDoneSkipped').textContent = skippedCount;

    // ✨ عرض عدد المُحدَّث
    const updEl = document.getElementById('awDoneUpdated');
    const updBox = document.getElementById('awDoneUpdatedBox');
    if (updEl && updBox) {
        if (updatedCount > 0) {
            updEl.textContent = updatedCount;
            updBox.style.display = 'block';
        } else {
            updBox.style.display = 'none';
        }
    }

    document.getElementById('wizardItemsView').style.display = 'none';
    document.getElementById('wizardDoneView').style.display = 'block';
}

async function wizardFinish() {
    const btn = document.querySelector('#wizardDoneView .btn-save');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري الحفظ...'; }

    try {
        if (typeof materials !== 'undefined' && _wizardState.completed.length > 0) {
            _wizardState.completed.forEach((item, i) => {
                materials.push({
                    id: (typeof materialId !== 'undefined' ? materialId++ : Date.now() + i),
                    barcode: item.barcode || '',
                    name: item.name,
                    type: _wizardState.activity,
                    unit: item.unit,
                    stock: item.stock,
                    minStock: item.minStock,
                    costSYP: item.costSYP,
                    costUSD: 0,
                    saleSYP: item.saleSYP,
                    saleUSD: 0
                });
            });

            if (typeof saveAllData === 'function') await saveAllData();
            if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
        }

        if (typeof currentUser !== 'undefined' && currentUser) {
            localStorage.setItem('wizard_' + currentUser.uid, 'completed');
            try {
                await db.collection('users').doc(_getEffectiveUid()).update({
                    wizardCompleted: true,
                    wizardCompletedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) { console.warn('wizard update:', e); }
        }

        document.getElementById('activityWizardModal').classList.remove('show');

        if (typeof showToast === 'function') {
            showToast('🎉 تم إضافة ' + _wizardState.completed.length + ' منتج بنجاح!', 'success');
        } else {
            alert('🎉 تم إضافة ' + _wizardState.completed.length + ' منتج بنجاح!');
        }

        setTimeout(() => {
            if (typeof openPage === 'function') openPage('materials');
        }, 500);

    } catch (e) {
        console.error('[Wizard] save failed:', e);
        alert('❌ خطأ: ' + e.message);
        if (btn) { btn.disabled = false; btn.textContent = '🚀 ابدأ الاستخدام'; }
    }
}



// ============================================================
//  مسح الباركود في Wizard
// ============================================================
async function wizardScanBarcode() {
    // 1) ML Kit (للأندرويد)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
        try {
            const { BarcodeScanner } = window.Capacitor.Plugins;
            const perm = await BarcodeScanner.requestPermissions();
            if (perm.camera === 'granted' || perm.camera === 'limited') {
                const result = await BarcodeScanner.scan();
                if (result.barcodes && result.barcodes.length > 0) {
                    document.getElementById('awBarcode').value = result.barcodes[0].rawValue;
                    return;
                }
            }
        } catch (e) { console.warn('MLKit:', e); }
    }

    // 2) html5-qrcode (للويب)
    if (typeof Html5Qrcode !== 'undefined') {
        _openWizardScanner();
        return;
    }

    // 3) Fallback
    const code = prompt('📷 أدخل الباركود يدوياً:');
    if (code) document.getElementById('awBarcode').value = code.trim();
}

// ---------- كاميرا الماسح (للمستخدم) ----------
let _wizardScannerInstance = null;

function _openWizardScanner() {
    if (document.getElementById('wizardScannerOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'wizardScannerOverlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:#000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center;';
    overlay.innerHTML = `
        <div style="color:white; font-size:16px; margin-bottom:15px;">📷 وجّه الكاميرا نحو الباركود</div>
        <div id="wizardScannerReader" style="width:90%; max-width:400px;"></div>
        <button id="wizardScannerClose" style="margin-top:20px; padding:12px 24px; background:#e74c3c; color:white; border:none; border-radius:10px; font-size:16px; cursor:pointer;">❌ إلغاء</button>
    `;
    document.body.appendChild(overlay);

    const cleanup = () => {
        if (_wizardScannerInstance) {
            try {
                _wizardScannerInstance.stop().then(() => {
                    _wizardScannerInstance.clear();
                    _wizardScannerInstance = null;
                }).catch(() => { _wizardScannerInstance = null; });
            } catch (e) { _wizardScannerInstance = null; }
        }
        setTimeout(() => {
            const el = document.getElementById('wizardScannerOverlay');
            if (el) el.remove();
        }, 100);
    };

    document.getElementById('wizardScannerClose').onclick = cleanup;

    try {
        _wizardScannerInstance = new Html5Qrcode('wizardScannerReader');
        _wizardScannerInstance.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                const bc = document.getElementById('awBarcode');
                if (bc) bc.value = decodedText;
                cleanup();
            },
            () => {}
        ).catch(err => {
            console.error('Scanner error:', err);
            alert('❌ تعذر فتح الكاميرا: ' + (err.message || err));
            cleanup();
        });
    } catch (e) {
        console.error('Scanner init error:', e);
        alert('❌ خطأ في تشغيل الماسح');
        cleanup();
    }
}



// ============================================================
//  ✨ إعادة فتح Wizard الإعداد (من الإعدادات)
//  يدعم النظام الجديد: عرض الجديد + الموجود مع شارات
// ============================================================
async function reopenWizard() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        alert('يجب تسجيل الدخول');
        return;
    }

    // 1) تحقق من وجود نشاط
    if (!currentUser.businessType) {
        alert('⚠️ لم تحدد نشاطك التجاري بعد\n\nاذهب إلى الملف الشخصي وحدد نشاطك');
        if (typeof openPage === 'function') openPage('profile');
        return;
    }

    // 2) حمّل القوالب
    if (!window.TEMPLATES_LOADED) {
        await loadActivityTemplates();
    }

    const template = window.TEMPLATES_CACHE[currentUser.businessType];

    if (!template || !template.items || !template.items.length) {
        alert('⚠️ لا يوجد قالب جاهز لنشاطك: ' + currentUser.businessType + '\n\nيمكنك التواصل مع الدعم');
        return;
    }

    // 3) امسح حالة localStorage (يسمح بإعادة الفتح)
    localStorage.removeItem('wizard_' + currentUser.uid);

    // 4) 🎯 استدعِ الترحيب — سيفلتر المواد تلقائياً
    const modal = document.getElementById('activityWelcomeModal');
    if (!modal) {
        alert('خطأ: لم يُحمَّل المودال');
        return;
    }

    document.getElementById('awIcon').textContent = template.icon || '📦';
    document.getElementById('awTitle').textContent = currentUser.businessType;
    document.getElementById('awDescription').textContent = template.description || ('متجر ' + currentUser.businessType);
    document.getElementById('awCount').textContent = template.items.length;

    modal.classList.add('show');
}

console.log('📱 [activity-templates] جاهز');


// ============================================================
//  🎯 دوال شاشة الترحيب المُحدّثة
// ============================================================

// ---------- استيراد CSV من شاشة الترحيب ----------
function importStockFromWelcome() {
    const modal = document.getElementById('activityWelcomeModal');
    if (modal) modal.classList.remove('show');

    // افتح نافذة الاستيراد
    setTimeout(() => {
        if (typeof openOpeningStockForm === 'function') {
            openOpeningStockForm();
            // ضع علامة "الإعداد منجز"
            if (typeof currentUser !== 'undefined' && currentUser) {
                localStorage.setItem('wizard_' + currentUser.uid, 'completed');
            }
        } else {
            alert('⚠️ ميزة الاستيراد غير متوفرة');
        }
    }, 300);
}

// ---------- استخدام القالب كاملاً ----------
async function useFullTemplate() {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    const activity = currentUser.businessType;

    if (!window.TEMPLATES_LOADED) {
        await loadActivityTemplates();
    }

    const template = window.TEMPLATES_CACHE[activity];
    if (!template || !template.items || !template.items.length) {
        return alert('⚠️ لا يوجد قالب لهذا النشاط');
    }

    const items = template.items.slice(0, 100);   // حد أقصى 100
    const materialsList = (typeof materials !== 'undefined' ? materials : []);

    // دالة تنظيف الاسم
    function _cleanName(s) {
        if (!s) return '';
        return String(s)
            .replace(/[أإآا]/g, 'ا')
            .replace(/[ىي]/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/[ًٌٍَُِّْـ]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    // فحص: كم مادة جديدة؟
    const newItems = items.filter(item => {
        const cleanName = _cleanName(item.name);
        return !materialsList.find(m => _cleanName(m.name) === cleanName);
    });

    if (newItems.length === 0) {
        return alert('✅ كل مواد القالب موجودة مسبقاً!');
    }

    if (!confirm(`📦 إضافة ${newItems.length} مادة جديدة؟\n\n(من أصل ${items.length} في القالب)\n\nسيتم إضافتها بأرصدة 0 — يمكنك تعديلها لاحقاً.`)) return;

    try {
        let added = 0;
        newItems.forEach((item, i) => {
            materials.push({
                id: (typeof materialId !== 'undefined' ? materialId++ : Date.now() + i),
                barcode: item.barcode || '',
                name: item.name,
                type: activity,
                unit: item.unit || 'قطعة',
                stock: 0,
                minStock: item.minStock || 0,
                costSYP: item.costSYP || 0,
                costUSD: 0,
                saleSYP: item.saleSYP || 0,
                saleUSD: 0
            });
            added++;
        });

        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();

        // ضع علامة "الإعداد منجز"
        localStorage.setItem('wizard_' + currentUser.uid, 'completed');
        try {
            await db.collection('users').doc(_getEffectiveUid()).update({
                wizardCompleted: true,
                wizardCompletedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) { console.warn('wizard update:', e); }

        // أغلق شاشة الترحيب
        const modal = document.getElementById('activityWelcomeModal');
        if (modal) modal.classList.remove('show');

        if (typeof showSuccessToast === 'function') {
            showSuccessToast({
                title: '📦 تم إضافة القالب!',
                details: [
                    { icon: '📦', label: 'المواد المُضافة', value: added },
                    { icon: '💰', label: 'الأرصدة', value: '0 (عدّلها لاحقاً)' },
                    { icon: '💡', label: 'الخطوة التالية', value: 'استخدم "رصيد افتتاحي"' }
                ],
                duration: 8000
            });
        } else {
            alert('✅ تم إضافة ' + added + ' مادة');
        }

        // افتح صفحة المواد
        setTimeout(() => {
            if (typeof openPage === 'function') openPage('materials');
        }, 500);

    } catch(e) {
        console.error('[full-template]', e);
        alert('❌ ' + e.message);
    }
}

console.log('🎯 [welcome-options] جاهز');

// ============================================================
//  🎯 الزر الذكي: إعداد المواد / رصيد افتتاحي
// ============================================================

// ---------- فتح الزر الذكي ----------
async function openSmartSetup() {
    // 🎯 دائماً افتح شاشة الـ Setup (بحالة الإعداد + الخيارات)
    if (typeof showActivityWelcome === 'function') {
        await showActivityWelcome();
        
        // إن لم تُفتح (لا يوجد قالب للنشاط)، افتح الرصيد الافتتاحي
        const modal = document.getElementById('activityWelcomeModal');
        if (!modal || !modal.classList.contains('show')) {
            if (typeof openOpeningStockForm === 'function') {
                openOpeningStockForm();
            }
        }
    } else if (typeof openOpeningStockForm === 'function') {
        openOpeningStockForm();
    }
}

// ---------- تحديث نص الزر تلقائياً ----------
async function updateSmartSetupBtn() {
    const btn = document.getElementById('setupMaterialsBtn');
    if (!btn) return;

    const wizardDone = currentUser?.wizardCompleted || 
                       localStorage.getItem('wizard_' + (currentUser?.uid || '')) === 'completed';

    if (!wizardDone) {
        btn.innerHTML = '🚀 إعداد المواد';
        btn.style.background = '#e67e22';
        btn.title = 'أضف موادك الأولى (يدوي / CSV / قالب)';
    } else {
        btn.innerHTML = '🚀 إعداد المواد ☑️ تم';
        btn.style.background = '#27ae60';
        btn.title = 'إضافة رصيد افتتاحي';
    }
}

// ---------- استدعاء التحديث عند فتح صفحة المواد ----------
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateSmartSetupBtn, 1000);
    });
    // عند فتح صفحة المواد
    const _originalOpenPage = window.openPage;
    if (typeof _originalOpenPage === 'function') {
        window.openPage = function(page) {
            const result = _originalOpenPage.apply(this, arguments);
            if (page === 'materials') {
                setTimeout(updateSmartSetupBtn, 300);
            }
            return result;
        };
    }
}

console.log('🎯 [smart-setup] جاهز');
