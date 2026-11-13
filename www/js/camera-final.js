(function() {
    'use strict';
    window.startSaleQRScanner = async function() {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        if (!scanner) { alert('⚠️ البلوجن غير متاح.'); return; }
        try {
            const status = await scanner.checkPermission({ force: true });
            if (status.denied) { alert('🚨 يرجى السماح بالكاميرا.'); return; }
            const ui = document.createElement('div');
            ui.innerHTML = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;flex-direction:column;justify-content:center;align-items:center;background:transparent;"><div style="background:rgba(0,0,0,0.7);padding:10px;border-radius:8px;color:white;margin-bottom:20px;">وجه الكاميرا نحو الباركود</div><div style="width:280px;height:200px;border:3px solid #e67e22;border-radius:15px;box-shadow: 0 0 0 2000px rgba(0,0,0,0.5);"></div><button id="cancel-scan" style="margin-top:40px;padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:5px;">إلغاء</button></div>`;
            document.body.appendChild(ui);
            scanner.hideBackground();
            document.body.classList.add('scanner-active');
            document.getElementById('cancel-scan').onclick = async () => {
                await scanner.stopScan(); scanner.showBackground(); document.body.classList.remove('scanner-active'); ui.remove();
            };
            const result = await scanner.startScan();
            scanner.showBackground(); document.body.classList.remove('scanner-active'); ui.remove();
            if (result.hasContent) {
                if (typeof handleSaleQR === 'function') handleSaleQR(result.content);
            }
        } catch(e) {
            if (scanner) scanner.showBackground(); document.body.classList.remove('scanner-active');
            if (!e.message.includes('cancel')) alert('خطأ: ' + e.message);
        }
    };
    window.startMaterialQRScanner = window.startSaleQRScanner;
    console.log('✅ Camera Final Ready');
})();
