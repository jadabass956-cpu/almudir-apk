// ============================================================
//  🧠 ANALYTICS ENGINE — محرك التحليلات الموحّد
//  Plugin-based • Single Source of Truth • Extensible
// ============================================================

const AnalyticsEngine = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════
    //  🗄️ Registry — سجل المزودين
    // ═══════════════════════════════════════════════════════
    const _providers = new Map();   // id → provider
    const _cache = new Map();       // key → { value, timestamp }

    const CACHE_TTL = 30000;        // 30 ثانية

    // ═══════════════════════════════════════════════════════
    //  📝 register — تسجيل مزود
    // ═══════════════════════════════════════════════════════
    /**
     * @param {Object} provider - { id, label, icon, priority, metrics }
     *   - id: معرّف فريد (مثل 'sales', 'warehouses')
     *   - label: اسم عربي للعرض
     *   - icon: رمز تعبيري
     *   - priority: ترتيب (1-100)
     *   - metrics: { metricName: () => value } أو { metricName: (context) => value }
     */
    function register(provider) {
        if (!provider || !provider.id) {
            console.warn('[AE] مزود بدون id — تم رفضه');
            return false;
        }
        if (_providers.has(provider.id)) {
            console.warn(`[AE] مزود مكرر: ${provider.id} — تجاوز`);
        }
        _providers.set(provider.id, {
            id: provider.id,
            label: provider.label || provider.id,
            icon: provider.icon || '📊',
            priority: provider.priority || 50,
            metrics: provider.metrics || {},
            registeredAt: Date.now()
        });
        console.log(`✅ [AE] مزود مسجّل: ${provider.icon || ''} ${provider.label || provider.id}`);
        return true;
    }

    // ═══════════════════════════════════════════════════════
    //  🚫 unregister — إلغاء تسجيل
    // ═══════════════════════════════════════════════════════
    function unregister(id) {
        if (_providers.has(id)) {
            _providers.delete(id);
            _cache.clear();
            return true;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════
    //  📋 list — عرض المزودين المسجّلين
    // ═══════════════════════════════════════════════════════
    function list() {
        return Array.from(_providers.values())
            .sort((a, b) => a.priority - b.priority);
    }

    // ═══════════════════════════════════════════════════════
    //  🎯 get — الحصول على قيمة مؤشر
    // ═══════════════════════════════════════════════════════
    function get(metricId, context) {
        // metricId: "sales.total" أو "warehouses.stockValue"
        const [providerId, metricName] = metricId.split('.');

        const provider = _providers.get(providerId);
        if (!provider) {
            console.warn(`[AE] مزود غير موجود: ${providerId}`);
            return null;
        }

        const fn = provider.metrics[metricName];
        if (typeof fn !== 'function') {
            console.warn(`[AE] مؤشر غير موجود: ${metricId}`);
            return null;
        }

        // Cache check
        const cacheKey = metricId + ':' + JSON.stringify(context || {});
        const cached = _cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return cached.value;
        }

        // Compute
        try {
            const value = fn(context || {});
            _cache.set(cacheKey, { value, timestamp: Date.now() });
            return value;
        } catch (e) {
            console.error(`[AE] خطأ في ${metricId}:`, e);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  🎨 getAll — كل المؤشرات لمزود
    // ═══════════════════════════════════════════════════════
    function getAll(providerId, context) {
        const provider = _providers.get(providerId);
        if (!provider) return {};

        const result = {};
        Object.keys(provider.metrics).forEach(metricName => {
            result[metricName] = get(`${providerId}.${metricName}`, context);
        });
        return result;
    }

    // ═══════════════════════════════════════════════════════
    //  🏆 getDashboard — لوحة معلومات كاملة
    // ═══════════════════════════════════════════════════════
    function getDashboard(context) {
        const result = {
            _meta: {
                generatedAt: new Date().toISOString(),
                providersCount: _providers.size,
                context: context || {}
            },
            providers: {}
        };

        list().forEach(provider => {
            result.providers[provider.id] = {
                label: provider.label,
                icon: provider.icon,
                metrics: {}
            };
            Object.keys(provider.metrics).forEach(metricName => {
                result.providers[provider.id].metrics[metricName] = 
                    get(`${provider.id}.${metricName}`, context);
            });
        });

        return result;
    }

    // ═══════════════════════════════════════════════════════
    //  🔄 invalidate — إبطال الكاش
    // ═══════════════════════════════════════════════════════
    function invalidate(providerId) {
        if (!providerId) {
            _cache.clear();
            return;
        }
        // حذف كل مفاتيح المزود
        const keys = Array.from(_cache.keys());
        keys.forEach(k => {
            if (k.startsWith(providerId + '.')) _cache.delete(k);
        });
    }

    // ═══════════════════════════════════════════════════════
    //  📊 summary — ملخص سريع (للـ AI / Dashboard)
    // ═══════════════════════════════════════════════════════
    function summary(context) {
        return {
            sales: get('sales.total', context),
            profit: get('sales.profit', context),
            expenses: get('expenses.total', context),
            purchases: get('purchases.total', context),
            cash: get('boxes.totalBalance', context),
            stockValue: get('warehouses.stockValue', context),
            ownerWithdrawals: get('ownerWithdrawals.total', context),
            disposals: get('disposals.total', context)
        };
    }

    // ═══════════════════════════════════════════════════════
    //  🌐 API العام
    // ═══════════════════════════════════════════════════════
    return {
        register,
        unregister,
        list,
        get,
        getAll,
        getDashboard,
        summary,
        invalidate,

        // معلومات
        version: '1.0.0',
        providersCount: () => _providers.size,
        cacheSize: () => _cache.size
    };
})();

// تصدير
window.AnalyticsEngine = AnalyticsEngine;

console.log('🧠 [AE] analytics-engine.js v1.0.0 محمّل');
