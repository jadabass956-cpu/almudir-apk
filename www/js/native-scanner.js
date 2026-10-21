// ═══════════════════════════════════════════════════════════
//  🚀 Native Scanner — ML Kit (يعمل فقط في APK)
//  في المتصفح: يُرجع null (يستخدم html5-qrcode)
// ═══════════════════════════════════════════════════════════

(function() {
    'use strict';
    
    // هل نحن في APK؟
    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    
    if (!IS_NATIVE) {
        console.log('🌐 [native-scanner] المتصفح — html5-qrcode يستخدم');
        return;
    }
    
    console.log('📱 [native-scanner] APK — ML Kit جاهز');
    
    // تحميل البلوجن
    (async function() {
        try {
            const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
            window.BarcodeScanner = BarcodeScanner;
            
            // تحقق من الإذن
            const { camera } = await BarcodeScanner.checkPermissions();
            if (camera !== 'granted') {
                await BarcodeScanner.requestPermissions();
            }
            
            // دالة موحّدة للاستخدام في الكود
            window.scanBarcodeNative = async function(options) {
                options = options || {};
                const formats = options.formats || ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE'];
                
                try {
                    const result = await BarcodeScanner.scan({
                        formats: formats,
                        autoZoom: true
                    });
                    
                    if (result && result.barcodes && result.barcodes.length > 0) {
                        return {
                            ok: true,
                            barcodes: result.barcodes.map(b => ({
                                rawValue: b.rawValue,
                                format: b.format
                            }))
                        };
                    }
                    return { ok: false, reason: 'no_barcode' };
                } catch(e) {
                    console.warn('❌ [native-scanner]', e.message);
                    return { ok: false, reason: e.message };
                }
            };
            
            console.log('✅ [native-scanner] جاهز — window.scanBarcodeNative');
        } catch(e) {
            console.warn('❌ [native-scanner] فشل تحميل:', e.message);
        }
    })();
})();
