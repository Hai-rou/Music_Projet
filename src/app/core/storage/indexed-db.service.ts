import { Injectable } from '@angular/core';
import { Track } from '../models/track.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'HaacchiMusicDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('tracks')) {
          const objectStore = db.createObjectStore('tracks', { keyPath: 'id' });
          objectStore.createIndex('title', 'title', { unique: false });
          objectStore.createIndex('artist', 'artist', { unique: false });
        }
      };
    });
  }

  async addTrack(track: Track): Promise<void> {
    if (!this.db) await this.initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tracks'], 'readwrite');
      const objectStore = transaction.objectStore('tracks');
      const request = objectStore.add(track);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error adding track');
    });
  }

  async getAllTracks(): Promise<Track[]> {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tracks'], 'readonly');
      const objectStore = transaction.objectStore('tracks');
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error getting tracks');
    });
  }

  async getTrack(id: string): Promise<Track | undefined> {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tracks'], 'readonly');
      const objectStore = transaction.objectStore('tracks');
      const request = objectStore.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error getting track');
    });
  }

  async deleteTrack(id: string): Promise<void> {
    if (!this.db) await this.initDatabase();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tracks'], 'readwrite');
      const objectStore = transaction.objectStore('tracks');
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error deleting track');
    });
  }
}
