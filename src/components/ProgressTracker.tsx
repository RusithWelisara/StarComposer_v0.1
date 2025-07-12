import React from 'react';
import { Trophy, Star, Music, Palette } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface ProgressTrackerProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ achievements, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-600/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Achievements
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all duration-300 ${
                achievement.unlocked
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50'
                  : 'bg-slate-700/50 border-slate-600/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked ? 'bg-cyan-500/20' : 'bg-slate-600/50'
                }`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    achievement.unlocked ? 'text-white' : 'text-slate-400'
                  }`}>
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-slate-400">{achievement.description}</p>
                </div>
                {achievement.unlocked && (
                  <div className="text-cyan-400 text-sm font-medium">✓</div>
                )}
              </div>
              
              <div className="w-full bg-slate-600/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-400'
                      : 'bg-slate-500'
                  }`}
                  style={{
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                  }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {achievement.progress}/{achievement.maxProgress}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};