/// <reference lib="webworker" />

import { pipeline, env } from '@xenova/transformers';

// Worker environment setup
env.allowLocalModels = false;
env.useBrowserCache = true;

let model: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, imageData } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', status: 'loading', progress: 0 });

      model = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', {
        quantized: false,
        progress_callback: (progress: any) => {
          self.postMessage({ 
            type: 'status', 
            status: 'loading', 
            progress: Math.round((progress.progress || 50) * 100) / 100 
          });
        }
      });

      self.postMessage({ type: 'ready', device: 'webgpu' });
    } catch (error) {
      console.error('Model load error', error);
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  } else if (type === 'vectorize' && imageData) {
    if (!model) {
      self.postMessage({ type: 'error', error: 'Model not loaded' });
      return;
    }

    try {
      const start = Date.now();
      const output = await model(imageData, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);
      
      self.postMessage({
        type: 'result',
        embedding,
        timeMs: Date.now() - start
      });
    } catch (error) {
      self.postMessage({ type: 'error', error: (error as Error).message });
    }
  }
};
