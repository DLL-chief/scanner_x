# Card Recognition App (Pure Frontend)

**100% client-side SPA** для визуального распознавания карточек с использованием CLIP (Transformers.js) в браузере, IndexedDB для хранения эталонов и KNN-поиска.

## Особенности
- Нет бэкенда: всё в браузере (WebGPU/WASM + IndexedDB).
- React + TypeScript + Tailwind CSS + Vite.
- Web Worker для ML-инференса.
- Мобиль-first, камера + cropper.

## Структура
- `src/` — основной код
- `docs/` — документация
- `public/` — статика

## Запуск
```bash
npm install
npm run dev
```

См. `docs/architecture.md` для деталей.