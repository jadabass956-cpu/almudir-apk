(function() {
    'use strict';
    
    const startNativeScan = async function(isSale) {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        
        if (!scanner) { 
            alert('⚠️ ماسح الباركود غير متاح في هذا الإصدار.'); 
            return; 
        }

        try {
            // 1. طلب الإذن
            const status = await scanner.checkPermission({ force: true });
            if (status.denied) { 
                alert('🚨 يرجى السماح بالوصول للكاميرا من إعدادات الهاتف.'); 
                return; 
            }

            // 2. إعداد واجهة المسح (Overlay)
            const ui = document.createElement('div');
            ui.id = 'native-scanner-overlay';
            ui.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;background:transparent;';
            ui.innerHTML = `
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:280px;height:200px;border:3px solid #e67e22;border-radius:15px;box-shadow: 0 0 0 4000px rgba(0,0,0,0.6);"></div>
                <div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:10px 20px;border-radius:8px;color:white;font-size:16px;font-weight:bold;white-space:nowrap;">وجه الكاميرا نحو الباركود</div>
                <button id="native-cancel-btn" style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);padding:12px 30px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;">إلغاء</button>
            `;
            document.body.appendChild(ui);

            // 3. بدء المسح (الكاميرا ستعمل في الخلفية)
            const result = await scanner.startScan();


            // 5. ربط زر الإلغاء (إذا وجد)
            document.getElementById('native-cancel-btn').onclick = async () => {
                try {
                    await scanner.stopScan();
                } catch(err) {}
                const ui = document.getElementById('native-scanner-overlay');
                if (ui) ui.remove();
            };

            // 4. تنظيف الواجهة بعد الانتهاء
            ui.remove();

            if (result.hasContent) {
                if (isSale && typeof handleSaleQR === 'function') handleSaleQR(result.content);
                if (!isSale && typeof handleMaterialQR === 'function') await handleMaterialQR(result.content);
            }
        } catch(e) {
            const ui = document.getElementById('native-scanner-overlay');
            if (ui) ui.remove();
            if (e.message && !e.message.includes('cancel')) {
                alert('❌ خطأ في الكاميرا: ' + e.message);
            }
        }
    };

    // ربط الدوال بالأزرار في التطبيق
    window.startSaleQRScanner = () => startNativeScan(true);
    window.startMaterialQRScanner = () => startNativeScan(false);
    
    console.log('✅ ZXing Overlay Scanner Ready');
})();
