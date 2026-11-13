(function() {
    'use strict';
    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!IS_NATIVE) return;

    const Cap = window.Capacitor;
    let BarcodeScanner = null;

    // محاولة جلب البلوجن بكل الطرق
    if (Cap.Plugins && Cap.Plugins.BarcodeScanner) {
        BarcodeScanner = Cap.Plugins.BarcodeScanner;
    } else if (typeof Cap.registerPlugin === 'function') {
        try { BarcodeScanner = Cap.registerPlugin('BarcodeScanner'); } catch(e) {}
    }

    if (!BarcodeScanner) {
        console.warn('❌ [native-scanner] BarcodeScanner plugin not found.');
        return;
    }

    // دالة موحدة تستخدم startScan() (النموذج المدمج - لا يحتاج Google Play)
    window.scanBarcodeNative = async function(options) {
        try {
            // 1. طلب إذن الكاميرا
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

            // 2. تشغيل الكاميرا باستخدام startScan() (الحل المضمون)
            console.log('🚀 [native-scanner] جاري فتح الكاميرا بـ startScan()...');
            const result = await BarcodeScanner.startScan({
                formats: options.formats || ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE']
            });

            if (result && result.barcodes && result.barcodes.length > 0) {
                return { ok: true, barcodes: result.barcodes };
            }
            return { ok: false, reason: 'no_barcode' };

        } catch(e) {
            // إذا فشل startScan لأي سبب، نعرض الخطأ بوضوح
            alert('🚨 خطأ في كاميرا ML Kit (startScan):\n' + e.message);
            return { ok: false, reason: e.message };
        }
    };
    
    console.log('✅ [native-scanner] ML Kit (startScan mode) جاهز');
})();
