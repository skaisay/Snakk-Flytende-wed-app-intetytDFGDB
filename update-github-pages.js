const fs = require('fs');
const path = require('path');

// Копируем service-worker-new.js в service-worker.js
fs.copyFile('service-worker-new.js', 'service-worker.js', (err) => {
  if (err) {
    console.error('Ошибка при копировании service-worker:', err);
  } else {
    console.log('Service Worker обновлен');
  }
});

// Файл настройки для GitHub Pages
const ghPagesConfig = `
# GitHub Pages configuration
permalink: /404.html
`;

fs.writeFile('_config.yml', ghPagesConfig, (err) => {
  if (err) {
    console.error('Ошибка при создании _config.yml:', err);
  } else {
    console.log('_config.yml создан для GitHub Pages');
  }
});

// Создаем .nojekyll для отключения обработки Jekyll на GitHub Pages
fs.writeFile('.nojekyll', '', (err) => {
  if (err) {
    console.error('Ошибка при создании .nojekyll:', err);
  } else {
    console.log('.nojekyll создан для отключения Jekyll');
  }
});
