import React, { useState, useEffect } from 'react';
import { StorageService } from './db/storage';
import { useClipWorker } from './hooks/useClipWorker';
import './index.css';

// Simple Card type for UI
function App() {
  const [mode, setMode] = useState<'admin' | 'recognize'>('recognize');
  const [cards, setCards] = useState<any[]>([]);
  const { worker, isReady, status, vectorize } = useClipWorker();

  // Load cards
  useEffect(() => {
    const loadCards = async () => {
      const allCards = await StorageService.getAllCards();
      setCards(allCards);
    };
    loadCards();
  }, []);

  const handleVectorize = async () => {
    // Example placeholder
    console.log('Vectorize called');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Scanner X</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setMode('recognize')}
              className={`px-4 py-2 rounded ${mode === 'recognize' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Распознавание
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`px-4 py-2 rounded ${mode === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Админка
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4">
        {mode === 'recognize' ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Распознавание карточки</h2>
            <p>Интеграция worker: {isReady ? 'Готов' : 'Загрузка...'}</p>
            <p>Статус: {status}</p>
            {/* Camera and recognition UI will be added later */}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Админ панель</h2>
            <p>Сохранено карточек: {cards.length}</p>
            {/* Admin UI will be added later */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
