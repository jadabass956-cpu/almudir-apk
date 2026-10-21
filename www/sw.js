// ============================================================
//  🔄 SERVICE WORKER v2 — Cache مع تحديث تلقائي
// ============================================================

// ═══════════════════════════════════════════════════════════
//  📨 OneSignal SDK — دمج داخل SW الموجود
// ═══════════════════════════════════════════════════════════
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'jasoft-v' + Date.now();  // ✅ يتغيّر كل مرة
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/data.js',
  '/js/app.js',
  '/manifest.json'
];

// ═══════════════════════════════════════════════════════════
//  INSTALL — تثبيت SW جديد وتفعيله فوراً
// ═══════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())  // ✅ تفعيل فوري
  );
});

// ═══════════════════════════════════════════════════════════
//  ACTIVATE — حذف كل الكاشات القديمة
// ═══════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())  // ✅ تحكم فوري بالصفحة
  );
});

// ═══════════════════════════════════════════════════════════
//  FETCH — Network-First للـ HTML/JS (يعمل بدون إنترنت)
// ═══════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ✅ لا نتدخل في Firebase / APIs
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('onesignal')) {
    return;
  }

  // ✅ للملفات المحلية: Network-First مع fallback للكاش
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // تحديث الكاش بنسخة جديدة
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // إنترنت مقطوع → الكاش
        return caches.match(event.request);
      })
  );
});

// ═══════════════════════════════════════════════════════════
//  MESSAGE — استقبال أوامر من الصفحة
// ═══════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] v2 loaded');
