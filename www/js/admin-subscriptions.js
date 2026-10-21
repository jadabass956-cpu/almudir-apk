// ============ 💳 طلبات الاشتراك — لوحة الإدارة ============
// ملف مستقل: لا يُعدّل app.js
// يعتمد على: db, auth, showToast(), formatDate() من الملفات الأخرى

let _subReqsCache = [];
let _subReqsFilter = 'pending';

// ---------- تحميل الطلبات ----------
async function loadSubRequests(filter) {
    if (typeof filter === 'string') _subReqsFilter = filter;
    const list = document.getElementById('subRequestsList');
    if (!list) return;

    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('payment_requests').get();
        const requests = [];
        snap.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));

        requests.sort((a, b) => {
            const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
            const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
            return tb - ta;
        });

        _subReqsCache = requests;
        updateSubReqsStats(requests);
        renderSubRequests(_subReqsFilter);

    } catch (e) {
        console.error('[SubReqs] load:', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ خطأ: ' + e.message + '</div>';
    }
}

// ---------- إحصائيات ----------
function updateSubReqsStats(requests) {
    const counts = { pending: 0, approved: 0, rejected: 0 };
    requests.forEach(r => {
        const s = r.status || 'pending';
        if (counts[s] !== undefined) counts[s]++;
    });
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('subReqStatPending', counts.pending);
    set('subReqStatApproved', counts.approved);
    set('subReqStatRejected', counts.rejected);
}

// ---------- عرض البطاقات ----------
function renderSubRequests(filter) {
    const list = document.getElementById('subRequestsList');
    if (!list) return;

    let items = _subReqsCache;
    if (filter && filter !== 'all') {
        items = items.filter(r => (r.status || 'pending') === filter);
    }

    if (!items.length) {
        const msgs = {
            pending: 'لا توجد طلبات قيد المراجعة ✨',
            approved: 'لا توجد طلبات معتمدة بعد',
            rejected: 'لا توجد طلبات مرفوضة',
            all: 'لا توجد طلبات بعد'
        };
        list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">' + (msgs[filter] || msgs.all) + '</div>';
        return;
    }

    let html = '';
    items.forEach(r => { html += _subReqCard(r); });
    list.innerHTML = html;
}

// ---------- بطاقة واحدة ----------
function _subReqCard(r) {
    const status = r.status || 'pending';
    let statusColor = '#f39c12', statusLabel = '⏳ قيد المراجعة', statusBg = '#fff8e1';
    if (status === 'approved') { statusColor = '#27ae60'; statusLabel = '✅ معتمد'; statusBg = '#e8f8ef'; }
    else if (status === 'rejected') { statusColor = '#e74c3c'; statusLabel = '❌ مرفوض'; statusBg = '#fdecea'; }

    const dateText = r.createdAt && r.createdAt.toDate
        ? (typeof formatDate === 'function' ? formatDate(r.createdAt.toDate()) : r.createdAt.toDate().toLocaleDateString('ar-SY'))
        : '-';

    const safeName = _subReqEsc(r.userName || 'بدون اسم');
    const safeEmail = _subReqEsc(r.userEmail || '-');
    const safePhone = _subReqEsc(r.userPhone || '-');
    const safePlan = _subReqEsc(r.planName || '-');
    const safeMethod = _subReqEsc(r.methodName || '-');
    const safeTx = _subReqEsc(r.transactionNumber || '-');
    const amount = r.amount || 0;
    const currency = r.currency || '';

    let actionsHtml = '';
    if (status === 'pending') {
        actionsHtml = `
            <button onclick="approveSubRequest('${r.id}')" style="flex:1; padding:9px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:bold;">✅ قبول وتفعيل</button>
            <button onclick="rejectSubRequest('${r.id}')" style="flex:1; padding:9px; background:#e74c3c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:bold;">❌ رفض</button>`;
    } else if (status === 'approved') {
        actionsHtml = `<button onclick="rejectSubRequest('${r.id}')" style="flex:1; padding:9px; background:#95a5a6; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">🔄 إلغاء الاعتماد</button>`;
    } else if (status === 'rejected') {
        actionsHtml = `<button onclick="approveSubRequest('${r.id}')" style="flex:1; padding:9px; background:#27ae60; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">✅ قبول بعد الرفض</button>`;
    }
    if (r.userPhone) {
        actionsHtml += `<button onclick="contactSubReqWA('${safePhone}')" title="تواصل واتساب" style="padding:9px 14px; background:#25d366; color:white; border:none; border-radius:6px; cursor:pointer; font-size:15px;">📱</button>`;
    }

    return `
    <div style="background:${statusBg}; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.06); border-right:4px solid ${statusColor};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div style="flex:1; min-width:0;">
                <div style="font-weight:bold; color:#2c3e50; font-size:14px; word-break:break-word;">👤 ${safeName}</div>
                <div style="font-size:12px; color:#777; margin-top:2px; word-break:break-all;">📧 ${safeEmail}</div>
                <div style="font-size:12px; color:#777; direction:ltr; text-align:right;">📱 ${safePhone}</div>
            </div>
            <span style="background:${statusColor}; color:white; padding:3px 10px; border-radius:20px; font-size:11px; white-space:nowrap; margin-right:8px;">${statusLabel}</span>
        </div>
        <div style="background:white; border-radius:8px; padding:10px; margin-bottom:8px; font-size:13px;">
            <div style="color:#555; margin-bottom:4px;">💎 <strong>الخطة:</strong> ${safePlan} • <strong>${amount}</strong> ${currency}</div>
            <div style="color:#555; margin-bottom:4px;">🏦 <strong>طريقة الدفع:</strong> ${safeMethod}</div>
            <div style="color:#555; margin-bottom:4px;">🔢 <strong>رقم العملية:</strong> <code style="background:#f0f0f0; padding:2px 6px; border-radius:4px; direction:ltr; display:inline-block;">${safeTx}</code></div>
            <div style="color:#999; font-size:11px; margin-top:6px;">🕒 ${dateText}</div>
            ${r.rejectReason ? '<div style="color:#e74c3c; font-size:11px; margin-top:5px;">⚠️ سبب الرفض: ' + _subReqEsc(r.rejectReason) + '</div>' : ''}
        </div>
        <div style="display:flex; gap:6px;">${actionsHtml}</div>
    </div>`;
}

// ---------- قبول الطلب ----------
async function approveSubRequest(reqId) {
    const req = _subReqsCache.find(r => r.id === reqId);
    if (!req) { alert('⚠️ الطلب غير موجود'); return; }

    if (!confirm('✅ هل تريد قبول طلب "' + (req.userName || 'المستخدم') + '" وتفعيل الاشتراك؟')) return;

    try {
        // 1) جلب تفاصيل الخطة لحساب الأيام
        let days = 30;
        try {
            const planDoc = await db.collection('subscription_plans').doc(req.planId).get();
            if (planDoc.exists) {
                const p = planDoc.data();
                days = p.durationDays || p.days || _subReqPlanDays(p.name) || 30;
            } else {
                days = _subReqPlanDays(req.planName);
            }
        } catch (e) {
            console.warn('[SubReqs] plan fetch fallback:', e);
            days = _subReqPlanDays(req.planName);
        }

        // 2) تفعيل المستخدم مباشرة (نفس منطق activateUser)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        await db.collection('users').doc(req.userId).update({
            subscriptionStatus: 'active',
            subscriptionEndDate: firebase.firestore.Timestamp.fromDate(endDate)
        });

        // 3) تحديث حالة الطلب
        await db.collection('payment_requests').doc(reqId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (typeof showToast === 'function') {
            showToast('✅ تم تفعيل اشتراك ' + (req.userName || 'المستخدم') + ' لمدة ' + days + ' يوم', 'success');
        } else {
            alert('✅ تم التفعيل لمدة ' + days + ' يوم');
        }

        await loadSubRequests();
        if (typeof loadAdminUsers === 'function') loadAdminUsers();

    } catch (e) {
        console.error('[SubReqs] approve:', e);
        alert('❌ خطأ: ' + e.message);
    }
}

// ---------- رفض الطلب ----------
async function rejectSubRequest(reqId) {
    const req = _subReqsCache.find(r => r.id === reqId);
    if (!req) { alert('⚠️ الطلب غير موجود'); return; }

    const reason = prompt('❌ سبب الرفض (اختياري):', '');
    if (reason === null) return;

    if (!confirm('هل أنت متأكد من رفض الطلب؟')) return;

    try {
        await db.collection('payment_requests').doc(reqId).update({
            status: 'rejected',
            rejectReason: reason || 'بدون سبب محدد',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (typeof showToast === 'function') showToast('❌ تم رفض الطلب', 'warning');
        else alert('تم الرفض');

        await loadSubRequests();

    } catch (e) {
        console.error('[SubReqs] reject:', e);
        alert('❌ خطأ: ' + e.message);
    }
}

// ---------- واتساب ----------
function contactSubReqWA(phone) {
    if (!phone || phone === '-') return;
    const clean = String(phone).replace(/[^0-9+]/g, '').replace(/^\+/, '');
    window.open('https://wa.me/' + clean, '_blank');
}

// ---------- تبديل الفلتر ----------
function switchSubReqFilter(filter) {
    _subReqsFilter = filter;
    document.querySelectorAll('.sub-req-filter').forEach(b => {
        const active = b.dataset.filter === filter;
        b.classList.toggle('active', active);
        b.style.background = active ? '#f39c12' : '#ecf0f1';
        b.style.color = active ? 'white' : '#555';
    });
    renderSubRequests(filter);
}

// ---------- تخمين أيام الخطة من الاسم ----------
function _subReqPlanDays(name) {
    if (!name) return 30;
    const n = String(name);
    if (n.includes('مدى') || n.includes('حياة') || n.toLowerCase().includes('life')) return 36500;
    if (n.includes('سنو') || n.includes('سنة') || n.toLowerCase().includes('year')) return 365;
    if (n.includes('شهر') || n.toLowerCase().includes('month')) return 30;
    if (n.includes('أسبوع') || n.toLowerCase().includes('week')) return 7;
    return 30;
}

// ---------- Utility ----------
function _subReqEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

console.log('💳 [admin-subscriptions] جاهز');
