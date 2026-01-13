import { Injectable } from '@angular/core';
import { Playlist } from '../models/playlist.model';
import { EnrichedTrack } from '../models/track.model';
import { IndexedDbService } from '../storage/indexed-db.service';
import * as mm from 'music-metadata-browser';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  // 1. Stockage des playlists
  private playlists: Playlist[] = [];

  constructor(private indexedDbService: IndexedDbService) {
    // NE PAS charger automatiquement les playlists vides
    // Les playlists seront recréées au prochain scan
  }

  // 2. Méthode pour ajouter une playlist
  addPlaylist(playlist: Playlist) {
    // Vérifier si la playlist n'existe pas déjà
    const exists = this.playlists.some(p => p.name === playlist.name);
    
    if (!exists) {
      // Ajouter au tableau
      this.playlists.push(playlist);
      
      // Sauvegarder dans IndexedDB seulement les métadonnées
      this.indexedDbService.savePlaylist({
        name: playlist.name,
        trackCount: playlist.tracks.length,
        addedDate: new Date()
      });
      
      console.log(`✅ Playlist "${playlist.name}" ajoutée avec ${playlist.tracks.length} pistes`);
    } else {
      // Si la playlist existe déjà, mettre à jour les tracks
      const existingPlaylist = this.playlists.find(p => p.name === playlist.name);
      if (existingPlaylist) {
        existingPlaylist.tracks = playlist.tracks;
        console.log(`🔄 Playlist "${playlist.name}" mise à jour avec ${playlist.tracks.length} pistes`);
      }
    }
  }

  // 3. Méthode pour récupérer toutes les playlists
  getPlaylists(): Playlist[] {
    return this.playlists;
  }

  // 4. Méthode pour récupérer une playlist par nom
  getPlaylistByName(name: string): Playlist | undefined {
    return this.playlists.find(p => p.name === name);
  }

  // 5. Méthode pour vider toutes les playlists
  clearPlaylists() {
    this.playlists = [];
    console.log('🗑️ Toutes les playlists supprimées');
  }

  // 6. Méthode pour supprimer une playlist par nom
  removePlaylist(name: string) {
    // Trouver l'index de la playlist
    const index = this.playlists.findIndex(p => p.name === name);
    
    // Vérifier qu'elle existe
    if (index !== -1) {
      // Supprimer (splice modifie le tableau directement)
      this.playlists.splice(index, 1);
      console.log(`🗑️ Playlist "${name}" supprimée`);
    } else {
      console.log(`⚠️ Playlist "${name}" introuvable`);
    }
  }

  async extractMetadata(file: File): Promise<EnrichedTrack> {
    try {
      // 1. Extraire les métadonnées avec music-metadata-browser
      const metadata = await mm.parseBlob(file);

      // 2. Extraire la pochette si disponible
      let picture: string | undefined;
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
        picture = URL.createObjectURL(blob);
      }

      // 3. Construire l'objet EnrichedTrack
      return {
        file: file,
        title: metadata.common.title || file.name.replace('.mp3', ''),
        artist: metadata.common.artist || 'Inconnu',
        album: metadata.common.album,
        duration: metadata.format.duration,
        picture: picture
      };

    } catch (error) {
      // 4. Si ça échoue, utiliser le nom du fichier
      console.log(`⚠️ Pas de métadonnées pour ${file.name}`);
      return {
        file: file,
        title: file.name.replace('.mp3', ''),
        artist: 'Inconnu',
        album: undefined,
        duration: undefined,
        picture: undefined
      };
    }
  }

  // Charger au démarrage toutes les playlists sauvegardées
  async loadPlaylistsFromDB() {
    const storedPlaylists = await this.indexedDbService.getAllPlaylists();
    this.playlists = storedPlaylists.map(pl => ({
      name: pl.name,
      tracks: [] // Les fichiers ne sont pas stockés, juste les métadonnées 
    }));
    console.log(`📂 ${this.playlists.length} playlist(s) chargée(s) depuis la base de données`);
  }

}
