// ============================================================
//  🔌 ANALYTICS PROVIDERS — مزودو التحليلات
//  8 أنظمة تُسجّل نفسها تلقائياً في AnalyticsEngine
// ============================================================

(function() {
    'use strict';

    if (typeof AnalyticsEngine === 'undefined') {
        console.error('[AE-P] analytics-engine.js غير محمّل!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    //  أدوات مساعدة
    // ═══════════════════════════════════════════════════════
    const _arr = (v) => Array.isArray(v) ? v : [];
    const _num = (v) => parseFloat(v) || 0;

    /**
     * قراءة آمنة لمتغير عام (يعمل مع let/const/var)
     * 💡 يستخدم eval للوصول للنطاق اللكسي
     */
    function _d(name) {
        try {
            const v = eval(name);
            if (Array.isArray(v)) return v;
            if (v && typeof v === 'object') return v;
            return v;
        } catch(e) {
            return undefined;
        }
    }

    /**
     * فلترة حسب النطاق الزمني
     * @param {Array} items - عناصر فيها .date
     * @param {Object} ctx - { from, to }
     */
    function _inRange(items, ctx) {
        if (!ctx || (!ctx.from && !ctx.to)) return items;
        return items.filter(it => {
            const d = it.date || '';
            if (ctx.from && d < ctx.from) return false;
            if (ctx.to && d > ctx.to) return false;
            return true;
        });
    }

    // ═══════════════════════════════════════════════════════
    //  💰 1) SALES — المبيعات
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'sales',
        label: 'المبيعات',
        icon: '💰',
        priority: 1,
        metrics: {
            // إجمالي المبيعات (grandTotal إن وُجد، وإلا total)
            total: (ctx) => {
                const list = _inRange(_arr(_d('sales')), ctx);
                return list.reduce((s, x) => {
                    const v = (typeof getSaleGrandTotal === 'function')
                        ? getSaleGrandTotal(x)
                        : _num(x.total);
                    return s + v;
                }, 0);
            },

            // عدد الفواتير
            count: (ctx) => _inRange(_arr(_d('sales')), ctx).length,

            // تكلفة المواد المُباعة (COGS)
            cogs: (ctx) => {
                const list = _inRange(_arr(_d('sales')), ctx);
                let cogs = 0;
                list.forEach(s => {
                    if (Array.isArray(s.items) && s.items.length > 0) {
                        s.items.forEach(it => {
                            cogs += _num(it.costAtSale) * _num(it.qty);
                        });
                    } else if (s.costAtSale) {
                        cogs += _num(s.costAtSale) * _num(s.qty);
                    }
                });
                return cogs;
            },

            // الربح الصافي للمبيعات (قبل خصم المصروفات)
            profit: (ctx) => {
                const list = _inRange(_arr(_d('sales')), ctx);
                let profit = 0;
                list.forEach(s => {
                    if (Array.isArray(s.items) && s.items.length > 0) {
                        s.items.forEach(it => {
                            const unitPrice = _num(it.unitPrice);
                            const cost = _num(it.costAtSale);
                            profit += (unitPrice - cost) * _num(it.qty);
                        });
                    } else if (s.total && s.costAtSale) {
                        profit += (_num(s.total) - _num(s.costAtSale) * _num(s.qty));
                    }
                });
                return profit;
            },

            // VAT المُحقّق
            vat: (ctx) => {
                const list = _inRange(_arr(_d('sales')), ctx);
                return list.reduce((s, x) => {
                    const v = (typeof getSaleVAT === 'function')
                        ? getSaleVAT(x)
                        : _num(x.vat);
                    return s + v;
                }, 0);
            },

            // متوسط قيمة الفاتورة
            avgInvoice: (ctx) => {
                const list = _inRange(_arr(_d('sales')), ctx);
                if (list.length === 0) return 0;
                const total = list.reduce((s, x) => {
                    return s + ((typeof getSaleGrandTotal === 'function')
                        ? getSaleGrandTotal(x)
                        : _num(x.total));
                }, 0);
                return total / list.length;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  💸 2) EXPENSES — المصروفات
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'expenses',
        label: 'المصروفات',
        icon: '💸',
        priority: 2,
        metrics: {
            total: (ctx) => {
                const list = _inRange(_arr(_d('expenses')), ctx);
                return list.reduce((s, x) => s + _num(x.amount), 0);
            },

            count: (ctx) => _inRange(_arr(_d('expenses')), ctx).length,

            // توزيع حسب التصنيف
            byCategory: (ctx) => {
                const list = _inRange(_arr(_d('expenses')), ctx);
                const map = {};
                list.forEach(e => {
                    const cat = e.category || 'أخرى';
                    map[cat] = (map[cat] || 0) + _num(e.amount);
                });
                return map;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  🛒 3) PURCHASES — المشتريات
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'purchases',
        label: 'المشتريات',
        icon: '🛒',
        priority: 3,
        metrics: {
            total: (ctx) => {
                // المشتريات في Firestore collection — نخزّنها في window.purchasesCache
                const list = _inRange(_arr(_d('purchasesCache')), ctx);
                return list.reduce((s, x) => s + _num(x.total), 0);
            },

            count: (ctx) => _inRange(_arr(_d('purchasesCache')), ctx).length,

            // إجمالي المدفوع للموردين
            paid: (ctx) => {
                const list = _inRange(_arr(_d('purchasesCache')), ctx);
                return list.reduce((s, x) => s + _num(x.paid), 0);
            },

            // المتبقي (دين على المستخدم)
            remaining: (ctx) => {
                const list = _inRange(_arr(_d('purchasesCache')), ctx);
                return list.reduce((s, x) => s + _num(x.remaining), 0);
            },

            // عدد الموردين
            suppliersCount: () => {
                if (typeof _d('suppliers') !== 'undefined' && Array.isArray(suppliers)) {
                    return suppliers.length;
                }
                return 0;
            },

            // ديون الموردين (ما ندين به)
            supplierDebts: () => {
                const suppliers = _d('suppliers'); if (!Array.isArray(suppliers)) return 0;
                return suppliers.reduce((s, sup) => s + Math.max(0, _num(sup.balance)), 0);
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  🏠 4) WAREHOUSES — المستودعات
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'warehouses',
        label: 'المستودعات',
        icon: '🏠',
        priority: 4,
        metrics: {
            count: () => _arr(_d('warehouses')).length,

            // قيمة المخزون (stock × cost) لكل المستودعات
            stockValue: () => {
                const mats = _arr(_d('materials'));
                return mats.reduce((s, m) => {
                    const stock = _num(m.stock);
                    const cost = _num(m.costSYP) || _num(m.cost);
                    return s + (stock * cost);
                }, 0);
            },

            // عدد المواد
            materialsCount: () => _arr(_d('materials')).length,

            // توزيع المخزون على المستودعات
            distribution: () => {
                const whs = _arr(_d('warehouses'));
                const mats = _arr(_d('materials'));
                return whs.map(w => {
                    let value = 0;
                    let items = 0;
                    mats.forEach(m => {
                        const qty = m.stockByWarehouse?.[w.id] || 0;
                        if (qty > 0) {
                            items++;
                            const cost = _num(m.costSYP) || _num(m.cost);
                            value += qty * cost;
                        }
                    });
                    return {
                        id: w.id,
                        name: w.name,
                        items,
                        value,
                        isDefault: w.isDefault === true
                    };
                });
            },

            // عدد المواد ذات المخزون المنخفض
            lowStock: () => {
                const mats = _arr(_d('materials'));
                return mats.filter(m => _num(m.stock) < _num(m.minStock) && _num(m.minStock) > 0).length;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  💼 5) BOXES — الصناديق
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'boxes',
        label: 'الصناديق',
        icon: '💼',
        priority: 5,
        metrics: {
            count: () => _arr(_d('_pbCache')).length,

            // إجمالي الرصيد
            totalBalance: () => {
                return _arr(_d('_pbCache')).reduce((s, b) => s + _num(b.balance), 0);
            },

            // قائمة الأرصدة
            list: () => {
                return _arr(_d('_pbCache')).map(b => ({
                    id: b.id,
                    name: b.name,
                    icon: b.icon || '💰',
                    balance: _num(b.balance)
                }));
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  💼 6) OWNER WITHDRAWALS — مسحوبات المالك
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'ownerWithdrawals',
        label: 'مسحوبات المالك',
        icon: '💼',
        priority: 6,
        metrics: {
            total: (ctx) => {
                const list = _inRange(_arr(_d('ownerWithdrawals')), ctx);
                return list.reduce((s, x) => s + _num(x.amount), 0);
            },

            count: (ctx) => _inRange(_arr(_d('ownerWithdrawals')), ctx).length,

            // توزيع حسب التصنيف
            byCategory: (ctx) => {
                const list = _inRange(_arr(_d('ownerWithdrawals')), ctx);
                const map = {};
                const labels = (typeof OW_CATEGORIES !== 'undefined') ? OW_CATEGORIES : {};
                list.forEach(w => {
                    const cat = labels[w.category] || w.category || 'أخرى';
                    map[cat] = (map[cat] || 0) + _num(w.amount);
                });
                return map;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  📦 7) DISPOSALS — الإتلافات
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'disposals',
        label: 'الإتلافات',
        icon: '📦',
        priority: 7,
        metrics: {
            // إجمالي الخسائر
            total: (ctx) => {
                const list = _inRange(_arr(_d('disposals')), ctx);
                return list.reduce((s, x) => s + _num(x.totalLoss), 0);
            },

            count: (ctx) => _inRange(_arr(_d('disposals')), ctx).length,

            // عدد الوحدات المُتلفة
            units: (ctx) => {
                const list = _inRange(_arr(_d('disposals')), ctx);
                return list.reduce((s, x) => s + _num(x.qty), 0);
            },

            // توزيع حسب السبب
            byReason: (ctx) => {
                const list = _inRange(_arr(_d('disposals')), ctx);
                const map = {};
                const reasons = (typeof DSP_REASONS !== 'undefined') ? DSP_REASONS : {};
                list.forEach(d => {
                    const r = reasons[d.reason] || d.reason || 'أخرى';
                    map[r] = (map[r] || 0) + _num(d.totalLoss);
                });
                return map;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  🔄 8) RETURNS — الإرجاعات
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'returns',
        label: 'الإرجاعات',
        icon: '🔄',
        priority: 8,
        metrics: {
            // عدد إرجاعات المبيعات
            count: () => _arr(_d('returns')).length,

            // عدد مرتجعات المشتريات
            purchaseCount: () => _arr(_d('purchaseReturns')).length,

            // إجمالي قيمة المرتجعات
            total: () => {
                const salesRet = _arr(_d('returns')).reduce((s, x) => s + _num(x.total), 0);
                const purRet = _arr(_d('purchaseReturns')).reduce((s, x) => s + _num(x.total), 0);
                return salesRet + purRet;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  🎁 9) PROFIT — الربح الصافي (يجمّع من الكل)
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'profit',
        label: 'الربح',
        icon: '💵',
        priority: 100,  // آخر شيء (يعتمد على غيره)
        metrics: {
            // صافي الربح = مبيعات - مصروفات - COGS - إتلافات
            net: (ctx) => {
                const salesTotal = AnalyticsEngine.get('sales.total', ctx) || 0;
                const cogs = AnalyticsEngine.get('sales.cogs', ctx) || 0;
                const expensesTotal = AnalyticsEngine.get('expenses.total', ctx) || 0;
                const disposals = AnalyticsEngine.get('disposals.total', ctx) || 0;
                return salesTotal - expensesTotal - cogs - disposals;
            },

            // هامش الربح %
            margin: (ctx) => {
                const salesTotal = AnalyticsEngine.get('sales.total', ctx) || 0;
                if (salesTotal === 0) return 0;
                const net = AnalyticsEngine.get('profit.net', ctx) || 0;
                return (net / salesTotal) * 100;
            },

            // الربح الإجمالي (قبل المصروفات)
            gross: (ctx) => {
                const salesTotal = AnalyticsEngine.get('sales.total', ctx) || 0;
                const cogs = AnalyticsEngine.get('sales.cogs', ctx) || 0;
                return salesTotal - cogs;
            }
        }
    });

    // ═══════════════════════════════════════════════════════
    //  📊 10) CUSTOMERS — العملاء (Bonus)
    // ═══════════════════════════════════════════════════════
    AnalyticsEngine.register({
        id: 'customers',
        label: 'العملاء',
        icon: '👥',
        priority: 9,
        metrics: {
            count: () => {
                const customers = _d('customers'); if (Array.isArray(customers)) {
                    return customers.length;
                }
                return 0;
            },

            // ديون العملاء (ما لنا عندهم)
            receivables: () => {
                const customers = _d('customers'); if (!Array.isArray(customers)) return 0;
                return customers.reduce((s, c) => s + Math.max(0, _num(c.balance)), 0);
            }
        }
    });

    console.log(`🔌 [AE-P] ${AnalyticsEngine.providersCount()} مزود مسجّل`);
    console.log('📋 [AE-P] المزودون:', AnalyticsEngine.list().map(p => p.icon + ' ' + p.label).join(' • '));

})();
