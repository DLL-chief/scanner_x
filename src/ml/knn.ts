// src/ml/knn.ts

export interface Card {
  id: string;
  imageData: Blob | string;
  url: string;
  description: string;
  embedding: number[];
  createdAt: number;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findTop5(
  targetEmbedding: number[],
  cards: Card[]
): Promise<Array<{ card: Card; similarity: number }>> {
  const results = cards.map(card => ({
    card,
    similarity: cosineSimilarity(targetEmbedding, card.embedding)
  }));

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, 5);
}
