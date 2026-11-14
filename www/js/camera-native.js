(function() {
    'use strict';
    
    window.startSaleQRScanner = async function() {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        if (!scanner) { alert('⚠️ الماسح غير متاح.'); return; }
        
        try {
            // 1. طلب الأذونات
            const perm = await scanner.requestPermissions();
            if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                alert('🚨 يرجى السماح بالوصول للكاميرا.');
                return;
            }

            // 2. فتح الكاميرا (النشاط المنفصل)
            alert('⏳ سيتم فتح الكاميرا...');
            const result = await scanner.scan({
                formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });
            
            // 3. معالجة النتيجة
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
    console.log('✅ Native Camera Ready');
})();
