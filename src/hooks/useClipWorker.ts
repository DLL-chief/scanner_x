import { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkerResult {
  type?: string;
  embedding?: number[];
  timeMs?: number;
  status?: string;
  progress?: number;
  device?: string;
  error?: string;
  log?: string;
}

export function useClipWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [device, setDevice] = useState<'webgpu' | 'wasm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-49), `${new Date().toISOString().slice(11, 19)} ${msg}`]);
  }, []);

  const initWorker = useCallback(() => {
    if (workerRef.current) return;

    addLog('Создание воркера...');
    let worker: Worker;
    try {
      worker = new Worker(new URL('../ml/clip.worker.ts', import.meta.url), { type: 'module' });
    } catch (e) {
      const msg = `Ошибка создания воркера: ${(e as Error).message}`;
      addLog(msg);
      setError(msg);
      return;
    }
    workerRef.current = worker;

    worker.onerror = (e: ErrorEvent) => {
      const msg = `[worker.onerror] ${e.message} (${e.filename}:${e.lineno})`;
      addLog(msg);
      setError(msg);
      setIsLoading(false);
    };

    worker.onmessageerror = (e: MessageEvent) => {
      const msg = `[worker.onmessageerror] ${JSON.stringify(e.data)}`;
      addLog(msg);
    };

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as WorkerResult;

      if (data.log) {
        addLog(`[worker] ${data.log}`);
        return;
      }

      if (data.type === 'status') {
        setIsLoading(true);
        setProgress(data.progress || 0);
        addLog(`Загрузка модели: ${data.progress}%`);
      } else if (data.type === 'ready') {
        setIsReady(true);
        setIsLoading(false);
        setDevice(data.device as 'webgpu' | 'wasm');
        setProgress(100);
        addLog(`Модель готова (${data.device})`);
      } else if (data.type === 'result') {
        setIsLoading(false);
      } else if (data.type === 'error') {
        const msg = data.error || 'Неизвестная ошибка';
        setError(msg);
        setIsLoading(false);
        addLog(`[ОШИБКА] ${msg}`);
      }
    };

    addLog('Отправка команды init...');
    worker.postMessage({ type: 'init' });
  }, [addLog]);

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

  return { isReady, isLoading, progress, device, error, logs, vectorize, initWorker };
}
