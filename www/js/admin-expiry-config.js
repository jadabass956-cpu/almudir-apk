// ============================================================
//  ⚙️ ADMIN EXPIRY CONFIG — إدارة الأنشطة والصلاحية
// ============================================================

let _aecCache = [];
let _aecFilter = 'all';

// ---------- تحميل ----------
async function loadExpiryConfig() {
    const list = document.getElementById('aecList');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; color:#999; padding:30px;">⏳ جاري التحميل...</div>';

    try {
        const snap = await db.collection('activity_config').get();
        _aecCache = [];
        snap.forEach(d => _aecCache.push({ id: d.id, ...d.data() }));

        // ترتيب: خط أحمر أولاً → إجباري → اختياري
        _aecCache.sort((a, b) => {
            if (a.isRedLine && !b.isRedLine) return -1;
            if (!a.isRedLine && b.isRedLine) return 1;
            if (a.requiresExpiry && !b.requiresExpiry) return -1;
            if (!a.requiresExpiry && b.requiresExpiry) return 1;
            return (a.name || '').localeCompare(b.name || '', 'ar');
        });

        _aecUpdateStats();
        _aecRender();
    } catch(e) {
        console.error('[aec]', e);
        list.innerHTML = '<div style="text-align:center; color:#e74c3c; padding:20px;">❌ ' + _aecEsc(e.message) + '</div>';
    }
}

function _aecUpdateStats() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('aecTotal', _aecCache.length);
    set('aecRequired', _aecCache.filter(x => x.requiresExpiry).length);
    set('aecRedLine', _aecCache.filter(x => x.isRedLine).length);
}

// ---------- العرض ----------
function _aecRender() {
    const list = document.getElementById('aecList');
    if (!list) return;

    let items = _aecCache;
    if (_aecFilter === 'required') items = items.filter(x => x.requiresExpiry);
    else if (_aecFilter === 'optional') items = items.filter(x => !x.requiresExpiry);
    else if (_aecFilter === 'redline') items = items.filter(x => x.isRedLine);

    if (!items.length) {
        list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">لا توجد أنشطة في هذه الفئة</div>';
        return;
    }

    let html = '';
    items.forEach(c => {
        const isRed = c.isRedLine;
        const hasExpiry = c.requiresExpiry;
        const hasBarcode = c.requiresBarcode;

        const bg = isRed ? '#fef2f2' : (hasExpiry ? '#f0fdf4' : '#fafafa');
        const border = isRed ? '#e74c3c' : (hasExpiry ? '#27ae60' : '#ddd');

        html += `
        <div style="background:${bg}; border-right:4px solid ${border}; border-radius:10px; padding:14px; margin-bottom:10px; box-shadow:0 2px 6px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:#2c3e50; font-size:15px;">
                        ${isRed ? '🔴' : (hasExpiry ? '✅' : '⚪')} ${_aecEsc(c.name || c.id)}
                    </div>
                    <div style="font-size:11px; color:#888; margin-top:2px;">ID: ${c.id}</div>
                </div>
                ${isRed ? '<span style="background:#e74c3c; color:white; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:bold; white-space:nowrap;">🔒 خط أحمر</span>' : ''}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; font-size:12px;">
                <div style="background:white; border-radius:6px; padding:8px; text-align:center;">
                    <div style="color:#666;">📅 الصلاحية</div>
                    <div style="font-weight:bold; color:${hasExpiry ? '#27ae60' : '#95a5a6'}; margin-top:2px;">
                        ${hasExpiry ? '✅ إجباري' : '⚪ اختياري'}
                    </div>
                </div>
                <div style="background:white; border-radius:6px; padding:8px; text-align:center;">
                    <div style="color:#666;">🏷️ الباركود</div>
                    <div style="font-weight:bold; color:${hasBarcode ? '#27ae60' : '#95a5a6'}; margin-top:2px;">
                        ${hasBarcode ? '✅ إجباري' : '⚪ اختياري'}
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:6px;">
                <button onclick="openAecEditor('${c.id}')" style="flex:1; padding:8px; background:#3498db; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">✏️ تعديل</button>
                ${!isRed ? `<button onclick="aecToggleExpiry('${c.id}')" style="flex:1; padding:8px; background:${hasExpiry ? '#e67e22' : '#27ae60'}; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">${hasExpiry ? '⛔ إيقاف' : '✅ تفعيل'}</button>` : ''}
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function _aecEsc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- الفلاتر ----------
function aecSetFilter(f) {
    _aecFilter = f;
    document.querySelectorAll('.aec-filter').forEach(b => {
        const active = b.dataset.filter === f;
        b.classList.toggle('active', active);
        b.style.background = active ? '#3498db' : '#ecf0f1';
        b.style.color = active ? 'white' : '#555';
    });
    _aecRender();
}

// ---------- محرر ----------
function openAecEditor(id) {
    const c = _aecCache.find(x => x.id === id);
    if (!c) return;

    document.getElementById('aecModalTitle').textContent = '✏️ ' + (c.name || c.id);
    document.getElementById('aecActivityId').value = c.id;
    document.getElementById('aecName').value = c.name || '';
    document.getElementById('aecRequiresExpiry').checked = !!c.requiresExpiry;
    document.getElementById('aecRequiresBarcode').checked = !!c.requiresBarcode;
    document.getElementById('aecRedLineInfo').style.display = c.isRedLine ? 'block' : 'none';
    document.getElementById('aecRedLine').checked = !!c.isRedLine;

    // 🚫 منع إيقاف الإجبار عن الصيدلية (خط أحمر)
    const reqExpiryEl = document.getElementById('aecRequiresExpiry');
    const reqBarcodeEl = document.getElementById('aecRequiresBarcode');
    if (c.isRedLine) {
        reqExpiryEl.disabled = false;
        reqBarcodeEl.disabled = false;
        // لا يمكن إيقاف الإجبار
        reqExpiryEl.setAttribute('onclick', 'return aecRedLineWarning()');
    } else {
        reqExpiryEl.disabled = false;
        reqBarcodeEl.disabled = false;
        reqExpiryEl.removeAttribute('onclick');
    }

    document.getElementById('aecEditorModal').classList.add('show');
}

function aecRedLineWarning() {
    return confirm('⚠️ تحذير!\n\nهذا النشاط خط أحمر (حماية صحية).\n\nلا يمكن إيقاف إجبار الصلاحية أو الباركود.');
}

function closeAecEditor() {
    document.getElementById('aecEditorModal').classList.remove('show');
}

async function saveAecConfig() {
    const id = document.getElementById('aecActivityId').value;
    const c = _aecCache.find(x => x.id === id);
    if (!c) return;

    const requiresExpiry = document.getElementById('aecRequiresExpiry').checked;
    const requiresBarcode = document.getElementById('aecRequiresBarcode').checked;

    // 🔒 حماية خط أحمر
    if (c.isRedLine) {
        if (!requiresExpiry) {
            alert('🚫 لا يمكن إيقاف إجبار الصلاحية\n\nهذا النشاط خط أحمر.');
            return;
        }
        if (!requiresBarcode) {
            alert('🚫 لا يمكن إيقاف إجبار الباركود\n\nهذا النشاط خط أحمر.');
            return;
        }
    }

    const data = {
        name: document.getElementById('aecName').value.trim(),
        requiresExpiry: requiresExpiry,
        requiresBarcode: requiresBarcode,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('activity_config').doc(id).update(data);
        _aecToast('✅ تم التعديل', 'success');
        closeAecEditor();
        loadExpiryConfig();
        // أعد تحميل الإعدادات في expiry-manager
        if (typeof loadActivityConfig === 'function') {
            _activityConfigLoaded = false;
            loadActivityConfig();
        }
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

async function aecToggleExpiry(id) {
    const c = _aecCache.find(x => x.id === id);
    if (!c) return;
    if (c.isRedLine && c.requiresExpiry) {
        alert('🚫 لا يمكن إيقاف إجبار الصلاحية\n\nهذا النشاط خط أحمر.');
        return;
    }

    const newVal = !c.requiresExpiry;
    if (!confirm(`${newVal ? '✅ تفعيل' : '⛔ إيقاف'} إجبار الصلاحية على "${c.name}"؟`)) return;

    try {
        await db.collection('activity_config').doc(id).update({
            requiresExpiry: newVal,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        _aecToast(newVal ? '✅ تم التفعيل' : '⛔ تم الإيقاف', 'success');
        loadExpiryConfig();
        if (typeof loadActivityConfig === 'function') {
            _activityConfigLoaded = false;
            loadActivityConfig();
        }
    } catch(e) {
        alert('❌ ' + e.message);
    }
}

function _aecToast(msg, type) {
    try {
        if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
        if (typeof showToast === 'function') { showToast(msg, type); return; }
    } catch(e) {}
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:' +
        (type === 'success' ? '#27ae60' : '#e74c3c') +
        '; color:white; padding:12px 20px; border-radius:10px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.25); font-size:14px;';
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch(e){} }, 2500);
}

console.log('⚙️ [admin-expiry-config] جاهز');
