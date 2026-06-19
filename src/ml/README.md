## ML Layer (Pure Frontend)

- `clip.worker.ts`: Web Worker with @xenova/transformers CLIP model (WebGPU priority, WASM fallback).
- `knn.ts`: Cosine similarity + brute-force KNN.

**Worker Contract:**
- Input: {type: 'init' | 'vectorize', imageData: ImageData, device?}
- Output: {type: 'ready' | 'result' | 'status' | 'error', embedding?: number[], timeMs?}