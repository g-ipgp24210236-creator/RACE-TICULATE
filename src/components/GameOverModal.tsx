import React, { useState } from 'react';
import { RotateCcw, Home, Flag, Sparkles, Volume2, Mic, Check } from 'lucide-react';
import { speakWord } from '../audio';
import { WordItem } from '../types';

interface GameOverModalProps {
  wordItem: WordItem;
  levelNumber: number;
  score: number;
  wordsBlended: number;
  bestCombo: number;
  unlockedNext: boolean;
  coinsEarned: number;
  onRetry: () => void;
  onSelectLevel: () => void;
  onHome: () => void;
  onAddCoins: (coins: number) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  wordItem,
  levelNumber,
  score,
  wordsBlended,
  bestCombo,
  unlockedNext,
  coinsEarned,
  onRetry,
  onSelectLevel,
  onHome,
  onAddCoins
}) => {
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [feedback, setFeedback] = useState(`Say "${wordItem.word}" for +50 ⭐ bonus coins!`);
  const [isListening, setIsListening] = useState(false);

  const handleHearWord = () => {
    speakWord(wordItem.word);
  };

  const handleSpeechPractice = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      if (!bonusAwarded) {
        setBonusAwarded(true);
        onAddCoins(50);
        setFeedback('Great pronunciation! +50 ⭐ bonus awarded!');
      }
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      setIsListening(true);
      setFeedback(`Listening... Say "${wordItem.word}"!`);

      recognition.onresult = (e: any) => {
        setIsListening(false);
        const transcript = e.results[0][0].transcript.toUpperCase().trim();
        if (!bonusAwarded) {
          setBonusAwarded(true);
          onAddCoins(50);
          setFeedback(`Heard "${transcript}"! +50 ⭐ bonus coins added!`);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        if (!bonusAwarded) {
          setBonusAwarded(true);
          onAddCoins(50);
          setFeedback('Nice try! +50 ⭐ bonus coins added!');
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
      if (!bonusAwarded) {
        setBonusAwarded(true);
        onAddCoins(50);
        setFeedback('+50 ⭐ bonus coins added!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#241a3a] pixel-box-lg max-w-lg w-full text-slate-100 p-5 sm:p-6 my-auto text-center">
        <div className="text-[10px] text-red-400 font-pixel mb-1 animate-pulse">
          💔 NO HEARTS REMAINING
        </div>
        <h2 className="text-xl sm:text-2xl font-pixel text-[#e52521] drop-shadow-[2px_2px_0_#100a1c] mb-1">
          GAME OVER
        </h2>
        <div className="text-sm font-pixel text-amber-300 mb-4">
          LEVEL {levelNumber}: {wordItem.word} {wordItem.emoji}
        </div>

        {/* Level Unlock Announcement */}
        {unlockedNext && (
          <div className="bg-[#1b4224] border-2 border-[#43b047] pixel-box-sm p-2.5 mb-4 text-xs font-pixel text-[#8aff8a] animate-pulse">
            🎉 NEW LEVEL UNLOCKED!
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-[#171126] pixel-box-sm p-3 mb-4 font-ui">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-pixel text-slate-400">TIMES BLENDED</span>
            <span className="text-xl font-pixel text-[#ffd800] mt-1">{wordsBlended}x</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-700">
            <span className="text-[9px] font-pixel text-slate-400">SCORE</span>
            <span className="text-xl font-pixel text-white mt-1">{score}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-pixel text-slate-400">BEST COMBO</span>
            <span className="text-xl font-pixel text-emerald-400 mt-1">{bestCombo}x</span>
          </div>
        </div>

        {/* Coins earned */}
        <div className="bg-[#1b142c] pixel-box-sm p-2 mb-4 flex items-center justify-center gap-2 text-xs font-pixel text-[#ffd800]">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>EARNED ⭐ +{coinsEarned} COINS!</span>
        </div>

        {/* Audio practice */}
        <div className="bg-[#1c152d] pixel-box-sm p-3 mb-5">
          <div className="text-[10px] font-pixel text-amber-300 mb-2">{feedback}</div>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleHearWord}
              className="pixel-btn bg-[#2b1f47] hover:bg-[#3d2c63] text-white px-3 py-1.5 text-xs font-pixel flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>HEAR</span>
            </button>

            <button
              onClick={handleSpeechPractice}
              disabled={bonusAwarded || isListening}
              className={`pixel-btn px-4 py-1.5 text-xs font-pixel text-white flex items-center gap-1.5 ${
                bonusAwarded
                  ? 'bg-slate-700 opacity-60'
                  : isListening
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-[#5c94fc] hover:bg-blue-600'
              }`}
            >
              {bonusAwarded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>CLAIMED</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>{isListening ? '...' : '🎙️ SAY (+50 ⭐)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons: PLAY AGAIN, SELECT LEVEL, HOME */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={onRetry}
            className="pixel-btn bg-[#43b047] hover:bg-green-600 text-white px-4 py-3 text-xs font-pixel flex items-center justify-center gap-2 flex-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onSelectLevel}
            className="pixel-btn bg-[#ffd800] hover:bg-[#ffe340] text-slate-950 px-4 py-3 text-xs font-pixel flex items-center justify-center gap-2 flex-1"
          >
            <Flag className="w-4 h-4" />
            <span>SELECT LEVEL</span>
          </button>

          <button
            onClick={onHome}
            className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 text-xs font-pixel flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
