// Service Worker для офлайн-работы
const CACHE_NAME = 'gamenotes-cache-v1.3';
const APP// Активация Service Worker и удаление старых кэшей
self.addEventListener('activate', event => {
  console.log('[Service Worker] Активация...');
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key.startsWith(APP_PREFIX) && key !== CACHE_NAME) {
            console.log('[Service Worker] Удаление старого кэша:', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Активирован и готов обрабатывать запросы');
        return self.clients.claim();
      })
  );
});

// Определяем базовый путь для GitHub Pages
const BASE_PATH = (function() {
  // Проверяем, запущено ли приложение на GitHub Pages
  const isGitHubPages = self.location.hostname.includes('github.io');
  console.log('[Service Worker] На GitHub Pages:', isGitHubPages);
  
  if (isGitHubPages) {
    const pathSegments = self.location.pathname.split('/');
    const repoName = pathSegments[1]; // Первый сегмент после домена - это название репозитория
    console.log('[Service Worker] Имя репозитория:', repoName);
    
    // Если мы в репозитории (не корневой домен)
    if (repoName && repoName !== '') {
      console.log('[Service Worker] BASE_PATH установлен как:', `/${repoName}`);
      return `/${repoName}`;
    }
  }
  
  console.log('[Service Worker] BASE_PATH установлен как пустой');
  return '';
})();

// Функция для создания правильного пути с учетом BASE_PATH
function getPath(path) {
  // Убираем начальную точку, если есть
  if (path.startsWith('./')) {
    path = path.substring(2);
  }
  // Если путь пустой или корень
  if (!path || path === './') {
    return BASE_PATH + '/';
  }
  // Добавляем BASE_PATH
  return BASE_PATH + '/' + path;
}

// Ресурсы для предварительного кэширования
const ASSETS = [
  getPath('./'),
  getPath('./index.html'),
  getPath('./404.html'),
  getPath('./app-loader.js'),
  getPath('./fixed-loader.js'),
  getPath('./manifest.json'),
  getPath('./src/main.js'),
  getPath('./src/components/App.js'),
  getPath('./src/components/Sidebar.js'),
  getPath('./src/pages/MainPage.js'),
  getPath('./src/pages/PlayersPage.js'),
  getPath('./src/pages/StatsPage.js'),
  getPath('./src/pages/SettingsPage.js'),
  getPath('./src/services/storage.js'),
  getPath('./src/services/ui.js'),
  getPath('./src/services/toast.js'),
  getPath('./src/services/background.js'),
  getPath('./src/services/pwa.js'),
  getPath('./src/services/path.js'),
  getPath('./src/styles/global.css'),
  getPath('./src/styles/components.css'),
  getPath('./src/styles/animations.css'),
  getPath('./src/styles/player-cards.css'),
  getPath('./src/styles/pages.css'),
  getPath('./src/styles/improved-glass.css'),
  getPath('./assets/images/icon-192.png'),
  getPath('./assets/images/icon-512.png'),
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap'
];

// Установка Service Worker и кэширование статических ресурсов
self.addEventListener('install', event => {
  console.log('[Service Worker] Установка...');
  self.skipWaiting(); // Принудительно активируем без ожидания
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Кэширование статических ресурсов');
        return cache.addAll(ASSETS).catch(error => {
          console.error('[Service Worker] Ошибка при кэшировании ресурсов:', error);
          // Продолжаем установку даже при ошибке
          return Promise.resolve();
        });
      })
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
