import React, { useState } from 'react';
import { CameraCapture } from '../components/CameraCapture';
import { useClipWorker } from '../hooks/useClipWorker';
import { findTop5 } from '../ml/knn';
import { StorageService } from '../db/storage';

export default function RecognizePage() {
  const { isReady, isLoading, progress, device, vectorize } = useClipWorker();
  const [results, setResults] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);

  const handleCapture = async (blob: Blob, imageData: ImageData) => {
    setScanning(true);
    try {
      const embedding = await vectorize(imageData);
      const cards = await StorageService.getAllCardsWithEmbeddings();
      const top5 = findTop5(embedding, cards);
      setResults(top5);
    } catch (e) {
      console.error(e);
    }
    setScanning(false);
  };

  // Live detection loop placeholder (for continuous scan)
  // Can be extended with requestAnimationFrame

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Распознавание карточек</h1>
      
      {!isReady && <div>Загрузка модели... {progress}% {device}</div>}
      
      <CameraCapture onCapture={handleCapture} />
      
      {scanning && <div>Векторизация и поиск...</div>}
      
      {results.length > 0 && (
        <div>
          <h2>Результаты (Top 5):</h2>
          {results.map((r, i) => (
            <div key={i} className="border p-3 mt-2">
              <img src={r.imageUrl} alt="" className="w-32" />
              <p>{r.description} - Similarity: {r.similarity.toFixed(3)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
