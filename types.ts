
export interface Episode {
  id: string;
  number: number;
  title: string;
  videoData?: Blob | string; // Unterstützt Blobs für lokale Dateien
  videoUrl?: string; // Fallback für URLs
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  posterData?: Blob | string;
  backdropData?: Blob | string;
  posterUrl?: string;
  backdropUrl?: string;
  genre: string;
  rating: number;
  year: number;
  videoData?: Blob | string;
  videoUrl?: string;
  isPremium?: boolean;
  type: 'movie' | 'series';
  seasons?: Season[];
}

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
  isPremium: boolean;
}

export interface PremiumCode {
  code: string;
  isUsed: boolean;
  generatedBy: string;
}
