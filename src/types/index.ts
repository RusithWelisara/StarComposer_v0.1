export interface Star {
  x: number;
  y: number;
  color: string;
  instrument: string;
  id: number;
  selected?: boolean;
}

export interface SavedConstellation {
  name: string;
  stars: Star[];
  createdAt: string;
}

export interface GameProgress {
  starsCreated: number;
  constellationsPlayed: number;
  constellationsSaved: number;
  instrumentsUsed: Set<string>;
  colorsUsed: Set<string>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export type PlaybackMode = 'linear' | 'journey';
export type BackgroundTheme = 'cosmic' | 'nebula' | 'galaxy' | 'aurora';
export type MusicalScale = 'major' | 'minor' | 'pentatonic' | 'blues' | 'chromatic';
export type MusicalKey = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';