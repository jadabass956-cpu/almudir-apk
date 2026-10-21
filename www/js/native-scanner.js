// ═══════════════════════════════════════════════════════════
//  🚀 Native Scanner — ML Kit (فحص وتشخيص)
// ═══════════════════════════════════════════════════════════

(function() {
    'use strict';

    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

    if (!IS_NATIVE) {
        console.log('🌐 [native-scanner] المتصفح — html5-qrcode يستخدم');
        return;
    }

    console.log('📱 [native-scanner] APK — تحميل ML Kit...');

    const Cap = window.Capacitor;
    
    // 1) محاولة جلب البلوجن
    let BarcodeScanner = Cap?.Plugins?.BarcodeScanner;
    
    if (!BarcodeScanner && typeof Cap?.registerPlugin === 'function') {
        try {
            BarcodeScanner = Cap.registerPlugin('BarcodeScanner');
        } catch(e) {}
    }

    if (BarcodeScanner && typeof BarcodeScanner.scan === 'function') {
        window.scanBarcodeNative = async function(options) {
            const result = await BarcodeScanner.scan({ formats: ['EAN_13', 'CODE_128', 'QR_CODE'] });
            return { ok: true, barcodes: result.barcodes };
        };
        console.log('✅ [native-scanner] ML Kit جاهز!');
    } else {
        console.warn('❌ [native-scanner] البلوجن غير مسجل في الجافاسكريبت');
    }

    // 2) إظهار التشخيص في الشريط الأسود
    setTimeout(() => {
        // محاولة قراءة ملف الإعدادات الخاص بـ Capacitor
        fetch('capacitor.plugins.json')
            .then(r => r.json())
            .then(plugins => {
                const hasBarcode = plugins.some(p => p.pkg.includes('barcode'));
                const _msg = `Plugins: ${plugins.length} | Barcode: ${hasBarcode ? '✅ YES' : '❌ NO'} | Scan: ${typeof window.scanBarcodeNative}`;
                showDebug(_msg);
            })
            .catch(e => showDebug(`Fetch Error: ${e.message}`));
    }, 3000);

    function showDebug(msg) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;bottom:80px;left:10px;right:10px;background:#000;color:#0f0;padding:10px;font-size:12px;z-index:99999;border-radius:8px;font-family:monospace;direction:ltr;text-align:left;';
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 40000);
    }
})();
