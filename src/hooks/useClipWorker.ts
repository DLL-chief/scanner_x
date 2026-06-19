import { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkerResult {
  type?: string;
  embedding?: number[];
  timeMs?: number;
  status?: string;
  progress?: number;
  device?: string;
  error?: string;
}

export function useClipWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [device, setDevice] = useState<'webgpu' | 'wasm' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initWorker = useCallback(() => {
    if (workerRef.current) return;

    const worker = new Worker(new URL('../ml/clip.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as WorkerResult;

      if (data.type === 'status') {
        setIsLoading(true);
        setProgress(data.progress || 0);
      } else if (data.type === 'ready') {
        setIsReady(true);
        setIsLoading(false);
        setDevice(data.device as 'webgpu' | 'wasm');
        setProgress(100);
      } else if (data.type === 'result') {
        setIsLoading(false);
      } else if (data.type === 'error') {
        setError(data.error || 'Unknown error');
        setIsLoading(false);
      }
    };

    worker.postMessage({ type: 'init' });
  }, []);

  const vectorize = useCallback((imageData: ImageData): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handler = (event: MessageEvent) => {
        const data = event.data as WorkerResult;
        if (data.type === 'result') {
          workerRef.current!.removeEventListener('message', handler);
          resolve(data.embedding || []);
        } else if (data.type === 'error') {
          workerRef.current!.removeEventListener('message', handler);
          reject(new Error(data.error));
        }
      };

      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({ type: 'vectorize', imageData });
    });
  }, []);

  useEffect(() => {
    initWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, [initWorker]);

  return { isReady, isLoading, progress, device, error, vectorize, initWorker };
}
