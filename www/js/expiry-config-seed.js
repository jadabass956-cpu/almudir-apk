// ============================================================
//  🌱 SEED: activity_config — الأنشطة التي تتطلب صلاحية
// ============================================================

async function seedActivityConfig() {
    if (typeof db === 'undefined') {
        console.error('❌ db غير معرّفة');
        return;
    }

    const configs = [
        { activityId: 'pharmacy',   name: 'صيدلية',              requiresExpiry: true },
        { activityId: 'medical',    name: 'مستلزمات طبية',        requiresExpiry: true },
        { activityId: 'food',       name: 'مواد غذائية',          requiresExpiry: true },
        { activityId: 'vegetables', name: 'خضار وفواكه',          requiresExpiry: true },
        { activityId: 'meat',       name: 'لحوم ودواجن',          requiresExpiry: true },
        { activityId: 'bakery',     name: 'مخبز وحلويات',         requiresExpiry: true },
        { activityId: 'dairy',      name: 'ألبان وأجبان',         requiresExpiry: true },
        { activityId: 'beverages',  name: 'مشروبات',              requiresExpiry: true },
        { activityId: 'snacks',     name: 'سناكس وبسكويت',       requiresExpiry: true },
        { activityId: 'spices',     name: 'بهارات وتوابل',       requiresExpiry: true },
        { activityId: 'cosmetics',  name: 'مستحضرات تجميل',       requiresExpiry: true },
        { activityId: 'cleaning',   name: 'مواد تنظيف',           requiresExpiry: true },
        { activityId: 'clothing',   name: 'ملابس',                requiresExpiry: false },
        { activityId: 'electronics',name: 'إلكترونيات',           requiresExpiry: false },
        { activityId: 'tools',      name: 'أدوات ومعدات',        requiresExpiry: false },
        { activityId: 'furniture',  name: 'أثاث',                 requiresExpiry: false },
        { activityId: 'stationery', name: 'قرطاسية',              requiresExpiry: false },
        { activityId: 'toys',       name: 'ألعاب',                requiresExpiry: false },
        { activityId: 'other',      name: 'أنشطة أخرى',           requiresExpiry: false }
    ];

    try {
        const batch = db.batch();
        for (const c of configs) {
            const ref = db.collection('activity_config').doc(c.activityId);
            batch.set(ref, {
                ...c,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        await batch.commit();
        console.log(`✅ تم حفظ ${configs.length} نشاط في activity_config`);
    } catch(e) {
        console.error('❌ فشل seed:', e.message);
    }
}

console.log('🌱 [expiry-config-seed] جاهز — نفّذ: seedActivityConfig()');
