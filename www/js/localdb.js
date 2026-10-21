// ==================== قاعدة البيانات المحلية IndexedDB ====================
let localDB = null;

function openLocalDB() {
    return new Promise((resolve, reject) => {
        if (localDB) {
            resolve(localDB);
            return;
        }
        const request = indexedDB.open('JASOFT_DB', 1);
        
        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('userData')) {
                db.createObjectStore('userData', { keyPath: 'uid' });
            }
        };
        
        request.onsuccess = function(e) {
            localDB = e.target.result;
            console.log('IndexedDB تم فتحها بنجاح');
            resolve(localDB);
        };
        
        request.onerror = function(e) {
            console.error('فشل فتح IndexedDB:', e.target.error);
            reject(e.target.error);
        };
    });
}

async function saveLocalData(uid, data) {
    try {
        if (!localDB) await openLocalDB();
        return new Promise((resolve, reject) => {
            const tx = localDB.transaction('userData', 'readwrite');
            const store = tx.objectStore('userData');
            store.put({ uid, data, updatedAt: data.updatedAt || Date.now() });
            tx.oncomplete = () => {
                console.log('تم حفظ البيانات محلياً للمستخدم:', uid);
                resolve();
            };
            tx.onerror = (e) => {
                console.error('فشل الحفظ المحلي:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (error) {
        console.error('خطأ في saveLocalData:', error);
        throw error;
    }
}

async function loadLocalData(uid) {
    try {
        if (!localDB) await openLocalDB();
        return new Promise((resolve, reject) => {
            const tx = localDB.transaction('userData', 'readonly');
            const store = tx.objectStore('userData');
            const request = store.get(uid);
            request.onsuccess = () => {
                console.log('تم تحميل البيانات المحلية للمستخدم:', uid);
                resolve(request.result ? request.result.data : null);
            };
            request.onerror = (e) => {
                console.error('فشل تحميل البيانات المحلية:', e.target.error);
                reject(e.target.error);
            };
        });
    } catch (error) {
        console.error('خطأ في loadLocalData:', error);
        throw error;
    }
}

async function clearLocalData(uid) {
    try {
        if (!localDB) await openLocalDB();
        return new Promise((resolve, reject) => {
            const tx = localDB.transaction('userData', 'readwrite');
            const store = tx.objectStore('userData');
            store.delete(uid);
            tx.oncomplete = () => {
                console.log('تم حذف البيانات المحلية للمستخدم:', uid);
                resolve();
            };
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (error) {
        console.error('خطأ في clearLocalData:', error);
        throw error;
    }
}

// فتح قاعدة البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    openLocalDB().then(() => {
        console.log('IndexedDB جاهزة للاستخدام');
    }).catch((err) => {
        console.error('تعذر تجهيز IndexedDB:', err);
    });
});
