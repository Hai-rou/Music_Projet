export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl?: string;
  addedDate: Date;
}

// Interface pour un fichier enrichi avec ses métadonnées
export interface EnrichedTrack {
  file: File;                 // Le fichier MP3 original
  title: string;              // Titre extrait ou nom du fichier
  artist: string;             // Artiste extrait ou "Inconnu"
  album?: string;             // Album si disponible
  duration?: number;          // Durée en secondes
  picture?: string;           // URL de la pochette (base64)
}
