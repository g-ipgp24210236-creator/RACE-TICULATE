import React from 'react';
import { ArrowLeftRight, Volume2, AlertTriangle, Zap, Clock, Play } from 'lucide-react';

interface InstructionModalProps {
  onClose: () => void;
  onStart: () => void;
}

export const InstructionModal: React.FC<InstructionModalProps> = ({
  onClose,
  onStart
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#241a3a] pixel-box-lg max-w-lg w-full text-slate-100 p-4 sm:p-6 my-auto">
        {/* Title */}
        <div className="flex items-center justify-between border-b-4 border-[#100a1c] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏎️</span>
            <div>
              <div className="text-[10px] text-amber-300 font-pixel">HOW TO PLAY</div>
              <h2 className="text-base sm:text-lg font-pixel text-white">ENDLESS RACER GUIDE</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-pixel bg-[#e52521] text-white px-2.5 py-1 pixel-box-sm hover:bg-red-600"
          >
            ✕
          </button>
        </div>

        {/* Short, simple sentences in clear visual cards */}
        <div className="space-y-2.5 mb-5 font-ui text-xs sm:text-sm">
          <div className="bg-[#171126] pixel-box-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-900/60 border border-blue-400 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-slate-200">
              Use <strong>← / → keys</strong> or <strong>tap lanes</strong> to steer your kart.
            </p>
          </div>

          <div className="bg-[#171126] pixel-box-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-900/60 border border-amber-400 flex items-center justify-center shrink-0">
              <span className="font-pixel text-xs text-amber-300">A→B</span>
            </div>
            <p className="text-slate-200">
              Hit letters in spelling order to blend words (like <strong>F → I → N</strong>).
            </p>
          </div>

          <div className="bg-[#171126] pixel-box-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-900/60 border border-emerald-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-200">
              <strong>Yellow blocks</strong> make quick sounds. <strong>Green pipes</strong> stretch the sound!
            </p>
          </div>

          <div className="bg-[#171126] pixel-box-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-950/80 border border-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-slate-200">
              Dodge orange cones. <strong>Each hit costs 1 heart!</strong>
            </p>
          </div>

          <div className="bg-[#171126] pixel-box-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-purple-900/60 border border-purple-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-slate-200">
              Grab <strong>⚡ for Turbo Speed</strong> and <strong>⏱ to Slow Down Time</strong>.
            </p>
          </div>

          <div className="bg-[#171126] pixel-box-sm p-3 flex items-center gap-3 border-2 border-amber-400/40">
            <div className="w-8 h-8 rounded bg-amber-950/60 border border-amber-400 flex items-center justify-center shrink-0 text-base">
              🏁
            </div>
            <p className="text-amber-300 font-medium">
              The trail is endless and gets faster. Keep racing until your hearts run out!
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onStart();
            }}
            className="pixel-btn w-full bg-[#43b047] hover:bg-green-600 text-white py-3.5 text-xs sm:text-sm font-pixel flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START RACING!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
