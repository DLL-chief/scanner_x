import { useState } from 'react'
import './index.css'

function App() {
  const [mode, setMode] = useState<'admin' | 'recognize'>('recognize')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-black p-4 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold">Scanner X</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setMode('recognize')}
            className={`px-4 py-2 rounded ${mode === 'recognize' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Распознавание
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`px-4 py-2 rounded ${mode === 'admin' ? 'bg-blue-600' : 'bg-gray-800'}`}
          >
            Админка
          </button>
        </div>
      </header>

      <main className="p-6">
        {mode === 'recognize' ? (
          <div>Режим распознавания (в разработке)</div>
        ) : (
          <div>Админка (в разработке)</div>
        )}
      </main>
    </div>
  )
}

export default App
