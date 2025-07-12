import React, { useState } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';

interface SavedConstellation {
  name: string;
  stars: any[];
  createdAt: string;
}

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  onSave: (name: string) => void;
  onLoad: (constellation: SavedConstellation) => void;
  onClose: () => void;
  savedConstellations: SavedConstellation[];
  onDelete: (name: string) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  mode,
  onSave,
  onLoad,
  onClose,
  savedConstellations,
  onDelete
}) => {
  const [constellationName, setConstellationName] = useState('');

  const handleSave = () => {
    if (constellationName.trim()) {
      onSave(constellationName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-600/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            {mode === 'save' ? (
              <>
                <Save className="w-6 h-6 text-cyan-400" />
                Save Constellation
              </>
            ) : (
              <>
                <FolderOpen className="w-6 h-6 text-cyan-400" />
                Load Constellation
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {mode === 'save' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={constellationName}
              onChange={(e) => setConstellationName(e.target.value)}
              placeholder="Enter constellation name..."
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:border-cyan-400 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!constellationName.trim()}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors duration-200 font-medium"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {savedConstellations.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No saved constellations yet.</p>
            ) : (
              savedConstellations.map((constellation) => (
                <div
                  key={constellation.name}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-cyan-400/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{constellation.name}</h3>
                    <p className="text-slate-400 text-sm">
                      {constellation.stars.length} stars • {new Date(constellation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onLoad(constellation);
                        onClose();
                      }}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDelete(constellation.name)}
                      className="bg-red-500 hover:bg-red-400 text-white p-1 rounded text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};