// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB08RzcPJe9B1gElNfgqS-hr-C8eTROQLw",
    authDomain: "jasoft-8bae9.firebaseapp.com",
    projectId: "jasoft-8bae9",
    storageBucket: "jasoft-8bae9.firebasestorage.app",
    messagingSenderId: "263989164835",
    appId: "1:263989164835:web:1fa891e67b032d8503aa96",
    measurementId: "G-VG4844PBW6"
};

firebase.initializeApp(firebaseConfig);

// 🔐 Firebase App Check — حماية Firestore
try {
    if (typeof firebase.appCheck === 'function') {
        const appCheck = firebase.appCheck();
        appCheck.activate('6LdNHc0tAAAAAFZz9nBCZtp6euMLF_lvJTuhpOwX', true);
        console.log('🔐 [App Check] تم التهيئة بنجاح');
    } else {
        console.warn('🔐 [App Check] SDK غير محمّل');
    }
} catch (e) {
    console.warn('🔐 [App Check] فشل التهيئة:', e.message);
}
const auth = firebase.auth();
const db = firebase.firestore();
const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

// ═══════════════════════════════════════════════════════
//  🔑 _getEffectiveUid — uid الفعلي للبيانات
//  - المدير: auth.uid
//  - الموظف: ownerUid (حساب المدير)
// ═══════════════════════════════════════════════════════
window._getEffectiveUid = function() {
    // ① الموظف مرتبط بمدير
    if (typeof window.currentUser !== 'undefined' && window.currentUser?.ownerUid) {
        return window.currentUser.ownerUid;
    }
    // ② المدير (auth)
    if (typeof window.auth !== 'undefined' && window.auth?.currentUser) {
        return window.auth.currentUser.uid;
    }
    // ③ fallback
    if (typeof window.currentUser !== 'undefined' && window.currentUser?.uid) {
        return window.currentUser.uid;
    }
    return null;
};

console.log('🔑 [config] _getEffectiveUid ready');

window.storage = storage;
