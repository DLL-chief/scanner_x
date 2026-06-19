import React, { useState } from 'react';
import AdminPage from './pages/AdminPage';
import RecognizePage from './pages/RecognizePage';
import './index.css';

function App() {
  const [mode, setMode] = useState<'admin' | 'recognize'>('recognize');

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
        {mode === 'recognize' ? <RecognizePage /> : <AdminPage />}
      </main>
    </div>
  );
}

export default App;
