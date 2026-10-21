// ==================== مسحوبات المالك (Owner Withdrawals) ====================
// 💼 سجل المسحوبات الشخصية من الصناديق — لا تُحسب كمصروفات تشغيلية

const OW_CATEGORIES = {
    personal:  '👤 شخصي',
    salary:    '💼 راتب المالك',
    necessity: '🛒 ضروريات المنزل',
    emergency: '🚨 طوارئ',
    other:     '📦 أخرى'
};

// ═══════════ صفحة مسحوبات المالك ═══════════
function loadOwnerWithdrawalsPage() {
    // تعبئة قائمة الصناديق
    setTimeout(() => {
        const sel = document.getElementById('owPaymentBox');
        if (sel && typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) {
            let html = '<option value="">— اختر صندوقاً —</option>';
            _pbCache.forEach(b => {
                const bal = parseFloat(b.balance) || 0;
                const fmt = typeof _pbFmt === 'function' ? _pbFmt(bal) : bal.toLocaleString('ar-SY');
                html += `<option value="${b.id}">${b.icon || '💰'} ${b.name} — ${fmt}</option>`;
            });
            sel.innerHTML = html;
        }
    }, 100);

    // التاريخ الافتراضي = اليوم
    const dEl = document.getElementById('owDate');
    if (dEl && !dEl.value) {
        dEl.value = new Date().toISOString().slice(0, 10);
    }

    updateOwnerWithdrawalsTable();
}

// ═══════════ إضافة سحب جديد ═══════════
async function addOwnerWithdrawal() {
    const date = document.getElementById('owDate').value;
    const amountValue = parseFloat(document.getElementById('owAmount').value) || 0;
    const amountCurrency = document.getElementById('owAmountCurrency').value;
    const desc = (document.getElementById('owDesc').value || '').trim();
    const category = document.getElementById('owCategory').value;
    const _boxId = document.getElementById('owPaymentBox').value || '';

    // ✔ التحقق
    if (!date || amountValue <= 0) {
        alert('⚠️ الرجاء إدخال تاريخ ومبلغ صحيح');
        return;
    }
    if (!desc) {
        alert('⚠️ الرجاء إدخال بيان السحب');
        return;
    }
    if (!_boxId) {
        alert('⚠️ يجب اختيار الصندوق');
        return;
    }

    // تحويل للعملة الأساسية
    const amountBase = typeof convertToBase === 'function'
        ? convertToBase(amountValue, amountCurrency)
        : amountValue;

    // 🚫 فحص الرصيد قبل الإضافة
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
            `💰 المتاح: ${_bal.toLocaleString('ar-SY')} ل.س\n` +
            `💵 المطلوب: ${amountBase.toLocaleString('ar-SY')} ل.س\n\n` +
            `💡 يجب إعادة تعبئة الصندوق أو اختيار صندوق آخر.`
        );
        return;
    }

    // بناء السجل
    const withdrawal = {
        id: 'ow_' + Date.now(),
        date,
        amount: amountBase,
        currency: amountCurrency,
        desc,
        category,
        paymentBox: _boxId,
        boxName: _box.name || '',
        createdAt: new Date().toISOString()
    };

    // 💳 خصم من الصندوق
    try {
        if (typeof pbAdjustBalance === 'function') {
            await pbAdjustBalance(_boxId, amountBase, 'subtract', {
                reason: 'owner_withdrawal',
                reasonLabel: 'سحب مالك: ' + desc + ' (' + (OW_CATEGORIES[category] || category) + ')',
                relatedId: withdrawal.id
            });
        }
    } catch (e) {
        console.warn('[ow] pbAdjust:', e.message);
        alert('🚫 ' + e.message);
        return;
    }

    // حفظ في المصفوفة
    if (typeof ownerWithdrawals !== 'undefined' && Array.isArray(ownerWithdrawals)) {
        ownerWithdrawals.push(withdrawal);
    } else {
        window.ownerWithdrawals = [withdrawal];
    }

    // تفريغ الحقول (نبقي التاريخ والفئة)
    document.getElementById('owAmount').value = '';
    document.getElementById('owDesc').value = '';
    const _eb = document.getElementById('owPaymentBox');
    if (_eb) _eb.value = '';

    updateOwnerWithdrawalsTable();
    await saveAllData();

    // 🎨 Toast نجاح
    if (typeof showSuccessToast === 'function') {
        const _cur = amountCurrency === 'USD' ? '$' : 'ل.س';
        showSuccessToast({
            title: 'تم تسجيل السحب بنجاح!',
            details: [
                { icon: '💰', label: 'المبلغ', value: amountValue + ' ' + _cur },
                { icon: '🏷️', label: 'الفئة', value: OW_CATEGORIES[category] || category },
                { icon: '📝', label: 'البيان', value: desc.substring(0, 30) },
                { icon: '💳', label: 'الصندوق', value: _box.name }
            ],
            actions: [
                {
                    label: 'عرض السجل',
                    icon: '📄',
                    style: 'light',
                    onClick: () => { if (typeof openPage === 'function') openPage('owner-withdrawals'); }
                }
            ],
            duration: 6000
        });
    } else {
        alert('✅ تم تسجيل السحب بنجاح');
    }
}

// ═══════════ حذف سحب ═══════════
async function deleteOwnerWithdrawal(index) {
    if (typeof requirePassword === 'function') {
        requirePassword(async () => {
            await _doDeleteOwnerWithdrawal(index);
        });
    } else {
        if (!confirm('هل تريد حذف هذا السحب؟')) return;
        await _doDeleteOwnerWithdrawal(index);
    }
}

async function _doDeleteOwnerWithdrawal(index) {
    if (typeof ownerWithdrawals === 'undefined' || !Array.isArray(ownerWithdrawals)) return;
    const w = ownerWithdrawals[index];
    if (!w) return;

    // ↩️ إعادة المبلغ للصندوق (عكس العملية)
    if (w.paymentBox && w.amount > 0 && typeof pbAdjustBalance === 'function') {
        try {
            await pbAdjustBalance(w.paymentBox, w.amount, 'add', {
                reason: 'owner_withdrawal_reversed',
                reasonLabel: 'إلغاء سحب مالك: ' + (w.desc || ''),
                relatedId: w.id
            });
        } catch (e) {
            console.warn('[ow] reversal failed:', e.message);
            // نكمل الحذف حتى لو فشل الإرجاع (الصندوق قد يكون محذوفاً)
        }
    }

    ownerWithdrawals.splice(index, 1);
    updateOwnerWithdrawalsTable();
    await saveAllData();
    if (typeof showToast === 'function') showToast('🗑️ تم حذف السحب', 'info');
}

// ═══════════ عرض الجدول + الإجماليات ═══════════
function updateOwnerWithdrawalsTable() {
    const table = document.getElementById('owTable');
    if (!table) return;

    const list = (typeof ownerWithdrawals !== 'undefined' && Array.isArray(ownerWithdrawals))
        ? ownerWithdrawals
        : [];

    // 💰 الإجماليات (هذا الشهر + الكل)
    const now = new Date();
    const monthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
    let totalAll = 0, totalMonth = 0;
    list.forEach(w => {
        const amt = parseFloat(w.amount) || 0;
        totalAll += amt;
        if ((w.date || '').startsWith(monthPrefix)) totalMonth += amt;
    });

    const fmt = (n) => typeof formatCurrency === 'function'
        ? formatCurrency(n)
        : n.toLocaleString('ar-SY') + ' ل.س';

    const totalEl = document.getElementById('owTotal');
    const countEl = document.getElementById('owCount');
    if (totalEl) {
        totalEl.innerHTML = `${fmt(totalMonth)} <span style="color:#888; font-size:12px;">(هذا الشهر) • ${fmt(totalAll)} (الكل)</span>`;
    }
    if (countEl) countEl.textContent = list.length;

    // 📋 عرض
    if (list.length === 0) {
        if (window.innerWidth <= 768) {
            table.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد مسحوبات بعد</div>';
        } else {
            table.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">لا توجد مسحوبات بعد</td></tr>';
        }
        return;
    }

    // ترتيب من الأحدث للأقدم
    const sorted = list.map((w, i) => ({ ...w, _idx: i }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (window.innerWidth <= 768) {
        // 📱 بطاقات
        let html = '';
        sorted.forEach(w => {
            const catLabel = OW_CATEGORIES[w.category] || w.category || '—';
            html += `
            <div class="expense-card" style="border-right:3px solid #e67e22;">
                <div><span>التاريخ:</span> ${typeof formatDate === 'function' ? formatDate(w.date) : w.date}</div>
                <div><span>المبلغ:</span> <b style="color:#e67e22;">${fmt(w.amount)}</b></div>
                <div><span>البيان:</span> ${_owEsc(w.desc || '')}</div>
                <div><span>الفئة:</span> ${catLabel}</div>
                <div><span>الصندوق:</span> ${_owEsc(w.boxName || '—')}</div>
                <div class="card-actions">
                    <button class="btn-delete" onclick="deleteOwnerWithdrawal(${w._idx})">حذف</button>
                </div>
            </div>`;
        });
        table.innerHTML = html;
        table.classList.add('cards-mode');
    } else {
        // 🖥️ جدول
        let html = '<tr><th>التاريخ</th><th>المبلغ</th><th>البيان</th><th>الفئة</th><th>الصندوق</th><th>حذف</th></tr>';
        sorted.forEach(w => {
            const catLabel = OW_CATEGORIES[w.category] || w.category || '—';
            html += `<tr>
                <td>${typeof formatDate === 'function' ? formatDate(w.date) : w.date}</td>
                <td style="color:#e67e22; font-weight:600;">${fmt(w.amount)}</td>
                <td>${_owEsc(w.desc || '')}</td>
                <td>${catLabel}</td>
                <td>${_owEsc(w.boxName || '—')}</td>
                <td><button class="btn-delete" onclick="deleteOwnerWithdrawal(${w._idx})">حذف</button></td>
            </tr>`;
        });
        table.innerHTML = html;
        table.classList.remove('cards-mode');
    }
}

// ═══════════ أدوات مساعدة ═══════════
function _owEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// تصدير للنافذة (للأزرار inline)
window.loadOwnerWithdrawalsPage = loadOwnerWithdrawalsPage;
window.addOwnerWithdrawal = addOwnerWithdrawal;
window.deleteOwnerWithdrawal = deleteOwnerWithdrawal;
window.updateOwnerWithdrawalsTable = updateOwnerWithdrawalsTable;

console.log('💼 [ow] owner-withdrawals.js محمّل');
