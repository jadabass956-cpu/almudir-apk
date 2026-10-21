// ============================================================
//  🛡️ SUB META — تخزين trialStart في IndexedDB (أصعب مسحاً)
// ============================================================

const SUB_META_DB = 'JASOFT_SUB_META';
const SUB_META_STORE = 'meta';

function _subMetaOpen() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(SUB_META_DB, 1);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(SUB_META_STORE)) {
                db.createObjectStore(SUB_META_STORE, { keyPath: 'uid' });
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

async function subMetaSet(uid, key, value) {
    try {
        const db = await _subMetaOpen();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(SUB_META_STORE, 'readwrite');
            const store = tx.objectStore(SUB_META_STORE);
            const getReq = store.get(uid);
            getReq.onsuccess = () => {
                const existing = getReq.result || { uid: uid };
                existing[key] = value;
                existing.updatedAt = Date.now();
                store.put(existing);
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = e => reject(e.target.error);
        });
    } catch(e) { console.warn('[sub-meta] set:', e); return false; }
}

async function subMetaGet(uid, key) {
    try {
        const db = await _subMetaOpen();
        return new Promise((resolve) => {
            const tx = db.transaction(SUB_META_STORE, 'readonly');
            const store = tx.objectStore(SUB_META_STORE);
            const getReq = store.get(uid);
            getReq.onsuccess = () => {
                const data = getReq.result;
                resolve(data ? data[key] : null);
            };
            getReq.onerror = () => resolve(null);
        });
    } catch(e) { return null; }
}

console.log('🛡️ [sub-meta] جاهز');
