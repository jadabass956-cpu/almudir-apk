(function() {
    'use strict';
    
    window.startSaleQRScanner = function() {
        const readerId = 'legacy-qr-reader';
        let html5QrCode = null;
        let flashOn = false;
        let flashBtn = null;

        // 1. إنشاء واجهة المسح
        const ui = document.createElement('div');
        ui.id = 'legacy-scan-ui';
        ui.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000;display:flex;flex-direction:column;justify-content:center;align-items:center;';
        
        ui.innerHTML = `
            <div id="${readerId}" style="width:100%;max-width:400px;"></div>
            
            <!-- إطار المسح -->
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:250px;height:250px;border:3px solid #e67e22;border-radius:15px;box-shadow: 0 0 0 2000px rgba(0,0,0,0.5);pointer-events:none;"></div>
            
            <!-- زر الفلاش -->
            <button id="btn-flash-legacy" style="position:absolute;top:20%;left:20px;width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.6);color:white;border:2px solid white;font-size:22px;display:flex;justify-content:center;align-items:center;">⚡</button>
            
            <!-- زر الإلغاء -->
            <button id="btn-cancel-legacy" style="position:absolute;bottom:10%;padding:12px 30px;background:#e74c3c;color:white;border:none;border-radius:8px;font-size:16px;font-weight:bold;">إلغاء</button>
        `;
        document.body.appendChild(ui);

        // 2. تشغيل الكاميرا
        if (typeof Html5Qrcode === 'undefined') {
            alert('❌ مكتبة الكاميرا غير محملة.');
            ui.remove();
            return;
        }

        html5QrCode = new Html5Qrcode(readerId);

        html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            (text) => {
                // عند نجاح المسح
                html5QrCode.stop().then(() => {
                    ui.remove();
                    if (typeof handleSaleQR === 'function') handleSaleQR(text);
                });
            }
        ).catch(err => {
            alert('❌ تعذر فتح الكاميرا: ' + err);
            ui.remove();
        });

        // 3. زر الإلغاء
        document.getElementById('btn-cancel-legacy').onclick = () => {
            if (html5QrCode) {
                html5QrCode.stop().then(() => ui.remove());
            } else {
                ui.remove();
            }
        };

        // 4. زر الفلاش (محاولة إضافية للتحكم بالإضاءة)
        flashBtn = document.getElementById('btn-flash-legacy');
        flashBtn.onclick = async () => {
            try {
                const track = html5QrCode.getRunningTrackCapabilities ? html5QrCode.getRunningTrackCapabilities() : null;
                // في بعض المتصفحات، يكون الفلاش عبر Torch
                if (track && track.torch) {
                    flashOn = !flashOn;
                    await html5QrCode.applyVideoConstraints({ advanced: [{ torch: flashOn }] });
                    flashBtn.style.background = flashOn ? '#e67e22' : 'rgba(0,0,0,0.6)';
                } else {
                    alert('الفلاش غير مدعوم في هذه الكاميرا. يرجى استخدام إضاءة خارجية.');
                }
            } catch(e) {
                alert('الفلاش غير مدعوم في هذا الهاتف.');
            }
        };
    };
    
    window.startMaterialQRScanner = window.startSaleQRScanner;
    console.log('✅ Legacy Camera with Flash Ready');
})();
