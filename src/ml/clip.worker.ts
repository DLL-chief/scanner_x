/// <reference lib="webworker" />

let model: any = null;

self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });

      // Dynamic import so module-load errors are catchable and reportable
      // @ts-ignore
      const { pipeline, env } = await import('@xenova/transformers');

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      // Point onnxruntime to CDN so WASM files are found regardless of deploy path
      env.backends.onnx.wasm.wasmPaths =
        'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';

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

      self.postMessage({ type: 'ready', device: 'wasm' });
    } catch (error) {
      self.postMessage({ type: 'error', error: (error as Error).message });
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
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  }
};
