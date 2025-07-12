import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  onClose: () => void;
  shareUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-slate-600/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-cyan-400" />
            Share Constellation
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Share this unique URL to let others experience your cosmic creation:
          </p>
          
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
            <div className="text-cyan-300 text-sm font-mono break-all">
              {shareUrl}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
            
            <button
              onClick={openInNewTab}
              className="bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 text-center">
            Anyone with this link can view and play your constellation
          </div>
        </div>
      </div>
    </div>
  );
};