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
                // 1. طلب الإذن
                const status = await BarcodeScanner.checkPermission({ force: true });
                if (status.denied) {
                    alert('🚨 يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات الهاتف.');
                    return { ok: false, reason: 'permission_denied' };
                }

                // 2. تجهيز الشاشة للكاميرا
                document.body.classList.add('scanner-active');
                document.body.style.backgroundColor = 'transparent';
                
                // إخفاء الواجهة (اختياري - لجعل الكاميرا واضحة)
                const appRoot = document.querySelector('#app') || document.body;
                appRoot.style.visibility = 'hidden';

                // 3. تشغيل الماسح
                const result = await BarcodeScanner.startScan();

                // 4. إعادة الواجهة بعد الانتهاء
                document.body.classList.remove('scanner-active');
                document.body.style.backgroundColor = '';
                appRoot.style.visibility = 'visible';

                if (result.hasContent) {
                    return { ok: true, barcodes: [{ rawValue: result.content }] };
                }
                return { ok: false, reason: 'no_barcode' };

            } catch(e) {
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
