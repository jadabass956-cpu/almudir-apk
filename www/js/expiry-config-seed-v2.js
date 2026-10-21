// ============================================================
//  🌱 SEED v2: activity_config — إضافة requiresBarcode
// ============================================================

async function seedActivityConfigV2() {
    if (typeof db === 'undefined') {
        console.error('❌ db غير معرّفة');
        return;
    }

    // الأنشطة + خصائص الباركود
    const updates = {
        pharmacy:     { requiresBarcode: true,  isRedLine: true  },  // 🔴 خط أحمر
        medical:      { requiresBarcode: true,  isRedLine: false },
        food:         { requiresBarcode: false, isRedLine: false },
        vegetables:   { requiresBarcode: false, isRedLine: false },
        meat:         { requiresBarcode: true,  isRedLine: false },
        bakery:       { requiresBarcode: false, isRedLine: false },
        dairy:        { requiresBarcode: true,  isRedLine: false },
        beverages:    { requiresBarcode: false, isRedLine: false },
        snacks:       { requiresBarcode: false, isRedLine: false },
        spices:       { requiresBarcode: false, isRedLine: false },
        cosmetics:    { requiresBarcode: true,  isRedLine: false },
        cleaning:     { requiresBarcode: true,  isRedLine: false },
        clothing:     { requiresBarcode: false, isRedLine: false },
        electronics:  { requiresBarcode: true,  isRedLine: false },
        tools:        { requiresBarcode: false, isRedLine: false },
        furniture:    { requiresBarcode: false, isRedLine: false },
        stationery:   { requiresBarcode: false, isRedLine: false },
        toys:         { requiresBarcode: false, isRedLine: false },
        other:        { requiresBarcode: false, isRedLine: false }
    };

    try {
        const batch = db.batch();
        let count = 0;
        for (const [id, data] of Object.entries(updates)) {
            const ref = db.collection('activity_config').doc(id);
            batch.update(ref, {
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }
        await batch.commit();
        console.log(`✅ تم تحديث ${count} نشاط بـ requiresBarcode + isRedLine`);
    } catch(e) {
        console.error('❌ فشل seed v2:', e.message);
    }
}

console.log('🌱 [expiry-config-seed-v2] جاهز — نفّذ: seedActivityConfigV2()');
