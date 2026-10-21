// ============================================================
//  🎨 ACTIVITY UI — بناء النماذج والقوائم تلقائياً
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. OPEN FORM — فتح نموذج إضافة/تعديل
// ═══════════════════════════════════════════════════════════
async function activityOpenForm(activityId, pageId, docId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const { activity, pageConfig } = entry;
    const fields = pageConfig.fields || [];
    
    // هل نُعدّل؟
    let editData = null;
    if (docId) {
        const all = _activityCache.getAll(pageId);
        editData = all.find(x => x.id === docId);
        if (!editData) {
            alert('⚠️ الوثيقة غير موجودة');
            return;
        }
    }
    
    // بناء الحقول
    let fieldsHtml = '';
    for (const field of fields) {
        const value = editData ? (editData[field.name] || '') : (field.default || '');
        
        // 🌟 إخفاء/إظهار ديناميكي
        let showCondition = '';
        if (field.showIf) {
            const condField = field.showIf.field;
            const condVal = field.showIf.value;
            showCondition = `data-showif-field="${condField}" data-showif-value="${condVal}"`;
        }
        
        let inputHtml = '';
        switch (field.type) {
            case 'textarea':
                inputHtml = `<textarea id="af-${field.name}" rows="${field.rows || 3}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; font-family:inherit; resize:vertical;">${_afEsc(value)}</textarea>`;
                break;
            case 'number':
                inputHtml = `<input type="number" id="af-${field.name}" value="${_afEsc(value)}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.max !== undefined ? `max="${field.max}"` : ''} ${field.step ? `step="${field.step}"` : ''} style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">`;
                break;
            case 'date':
                inputHtml = `<input type="date" id="af-${field.name}" value="${_afEsc(value)}" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">`;
                break;
            case 'datetime':
                inputHtml = `<input type="datetime-local" id="af-${field.name}" value="${_afEsc(value)}" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">`;
                break;
            case 'select':
                const opts = (field.options || []).map(o => {
                    const v = typeof o === 'string' ? o : o.value;
                    const l = typeof o === 'string' ? o : o.label;
                    return `<option value="${_afEsc(v)}" ${value === v ? 'selected' : ''}>${_afEsc(l)}</option>`;
                }).join('');
                inputHtml = `<select id="af-${field.name}" ${field.onchange ? `onchange="${field.onchange}"` : ''} style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; background:white;">${opts}</select>`;
                break;
            case 'tel':
                inputHtml = `<input type="tel" id="af-${field.name}" value="${_afEsc(value)}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; direction:ltr; text-align:right;">`;
                break;
            case 'checkbox':
                inputHtml = `<label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" id="af-${field.name}" ${value ? 'checked' : ''}><span>${field.checkboxLabel || ''}</span></label>`;
                break;
            case 'image':
                const _imgVal = value || '';
                window['_afImageTemp_' + field.name] = _imgVal;
                inputHtml = `
                    <div style="border:2px dashed #ddd; border-radius:10px; padding:10px; background:#f8f9fa;">
                        <div id="af-img-preview-${field.name}" style="width:100%; height:140px; border-radius:8px; background:${_imgVal ? "url('" + _imgVal + "') center/cover" : '#ecf0f1'}; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px; margin-bottom:8px;">${_imgVal ? '' : '🖼️ لا توجد صورة'}</div>
                        <div style="display:flex; gap:8px;">
                            <button type="button" onclick="_afPickImage('${field.name}')" style="flex:1; padding:10px; background:linear-gradient(135deg,#3498db,#2980b9); color:white; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit;">📷 اختيار صورة</button>
                            <button type="button" onclick="_afClearImage('${field.name}')" style="padding:10px 14px; background:#e74c3c; color:white; border:none; border-radius:8px; font-size:12px; cursor:pointer; font-family:inherit;">🗑️</button>
                        </div>
                        <input type="file" id="af-img-input-${field.name}" accept="image/*" style="display:none;" onchange="_afImageFile(event, '${field.name}')">
                        ${field.hint ? `<div style="font-size:10px; color:#888; text-align:center; margin-top:6px;">${field.hint}</div>` : ''}
                    </div>`;
                break;
            default:
                inputHtml = `<input type="text" id="af-${field.name}" value="${_afEsc(value)}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ''} ${field.maxlength ? `maxlength="${field.maxlength}"` : ''} style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">`;
        }
        
        const required = field.required ? '<span style="color:#e74c3c;">*</span>' : '';
        fieldsHtml += `
            <div class="af-field" ${showCondition} style="margin-bottom:12px;">
                <label style="display:block; font-size:13px; color:#555; margin-bottom:6px; font-weight:600;">
                    ${field.icon || ''} ${field.label} ${required}
                </label>
                ${inputHtml}
                ${field.hint ? `<div style="font-size:11px; color:#999; margin-top:3px;">${field.hint}</div>` : ''}
            </div>
        `;
    }
    
    // Header — رقم الوثيقة
    const headerHtml = !editData && pageConfig.autoNumber ? `
        <div style="background:#e8f5e9; padding:10px 14px; border-radius:8px; margin-bottom:15px; border-right:3px solid #27ae60;">
            <div style="font-size:11px; color:#666;">📄 رقم الوثيقة</div>
            <div id="af-number-preview" style="font-size:16px; font-weight:bold; color:#27ae60; margin-top:3px;">⏳ جاري التوليد...</div>
        </div>
    ` : (editData ? `
        <div style="background:#fff3cd; padding:10px 14px; border-radius:8px; margin-bottom:15px; border-right:3px solid #f39c12;">
            <div style="font-size:11px; color:#666;">✏️ تعديل الوثيقة</div>
            <div style="font-size:14px; font-weight:bold; color:#856404; margin-top:3px;">${_afEsc(editData.number || editData.id.substring(0, 8))}</div>
        </div>
    ` : '');
    
    // Modal
    const modal = document.createElement('div');
    modal.id = 'activityFormModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position:fixed; top:0; left:0; right:0; bottom:0;
        background:rgba(0,0,0,0.55); z-index:99999;
        display:flex; align-items:flex-start; justify-content:center;
        padding:20px; overflow-y:auto;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="background:white; border-radius:14px; padding:20px; max-width:520px; width:100%; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                <h3 style="margin:0; font-size:17px; color:#2c3e50;">
                    ${editData ? '✏️ تعديل' : '➕ ' + pageConfig.title}
                </h3>
                <button onclick="activityCloseForm()" style="background:#e74c3c; color:white; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:16px;">✕</button>
            </div>
            
            ${headerHtml}
            
            <div id="af-fields">${fieldsHtml}</div>
            
            ${pageConfig.formExtra || ''}
            
            <div style="display:flex; gap:8px; margin-top:15px;">
                <button onclick="activitySaveForm('${activityId}', '${pageId}', '${docId || ''}')" 
                    style="flex:2; padding:14px; background:linear-gradient(135deg, #27ae60, #229954); color:white; border:none; border-radius:10px; cursor:pointer; font-size:15px; font-weight:bold;">
                    💾 حفظ
                </button>
                <button onclick="activityCloseForm()" 
                    style="flex:1; padding:14px; background:#95a5a6; color:white; border:none; border-radius:10px; cursor:pointer; font-size:15px;">
                    إلغاء
                </button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => { if (e.target === modal) activityCloseForm(); };
    document.body.appendChild(modal);
    
    // 🎯 تشغيل onLoad
    setTimeout(async () => {
        if (pageConfig.autoNumber && !editData) {
            try {
                const num = await activityGenerateNumber(activityId, pageId, pageConfig.numberPrefix || 'DOC');
                const numEl = document.getElementById('af-number-preview');
                if (numEl) numEl.textContent = num;
                window._afCurrentNumber = num;
            } catch(e) {
                console.warn('[af] number:', e.message);
            }
        }
        
        // تشغيل onLoad لأي حقل
        if (typeof pageConfig.onFormOpen === 'function') {
            pageConfig.onFormOpen(editData);
        }
        
        // تحديث الحقول الشرطية
        _afUpdateConditionalFields(fields);
    }, 100);
    
    console.log('📝 [activity] form opened:', activityId, pageId, docId || 'new');
}

// ═══════════════════════════════════════════════════════════
//  2. CLOSE FORM
// ═══════════════════════════════════════════════════════════
function activityCloseForm() {
    const modal = document.getElementById('activityFormModal');
    if (modal) modal.remove();
    window._afCurrentNumber = null;
}

// ═══════════════════════════════════════════════════════════
//  3. SAVE FORM — حفظ
// ═══════════════════════════════════════════════════════════
async function activitySaveForm(activityId, pageId, docId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const { pageConfig } = entry;
    const fields = pageConfig.fields || [];
    
    // جمع القيم
    const data = {};
    for (const field of fields) {
        const el = document.getElementById(`af-${field.name}`);
        
        // 🖼️ معالجة خاصة للصورة (لا يوجد input بـ id)
        if (field.type === 'image') {
            data[field.name] = window['_afImageTemp_' + field.name] || '';
            continue;
        }
        
        if (!el) continue;
        
        let value;
        if (field.type === 'number') {
            value = parseFloat(el.value) || 0;
        } else if (field.type === 'checkbox') {
            value = el.checked;
        } else {
            value = el.value.trim();
        }
        
        // التحقق
        if (field.required && !value) {
            alert(`⚠️ الحقل "${field.label}" مطلوب`);
            el.focus();
            return;
        }
        
        data[field.name] = value;
    }
    
    // رقم تلقائي (للجديد فقط)
    if (!docId && pageConfig.autoNumber) {
        data.number = window._afCurrentNumber || await activityGenerateNumber(activityId, pageId, pageConfig.numberPrefix || 'DOC');
    }
    
    // 🎯 معالج مخصص
    if (typeof pageConfig.beforeSave === 'function') {
        const modified = await pageConfig.beforeSave(data, docId);
        if (modified === false) return; // رفض الحفظ
        if (modified && typeof modified === 'object') Object.assign(data, modified);
    }
    
    // حفظ
    let result;
    if (docId) {
        result = await activityUpdate(activityId, pageId, docId, data);
    } else {
        result = await activityAdd(activityId, pageId, data);
    }
    
    if (!result) {
        alert('❌ فشل الحفظ');
        return;
    }
    
    // 🎯 معالج بعد الحفظ
    if (typeof pageConfig.afterSave === 'function') {
        try {
            await pageConfig.afterSave(data, result, docId);
        } catch(e) {
            console.warn('[af] afterSave:', e.message);
        }
    }
    
    // إغلاق + تحديث
    activityCloseForm();
    await activityLoadList(activityId, pageId);
    
    // Toast
    if (typeof showSuccessToast === 'function') {
        showSuccessToast({
            title: docId ? '✅ تم التعديل' : '✅ تم الحفظ',
            details: [
                { icon: '📄', label: 'الرقم', value: data.number || '-' }
            ],
            duration: 4000
        });
    }
}

// ═══════════════════════════════════════════════════════════
//  4. RENDER LIST — عرض القائمة
// ═══════════════════════════════════════════════════════════
function renderActivityList(activity, pageConfig, items) {
    const listEl = document.getElementById(`activityList-${pageConfig.id}`);
    if (!listEl) return;
    
    if (items.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:#999;">
                <div style="font-size:48px; margin-bottom:10px;">${pageConfig.emptyIcon || '📭'}</div>
                <div>لا توجد وثائق بعد</div>
            </div>
        `;
        return;
    }
    
    // نستخدم itemRenderer إذا وُجد
    if (typeof pageConfig.itemRenderer === 'function') {
        listEl.innerHTML = items.map(item => pageConfig.itemRenderer(item, activity, pageConfig)).join('');
        return;
    }
    
    // عرض افتراضي
    const primaryField = pageConfig.primaryField || (pageConfig.fields[0]?.name);
    const secondaryField = pageConfig.secondaryField || (pageConfig.fields[1]?.name);
    const amountField = pageConfig.amountField;
    
    listEl.innerHTML = items.map(item => {
        const primary = item[primaryField] || '—';
        const secondary = item[secondaryField] || '';
        const amount = amountField ? item[amountField] : null;
        
        return `
            <div style="padding:12px 14px; border-bottom:1px solid #f0f0f0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; color:#2c3e50; font-size:14px; margin-bottom:4px;">
                            ${_afEsc(item.number || primary)}
                        </div>
                        <div style="font-size:12px; color:#666;">${_afEsc(secondary)}</div>
                        <div style="font-size:11px; color:#999; margin-top:4px;">
                            📅 ${_afDate(item.createdAt)}
                        </div>
                    </div>
                    ${amount !== null ? `<div style="font-weight:bold; color:#27ae60; font-size:14px;">${_afFmt(amount)}</div>` : ''}
                </div>
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <button onclick="activityViewItem('${activity.id}', '${pageConfig.id}', '${item.id}')" 
                        style="flex:1; padding:7px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">👁️ عرض</button>
                    <button onclick="activityOpenForm('${activity.id}', '${pageConfig.id}', '${item.id}')" 
                        style="flex:1; padding:7px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">✏️ تعديل</button>
                    <button onclick="activityConfirmDelete('${activity.id}', '${pageConfig.id}', '${item.id}')" 
                        style="flex:1; padding:7px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">🗑️ حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
//  5. VIEW ITEM — عرض تفاصيل
// ═══════════════════════════════════════════════════════════
async function activityViewItem(activityId, pageId, docId) {
    const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
    if (!entry) return;
    
    const all = _activityCache.getAll(pageId);
    const item = all.find(x => x.id === docId);
    if (!item) return;
    
    // مخصص؟
    if (typeof entry.pageConfig.viewRenderer === 'function') {
        entry.pageConfig.viewRenderer(item, entry.activity, entry.pageConfig);
        return;
    }
    
    // افتراضي
    const rows = (entry.pageConfig.fields || []).map(f => {
        const val = item[f.name];
        if (!val && val !== 0) return '';
        return `
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #eee;">
                <span style="color:#666; font-size:13px;">${f.icon || ''} ${f.label}:</span>
                <span style="font-weight:600; font-size:13px; color:#2c3e50;">${_afEsc(val)}</span>
            </div>
        `;
    }).join('');
    
    const modal = document.createElement('div');
    modal.id = 'activityViewModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.55); z-index:99999; display:flex; align-items:flex-start; justify-content:center; padding:20px; overflow-y:auto;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background:white; border-radius:14px; padding:20px; max-width:520px; width:100%; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                <h3 style="margin:0; font-size:17px;">📄 ${_afEsc(item.number || 'وثيقة')}</h3>
                <button onclick="document.getElementById('activityViewModal').remove()" style="background:#e74c3c; color:white; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:16px;">✕</button>
            </div>
            ${rows}
            <div style="display:flex; gap:6px; margin-top:15px;">
                <button onclick="activityPrintItem('${activityId}', '${pageId}', '${docId}')" 
                    style="flex:1; padding:10px; background:#34495e; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">🖨️ طباعة</button>
                <button onclick="activityWhatsAppItem('${activityId}', '${pageId}', '${docId}')" 
                    style="flex:1; padding:10px; background:#25D366; color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px;">💬 واتساب</button>
            </div>
        </div>
    `;
    
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════════
//  6. CONFIRM DELETE
// ═══════════════════════════════════════════════════════════
async function activityConfirmDelete(activityId, pageId, docId) {
    const confirmed = confirm('🗑️ هل تريد حذف هذه الوثيقة؟');
    if (!confirmed) return;
    
    // 🎯 احفظ نسخة قبل الحذف (للـ afterDelete hook)
    const item = _activityCache.getAll(pageId).find(x => x.id === docId);

    const ok = await activityDelete(activityId, pageId, docId);
    if (ok) {
        // 🎯 بعد الحذف — شغّل hook مخصص
        const entry = ACTIVITY_REGISTRY.getPage(`activity-${activityId}-${pageId}`);
        if (entry && typeof entry.pageConfig.afterDelete === 'function') {
            try {
                await entry.pageConfig.afterDelete(item, activityId, pageId);
            } catch(e) {
                console.warn('[activity] afterDelete:', e.message);
            }
        }

        await activityLoadList(activityId, pageId);
        if (typeof showToast === 'function') showToast('🗑️ تم الحذف', 'info');
    } else {
        alert('❌ فشل الحذف');
    }
}

// ═══════════════════════════════════════════════════════════
//  7. CONDITIONAL FIELDS — الحقول الشرطية
// ═══════════════════════════════════════════════════════════
function _afUpdateConditionalFields(fields) {
    fields.forEach(field => {
        if (!field.showIf) return;
        const wrapper = document.querySelector(`.af-field[data-showif-field="${field.showIf.field}"]`);
        if (!wrapper) return;
        
        const sourceEl = document.getElementById(`af-${field.showIf.field}`);
        if (!sourceEl) return;
        
        const checkMatch = () => {
            const currentVal = sourceEl.value;
            const shouldShow = currentVal === field.showIf.value;
            wrapper.style.display = shouldShow ? '' : 'none';
        };
        
        sourceEl.addEventListener('change', checkMatch);
        sourceEl.addEventListener('input', checkMatch);
        checkMatch();
    });
}

// ═══════════════════════════════════════════════════════════
//  8. HELPERS
// ═══════════════════════════════════════════════════════════
function _afEsc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _afDate(ts) {
    if (!ts) return '—';
    try {
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return typeof formatDate === 'function' ? formatDate(d) : d.toLocaleDateString('ar-SY');
    } catch(e) { return '—'; }
}

function _afFmt(n) {
    return typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n).toLocaleString('ar-SY') + ' ل.س';
}

// ══════════════════════════════════════════════════════════════
//  🖼️ IMAGE HELPERS — اختيار + ضغط + عرض
// ══════════════════════════════════════════════════════════════

window._afPickImage = function(fieldName) {
    const input = document.getElementById('af-img-input-' + fieldName);
    if (input) input.click();
};

window._afImageFile = async function(evt, fieldName) {
    const file = evt?.target?.files?.[0];
    if (!file) return;
    try {
        const dataUrl = await _afCompressImage(file, 300);
        window['_afImageTemp_' + fieldName] = dataUrl;
        _afUpdateImagePreview(fieldName);
    } catch(e) {
        alert('❌ ' + (e.message || e));
    } finally {
        evt.target.value = '';
    }
};

window._afClearImage = function(fieldName) {
    if (!window['_afImageTemp_' + fieldName]) return;
    if (!confirm('🗑️ حذف الصورة؟')) return;
    window['_afImageTemp_' + fieldName] = '';
    _afUpdateImagePreview(fieldName);
};

function _afUpdateImagePreview(fieldName) {
    const preview = document.getElementById('af-img-preview-' + fieldName);
    if (!preview) return;
    const img = window['_afImageTemp_' + fieldName];
    if (img) {
        preview.style.background = "url('" + img + "') center/cover";
        preview.textContent = '';
    } else {
        preview.style.background = '#ecf0f1';
        preview.textContent = '🖼️ لا توجد صورة';
    }
}

async function _afCompressImage(file, maxSize) {
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
    const MAX = maxSize || 250;
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

// ═══════════════════════════════════════════════════════════
//  9. EXPORT
// ═══════════════════════════════════════════════════════════
window.activityOpenForm = activityOpenForm;
window.activityCloseForm = activityCloseForm;
window.activitySaveForm = activitySaveForm;
window.activityViewItem = activityViewItem;
window.activityConfirmDelete = activityConfirmDelete;
window.renderActivityList = renderActivityList;

console.log('🎨 [activity-ui] v1.0.0 محمّل');
