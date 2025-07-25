// Определяем базовый путь для GitHub Pages или локального сервера
function getBasePath() {
  const { hostname, pathname } = window.location;
  
  // Для GitHub Pages определяем имя репозитория
  if (hostname.includes('github.io')) {
    const pathSegments = pathname.split('/');
    const repoName = pathSegments[1] || '';
    if (repoName) {
      return '/' + repoName;
    }
  }
  
  // Для локального сервера
  return '';
}

// Функция, которая создает корректный путь с учетом базового пути
function resolveUrl(path) {
  const basePath = getBasePath();
  // Убираем начальную точку из относительных путей
  if (path.startsWith('./')) {
    path = path.substring(2);
  }
  // Если путь начинается с '/', убираем его
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  return basePath + '/' + path;
}

// Загружаем скрипты в нужном порядке с учетом правильных путей
function loadScriptsSequentially(scripts) {
  return scripts.reduce((promise, script) => {
    return promise.then(() => {
      return new Promise((resolve, reject) => {
        const scriptElement = document.createElement('script');
        scriptElement.src = resolveUrl(script);
        scriptElement.type = 'module';
        scriptElement.onload = resolve;
        scriptElement.onerror = () => {
          console.error(`Ошибка загрузки скрипта: ${script}`);
          // Продолжаем загрузку других скриптов даже если один не загрузился
          resolve();
        };
        document.body.appendChild(scriptElement);
      });
    });
  }, Promise.resolve());
}

// Загрузка скриптов после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
  console.log('Начинаем загрузку приложения...');
  
  // Скрипты в порядке зависимостей
  const scripts = [
    './src/services/path.js',
    './src/services/storage.js',
    './src/services/ui.js',
    './src/services/toast.js',
    './src/services/background.js',
    './src/services/pwa.js',
    './src/main.js'
  ];

  loadScriptsSequentially(scripts)
    .then(() => {
      console.log('Все скрипты успешно загружены');
    })
    .catch(error => {
      console.error('Ошибка при загрузке скриптов:', error);
      showError('Ошибка при загрузке скриптов приложения.');
    });
});

// Показать сообщение об ошибке
function showError(message) {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
      padding: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
    ">
      <h2 style="margin-bottom: 20px;">Ошибка загрузки приложения</h2>
      <p style="margin-bottom: 20px;">${message}</p>
      <button onclick="window.location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
      ">Перезагрузить страницу</button>
    </div>
  `;
}
