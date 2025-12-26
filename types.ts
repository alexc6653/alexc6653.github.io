
export interface Movie {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  genre: string;
  rating: number;
  year: number;
  videoUrl: string;
  isPremium?: boolean;
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

export type Category = 'All' | 'Action' | 'Drama' | 'Sci-Fi' | 'Comedy' | 'Horror' | 'Thriller';

export interface GeminiMetadata {
  description: string;
  genre: string;
  rating: number;
  year: number;
}
