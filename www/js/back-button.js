// ============================================================
//  🔙 BACK BUTTON v3.0.0 — History API Based
//  بلا حلقات — مستحيل
// ============================================================

const HIDDEN_ON_PAGES = ['analytics', 'login', 'register', 'support-conversation'];
const HOME_PAGE = 'analytics';

let _isInited = false;
let _baseOpenPage = null;

// ═══════════════════════════════════════════════════════════
//  1. GET CURRENT PAGE
// ═══════════════════════════════════════════════════════════
function getCurrentPage() {
    const pages = document.querySelectorAll('.page');
    for (const p of pages) {
        if (p.style.display === 'block') return p.id;
    }
    return null;
}

// ═══════════════════════════════════════════════════════════
//  2. CREATE BUTTON
// ═══════════════════════════════════════════════════════════
function createBackButton() {
    if (document.getElementById('globalBackBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'globalBackBtn';
    btn.type = 'button';
    btn.title = 'رجوع';
    btn.setAttribute('aria-label', 'رجوع');
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:20px;height:20px;display:block;pointer-events:none;">
            <path d="M19 12H5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    btn.style.cssText = `
        position: fixed;
        top: 15px;
        right: 15px;
        width: 46px;
        height: 46px;
        background: rgba(255, 255, 255, 0.92);
        color: #2c3e50;
        border: 1.5px solid rgba(0, 0, 0, 0.06);
        border-radius: 14px;
        cursor: pointer;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        -webkit-tap-highlight-color: transparent;
        outline: none;
    `;

    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateX(-3px)';
        btn.style.background = '#2c3e50';
        btn.style.color = 'white';
        btn.style.boxShadow = '0 8px 22px rgba(44, 62, 80, 0.35)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateX(0)';
        btn.style.background = 'rgba(255, 255, 255, 0.92)';
        btn.style.color = '#2c3e50';
        btn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06)';
    });
    btn.addEventListener('touchstart', () => {
        btn.style.transform = 'scale(0.92)';
    }, { passive: true });
    btn.addEventListener('touchend', () => {
        btn.style.transform = 'scale(1)';
    }, { passive: true });
    
    // 🎯 الزر = history.back() مباشرة
    btn.addEventListener('click', () => {
        console.log('🔙 [back] history.back()');
        history.back();
    });
    
    document.body.appendChild(btn);
    console.log('🔙 [back-button] v3.0.0 أُنشئ');
}

// ═══════════════════════════════════════════════════════════
//  3. UPDATE VISIBILITY
// ═══════════════════════════════════════════════════════════
function updateBackButtonVisibility() {
    const btn = document.getElementById('globalBackBtn');
    if (!btn) return;
    
    const currentPage = getCurrentPage();
    if (!currentPage || HIDDEN_ON_PAGES.includes(currentPage)) {
        btn.style.display = 'none';
    } else {
        btn.style.display = 'flex';
    }
}

// ═══════════════════════════════════════════════════════════
//  4. INIT
// ═══════════════════════════════════════════════════════════
function initBackButton() {
    if (_isInited) return;
    _isInited = true;
    
    createBackButton();
    
    // احفظ openPage الأصلي
    _baseOpenPage = window.openPage;
    
    // 🎯 ضع حالة ابتدائية
    setTimeout(() => {
        const currentPage = getCurrentPage() || HOME_PAGE;
        history.replaceState({ page: currentPage }, '');
        console.log('🔙 [back] initial state:', currentPage);
    }, 1000);
    
    // 🎯 اسمع للأمام/الخلف
    window.addEventListener('popstate', (e) => {
        const page = (e.state && e.state.page) || HOME_PAGE;
        console.log('🔙 [back] popstate →', page);
        
        if (typeof _baseOpenPage === 'function') {
            _baseOpenPage(page);
        }
        setTimeout(updateBackButtonVisibility, 50);
    });
    
    // 🎯 لف openPage — يُسجّل في history
    window.openPage = function(page) {
        const current = getCurrentPage();
        
        // نسجّل فقط عند تغيير حقيقي
        if (current !== page && page) {
            console.log('➡️ [nav]', current, '→', page);
            try {
                history.pushState({ page: page }, '');
            } catch(err) {
                console.warn('[nav] pushState:', err.message);
            }
        }
        
        if (typeof _baseOpenPage === 'function') {
            _baseOpenPage(page);
        }
        setTimeout(updateBackButtonVisibility, 50);
    };
    
    // مراقبة DOM
    const observer = new MutationObserver(() => {
        updateBackButtonVisibility();
    });
    
    setTimeout(() => {
        document.querySelectorAll('.page').forEach(page => {
            observer.observe(page, { attributes: true, attributeFilter: ['style'] });
        });
    }, 1500);
    
    setTimeout(updateBackButtonVisibility, 1500);
}

// تشغيل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackButton);
} else {
    initBackButton();
}

window.goBack = () => history.back();
window.updateBackButtonVisibility = updateBackButtonVisibility;

console.log('🔙 [back-button] v3.0.0 (history) محمّل');
