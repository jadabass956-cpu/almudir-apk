// ============================================================
//  📜 EXCHANGE HISTORY — سجل سعر الصرف التاريخي
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function _fmtRate(n) {
        return (Number(n) || 0).toFixed(2) + ' ل.س';
    }

    function _timeAgo(ts) {
        if (typeof window._fmtHistoryDate === 'function') {
            return window._fmtHistoryDate(ts);
        }
        return new Date(ts).toLocaleString('ar-SY');
    }

    window._openExchangeHistory = function() {
        _renderExchangeHistory();
    };

    window._renderExchangeHistory = function() {
        const old = document.getElementById('exchangeHistoryModal');
        if (old) old.remove();

        const history = (typeof getExchangeRateHistory === 'function') ? getExchangeRateHistory() : [];
        const current = (typeof getExchangeRate === 'function') ? getExchangeRate() : 0;

        // إحصائيات
        const stats = _computeStats(history, current);

        let listHtml = '';
        if (history.length === 0) {
            listHtml = `
                <div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">📜</div>
                    <div style="font-size:14px;font-weight:600;">لا يوجد سجل بعد</div>
                    <div style="font-size:12px;color:#999;margin-top:6px;">سيظهر السجل عند تغيير سعر الصرف</div>
                </div>`;
        } else {
            history.forEach((h, idx) => {
                listHtml += _renderRow(h, idx, current);
            });
        }

        const modal = document.createElement('div');
        modal.id = 'exchangeHistoryModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;box-sizing:border-box;';
        modal.innerHTML = `
            <div style="background:#f8f9fa;border-radius:16px;max-width:520px;width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#8e44ad,#6c3483);color:white;padding:16px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h2 style="margin:0;font-size:17px;">📜 سجل سعر الصرف</h2>
                        <div style="font-size:11px;opacity:0.9;margin-top:3px;">${history.length} تغيير مسجل</div>
                    </div>
                    <button onclick="document.getElementById('exchangeHistoryModal').remove()" style="background:rgba(255,255,255,0.2);border:none;width:36px;height:36px;border-radius:50%;color:white;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>

                <div style="padding:14px;background:white;">
                    <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:12px;padding:14px;text-align:center;margin-bottom:12px;">
                        <div style="font-size:11px;opacity:0.9;">💱 السعر الحالي</div>
                        <div style="font-size:24px;font-weight:700;margin-top:4px;">${_fmtRate(current)}</div>
                    </div>

                    ${stats.total > 0 ? `
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">
                            <div style="background:#e3f2fd;border-radius:8px;padding:8px;text-align:center;">
                                <div style="font-size:16px;font-weight:700;color:#0d47a1;">${stats.total}</div>
                                <div style="font-size:10px;color:#555;">📊 تغيير</div>
                            </div>
                            <div style="background:#e8f5e9;border-radius:8px;padding:8px;text-align:center;">
                                <div style="font-size:12px;font-weight:700;color:#1b5e20;">${stats.up}</div>
                                <div style="font-size:10px;color:#555;">📈 ارتفاع</div>
                            </div>
                            <div style="background:#ffebee;border-radius:8px;padding:8px;text-align:center;">
                                <div style="font-size:12px;font-weight:700;color:#b71c1c;">${stats.down}</div>
                                <div style="font-size:10px;color:#555;">📉 انخفاض</div>
                            </div>
                        </div>
                    ` : ''}

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <h3 style="margin:0;font-size:13px;color:#2c3e50;">📋 السجل</h3>
                        ${history.length > 0 ? `<button onclick="clearExchangeRateHistory()" style="padding:6px 12px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">🗑️ حذف الكل</button>` : ''}
                    </div>

                    <div style="max-height:45vh;overflow-y:auto;">${listHtml}</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    function _computeStats(history, current) {
        const stats = { total: history.length, up: 0, down: 0, avg: 0, min: 0, max: 0 };
        if (history.length === 0) return stats;

        let sum = 0;
        let min = Infinity;
        let max = 0;
        history.forEach(h => {
            if (h.rate > h.previousRate) stats.up++;
            else if (h.rate < h.previousRate) stats.down++;
            sum += Number(h.rate) || 0;
            min = Math.min(min, Number(h.rate) || 0);
            max = Math.max(max, Number(h.rate) || 0);
        });
        stats.avg = sum / history.length;
        stats.min = min === Infinity ? 0 : min;
        stats.max = max;
        return stats;
    }

    function _renderRow(h, idx, current) {
        const change = (typeof window._calcChange === 'function') ? window._calcChange(h.previousRate, h.rate) : null;
        let changeBadge = '';
        let color = '#666';

        if (change) {
            if (change.direction === 'up') {
                changeBadge = `<span style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">📈 +${change.pct.toFixed(1)}%</span>`;
                color = '#c62828';
            } else if (change.direction === 'down') {
                changeBadge = `<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">📉 ${change.pct.toFixed(1)}%</span>`;
                color = '#2e7d32';
            } else {
                changeBadge = `<span style="background:#eceff1;color:#546e7a;padding:2px 6px;border-radius:4px;font-size:10px;">—</span>`;
            }
        }

        const isLatest = idx === 0;

        return `
            <div style="background:${isLatest ? '#f0f7ff' : 'white'};border-radius:10px;padding:10px;margin-bottom:6px;border-right:3px solid ${color};box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="font-size:15px;font-weight:700;color:#2c3e50;">${_fmtRate(h.rate)}</div>
                        ${isLatest ? '<span style="background:#3498db;color:white;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700;">الأحدث</span>' : ''}
                    </div>
                    ${changeBadge}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;">
                    <span>📅 ${_esc(_timeAgo(h.date))}</span>
                    ${h.user ? '<span>👤 ' + _esc(h.user) + '</span>' : ''}
                </div>
                ${h.previousRate ? `
                    <div style="font-size:10px;color:#999;margin-top:4px;">
                        السابق: <b>${_fmtRate(h.previousRate)}</b>
                        ${change && change.direction !== 'same' ? ' → <b style="color:' + color + '">' + _fmtRate(h.rate) + '</b>' : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    console.log('📜 [exchange-history] ready');
})();
