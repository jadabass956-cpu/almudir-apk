// ═══════════════════════════════════════════════════════════
//  🚀 Native Scanner — ML Kit (Capacitor 6 + registerPlugin)
//  يعمل في APK فقط — في المتصفح يستخدم html5-qrcode
// ═══════════════════════════════════════════════════════════

(function() {
    'use strict';

    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

    if (!IS_NATIVE) {
        console.log('🌐 [native-scanner] المتصفح — html5-qrcode يستخدم');
        return;
    }

    console.log('📱 [native-scanner] APK — تحميل ML Kit...');

    // Capacitor 6 — registerPlugin
    const Cap = window.Capacitor;

    if (!Cap || typeof Cap.registerPlugin !== 'function') {
        console.warn('❌ [native-scanner] Capacitor.registerPlugin غير موجود');
        return;
    }

    let BarcodeScanner;
    try {
        BarcodeScanner = Cap.registerPlugin('BarcodeScanner');
        console.log('✅ [native-scanner] BarcodeScanner مُسجَّل:', typeof BarcodeScanner);
    } catch(e) {
        console.warn('❌ [native-scanner] registerPlugin فشل:', e.message);
        return;
    }

    if (!BarcodeScanner) {
        console.warn('❌ [native-scanner] BarcodeScanner null');
        return;
    }

    // نتحقق من توفر الدوال
    console.log('🔍 [native-scanner] scan:', typeof BarcodeScanner.scan);
    console.log('🔍 [native-scanner] checkPermissions:', typeof BarcodeScanner.checkPermissions);

    if (typeof BarcodeScanner.scan !== 'function') {
        console.warn('❌ [native-scanner] BarcodeScanner.scan غير موجود — البلوجن غير محمّل في APK');
        return;
    }

    window.BarcodeScanner = BarcodeScanner;

    // دالة موحّدة
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
            console.warn('❌ [native-scanner] scan فشل:', e.message);
            return { ok: false, reason: e.message };
        }
    };

    // طلب إذن الكاميرا
    (async function requestCameraPermission() {
        try {
            if (typeof BarcodeScanner.checkPermissions === 'function') {
                const { camera } = await BarcodeScanner.checkPermissions();
                console.log('📷 [native-scanner] إذن الكاميرا الحالي:', camera);
                if (camera !== 'granted') {
                    const result = await BarcodeScanner.requestPermissions();
                    console.log('📷 [native-scanner] طلب إذن:', result.camera);
                }
            }
        } catch(e) {
            console.warn('⚠️ [native-scanner] إذن الكاميرا:', e.message);
        }
    })();

    console.log('✅ [native-scanner] جاهز — window.scanBarcodeNative');

    // Debug panel
    setTimeout(() => {
        const _diag = {
            cap: typeof window.Capacitor,
            native: window.Capacitor?.isNativePlatform?.(),
            scan: typeof window.scanBarcodeNative,
            bs: typeof window.BarcodeScanner,
            bs_scan: typeof (window.BarcodeScanner?.scan)
        };

        const _msg = `cap=${_diag.cap} native=${_diag.native} scan=${_diag.scan} bs=${_diag.bs} bs.scan=${_diag.bs_scan}`;
        console.log('🔍 [DIAG]', _msg);

        const _debugDiv = document.createElement('div');
        _debugDiv.style.cssText = 'position:fixed;bottom:80px;left:10px;right:10px;background:#000;color:#0f0;padding:10px;font-size:11px;z-index:99999;border-radius:8px;font-family:monospace;';
        _debugDiv.textContent = _msg;
        _debugDiv.id = 'diag-banner';
        document.body.appendChild(_debugDiv);

        setTimeout(() => _debugDiv.remove(), 30000);
    }, 3000);
})();
