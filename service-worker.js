// Service Worker для офлайн-работы
const CACHE_NAME = 'gamenotes-cache-v1.2';
const APP_PREFIX = 'gamenotes-';

// Определяем базовый путь для GitHub Pages
const BASE_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));

// Ресурсы для предварительного кэширования
const ASSETS = [
  './',
  './index.html',
  './404.html',
  './app-loader.js',
  './manifest.json',
  './src/main.js',
  './src/components/App.js',
  './src/components/Sidebar.js',
  './src/pages/MainPage.js',
  './src/pages/PlayersPage.js',
  './src/pages/StatsPage.js',
  './src/pages/SettingsPage.js',
  './src/services/storage.js',
  './src/services/ui.js',
  './src/services/toast.js',
  './src/services/background.js',
  './src/services/pwa.js',
  './src/services/path.js',
  './src/services/diagnostics.js',
  './src/styles/global.css',
  './src/styles/components.css',
  './src/styles/animations.css',
  './src/styles/player-cards.css',
  './src/styles/pages.css',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap'
];

// Установка Service Worker и кэширование статических ресурсов
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэширование статических ресурсов');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key.startsWith(APP_PREFIX) && key !== CACHE_NAME) {
            console.log('Удаление старого кэша:', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => self.clients.claim())
  );
});

// Стратегия кэширования: Network First с Fallback на Cache
self.addEventListener('fetch', event => {
  // Пропускаем запросы к Chrome Extensions
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Пропускаем запросы к девелоперским инструментам
  if (event.request.url.includes('/devtools/')) {
    return;
  }
  
  // Обрабатываем только GET-запросы
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Если запрос успешен, кэшируем новую версию
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, используем кэш
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Для HTML запросов возвращаем index.html как fallback
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // Если нет подходящего кэша, возвращаем заглушку для изображений
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
                '<text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#888">' +
                'Изображение недоступно в офлайн-режиме' +
                '</text></svg>',
                { headers: {'Content-Type': 'image/svg+xml'} }
              );
            }
          });
      })
  );
});
