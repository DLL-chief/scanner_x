import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageBlob: Blob | null;
  onCropped: (croppedBlob: Blob, imageData: ImageData) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageBlob, onCropped }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false); // kept for future drag-crop

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageBlob]);

  const handleCrop = () => {
    if (!canvasRef.current || !previewUrl) return;
    // Simple center crop for prototype (can be extended with drag selection)
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      // Fixed aspect crop simulation
      const cropSize = Math.min(img.width, img.height) * 0.8;
      canvas.width = cropSize;
      canvas.height = cropSize;
      ctx.drawImage(img, (img.width - cropSize)/2, (img.height - cropSize)/2, cropSize, cropSize, 0, 0, cropSize, cropSize);

      canvas.toBlob(croppedBlob => {
        if (croppedBlob) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          onCropped(croppedBlob, imageData);
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = previewUrl;
  };

  return (
    <div className="space-y-4">
      {previewUrl && <img src={previewUrl} alt="Preview" className="max-w-full rounded" />}
      <canvas ref={canvasRef} className="hidden" />
      <button onClick={handleCrop} disabled={!previewUrl} className="bg-green-600 px-6 py-3 rounded disabled:opacity-50">
        Обрезать и сохранить
      </button>
    </div>
  );
};
