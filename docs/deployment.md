# Deployment Guide

## Быстрый старт для сервера

1. Скачай проект:
   - Перейди на https://github.com/DLL-chief/scanner_x
   - Нажми **Code → Download ZIP**

2. Распакуй ZIP на сервере.

3. Установи Node.js (v18+): https://nodejs.org

4. В терминале в папке проекта:
   ```bash
   npm install
   npm run build
   ```

5. Готовая статика появится в папке `dist/`.

6. Настрой веб-сервер (Nginx/Apache) на раздачу `dist/`:

**Пример nginx.conf:**
```nginx
server {
    listen 80;
    server_name scanner.example.com;

    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Особенности
- Полностью frontend (serverless)
- Модель CLIP скачивается в браузер (~500 МБ первый раз)
- Работает на любом статическом хостинге

## Обновление
После изменений в коде:
1. `npm run build`
2. Залей `dist/` на сервер

Обновлено: 19 июня 2026