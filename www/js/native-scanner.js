(function() {
    'use strict';
    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!IS_NATIVE) return;

    const Cap = window.Capacitor;
    const BarcodeScanner = Cap.Plugins.BarcodeScanner;

    if (BarcodeScanner) {
        window.BarcodeScanner = BarcodeScanner;

        window.scanBarcodeNative = async function(options) {
            let uiElement = null;
            try {
                // 1. طلب إذن الكاميرا
                const status = await BarcodeScanner.checkPermission({ force: true });
                if (status.denied) {
                    alert('🚨 يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات الهاتف.');
                    return { ok: false, reason: 'permission_denied' };
                }

                // 2. إنشاء واجهة المسح (إطار + زر إلغاء)
                uiElement = document.createElement('div');
                uiElement.innerHTML = `
                    <div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;flex-direction:column;justify-content:center;align-items:center;background:transparent;">
                        <div style="background:rgba(0,0,0,0.7);padding:10px 20px;border-radius:8px;color:white;font-weight:bold;margin-bottom:20px;font-family:inherit;">وجه الكاميرا نحو الباركود</div>
                        <div style="width:280px;height:200px;border:3px solid #e67e22;border-radius:15px;box-shadow: 0 0 0 2000px rgba(0,0,0,0.6);"></div>
                        <button id="cancel-scan-btn" style="margin-top:40px;padding:12px 30px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">إلغاء</button>
                    </div>
                `;
                document.body.appendChild(uiElement);

                // 3. إخفاء خلفية الويب لتظهر الكاميرا
                BarcodeScanner.hideBackground();
                document.body.classList.add('scanner-active');

                // 4. ربط زر الإلغاء
                document.getElementById('cancel-scan-btn').onclick = async () => {
                    await BarcodeScanner.stopScan();
                    BarcodeScanner.showBackground();
                    document.body.classList.remove('scanner-active');
                    if (uiElement) uiElement.remove();
                };

                // 5. بدء المسح
                const result = await BarcodeScanner.startScan();

                // 6. استعادة الواجهة عند النجاح
                BarcodeScanner.showBackground();
                document.body.classList.remove('scanner-active');
                if (uiElement) uiElement.remove();

                if (result.hasContent) {
                    return { ok: true, barcodes: [{ rawValue: result.content }] };
                }
                return { ok: false, reason: 'no_barcode' };

            } catch(e) {
                // استعادة الواجهة في حالة حدوث خطأ
                if (BarcodeScanner) BarcodeScanner.showBackground();
                document.body.classList.remove('scanner-active');
                if (uiElement) uiElement.remove();
                
                if (e.message !== 'Scan cancelled') {
                    alert('🚨 خطأ في الماسح:\n' + e.message);
                }
                return { ok: false, reason: e.message };
            }
        };
        console.log('✅ [native-scanner] ZXing Scanner + UI جاهز');
    } else {
        console.warn('❌ [native-scanner] البلوجن غير موجود');
    }
})();
