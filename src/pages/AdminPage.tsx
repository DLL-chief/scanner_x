import React, { useState, useEffect } from 'react';
import { storageService, Card } from '../db/storage';
import { useClipWorker } from '../hooks/useClipWorker';

// TODO: Import CameraCapture, ImageCropper when created
// Placeholder for now

const AdminPage: React.FC = () => {
  const [cards, setCards] = useState<Omit<Card, 'embedding'>[]>([]);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isReady, vectorize } = useClipWorker();

  useEffect(() => {
    const loadCards = async () => {
      const allCards = await storageService.getAllCards();
      setCards(allCards);
    };
    loadCards();
  }, []);

  const handleSave = async () => {
    if (!imageBlob || !url || !description || !isReady) return;

    setIsProcessing(true);
    try {
      // Simulate ImageData from Blob for vectorize (in real: use canvas)
      // For demo, we'll skip full crop/vectorize for now
      console.log('Processing image...');
      
      // Placeholder embedding
      const dummyEmbedding = new Array(512).fill(0).map(() => Math.random());
      
      await storageService.addCard({
        imageData: imageBlob,
        url,
        description,
        embedding: dummyEmbedding,
      });
      
      // Reload cards
      const allCards = await storageService.getAllCards();
      setCards(allCards);
      
      // Reset form
      setUrl('');
      setDescription('');
      setImageBlob(null);
      
      alert('Карточка успешно добавлена!');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Ошибка при сохранении');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Вы уверены? Это действие необратимо.')) return;
    await storageService.clearAll();
    setCards([]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Админка: Добавление эталонов</h2>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Добавить новую карточку</h3>
        
        {/* Placeholder for Camera / File upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Изображение (placeholder)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setImageBlob(file);
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://example.com/card-info"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Описание (макс. 500 симв.)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            className="w-full px-3 py-2 border rounded-md h-24"
            placeholder="Краткое описание карточки"
          />
          <div className="text-xs text-gray-500 mt-1">{description.length}/500</div>
        </div>

        <button
          onClick={handleSave}
          disabled={isProcessing || !imageBlob || !url || !description || !isReady}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 w-full"
        >
          {isProcessing ? 'Обработка...' : 'Сохранить эталон'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Список эталонов ({cards.length})</h3>
          <button
            onClick={handleClear}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
          >
            Сбросить базу
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="border rounded p-4">
              {/* TODO: Show image preview */}
              <div className="h-32 bg-gray-200 flex items-center justify-center mb-2 rounded">
                Превью
              </div>
              <p className="font-medium">{card.description}</p>
              <a href={card.url} target="_blank" className="text-blue-600 text-sm hover:underline">
                {card.url}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
