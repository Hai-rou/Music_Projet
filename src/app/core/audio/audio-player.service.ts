import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'  // Service disponible partout dans l'app
})
export class AudioPlayerService {
  
  // État du lecteur (observable pour la réactivité)
  private currentTrackSubject = new BehaviorSubject<File | null>(null);
  currentTrack$ = this.currentTrackSubject.asObservable();
  
  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  isPlaying$ = this.isPlayingSubject.asObservable();
  
  // Liste des musiques
  private playlistSubject = new BehaviorSubject<File[]>([]);
  playlist$ = this.playlistSubject.asObservable();
  
  private currentTimeSubject = new BehaviorSubject<number>(0);
  currentTime$ = this.currentTimeSubject.asObservable();

  private durationSubject = new BehaviorSubject<number>(0);
  duration$ = this.durationSubject.asObservable();

  // Stockage de la playlist actuelle
  getPlaylist(): File[] {
    return this.playlistSubject.value;
  }


  // Élément audio HTML
  private audio: HTMLAudioElement | null = null;
  private currentIndex: number = 0;

  constructor() {}

  // Définir la playlist
  setPlaylist(files: File[]) {
    this.playlistSubject.next(files);
  }

  // Lire une musique
  play(file: File, playlist?: File[]) {
    // Si une playlist est fournie, la sauvegarder
    if (playlist) {
      this.setPlaylist(playlist);
      this.currentIndex = playlist.findIndex(f => f.name === file.name);
    }

    // Arrêter la musique en cours
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }

    // Créer une URL temporaire
    const url = URL.createObjectURL(file);
    
    // Créer le nouvel audio
    this.audio = new Audio(url);
    this.currentTrackSubject.next(file);
    this.isPlayingSubject.next(true);
    
    // Lire
    this.audio.play();

    this.audio.addEventListener('timeupdate', () => {
      this.currentTimeSubject.next(this.audio!.currentTime);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.durationSubject.next(this.audio!.duration);
    });
    
    console.log(`🎵 Lecture: ${file.name}`);

    // Quand la musique se termine
    this.audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      this.next(); // Passer à la suivante
    });

    
  }

  // Pause
  pause() {
    if (this.audio) {
      this.audio.pause();
      this.isPlayingSubject.next(false);
      console.log('⏸️ Pause');
    }
  }

  // Reprendre
  resume() {
    if (this.audio) {
      this.audio.play();
      this.isPlayingSubject.next(true);
      console.log('▶️ Reprise');
    }
  }

  // Toggle play/pause
  togglePlayPause() {
    if (this.isPlayingSubject.value) {
      this.pause();
    } else {
      this.resume();
    }
  }

  // Musique suivante
  next() {
    const playlist = this.playlistSubject.value;
    if (playlist.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % playlist.length;
    this.play(playlist[this.currentIndex]);
  }

  // Musique précédente
  previous() {
    const playlist = this.playlistSubject.value;
    if (playlist.length === 0) return;

    this.currentIndex = this.currentIndex - 1;
    if (this.currentIndex < 0) {
      this.currentIndex = playlist.length - 1;
    }
    this.play(playlist[this.currentIndex]);
  }

  // Cherche un point précis de la musique (en secondes)
  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
      console.log(`Seek to: ${time} seconds`);
    }
  }
}
