import { useState, useEffect } from 'react';
import { Star, Music, Palette, Trophy } from 'lucide-react';

interface GameProgress {
  starsCreated: number;
  constellationsPlayed: number;
  constellationsSaved: number;
  instrumentsUsed: Set<string>;
  colorsUsed: Set<string>;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

const STORAGE_KEY = 'starcomposer_progress';

export const useGameProgress = () => {
  const [progress, setProgress] = useState<GameProgress>({
    starsCreated: 0,
    constellationsPlayed: 0,
    constellationsSaved: 0,
    instrumentsUsed: new Set(),
    colorsUsed: new Set(),
  });

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress({
          ...parsed,
          instrumentsUsed: new Set(parsed.instrumentsUsed || []),
          colorsUsed: new Set(parsed.colorsUsed || []),
        });
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: GameProgress) => {
    const toSave = {
      ...newProgress,
      instrumentsUsed: Array.from(newProgress.instrumentsUsed),
      colorsUsed: Array.from(newProgress.colorsUsed),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setProgress(newProgress);
  };

  const incrementStarsCreated = () => {
    const newProgress = { ...progress, starsCreated: progress.starsCreated + 1 };
    saveProgress(newProgress);
  };

  const incrementConstellationsPlayed = () => {
    const newProgress = { ...progress, constellationsPlayed: progress.constellationsPlayed + 1 };
    saveProgress(newProgress);
  };

  const incrementConstellationsSaved = () => {
    const newProgress = { ...progress, constellationsSaved: progress.constellationsSaved + 1 };
    saveProgress(newProgress);
  };

  const addInstrumentUsed = (instrument: string) => {
    const newInstruments = new Set(progress.instrumentsUsed);
    newInstruments.add(instrument);
    const newProgress = { ...progress, instrumentsUsed: newInstruments };
    saveProgress(newProgress);
  };

  const addColorUsed = (color: string) => {
    const newColors = new Set(progress.colorsUsed);
    newColors.add(color);
    const newProgress = { ...progress, colorsUsed: newColors };
    saveProgress(newProgress);
  };

  // Define achievements
  const achievements: Achievement[] = [
    {
      id: 'first_star',
      name: 'First Light',
      description: 'Create your first star',
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      unlocked: progress.starsCreated >= 1,
      progress: Math.min(progress.starsCreated, 1),
      maxProgress: 1,
    },
    {
      id: 'constellation_master',
      name: 'Constellation Master',
      description: 'Create 50 stars',
      icon: <Star className="w-5 h-5 text-cyan-400" />,
      unlocked: progress.starsCreated >= 50,
      progress: Math.min(progress.starsCreated, 50),
      maxProgress: 50,
    },
    {
      id: 'composer',
      name: 'Cosmic Composer',
      description: 'Play 10 constellations',
      icon: <Music className="w-5 h-5 text-purple-400" />,
      unlocked: progress.constellationsPlayed >= 10,
      progress: Math.min(progress.constellationsPlayed, 10),
      maxProgress: 10,
    },
    {
      id: 'collector',
      name: 'Star Collector',
      description: 'Save 5 constellations',
      icon: <Trophy className="w-5 h-5 text-yellow-400" />,
      unlocked: progress.constellationsSaved >= 5,
      progress: Math.min(progress.constellationsSaved, 5),
      maxProgress: 5,
    },
    {
      id: 'artist',
      name: 'Cosmic Artist',
      description: 'Use all instrument types',
      icon: <Palette className="w-5 h-5 text-pink-400" />,
      unlocked: progress.instrumentsUsed.size >= 4,
      progress: progress.instrumentsUsed.size,
      maxProgress: 4,
    },
  ];

  // Check for unlocked content
  const getUnlockedInstruments = () => {
    const base = ['synth'];
    if (progress.starsCreated >= 5) base.push('amsynth');
    if (progress.starsCreated >= 15) base.push('fmsynth');
    if (progress.starsCreated >= 30) base.push('pluck');
    return base;
  };

  const getUnlockedColors = () => {
    const base = ['#64ffda'];
    if (progress.constellationsPlayed >= 2) base.push('#ff6b9d');
    if (progress.constellationsPlayed >= 5) base.push('#ffd93d');
    if (progress.constellationsPlayed >= 8) base.push('#6bcf7f');
    if (progress.constellationsPlayed >= 12) base.push('#a78bfa');
    return base;
  };

  return {
    progress,
    achievements,
    incrementStarsCreated,
    incrementConstellationsPlayed,
    incrementConstellationsSaved,
    addInstrumentUsed,
    addColorUsed,
    getUnlockedInstruments,
    getUnlockedColors,
  };
};