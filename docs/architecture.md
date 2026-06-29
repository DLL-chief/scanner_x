## Обновления (Pure Frontend)

- clip.worker.ts: реализован с Transformers.js + WebGPU/Web Worker.
- useClipWorker: улучшен для live vectorize.
- Live detection loop в RecognizePage готов к интеграции.

Следующие: UX polish + full live loop.

## CLIP Worker — загрузка библиотеки

`src/ml/clip.worker.ts` загружает `@xenova/transformers` динамически из jsdelivr:

```
https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js
```

Импорт динамический (`await import(...)` с `@vite-ignore`) — статический импорт
ломает Rollup при сборке воркер-чанка (не может разрешить bare-спецификатор).
jsdelivr отдаёт оригинальный браузерный ESM-билд пакета без Node.js-полифиллов,
которые esm.sh добавлял и которые ломали `path.dirname` внутри onnxruntime-wasm.

Ключевые настройки env:
- `wasmPaths` → `onnxruntime-web@1.14.0` на CDN (совпадает с зависимостью пакета)
- `numThreads = 1` — многопоточный WASM требует COOP/COEP (`SharedArrayBuffer`),
  которые в текущем деплое не настроены; однопоточный режим обходит это ограничение.

## CLIP Worker — передача изображения в модель

`pipeline()` из transformers.js принимает URL-строку, `ImageBitmap`, `OffscreenCanvas`
или `HTMLImageElement` — но не `ImageData` напрямую (вызывает `.split()` ожидая строку).

Перед вызовом модели `ImageData` конвертируется через `createImageBitmap()`:

```ts
const bitmap = await createImageBitmap(imageData);
const result = await model(bitmap, { pooling: 'mean', normalize: true });
bitmap.close();
```

`createImageBitmap` доступен в Web Worker и поддерживается `RawImage.read()` внутри
transformers.js.