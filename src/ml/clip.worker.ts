/// <reference lib="webworker" />

// Dynamic import at runtime — static import breaks Rollup worker bundling;
// jsdelivr serves the package's own browser ESM build (no Node path polyfills)
const TRANSFORMERS_URL =
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

function log(msg: string) {
  self.postMessage({ log: msg });
}

let model: any = null;
let rawImageCtor: any = null;

self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });
      log('Загрузка @xenova/transformers...');

      const { pipeline, env, RawImage } = await import(/* @vite-ignore */ TRANSFORMERS_URL) as any;
      rawImageCtor = RawImage;

      log('Настройка env...');
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      // WASM бинарники с CDN, версия совпадает с onnxruntime-web из @xenova/transformers
      env.backends.onnx.wasm.wasmPaths =
        'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';
      // Однопоточный режим — без COOP/COEP заголовков SharedArrayBuffer недоступен
      env.backends.onnx.wasm.numThreads = 1;

      log('Запуск pipeline feature-extraction...');
      model = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', {
        quantized: false,
        progress_callback: (progress: any) => {
          self.postMessage({
            type: 'status',
            status: 'loading',
            progress: Math.round(progress.progress || 50),
          });
        },
      });

      log('Модель загружена успешно');
      self.postMessage({ type: 'ready', device: 'wasm' });
    } catch (error) {
      const msg = (error as Error).message ?? String(error);
      log(`ОШИБКА init: ${msg}`);
      self.postMessage({ type: 'error', error: msg });
    }
  } else if (type === 'vectorize' && imageData) {
    if (!model) {
      self.postMessage({ type: 'error', error: 'Model not initialized' });
      return;
    }
    try {
      // RawImage принимает RGBA-буфер напрямую — без OffscreenCanvas/Blob/ImageBitmap.
      // Это единственный путь без зависимости от canvas API в воркере, работает
      // на слабых мобильниках и на WASM-ветке где OffscreenCanvas может отсутствовать.
      const raw = new rawImageCtor(imageData.data, imageData.width, imageData.height, 4);
      const result = await model(raw, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data as Float32Array);
      self.postMessage({ type: 'result', embedding });
    } catch (error) {
      const msg = (error as Error).message ?? String(error);
      log(`ОШИБКА vectorize: ${msg}`);
      self.postMessage({ type: 'error', error: msg });
    }
  }
};
