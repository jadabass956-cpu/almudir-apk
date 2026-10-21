// ============================================================
//  ALMUDIR — لوحة إدارة القوالب التجارية
// ============================================================

let _taActivities = [];
let _taCurrentDocId = null;
let _taCurrentItems = [];
let _taEditItemIndex = -1;

// ---------- فتح اللوحة ----------
async function templatesAdminInit() {
    console.log('🎯 [Templates Admin] تحميل...');
    await templatesAdminLoad();
    templatesAdminRender();
}

async function templatesAdminLoad() {
    try {
        const snap = await db.collection('activity_templates').get();
        _taActivities = [];
        snap.forEach(doc => _taActivities.push({ id: doc.id, ...doc.data() }));
        _taActivities.sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log('🎯 loaded', _taActivities.length, 'activities');
    } catch (e) {
        console.error('[Templates Admin]', e);
        _taActivities = [];
    }
}

function templatesAdminRender() {
    const list = document.getElementById('taActivitiesList');
    if (!list) return;

    const totalItems = _taActivities.reduce((s, a) => s + ((a.items || []).length), 0);

    const stat1 = document.getElementById('taStatActivities');
    const stat2 = document.getElementById('taStatItems');
    if (stat1) stat1.textContent = _taActivities.length;
    if (stat2) stat2.textContent = totalItems;

    if (!_taActivities.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">' +
                         'لا توجد أنشطة بعد.<br><br>' +
                         'اضغط "+ إضافة نشاط" لتبدأ.</div>';
        return;
    }

    list.innerHTML = _taActivities.map(a => {
        const itemsCount = (a.items || []).length;
        return '<div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:15px; margin:10px 0; display:flex; align-items:center; gap:12px;">' +
            '<div style="font-size:36px;">' + (a.icon || '📦') + '</div>' +
            '<div style="flex:1;">' +
                '<div style="font-weight:bold; color:#2c3e50; font-size:16px;">' + _taEsc(a.activity || 'بدون اسم') + '</div>' +
                '<div style="color:#666; font-size:12px; margin-top:3px;">' + itemsCount + ' منتج</div>' +
            '</div>' +
            '<button onclick="templatesAdminOpen(\'' + a.id + '\')" style="padding:8px 14px; background:#3498db; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">✏️ تعديل</button>' +
            '<button onclick="templatesAdminDelete(\'' + a.id + '\')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">🗑️</button>' +
        '</div>';
    }).join('');
}


// ============================================================
//  استخراج قائمة الأنشطة من صفحة التسجيل
// ============================================================
function getRegisterActivities() {
    const sel = document.getElementById('regBusinessType');
    if (!sel) return [];

    const list = [];
    sel.querySelectorAll('option').forEach(opt => {
        const v = opt.value;
        // نتجاهل: الفارغ و "أخرى"
        if (v && v !== '' && v !== 'أخرى') {
            list.push({ value: v, label: opt.textContent.trim() });
        }
    });
    return list;
}

// ============================================================
//  ملء قائمة الأنشطة المتاحة (بدون المتكرر)
// ============================================================
function fillActivityOptions(includeCurrentId) {
    const sel = document.getElementById('teActivity');
    const hint = document.getElementById('teActivityHint');
    if (!sel) return;

    const allActivities = getRegisterActivities();
    const usedActivities = _taActivities
        .filter(a => a.id !== includeCurrentId)  // استثنِ الحالي
        .map(a => a.activity);

    const available = allActivities.filter(a => !usedActivities.includes(a.value));

    // امسح القائمة
    sel.innerHTML = '<option value="">— اختر من القائمة —</option>';

    if (!available.length) {
        if (hint) {
            hint.textContent = '✅ كل الأنشطة مُضافة مسبقاً';
            hint.style.color = '#27ae60';
        }
        sel.disabled = true;
        return;
    }

    sel.disabled = false;
    available.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.value;
        opt.textContent = a.label;
        sel.appendChild(opt);
    });

    if (hint) {
        hint.textContent = available.length + ' نشاط متاح للإضافة';
        hint.style.color = '#888';
    }
}

// ---------- إضافة نشاط جديد ----------
function templatesAdminAddNew() {
    _taCurrentDocId = null;
    _taCurrentItems = [];
    
    // املأ القائمة بالأنشطة المتاحة فقط
    fillActivityOptions(null);
    
    const sel = document.getElementById('teActivity');
    if (sel) sel.value = '';
    
    document.getElementById('teIcon').value = '📦';
    document.getElementById('teDescription').value = '';
    document.getElementById('teModalTitle').textContent = '➕ نشاط جديد';
    templatesAdminRenderItems();
    document.getElementById('templateEditorModal').classList.add('show');
}

// ---------- فتح نشاط للتعديل ----------
function templatesAdminOpen(id) {
    const a = _taActivities.find(x => x.id === id);
    if (!a) return;

    _taCurrentDocId = id;
    _taCurrentItems = (a.items || []).slice();

    // املأ القائمة
    fillActivityOptions(id);
    
    const sel = document.getElementById('teActivity');
    const hint = document.getElementById('teActivityHint');
    
    if (sel) {
        // أضف النشاط الحالي (حتى لو "استُخدم")
        const allActivities = getRegisterActivities();
        const current = allActivities.find(x => x.value === a.activity);
        
        // أفرغ القائمة واملأها
        sel.innerHTML = '';
        
        if (current) {
            const opt = document.createElement('option');
            opt.value = current.value;
            opt.textContent = current.label;
            sel.appendChild(opt);
            sel.value = current.value;
        } else {
            // نشاط مخصص (غير موجود في التسجيل)
            const opt = document.createElement('option');
            opt.value = a.activity;
            opt.textContent = a.activity + ' (مخصص)';
            sel.appendChild(opt);
            sel.value = a.activity;
        }
        
        // منع التعديل
        sel.disabled = true;
        if (hint) {
            hint.textContent = 'ℹ️ لا يمكن تغيير اسم النشاط بعد الإنشاء';
            hint.style.color = '#3498db';
        }
    }

    document.getElementById('teIcon').value = a.icon || '📦';
    document.getElementById('teDescription').value = a.description || '';
    document.getElementById('teModalTitle').textContent = '✏️ تعديل: ' + (a.activity || '');

    templatesAdminRenderItems();
    document.getElementById('templateEditorModal').classList.add('show');
}

function closeTemplateEditor() {
    document.getElementById('templateEditorModal').classList.remove('show');
    _taCurrentDocId = null;
    _taCurrentItems = [];
}

// ---------- حفظ تفاصيل النشاط ----------
async function templatesAdminSaveActivity() {
    const sel = document.getElementById('teActivity');
    const activity = sel ? (sel.value || '').trim() : '';
    const icon = (document.getElementById('teIcon').value || '📦').trim();
    const description = (document.getElementById('teDescription').value || '').trim();

    if (!activity) { 
        alert('⚠️ اختر النشاط من القائمة'); 
        return; 
    }

    // تحقق: هل الاسم مستخدم مسبقاً (لنشاط آخر)؟
    if (!_taCurrentDocId) {
        const exists = _taActivities.find(a => a.activity === activity);
        if (exists) {
            alert('⚠️ هذا النشاط موجود مسبقاً\n\nيمكنك تعديله من القائمة.');
            return;
        }
    }

    try {
        if (_taCurrentDocId) {
            await db.collection('activity_templates').doc(_taCurrentDocId).update({
                activity: activity,
                icon: icon,
                description: description,
                items: _taCurrentItems,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const ref = await db.collection('activity_templates').add({
                activity: activity,
                icon: icon,
                description: description,
                items: _taCurrentItems,
                order: _taActivities.length + 1,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid
            });
            _taCurrentDocId = ref.id;
        }
        if (typeof showToast === 'function') {
            showToast('✅ تم حفظ النشاط بنجاح', 'success');
        } else {
            alert('✅ تم حفظ النشاط بنجاح');
        }
        await templatesAdminLoad();
        templatesAdminRender();
        closeTemplateEditor();
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

// ---------- حذف نشاط ----------
async function templatesAdminDelete(id) {
    const a = _taActivities.find(x => x.id === id);
    if (!a) return;
    if (!confirm('حذف النشاط "' + (a.activity || '') + '"؟')) return;
    try {
        await db.collection('activity_templates').doc(id).delete();
        await templatesAdminLoad();
        templatesAdminRender();
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

// ---------- قائمة المنتجات داخل المحرر ----------
function templatesAdminRenderItems() {
    const list = document.getElementById('teItemsList');
    if (!list) return;

    if (!_taCurrentItems.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px; font-size:13px;">لا توجد منتجات بعد</div>';
        return;
    }

    list.innerHTML = _taCurrentItems.map((it, i) => {
        const bc = it.barcode ? '<div style="font-size:10px; color:#3498db; margin-top:2px;">📷 ' + _taEsc(it.barcode) + '</div>' : '';
        return '<div style="background:#f8f9fa; border-radius:8px; padding:10px; margin:5px 0; display:flex; align-items:center; gap:10px;">' +
            '<div style="font-size:12px; color:#999; width:20px;">' + (i + 1) + '</div>' +
            '<div style="flex:1;">' +
                '<div style="font-weight:bold; font-size:14px; color:#2c3e50;">' + _taEsc(it.name || '') + '</div>' +
                '<div style="font-size:11px; color:#666; margin-top:2px;">' + _taEsc(it.unit || 'قطعة') + ' | ' + (it.costSYP || 0) + ' → ' + (it.saleSYP || 0) + '</div>' +
                bc +
            '</div>' +
            '<button onclick="templatesAdminEditItem(' + i + ')" style="padding:5px 10px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;">✏️</button>' +
            '<button onclick="templatesAdminDeleteItem(' + i + ')" style="padding:5px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px;">🗑️</button>' +
        '</div>';
    }).join('');
}

// ---------- إضافة/تعديل منتج ----------
function templatesAdminAddItem() {
    if (_taCurrentItems.length >= 100) {
        alert('⚠️ وصلت الحد الأقصى (100 منتج)');
        return;
    }
    _taEditItemIndex = -1;
    document.getElementById('tiModalTitle').textContent = '➕ منتج جديد';
    document.getElementById('tiName').value = '';
    document.getElementById('tiUnit').value = 'قطعة';
    document.getElementById('tiCost').value = '';
    document.getElementById('tiSale').value = '';
    const bcEl = document.getElementById('tiBarcode');
    if (bcEl) bcEl.value = '';
    document.getElementById('templateItemModal').classList.add('show');
}

function templatesAdminEditItem(idx) {
    const it = _taCurrentItems[idx];
    if (!it) return;
    _taEditItemIndex = idx;
    document.getElementById('tiModalTitle').textContent = '✏️ تعديل منتج';
    document.getElementById('tiName').value = it.name || '';
    document.getElementById('tiUnit').value = it.unit || 'قطعة';
    document.getElementById('tiCost').value = it.costSYP || '';
    document.getElementById('tiSale').value = it.saleSYP || '';
    const bcEl = document.getElementById('tiBarcode');
    if (bcEl) bcEl.value = it.barcode || '';
    document.getElementById('templateItemModal').classList.add('show');
}

function closeTemplateItemModal() {
    document.getElementById('templateItemModal').classList.remove('show');
}

function templatesAdminSaveItem() {
    const name = (document.getElementById('tiName').value || '').trim();
    const unit = (document.getElementById('tiUnit').value || 'قطعة').trim();
    const cost = parseFloat(document.getElementById('tiCost').value) || 0;
    const sale = parseFloat(document.getElementById('tiSale').value) || 0;
    const barcode = (document.getElementById('tiBarcode')?.value || '').trim();

    if (!name) { alert('⚠️ اسم المنتج مطلوب'); return; }

    const item = { name: name, unit: unit, costSYP: cost, saleSYP: sale, barcode: barcode };

    if (_taEditItemIndex >= 0) {
        _taCurrentItems[_taEditItemIndex] = item;
    } else {
        _taCurrentItems.push(item);
    }

    closeTemplateItemModal();
    templatesAdminRenderItems();
}

function templatesAdminDeleteItem(idx) {
    if (!confirm('حذف هذا المنتج؟')) return;
    _taCurrentItems.splice(idx, 1);
    templatesAdminRenderItems();
}

// ---------- HTML Escape ----------
function _taEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

console.log('🎯 [templates-admin] جاهز');


// ============================================================
//  مسح الباركود في محرر المنتج (للمدير)
// ============================================================
async function taAdminScanBarcode() {
    // 1) ML Kit (للأندرويد)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) {
        try {
            const { BarcodeScanner } = window.Capacitor.Plugins;
            const perm = await BarcodeScanner.requestPermissions();
            if (perm.camera === 'granted' || perm.camera === 'limited') {
                const result = await BarcodeScanner.scan();
                if (result.barcodes && result.barcodes.length > 0) {
                    document.getElementById('tiBarcode').value = result.barcodes[0].rawValue;
                    return;
                }
            }
        } catch (e) { console.warn('MLKit:', e); }
    }

    // 2) html5-qrcode (للويب)
    if (typeof Html5Qrcode !== 'undefined') {
        _openTaScanner();
        return;
    }

    // 3) Fallback: إدخال يدوي
    const code = prompt('📷 أدخل الباركود يدوياً:');
    if (code) document.getElementById('tiBarcode').value = code.trim();
}

// ---------- كاميرا الماسح (للمدير) ----------
let _taScannerInstance = null;

function _openTaScanner() {
    // لا تفتح مرتين
    if (document.getElementById('taScannerOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'taScannerOverlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:#000; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center;';
    overlay.innerHTML = `
        <div style="color:white; font-size:16px; margin-bottom:15px;">📷 وجّه الكاميرا نحو الباركود</div>
        <div id="taScannerReader" style="width:90%; max-width:400px;"></div>
        <button id="taScannerClose" style="margin-top:20px; padding:12px 24px; background:#e74c3c; color:white; border:none; border-radius:10px; font-size:16px; cursor:pointer;">❌ إلغاء</button>
    `;
    document.body.appendChild(overlay);

    const cleanup = () => {
        if (_taScannerInstance) {
            try {
                _taScannerInstance.stop().then(() => {
                    _taScannerInstance.clear();
                    _taScannerInstance = null;
                }).catch(() => { _taScannerInstance = null; });
            } catch (e) { _taScannerInstance = null; }
        }
        setTimeout(() => {
            const el = document.getElementById('taScannerOverlay');
            if (el) el.remove();
        }, 100);
    };

    document.getElementById('taScannerClose').onclick = cleanup;

    try {
        _taScannerInstance = new Html5Qrcode('taScannerReader');
        _taScannerInstance.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                const bc = document.getElementById('tiBarcode');
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
