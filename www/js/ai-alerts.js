// ============================================================
//  🔔 AI ALERTS — التنبيهات الذكية
//  كشف الشذوذ + إشعارات ذكية + Firestore
//  v1.0.0
// ============================================================

// ═══════════════════════════════════════════════════════════
//  1. CONFIG — الإعدادات
// ═══════════════════════════════════════════════════════════
const AI_ALERTS_CONFIG = {
    salesDropThreshold: 0.70,      // 70% من المتوسط
    expenseSpikeThreshold: 1.50,   // 150% من المتوسط
    profitAnomalyThreshold: 0,     // ربح سالب
    lookbackDays: 14,              // فترة المقارنة
    checkIntervalMinutes: 60,      // كل ساعة
    maxAgeDays: 30                 // تنظيف ما بعد 30 يوم
};

// ═══════════════════════════════════════════════════════════
//  2. HELPERS — أدوات
// ═══════════════════════════════════════════════════════════
function _aiAlertsToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function _aiAlertsDateStr(date) {
    return date.toISOString().slice(0, 10);
}

function _aiAlertsSum(items, days, field) {
    if (!Array.isArray(items)) return 0;
    const today = _aiAlertsToday();
    const from = new Date(today);
    from.setDate(from.getDate() - days + 1);
    const fromStr = _aiAlertsDateStr(from);
    
    return items
        .filter(x => x.date >= fromStr)
        .reduce((s, x) => s + (parseFloat(x[field]) || 0), 0);
}

function _aiAlertsFmt(n) {
    return typeof formatCurrency === 'function'
        ? formatCurrency(n)
        : Number(n).toLocaleString('ar-SY') + ' ل.س';
}

// ═══════════════════════════════════════════════════════════
//  3. DETECTORS — كواشف الشذوذ
// ═══════════════════════════════════════════════════════════

/**
 * كشف انخفاض المبيعات
 */
function aiDetectSalesDrop() {
    if (typeof sales === 'undefined') return null;
    
    const today = _aiAlertsSum(sales, 1, 'total');
    const days14 = _aiAlertsSum(sales, 14, 'total');
    const avg14 = days14 / 14;
    
    // تجاهل لو البيانات قليلة
    if (days14 === 0 || avg14 === 0) return null;
    
    // لو اليوم أقل من 70% من المتوسط
    const ratio = today / avg14;
    if (ratio >= AI_ALERTS_CONFIG.salesDropThreshold) return null;
    
    // لا تكفي بيانات يوم واحد
    if (days14 < 3 * avg14) return null;  // أقل من 3 أيام بيانات
    
    const dropPercent = Math.round((1 - ratio) * 100);
    
    return {
        type: 'sales_drop',
        severity: ratio < 0.5 ? 'high' : 'medium',
        title: '⚠️ انخفاض المبيعات',
        message: `انخفضت مبيعات اليوم بنسبة ${dropPercent}% عن المتوسط`,
        data: {
            today: Math.round(today),
            average14: Math.round(avg14),
            dropPercent,
            ratio: parseFloat(ratio.toFixed(2))
        }
    };
}

/**
 * كشف ارتفاع المصروفات
 */
function aiDetectExpenseSpike() {
    if (typeof expenses === 'undefined') return null;
    
    const today = _aiAlertsSum(expenses, 1, 'amount');
    const days14 = _aiAlertsSum(expenses, 14, 'amount');
    const avg14 = days14 / 14;
    
    // لا بيانات كافية
    if (days14 === 0 || avg14 === 0) return null;
    
    // لو اليوم أكبر من 150% من المتوسط
    const ratio = today / avg14;
    if (ratio <= AI_ALERTS_CONFIG.expenseSpikeThreshold) return null;
    
    const spikePercent = Math.round((ratio - 1) * 100);
    
    return {
        type: 'expense_spike',
        severity: ratio > 2 ? 'high' : 'medium',
        title: '📈 ارتفاع المصروفات',
        message: `مصروفات اليوم أعلى بـ ${spikePercent}% من المتوسط`,
        data: {
            today: Math.round(today),
            average14: Math.round(avg14),
            spikePercent,
            ratio: parseFloat(ratio.toFixed(2))
        }
    };
}

/**
 * كشف مخزون خطر
 */
function aiDetectInventoryRisk() {
    if (typeof aiPredictInventory !== 'function') return null;
    
    try {
        const list = aiPredictInventory(20);
        const critical = list.filter(m => m.status === 'critical' && m.daysLeft <= 3);
        
        if (critical.length === 0) return null;
        
        const top = critical.slice(0, 3);
        const names = top.map(m => `${m.materialName} (${m.daysLeft} يوم)`).join('، ');
        
        return {
            type: 'inventory_critical',
            severity: 'high',
            title: '🔴 مواد على وشك النفاد',
            message: `${critical.length} مادة ستنفد خلال 3 أيام: ${names}`,
            data: {
                count: critical.length,
                items: top.map(m => ({
                    name: m.materialName,
                    daysLeft: m.daysLeft,
                    stock: m.stock
                }))
            }
        };
    } catch(e) {
        return null;
    }
}

/**
 * كشف ربح سالب غير متوقع
 */
function aiDetectProfitAnomaly() {
    if (typeof AnalyticsEngine === 'undefined') return null;
    
    try {
        const today = new Date().toISOString().slice(0, 10);
        const ctx = { from: today, to: today };
        
        const profit = AnalyticsEngine.get('profit.net', ctx) || 0;
        const salesTotal = AnalyticsEngine.get('sales.total', ctx) || 0;
        
        // لو في مبيعات اليوم، لكن الربح سالب
        if (salesTotal > 0 && profit < AI_ALERTS_CONFIG.profitAnomalyThreshold) {
            return {
                type: 'profit_anomaly',
                severity: 'high',
                title: '💵 ربح سالب',
                message: `اليوم: مبيعات ${_aiAlertsFmt(salesTotal)} لكن صافي الربح سالب (${_aiAlertsFmt(profit)})`,
                data: {
                    sales: Math.round(salesTotal),
                    profit: Math.round(profit)
                }
            };
        }
    } catch(e) {}
    
    return null;
}

// ═══════════════════════════════════════════════════════════
//  4. MAIN DETECTOR — الكاشف الرئيسي
// ═══════════════════════════════════════════════════════════
function aiDetectAnomalies() {
    const alerts = [];
    
    const detectors = [
        aiDetectSalesDrop,
        aiDetectExpenseSpike,
        aiDetectInventoryRisk,
        aiDetectProfitAnomaly
    ];
    
    detectors.forEach(fn => {
        try {
            const alert = fn();
            if (alert) alerts.push(alert);
        } catch(e) {
            console.warn('[ai-alerts] detector:', e.message);
        }
    });
    
    return alerts;
}

// ═══════════════════════════════════════════════════════════
//  5. STORAGE — التخزين في Firestore
// ═══════════════════════════════════════════════════════════

/**
 * حفظ تنبيه
 */
async function aiCreateAlert(alert) {
    if (typeof db === 'undefined' || !db) return null;
    if (typeof auth === 'undefined' || !auth.currentUser) return null;
    
    try {
        const uid = auth.currentUser.uid;
        
        // نحفظ التنبيه
        const docRef = await db.collection('users').doc(uid)
            .collection('ai_alerts').add({
                ...alert,
                status: 'new',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('🔔 [ai-alerts] محفوظ:', alert.type, alert.severity);
        return docRef.id;
    } catch(e) {
        console.warn('[ai-alerts] save:', e.message);
        return null;
    }
}

/**
 * حفظ عدة تنبيهات
 */
async function aiSaveAlerts(alerts) {
    if (!Array.isArray(alerts) || alerts.length === 0) return 0;
    if (typeof db === 'undefined' || !db) return 0;
    if (typeof auth === 'undefined' || !auth.currentUser) return 0;
    
    try {
        const uid = auth.currentUser.uid;
        
        // 🔧 FIX-DEDUP: جلب التنبيهات النشطة من آخر 24 ساعة
        const since = new Date();
        since.setHours(since.getHours() - 24);
        
        const existingSnap = await db.collection('users').doc(uid)
            .collection('ai_alerts')
            .where('createdAt', '>=', since)
            .limit(100)
            .get();
        
        // بناء map من التنبيهات الموجودة (type + message)
        const existingKeys = new Set();
        existingSnap.forEach(d => {
            const data = d.data();
            const key = `${data.type}::${data.message || ''}`;
            existingKeys.add(key);
        });
        
        // حفظ الجديدة فقط
        let saved = 0;
        for (const alert of alerts) {
            const key = `${alert.type}::${alert.message || ''}`;
            
            // تخطي لو موجود
            if (existingKeys.has(key)) {
                console.log(`⏭️ [ai-alerts] مكرر — تخطي: ${alert.type}`);
                continue;
            }
            
            const id = await aiCreateAlert(alert);
            if (id) {
                saved++;
                existingKeys.add(key);  // تجنب التكرار داخل نفس الدفعة
            }
        }
        
        return saved;
    } catch(e) {
        console.warn('[ai-alerts] dedup save:', e.message);
        // fallback: الحفظ العادي
        let saved = 0;
        for (const alert of alerts) {
            const id = await aiCreateAlert(alert);
            if (id) saved++;
        }
        return saved;
    }
}

/**
 * جلب التنبيهات النشطة
 */
async function aiGetActiveAlerts() {
    if (typeof db === 'undefined' || !db) return [];
    if (typeof auth === 'undefined' || !auth.currentUser) return [];
    
    try {
        const uid = auth.currentUser.uid;
        // 💡 بدون orderBy — تجنبّ الحاجة لـ index مركّب
        const snap = await db.collection('users').doc(uid)
            .collection('ai_alerts')
            .where('status', '==', 'new')
            .limit(50)
            .get();
        
        const alerts = [];
        snap.forEach(d => alerts.push({ id: d.id, ...d.data() }));
        // ترتيب في JS — الأحدث أولاً
        alerts.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
        });
        return alerts.slice(0, 20);
    } catch(e) {
        console.warn('[ai-alerts] fetch:', e.message);
        return [];
    }
}

/**
 * تعليم تنبيه كمقروء
 */
async function aiMarkAlertRead(alertId) {
    if (!alertId || typeof db === 'undefined') return false;
    if (typeof auth === 'undefined' || !auth.currentUser) return false;
    
    try {
        const uid = auth.currentUser.uid;
        await db.collection('users').doc(uid)
            .collection('ai_alerts').doc(alertId)
            .update({
                status: 'read',
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        return true;
    } catch(e) {
        return false;
    }
}

/**
 * تنظيف التنبيهات القديمة
 */
async function aiClearOldAlerts() {
    if (typeof db === 'undefined' || !db) return 0;
    if (typeof auth === 'undefined' || !auth.currentUser) return 0;
    
    try {
        const uid = auth.currentUser.uid;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - AI_ALERTS_CONFIG.maxAgeDays);
        
        const snap = await db.collection('users').doc(uid)
            .collection('ai_alerts')
            .where('createdAt', '<', cutoff)
            .limit(100)
            .get();
        
        let deleted = 0;
        const batch = db.batch();
        snap.forEach(d => {
            batch.delete(d.ref);
            deleted++;
        });
        if (deleted > 0) await batch.commit();
        
        console.log(`🗑️ [ai-alerts] حُذف ${deleted} تنبيه قديم`);
        return deleted;
    } catch(e) {
        return 0;
    }
}

// ═══════════════════════════════════════════════════════════
//  6. FORMAT — التنسيق للعرض
// ═══════════════════════════════════════════════════════════
function aiFormatAlerts(alerts) {
    if (!alerts || alerts.length === 0) {
        return '✅ لا توجد تنبيهات نشطة — كل شيء يعمل بشكل جيد!';
    }
    
    // تجميع حسب الشدة
    const high = alerts.filter(a => a.severity === 'high');
    const medium = alerts.filter(a => a.severity === 'medium');
    const low = alerts.filter(a => a.severity === 'low');
    
    let out = `🔔 *التنبيهات النشطة* (${alerts.length})\n\n`;
    
    if (high.length > 0) {
        out += '🔴 *حرج:*\n';
        high.forEach(a => {
            out += `   • ${a.message || a.title}\n`;
        });
        out += '\n';
    }
    
    if (medium.length > 0) {
        out += '🟠 *تحذير:*\n';
        medium.forEach(a => {
            out += `   • ${a.message || a.title}\n`;
        });
        out += '\n';
    }
    
    if (low.length > 0) {
        out += '🟡 *معلومة:*\n';
        low.forEach(a => {
            out += `   • ${a.message || a.title}\n`;
        });
        out += '\n';
    }
    
    return out;
}

/**
 * نسخة مختصرة للعرض السريع
 */
function aiFormatAlertsShort() {
    const alerts = aiDetectAnomalies();
    if (alerts.length === 0) return null;
    
    const high = alerts.filter(a => a.severity === 'high').length;
    return {
        count: alerts.length,
        high,
        summary: high > 0 
            ? `🔴 ${high} تنبيه حرج` 
            : `🟠 ${alerts.length} تنبيه`
    };
}

// ═══════════════════════════════════════════════════════════
//  7. SCHEDULING — الجدولة
// ═══════════════════════════════════════════════════════════
let _aiAlertsTimer = null;

/**
 * تشغيل فحص الآن
 */
async function aiRunAlertsCheck(silent) {
    try {
        const alerts = aiDetectAnomalies();
        
        if (alerts.length === 0) {
            if (!silent) console.log('✅ [ai-alerts] لا تنبيهات');
            return { count: 0 };
        }
        
        // حفظ في Firestore
        const saved = await aiSaveAlerts(alerts);
        
        console.log(`🔔 [ai-alerts] ${saved} تنبيه محفوظ`);
        
        // إشعار بصري
        if (typeof showToast === 'function' && !silent) {
            const high = alerts.filter(a => a.severity === 'high').length;
            if (high > 0) {
                showToast(`🔴 ${high} تنبيه حرج`, 'warning');
            } else {
                showToast(`🔔 ${alerts.length} تنبيه`, 'info');
            }
        }
        
        return {
            count: alerts.length,
            high: alerts.filter(a => a.severity === 'high').length,
            alerts
        };
    } catch(e) {
        console.warn('[ai-alerts] check:', e.message);
        return { count: 0 };
    }
}

/**
 * بدء الجدولة التلقائية
 */
function aiScheduleAlertsCheck() {
    if (_aiAlertsTimer) clearInterval(_aiAlertsTimer);
    
    // فحص أول بعد 30 ثانية
    setTimeout(() => {
        aiRunAlertsCheck(true);
    }, 30000);
    
    // ثم كل ساعة
    _aiAlertsTimer = setInterval(() => {
        aiRunAlertsCheck(true);
    }, AI_ALERTS_CONFIG.checkIntervalMinutes * 60 * 1000);
    
    console.log(`⏰ [ai-alerts] مجدول — كل ${AI_ALERTS_CONFIG.checkIntervalMinutes} دقيقة`);
}

/**
 * إيقاف الجدولة
 */
function aiStopAlertsCheck() {
    if (_aiAlertsTimer) {
        clearInterval(_aiAlertsTimer);
        _aiAlertsTimer = null;
        console.log('⏹️ [ai-alerts] توقف');
    }
}

// ═══════════════════════════════════════════════════════════
//  8. EXPORT
// ═══════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════
//  9. UI — العرض والتفاعل
// ═════════════════════════════════════════════════════════

function _aiAlertEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function _aiAlertFmtTime(ts) {
    if (!ts) return '—';
    let d;
    try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch(e) { return '—'; }
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'الآن';
    if (mins < 60) return 'منذ ' + mins + ' د';
    if (hours < 24) return 'منذ ' + hours + ' س';
    if (days < 30) return 'منذ ' + days + ' يوم';
    return d.toLocaleDateString('ar-EG');
}

function _aiAlertSeverityColor(sev) {
    if (sev === 'high') return { bg: '#ffebee', border: '#e74c3c', text: '#b71c1c', icon: '🔴' };
    if (sev === 'medium') return { bg: '#fff3e0', border: '#f39c12', text: '#e65100', icon: '🟠' };
    return { bg: '#e3f2fd', border: '#3498db', text: '#0d47a1', icon: '🟡' };
}

window._aiApplyBadge = function(count) {
    const btn = document.getElementById('aiAlertsBtn');
    if (!btn) return;
    let badge = btn.querySelector('.ai-alerts-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'ai-alerts-badge';
            badge.style.cssText = 'position:absolute;top:-5px;right:-5px;background:#e74c3c;color:white;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:10px;min-width:18px;text-align:center;box-shadow:0 2px 4px rgba(231,76,60,0.4);z-index:10;';
            btn.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : String(count);
    } else if (badge) {
        badge.remove();
    }
};

window.aiUpdateAlertsBadge = async function() {
    try {
        if (typeof aiGetActiveAlerts !== 'function') return;
        const alerts = await aiGetActiveAlerts();
        _aiApplyBadge(alerts.length);
    } catch(e) {
        console.warn('[ai-alerts-ui] badge:', e.message);
    }
};

window.openAiAlerts = async function() {
    document.getElementById('aiAlertsModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'aiAlertsModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:2147483647;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;font-family:inherit;direction:rtl;';
    modal.innerHTML = `
        <div style="background:white;border-radius:16px;max-width:560px;width:100%;padding:20px;margin:auto;box-shadow:0 8px 40px rgba(0,0,0,0.35);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div style="font-size:18px;font-weight:800;color:#2c3e50;">🔔 التنبيهات الذكية</div>
                <button onclick="document.getElementById('aiAlertsModal').remove()" style="background:#ecf0f1;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;font-weight:bold;">✖</button>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:14px;">
                <button onclick="_aiRunScan()" style="flex:1;padding:10px;background:linear-gradient(135deg,#8e44ad,#6a1b9a);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">🔍 فحص الآن</button>
                <button onclick="_aiMarkAllRead()" style="flex:1;padding:10px;background:linear-gradient(135deg,#27ae60,#229954);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">✅ تعليم الكل كمقروء</button>
            </div>
            <div id="aiAlertsList">
                <div style="text-align:center;padding:40px;color:#999;">⏳ جاري التحميل...</div>
            </div>
        </div>`;
    document.body.appendChild(modal);

    await _aiRefreshAlertsList();
};

async function _aiRefreshAlertsList() {
    const listEl = document.getElementById('aiAlertsList');
    if (!listEl) return;

    try {
        const alerts = await aiGetActiveAlerts();
        _aiApplyBadge(alerts.length);

        if (alerts.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center;padding:40px 20px;color:#27ae60;">
                    <div style="font-size:48px;margin-bottom:10px;">✅</div>
                    <div style="font-size:15px;font-weight:700;">لا توجد تنبيهات — كل شيء يعمل بشكل جيد!</div>
                    <div style="font-size:12px;color:#666;margin-top:8px;">سنُخبرك عند أي شذوذ</div>
                </div>`;
            return;
        }

        listEl.innerHTML = alerts.map(a => {
            const c = _aiAlertSeverityColor(a.severity);
            return `
                <div style="background:${c.bg};border:2px solid ${c.border};border-radius:12px;padding:12px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <div style="font-size:14px;font-weight:700;color:${c.text};">${c.icon} ${_aiAlertEsc(a.title || '')}</div>
                        <div style="font-size:11px;color:#666;">${_aiAlertFmtTime(a.createdAt)}</div>
                    </div>
                    <div style="font-size:12.5px;color:#333;line-height:1.6;margin-bottom:8px;">${_aiAlertEsc(a.message || '')}</div>
                    <button onclick="_aiMarkRead('${_aiAlertEsc(a.id)}')" style="padding:6px 12px;background:${c.border};color:white;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">✓ تم</button>
                </div>`;
        }).join('');
    } catch(e) {
        console.error('[ai-alerts-ui]', e);
        listEl.innerHTML = '<div style="color:#e74c3c;text-align:center;padding:20px;">❌ فشل التحميل: ' + _aiAlertEsc(e.message) + '</div>';
    }
}

window._aiRunScan = async function() {
    try {
        const result = await aiRunAlertsCheck(false);
        if (result.count === 0) {
            if (typeof showToast === 'function') showToast('✅ لا تنبيهات جديدة', 'success');
        } else {
            if (typeof showToast === 'function') showToast('🔔 ' + result.count + ' تنبيه', 'info');
        }
        await _aiRefreshAlertsList();
    } catch(e) {
        console.warn('[ai-alerts-ui] scan:', e);
    }
};

window._aiMarkRead = async function(alertId) {
    try {
        await aiMarkAlertRead(alertId);
        await _aiRefreshAlertsList();
    } catch(e) {
        console.warn('[ai-alerts-ui] markRead:', e);
    }
};

window._aiMarkAllRead = async function() {
    try {
        const alerts = await aiGetActiveAlerts();
        for (const a of alerts) {
            await aiMarkAlertRead(a.id);
        }
        if (typeof showToast === 'function') showToast('✅ تم تعليم الكل كمقروء', 'success');
        await _aiRefreshAlertsList();
    } catch(e) {
        console.warn('[ai-alerts-ui] markAllRead:', e);
    }
};

// تحديث الشارة دورياً
setInterval(() => {
    if (typeof aiUpdateAlertsBadge === 'function') aiUpdateAlertsBadge();
}, 5 * 60 * 1000);
setTimeout(() => {
    if (typeof aiUpdateAlertsBadge === 'function') aiUpdateAlertsBadge();
}, 8000);

window.aiDetectAnomalies = aiDetectAnomalies;
window.aiDetectSalesDrop = aiDetectSalesDrop;
window.aiDetectExpenseSpike = aiDetectExpenseSpike;
window.aiDetectInventoryRisk = aiDetectInventoryRisk;
window.aiDetectProfitAnomaly = aiDetectProfitAnomaly;
window.aiFormatAlerts = aiFormatAlerts;
window.aiFormatAlertsShort = aiFormatAlertsShort;
window.aiGetActiveAlerts = aiGetActiveAlerts;
window.aiMarkAlertRead = aiMarkAlertRead;
window.aiClearOldAlerts = aiClearOldAlerts;
window.aiRunAlertsCheck = aiRunAlertsCheck;
window.aiScheduleAlertsCheck = aiScheduleAlertsCheck;
window.aiStopAlertsCheck = aiStopAlertsCheck;
window.AI_ALERTS_CONFIG = AI_ALERTS_CONFIG;

console.log('🔔 [ai-alerts] v1.0.0 محمّل');
