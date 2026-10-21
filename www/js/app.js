
// ===== ML Kit Helper =====
async function almudirEnsureMlKit() {
    const { BarcodeScanner } = window.Capacitor.Plugins;

    // 1) هل الجهاز يدعم المسح؟
    try {
        const sup = await BarcodeScanner.isSupported();
        if (!sup.supported) {
            alert('هذا الجهاز لا يدعم المسح بـ ML Kit');
            return false;
        }
    } catch (e) { console.warn('isSupported failed:', e); }

    // 2) هل الوحدة مثبتة؟
    try {
        const mod = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!mod.available) {
            await BarcodeScanner.installGoogleBarcodeScannerModule();
            alert('يتم تثبيت وحدة المسح الآن...\n\nسيُفتح متجر Play، اضغط "تثبيت" ثم ارجع للتطبيق وأعد المحاولة.');
            return false;
        }
    } catch (e) { console.warn('module check failed:', e); }

    return true;
}
// ===== END Helper =====


// ==================== دوال عامة ====================


// ============================================================
//  ✨ تطبيق إعدادات الدولة تلقائياً
// ============================================================
function applyCountryDefaults() {
    if (typeof COUNTRIES === 'undefined') return;
    
    const country = (typeof getCurrentCountry === 'function') 
        ? getCurrentCountry() 
        : COUNTRIES['+963'];
    
    if (!country) return;
    
    // 🎯 1) العملة في نموذج المبيعات
    const saleCurrency = document.getElementById('saleCurrency');
    if (saleCurrency && !saleCurrency.dataset.autoApplied) {
        saleCurrency.value = country.currency.primary;
        saleCurrency.dataset.autoApplied = 'true';
    }
    
    // 🎯 2) العملة في نموذج المصروفات
    const expCurrency = document.getElementById('expAmountCurrency');
    if (expCurrency && !expCurrency.dataset.autoApplied) {
        expCurrency.value = country.currency.primary;
        expCurrency.dataset.autoApplied = 'true';
    }
    
    // 🎯 3) الوحدات في نموذج المواد
    const matUnit = document.getElementById('matUnit');
    if (matUnit && matUnit.tagName === 'SELECT' && !matUnit.dataset.autoApplied) {
        matUnit.innerHTML = country.units.map(u => '<option value="' + u + '">' + u + '</option>').join('');
        matUnit.dataset.autoApplied = 'true';
    }
    
    // 🎯 4) فئات المصروفات
    const expCategory = document.getElementById('expCategory');
    if (expCategory && !expCategory.dataset.autoApplied) {
        expCategory.innerHTML = country.expenseCategories.map(c => '<option value="' + c + '">' + c + '</option>').join('');
        expCategory.dataset.autoApplied = 'true';
    }
    
    // 🎯 5) ملء قوائم العملات
    const allCurrencies = Object.keys(country.currencies);
    ['saleCurrency', 'expAmountCurrency'].forEach(function(id) {
        const sel = document.getElementById(id);
        if (sel && !sel.dataset.currenciesFilled) {
            const current = sel.value;
            sel.innerHTML = allCurrencies.map(code => {
                const c = country.currencies[code];
                return '<option value="' + code + '">' + c.name + ' (' + c.symbol + ')</option>';
            }).join('');
            if (allCurrencies.indexOf(current) >= 0) sel.value = current;
            sel.dataset.currenciesFilled = 'true';
        }
    });
    
    console.log('🌍 [Country] تم تطبيق إعدادات:', country.name);
}


// ============================================================
//  ✨ مساعد: الإجمالي النهائي للفاتورة (مع/بدون VAT)
// ============================================================
function getSaleGrandTotal(sale) {
    if (!sale) return 0;
    // للفواتير الجديدة
    if (typeof sale.grandTotal === 'number' && sale.grandTotal > 0) {
        return sale.grandTotal;
    }
    // للفواتير القديمة (بدون VAT)
    return parseFloat(sale.total) || 0;
}

function getSaleVAT(sale) {
    if (!sale) return 0;
    return parseFloat(sale.vat) || 0;
}


// ============================================================
//  ✨ مصدر موحّد لبيانات النشاط (الملف الشخصي > الإعدادات)
// ============================================================
function getBusinessInfo() {
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : {};
    const localSettings = (typeof settings !== 'undefined') ? settings : {};
    return {
        name: user.businessName || localSettings.businessName || 'اسم المحل',
        description: user.businessDescription || localSettings.businessDescription || '',
        signature: user.ownerSignature || localSettings.ownerSignature || ''
    };
}


// ============================================================
//  ✨ حساب أيام العمل (يتجاهل نهاية الأسبوع)
// ============================================================
function countWorkingDays(fromDate, toDate) {
    const country = (typeof getCurrentCountry === 'function') ? getCurrentCountry() : null;
    const weekend = (country && country.weekend) ? country.weekend : ['friday', 'saturday'];
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    let count = 0;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // جرّب كل يوم في الفترة
    let current = new Date(from);
    while (current <= to) {
        const dayName = dayNames[current.getDay()];
        if (weekend.indexOf(dayName) === -1) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}

/**
 * حساب المتوسط اليومي للمبيعات (على أيام العمل)
 */
function getDailyAverage(totalSales, fromDate, toDate) {
    const days = countWorkingDays(fromDate, toDate);
    if (days <= 0) return 0;
    return totalSales / days;
}

function openPage(page) {
    // 🛡️ فحص الاشتراك
    if (typeof guardPageAccess === 'function' && !guardPageAccess(page)) {
        console.log('🚫 openPage blocked:', page);
        return;
    }
    // ✨ تطبيق إعدادات الدولة
    if (typeof applyCountryDefaults === 'function') {
        try { applyCountryDefaults(); } catch(e) { console.warn('country:', e); }
    }

    // إغلاق القائمة الجانبية تلقائياً
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.remove('show');

    // 🚫 إخفاء الأزرار العائمة على صفحة الدعم
    document.body.classList.toggle('on-support-page', page === 'support');

    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(page).style.display = 'block';

    // 🆕 إعادة فحص حقول الأنشطة عند كل فتح صفحة
    setTimeout(() => {
        if (typeof applyActivityFieldsVisibility === 'function') {
            applyActivityFieldsVisibility();
        }
    }, 150);
    document.querySelectorAll('.main-nav button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.dropdown-menu button').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.main-nav button[data-page="${page}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    const activeDropBtn = document.querySelector(`.dropdown-menu button[data-page="${page}"]`);
    if (activeDropBtn) activeDropBtn.classList.add('active');
    document.getElementById('dropdownMenu').classList.remove('show');
    // 🎯 إخفاء بانر الإعداد السريع إذا أنجز المستخدم الإعداد
    if (page === 'materials') {
        // 🆕 إظهار الحقول الإجبارية حسب النشاط
        _updateRequiredFieldsBanner();
        
        // 🎯 إخفاء/إظهار الحقول الديناميكية
        setTimeout(applyActivityFieldsVisibility, 100);

        const banner = document.getElementById('quickSetupBanner');
        if (banner) {
            const user = auth && auth.currentUser;
            if (user) {
                const isCompleted = (typeof currentUser !== 'undefined' && currentUser && currentUser.wizardCompleted)
                    || localStorage.getItem('wizard_' + user.uid) === 'completed';
                banner.style.display = isCompleted ? 'none' : 'flex';
                console.log('🎯 [materials] إعداد منجز؟', isCompleted);
            } else {
                banner.style.display = 'flex';
            }
        }
    }

    if (page === 'sales') {
        // 🆕 إظهار/إخفاء حقول البيع حسب النشاط
        setTimeout(applyActivityFieldsVisibility, 100);

        // 💳 ملء قائمة الصناديق
        setTimeout(() => {
            if (typeof _populateRetailBoxSelect === 'function') _populateRetailBoxSelect();
            // 📦 ملء قائمة المستودعات
            if (typeof _populateSaleWarehouseSelect === 'function') _populateSaleWarehouseSelect();
        }, 100);
        updateMaterialSelect();
        updateRetailTable();
        const saleDate = document.getElementById('saleDate');
        if (saleDate && !saleDate.value) {
            saleDate.value = new Date().toISOString().slice(0, 10);
        }
        const invoiceNo = document.getElementById('invoiceNo');
        if (invoiceNo && !invoiceNo.value) {
            invoiceNo.value = generateInvoiceNumber();
        }
    }
    if (page === 'materials') updateMaterialsTable();
    if (page === 'analytics') {
        if (typeof updateAnalytics === 'function') updateAnalytics();
        if (typeof renderProfitAnalytics === 'function') renderProfitAnalytics();
    }
    if (page === 'disposals') {
        if (typeof loadDisposalsPage === 'function') loadDisposalsPage();
    }
    if (page === 'warehouse-transfers') {
        if (typeof loadTransfersPage === 'function') loadTransfersPage();
    }
    if (page === 'warehouses') {
        if (typeof loadWarehousesPage === 'function') loadWarehousesPage();
    }
    if (page === 'cost-history') {
        if (typeof loadCostHistoryPage === 'function') loadCostHistoryPage();
    }
    if (page === 'accounting-menu') {
        if (typeof renderAccountingPage === 'function') renderAccountingPage();
    }
    if (page === 'work-menu') {
        if (typeof renderWorkPage === 'function') renderWorkPage();
    }
    if (page === 'reports') {
        if (typeof loadReportsCenter === 'function') loadReportsCenter();
    }
    if (page === 'owner-withdrawals') {
        if (typeof loadOwnerWithdrawalsPage === 'function') loadOwnerWithdrawalsPage();
    }
    if (page === 'expenses') {
        updateExpensesTable();
        // 💳 ملء قائمة الصناديق
        setTimeout(() => {
            const sel = document.getElementById('expPaymentBox');
            if (sel && typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) {
                let html = '<option value="">— بدون صندوق —</option>';
                _pbCache.forEach(b => {
                    html += `<option value="${b.id}">${b.icon || '💰'} ${b.name} (${b.fmtBalance || b.balance || 0})</option>`;
                });
                sel.innerHTML = html;
            }
        }, 100);
    }
    if (page === 'debts') updateDebtsTable();
    if (page === 'statistics') updateStatistics();
    if (page === 'settings') loadSettings();
    if (page === 'support') openSupportPage();
    if (page === 'admin') { loadAdminUsers(); loadSupportConversations(); }
    if (page === 'ai-training' && typeof aiTrainingInit === 'function') { aiTrainingInit(); }
    if (page === 'bug-admin' && typeof bugAdminInit === 'function') { bugAdminInit(); }
    if (page === 'profile' && typeof profileInit === 'function') { profileInit(); }
    if (page === 'templates-admin' && typeof templatesAdminInit === 'function') { templatesAdminInit(); }
    if (page === 'my-subscription' && typeof subscriptionInit === 'function') { subscriptionInit(); }
}

function goHome() {
    openPage('materials');
}

function toggleMenu() {
    if (document.body.classList.contains('pin-locked')) return;
    // ✨ تحديث رأس القائمة عند كل فتح
    if (typeof updateSidebarHeader === 'function') {
        try { updateSidebarHeader(); } catch(e) { console.warn('sidebar:', e); }
    }
    document.getElementById('dropdownMenu').classList.toggle('show');
}

function updateAllTables() {
    updateMaterialsTable();
    updateSalesTable();
    updateExpensesTable();
    updateDebtsTable();
    updateStatistics();
}

// ==================== المواد ====================
// ═══════════════════════════════════════════════════════
//  💰 PRICING MODE — طريقة التسعير (ليرة / دولار محسوب)
// ═══════════════════════════════════════════════════════
function _matGetPricingMode() {
    const el = document.querySelector('input[name="matPricingMode"]:checked');
    return el ? el.value : 'syp';
}

function _matSetPricingMode(mode) {
    const sypLabel = document.getElementById('priceModeSypLabel');
    const usdLabel = document.getElementById('priceModeUsdLabel');
    const hint = document.getElementById('exchangeRateHint');
    const rateHint = document.getElementById('currentExchangeRateHint');

    // 🆕 الحقول
    const costSYPWrap = document.getElementById('matCostSYPWrap');
    const costUSDWrap = document.getElementById('matCostUSDWrap');
    const saleSYPWrap = document.getElementById('matSaleSYPWrap');
    const saleUSDWrap = document.getElementById('matSaleUSDWrap');

    if (mode === 'usd') {
        // ✅ تفعيل وضع الدولار
        if (sypLabel) { sypLabel.style.borderColor = '#ddd'; sypLabel.style.background = 'white'; }
        if (usdLabel) { usdLabel.style.borderColor = '#3498db'; usdLabel.style.background = '#e3f2fd'; }
        if (hint) {
            hint.style.display = 'block';
            const rate = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;
            if (rateHint) rateHint.textContent = rate > 0 ? rate.toFixed(2) : '⚠️ لم يُحدَّد';
        }

        // 🆕 إخفاء SYP، إظهار USD
        if (costSYPWrap) costSYPWrap.style.display = 'none';
        if (costUSDWrap) costUSDWrap.style.display = '';
        if (saleUSDWrap) saleUSDWrap.style.display = '';

        // حقل الليرة يبقى ظاهراً لكن للقراءة فقط (محسوب)
        if (saleSYPWrap) saleSYPWrap.style.display = '';
        const sypEl = document.getElementById('matSaleSYP');
        if (sypEl) {
            sypEl.readOnly = true;
            sypEl.style.background = '#f0f0f0';
            sypEl.style.cursor = 'not-allowed';
        }
        // إعادة حساب فوري
        _matOnUSDInput();
    } else {
        // ✅ تفعيل وضع الليرة السورية
        if (sypLabel) { sypLabel.style.borderColor = '#27ae60'; sypLabel.style.background = '#e8f5e9'; }
        if (usdLabel) { usdLabel.style.borderColor = '#ddd'; usdLabel.style.background = 'white'; }
        if (hint) hint.style.display = 'none';

        // 🆕 إظهار SYP، إخفاء USD
        if (costSYPWrap) costSYPWrap.style.display = '';
        if (costUSDWrap) costUSDWrap.style.display = 'none';
        if (saleSYPWrap) saleSYPWrap.style.display = '';
        if (saleUSDWrap) saleUSDWrap.style.display = 'none';

        const sypEl = document.getElementById('matSaleSYP');
        if (sypEl) {
            sypEl.readOnly = false;
            sypEl.style.background = '';
            sypEl.style.cursor = '';
        }
    }
}

function _matOnUSDInput() {
    const mode = _matGetPricingMode();
    if (mode !== 'usd') return;
    const usdEl = document.getElementById('matSaleUSD');
    const sypEl = document.getElementById('matSaleSYP');
    if (!usdEl || !sypEl) return;
    const usd = Number(usdEl.value) || 0;
    const rate = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;
    if (rate <= 0) {
        sypEl.value = '';
        sypEl.placeholder = '⚠️ حدد سعر الصرف أولاً';
        return;
    }
    const syp = usd * rate;
    sypEl.value = syp.toFixed(2);
}

function _matOnSYPInput() {
    // لا شيء — يبقى يدوي
}

// ═══════════════════════════════════════════════════════
//  🔄 RECALC ALL USD ITEMS — إعادة حساب كل المواد
// ═══════════════════════════════════════════════════════
async function recalcAllUSDItems() {
    const rate = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;
    if (rate <= 0) {
        alert('⚠️ الرجاء إدخال سعر الصرف أولاً');
        return;
    }

    const usdItems = materials.filter(m => m.pricingMode === 'usd' && Number(m.saleUSD) > 0);

    if (usdItems.length === 0) {
        alert('ℹ️ لا توجد مواد مُسعّرة بالدولار');
        return;
    }

    const msg = '🔄 إعادة حساب أسعار ' + usdItems.length + ' مادة بالدولار؟\n\n' +
                '💱 سعر الصرف الحالي: ' + rate.toFixed(2) + ' ل.س\n\n' +
                'سيُحدَّث سعر البيع بالليرة لكل مادة.';

    if (!confirm(msg)) return;

    try {
        let updated = 0;
        usdItems.forEach(m => {
            const newSYP = Math.round(Number(m.saleUSD) * rate * 100) / 100;
            if (Number(m.saleSYP) !== newSYP) {
                m.saleSYP = newSYP;
                updated++;
            }
        });

        await saveAllData();
        if (typeof updateAllTables === 'function') updateAllTables();

        if (typeof toast === 'function') toast('✅ تم تحديث ' + updated + ' مادة', 'success');
        else alert('✅ تم تحديث ' + updated + ' مادة');
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

async function addMaterial() {
    const barcodeField = document.getElementById('matBarcode');
    const barcode = barcodeField ? barcodeField.value.trim() : '';
    const name = document.getElementById('matName').value;
    const type = document.getElementById('matType').value;
    const unit = document.getElementById('matUnit').value;
    const stock = parseFloat(document.getElementById('matStock').value) || 0;
    const minStock = parseFloat(document.getElementById('matMinStock').value) || 0;
    const costSYP = parseFloat(document.getElementById('matCostSYP').value) || 0;
    const costUSD = parseFloat(document.getElementById('matCostUSD').value) || 0;
    const saleSYP = parseFloat(document.getElementById('matSaleSYP').value) || 0;
    const saleUSD = parseFloat(document.getElementById('matSaleUSD').value) || 0;

    // 🆕 حقول الصلاحية
    const expiryDate = document.getElementById('matExpiryDate')?.value || '';
    const batchNumber = document.getElementById('matBatchNumber')?.value?.trim() || '';

    // 🆕 حقول السوبرماركت
    const category = document.getElementById('matCategory')?.value || '';
    const wholesaleSYP = parseFloat(document.getElementById('matWholesaleSYP')?.value) || 0;
    const wholesaleUSD = parseFloat(document.getElementById('matWholesaleUSD')?.value) || 0;
    const secondaryUnit = document.getElementById('matSecondaryUnit')?.value || '';
    const secondaryFactor = parseFloat(document.getElementById('matSecondaryFactor')?.value) || 0;

    // 🖼️ الصورة
    const image = window._matImageTemp || '';

    // 🛒 عرض في المتجر
    const showInStore = document.getElementById('matShowInStore')?.checked === true;
    // 🎁 عرض خاص
    const onSale = document.getElementById('matOnSale')?.checked === true;
    const oldPriceSYP = parseFloat(document.getElementById('matOldPriceSYP')?.value) || 0;

    if (!name) { alert('الرجاء إدخال اسم المادة'); return; }

    // 🆕 إجبار حسب النشاط
    const _reqExp = (typeof requiresExpiry === 'function') ? requiresExpiry() : false;
    if (_reqExp && !expiryDate) {
        alert('⚠️ هذا النشاط يتطلب تاريخ الصلاحية لكل مادة!\n\nيرجى إدخال تاريخ الصلاحية.');
        const _el = document.getElementById('matExpiryDate');
        if (_el) _el.focus();
        return;
    }

    // 🆕 إجبار الباركود حسب النشاط
    const _reqBar = (typeof requiresBarcode === 'function') ? requiresBarcode() : false;
    if (_reqBar && !barcode) {
        alert('⚠️ هذا النشاط يتطلب الباركود لكل مادة!\n\nيرجى إدخال أو مسح الباركود.');
        const _el = document.getElementById('matBarcode');
        if (_el) _el.focus();
        return;
    }

    // 🆕 تحذير لو تاريخ الصلاحية قديم
    if (expiryDate) {
        const expD = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expD < today) {
            if (!confirm('⚠️ تاريخ الصلاحية المُدخل قديم (قبل اليوم) — هل أنت متأكد؟')) return;
        }
    }

    if (editingMaterialId) {
        requirePassword(async () => {
            const mat = materials.find(m => m.id === editingMaterialId);
            if (mat) {
                mat.barcode = barcode; mat.name = name; mat.type = type; mat.unit = unit;
                if (typeof adjustStock === 'function' && typeof getDefaultWarehouseId === 'function') {
                    try { adjustStock(mat.id, stock, 'set', getDefaultWarehouseId(), { reason: 'manual_edit' }); }
                    catch(e) { mat.stock = stock; }
                } else {
                    mat.stock = stock;
                }
                mat.minStock = minStock;
                mat.costSYP = costSYP; mat.costUSD = costUSD;
                mat.saleSYP = saleSYP; mat.saleUSD = saleUSD;
                // 🆕 حقول الصلاحية
                mat.expiryDate = expiryDate;
                mat.batchNumber = batchNumber;
                // 🆕 حقول السوبرماركت
                mat.category = category;
                mat.wholesaleSYP = wholesaleSYP;
                mat.wholesaleUSD = wholesaleUSD;
                mat.secondaryUnit = secondaryUnit;
                mat.secondaryFactor = secondaryFactor;
                // 🖼️ الصورة
                mat.image = image;
                // 🛒 عرض في المتجر
                mat.showInStore = showInStore;
                // 🎁 عرض خاص
                mat.onSale = onSale;
                mat.oldPriceSYP = oldPriceSYP;
            }
            editingMaterialId = null;
            window._matImageTemp = '';
            document.getElementById('matName').value = '';
    const barcodeClear = document.getElementById('matBarcode');
    if (barcodeClear) barcodeClear.value = '';
            document.getElementById('matType').value = '';
            document.getElementById('matStock').value = '';
            document.getElementById('matMinStock').value = '';
            document.getElementById('matCostSYP').value = '';
            document.getElementById('matCostUSD').value = '';
            document.getElementById('matSaleSYP').value = '';
            document.getElementById('matSaleUSD').value = '';
            // 🎁 تصفير عرض خاص
            const _onSaleCb4 = document.getElementById('matOnSale');
            if (_onSaleCb4) _onSaleCb4.checked = false;
            const _oldPriceEl4 = document.getElementById('matOldPriceSYP');
            if (_oldPriceEl4) _oldPriceEl4.value = '';
            const _oldPriceWrap4 = document.getElementById('matOldPriceWrap');
            if (_oldPriceWrap4) _oldPriceWrap4.style.display = 'none';
            updateMaterialsTable();
            await saveAllData();
            alert('تم تحديث المادة بنجاح');
        });
    } else {
        const _pricingMode = _matGetPricingMode();
        materials.push({
            id: materialId++,
            barcode: barcode,
            name, type, unit,
            stock, minStock,
            costSYP, costUSD,
            pricingMode: _pricingMode,
            costHistory: (costSYP > 0 ? [{
                date: new Date().toISOString().slice(0, 10),
                cost: costSYP,
                avgCost: costSYP,
                qty: stock || 0,
                source: 'manual',
                costBefore: 0,
                costChange: 0,
                createdAt: new Date().toISOString()
            }] : []),
            saleSYP, saleUSD,
            // 🆕 حقول الصلاحية
            expiryDate: expiryDate,
            batchNumber: batchNumber,
                    // 🆕 حقول السوبرماركت
                    category: category,
                    wholesaleSYP: wholesaleSYP,
                    wholesaleUSD: wholesaleUSD,
                    secondaryUnit: secondaryUnit,
                    secondaryFactor: secondaryFactor,
                    // 🖼️ الصورة
                    image: image,
                    // 🛒 عرض في المتجر
                    showInStore: showInStore,
                    // 🎁 عرض خاص
                    onSale: onSale,
                    oldPriceSYP: oldPriceSYP
        });
        window._matImageTemp = '';
        if (typeof _matUpdateImageUI === 'function') _matUpdateImageUI();
        document.getElementById('matName').value = '';
    const barcodeClear = document.getElementById('matBarcode');
    if (barcodeClear) barcodeClear.value = '';
        document.getElementById('matType').value = '';
        document.getElementById('matStock').value = '';
        // 🆕 إعادة تعيين وضع التسعير
        try {
            const sypRadio = document.querySelector('input[name="matPricingMode"][value="syp"]');
            if (sypRadio) {
                sypRadio.checked = true;
                _matSetPricingMode('syp');
            }
        } catch(e) {}
        document.getElementById('matMinStock').value = '';
        document.getElementById('matCostSYP').value = '';
        document.getElementById('matCostUSD').value = '';
        document.getElementById('matSaleSYP').value = '';
        document.getElementById('matSaleUSD').value = '';
        // 🎁 تصفير عرض خاص
        const _onSaleCb3 = document.getElementById('matOnSale');
        if (_onSaleCb3) _onSaleCb3.checked = false;
        const _oldPriceEl3 = document.getElementById('matOldPriceSYP');
        if (_oldPriceEl3) _oldPriceEl3.value = '';
        const _oldPriceWrap3 = document.getElementById('matOldPriceWrap');
        if (_oldPriceWrap3) _oldPriceWrap3.style.display = 'none';
        // 🆕 تصفير حقول الصلاحية
        const _expEl = document.getElementById('matExpiryDate');
        const _batchEl = document.getElementById('matBatchNumber');
        if (_expEl) _expEl.value = '';
        if (_batchEl) _batchEl.value = '';
            // 🆕 تنظيف حقول السوبرماركت
            const _catEl = document.getElementById('matCategory');
            const _wsSyp = document.getElementById('matWholesaleSYP');
            const _wsUsd = document.getElementById('matWholesaleUSD');
            const _secEl = document.getElementById('matSecondaryUnit');
            const _facEl = document.getElementById('matSecondaryFactor');
            if (_catEl) _catEl.value = '';
            if (_wsSyp) _wsSyp.value = '';
            if (_wsUsd) _wsUsd.value = '';
            if (_secEl) _secEl.value = '';
            if (_facEl) _facEl.value = '';
        updateMaterialsTable();
        await saveAllData();

        // ✨ المساهمة في قاعدة الباركود العامة (صامتة)
        if (barcode && typeof publicdb !== 'undefined' && publicdb.contribute) {
            publicdb.contribute(barcode, {
                name: name,
                type: type,
                unit: unit,
                price: (saleSYP > 0 ? saleSYP : 0),
                currency: 'SYP'
            }).then(r => {
                if (r && r.ok) {
                    console.log('✨ [addMaterial] تمت المساهمة:', r.action, barcode);
                } else if (r && r.reason) {
                    console.warn('⚠️ [addMaterial] المساهمة رُفضت:', r.reason);
                }
            }).catch(e => console.warn('[addMaterial] contribute:', e));
        }

        alert('تم حفظ المادة محلياً' + (navigator.onLine ? '' : ' (سيعمل Offline)'));

    }
}

function editMaterial(id) {
    const mat = materials.find(m => m.id === id);
    if (mat) {
        const matBarcodeField = document.getElementById('matBarcode');
        if (matBarcodeField) matBarcodeField.value = mat.barcode || '';
        document.getElementById('matName').value = mat.name;
        document.getElementById('matType').value = mat.type;
        document.getElementById('matUnit').value = mat.unit;
        document.getElementById('matStock').value = mat.stock;
        document.getElementById('matMinStock').value = mat.minStock;
        document.getElementById('matCostSYP').value = mat.costSYP || 0;
        document.getElementById('matCostUSD').value = mat.costUSD || 0;
        document.getElementById('matSaleSYP').value = mat.saleSYP || 0;
        document.getElementById('matSaleUSD').value = mat.saleUSD || 0;
        // 🖼️ الصورة
        window._matImageTemp = mat.image || '';
        if (typeof _matUpdateImageUI === 'function') _matUpdateImageUI();
        // 🛒 عرض في المتجر
        const _showInStoreCb = document.getElementById('matShowInStore');
        if (_showInStoreCb) _showInStoreCb.checked = mat.showInStore === true;
        // 🎁 عرض خاص
        const _onSaleCb = document.getElementById('matOnSale');
        if (_onSaleCb) _onSaleCb.checked = mat.onSale === true;
        const _oldPriceEl = document.getElementById('matOldPriceSYP');
        if (_oldPriceEl) _oldPriceEl.value = mat.oldPriceSYP || '';
        const _oldPriceWrap = document.getElementById('matOldPriceWrap');
        if (_oldPriceWrap) _oldPriceWrap.style.display = mat.onSale === true ? 'block' : 'none';
        editingMaterialId = id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 🖼️ دوال الصورة
async function _matCompressImage(file) {
    if (!file.type.startsWith('image/')) throw new Error('الملف ليس صورة');
    const rawDataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => rej(new Error('فشل قراءة الملف'));
        r.readAsDataURL(file);
    });
    const img = await new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('فشل تحميل الصورة'));
        im.src = rawDataUrl;
    });
    const MAX = 250;
    const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', 0.60);
    const sizeKB = Math.round(out.length * 3 / 4 / 1024);
    if (sizeKB > 60) throw new Error('الصورة كبيرة (' + sizeKB + 'KB)');
    return out;
}

window._matPickImage = async function(input) {
    const file = input?.files?.[0];
    if (!file) return;
    try {
        const dataUrl = await _matCompressImage(file);
        window._matImageTemp = dataUrl;
        _matUpdateImageUI();
    } catch (e) {
        alert('❌ ' + (e.message || e));
    } finally {
        input.value = '';
    }
};

window._matClearImage = function() {
    if (!window._matImageTemp) return;
    if (!confirm('🗑️ حذف صورة المادة؟')) return;
    window._matImageTemp = '';
    _matUpdateImageUI();
};

function _matUpdateImageUI() {
    const preview = document.getElementById('matImagePreview');
    if (!preview) return;
    const img = window._matImageTemp;
    if (img) {
        preview.style.backgroundImage = "url('" + img + "')";
        preview.style.borderStyle = 'solid';
        preview.style.borderColor = '#3498db';
        preview.textContent = '';
    } else {
        preview.style.backgroundImage = '';
        preview.style.borderStyle = 'dashed';
        preview.style.borderColor = '#ddd';
        preview.textContent = 'لا توجد صورة';
    }
}

// 🛒 تبديل عرض المادة في المتجر
window._matToggleShowInStore = async function(id, checked) {
    const mat = materials.find(m => m.id === id);
    if (!mat) return;
    mat.showInStore = checked === true;
    try {
        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof toast === 'function') {
            toast(checked ? '✅ ستُعرض في المتجر' : '⚪ لن تُعرض في المتجر', 'success');
        }
    } catch (e) {
        console.warn('[toggleShowInStore]', e);
        mat.showInStore = !checked;
        const cb = event?.target;
        if (cb) cb.checked = !checked;
        if (typeof toast === 'function') toast('❌ فشل الحفظ', 'error');
    }
};

// 🎁 تبديل عرض خاص من النموذج (UI فقط — الحفظ عند زر حفظ المادة)
window._matOnSaleToggle = function() {
    const cb = document.getElementById('matOnSale');
    const wrap = document.getElementById('matOldPriceWrap');
    const oldPriceEl = document.getElementById('matOldPriceSYP');
    const saleEl = document.getElementById('matSaleSYP');
    if (!cb || !wrap) return;
    if (cb.checked) {
        wrap.style.display = 'block';
        // 💡 Auto-fill: لو فارغ → املأ بسعر البيع الحالي
        if (oldPriceEl && !oldPriceEl.value && saleEl && parseFloat(saleEl.value) > 0) {
            oldPriceEl.value = saleEl.value;
        }
    } else {
        wrap.style.display = 'none';
    }
};

function deleteMaterial(id) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذه المادة؟')) {
            const index = materials.findIndex(m => m.id == id);
            if (index !== -1) {
                materials.splice(index, 1);
                updateMaterialsTable();
                await saveAllData();
                alert('تم حذف المادة بنجاح');
            } else {
                alert('المادة غير موجودة');
            }
        }
    });
}

function searchMaterials() {
    const query = document.getElementById('searchMaterial').value.toLowerCase();
    const filtered = materials.filter(m => m.name.toLowerCase().includes(query));
    renderMaterialsTable(filtered);
}

function updateMaterialsTable() { renderMaterialsTable(materials); }

// 🆕 حساب حالة الصلاحية
function _getExpiryInfo(expiryDate) {
    if (!expiryDate) return { label: '-', color: '', isExpired: false };
    const expD = new Date(expiryDate);
    if (isNaN(expD)) return { label: '-', color: '', isExpired: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expD.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((expD - today) / 86400000);

    if (daysLeft < 0) {
        return { label: '🔴 منتهي', color: '#e74c3c', isExpired: true };
    }
    if (daysLeft === 0) {
        return { label: '🔴 ينتهي اليوم', color: '#e74c3c', isExpired: true };
    }
    if (daysLeft <= 7) {
        return { label: `🟠 ${daysLeft} يوم`, color: '#e67e22' };
    }
    if (daysLeft <= 30) {
        return { label: `🟡 ${daysLeft} يوم`, color: '#f39c12' };
    }
    // 30+ يوم — اعرض التاريخ
    const y = expD.getFullYear();
    const m = String(expD.getMonth() + 1).padStart(2, '0');
    return { label: `🟢 ${y}-${m}`, color: '#27ae60' };
}

function renderMaterialsTable(list) {
    const table = document.getElementById('materialsTable');
    let html = '<tr><th>المعرف</th><th>الاسم</th><th>النوع</th><th>الوحدة</th><th>الكمية</th><th>💰 التكلفة</th><th>💵 البيع</th><th>📊 الربح</th><th>📅 الصلاحية</th><th>🛒</th><th>🎁</th><th>تعديل</th><th>حذف</th><th>إجراءات</th></tr>';
    list.forEach((m, index) => {
        const lowStock = m.stock < m.minStock ? 'class="low-stock"' : '';

        // 💰 كشف وضع التسعير (مع توافق خلفي للمواد القديمة)
        let _isUSD = m.pricingMode === 'usd';
        if (!_isUSD && !m.pricingMode) {
            const _hasUSD = (Number(m.saleUSD) > 0) || (Number(m.costUSD) > 0);
            const _hasSYP = (Number(m.saleSYP) > 0) || (Number(m.costSYP) > 0);
            if (_hasUSD && !_hasSYP) _isUSD = true;
        }

        // 💵 بناء العرض حسب الوضع
        let costDisplay, saleDisplay, profitDisplay;
        if (_isUSD) {
            const _cUSD = Number(m.costUSD) || 0;
            const _sUSD = Number(m.saleUSD) || 0;
            const _sSYP = Number(m.saleSYP) || 0;
            const _pUSD = _sUSD - _cUSD;
            costDisplay = '<div style="font-size:12px; color:#3498db; font-weight:700;">$' + _cUSD.toFixed(2) + '</div>';
            saleDisplay = '<div style="font-size:12px; color:#3498db; font-weight:700;">$' + _sUSD.toFixed(2) + '</div><div style="font-size:10px; color:#666; margin-top:2px;">' + _sSYP.toFixed(2) + ' ل.س</div>';
            profitDisplay = '<div style="font-size:12px;" class="' + (_pUSD >= 0 ? 'profit-positive' : 'profit-negative') + '">$' + _pUSD.toFixed(2) + '</div>';
        } else {
            const _cSYP = Number(m.costSYP) || 0;
            const _sSYP = Number(m.saleSYP) || 0;
            const _pSYP = _sSYP - _cSYP;
            costDisplay = '<div style="font-size:12px;">' + _cSYP.toFixed(2) + ' ل.س</div>';
            saleDisplay = '<div style="font-size:12px;">' + _sSYP.toFixed(2) + ' ل.س</div>';
            profitDisplay = '<div style="font-size:12px;" class="' + (_pSYP >= 0 ? 'profit-positive' : 'profit-negative') + '">' + _pSYP.toFixed(2) + ' ل.س</div>';
        }

        const modeBadge = _isUSD
            ? '<span style="display:inline-block; padding:2px 6px; background:#e3f2fd; color:#0d47a1; border-radius:4px; font-size:9px; font-weight:700; margin-left:4px;">💵</span>'
            : '';

        // 🆕 حساب حالة الصلاحية
        const expiryInfo = _getExpiryInfo(m.expiryDate);

        html += `<tr>
            <td>${m.id}</td>
            <td>${modeBadge}${m.name}</td>
            <td>${m.type || '-'}</td>
            <td>${m.unit}</td>
            <td ${lowStock}>${m.stock}${m.stock < m.minStock ? ' ⚠️' : ''}</td>
            <td>${costDisplay}</td>
            <td>${saleDisplay}</td>
            <td>${profitDisplay}</td>
            <td style="font-size:12px; ${expiryInfo.color ? 'color:' + expiryInfo.color + '; font-weight:bold;' : 'color:#999;'}">${expiryInfo.label}</td>
            <td style="text-align:center;"><input type="checkbox" ${m.showInStore === true ? 'checked' : ''} onchange="_matToggleShowInStore(${m.id}, this.checked)" style="width:18px; height:18px; accent-color:#27ae60; cursor:pointer;" title="عرض في المتجر"></td>
            <td style="text-align:center; font-size:16px;" title="${m.onSale === true && m.oldPriceSYP > 0 ? 'السعر القديم: ' + m.oldPriceSYP : 'لا يوجد عرض'}">${m.onSale === true ? '🎁' : '—'}</td>
            <td><button class="btn-edit" onclick="editMaterial(${m.id})">تعديل</button></td>
            <td><button class="btn-delete" onclick="deleteMaterial(${m.id})">حذف</button></td>
            ${expiryInfo.isExpired ? `<td><button onclick="openExpiryActions(${m.id})" style="padding:6px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">🗑️ إجراءات</button></td>` : '<td>-</td>'}
        </tr>`;
    });
    table.innerHTML = html;
    checkLowStock();
}

function checkLowStock() {
    const lowItems = materials.filter(m => m.stock < m.minStock);
    const alertBar = document.getElementById('lowStockAlert');
    if (lowItems.length > 0) {
        alertBar.style.display = 'block';
        alertBar.innerHTML = '⚠️ تنبيه: المواد التالية أقل من الحد الأدنى: ' + lowItems.map(m => `${m.name} (${m.stock} ${m.unit})`).join('، ');
    } else {
        alertBar.style.display = 'none';
    }
}

// ==================== المبيعات ====================
function generateInvoiceNumber() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const count = sales.length + 1;
    return `INV-${yyyy}${mm}${dd}-${String(count).padStart(3, '0')}`;
}

// 🆕 عرض الحقول الإجبارية حسب النشاط
function _updateRequiredFieldsBanner() {
    const banner = document.getElementById('matRequiredFieldsBanner');
    const list = document.getElementById('matRequiredFieldsList');
    if (!banner || !list) return;

    const _isAdmin = auth.currentUser?.email === 'jadabass956@gmail.com';
    if (_isAdmin) {
        banner.style.display = 'none';
        return;
    }

    const fields = [];
    if (typeof requiresExpiry === 'function' && requiresExpiry()) {
        fields.push('📅 تاريخ الصلاحية');
    }
    if (typeof requiresBarcode === 'function' && requiresBarcode()) {
        fields.push('🏷️ الباركود');
    }

    if (fields.length === 0) {
        banner.style.display = 'none';
        return;
    }

    list.textContent = fields.join(' + ');
    banner.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════
//  🎯 DYNAMIC FIELDS VISIBILITY — إخفاء/إظهار الحقول حسب النشاط
// ═══════════════════════════════════════════════════════════
function applyActivityFieldsVisibility(attempt) {
    attempt = attempt || 0;
    
    try {
        // 🔍 فحص تحميل activity_config
        const configLoaded = (typeof _activityConfig !== 'undefined') 
            && _activityConfig 
            && Object.keys(_activityConfig).length > 0;

        // 🚀 إطلاق التحميل إن لم يكن قد بدأ
        if (!configLoaded && typeof loadActivityConfig === 'function') {
            try { loadActivityConfig(); } catch(e) {}
        }

        // ⏳ لو لم تُحمَّل بعد — ننتظر ونُعيد
        if (!configLoaded && attempt < 15) {
            setTimeout(() => applyActivityFieldsVisibility(attempt + 1), 300);
            return;
        }
        
        // 📷 الباركود
        const barcodeWrap = document.getElementById('matBarcodeWrap');
        if (barcodeWrap) {
            const _showBarcode = (typeof requiresBarcode === 'function') 
                ? requiresBarcode() 
                : false;
            barcodeWrap.style.display = _showBarcode ? '' : 'none';
            console.log('📷 [fields] barcode:', _showBarcode ? '✅ ظاهر' : '❌ مخفي', 
                '(attempt=' + attempt + ')');
        }
        
        // 📅 الصلاحية + الدفعة
        const expiryWrap = document.getElementById('matExpiryWrap');
        if (expiryWrap) {
            const _showExpiry = (typeof requiresExpiry === 'function') 
                ? requiresExpiry() 
                : false;
            expiryWrap.style.display = _showExpiry ? '' : 'none';
            console.log('📅 [fields] expiry:', _showExpiry ? '✅ ظاهر' : '❌ مخفي',
                '(attempt=' + attempt + ')');
        }

            // 🆕 حقول السوبرماركت
            const _bType = (currentUser && currentUser.businessType) ? String(currentUser.businessType).trim() : '';
            // 🎯 مطابقة مرنة: أي نشاط يحتوي على "سوبر" أو "بقالة" أو "غذائي" أو "ماركت"
            const _isSuper = _bType && (
                _bType.includes('سوبر') ||
                _bType.includes('بقالة') ||
                _bType.includes('غذائي') ||
                _bType.includes('ماركت') ||
                _bType.includes('مواد غذائية')
            );

            const _catWrap = document.getElementById('matCategoryWrap');
            if (_catWrap) _catWrap.style.display = _isSuper ? '' : 'none';

            const _wsWrap = document.getElementById('matWholesaleWrap');
            if (_wsWrap) _wsWrap.style.display = _isSuper ? '' : 'none';

            const _secWrap = document.getElementById('matSecondaryUnitWrap');
            if (_secWrap) _secWrap.style.display = _isSuper ? '' : 'none';

            // 🆕 نوع السعر في الفاتورة (للسوبرماركت)
            const _ptWrap = document.getElementById('salePriceTypeWrap');
            if (_ptWrap) _ptWrap.style.display = _isSuper ? '' : 'none';

            console.log('🏪 [fields] supermarket:', _isSuper ? '✅ ظاهر' : '❌ مخفي', '| type:', _bType);
    } catch(e) {
        console.warn('[fields] visibility:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  🔍 MATERIAL SEARCH — بحث ذكي في قوائم المواد
// ═══════════════════════════════════════════════════════════
function _filterMaterialSelect(selectId, query) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const q = String(query || '').trim().toLowerCase();

    // جمع كل الـ options (مع إخفاء المطابقات السابقة)
    const allOptions = Array.from(select.options);

    let firstMatchValue = null;
    let matchCount = 0;

    allOptions.forEach(opt => {
        if (!opt.value || opt.value === '__new__') {
            // نُبقي الخيارات الخاصة ظاهرة دائماً
            opt.style.display = '';
            opt.hidden = false;
            return;
        }

        // البحث في: الاسم + النوع + الوحدة + الباركود
        const text = (opt.textContent || '').toLowerCase();
        const barcode = (opt.dataset?.barcode || '').toLowerCase();
        const name = (opt.dataset?.name || '').toLowerCase();
        const type = (opt.dataset?.type || '').toLowerCase();

        const matches = !q ||
            text.includes(q) ||
            name.includes(q) ||
            type.includes(q) ||
            barcode.includes(q);

        opt.style.display = matches ? '' : 'none';
        opt.hidden = !matches;

        if (matches) {
            matchCount++;
            if (!firstMatchValue) firstMatchValue = opt.value;
        }
    });

    // إذا كانت النتيجة واحدة فقط → اختيار تلقائي
    if (q && matchCount === 1 && firstMatchValue) {
        select.value = firstMatchValue;

        // استدعاء onchange يدوياً
        if (selectId === 'saleMaterial' && typeof calcTotal === 'function') {
            try { calcTotal(); } catch(e) {}
        } else if (selectId === 'purMaterial' && typeof purMaterialChanged === 'function') {
            try { purMaterialChanged(); } catch(e) {}
        }
    }

    // في حالة Enter → نختار الأول
    // (يُدار من مكان آخر)
    console.log('🔍 [search]', selectId, '| q:', q || '(فارغ)', '| مطابقات:', matchCount);
}

// عند الضغط Enter في حقل البحث → اختر أول مطابقة
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const target = e.target;
    if (!target) return;
    if (target.id === 'saleMaterialSearch') {
        e.preventDefault();
        _selectFirstMatch('saleMaterial');
    } else if (target.id === 'purMaterialSearch') {
        e.preventDefault();
        _selectFirstMatch('purMaterial');
    }
});

function _selectFirstMatch(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    for (const opt of select.options) {
        if (opt.value && opt.value !== '__new__' && !opt.hidden && !opt.disabled) {
            select.value = opt.value;
            // استدعاء onChange
            if (selectId === 'saleMaterial' && typeof calcTotal === 'function') {
                try { calcTotal(); } catch(e) {}
            } else if (selectId === 'purMaterial' && typeof purMaterialChanged === 'function') {
                try { purMaterialChanged(); } catch(e) {}
            }
            console.log('✅ [search] اختيار:', opt.textContent);
            return;
        }
    }
}

window._filterMaterialSelect = _filterMaterialSelect;
window._selectFirstMatch = _selectFirstMatch;

function updateMaterialSelect() {
    const select = document.getElementById('saleMaterial');
    if (!select) return;

    // 👑 المدير يرى كل شيء
    const _isAdmin = auth.currentUser?.email === 'jadabass956@gmail.com';

    // 🆕 فحص أولي: هل المواد المنتهية موجودة؟
    const _expiryFn = (typeof isMaterialExpired === 'function') ? isMaterialExpired : null;
    const _daysFn = (typeof daysUntilExpiry === 'function') ? daysUntilExpiry : null;

    let html = '<option value="">اختر المادة</option>';
    let _expiredCount = 0;

    materials.forEach(m => {
        const typeText = m.type ? ' - ' + m.type : '';
        let statusLabel = '';
        let disabled = false;
        let style = '';

        if (_expiryFn && _expiryFn(m)) {
            _expiredCount++;
            statusLabel = ' 🚫 منتهية';
            if (!_isAdmin) {
                disabled = true;
                style = 'color:#999; text-decoration:line-through;';
            } else {
                style = 'color:#e74c3c;';
                statusLabel = ' 🚫 منتهية [وضع المدير]';
            }
        } else if (_daysFn) {
            const d = _daysFn(m);
            if (d !== null && d >= 0 && d <= 7) {
                statusLabel = ` 🟠 ${d} يوم`;
            } else if (d !== null && d >= 0 && d <= 30) {
                statusLabel = ` 🟡 ${d} يوم`;
            }
        }

        html += `<option value="${m.id}" ${disabled ? 'disabled' : ''} style="${style}" data-sale-syp="${m.saleSYP || 0}" data-sale-usd="${m.saleUSD || 0}" data-wholesale-syp="${m.wholesaleSYP || 0}" data-wholesale-usd="${m.wholesaleUSD || 0}" data-stock="${m.stock}" data-name="${m.name}" data-type="${m.type || ''}" data-unit="${m.unit || ''}" data-barcode="${m.barcode || ''}">${m.name}${typeText}${statusLabel}</option>`;
    });

    select.innerHTML = html;

    // 🆕 عرض تحذير أعلى القائمة
    let warnEl = document.getElementById('expirySelectWarning');
    if (!warnEl) {
        warnEl = document.createElement('div');
        warnEl.id = 'expirySelectWarning';
        warnEl.style.cssText = 'background:#fff3cd; color:#856404; padding:8px 12px; border-radius:8px; margin-bottom:8px; font-size:12px; display:none;';
        select.parentNode.insertBefore(warnEl, select);
    }
    if (_expiredCount > 0 && !_isAdmin) {
        warnEl.style.display = 'block';
        warnEl.innerHTML = `🚫 ${_expiredCount} مادة منتهية الصلاحية — لا يمكن بيعها`;
    } else if (_expiredCount > 0 && _isAdmin) {
        warnEl.style.display = 'block';
        warnEl.style.background = '#fdecea';
        warnEl.style.color = '#e74c3c';
        warnEl.innerHTML = `👑 وضع المدير: ${_expiredCount} مادة منتهية (يمكنك البيع مع تأكيد)`;
    } else {
        warnEl.style.display = 'none';
    }
}

function calcTotal() {
    const select = document.getElementById('saleMaterial');
    const selected = select.options[select.selectedIndex];
    const currency = document.getElementById('saleCurrency').value;

    // 🆕 نوع السعر (مفرق/جملة)
    const _ptEl = document.querySelector('input[name="salePriceType"]:checked');
    const _pt = _ptEl ? _ptEl.value : 'retail';
    const _isWholesale = _pt === 'wholesale';

    // 🆕 هل المادة بالكيلو؟
    const _unit = selected ? (selected.dataset.unit || '') : '';
    const _isKilo = (_unit === 'كيلو' || _unit === 'كغ');
    const _weightWrap = document.getElementById('saleWeightWrap');
    if (_weightWrap) _weightWrap.style.display = (_isKilo && selected && selected.value) ? 'block' : 'none';

    // 🆕 الكمية (وزن أو رقمي)
    let qty = 0;
    if (_isKilo && selected && selected.value) {
        const _kg = parseFloat(document.getElementById('saleWeightKg')?.value) || 0;
        const _gr = parseFloat(document.getElementById('saleWeightGram')?.value) || 0;
        qty = _kg + (_gr / 1000);
        const _qtyEl = document.getElementById('saleQty');
        if (_qtyEl) _qtyEl.value = qty > 0 ? qty.toFixed(3) : '';
        const _sumEl = document.getElementById('saleWeightSummary');
        if (_sumEl) {
            _sumEl.textContent = qty > 0 ? '⚖️ الإجمالي: ' + _kg + ' كغ + ' + _gr + ' غ = ' + qty.toFixed(3) + ' كغ' : '';
        }
    } else {
        qty = parseFloat(document.getElementById('saleQty').value) || 0;
    }

    // 🆕 السعر حسب النوع
    const salePrice = selected ? (currency === 'USD'
        ? (_isWholesale ? parseFloat(selected.dataset.wholesaleUsd) : parseFloat(selected.dataset.saleUsd))
        : (_isWholesale ? parseFloat(selected.dataset.wholesaleSyp) : parseFloat(selected.dataset.saleSyp))) || 0 : 0;

    document.getElementById('saleUnitPrice').value = salePrice;
    const subtotal = qty * salePrice;
    document.getElementById('saleTotal').value = subtotal;

    // ✨ حساب الضريبة
    const vatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
    const vatRow = document.getElementById('vatRow');
    const grandTotalRow = document.getElementById('grandTotalRow');
    const vatInput = document.getElementById('saleVAT');
    const grandInput = document.getElementById('saleGrandTotal');
    const vatPercent = document.getElementById('vatPercent');

    if (vatRate > 0) {
        // احسب الضريبة
        const vatAmount = subtotal * (vatRate / 100);
        const grandTotal = subtotal + vatAmount;

        if (vatPercent) vatPercent.textContent = vatRate;
        if (vatInput) vatInput.value = vatAmount.toFixed(2);
        if (grandInput) grandInput.value = grandTotal.toFixed(2);

        if (vatRow) vatRow.style.display = 'block';
        if (grandTotalRow) grandTotalRow.style.display = 'block';
    } else {
        // لا ضريبة (سوريا)
        if (vatRow) vatRow.style.display = 'none';
        if (grandTotalRow) grandTotalRow.style.display = 'none';
    }

    // 🆕 تحديث ألوان + readonly
    (function() {
        const _rLbl = document.getElementById('salePTRetailLabel');
        const _wLbl = document.getElementById('salePTWholesaleLabel');
        if (_rLbl && _wLbl) {
            if (_isWholesale) {
                _rLbl.style.background = '#f0f7ff';
                _rLbl.style.borderColor = '#ddd';
                _wLbl.style.background = '#fff8f0';
                _wLbl.style.borderColor = '#e67e22';
            } else {
                _rLbl.style.background = '#fff8f0';
                _rLbl.style.borderColor = '#e67e22';
                _wLbl.style.background = '#f0f7ff';
                _wLbl.style.borderColor = '#ddd';
            }
        }
        const _qtyF = document.getElementById('saleQty');
        if (_qtyF) {
            const _ro = _isKilo && selected && selected.value;
            _qtyF.readOnly = _ro;
            _qtyF.style.background = _ro ? '#f3e5f5' : '';
            _qtyF.style.color = _ro ? '#6c3483' : '';
            _qtyF.style.fontWeight = _ro ? '600' : '';
        }
    })();

    calcRemaining();
}

function calcRemaining() {
    // لا يوجد حقل saleRemaining بعد الآن، لا نفعل شيئاً
    return;
}

async function addSale() {
    const invoice = document.getElementById('invoiceNo').value;
    const date = document.getElementById('saleDate').value;
    const customer = document.getElementById('customerName').value;
    const currency = document.getElementById('saleCurrency').value;

    if (!invoice || !date || invoiceItems.length === 0) {
        alert('الرجاء تعبئة رقم الفاتورة والتاريخ وإضافة مادة واحدة على الأقل');
        return;
    }

    pendingInvoiceData = { invoice, date, customer, currency };
    console.log('pendingInvoiceData:', pendingInvoiceData);
    showPaymentModal();
}

function editSale(index) {
    const s = sales[index];
    if (s) {
        document.getElementById('invoiceNo').value = s.invoice;
        document.getElementById('saleDate').value = s.date;
        document.getElementById('customerName').value = s.customer;
        document.getElementById('saleCurrency').value = s.currency || 'SYP';
        document.getElementById('salePaid').value = s.paid || 0;
        document.getElementById('saleTotal').value = s.total || 0;

        // 💳 عرض الصندوق
        const _boxWrap = document.getElementById('salePaymentBoxWrap');
        if (_boxWrap) _boxWrap.style.display = 'block';
        if (typeof populatePaymentBoxSelect === 'function') {
            populatePaymentBoxSelect(s.paymentBox || '');
        }
        setTimeout(() => {
            const _sel = document.getElementById('salePaymentBox');
            if (_sel && s.paymentBox) _sel.value = s.paymentBox;
        }, 200);

        invoiceItems = (s.items || []).map(item => ({...item}));
        renderInvoiceItems();

        editingSaleIndex = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 🎨 Toast تذكير
        if (typeof showSuccessToast === 'function' && s.paymentBox) {
            const _bn = typeof _getBoxName === 'function' ? _getBoxName(s.paymentBox) : '';
            if (_bn && _bn !== '—') {
                showSuccessToast({
                    title: '📝 وضع التعديل',
                    details: [
                        { icon: '📄', label: 'الفاتورة', value: s.invoice || '-' },
                        { icon: '💳', label: 'الصندوق', value: _bn }
                    ],
                    duration: 4000
                });
            }
        }
    }
}

async function deleteSale(index) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذه الفاتورة؟')) {
            const sale = sales[index];
            // إعادة الكمية إلى المخزون (في المستودع الأصلي)
            const material = materials.find(m => m.id === sale.materialId);
            const _delWhId = sale.warehouseId 
                || (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : '');
            if (material) {
                if (typeof adjustStock === 'function') {
                    try { adjustStock(material.id, sale.qty, 'add', _delWhId, { reason: 'sale_delete' }); }
                    catch(e) { material.stock += sale.qty; }
                } else {
                    material.stock += sale.qty;
                }
                updateMaterialsTable();
            }
            // حذف الدين المرتبط (إن وجد)
            if (sale.remaining > 0) {
                const debtIndex = debts.findIndex(d => 
                    d.name === sale.customer && 
                    d.date === sale.date && 
                    Math.abs(d.amount - sale.remaining) < 0.001
                );
                if (debtIndex !== -1) {
                    debts.splice(debtIndex, 1);
                }
            }
            // حذف الفاتورة
            sales.splice(index, 1);
            // تحديث الجداول والإحصائيات
            updateSalesTable();
            updateDebtsTable();
            updateStatistics();
            // حفظ البيانات
            await saveAllData();
            alert('تم حذف الفاتورة بنجاح');
        }
    });
}

// ✨ التحكم في عرض المبيعات (آخر فاتورة / الكل)
var showAllSales = false;

function toggleShowAllSales() {
    showAllSales = !showAllSales;
    updateSalesTable();
}

// 💳 اسم الصندوق
function _getBoxName(boxId) {
    try {
        if (!boxId) return '—';
        if (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) {
            const b = _pbCache.find(x => x.id === boxId);
            if (b) return (b.icon || '💰') + ' ' + b.name;
        }
        const sel = document.getElementById('salePaymentBox');
        if (sel) {
            const opt = Array.from(sel.options).find(o => o.value === boxId);
            if (opt) return opt.textContent.trim();
        }
        const sel2 = document.getElementById('retailPaymentBox');
        if (sel2) {
            const opt = Array.from(sel2.options).find(o => o.value === boxId);
            if (opt) return opt.textContent.trim();
        }
        return '💰 صندوق';
    } catch(e) { return '💰 صندوق'; }
}

function updateSalesTable() {
    const table = document.getElementById('salesTable');
    const searchInput = document.getElementById('searchSales');
    const regularSales = sales.filter(s => !s.isRetail);
    let salesToShow = [];

    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.trim().toLowerCase();
        salesToShow = regularSales.filter(s => 
            (s.invoice && s.invoice.toLowerCase().includes(query)) ||
            (s.customer && s.customer.toLowerCase().includes(query))
        );
    } else {
        // 🎯 افتراضياً: آخر فاتورة فقط. مع "عرض الكل" → الكل
        const count = showAllSales ? regularSales.length : 1;
        salesToShow = regularSales.slice(-count);
    }

    // 🎯 ترتيب عكسي — الأحدث أولاً
    salesToShow = salesToShow.slice().reverse();

    // 🎯 عرض/إخفاء زر "عرض الكل"
    const isSearching = searchInput && searchInput.value.trim() !== '';
    const showMoreDiv = document.getElementById('salesShowMore');
    const totalCountSpan = document.getElementById('salesTotalCount');
    if (showMoreDiv && totalCountSpan) {
        if (!isSearching && regularSales.length > 1) {
            showMoreDiv.style.display = 'block';
            totalCountSpan.textContent = regularSales.length;
            const btn = showMoreDiv.querySelector('button');
            if (btn) {
                btn.innerHTML = showAllSales 
                    ? '📁 عرض آخر فاتورة فقط'
                    : '📄 عرض كل الفواتير (' + regularSales.length + ')';
            }
        } else {
            showMoreDiv.style.display = 'none';
        }
    }

    const symbol = (s) => s.currency === 'USD' ? '$' : 'ل.س';

    if (window.innerWidth <= 768) {
        let cardsHtml = '';
        salesToShow.forEach((s) => {
            const cur = symbol(s);
            const itemsSummary = s.items ? s.items.map(i => `${i.materialName} (${i.qty} ${i.unit || ''})`).join('، ') : s.materialName;
            const originalIndex = sales.indexOf(s);
            cardsHtml += `
            <div class="sale-card">
                <div><span>الفاتورة:</span> ${s.invoice}</div>
                <div><span>التاريخ:</span> ${typeof formatDate === 'function' ? formatDate(s.date) : s.date}</div>
                <div><span>العميل:</span> ${s.customer}</div>
                <div><span>المواد:</span> ${itemsSummary}</div>
                <div><span>العملة:</span> ${s.currency || 'SYP'}</div>
                <div><span>الإجمالي:</span> ${s.total} ${cur}</div>
                <div><span>المدفوع:</span> ${s.paid} ${cur}</div>
                <div><span>الباقي:</span> ${s.remaining} ${cur}</div>
                ${s.paymentBox ? `<div><span>💳 الصندوق:</span> ${_getBoxName(s.paymentBox)}</div>` : ''}
                <div class="sale-card-actions">
                    <button class="btn-edit" style="background:#3498db;" onclick="exportInvoiceMenu(${originalIndex})">📤 تصدير</button>
                    <button class="btn-edit" onclick="editSale(${originalIndex})">تعديل</button>
                    <button class="btn-delete" onclick="deleteSale(${originalIndex})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = cardsHtml;
        table.classList.add('cards-mode');
    } else {
        let rows = '';
        salesToShow.forEach((s) => {
            const cur = symbol(s);
            const itemsSummary = s.items ? s.items.map(i => `${i.materialName} (${i.qty} ${i.unit || ''})`).join('، ') : s.materialName;
            const originalIndex = sales.indexOf(s);
            rows += `<tr>
                <td>${s.invoice}</td>
                <td>${typeof formatDate === 'function' ? formatDate(s.date) : s.date}</td>
                <td>${s.customer}</td>
                <td>${itemsSummary}</td>
                <td>${s.currency || 'SYP'}</td>
                <td>${s.total} ${cur}</td>
                <td>${s.paid} ${cur}</td>
                <td>${s.remaining} ${cur}</td>
                <td>${s.paymentBox ? _getBoxName(s.paymentBox) : '—'}</td>
                <td><button class="btn-edit" style="background:#3498db;" onclick="exportInvoiceMenu(${originalIndex})">📤 تصدير</button></td>
                <td><button class="btn-edit" onclick="editSale(${originalIndex})">تعديل</button></td>
                <td><button class="btn-delete" onclick="deleteSale(${originalIndex})">حذف</button></td>
            </tr>`;
        });

        table.innerHTML = '<tr><th>الفاتورة</th><th>التاريخ</th><th>العميل</th><th>المواد</th><th>العملة</th><th>الإجمالي</th><th>المدفوع</th><th>الباقي</th><th>💳 الصندوق</th><th>طباعة</th><th>PNG</th><th>تعديل</th><th>حذف</th></tr>' + rows;
        table.classList.remove('cards-mode');
    }
}

// ==================== الطباعة والتصدير للفواتير ====================
function printInvoice() {
    let data;
    if (invoiceItems.length > 0) {
        const total = parseFloat(document.getElementById('saleTotal').value) || 0;
        const paid = parseFloat(document.getElementById('salePaid').value) || 0;
        data = {
            invoice: document.getElementById('invoiceNo').value,
            date: document.getElementById('saleDate').value,
            customer: document.getElementById('customerName').value,
            currency: document.getElementById('saleCurrency').value,
            paid: paid,
            total: total,
            remaining: total - paid,
            items: invoiceItems
        };
    } else if (sales.length > 0) {
        const s = sales[sales.length - 1];
        data = {
            invoice: s.invoice, date: s.date, customer: s.customer,
            currency: s.currency, paid: s.paid, total: s.total,
            remaining: s.remaining, items: s.items || []
        };
    } else {
        alert('لا توجد فاتورة');
        return;
    }

    // 🆕 استخدام الطباعة الحرارية
    if (typeof window.ThermalPrint !== 'undefined') {
        try {
            const _bi = (typeof getBusinessInfo === 'function') ? getBusinessInfo() : {};
            window.ThermalPrint.sale(data, {
                name: _bi.name || 'المتجر',
                description: _bi.description || '',
                phone: currentUser?.phone || '',
                signature: _bi.signature || ''
            });
            return;
        } catch(e) {
            console.warn('[print] thermal fallback:', e);
        }
    }

    // Fallback: الصورة القديمة
    renderInvoiceImage(data);
}

function printAsImage(data) {
    const invoiceElement = buildInvoiceElement(data);
    document.body.appendChild(invoiceElement);

    setTimeout(() => {
        html2canvas(invoiceElement, { useCORS: true }).then(canvas => {
            document.body.removeChild(invoiceElement);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);

                // في Cordova، نستخدم نافذة جديدة للطباعة
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html dir="rtl">
                        <head><title>فاتورة ${data.invoice}</title><style>
@media print {
    .no-print, button, .btn-print, .btn-save, .btn-confirm { display: none !important; }
    body { margin: 0 !important; padding: 0 !important; background: white !important; }
    img { max-width: 100% !important; page-break-inside: avoid; }
}
.no-print { }
</style></head>
                        <body style="margin:0; display:flex; justify-content:center; align-items:center; background:#f0f0f0;">
                            <img src="${url}" style="max-width:100%; max-height:100vh;" onload="window.print();" />
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                } else {
                    // بديل: نعرض الصورة في نافذة جديدة عبر الرابط
                    showSyncNotification('تم تجهيز الفاتورة كصورة ✓', 'success');
                    window.open(url, '_blank');
                }
            }, 'image/png');
        });
    }, 500);
}

function buildInvoiceElement(data) {
    const _bi = getBusinessInfo();
    const businessName = _bi.name;
    const businessDescription = _bi.description;
    const signature = _bi.signature;
    const currencyText = data.currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const symbol = data.currency === 'USD' ? '$' : 'ل.س';

    let itemsRows = '';
    data.items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    const el = document.createElement('div');
    el.style.cssText = 'position:fixed; top:0; left:0; width:450px; background:white; padding:25px; text-align:right; font-family:Arial; z-index:-9999;';
    el.innerHTML = `
        <div style="position:relative;border:2px solid #333;padding:25px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;">المدير AI</div>
            <div style="position:relative;z-index:1;">
                <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;">${businessName}</div>
                ${businessDescription ? `<div style="text-align:center;margin-bottom:5px;color:#555;">${businessDescription}</div>` : ''}
                <div style="font-size:20px;font-weight:bold;text-align:right;margin:10px 0;">فاتورة مبيعات</div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>رقم الفاتورة: ${data.invoice}</span><span>التاريخ: ${typeof formatDate === 'function' ? formatDate(data.date) : data.date}</span></div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>العميل: ${data.customer || 'بدون اسم'}</span></div>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
                    <tr><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">المادة</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الكمية</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">السعر</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الإجمالي</th></tr>
                    ${itemsRows}
                </table>
                <div style="margin-top:10px;font-size:15px;text-align:right;">
                    <p style="margin:3px 0;"><strong>الإجمالي:</strong> ${data.total} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>المدفوع:</strong> ${data.paid} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>الباقي:</strong> ${data.remaining} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>المبلغ كتابةً:</strong> ${tafqitAmount(parseFloat(data.total), data.currency)}</p>
                </div>
                <div style="text-align:center; margin-top:15px; margin-bottom:10px;">
                    <div id="invoice-qr-box" style="display:inline-block; background:white; padding:5px;"></div>
                </div>
                ${signature ? `<div style="margin-top:15px;text-align:left;border-top:1px dashed #333;padding-top:10px;">للاستفسار: ${signature}</div>` : ''}
            </div>
        </div>
    `;
    return el;
}

function exportInvoiceAsPNG() {
    printInvoice();
}

function printSavedInvoice(index) {
    const s = sales[index];
    if (!s) return;
    printInvoiceData({
        invoice: s.invoice,
        date: s.date,
        customer: s.customer,
        currency: s.currency,
        paid: s.paid,
        total: s.total,
        remaining: s.remaining,
        items: s.items || [],
        paymentBox: s.paymentBox || ''
    });
}

function exportSavedInvoiceAsPNG(index) {
    const s = sales[index];
    if (!s) return;
    exportInvoiceData({
        invoice: s.invoice,
        date: s.date,
        customer: s.customer,
        currency: s.currency,
        paid: s.paid,
        total: s.total,
        remaining: s.remaining,
        items: s.items || [],
        paymentBox: s.paymentBox || ''
    });
}
// ==================== المصروفات ====================
async function addExpense() {
    const date = document.getElementById('expDate').value;
    const amountValue = parseFloat(document.getElementById('expAmount').value) || 0;
    const amountCurrency = document.getElementById('expAmountCurrency').value;
    const desc = document.getElementById('expDesc').value;
    const category = document.getElementById('expCategory').value;
    const _boxId = document.getElementById('expPaymentBox')?.value || '';

    if (!date || amountValue <= 0 || !desc) { alert('الرجاء تعبئة جميع الحقول'); return; }

    const amountBase = convertToBase(amountValue, amountCurrency);

    if (editingExpenseIndex !== null) {
        requirePassword(async () => {
            expenses[editingExpenseIndex] = { date, amount: amountBase, desc, category };
            editingExpenseIndex = null;
            document.getElementById('expAmount').value = '';
            document.getElementById('expDesc').value = '';
            updateExpensesTable();
            await saveAllData();
            alert('تم تحديث المصروف بنجاح');
        });
    } else {
        // 🚫 فحص الرصيد قبل الإضافة
        if (_boxId && amountBase > 0) {
            const _box = (typeof _pbCache !== 'undefined' ? _pbCache : []).find(b => b.id === _boxId);
            if (!_box) {
                alert('⚠️ الصندوق غير موجود');
                return;
            }
            const _bal = parseFloat(_box.balance) || 0;
            if (amountBase > _bal) {
                alert(
                    `🚫 الرصيد غير كافٍ!\n\n` +
                    `💳 ${_box.name}\n` +
                    `💰 المتاح: ${new Intl.NumberFormat('ar-SY').format(Math.round(_bal))} ل.س\n` +
                    `💵 المطلوب: ${new Intl.NumberFormat('ar-SY').format(Math.round(amountBase))} ل.س\n\n` +
                    `💡 يجب إعادة تعبئة الصندوق أو اختيار صندوق آخر.`
                );
                return;
            }
        }

        expenses.push({ date, amount: amountBase, desc, category, paymentBox: _boxId });

        // 💳 خصم من الصندوق
        if (_boxId && amountBase > 0) {
            try {
                if (typeof pbAdjustBalance === 'function') {
                    await pbAdjustBalance(_boxId, amountBase, 'subtract', {
                        reason: 'expense',
                        reasonLabel: 'مصروف: ' + desc + ' (' + category + ')',
                        relatedId: 'EXP-' + Date.now()
                    });
                }
            } catch(e) {
                console.warn('[pb] exp:', e.message);
                alert('🚫 ' + e.message);
                return;
            }
        }

        document.getElementById('expAmount').value = '';
        document.getElementById('expDesc').value = '';
        const _eb = document.getElementById('expPaymentBox');
        if (_eb) _eb.value = '';

        updateExpensesTable();
        await saveAllData();

        // 🎨 Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const _boxName = _boxId && typeof _getBoxName === 'function' ? _getBoxName(_boxId) : '';
            const _cur = amountCurrency === 'USD' ? '$' : 'ل.س';
            const _details = [
                { icon: '💰', label: 'المبلغ', value: amountValue + ' ' + _cur },
                { icon: '🏷️', label: 'التصنيف', value: category },
                { icon: '📝', label: 'البيان', value: desc.substring(0, 30) }
            ];
            if (_boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: 'تم حفظ المصروف بنجاح!',
                details: _details,
                actions: [
                    {
                        label: 'عرض المصروفات',
                        icon: '📄',
                        style: 'light',
                        onClick: () => { if (typeof openPage === 'function') openPage('expenses'); }
                    }
                ],
                duration: 6000
            });
        } else {
            alert('تم حفظ المصروف بنجاح');
        }
    }
}

function editExpense(index) {
    const e = expenses[index];
    if (e) {
        document.getElementById('expDate').value = e.date;
        document.getElementById('expAmount').value = e.amount;
        document.getElementById('expDesc').value = e.desc;
        document.getElementById('expCategory').value = e.category;
        editingExpenseIndex = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteExpense(index) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذا المصروف؟')) {
            expenses.splice(index, 1);
            updateExpensesTable();
            await saveAllData();
        }
    });
}

function updateExpensesTable() {
    const table = document.getElementById('expensesTable');
    if (window.innerWidth <= 768) {
        let html = '';
        expenses.forEach((e, index) => {
            html += `
            <div class="expense-card">
                <div><span>التاريخ:</span> ${typeof formatDate === 'function' ? formatDate(e.date) : e.date}</div>
                <div><span>المبلغ:</span> ${formatCurrency(e.amount)}</div>
                <div><span>البيان:</span> ${e.desc}</div>
                <div><span>التصنيف:</span> ${e.category}</div>
                <div class="card-actions">
                    <button class="btn-edit" onclick="editExpense(${index})">تعديل</button>
                    <button class="btn-delete" onclick="deleteExpense(${index})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = html;
        table.classList.add('cards-mode');
    } else {
        let html = '<tr><th>التاريخ</th><th>المبلغ</th><th>البيان</th><th>التصنيف</th><th>تعديل</th><th>حذف</th></tr>';
        expenses.forEach((e, index) => {
            html += `<tr>
                <td>${e.date}</td>
                <td>${formatCurrency(e.amount)}</td>
                <td>${e.desc}</td>
                <td>${e.category}</td>
                <td><button class="btn-edit" onclick="editExpense(${index})">تعديل</button></td>
                <td><button class="btn-delete" onclick="deleteExpense(${index})">حذف</button></td>
            </tr>`;
        });
        table.innerHTML = html;
        table.classList.remove('cards-mode');
    }
}

// ==================== الديون ====================
async function addDebt() {
    const name = document.getElementById('debtName').value;
    const date = document.getElementById('debtDate').value;
    const amountValue = parseFloat(document.getElementById('debtAmount').value) || 0;
    const amountCurrency = document.getElementById('debtAmountCurrency').value;

    if (!name || !date || amountValue <= 0) { alert('الرجاء تعبئة جميع الحقول'); return; }

    const amountBase = convertToBase(amountValue, amountCurrency);

    if (editingDebtIndex !== null) {
        requirePassword(async () => {
            debts[editingDebtIndex] = { name, date, amount: amountBase, paid: debts[editingDebtIndex].paid || 0 };
            editingDebtIndex = null;
            document.getElementById('debtName').value = '';
            document.getElementById('debtAmount').value = '';
            updateDebtsTable();
            await saveAllData();
            alert('تم تحديث الدين بنجاح');
        });
    } else {
        debts.push({ name, date, amount: amountBase, paid: 0 });
        document.getElementById('debtName').value = '';
        document.getElementById('debtAmount').value = '';
        updateDebtsTable();
        await saveAllData();
        alert('تم حفظ الدين بنجاح');
    }
}

function editDebt(index) {
    const d = debts[index];
    if (d) {
        document.getElementById('debtName').value = d.name;
        document.getElementById('debtDate').value = d.date;
        document.getElementById('debtAmount').value = d.amount;
        editingDebtIndex = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteDebt(index) {
    requirePassword(async () => {
        if (confirm('هل تريد حذف هذا الدين؟')) {
            debts.splice(index, 1);
            updateDebtsTable();
            await saveAllData();
        }
    });
}

function printDebt(index) {
    const d = debts[index];

    // 🆕 استخدام الطباعة الحرارية
    if (typeof window.ThermalPrint !== 'undefined') {
        try {
            const _bi = (typeof getBusinessInfo === 'function') ? getBusinessInfo() : {};
            window.ThermalPrint.debt(d, {
                name: _bi.name || 'النشاط',
                currency: settings.displayCurrency || 'SYP',
                signature: _bi.signature || ''
            });
            return;
        } catch(e) {
            console.warn('[debt-print] thermal fallback:', e);
        }
    }

    // Fallback
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;text-align:center;} .debt-receipt{border:2px solid #333;padding:20px;max-width:400px;margin:auto;} h2{color:#1a237e;}</style>');
    printWindow.document.write(`<div class="debt-receipt">
        <h2>المدير AI</h2>
        <p>سند دين / سداد</p>
        <hr>
        <p><strong>الاسم:</strong> ${d.name}</p>
        <p><strong>التاريخ:</strong> ${d.date}</p>
        <p><strong>القيمة الأصلية:</strong> ${formatCurrency(d.amount)}</p>
        <p><strong>المسدد:</strong> ${formatCurrency(d.paid)}</p>
        <p><strong>المتبقي:</strong> ${formatCurrency(d.amount - d.paid)}</p>
        <hr>
        <p>توقيع: ....................</p>
    </div>`);
    printWindow.document.close();
    printWindow.print();
}

function exportDebtAsPNG(index) {
    const d = debts[index];
    const receiptElement = document.createElement('div');
    receiptElement.style.cssText = 'position: fixed; top: 0; left: 0; width: 400px; background: white; padding: 20px; text-align: center; font-family: Arial; z-index: -9999;';
    receiptElement.innerHTML = `
        <div style="border:2px solid #333; padding:20px;">
            <h2 style="color:#1a237e;">المدير AI</h2>
            <p>سند دين / سداد</p>
            <hr>
            <p><strong>الاسم:</strong> ${d.name}</p>
            <p><strong>التاريخ:</strong> ${d.date}</p>
            <p><strong>القيمة الأصلية:</strong> ${formatCurrency(d.amount)}</p>
            <p><strong>المسدد:</strong> ${formatCurrency(d.paid)}</p>
            <p><strong>المتبقي:</strong> ${formatCurrency(d.amount - d.paid)}</p>
            <hr>
            <p>توقيع: ....................</p>
        </div>
    `;
    document.body.appendChild(receiptElement);
    html2canvas(receiptElement).then(canvas => {
        const link = document.createElement('a');
        link.download = `debt_${d.name}_${d.date}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        document.body.removeChild(receiptElement);
    });
}

function updateDebtsTable() {
    const table = document.getElementById('debtsTable');
    if (window.innerWidth <= 768) {
        let html = '';
        let total = 0;
        debts.forEach((d, index) => {
            const remaining = d.amount - d.paid;
            if (remaining > 0) total += remaining;
            html += `
            <div class="debt-card">
                <div><span>الاسم:</span> ${d.name}</div>
                <div><span>التاريخ:</span> ${d.date}</div>
                <div><span>القيمة:</span> ${formatCurrency(d.amount)}</div>
                <div><span>المسدد:</span> ${formatCurrency(d.paid)}</div>
                <div><span>المتبقي:</span> ${formatCurrency(remaining)}</div>
                ${remaining > 0 
                    ? `<input type="number" id="partial-${index}" placeholder="مبلغ" style="width:100%; margin-bottom:5px;"> 
                       <button class="btn-settle" onclick="partialSettle(${index})">سداد جزئي</button>
                       <button class="btn-settle" onclick="fullSettle(${index})">تسديد كامل</button>`
                    : '<div>✅ مسدد</div>'}
                <div class="card-actions">
                    <button class="btn-edit" onclick="printDebt(${index})">طباعة</button>
                    <button class="btn-edit" style="background:#8e44ad;" onclick="exportDebtAsPNG(${index})">PNG</button>
                    <button class="btn-edit" onclick="editDebt(${index})">تعديل</button>
                    <button class="btn-delete" onclick="deleteDebt(${index})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = html;
        table.classList.add('cards-mode');
        document.getElementById('totalDebts').textContent = formatCurrency(total);
    } else {
        let html = '<tr><th>الاسم</th><th>التاريخ</th><th>القيمة</th><th>المسدد</th><th>المتبقي</th><th>سداد جزئي</th><th>تسديد كامل</th><th>طباعة</th><th>PNG</th><th>تعديل</th><th>حذف</th></tr>';
        let total = 0;
        debts.forEach((d, index) => {
            const remaining = d.amount - d.paid;
            if (remaining > 0) total += remaining;
            html += `<tr>
                <td>${d.name}</td>
                <td>${d.date}</td>
                <td>${formatCurrency(d.amount)}</td>
                <td>${formatCurrency(d.paid)}</td>
                <td>${formatCurrency(remaining)}</td>
                ${remaining > 0 
                    ? `<td><input type="number" id="partial-${index}" placeholder="مبلغ" style="width:60px;"> <button class="btn-settle" onclick="partialSettle(${index})">سداد</button></td>
                       <td><button class="btn-settle" onclick="fullSettle(${index})">تسديد كامل</button></td>`
                    : '<td>-</td><td>✅ مسدد</td>'}
                <td><button class="btn-edit" onclick="printDebt(${index})">طباعة</button></td>
                <td><button class="btn-edit" style="background:#8e44ad;" onclick="exportDebtAsPNG(${index})">PNG</button></td>
                <td><button class="btn-edit" onclick="editDebt(${index})">تعديل</button></td>
                <td><button class="btn-delete" onclick="deleteDebt(${index})">حذف</button></td>
            </tr>`;
        });
        table.innerHTML = html;
        table.classList.remove('cards-mode');
        document.getElementById('totalDebts').textContent = formatCurrency(total);
    }
}

function partialSettle(index) {
    const amount = parseFloat(document.getElementById(`partial-${index}`).value) || 0;
    const debt = debts[index];
    const remaining = debt.amount - debt.paid;
    if (amount <= 0) { alert('الرجاء إدخال مبلغ صحيح'); return; }
    if (amount > remaining) { alert(`المبلغ أكبر من المتبقي! المتبقي: ${remaining}`); return; }

    requirePassword(async () => {
        // 💳 اختيار الصندوق (Modal)
        let _boxId = '';
        if (typeof showBoxSelector === 'function') {
            _boxId = await showBoxSelector('💳 اختر صندوق الدفع للسداد');
            if (_boxId === null) return;  // إلغاء
        }

        debt.paid += amount;
        debt.paymentBox = _boxId || debt.paymentBox || '';

        // 💳 إضافة للصندوق
        if (_boxId && amount > 0) {
            try {
                if (typeof pbAdjustBalance === 'function') {
                    await pbAdjustBalance(_boxId, amount, 'add', {
                        reason: 'debt',
                        reasonLabel: 'سداد جزئي: ' + (debt.name || '') + ' (' + amount + ')',
                        relatedId: debt.id || ('DEBT-' + Date.now())
                    });
                }
            } catch(e) { console.warn('[pb] debt-partial:', e.message); }
        }

        updateDebtsTable();
        await saveAllData();

        // 🎨 Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const _boxName = _boxId && typeof _getBoxName === 'function' ? _getBoxName(_boxId) : '';
            const _details = [
                { icon: '👤', label: 'العميل', value: debt.name || '-' },
                { icon: '💵', label: 'المبلغ المُسدَّد', value: amount + ' ل.س' },
                { icon: '⏳', label: 'المتبقي', value: (debt.amount - debt.paid) + ' ل.س' }
            ];
            if (_boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: 'تم تسجيل السداد بنجاح!',
                details: _details,
                duration: 6000
            });
        } else {
            alert('تم السداد بنجاح');
        }
    });
}

function fullSettle(index) {
    const debt = debts[index];
    const remaining = debt.amount - debt.paid;
    if (remaining <= 0) { alert('هذا الدين مسدَّد بالكامل'); return; }

    if (!confirm(`هل تم تسديد الدين بالكامل؟\n\nالمبلغ: ${remaining} ل.س`)) return;

    requirePassword(async () => {
        // 💳 اختيار الصندوق (Modal)
        let _boxId = '';
        if (typeof showBoxSelector === 'function') {
            _boxId = await showBoxSelector('💳 اختر صندوق الدفع للتسديد الكامل');
            if (_boxId === null) return;
        }

        debt.paid = debt.amount;
        debt.paymentBox = _boxId || debt.paymentBox || '';

        // 💳 إضافة للصندوق
        if (_boxId && remaining > 0) {
            try {
                if (typeof pbAdjustBalance === 'function') {
                    await pbAdjustBalance(_boxId, remaining, 'add', {
                        reason: 'debt',
                        reasonLabel: 'سداد كامل: ' + (debt.name || ''),
                        relatedId: debt.id || ('DEBT-' + Date.now())
                    });
                }
            } catch(e) { console.warn('[pb] debt-full:', e.message); }
        }

        updateDebtsTable();
        await saveAllData();

        // 🎨 Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const _boxName = _boxId && typeof _getBoxName === 'function' ? _getBoxName(_boxId) : '';
            const _details = [
                { icon: '👤', label: 'العميل', value: debt.name || '-' },
                { icon: '✅', label: 'المبلغ الكامل', value: debt.amount + ' ل.س' }
            ];
            if (_boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });

            showSuccessToast({
                title: 'تم التسديد بالكامل! 🎉',
                details: _details,
                duration: 7000
            });
        }
    });
}

// ==================== التقارير ====================
function generateReport() {
    // 📊 يُفوَّض إلى reports-center.js
    if (typeof generateFullReport === 'function') {
        generateFullReport();
    } else {
        alert('⚠️ مركز التقارير غير محمّل بعد');
    }
}

// ==================== الإحصائيات العامة ====================
function updateStatistics() {
    let totalSalesBase = 0;
    let totalCollectedBase = 0;
    let totalExpensesBase = 0;
    let totalOutstandingDebtsBase = 0;

    sales.forEach(s => {
        totalSalesBase += s.total;
        totalCollectedBase += s.paid;
    });

    expenses.forEach(e => {
        totalExpensesBase += e.amount;
    });

    debts.forEach(d => {
        const remaining = d.amount - d.paid;
        if (remaining > 0) totalOutstandingDebtsBase += remaining;
        totalCollectedBase += d.paid;
    });

    const cashBase = totalCollectedBase - totalExpensesBase;

    document.getElementById('statCash').textContent = formatCurrency(cashBase);
    document.getElementById('statTotalSales').textContent = formatCurrency(totalSalesBase);
    document.getElementById('statCollected').textContent = formatCurrency(totalCollectedBase);
    document.getElementById('statTotalExpenses').textContent = formatCurrency(totalExpensesBase);
    document.getElementById('statOutstandingDebts').textContent = formatCurrency(totalOutstandingDebtsBase);
    document.getElementById('statInvoiceCount').textContent = sales.length;
    document.getElementById('statLowStock').textContent = materials.filter(m => m.stock < m.minStock).length;
}

// ==================== النسخ الاحتياطي ====================
function exportJSON() {
    document.getElementById('confirmOverlay').style.display = 'flex';
}

function performExport() {
    const data = { materials, sales, expenses, debts, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jasoft_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('confirmOverlay').style.display = 'none';
}

document.getElementById('confirmExportBtn').addEventListener('click', performExport);
document.getElementById('confirmCancelBtn').addEventListener('click', function() {
    document.getElementById('confirmOverlay').style.display = 'none';
});

function importJSON() {
    document.getElementById('importFile').click();
}

document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (data.materials && data.sales && data.expenses && data.debts && data.settings) {
                materials = data.materials;
                sales = data.sales;
                expenses = data.expenses;
                debts = data.debts;
                settings = data.settings;
                materialId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1;
                await saveAllData();
                loadSettings();
                updateAllTables();
                alert('تم استيراد البيانات بنجاح');
            } else {
                alert('ملف غير صالح');
            }
        } catch (error) {
            alert('خطأ في قراءة الملف');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ==================== تغيير كلمة المرور ورمز PIN ====================
async function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;

    if (settings.password && current !== settings.password) {
        alert('كلمة المرور الحالية غير صحيحة');
        return;
    }
    if (newPass !== confirm) {
        alert('كلمتا المرور غير متطابقتين');
        return;
    }
    if (newPass === '') {
        alert('لا يمكن أن تكون كلمة المرور فارغة');
        return;
    }
    settings.password = newPass;
    await saveAllData();
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    alert('تم تحديث كلمة المرور بنجاح');
}

async function changePin() {
    const current = document.getElementById('currentPin').value;
    const newPin = document.getElementById('newPin').value;

    if (settings.pin && current !== settings.pin) {
        alert('رمز PIN الحالي غير صحيح');
        return;
    }
    if (newPin === '') {
        settings.pin = '';
        await saveAllData();
        document.getElementById('currentPin').value = '';
        document.getElementById('newPin').value = '';
        alert('تم تعطيل رمز PIN');
        return;
    }
    if (!/^\d{4}$/.test(newPin)) {
        alert('يجب أن يكون رمز PIN مكوناً من 4 أرقام');
        return;
    }
    settings.pin = newPin;
    await saveAllData();
    document.getElementById('currentPin').value = '';
    document.getElementById('newPin').value = '';
    alert('تم تحديث رمز PIN بنجاح');
}

// ==================== التهيئة ====================

// ==================== ربط أزرار نافذة الدفع (نسخة واحدة نظيفة) ====================

// ==================== النوافذ المنبثقة (نسخة مبسطة) ====================
let modalCallback = null;

function showModal(title, callback, isPin = false) {
    const overlay = document.getElementById('modalOverlay');
    const titleEl = document.getElementById('modalTitle');
    const inputEl = document.getElementById('modalInput');
    if (!overlay || !titleEl || !inputEl) {
        console.error('عناصر المودال غير موجودة');
        return;
    }
    titleEl.textContent = title;
    inputEl.value = '';
    inputEl.type = 'password';
    inputEl.maxLength = isPin ? 4 : 20;
    overlay.style.display = 'flex';
    inputEl.focus();
    modalCallback = callback;
}

function hideModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.style.display = 'none';
    modalCallback = null;
}

document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const inputEl = document.getElementById('modalInput');
            if (modalCallback && inputEl) {
                modalCallback(inputEl.value);
            }
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideModal();
        });
    }
    // 🛡️ Failsafe: إزالة pin-locked إن لم يظهر PIN خلال 8 ثواني
    setTimeout(function() {
        var _ov = document.getElementById('modalOverlay');
        var _titleEl = document.getElementById('modalTitle');
        var _isPinModal = _ov && _ov.style.display === 'flex'
            && _titleEl && _titleEl.textContent.indexOf('PIN') !== -1;
        if (!_isPinModal) {
            document.body.classList.remove('pin-locked');
        }
    }, 8000);
});

function requirePassword(action) {
    if (!settings.password) {
        action();
        return;
    }
    showModal('أدخل كلمة مرور المالك للمتابعة', function(input) {
        if (String(input).trim() === String(settings.password).trim()) {
            hideModal();
            action();
        } else {
            alert('كلمة المرور غير صحيحة');
            hideModal();
        }
    });
}

// دالة تأكيد المودال (تعمل مباشرة بدون addEventListener)
function handleModalConfirm() {
    const inputEl = document.getElementById('modalInput');
    if (modalCallback && inputEl) {
        modalCallback(inputEl.value);
    }
}

// ==================== إدارة المواد في الفاتورة ====================
let invoiceItems = [];

function addItemToInvoice() {
    const materialSelect = document.getElementById('saleMaterial');
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const materialId = materialSelect.value;
    const materialName = selectedOption ? selectedOption.dataset.name : '';
    const qty = parseFloat(document.getElementById('saleQty').value) || 0;
    const currency = document.getElementById('saleCurrency').value;
    const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
    // جلب الوحدة من بيانات المادة
    const material = materials.find(m => m.id === parseInt(materialId));
    const unit = material ? material.unit : '';

    if (!materialId || qty <= 0) {
        alert('الرجاء اختيار مادة وإدخال كمية صحيحة');
        return;
    }

    // 🆕 فحص الصلاحية
    const _isAdmin = auth.currentUser?.email === 'jadabass956@gmail.com';

    if (material && typeof isMaterialExpired === 'function' && isMaterialExpired(material)) {
        const days = typeof daysUntilExpiry === 'function' ? daysUntilExpiry(material) : 0;
        const daysText = Math.abs(days) === 0 ? 'اليوم' : `منذ ${Math.abs(days)} يوم`;

        if (_isAdmin) {
            // 👑 المدير: تحذير فقط
            if (!confirm(`⚠️ [وضع المدير]\n\n${material.name}\nمنتهية الصلاحية ${daysText}.\n\nمتابعة؟`)) return;
        } else {
            // 🚫 مشترك: حجب + تسجيل
            alert(`🚫 لا يمكن بيع هذه المادة!\n\n${material.name}\nمنتهية الصلاحية ${daysText}.`);
            if (typeof logExpiryViolation === 'function') {
                logExpiryViolation(material, document.getElementById('invoiceNo')?.value || '');
            }
            return;
        }
    }

    // 🆕 تحذير لو قاربت على الانتهاء (خلال 7 أيام)
    if (material && typeof daysUntilExpiry === 'function' && !_isAdmin) {
        const d = daysUntilExpiry(material);
        if (d !== null && d >= 0 && d <= 7) {
            if (!confirm(`⚠️ ${material.name}\nتنتهي خلال ${d} يوم.\n\nمتابعة البيع؟`)) return;
        }
    }

    const existing = invoiceItems.find(item => item.materialId === parseInt(materialId));
    if (existing) {
        existing.qty += qty;
        existing.unit = unit; // تحديث الوحدة إذا تغيرت
        existing.total = existing.qty * existing.unitPrice;
        existing.profit = (existing.unitPrice - (existing.costAtSale || 0)) * existing.qty;
    } else {
        const _costAtSale = material ? ((currency === 'USD' ? material.costUSD : material.costSYP) || 0) : 0;
        const _ptEl = document.querySelector('input[name="salePriceType"]:checked');
        const _priceType = _ptEl ? _ptEl.value : 'retail';

        invoiceItems.push({
            materialId: parseInt(materialId),
            materialName,
            costAtSale: _costAtSale,
            materialType: selectedOption ? selectedOption.dataset.type || '' : '',
            qty,
            unit: unit,
            unitPrice,
            currency,
            priceType: _priceType,
            total: qty * unitPrice
        });
    }

    renderInvoiceItems();
    updateInvoiceTotal();
    const saleQty = document.getElementById('saleQty');
    const saleUnitPrice = document.getElementById('saleUnitPrice');
    const saleTotal = document.getElementById('saleTotal');
    if (saleQty) saleQty.value = '';
    if (saleUnitPrice) saleUnitPrice.value = '';
    if (saleTotal) saleTotal.value = '';
    // 🆕 تنظيف الوزن
    const _wk = document.getElementById('saleWeightKg');
    const _wg = document.getElementById('saleWeightGram');
    const _ws = document.getElementById('saleWeightSummary');
    const _ww = document.getElementById('saleWeightWrap');
    if (_wk) _wk.value = '';
    if (_wg) _wg.value = '';
    if (_ws) _ws.textContent = '';
    if (_ww) _ww.style.display = 'none';
}

function renderInvoiceItems() {
    const table = document.getElementById('invoiceItemsTable');
    if (!table) return;
    let html = '<tr><th>المادة</th><th>الكمية</th><th>السعر الإفرادي</th><th>الإجمالي</th><th>حذف</th></tr>';
    invoiceItems.forEach((item, index) => {
        const symbol = item.currency === 'USD' ? '$' : 'ل.س';
        html += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
            <td><button class="btn-delete" onclick="removeItemFromInvoice(${index})">حذف</button></td>
        </tr>`;
    });
    table.innerHTML = html;
}

function removeItemFromInvoice(index) {
    invoiceItems.splice(index, 1);
    renderInvoiceItems();
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const totalEl = document.getElementById('saleTotal');
    if (totalEl) totalEl.value = total;
}

// ==================== نافذة الدفع ====================
let pendingInvoiceData = null;

function showPaymentModal() {
    // 💳 تعبئة قائمة الصناديق
    const wrap = document.getElementById('salePaymentBoxWrap');
    if (wrap) wrap.style.display = 'block';

    if (typeof populatePaymentBoxSelect === 'function') {
        try {
            populatePaymentBoxSelect();
        } catch(e) { console.warn('[pb] populate:', e.message); }
    }

    // 🆕 لو القائمة فارغة — حمّل الصناديق ثم عبّئ
    if (typeof _pbCache === 'undefined' || _pbCache.length === 0) {
        if (typeof loadPaymentBoxes === 'function') {
            loadPaymentBoxes().then(() => {
                if (typeof populatePaymentBoxSelect === 'function') {
                    populatePaymentBoxSelect();
                }
            });
        }
    }

    const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    if (invoiceItems.length === 0) {
        alert('الرجاء إضافة مواد أولاً');
        return;
    }
    const totalDisplay = document.getElementById('paymentTotalDisplay');
    if (totalDisplay) totalDisplay.textContent = total + ' ' + (document.getElementById('saleCurrency').value === 'USD' ? '$' : 'ل.س');
    document.getElementById('paymentModalInput').value = '';
    document.getElementById('paymentModalOverlay').classList.add('show');
}

function hidePaymentModal() {
    document.getElementById('paymentModalOverlay').classList.remove('show');
    pendingInvoiceData = null;
}

async function finalizeSale(data) {
    const { invoice, date, customer, currency } = data;
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    // ✨ حساب الضريبة
    const vatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
    const vatAmount = vatRate > 0 ? subtotal * (vatRate / 100) : 0;
    const grandTotal = subtotal + vatAmount;
    const total = grandTotal;  // للتوافقية مع الكود القديم

    const paid = data.paid;
    const remaining = grandTotal - paid;

    console.log('💰 [finalizeSale]', {
        subtotal: subtotal,
        vatRate: vatRate,
        vatAmount: vatAmount,
        grandTotal: grandTotal,
        paid: paid,
        remaining: remaining
    });

    // إذا كنا في وضع التعديل، نطلب كلمة مرور المالك
    if (editingSaleIndex !== null && settings.password) {
        const proceed = await new Promise((resolve) => {
            showModal('أدخل كلمة مرور المالك للمتابعة', (input) => {
                if (input === settings.password) {
                    hideModal();
                    resolve(true);
                } else {
                    alert('كلمة المرور غير صحيحة');
                    hideModal();
                    resolve(false);
                }
            });
        });
        if (!proceed) return;
    }

    // التحقق من توفر الكميات
    for (const item of invoiceItems) {
        const material = materials.find(m => m.id === item.materialId);
        if (material) {
            let existingQty = 0;
            if (editingSaleIndex !== null) {
                const oldSale = sales[editingSaleIndex];
                const oldItem = oldSale.items ? oldSale.items.find(i => i.materialId === item.materialId) : null;
                if (oldItem) existingQty = oldItem.qty;
            }
            if (item.qty > material.stock + existingQty) {
                alert(`الكمية غير متوفرة للمادة ${item.materialName}، الرصيد الحالي: ${material.stock}`);
                return;
            }
        }
    }

    // 📦 المستودع المستهدف
    const _saleWhId = (typeof getDefaultWarehouseId === 'function')
        ? (document.getElementById('saleWarehouse')?.value || getDefaultWarehouseId())
        : '';

    // خصم الكميات من المخزون (بالمستودع)
    for (const item of invoiceItems) {
        const material = materials.find(m => m.id === item.materialId);
        if (!material) continue;

        // استرجاع الفاتورة القديمة (إن كان تعديل)
        if (editingSaleIndex !== null) {
            const oldSale = sales[editingSaleIndex];
            const oldItem = oldSale.items ? oldSale.items.find(i => i.materialId === item.materialId) : null;
            if (oldItem && typeof adjustStock === 'function') {
                try {
                    adjustStock(material.id, oldItem.qty, 'add', _saleWhId, { reason: 'sale_edit_reverse' });
                } catch(e) { console.warn('[sale] reverse:', e.message); }
            }
        }

        // الخصم الرئيسي
        if (typeof adjustStock === 'function') {
            try {
                adjustStock(material.id, item.qty, 'subtract', _saleWhId, {
                    reason: 'sale',
                    reasonLabel: 'فاتورة بيع'
                });
            } catch(e) {
                alert('🚫 ' + e.message);
                return;
            }
        } else {
            // fallback (احتياطي) — الطريقة القديمة
            material.stock = (material.stock || 0) - item.qty;
        }
    }
    updateMaterialsTable();

    if (editingSaleIndex !== null) {
        const oldSale = sales[editingSaleIndex];
        if (oldSale.remaining > 0) {
            const oldDebtIndex = debts.findIndex(d => 
                d.name === oldSale.customer && 
                d.date === oldSale.date && 
                Math.abs(d.amount - oldSale.remaining) < 0.001
            );
            if (oldDebtIndex !== -1) debts.splice(oldDebtIndex, 1);
        }

        const _whIdForSaleEdit = document.getElementById('saleWarehouse')?.value 
            || (oldSale && oldSale.warehouseId) 
            || (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : '');

        sales[editingSaleIndex] = {
            invoice,
            date,
            customer: customer || 'بدون اسم',
            items: [...invoiceItems],
            currency,
            total,
            paid,
            remaining,
            warehouseId: _whIdForSaleEdit
        };

        if (remaining > 0) {
            debts.push({ name: customer || 'فاتورة: ' + invoice, date, amount: remaining, paid: 0, currency });
        }

        editingSaleIndex = null;
    } else {
        // 🆕 حساب التكلفة الإجمالية والربح
        const _totalCost = invoiceItems.reduce((sum, it) => sum + ((it.costAtSale || 0) * (it.qty || 0)), 0);
        const _totalProfit = invoiceItems.reduce((sum, it) => sum + ((it.unitPrice - (it.costAtSale || 0)) * (it.qty || 0)), 0);

        // 💳 الصندوق
        const _boxId = document.getElementById('salePaymentBox')?.value || '';

        const _whIdForSale = (document.getElementById('saleWarehouse')?.value 
            || (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : ''));

        sales.push({
            invoice,
            date,
            customer: customer || 'بدون اسم',
            items: [...invoiceItems],
            currency,
            total: subtotal,
            vat: vatAmount,
            vatRate: vatRate,
            grandTotal: grandTotal,
            paid,
            remaining,
            totalCost: _totalCost,
            profit: _totalProfit,
            paymentBox: _boxId,
            warehouseId: _whIdForSale
        });

        // 💳 خصم/إضافة للصندوق
        if (_boxId && paid > 0) {
            try {
                if (typeof pbAdjustBalance === 'function') {
                    await pbAdjustBalance(_boxId, paid, 'add', {
                        reason: 'sale',
                        reasonLabel: 'فاتورة ' + invoice,
                        relatedId: invoice
                    });
                }
            } catch(e) { console.warn('[pb] adjust failed:', e.message); }
        }

        // 🎨 Toast نجاح
        if (typeof showSuccessToast === 'function') {
            const _boxName = _boxId && typeof _getBoxName === 'function' ? _getBoxName(_boxId) : '';
            const _saleRef = sales[sales.length - 1];
            const _cur = currency === 'USD' ? '$' : 'ل.س';
            const _details = [
                { icon: '📄', label: 'الفاتورة', value: invoice },
                { icon: '💰', label: 'الإجمالي', value: grandTotal + ' ' + _cur },
                { icon: '💵', label: 'المدفوع', value: paid + ' ' + _cur }
            ];
            if (_boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });
            if (remaining > 0) _details.push({ icon: '⏳', label: 'الباقي', value: remaining + ' ' + _cur });

            showSuccessToast({
                title: 'تم حفظ الفاتورة بنجاح!',
                details: _details,
                actions: [
                    {
                        label: 'عرض التفاصيل',
                        icon: '📋',
                        style: 'light',
                        onClick: () => {
                            if (typeof showSaleDetailsModal === 'function') showSaleDetailsModal(_saleRef);
                        }
                    },
                    {
                        label: 'واتساب',
                        icon: '📱',
                        onClick: () => {
                            const msg = `🧾 *فاتورة*: ${invoice}\n💰 *الإجمالي*: ${grandTotal} ${_cur}\n💵 *المدفوع*: ${paid} ${_cur}\n👤 *العميل*: ${customer || 'بدون اسم'}`;
                            window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
                        }
                    }
                ],
                duration: 8000
            });
        }

        if (remaining > 0) {
            debts.push({ name: customer || 'فاتورة: ' + invoice, date, amount: remaining, paid: 0, currency });
        }
    }

    invoiceItems = [];
    const invoiceNo = document.getElementById('invoiceNo');
    const customerName = document.getElementById('customerName');
    const saleTotal = document.getElementById('saleTotal');
    const invoiceItemsTable = document.getElementById('invoiceItemsTable');
    if (invoiceNo) invoiceNo.value = '';
    if (customerName) customerName.value = '';
    if (saleTotal) saleTotal.value = '';
    if (invoiceItemsTable) invoiceItemsTable.innerHTML = '<tr><th>المادة</th><th>الكمية</th><th>السعر الإفرادي</th><th>الإجمالي</th><th>حذف</th></tr>';

    updateSalesTable();
    updateDebtsTable();
    updateStatistics();
    alert('تم حفظ الفاتورة بنجاح');
    await saveAllData();
}

// ربط أزرار نافذة الدفع مباشرة


// نسخة واحدة فقط لربط زر تأكيد الدفع
let isSaving = false;
document.addEventListener('DOMContentLoaded', function() {
    const confirmBtn = document.getElementById('paymentConfirmBtn');
    const cancelBtn = document.getElementById('paymentCancelBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function() {
            if (isSaving) return;
            isSaving = true;
            const paidInput = document.getElementById('paymentModalInput');
            if (!paidInput) { isSaving = false; return; }
            const paid = parseFloat(paidInput.value) || 0;
            if (!pendingInvoiceData) {
                alert('لا توجد فاتورة معلقة');
                isSaving = false;
                return;
            }
            pendingInvoiceData.paid = paid;
            try {
                await finalizeSale(pendingInvoiceData);
            } finally {
                isSaving = false;
                hidePaymentModal();
            }
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hidePaymentModal();
        });
    }
});


function getInvoiceDataFromForm() {
    return {
        invoice: document.getElementById('invoiceNo').value,
        date: document.getElementById('saleDate').value,
        customer: document.getElementById('customerName').value,
        currency: document.getElementById('saleCurrency').value,
        paid: document.getElementById('salePaid').value,
        total: document.getElementById('saleTotal').value,
        remaining: '0',
        items: invoiceItems
    };
}

function printInvoiceData(data) {
    // 🆕 استخدام نظام الطباعة الحرارية الموحّد
    if (typeof window.ThermalPrint !== 'undefined') {
        try {
            const _bi = (typeof getBusinessInfo === 'function') ? getBusinessInfo() : {};
            window.ThermalPrint.sale({
                invoice: data.invoice,
                date: data.date,
                customer: data.customer,
                currency: data.currency,
                items: data.items || [],
                total: data.total,
                grandTotal: data.grandTotal || data.total,
                paid: data.paid,
                remaining: data.remaining,
                vat: data.vat,
                vatRate: data.vatRate,
                deliveryFee: data.deliveryFee,
                paymentType: data.paymentType,
                paymentBox: data.paymentBox
            }, {
                name: _bi.name || 'المتجر',
                description: _bi.description || '',
                phone: currentUser?.phone || '',
                signature: _bi.signature || ''
            });
            return;
        } catch(e) {
            console.warn('[print] thermal fallback:', e);
        }
    }

    // Fallback: الطباعة القديمة
    const { invoice, date, customer, currency, paid, total, remaining, items } = data;
    const _bi = getBusinessInfo();
    const businessName = _bi.name;
    const businessDescription = _bi.description;
    const signature = _bi.signature || 'توقيع المالك';
    const currencyText = currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const symbol = currency === 'USD' ? '$' : 'ل.س';

    let itemsRows = '';
    items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;text-align:right;background:#f9f9f9;} .invoice{position:relative;border:2px solid #333;padding:25px;max-width:450px;margin:auto;background:white;} .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;} .content{position:relative;z-index:1;} .business-name{font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;} .invoice-title{font-size:20px;font-weight:bold;text-align:right;margin:10px 0;} .info-row{display:flex;justify-content:space-between;margin:5px 0;font-size:14px;} table{width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;} th,td{border:1px solid #333;padding:8px;text-align:center;} th{background:#667eea;color:white;} .totals{margin-top:10px;font-size:15px;text-align:right;} .totals p{margin:3px 0;} .signature{margin-top:40px;text-align:left;border-top:1px dashed #333;padding-top:10px;}</style>');
    printWindow.document.write(`<div class="invoice">
        <div class="watermark">المدير AI</div>
        <div class="content">
            <div class="business-name">${businessName}</div>
            ${businessDescription ? `<div class="business-desc">${businessDescription}</div>` : ''}
            <div class="invoice-title">فاتورة مبيعات</div>
            <div class="info-row"><span>رقم الفاتورة: ${invoice}</span><span>التاريخ: ${date}</span></div>
            <div class="info-row"><span>العميل: ${customer || 'بدون اسم'}</span></div>
            <table>
                <tr><th>المادة</th><th>الكمية</th><th>السعر الإفرادي</th><th>الإجمالي</th></tr>
                ${itemsRows}
            </table>
            <div class="totals">
                <p><strong>الإجمالي الكلي:</strong> ${total} ${currencyText}</p>
                <p><strong>المبلغ كتابةً:</strong> ${tafqitAmount(total, currency)}</p>
                <p><strong>المدفوع:</strong> ${paid} ${currencyText}</p>
                <p><strong>الباقي:</strong> ${remaining} ${currencyText}</p>
                ${data.paymentBox ? `<p style="color:#2980b9;"><strong>💳 الصندوق:</strong> ${(typeof _getBoxName === 'function') ? _getBoxName(data.paymentBox) : '-'}</p>` : ''}
            </div>
            <div style="text-align:center; margin-top:10px;">

            </div>
            <div style="text-align:center; margin-top:10px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('المدير AI|' + invoice + '|' + total + '|' + currency)}" alt="QR Code" style="width:100px;height:100px;" />
            </div>
            <div class="signature">للاستفسار: ${signature}</div>
        </div>
    </div>`);
    printWindow.document.close();
    printWindow.print();
}

async function exportInvoiceData(data) {
    const { invoice, date, customer, currency, paid, total, remaining, items } = data;
    const _bi = getBusinessInfo();
    const businessName = _bi.name;
    const businessDescription = _bi.description;
    const signature = _bi.signature || 'توقيع المالك';
    const currencyText = currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const symbol = currency === 'USD' ? '$' : 'ل.س';

    let itemsRows = '';
    items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    const invoiceElement = document.createElement('div');
    invoiceElement.style.cssText = 'position: fixed; top: 0; left: 0; width: 450px; background: white; padding: 25px; text-align: right; font-family: Arial; z-index: -9999;';
    invoiceElement.innerHTML = `
        <div style="position:relative;border:2px solid #333;padding:25px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;">المدير AI</div>
            <div style="position:relative;z-index:1;">
                <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;">${businessName}</div>
                ${businessDescription ? `<div style="text-align:center;margin-bottom:5px;color:#555;">${businessDescription}</div>` : ''}
                <div style="font-size:20px;font-weight:bold;text-align:right;margin:10px 0;">فاتورة مبيعات</div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>رقم الفاتورة: ${invoice}</span><span>التاريخ: ${date}</span></div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>العميل: ${customer || 'بدون اسم'}</span></div>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
                    <tr><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">المادة</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الكمية</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">السعر الإفرادي</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الإجمالي</th></tr>
                    ${itemsRows}
                </table>
                <div style="margin-top:10px;font-size:15px;text-align:right;">
                    <p style="margin:3px 0;"><strong>الإجمالي الكلي:</strong> ${total} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>المبلغ كتابةً:</strong> ${tafqitAmount(total, currency)}</p>
                    <p style="margin:3px 0;"><strong>المدفوع:</strong> ${paid} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>الباقي:</strong> ${remaining} ${currencyText}</p>
                    ${data.paymentBox ? `<p style="margin:6px 0; padding:6px 8px; background:#f0f7ff; border-radius:6px; color:#2980b9;"><strong>💳 الصندوق:</strong> ${(typeof _getBoxName === 'function') ? _getBoxName(data.paymentBox) : '-'}</p>` : ''}
                </div>
                <div id="invoice-qr" style="text-align:center; margin-top:10px;"></div>
                <div style="margin-top:40px;text-align:left;border-top:1px dashed #333;padding-top:10px;">للاستفسار: ${signature}</div>
            </div>
        </div>
    `;
    document.body.appendChild(invoiceElement);
    setTimeout(() => {
        try { generateInvoiceQR('${invoice}', '${total}', '${currency}'); } catch(e) { console.warn('QR error:', e); }
        setTimeout(() => {
            html2canvas(invoiceElement).then(canvas => {
                const link = document.createElement('a');
                link.download = `invoice_${invoice}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                document.body.removeChild(invoiceElement);
            }).catch(err => {
                console.error('html2canvas error:', err);
                document.body.removeChild(invoiceElement);
            });
        }, 400);
    }, 500);
}

// بحث في الفواتير
function searchSales() {
    updateSalesTable();
}

// ==================== QR Code للفاتورة ====================
function generateInvoiceQR(invoiceId, total, currency) {
    const qrContainer = document.getElementById('invoice-qr');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    // استخدام نص إنجليزي مختصر لتقليل الحجم
    const invoiceData = `ALMUDIR|${invoiceId}|${total}|${currency}`;

    try {
        new QRCode(qrContainer, {
            text: invoiceData,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.L  // ← يزيد السعة 4x
        });
    } catch (e) {
        console.error('QR generation failed:', e);
        qrContainer.innerHTML = '<div style="color:#999;font-size:11px;">QR غير متاح</div>';
    }
}

// تعديل دوال الطباعة والتصدير لتتضمن QR
function enhanceInvoiceWithQR(invoiceId, total, currency) {
    setTimeout(() => generateInvoiceQR(invoiceId, total, currency), 200);
}

// مشاركة الفاتورة عبر واتساب


// ==================== قارئ QR Code ====================
let html5QrCode = null;

async function startQRScanner() {
    // ===== ML Kit للأندرويد =====
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
        try {
            const { BarcodeScanner } = window.Capacitor.Plugins;
            const perm = await BarcodeScanner.requestPermissions();
            if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                alert('يجب منح صلاحية الكاميرا للمسح');
                return;
            }
            if (!(await almudirEnsureMlKit())) return;
            const result = await BarcodeScanner.startScan();
            if (result.barcodes && result.barcodes.length > 0) {
                handleQRData(result.barcodes[0].rawValue);
            }
        } catch (e) {
            console.warn('MLKit error:', e);
            alert('خطأ أثناء المسح: ' + (e.message || e));
        }
        return;
    }
    // ===== كود الويب الأصلي =====
    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) return;
    qrReader.style.display = 'block';
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('qr-reader');
    }
    html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            // تم قراءة الكود
            handleQRData(decodedText);
        },
        (errorMessage) => {
            // أخطاء القراءة (يمكن تجاهلها)
        }
    ).catch(err => {
        alert('تعذر فتح الكاميرا. يرجى إغلاق أي فقاعات محادثات (مثل ماسنجر) أو تطبيقات تظهر فوق الشاشة، ثم المحاولة مرة أخرى.');
        console.error('QR Scanner Error:', err);
    });
}

function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('qr-reader').style.display = 'none';
        }).catch(err => console.error(err));
    }
}

function handleQRData(data) {
    const parts = data.split('|');
    if (parts.length >= 4 && parts[0] === 'المدير AI') {
        const invoiceId = parts[1];
        const total = parts[2];
        const currency = parts[3];
        document.getElementById('qr-result').textContent = `رقم الفاتورة: ${invoiceId} - الإجمالي: ${total} ${currency}`;
        stopQRScanner();
    } else {
        document.getElementById('qr-result').textContent = 'رمز غير صالح';
    }
}

// مشاركة الفاتورة عبر واتساب


// دالة مساعدة لبناء HTML الفاتورة
function buildInvoiceHTML(data) {
    const _bi = getBusinessInfo();
    const businessName = _bi.name;
    const businessDescription = _bi.description;
    const signature = _bi.signature || 'للاستفسار';
    const symbol = data.currency === 'USD' ? '$' : 'ل.س';
    const currencyText = data.currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';

    let itemsRows = '';
    data.items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    return `
        <div style="position:relative;border:2px solid #333;padding:20px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;">المدير AI</div>
            <div style="position:relative;z-index:1;">
                <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;">${businessName}</div>
                ${businessDescription ? `<div style="text-align:center;margin-bottom:5px;color:#555;">${businessDescription}</div>` : ''}
                <div style="font-size:20px;font-weight:bold;text-align:right;margin:10px 0;">فاتورة مبيعات</div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>رقم الفاتورة: ${data.invoice}</span><span>التاريخ: ${typeof formatDate === 'function' ? formatDate(data.date) : data.date}</span></div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>العميل: ${data.customer || 'بدون اسم'}</span></div>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
                    <tr><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">المادة</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الكمية</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">السعر الإفرادي</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الإجمالي</th></tr>
                    ${itemsRows}
                </table>
                <div style="margin-top:10px;font-size:15px;text-align:right;">
                    <p style="margin:3px 0;"><strong>الإجمالي الكلي:</strong> ${data.total} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>المدفوع:</strong> ${data.paid} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>الباقي:</strong> ${data.remaining} ${currencyText}</p>
                    ${data.paymentBox ? `<p style="margin:3px 0; color:#3498db;"><strong>💳 الصندوق:</strong> ${(typeof _getBoxName === 'function') ? _getBoxName(data.paymentBox) : '-'}</p>` : ''}
                </div>
                <div style="margin-top:30px;text-align:left;border-top:1px dashed #333;padding-top:10px;">${signature}</div>
            </div>
        </div>
    `;
}

async function shareInvoiceAsWhatsApp() {
    let data;
    // استخدام بيانات الفاتورة الحالية إذا كانت موجودة
    if (invoiceItems.length > 0) {
        const invoice = document.getElementById('invoiceNo').value;
        const date = document.getElementById('saleDate').value;
        const customer = document.getElementById('customerName').value;
        const currency = document.getElementById('saleCurrency').value;
        const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);
        const paid = parseFloat(document.getElementById('salePaid').value) || 0;
        const remaining = total - paid;
        data = { invoice, date, customer, currency, total, paid, remaining };
    } else if (sales.length > 0) {
        // استخدام آخر فاتورة محفوظة
        const last = sales[sales.length - 1];
        data = {
            invoice: last.invoice,
            date: last.date,
            customer: last.customer,
            currency: last.currency || 'SYP',
            total: last.total,
            paid: last.paid,
            remaining: last.remaining
        };
    } else {
        alert('لا توجد فاتورة للمشاركة');
        return;
    }

    const symbol = data.currency === 'USD' ? '$' : 'ل.س';

    // 💳 إضافة الصندوق
    let _boxLine = '';
    const _lastSale = sales.length > 0 ? sales[sales.length - 1] : null;
    if (data.paymentBox) {
        _boxLine = `\n💳 الصندوق: ${(typeof _getBoxName === 'function') ? _getBoxName(data.paymentBox) : '-'}`;
    } else if (_lastSale && _lastSale.paymentBox) {
        _boxLine = `\n💳 الصندوق: ${(typeof _getBoxName === 'function') ? _getBoxName(_lastSale.paymentBox) : '-'}`;
    }

    const message = `🧾 *فاتورة رقم* ${data.invoice}\n📅 التاريخ: ${data.date}\n👤 العميل: ${data.customer || 'بدون اسم'}\n💰 الإجمالي: ${data.total} ${symbol}\n💵 المدفوع: ${data.paid} ${symbol}\n⏳ الباقي: ${data.remaining} ${symbol}${_boxLine}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// ==================== التفقيط ====================
function tafqitAmount(amount, currency) {
    if (currency === 'USD') return tafqitUSD(amount);
    else return tafqitSYP(amount);
}

function tafqitSYP(number) {
    if (isNaN(number) || number <= 0) return '';
    const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    const convertBelow1000 = (num) => {
        let result = '';
        const h = Math.floor(num / 100);
        const r = num % 100;
        if (h > 0) {
            result += hundreds[h];
            if (r > 0) result += ' و';
        }
        if (r >= 10 && r < 20) {
            result += teens[r - 10];
        } else {
            const t = Math.floor(r / 10);
            const u = r % 10;
            if (t > 0) result += tens[t];
            if (u > 0) {
                if (t > 0) result += ' و';
                result += units[u];
            }
        }
        return result;
    };

    let result = '';
    if (number >= 1000000) {
        const m = Math.floor(number / 1000000);
        result += (m === 1 ? 'مليون' : (m === 2 ? 'مليونان' : convertBelow1000(m) + ' ملايين'));
        number %= 1000000;
        if (number > 0) result += ' و';
    }
    if (number >= 1000) {
        const k = Math.floor(number / 1000);
        result += (k === 1 ? 'ألف' : (k === 2 ? 'ألفان' : convertBelow1000(k) + ' آلاف'));
        number %= 1000;
        if (number > 0) result += ' و';
    }
    if (number > 0) {
        result += convertBelow1000(number);
    }
    return 'فقط ' + result.trim() + ' ليرة سورية لا غير';
}

function tafqitUSD(number) {
    if (isNaN(number) || number <= 0) return '';
    const rounded = Math.round(number);
    return `فقط ${rounded} دولار أمريكي لا غير`;
}

// ==================== البيع المفرق ====================
// 💳 ملء قائمة صناديق البيع المفرق
function _populateSaleWarehouseSelect(attempt) {
    attempt = attempt || 0;
    const wrap = document.getElementById('saleWarehouseWrap');
    const sel = document.getElementById('saleWarehouse');
    if (!wrap || !sel) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    // ⏳ إذا فارغة — نعيد المحاولة (حتى 10 مرات = ~5 ثوان)
    if (list.length === 0 && attempt < 10) {
        setTimeout(() => _populateSaleWarehouseSelect(attempt + 1), 500);
        return;
    }

    if (list.length === 0) {
        wrap.style.display = 'none';
        sel.innerHTML = '<option value="">لا مستودعات</option>';
        return;
    }

    if (list.length === 1) {
        wrap.style.display = 'none';
        sel.innerHTML = `<option value="${list[0].id}" selected>${list[0].name}</option>`;
        return;
    }

    // إظهار dropdown
    wrap.style.display = 'block';
    const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : list[0].id;

    let html = '';
    list.forEach(w => {
        const isSel = w.id === defId;
        html += `<option value="${w.id}" ${isSel ? 'selected' : ''}>🏠 ${w.name}${w.isDefault ? ' ⭐' : ''}</option>`;
    });
    sel.innerHTML = html;

    console.log(`📦 [sale-wh] عُبّئ ${list.length} مستودعات (attempt=${attempt})`);
}

// 🔄 مساعد: تحديث كل dropdowns المستودعات (يُستدعى بعد تحميل البيانات)
function _whRefreshAllSelects() {
    try {
        _populateSaleWarehouseSelect();
    } catch(e) { console.warn('[wh] sale select:', e.message); }
}

function _populateRetailBoxSelect() {
    const sel = document.getElementById('retailPaymentBox');
    if (!sel) return;
    let html = '<option value="">— بدون صندوق —</option>';
    const boxes = (typeof _pbCache !== 'undefined' ? _pbCache : []);
    boxes.forEach(b => {
        html += `<option value="${b.id}">${b.icon || '💰'} ${b.name} (${_pbFmt ? _pbFmt(b.balance || 0) : (b.balance || 0)})</option>`;
    });
    sel.innerHTML = html;
}

async function quickSale() {
    const materialSelect = document.getElementById('saleMaterial');
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const materialId = materialSelect.value;
    const materialName = selectedOption ? selectedOption.dataset.name : '';
    const qty = parseFloat(document.getElementById('saleQty').value) || 0;
    const currency = document.getElementById('saleCurrency').value;
    const defaultPrice = selectedOption ? (currency === 'USD' ? parseFloat(selectedOption.dataset.saleUsd) : parseFloat(selectedOption.dataset.saleSyp)) || 0 : 0;
    const retailPriceInput = document.getElementById('retailPrice');
    const unitPrice = (retailPriceInput && retailPriceInput.value) ? parseFloat(retailPriceInput.value) : defaultPrice;

    if (!materialId || qty <= 0) {
        alert('الرجاء اختيار مادة وإدخال كمية صحيحة');
        return;
    }

    const material = materials.find(m => m.id === parseInt(materialId));
    if (!material) {
        alert('المادة غير موجودة');
        return;
    }

    if (qty > material.stock) {
        alert(`الكمية غير متوفرة! الرصيد الحالي: ${material.stock}`);
        return;
    }

    // خصم الكمية من المخزون
    if (typeof adjustStock === 'function' && typeof getDefaultWarehouseId === 'function') {
        try { adjustStock(material.id, qty, 'subtract', getDefaultWarehouseId(), { reason: 'pos' }); }
        catch(e) { if (typeof adjustStock === 'function' && typeof getDefaultWarehouseId === 'function') {
        try { adjustStock(material.id, qty, 'subtract', getDefaultWarehouseId(), { reason: 'pos' }); }
        catch(e) { material.stock -= qty; }
    } else {
        material.stock -= qty;
    } }
    } else {
        material.stock -= qty;
    }
    updateMaterialsTable();

    // إنشاء رقم فاتورة مفرقة تلقائي
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const count = sales.filter(s => s.invoice && s.invoice.startsWith('MFR-')).length + 1;
    const invoice = `MFR-${yyyy}${mm}${dd}-${String(count).padStart(3, '0')}`;
    const today = date.toISOString().slice(0, 10);

    const total = qty * unitPrice;
    const paid = total;
    const remaining = 0;

    // 💳 قراءة الصندوق
    const _boxId = document.getElementById('retailPaymentBox')?.value || '';

    // ✨ حساب الضريبة للبيع المفرق
    const retailVatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
    const retailVatAmount = retailVatRate > 0 ? total * (retailVatRate / 100) : 0;
    const retailGrandTotal = total + retailVatAmount;

    const newSale = {
        invoice,
        date: today,
        customer: 'بيع مفرق',
        items: [{
            materialId: parseInt(materialId),
            materialName: material.name,
            materialType: material.type || '',
            qty: qty,
            unit: material.unit || '',
            unitPrice,
            currency,
            total
        }],
        currency,
        total: total,
        vat: retailVatAmount,
        vatRate: retailVatRate,
        grandTotal: retailGrandTotal,
        paid,
        remaining,
        isRetail: true,
        paymentBox: _boxId,
        warehouseId: (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : '')
    };

    sales.push(newSale);

    // 💳 إضافة للصندوق
    if (_boxId && paid > 0) {
        try {
            if (typeof pbAdjustBalance === 'function') {
                await pbAdjustBalance(_boxId, paid, 'add', {
                    reason: 'retail',
                    reasonLabel: 'بيع مفرق ' + invoice,
                    relatedId: invoice
                });
            }
        } catch(e) { console.warn('[pb] mfr:', e.message); }
    }

    // تنظيف الحقول
    document.getElementById('saleQty').value = '';
    document.getElementById('saleUnitPrice').value = '';
    if (retailPriceInput) retailPriceInput.value = '';

    // 💳 تصفير حقل الصندوق
    const _rpb = document.getElementById('retailPaymentBox');
    if (_rpb) _rpb.value = '';

    updateSalesTable();
    updateRetailTable();
    updateDebtsTable();
    updateStatistics();
    // 🎨 Toast نجاح
    if (typeof showSuccessToast === 'function') {
        const _boxName = _boxId && typeof _getBoxName === 'function' ? _getBoxName(_boxId) : '';
        const _saleRef = sales[sales.length - 1];
        const _cur = currency === 'USD' ? '$' : 'ل.س';
        const _details = [
            { icon: '📄', label: 'رقم العملية', value: invoice },
            { icon: '📦', label: 'المادة', value: material.name },
            { icon: '💰', label: 'الإجمالي', value: retailGrandTotal + ' ' + _cur }
        ];
        if (_boxId) _details.push({ icon: '💳', label: 'الصندوق', value: _boxName });

        showSuccessToast({
            title: 'تم البيع المفرق بنجاح!',
            details: _details,
            actions: [
                {
                    label: 'عرض التفاصيل',
                    icon: '📋',
                    style: 'light',
                    onClick: () => {
                        if (typeof showSaleDetailsModal === 'function') showSaleDetailsModal(_saleRef);
                    }
                },
                {
                    label: 'واتساب',
                    icon: '📱',
                    onClick: () => {
                        const msg = `🛒 *بيع مفرق*\n📦 ${material.name} × ${qty}\n💰 *الإجمالي*: ${retailGrandTotal} ${_cur}`;
                        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
                    }
                }
            ],
            duration: 8000
        });
    }
    await saveAllData();
}

// عرض سجل البيع المفرق
// ✨ التحكم في عرض البيع المفرق
var showAllRetail = false;

function toggleShowAllRetail() {
    showAllRetail = !showAllRetail;
    updateRetailTable();
}

function updateRetailTable() {
    const table = document.getElementById('retailSalesTable');
    if (!table) return;
    const searchInput = document.getElementById('searchRetail');
    let retailSales = sales.filter(s => s.isRetail);
    const totalRetail = retailSales.length;

    // تطبيق البحث إن وجد
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.trim().toLowerCase();
        retailSales = retailSales.filter(s => {
            const itemsSummary = s.items ? s.items.map(i => i.materialName).join(' ') : '';
            return (s.invoice && s.invoice.toLowerCase().includes(query)) ||
                   (itemsSummary && itemsSummary.toLowerCase().includes(query));
        });
    } else {
        // 🎯 افتراضياً: آخر عملية فقط. مع "عرض الكل" → الكل
        const count = showAllRetail ? retailSales.length : 1;
        retailSales = retailSales.slice(-count);
    }

    // 🎯 ترتيب عكسي — الأحدث أولاً
    retailSales = retailSales.slice().reverse();

    // 🎯 عرض/إخفاء زر "عرض الكل"
    const isSearchingRetail = searchInput && searchInput.value.trim() !== '';
    const retailShowMore = document.getElementById('retailShowMore');
    const retailTotalSpan = document.getElementById('retailTotalCount');
    if (retailShowMore && retailTotalSpan) {
        if (!isSearchingRetail && totalRetail > 1) {
            retailShowMore.style.display = 'block';
            retailTotalSpan.textContent = totalRetail;
            const btn = retailShowMore.querySelector('button');
            if (btn) {
                btn.innerHTML = showAllRetail 
                    ? '📁 عرض آخر عملية فقط'
                    : '📄 عرض كل العمليات (' + totalRetail + ')';
            }
        } else {
            retailShowMore.style.display = 'none';
        }
    }

    const symbol = (s) => s.currency === 'USD' ? '$' : 'ل.س';
    let rows = '';
    retailSales.forEach((s) => {
        const cur = symbol(s);
        const itemsSummary = s.items ? s.items.map(i => `${i.materialName} (${i.qty} ${i.unit || ''})`).join('، ') : s.materialName;
        const originalIndex = sales.indexOf(s);
        rows += `<tr>
            <td>${s.invoice}</td>
            <td>${typeof formatDate === 'function' ? formatDate(s.date) : s.date}</td>
            <td>${itemsSummary}</td>
            <td>${s.items ? s.items.reduce((sum, i) => sum + i.qty, 0) : '-'}</td>
            <td>${s.currency || 'SYP'}</td>
            <td>${s.total} ${cur}</td>
            <td>${s.paymentBox ? (typeof _getBoxName === 'function' ? _getBoxName(s.paymentBox) : '💳') : '—'}</td>
            <td><button class="btn-delete" onclick="deleteSale(${originalIndex})">حذف</button></td>
        </tr>`;
    });

    table.innerHTML = '<tr><th>رقم العملية</th><th>التاريخ</th><th>المادة</th><th>الكمية</th><th>العملة</th><th>الإجمالي</th><th>💳 الصندوق</th><th>حذف</th></tr>' + rows;
}

// ==================== لوحة تحكم المشتركين ====================
async function loadAdminUsers() {
    const list = document.getElementById('adminUsersList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">جاري التحميل...</div>';

    try {
        const snapshot = await db.collection('users').get();
        let users = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const status = data.subscriptionStatus || 'trial';
            const trialStart = data.trialStartDate
                ? (data.trialStartDate.toDate ? data.trialStartDate.toDate() : new Date(data.trialStartDate.seconds * 1000))
                : null;
            const endDate = data.subscriptionEndDate
                ? (data.subscriptionEndDate.toDate ? data.subscriptionEndDate.toDate() : new Date(data.subscriptionEndDate.seconds * 1000))
                : null;

            let locationText = '-';
            if (data.location) {
                const parts = [data.location.governorate, data.location.town].filter(Boolean);
                if (parts.length) locationText = parts.join(' - ');
            }

            users.push({
                uid: doc.id,
                fullName: data.fullName || 'بدون اسم',
                phone: data.phone || '-',
                email: data.email || '-',
                businessName: data.businessName || '-',
                businessType: data.businessType || '-',
                location: locationText,
                governorate: (data.location && data.location.governorate) || '-',
                status: status,
                contributions: data.bcContributions || 0,
                trialStart: trialStart,
                endDate: endDate,
                createdAt: trialStart
            });
        });

        // الإحصائيات
        updateAdminStats(users);

        // الفلاتر
        populateAdminFilters(users);

        // البحث
        const searchInput = document.getElementById('searchAdmin');
        if (searchInput && searchInput.value.trim() !== '') {
            const q = searchInput.value.trim().toLowerCase();
            users = users.filter(u =>
                u.fullName.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.phone.toLowerCase().includes(q) ||
                u.businessName.toLowerCase().includes(q) ||
                u.location.toLowerCase().includes(q)
            );
        }

        // فلتر الحالة
        const statusFilter = document.getElementById('filterAdminStatus');
        if (statusFilter && statusFilter.value !== 'all') {
            users = users.filter(u => u.status === statusFilter.value);
        }

        // فلتر المحافظة
        const govFilter = document.getElementById('filterAdminGovernorate');
        if (govFilter && govFilter.value !== 'all') {
            users = users.filter(u => u.governorate === govFilter.value);
        }

        // فلتر النشاط
        const bizFilter = document.getElementById('filterAdminBusiness');
        if (bizFilter && bizFilter.value !== 'all') {
            users = users.filter(u => u.businessType === bizFilter.value);
        }

        // الترتيب
        const sortFilter = document.getElementById('filterAdminSort');
        const sortVal = sortFilter ? sortFilter.value : 'newest';
        if (sortVal === 'newest') {
            users.sort((a, b) => (b.trialStart?.getTime() || 0) - (a.trialStart?.getTime() || 0));
        } else if (sortVal === 'oldest') {
            users.sort((a, b) => (a.trialStart?.getTime() || 0) - (b.trialStart?.getTime() || 0));
        } else if (sortVal === 'name') {
            users.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
        } else if (sortVal === 'activity') {
            users.sort((a, b) => b.contributions - a.contributions);
        }

        // ✅ حفظ القائمة + إعادة العرض
        _adminUsersAll = users;
        const _limitEl = document.getElementById('filterAdminLimit');
        if (_limitEl) {
            const _lv = _limitEl.value || '5';
            _adminShownCount = _lv === 'all' ? 9999 : parseInt(_lv);
        }
        renderAdminCards(_adminUsersAll);

    } catch (error) {
        console.error('خطأ في تحميل المشتركين:', error);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">خطأ: ' + error.message + '</div>';
    }
}

// ============================================================
//  📊 الإحصائيات
// ============================================================
function updateAdminStats(users) {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const trial = users.filter(u => u.status === 'trial').length;
    const expired = users.filter(u => u.status === 'expired' || u.status === 'deactivated').length;

    const elTotal = document.getElementById('adminStatTotal');
    const elActive = document.getElementById('adminStatActive');
    const elTrial = document.getElementById('adminStatTrial');
    const elExpired = document.getElementById('adminStatExpired');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elTrial) elTrial.textContent = trial;
    if (elExpired) elExpired.textContent = expired;
}

// ============================================================
//  🔍 الفلاتر
// ============================================================
function populateAdminFilters(users) {
    // المحافظات
    const govFilter = document.getElementById('filterAdminGovernorate');
    if (govFilter && govFilter.options.length <= 1) {
        const governorates = [...new Set(users.map(u => u.governorate).filter(g => g && g !== '-'))].sort();
        governorates.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = '🏛️ ' + g;
            govFilter.appendChild(opt);
        });
    }

    // الأنشطة
    const bizFilter = document.getElementById('filterAdminBusiness');
    if (bizFilter && bizFilter.options.length <= 1) {
        const activities = [...new Set(users.map(u => u.businessType).filter(b => b && b !== '-'))].sort();
        activities.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = '🏪 ' + a;
            bizFilter.appendChild(opt);
        });
    }
}

function resetAdminFilters() {
    const fields = ['searchAdmin', 'filterAdminStatus', 'filterAdminGovernorate', 'filterAdminBusiness', 'filterAdminSort'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') el.value = el.options[0]?.value || 'all';
            else el.value = '';
        }
    });
    const _limitEl = document.getElementById('filterAdminLimit');
    if (_limitEl) _limitEl.value = '5';
    _adminShownCount = 5;
    loadAdminUsers();
}

// ============================================================
//  🎴 عرض البطاقات
// ============================================================
// ═══════════════════════════════════════════════════════════
//  📋 إدارة العرض — Pagination + بحث
// ═══════════════════════════════════════════════════════════
let _adminUsersAll = [];
let _adminShownCount = 5;
let _adminSearchTimer = null;

function adminDebouncedSearch() {
    clearTimeout(_adminSearchTimer);
    _adminSearchTimer = setTimeout(() => {
        loadAdminUsers();
    }, 300);
}

function changeAdminLimit() {
    const v = document.getElementById('filterAdminLimit')?.value || '5';
    _adminShownCount = v === 'all' ? 9999 : parseInt(v);
    renderAdminCards(_adminUsersAll);
}

function showMoreAdminUsers() {
    const v = document.getElementById('filterAdminLimit')?.value || '5';
    const step = v === 'all' ? 9999 : parseInt(v);
    _adminShownCount += step;
    renderAdminCards(_adminUsersAll);
}

function renderAdminCards(users) {
    const list = document.getElementById('adminUsersList');
    if (!list) return;

    if (users.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا يوجد مشتركون مطابقون</div>';
        return;
    }

    const ADMIN_EMAIL = 'jadabass956@gmail.com';

    function _timeAgo(date) {
        if (!date) return { text: 'لم يسجّل دخولاً بعد', color: '#95a5a6', icon: '⚫' };
        const now = Date.now();
        const diff = now - date.getTime();
        const sec = Math.floor(diff / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (sec < 60) return { text: 'نشط الآن', color: '#27ae60', icon: '🟢' };
        if (min < 60) return { text: 'منذ ' + min + ' دقيقة', color: '#27ae60', icon: '🟢' };
        if (hr < 24) return { text: 'منذ ' + hr + ' ساعة', color: '#f39c12', icon: '🟡' };
        if (day < 7) return { text: 'منذ ' + day + ' يوم', color: '#e67e22', icon: '🟠' };
        if (day < 30) return { text: 'منذ ' + Math.floor(day / 7) + ' أسبوع', color: '#e74c3c', icon: '🔴' };
        return { text: 'منذ ' + Math.floor(day / 30) + ' شهر', color: '#95a5a6', icon: '⚫' };
    }

    const sortedUsers = [...users].sort((a, b) => {
        const aAdmin = a.email === ADMIN_EMAIL;
        const bAdmin = b.email === ADMIN_EMAIL;
        if (aAdmin && !bAdmin) return -1;
        if (bAdmin && !aAdmin) return 1;
        return 0;
    });

    let html = '';

    // ✅ عرض أول N فقط
    const _total = sortedUsers.length;
    const _visible = sortedUsers.slice(0, _adminShownCount);
    const _remaining = _total - _visible.length;

    _visible.forEach(u => {
        const isAdmin = u.email === ADMIN_EMAIL;
        const status = u.status;
        let statusColor = '#3498db';
        let statusLabel = '❓ غير معروف';
        if (status === 'active') { statusColor = '#27ae60'; statusLabel = '✅ نشط'; }
        else if (status === 'trial') { statusColor = '#f39c12'; statusLabel = '⏳ تجريبي'; }
        else if (status === 'expired' || status === 'deactivated') { statusColor = '#e74c3c'; statusLabel = '❌ منتهي'; }

        const startText = u.trialStart ? (typeof formatDate === 'function' ? formatDate(u.trialStart) : u.trialStart.toLocaleDateString('ar-SY')) : '-';
        const endText = u.endDate ? (typeof formatDate === 'function' ? formatDate(u.endDate) : u.endDate.toLocaleDateString('ar-SY')) : '-';
        const initial = (u.businessName && u.businessName !== '-') ? u.businessName.charAt(0) : (u.fullName.charAt(0) || '؟');

        const ago = _timeAgo(u.lastActive);

        const cardBg = isAdmin ? 'linear-gradient(135deg, #fffbea 0%, #fff5cc 100%)' : '#ffffff';
        const cardBorder = isAdmin ? '2px solid #f39c12' : '1px solid #eeeeee';
        const cardShadow = isAdmin ? '0 4px 14px rgba(243, 156, 18, 0.25)' : '0 2px 8px rgba(0,0,0,0.05)';
        const avatarBg = isAdmin ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #e67e22, #f39c12)';

        html += '<div style="background:' + cardBg + '; border:' + cardBorder + '; border-radius:12px; padding:15px; margin:10px 0; box-shadow:' + cardShadow + '; position:relative;">' +
            (isAdmin ? '<div style="position:absolute; top:-10px; left:15px; background:linear-gradient(135deg, #f39c12, #e67e22); color:white; padding:3px 12px; border-radius:12px; font-size:10px; font-weight:bold; box-shadow:0 2px 6px rgba(243, 156, 18, 0.4);">👑 المدير (أنت)</div>' : '') +
            '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid ' + (isAdmin ? '#fde68a' : '#f0f0f0') + ';' + (isAdmin ? ' margin-top:8px;' : '') + '">' +
                '<div style="width:52px; height:52px; background:' + avatarBg + '; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold; flex-shrink:0; box-shadow:0 2px 8px rgba(230, 126, 34, 0.3);">' + _escAdm(initial) + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<div style="font-weight:bold; color:#2c3e50; font-size:16px; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + _escAdm(u.fullName) + (isAdmin ? ' 👑' : '') + '</div>' +
                    '<div style="font-size:11px; color:#666; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; direction:ltr; text-align:right;" title="' + _escAdm(u.email) + '">📧 ' + _escAdm(u.email) + '</div>' +
                    '<div style="font-size:11px; color:#666;">📱 ' + _escAdm(u.phone) + '</div>' +
                '</div>' +
                '<span style="background:' + statusColor + '; color:white; padding:5px 12px; border-radius:20px; font-size:11px; white-space:nowrap; font-weight:600;">' + statusLabel + '</span>' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; margin-bottom:12px;">' +
                '<div style="color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🏪 ' + _escAdm(u.businessName) + '</div>' +
                '<div style="color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">💼 ' + _escAdm(u.businessType) + '</div>' +
                '<div style="color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📍 ' + _escAdm(u.location) + '</div>' +
                '<div style="color:#555;">⭐ ' + (u.contributions || 0) + ' إسهام</div>' +
            '</div>' +
            '<div style="background:' + ago.color + '1A; border-right:3px solid ' + ago.color + '; padding:8px 12px; border-radius:8px; margin-bottom:10px; font-size:12px; color:' + ago.color + '; font-weight:600; display:flex; align-items:center; gap:6px;">' +
                '<span>' + ago.icon + '</span>' +
                '<span>آخر نشاط: ' + ago.text + '</span>' +
            '</div>' +
            '<div style="background:#f8f9fa; border-radius:8px; padding:8px; font-size:11px; color:#666; margin-bottom:12px; display:flex; justify-content:space-between; gap:8px;">' +
                '<span>📅 البداية: ' + startText + '</span>' +
                '<span>📅 النهاية: ' + endText + '</span>' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr auto; gap:8px;">' +
                '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">' +
                    '<button onclick="activateUser(\'' + u.uid + '\', 30)" style="padding:8px 5px; background:#27ae60; color:white; border:none; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">✅ 30ي</button>' +
                    '<button onclick="activateUser(\'' + u.uid + '\', 365)" style="padding:8px 5px; background:#229954; color:white; border:none; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">✅ سنة</button>' +
                    '<button onclick="deactivateUser(\'' + u.uid + '\')" style="padding:8px 5px; background:#e67e22; color:white; border:none; border-radius:6px; font-size:11px; cursor:pointer; font-weight:600;">🚫 تعطيل</button>' +
                '</div>' +
                '<button onclick="showUserActions(\'' + u.uid + '\', \'' + _escAdm(u.fullName).replace(/'/g, "") + '\')" style="padding:8px 12px; background:#95a5a6; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer;">⋮</button>' +
            '</div>' +
        '</div>';
    });

    list.innerHTML = html;

    // ✅ العدّاد + زر "عرض المزيد"
    const counter = document.getElementById('adminUsersCounter');
    const moreBtn = document.getElementById('adminUsersMoreBtn');
    const footer = document.getElementById('adminUsersFooter');

    if (footer) footer.style.display = _total > 0 ? 'block' : 'none';

    if (counter) {
        if (_total === 0) {
            counter.textContent = '';
        } else if (_remaining > 0) {
            counter.innerHTML = 'يعرض <b style="color:#3498db;">' + _visible.length + '</b> من <b>' + _total + '</b> • متبقي <b style="color:#e67e22;">' + _remaining + '</b>';
        } else {
            counter.innerHTML = 'يعرض <b style="color:#27ae60;">' + _total + '</b> — الكل';
        }
    }

    if (moreBtn) {
        moreBtn.style.display = _remaining > 0 ? 'inline-block' : 'none';
    }
}

function _escAdm(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// ============================================================
//  ⋮ الإجراءات الإضافية
// ============================================================
function showUserActions(uid, name) {
    const choice = prompt(
        'إجراءات إضافية لـ: ' + name + '\n\n' +
        '1. 📧 إرسال إشعار\n' +
        '2. 📊 عرض التفاصيل (Console)\n' +
        '3. 🗑️ حذف الحساب من Firestore\n' +
        '4. 🔄 تفعيل 6 أشهر\n\n' +
        'أدخل الرقم:'
    );

    if (choice === '1') {
        alert('سيتم إضافة إشعارات قريباً');
    } else if (choice === '2') {
        db.collection('users').doc(uid).get().then(d => {
            console.log('=== تفاصيل المستخدم:', name, '===');
            console.log(JSON.stringify(d.data(), null, 2));
            alert('تم الطباعة في Console');
        });
    } else if (choice === '3') {
        if (confirm('🚫 حظر حساب المستخدم؟\n\n• سيمنع من الدخول فوراً\n• البيانات محفوظة (يمكن فك الحظر لاحقاً)')) {
            (async () => {
                try {
                    await db.collection('users').doc(uid).update({
                        disabled: true,
                        disabledAt: firebase.firestore.FieldValue.serverTimestamp(),
                        disabledBy: auth.currentUser.uid,
                        disabledByEmail: auth.currentUser.email || ''
                    });
                    alert('✅ تم حظر ' + (name || ''));
                    loadAdminUsers();
                } catch(e) {
                    alert('خطأ: ' + e.message);
                }
            })();
        }
    } else if (choice === '4') {
        activateUser(uid, 180);
    }
}

// ═══════════════════════════════════════════════════════
//  🚫 BANNED USERS — قائمة المحظورين + فك الحظر
// ═══════════════════════════════════════════════════════
async function loadBannedUsers() {
    const list = document.getElementById('bannedUsersList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">جاري التحميل...</div>';
    try {
        const seen = new Set();
        const users = [];

        // ① النظام الجديد — users.disabled == true
        try {
            const snap1 = await db.collection('users').where('disabled', '==', true).get();
            snap1.forEach((doc) => {
                const d = doc.data();
                const dt = d.disabledAt
                    ? (d.disabledAt.toDate ? d.disabledAt.toDate() : new Date(d.disabledAt.seconds*1000))
                    : null;
                users.push({
                    uid: doc.id,
                    source: 'users',
                    fullName: d.fullName || 'بدون اسم',
                    email: d.email || '-',
                    phone: d.phone || '-',
                    businessName: d.businessName || '-',
                    disabledAt: dt,
                    disabledByEmail: d.disabledByEmail || '-'
                });
                seen.add(doc.id);
            });
        } catch(e1) { console.warn('[banned] users query:', e1.message); }

        // ② النظام القديم — banned_users
        try {
            const snap2 = await db.collection('banned_users').get();
            snap2.forEach((doc) => {
                if (seen.has(doc.id)) return;
                const d = doc.data();
                const dt = d.bannedAt
                    ? (d.bannedAt.toDate ? d.bannedAt.toDate() : new Date(d.bannedAt.seconds*1000))
                    : null;
                users.push({
                    uid: doc.id,
                    source: 'banned_users',
                    fullName: d.userName || 'بدون اسم',
                    email: '-',
                    phone: '-',
                    businessName: '-',
                    disabledAt: dt,
                    disabledByEmail: d.bannedByEmail || '-'
                });
                seen.add(doc.id);
            });
        } catch(e2) { console.warn('[banned] banned_users query:', e2.message); }

        if (users.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:#27ae60; padding:30px; font-size:16px;">✅ لا يوجد مستخدمون محظورون</div>';
            return;
        }
        renderBannedUsers(users);
    } catch(e) {
        list.innerHTML = '<div style="color:#e74c3c; padding:20px; text-align:center;">❌ ' + _escAdm(e.message) + '</div>';
    }
}

function renderBannedUsers(users) {
    const list = document.getElementById('bannedUsersList');
    if (!list) return;
    let html = '<div style="display:grid; gap:10px;">';
    users.forEach(u => {
        const dt = u.disabledAt ? u.disabledAt.toLocaleString('ar-SY') : '-';
        html += `
            <div style="background:white; border:2px solid #e74c3c; border-radius:12px; padding:15px; box-shadow:0 2px 8px rgba(231,76,60,0.15);">
                <div style="display:flex; justify-content:space-between; align-items:start; gap:10px; flex-wrap:wrap;">
                    <div style="flex:1; min-width:200px;">
                        <div style="font-weight:bold; font-size:16px; color:#2c3e50;">${_escAdm(u.fullName)}</div>
                        <div style="color:#7f8c8d; font-size:13px; margin-top:4px;">📧 ${_escAdm(u.email)}</div>
                        <div style="color:#7f8c8d; font-size:13px;">📱 ${_escAdm(u.phone)}</div>
                        <div style="color:#7f8c8d; font-size:13px;">🏢 ${_escAdm(u.businessName)}</div>
                        <div style="color:#e74c3c; font-size:12px; margin-top:6px;">🚫 ${_escAdm(dt)}</div>
                        <div style="color:#95a5a6; font-size:11px;">بواسطة: ${_escAdm(u.disabledByEmail)}</div>
                    </div>
                    <button onclick="unbanUser('${u.uid}', '${_escAdm(u.fullName).replace(/'/g, "\\'")}')" style="padding:10px 16px; background:#27ae60; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px; align-self:center;">✅ رفع الحظر</button>
                </div>
            </div>`;
    });
    html += '</div>';
    list.innerHTML = html;
}

async function unbanUser(uid, name) {
    if (!confirm('✅ رفع الحظر عن "' + name + '"؟\n\nسيستطيع الدخول مرة أخرى.')) return;
    try {
        // ① محاولة تحديث users/{uid} (النظام الجديد)
        try {
            await db.collection('users').doc(uid).update({
                disabled: firebase.firestore.FieldValue.delete(),
                disabledAt: firebase.firestore.FieldValue.delete(),
                disabledBy: firebase.firestore.FieldValue.delete(),
                disabledByEmail: firebase.firestore.FieldValue.delete(),
                unbannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                unbannedBy: auth.currentUser.uid
            });
        } catch(e1) {
            console.warn('[unban] users update:', e1.message);
        }

        // ② حذف banned_users/{uid} (النظام القديم)
        try {
            await db.collection('banned_users').doc(uid).delete();
        } catch(e2) {
            console.warn('[unban] banned_users delete:', e2.message);
        }

        alert('✅ تم رفع الحظر عن ' + name);
        loadBannedUsers();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

window.loadBannedUsers = loadBannedUsers;
window.renderBannedUsers = renderBannedUsers;
window.unbanUser = unbanUser;


async function activateUser(uid, days = 30) {
    const periodText = days === 365 ? 'سنة' : '30 يومًا';
    if (!confirm(`هل تريد تفعيل/تمديد الاشتراك ${periodText}؟`)) return;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    try {
        await db.collection('users').doc(uid).update({
            subscriptionStatus: 'active',
            subscriptionEndDate: firebase.firestore.Timestamp.fromDate(endDate)
        });
        alert('تم تفعيل الاشتراك بنجاح');
        loadAdminUsers();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
}

async function deactivateUser(uid) {
    if (!confirm('هل تريد تعطيل اشتراك هذا المستخدم؟')) return;
    try {
        await db.collection('users').doc(uid).update({
            subscriptionStatus: 'expired',
            subscriptionEndDate: firebase.firestore.Timestamp.fromDate(new Date())
        });
        alert('تم تعطيل الاشتراك');
        loadAdminUsers();
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
}

// استدعاء loadAdminUsers عند فتح صفحة الإدارة
function openAdminPage() {
    loadAdminUsers();
}

// ==================== مراسلة الدعم (المستخدم) ====================
let supportListener = null;

function openSupportPage() {
    listenToUserSupportMessages();
}

function listenToUserSupportMessages() {
    if (!currentUser || !currentUser.uid) return;
    if (supportListener) supportListener();
    supportListener = db.collection('support_conversations').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                renderSupportMessages(doc.data().messages || []);
            } else {
                renderSupportMessages([]);
            }
        });
}

function renderSupportMessages(messages) {
    const container = document.getElementById('supportMessages');
    if (!container) return;

    // 👋 حالة فارغة
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="support-empty">
                <div class="support-empty-icon">👋</div>
                <div class="support-empty-title">مرحباً بك!</div>
                <div class="support-empty-text">أرسل لنا أي سؤال أو مشكلة — وسنرد بأسرع وقت</div>
            </div>`;
        return;
    }

    // 📅 دالة توليد فاصل التاريخ
    function _dateSep(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d)) return '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        const msgDay = new Date(d);
        msgDay.setHours(0, 0, 0, 0);

        if (msgDay.getTime() === today.getTime()) return 'اليوم';
        if (msgDay.getTime() === yest.getTime()) return 'أمس';

        const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const currentYear = new Date().getFullYear();
        return year === currentYear ? `${day} ${month}` : `${day} ${month} ${year}`;
    }

    // 🕐 دالة توقيت
    function _timeStr(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d)) return '';
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    let html = '';
    let lastDateKey = '';

    messages.forEach((msg) => {
        const isUser = msg.sender === 'user';
        const cls = isUser ? 'user' : 'admin';

        // 📅 فاصل التاريخ
        if (msg.timestamp) {
            const d = new Date(msg.timestamp);
            if (!isNaN(d)) {
                const dateKey = d.toDateString();
                if (dateKey !== lastDateKey) {
                    html += `<div class="support-date-sep">${_dateSep(msg.timestamp)}</div>`;
                    lastDateKey = dateKey;
                }
            }
        }

        // 💬 الفقاعة
        html += `
            <div class="support-bubble ${cls}">
                <div class="support-bubble-text">${_escSupportMsg(msg.text || '')}</div>
                <div class="support-bubble-time">${_timeStr(msg.timestamp)}</div>
            </div>`;
    });

    container.innerHTML = html;
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}

// 🛡️ تطهير نص الرسالة
function _escSupportMsg(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

// ✍️ تكبير حقل الكتابة تلقائياً
window._supportAutoResize = function(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

async function sendUserSupportMessage() {
    const input = document.getElementById('supportInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    const message = {
        sender: 'user',
        text: text,
        timestamp: Date.now()
    };
    try {
        const ref = db.collection('support_conversations').doc(currentUser.uid);
        await ref.set({
            messages: firebase.firestore.FieldValue.arrayUnion(message)
        }, { merge: true });
    } catch (error) {
        alert('خطأ في الإرسال: ' + error.message);
    }
}

// ==================== إدارة محادثات الدعم (للمدير) ====================
let currentConversationUserId = null;


// 🗂️ Cache لأسماء المستخدمين (تفادي طلبات متكررة)
const _supportUserCache = {};

async function _getUserInfo(uid) {
    if (_supportUserCache[uid]) return _supportUserCache[uid];
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) {
            _supportUserCache[uid] = { name: 'مستخدم محذوف', phone: '' };
            return _supportUserCache[uid];
        }
        const d = doc.data();
        _supportUserCache[uid] = {
            name: d.fullName || 'بدون اسم',
            phone: d.phone || '',
            email: d.email || ''
        };
        return _supportUserCache[uid];
    } catch (e) {
        console.warn('[Support] user load failed:', uid, e);
        _supportUserCache[uid] = { name: 'خطأ في التحميل', phone: '' };
        return _supportUserCache[uid];
    }
}

// ═══════════════════════════════════════════════════════════
//  💬 محادثات الدعم — تحسينات v2
// ═══════════════════════════════════════════════════════════
let _supportConvsAll = [];
let _supportFilter = 'all';
let _supportSearchTimer = null;

function adminDebouncedSupportSearch() {
    clearTimeout(_supportSearchTimer);
    _supportSearchTimer = setTimeout(() => {
        renderSupportList();
    }, 300);
}

function switchSupportFilter(f) {
    _supportFilter = f;
    ['all', 'new', 'read'].forEach(k => {
        const btnId = 'supFilter' + k.charAt(0).toUpperCase() + k.slice(1);
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (k === f) {
            btn.style.background = '#3498db';
            btn.style.color = 'white';
        } else {
            btn.style.background = '#ecf0f1';
            btn.style.color = '#2c3e50';
        }
    });
    renderSupportList();
}

function _supCleanPhone(p) {
    return String(p || '').replace(/[^0-9]/g, '');
}

function _supTimeAgo(date) {
    if (!date) return '-';
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (sec < 60) return 'الآن';
    if (min < 60) return 'منذ ' + min + 'د';
    if (hr < 24) return 'منذ ' + hr + 'س';
    if (day < 7) return 'منذ ' + day + 'ي';
    if (day < 30) return 'منذ ' + Math.floor(day / 7) + 'أ';
    return 'منذ ' + Math.floor(day / 30) + 'ش';
}

function renderSupportList() {
    const list = document.getElementById('supportConversationsList');
    const counter = document.getElementById('supportCounter');
    if (!list) return;

    let filtered = [..._supportConvsAll];

    if (_supportFilter === 'new') {
        filtered = filtered.filter(c => c.isNew);
    } else if (_supportFilter === 'read') {
        filtered = filtered.filter(c => !c.isNew);
    }

    const searchEl = document.getElementById('searchSupport');
    const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
    if (q) {
        filtered = filtered.filter(c => {
            const info = _supportUserCache[c.userId] || { name: '', phone: '' };
            return (info.name || '').toLowerCase().includes(q)
                || (info.phone || '').toLowerCase().includes(q)
                || (c.lastText || '').toLowerCase().includes(q);
        });
    }

    // ✅ المثبتة أولاً
    filtered.sort((a, b) => {
        const ap = a.isPinned ? 1 : 0;
        const bp = b.isPinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return 0;
    });

    if (counter) {
        const newCount = _supportConvsAll.filter(c => c.isNew).length;
        let txt = filtered.length + ' محادثة';
        if (newCount > 0) txt += ' • <span style="color:#e74c3c;">🔴 ' + newCount + ' جديد</span>';
        counter.innerHTML = txt;
    }

    if (filtered.length === 0) {
        const msg = _supportConvsAll.length === 0 ? 'لا توجد محادثات بعد' : 'لا توجد محادثات مطابقة';
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px; background:#f8f9fa; border-radius:10px;">' + msg + '</div>';
        return;
    }

    let html = '';
    filtered.forEach(c => {
        const info = _supportUserCache[c.userId] || { name: 'غير معروف', phone: '' };
        const initial = info.name !== 'غير معروف' ? info.name.charAt(0) : '؟';
        const isNew = c.isNew;
        const timeText = _supTimeAgo(c.lastTime);
        const avatarColor = isNew ? '#e74c3c' : '#95a5a6';
        const isPinned = c.isPinned;
        const cardBg = isPinned ? 'linear-gradient(135deg, #fff9e6 0%, #fff4cc 100%)' : '#fff';
        const cardBorder = isPinned ? '#f39c12' : (isNew ? '#f39c12' : '#eee');

        html += '<div onclick="openConversation(\'' + c.userId + '\')" style="display:flex; align-items:center; gap:12px; padding:15px; margin-bottom:8px; background:' + cardBg + '; border:1px solid ' + cardBorder + '; border-radius:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 5px rgba(0,0,0,0.05);">' +
            '<div style="width:50px; height:50px; background:' + avatarColor + '; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold; flex-shrink:0;">' + _escAdm(initial) + '</div>' +
            '<div style="flex:1; min-width:0;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">' +
                    '<div style="font-weight:bold; color:#2c3e50; font-size:15px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">' + _escAdm(info.name) + (isPinned ? ' 📌' : '') + '</div>' +
                    '<div style="display:flex; align-items:center; gap:3px;" onclick="event.stopPropagation()">' +
                        '<button onclick="toggleSupportPin(\'' + c.userId + '\')" title="' + (isPinned ? 'إلغاء التثبيت' : 'تثبيت') + '" style="background:transparent; border:none; font-size:14px; cursor:pointer; padding:2px 4px; opacity:' + (isPinned ? '1' : '0.35') + ';">📌</button>' +
                        '<button onclick="deleteSupportConv(\'' + c.userId + '\', \'' + _escAdm(info.name).replace(/'/g, '') + '\')" title="حذف" style="background:transparent; border:none; font-size:14px; cursor:pointer; padding:2px 4px; opacity:0.7;">🗑️</button>' +
                        '<div style="font-size:11px; color:#999; white-space:nowrap; margin-right:4px;">' + timeText + '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
                    '<div style="font-size:13px; color:#666; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">' + _escAdm(c.lastText) + '</div>' +
                    (isNew ? '<span style="background:#e74c3c; color:white; font-size:10px; padding:2px 8px; border-radius:10px; white-space:nowrap;">🔴 جديد</span>' : '') +
                '</div>' +
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:4px;">' +
                    (info.phone ? '<div style="font-size:11px; color:#999;">📱 ' + _escAdm(info.phone) + '</div>' : '<div></div>') +
                    '<div style="font-size:11px; color:#95a5a6; background:#f0f0f0; padding:2px 8px; border-radius:10px; font-weight:600;">💬 ' + c.messageCount + ' رسالة</div>' +
                '</div>' +
                (info.phone ? '<div style="display:flex; gap:5px; margin-top:8px;" onclick="event.stopPropagation()">' +
                    '<a href="https://wa.me/' + _supCleanPhone(info.phone) + '" target="_blank" style="flex:1; text-align:center; padding:6px 8px; background:#25D366; color:white; border-radius:6px; text-decoration:none; font-size:11px; font-weight:600;">💬 واتساب</a>' +
                    '<a href="tel:' + _supCleanPhone(info.phone) + '" style="flex:1; text-align:center; padding:6px 8px; background:#3498db; color:white; border-radius:6px; text-decoration:none; font-size:11px; font-weight:600;">📞 اتصال</a>' +
                '</div>' : '') +
            '</div>' +
        '</div>';
    });

    list.innerHTML = html;
}

async function loadSupportConversations() {
    const list = document.getElementById('supportConversationsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">جاري التحميل...</div>';

    try {
        const snapshot = await db.collection('support_conversations').get();

        const convs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messages = data.messages || [];
            const last = messages[messages.length - 1];
            convs.push({
                userId: doc.id,
                lastText: last ? (last.text || '').substring(0, 80) : '-',
                lastSender: last ? last.sender : null,
                lastTime: last && last.timestamp ? new Date(last.timestamp) : null,
                messageCount: messages.length,
                isNew: last && last.sender === 'user'
            });
        });

        // ✅ isNew — بحسب آخر زيارة للإدارة
        const _lastViewAt = parseInt(localStorage.getItem('adminLastViewAt') || '0');
        convs.forEach(c => {
            const t = c.lastTime ? c.lastTime.getTime() : 0;
            c.isNew = c.lastSender === 'user' && t > _lastViewAt;
            // ✅ isPinned — من localStorage
            c.isPinned = localStorage.getItem('pinnedSupport_' + c.userId) === '1';
        });

        convs.sort((a, b) => {
            const ta = a.lastTime ? a.lastTime.getTime() : 0;
            const tb = b.lastTime ? b.lastTime.getTime() : 0;
            return tb - ta;
        });

        await Promise.all(convs.map(c => _getUserInfo(c.userId)));

        _supportConvsAll = convs;
        renderSupportList();

        // ✅ تحديث آخر زيارة
        try { localStorage.setItem('adminLastViewAt', String(Date.now())); } catch(e) {}

        // ✅ تحديث شارة الإدارة
        if (typeof updateAdminBadge === 'function') updateAdminBadge();

    } catch (error) {
        console.error('خطأ في تحميل المحادثات:', error);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">خطأ: ' + error.message + '</div>';
    }
}

async function openConversation(userId) {
    currentConversationUserId = userId;
    const info = await _getUserInfo(userId);

    const nameEl = document.getElementById('convName');
    const phoneEl = document.getElementById('convPhone');
    const avatarEl = document.getElementById('convAvatar');
    if (nameEl) nameEl.textContent = info.name || 'غير معروف';
    if (phoneEl) phoneEl.textContent = info.phone ? '📱 ' + info.phone : '—';
    if (avatarEl) avatarEl.textContent = (info.name || '؟').charAt(0);

    if (typeof openPage === 'function') openPage('support-conversation');

    await _loadConversationMessages(userId);
}

async function _loadConversationMessages(userId) {
    const container = document.getElementById('convMessages');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">جاري التحميل...</div>';

    try {
        const doc = await db.collection('support_conversations').doc(userId).get();
        if (!doc.exists) {
            container.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا توجد رسائل</div>';
            return;
        }

        const messages = doc.data().messages || [];
        if (messages.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا توجد رسائل</div>';
            return;
        }

        let html = '';
        let lastDate = '';

        messages.forEach(msg => {
            const isAdmin = msg.sender === 'admin';
            const ts = msg.timestamp ? new Date(msg.timestamp) : null;
            const dateStr = ts ? ts.toDateString() : '';
            const timeStr = ts ? ts.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : '';

            if (dateStr && dateStr !== lastDate) {
                lastDate = dateStr;
                html += '<div style="text-align:center; margin:18px 0;"><span style="background:#ecf0f1; color:#666; padding:4px 14px; border-radius:14px; font-size:11px; font-weight:600;">' + _convDateLabel(ts) + '</span></div>';
            }

            const bubble = isAdmin
                ? 'background:linear-gradient(135deg,#27ae60,#229954); color:white; margin-right:auto; border-radius:16px 16px 16px 4px;'
                : 'background:#ecf0f1; color:#2c3e50; margin-left:auto; border-radius:16px 16px 4px 16px;';

            html += '<div style="max-width:80%; padding:10px 14px; margin:5px 8px; ' + bubble + ' box-shadow:0 2px 5px rgba(0,0,0,0.06); word-wrap:break-word;">' +
                '<div style="font-size:14px; line-height:1.45;">' + _escAdm(msg.text || '') + '</div>' +
                '<div style="font-size:10px; opacity:0.8; text-align:left; margin-top:4px; direction:ltr;">' + timeStr + (isAdmin ? ' ✓✓' : '') + '</div>' +
            '</div>';
        });

        container.innerHTML = html;
        setTimeout(convScrollBottom, 100);
    } catch (e) {
        container.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">خطأ: ' + e.message + '</div>';
    }
}

function _convDateLabel(date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'اليوم';
    if (d.toDateString() === yesterday.toDateString()) return 'أمس';
    return d.toLocaleDateString('ar-SY');
}

function backFromConversation() {
    if (typeof openPage === 'function') openPage('admin');
}

function convScrollBottom() {
    const container = document.getElementById('convMessages');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'end' });
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

async function sendConvReply() {
    const input = document.getElementById('convReplyInput');
    const text = input ? input.value.trim() : '';
    if (!text || !currentConversationUserId) return;

    input.value = '';
    input.style.height = 'auto';

    const message = {
        sender: 'admin',
        text: text,
        timestamp: Date.now()
    };

    try {
        const ref = db.collection('support_conversations').doc(currentConversationUserId);
        await ref.set({
            messages: firebase.firestore.FieldValue.arrayUnion(message)
        }, { merge: true });

        await _loadConversationMessages(currentConversationUserId);

        if (typeof toast === 'function') toast('✅ تم الإرسال', 'success');
    } catch (e) {
        console.error('[conv] reply failed:', e);
        alert('خطأ في الإرسال: ' + e.message);
    }
}


// ==================== إشعارات المزامنة ====================
let syncNotificationTimeout = null;

function showSyncNotification(message, type = 'info') {
    const el = document.getElementById('syncNotification');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    if (type === 'success') {
        el.style.background = '#27ae60';
    } else if (type === 'error') {
        el.style.background = '#e74c3c';
    } else {
        el.style.background = '#2c3e50';
    }
    clearTimeout(syncNotificationTimeout);
    syncNotificationTimeout = setTimeout(() => {
        el.style.display = 'none';
    }, 3000);
}

// ==================== مؤشر حالة الاتصال ====================
window.addEventListener('online', () => {
    const el = document.getElementById('offlineIndicator');
    if (el) el.style.display = 'none';
    if (typeof showSyncNotification === 'function') {
        showSyncNotification('تم استعادة الاتصال، جاري المزامنة...', 'info');
    }
});

window.addEventListener('offline', () => {
    const el = document.getElementById('offlineIndicator');
    if (el) el.style.display = 'block';
});

// إخفاء شاشة البداية وشريط التحميل
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        const bar = document.getElementById('loadingBar');
        if (splash) splash.style.display = 'none';
        if (bar) bar.style.display = 'none';
    }, 2000);
});

// 🚫 [ALMUDIR] حُذف IIFE إنشاء hamburgerBtn — تعارض مع mainMenuBtn

// 🚫 [ALMUDIR] حُذف IIFE إنشاء menuSideBtn (نسخة جديدة) — تعارض
// ==================== إنشاء زر القائمة الجانبية بشكل إجباري ====================
// 🚫 [ALMUDIR] حُذف createMenuButton — تعارض مع mainMenuBtn


// ==================== معاينة الفاتورة كصورة ====================
let previewBlobUrl = null;

function showInvoicePreview(dataUrl) {
    const overlay = document.getElementById('imageViewerOverlay');
    const img = document.getElementById('invoicePreviewImg');
    if (!overlay || !img) return;
    img.src = dataUrl;
    overlay.classList.add('show');
    previewBlobUrl = dataUrl;
}

function closeImageViewer() {
    const overlay = document.getElementById('imageViewerOverlay');
    if (overlay) overlay.classList.remove('show');
    previewBlobUrl = null;
}

function printPreviewImage() {
    const img = document.getElementById('invoicePreviewImg');
    if (!img || !img.src) {
        alert('لا توجد فاتورة للطباعة');
        return;
    }
    const w = window.open('', '_blank');
    if (!w) {
        alert('يرجى السماح بالنوافذ المنبثقة');
        return;
    }
    w.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>طباعة الفاتورة</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; background: #f0f0f0; padding: 15px; text-align: center; }
                .controls { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-bottom: 15px; }
                .controls button { padding: 12px 20px; margin: 5px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; color: white; }
                .btn-print { background: #27ae60; }
                .btn-back { background: #e74c3c; }
                .btn-download { background: #8e44ad; }
                img { max-width: 100%; max-height: 70vh; display: block; margin: 0 auto; border: 2px solid #333; }
                @media print {
                    .controls { display: none; }
                    body { background: white; padding: 0; }
                    img { max-height: none; border: none; }
                }
            </style>
        <style>
@media print {
    .no-print, button, .btn-print, .btn-save, .btn-confirm { display: none !important; }
    body { margin: 0 !important; padding: 0 !important; background: white !important; }
    img { max-width: 100% !important; page-break-inside: avoid; }
}
.no-print { }
</style></head>
        <body onload="setTimeout(function(){window.print();},500);">
            <div class="controls">
                <button class="btn-print no-print" onclick="window.print()">🖨️ طباعة</button>
                <button class="btn-download" onclick="downloadImage()">💾 حفظ</button>
                <button class="btn-back" onclick="window.close()">↩️ رجوع</button>
            </div>
            <img id="printImg" src="${img.src}" />
            <script>
                function downloadImage() {
                    const link = document.createElement('a');
                    link.download = 'invoice_' + Date.now() + '.png';
                    link.href = document.getElementById('printImg').src;
                    link.click();
                }
            </script>
        </body>
        </html>
    `);
    w.document.close();
}

function downloadPreviewImage() {
    if (!previewBlobUrl) return;
    const link = document.createElement('a');
    link.download = 'invoice_' + Date.now() + '.png';
    link.href = previewBlobUrl;
    link.click();
    if (typeof showSyncNotification === 'function') {
        showSyncNotification('تم حفظ الفاتورة ✓', 'success');
    }
}

// تحويل الفاتورة إلى صورة وعرضها
function renderInvoiceImage(data) {
    const el = buildInvoiceElement(data);
    document.body.appendChild(el);

    // 🆕 توليد QR بعد appendChild
    setTimeout(() => {
        try {
            if (typeof QRCode === 'undefined') return;
            const box = el.querySelector('#invoice-qr');
            if (!box) return;
            const qrData = 'ALMUDIR|' + data.invoice + '|' + data.total + '|' + (data.currency || 'SYP');
            new QRCode(box, {
                text: qrData,
                width: 90,
                height: 90,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
            console.log('✅ [QR] تم التوليد');
        } catch(e) { console.warn('[QR] generation:', e.message); }
    }, 100);

    setTimeout(() => {
        html2canvas(el, { useCORS: true }).then(canvas => {
            document.body.removeChild(el);
            const dataUrl = canvas.toDataURL('image/png');
            showInvoicePreview(dataUrl);
        }).catch(err => {
            console.error('خطأ في التحويل:', err);
            document.body.removeChild(el);
            alert('تعذر إنشاء الصورة');
        });
    }, 700);
}

// فتح قائمة تصدير الفاتورة (طباعة أو حفظ صورة)
function exportInvoiceMenu(index) {
    const s = sales[index];
    if (!s) return;
    // 📄 افتح صفحة التفاصيل الشاملة
    if (typeof openInvoiceDetails === 'function') {
        openInvoiceDetails(index);
    } else {
        // fallback
        const data = {
            invoice: s.invoice, date: s.date, customer: s.customer,
            currency: s.currency, paid: s.paid, total: s.total,
            remaining: s.remaining, items: s.items || [],
            paymentBox: s.paymentBox || ''
        };
        renderInvoiceImage(data);
    }
}

// ==================== معاينة الفاتورة وطباعتها ====================
function buildInvoiceElement(data) {
    const _bi = getBusinessInfo();
    const businessName = _bi.name;
    const businessDescription = _bi.description;
    const signature = _bi.signature;
    const currencyText = data.currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية';
    const symbol = data.currency === 'USD' ? '$' : 'ل.س';

    // ✨ الموقع من currentUser
    let locationText = '';
    try {
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.location) {
            const loc = currentUser.location;
            const parts = [loc.governorate, loc.town].filter(Boolean);
            if (parts.length > 0) locationText = parts.join(' - ');
        }
    } catch (e) { console.warn('[invoice] location:', e); }

    let itemsRows = '';
    data.items.forEach(item => {
        itemsRows += `<tr>
            <td>${item.materialName}${item.materialType ? ' - ' + item.materialType : ''}</td>
            <td>${item.qty} ${item.unit || ''}</td>
            <td>${item.unitPrice} ${symbol}</td>
            <td>${item.total} ${symbol}</td>
        </tr>`;
    });

    const el = document.createElement('div');
    el.style.cssText = 'position:fixed; top:0; left:0; width:450px; background:white; padding:25px; text-align:right; font-family:Arial; z-index:-9999;';
    el.innerHTML = `
        <div style="position:relative;border:2px solid #333;padding:25px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.06);font-weight:bold;z-index:0;">المدير AI</div>
            <div style="position:relative;z-index:1;">
                <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:5px;">${businessName}</div>
                ${businessDescription ? `<div style="text-align:center;margin-bottom:5px;color:#555;">${businessDescription}</div>` : ''}
                ${locationText ? `<div style="text-align:center;margin-bottom:5px;color:#555;font-size:13px;">📍 ${locationText}</div>` : ''}
                ${signature ? `<div style="text-align:center;margin-bottom:10px;color:#555;font-size:13px;">📞 ${signature}</div>` : ''}
                <div style="font-size:20px;font-weight:bold;text-align:right;margin:10px 0;">فاتورة مبيعات</div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>رقم الفاتورة: ${data.invoice}</span><span>التاريخ: ${typeof formatDate === 'function' ? formatDate(data.date) : data.date}</span></div>
                <div style="display:flex;justify-content:space-between;margin:5px 0;font-size:14px;"><span>العميل: ${data.customer || 'بدون اسم'}</span></div>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:13px;">
                    <tr><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">المادة</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الكمية</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">السعر</th><th style="border:1px solid #333;padding:8px;background:#667eea;color:white;">الإجمالي</th></tr>
                    ${itemsRows}
                </table>
                <div style="margin-top:10px;font-size:15px;text-align:right;">
                    ${(() => {
                        const vatRate = (typeof getCurrentVAT === 'function') ? getCurrentVAT() : 0;
                        const subtotal = parseFloat(data.total) || 0;
                        if (vatRate > 0) {
                            const vatAmount = subtotal * (vatRate / 100);
                            const grandTotal = subtotal + vatAmount;
                            return `
                                <p style="margin:3px 0;"><strong>المجموع الفرعي:</strong> ${subtotal.toFixed(2)} ${currencyText}</p>
                                <p style="margin:3px 0; color:#f39c12;"><strong>الضريبة (${vatRate}%):</strong> ${vatAmount.toFixed(2)} ${currencyText}</p>
                                <p style="margin:3px 0; padding-top:5px; border-top:1px solid #ddd; color:#27ae60; font-size:16px;"><strong>الإجمالي النهائي:</strong> ${grandTotal.toFixed(2)} ${currencyText}</p>
                            `;
                        } else {
                            return `<p style="margin:3px 0;"><strong>الإجمالي:</strong> ${subtotal.toFixed(2)} ${currencyText}</p>`;
                        }
                    })()}
                    <p style="margin:3px 0;"><strong>المدفوع:</strong> ${data.paid} ${currencyText}</p>
                    <p style="margin:3px 0;"><strong>الباقي:</strong> ${data.remaining} ${currencyText}</p>
                    ${data.paymentBox ? `<p style="margin:6px 0; padding:6px 8px; background:#f0f7ff; border-radius:6px; color:#2980b9;"><strong>💳 الصندوق:</strong> ${(typeof _getBoxName === 'function') ? _getBoxName(data.paymentBox) : '-'}</p>` : ''}
                </div>
                <div id="invoice-qr" style="text-align:center;margin-top:10px;"></div>
                <div style="margin-top:30px;text-align:center;border-top:1px dashed #333;padding-top:12px;font-size:13px;color:#666;">
    🌟 شكراً لتعاملكم معنا 🌟
</div>
            </div>
        </div>
    `;
    return el;
}

// ==================== تحليلات AI ====================
let monthlyProfitChart = null;
let yearlyProfitChart = null;
let topMaterialsChart = null;
let topCustomersChart = null;

function updateAnalytics() {
    const range = document.getElementById('analyticsRange')?.value || '365';
    let fromDate = null;
    if (range !== 'all') {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(range));
        fromDate = d;
    }

    // تصفية المبيعات والمصروفات حسب الفترة
    const filteredSales = sales.filter(s => {
        if (!fromDate) return true;
        return new Date(s.date) >= fromDate;
    });
    const filteredExpenses = expenses.filter(e => {
        if (!fromDate) return true;
        return new Date(e.date) >= fromDate;
    });

    // حساب الأرباح
    let totalSales = 0, totalExpenses = 0, totalVAT = 0;
    filteredSales.forEach(s => {
        totalSales += (typeof getSaleGrandTotal === 'function' ? getSaleGrandTotal(s) : (s.total || 0));
        totalVAT += (typeof getSaleVAT === 'function' ? getSaleVAT(s) : (s.vat || 0));
    });
    filteredExpenses.forEach(e => totalExpenses += e.amount);
    
    // 🔧 FIX-PROFIT-NET: استخدام profit.net (يشمل COGS + إتلافات)
    let totalProfit = totalSales - totalExpenses;
    if (typeof AnalyticsEngine !== 'undefined' && AnalyticsEngine.providersCount() > 0) {
        try {
            const _ctx = fromDate ? { from: fromDate.toISOString().slice(0, 10) } : {};
            const _net = AnalyticsEngine.get('profit.net', _ctx);
            if (_net !== null && _net !== undefined) {
                totalProfit = _net;
                console.log('🎯 [analytics] profit.net:', totalProfit);
            }
        } catch(e) {
            console.warn('[analytics] profit.net:', e.message);
        }
    }

    // 💰 عرض VAT دائماً
    const _vatCard = document.getElementById('aiVATCard');
    const _vatEl = document.getElementById('aiTotalVAT');
    if (_vatCard && _vatEl) {
        _vatCard.style.display = 'block';
        _vatEl.textContent = (typeof formatCurrency === 'function' ? formatCurrency(Math.round(totalVAT)) : Math.round(totalVAT));
    }

    // ✨ حساب أيام العمل والمتوسطات اليومية
    let _workingDays = 0;
    let _avgDailySales = 0;
    let _avgDailyProfit = 0;

    try {
        if (typeof countWorkingDays === 'function') {
            // 🔧 FIX-DAYS: نبدأ دائماً من أقدم فاتورة (لا من الفترة)
            const now = new Date();
            let startDate = null;
            
            if (filteredSales.length > 0) {
                const dates = filteredSales
                    .map(s => new Date(s.date))
                    .filter(d => !isNaN(d.getTime()));
                
                if (dates.length > 0) {
                    startDate = new Date(Math.min.apply(null, dates));
                }
            }
            
            // لو لا توجد فواتير — من fromDate
            if (!startDate && fromDate) {
                startDate = fromDate;
            }
            
            if (startDate) {
                _workingDays = countWorkingDays(startDate, now);
                if (_workingDays > 0) {
                    _avgDailySales = totalSales / _workingDays;
                    _avgDailyProfit = totalProfit / _workingDays;
                }
            }
        }
    } catch (e) { console.warn('[analytics] days:', e); }

    // عرض البطاقات
    const wdEl = document.getElementById('aiWorkingDays');
    const asEl = document.getElementById('aiAvgSales');
    const apEl = document.getElementById('aiAvgProfit');
    if (wdEl) wdEl.textContent = _workingDays + ' يوم';
    if (asEl) asEl.textContent = (typeof formatCurrency === 'function' ? formatCurrency(Math.round(_avgDailySales)) : Math.round(_avgDailySales));
    if (apEl) apEl.textContent = (typeof formatCurrency === 'function' ? formatCurrency(Math.round(_avgDailyProfit)) : Math.round(_avgDailyProfit));

    // عدد الفواتير
    const invoiceCount = filteredSales.length;

    // المادة الأكثر مبيعاً
    const materialSales = {};
    filteredSales.forEach(s => {
        (s.items || []).forEach(item => {
            if (!materialSales[item.materialName]) materialSales[item.materialName] = { qty: 0, revenue: 0 };
            materialSales[item.materialName].qty += item.qty;
            materialSales[item.materialName].revenue += item.total;
        });
    });

    // أفضل 5 مواد
    const topMaterials = Object.entries(materialSales)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 5);

    // أفضل 5 عملاء
    const customerSales = {};
    filteredSales.forEach(s => {
        if (!s.customer) return;
        if (!customerSales[s.customer]) customerSales[s.customer] = 0;
        customerSales[s.customer] += s.total;
    });
    const topCustomers = Object.entries(customerSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // عرض البطاقات
    document.getElementById('aiTopMaterial').textContent = topMaterials[0] ? topMaterials[0][0] : '-';
    document.getElementById('aiTopCustomer').textContent = topCustomers[0] ? topCustomers[0][0] : '-';

    // الأرباح الشهرية
    const monthlyData = {};
    filteredSales.forEach(s => {
        const d = new Date(s.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[key]) monthlyData[key] = 0;
        monthlyData[key] += s.total;
    });
    filteredExpenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[key]) monthlyData[key] = 0;
        monthlyData[key] -= e.amount;
    });
    const monthlyLabels = Object.keys(monthlyData).sort();
    const monthlyValues = monthlyLabels.map(k => monthlyData[k]);

    // الأرباح السنوية
    const yearlyData = {};
    filteredSales.forEach(s => {
        const y = new Date(s.date).getFullYear();
        if (!yearlyData[y]) yearlyData[y] = 0;
        yearlyData[y] += s.total;
    });
    filteredExpenses.forEach(e => {
        const y = new Date(e.date).getFullYear();
        if (!yearlyData[y]) yearlyData[y] = 0;
        yearlyData[y] -= e.amount;
    });
    const yearlyLabels = Object.keys(yearlyData).sort();
    const yearlyValues = yearlyLabels.map(k => yearlyData[k]);

    renderCharts(monthlyLabels, monthlyValues, yearlyLabels, yearlyValues, topMaterials, topCustomers);
    generateAIInsights(totalProfit, topMaterials, topCustomers, monthlyValues);
}

function renderCharts(monthlyLabels, monthlyValues, yearlyLabels, yearlyValues, topMaterials, topCustomers) {
    // تدمير المخططات القديمة إن وجدت
    if (monthlyProfitChart) monthlyProfitChart.destroy();
    if (yearlyProfitChart) yearlyProfitChart.destroy();
    if (topMaterialsChart) topMaterialsChart.destroy();
    if (topCustomersChart) topCustomersChart.destroy();

    // الأرباح الشهرية
    const ctx1 = document.getElementById('monthlyProfitChart');
    if (ctx1) {
        monthlyProfitChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'الأرباح الشهرية',
                    data: monthlyValues,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52,152,219,0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    // الأرباح السنوية
    const ctx2 = document.getElementById('yearlyProfitChart');
    if (ctx2) {
        yearlyProfitChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: yearlyLabels,
                datasets: [{
                    label: 'الأرباح السنوية',
                    data: yearlyValues,
                    backgroundColor: '#27ae60'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    // المواد الأكثر مبيعاً
    const ctx3 = document.getElementById('topMaterialsChart');
    if (ctx3) {
        topMaterialsChart = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: topMaterials.map(m => m[0]),
                datasets: [{
                    label: 'الكمية المباعة',
                    data: topMaterials.map(m => m[1].qty),
                    backgroundColor: '#e67e22'
                }]
            },
            options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    }

    // أفضل العملاء
    const ctx4 = document.getElementById('topCustomersChart');
    if (ctx4) {
        topCustomersChart = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: topCustomers.map(c => c[0]),
                datasets: [{
                    label: 'إجمالي الشراء',
                    data: topCustomers.map(c => c[1]),
                    backgroundColor: '#8e44ad'
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }
}

function generateAIInsights(totalProfit, topMaterials, topCustomers, monthlyValues) {
    const insights = [];
    insights.push(`💰 إجمالي الأرباح في الفترة المحددة: ${formatCurrency(totalProfit)}`);
    if (topMaterials[0]) {
        insights.push(`🏆 المادة الأكثر مبيعاً: "${topMaterials[0][0]}" بكمية ${topMaterials[0][1].qty}`);
    }
    if (topCustomers[0]) {
        insights.push(`👑 أفضل عميل: "${topCustomers[0][0]}" بمبلغ ${formatCurrency(topCustomers[0][1])}`);
    }
    if (monthlyValues.length >= 2) {
        const last = monthlyValues[monthlyValues.length - 1];
        const prev = monthlyValues[monthlyValues.length - 2];
        if (last > prev) insights.push('📈 الأرباح في ارتفاع مقارنة بالشهر الماضي.');
        else if (last < prev) insights.push('📉 الأرباح في انخفاض مقارنة بالشهر الماضي، راجع المصروفات.');
    }
    // ✅ القسم القديم محذوف — profit-analytics يعرض الرؤى الآن
    const insightsEl = document.getElementById('aiInsights');
    if (insightsEl) {
        insightsEl.innerHTML = insights.map(i => `<div>• ${i}</div>`).join('');
    }
}

// ==================== المحادثة الذكية ====================
function openAIChat() {
    if (document.body.classList.contains('pin-locked')) return;
    const overlay = document.getElementById('aiChatOverlay');
    if (overlay) overlay.classList.add('show');
    if (document.getElementById('aiChatMessages').innerHTML === '') {
        addAIMessage('assistant', '👋 أنا مساعدك الذكي\n\nأخبرني ماذا تريد أن تعرف عن عملك 📊');
    }
}

function closeAIChat() {
    const overlay = document.getElementById('aiChatOverlay');
    if (overlay) overlay.classList.remove('show');
}

function addAIMessage(sender, text) {
    const container = document.getElementById('aiChatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = `max-width:80%; padding:10px; border-radius:12px; margin:5px 0; white-space:pre-wrap; ${sender === 'user' ? 'background:#3498db; color:white; margin-left:auto;' : 'background:white; color:#2c3e50; border:1px solid #eee;'}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addAIMessage('user', text);

    // معالجة السؤال محليًا (بدون API خارجي حاليًا)
    const response = await answerAIQuestion(text);
    addAIMessage('assistant', response);

    // 👍 [ai-feedback] إضافة أزرار التقييم
    if (typeof aiFeedbackAttach === 'function') {
        try {
            const container = document.getElementById('aiChatMessages');
            const lastMsg = container?.lastElementChild;
            if (lastMsg) {
                // كشف intent
                let intentId = null;
                if (typeof aiScoreIntent === 'function') {
                    const r = aiScoreIntent(text);
                    intentId = r?.intent?.id || null;
                }
                aiFeedbackAttach(lastMsg, text, response, intentId);
            }
        } catch(e) {
            console.warn('[ai-feedback] attach:', e.message);
        }
    }
}

// 🚫 [ALMUDIR] answerAIQuestion نُقلت إلى ai-assistant.js

// إظهار زر AI بشكل دائم
(function() {
    function forceShowAIBtn() {
        // ✨ احترم حالة الإخفاء
        if (!document.body.classList.contains('app-ready')) return;
        if (document.body.classList.contains('qr-open')) return;

        const btn = document.getElementById('aiChatBtn');
        if (btn) {
            btn.style.display = 'flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
        }
    }
    window.addEventListener('DOMContentLoaded', forceShowAIBtn);
    setTimeout(forceShowAIBtn, 1000);
    setTimeout(forceShowAIBtn, 3000);
    // راقب أي تغيير
    // 🚫 مُعطَّل — استبدلناه بـ interval موحّد
    // setInterval(forceShowAIBtn, 2000);
})();

// ==================== مسح الباركود للمواد ====================
let materialQrScanner = null;

async function startMaterialQRScanner() {
    // ===== 🚀 ML Kit Native (APK) =====
    if (typeof window.scanBarcodeNative === 'function') {
        try {
            const result = await window.scanBarcodeNative({
                formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });
            if (result.ok && result.barcodes && result.barcodes.length > 0) {
                await handleMaterialQR(result.barcodes[0].rawValue);
            }
        } catch(e) {
            console.warn('❌ [mat-scan] native:', e);
        }
        return;
    }
    // ===== ML Kit القديم (احتياطي) =====
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
        try {
            const { BarcodeScanner } = window.Capacitor.Plugins;
            const perm = await BarcodeScanner.requestPermissions();
            if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                alert('يجب منح صلاحية الكاميرا للمسح');
                return;
            }
            if (!(await almudirEnsureMlKit())) return;
            const result = await BarcodeScanner.startScan();
            if (result.barcodes && result.barcodes.length > 0) {
                await handleMaterialQR(result.barcodes[0].rawValue);
            }
        } catch (e) {
            console.warn('MLKit error:', e);
            alert('خطأ أثناء المسح: ' + (e.message || e));
        }
        return;
    }
    // ===== كود الويب الأصلي =====
    const reader = document.getElementById('matQRReader');
    if (!reader) {
        alert('حاوية الكاميرا غير موجودة');
        return;
    }
    if (typeof Html5Qrcode === 'undefined') {
        alert('مكتبة قراءة QR غير محملة. تأكد من تحميل الصفحة كاملة.');
        return;
    }

    reader.style.display = 'block';
    if (materialQrScanner) {
        try { await materialQrScanner.clear(); } catch(e) {}
    }

    try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
            alert('لا توجد كاميرا متاحة على هذا الجهاز');
            reader.style.display = 'none';
            return;
        }

        let cameraId = cameras[0].id;
        const backCam = cameras.find(c => /back|rear|environment/i.test(c.label));
        if (backCam) cameraId = backCam.id;

        const _bcFormats = [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF
        ];
        materialQrScanner = new Html5Qrcode('matQRReader', {
            formatsToSupport: _bcFormats,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        });
        await materialQrScanner.start(
            cameraId,
            { fps: 25, qrbox: { width: 300, height: 180 } },
            (decodedText) => handleMaterialQR(decodedText),
            () => {}
        );
    } catch (err) {
        console.error('QR Error:', err);
        reader.style.display = 'none';
        const msg = err && err.message ? err.message : (err && err.name ? err.name : 'خطأ غير معروف');
        if (String(msg).includes('Permission') || String(msg).includes('NotAllowed')) {
            alert('إذن الكاميرا مرفوض. اذهب لإعدادات المتصفح → أذونات الموقع → الكاميرا → السماح.');
        } else {
            alert('تعذر فتح الكاميرا: ' + msg);
        }
    }
}

async function handleMaterialQR(barcode) {
    await stopMaterialQRScanner();
    const barcodeField = document.getElementById('matBarcode');
    if (barcodeField) barcodeField.value = barcode;

    // ========== 1) البحث في المواد المحلية ==========
    const _bc = String(barcode || '').trim();
    const local = materials.find(m => String(m.barcode || '').trim() === _bc);
    if (local) {
        alert('المادة موجودة مسبقاً: ' + local.name + '\nسيتم فتح بياناتها للتعديل.');
        editMaterial(local.id);
        return;
    }

    // ========== 2) ✨ البحث في قاعدة الباركود العامة ==========
    if (typeof publicdb !== 'undefined' && publicdb.lookup) {
        try {
            const found = await publicdb.lookup(barcode);
            if (found && found.name) {
                // ملء الحقول تلقائياً
                const nameField = document.getElementById('matName');
                const typeField = document.getElementById('matType');
                const unitField = document.getElementById('matUnit');

                if (nameField) nameField.value = found.name;
                if (typeField && found.type) typeField.value = found.type;
                if (unitField && found.unit) unitField.value = found.unit;

                // حساب السعر المقترح (SYP) — يعمل من مساهم واحد
                let priceMsg = '';
                const sug = publicdb.suggestPrice(found.priceHistory, 'SYP');
                if (sug) {
                    const saleField = document.getElementById('matSaleSYP');
                    if (saleField && !saleField.value) {
                        saleField.value = sug.value;
                        saleField.style.background = '#fffbea';
                        saleField.title = sug.label + ' (من ' + sug.count + ' مساهم)';
                    }
                    const word = sug.count === 1 ? 'مساهم' : 'مساهمين';
                    priceMsg = '\n\n💰 ' + sug.label + ': ' + sug.value + ' ل.س' +
                              '\n   (من ' + sug.count + ' ' + word + ')';
                    if (sug.showRange && sug.min !== sug.max) {
                        priceMsg += '\n   النطاق: ' + sug.min + ' - ' + sug.max + ' ل.س';
                    }
                }

                alert('✨ منتج معروف!' +
                      '\n\nالاسم: ' + found.name +
                      (found.type ? '\nالنوع: ' + found.type : '') +
                      (found.unit ? '\nالوحدة: ' + found.unit : '') +
                      priceMsg +
                      '\n\nأكمل الكمية والسعر ثم احفظ.');

                // ركّز على حقل الكمية
                const stockField = document.getElementById('matStock');
                if (stockField) stockField.focus();
                return;
            }
        } catch (e) {
            console.warn('[handleMaterialQR] publicdb lookup failed:', e);
        }
    }

    // ========== 3) احتياطي: Open Food Facts ==========
    try {
        const res = await fetch('https://world.openfoodfacts.org/api/v0/product/' + barcode + '.json');
        const data = await res.json();
        if (data.status === 1 && data.product) {
            const p = data.product;
            const name = p.product_name_ar || p.product_name || '';
            if (name) {
                const nameField = document.getElementById('matName');
                if (nameField) nameField.value = name;
            }
            if (p.brands) {
                const typeField = document.getElementById('matType');
                if (typeField) typeField.value = p.brands;
            }
            alert('🌐 تم جلب بيانات من Open Food Facts:\n' + name + '\n\nيرجى إكمال السعر والكمية.');
        } else {
            alert('📷 لم يُعثر على المنتج في أي قاعدة بيانات.\nيرجى إدخال البيانات يدوياً.');
        }
    } catch (e) {
        console.warn('تعذر جلب بيانات المنتج:', e);
        alert('📷 لم يُعثر على المنتج. أدخل البيانات يدوياً.');
    }
}

async function stopMaterialQRScanner() {
    document.body.classList.remove('qr-open');
    if (materialQrScanner) {
        try {
            await materialQrScanner.stop();
            materialQrScanner.clear();
        } catch(e) {}
        const reader = document.getElementById('matQRReader');
        if (reader) reader.style.display = 'none';
    }
}

// ==================== البيع بالباركود ====================
async function startSaleQRScanner() {
    document.body.classList.add('qr-open');
    // ===== 🚀 ML Kit Native (APK) =====
    if (typeof window.scanBarcodeNative === 'function') {
        try {
            const result = await window.scanBarcodeNative({
                formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });
            if (result.ok && result.barcodes && result.barcodes.length > 0) {
                handleSaleQR(result.barcodes[0].rawValue);
            }
        } catch(e) {
            console.warn('❌ [sale-scan] native:', e);
        }
        return;
    }
    // ===== ML Kit القديم (احتياطي) =====
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
        try {
            const { BarcodeScanner } = window.Capacitor.Plugins;
            const perm = await BarcodeScanner.requestPermissions();
            if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                alert('يجب منح صلاحية الكاميرا للمسح');
                return;
            }
            const result = await BarcodeScanner.startScan();
            if (result.barcodes && result.barcodes.length > 0) {
                handleSaleQR(result.barcodes[0].rawValue);
            }
        } catch (e) {
            console.warn('MLKit error:', e);
        }
        return;
    }

    // ===== Fallback: html5-qrcode داخل التطبيق =====
    if (typeof Html5Qrcode === 'undefined') {
        alert('مكتبة المسح غير محملة');
        return;
    }

    const overlayId = 'sale-scan-overlay-' + Date.now();
    const readerId = 'sale-scan-reader-' + Date.now();
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    overlay.innerHTML =
        '<div style="color:white;font-size:18px;margin-bottom:20px;">جاري فتح الكاميرا...</div>' +
        '<div id="' + readerId + '" style="width:80%;max-width:400px;"></div>' +
        '<button id="' + overlayId + '-close" style="margin-top:20px;padding:10px 25px;background:#c0392b;color:white;border:none;border-radius:8px;font-size:16px;cursor:pointer;">إلغاء</button>';
    document.body.appendChild(overlay);

    const cleanup = () => {
        try { overlay.remove(); } catch(e) {}
        window._saleScanner = null;
    };

    document.getElementById(overlayId + '-close').onclick = () => {
        document.body.classList.remove('qr-open');
        if (window._saleScanner) {
            try { window._saleScanner.stop().then(cleanup).catch(cleanup); } catch(e) { cleanup(); }
        } else {
            cleanup();
        }
    };

    try {
        const _bcSaleFormats = [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF
        ];
        const scanner = new Html5Qrcode(readerId, {
            formatsToSupport: _bcSaleFormats,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        });
        window._saleScanner = scanner;
        await scanner.start(
            { facingMode: 'environment' },
            { fps: 25, qrbox: { width: 300, height: 180 } },
            (decodedText) => {
                scanner.stop().then(() => cleanup()).catch(() => cleanup());
                handleSaleQR(decodedText);
            },
            () => {}
        );
    } catch (err) {
        console.error('Sale scanner error:', err);
        alert('تعذر فتح الكاميرا: ' + (err.message || err));
        cleanup();
    }
}

function handleSaleQR(barcode) {
    // 1) ابحث عن المادة في المخزون بالباركود
    const _bc = String(barcode || '').trim();
    const material = materials.find(m => String(m.barcode || '').trim() === _bc);

    if (!material) {
        // 🎯 إشعار بسيط + زر للانتقال لصفحة المواد
        const goAdd = confirm(
            '⚠️ المادة غير موجودة في المخزون\n\n' +
            'الباركود: ' + barcode + '\n\n' +
            'هل تريد إضافتها الآن؟'
        );
        if (goAdd) {
            // انتقل لصفحة المواد
            if (typeof openPage === 'function') {
                openPage('materials');
            } else {
                const matBtn = document.querySelector('[onclick*="materials"]');
                if (matBtn) matBtn.click();
            }

            // املأ الباركود
            const matBarcodeField = document.getElementById('matBarcode');
            if (matBarcodeField) matBarcodeField.value = barcode;

            // ابحث في القاعدة العامة لتعبئة الحقول
            if (typeof publicdb !== 'undefined' && publicdb.lookup) {
                publicdb.lookup(barcode).then(found => {
                    if (found && found.name) {
                        const n = document.getElementById('matName');
                        const t = document.getElementById('matType');
                        const u = document.getElementById('matUnit');
                        if (n && !n.value) n.value = found.name;
                        if (t && !t.value && found.type) t.value = found.type;
                        if (u && !u.value && found.unit) u.value = found.unit;

                        // اقتراح السعر — من مساهم واحد
                        const sug = publicdb.suggestPrice(found.priceHistory, 'SYP');
                        if (sug) {
                            const saleField = document.getElementById('matSaleSYP');
                            if (saleField && !saleField.value) {
                                saleField.value = sug.value;
                                saleField.style.background = '#fffbea';
                                saleField.title = sug.label + ' (من ' + sug.count + ' مساهم)';
                            }
                        }

                        if (typeof showToast === 'function') {
                            showToast('✨ تم ملء الحقول من قاعدة البيانات', 'success');
                        }
                    } else {
                        if (typeof showToast === 'function') {
                            showToast('📝 أكمل بيانات المادة الجديدة', 'info');
                        }
                    }
                }).catch(e => console.warn('lookup failed:', e));
            }
        }
        return;
    }

    // 2) اختر المادة في القائمة
    const select = document.getElementById('saleMaterial');
    if (!select) return;
    select.value = material.id;

    // 3) حدد الكمية = 1 افتراضياً
    const qtyInput = document.getElementById('saleQty');
    if (qtyInput && (!qtyInput.value || parseFloat(qtyInput.value) === 0)) {
        qtyInput.value = 1;
    }

    // 4) حدّث السعر الإفرادي والإجمالي
    calcTotal();

    // 5) أعلم المستخدم
    if (typeof showSyncNotification === 'function') {
        showSyncNotification('✅ تم اختيار: ' + material.name, 'success');
    } else {
        alert('✅ تم اختيار المادة: ' + material.name);
    }
}

/* ===== ALMUDIR BARCODE BRIDGE ===== */
window.almudirScanBarcode = async function() {
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
      const { BarcodeScanner } = window.Capacitor.Plugins;
      const perm = await BarcodeScanner.requestPermissions();
      if (perm.camera !== 'granted' && perm.camera !== 'limited') {
        alert('يجب منح صلاحية الكاميرا للمسح');
        return null;
      }
      const result = await BarcodeScanner.startScan();
      if (result.barcodes && result.barcodes.length) {
        return result.barcodes[0].rawValue;
      }
      return null;
    }
  } catch (e) { console.warn('MLKit scan failed:', e); }
  return null;
};
/* ===== END BRIDGE ===== */


// ✨ استدعاء احتياطي لرأس القائمة بعد تحميل الصفحة
setTimeout(() => {
    if (typeof updateSidebarHeader === 'function') {
        try { updateSidebarHeader(); } catch(e) {}
    }
}, 2500);


// 🚫 [ALMUDIR] تنظيف أي زر عائم مكرر
(function() {
    function removeDup() {
        ['menuSideBtn', 'hamburgerBtn'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.remove();
        });
    }
    removeDup();
    setInterval(removeDup, 1000);
})();


// ============================================================
//  ✨ إدارة تضارب الباركود
// ============================================================
let _conflictData = null;

function showConflictModal(barcode, namesList, currentUserChoice) {
    _conflictData = {
        barcode: barcode,
        names: namesList,
        choice: currentUserChoice || (namesList[0] ? namesList[0].val : '')
    };

    const list = document.getElementById('conflictNamesList');
    if (!list) return;

    list.innerHTML = namesList.map((n, i) => {
        const isTop = i === 0;
        const selected = n.val === _conflictData.choice;
        const borderColor = isTop ? '#27ae60' : '#f39c12';
        return '<label style="display:flex; align-items:center; gap:10px; padding:12px; margin:8px 0; border:2px solid ' +
            (selected ? borderColor : '#ddd') + '; border-radius:10px; cursor:pointer; background:' +
            (selected ? '#f0fdf4' : '#fff') + ';">' +
            '<input type="radio" name="conflictChoice" value="' + _escHtml(n.val) + '" ' + (selected ? 'checked' : '') +
            ' onchange="updateConflictChoice(this.value)" style="width:20px; height:20px;">' +
            '<div style="flex:1;">' +
                '<div style="font-weight:bold; color:#2c3e50; font-size:15px;">' + _escHtml(n.val) + '</div>' +
                '<div style="font-size:11px; color:#666; margin-top:3px;">' +
                    (isTop ? '🏆 الأكثر تصويتاً — ' : '') +
                    (n.votes || 1) + ' صوت' +
                '</div>' +
            '</div>' +
            (isTop ? '<span style="color:#27ae60; font-size:20px;">✓</span>' : '') +
        '</label>';
    }).join('');

    document.getElementById('conflictModal').classList.add('show');
}

function updateConflictChoice(val) {
    if (_conflictData) _conflictData.choice = val;
    showConflictModal(_conflictData.barcode, _conflictData.names, val);
}

function closeConflictModal() {
    document.getElementById('conflictModal').classList.remove('show');
    _conflictData = null;
}

async function confirmConflictChoice() {
    if (!_conflictData) return;
    const choice = _conflictData.choice;
    const barcode = _conflictData.barcode;

    try {
        if (typeof publicdb !== 'undefined' && publicdb.vote) {
            await publicdb.vote(barcode, choice);
        }

        // املأ الحقل بالاسم المختار
        const nameField = document.getElementById('matName');
        if (nameField) nameField.value = choice;

        // املأ باقي البيانات من القاعدة
        const full = await publicdb.lookup(barcode);
        if (full) {
            const typeField = document.getElementById('matType');
            const unitField = document.getElementById('matUnit');
            if (typeField && !typeField.value && full.type) typeField.value = full.type;
            if (unitField && !unitField.value && full.unit) unitField.value = full.unit;

            const sug = publicdb.suggestPrice(full.priceHistory, 'SYP');
            if (sug) {
                const saleField = document.getElementById('matSaleSYP');
                if (saleField && !saleField.value) {
                    saleField.value = sug.value;
                    saleField.style.background = '#fffbea';
                }
            }
        }

        closeConflictModal();

        if (typeof showToast === 'function') {
            showToast('✅ تم اختيار: ' + choice, 'success');
        }
    } catch (e) {
        console.error('[Conflict]', e);
        alert('خطأ: ' + e.message);
    }
}

function _escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}


// ============================================================
//  🛡️ شبكة أمان — ضمان جاهزية الواجهة وظهور الأزرار
// ============================================================
(function _uiSafetyNet() {
    var _readyAdded = false;

    function _addAppReady() {
        if (_readyAdded) return;
        if (!document.body) return;
        document.body.classList.add('app-ready');
        _readyAdded = true;
    }

    function _clearLoadingIfStuck() {
        if (!document.body) return;
        if (!document.body.classList.contains('loading')) return;
        if (typeof auth === 'undefined' || !auth.currentUser) return;
        document.body.classList.remove('loading');
        console.log('🛡️ [safety] removed stuck loading');
    }

    function _ensureAIBtn() {
        if (!document.body) return;
        if (document.body.classList.contains('login-screen')) return;
        if (document.body.classList.contains('qr-open')) return;
        if (typeof auth === 'undefined' || !auth.currentUser) return;

        _clearLoadingIfStuck();
        _addAppReady();

        var btn = document.getElementById('aiChatBtn');
        if (!btn) return;

        if (btn.parentElement && btn.parentElement !== document.body) {
            document.body.appendChild(btn);
        }

        btn.style.display = 'flex';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        btn.style.zIndex = '2147483647';
        btn.style.pointerEvents = 'auto';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
    // 📦 تهيئة المستودعات للمواد
    setTimeout(() => {
        if (typeof migrateMaterialsToWarehouses === 'function') {
            try {
                migrateMaterialsToWarehouses();
            } catch(e) { console.warn('[wh] migrate:', e); }
        }
    }, 1500);
            _ensureAIBtn();
            setTimeout(_ensureAIBtn, 500);
            setTimeout(_ensureAIBtn, 1500);
            setTimeout(_ensureAIBtn, 3000);
        });
    } else {
        _ensureAIBtn();
        setTimeout(_ensureAIBtn, 500);
        setTimeout(_ensureAIBtn, 1500);
        setTimeout(_ensureAIBtn, 3000);
    }

    setInterval(_ensureAIBtn, 5000);
    console.log('🛡️ [safety] UI guard active');
})();


// ═══════════════════════════════════════════════════════════
//  🔔 شارة الإدارة — عدد المحادثات الجديدة
// ═══════════════════════════════════════════════════════════
let _adminBadgeTimer = null;

async function updateAdminBadge() {
    try {
        if (typeof currentUser === 'undefined' || !currentUser) return;
        if (!currentUser.email || currentUser.email !== 'jadabass956@gmail.com') return;

        const snapshot = await db.collection('support_conversations').get();
        const lastViewAt = parseInt(localStorage.getItem('adminLastViewAt') || '0');
        let newCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const messages = data.messages || [];
            const last = messages[messages.length - 1];
            if (!last || last.sender !== 'user') return;
            const lastTime = last.timestamp ? new Date(last.timestamp).getTime() : 0;
            if (lastTime > lastViewAt) newCount++;
        });

        _applyAdminBadge(newCount);
    } catch(e) {
        console.warn('[admin-badge]', e.message);
    }
}

function _applyAdminBadge(count) {
    const btn = document.getElementById('adminDropBtn');
    if (!btn) return;
    let badge = btn.querySelector('.admin-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'admin-badge';
            badge.style.cssText = 'position:absolute;top:-5px;right:-5px;background:#e74c3c;color:white;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:10px;min-width:18px;text-align:center;box-shadow:0 2px 4px rgba(231,76,60,0.4);z-index:10;';
            btn.style.position = 'relative';
            btn.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : String(count);
    } else if (badge) {
        badge.remove();
    }
}

function startAdminBadgeWatcher() {
    if (_adminBadgeTimer) return;
    _adminBadgeTimer = setInterval(updateAdminBadge, 120000);
    setTimeout(updateAdminBadge, 8000);
    console.log('🔔 [admin-badge] watcher started');
}

if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            setTimeout(startAdminBadgeWatcher, 3000);
        } else if (_adminBadgeTimer) {
            clearInterval(_adminBadgeTimer);
            _adminBadgeTimer = null;
            _applyAdminBadge(0);
        }
    });
}


// ═══════════════════════════════════════════════════════════
//  📌🗑️ تثبيت وحذف المحادثات
// ═══════════════════════════════════════════════════════════
function toggleSupportPin(userId) {
    const key = 'pinnedSupport_' + userId;
    const isPinned = localStorage.getItem(key) === '1';

    if (isPinned) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, '1');
    }

    // تحديث الكائن محلياً
    const c = _supportConvsAll.find(x => x.userId === userId);
    if (c) c.isPinned = !isPinned;

    renderSupportList();
    console.log('📌 [support] pin', !isPinned ? 'added' : 'removed', userId);
}

async function deleteSupportConv(userId, name) {
    const c = _supportConvsAll.find(x => x.userId === userId);
    const msgCount = c ? c.messageCount : 0;

    const ok = confirm(
        '🗑️ حذف محادثة ' + name + '؟\n\n' +
        '📊 عدد الرسائل: ' + msgCount + '\n' +
        '⚠️ سيتم الحذف نهائياً ولا يمكن استرجاعه.'
    );
    if (!ok) return;

    try {
        await db.collection('support_conversations').doc(userId).delete();

        // إزالة محلياً
        _supportConvsAll = _supportConvsAll.filter(x => x.userId !== userId);
        localStorage.removeItem('pinnedSupport_' + userId);

        renderSupportList();

        if (typeof toast === 'function') {
            toast('✅ تم حذف المحادثة', 'success');
        } else {
            alert('✅ تم حذف المحادثة');
        }

        console.log('🗑️ [support] deleted', userId);
    } catch(e) {
        console.error('[support-delete]', e);
        alert('⚠️ خطأ في الحذف: ' + e.message);
    }
}


// ═══════════════════════════════════════════════════════════
//  🔄 CLEAR SALE WEIGHT — مسح حقول الوزن
// ═══════════════════════════════════════════════════════════
function clearSaleWeight() {
    const kg = document.getElementById('saleWeightKg');
    const gr = document.getElementById('saleWeightGram');
    const sum = document.getElementById('saleWeightSummary');
    const qty = document.getElementById('saleQty');
    if (kg) kg.value = '';
    if (gr) gr.value = '';
    if (sum) sum.textContent = '';
    if (qty) qty.value = '';
    if (typeof calcTotal === 'function') calcTotal();
    if (kg) kg.focus();
}
window.clearSaleWeight = clearSaleWeight;
