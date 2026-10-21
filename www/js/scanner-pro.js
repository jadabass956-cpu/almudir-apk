// ============================================================
//  📷 SCANNER PRO — ماسح باركود احترافي (مستمر)
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    let _scanner = null;
    let _isRunning = false;
    let _audioCtx = null;
    let _scanCount = 0;
    let _lastBarcode = '';
    let _lastScanTime = 0;
    let _isProcessing = false;
    let _foundCount = 0;
    let _missCount = 0;

    const DUPLICATE_GUARD_MS = 900;

    // ═══ الصوت ═══
    function _initAudio() {
        if (_audioCtx) return _audioCtx;
        try {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) { console.warn('[scanner] audio:', e); }
        return _audioCtx;
    }

    function _beep(freq, dur, vol) {
        const ctx = _initAudio();
        if (!ctx) return;
        try {
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            const volume = vol || 0.7;
            // موجتان لصوت أقوى (Square + Sine)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            const comp = ctx.createDynamicsCompressor();

            osc1.type = 'square';
            osc1.frequency.value = freq;
            osc2.type = 'sine';
            osc2.frequency.value = freq;

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(comp);
            comp.connect(ctx.destination);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.008);
            gain.gain.setValueAtTime(volume, now + (dur || 0.15) - 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (dur || 0.15));

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + (dur || 0.15));
            osc2.stop(now + (dur || 0.15));
        } catch(e) {}
    }

    function _beepOK() {
        // نغمة ثلاثية قوية وواضحة
        _beep(1200, 0.12, 0.85);
        setTimeout(() => _beep(1600, 0.10, 0.75), 90);
        setTimeout(() => _beep(2000, 0.14, 0.65), 180);
    }

    function _beepErr() {
        // نغمة خطأ منخفضة وطويلة
        _beep(180, 0.35, 0.9);
        setTimeout(() => _beep(150, 0.25, 0.8), 200);
    }

    function _vibrate(pattern) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern || 70); } catch(e) {}
        }
    }

    // ═══ Toast مصغّر ═══
    function _miniToast(text, color) {
        const old = document.getElementById('scannerMiniToast');
        if (old) old.remove();

        if (!document.getElementById('scannerAnimStyle')) {
            const style = document.createElement('style');
            style.id = 'scannerAnimStyle';
            style.textContent = '@keyframes scanSlide { from { opacity: 0; transform: translate(-50%, -15px); } to { opacity: 1; transform: translate(-50%, 0); } }';
            document.head.appendChild(style);
        }

        const toast = document.createElement('div');
        toast.id = 'scannerMiniToast';
        toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:' + (color || '#27ae60') + ';color:white;padding:10px 20px;border-radius:12px;font-family:inherit;font-size:14px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,0.3);z-index:2147483640;max-width:90vw;box-sizing:border-box;text-align:center;animation:scanSlide 0.25s ease-out;';
        toast.textContent = text;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.25s';
                setTimeout(() => toast.remove(), 250);
            }
        }, 1800);
    }

    // ═══ بناء الواجهة ═══
    function _buildOverlay() {
        const old = document.getElementById('scannerProOverlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'scannerProOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2147483639;display:flex;flex-direction:column;';

        overlay.innerHTML = `
            <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:white;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
                <div>
                    <div style="font-size:16px;font-weight:700;">📷 ماسح الباركود</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:3px;">وجّه الكاميرا — تُضاف تلقائياً</div>
                </div>
                <button onclick="closeScannerPro()" style="background:rgba(255,255,255,0.15);border:none;width:42px;height:42px;border-radius:50%;color:white;font-size:18px;cursor:pointer;font-weight:bold;">✖</button>
            </div>

            <div id="scannerProReader" style="flex:1;background:#000;overflow:hidden;position:relative;"></div>

            <div style="background:#1a1a2e;color:white;padding:12px 18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;flex-shrink:0;border-top:2px solid #27ae60;">
                <div style="text-align:center;">
                    <div id="scannerCount" style="font-size:22px;font-weight:700;color:#27ae60;line-height:1;">0</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:4px;">📊 مسحات</div>
                </div>
                <div style="text-align:center;">
                    <div id="scannerFound" style="font-size:22px;font-weight:700;color:#3498db;line-height:1;">0</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:4px;">✅ مضافة</div>
                </div>
                <div style="text-align:center;">
                    <div id="scannerMiss" style="font-size:22px;font-weight:700;color:#e74c3c;line-height:1;">0</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:4px;">❌ غير موجودة</div>
                </div>
            </div>

            <div style="background:#16213e;padding:10px 18px;text-align:center;flex-shrink:0;">
                <div id="scannerStatus" style="font-size:12px;color:#94a3b8;">📸 جاري تحضير الكاميرا...</div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    // ═══ تحديث العدادات ═══
    function _updateStats() {
        const c = document.getElementById('scannerCount');
        const f = document.getElementById('scannerFound');
        const m = document.getElementById('scannerMiss');
        if (c) c.textContent = _scanCount;
        if (f) f.textContent = _foundCount;
        if (m) m.textContent = _missCount;
    }

    function _setStatus(text, color) {
        const el = document.getElementById('scannerStatus');
        if (el) {
            el.textContent = text;
            el.style.color = color || '#94a3b8';
        }
    }

    // ═══ بدء الماسح ═══
    async function _startScanner() {
        // ✅ Retry ذكي — انتظر تحميل المكتبة حتى 5 ثوانٍ
        if (typeof Html5Qrcode === 'undefined') {
            _setStatus('⏳ جاري تحميل المكتبة...', '#f39c12');
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 500));
                if (typeof Html5Qrcode !== 'undefined') break;
            }
            if (typeof Html5Qrcode === 'undefined') {
                _setStatus('⚠️ مكتبة المسح غير محملة', '#e74c3c');
                return;
            }
        }
        try {
            _scanner = new Html5Qrcode('scannerProReader', { verbose: false });
            await _scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 15,
                    qrbox: { width: 280, height: 180 },
                    aspectRatio: 1.0,
                    disableFlip: false
                },
                (decodedText) => { _onScanSuccess(decodedText); },
                () => {}
            );
            _isRunning = true;
            _setStatus('📸 جاهز — امسح الباركود', '#27ae60');
        } catch(e) {
            console.error('[scanner] start:', e);
            _setStatus('❌ ' + (e.message || e), '#e74c3c');
        }
    }

    // ═══ نجاح المسح ═══
    function _onScanSuccess(text) {
        if (_isProcessing) return;

        const barcode = String(text || '').trim();
        if (!barcode) return;

        // منع نفس المسحة المتكررة بسرعة
        const now = Date.now();
        if (barcode === _lastBarcode && (now - _lastScanTime) < DUPLICATE_GUARD_MS) {
            return;
        }
        _lastBarcode = barcode;
        _lastScanTime = now;

        _isProcessing = true;
        _scanCount++;
        _updateStats();

        try {
            _processBarcode(barcode);
        } finally {
            setTimeout(() => { _isProcessing = false; }, 150);
        }
    }

    // ═══ معالجة الباركود ═══
    function _processBarcode(barcode) {
        // ① ابحث في materials (المتغير العام)
        let material = null;
        try {
            const list = (typeof materials !== 'undefined' && Array.isArray(materials)) ? materials : [];
            material = list.find(m => String(m.barcode || '').trim() === barcode);
        } catch(e) { console.warn('[scanner] lookup:', e); }

        if (!material) {
            // ❌ غير موجود
            _missCount++;
            _updateStats();
            _beepErr();
            _vibrate([100, 50, 100]);
            _miniToast('❌ غير موجود: ' + barcode.slice(0, 12), '#e74c3c');
            _setStatus('❌ المادة غير موجودة — أضفها من "المواد"', '#e74c3c');
            setTimeout(() => _setStatus('📸 جاهز — امسح الباركود', '#27ae60'), 2000);
            return;
        }

        // ② أضف للفاتورة
        try {
            _addMaterialToInvoice(material);
            _foundCount++;
            _updateStats();
            _beepOK();
            _vibrate(60);

            const price = _getMaterialPrice(material);
            _miniToast('✅ ' + (material.name || 'مادة') + ' — ' + price.toLocaleString() + ' ل.س', '#27ae60');
            _setStatus('✅ ' + (material.name || 'مادة'), '#27ae60');
            setTimeout(() => _setStatus('📸 جاهز — امسح الباركود', '#27ae60'), 1200);
        } catch(e) {
            console.error('[scanner] add:', e);
            _beepErr();
            _miniToast('❌ خطأ في الإضافة', '#e74c3c');
        }
    }

    // ═══ سعر المادة حسب العملة/النوع ═══
    function _getMaterialPrice(material) {
        try {
            const currency = (typeof window.pendingInvoiceData !== 'undefined' && window.pendingInvoiceData?.currency) || 'SYP';
            const ptEl = document.querySelector('input[name="salePriceType"]:checked');
            const pt = ptEl ? ptEl.value : 'retail';

            if (currency === 'USD') {
                if (pt === 'wholesale' && material.wholesaleUSD) return Number(material.wholesaleUSD) || 0;
                return Number(material.saleUSD) || 0;
            }
            if (pt === 'wholesale' && material.wholesaleSYP) return Number(material.wholesaleSYP) || 0;
            return Number(material.saleSYP) || 0;
        } catch(e) { return 0; }
    }

    // ═══ إضافة مادة للفاتورة ═══
    function _addMaterialToInvoice(material) {
        if (typeof invoiceItems === 'undefined' || !Array.isArray(invoiceItems)) {
            throw new Error('invoiceItems غير متاح');
        }

        const currency = (typeof window.pendingInvoiceData !== 'undefined' && window.pendingInvoiceData?.currency) || 'SYP';
        const unitPrice = _getMaterialPrice(material);
        const costAtSale = currency === 'USD' ? (Number(material.costUSD) || 0) : (Number(material.costSYP) || 0);
        const qty = 1;
        const matId = material.id;

        // إذا موجود → زد الكمية
        const existing = invoiceItems.find(it => Number(it.materialId) === Number(matId));
        if (existing) {
            existing.qty += qty;
            existing.total = existing.qty * existing.unitPrice;
            existing.profit = (existing.unitPrice - (existing.costAtSale || 0)) * existing.qty;
        } else {
            invoiceItems.push({
                materialId: parseInt(matId),
                materialName: material.name || '—',
                costAtSale: costAtSale,
                materialType: material.type || '',
                qty: qty,
                unit: material.unit || '',
                unitPrice: unitPrice,
                total: qty * unitPrice,
                profit: (unitPrice - costAtSale) * qty
            });
        }

        // تحديث الجدول والإجمالي
        if (typeof renderInvoiceItems === 'function') renderInvoiceItems();
        if (typeof calcTotal === 'function') calcTotal();
    }

    // ═══ فتح الماسح (عام) ═══
    window.openScannerPro = async function() {
        if (_isRunning) return;

        _scanCount = 0;
        _foundCount = 0;
        _missCount = 0;
        _lastBarcode = '';
        _lastScanTime = 0;
        _isProcessing = false;

        _buildOverlay();
        _updateStats();

        // تأخير صغير لضمان جاهزية الـ DOM
        setTimeout(() => { _startScanner(); }, 250);
    };

    // ═══ إغلاق الماسح ═══
    window.closeScannerPro = async function() {
        try {
            if (_scanner) {
                try { await _scanner.stop(); } catch(e) {}
                try { _scanner.clear(); } catch(e) {}
                _scanner = null;
            }
        } catch(e) {}
        _isRunning = false;

        const overlay = document.getElementById('scannerProOverlay');
        if (overlay) overlay.remove();

        document.body.classList.remove('qr-open');

        // رسالة إغلاق
        const total = _foundCount;
        if (total > 0) {
            _miniToast('✅ أُضيف ' + total + ' منتج', '#27ae60');
        }
    };

    // ═══ ربط زر المسح القديم بالجديد ═══
    // نحتفظ بالقديم كـ fallback لكن نستبدل الوظيفة
    window._originalStartSaleQRScanner = window.startSaleQRScanner;
    window.startSaleQRScanner = function() {
        if (typeof window.openScannerPro === 'function') {
            window.openScannerPro();
        } else if (typeof window._originalStartSaleQRScanner === 'function') {
            window._originalStartSaleQRScanner();
        }
    };

    console.log('📷 [scanner-pro] ready');
})();
