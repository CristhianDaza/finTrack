const CACHE_NAME = 'fintrack-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/styles/components/notification.css',
  '/styles/partials/accounts.css',
  '/styles/partials/base.css',
  '/styles/partials/dashboard.css',
  '/styles/partials/debts.css',
  '/styles/partials/filters.css',
  '/styles/partials/forms.css',
  '/styles/partials/modals.css',
  '/styles/partials/responsive.css',
  '/styles/partials/sidebar.css',
  '/styles/partials/transactions.css',
  '/scripts/main.js',
  '/scripts/filters.js',
  '/scripts/storage.js',
  '/scripts/ui.js',
  '/scripts/components/notification.js',
  '/scripts/transactions.js',
  '/scripts/debts.js',
  '/scripts/accounts.js',
  '/scripts/dashboard.js',
  '/scripts/utils.js',
  '/images/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
