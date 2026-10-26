import React from 'react';
import { Play, Flag, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  word: string;
  emoji: string;
  levelNumber: number;
  onResume: () => void;
  onSelectLevel: () => void;
  onExitHome: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  word,
  emoji,
  levelNumber,
  onResume,
  onSelectLevel,
  onExitHome,
  musicMuted,
  onToggleMusic
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#241a3a] pixel-box-lg max-w-sm w-full text-slate-100 p-6 text-center animate-in fade-in duration-150">
        <div className="text-[10px] text-amber-300 font-pixel mb-1">GAME PAUSED</div>
        <h2 className="text-xl font-pixel text-white mb-2">
          LEVEL {levelNumber}: <span className="text-[#fbd000]">{word}</span> {emoji}
        </h2>

        <div className="my-5 flex flex-col gap-3 font-pixel text-xs">
          {/* 1. RESUME */}
          <button
            onClick={onResume}
            className="pixel-btn bg-[#43b047] hover:bg-green-600 text-white py-3.5 px-4 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>

          {/* 2. SELECT LEVEL */}
          <button
            onClick={onSelectLevel}
            className="pixel-btn bg-[#ffd800] hover:bg-[#ffe340] text-slate-950 py-3.5 px-4 flex items-center justify-center gap-2"
          >
            <Flag className="w-4 h-4" />
            <span>SELECT LEVEL</span>
          </button>

          {/* 3. EXIT (BRING TO HOME PAGE) */}
          <button
            onClick={onExitHome}
            className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white py-3.5 px-4 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>EXIT TO HOME</span>
          </button>
        </div>

        {/* Music toggle */}
        <div className="pt-2 border-t border-slate-700/80 flex items-center justify-center">
          <button
            onClick={onToggleMusic}
            className="text-[10px] font-pixel text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            {musicMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>MUSIC: {musicMuted ? 'MUTED' : 'ON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
