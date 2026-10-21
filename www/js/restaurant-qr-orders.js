// ============================================================
//  🛒 RESTAURANT QR ORDERS — طلبات QR من العملاء
//  v1.0.0
// ============================================================
(function() {
    'use strict';

    window._qrPendingOrders = [];

    // ═══ قراءة الطلبات المعلقة ═══
    async function _qrFetchPending() {
        try {
            if (!currentUser?.uid || !db) return [];
            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const snap = await db.collection('public_orders')
                .where('ownerUid', '==', uid)
                .where('status', '==', 'new')
                .get();
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            list.sort((a, b) => {
                const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tb - ta;
            });
            return list;
        } catch(e) {
            console.warn('[qr-orders]', e.message);
            return [];
        }
    }

    // ═══ Banner ═══
    async function _qrUpdateBanner() {
        const banner = document.getElementById('qrPendingBanner');
        if (!banner) return;
        const orders = await _qrFetchPending();
        window._qrPendingOrders = orders;

        if (orders.length === 0) {
            banner.style.display = 'none';
            return;
        }
        banner.style.display = 'block';
        banner.innerHTML = `
            <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
                <span style="font-size:22px;">🔔</span>
                <span>طلبات QR جديدة (${orders.length})</span>
            </div>
            <div style="font-size:12px; color:#856404; margin-top:4px;">من العملاء مباشرة — اضغط للعرض</div>
        `;
    }

    // ═══ Modal ═══
    window._qrShowPendingModal = async function() {
        const orders = window._qrPendingOrders.length
            ? window._qrPendingOrders
            : await _qrFetchPending();
        if (orders.length === 0) { alert('لا توجد طلبات QR جديدة'); return; }

        const old = document.getElementById('qrPendingModal');
        if (old) old.remove();

        let html = '';
        orders.forEach(o => {
            const itemsList = (o.items || []).map(i =>
                `<div style="display:flex; justify-content:space-between; padding:5px 0; font-size:13px; border-bottom:1px dashed #eee;">
                    <span>${_qrEsc(i.name)} × ${i.qty}</span>
                    <span style="color:#27ae60; font-weight:600;">${(i.qty * i.price).toLocaleString()}</span>
                </div>`
            ).join('');

            const timeAgo = o.createdAt?.toDate ? _qrTimeAgo(o.createdAt.toDate()) : '';

            html += `
                <div style="background:white; border:2px solid #e67e22; border-radius:12px; padding:14px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="font-weight:700; color:#2c3e50; font-size:15px;">🪑 طاولة ${o.tableNumber || '?'}</div>
                        <div style="font-size:11px; color:#999;">${timeAgo}</div>
                    </div>
                    <div style="background:#f8f9fa; border-radius:8px; padding:10px; margin-bottom:10px;">
                        ${itemsList}
                        <div style="display:flex; justify-content:space-between; padding:8px 0 0; margin-top:6px; border-top:1px solid #ddd; font-size:14px; font-weight:700;">
                            <span>الإجمالي:</span>
                            <span style="color:#27ae60;">${(o.total || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    ${o.customerNote ? `<div style="font-size:12px; color:#856404; background:#fff8e1; padding:8px; border-radius:6px; margin-bottom:10px;">📝 ${_qrEsc(o.customerNote)}</div>` : ''}
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <button onclick="_qrAcceptOrder('${o.id}')" style="padding:12px; background:linear-gradient(135deg,#27ae60,#229954); color:white; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer;">✅ قبول</button>
                        <button onclick="_qrRejectOrder('${o.id}')" style="padding:12px; background:linear-gradient(135deg,#e74c3c,#c0392b); color:white; border:none; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer;">❌ رفض</button>
                    </div>
                </div>
            `;
        });

        const modal = document.createElement('div');
        modal.id = 'qrPendingModal';
        modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999999; display:flex; align-items:center; justify-content:center; padding:15px;';
        modal.innerHTML = `
            <div style="background:#f8f9fa; border-radius:16px; max-width:560px; width:100%; max-height:92vh; overflow-y:auto; padding:16px; box-sizing:border-box;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <h2 style="margin:0; font-size:18px;">🔔 طلبات QR المعلقة</h2>
                    <button onclick="document.getElementById('qrPendingModal').remove()" style="background:#ecf0f1; border:none; width:34px; height:34px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold;">✖️</button>
                </div>
                ${html}
            </div>
        `;
        document.body.appendChild(modal);
    };

    // ═══ قبول طلب ═══
    window._qrAcceptOrder = async function(orderId) {
        if (!confirm('✅ قبول الطلب وإضافته للطاولة؟')) return;
        try {
            const orderRef = db.collection('public_orders').doc(orderId);
            const orderDoc = await orderRef.get();
            if (!orderDoc.exists) { alert('الطلب غير موجود'); return; }
            const order = orderDoc.data();

            const uid = (typeof _getEffectiveUid === 'function') ? _getEffectiveUid() : currentUser.uid;
            const tblColl = db.collection('users').doc(uid)
                .collection('activities').doc('restaurant')
                .collection('pages').doc('tables')
                .collection('items');

            // ① ابحث عن الطاولة
            const tSnap = await tblColl.get();
            let targetTable = null;
            tSnap.forEach(d => {
                const t = d.data();
                if (String(t.tableNumber) === String(order.tableNumber)) {
                    targetTable = { id: d.id, ...t, ref: d.ref };
                }
            });

            // ② الأطباق الجديدة
            const newItems = (order.items || []).map(i => ({
                name: i.name, qty: parseFloat(i.qty) || 1, price: parseFloat(i.price) || 0
            }));

            if (targetTable) {
                // دمج مع الموجود
                const existing = targetTable.items || [];
                const merged = existing.map(x => ({ ...x }));
                newItems.forEach(ni => {
                    const found = merged.find(e => e.name === ni.name && e.price === ni.price);
                    if (found) found.qty = (parseFloat(found.qty) || 0) + ni.qty;
                    else merged.push(ni);
                });
                const newTotal = merged.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0);

                await targetTable.ref.update({
                    items: merged,
                    total: newTotal,
                    status: 'active',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                // إنشاء طاولة جديدة
                const newTotal = newItems.reduce((s, i) => s + (i.qty * i.price), 0);
                await tblColl.add({
                    tableNumber: order.tableNumber,
                    items: newItems,
                    total: newTotal,
                    status: 'active',
                    customerName: '',
                    guests: 0,
                    source: 'qr',
                    openedAt: Date.now(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // ③ تحديث حالة الطلب
            await orderRef.update({
                status: 'accepted',
                acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
                acceptedBy: currentUser.uid
            });

            // ④ تنظيف + تحديث
            document.getElementById('qrPendingModal')?.remove();
            _qrUpdateBanner();

            if (typeof _restRenderTables === 'function') {
                const c = document.getElementById('activity-restaurant-tables');
                if (c) _restRenderTables(c);
            }

            alert('✅ تم القبول — الطاولة محدَّثة');
        } catch(e) {
            console.error('[qr-accept]', e);
            alert('❌ ' + e.message);
        }
    };

    // ═══ رفض طلب ═══
    window._qrRejectOrder = async function(orderId) {
        if (!confirm('❌ رفض هذا الطلب؟')) return;
        try {
            await db.collection('public_orders').doc(orderId).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rejectedBy: currentUser.uid
            });
            document.getElementById('qrPendingModal')?.remove();
            _qrUpdateBanner();
            alert('✅ تم الرفض');
        } catch(e) {
            alert('❌ ' + e.message);
        }
    };

    // ═══ Helpers ═══
    function _qrEsc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    function _qrTimeAgo(date) {
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return 'الآن';
        if (diff < 3600) return Math.floor(diff / 60) + ' د';
        return Math.floor(diff / 3600) + ' س';
    }

    // ═══ إدراج Banner في صفحة الطاولات ═══
    function _qrInjectBanner() {
        const container = document.getElementById('activity-restaurant-tables');
        if (!container) return;
        let banner = document.getElementById('qrPendingBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'qrPendingBanner';
            banner.style.cssText = 'background:linear-gradient(135deg,#fff8e1,#ffe0b2); border:2px solid #f39c12; border-radius:12px; padding:14px; margin-bottom:15px; cursor:pointer; display:none;';
            banner.onclick = function() { window._qrShowPendingModal(); };
            container.insertBefore(banner, container.firstChild);
        }
        _qrUpdateBanner();
    }

    // ═══ Patch _restRenderTables ═══
    function _qrPatchTables() {
        const orig = window._restRenderTables;
        if (!orig || orig._qrPatched) return;
        window._restRenderTables = async function(container) {
            const r = await orig.call(this, container);
            setTimeout(_qrInjectBanner, 250);
            return r;
        };
        window._restRenderTables._qrPatched = true;
    }

    // ═══ Init ═══
    function _qrInit() {
        if (!currentUser?.uid) return;
        _qrPatchTables();
        if (window._qrPollInterval) clearInterval(window._qrPollInterval);
        window._qrPollInterval = setInterval(_qrUpdateBanner, 5000);
        _qrUpdateBanner();
    }

    const _checkInterval = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser?.uid && typeof db !== 'undefined') {
            clearInterval(_checkInterval);
            _qrInit();
        }
    }, 800);

    console.log('🛒 [qr-orders] ready');
})();
