/// <reference lib="webworker" />

import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;

let model: any = null;

self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });
      
      model = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
        quantized: false,
        progress_callback: (progress: any) => {
          self.postMessage({ 
            type: 'status', 
            status: 'loading', 
            progress: Math.round(progress.progress || 50) 
          });
        }
      });
      
      // Transformers.js v2 исполняет CLIP на WASM (ONNX Runtime Web), не на WebGPU.
      // Для реального WebGPU нужен переход на @huggingface/transformers v3.
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
