// ============================================================
//  🎤 AI VOICE — المساعد الصوتي
//  Web Speech API (Speech Recognition)
//  v1.0.0
// ============================================================

(function() {
    'use strict';

    let _aiRecognition = null;
    let _aiIsListening = false;
    let _aiFinalTranscript = '';

    // ═══════════════════════════════════════════════════════════
    //  1. فحص الدعم
    // ═══════════════════════════════════════════════════════════
    function _aiVoiceSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    // ═══════════════════════════════════════════════════════════
    //  2. دوال مساعدة
    // ═══════════════════════════════════════════════════════════
    function _aiVoiceStatus(msg, color, autoHide) {
        const el = document.getElementById('aiMicStatus');
        if (!el) return;
        if (msg) {
            el.textContent = msg;
            el.style.color = color || '#667eea';
            el.style.display = 'block';
            if (autoHide) {
                clearTimeout(el._hideTimer);
                el._hideTimer = setTimeout(() => { el.style.display = 'none'; }, autoHide);
            }
        } else {
            el.style.display = 'none';
        }
    }

    function _aiVoiceUpdateBtn(state) {
        const btn = document.getElementById('aiMicBtn');
        if (!btn) return;

        btn.classList.remove('listening', 'processing');

        if (state === 'listening') {
            btn.classList.add('listening');
        } else if (state === 'processing') {
            btn.classList.add('processing');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  3. تهيئة SpeechRecognition
    // ═══════════════════════════════════════════════════════════
    function _aiInitRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return null;

        const rec = new SR();
        rec.lang = 'ar-SA';
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = function() {
            _aiIsListening = true;
            _aiFinalTranscript = '';
            _aiVoiceUpdateBtn('listening');
            _aiVoiceStatus('🎙️ جاري الاستماع... تحدث الآن', '#e74c3c');
        };

        rec.onresult = function(event) {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }
            if (final) _aiFinalTranscript = final;

            const input = document.getElementById('aiChatInput');
            if (input) {
                input.value = _aiFinalTranscript || interim;
            }
            if (interim) {
                _aiVoiceStatus('✍️ ' + interim, '#667eea');
            }
        };

        rec.onerror = function(event) {
            _aiIsListening = false;
            _aiVoiceUpdateBtn('idle');
            const err = event.error || 'unknown';
            const msgs = {
                'no-speech': '⚠️ لم يتم رصد صوت — حاول مجدداً',
                'audio-capture': '⚠️ لا يمكن الوصول للميكروفون',
                'not-allowed': '🚫 تم رفض إذن الميكروفون',
                'network': '⚠️ مشكلة في الاتصال',
                'aborted': '⚪ تم الإلغاء',
                'service-not-allowed': '🚫 الخدمة غير متاحة'
            };
            _aiVoiceStatus(msgs[err] || '❌ خطأ: ' + err, '#e74c3c', 4000);
        };

        rec.onend = function() {
            _aiIsListening = false;
            if (_aiFinalTranscript) {
                _aiVoiceUpdateBtn('processing');
                _aiVoiceStatus('✅ تم التسجيل — جاري الإرسال...', '#27ae60', 1500);
                setTimeout(() => {
                    _aiVoiceUpdateBtn('idle');
                    // 🎤 تعليم أن الإدخال صوتي — للرد بالصوت
                    window._aiLastInputWasVoice = true;
                    if (typeof sendAIMessage === 'function') {
                        sendAIMessage();
                    }
                }, 600);
            } else {
                _aiVoiceUpdateBtn('idle');
                _aiVoiceStatus('', '#666');
            }
        };

        return rec;
    }

    // ═══════════════════════════════════════════════════════════
    //  4. الدالة الرئيسية
    // ═══════════════════════════════════════════════════════════
    window.aiToggleMic = function() {
        if (!_aiVoiceSupported()) {
            _aiVoiceStatus('❌ المتصفح لا يدعم التعرف على الصوت', '#e74c3c', 4000);
            alert('⚠️ هذا المتصفح لا يدعم التعرف على الصوت.\n\nجرّب:\n• Chrome على Android\n• أو Safari على iOS 14.5+');
            return;
        }

        // إيقاف إذا كان يعمل
        if (_aiIsListening && _aiRecognition) {
            try { _aiRecognition.stop(); } catch(e) {}
            _aiVoiceStatus('⏹️ جاري الإيقاف...', '#666', 1500);
            return;
        }

        // بدء جديد
        try {
            if (!_aiRecognition) {
                _aiRecognition = _aiInitRecognition();
            }
            if (!_aiRecognition) {
                _aiVoiceStatus('❌ فشل تهيئة الميكروفون', '#e74c3c', 4000);
                return;
            }

            // مسح الحقل قبل البدء
            const input = document.getElementById('aiChatInput');
            if (input) input.value = '';

            _aiRecognition.start();
        } catch(e) {
            console.warn('[ai-voice]', e);
            _aiVoiceStatus('❌ ' + e.message, '#e74c3c', 4000);
            _aiVoiceUpdateBtn('idle');
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  5. إيقاف عند إغلاق النافذة
    // ═══════════════════════════════════════════════════════════
    const _origCloseAIChat = window.closeAIChat;
    window.closeAIChat = function() {
        if (_aiIsListening && _aiRecognition) {
            try { _aiRecognition.abort(); } catch(e) {}
        }
        _aiVoiceUpdateBtn('idle');
        _aiVoiceStatus('');
        if (typeof _origCloseAIChat === 'function') {
            _origCloseAIChat();
        }
    };

    // ═══════════════════════════════════════════════════════════
    //  6. تصدير
    // ═══════════════════════════════════════════════════════════
    window.aiVoiceSupported = _aiVoiceSupported;

    // ════════════════════════════════════════════════════════════
    //  7. TEXT-TO-SPEECH — الرد الصوتي
    // ════════════════════════════════════════════════════════════

    window._aiVoiceReplyEnabled = false;  // ⚪ معطّل — الرد الصوتي غير مفعّل حالياً
    window._aiLastInputWasVoice = false;
    window._aiIsSpeaking = false;
    let _aiCurrentUtterance = null;

    function _aiSpeakClean(text) {
        return String(text || '')
            .replace(/[*_`#~]/g, '')
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
            .replace(/[\u{2600}-\u{27BF}]/gu, '')
            .replace(/\n+/g, ' ، ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    window.aiSpeak = function(text) {
        if (!window._aiVoiceReplyEnabled) return;
        if (!('speechSynthesis' in window)) {
            console.warn('[ai-voice] speechSynthesis غير مدعوم');
            return;
        }

        try { window.speechSynthesis.cancel(); } catch(e) {}

        const clean = _aiSpeakClean(text);
        if (!clean) return;

        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = 'ar-SA';
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        try {
            const voices = window.speechSynthesis.getVoices();
            const arVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
            if (arVoice) utter.voice = arVoice;
        } catch(e) {}

        utter.onstart = () => { window._aiIsSpeaking = true; _aiVoiceUpdateSpeakBtn(); };
        utter.onend = () => { window._aiIsSpeaking = false; _aiVoiceUpdateSpeakBtn(); };
        utter.onerror = () => { window._aiIsSpeaking = false; _aiVoiceUpdateSpeakBtn(); };

        _aiCurrentUtterance = utter;
        window.speechSynthesis.speak(utter);
    };

    window.aiStopSpeaking = function() {
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
        }
        window._aiIsSpeaking = false;
        _aiVoiceUpdateSpeakBtn();
    };

    function _aiVoiceUpdateSpeakBtn() {
        const btn = document.getElementById('aiVoiceToggleBtn');
        if (!btn) return;
        if (!window._aiVoiceReplyEnabled) {
            btn.textContent = '🔇';
            btn.title = 'الرد الصوتي معطّل';
            btn.style.color = '#95a5a6';
        } else if (window._aiIsSpeaking) {
            btn.textContent = '🔊';
            btn.title = 'جاري التحدث — اضغط للإيقاف';
            btn.style.color = '#27ae60';
        } else {
            btn.textContent = '🔊';
            btn.title = 'الرد الصوتي مفعّل';
            btn.style.color = '#667eea';
        }
    }

    window.aiToggleVoiceReply = function() {
        if (window._aiVoiceReplyEnabled && window._aiIsSpeaking) {
            window.aiStopSpeaking();
            return;
        }
        window._aiVoiceReplyEnabled = !window._aiVoiceReplyEnabled;
        if (!window._aiVoiceReplyEnabled) {
            window.aiStopSpeaking();
        } else {
            try { window.aiSpeak('الرد الصوتي مفعّل'); } catch(e) {}
        }
        _aiVoiceUpdateSpeakBtn();
    };

    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.getVoices(); } catch(e) {}
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => {
                try { window.speechSynthesis.getVoices(); } catch(e) {}
            };
        }
    }

    // ════════════════════════════════════════════════════════════
    //  8. تصدير
    // ════════════════════════════════════════════════════════════
    window.aiVoiceSupported = _aiVoiceSupported;

    console.log('🎤 [ai-voice] v1.1.0 محمّل — مع TTS');
})();
