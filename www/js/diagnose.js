(function() {
    'use strict';
    setTimeout(async () => {
        try {
            if (typeof firebase === 'undefined' || !firebase.auth) {
                alert('❌ Firebase غير محمل');
                return;
            }
            const user = firebase.auth().currentUser;
            if (!user) {
                alert('❌ لا يوجد مستخدم مسجل');
                return;
            }
            const uid = user.uid;
            const doc = await firebase.firestore().collection('users').doc(uid).get();
            
            if (!doc.exists) {
                alert('❌ المستند غير موجود في Firestore!');
                return;
            }
            
            const data = doc.data();
            const msg = `
🔍 تشخيص الحساب:
━━━━━━━━━━━━━━
📧 البريد: ${user.email}
🆔 UID: ${uid.slice(0, 10)}...
━━━━━━━━━━━━━━
🏢 اسم النشاط (Firestore): ${data.businessName || 'فارغ'}
📊 نوع النشاط: ${data.businessType || 'فارغ'}
💎 الاشتراك: ${data.subscriptionStatus || 'فارغ'}
📅 نهاية الاشتراك: ${data.subscriptionEndDate ? 'موجود' : 'فارغ'}
🏷️ ownerUid: ${data.ownerUid || 'لا يوجد'}
━━━━━━━━━━━━━━
🧠 currentUser (المتغير): ${typeof currentUser !== 'undefined' ? 'موجود' : 'غير موجود'}
            `;
            alert(msg);
        } catch(e) {
            alert('❌ خطأ: ' + e.message);
        }
    }, 3000);
})();
