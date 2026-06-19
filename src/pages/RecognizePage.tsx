import React, { useState } from 'react';
import { storageService } from '../db/storage';
import { useClipWorker } from '../hooks/useClipWorker';
import { findTop5 } from '../ml/knn';

// TODO: Integrate CameraCapture, ImageCropper

const RecognizePage: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  const { isReady, vectorize } = useClipWorker();

  const handleRecognize = async (imageBlob: Blob) => {
    if (!isReady) {
      alert('Модель еще загружается...');
      return;
    }

    setIsRecognizing(true);
    try {
      // Placeholder: convert Blob to ImageData (in real impl use canvas)
      // For now, dummy
      const dummyImageData = { /* ImageData */ } as any;
      const embedding = await vectorize(dummyImageData); // Will need proper impl
      
      // Get all cards with embeddings
      // Note: storage needs update or use full cards with caution (memory)
      
      // Placeholder results
      console.log('Recognizing with embedding:', embedding);
      
      // Real: 
      // const topResults = await findTop5(embedding, fullCards);
      setResults([]); // TODO
      
      alert('Распознавание выполнено (placeholder). Добавьте реальные карточки в админке.');
    } catch (error) {
      console.error(error);
      alert('Ошибка распознавания');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Распознавание карточки</h2>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="mb-4">Наведите камеру или загрузите фото карточки. Интеграция с worker: {isReady ? '✅ Готов' : '⏳ Загрузка модели...'}</p>
        
        {/* Placeholder for CameraCapture */}
        <div className="mb-6">
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRecognize(file);
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {isRecognizing && <div className="text-blue-600">Распознавание...</div>}
      </div>

      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Результаты (Top 5)</h3>
          {/* Render results */}
        </div>
      )}
    </div>
  );
};

export default RecognizePage;
