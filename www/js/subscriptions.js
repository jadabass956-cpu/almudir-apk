// ============================================================
//  ALMUDIR — نظام الاشتراكات والدفع
// ============================================================

let _subCurrentPlan = null;
let _subCurrentMethod = null;

// ---------- تهيئة الصفحة ----------
async function subscriptionInit() {
    console.log('💎 [Subscription] تهيئة...');

    // 1) حالة الاشتراك الحالية
    renderSubscriptionStatus();

    // 2) تحميل الخطط
    await loadPlans();

    // 3) تحميل طلبات المستخدم السابقة
    await loadMyRequests();
}

// ---------- حالة الاشتراك الحالية ----------
function renderSubscriptionStatus() {
    const box = document.getElementById('subStatusBox');
    if (!box || typeof currentUser === 'undefined' || !currentUser) return;

    const status = currentUser.subscriptionStatus || 'trial';
    const trialStart = currentUser.trialStartDate
        ? (currentUser.trialStartDate.toDate ? currentUser.trialStartDate.toDate() : new Date(currentUser.trialStartDate))
        : null;
    const endDate = currentUser.subscriptionEndDate
        ? (currentUser.subscriptionEndDate.toDate ? currentUser.subscriptionEndDate.toDate() : new Date(currentUser.subscriptionEndDate))
        : null;

    let icon = '⏳';
    let title = 'الفترة التجريبية';
    let subtitle = '';
    let color = '#f39c12';
    let bg = 'linear-gradient(135deg,#f39c12,#e67e22)';

    if (status === 'active') {
        icon = '🟢';
        title = 'اشتراك نشط';
        color = '#27ae60';
        bg = 'linear-gradient(135deg,#27ae60,#229954)';
        if (endDate) {
            const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
            subtitle = 'حتى ' + (typeof formatDate === 'function' ? formatDate(endDate) : endDate.toLocaleDateString('ar-SY'));
            if (daysLeft <= 30 && daysLeft > 0) {
                subtitle += ' — تبقّى ' + daysLeft + ' يوم';
            }
        }
    } else if (status === 'trial' && trialStart) {
        const daysUsed = Math.floor((new Date() - trialStart) / (1000 * 60 * 60 * 24));
        const remain = Math.max(0, 7 - daysUsed);
        subtitle = remain > 0
            ? 'تبقّى ' + remain + ' يوم' + (remain > 2 ? '' : ' — الاشتراك قريباً!')
            : 'انتهت الفترة التجريبية';
        if (remain === 0) {
            color = '#e74c3c';
            bg = 'linear-gradient(135deg,#e74c3c,#c0392b)';
            icon = '🔴';
            title = 'انتهت الفترة التجريبية';
        }
    } else {
        color = '#e74c3c';
        bg = 'linear-gradient(135deg,#e74c3c,#c0392b)';
        icon = '🔴';
        title = 'الاشتراك منتهي';
    }

    box.innerHTML =
        '<div style="background:' + bg + '; color:white; border-radius:16px; padding:20px; text-align:center; margin-bottom:15px;">' +
            '<div style="font-size:48px; margin-bottom:8px;">' + icon + '</div>' +
            '<div style="font-size:20px; font-weight:bold; margin-bottom:5px;">' + title + '</div>' +
            (subtitle ? '<div style="font-size:13px; opacity:0.95;">' + subtitle + '</div>' : '') +
        '</div>';
}

// ---------- تحميل الخطط ----------
async function loadPlans() {
    const list = document.getElementById('plansList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">جاري التحميل...</div>';

    try {
        const snap = await db.collection('subscription_plans').orderBy('order').get();
        if (snap.empty) {
            list.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">لا توجد خطط متاحة</div>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const p = doc.data();
            const isPopular = p.isPopular;
            const borderColor = isPopular ? '#f39c12' : '#e0e0e0';
            const badge = isPopular
                ? '<div style="position:absolute; top:-10px; right:15px; background:#f39c12; color:white; padding:4px 12px; border-radius:12px; font-size:11px; font-weight:bold;">⭐ الأكثر طلباً</div>'
                : '';

            html +=
                '<div style="background:#fff; border:2px solid ' + borderColor + '; border-radius:14px; padding:20px; margin-bottom:12px; position:relative; box-shadow:' + (isPopular ? '0 4px 15px rgba(243,156,18,0.2)' : '0 2px 5px rgba(0,0,0,0.05)') + ';">' +
                    badge +
                    '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">' +
                        '<div style="font-size:40px;">' + (p.icon || '💎') + '</div>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:18px; font-weight:bold; color:#2c3e50;">' + _subEsc(p.name) + '</div>' +
                            '<div style="font-size:12px; color:#666;">' + _subEsc(p.durationText || '') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="text-align:center; padding:12px; background:#f8f9fa; border-radius:10px; margin-bottom:12px;">' +
                        '<div style="font-size:11px; color:#666;">السعر</div>' +
                        '<div style="font-size:24px; font-weight:bold; color:#e67e22;">' +
                            p.price + ' ' + (p.currency || 'USD') +
                        '</div>' +
                    '</div>' +
                    '<div style="margin-bottom:15px;">' +
                        (p.features || []).map(f =>
                            '<div style="font-size:13px; color:#555; margin-bottom:5px;">✅ ' + _subEsc(f) + '</div>'
                        ).join('') +
                    '</div>' +
                    '<button data-plan-id="' + _subEsc(doc.id) + '" onclick="startSubscribe(this.getAttribute(&quot;data-plan-id&quot;))" style="width:100%; padding:12px; background:' + (isPopular ? '#e67e22' : '#3498db') + '; color:white; border:none; border-radius:10px; font-size:15px; font-weight:bold; cursor:pointer;">💳 اشترك الآن</button>' +
                '</div>';
        });

        list.innerHTML = html;

    } catch (e) {
        console.error('[Subscription] plans:', e);
        list.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:20px;">خطأ: ' + e.message + '</div>';
    }
}

// ---------- طلباتي السابقة ----------
async function loadMyRequests() {
    const list = document.getElementById('myRequestsList');
    if (!list) return;

    try {
        const uid = auth.currentUser.uid;
        const snap = await db.collection('payment_requests')
            .where('userId', '==', uid)
            .get();

        if (snap.empty) {
            list.innerHTML = '<div style="text-align:center; color:#999; padding:15px; font-size:13px;">لا توجد طلبات بعد</div>';
            return;
        }

        const requests = [];
        snap.forEach(doc => {
            const d = doc.data();
            requests.push({ id: doc.id, ...d });
        });

        // ترتيب: الأحدث أولاً
        requests.sort((a, b) => {
            const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
        });

        let html = '';
        requests.forEach(r => {
            const status = r.status || 'pending';
            let statusColor = '#f39c12';
            let statusLabel = '⏳ قيد المراجعة';
            if (status === 'approved') { statusColor = '#27ae60'; statusLabel = '✅ تم التفعيل'; }
            else if (status === 'rejected') { statusColor = '#e74c3c'; statusLabel = '❌ مرفوض'; }

            const dateText = r.createdAt && r.createdAt.toDate
                ? (typeof formatDate === 'function' ? formatDate(r.createdAt.toDate()) : r.createdAt.toDate().toLocaleDateString('ar-SY'))
                : '-';

            html +=
                '<div style="background:#fff; border:1px solid #eee; border-right:3px solid ' + statusColor + '; border-radius:10px; padding:12px; margin-bottom:8px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
                        '<div style="font-weight:bold; color:#2c3e50; font-size:14px;">' + _subEsc(r.planName || '') + '</div>' +
                        '<span style="background:' + statusColor + '; color:white; padding:2px 10px; border-radius:10px; font-size:11px;">' + statusLabel + '</span>' +
                    '</div>' +
                    '<div style="font-size:12px; color:#666;">💰 ' + r.amount + ' ' + (r.currency || 'USD') + ' | 🏦 ' + _subEsc(r.methodName || '') + '</div>' +
                    '<div style="font-size:11px; color:#999; margin-top:4px;">🕐 ' + dateText + '</div>' +
                '</div>';
        });

        list.innerHTML = html;
    } catch (e) {
        console.error('[Subscription] requests:', e);
        list.innerHTML = '<div style="text-align:center; color:#999; padding:15px; font-size:13px;">—</div>';
    }
}

// ---------- بدء الاشتراك ----------
async function startSubscribe(planId) {
    // حمّل الخطة من Firestore
    let _p;
    try {
        const doc = await db.collection('subscription_plans').doc(planId).get();
        if (!doc.exists) {
            alert('⚠️ الخطة غير موجودة');
            return;
        }
        _p = doc.data();
    } catch (e) {
        console.error('[Subscription] plan load:', e);
        alert('خطأ في تحميل الخطة');
        return;
    }

    _subCurrentPlan = { id: planId, name: _p.name, price: _p.price, currency: _p.currency || 'USD' };
    _subCurrentMethod = null;

    document.getElementById('subModalTitle').textContent = '💳 الاشتراك في: ' + _p.name;
    document.getElementById('subPlanSummary').innerHTML =
        '<strong>' + _subEsc(_p.name) + '</strong> — ' +
        _p.price + ' ' + (_p.currency || 'USD');

    // تحميل طرق الدفع
    await loadPaymentMethods();

    // إخفاء الخطوات التالية
    document.getElementById('subMethodsList').style.display = 'block';
    document.getElementById('subPaymentDetails').style.display = 'none';

    document.getElementById('subscribeModal').classList.add('show');
}

function closeSubscribeModal() {
    document.getElementById('subscribeModal').classList.remove('show');
    _subCurrentPlan = null;
    _subCurrentMethod = null;

    // ✅ أعِد شاشة الحجب إن كان المستخدم منتهي الاشتراك
    if (typeof restoreExpiredScreenIfNeeded === 'function') {
        restoreExpiredScreenIfNeeded();
    }
}

// ---------- تحميل طرق الدفع ----------
async function loadPaymentMethods() {
    const list = document.getElementById('subMethodsList');
    if (!list) return;

    try {
        // ✅ تجنّب Composite Index: قراءة الكل ثم فرز في JS
        const snap = await db.collection('payment_methods').get();
        const _methods = [];
        snap.forEach(_d => {
            const _data = _d.data();
            if (_data.isActive !== false) _methods.push({ id: _d.id, data: _data });
        });
        _methods.sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

        let html = '';
        _methods.forEach(_item => {
            const doc = { id: _item.id };
            const m = _item.data;
            html +=
                '<div data-method-id="' + _subEsc(doc.id) + '" onclick="selectPaymentMethod(this.getAttribute(&quot;data-method-id&quot;))" style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8f9fa; border:1px solid #e0e0e0; border-radius:10px; margin-bottom:8px; cursor:pointer;">' +
                    '<div style="font-size:28px;">' + (m.icon || '💳') + '</div>' +
                    '<div style="flex:1;">' +
                        '<div style="font-weight:bold; color:#2c3e50; font-size:14px;">' + _subEsc(m.name) + '</div>' +
                        '<div style="font-size:11px; color:#888;">' + _subEsc(m.accountNumber) + '</div>' +
                    '</div>' +
                    '<div style="color:#3498db; font-size:20px;">→</div>' +
                '</div>';
        });

        list.innerHTML = html || '<div style="text-align:center;color:#999;padding:15px;">لا توجد طرق دفع</div>';
    } catch (e) {
        console.error('[Subscription] methods:', e);
        list.innerHTML = '<div style="text-align:center;color:#e74c3c;padding:15px;">خطأ: ' + e.message + '</div>';
    }
}

// ---------- اختيار طريقة الدفع ----------
async function selectPaymentMethod(methodId) {
    let _m;
    try {
        const doc = await db.collection('payment_methods').doc(methodId).get();
        if (!doc.exists) {
            alert('⚠️ طريقة الدفع غير موجودة');
            return;
        }
        _m = doc.data();
    } catch (e) {
        console.error('[Subscription] method load:', e);
        alert('خطأ في تحميل طريقة الدفع');
        return;
    }

    _subCurrentMethod = { id: methodId, name: _m.name };

    document.getElementById('subMethodsList').style.display = 'none';
    document.getElementById('subPaymentDetails').style.display = 'block';

    document.getElementById('subPayMethod').textContent = _m.name || '-';
    document.getElementById('subPayAccount').textContent = _m.accountNumber || '-';
    document.getElementById('subPayAccountName').textContent = _m.accountName || '-';
    document.getElementById('subPayInstructions').textContent = _m.instructions || 'حوّل المبلغ على الحساب أعلاه';

    document.getElementById('subTransactionNumber').value = '';
}

function backToMethods() {
    document.getElementById('subMethodsList').style.display = 'block';
    document.getElementById('subPaymentDetails').style.display = 'none';
    _subCurrentMethod = null;
}


// ---------- إرسال الطلب ----------
async function submitPaymentRequest() {
    if (!_subCurrentPlan || !_subCurrentMethod) {
        alert('⚠️ اختر الخطة وطريقة الدفع');
        return;
    }

    const txNumber = (document.getElementById('subTransactionNumber').value || '').trim();
    if (!txNumber || txNumber.length < 3) {
        alert('⚠️ أدخل رقم العملية (3 أحرف على الأقل)');
        return;
    }

    const btn = document.getElementById('subSubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'جاري الإرسال...'; }

    try {
        const uid = auth.currentUser.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // حفظ الطلب
        await db.collection('payment_requests').add({
            userId: uid,
            userName: userData.fullName || 'غير محدد',
            userEmail: userData.email || auth.currentUser.email,
            userPhone: userData.phone || '',
            planId: _subCurrentPlan.id,
            planName: _subCurrentPlan.name,
            amount: _subCurrentPlan.price,
            currency: _subCurrentPlan.currency,
            methodId: _subCurrentMethod.id,
            methodName: _subCurrentMethod.name,
            transactionNumber: txNumber,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 📱 إرسال نسخة عبر واتساب (اختياري)
        const sendWA = document.getElementById('subSendWA');
        if (sendWA && sendWA.checked) {
            const message = '💎 *طلب اشتراك — المدير AI*\n\n' +
                '👤 *الاسم:* ' + (userData.fullName || 'غير محدد') + '\n' +
                '📧 *البريد:* ' + (userData.email || auth.currentUser.email) + '\n' +
                '📱 *الهاتف:* ' + (userData.phone || '-') + '\n\n' +
                '📦 *الخطة:* ' + _subCurrentPlan.name + '\n' +
                '💰 *المبلغ:* ' + _subCurrentPlan.price + ' ' + _subCurrentPlan.currency + '\n' +
                '🏦 *طريقة الدفع:* ' + _subCurrentMethod.name + '\n' +
                '🔢 *رقم العملية:* ' + txNumber + '\n\n' +
                'يرجى تفعيل الاشتراك. شكراً!';
            const waUrl = 'https://wa.me/963994456264?text=' + encodeURIComponent(message);
            window.open(waUrl, '_blank');
        }

        // نجاح
        if (typeof showToast === 'function') {
            showToast('✅ تم إرسال طلبك — سيراجعه المدير قريباً', 'success');
        } else {
            alert('✅ تم إرسال طلبك — سيراجعه المدير قريباً');
        }

        closeSubscribeModal();
        loadMyRequests();

    } catch (e) {
        console.error('[Subscription] submit:', e);
        alert('❌ خطأ: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📤 إرسال الطلب'; }
    }
}

// ---------- Utility ----------
function _subEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

console.log('💎 [subscriptions] جاهز');
