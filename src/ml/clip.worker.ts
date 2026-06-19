// src/ml/clip.worker.ts
// Web Worker for CLIP model inference using @huggingface/transformers

declare const self: DedicatedWorkerGlobalScope;

import { pipeline, env } from '@huggingface/transformers';

// Disable local models for browser
env.allowLocalModels = false;

let extractor: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, imageData, ...data } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });
      
      extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
        device: 'webgpu', // or 'wasm'
        dtype: 'fp32',
        quantized: false,
      });
      
      self.postMessage({ type: 'ready', device: 'webgpu' });
    } catch (error) {
      // Fallback to wasm
      try {
        extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
          device: 'wasm',
        });
        self.postMessage({ type: 'ready', device: 'wasm' });
      } catch (e) {
        self.postMessage({ type: 'error', error: (e as Error).message });
      }
    }
  } 
  
  else if (type === 'vectorize' && imageData) {
    if (!extractor) {
      self.postMessage({ type: 'error', error: 'Model not initialized' });
      return;
    }

    try {
      const start = performance.now();
      
      // Process ImageData to tensor
      const result = await extractor(imageData, { pooling: 'mean', normalize: true });
      const embedding = Array.from(result.data);
      
      const timeMs = performance.now() - start;
      
      self.postMessage({ 
        type: 'result', 
        embedding, 
        timeMs 
      });
    } catch (error) {
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  }
};
