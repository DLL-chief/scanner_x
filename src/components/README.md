# src/components/

## Контракты и особенности:
- **CameraCapture.tsx**: `onCapture(blob: Blob, imageData: ImageData)` — live camera with overlay frame for consistent cropping.
- **ImageCropper.tsx**: Принимает Blob, canvas crop (center + fixed aspect), возвращает cropped Blob + ImageData.

Mobile-first, Tailwind, Canvas-based для vectorization.

Обновлено: добавлен ImageCropper.