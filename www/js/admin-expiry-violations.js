// ============================================================
//  📢 ADMIN EXPIRY VIOLATIONS — سجل محاولات بيع المواد المنتهية
// ============================================================

async function loadExpiryViolations() {
    const list = document.getElementById('aewList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('expiry_violations').get();
        const items = [];
        snap.forEach(d => items.push({ id: d.id, ...d.data() }));

        items.sort((a, b) => {
            const ta = a.attemptedAt?.toDate?.()?.getTime() || 0;
            const tb = b.attemptedAt?.toDate?.()?.getTime() || 0;
            return tb - ta;
        });

        _aewUpdateStats(items);
        _aewRender(items);
    } catch(e) {
        console.error('[aew]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _aewEsc(e.message) + '</div>';
    }
}

function _aewUpdateStats(items) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const today = new Date().toISOString().slice(0, 10);

    set('aewTotal', items.length);
    set('aewToday', items.filter(i => {
        const d = i.attemptedAt?.toDate?.();
        return d && d.toISOString().slice(0, 10) === today;
    }).length);

    // عدد المستخدمين الفريدين
    const uniqUids = new Set(items.map(i => i.uid));
    set('aewUsers', uniqUids.size);
}

function _aewRender(items) {
    const list = document.getElementById('aewList');
    if (!list) return;

    if (!items.length) {
        list.innerHTML = '<div style="text-align:center; color:#27ae60; padding:30px;">✅ لا توجد محاولات — ممتاز!</div>';
        return;
    }

    // جلب آخر 30
    const recent = items.slice(0, 30);

    let html = '';
    recent.forEach(v => {
        const dateText = v.attemptedAt?.toDate?.()?.toLocaleString('ar-SY') || '-';

        html += `
        <div style="background:#fef2f2; border-right:4px solid #e74c3c; border-radius:10px; padding:14px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:14px;">👤 ${_aewEsc(v.userName || 'بدون اسم')}</div>
                    <div style="font-size:12px; color:#666; margin-top:2px;">🏪 ${_aewEsc(v.businessName || '-')} • ${_aewEsc(v.businessType || '-')}</div>
                </div>
                <span style="background:#e74c3c; color:white; padding:3px 10px; border-radius:20px; font-size:10px; white-space:nowrap;">🚫 محاولة</span>
            </div>
            <div style="background:white; border-radius:8px; padding:10px; font-size:12px;">
                <div style="color:#555; margin-bottom:4px;">📦 <b>${_aewEsc(v.materialName || '-')}</b></div>
                <div style="color:#888;">📅 منتهية: ${_aewEsc(v.expiryDate || '-')}</div>
                <div style="color:#888;">🕒 ${dateText}</div>
            </div>
        </div>`;
    });

    list.innerHTML = html;
}

function _aewEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('📢 [admin-expiry-violations] جاهز');
