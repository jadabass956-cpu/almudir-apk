// ============================================================
//  💳 PAYMENT BOXES — صناديق الدفع
// ============================================================

let _pbCache = [];

// ---------- تحميل ----------
async function loadPaymentBoxes() {
    const list = document.getElementById('pbList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('users').doc(_getEffectiveUid())
            .collection('payment_boxes').get();
        _pbCache = [];
        snap.forEach(d => _pbCache.push({ id: d.id, ...d.data() }));
        _pbCache.sort((a, b) => (a.order || 99) - (b.order || 99));

        _pbRender();
        _pbUpdateTotal();
    } catch(e) {
        console.error('[pb]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:15px;">❌ ' + _pbEsc(e.message) + '</div>';
    }
}

function _pbRender() {
    const list = document.getElementById('pbList');
    if (!list) return;

    if (!_pbCache.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد صناديق بعد — أضف صندوقاً</div>';
        return;
    }

    let html = '';
    _pbCache.forEach(b => {
        const color = b.color || '#3498db';
        html += `
        <div style="background:white; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ${color};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:15px;">${_pbEsc(b.icon || '💰')} ${_pbEsc(b.name)}</div>
                    <div style="font-size:20px; font-weight:bold; color:${color}; margin-top:5px;">
                        ${_pbFmt(b.balance || 0)} <span style="font-size:12px;">${_pbEsc(b.currency || 'SYP')}</span>
                    </div>
                </div>
                <div style="display:flex; gap:4px; flex-direction:column;">
                    <button onclick="openBoxAnalysis('${b.id}')" style="padding:5px 10px; background:#8e44ad; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;" title="تحليل">📊</button>
                    <button onclick="openPbEditor('${b.id}')" style="padding:5px 10px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">✏️</button>
                    <button onclick="pbDeleteBox('${b.id}')" style="padding:5px 10px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:11px;">🗑️</button>
                </div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function _pbUpdateTotal() {
    const total = _pbCache.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);
    const el = document.getElementById('pbTotal');
    if (el) el.textContent = _pbFmt(total) + ' ل.س';

    const el2 = document.getElementById('pbCount');
    if (el2) el2.textContent = _pbCache.length;
}

// ---------- محرر ----------
function openPbEditor(id) {
    const b = id ? _pbCache.find(x => x.id === id) : null;

    document.getElementById('pbModalTitle').textContent = b ? '✏️ تعديل صندوق' : '➕ إضافة صندوق';
    document.getElementById('pbId').value = b ? b.id : '';
    document.getElementById('pbName').value = b ? (b.name || '') : '';
    document.getElementById('pbIcon').value = b ? (b.icon || '💰') : '💰';
    document.getElementById('pbColor').value = b ? (b.color || '#3498db') : '#3498db';
    document.getElementById('pbBalance').value = b ? (b.balance || 0) : 0;
    document.getElementById('pbCurrency').value = b ? (b.currency || 'SYP') : 'SYP';
    document.getElementById('pbOrder').value = b ? (b.order || 1) : (_pbCache.length + 1);

    document.getElementById('pbEditorModal').classList.add('show');
}

function closePbEditor() {
    document.getElementById('pbEditorModal').classList.remove('show');
}

async function savePbBox() {
    const id = document.getElementById('pbId').value;
    const name = document.getElementById('pbName').value.trim();
    if (!name) return alert('⚠️ أدخل اسم الصندوق');

    const data = {
        name: name,
        icon: document.getElementById('pbIcon').value.trim() || '💰',
        color: document.getElementById('pbColor').value || '#3498db',
        balance: parseFloat(document.getElementById('pbBalance').value) || 0,
        currency: document.getElementById('pbCurrency').value || 'SYP',
        order: parseInt(document.getElementById('pbOrder').value) || 1,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const ref = db.collection('users').doc(_getEffectiveUid()).collection('payment_boxes');
        if (id) {
            await ref.doc(id).update(data);
            _pbToast('✅ تم التعديل', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await ref.add(data);
            _pbToast('✅ تمت الإضافة', 'success');
        }
        closePbEditor();
        loadPaymentBoxes();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

async function pbDeleteBox(id) {
    const b = _pbCache.find(x => x.id === id);
    if (!b) return;

    if (!confirm(`🗑️ حذف صندوق "${b.name}"؟\n\nالرصيد الحالي: ${_pbFmt(b.balance || 0)} ${b.currency || 'SYP'}`)) return;

    try {
        await db.collection('users').doc(_getEffectiveUid()).collection('payment_boxes').doc(id).delete();
        _pbToast('🗑️ تم الحذف', 'success');
        loadPaymentBoxes();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

// ---------- قائمة منسدلة للفواتير ----------
function populatePaymentBoxSelect(selectedId) {
    const sel = document.getElementById('salePaymentBox');
    if (!sel) return;

    let html = '<option value="">— بدون صندوق —</option>';
    _pbCache.forEach(b => {
        const selected = b.id === selectedId ? ' selected' : '';
        html += `<option value="${b.id}"${selected}>${_pbEsc(b.icon || '💰')} ${_pbEsc(b.name)} (${_pbFmt(b.balance || 0)})</option>`;
    });
    sel.innerHTML = html;
}

// ---------- تحديث رصيد صندوق ----------
async function pbAdjustBalance(boxId, amount, operation, meta) {
    // operation: 'add' | 'subtract'
    // meta = { reason, reasonLabel, relatedId, transferToBoxId, transferToBoxName }
    if (!boxId) return;
    try {
        const uid = _getEffectiveUid();
        const ref = db.collection('users').doc(uid).collection('payment_boxes').doc(boxId);
        const doc = await ref.get();
        if (!doc.exists) return;

        const boxData = doc.data();
        const current = parseFloat(boxData.balance) || 0;

        // 🚫 منع الرصيد السالب — القاعدة الذهبية
        if (operation === 'subtract' && current < amount) {
            const err = new Error(`الرصيد غير كافٍ في "${boxData.name}" — المتاح: ${current}، المطلوب: ${amount}`);
            err.code = 'INSUFFICIENT_BALANCE';
            err.boxName = boxData.name;
            err.available = current;
            err.required = amount;
            throw err;
        }

        const newBalance = operation === 'subtract' ? current - amount : current + amount;

        // 1) تحديث الرصيد
        await ref.update({
            balance: newBalance,
            lastTransaction: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2) تسجيل الحركة
        const txType = operation === 'subtract' ? 'out' : 'in';
        await db.collection('users').doc(uid).collection('box_transactions').add({
            boxId: boxId,
            boxName: boxData.name || '',
            boxIcon: boxData.icon || '💰',
            type: txType,
            amount: amount,
            currency: boxData.currency || 'SYP',
            balanceBefore: current,
            balanceAfter: newBalance,
            reason: (meta && meta.reason) || 'other',
            reasonLabel: (meta && meta.reasonLabel) || '',
            relatedId: (meta && meta.relatedId) || '',
            transferToBoxId: (meta && meta.transferToBoxId) || '',
            transferToBoxName: (meta && meta.transferToBoxName) || '',
            userName: (typeof currentUser !== 'undefined' && currentUser ? currentUser.fullName : '') || '',
            businessName: (typeof currentUser !== 'undefined' && currentUser ? currentUser.businessName : '') || '',
            uid: uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 3) تحديث cache محلياً
        const _cb = (typeof _pbCache !== 'undefined' ? _pbCache : []).find(b => b.id === boxId);
        if (_cb) _cb.balance = newBalance;

        console.log('💰 [pb] ' + (txType === 'in' ? '+' : '-') + amount + ' →', boxId, '→', newBalance);
    } catch(e) {
        console.warn('[pb] adjust failed:', e.message);
        // 🚫 أعِد رمي خطأ الرصيد غير الكافي
        if (e && e.code === 'INSUFFICIENT_BALANCE') {
            throw e;
        }
    }
}

// ---------- أدوات ----------
function _pbFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _pbEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function _pbToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        if (typeof showToast === 'function') { showToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' +
        (type === 'success' ? '#27ae60' : '#e74c3c') +
        '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px; max-width:85vw; text-align:center;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

// ---------- فتح الصفحة ----------
function openPaymentBoxesPage() {
    if (typeof openPage === 'function') openPage('payment-boxes');
    setTimeout(loadPaymentBoxes, 200);
}

// ---------- تحميل عند بدء التطبيق ----------
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            setTimeout(loadPaymentBoxes, 1500);
        }
    });
}

console.log('💳 [payment-boxes] جاهز');

// ---------- Modal اختيار صندوق (Promise-based) ----------
function showBoxSelector(title) {
    return new Promise((resolve) => {
        const old = document.getElementById('boxSelectorModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'boxSelectorModal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:2147483647; display:flex; align-items:flex-end; justify-content:center; direction:rtl;';

        const boxes = (typeof _pbCache !== 'undefined' && Array.isArray(_pbCache)) ? _pbCache : [];

        let boxesHtml = '';
        if (boxes.length === 0) {
            boxesHtml = '<div style="text-align:center; padding:20px; color:#999;">لا توجد صناديق — أضف صندوقاً أولاً</div>';
        } else {
            boxes.forEach(b => {
                boxesHtml += `
                    <button data-box-id="${b.id}" class="box-selector-btn" style="width:100%; padding:14px; background:#f8f9fa; border:2px solid #e0e0e0; border-radius:12px; cursor:pointer; text-align:right; display:flex; align-items:center; gap:12px; margin-bottom:8px; transition:0.2s;">
                        <div style="font-size:32px;">${b.icon || '💰'}</div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; color:#2c3e50; font-size:15px;">${_pbEsc(b.name)}</div>
                            <div style="font-size:13px; color:${b.color || '#27ae60'}; font-weight:bold; margin-top:3px;">
                                ${_pbFmt(b.balance || 0)} ${_pbEsc(b.currency || 'SYP')}
                            </div>
                        </div>
                        <div style="color:#27ae60; font-size:20px;">←</div>
                    </button>`;
            });
        }

        modal.innerHTML = `
            <div style="background:white; border-radius:20px 20px 0 0; padding:20px; width:100%; max-width:500px; max-height:80vh; overflow-y:auto; animation: slideUp 0.3s ease-out;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; color:#2c3e50; font-size:16px;">${title || '💳 اختر صندوق الدفع'}</h3>
                    <button id="boxSelectorClose" style="background:#e74c3c; color:white; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:16px;">✕</button>
                </div>

                <div id="boxSelectorList">
                    ${boxesHtml}
                </div>

                <button id="boxSelectorNone" style="width:100%; padding:12px; background:#ecf0f1; color:#7f8c8d; border:none; border-radius:12px; cursor:pointer; font-size:14px; margin-top:10px; font-weight:bold;">
                    🚫 بدون صندوق
                </button>
            </div>
            <style>
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .box-selector-btn:hover { background:#e8f5e9 !important; border-color:#27ae60 !important; }
                .box-selector-btn:active { transform: scale(0.98); }
            </style>
        `;

        document.body.appendChild(modal);

        // أحداث
        modal.querySelectorAll('.box-selector-btn').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.boxId;
                modal.remove();
                resolve(id);
            };
        });

        document.getElementById('boxSelectorClose').onclick = () => {
            modal.remove();
            resolve(null);   // إلغاء
        };

        document.getElementById('boxSelectorNone').onclick = () => {
            modal.remove();
            resolve('');     // بدون صندوق
        };

        // اضغط خارج المودال = إلغاء
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        };
    });
}

console.log('🎯 [box-selector] جاهز');

// ============================================================
//  🔄 TRANSFER + 📋 HISTORY
// ============================================================

// ---------- Modal التحويل ----------
function openTransferModal() {
    if (!_pbCache || _pbCache.length < 2) {
        alert('⚠️ يجب وجود صندوقين على الأقل للتحويل');
        return;
    }

    const old = document.getElementById('transferModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'transferModal';
    modal.className = 'modal-overlay show';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:2147483647; display:flex; align-items:center; justify-content:center; padding:20px; direction:rtl;';

    const options = _pbCache.map(b => 
        `<option value="${b.id}">${b.icon || '💰'} ${_pbEsc(b.name)} (${_pbFmt(b.balance || 0)})</option>`
    ).join('');

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; padding:20px; max-width:500px; width:100%; max-height:90vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#2c3e50;">🔄 تحويل بين الصناديق</h3>
                <button id="closeTransferModal" style="background:#e74c3c; color:white; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:16px;">✕</button>
            </div>

            <label style="display:block; font-size:13px; color:#555; margin:8px 0 4px;">📤 من صندوق:</label>
            <select id="transferFrom" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">
                ${options}
            </select>

            <label style="display:block; font-size:13px; color:#555; margin:12px 0 4px;">📥 إلى صندوق:</label>
            <select id="transferTo" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">
                ${options}
            </select>

            <label style="display:block; font-size:13px; color:#555; margin:12px 0 4px;">💰 المبلغ:</label>
            <input type="number" id="transferAmount" placeholder="0" step="0.01" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">

            <label style="display:block; font-size:13px; color:#555; margin:12px 0 4px;">📝 ملاحظة (اختياري):</label>
            <input type="text" id="transferNote" placeholder="مثال: نقل إلى البنك" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box;">

            <div id="transferInfo" style="margin-top:12px; font-size:12px; color:#666; text-align:center;"></div>

            <div style="display:flex; gap:8px; margin-top:18px;">
                <button id="closeTransferBtn" style="flex:1; padding:12px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer; font-size:14px;">إلغاء</button>
                <button id="confirmTransferBtn" style="flex:2; padding:12px; background:#3498db; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px;">🔄 تأكيد التحويل</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // تحديث info عند التغيير
    function _updateInfo() {
        const fromId = document.getElementById('transferFrom').value;
        const fromBox = _pbCache.find(b => b.id === fromId);
        const info = document.getElementById('transferInfo');
        if (fromBox && info) {
            info.innerHTML = `💰 الرصيد المتاح: <b style="color:#27ae60;">${_pbFmt(fromBox.balance || 0)} ${fromBox.currency || 'SYP'}</b>`;
        }
    }
    document.getElementById('transferFrom').onchange = _updateInfo;
    _updateInfo();

    // إغلاق
    function close() { modal.remove(); }
    document.getElementById('closeTransferModal').onclick = close;
    document.getElementById('closeTransferBtn').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    // تأكيد
    document.getElementById('confirmTransferBtn').onclick = async () => {
        const fromId = document.getElementById('transferFrom').value;
        const toId = document.getElementById('transferTo').value;
        const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
        const note = document.getElementById('transferNote').value.trim();

        if (!fromId || !toId) return alert('⚠️ اختر الصندوقين');
        if (fromId === toId) return alert('⚠️ لا يمكن التحويل لنفس الصندوق');
        if (amount <= 0) return alert('⚠️ أدخل مبلغاً صحيحاً');

        const fromBox = _pbCache.find(b => b.id === fromId);
        if (!fromBox) return alert('⚠️ الصندوق المصدر غير موجود');
        if ((fromBox.balance || 0) < amount) {
            return alert(`⚠️ الرصيد غير كافٍ\\n\\nالمتاح: ${_pbFmt(fromBox.balance || 0)}\\nالمطلوب: ${_pbFmt(amount)}`);
        }

        const toBox = _pbCache.find(b => b.id === toId);
        if (!confirm(`🔄 تأكيد التحويل؟\\n\\nمن: ${fromBox.name}\\nإلى: ${toBox.name}\\nالمبلغ: ${_pbFmt(amount)} ${fromBox.currency || 'SYP'}`)) return;

        try {
            // 1) خصم من المصدر
            await pbAdjustBalance(fromId, amount, 'subtract', {
                reason: 'transfer',
                reasonLabel: '🔄 تحويل إلى: ' + toBox.name + (note ? ' (' + note + ')' : ''),
                transferToBoxId: toId,
                transferToBoxName: toBox.name
            });

            // 2) إضافة للهدف
            await pbAdjustBalance(toId, amount, 'add', {
                reason: 'transfer',
                reasonLabel: '🔄 تحويل من: ' + fromBox.name + (note ? ' (' + note + ')' : ''),
                transferToBoxId: fromId,
                transferToBoxName: fromBox.name
            });

            close();
            loadPaymentBoxes();

            if (typeof showSuccessToast === 'function') {
                showSuccessToast({
                    title: 'تم التحويل بنجاح!',
                    details: [
                        { icon: '📤', label: 'من', value: fromBox.name },
                        { icon: '📥', label: 'إلى', value: toBox.name },
                        { icon: '💰', label: 'المبلغ', value: _pbFmt(amount) + ' ' + (fromBox.currency || 'SYP') }
                    ],
                    duration: 6000
                });
            } else {
                alert('✅ تم التحويل بنجاح');
            }
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };
}

// ---------- صفحة سجل الحركات ----------
async function loadBoxHistory(boxId) {
    const list = document.getElementById('boxHistoryList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('users').doc(_getEffectiveUid())
            .collection('box_transactions')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));

        // فلترة حسب الصندوق
        let filtered = items;
        if (boxId && boxId !== 'all') {
            filtered = items.filter(t => t.boxId === boxId || t.transferToBoxId === boxId);
        }

        _bxRenderHistory(filtered, items);
    } catch(e) {
        console.error('[bx]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _pbEsc(e.message) + '</div>';
    }
}

function _bxRenderHistory(filtered, all) {
    const list = document.getElementById('boxHistoryList');
    if (!list) return;

    // إحصائيات
    const inSum = filtered.filter(t => t.type === 'in').reduce((s, t) => s + (t.amount || 0), 0);
    const outSum = filtered.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0);
    const transferCount = filtered.filter(t => t.reason === 'transfer').length;

    const inEl = document.getElementById('bxInSum');
    const outEl = document.getElementById('bxOutSum');
    const txEl = document.getElementById('bxTransferCount');
    if (inEl) inEl.textContent = _pbFmt(inSum);
    if (outEl) outEl.textContent = _pbFmt(outSum);
    if (txEl) txEl.textContent = transferCount;

    if (!filtered.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">📭 لا توجد حركات بعد</div>';
        return;
    }

    let html = '';
    filtered.forEach(t => {
        const date = t.createdAt?.toDate?.()?.toLocaleString('ar-SY') || '-';
        const isIn = t.type === 'in';
        const isTransfer = t.reason === 'transfer';
        
        let bg, border, icon, sign, amountColor;
        if (isTransfer) {
            bg = '#fef3c7';
            border = '#f39c12';
            icon = '🔄';
            sign = isIn ? '+' : '-';
            amountColor = isIn ? '#27ae60' : '#e67e22';
        } else if (isIn) {
            bg = '#f0fdf4';
            border = '#27ae60';
            icon = '📥';
            sign = '+';
            amountColor = '#27ae60';
        } else {
            bg = '#fef2f2';
            border = '#e74c3c';
            icon = '📤';
            sign = '-';
            amountColor = '#e74c3c';
        }

        html += `
        <div style="background:${bg}; border-right:4px solid ${border}; border-radius:10px; padding:12px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:13px;">
                        ${icon} ${_pbEsc(t.reasonLabel || t.reason || 'حركة')}
                    </div>
                    <div style="font-size:11px; color:#888; margin-top:3px;">
                        💼 ${_pbEsc(t.boxIcon || '💰')} ${_pbEsc(t.boxName || '-')}
                    </div>
                </div>
                <div style="text-align:left; margin-right:8px;">
                    <div style="font-size:15px; font-weight:bold; color:${amountColor}; white-space:nowrap;">
                        ${sign}${_pbFmt(t.amount || 0)}
                    </div>
                    <div style="font-size:10px; color:#888;">${_pbEsc(t.currency || 'SYP')}</div>
                </div>
            </div>
            <div style="font-size:10px; color:#999; display:flex; justify-content:space-between;">
                <span>🕒 ${date}</span>
                <span>💰 ${_pbFmt(t.balanceAfter || 0)}</span>
            </div>
        </div>`;
    });

    list.innerHTML = html;
}

// ---------- فتح صفحة السجل ----------
function openBoxHistoryPage() {
    if (typeof openPage === 'function') openPage('box-history');
    setTimeout(() => {
        _bxPopulateFilter();
        loadBoxHistory('all');
    }, 200);
}

function _bxPopulateFilter() {
    const sel = document.getElementById('bxFilterBox');
    if (!sel) return;
    let html = '<option value="all">📋 كل الصناديق</option>';
    (_pbCache || []).forEach(b => {
        html += `<option value="${b.id}">${b.icon || '💰'} ${_pbEsc(b.name)}</option>`;
    });
    sel.innerHTML = html;
}

function _bxFilterChange() {
    const sel = document.getElementById('bxFilterBox');
    loadBoxHistory(sel ? sel.value : 'all');
}

console.log('🔄 [transfer-history] جاهز');
