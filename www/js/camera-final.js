(function() {
    'use strict';
    window.startSaleQRScanner = async function() {
        const Cap = window.Capacitor;
        const scanner = Cap && Cap.Plugins ? Cap.Plugins.BarcodeScanner : null;
        if (!scanner) { alert('⚠️ الماسح غير متاح.'); return; }
        try {
            const result = await scanner.scanBarcode({
                hint: 17, // ALL formats
                scanInstructions: 'وجه الكاميرا نحو الباركود',
                scanButton: true,
                scanText: 'مسح',
                cameraDirection: 1, // BACK
                scanOrientation: 1 // PORTRAIT
            });
            if (result && result.ScanResult) {
                if (typeof handleSaleQR === 'function') handleSaleQR(result.ScanResult);
            }
        } catch(e) {
            if (e.message && !e.message.includes('cancel')) alert('خطأ: ' + e.message);
        }
    };
    window.startMaterialQRScanner = window.startSaleQRScanner;
})();
