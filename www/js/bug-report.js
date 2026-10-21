// ============================================================
//  ALMUDIR — نظام الإبلاغ عن المشاكل
// ============================================================

const BUG_PHONE = '963994456264'; // للواتساب (بدون +)

function openBugReport() {
    // املأ المعلومات التقنية تلقائياً
    const user = (typeof auth !== 'undefined' && auth.currentUser) || null;
    const bizType = (typeof currentUser !== 'undefined' && currentUser && currentUser.businessType) || 'غير محدد';
    const version = '1.2.0';
    const ua = navigator.userAgent;

    const info = document.getElementById('bugTechInfo');
    if (info) {
        info.value = 'النسخة: ' + version +
                     '\nالنشاط: ' + bizType +
                     '\nالمتصفح: ' + ua.substring(0, 80) +
                     '\nالمستخدم: ' + (user ? user.email : 'غير مسجل');
    }

    // افتح الصفحة
    if (typeof openPage === 'function') {
        openPage('bug-report');
    }
}

async function submitBugReport() {
    const type = document.getElementById('bugType').value;
    const desc = document.getElementById('bugDescription').value.trim();
    const techInfo = document.getElementById('bugTechInfo').value.trim();
    const sendWA = document.getElementById('bugSendWA').checked;

    if (!type) {
        alert('⚠️ اختر نوع المشكلة');
        return;
    }
    if (desc.length < 5) {
        alert('⚠️ اكتب وصفاً (5 أحرف على الأقل)');
        return;
    }

    const user = (typeof auth !== 'undefined' && auth.currentUser) || null;
    const userEmail = user ? user.email : 'غير مسجل';
    const uid = user ? user.uid : 'anonymous';

    const report = {
        type: type,
        description: desc,
        techInfo: techInfo,
        userEmail: userEmail,
        userUid: uid,
        businessType: (typeof currentUser !== 'undefined' && currentUser && currentUser.businessType) || 'غير محدد',
        userAgent: navigator.userAgent.substring(0, 200),
        status: 'new',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // حفظ في Firestore
        if (typeof db !== 'undefined' && db) {
            await db.collection('bug_reports').add(report);
        }

        // فتح واتساب (اختياري)
        if (sendWA) {
            const msg = '🐛 *بلاغ من تطبيق المدير AI*\n\n' +
                       '📋 *النوع:* ' + type + '\n' +
                       '📝 *الوصف:* ' + desc + '\n\n' +
                       '👤 ' + userEmail + '\n' +
                       '📅 ' + new Date().toLocaleString('ar-EG');
            const url = 'https://wa.me/' + BUG_PHONE + '?text=' + encodeURIComponent(msg);
            window.open(url, '_blank');
        }

        // رسالة نجاح
        alert('✅ تم إرسال بلاغك بنجاح!\n\nشكراً لك — سنراجعه قريباً.');

        // تفريغ النموذج
        document.getElementById('bugType').value = '';
        document.getElementById('bugDescription').value = '';
        document.getElementById('bugSendWA').checked = false;

        // رجوع للصفحة الرئيسية
        if (typeof openPage === 'function') openPage('analytics');

    } catch (e) {
        console.error('[Bug Report] failed:', e);
        alert('❌ تعذر إرسال البلاغ.\n\nيمكنك التواصل مباشرة عبر واتساب: +963 994 456 264');
    }
}

async function loadBugReports() {
    const list = document.getElementById('bugReportsList');
    if (!list) return;
    list.innerHTML = '<div style="color:#999;text-align:center;padding:20px;">جاري التحميل...</div>';

    try {
        const snap = await db.collection('bug_reports')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        if (snap.empty) {
            list.innerHTML = '<div style="color:#999;text-align:center;padding:30px;">✅ لا توجد بلاغات</div>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            const date = d.createdAt && d.createdAt.toDate
                ? d.createdAt.toDate().toLocaleString('ar-EG')
                : '—';
            const status = d.status || 'new';
            const statusColor = status === 'new' ? '#e74c3c'
                              : status === 'seen' ? '#f39c12'
                              : '#27ae60';
            const statusLabel = status === 'new' ? '🔴 جديد'
                               : status === 'seen' ? '🟡 قيد المراجعة'
                               : '✅ محلول';

            html += `
            <div style="background:#fff; border:1px solid #eee; border-right:4px solid ${statusColor}; border-radius:10px; padding:15px; margin:10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="color:#2c3e50; font-size:14px;">${_bugEsc(d.type || 'غير محدد')}</strong>
                    <span style="background:${statusColor}; color:white; padding:3px 10px; border-radius:12px; font-size:11px;">${statusLabel}</span>
                </div>
                <div style="color:#555; font-size:13px; margin-bottom:8px; white-space:pre-wrap;">${_bugEsc(d.description || '')}</div>
                <div style="color:#95a5a6; font-size:11px;">👤 ${_bugEsc(d.userEmail || '—')} | 🕐 ${date}</div>
                <div style="margin-top:10px;">
                    <button onclick="updateBugStatus('${doc.id}', 'seen')" style="padding:5px 12px; background:#f39c12; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer;">قيد المراجعة</button>
                    <button onclick="updateBugStatus('${doc.id}', 'solved')" style="padding:5px 12px; background:#27ae60; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer; margin-right:5px;">محلول</button>
                    <button onclick="deleteBugReport('${doc.id}')" style="padding:5px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer; margin-right:5px;">حذف</button>
                </div>
            </div>`;
        });

        list.innerHTML = html;
    } catch (e) {
        console.error('[Bug Reports]', e);
        list.innerHTML = '<div style="color:#e74c3c;padding:20px;">خطأ في التحميل: ' + e.message + '</div>';
    }
}

async function updateBugStatus(id, status) {
    try {
        await db.collection('bug_reports').doc(id).update({ status: status });
        loadBugReports();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
}

async function deleteBugReport(id) {
    if (!confirm('حذف هذا البلاغ نهائياً؟')) return;
    try {
        await db.collection('bug_reports').doc(id).delete();
        loadBugReports();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
}

function _bugEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

console.log('🐛 [bug-report] جاهز');


// ============================================================
//  لوحة إدارة البلاغات (للمدير)
// ============================================================

let _bugFilter = 'all';
let _bugSearch = '';
let _bugAll = [];

async function bugAdminInit() {
    console.log('🐛 [Bug Admin] تحميل...');
    await bugAdminLoadAll();
    bugAdminUpdateStats();
    bugAdminRender();
}

async function bugAdminLoadAll() {
    try {
        const snap = await db.collection('bug_reports')
            .orderBy('createdAt', 'desc')
            .limit(200)
            .get();

        _bugAll = [];
        snap.forEach(doc => _bugAll.push({ id: doc.id, ...doc.data() }));
        console.log('🐛 تم تحميل ' + _bugAll.length + ' بلاغ');
    } catch (e) {
        console.error('[Bug Admin]', e);
        _bugAll = [];
    }
}

function bugAdminUpdateStats() {
    const newC = _bugAll.filter(b => !b.status || b.status === 'new').length;
    const seenC = _bugAll.filter(b => b.status === 'seen').length;
    const solvedC = _bugAll.filter(b => b.status === 'solved').length;

    const n = document.getElementById('bugStatNew');
    const s = document.getElementById('bugStatSeen');
    const d = document.getElementById('bugStatSolved');
    const t = document.getElementById('bugStatTotal');

    if (n) n.textContent = newC;
    if (s) s.textContent = seenC;
    if (d) d.textContent = solvedC;
    if (t) t.textContent = _bugAll.length;
}

function bugAdminFilterChange() {
    const sel = document.getElementById('bugFilterStatus');
    _bugFilter = sel ? sel.value : 'all';
    bugAdminRender();
}

function bugAdminSearchChange() {
    const inp = document.getElementById('bugSearchInput');
    _bugSearch = inp ? inp.value.trim().toLowerCase() : '';
    bugAdminRender();
}

function bugAdminRender() {
    const list = document.getElementById('bugAdminList');
    if (!list) return;

    let items = _bugAll.slice();

    // فلترة حسب الحالة
    if (_bugFilter !== 'all') {
        if (_bugFilter === 'new') {
            items = items.filter(b => !b.status || b.status === 'new');
        } else {
            items = items.filter(b => b.status === _bugFilter);
        }
    }

    // فلترة حسب البحث
    if (_bugSearch) {
        items = items.filter(b => {
            const t = ((b.type || '') + ' ' + (b.description || '') + ' ' + (b.userEmail || '')).toLowerCase();
            return t.includes(_bugSearch);
        });
    }

    if (!items.length) {
        list.innerHTML = '<div style="color:#999;text-align:center;padding:30px;">لا توجد بلاغات مطابقة</div>';
        return;
    }

    let html = '';
    items.forEach(b => {
        const date = b.createdAt && b.createdAt.toDate
            ? b.createdAt.toDate().toLocaleString('ar-EG')
            : '—';
        const status = b.status || 'new';
        const statusColor = status === 'new' ? '#e74c3c'
                          : status === 'seen' ? '#f39c12'
                          : '#27ae60';
        const statusLabel = status === 'new' ? '🔴 جديد'
                           : status === 'seen' ? '🟡 قيد المراجعة'
                           : '✅ محلول';

        const bizType = b.businessType || '—';
        const uid = b.userUid || '—';

        html += `
        <div style="background:#fff; border:1px solid #eee; border-right:4px solid ${statusColor}; border-radius:10px; padding:15px; margin:10px 0;">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px; gap:10px;">
                <strong style="color:#2c3e50; font-size:15px; flex:1;">${_bugEsc(b.type || 'غير محدد')}</strong>
                <span style="background:${statusColor}; color:white; padding:3px 10px; border-radius:12px; font-size:11px; white-space:nowrap;">${statusLabel}</span>
            </div>
            <div style="color:#555; font-size:14px; margin-bottom:10px; white-space:pre-wrap; background:#f9f9f9; padding:10px; border-radius:6px;">${_bugEsc(b.description || '')}</div>
            <div style="color:#666; font-size:12px; margin-bottom:8px;">
                👤 ${_bugEsc(b.userEmail || '—')} &nbsp;|&nbsp; 🏢 ${_bugEsc(bizType)}
            </div>
            <div style="color:#95a5a6; font-size:11px; margin-bottom:10px;">🕐 ${date}</div>
            <div style="display:flex; gap:5px; flex-wrap:wrap;">
                ${status !== 'seen' ? '<button onclick="bugAdminSetStatus(\'' + b.id + '\', \'seen\')" style="padding:6px 12px; background:#f39c12; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer;">🟡 قيد المراجعة</button>' : ''}
                ${status !== 'solved' ? '<button onclick="bugAdminSetStatus(\'' + b.id + '\', \'solved\')" style="padding:6px 12px; background:#27ae60; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer;">✅ محلول</button>' : ''}
                <button onclick="bugAdminDelete(\'' + b.id + '\')" style="padding:6px 12px; background:#e74c3c; color:white; border:none; border-radius:6px; font-size:12px; cursor:pointer;">🗑️ حذف</button>
            </div>
        </div>`;
    });

    list.innerHTML = html;
}

async function bugAdminSetStatus(id, status) {
    try {
        await db.collection('bug_reports').doc(id).update({ status: status });
        // تحديث محلي
        const b = _bugAll.find(x => x.id === id);
        if (b) b.status = status;
        bugAdminUpdateStats();
        bugAdminRender();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
}

async function bugAdminDelete(id) {
    if (!confirm('حذف هذا البلاغ نهائياً؟')) return;
    try {
        await db.collection('bug_reports').doc(id).delete();
        _bugAll = _bugAll.filter(x => x.id !== id);
        bugAdminUpdateStats();
        bugAdminRender();
    } catch (e) {
        alert('خطأ: ' + e.message);
    }
}

async function bugAdminRefresh() {
    await bugAdminLoadAll();
    bugAdminUpdateStats();
    bugAdminRender();
}
