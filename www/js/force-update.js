// ============================================================
//  🧹 FORCE UPDATE — مسح الكاش وإعادة التحميل
// ============================================================

async function forceAppUpdate() {
    if (!confirm('🧹 مسح الكاش وإعادة التحميل؟\n\nهذا سيضمن ظهور آخر التحديثات.')) return;

    try {
        console.log('🧹 بدء التنظيف...');

        // 1) Service Workers
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) {
                await r.unregister();
                console.log('✅ SW removed:', r.scope);
            }
        }

        // 2) Cache Storage
        if ('caches' in window) {
            const caches_ = await caches.keys();
            for (const c of caches_) {
                await caches.delete(c);
                console.log('✅ Cache removed:', c);
            }
        }

        // 3) sessionStorage
        sessionStorage.clear();

        // 4) إعادة تحميل بقوة
        const url = window.location.href.split('?')[0];
        window.location.href = url + '?_=' + Date.now();

    } catch(e) {
        console.error('forceUpdate:', e);
        alert('⚠️ حدث خطأ — جرب إعادة تحميل الصفحة يدوياً');
    }
}

console.log('🧹 [force-update] جاهز');
