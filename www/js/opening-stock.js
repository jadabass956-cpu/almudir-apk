// ============================================================
//  📥 OPENING STOCK — الرصيد الافتتاحي للمواد
// ============================================================

let _osRows = [];

// ---------- فتح Modal ----------
function openOpeningStockForm() {
    _osRows = [{ name: '', qty: 0, cost: 0, sale: 0, unit: 'علبة', barcode: '', expiryDate: '' }];
    _osRender();
    // 📦 تعبئة المستودعات
    setTimeout(() => {
        if (typeof _osPopulateWarehouse === 'function') _osPopulateWarehouse();
    }, 150);

    document.getElementById('openingStockModal').classList.add('show');
}

function closeOpeningStockForm() {
    document.getElementById('openingStockModal').classList.remove('show');
    _osRows = [];
}

// ---------- عرض الصفوف ----------
function _osRender() {
    const container = document.getElementById('osRowsList');
    if (!container) return;

    let html = '';
    _osRows.forEach((row, idx) => {
        html += `
        <div style="background:white; border-radius:10px; padding:10px; margin-bottom:8px; border:1px solid #e0e0e0;">
            <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr 40px; gap:6px; align-items:end;">
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">📦 المادة</label>
                    <input type="text" value="${_osEsc(row.name)}" onchange="_osUpdateRow(${idx}, 'name', this.value)" placeholder="اسم المادة" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">🔢 الكمية</label>
                    <input type="number" value="${row.qty}" onchange="_osUpdateRow(${idx}, 'qty', parseFloat(this.value) || 0)" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">💰 التكلفة</label>
                    <input type="number" value="${row.cost}" onchange="_osUpdateRow(${idx}, 'cost', parseFloat(this.value) || 0)" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">💵 البيع</label>
                    <input type="number" value="${row.sale}" onchange="_osUpdateRow(${idx}, 'sale', parseFloat(this.value) || 0)" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
                <button onclick="removeOSRow(${idx})" style="padding:6px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; height:32px;">🗑️</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:6px;">
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">📏 الوحدة</label>
                    <input type="text" value="${_osEsc(row.unit)}" onchange="_osUpdateRow(${idx}, 'unit', this.value)" placeholder="علبة" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">🏷️ الباركود</label>
                    <input type="text" value="${_osEsc(row.barcode)}" onchange="_osUpdateRow(${idx}, 'barcode', this.value)" placeholder="اختياري" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
                <div>
                    <label style="display:block; font-size:10px; color:#666; margin-bottom:2px;">📅 الصلاحية</label>
                    <input type="date" value="${_osEsc(row.expiryDate)}" onchange="_osUpdateRow(${idx}, 'expiryDate', this.value)" style="width:100%; padding:6px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:12px;">
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
    _osCalcTotal();
}

function _osUpdateRow(idx, field, value) {
    if (_osRows[idx]) {
        _osRows[idx][field] = value;
        _osCalcTotal();
    }
}

function addOSRow() {
    _osRows.push({ name: '', qty: 0, cost: 0, sale: 0, unit: 'علبة', barcode: '', expiryDate: '' });
    _osRender();
}

function removeOSRow(idx) {
    _osRows.splice(idx, 1);
    if (_osRows.length === 0) _osRows.push({ name: '', qty: 0, cost: 0, sale: 0, unit: 'علبة', barcode: '', expiryDate: '' });
    _osRender();
}

function _osCalcTotal() {
    let totalCost = 0;
    _osRows.forEach(r => totalCost += (r.qty * r.cost));
    const el = document.getElementById('osTotalCost');
    if (el) el.textContent = _osFmt(totalCost) + ' ل.س';
}

// ---------- حفظ ----------
function _osPopulateWarehouse() {
    const wrap = document.getElementById('osWarehouseWrap');
    const sel = document.getElementById('osWarehouse');
    if (!wrap || !sel) return;

    const list = (typeof warehouses !== 'undefined' && Array.isArray(warehouses)) ? warehouses : [];

    if (list.length <= 1) {
        wrap.style.display = 'none';
        const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : (list[0]?.id || '');
        sel.innerHTML = `<option value="${defId}">${list[0]?.name || 'افتراضي'}</option>`;
        return;
    }

    wrap.style.display = 'block';
    const defId = (typeof getDefaultWarehouseId === 'function') ? getDefaultWarehouseId() : list[0].id;

    let html = '';
    list.forEach(w => {
        const isSel = w.id === defId;
        html += `<option value="${w.id}" ${isSel ? 'selected' : ''}>🏠 ${w.name}${w.isDefault ? ' ⭐' : ''}</option>`;
    });
    sel.innerHTML = html;

    console.log(`📦 [os-wh] عُبّئ ${list.length} مستودعات`);
}

async function saveOpeningStock() {
    // فلترة الصفوف الصالحة
    const validRows = _osRows.filter(r => r.name && r.name.trim() && r.qty > 0);

    if (validRows.length === 0) {
        return alert('⚠️ أضف مادة واحدة على الأقل (الاسم + الكمية مطلوبان)');
    }

    // فحص النشاط (إن كان يتطلب صلاحية/باركود)
    const _reqExp = (typeof requiresExpiry === 'function') ? requiresExpiry() : false;
    const _reqBar = (typeof requiresBarcode === 'function') ? requiresBarcode() : false;

    for (let i = 0; i < validRows.length; i++) {
        const r = validRows[i];
        if (_reqExp && !r.expiryDate) {
            return alert(`⚠️ الصف ${i + 1}: "${r.name}" — هذا النشاط يتطلب تاريخ الصلاحية`);
        }
        if (_reqBar && !r.barcode) {
            return alert(`⚠️ الصف ${i + 1}: "${r.name}" — هذا النشاط يتطلب الباركود`);
        }
    }

    if (!confirm(`📥 حفظ ${validRows.length} مادة كرصيد افتتاحي؟`)) return;

    try {
        let added = 0;

        validRows.forEach(r => {
            const newMat = {
                id: (typeof materialId !== 'undefined' ? materialId++ : Date.now() + added),
                barcode: r.barcode || '',
                name: r.name.trim(),
                type: '',
                unit: r.unit || 'علبة',
                stock: r.qty,
                stockByWarehouse: (() => {
                    const whId = (typeof getDefaultWarehouseId === 'function')
                        ? (document.getElementById('osWarehouse')?.value || getDefaultWarehouseId())
                        : 'wh_main';
                    return { [whId]: r.qty };
                })(),
                minStock: 0,
                costSYP: r.cost || 0,
                costHistory: (r.cost > 0 ? [{
                    date: new Date().toISOString().slice(0, 10),
                    cost: r.cost,
                    avgCost: r.cost,
                    qty: r.qty,
                    source: 'opening',
                    costBefore: 0,
                    costChange: 0,
                    createdAt: new Date().toISOString()
                }] : []),
                costUSD: 0,
                saleSYP: r.sale || 0,
                saleUSD: 0,
                expiryDate: r.expiryDate || '',
                batchNumber: '',
                _openingStock: true
            };
            materials.push(newMat);
            added++;
        });

        if (typeof saveAllData === 'function') await saveAllData();
        if (typeof updateMaterialsTable === 'function') updateMaterialsTable();

        // Toast
        if (typeof showSuccessToast === 'function') {
            const totalCost = validRows.reduce((sum, r) => sum + (r.qty * r.cost), 0);
            showSuccessToast({
                title: '📥 تم حفظ الرصيد الافتتاحي!',
                details: [
                    { icon: '📦', label: 'عدد المواد', value: validRows.length + ' مادة' },
                    { icon: '💰', label: 'إجمالي التكلفة', value: _osFmt(totalCost) + ' ل.س' }
                ],
                duration: 6000
            });
        }

        closeOpeningStockForm();
    } catch(e) {
        console.error('[os]', e);
        alert('❌ ' + e.message);
    }
}

// ---------- أدوات ----------
function _osFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _osEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('📥 [opening-stock] جاهز');

// ============================================================
//  📁 IMPORT FROM CSV / JSON
// ============================================================

// ---------- فتح نافذة اختيار الملف ----------
function importOSFromFile() {
    const input = document.getElementById('osFileInput');
    if (input) {
        input.value = '';
        input.click();
    }
}

// ---------- معالجة الملف ----------
async function handleOSFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();

    // تحقق النوع
    if (!name.endsWith('.json') && !name.endsWith('.csv') && !name.endsWith('.txt')) {
        return alert('⚠️ يرجى اختيار ملف CSV أو JSON');
    }

    // تحقق الحجم
    if (file.size > 5 * 1024 * 1024) {
        return alert('⚠️ الملف كبير جداً (الحد 5 MB)');
    }

    try {
        const text = await file.text();
        let rows = [];

        if (name.endsWith('.json')) {
            rows = _parseJSONImport(text);
        } else {
            rows = _parseCSVImport(text);
        }

        if (!rows || rows.length === 0) {
            return alert('⚠️ لم نجد مواد صالحة في الملف');
        }

        // ملخص
        const summary = `📁 الملف: ${file.name}\n` +
                       `✅ صالحة: ${rows.length} مادة\n\n` +
                       `❓ طريقة الإضافة:\n` +
                       `[موافق] = إضافة لما هو موجود\n` +
                       `[إلغاء] = استبدال الصفوف الحالية`;

        if (confirm(summary)) {
            rows.forEach(r => _osRows.push({ ...r }));
        } else {
            _osRows = rows.slice();
        }

        _osRender();

        if (typeof showSuccessToast === 'function') {
            showSuccessToast({
                title: '📁 تم استيراد المواد!',
                details: [
                    { icon: '📦', label: 'عدد المواد', value: rows.length },
                    { icon: '📄', label: 'نوع الملف', value: name.endsWith('.json') ? 'JSON' : 'CSV' }
                ],
                duration: 4000
            });
        }
    } catch(e) {
        console.error('[os import]', e);
        alert('❌ فشل قراءة الملف:\n' + e.message);
    }
}

// ---------- قراءة JSON ----------
function _parseJSONImport(text) {
    let data = JSON.parse(text);

    // دعم صيغتين
    if (data && !Array.isArray(data) && Array.isArray(data.items)) {
        data = data.items;
    }

    if (!Array.isArray(data)) {
        throw new Error('صيغة JSON غير صحيحة — توقع مصفوفة');
    }

    const valid = [];
    data.forEach((row, idx) => {
        if (!row || typeof row !== 'object') return;
        const name = String(row.name || '').trim();
        const qty = parseFloat(row.qty) || 0;
        if (!name || qty <= 0) return;

        valid.push({
            name: name,
            qty: qty,
            cost: parseFloat(row.cost) || 0,
            sale: parseFloat(row.sale) || 0,
            unit: String(row.unit || 'علبة').trim(),
            barcode: String(row.barcode || '').trim(),
            expiryDate: String(row.expiryDate || '').trim()
        });
    });

    return valid;
}

// ---------- قراءة CSV ----------
function _parseCSVImport(text) {
    // نظّف BOM إن وُجد
    text = text.replace(/^\uFEFF/, '');

    // اكتشف الفاصل (فاصلة أو فاصلة منقوطة)
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
        throw new Error('الملف فارغ أو يحتوي على سطر واحد فقط');
    }

    // اكتشف الفاصل من السطر الأول
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

    // اقرأ العناوين
    const headers = _csvSplitLine(firstLine, delimiter).map(h => h.trim().toLowerCase());

    // ابحث عن أعمدة
    const idxName = _findColIdx(headers, ['name', 'اسم', 'المادة', 'مادة', 'الاسم']);
    const idxQty = _findColIdx(headers, ['qty', 'كمية', 'الكمية', 'stock']);
    const idxCost = _findColIdx(headers, ['cost', 'تكلفة', 'التكلفة', 'سعر الشراء']);
    const idxSale = _findColIdx(headers, ['sale', 'بيع', 'البيع', 'سعر البيع']);
    const idxUnit = _findColIdx(headers, ['unit', 'وحدة', 'الوحدة']);
    const idxBarcode = _findColIdx(headers, ['barcode', 'باركود', 'الباركود']);
    const idxExpiry = _findColIdx(headers, ['expiry', 'expirydate', 'صلاحية', 'الصلاحية', 'تاريخ الصلاحية']);

    if (idxName < 0 || idxQty < 0) {
        throw new Error('CSV لا يحتوي على أعمدة مطلوبة: name + qty');
    }

    // اقرأ الصفوف
    const valid = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = _csvSplitLine(lines[i], delimiter);
        if (cells.length === 0) continue;

        const name = (cells[idxName] || '').trim();
        const qty = parseFloat((cells[idxQty] || '0').replace(/[^0-9.\-]/g, '')) || 0;

        if (!name || qty <= 0) continue;

        valid.push({
            name: name,
            qty: qty,
            cost: idxCost >= 0 ? (parseFloat((cells[idxCost] || '0').replace(/[^0-9.\-]/g, '')) || 0) : 0,
            sale: idxSale >= 0 ? (parseFloat((cells[idxSale] || '0').replace(/[^0-9.\-]/g, '')) || 0) : 0,
            unit: idxUnit >= 0 ? (cells[idxUnit] || 'علبة').trim() : 'علبة',
            barcode: idxBarcode >= 0 ? (cells[idxBarcode] || '').trim() : '',
            expiryDate: idxExpiry >= 0 ? (cells[idxExpiry] || '').trim() : ''
        });
    }

    return valid;
}

// ---------- مساعد: تقسيم سطر CSV ----------
function _csvSplitLine(line, delimiter) {
    const cells = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            cells.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    cells.push(cur);

    return cells;
}

// ---------- مساعد: إيجاد عمود ----------
function _findColIdx(headers, options) {
    for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        for (const opt of options) {
            if (h === opt || h.includes(opt)) return i;
        }
    }
    return -1;
}

// ---------- تحميل نموذج CSV ----------
function downloadOSSampleCSV() {
    const csvContent = 'name,qty,cost,sale,unit,barcode,expiryDate\n' +
        'سيتامول 500mg,100,500,1000,علبة,1234567890,2027-12-31\n' +
        'أسبرين 100mg,50,300,600,علبة,,\n' +
        'فيتامين C,30,400,900,علبة,,\n';

    // BOM للدعم العربي في Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'نموذج-الرصيد-الافتتاحي.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof showSuccessToast === 'function') {
        showSuccessToast({
            title: '📥 تم تحميل نموذج CSV!',
            details: [
                { icon: '📄', label: 'الملف', value: 'نموذج-الرصيد-الافتتاحي.csv' },
                { icon: '💡', label: 'ملاحظة', value: 'افتحه في Excel وعدّله' }
            ],
            duration: 5000
        });
    }
}

// ---------- تحميل نموذج JSON ----------
function downloadOSSampleJSON() {
    const sample = [
        {
            name: "سيتامول 500mg",
            qty: 100,
            cost: 500,
            sale: 1000,
            unit: "علبة",
            barcode: "1234567890",
            expiryDate: "2027-12-31"
        },
        {
            name: "أسبرين 100mg",
            qty: 50,
            cost: 300,
            sale: 600,
            unit: "علبة",
            barcode: "",
            expiryDate: ""
        }
    ];

    const text = JSON.stringify(sample, null, 4);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'نموذج-الرصيد-الافتتاحي.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof showSuccessToast === 'function') {
        showSuccessToast({
            title: '📥 تم تحميل نموذج JSON!',
            details: [
                { icon: '📄', label: 'الملف', value: 'نموذج-الرصيد-الافتتاحي.json' }
            ],
            duration: 5000
        });
    }
}

console.log('📁 [opening-stock-import] جاهز');
