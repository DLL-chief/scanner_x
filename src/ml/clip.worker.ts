import { pipeline, env } from '@xenova/transformers';

// Configure environment for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, imageData, id } = event.data;

  try {
    if (type === 'init') {
      if (!extractor) {
        self.postMessage({ type: 'status', status: 'loading', progress: 0 });
        
        extractor = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32', {
          quantized: false,
          progress_callback: (progress: any) => {
            self.postMessage({ 
              type: 'status', 
              status: 'loading', 
              progress: Math.round((progress.progress || 0) * 100) 
            });
          }
        });
        
        self.postMessage({ type: 'ready', device: 'webgpu' });
      }
    } 
    
    else if (type === 'vectorize') {
      if (!extractor) {
        self.postMessage({ type: 'error', error: 'Model not initialized' });
        return;
      }

      const output = await extractor(imageData, { normalize: true });
      const embedding = Array.from(output.data);
      
      self.postMessage({
        type: 'result',
        embedding,
        timeMs: Date.now()
      });
    }
  } catch (error: any) {
    self.postMessage({ 
      type: 'error', 
      error: error.message 
    });
  }
};