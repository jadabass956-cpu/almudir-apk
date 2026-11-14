(function() {
    'use strict';
    window.startSaleQRScanner = async function() {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        if (!scanner) { alert('⚠️ الماسح غير متاح.'); return; }
        
        let flashOn = false;
        let scannedItems = []; // مصفوفة لتخزين الباركودات الممسوحة

        try {
            const status = await scanner.checkPermission({ force: true });
            if (status.denied) { alert('🚨 يرجى السماح بالكاميرا.'); return; }

            // 1. إنشاء واجهة المسح المتعدد
            const ui = document.createElement('div');
            ui.id = 'zxing-overlay';
            ui.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;';
            ui.innerHTML = `
                <div style="position:absolute;top:15%;width:100%;text-align:center;color:white;font-weight:bold;text-shadow:1px 1px 3px black;">وجه الكاميرا نحو الباركود</div>
                
                <!-- عداد المسحات -->
                <div id="scan-counter" style="position:absolute;top:15%;right:20px;background:#27ae60;color:white;padding:8px 15px;border-radius:20px;font-weight:bold;font-size:18px;box-shadow:0 2px 5px rgba(0,0,0,0.3);">0</div>

                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:280px;height:200px;border:3px solid #e67e22;border-radius:15px;box-shadow:0 0 0 4000px rgba(0,0,0,0.5);"></div>
                
                <!-- أزرار التحكم -->
                <button id="zx-flash" style="position:absolute;top:40px;left:20px;width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.6);color:white;border:2px solid white;font-size:20px;">⚡</button>
                <button id="zx-finish" style="position:absolute;bottom:10%;left:50%;transform:translateX(-50%);padding:12px 30px;background:#27ae60;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;">إنهاء المسح (0)</button>
                <button id="zx-cancel" style="position:absolute;bottom:10%;right:20px;padding:12px 20px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:14px;">إلغاء</button>
            `;
            document.body.appendChild(ui);

            scanner.hideBackground();
            document.body.classList.add('scanner-active');

            // دالة تحديث العداد
            const updateCounter = () => {
                document.getElementById('scan-counter').textContent = scannedItems.length;
                document.getElementById('zx-finish').textContent = `إنهاء المسح (${scannedItems.length})`;
            };

            // بدء المسح
            const scanPromise = scanner.startScan({ continuous: true }); // تفعيل المسح المستمر

            // ربط الأزرار
            document.getElementById('zx-flash').onclick = async () => {
                try {
                    if (flashOn) {
                        await scanner.disableTorch();
                        document.getElementById('zx-flash').style.background = 'rgba(0,0,0,0.6)';
                    } else {
                        await scanner.enableTorch();
                        document.getElementById('zx-flash').style.background = '#e67e22';
                    }
                    flashOn = !flashOn;
                } catch(e) { alert('الفلاش غير مدعوم.'); }
            };

            document.getElementById('zx-finish').onclick = async () => {
                await scanner.stopScan();
                scanner.showBackground();
                document.body.classList.remove('scanner-active');
                ui.remove();
                
                // معالجة جميع الباركودات الممسوحة
                if (scannedItems.length > 0) {
                    // إضافة كل باركود إلى الفاتورة (أو تنفيذ الدالة الخاصة بك)
                    scannedItems.forEach(code => {
                        if (typeof handleSaleQR === 'function') handleSaleQR(code);
                    });
                }
            };

            document.getElementById('zx-cancel').onclick = async () => {
                await scanner.stopScan();
                scanner.showBackground();
                document.body.classList.remove('scanner-active');
                ui.remove();
            };

            // حلقة مستمرة لاستقبال الباركودات
            scanPromise.then(result => {
                if (result.hasContent) {
                    // إضافة الباركود إلى المصفوفة
                    scannedItems.push(result.content);
                    updateCounter();
                    
                    // إذا كان الباركود مكرراً، يمكنك إيقاف المسح مؤقتاً
                    // يمكنك إضافة منطق هنا لمنع التكرار
                }
            });

        } catch(e) {
            const ui = document.getElementById('zxing-overlay');
            if (ui) ui.remove();
            if (flashOn) await scanner.disableTorch().catch(()=>{});
            if (e.message && !e.message.includes('cancel')) alert('خطأ: ' + e.message);
        }
    };
    window.startMaterialQRScanner = window.startSaleQRScanner;
    console.log('✅ Multi-Scan Camera Ready');
})();
