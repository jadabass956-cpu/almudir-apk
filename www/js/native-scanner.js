(function() {
    'use strict';
    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!IS_NATIVE) return;

    const Cap = window.Capacitor;
    const BarcodeScanner = Cap.Plugins.BarcodeScanner;

    if (BarcodeScanner) {
        window.BarcodeScanner = BarcodeScanner;

        window.scanBarcodeNative = async function(options) {
            try {
                // 1. طلب إذن الكاميرا
                const perm = await BarcodeScanner.requestPermissions();
                if (perm.camera !== 'granted' && perm.camera !== 'limited') {
                    alert('🚨 يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات الهاتف.');
                    return { ok: false, reason: 'permission_denied' };
                }

                // 2. بدء المسح
                const result = await BarcodeScanner.scanBarcode({
                    formats: options.formats || ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
                });

                if (result && result.barcodes && result.barcodes.length > 0) {
                    return { ok: true, barcodes: result.barcodes };
                }
                return { ok: false, reason: 'no_barcode' };

            } catch(e) {
                alert('🚨 خطأ في الماسح:\n' + e.message);
                return { ok: false, reason: e.message };
            }
        };
        console.log('✅ [native-scanner] Capacitor Barcode Scanner جاهز');
    } else {
        console.warn('❌ [native-scanner] البلوجن غير موجود');
    }
})();
