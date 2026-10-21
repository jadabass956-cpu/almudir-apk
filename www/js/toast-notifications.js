// ============================================================
//  🎨 TOAST NOTIFICATIONS — إشعارات احترافية
// ============================================================

// ---------- إشعار نجاح كبير ----------
function showSuccessToast(opts) {
    const {
        title = 'تمت العملية بنجاح',
        details = [],       // [{icon, label, value}]
        actions = [],       // [{label, icon, onClick, style}]
        duration = 5000,
        onClose = null
    } = opts || {};

    // أزل القديم
    const old = document.getElementById('successToastBig');
    if (old) old.remove();

    // أنشئ الجديد
    const toast = document.createElement('div');
    toast.id = 'successToastBig';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-120%);
        max-width: 92%;
        width: 400px;
        background: linear-gradient(135deg, #27ae60, #229954);
        color: white;
        border-radius: 14px;
        padding: 18px;
        z-index: 2147483647;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        font-family: inherit;
        direction: rtl;
        transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        opacity: 0;
    `;

    let detailsHtml = '';
    if (details.length > 0) {
        detailsHtml = '<div style="background:rgba(255,255,255,0.15); border-radius:10px; padding:10px; margin-top:12px;">';
        details.forEach(d => {
            detailsHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; font-size:13px;">
                    <span style="opacity:0.9;">${d.icon || ''} ${d.label || ''}:</span>
                    <b style="margin-right:8px;">${d.value || '-'}</b>
                </div>`;
        });
        detailsHtml += '</div>';
    }

    let actionsHtml = '';
    if (actions.length > 0) {
        actionsHtml = '<div style="display:flex; gap:6px; margin-top:12px; flex-wrap:wrap;">';
        actions.forEach((a, idx) => {
            const bg = a.style === 'light' ? 'rgba(255,255,255,0.9)' : (a.style === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)');
            const color = a.style === 'light' ? '#27ae60' : 'white';
            actionsHtml += `<button data-action-idx="${idx}" style="flex:1; min-width:80px; padding:9px 12px; background:${bg}; color:${color}; border:1px solid rgba(255,255,255,0.3); border-radius:8px; cursor:pointer; font-size:13px; font-weight:bold; font-family:inherit;">${a.icon || ''} ${a.label || ''}</button>`;
        });
        actionsHtml += '</div>';
    }

    toast.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
            <div style="flex:1;">
                <div style="font-size:30px; line-height:1; text-align:center; margin-bottom:6px;">✅</div>
                <div style="font-size:16px; font-weight:bold; text-align:center;">${_tstEsc(title)}</div>
            </div>
            <button id="successToastClose" style="background:rgba(255,255,255,0.2); border:none; color:white; width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:16px; font-family:inherit;">✕</button>
        </div>
        ${detailsHtml}
        ${actionsHtml}
    `;

    document.body.appendChild(toast);

    // أنيميشن الظهور
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    }, 50);

    // إغلاق
    function close() {
        toast.style.transform = 'translateX(-50%) translateY(-120%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
            if (typeof onClose === 'function') onClose();
        }, 400);
    }

    document.getElementById('successToastClose').onclick = close;

    // ربط الأزرار
    toast.querySelectorAll('[data-action-idx]').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.actionIdx);
            const action = actions[idx];
            if (action && typeof action.onClick === 'function') {
                try { action.onClick(); } catch(e) { console.warn('toast action:', e); }
            }
            if (action && action.keepOpen !== true) close();
        };
    });

    // إغلاق تلقائي
    if (duration > 0) {
        setTimeout(close, duration);
    }

    return { close, element: toast };
}

// ---------- إشعار خطأ ----------
function showErrorToast(title, message, duration) {
    return showSuccessToast({
        title: title || 'حدث خطأ',
        details: message ? [{ icon: '⚠️', label: 'السبب', value: message }] : [],
        duration: duration || 6000
    });
}

// ---------- إشعار معلومات ----------
function showInfoToast(title, details, duration) {
    return showSuccessToast({
        title: title,
        details: details,
        duration: duration || 4000
    });
}

// ---------- عرض تفاصيل الفاتورة ----------
function showSaleDetailsModal(sale) {
    if (!sale) return;

    const old = document.getElementById('saleDetailsModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'saleDetailsModal';
    modal.className = 'modal-overlay show';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:2147483646; display:flex; align-items:center; justify-content:center; padding:20px;';

    const boxName = sale.paymentBox && typeof _getBoxName === 'function' ? _getBoxName(sale.paymentBox) : '-';
    const currency = sale.currency === 'USD' ? '$' : 'ل.س';
    const itemsSummary = (sale.items || []).map(i => 
        `<div style="display:flex; justify-content:space-between; padding:5px 0; font-size:12px; border-bottom:1px dashed #eee;">
            <span>${i.materialName || ''} × ${i.qty || 0}</span>
            <b>${i.total || 0} ${currency}</b>
        </div>`
    ).join('');

    modal.innerHTML = `
        <div style="background:white; border-radius:16px; padding:20px; max-width:500px; width:100%; max-height:90vh; overflow-y:auto; direction:rtl;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#2c3e50;">📄 تفاصيل الفاتورة</h3>
                <button id="closeSaleDetails" style="background:#e74c3c; color:white; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:16px;">✕</button>
            </div>

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span style="color:#666;">📄 رقم الفاتورة:</span>
                    <b>${_tstEsc(sale.invoice || '-')}</b>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span style="color:#666;">📅 التاريخ:</span>
                    <b>${_tstEsc(sale.date || '-')}</b>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span style="color:#666;">👤 العميل:</span>
                    <b>${_tstEsc(sale.customer || '-')}</b>
                </div>
            </div>

            <div style="background:#f8f9fa; border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="font-weight:bold; margin-bottom:8px; color:#2c3e50;">📦 المواد:</div>
                ${itemsSummary || '<div style="text-align:center; color:#999;">-</div>'}
            </div>

            <div style="background:#e8f5e9; border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:14px;">
                    <span>💰 الإجمالي:</span>
                    <b style="color:#27ae60;">${sale.total || 0} ${currency}</b>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px;">
                    <span>💵 المدفوع:</span>
                    <b>${sale.paid || 0} ${currency}</b>
                </div>
                ${sale.remaining > 0 ? `
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:13px; color:#e74c3c;">
                    <span>⏳ الباقي:</span>
                    <b>${sale.remaining} ${currency}</b>
                </div>` : ''}
                ${sale.vat > 0 ? `
                <div style="display:flex; justify-content:space-between; padding:4px 0; font-size:12px; color:#888;">
                    <span>💰 VAT (${sale.vatRate || 0}%):</span>
                    <b>${sale.vat} ${currency}</b>
                </div>` : ''}
            </div>

            ${sale.paymentBox ? `
            <div style="background:#fff8e1; border-radius:10px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                    <span>💳 الصندوق:</span>
                    <b>${_tstEsc(boxName)}</b>
                </div>
            </div>` : ''}

            <div style="display:flex; gap:8px;">
                <button id="closeSaleDetailsBtn" style="flex:1; padding:12px; background:#95a5a6; color:white; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:bold;">إغلاق</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    function closeModal() { modal.remove(); }
    document.getElementById('closeSaleDetails').onclick = closeModal;
    document.getElementById('closeSaleDetailsBtn').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

// ---------- مساعدة ----------
function _tstEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ═══════════════════════════════════════════════════════════════
//  🎯 دالة toast موحّدة — للاستخدام العام في المشروع
//  متوافقة مع _toast في customer-app.js
// ═══════════════════════════════════════════════════════════════
window.toast = function(msg, type) {
    type = type || 'info';
    console.log('[toast]', msg);

    try {
        let el = document.getElementById('universalToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'universalToast';
            document.body.appendChild(el);
        }

        const themes = {
            success: { bg: 'linear-gradient(135deg,#27ae60,#2ecc71)', shadow: 'rgba(39,174,96,0.4)' },
            error:   { bg: 'linear-gradient(135deg,#c0392b,#e74c3c)', shadow: 'rgba(231,76,60,0.4)' },
            warning: { bg: 'linear-gradient(135deg,#d68910,#f39c12)', shadow: 'rgba(243,156,18,0.4)' },
            info:    { bg: 'linear-gradient(135deg,#2c3e50,#34495e)', shadow: 'rgba(52,73,94,0.4)' }
        };
        const theme = themes[type] || themes.info;

        el.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%) translateY(20px);'
            + 'background:' + theme.bg + ';color:white;padding:14px 24px;border-radius:28px;'
            + 'font-size:14px;font-weight:900;font-family:inherit;z-index:2147483647;'
            + 'box-shadow:0 12px 32px ' + theme.shadow + ', 0 4px 12px rgba(0,0,0,0.2);'
            + 'opacity:0;transition:opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);'
            + 'max-width:88%;text-align:center;line-height:1.5;'
            + 'letter-spacing:-0.2px;direction:rtl;';
        el.textContent = msg;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateX(-50%) translateY(0)';
            });
        });

        clearTimeout(el._timer);
        el._timer = setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    } catch(e) {
        console.warn('[toast] error:', e);
        alert(msg);
    }
};

// 🎯 alias للتوافق مع customer-app.js
if (typeof window._toast === 'undefined') {
    window._toast = window.toast;
}

console.log('🎨 [toast-notifications] جاهز');
