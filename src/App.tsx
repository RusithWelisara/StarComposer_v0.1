import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, Square, Trash2, Palette, Music, Save, FolderOpen, Trophy, 
  Undo, Redo, Edit3, Share2, Settings, Camera, Zap 
} from 'lucide-react';
import { StarField } from './components/StarField';
import { ProgressTracker } from './components/ProgressTracker';
import { SaveLoadModal } from './components/SaveLoadModal';
import { ShareModal } from './components/ShareModal';
import { Tooltip } from './components/Tooltip';
import { useGameProgress } from './hooks/useGameProgress';
import { encodeConstellationToUrl, decodeConstellationFromUrl } from './utils/urlSharing';
import { quantizeToScale } from './utils/musicTheory';
import { Star, SavedConstellation, PlaybackMode, BackgroundTheme, MusicalScale, MusicalKey } from './types';

declare global {
  interface Window {
    Tone: any;
  }
}

const StarComposer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState('synth');
  const [selectedColor, setSelectedColor] = useState('#64ffda');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioEngine, setAudioEngine] = useState<any>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [savedConstellations, setSavedConstellations] = useState<SavedConstellation[]>([]);
  const [history, setHistory] = useState<Star[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedStarId, setSelectedStarId] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Advanced settings
  const [bpm, setBpm] = useState(120);
  const [musicalKey, setMusicalKey] = useState<MusicalKey>('C');
  const [musicalScale, setMusicalScale] = useState<MusicalScale>('pentatonic');
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('linear');
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('cosmic');
  const [visualizerIntensity, setVisualizerIntensity] = useState(0);
  
  const starIdRef = useRef(0);
  const playingStarsRef = useRef<Set<number>>(new Set());
  const cameraPositionRef = useRef(0);
  const analyserRef = useRef<any>(null);

  const {
    progress,
    achievements,
    incrementStarsCreated,
    incrementConstellationsPlayed,
    incrementConstellationsSaved,
    addInstrumentUsed,
    addColorUsed,
    getUnlockedInstruments,
    getUnlockedColors,
  } = useGameProgress();

  // Load constellation from URL on mount
  useEffect(() => {
    const urlConstellation = decodeConstellationFromUrl();
    if (urlConstellation) {
      setStars(urlConstellation);
      addToHistory(urlConstellation);
      // Update star ID counter
      const maxId = Math.max(...urlConstellation.map(s => s.id), 0);
      starIdRef.current = maxId + 1;
    }
  }, []);

  // Load saved constellations
  useEffect(() => {
    const saved = localStorage.getItem('starcomposer_constellations');
    if (saved) {
      try {
        setSavedConstellations(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load constellations:', error);
      }
    }
  }, []);

  // Initialize enhanced audio engine
  useEffect(() => {
    const initAudio = async () => {
      if (typeof window !== 'undefined' && window.Tone) {
        try {
          // Create analyser for visualizations
          const analyser = new window.Tone.Analyser('waveform', 1024);
          analyserRef.current = analyser;

          // Enhanced effects chain
          const reverb = new window.Tone.Reverb({
            decay: 4,
            wet: 0.4
          }).toDestination();

          const delay = new window.Tone.FeedbackDelay({
            delayTime: '8n',
            feedback: 0.3,
            wet: 0.2
          }).connect(reverb);

          const chorus = new window.Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            wet: 0.3
          }).connect(delay);

          // Connect analyser to the effects chain
          chorus.connect(analyser);

          const instruments = {
            synth: new window.Tone.Synth({
              oscillator: { type: 'sine' },
              envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.2 }
            }).connect(chorus),
            amsynth: new window.Tone.AMSynth({
              harmonicity: 2.5,
              oscillator: { type: 'sine' },
              envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 1.0 }
            }).connect(chorus),
            fmsynth: new window.Tone.FMSynth({
              harmonicity: 3,
              modulationIndex: 12,
              oscillator: { type: 'sine' },
              envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 1.0 }
            }).connect(chorus),
            pluck: new window.Tone.PluckSynth({
              attackNoise: 1,
              dampening: 4000,
              resonance: 0.8
            }).connect(chorus),
          };

          await reverb.generate();
          setAudioEngine(instruments);
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to initialize audio:', error);
          setIsLoading(false);
        }
      }
    };

    const checkTone = () => {
      if (window.Tone) {
        initAudio();
      } else {
        setTimeout(checkTone, 100);
      }
    };

    checkTone();
  }, []);

  // History management
  const addToHistory = useCallback((newStars: Star[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newStars]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setStars([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setStars([...history[historyIndex + 1]]);
    }
  };

  // Enhanced canvas setup with visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    const lineCanvas = lineCanvasRef.current;
    const visualizerCanvas = visualizerCanvasRef.current;
    
    if (!canvas || !lineCanvas || !visualizerCanvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      [canvas, lineCanvas, visualizerCanvas].forEach(c => {
        c.width = rect.width * window.devicePixelRatio;
        c.height = rect.height * window.devicePixelRatio;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      });
      
      drawStars();
      drawLines();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [stars]);

  // Visualizer animation
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return;

    const animateVisualizer = () => {
      const canvas = visualizerCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const waveform = analyserRef.current.getValue();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (visualizerIntensity > 0) {
        // Create dynamic background pulse
        const avgAmplitude = waveform.reduce((sum: number, val: number) => sum + Math.abs(val), 0) / waveform.length;
        const pulseIntensity = avgAmplitude * visualizerIntensity * 100;

        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        
        gradient.addColorStop(0, `rgba(100, 255, 218, ${pulseIntensity * 0.1})`);
        gradient.addColorStop(0.5, `rgba(167, 139, 250, ${pulseIntensity * 0.05})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (isPlaying) {
        requestAnimationFrame(animateVisualizer);
      }
    };

    animateVisualizer();
  }, [isPlaying, visualizerIntensity]);

  const drawStars = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((star) => {
      const x = star.x;
      const y = star.y;
      const isPlaying = playingStarsRef.current.has(star.id);
      const isSelected = star.id === selectedStarId;

      // Enhanced glow effect with camera focus
      const cameraDistance = playbackMode === 'journey' && isPlaying ? 
        Math.abs(star.x - cameraPositionRef.current) : 0;
      const focusMultiplier = playbackMode === 'journey' && isPlaying ? 
        Math.max(0.5, 1 - cameraDistance / 200) : 1;

      const glowSize = (isPlaying ? 45 : isSelected ? 30 : 25) * focusMultiplier;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      
      if (isPlaying) {
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(0.2, star.color + 'DD');
        gradient.addColorStop(0.5, star.color + '88');
        gradient.addColorStop(1, 'transparent');
      } else {
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(0.3, star.color + (isSelected ? 'BB' : '90'));
        gradient.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Enhanced star core
      const coreSize = (isPlaying ? 6 : isSelected ? 5 : 4) * focusMultiplier;
      ctx.fillStyle = star.color;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = isPlaying ? 25 : isSelected ? 18 : 12;
      ctx.beginPath();
      ctx.arc(x, y, coreSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Enhanced sparkle effect
      if (isPlaying) {
        const sparkleCount = 8;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * Math.PI * 2 + Date.now() * 0.005;
          const sparkleDistance = 15 * focusMultiplier;
          const sparkleX = x + Math.cos(angle) * sparkleDistance;
          const sparkleY = y + Math.sin(angle) * sparkleDistance;
          
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
    });
  }, [stars, selectedStarId, playbackMode]);

  const drawLines = useCallback(() => {
    const lineCanvas = lineCanvasRef.current;
    if (!lineCanvas || stars.length < 2) return;

    const ctx = lineCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

    // Enhanced constellation lines with flow animation
    for (let i = 0; i < stars.length - 1; i++) {
      const star1 = stars[i];
      const star2 = stars[i + 1];

      const gradient = ctx.createLinearGradient(star1.x, star1.y, star2.x, star2.y);
      gradient.addColorStop(0, star1.color + '90');
      gradient.addColorStop(0.5, '#ffffff60');
      gradient.addColorStop(1, star2.color + '90');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#64ffda';
      ctx.shadowBlur = 12;
      
      // Animated flow effect
      const time = Date.now() * 0.003;
      const flowOffset = (time + i * 0.5) % 20;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = flowOffset;
      
      ctx.beginPath();
      ctx.moveTo(star1.x, star1.y);
      ctx.lineTo(star2.x, star2.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }
  }, [stars]);

  // Animate lines continuously
  useEffect(() => {
    const interval = setInterval(drawLines, 50);
    return () => clearInterval(interval);
  }, [drawLines]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on existing star
    const clickedStar = stars.find(star => {
      const distance = Math.sqrt((star.x - x) ** 2 + (star.y - y) ** 2);
      return distance <= 20;
    });

    if (clickedStar && editMode) {
      setSelectedStarId(selectedStarId === clickedStar.id ? null : clickedStar.id);
      return;
    }

    // Create new star with enhanced effects
    const newStar: Star = {
      x,
      y,
      color: selectedColor,
      instrument: selectedInstrument,
      id: starIdRef.current++,
    };

    const newStars = [...stars, newStar];
    setStars(newStars);
    addToHistory(newStars);
    
    // Track progress
    incrementStarsCreated();
    addInstrumentUsed(selectedInstrument);
    addColorUsed(selectedColor);

    // Enhanced ripple effect
    createRippleEffect(x, y);
  };

  const createRippleEffect = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let radius = 0;
    const maxRadius = 50;
    let opacity = 1;
    
    const animate = () => {
      if (radius < maxRadius) {
        ctx.strokeStyle = selectedColor + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 3;
        ctx.shadowColor = selectedColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        radius += 3;
        opacity = 1 - (radius / maxRadius);
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  const deleteSelectedStar = () => {
    if (selectedStarId !== null) {
      const newStars = stars.filter(star => star.id !== selectedStarId);
      setStars(newStars);
      addToHistory(newStars);
      setSelectedStarId(null);
    }
  };

  const playConstellation = async () => {
    if (!audioEngine || stars.length === 0) return;

    try {
      await window.Tone.start();
      setIsPlaying(true);
      playingStarsRef.current.clear();
      cameraPositionRef.current = 0;

      const sortedStars = [...stars].sort((a, b) => a.x - b.x);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const totalDuration = (60 / bpm) * 4; // 4 beats

      // Set visualizer intensity based on number of stars
      setVisualizerIntensity(Math.min(stars.length / 20, 1));

      sortedStars.forEach((star, index) => {
        const time = (star.x / rect.width) * totalDuration;
        const normalizedY = star.y / rect.height;
        const note = quantizeToScale(normalizedY, musicalKey, musicalScale);

        const instrument = audioEngine[star.instrument] || audioEngine.synth;
        
        window.Tone.Transport.schedule(() => {
          playingStarsRef.current.add(star.id);
          
          // Camera journey mode
          if (playbackMode === 'journey') {
            cameraPositionRef.current = star.x;
          }
          
          instrument.triggerAttackRelease(note, '8n');
          drawStars();
          
          setTimeout(() => {
            playingStarsRef.current.delete(star.id);
            drawStars();
          }, 300);
        }, `+${time}`);
      });

      window.Tone.Transport.bpm.value = bpm;
      window.Tone.Transport.start();
      incrementConstellationsPlayed();

      setTimeout(() => {
        stopPlayback();
      }, totalDuration * 1000 + 1000);
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (window.Tone) {
      window.Tone.Transport.stop();
      window.Tone.Transport.cancel();
    }
    playingStarsRef.current.clear();
    setIsPlaying(false);
    setVisualizerIntensity(0);
    cameraPositionRef.current = 0;
    drawStars();
  };

  const clearCanvas = () => {
    const newStars: Star[] = [];
    setStars(newStars);
    addToHistory(newStars);
    setSelectedStarId(null);
    stopPlayback();
  };

  const saveConstellation = (name: string) => {
    const constellation: SavedConstellation = {
      name,
      stars: [...stars],
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedConstellations.filter(c => c.name !== name), constellation];
    setSavedConstellations(updated);
    localStorage.setItem('starcomposer_constellations', JSON.stringify(updated));
    incrementConstellationsSaved();
  };

  const loadConstellation = (constellation: SavedConstellation) => {
    setStars([...constellation.stars]);
    addToHistory(constellation.stars);
    setSelectedStarId(null);
    // Update star ID counter
    const maxId = Math.max(...constellation.stars.map(s => s.id), 0);
    starIdRef.current = maxId + 1;
  };

  const deleteConstellation = (name: string) => {
    const updated = savedConstellations.filter(c => c.name !== name);
    setSavedConstellations(updated);
    localStorage.setItem('starcomposer_constellations', JSON.stringify(updated));
  };

  const generateShareUrl = () => {
    return encodeConstellationToUrl(stars);
  };

  const unlockedInstruments = getUnlockedInstruments();
  const unlockedColors = getUnlockedColors();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <StarField theme={backgroundTheme} />
        <div className="text-center text-white relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Initializing cosmic audio engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900 relative overflow-hidden">
      <StarField theme={backgroundTheme} intensity={1 + visualizerIntensity} />

      {/* Header */}
      <header className="relative z-10 text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-light text-white mb-2 animate-pulse">
          🌌 StarComposer
        </h1>
        <p className="text-cyan-300 text-lg">
          Sketch constellations to compose starry melodies
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Tooltip content="View achievements and progress">
            <button
              onClick={() => setShowProgress(true)}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Progress
            </button>
          </Tooltip>
          <Tooltip content="Advanced settings and themes">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="relative flex-1 mx-4 mb-4">
        <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-indigo-900/50 backdrop-blur-sm">
          <canvas
            ref={visualizerCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
          />
          <canvas
            ref={lineCanvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ zIndex: 2 }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ zIndex: 3 }}
            onClick={handleCanvasClick}
          />
          
          {/* Mode indicators */}
          <div className="absolute top-4 left-4 space-y-2">
            {editMode && (
              <div className="bg-blue-500/20 backdrop-blur-sm text-blue-300 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                <Edit3 className="w-3 h-3" />
                Edit Mode: Click stars to select
              </div>
            )}
            {playbackMode === 'journey' && (
              <div className="bg-purple-500/20 backdrop-blur-sm text-purple-300 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                <Camera className="w-3 h-3" />
                Journey Mode
              </div>
            )}
          </div>

          {/* Musical info display */}
          <div className="absolute top-4 right-4 bg-slate-800/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center gap-4">
              <span>{musicalKey} {musicalScale}</span>
              <span>{bpm} BPM</span>
              <span>{stars.length} stars</span>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-600/30 shadow-2xl">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            {/* Instrument Selector */}
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-cyan-400" />
              <select
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-cyan-400 focus:outline-none"
              >
                {unlockedInstruments.map(instrument => (
                  <option key={instrument} value={instrument}>
                    {instrument === 'synth' ? 'Synth' :
                     instrument === 'amsynth' ? 'AM Synth' :
                     instrument === 'fmsynth' ? 'FM Synth' : 'Pluck'}
                  </option>
                ))}
                {!unlockedInstruments.includes('amsynth') && (
                  <option disabled>🔒 AM Synth (5 stars)</option>
                )}
                {!unlockedInstruments.includes('fmsynth') && (
                  <option disabled>🔒 FM Synth (15 stars)</option>
                )}
                {!unlockedInstruments.includes('pluck') && (
                  <option disabled>🔒 Pluck (30 stars)</option>
                )}
              </select>
            </div>

            {/* Color Selector */}
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:border-cyan-400 focus:outline-none"
              >
                {unlockedColors.map(color => (
                  <option key={color} value={color}>
                    {color === '#64ffda' ? 'Cyan' :
                     color === '#ff6b9d' ? 'Pink' :
                     color === '#ffd93d' ? 'Yellow' :
                     color === '#6bcf7f' ? 'Green' : 'Purple'}
                  </option>
                ))}
                {!unlockedColors.includes('#ff6b9d') && (
                  <option disabled>🔒 Pink (2 plays)</option>
                )}
                {!unlockedColors.includes('#ffd93d') && (
                  <option disabled>🔒 Yellow (5 plays)</option>
                )}
                {!unlockedColors.includes('#6bcf7f') && (
                  <option disabled>🔒 Green (8 plays)</option>
                )}
                {!unlockedColors.includes('#a78bfa') && (
                  <option disabled>🔒 Purple (12 plays)</option>
                )}
              </select>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <Tooltip content="Toggle edit mode to select and modify stars">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`${editMode ? 'bg-blue-500 hover:bg-blue-400' : 'bg-slate-600 hover:bg-slate-500'} text-white p-2 rounded-lg transition-colors duration-200`}
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </Tooltip>
              
              {selectedStarId && (
                <Tooltip content="Delete selected star">
                  <button
                    onClick={deleteSelectedStar}
                    className="bg-red-500 hover:bg-red-400 text-white p-2 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </Tooltip>
              )}

              <Tooltip content="Undo last action">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Undo className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Redo last undone action">
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Redo className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Save current constellation">
                <button
                  onClick={() => setShowSaveModal(true)}
                  disabled={stars.length === 0}
                  className="bg-green-500 hover:bg-green-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Save className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Load saved constellation">
                <button
                  onClick={() => setShowLoadModal(true)}
                  className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Share constellation via URL">
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={stars.length === 0}
                  className="bg-purple-500 hover:bg-purple-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content="Play constellation as music">
                <button
                  onClick={playConstellation}
                  disabled={isPlaying || stars.length === 0}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Play className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Stop playback">
                <button
                  onClick={stopPlayback}
                  disabled={!isPlaying}
                  className="bg-red-500 hover:bg-red-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Square className="w-5 h-5" />
                </button>
              </Tooltip>
              
              <Tooltip content="Clear all stars">
                <button
                  onClick={clearCanvas}
                  className="bg-slate-600 hover:bg-slate-500 text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <footer className="relative z-10 text-center pb-6 px-4">
        <p className="text-slate-400 text-sm">
          Click to add stars • Press Play to hear your constellation • {progress.starsCreated} stars created
        </p>
      </footer>

      {/* Modals */}
      {showProgress && (
        <ProgressTracker
          achievements={achievements}
          onClose={() => setShowProgress(false)}
        />
      )}

      {showSaveModal && (
        <SaveLoadModal
          mode="save"
          onSave={saveConstellation}
          onLoad={loadConstellation}
          onClose={() => setShowSaveModal(false)}
          savedConstellations={savedConstellations}
          onDelete={deleteConstellation}
        />
      )}

      {showLoadModal && (
        <SaveLoadModal
          mode="load"
          onSave={saveConstellation}
          onLoad={loadConstellation}
          onClose={() => setShowLoadModal(false)}
          savedConstellations={savedConstellations}
          onDelete={deleteConstellation}
        />
      )}

      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          shareUrl={generateShareUrl()}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-600/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-400" />
                Advanced Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Musical Settings */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Musical Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Tempo (BPM)</label>
                    <input
                      type="range"
                      min="60"
                      max="180"
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-cyan-400 text-sm">{bpm} BPM</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Key</label>
                      <select
                        value={musicalKey}
                        onChange={(e) => setMusicalKey(e.target.value as MusicalKey)}
                        className="w-full bg-slate-700 text-white rounded px-2 py-1 text-sm"
                      >
                        {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                          <option key={key} value={key}>{key}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Scale</label>
                      <select
                        value={musicalScale}
                        onChange={(e) => setMusicalScale(e.target.value as MusicalScale)}
                        className="w-full bg-slate-700 text-white rounded px-2 py-1 text-sm"
                      >
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                        <option value="pentatonic">Pentatonic</option>
                        <option value="blues">Blues</option>
                        <option value="chromatic">Chromatic</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Settings */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Visual Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Background Theme</label>
                    <select
                      value={backgroundTheme}
                      onChange={(e) => setBackgroundTheme(e.target.value as BackgroundTheme)}
                      className="w-full bg-slate-700 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value="cosmic">Cosmic</option>
                      <option value="nebula">Nebula</option>
                      <option value="galaxy">Galaxy</option>
                      <option value="aurora">Aurora</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Playback Mode</label>
                    <select
                      value={playbackMode}
                      onChange={(e) => setPlaybackMode(e.target.value as PlaybackMode)}
                      className="w-full bg-slate-700 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value="linear">Linear</option>
                      <option value="journey">Cosmic Journey</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarComposer;