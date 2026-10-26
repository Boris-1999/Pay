const CACHE_NAME = 'gpay-v1';
const ASSETS = [
  './',
  './index.html',
  './index.css',
  './style.css',
  './app.js',
  './animation-data.js',
  './lottie.min.js',
  './jsQR.min.js',
  './qrcode.min.js',
  './gpay.mp3',
  './gpay-logo.png',
  './app-icon.png',
  './user-profile.jpg',
  './ragupathi.jpg',
  './bsnl-logo.png',
  './vi-logo.jpg',
  './airtel-logo.jpg',
  './jio-logo.svg',
  './upi-powered-by.png',
  './ubi-symbol.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => console.log('Cache item error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    }).catch(() => caches.match('./index.html'))
  );
});
