import { Component, OnInit } from '@angular/core';
import { AudioPlayerService } from '../../core/audio/audio-player.service';
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

  constructor(public audioPlayer: AudioPlayerService) {}

  ngOnInit() {
    // S'abonner aux changements du service
    this.audioPlayer.currentTrack$.subscribe(track => {
      this.currentTrack = track;
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
    return (this.currentTime / this.duration) * 100;
  }

  onProgressClick(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * this.duration;
    this.audioPlayer.seek(newTime);
  }
}
