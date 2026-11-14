(function() {
    'use strict';
    window.startSaleQRScanner = async function() {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        if (!scanner) { alert('⚠️ الماسح غير متاح.'); return; }
        
        try {
            const perm = await scanner.requestPermissions();
            if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                alert('🚨 يرجى السماح بالوصول للكاميرا.');
                return;
            }
            
            // 1. إضافة كلاس لجعل الخلفية شفافة (CSS سيتكفل بالباقي)
            document.body.classList.add('scanner-active');
            
            // 2. محاولة إخفاء الخلفية في البلوجن
            if (typeof scanner.hideBackground === 'function') {
                scanner.hideBackground();
            }
            
            // 3. تشغيل الكاميرا
            const result = await scanner.startScan({
                formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });
            
            // 4. تنظيف الواجهة بعد الانتهاء
            document.body.classList.remove('scanner-active');
            if (typeof scanner.showBackground === 'function') scanner.showBackground();
            
            if (result && result.barcodes && result.barcodes.length > 0) {
                if (typeof handleSaleQR === 'function') handleSaleQR(result.barcodes[0].rawValue);
            }
        } catch(e) {
            document.body.classList.remove('scanner-active');
            if (typeof scanner.showBackground === 'function') scanner.showBackground();
            if (e.message && !e.message.includes('cancel')) {
                alert('❌ خطأ: ' + e.message);
            }
        }
    };
    window.startMaterialQRScanner = window.startSaleQRScanner;
    console.log('✅ ML Kit + CSS Transparency Ready');
})();
