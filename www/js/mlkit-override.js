// 🚀 ملف تجاوز إجباري لاستخدام ML Kit فقط
(function() {
    'use strict';
    
    // دالة التجاوز للبيع
    window.startSaleQRScanner = async function() {
        alert('✅ v2.0.4-MLKIT-ONLY-OVERRIDE');
        if (typeof window.scanBarcodeNative === 'function') {
            try {
                const result = await window.scanBarcodeNative({ formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE'] });
                if (result.ok && result.barcodes && result.barcodes.length > 0) {
                    if (typeof handleSaleQR === 'function') handleSaleQR(result.barcodes[0].rawValue);
                }
            } catch(e) {
                alert('🚨 خطأ في ML Kit: ' + e.message);
            }
        } else {
            alert('⚠️ ماسح ML Kit غير متاح.');
        }
    };

    // دالة التجاوز لإضافة المواد
    window.startMaterialQRScanner = async function() {
        alert('✅ v2.0.4-MLKIT-ONLY-OVERRIDE');
        if (typeof window.scanBarcodeNative === 'function') {
            try {
                const result = await window.scanBarcodeNative({ formats: ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE'] });
                if (result.ok && result.barcodes && result.barcodes.length > 0) {
                    if (typeof handleMaterialQR === 'function') await handleMaterialQR(result.barcodes[0].rawValue);
                }
            } catch(e) {
                alert('🚨 خطأ في ML Kit: ' + e.message);
            }
        } else {
            alert('⚠️ ماسح ML Kit غير متاح.');
        }
    };

    console.log('✅ ML Kit Override Loaded Successfully');
})();
