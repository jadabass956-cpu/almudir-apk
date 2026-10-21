// ============================================================
//  📦 DISPOSALS — إتلاف المواد (تالف/منتهي/مفقود/مسروق)
// ============================================================

const DSP_REASONS = {
    expired: '⏰ انتهاء صلاحية',
    damaged: '💔 تلف/كسر',
    lost:    '🔍 فقد',
    stolen:  '🚨 سرقة',
    other:   '📦 أخرى'
};

// ---------- 📦 تعبئة قائمة المستودعات ----------
function _dspPopulateWarehouse() {
    const wrap = document.getElementById('dspWarehouseWrap');
    const sel = document.getElementById('dspWarehouse');
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

    console.log(`📦 [dsp-wh] عُبّئ ${list.length} مستودعات`);
}

// ---------- فتح الصفحة ----------
function loadDisposalsPage() {
    // تعبئة المواد
    const matSel = document.getElementById('dspMaterial');
    if (matSel && typeof materials !== 'undefined' && Array.isArray(materials)) {
        let html = '<option value="">— اختر مادة —</option>';
        const sorted = [...materials].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        sorted.forEach(m => {
            const stk = m.stock || 0;
            const dis = stk <= 0 ? 'disabled' : '';
            const label = stk <= 0 ? ' (نفدت)' : ` — ${stk} ${m.unit || ''}`;
            html += `<option value="${m.id}" ${dis}>${_dspEsc(m.name)}${label}</option>`;
        });
        matSel.innerHTML = html;
    }

    // تعبئة الصناديق
    setTimeout(() => {
        const boxSel = document.getElementById('dspBox');
        if (boxSel && typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) {
            let html = '<option value="">— بدون تسجيل مالي —</option>';
            _pbCache.forEach(b => {
                const bal = parseFloat(b.balance) || 0;
                const fmt = typeof _pbFmt === 'function' ? _pbFmt(bal) : bal.toLocaleString('ar-SY');
                html += `<option value="${b.id}">${b.icon || '💰'} ${b.name} — ${fmt}</option>`;
            });
            boxSel.innerHTML = html;
        }
    }, 100);

    // التاريخ الافتراضي
    const dEl = document.getElementById('dspDate');
    if (dEl && !dEl.value) dEl.value = new Date().toISOString().slice(0, 10);

    // إخفاء المعاينة
    const prev = document.getElementById('dspLossPreview');
    if (prev) prev.style.display = 'none';

    // 📦 تعبئة المستودعات
    setTimeout(() => {
        if (typeof _dspPopulateWarehouse === 'function') _dspPopulateWarehouse();
    }, 150);

    updateDisposalsTable();
}

// ---------- عند اختيار مادة ----------
function dspOnMaterialChange() {
    const id = parseInt(document.getElementById('dspMaterial').value);
    const info = document.getElementById('dspMaterialInfo');
    if (!id || !info) { if (info) info.style.display = 'none'; return; }

    const m = materials.find(x => x.id === id);
    if (!m) { info.style.display = 'none'; return; }

    const cost = parseFloat(m.costSYP || m.cost || 0);
    const stk = m.stock || 0;
    info.style.display = 'block';
    info.innerHTML =
        `📊 المخزون الحالي: <b>${stk} ${m.unit || ''}</b> • ` +
        `💰 التكلفة: <b>${cost.toLocaleString('ar-SY')} ل.س</b>` +
        (m.expiryDate ? ` • ⏰ انتهاء: <b>${m.expiryDate}</b>` : '') +
        (m.batchNumber ? ` • 🏷️ دفعة: <b>${m.batchNumber}</b>` : '');

    // اقتراح الكمية كاملة افتراضياً
    const qtyEl = document.getElementById('dspQty');
    if (qtyEl && !qtyEl.value) qtyEl.value = stk;

    dspUpdateLoss();
}

// ---------- تحديث معاينة الخسارة ----------
function dspUpdateLoss() {
    const id = parseInt(document.getElementById('dspMaterial').value);
    const qty = parseFloat(document.getElementById('dspQty').value) || 0;
    const prev = document.getElementById('dspLossPreview');
    if (!prev) return;

    if (!id || qty <= 0) { prev.style.display = 'none'; return; }

    const m = materials.find(x => x.id === id);
    if (!m) { prev.style.display = 'none'; return; }

    const cost = parseFloat(m.costSYP || m.cost || 0);
    const loss = cost * qty;

    if (loss <= 0) {
        prev.style.display = 'block';
        prev.innerHTML = '⚠️ تكلفة المادة غير محددة — لن تُحسب خسارة مالية';
        return;
    }

    prev.style.display = 'block';
    prev.innerHTML = `💰 الخسارة المتوقعة: <span style="color:#c0392b;">${loss.toLocaleString('ar-SY')} ل.س</span>`;
}

// ---------- حفظ الإتلاف ----------
async function addDisposal() {
    const date = document.getElementById('dspDate').value;
    const matId = parseInt(document.getElementById('dspMaterial').value);
    const qty = parseFloat(document.getElementById('dspQty').value) || 0;
    const reason = document.getElementById('dspReason').value;
    const notes = (document.getElementById('dspNotes').value || '').trim();
    const boxId = document.getElementById('dspBox').value || '';

    // ✔ التحقق
    if (!date) { alert('⚠️ أدخل التاريخ'); return; }
    if (!matId) { alert('⚠️ اختر المادة'); return; }
    if (qty <= 0) { alert('⚠️ أدخل كمية صحيحة'); return; }

    const m = materials.find(x => x.id === matId);
    if (!m) { alert('⚠️ المادة غير موجودة'); return; }

    const stock = parseFloat(m.stock) || 0;
    if (qty > stock) {
        alert(`⚠️ الكمية المطلوبة (${qty}) أكبر من المخزون (${stock} ${m.unit || ''})`);
        return;
    }

    const cost = parseFloat(m.costSYP || m.cost || 0);
    const totalLoss = cost * qty;

    // تأكيد
    const _lossTxt = totalLoss > 0 ? `\n💸 الخسارة: ${totalLoss.toLocaleString('ar-SY')} ل.س` : '';
    const _boxTxt = boxId ? `\n💳 سيُخصم من الصندوق` : `\n💡 لن يُسجَّل مالياً`;
    if (!confirm(`🗑️ تسجيل إتلاف؟\n\n📦 ${m.name}\n🔢 الكمية: ${qty} ${m.unit || ''}\n🏷️ السبب: ${DSP_REASONS[reason]}${_lossTxt}${_boxTxt}`)) {
        return;
    }

    // بناء السجل
    const disposal = {
        id: 'dsp_' + Date.now(),
        date,
        materialId: m.id,
        materialName: m.name,
        unit: m.unit || '',
        qty,
        costBase: cost,
        totalLoss,
        reason,
        notes,
        batchNumber: m.batchNumber || '',
        boxId,
        boxName: boxId && typeof _getBoxName === 'function' ? _getBoxName(boxId) : '',
        warehouseId: _dspWhId,
        createdAt: new Date().toISOString()
    };

    // 📦 المستودع المستهدف
    const _dspWhId = (typeof getDefaultWarehouseId === 'function')
        ? (document.getElementById('dspWarehouse')?.value || getDefaultWarehouseId())
        : '';

    // 1) خصم من المخزون (بالمستودع)
    if (typeof adjustStock === 'function') {
        try {
            adjustStock(m.id, qty, 'subtract', _dspWhId, {
                reason: 'disposal',
                reasonLabel: `إتلاف: ${m.name} × ${qty}`
            });
        } catch (e) {
            alert('🚫 ' + e.message);
            return;
        }
    } else {
        m.stock = stock - qty;
    }

    // 2) خصم من الصندوق (إن اختير)
    if (boxId && totalLoss > 0 && typeof pbAdjustBalance === 'function') {
        try {
            await pbAdjustBalance(boxId, totalLoss, 'subtract', {
                reason: 'disposal',
                reasonLabel: `إتلاف: ${m.name} × ${qty} (${DSP_REASONS[reason]})`,
                relatedId: disposal.id
            });
        } catch (e) {
            // رجوع المخزون
            if (typeof adjustStock === 'function') {
                try { adjustStock(m.id, qty, 'add', _dspWhId, { reason: 'disposal_rollback' }); }
                catch(e2) { m.stock = stock; }
            } else {
                m.stock = stock;
            }
            console.warn('[dsp] pb failed:', e.message);
            alert('🚫 فشل الخصم من الصندوق:\n' + e.message + '\n\nتم إلغاء العملية.');
            return;
        }
    }

    // 3) حفظ في المصفوفة
    if (typeof disposals !== 'undefined' && Array.isArray(disposals)) {
        disposals.push(disposal);
    } else {
        window.disposals = [disposal];
    }

    // 4) تسجيل في Firestore (audit trail)
    _dspLogFirestore(m, disposal, 'dispose');

    // 5) حفظ
    if (typeof saveAllData === 'function') await saveAllData();
    if (typeof updateMaterialsTable === 'function') updateMaterialsTable();

    // تفريغ
    document.getElementById('dspQty').value = '';
    document.getElementById('dspNotes').value = '';
    document.getElementById('dspMaterial').value = '';
    document.getElementById('dspBox').value = '';
    document.getElementById('dspMaterialInfo').style.display = 'none';
    document.getElementById('dspLossPreview').style.display = 'none';

    updateDisposalsTable();

    // Toast
    if (typeof showSuccessToast === 'function') {
        const details = [
            { icon: '📦', label: 'المادة', value: m.name },
            { icon: '🔢', label: 'الكمية', value: qty + ' ' + (m.unit || '') },
            { icon: '🏷️', label: 'السبب', value: DSP_REASONS[reason] }
        ];
        if (totalLoss > 0) details.push({ icon: '💸', label: 'الخسارة', value: totalLoss.toLocaleString('ar-SY') + ' ل.س' });
        if (boxId) details.push({ icon: '💳', label: 'الصندوق', value: disposal.boxName || '' });

        showSuccessToast({
            title: 'تم تسجيل الإتلاف',
            details,
            actions: [
                { label: 'عرض السجل', icon: '📄', style: 'light',
                  onClick: () => { if (typeof openPage === 'function') openPage('disposals'); } }
            ],
            duration: 6000
        });
    } else {
        _dspToast('🗑️ تم تسجيل الإتلاف', 'success');
    }
}

// ---------- حذف إتلاف ----------
async function deleteDisposal(index) {
    if (typeof requirePassword === 'function') {
        requirePassword(async () => { await _doDeleteDisposal(index); });
    } else {
        if (!confirm('هل تريد حذف هذا السجل؟ سيُرجَع المخزون والمبلغ للصندوق.')) return;
        await _doDeleteDisposal(index);
    }
}

async function _doDeleteDisposal(index) {
    if (typeof disposals === 'undefined' || !Array.isArray(disposals)) return;
    const d = disposals[index];
    if (!d) return;

    // 1) إرجاع المخزون (لنفس المستودع)
    const m = materials.find(x => x.id === d.materialId);
    if (m) {
        const _whId = d.warehouseId || (typeof getDefaultWarehouseId === 'function' ? getDefaultWarehouseId() : '');
        if (typeof adjustStock === 'function') {
            try { adjustStock(m.id, d.qty, 'add', _whId, { reason: 'disposal_delete' }); }
            catch(e) { m.stock = (parseFloat(m.stock) || 0) + (parseFloat(d.qty) || 0); }
        } else {
            m.stock = (parseFloat(m.stock) || 0) + (parseFloat(d.qty) || 0);
        }
    }

    // 2) إرجاع المبلغ للصندوق
    if (d.boxId && d.totalLoss > 0 && typeof pbAdjustBalance === 'function') {
        try {
            await pbAdjustBalance(d.boxId, d.totalLoss, 'add', {
                reason: 'disposal_reversed',
                reasonLabel: `إلغاء إتلاف: ${d.materialName}`,
                relatedId: d.id
            });
        } catch (e) {
            console.warn('[dsp] reversal failed:', e.message);
        }
    }

    // 3) حذف السجل
    disposals.splice(index, 1);

    if (typeof saveAllData === 'function') await saveAllData();
    if (typeof updateMaterialsTable === 'function') updateMaterialsTable();
    updateDisposalsTable();

    _dspToast('🗑️ تم الحذف واسترجاع المخزون', 'info');
}

// ---------- عرض الجدول ----------
function updateDisposalsTable() {
    const table = document.getElementById('dspTable');
    if (!table) return;

    const list = (typeof disposals !== 'undefined' && Array.isArray(disposals)) ? disposals : [];

    // إجماليات
    const now = new Date();
    const monthPrefix = now.toISOString().slice(0, 7);
    let totalAll = 0, totalMonth = 0;
    list.forEach(d => {
        const loss = parseFloat(d.totalLoss) || 0;
        totalAll += loss;
        if ((d.date || '').startsWith(monthPrefix)) totalMonth += loss;
    });

    const fmt = (n) => typeof formatCurrency === 'function' ? formatCurrency(n) : n.toLocaleString('ar-SY') + ' ل.س';

    const totalEl = document.getElementById('dspTotal');
    const countEl = document.getElementById('dspCount');
    if (totalEl) totalEl.innerHTML = `${fmt(totalMonth)} <span style="color:#888; font-size:12px;">(هذا الشهر) • ${fmt(totalAll)} (الكل)</span>`;
    if (countEl) countEl.textContent = list.length;

    if (list.length === 0) {
        if (window.innerWidth <= 768) {
            table.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد إتلافات بعد</div>';
        } else {
            table.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">لا توجد إتلافات بعد</td></tr>';
        }
        return;
    }

    const sorted = list.map((d, i) => ({ ...d, _idx: i }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (window.innerWidth <= 768) {
        let html = '';
        sorted.forEach(d => {
            html += `
            <div class="expense-card" style="border-right:3px solid #c0392b;">
                <div><span>التاريخ:</span> ${typeof formatDate === 'function' ? formatDate(d.date) : d.date}</div>
                <div><span>المادة:</span> <b>${_dspEsc(d.materialName)}</b></div>
                <div><span>الكمية:</span> ${d.qty} ${_dspEsc(d.unit || '')}</div>
                <div><span>السبب:</span> ${DSP_REASONS[d.reason] || d.reason}</div>
                ${d.totalLoss > 0 ? `<div><span>الخسارة:</span> <b style="color:#c0392b;">${fmt(d.totalLoss)}</b></div>` : ''}
                <div class="card-actions">
                    <button class="btn-delete" onclick="deleteDisposal(${d._idx})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = html;
        table.classList.add('cards-mode');
    } else {
        let html = '<tr><th>التاريخ</th><th>المادة</th><th>الكمية</th><th>السبب</th><th>الخسارة</th><th>حذف</th></tr>';
        sorted.forEach(d => {
            html += `<tr>
                <td>${typeof formatDate === 'function' ? formatDate(d.date) : d.date}</td>
                <td>${_dspEsc(d.materialName)}</td>
                <td>${d.qty} ${_dspEsc(d.unit || '')}</td>
                <td>${DSP_REASONS[d.reason] || d.reason}</td>
                <td style="color:#c0392b; font-weight:600;">${d.totalLoss > 0 ? fmt(d.totalLoss) : '—'}</td>
                <td><button class="btn-delete" onclick="deleteDisposal(${d._idx})">حذف</button></td>
            </tr>`;
        });
        table.innerHTML = html;
        table.classList.remove('cards-mode');
    }
}

// ---------- سجل Firestore (audit trail) ----------
async function _dspLogFirestore(material, disposal, action) {
    try {
        const uid = auth.currentUser.uid;
        await db.collection('expiry_disposals').add({
            uid,
            userName: (typeof currentUser !== 'undefined' && currentUser ? currentUser.fullName : '') || '',
            businessName: (typeof currentUser !== 'undefined' && currentUser ? currentUser.businessName : '') || '',
            materialId: material.id,
            materialName: material.name,
            qty: disposal.qty,
            unit: disposal.unit,
            costBase: disposal.costBase,
            totalLoss: disposal.totalLoss,
            reason: disposal.reason,
            notes: disposal.notes,
            batch: disposal.batchNumber,
            boxId: disposal.boxId,
            action: action,
            performedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ [dsp] سُجّل في Firestore');
    } catch (e) {
        console.warn('[dsp] firestore log failed:', e.message);
    }
}

// ---------- أدوات ----------
function _dspEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _dspToast(msg, type) {
    if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' +
        (type === 'success' ? '#27ae60' : '#c0392b') + '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

// ---------- تصدير ----------
window.loadDisposalsPage = loadDisposalsPage;
window.addDisposal = addDisposal;
window.deleteDisposal = deleteDisposal;
window.updateDisposalsTable = updateDisposalsTable;
window.dspOnMaterialChange = dspOnMaterialChange;
window.dspUpdateLoss = dspUpdateLoss;

console.log('📦 [dsp] disposals.js محمّل');
