(function() {
    'use strict';
    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!IS_NATIVE) return;

    const Cap = window.Capacitor;
    let BarcodeScanner = null;

    if (Cap.Plugins && Cap.Plugins.BarcodeScanner) {
        BarcodeScanner = Cap.Plugins.BarcodeScanner;
    } else if (typeof Cap.registerPlugin === 'function') {
        try { BarcodeScanner = Cap.registerPlugin('BarcodeScanner'); } catch(e) {}
    }

    if (BarcodeScanner) {
        window.BarcodeScanner = BarcodeScanner;
        
        window.scanBarcodeNative = async function(options) {
            try {
                // 1. التحقق من وجود وحدة جوجل وتحميلها إذا لزم الأمر
                if (typeof BarcodeScanner.isGoogleBarcodeScannerModuleAvailable === 'function') {
                    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
                    if (!available) {
                        alert('⏳ جاري تحميل وحدة مسح الباركود من Google Play. يرجى الانتظار...');
                        await BarcodeScanner.installGoogleBarcodeScannerModule();
                        alert('✅ تم تحميل الوحدة بنجاح! جاري فتح الكاميرا...');
                    }
                }

                // 2. طلب إذن الكاميرا
                if (typeof BarcodeScanner.checkPermissions === 'function') {
                    const perm = await BarcodeScanner.checkPermissions();
                    if (perm.camera !== 'granted') {
                        const req = await BarcodeScanner.requestPermissions();
                        if (req.camera !== 'granted') {
                            alert('🚨 يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات الهاتف.');
                            return { ok: false, reason: 'permission_denied' };
                        }
                    }
                }

                // 3. فتح الكاميرا
                const result = await BarcodeScanner.scan({
                    formats: options.formats || ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
                });

                if (result && result.barcodes && result.barcodes.length > 0) {
                    return { ok: true, barcodes: result.barcodes };
                }
                return { ok: false, reason: 'no_barcode' };

            } catch(e) {
                alert('🚨 خطأ في ML Kit:\n' + e.message);
                return { ok: false, reason: e.message };
            }
        };
        console.log('✅ [native-scanner] ML Kit جاهز');
    }
})();
