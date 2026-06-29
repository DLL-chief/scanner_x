/// <reference lib="webworker" />

import { pipeline, env } from '@xenova/transformers';

function log(msg: string) {
  self.postMessage({ log: msg });
}

let model: any = null;

self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });
      log('Настройка env...');

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      // WASM бинарники с CDN, версия должна совпадать с onnxruntime-web из @xenova/transformers
      env.backends.onnx.wasm.wasmPaths =
        'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';
      // Однопоточный режим — без COOP/COEP заголовков SharedArrayBuffer недоступен
      env.backends.onnx.wasm.numThreads = 1;

      log('Запуск pipeline feature-extraction...');
      model = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
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
      const result = await model(imageData, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      self.postMessage({ type: 'result', embedding });
    } catch (error) {
      const msg = (error as Error).message ?? String(error);
      log(`ОШИБКА vectorize: ${msg}`);
      self.postMessage({ type: 'error', error: msg });
    }
  }
};
