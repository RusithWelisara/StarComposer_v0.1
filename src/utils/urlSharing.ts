import { Star } from '../types';

export const encodeConstellationToUrl = (stars: Star[]): string => {
  const data = {
    stars: stars.map(star => ({
      x: Math.round(star.x * 1000) / 1000, // Reduce precision for shorter URLs
      y: Math.round(star.y * 1000) / 1000,
      color: star.color,
      instrument: star.instrument,
      id: star.id
    })),
    version: 1
  };
  
  const compressed = btoa(JSON.stringify(data));
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?constellation=${encodeURIComponent(compressed)}`;
};

export const decodeConstellationFromUrl = (): Star[] | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const constellationData = urlParams.get('constellation');
  
  if (!constellationData) return null;
  
  try {
    const decoded = atob(decodeURIComponent(constellationData));
    const data = JSON.parse(decoded);
    
    if (data.version === 1 && Array.isArray(data.stars)) {
      return data.stars;
    }
  } catch (error) {
    console.error('Failed to decode constellation from URL:', error);
  }
  
  return null;
};