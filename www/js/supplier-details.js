// ============================================================
//  🏭 SUPPLIER DETAILS — صفحة تفاصيل المورد + كشف الحساب
// ============================================================

let _supDetCurrentId = null;

// ---------- فتح صفحة التفاصيل ----------
async function openSupplierDetails(supplierId) {
    const s = _supCache.find(x => x.id === supplierId);
    if (!s) return alert('⚠️ المورد غير موجود');

    _supDetCurrentId = supplierId;

    // افتح الصفحة
    if (typeof openPage === 'function') openPage('supplier-details');

    // عبّئ
    document.getElementById('supDetName').textContent = s.name || '-';
    document.getElementById('supDetPhone').textContent = s.phone || '-';
    document.getElementById('supDetBalance').textContent = _supFmt(s.balance || 0) + ' ل.س';

    // لون الرصيد
    const balEl = document.getElementById('supDetBalance');
    const bal = parseFloat(s.balance) || 0;
    balEl.style.color = bal > 0 ? '#e74c3c' : (bal < 0 ? '#27ae60' : '#95a5a6');

    // حمّل البيانات
    await loadSupplierDetails(supplierId);
}

// ---------- تحميل التفاصيل ----------
async function loadSupplierDetails(supplierId) {
    const purchaseList = document.getElementById('supDetPurchases');
    const paymentsList = document.getElementById('supDetPayments');
    if (!purchaseList || !paymentsList) return;

    purchaseList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">⏳ جاري التحميل...</div>';
    paymentsList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">⏳ جاري التحميل...</div>';

    try {
        const uid = auth.currentUser.uid;

        // 1) فواتير الشراء
        const purSnap = await db.collection('users').doc(uid)
            .collection('purchases')
            .where('supplierId', '==', supplierId)
            .get();

        const purchases = [];
        purSnap.forEach(d => purchases.push({ id: d.id, ...d.data() }));
        purchases.sort((a, b) => {
            const ta = a.createdAt?.toDate?.()?.getTime() || 0;
            const tb = b.createdAt?.toDate?.()?.getTime() || 0;
            return tb - ta;
        });

        // 2) الدفعات
        const paySnap = await db.collection('users').doc(uid)
            .collection('supplier_payments')
            .where('supplierId', '==', supplierId)
            .get();

        const payments = [];
        paySnap.forEach(d => payments.push({ id: d.id, ...d.data() }));
        payments.sort((a, b) => {
            const ta = a.createdAt?.toDate?.()?.getTime() || 0;
            const tb = b.createdAt?.toDate?.()?.getTime() || 0;
            return tb - ta;
        });

        // 3) الإحصائيات
        const totalPurchases = purchases.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
        const totalPaid = purchases.reduce((sum, p) => sum + (parseFloat(p.paid) || 0), 0);
        const totalPaymentsSum = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const currentDebt = parseFloat(_supCache.find(x => x.id === supplierId)?.balance) || 0;

        document.getElementById('supDetTotalPur').textContent = _supFmt(totalPurchases);
        document.getElementById('supDetTotalPaid').textContent = _supFmt(totalPaid);
        document.getElementById('supDetPaymentsSum').textContent = _supFmt(totalPaymentsSum);
        document.getElementById('supDetDebt').textContent = _supFmt(currentDebt);
        document.getElementById('supDetPurCount').textContent = purchases.length;
        document.getElementById('supDetPayCount').textContent = payments.length;

        // 4) عرض الفواتير
        _supDetRenderPurchases(purchases);

        // 5) عرض الدفعات
        _supDetRenderPayments(payments);

    } catch(e) {
        console.error('[supDet]', e);
        purchaseList.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _supEsc(e.message) + '</div>';
    }
}

// ---------- عرض الفواتير ----------
function _supDetRenderPurchases(purchases) {
    const list = document.getElementById('supDetPurchases');
    if (!purchases.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد فواتير شراء</div>';
        return;
    }

    let html = '';
    purchases.forEach(p => {
        const date = p.createdAt?.toDate?.()?.toLocaleDateString('ar-SY') || p.date || '-';
        const total = parseFloat(p.total) || 0;
        const paid = parseFloat(p.paid) || 0;
        const remaining = parseFloat(p.remaining) || 0;
        const boxName = p.boxId && typeof _getBoxName === 'function' ? _getBoxName(p.boxId) : '';

        html += `
        <div style="background:white; border-radius:10px; padding:12px; margin-bottom:8px; box-shadow:0 1px 4px rgba(0,0,0,0.05); border-right:4px solid #27ae60;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:13px;">📄 ${_supEsc(p.invoice || '-')}</div>
                    <div style="font-size:11px; color:#888; margin-top:2px;">📅 ${date}</div>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:15px; font-weight:bold; color:#27ae60;">${_supFmt(total)}</div>
                    <div style="font-size:10px; color:#888;">ل.س</div>
                </div>
            </div>
            <div style="background:#f8f9fa; border-radius:6px; padding:8px; font-size:11px; margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between;"><span>💵 المدفوع:</span><b>${_supFmt(paid)}</b></div>
                ${remaining > 0 ? `<div style="display:flex; justify-content:space-between; color:#e74c3c;"><span>⏳ الباقي:</span><b>${_supFmt(remaining)}</b></div>` : ''}
                ${boxName ? `<div style="display:flex; justify-content:space-between; color:#3498db;"><span>💳 الصندوق:</span><b>${_supEsc(boxName)}</b></div>` : ''}
            </div>
            <div style="display:flex; gap:4px; font-size:11px;">
                <span style="background:#e8f5e9; color:#27ae60; padding:3px 8px; border-radius:4px;">📦 ${(p.items || []).length} مادة</span>
                ${p.notes ? `<span style="background:#fef3c7; color:#92400e; padding:3px 8px; border-radius:4px;">📝 ${_supEsc(p.notes.substring(0, 30))}</span>` : ''}
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

// ---------- عرض الدفعات ----------
function _supDetRenderPayments(payments) {
    const list = document.getElementById('supDetPayments');
    if (!payments.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد دفعات</div>';
        return;
    }

    let html = '';
    payments.forEach(p => {
        const date = p.createdAt?.toDate?.()?.toLocaleDateString('ar-SY') || p.date || '-';
        const amount = parseFloat(p.amount) || 0;
        const boxName = p.boxId && typeof _getBoxName === 'function' ? _getBoxName(p.boxId) : '';

        html += `
        <div style="background:#f0f7ff; border-radius:10px; padding:12px; margin-bottom:8px; border-right:4px solid #3498db;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <div style="font-weight:bold; color:#2c3e50; font-size:13px;">💵 دفعة</div>
                <div style="font-size:15px; font-weight:bold; color:#3498db;">${_supFmt(amount)} <span style="font-size:10px;">ل.س</span></div>
            </div>
            <div style="font-size:11px; color:#666;">📅 ${date}</div>
            ${boxName ? `<div style="font-size:11px; color:#3498db; margin-top:3px;">💳 ${_supEsc(boxName)}</div>` : ''}
            ${p.notes ? `<div style="font-size:11px; color:#888; margin-top:3px;">📝 ${_supEsc(p.notes)}</div>` : ''}
        </div>`;
    });
    list.innerHTML = html;
}

// ---------- كشف حساب (واتساب) ----------
function shareSupplierStatement() {
    const s = _supCache.find(x => x.id === _supDetCurrentId);
    if (!s) return alert('⚠️ المورد غير موجود');

    const totalPurchases = document.getElementById('supDetTotalPur')?.textContent || '0';
    const totalPaid = document.getElementById('supDetTotalPaid')?.textContent || '0';
    const currentDebt = document.getElementById('supDetDebt')?.textContent || '0';
    const purCount = document.getElementById('supDetPurCount')?.textContent || '0';
    const payCount = document.getElementById('supDetPayCount')?.textContent || '0';

    const today = new Date().toLocaleDateString('ar-SY');
    const businessName = (typeof currentUser !== 'undefined' && currentUser ? currentUser.businessName : '') || 'المدير AI';

    const msg = `📄 *كشف حساب*
━━━━━━━━━━━━━━━━━
🏭 *المورد:* ${s.name}
📅 *التاريخ:* ${today}

💰 *الرصيد الحالي:* ${currentDebt} ل.س
${parseFloat(s.balance) > 0 ? '(علينا للمورد)' : (parseFloat(s.balance) < 0 ? '(لنا عند المورد)' : '(لا ديون)')}

━━━━━━━━━━━━━━━━━
📊 *ملخص الحركات:*
🛒 إجمالي المشتريات: ${totalPurchases} ل.س
📄 عدد الفواتير: ${purCount}
💵 إجمالي المدفوع في الفواتير: ${totalPaid} ل.س
💳 عدد الدفعات: ${payCount}

━━━━━━━━━━━━━━━━━
🌟 ${businessName}`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// ---------- الرجوع ----------
function backToSuppliers() {
    openSuppliersPage();
}

console.log('🏭 [supplier-details] جاهز');
