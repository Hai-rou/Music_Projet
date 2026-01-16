import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  
  @ViewChild('folderInput') folderInput!: ElementRef<HTMLInputElement>;
  
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
    // Réinitialiser le message
    this.scanMessage = '';
    this.scanStatus = '';
    
    // Stratégie 1 : Essayer showDirectoryPicker (Chrome/Edge moderne)
    if ('showDirectoryPicker' in window) {
      try {
        console.log('🚀 Utilisation de showDirectoryPicker (Chrome/Edge)');
        
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
      // Stratégie 2 : Fallback avec webkitdirectory (Firefox/Safari/anciens navigateurs)
      console.log('🦊 Fallback vers webkitdirectory (Firefox/Safari)');
      this.folderInput.nativeElement.click();
    }
  }

  // Lecture aléatoire de la bibliothèque
  playRandomTrack() {
    // 1. Récupérer Toutes les musiques
    let allTracks: File[] = [...this.selectedFiles];

    // 2. Ajouter les fichiers de toutes les playlists
    const playlists = this.playlistService.getPlaylists();
    for (const playlist of playlists) {
      allTracks = [...allTracks, ...playlist.tracks];
    }

    // 3. Vérifier qu'il y a des morceaux
    if (allTracks.length === 0) {
      console.log('Aucun fichier disponible');
      return; // Sortir de la fonction
    }

    // 4. Mélanger les morceaux
    for (let i = allTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
    }

    // 5. Lancer la lecture du premier morceau
    this.audioPlayer.play(allTracks[0], allTracks);
    console.log('🔀 Lecture aléatoire démarrée avec:', allTracks.length, 'morceaux');
  }

  // Méthode pour traiter les fichiers sélectionnés via webkitdirectory
  onFolderSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      console.log('Aucun fichier sélectionné');
      return;
    }
    
    console.log(`📂 ${input.files.length} fichiers détectés via webkitdirectory`);
    this.scanMessage = 'Scan en cours...';
    this.scanStatus = '';
    
    // Organiser les fichiers par dossier
    const folderMap = new Map<string, File[]>();
    
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      
      // Filtrer uniquement les MP3
      if (file.name.toLowerCase().endsWith('.mp3')) {
        // Extraire le nom du dossier parent depuis le webkitRelativePath
        const webkitFile = file as any;
        const relativePath = webkitFile.webkitRelativePath || file.name;
        const pathParts = relativePath.split('/');
        
        // Le nom du dossier est l'avant-dernier élément (avant le fichier)
        const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Musique';
        
        // Ajouter à la map
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)!.push(file);
      }
    }
    
    // Créer une playlist pour chaque dossier
    let playlistCount = 0;
    folderMap.forEach((tracks, folderName) => {
      this.playlistService.addPlaylist({
        name: folderName,
        tracks: tracks
      });
      console.log(`✅ Playlist "${folderName}" créée avec ${tracks.length} morceaux`);
      playlistCount++;
    });
    
    // Afficher le message de succès
    this.scanMessage = `✅ Scan terminé ! ${playlistCount} playlist(s) créée(s). Allez dans "Mes Playlists" pour les voir.`;
    this.scanStatus = 'success';
    
    // Effacer le message après 5 secondes
    setTimeout(() => {
      this.scanMessage = '';
      this.scanStatus = '';
    }, 5000);
    
    // Réinitialiser l'input pour permettre une nouvelle sélection
    input.value = '';
  }

  // Fonction récursive pour scanner un dossier et ses sous-dossiers (showDirectoryPicker)
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

