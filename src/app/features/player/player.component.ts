import { Component, OnInit } from '@angular/core';
import { AudioPlayerService } from '../../core/audio/audio-player.service';
import { PlaylistService } from '../../core/playlists/playlist.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {

  currentTrack: File | null = null ;
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;

  // Métadata affichées
  trackTitle: string ='';
  trackArtist: string ='';
  trackAlbum: string ='';
  trackPicture: string='';

  constructor(public audioPlayer: AudioPlayerService, private playlistService: PlaylistService) {}

  ngOnInit() {
    // S'abonner aux changements du service
    this.audioPlayer.currentTrack$.subscribe(track => {
      this.currentTrack = track;
      this.extractMetadata(track);
      console.log('Track changé:', track?.name);
    })

    this.audioPlayer.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
      console.log('Playing:', playing);
    })

    this.audioPlayer.currentTime$.subscribe(time => {
      this.currentTime = time;
    });

    this.audioPlayer.duration$.subscribe(duration => {
      this.duration = duration;
      console.log(`📊 Duration mise à jour: ${duration}s`);
    });
  }

  // Méthode pour basculer lecture/pause
  togglePlayPause() {
    this.audioPlayer.togglePlayPause();
  }

  next() {
    this.audioPlayer.next();
  }

  previous() {
    this.audioPlayer.previous();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor( seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getProgress(): number {
    if (this.duration === 0) return 0;
    const progress = (this.currentTime / this.duration) * 100;
    console.log(`📈 Progress: ${progress.toFixed(1)}% (${this.currentTime.toFixed(1)}s / ${this.duration.toFixed(1)}s)`);
    return progress;
  }

  onProgressClick(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * this.duration;
    this.audioPlayer.seek(newTime);
  }

  async extractMetadata(track: File | null) {
    if (!track) {
      // Réinitialiser les infos si pas de track
      this.trackTitle = '';
      this.trackArtist = '';
      this.trackAlbum = '';
      this.trackPicture = '';
      return;
    }

    // Extraire les métadonnées
    const enriched = await this.playlistService.extractMetadata(track);
    
    // Mettre à jour l'affichage
    this.trackTitle = enriched.title;
    this.trackArtist = enriched.artist;
    this.trackAlbum = enriched.album || '';
    this.trackPicture = enriched.picture || '';
    
    console.log('🎵 Métadonnées:', enriched.title, '-', enriched.artist);
  }
}
