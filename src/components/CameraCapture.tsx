// Updated with live preview and capture to ImageData
// (assuming previous implementation)

import React, { useRef, useEffect, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (blob: Blob, imageData: ImageData) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      });

    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(blob => {
      if (blob) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        onCapture(blob, imageData);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="relative">
      <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
      {/* Overlay frame */}
      <div className="absolute inset-0 border-4 border-dashed border-white/70 flex items-center justify-center pointer-events-none">
        <div className="w-4/5 h-3/5 border border-white/50" />
      </div>
      <button onClick={capture} className="mt-4 bg-blue-600 px-6 py-3 rounded">Сфотографировать</button>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
