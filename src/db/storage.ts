// src/db/storage.ts
// IndexedDB wrapper for cards storage

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Card {
  id: string;
  imageData: Blob;
  url: string;
  description: string;
  embedding: number[];
  createdAt: number;
}

interface ScannerDB extends DBSchema {
  cards: {
    key: string;
    value: Card;
    indexes: { 'by-created': number };
  };
}

class StorageService {
  private dbPromise: Promise<IDBPDatabase<ScannerDB>>;

  constructor() {
    this.dbPromise = openDB<ScannerDB>('scanner-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('cards', { keyPath: 'id' });
        store.createIndex('by-created', 'createdAt');
      },
    });
  }

  async addCard(card: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
    const db = await this.dbPromise;
    const id = crypto.randomUUID();
    const fullCard: Card = {
      ...card,
      id,
      createdAt: Date.now(),
    };
    await db.put('cards', fullCard);
    return fullCard;
  }

  async getAllCards(): Promise<Omit<Card, 'embedding'>[]> {
    const db = await this.dbPromise;
    const cards = await db.getAll('cards');
    return cards.map(({ embedding, ...rest }) => rest);
  }

  // Added for RecognizePage
  async getAllCardsWithEmbeddings(): Promise<Card[]> {
    const db = await this.dbPromise;
    return db.getAll('cards');
  }

  async getCard(id: string): Promise<Card | undefined> {
    const db = await this.dbPromise;
    return db.get('cards', id);
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('cards');
  }

  async getAllEmbeddings(): Promise<Array<{id: string; embedding: number[] }>> {
    const db = await this.dbPromise;
    const cards = await db.getAll('cards');
    return cards.map(c => ({ id: c.id, embedding: c.embedding }));
  }
}

export const storageService = new StorageService();