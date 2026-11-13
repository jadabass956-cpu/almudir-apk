(function() {
    'use strict';
    const runScan = async function(isSale) {
        alert('✅ v2.1.0-REAL-MLKIT-STARTSCAN');
        if (typeof window.scanBarcodeNative === 'function') {
            try {
                const result = await window.scanBarcodeNative({ formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE'] });
                if (result.ok && result.barcodes && result.barcodes.length > 0) {
                    if (isSale && typeof handleSaleQR === 'function') handleSaleQR(result.barcodes[0].rawValue);
                    if (!isSale && typeof handleMaterialQR === 'function') await handleMaterialQR(result.barcodes[0].rawValue);
                }
            } catch(e) {
                alert('🚨 خطأ: ' + e.message);
            }
        } else {
            alert('⚠️ ماسح ML Kit غير متاح.');
        }
    };
    window.startSaleQRScanner = () => runScan(true);
    window.startMaterialQRScanner = () => runScan(false);
})();
