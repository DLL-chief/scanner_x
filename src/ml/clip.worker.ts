// src/ml/clip.worker.ts
// Real Transformers.js CLIP Worker for Pure Frontend

import { pipeline, env } from '@huggingface/transformers';

// Configure for browser
env.allowLocalModels = false;
env.allowRemoteModels = true;

let extractor: any = null;
let isReady = false;

self.onmessage = async (event: MessageEvent) => {
  const { type, imageData, device = 'webgpu' } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });

      // Load CLIP image feature extractor
      extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
        device,
        dtype: 'fp32',
        quantized: true,
        progress_callback: (progress) => {
          self.postMessage({ type: 'status', status: 'loading', progress: Math.round(progress.progress || 50) });
        }
      });

      isReady = true;
      self.postMessage({ type: 'ready', device });
    } catch (error) {
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  } else if (type === 'vectorize') {
    if (!extractor || !isReady) {
      self.postMessage({ type: 'error', error: 'Model not ready' });
      return;
    }

    try {
      const start = performance.now();

      // For ImageData
      const output = await extractor(imageData, {
        pooling: 'mean',
        normalize: true,
      });

      const embedding = Array.from(output.data);

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