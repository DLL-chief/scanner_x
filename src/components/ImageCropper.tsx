import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Rect { x: number; y: number; w: number; h: number }

interface ImageCropperProps {
  imageBlob: Blob | null;
  onCropped: (croppedBlob: Blob, imageData: ImageData) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageBlob, onCropped }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const dragging = useRef<{ startX: number; startY: number } | null>(null);

  useEffect(() => {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
    setRect(null);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  // Draw image + selection overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;
      draw(img, rect);
    };
    img.src = previewUrl;
  }, [previewUrl]);

  const draw = (img: HTMLImageElement, r: Rect | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    if (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  };

  const toCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const bound = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bound.width;
    const scaleY = canvas.height / bound.height;
    return {
      x: (e.clientX - bound.left) * scaleX,
      y: (e.clientY - bound.top) * scaleY,
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toCanvas(e);
    dragging.current = { startX: x, startY: y };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging.current || !imgRef.current) return;
    const { x, y } = toCanvas(e);
    const { startX, startY } = dragging.current;
    const r: Rect = {
      x: Math.min(x, startX),
      y: Math.min(y, startY),
      w: Math.abs(x - startX),
      h: Math.abs(y - startY),
    };
    setRect(r);
    draw(imgRef.current, r);
  };

  const onMouseUp = () => { dragging.current = null; };

  const handleCrop = () => {
    const img = imgRef.current;
    const output = outputRef.current;
    if (!img || !output) return;

    const cropRect = rect ?? {
      x: img.width * 0.1,
      y: img.height * 0.1,
      w: img.width * 0.8,
      h: img.height * 0.8,
    };

    output.width = cropRect.w;
    output.height = cropRect.h;
    const ctx = output.getContext('2d')!;
    ctx.drawImage(img, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h);

    output.toBlob(blob => {
      if (blob) {
        const imageData = ctx.getImageData(0, 0, output.width, output.height);
        onCropped(blob, imageData);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!previewUrl) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Выделите область мышью или нажмите «Обрезать» для авто-кропа</p>
      <canvas
        ref={canvasRef}
        className="max-w-full rounded border border-gray-300 cursor-crosshair"
        style={{ touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <canvas ref={outputRef} className="hidden" />
      <button
        onClick={handleCrop}
        className="bg-green-600 text-white px-6 py-3 rounded w-full"
      >
        {rect ? 'Обрезать выделенное' : 'Авто-кроп (центр 80%)'}
      </button>
    </div>
  );
};
