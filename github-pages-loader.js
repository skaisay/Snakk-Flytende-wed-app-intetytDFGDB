// Файл для корректной загрузки приложения на GitHub Pages
console.log('GitHub Pages Loader: Инициализация...');

// Определение базового пути для корректной загрузки модулей
const BASE_PATH = (function() {
  const { hostname, pathname } = window.location;
  const isGitHubPages = hostname.includes('github.io');
  
  console.log('GitHub Pages Loader: Хост:', hostname);
  console.log('GitHub Pages Loader: Путь:', pathname);
  
  if (isGitHubPages) {
    const pathSegments = pathname.split('/');
    const repoName = pathSegments[1]; // Первый сегмент после домена - название репозитория
    
    if (repoName && repoName !== '') {
      console.log('GitHub Pages Loader: Обнаружен репозиторий:', repoName);
      return `/${repoName}`;
    }
  }
  
  console.log('GitHub Pages Loader: Используется локальный путь');
  return '';
})();

// Исправление путей для корректной загрузки скриптов
function fixPath(path) {
  if (!path) return '';
  
  if (BASE_PATH && path.startsWith('./')) {
    return `${BASE_PATH}${path.substring(1)}`;
  }
  
  return path;
}

// Загрузка скриптов с правильными путями
function loadScripts() {
  const scripts = [
    './src/services/path.js',
    './src/services/storage.js',
    './src/services/ui.js',
    './src/services/background.js',
    './src/services/toast.js',
    './src/services/pwa.js',
    './src/main.js'
  ];
  
  console.log('GitHub Pages Loader: Загрузка скриптов...');
  
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = fixPath(src);
      script.onload = resolve;
      script.onerror = () => {
        console.error(`GitHub Pages Loader: Ошибка загрузки ${src}`);
        reject(new Error(`Не удалось загрузить скрипт: ${src}`));
      };
      document.head.appendChild(script);
    });
  };
  
  // Последовательная загрузка скриптов
  scripts.reduce(
    (promise, script) => promise.then(() => {
      console.log(`GitHub Pages Loader: Загрузка ${script}`);
      return loadScript(script);
    }),
    Promise.resolve()
  ).then(() => {
    console.log('GitHub Pages Loader: Все скрипты загружены успешно');
  }).catch(error => {
    console.error('GitHub Pages Loader: Ошибка при загрузке скриптов:', error);
    showError('Ошибка при загрузке необходимых файлов приложения. Пожалуйста, обновите страницу.');
  });
}

// Отображение ошибки загрузки
function showError(message) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        text-align: center;
        background: rgba(0,0,0,0.7);
        color: white;
      ">
        <h2>Ошибка загрузки GameNotes</h2>
        <p style="margin: 20px 0;">${message}</p>
        <button onclick="window.location.reload()" style="
          padding: 10px 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        ">Перезагрузить страницу</button>
      </div>
    `;
  }
}

// Запуск загрузчика
window.addEventListener('DOMContentLoaded', loadScripts);
