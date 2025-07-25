// Service Worker для офлайн-работы
const CACHE_NAME = 'gamenotes-cache-v1.3';
const APP_PREFIX = 'gamenotes-';

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

// Перехват запросов и обслуживание из кэша с улучшенной обработкой для GitHub Pages
self.addEventListener('fetch', event => {
  // Логгирование URL запроса для отладки
  console.log('[Service Worker] Fetch:', event.request.url);
  
  // Для навигационных запросов всегда возвращаем index.html при оффлайне
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(getPath('./index.html'));
        })
    );
    return;
  }
  
  // Стратегия "сначала кэш, затем сеть"
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[Service Worker] Возвращается из кэша:', event.request.url);
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {
            // Если ответ невалидный, просто возвращаем его
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Кэшируем новый ресурс
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Кэширование нового ресурса:', event.request.url);
              });
            
            return networkResponse;
          })
          .catch(error => {
            console.error('[Service Worker] Ошибка при запросе к сети:', error);
            
            // Для JavaScript-файлов возвращаем пустую функцию для предотвращения ошибок
            if (event.request.url.endsWith('.js')) {
              return new Response('// Offline fallback', {
                headers: { 'Content-Type': 'application/javascript' }
              });
            }
            
            // Для стилей возвращаем пустой CSS
            if (event.request.url.endsWith('.css')) {
              return new Response('/* Offline fallback */', {
                headers: { 'Content-Type': 'text/css' }
              });
            }
            
            // Для всех остальных ресурсов возвращаем сообщение об оффлайн
            return new Response('Сеть недоступна. Перезагрузите страницу, когда появится интернет.', {
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
