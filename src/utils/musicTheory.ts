import { MusicalScale, MusicalKey } from '../types';

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const KEY_OFFSETS = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const generateScaleNotes = (
  key: MusicalKey, 
  scale: MusicalScale, 
  octaveRange: [number, number] = [3, 6]
): string[] => {
  const scaleIntervals = SCALES[scale];
  const keyOffset = KEY_OFFSETS[key];
  const notes: string[] = [];
  
  for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
    scaleIntervals.forEach(interval => {
      const noteIndex = (keyOffset + interval) % 12;
      const noteName = NOTE_NAMES[noteIndex];
      notes.push(`${noteName}${octave}`);
    });
  }
  
  return notes;
};

export const quantizeToScale = (
  normalizedY: number, 
  key: MusicalKey, 
  scale: MusicalScale
): string => {
  const notes = generateScaleNotes(key, scale);
  const noteIndex = Math.floor((1 - normalizedY) * notes.length);
  return notes[Math.max(0, Math.min(noteIndex, notes.length - 1))];
};