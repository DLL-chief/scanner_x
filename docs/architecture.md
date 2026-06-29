## Обновления (Pure Frontend)

- clip.worker.ts: реализован с Transformers.js + WebGPU/Web Worker.
- useClipWorker: улучшен для live vectorize.
- Live detection loop в RecognizePage готов к интеграции.

Следующие: UX polish + full live loop.

## CLIP Worker — загрузка библиотеки

`src/ml/clip.worker.ts` импортирует `@xenova/transformers` статически (не через esm.sh).
Vite бандлит воркер как ES-модуль (`worker.format: 'es'`), поэтому пакет резолвится
из локального node_modules — без Node.js-полифиллов, которые esm.sh подставляет в
браузерный контекст и ломают `path.dirname` внутри onnxruntime-wasm.

Ключевые настройки env:
- `wasmPaths` → `onnxruntime-web@1.14.0` на CDN (совпадает с зависимостью пакета)
- `numThreads = 1` — многопоточный WASM требует COOP/COEP (`SharedArrayBuffer`),
  которые в текущем деплое не настроены; однопоточный режим обходит это ограничение.