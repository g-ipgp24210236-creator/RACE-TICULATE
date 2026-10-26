import React from 'react';
import { WordItem } from '../types';
import { Heart, Zap, Clock, Pause, RotateCcw, ArrowLeft, HelpCircle, Flame } from 'lucide-react';
import { IPA_MAP } from '../data/words';

interface GameHUDProps {
  currentWord: WordItem;
  levelNumber: number;
  currentLetter: string;
  currentLetterIndex: number;
  score: number;
  combo: number;
  wordsBlended: number;
  lives: number;
  isBoosted: boolean;
  isSlowed: boolean;
  isNextLevelUnlocked: boolean;
  onPauseToggle: () => void;
  onRestart: () => void;
  onExit: () => void;
  onOpenGuide: () => void;
  statusMessage: string;
  currentSpeed: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentWord,
  levelNumber,
  currentLetter,
  currentLetterIndex,
  score,
  combo,
  wordsBlended,
  lives,
  isBoosted,
  isSlowed,
  isNextLevelUnlocked,
  onPauseToggle,
  onRestart,
  onExit,
  onOpenGuide,
  statusMessage,
  currentSpeed
}) => {
  const letters = currentWord.word.split('');

  return (
    <div className="w-full flex flex-col gap-2.5 font-ui">
      {/* Top Bar Navigation and Control Strip */}
      <div className="bg-[#241a3a] pixel-box p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 text-xs font-pixel flex items-center gap-1.5"
            title="Return to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXIT</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentWord.emoji}</span>
            <div>
              <div className="text-[9px] text-amber-300 font-pixel">
                LEVEL {levelNumber}
              </div>
              <div className="text-base font-pixel text-white flex items-center gap-2">
                <span className="text-[#fbd000]">{currentWord.word}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Powerup & Speed Indicator */}
        <div className="flex items-center gap-2.5">
          {/* Hearts remaining */}
          <div className="flex items-center gap-1 bg-[#171126] pixel-box-sm px-2.5 py-1">
            {[1, 2, 3].map((heartIndex) => (
              <Heart
                key={heartIndex}
                className={`w-4 h-4 transition-transform ${
                  heartIndex <= lives
                    ? 'text-red-500 fill-red-500 scale-100'
                    : 'text-slate-600 fill-slate-700 scale-90 opacity-40'
                }`}
              />
            ))}
          </div>

          {/* Speed Indicator */}
          <div className="flex items-center gap-1.5 bg-[#171126] pixel-box-sm px-2.5 py-1 text-[11px] font-pixel text-slate-300">
            <span className="text-amber-400">SPD:</span>
            <span className="font-mono text-white tabular-nums font-bold">
              {Math.round(currentSpeed)}
            </span>
            {isBoosted && <span className="text-amber-400 font-bold animate-pulse">⚡TURBO</span>}
            {isSlowed && <span className="text-blue-400 font-bold">⏱SLOW</span>}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenGuide}
              className="pixel-btn bg-[#5c94fc] hover:bg-blue-600 text-white p-2 text-xs font-pixel"
              title="How to Play"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* PAUSE BUTTON (OPENS PAUSE MODAL WITH RESUME, SELECT LEVEL, EXIT) */}
            <button
              onClick={onPauseToggle}
              className="pixel-btn bg-[#ffd800] hover:bg-[#ffe340] text-slate-950 px-3 py-1.5 text-xs font-pixel flex items-center gap-1"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>

            <button
              onClick={onRestart}
              className="pixel-btn bg-[#ff7ac8] hover:bg-pink-500 text-white p-2 text-xs font-pixel"
              title="Restart Level"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Word Letters Sequence Tracker */}
      <div className="bg-[#1e1531] pixel-box-sm p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-pixel text-slate-300">SPELLING SEQUENCE:</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {letters.map((char, idx) => {
              const isTarget = idx === currentLetterIndex;
              const isPassed = idx < currentLetterIndex;
              const ipa = IPA_MAP[char] || `/${char.toLowerCase()}/`;

              return (
                <div
                  key={idx}
                  className={`pixel-box-sm px-2.5 py-1 flex items-center gap-1.5 transition-all ${
                    isTarget
                      ? 'bg-[#ffd800] text-slate-950 scale-110 shadow-md ring-2 ring-white font-bold'
                      : isPassed
                      ? 'bg-[#2b6630] text-white opacity-80'
                      : 'bg-[#2e2247] text-slate-300'
                  }`}
                >
                  <span className="font-pixel text-xs font-bold">{char}</span>
                  <span className="text-[10px] font-mono opacity-80">{ipa}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Word Blended Counter & Unlock Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#120c1f] pixel-box-sm px-3 py-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <div className="text-[11px] font-pixel text-white">
              BLENDED: <span className="text-[#ffd800] font-bold">{wordsBlended}x</span>
            </div>
          </div>

          {isNextLevelUnlocked && (
            <div className="bg-[#183d21] border border-[#43b047] px-2 py-1 text-[9px] font-pixel text-[#43b047] animate-pulse">
              NEXT UNLOCKED!
            </div>
          )}
        </div>
      </div>

      {/* Status Feedback Banner */}
      <div className="bg-[#171126] pixel-box-sm px-3 py-2 flex items-center justify-between text-xs text-center">
        <div className="flex items-center gap-4 text-[11px] font-pixel text-slate-300">
          <div>SCORE: <span className="text-white font-bold">{score}</span></div>
          <div>COMBO: <span className="text-amber-400 font-bold">{combo}x</span></div>
        </div>
        <div className="font-pixel text-[10px] text-amber-300 truncate max-w-[280px]">
          {statusMessage}
        </div>
      </div>
    </div>
  );
};
