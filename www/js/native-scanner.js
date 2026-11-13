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
                const status = await BarcodeScanner.checkPermission({ force: true });
                if (status.denied) {
                    alert('🚨 يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات الهاتف.');
                    return { ok: false, reason: 'permission_denied' };
                }

                // 2. إخفاء خلفية الويب لتظهر الكاميرا
                BarcodeScanner.hideBackground();
                document.body.classList.add('scanner-active');
                document.body.style.backgroundColor = 'transparent';

                // 3. بدء المسح
                const result = await BarcodeScanner.startScan();

                // 4. استعادة الواجهة
                BarcodeScanner.showBackground();
                document.body.classList.remove('scanner-active');
                document.body.style.backgroundColor = '';

                if (result.hasContent) {
                    return { ok: true, barcodes: [{ rawValue: result.content }] };
                }
                return { ok: false, reason: 'no_barcode' };

            } catch(e) {
                BarcodeScanner.showBackground();
                document.body.classList.remove('scanner-active');
                document.body.style.backgroundColor = '';
                alert('🚨 خطأ في الماسح:\n' + e.message);
                return { ok: false, reason: e.message };
            }
        };
        console.log('✅ [native-scanner] ZXing Scanner جاهز');
    } else {
        console.warn('❌ [native-scanner] البلوجن غير موجود');
    }
})();
