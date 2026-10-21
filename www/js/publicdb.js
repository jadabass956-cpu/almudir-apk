// ============================================================
//  ALMUDIR AI — Public Barcode Database v2
//  يدعم: تصويت على الأسماء + كشف التضارب + نظام الثقة
// ============================================================

const PUBLIC_BC_COLLECTION = 'public_barcodes';
const TRUST_THRESHOLD = 20; // عدد الإسهامات ليصبح موثوقاً

// ---------- دوال مساعدة ----------
function _bcClean(barcode) {
    return String(barcode || '').trim();
}

function _bcValid(barcode) {
    const b = _bcClean(barcode);
    return b.length >= 8 && b.length <= 20 && /^[0-9A-Za-z\-]+$/.test(b);
}

function _bcCleanName(name) {
    const n = String(name || '').trim();
    if (n.length < 3 || n.length > 100) return null;
    if (/https?:\/\//i.test(n)) return null;
    return n;
}

// تنظيف الاسم للمقارنة (يتجاهل الهمزات والمسافات)
function _bcNameKey(name) {
    return String(name || '')
        .replace(/[أإآا]/g, 'ا')
        .replace(/[ىي]/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/[ًٌٍَُِّْـ]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

// حساب السعر المقترح
function calculateSuggestedPrice(priceHistory, currency) {
    if (!Array.isArray(priceHistory) || !currency) return null;

    const values = priceHistory
        .filter(p => p && p.cur === currency && typeof p.val === 'number' && p.val > 0)
        .map(p => p.val)
        .sort((a, b) => a - b);

    if (values.length < 1) return null;

    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];

    let confidence = 'draft';
    let label = 'سعر إرشادي';
    if (values.length >= 5) {
        confidence = 'trusted';
        label = 'سعر موثوق';
    } else if (values.length >= 2) {
        confidence = 'suggested';
        label = 'سعر مقترح';
    }

    return {
        value: Math.round(median),
        min: values[0],
        max: values[values.length - 1],
        count: values.length,
        currency: currency,
        confidence: confidence,
        label: label,
        showRange: values.length >= 3
    };
}

// ---------- قراءة المستخدم الحالي ----------
async function _bcGetMyProfile() {
    if (typeof auth === 'undefined' || !auth.currentUser) return null;
    const uid = auth.currentUser.uid;
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (!doc.exists) return { uid: uid, isTrusted: false, contributions: 0 };
        const d = doc.data();
        return {
            uid: uid,
            isTrusted: (d.bcContributions || 0) >= TRUST_THRESHOLD,
            contributions: d.bcContributions || 0
        };
    } catch (e) {
        return { uid: uid, isTrusted: false, contributions: 0 };
    }
}

// ============================================================
//  قراءة باركود
// ============================================================
async function lookupBarcode(barcode) {
    const b = _bcClean(barcode);
    if (!_bcValid(b)) return null;

    try {
        const doc = await db.collection(PUBLIC_BC_COLLECTION).doc(b).get();
        if (!doc.exists) return null;

        const data = doc.data();

        // إحصاء الاستخدام (بصمت)
        db.collection(PUBLIC_BC_COLLECTION).doc(b).update({
            usageCount: firebase.firestore.FieldValue.increment(1),
            lastUsedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function() {});

        // استخراج الاسم الأكثر تصويتاً
        let namesList = Array.isArray(data.names) ? data.names.slice() : [];

        // توافقية مع البيانات القديمة
        if (!namesList.length && data.name) {
            namesList = [{ val: data.name, votes: 1, by: [] }];
        }

        // ترتيب حسب الأصوات
        namesList.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        const topName = namesList.length > 0 ? namesList[0].val : (data.name || '');
        const hasConflict = namesList.length > 1
            && (namesList[0].votes - namesList[1].votes) < 2
            && namesList[1].votes >= 1;

        return {
            barcode: b,
            name: topName,
            names: namesList,
            hasConflict: hasConflict,
            type: data.type || '',
            unit: data.unit || '',
            priceHistory: data.priceHistory || [],
            usageCount: data.usageCount || 0,
            contributors: data.contributors || [],
            pendingReview: data.pendingReview || false
        };
    } catch (e) {
        console.warn('[publicdb] lookup failed:', e);
        return null;
    }
}

// ============================================================
//  مساهمة بباركود جديد أو تحديث موجود
// ============================================================
async function contributeBarcode(barcode, info) {
    const b = _bcClean(barcode);
    if (!_bcValid(b)) return { ok: false, reason: 'invalid_barcode' };

    const cleanName = _bcCleanName(info.name);
    if (!cleanName) return { ok: false, reason: 'invalid_name' };

    const user = auth.currentUser;
    if (!user) return { ok: false, reason: 'not_logged_in' };

    const profile = await _bcGetMyProfile();
    const isTrusted = profile && profile.isTrusted;

    try {
        const ref = db.collection(PUBLIC_BC_COLLECTION).doc(b);
        const snap = await ref.get();

        const newPriceEntry = info.price && info.currency
            ? { cur: info.currency, val: Number(info.price), ts: Date.now() }
            : null;

        const nameKey = _bcNameKey(cleanName);

        if (!snap.exists) {
            // ✅ وثيقة جديدة
            const doc = {
                names: [{ val: cleanName, votes: 1, by: [user.uid], addedAt: Date.now() }],
                name: cleanName, // للتوافقية
                type: String(info.type || '').trim().slice(0, 50),
                unit: String(info.unit || '').trim().slice(0, 20),
                addedBy: user.uid,
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                usageCount: 1,
                contributors: [user.uid],
                priceHistory: newPriceEntry ? [newPriceEntry] : [],
                hasConflict: false,
                pendingReview: !isTrusted // مراجعة إن كان غير موثوق
            };
            await ref.set(doc);
            await _bcIncrementUserContribution(user.uid);
            console.log('[publicdb] ✅ وثيقة جديدة:', b);
            return { ok: true, action: 'created', pendingReview: !isTrusted };
        }

        // ⏳ وثيقة موجودة
        const data = snap.data();
        let namesList = Array.isArray(data.names) ? data.names.slice() : [];

        // توافقية
        if (!namesList.length && data.name) {
            namesList = [{ val: data.name, votes: 1, by: [] }];
        }

        // ابحث عن الاسم في القائمة
        const existingIdx = namesList.findIndex(n => _bcNameKey(n.val) === nameKey);

        if (existingIdx >= 0) {
            // ✅ الاسم موجود → صوّت له (إن لم يكن صوّت مسبقاً)
            const existing = namesList[existingIdx];
            const alreadyVoted = (existing.by || []).indexOf(user.uid) !== -1;

            if (!alreadyVoted) {
                existing.votes = (existing.votes || 0) + 1;
                existing.by = (existing.by || []).concat([user.uid]);
                if (existing.by.length > 100) existing.by = existing.by.slice(-100);
            }
        } else {
            // 🆕 اسم جديد → أضفه مع صوت واحد
            namesList.push({
                val: cleanName,
                votes: 1,
                by: [user.uid],
                addedAt: Date.now()
            });
        }

        // أعد الترتيب
        namesList.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        // افحص التضارب
        const hasConflict = namesList.length > 1
            && (namesList[0].votes - namesList[1].votes) < 2
            && namesList[1].votes >= 1;

        // تحديث الأسعار
        let priceHistory = Array.isArray(data.priceHistory) ? data.priceHistory.slice() : [];
        if (newPriceEntry) {
            priceHistory.push(newPriceEntry);
            if (priceHistory.length > 20) priceHistory = priceHistory.slice(-20);
        }

        // تحديث المساهمين
        let contributors = Array.isArray(data.contributors) ? data.contributors.slice() : [];
        if (contributors.indexOf(user.uid) === -1) contributors.push(user.uid);
        if (contributors.length > 100) contributors = contributors.slice(-100);

        await ref.update({
            names: namesList,
            name: namesList[0].val, // للتوافقية
            priceHistory: priceHistory,
            contributors: contributors,
            hasConflict: hasConflict,
            pendingReview: hasConflict && !isTrusted,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await _bcIncrementUserContribution(user.uid);

        console.log('[publicdb] ✅ تحديث:', b, '| conflict:', hasConflict);
        return {
            ok: true,
            action: 'updated',
            hasConflict: hasConflict,
            topName: namesList[0].val
        };

    } catch (e) {
        console.error('[publicdb] contribute failed:', e);
        return { ok: false, reason: e.message };
    }
}

// ============================================================
//  تصويت صريح على اسم موجود
// ============================================================
async function voteForName(barcode, nameValue) {
    const b = _bcClean(barcode);
    if (!_bcValid(b)) return { ok: false };

    const user = auth.currentUser;
    if (!user) return { ok: false };

    try {
        const ref = db.collection(PUBLIC_BC_COLLECTION).doc(b);
        const snap = await ref.get();
        if (!snap.exists) return { ok: false };

        const data = snap.data();
        let namesList = Array.isArray(data.names) ? data.names.slice() : [];
        if (!namesList.length && data.name) {
            namesList = [{ val: data.name, votes: 1, by: [] }];
        }

        const nameKey = _bcNameKey(nameValue);
        const idx = namesList.findIndex(n => _bcNameKey(n.val) === nameKey);
        if (idx < 0) return { ok: false };

        const target = namesList[idx];
        if ((target.by || []).indexOf(user.uid) !== -1) {
            return { ok: true, alreadyVoted: true };
        }

        // انقل صوت المستخدم إذا كان قد صوّت لاسم آخر
        namesList.forEach(function(n, i) {
            if (i === idx) return;
            const vIdx = (n.by || []).indexOf(user.uid);
            if (vIdx >= 0) {
                n.by.splice(vIdx, 1);
                n.votes = Math.max(0, (n.votes || 1) - 1);
            }
        });

        target.votes = (target.votes || 0) + 1;
        target.by = (target.by || []).concat([user.uid]);
        if (target.by.length > 100) target.by = target.by.slice(-100);

        namesList.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        const hasConflict = namesList.length > 1
            && (namesList[0].votes - namesList[1].votes) < 2
            && namesList[1].votes >= 1;

        await ref.update({
            names: namesList,
            name: namesList[0].val,
            hasConflict: hasConflict,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { ok: true, topName: namesList[0].val, hasConflict: hasConflict };
    } catch (e) {
        console.error('[publicdb] vote failed:', e);
        return { ok: false, reason: e.message };
    }
}

// ============================================================
//  نظام الثقة — زيادة عداد الإسهامات
// ============================================================
async function _bcIncrementUserContribution(uid) {
    try {
        await db.collection('users').doc(uid).update({
            bcContributions: firebase.firestore.FieldValue.increment(1)
        });
    } catch (e) {
        console.warn('[publicdb] increment failed:', e);
    }
}

// ============================================================
//  اختبارات
// ============================================================
window.publicdb = {
    lookup: lookupBarcode,
    contribute: contributeBarcode,
    vote: voteForName,
    suggestPrice: calculateSuggestedPrice,
    _valid: _bcValid,
    _clean: _bcClean,
    _cleanName: _bcCleanName,
    _nameKey: _bcNameKey
};

console.log('📦 [publicdb v2] جاهز — تصويت + تضارب + ثقة');
