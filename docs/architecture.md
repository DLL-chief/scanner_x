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

`RawImage.read()` в transformers.js v2 принимает ровно четыре типа входа:
строку/URL, `Blob`, готовый экземпляр `RawImage` — всё остальное (в том числе
`ImageData`, `ImageBitmap`, `OffscreenCanvas`) падает в `else`-ветку с
`Unsupported input type: object`.

Правильный путь — собрать `RawImage` напрямую из буфера `ImageData`:

```ts
const raw = new RawImage(imageData.data, imageData.width, imageData.height, 4);
const result = await model(raw, { pooling: 'mean', normalize: true });
```

`RawImage` импортируется из того же пакета рядом с `pipeline` и `env`.

**Почему не Blob/OffscreenCanvas:** путь через `Blob` (`convertToBlob()`) кодирует
кадр в PNG/JPEG, а `RawImage.read()` внутри снова его декодирует через
`createImageBitmap` — лишний encode+decode на CPU на каждый кадр. Плюс
`OffscreenCanvas` и `createImageBitmap` на старых/слабых мобильниках (именно
те устройства, где нет WebGPU и активна WASM-ветка) поддержаны хуже всего.
`RawImage` из `ImageData.data` не трогает ни один из этих API — это
одновременно быстрее и совместимее на проблемной ветке.

Ожидаемый результат: `result.data` — `Float32Array` длиной ~512 (joint
CLIP-space для ViT-B/32). Первый успешный прогон — первая валидная карточка
в IndexedDB.