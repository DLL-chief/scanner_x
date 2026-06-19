// src/hooks/useClipWorker.ts

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkerMessage {
  type: 'status' | 'ready' | 'result' | 'error';
  status?: string;
  progress?: number;
  device?: string;
  embedding?: number[];
  timeMs?: number;
  error?: string;
}

export const useClipWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [device, setDevice] = useState<'webgpu' | 'wasm' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Create worker
    const worker = new Worker(new URL('../ml/clip.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;

      if (msg.type === 'status') {
        console.log('Worker status:', msg);
      } else if (msg.type === 'ready') {
        setIsReady(true);
        setDevice(msg.device as 'webgpu' | 'wasm');
        setIsLoading(false);
      } else if (msg.type === 'result') {
        // Handle result in calling component
      } else if (msg.type === 'error') {
        console.error('Worker error:', msg.error);
      }
    };

    // Init worker
    worker.postMessage({ type: 'init' });

    return () => {
      worker.terminate();
    };
  }, []);

  const vectorize = useCallback((imageData: ImageData): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handler = (event: MessageEvent<WorkerMessage>) => {
        const msg = event.data;
        if (msg.type === 'result' && msg.embedding) {
          workerRef.current!.removeEventListener('message', handler);
          resolve(msg.embedding);
        } else if (msg.type === 'error') {
          workerRef.current!.removeEventListener('message', handler);
          reject(new Error(msg.error));
        }
      };

      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({ type: 'vectorize', imageData });
    });
  }, []);

  return { isReady, device, isLoading, vectorize };
};
