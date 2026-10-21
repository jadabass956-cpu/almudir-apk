// ============================================================
//  📋 STORE ORDERS — إدارة طلبات المتجر الإلكتروني
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    const _state = { filter: 'new' };

    function _esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function _fmt(n) {
        const v = Math.round(Number(n) || 0);
        return v.toLocaleString('en-US') + ' ' + (currentUser?.displayCurrency === 'USD' ? '$' : 'ل.س');
    }
    function _fmtTime(ts) {
        if (!ts) return '—';
        if (ts.toDate) ts = ts.toDate();
        return new Date(ts).toLocaleString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    function _timeAgo(ts) {
        if (!ts) return '';
        if (ts.toDate) ts = ts.toDate();
        const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
        if (diff < 1) return 'الآن';
        if (diff < 60) return diff + ' د';
        if (diff < 1440) return Math.floor(diff / 60) + ' س';
        return Math.floor(diff / 1440) + ' ي';
    }

    // ═══ فتح الصفحة ═══
    window.openStoreOrders = function() {
        let cont = document.getElementById('page-store-orders');
        if (!cont) {
            cont = document.createElement('div');
            cont.className = 'page';
            cont.id = 'page-store-orders';
            cont.style.display = 'none';
            document.body.appendChild(cont);
        }
        if (typeof openPage === 'function') openPage('page-store-orders');
        else {
            document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
            cont.style.display = 'block';
        }
        setTimeout(() => _render(cont), 100);
    };

    async function _render(container) {
        if (!container) return;
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>';

        if (!currentUser?.uid) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">يجب تسجيل الدخول</div>';
            return;
        }

        let orders = [];
        try {
            const snap = await db.collection('public_orders')
                .where('ownerUid', '==', currentUser.uid)
                .where('mode', '==', 'store')
                .get();
            snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
            orders.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
        } catch(e) {
            console.error('[store-orders]', e);
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">❌ ' + _esc(e.message) + '</div>';
            return;
        }

        // 🆕 تحميل سمعة العملاء
        const phones = [...new Set(orders.map(o => _normalizePhone(o.customer?.phone)).filter(Boolean))];
        const reputations = await _loadReputations(phones);

        // إحصائيات
        const stats = { new: 0, accepted: 0, rejected: 0, delivered: 0 };
        orders.forEach(o => { if (stats[o.status] !== undefined) stats[o.status]++; });

        // فلترة
        const filtered = _state.filter === 'all'
            ? orders
            : orders.filter(o => o.status === _state.filter);

        // بناء القائمة
        let listHtml = '';
        if (filtered.length === 0) {
            listHtml = `<div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">📭</div>
                <div style="font-size:14px;font-weight:600;">لا توجد طلبات</div>
                <div style="font-size:12px;color:#999;margin-top:6px;">سيظهر هنا أي طلب من متجرك</div>
            </div>`;
        } else {
            filtered.forEach(o => {
                const phone = _normalizePhone(o.customer?.phone);
                const rep = reputations[phone] || null;
                listHtml += _orderCard(o, rep);
            });
        }

        container.style.boxSizing = 'border-box';
        container.style.width = '100%';
        container.innerHTML = `
            <h2 style="margin:0 0 6px 0;font-size:20px;">📋 طلبات المتجر</h2>
            <p style="color:#666;font-size:13px;margin:0 0 15px 0;">الطلبات الواردة من الرابط العام</p>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:15px;">
                <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.new}</div>
                    <div style="font-size:10px;opacity:0.9;">🆕 جديد</div>
                </div>
                <div style="background:linear-gradient(135deg,#27ae60,#229954);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.accepted}</div>
                    <div style="font-size:10px;opacity:0.9;">✅ مقبول</div>
                </div>
                <div style="background:linear-gradient(135deg,#3498db,#2980b9);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.delivered}</div>
                    <div style="font-size:10px;opacity:0.9;">📦 سلّم</div>
                </div>
                <div style="background:linear-gradient(135deg,#95a5a6,#7f8c8d);color:white;border-radius:10px;padding:10px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;">${stats.rejected}</div>
                    <div style="font-size:10px;opacity:0.9;">❌ مرفوض</div>
                </div>
            </div>

            <div style="display:flex;gap:6px;margin-bottom:15px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;">
                ${[
                    { id: 'new', label: '🆕 جديدة' },
                    { id: 'accepted', label: '✅ مقبولة' },
                    { id: 'delivered', label: '📦 مسلّمة' },
                    { id: 'rejected', label: '❌ مرفوضة' },
                    { id: 'all', label: '📋 الكل' }
                ].map(t => `<button onclick="_soFilter('${t.id}')" style="flex-shrink:0;padding:8px 14px;background:${_state.filter === t.id ? '#2c3e50' : 'white'};color:${_state.filter === t.id ? 'white' : '#2c3e50'};border:1.5px solid ${_state.filter === t.id ? '#2c3e50' : '#ddd'};border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;">${t.label}</button>`).join('')}
            </div>

            <div style="width:100%;box-sizing:border-box;">${listHtml}</div>
        `;
    }

    // ═══════════════════════════════════════════════════════
    //  👤 CUSTOMER REPUTATION — سمعة العميل + الحظر
    // ═══════════════════════════════════════════════════════
    function _normalizePhone(phone) {
        if (!phone) return '';
        return String(phone).replace(/\D/g, '').replace(/^0/, '963');
    }

    function _isBanned(rep) {
        if (!rep) return { banned: false };
        if (rep.banned === true) return { banned: true, reason: 'دائم', label: '🚫 محظور دائم' };
        if (rep.bannedUntil && rep.bannedUntil > Date.now()) {
            const days = Math.ceil((rep.bannedUntil - Date.now()) / 86400000);
            return { banned: true, reason: 'مؤقت', label: `🚫 محظور ${days} يوم` };
        }
        return { banned: false };
    }

    async function _loadReputations(phones) {
        const out = {};
        if (!phones.length) return out;
        try {
            const tasks = phones.map(phone => 
                db.collection('public_customers').doc(phone).get()
                    .then(snap => ({ phone, data: snap.exists ? snap.data() : null }))
                    .catch(() => ({ phone, data: null }))
            );
            const results = await Promise.all(tasks);
            results.forEach(r => { if (r.data) out[r.phone] = r.data; });
        } catch(e) { console.warn('[so] reputations:', e.message); }
        return out;
    }

    async function _updateCustomerReputation(order, reason) {
        const phone = _normalizePhone(order.customer?.phone);
        if (!phone) return;

        try {
            const ref = db.collection('public_customers').doc(phone);
            const snap = await ref.get();
            const now = Date.now();

            let data = snap.exists ? snap.data() : {
                phone,
                ownerUid: currentUser.uid,
                name: order.customer?.name || '',
                totalOrders: 0,
                successfulOrders: 0,
                rejectedOrders: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (reason === 'fake') {
                data.rejectedOrders = (Number(data.rejectedOrders) || 0) + 1;
                data.lastRejectionAt = now;
                data.lastRejectionReason = reason;

                // تطبيق الحظر التلقائي
                const rejected = data.rejectedOrders;
                if (rejected >= 5) {
                    data.banned = true;
                    data.bannedAt = now;
                    data.banReason = 'تجاوز حد الرفض (5+)';
                } else if (rejected >= 3) {
                    data.bannedUntil = now + (7 * 86400000); // 7 أيام
                    data.banReason = 'رفض متكرر (3+)';
                }
                // 2 رفض → تحذير فقط (لا حظر)
            } else {
                // رفض بسبب التاجر — لا يُحسب
            }

            data.lastUpdatedAt = firebase.firestore.FieldValue.serverTimestamp();

            if (snap.exists) {
                await ref.update(data);
            } else {
                await ref.set(data);
            }
        } catch(e) { console.warn('[so] reputation update:', e.message); }
    }

    function _renderReputationBanner(rep, order) {
        if (!rep) return '';
        const ban = _isBanned(rep);
        const rejected = Number(rep.rejectedOrders) || 0;
        const total = Number(rep.totalOrders) || 0;

        if (ban.banned) {
            return `
                <div style="background:#ffebee;border-right:4px solid #e74c3c;border-radius:8px;padding:10px;margin-bottom:10px;">
                    <div style="font-size:13px;font-weight:700;color:#c0392b;margin-bottom:4px;">${ban.label}</div>
                    <div style="font-size:11px;color:#721c24;">${_esc(rep.banReason || '')} — يُفضّل رفض الطلب</div>
                </div>`;
        }
        if (rejected >= 2) {
            return `
                <div style="background:#fff3cd;border-right:4px solid #f39c12;border-radius:8px;padding:10px;margin-bottom:10px;">
                    <div style="font-size:12px;font-weight:700;color:#856404;">⚠️ تحذير: عميل له ${rejected} طلب مرفوض</div>
                    <div style="font-size:11px;color:#856404;">يُفضّل التأكد قبل التحضير</div>
                </div>`;
        }
        if (total >= 3) {
            return `
                <div style="background:#e8f5e9;border-right:4px solid #27ae60;border-radius:8px;padding:8px;margin-bottom:10px;">
                    <div style="font-size:11px;color:#155724;">✅ عميل موثوق (${total} طلب)</div>
                </div>`;
        }
        return `
            <div style="background:#f0f7ff;border-right:4px solid #3498db;border-radius:8px;padding:8px;margin-bottom:10px;">
                <div style="font-size:11px;color:#2c3e50;">🆕 عميل جديد — تأكد عبر الاتصال</div>
            </div>`;
    }

    function _renderEtaInfo(o) {
        if (!o.eta) return '';
        const created = o.createdAt?.toDate?.() || new Date();
        const arrival = new Date(created.getTime() + o.eta * 60000);
        const arrivalStr = arrival.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: true });

        // إذا الطلب قديم — نتجاهل
        const now = Date.now();
        const createdMs = created.getTime();
        const elapsed = Math.floor((now - createdMs) / 60000);
        const remaining = o.eta - elapsed;

        let statusColor = '#3498db';
        let statusText = '⏱️ يصل خلال ' + o.eta + ' دقيقة';
        if (remaining > 0 && remaining < o.eta) {
            statusText = '⏳ متبقي ' + remaining + ' دقيقة';
            statusColor = remaining < 5 ? '#e74c3c' : '#f39c12';
        } else if (remaining <= 0) {
            statusText = '✅ تجاوز الوقت المتوقع';
            statusColor = '#e74c3c';
        }

        return `
            <div style="margin-top:8px;padding:8px;background:#f0f7ff;border-right:3px solid ${statusColor};border-radius:6px;font-size:11px;">
                <div style="font-weight:700;color:${statusColor};">${statusText}</div>
                <div style="color:#666;margin-top:3px;">🕐 الوقت المتوقع: <b>${_esc(arrivalStr)}</b></div>
            </div>`;
    }

    function _renderPaymentInfo(o) {
        if (!o.paymentMethod) return '';
        const isCod = o.paymentMethod === 'cod';
        const isPending = o.paymentStatus === 'pending_verification';

        if (isCod) {
            return `<div style="margin-top:8px;padding:8px;background:#e8f5e9;border-radius:6px;font-size:11px;color:#155724;">💵 نقد عند التسليم</div>`;
        }

        return `
            <div style="margin-top:8px;padding:8px;background:${isPending ? '#fff3cd' : '#e3f2fd'};border-radius:6px;font-size:11px;color:${isPending ? '#856404' : '#0c5460'};">
                <div style="font-weight:700;margin-bottom:4px;">💳 ${_esc(o.paymentMethodName || 'دفع إلكتروني')}</div>
                ${o.transactionNumber ? `<div>🔢 رقم العملية: <span style="font-family:monospace;direction:ltr;display:inline-block;font-weight:600;">${_esc(o.transactionNumber)}</span></div>` : ''}
                ${isPending ? '<div style="margin-top:4px;">⏳ بانتظار تأكيد الدفع</div>' : ''}
            </div>`;
    }

    function _orderCard(o, rep) {
        const c = o.customer || {};
        const itemsHtml = (o.items || []).map(i => 
            `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px dashed #f0f0f0;">
                <span>${_esc(i.name)} × ${i.qty}</span>
                <span style="color:#27ae60;font-weight:600;">${_fmt(i.qty * i.price)}</span>
            </div>`
        ).join('');

        const statusColor = {
            'new': '#e74c3c',
            'accepted': '#27ae60',
            'delivered': '#3498db',
            'rejected': '#95a5a6'
        }[o.status] || '#95a5a6';

        const statusLabel = {
            'new': '🆕 جديد',
            'accepted': '✅ مقبول',
            'delivered': '📦 سلّم',
            'rejected': '❌ مرفوض'
        }[o.status] || o.status;

        const typeLabel = o.type === 'pickup' ? '🥡 استلام' : '🛵 توصيل';

        let actionsHtml = '';
        if (o.status === 'new') {
            actionsHtml = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    <button onclick="_soAccept('${_esc(o.id)}')" style="padding:11px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✅ قبول</button>
                    <button onclick="_soReject('${_esc(o.id)}')" style="padding:11px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">❌ رفض</button>
                </div>
            `;
        } else if (o.status === 'accepted') {
            actionsHtml = `
                <button onclick="_soMarkDelivered('${_esc(o.id)}')" style="width:100%;padding:11px;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">📦 علّم كمسلّم</button>
            `;
        }

        return `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,0.05);border-right:4px solid ${statusColor};box-sizing:border-box;width:100%;">
                ${_renderReputationBanner(rep, o)}
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#2c3e50;font-size:14px;">👤 ${_esc(c.name || 'عميل')}</div>
                        <div style="font-size:12px;color:#666;margin-top:3px;direction:ltr;text-align:right;">📞 ${_esc(c.phone || '—')}</div>
                        ${o.type === 'delivery' && c.town ? `<div style="font-size:12px;color:#666;margin-top:2px;">📍 ${_esc(c.town)}${c.details ? ' — ' + _esc(c.details) : ''}</div>` : ''}
                    </div>
                    <div style="text-align:left;flex-shrink:0;">
                        <div style="background:${statusColor};color:white;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;">${statusLabel}</div>
                        <div style="font-size:10px;color:#999;margin-top:4px;">${_timeAgo(o.createdAt)}</div>
                    </div>
                </div>

                <div style="background:#f8f9fa;border-radius:8px;padding:10px;margin-bottom:10px;">
                    <div style="font-size:11px;color:#666;margin-bottom:6px;font-weight:600;">${typeLabel} • ${(o.items || []).length} صنف</div>
                    ${itemsHtml}
                    ${o.deliveryFee > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;"><span>🛵 توصيل</span><span style="color:#666;">${_fmt(o.deliveryFee)}</span></div>` : ''}
                    <div style="display:flex;justify-content:space-between;padding:8px 0 0;margin-top:6px;border-top:1px solid #ddd;font-size:14px;font-weight:700;">
                        <span>الإجمالي:</span>
                        <span style="color:#27ae60;">${_fmt(o.total)}</span>
                    </div>
                    ${o.customerNote ? `<div style="font-size:11px;color:#856404;background:#fff8e1;padding:6px;border-radius:6px;margin-top:8px;">📝 ${_esc(o.customerNote)}</div>` : ''}
                    ${_renderEtaInfo(o)}
                    ${_renderPaymentInfo(o)}
                </div>

                ${o.status !== 'rejected' ? `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
                        <a href="tel:${_esc(c.phone || '')}" style="padding:9px;background:#3498db;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;">📞 اتصال</a>
                        <a href="https://wa.me/${_esc((c.phone || '').replace(/\\D/g, '').replace(/^0/, '963'))}" target="_blank" style="padding:9px;background:#25D366;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;">📱 واتساب</a>
                    </div>
                ` : ''}

                ${actionsHtml}
            </div>
        `;
    }

    // ═══ Actions ═══
    window._soFilter = function(f) {
        _state.filter = f;
        const c = document.getElementById('page-store-orders');
        if (c) _render(c);
    };

    // ═══════════════════════════════════════════════════════
    //  ✅ ACCEPT FLOW — Modal + فاتورة + مخزون + صندوق
    // ═══════════════════════════════════════════════════════
    window._soAccept = async function(orderId) {
        try {
            const snap = await db.collection('public_orders').doc(orderId).get();
            if (!snap.exists) { alert('الطلب غير موجود'); return; }
            const order = snap.data();

            // جلب الصناديق
            const boxes = [];
            try {
                const boxSnap = await db.collection('users').doc(currentUser.uid)
                    .collection('payment_boxes').get();
                boxSnap.forEach(d => {
                    const x = d.data();
                    if (x.active !== false) boxes.push({ id: d.id, name: x.name || 'صندوق' });
                });
            } catch(e) { console.warn('[so] boxes:', e.message); }

            _showAcceptModal(orderId, order, boxes);
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    function _showAcceptModal(orderId, order, boxes) {
        const old = document.getElementById('soAcceptModal');
        if (old) old.remove();

        const c = order.customer || {};
        const total = Number(order.total) || 0;
        const itemsCount = (order.items || []).length;
        const typeLabel = order.type === 'pickup' ? '🥡 استلام' : '🛵 توصيل';

        const boxesHtml = boxes.length > 0
            ? boxes.map(b => `<option value="${_esc(b.id)}">${_esc(b.name)}</option>`).join('')
            : '<option value="">— لا توجد صناديق —</option>';

        const modal = document.createElement('div');
        modal.id = 'soAcceptModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:460px;width:100%;padding:22px;box-sizing:border-box;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h3 style="margin:0;font-size:17px;">✅ تأكيد قبول الطلب</h3>
                    <button onclick="document.getElementById('soAcceptModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
                </div>

                <div style="background:#f8f9fa;border-radius:10px;padding:12px;margin-bottom:14px;">
                    <div style="font-size:13px;color:#2c3e50;font-weight:600;margin-bottom:6px;">👤 ${_esc(c.name || 'عميل')}</div>
                    <div style="font-size:12px;color:#666;direction:ltr;text-align:right;margin-bottom:4px;">📞 ${_esc(c.phone || '—')}</div>
                    ${order.type === 'delivery' && c.town ? `<div style="font-size:12px;color:#666;">📍 ${_esc(c.town)}</div>` : ''}
                    <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px dashed #ddd;font-size:12px;">
                        <span>${typeLabel} • ${itemsCount} صنف</span>
                        <span style="font-weight:700;color:#27ae60;">${_fmt(total)}</span>
                    </div>
                </div>

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💳 طريقة الدفع</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
                    <label style="padding:11px;background:#e8f5e9;border:2px solid #27ae60;border-radius:10px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;">
                        <input type="radio" name="soPayType" value="cash" checked style="margin-left:4px;">💵 نقد
                    </label>
                    <label style="padding:11px;background:#f8f9fa;border:2px solid #ddd;border-radius:10px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;">
                        <input type="radio" name="soPayType" value="credit" style="margin-left:4px;">📋 آجل
                    </label>
                </div>

                <label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:6px;">💰 الصندوق</label>
                <select id="soPayBox" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;background:white;margin-bottom:14px;">
                    ${boxesHtml}
                </select>

                <!-- 🚗 اختيار السائق — إجباري -->
                <label style="display:block;font-size:13px;font-weight:700;color:#8e44ad;margin-bottom:6px;">🚗 اختر السائق <span style="color:#e74c3c;">*</span></label>
                <div id="soDriversList" style="margin-bottom:10px;"></div>

                <div id="soDriverAlert" style="background:#ffebee;border-right:4px solid #e74c3c;border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:#c0392b;display:none;">
                    ⚠️ يجب اختيار سائق قبل القبول
                </div>

                <div style="background:#fff3cd;border-right:4px solid #f39c12;border-radius:8px;padding:10px;margin-bottom:14px;font-size:11px;color:#856404;">
                    ℹ️ ستنشأ فاتورة تلقائياً + خصم من المخزون (إن وُجد)
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <button onclick="document.getElementById('soAcceptModal').remove()" style="padding:13px;background:#95a5a6;color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">إلغاء</button>
                    <button id="soAcceptConfirmBtn" onclick="_soProcessAccept('${_esc(orderId)}')" style="padding:13px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✅ تأكيد القبول</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 🚗 تعبئة قائمة السائقين
        _soFillDriversList(order.type);
    }

    // 🚗 تعبئة قائمة السائقين
    async function _soFillDriversList(orderType) {
        const list = document.getElementById('soDriversList');
        if (!list) return;

        // في حالة الاستلام — لا حاجة لسائق
        if (orderType !== 'delivery') {
            list.innerHTML = '<div style="padding:10px;background:#e8f5e9;border-radius:8px;font-size:12px;color:#1b5e20;text-align:center;">✅ لا حاجة لسائق (طلب استلام)</div>';
            return;
        }

        // اقرأ السائقين من public_menus
        let drivers = [];
        try {
            const snap = await db.collection('public_menus').doc(currentUser.uid).get();
            if (snap.exists) {
                drivers = Array.isArray(snap.data().drivers) ? snap.data().drivers : [];
            }
        } catch(e) {
            console.warn('[drivers load]', e.message);
        }

        if (drivers.length === 0) {
            list.innerHTML = `
                <div style="padding:14px;background:#ffebee;border:2px solid #e74c3c;border-radius:10px;text-align:center;">
                    <div style="font-size:13px;font-weight:700;color:#c0392b;margin-bottom:4px;">⚠️ لا يوجد سائقون</div>
                    <div style="font-size:11px;color:#721c24;">أضف سائقين من: الإعدادات → السائقون</div>
                </div>`;
            return;
        }

        list.innerHTML = `
            <select id="soDriverSelect" onchange="_soOnDriverChange()" style="width:100%;padding:11px;border:2px solid #e9ecef;border-radius:10px;box-sizing:border-box;font-family:inherit;font-size:14px;background:white;">
                <option value="">— اختر السائق —</option>
                ${drivers.map(d => `<option value="${_esc(d.id)}">👤 ${_esc(d.name || 'سائق')} — ${_esc(d.phone || '')}</option>`).join('')}
            </select>`;
    }

    window._soOnDriverChange = function() {
        const alert = document.getElementById('soDriverAlert');
        if (alert) alert.style.display = 'none';
        const sel = document.getElementById('soDriverSelect');
        if (sel) {
            sel.style.borderColor = '#e9ecef';
            sel.style.boxShadow = 'none';
        }
    };

    window._soProcessAccept = async function(orderId) {
        const btn = document.getElementById('soAcceptConfirmBtn');
        const boxId = document.getElementById('soPayBox')?.value || '';
        const payType = document.querySelector('input[name="soPayType"]:checked')?.value || 'cash';

        // 🚗 التحقق من اختيار السائق
        const driverSelect = document.getElementById('soDriverSelect');
        let driverId = '';
        let driverName = '';
        let driverPhone = '';

        if (driverSelect) {
            driverId = driverSelect.value || '';
            if (!driverId) {
                const alertBox = document.getElementById('soDriverAlert');
                if (alertBox) {
                    alertBox.style.display = 'block';
                    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                driverSelect.style.borderColor = '#e74c3c';
                driverSelect.style.boxShadow = '0 0 0 4px rgba(231,76,60,0.15)';
                return;
            }
            const opt = driverSelect.options[driverSelect.selectedIndex];
            const txt = (opt.textContent || '').replace(/^👤\s*/, '').split(' — ');
            driverName = (txt[0] || '').trim();
            driverPhone = (txt[1] || '').trim();
        }

        btn.disabled = true;
        btn.textContent = '⏳ جاري المعالجة...';

        try {
            const result = await _processOrderAccept(orderId, boxId, payType, driverId, driverName, driverPhone);
            const _m1 = document.getElementById('soAcceptModal');
            if (_m1) _m1.remove();
            if (typeof toast === 'function') {
                toast(result.invoice ? `✅ تم القبول — فاتورة ${result.invoice}` : '✅ تم القبول', 'success');
            }
            const c = document.getElementById('page-store-orders');
            if (c) _render(c);

            // 🆕 عرض modal "إشعار العميل"
            _showNotifyCustomerModal(result.order, result.invoice, result.grandTotal);
        } catch(e) {
            console.error(e);
            alert('❌ ' + e.message);
            btn.disabled = false;
            btn.textContent = '✅ تأكيد القبول';
        }
    };

    async function _processOrderAccept(orderId, boxId, payType, driverId, driverName, driverPhone) {
        // ① اقرأ الطلب
        const orderRef = db.collection('public_orders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) throw new Error('الطلب غير موجود');
        const order = orderSnap.data();

        // ② اقرأ public_menus لمعرفة المصدر
        const menuSnap = await db.collection('public_menus').doc(currentUser.uid).get();
        const menuData = menuSnap.exists ? menuSnap.data() : {};
        const source = menuData.source || 'menu';

        // ③ خصم المخزون (إن كان من inventory)
        if (source === 'inventory') {
            try {
                const dataRef = db.collection('users').doc(currentUser.uid)
                    .collection('data').doc('main');
                const dataSnap = await dataRef.get();
                const mainData = dataSnap.data() || {};
                const materialsList = mainData.materials || [];

                let changed = false;
                for (const item of (order.items || [])) {
                    const matId = item.materialId || (item.id && String(item.id).startsWith('mat_') ? String(item.id).slice(4) : null);
                    if (!matId) continue;
                    const mat = materialsList.find(m => String(m.id) === String(matId));
                    if (mat) {
                        mat.stock = (Number(mat.stock) || 0) - (Number(item.qty) || 0);
                        changed = true;
                    }
                }

                if (changed) {
                    await dataRef.update({ materials: materialsList });
                    console.log('✅ خصم من المخزون');
                }
            } catch(e) {
                console.warn('[so accept] inventory:', e.message);
            }
        }

        // ④ إنشاء فاتورة
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const _salesList = (typeof sales !== 'undefined' && Array.isArray(sales)) ? sales : [];
        const count = _salesList.filter(s => s.invoice && s.invoice.startsWith('ORD-')).length + 1;
        const invoice = `ORD-${yyyy}${mm}${dd}-${String(count).padStart(3, '0')}`;

        const saleItems = (order.items || []).map(it => ({
            materialName: it.name || '—',
            qty: Number(it.qty) || 0,
            unitPrice: Number(it.price) || 0,
            costAtSale: Number(it.cost) || 0,
            total: (Number(it.qty) || 0) * (Number(it.price) || 0)
        }));

        const subtotal = Number(order.subtotal) || Number(order.total) || 0;
        const deliveryFee = Number(order.deliveryFee) || 0;
        const grandTotal = subtotal + deliveryFee;

        const c = order.customer || {};
        const addressStr = c.town ? (c.town + (c.details ? ' - ' + c.details : '')) : '';

        const newSale = {
            invoice: invoice,
            date: dateStr,
            customer: c.name || 'عميل متجر',
            items: saleItems,
            total: subtotal,
            paid: payType === 'cash' ? grandTotal : 0,
            remaining: payType === 'credit' ? grandTotal : 0,
            vat: 0,
            vatRate: 0,
            grandTotal: grandTotal,
            isStore: true,
            source: 'store',
            sourceId: orderId,
            orderType: order.type,
            customerName: c.name || '',
            customerPhone: c.phone || '',
            customerAddress: addressStr,
            paymentBox: boxId,
            paymentType: payType,
            deliveryFee: deliveryFee
        };

        if (typeof sales !== 'undefined' && Array.isArray(sales)) {
            sales.push(newSale);
            try {
                if (typeof saveAllData === 'function') await saveAllData();
                else if (typeof saveData === 'function') await saveData();
            } catch(e) { console.warn('[so] save:', e.message); }
        }

        // ⑤ إضافة للصندوق
        if (boxId && payType === 'cash' && grandTotal > 0) {
            try {
                if (typeof pbAdjustBalance === 'function') {
                    await pbAdjustBalance(boxId, grandTotal, 'add', {
                        reason: 'store_order',
                        reasonLabel: `طلب متجر ${invoice}`,
                        relatedId: invoice
                    });
                    console.log('✅ أُضيف للصندوق');
                }
            } catch(e) {
                console.warn('[so accept] box:', e.message);
            }
        }

        // ⑥ تحديث الطلب
        await orderRef.update({
            status: 'accepted',
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
            acceptedBy: currentUser.uid,
            saleId: invoice,
            boxId: boxId,
            paymentType: payType,
            grandTotal: grandTotal,
            driverId: driverId || null,
            driverName: driverName || null,
            driverPhone: driverPhone || null
        });

        // ⑦ تحديث سمعة العميل — طلب ناجح
        try {
            const phone = (order.customer?.phone || '').replace(/\D/g, '').replace(/^0/, '963');
            if (phone) {
                const repRef = db.collection('public_customers').doc(phone);
                const repSnap = await repRef.get();
                if (repSnap.exists) {
                    const repData = repSnap.data();
                    await repRef.update({
                        totalOrders: (Number(repData.totalOrders) || 0) + 1,
                        successfulOrders: (Number(repData.successfulOrders) || 0) + 1,
                        lastOrderAt: Date.now(),
                        name: order.customer?.name || repData.name || '',
                        lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    await repRef.set({
                        phone,
                        ownerUid: currentUser.uid,
                        name: order.customer?.name || '',
                        totalOrders: 1,
                        successfulOrders: 1,
                        rejectedOrders: 0,
                        lastOrderAt: Date.now(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } catch(e) { console.warn('[so] reputation accept:', e.message); }

        return { invoice, order, total: grandTotal, grandTotal };
    }

    // ═══════════════════════════════════════════════════════
    //  📱 NOTIFY CUSTOMER — إشعار العميل عبر واتساب
    // ═══════════════════════════════════════════════════════
    function _showNotifyCustomerModal(order, invoice, grandTotal) {
        if (!order || !order.customer?.phone) return;

        const old = document.getElementById('soNotifyModal');
        if (old) old.remove();

        const phone = String(order.customer.phone).replace(/\D/g, '').replace(/^0/, '963');
        const name = order.customer.name || 'عميل';
        const typeLabel = order.type === 'pickup' ? '🥡 استلام' : '🛵 توصيل';
        const itemsList = (order.items || []).map(i => `• ${i.name} × ${i.qty}`).join('\n');
        const bizName = currentUser?.businessName || 'المتجر';

        const msg = `مرحباً ${name} 🌟\n\n✅ تم تأكيد طلبك من ${bizName}\n\n📄 رقم الفاتورة: ${invoice}\n${typeLabel}\n\n📋 الطلب:\n${itemsList}\n\n💰 الإجمالي: ${_fmt(grandTotal)}\n\n${order.type === 'pickup' ? '📦 سيصلك إشعار عندما يكون جاهزاً للاستلام' : '🛵 سيصلك السائق قريباً'}\n\nشكراً لثقتك! 🙏`;

        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        const smsUrl = `sms:${phone}?body=${encodeURIComponent(msg)}`;

        const modal = document.createElement('div');
        modal.id = 'soNotifyModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:420px;width:100%;padding:22px;box-sizing:border-box;">
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="font-size:48px;margin-bottom:8px;">📱</div>
                    <h3 style="margin:0 0 6px;font-size:17px;">إشعار العميل</h3>
                    <p style="color:#666;font-size:13px;margin:0;">أبلغ العميل بأن الطلب قُبل</p>
                </div>

                <div style="background:#f8f9fa;border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px;color:#555;line-height:1.6;max-height:150px;overflow-y:auto;">
                    <div style="font-weight:600;margin-bottom:6px;">📄 نص الإشعار:</div>
                    <div style="white-space:pre-line;">${_esc(msg)}</div>
                </div>

                <a href="${waUrl}" target="_blank" style="display:block;width:100%;padding:14px;background:linear-gradient(135deg,#25D366,#128C7E);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;box-sizing:border-box;margin-bottom:8px;">📱 إرسال واتساب</a>

                <a href="${smsUrl}" style="display:block;width:100%;padding:12px;background:#3498db;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;box-sizing:border-box;margin-bottom:8px;">💬 إرسال SMS</a>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <button onclick="_soCopyNotifyMsg(\`${msg.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)" style="padding:11px;background:#f39c12;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">📋 نسخ النص</button>
                    <a href="tel:${phone}" style="padding:11px;background:#e67e22;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;box-sizing:border-box;">📞 اتصال</a>
                </div>

                <button onclick="document.getElementById('soNotifyModal').remove()" style="width:100%;padding:12px;background:transparent;color:#666;border:none;font-size:13px;cursor:pointer;font-family:inherit;">تخطي</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    window._soCopyNotifyMsg = function(msg) {
        const done = () => { if (typeof toast === 'function') toast('✅ تم نسخ النص', 'success'); };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(msg).then(done).catch(() => _fallbackCopy(msg, done));
        } else {
            _fallbackCopy(msg, done);
        }
    };

    function _fallbackCopy(text, cb) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch(e) {}
        ta.remove(); cb();
    }

    window._soReject = async function(orderId) {
        const old = document.getElementById('soRejectModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'soRejectModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:15px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:16px;max-width:420px;width:100%;padding:22px;box-sizing:border-box;">
                <h3 style="margin:0 0 16px;font-size:17px;">❌ رفض الطلب — السبب؟</h3>

                <button onclick="_soConfirmReject('${_esc(orderId)}', 'fake')" style="width:100%;padding:14px;background:#ffebee;color:#c0392b;border:2px solid #e74c3c;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px;text-align:right;">
                    🚫 طلب وهمي / عميل غير جدي<br>
                    <span style="font-size:11px;font-weight:400;opacity:0.8;">يُحسب في سمعة العميل → قد يُحظر</span>
                </button>

                <button onclick="_soConfirmReject('${_esc(orderId)}', 'out_of_stock')" style="width:100%;padding:14px;background:#fff3cd;color:#856404;border:2px solid #f39c12;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px;text-align:right;">
                    📦 نفد المخزون / غير متوفر<br>
                    <span style="font-size:11px;font-weight:400;opacity:0.8;">لا يُحسب في سمعة العميل</span>
                </button>

                <button onclick="_soConfirmReject('${_esc(orderId)}', 'other')" style="width:100%;padding:14px;background:#ecf0f1;color:#2c3e50;border:2px solid #95a5a6;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px;text-align:right;">
                    📝 سبب آخر<br>
                    <span style="font-size:11px;font-weight:400;opacity:0.8;">لا يُحسب في سمعة العميل</span>
                </button>

                <button onclick="document.getElementById('soRejectModal').remove()" style="width:100%;padding:12px;background:transparent;color:#666;border:none;font-size:13px;cursor:pointer;font-family:inherit;margin-top:8px;">إلغاء</button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window._soConfirmReject = async function(orderId, reason) {
        try {
            const orderSnap = await db.collection('public_orders').doc(orderId).get();
            if (!orderSnap.exists) { alert('الطلب غير موجود'); return; }
            const order = orderSnap.data();

            await db.collection('public_orders').doc(orderId).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rejectedBy: currentUser.uid,
                rejectReason: reason
            });

            // تحديث السمعة إذا كان "وهمي"
            if (reason === 'fake') {
                await _updateCustomerReputation(order, reason);
            }

            const _m2 = document.getElementById('soRejectModal');
            if (_m2) _m2.remove();
            if (typeof toast === 'function') toast('✅ تم الرفض', 'success');
            const c = document.getElementById('page-store-orders');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    window._soMarkDelivered = async function(orderId) {
        if (!confirm('📦 تم التسليم للعميل؟')) return;
        try {
            await db.collection('public_orders').doc(orderId).update({
                status: 'delivered',
                deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
                deliveredBy: currentUser.uid
            });
            if (typeof toast === 'function') toast('✅ تم التسليم', 'success');
            const c = document.getElementById('page-store-orders');
            if (c) _render(c);
        } catch(e) { alert('❌ ' + e.message); }
    };

    console.log('📋 [store-orders] ready');
})();
