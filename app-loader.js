// Проверка загрузки приложения
console.log("App Loader: Проверка загрузки скриптов");

// Основная функция загрузчика
function appLoader() {
  const root = document.getElementById('root');
  if (!root) {
    console.error("App Loader: Элемент #root не найден!");
    return;
  }
  
  // Проверка наличия ошибок в консоли
  if (window.hasConsoleLogs) {
    console.warn("App Loader: Обнаружены ошибки в консоли, проверьте логи");
  }
  
  // Если приложение все еще не загрузилось, пробуем загрузить вручную
  setTimeout(() => {
    if (root.children.length === 0) {
      console.warn("App Loader: Приложение не загрузилось автоматически, пробуем запустить вручную");
      
      // Пробуем импортировать главный модуль и запустить приложение
      try {
        import('./src/components/App.js')
          .then(module => {
            console.log("App Loader: Модуль App.js успешно импортирован");
            try {
              module.App.mount(root);
              console.log("App Loader: Приложение успешно запущено вручную");
            } catch (e) {
              showErrorScreen("Не удалось запустить приложение. Пожалуйста, обновите страницу.");
              console.error("App Loader: Ошибка при монтировании приложения:", e);
            }
          })
          .catch(error => {
            showErrorScreen("Не удалось загрузить приложение. Пожалуйста, проверьте соединение и обновите страницу.");
            console.error("App Loader: Ошибка при импорте App.js:", error);
          });
      } catch (e) {
        showErrorScreen("Критическая ошибка при загрузке приложения.");
        console.error("App Loader: Критическая ошибка:", e);
      }
    }
  }, 3000); // Даем 3 секунды на загрузку
}

// Показать экран с ошибкой
function showErrorScreen(message) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div class="error-container" style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        color: white;
        background-color: rgba(0,0,0,0.7);
        padding: 2rem;
      ">
        <h2 style="margin-bottom: 1rem;">Ошибка загрузки GameNotes</h2>
        <p style="margin-bottom: 2rem;">${message}</p>
        <button onclick="window.location.reload()" style="
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          backdrop-filter: blur(10px);
        ">Перезагрузить страницу</button>
      </div>
    `;
  }
}

// Перехватываем ошибки консоли
window.hasConsoleLogs = false;
const originalConsoleError = console.error;
console.error = function() {
  window.hasConsoleLogs = true;
  originalConsoleError.apply(console, arguments);
};

// Запускаем загрузчик
window.addEventListener('load', appLoader);
