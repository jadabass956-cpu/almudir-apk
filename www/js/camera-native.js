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

            // 2. التحقق من وجود وحدة Google وتحميلها إذا لزم الأمر
            if (typeof scanner.isGoogleBarcodeScannerModuleAvailable === 'function') {
                const { available } = await scanner.isGoogleBarcodeScannerModuleAvailable();
                if (!available) {
                    alert('⏳ جاري تحميل وحدة المسح من Google Play... يرجى الانتظار (قد يستغرق دقيقة).');
                    await scanner.installGoogleBarcodeScannerModule();
                    alert('✅ تم تحميل الوحدة بنجاح! جاري فتح الكاميرا...');
                }
            }

            // 3. فتح الكاميرا
            const result = await scanner.scan({
                formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });
            
            // 4. معالجة النتيجة
            if (result && result.barcodes && result.barcodes.length > 0) {
                if (typeof handleSaleQR === 'function') handleSaleQR(result.barcodes[0].rawValue);
            }
        } catch(e) {
            if (e.message && !e.message.includes('cancel')) {
                alert('❌ خطأ: ' + e.message + '\n\nتأكد من اتصالك بالإنترنت ومن وجود تطبيق "خدمات Google Play" على هاتفك.');
            }
        }
    };
    
    window.startMaterialQRScanner = window.startSaleQRScanner;
    console.log('✅ Native Camera with Auto-Install Ready');
})();
