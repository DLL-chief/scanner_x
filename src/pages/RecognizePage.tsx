import React, { useState, useRef, useEffect } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { useClipWorker } from '../hooks/useClipWorker';
import { findTop5 } from '../ml/knn';
import { storageService } from '../db/storage';

export default function RecognizePage() {
  const { isReady, isLoading, progress, device, vectorize } = useClipWorker();
  const [results, setResults] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const rafRef = useRef<number | null>(null);

  const processFrame = async (blob: Blob, imageData: ImageData) => {
    if (scanning) return;
    setScanning(true);
    try {
      const embedding = await vectorize(imageData);
      const cards = await storageService.getAllCardsWithEmbeddings();
      const top5 = findTop5(embedding, cards);
      // findTop5 returns { card, similarity }; разворачиваем в плоский объект для рендера
      setResults(top5.map(({ card, similarity }) => ({ ...card, similarity })));
    } catch (e) {
      console.error(e);
    }
    setScanning(false);
  };

  // Live detection loop with debounce
  useEffect(() => {
    if (!liveMode) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    // Placeholder for continuous: would use video frame capture in loop
    const interval = setInterval(() => {
      // Trigger capture logic if extended
    }, 1500);
    return () => clearInterval(interval);
  }, [liveMode]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Распознавание карточек</h1>
      
      <div className="flex gap-2 mb-4">
        <button onClick={() => setLiveMode(!liveMode)} className="px-4 py-2 bg-indigo-600 text-white rounded">
          {liveMode ? 'Остановить live' : 'Live сканирование'}
        </button>
      </div>

      {!isReady && <div className="text-blue-600 mb-4">Загрузка модели... {progress}% ({device})</div>}
      
      <CameraCapture onCapture={processFrame} />
      
      {scanning && <div className="text-center py-4">Поиск...</div>}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-3">Топ-5 совпадений</h2>
          {results.map((r, i) => (
            <div key={i} className="border p-4 mt-3 rounded-lg shadow-sm flex gap-4">
              <img src={URL.createObjectURL(r.imageData || new Blob())} alt="" className="w-24 h-24 object-cover rounded" />
              <div className="flex-1">
                <p className="font-medium">{r.description}</p>
                <p className="text-sm text-green-600">Схожесть: {(r.similarity * 100).toFixed(1)}%</p>
                {r.url && <a href={r.url} target="_blank" className="text-blue-600 underline text-sm">Открыть →</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
