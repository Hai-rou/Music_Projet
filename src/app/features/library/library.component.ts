import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioPlayerService } from '../../core/audio/audio-player.service';
import { PlaylistService } from '../../core/playlists/playlist.service';
import { Playlist } from '../../core/models/playlist.model';  

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})
export class LibraryComponent implements OnInit {  
  
  selectedFiles: File[] = []; // Tableau pour stocker les fichiers sélectionnés
  scanMessage: string = ''; // Message de statut du scan
  scanStatus: 'success' | 'error' | '' = ''; // Type de message
  
  constructor(private audioPlayer: AudioPlayerService, private playlistService: PlaylistService) {
    console.log(' service injecté:', this.audioPlayer)
  }

  ngOnInit() {
    // Recupérer les fichiers depuis le service
    this.selectedFiles = this.audioPlayer.getPlaylist();
    console.log('Fichiers chargés:', this.selectedFiles.length);
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);

      // Filtrer les doublons
      const uniqueFiles = newFiles.filter(
        newFile => !this.selectedFiles.some(f => f.name === newFile.name)
      )
      this.selectedFiles = [...this.selectedFiles, ...uniqueFiles];
    
      this.audioPlayer.setPlaylist(this.selectedFiles);

      console.log(`${input.files.length} fichiers sélectionnés.`);

      for (let i=0; i < input.files.length; i++) {
        const file = input.files[i];
        console.log(`Fichier ${i + 1}: ${file.name} (${file.type}, ${file.size} bytes)`);
      }
    }
  }
  // Methode pour supprimer un fichier de la liste
  removeFile(index: number){
    this.selectedFiles.splice(index,1);

    this.audioPlayer.setPlaylist(this.selectedFiles);
    
    console.log(`Fichier supprimé. Reste: ${this.selectedFiles.length}`);
  }

  playMusic(file: File) {
    // Envoyer au service avec toute la liste
    this.audioPlayer.play(file, this.selectedFiles);
    console.log(`Envoyer au lecteur: ${file.name}`);
  }

  async scanMusicFolder() {
    // Vérifier si l'API est disponible
    if ('showDirectoryPicker' in window) {
      try {
        // Réinitialiser le message
        this.scanMessage = '';
        this.scanStatus = '';
        
        // Étape 1 : Demander à l'utilisateur de sélectionner un dossier
        const dirHandle = await (window as any).showDirectoryPicker();
        
        console.log('Dossier sélectionné, scanning en cours...');
        this.scanMessage = 'Scan en cours...';
        this.scanStatus = '';
        
        // Étape 2 : Scanner récursivement avec le nom du dossier racine
        await this.scanDirectory(dirHandle, dirHandle.name);
        
        // Étape 3 : Afficher le résultat
        const playlists = this.playlistService.getPlaylists();
        console.log(`🎵 ${playlists.length} playlists créées !`);
        
        // Message de succès
        this.scanMessage = `✅ Scan terminé ! ${playlists.length} playlist(s) créée(s). Allez dans "Mes Playlists" pour les voir.`;
        this.scanStatus = 'success';
        
        // Effacer le message après 5 secondes
        setTimeout(() => {
          this.scanMessage = '';
          this.scanStatus = '';
        }, 5000);
        
      } catch (error) {
        console.error('Erreur lors du scan du dossier:', error);
        this.scanMessage = '❌ Erreur lors du scan. Vérifiez les permissions ou réessayez.';
        this.scanStatus = 'error';
        
        // Effacer le message d'erreur après 5 secondes
        setTimeout(() => {
          this.scanMessage = '';
          this.scanStatus = '';
        }, 5000);
      }
    } else {
      // Fallback si l'API n'est pas disponible
      this.scanMessage = '⚠️ Votre navigateur ne supporte pas cette fonctionnalité. Utilisez Chrome ou Edge.';
      this.scanStatus = 'error';
    }
  }

  // Fonction récursive pour scanner un dossier et ses sous-dossiers
  private async scanDirectory(dirHandle: any, folderName: string) {

    // Créer un tableau temporaire pour stocker les fichiers trouvés
    const tracksInFolder: File[] = [];

    // Parcourir tous les éléments du dossier
    for await (const entry of dirHandle.values()) {
      
      if (entry.kind === 'file' && entry.name.endsWith('.mp3')) {
        // C'est un fichier : vérifier si c'est un MP3
        const file = await entry.getFile();
        tracksInFolder.push(file);
      } else if (entry.kind === 'directory') {
        // C'est un sous-dossier : scanner récursivement !
        console.log(`📁 Scanning: ${entry.name}`);
        await this.scanDirectory(entry, entry.name);
      }
    }

    // Si ce dossier contient des MP3, créer une playlist
    if (tracksInFolder.length > 0) {
      this.playlistService.addPlaylist({
        name: folderName,
        tracks: tracksInFolder
      });
      console.log(`✅ Playlist "${folderName}" créée avec ${tracksInFolder.length} morceaux`);
    }
  }
}

