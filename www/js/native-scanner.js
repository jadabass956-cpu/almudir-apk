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
            let isTorchOn = false;
            try {
                // 1. طلب إذن الكاميرا
                const status = await BarcodeScanner.checkPermission({ force: true });
                if (status.denied) {
                    alert('🚨 يرجى السماح للتطبيق بالوصول للكاميرا من إعدادات الهاتف.');
                    return { ok: false, reason: 'permission_denied' };
                }

                // 2. إنشاء واجهة المسح المتطورة
                uiElement = document.createElement('div');
                uiElement.innerHTML = `
                    <div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;flex-direction:column;justify-content:center;align-items:center;background:transparent;">
                        
                        <!-- أزرار التحكم العلوية -->
                        <div style="position:absolute;top:40px;display:flex;gap:20px;">
                            <button id="flash-btn" style="width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.6);color:white;border:2px solid white;font-size:24px;display:flex;justify-content:center;align-items:center;cursor:pointer;">⚡</button>
                            <button id="focus-btn" style="width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.6);color:white;border:2px solid white;font-size:24px;display:flex;justify-content:center;align-items:center;cursor:pointer;">🎯</button>
                        </div>

                        <!-- النص والإطار -->
                        <div style="background:rgba(0,0,0,0.7);padding:10px 20px;border-radius:8px;color:white;font-weight:bold;margin-bottom:20px;font-family:inherit;">وجه الكاميرا نحو الباركود</div>
                        <div style="width:280px;height:200px;border:3px solid #e67e22;border-radius:15px;box-shadow: 0 0 0 2000px rgba(0,0,0,0.5);"></div>
                        
                        <!-- زر الإلغاء -->
                        <button id="cancel-scan-btn" style="margin-top:40px;padding:12px 30px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">إلغاء</button>
                    </div>
                `;
                document.body.appendChild(uiElement);

                // 3. إخفاء خلفية الويب
                BarcodeScanner.hideBackground();
                document.body.classList.add('scanner-active');

                // 4. ربط زر الفلاش
                const flashBtn = document.getElementById('flash-btn');
                flashBtn.onclick = async (e) => {
                    e.stopPropagation();
                    try {
                        if (isTorchOn) {
                            await BarcodeScanner.disableTorch();
                            flashBtn.style.background = 'rgba(0,0,0,0.6)';
                            isTorchOn = false;
                        } else {
                            await BarcodeScanner.enableTorch();
                            flashBtn.style.background = '#e67e22'; // لون برتقالي عند التشغيل
                            isTorchOn = true;
                        }
                    } catch(err) {
                        console.warn('Flash error:', err);
                    }
                };

                // 5. ربط زر التركيز (إعادة تشغيل الكاميرا لتركيز جديد)
                const focusBtn = document.getElementById('focus-btn');
                focusBtn.onclick = async (e) => {
                    e.stopPropagation();
                    focusBtn.style.background = '#27ae60'; // أخضر عند التركيز
                    setTimeout(() => { focusBtn.style.background = 'rgba(0,0,0,0.6)'; }, 500);
                    // ZXing يستخدم التركيز التلقائي المستمر، لكن يمكننا تحفيزه
                    if (typeof BarcodeScanner.setFocusMode === 'function') {
                        await BarcodeScanner.setFocusMode('continuous');
                    }
                };

                // 6. ربط زر الإلغاء
                document.getElementById('cancel-scan-btn').onclick = async (e) => {
                    e.stopPropagation();
                    await BarcodeScanner.stopScan();
                    BarcodeScanner.showBackground();
                    document.body.classList.remove('scanner-active');
                    if (uiElement) uiElement.remove();
                };

                // 7. بدء المسح
                const result = await BarcodeScanner.startScan();

                // 8. التنظيف بعد النجاح
                if (isTorchOn) await BarcodeScanner.disableTorch();
                BarcodeScanner.showBackground();
                document.body.classList.remove('scanner-active');
                if (uiElement) uiElement.remove();

                if (result.hasContent) {
                    return { ok: true, barcodes: [{ rawValue: result.content }] };
                }
                return { ok: false, reason: 'no_barcode' };

            } catch(e) {
                if (isTorchOn) await BarcodeScanner.disableTorch().catch(()=>{});
                if (BarcodeScanner) BarcodeScanner.showBackground();
                document.body.classList.remove('scanner-active');
                if (uiElement) uiElement.remove();
                
                if (e.message !== 'Scan cancelled') {
                    alert('🚨 خطأ في الماسح:\n' + e.message);
                }
                return { ok: false, reason: e.message };
            }
        };
        console.log('✅ [native-scanner] ZXing Scanner + UI + Flash جاهز');
    } else {
        console.warn('❌ [native-scanner] البلوجن غير موجود');
    }
})();
