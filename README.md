# scanner_x

**Чистое frontend-приложение для визуального распознавания карточек (100% serverless, в браузере).**

## Особенности
- React + Vite + TypeScript + Tailwind CSS
- CLIP модель через @huggingface/transformers.js (Web Worker, WebGPU)
- Локальное хранение в IndexedDB + KNN-поиск
- Режимы: Админка (добавление эталонов) и Распознавание

## Структура
- `src/` - основной код
- `docs/` - документация

## Запуск
```bash
npm install
npm run dev
```

**Создано:** index.html, src/main.tsx, src/App.tsx, src/index.css. Базовый UI готов.