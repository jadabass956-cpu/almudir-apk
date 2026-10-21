// ============================================================
//  👥 CUSTOMERS — إدارة العملاء
// ============================================================

let _custCache = [];

// ---------- تحميل ----------
async function loadCustomers() {
    const list = document.getElementById('custList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('users').doc(_getEffectiveUid())
            .collection('customers').get();
        _custCache = [];
        snap.forEach(d => _custCache.push({ id: d.id, ...d.data() }));
        _custCache.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

        _custRender();
        _custUpdateStats();
    } catch(e) {
        console.error('[cust]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _custEsc(e.message) + '</div>';
    }
}

function _custRender() {
    const list = document.getElementById('custList');
    if (!list) return;

    if (!_custCache.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">لا يوجد عملاء — أضف أول عميل</div>';
        return;
    }

    let html = '';
    _custCache.forEach(c => {
        const bal = parseFloat(c.balance) || 0;
        const balColor = bal > 0 ? '#e74c3c' : (bal < 0 ? '#27ae60' : '#95a5a6');
        const balText = bal > 0 ? `🔴 مدين لنا: ${_custFmt(bal)}` : (bal < 0 ? `🟢 علينا له: ${_custFmt(Math.abs(bal))}` : '⚪ لا ديون');
        const balIcon = '';

        html += `
        <div style="background:white; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ${balColor};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:15px;">👤 ${_custEsc(c.name || '-')}</div>
                    ${c.phone ? `<div style="font-size:12px; color:#888; direction:ltr; text-align:right; margin-top:3px;">📞 ${_custEsc(c.phone)}</div>` : ''}
                    <div style="font-size:13px; color:${balColor}; font-weight:bold; margin-top:6px;">${balIcon} ${balText}</div>
                    ${c.notes ? `<div style="font-size:11px; color:#999; margin-top:4px;">${_custEsc(c.notes)}</div>` : ''}
                </div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="openCustomerDetails('${c.id}')" style="flex:1; min-width:80px; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold;">👁️ تفاصيل</button>
                <button onclick="openCustEditor('${c.id}')" style="padding:8px 12px; background:#f39c12; color:white; border:none; border-radius:6px; cursor:pointer;">✏️</button>
                <button onclick="custDelete('${c.id}')" style="padding:8px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer;">🗑️</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function _custUpdateStats() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    let owedToUs = 0;   // 🔴 لنا عنده (موجب)
    let weOwe = 0;      // 🟢 علينا له (سالب)

    _custCache.forEach(c => {
        const b = parseFloat(c.balance) || 0;
        if (b > 0) owedToUs += b;
        else if (b < 0) weOwe += Math.abs(b);
    });

    set('custCount', _custCache.length);
    set('custDebt', _custFmt(owedToUs));     // لنا عنده
    set('custWeOwe', _custFmt(weOwe));        // علينا له
    set('custNet', _custFmt(owedToUs - weOwe)); // صافي
}

// ---------- محرر ----------
function openCustEditor(id) {
    const c = id ? _custCache.find(x => x.id === id) : null;

    document.getElementById('custModalTitle').textContent = c ? '✏️ تعديل عميل' : '➕ إضافة عميل';
    document.getElementById('custId').value = c ? c.id : '';
    document.getElementById('custName').value = c ? (c.name || '') : '';
    document.getElementById('custPhone').value = c ? (c.phone || '') : '';
    document.getElementById('custNotes').value = c ? (c.notes || '') : '';

    // 🎯 تحديد نوع الرصيد
    const bal = c ? (parseFloat(c.balance) || 0) : 0;
    let balType = 'none';
    let balAmount = 0;
    if (bal > 0) { balType = 'debit'; balAmount = bal; }
    else if (bal < 0) { balType = 'credit'; balAmount = Math.abs(bal); }

    document.querySelectorAll('input[name="custBalType"]').forEach(r => {
        r.checked = r.value === balType;
    });
    document.getElementById('custBalance').value = balAmount;

    document.getElementById('custEditorModal').classList.add('show');
}

function closeCustEditor() {
    document.getElementById('custEditorModal').classList.remove('show');
}

async function saveCust() {
    const id = document.getElementById('custId').value;
    const name = document.getElementById('custName').value.trim();
    if (!name) return alert('⚠️ أدخل اسم العميل');

    // 🎯 قراءة نوع الرصيد
    const balTypeEl = document.querySelector('input[name="custBalType"]:checked');
    const balType = balTypeEl ? balTypeEl.value : 'none';
    const balAmount = parseFloat(document.getElementById('custBalance').value) || 0;

    // 🎯 تحويل لنوع موحّد
    let finalBalance = 0;
    if (balType === 'debit') finalBalance = Math.abs(balAmount);      // مدين لنا (+)
    else if (balType === 'credit') finalBalance = -Math.abs(balAmount); // علينا له (-)
    // none → 0

    const data = {
        name: name,
        phone: document.getElementById('custPhone').value.trim(),
        notes: document.getElementById('custNotes').value.trim(),
        balance: finalBalance,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const ref = db.collection('users').doc(_getEffectiveUid()).collection('customers');
        if (id) {
            await ref.doc(id).update(data);
            _custToast('✅ تم التعديل', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await ref.add(data);
            _custToast('✅ تمت الإضافة', 'success');
        }
        closeCustEditor();
        loadCustomers();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

async function custDelete(id) {
    const c = _custCache.find(x => x.id === id);
    if (!c) return;

    const bal = parseFloat(c.balance) || 0;
    let msg = `🗑️ حذف "${c.name}"؟`;
    if (bal !== 0) {
        msg += `\n\n⚠️ الرصيد: ${_custFmt(Math.abs(bal))} ل.س`;
    }
    if (!confirm(msg)) return;

    try {
        await db.collection('users').doc(_getEffectiveUid()).collection('customers').doc(id).delete();
        _custToast('🗑️ تم الحذف', 'success');
        loadCustomers();
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

// ---------- تعديل الرصيد ----------
async function custAdjustBalance(customerId, amount, operation) {
    // operation: 'add' (زيادة دين) | 'subtract' (تسديد)
    if (!customerId) return;
    try {
        const ref = db.collection('users').doc(_getEffectiveUid())
            .collection('customers').doc(customerId);
        const doc = await ref.get();
        if (!doc.exists) return;

        const current = parseFloat(doc.data().balance) || 0;
        const newBalance = operation === 'subtract' ? current - amount : current + amount;

        await ref.update({
            balance: newBalance,
            lastTransaction: firebase.firestore.FieldValue.serverTimestamp()
        });

        const _cc = _custCache.find(x => x.id === customerId);
        if (_cc) _cc.balance = newBalance;

        console.log('👤 [cust] رصيد العميل:', customerId, '→', newBalance);
    } catch(e) {
        console.warn('[cust] adjust:', e.message);
    }
}

// ---------- إيجاد عميل بالاسم ----------
function findCustomerByName(name) {
    if (!name) return null;
    const clean = String(name).trim();
    return _custCache.find(c => c.name === clean) || null;
}

// ---------- فتح الصفحة ----------
function openCustomersPage() {
    if (typeof openPage === 'function') openPage('customers');
    setTimeout(loadCustomers, 200);
}

// ---------- تحميل عند البدء ----------
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) setTimeout(loadCustomers, 1500);
    });
}

// ---------- أدوات ----------
function _custFmt(n) {
    return new Intl.NumberFormat('ar-SY').format(Math.round(n || 0));
}

function _custEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function _custToast(msg, type) {
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

console.log('👥 [customers] جاهز');
