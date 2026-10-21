// ============================================================
//  📜 RESTAURANT INVOICES — سجل فواتير المطعم
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { filter: 'today', search: '' };

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function _fmt(n) {
        const v = Math.round(Number(n) || 0);
        let cur = 'SYP';
        try { cur = (typeof currentUser !== 'undefined' && currentUser?.displayCurrency) || 'SYP'; } catch(e) {}
        const label = cur === 'SYP' ? 'ل.س' : cur === 'USD' ? '$' : cur;
        return v.toLocaleString('en-US') + ' ' + label;
    }

    function _getAll() {
        const all = (typeof sales !== 'undefined' && Array.isArray(sales))
            ? sales
            : (Array.isArray(window.sales) ? window.sales : []);
        return all.filter(s => s && (s.isRestaurant === true || s.isStore === true || s.source === 'restaurant' || s.source === 'store'));
    }

    function _todayStr() {
        const n = new Date();
        return n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0');
    }

    function _applyFilters(invoices) {
        const now = new Date();
        const todayStr = _todayStr();
        const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
        const monthAgo = new Date(now.getTime() - 30*24*60*60*1000);

        let list = invoices.filter(inv => {
            const d = new Date((inv.date || '') + 'T00:00:00');
            if (_state.filter === 'today') return inv.date === todayStr;
            if (_state.filter === 'week') return !isNaN(d) && d >= weekAgo;
            if (_state.filter === 'month') return !isNaN(d) && d >= monthAgo;
            return true;
        });

        const q = (_state.search || '').trim().toLowerCase();
        if (q) {
            list = list.filter(inv => {
                return String(inv.tableNumber||'').toLowerCase().includes(q)
                    || String(inv.invoice||'').toLowerCase().includes(q)
                    || String(inv.customer||'').toLowerCase().includes(q);
            });
        }

        list.sort((a, b) => {
            const da = new Date((a.date||'') + 'T00:00:00').getTime() || 0;
            const db = new Date((b.date||'') + 'T00:00:00').getTime() || 0;
            return db - da;
        });
        return list;
    }

    function _render(container) {
        const all = _getAll();
        const list = _applyFilters(all);
        const total = list.reduce((s, x) => s + (parseFloat(x.grandTotal) || parseFloat(x.total) || 0), 0);
        const avg = list.length > 0 ? total / list.length : 0;

        const tabs = [
            { id: 'today', label: '📅 اليوم' },
            { id: 'week', label: '📆 الأسبوع' },
            { id: 'month', label: '🗓️ الشهر' },
            { id: 'all', label: '📋 الكل' }
        ];

        let listHtml = '';
        if (list.length === 0) {
            listHtml = `<div style="text-align:center;padding:40px 20px;color:#666;background:#f8f9fa;border-radius:12px;">
                <div style="font-size:48px;margin-bottom:10px;">📜</div>
                <div style="font-size:15px;font-weight:600;">لا توجد فواتير</div>
                <div style="font-size:13px;color:#999;margin-top:6px;">لم تُصدر فواتير في هذه الفترة</div>
            </div>`;
        } else {
            list.forEach(inv => {
                const items = inv.items || [];
                const itemsQty = items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
                const grand = parseFloat(inv.grandTotal) || parseFloat(inv.total) || 0;
                const isDel = inv.isDelivery === true;
                const isStore = inv.isStore === true || inv.source === 'store';
                const icon = isStore ? '🏪' : (isDel ? '🛵' : '🪑');
                const srcLabel = isStore ? ('🏪 متجر — ' + (inv.customer || 'عميل')) : (isDel ? ('توصيل' + (inv.driver ? ' — ' + inv.driver : '')) : ('طاولة ' + (inv.tableNumber || '?')));
                const borderColor = isDel ? '#e67e22' : '#3498db';

                listHtml += `
                    <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${borderColor};">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:10px;">
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:700;color:#2c3e50;font-size:15px;">${icon} ${_esc(srcLabel)}</div>
                                <div style="font-size:11px;color:#666;font-family:monospace;margin-top:3px;">${_esc(inv.invoice || '—')}</div>
                                <div style="font-size:11px;color:#888;margin-top:4px;">${_esc(inv.customer || 'زائر')} • ${_esc(inv.date || '')}</div>
                            </div>
                            <div style="text-align:left;flex-shrink:0;">
                                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:700;white-space:nowrap;">${_fmt(grand)}</div>
                                <div style="font-size:10px;color:#666;margin-top:4px;text-align:center;">${itemsQty} صنف</div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                            <button onclick="_restInvView('${_esc(inv.invoice)}')" style="padding:9px;background:#3498db;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">👁️ عرض</button>
                            <button onclick="_restInvPrint('${_esc(inv.invoice)}')" style="padding:9px;background:#34495e;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">🖨️ طباعة</button>
                        </div>
                    </div>`;
            });
        }

        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">📜 سجل فواتير المطعم</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">استعرض وأعد طباعة أي فاتورة</p>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:22px;font-weight:bold;">${list.length}</div>
                    <div style="font-size:11px;opacity:0.9;margin-top:3px;">فاتورة</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:14px;font-weight:bold;">${_fmt(total)}</div>
                    <div style="font-size:11px;opacity:0.9;margin-top:3px;">الإجمالي</div>
                </div>
                <div style="background:linear-gradient(135deg,#e67e22,#d35400);color:white;border-radius:10px;padding:12px;text-align:center;">
                    <div style="font-size:14px;font-weight:bold;">${_fmt(avg)}</div>
                    <div style="font-size:11px;opacity:0.9;margin-top:3px;">المتوسط</div>
                </div>
            </div>

            <input type="text" id="restInvSearch" placeholder="🔍 بحث (رقم طاولة / فاتورة / عميل)" value="${_esc(_state.search)}"
                oninput="_restInvSearch(this.value)"
                style="width:100%;padding:11px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;margin-bottom:10px;font-family:inherit;">

            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;">
                ${tabs.map(t => `<button onclick="_restInvFilter('${t.id}')" style="padding:8px 16px;background:${_state.filter === t.id ? '#8e44ad' : 'white'};color:${_state.filter === t.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.filter === t.id ? '#8e44ad' : '#ddd'};border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">${t.label}</button>`).join('')}
            </div>

            <div id="restInvList">${listHtml}</div>
        `;
    }

    window.openRestaurantInvoicesPage = function() {
        let cont = document.getElementById('page-restaurant-invoices');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-restaurant-invoices';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-restaurant-invoices');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    window._restInvFilter = function(f) {
        _state.filter = f;
        const c = document.getElementById('page-restaurant-invoices');
        if (c) _render(c);
    };

    window._restInvSearch = function(q) {
        _state.search = q;
        const c = document.getElementById('page-restaurant-invoices');
        if (!c) return;
        const active = document.activeElement;
        const wasSearch = active && active.id === 'restInvSearch';
        const ss = wasSearch ? active.selectionStart : 0;
        const se = wasSearch ? active.selectionEnd : 0;
        _render(c);
        if (wasSearch) {
            const n = document.getElementById('restInvSearch');
            if (n) { n.focus(); try { n.setSelectionRange(ss, se); } catch(e) {} }
        }
    };

    window._restInvPrint = function(invoice) {
        if (typeof _restPrintReceipt === 'function') {
            _restPrintReceipt(invoice);
        } else {
            alert('⚠️ دالة الطباعة غير متاحة');
        }
    };

    window._restInvView = function(invoice) {
        const inv = _getAll().find(s => s.invoice === invoice);
        if (!inv) { alert('⚠️ الفاتورة غير موجودة'); return; }

        const items = inv.items || [];
        const itemsHtml = items.map(it => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">
                <span>${_esc(it.materialName || it.name || '—')} × ${it.qty || 0}</span>
                <span style="font-weight:600;color:#27ae60;">${_fmt(it.total || (it.qty * it.unitPrice) || 0)}</span>
            </div>`).join('');

        const isDel = inv.isDelivery === true;
        const srcLabel = isDel ? ('🛵 توصيل' + (inv.driver ? ' — ' + inv.driver : '')) : ('🪑 طاولة ' + (inv.tableNumber || '?'));
        const grand = parseFloat(inv.grandTotal) || parseFloat(inv.total) || 0;
        const vat = parseFloat(inv.vat) || 0;

        const modal = document.createElement('div');
        modal.id = 'restInvViewModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;padding:20px;box-sizing:border-box;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="margin:0;font-size:18px;">${srcLabel}</h2>
                    <button onclick="document.getElementById('restInvViewModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖️</button>
                </div>
                <div style="background:#f8f9fa;border-radius:10px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:12px;color:#666;">📄 ${_esc(inv.invoice || '—')}</div>
                    <div style="font-size:12px;color:#666;margin-top:3px;">📅 ${_esc(inv.date || '')}</div>
                    <div style="font-size:12px;color:#666;margin-top:3px;">👤 ${_esc(inv.customer || 'زائر')}</div>
                </div>
                <div style="background:#f8f9fa;border-radius:10px;padding:12px;margin-bottom:12px;">
                    <h4 style="margin:0 0 8px 0;font-size:13px;">📋 الأصناف (${items.length})</h4>
                    ${itemsHtml || '<div style="color:#999;text-align:center;padding:10px;">لا توجد أصناف</div>'}
                    ${vat > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:8px;"><span>الضريبة:</span><span>${_fmt(vat)}</span></div>` : ''}
                    <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:8px;border-top:2px solid #27ae60;font-size:14px;font-weight:700;">
                        <span>الإجمالي:</span>
                        <span style="color:#27ae60;">${_fmt(grand)}</span>
                    </div>
                </div>
                <button onclick="document.getElementById('restInvViewModal').remove(); _restInvPrint('${_esc(inv.invoice)}')" style="width:100%;padding:13px;background:linear-gradient(135deg,#34495e,#2c3e50);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">🖨️ طباعة</button>
            </div>`;
        document.body.appendChild(modal);
    };

    console.log('📜 [restaurant-invoices] ready');
})();
