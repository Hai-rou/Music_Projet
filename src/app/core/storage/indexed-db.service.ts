import { Injectable } from '@angular/core';
import { Track } from '../models/track.model';
import { Playlist } from '../models/playlist.model';

// Interface pour stocker les playlists dans IndexedDB
interface StoredPlaylist {
  name: string;
  trackCount: number;
  addedDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'HaacchiMusicDB';
  private version = 2; // Incrémenté pour la nouvelle structure
  private db: IDBDatabase | null = null;
  private isBrowser: boolean;

  constructor() {
    // Vérifier si on est dans le navigateur
    this.isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
    
    if (this.isBrowser) {
      this.initDatabase();
    }
  }

  private async initDatabase(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('✅ IndexedDB initialisée');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store pour les tracks individuels (existant)
        if (!db.objectStoreNames.contains('tracks')) {
          const objectStore = db.createObjectStore('tracks', { keyPath: 'id' });
          objectStore.createIndex('title', 'title', { unique: false });
          objectStore.createIndex('artist', 'artist', { unique: false });
        }

        // Nouveau store pour les playlists
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'name' });
          playlistStore.createIndex('addedDate', 'addedDate', { unique: false });
          console.log('📁 Store "playlists" créé');
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

  // Sauvegarder une playlist (sans les fichiers, juste les métadonnées)
  async savePlaylist(playlist: StoredPlaylist): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (!this.db) await this.initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['playlists'], 'readwrite');
      const objectStore = transaction.objectStore('playlists');
      const request = objectStore.put(playlist); // put = ajouter ou remplacer

      request.onsuccess = () => {
        console.log(`💾 Playlist "${playlist.name}" sauvegardée`);
        resolve();
      };
      request.onerror = () => reject('Error saving playlist');
    });
  }

  // Récupérer toutes les playlists sauvegardées
  async getAllPlaylists(): Promise<StoredPlaylist[]> {
    if (!this.isBrowser) return Promise.resolve([]);
    if (!this.db) await this.initDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['playlists'], 'readonly');
      const objectStore = transaction.objectStore('playlists');
      const request = objectStore.getAll();

      request.onsuccess = () => {
        console.log(`📂 ${request.result.length} playlist(s) chargées depuis IndexedDB`);
        resolve(request.result);
      };
      request.onerror = () => reject('Error loading playlists');
    });
  }
}
