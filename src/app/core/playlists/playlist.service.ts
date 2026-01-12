import { Injectable } from '@angular/core';
import { Playlist } from '../models/playlist.model';
import { EnrichedTrack } from '../models/track.model';
import * as mm from 'music-metadata-browser';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  // 1. Stockage des playlists
  private playlists: Playlist[] = [];

  constructor() { }

  // 2. Méthode pour ajouter une playlist
  addPlaylist(playlist: Playlist) {
    // Vérifier si la playlist n'existe pas déjà
    const exists = this.playlists.some(p => p.name === playlist.name);
    
    if (!exists) {
      this.playlists.push(playlist);
      console.log(`✅ Playlist "${playlist.name}" ajoutée`);
    } else {
      console.log(`⚠️ Playlist "${playlist.name}" existe déjà`);
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

}
