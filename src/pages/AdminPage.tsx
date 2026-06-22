import React, { useState, useEffect } from 'react';
import { useClipWorker } from '../hooks/useClipWorker';
import { storageService } from '../db/storage';
import { ImageCropper } from '../components/ImageCropper';
import { CameraCapture } from '../components/CameraCapture';

export default function AdminPage() {
  const { vectorize, isReady, progress, device } = useClipWorker();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedImageData, setCroppedImageData] = useState<ImageData | null>(null);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const loadCards = async () => {
    const all = await storageService.getAllCards();
    setCards(all);
  };

  useEffect(() => { loadCards(); }, []);

  const handleCapture = (blob: Blob, _imageData?: ImageData) => {
    setImageBlob(blob);
    setCroppedBlob(null);
    setCroppedImageData(null);
  };

  // Кроп только готовит изображение, не сохраняет
  const handleCropped = (cropped: Blob, imageData: ImageData) => {
    setCroppedBlob(cropped);
    setCroppedImageData(imageData);
    setMessage('Кадр обрезан. Заполните URL и описание, затем «Сохранить».');
  };

  const handleSave = async () => {
    if (!croppedBlob || !croppedImageData) {
      setMessage('Сначала сделайте фото и обрежьте кадр');
      return;
    }
    if (!url || !description) {
      setMessage('Заполните URL и описание');
      return;
    }
    if (!isReady) {
      setMessage('Модель ещё загружается, подождите');
      return;
    }
    setSaving(true);
    try {
      const embedding = await vectorize(croppedImageData);
      await storageService.addCard({ imageData: croppedBlob, url, description, embedding });
      setMessage('Карточка сохранена!');
      setImageBlob(null);
      setCroppedBlob(null);
      setCroppedImageData(null);
      setUrl(''); setDescription('');
      loadCards();
    } catch (e) {
      setMessage('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Очистить всю базу?')) {
      await storageService.clearAll();
      loadCards();
      setMessage('База очищена');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Админка — Добавление карточек</h1>
      
      {!isReady && <div className="text-blue-600">Загрузка модели... {progress}% ({device})</div>}

      <CameraCapture onCapture={handleCapture} />
      
      {imageBlob && <ImageCropper imageBlob={imageBlob} onCropped={handleCropped} />}

      <div className="space-y-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
          className="w-full p-3 border rounded"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (до 500 симв.)"
          maxLength={500}
          className="w-full p-3 border rounded h-24"
        />
        <button onClick={handleSave} disabled={!croppedBlob || saving} className="bg-green-600 text-white px-6 py-3 rounded w-full disabled:opacity-50">
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>

      {message && <div className="p-3 bg-green-100 rounded">{message}</div>}

      <div>
        <h2 className="font-semibold mb-2">Список карточек ({cards.length})</h2>
        <button onClick={handleClear} className="text-red-600 text-sm">Сбросить базу</button>
        {cards.map(c => (
          <div key={c.id} className="border p-3 mt-2 flex gap-3">
            <img src={URL.createObjectURL(c.imageData)} alt="" className="w-20 h-20 object-cover rounded" />
            <div>
              <p className="text-sm">{c.description}</p>
              <a href={c.url} target="_blank" className="text-blue-600 text-xs">{c.url}</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
