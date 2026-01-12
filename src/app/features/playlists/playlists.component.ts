import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../core/playlists/playlist.service';
import { Playlist } from '../../core/models/playlist.model';
import { AudioPlayerService } from '../../core/audio/audio-player.service';

@Component({
  selector: 'app-playlists',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlists.components.html',
  styleUrls: ['./playlists.components.scss']
})
export class PlaylistsComponent implements OnInit {

  playlists: Playlist[] = []; // Tableau pour stocker les playlists
  selectedPlaylist: Playlist | null = null; // Playlist actuellement affichée

  constructor(
    private playlistService: PlaylistService,
    private audioPlayer: AudioPlayerService
  ) {
    console.log('PlaylistService injecté:', this.playlistService)
  }

  ngOnInit() {
    // Récupérer les playlists depuis le service
    this.playlists = this.playlistService.getPlaylists();
    console.log('Playlists chargées:', this.playlists.length);
  }

  // Afficher les morceaux d'une playlist
  viewTracks(playlist: Playlist) {
    this.selectedPlaylist = playlist;
    console.log('Affichage de la playlist:', playlist.name);
  }

  // Retourner à la liste des playlists
  backToPlaylists() {
    this.selectedPlaylist = null;
  }

  // Jouer un morceau
  playTrack(track: File) {
    // Envoyer le morceau et toute la playlist au lecteur
    this.audioPlayer.play(track, this.selectedPlaylist!.tracks);
    console.log('Lecture de:', track.name);
  }
}
