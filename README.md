# scanner_x — Pure Frontend Card Recognition (Serverless)

100% клиентское приложение для визуального распознавания карточек с помощью CLIP (Transformers.js) в браузере.

## Структура
- `src/` — основной код React + Tailwind
- `docs/` — документация
- `public/` — статика

## Быстрый старт
1. `npm install` (один раз)
2. `npm run dev` — разработка
3. `npm run build` — production сборка

`npm install` нужен только при изменении зависимостей.

Документация: [./docs/](docs/)

**Архитектура:** Полностью фронтенд, IndexedDB + Web Worker + CLIP.