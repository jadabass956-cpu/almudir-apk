(function() {
    'use strict';
    window.startSaleQRScanner = async function() {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        if (!scanner) { alert('⚠️ الماسح غير متاح.'); return; }
        
        try {
            // 1. التحقق من الصلاحيات
            const perm = await scanner.requestPermissions();
            if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                alert('🚨 يرجى السماح بالوصول للكاميرا.');
                return;
            }
            
            // 2. تشغيل الكاميرا المدمجة (startScan)
            const result = await scanner.startScan({
                formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });
            
            // 3. عرض النتيجة
            if (result && result.barcodes && result.barcodes.length > 0) {
                if (typeof handleSaleQR === 'function') handleSaleQR(result.barcodes[0].rawValue);
            }
        } catch(e) {
            if (e.message && !e.message.includes('cancel')) {
                alert('❌ خطأ: ' + e.message);
            }
        }
    };
    window.startMaterialQRScanner = window.startSaleQRScanner;
    console.log('✅ ML Kit startScan Ready');
})();
