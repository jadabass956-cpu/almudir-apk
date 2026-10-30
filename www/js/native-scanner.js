// ═══════════════════════════════════════════════════════════
//  Native Scanner — ML Kit (Capacitor 6 — Robust)
//  يعمل في APK فقط — fallback لـ html5-qrcode في المتصفح
// ═══════════════════════════════════════════════════════════

(function() {
    'use strict';

    const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    if (!IS_NATIVE) {
        console.log('🌐 [native-scanner] المتصفح — html5-qrcode');
        return;
    }

    console.log('📱 [native-scanner] APK — محاولة تحميل ML Kit...');

    // محاولات متعددة للحصول على البلوجن
    function getBarcodePlugin() {
        const Cap = window.Capacitor;
        if (!Cap) return null;

        // ① الطريقة القديمة (v4/v5) — ما زالت تعمل في بعض الحالات
        if (Cap.Plugins && Cap.Plugins.BarcodeScanner) {
            const p = Cap.Plugins.BarcodeScanner;
            if (typeof p.scan === 'function') {
                console.log('✅ [native-scanner] وُجد في Capacitor.Plugins');
                return p;
            }
        }

        // ② registerPlugin (v6) — الطريقة الرسمية
        if (typeof Cap.registerPlugin === 'function') {
            try {
                const p = Cap.registerPlugin('BarcodeScanner');
                if (p && typeof p.scan === 'function') {
                    console.log('✅ [native-scanner] وُجد عبر registerPlugin');
                    return p;
                }
                console.warn('⚠️ registerPlugin أرجع دالة بدون scan:', typeof p);
            } catch(e) {
                console.warn('⚠️ registerPlugin فشل:', e.message);
            }
        }

        // ③ محاولة Capacitor.Plugins بعد تأخير (قد يُسجَّل متأخراً)
        return null;
    }

    // نحاول كل 500ms لمدة 5 ثواني
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInitialize() {
        attempts++;
        const BarcodeScanner = getBarcodePlugin();
        
        if (BarcodeScanner && typeof BarcodeScanner.scan === 'function') {
            window.BarcodeScanner = BarcodeScanner;
            
            window.scanBarcodeNative = async function(options) {
                options = options || {};
                try {
                    const result = await BarcodeScanner.scan({
                        formats: options.formats || ['EAN_13', 'EAN_8', 'CODE_128', 'ITF', 'QR_CODE'],
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
                    console.warn('❌ [native-scanner] scan:', e.message);
                    return { ok: false, reason: e.message };
                }
            };

            // طلب إذن الكاميرا بصمت
            (async () => {
                try {
                    if (typeof BarcodeScanner.checkPermissions === 'function') {
                        const { camera } = await BarcodeScanner.checkPermissions();
                        if (camera !== 'granted') {
                            await BarcodeScanner.requestPermissions();
                        }
                    }
                } catch(e) {
                    console.warn('⚠️ [native-scanner] إذن:', e.message);
                }
            })();

            console.log('✅ [native-scanner] ML Kit جاهز — scanBarcodeNative');
            return true;
        }

        if (attempts < maxAttempts) {
            setTimeout(tryInitialize, 500);
        } else {
            console.warn('❌ [native-scanner] فشل تحميل البلوجن بعد', maxAttempts, 'محاولات');
        }
        return false;
    }

    tryInitialize();

    // Debug panel (يظهر بعد 3 ثواني)
    setTimeout(() => {
        const diag = {
            cap: typeof window.Capacitor,
            native: window.Capacitor?.isNativePlatform?.(),
            scan: typeof window.scanBarcodeNative,
            bs: typeof window.BarcodeScanner,
            bsScan: typeof window.BarcodeScanner?.scan,
            plugins: Object.keys(window.Capacitor?.Plugins || {}).length
        };
        
        const msg = `cap=${diag.cap} native=${diag.native} scan=${diag.scan} bs=${diag.bs} bsScan=${diag.bsScan} plugins=${diag.plugins}`;
        console.log('🔍 [DIAG]', msg);

        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;bottom:80px;left:10px;right:10px;background:#000;color:#0f0;padding:10px;font-size:11px;z-index:99999;border-radius:8px;font-family:monospace;direction:ltr;';
        div.textContent = msg;
        div.id = 'diag-banner';
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 60000);
    }, 3000);
})();
