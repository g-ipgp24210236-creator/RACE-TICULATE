import React from 'react';
import { WORDS } from '../data/words';
import { Lock, ArrowLeft, Trophy } from 'lucide-react';

interface LevelSelectModalProps {
  unlockedLevelIndex: number;
  selectedLevelIndex: number;
  levelHighScores: Record<string, number>;
  onSelectLevel: (index: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  unlockedLevelIndex,
  selectedLevelIndex,
  levelHighScores,
  onSelectLevel,
  onClose
}) => {
  // Target words organized in the exact 5 families:
  // FAN · FAT · FIN
  // HAT · HEN · HIT
  // MAP · MAT · MAN 
  // NAP · NET 
  // PAN · PAT · PEN · PET
  const families = [
    { title: '/f/ WORDS', indices: [0, 1, 2] },
    { title: '/h/ WORDS', indices: [3, 4, 5] },
    { title: '/m/ WORDS', indices: [6, 7, 8] },
    { title: '/n/ WORDS', indices: [9, 10] },
    { title: '/p/ WORDS', indices: [11, 12, 13, 14] }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#241a3a] pixel-box-lg max-w-2xl w-full text-slate-100 p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-4 border-[#100a1c] pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏁</span>
            <div>
              <div className="text-[10px] text-amber-300 font-pixel">SELECT WORD COURSE</div>
              <h2 className="text-base sm:text-lg font-pixel text-white">LEVEL SELECT (1 - 15)</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pixel-btn bg-[#e52521] text-white px-2.5 py-1 text-xs font-pixel hover:bg-red-600"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-300 font-ui mb-3.5">
          Each level is an endless racer for <strong>one word</strong>. Blend the word at least <strong>3 times</strong> to unlock the next level!
        </p>

        {/* Word Families Grouped */}
        <div className="space-y-3.5 mb-5 font-ui">
          {families.map((fam) => (
            <div key={fam.title} className="bg-[#191226] pixel-box-sm p-3">
              <div className="text-[10px] font-pixel text-amber-400 mb-2 flex items-center justify-between">
                <span>{fam.title}</span>
                <span className="text-slate-400 font-ui text-[11px]">
                  {fam.indices.filter((i) => i <= unlockedLevelIndex).length}/{fam.indices.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {fam.indices.map((idx) => {
                  const item = WORDS[idx];
                  if (!item) return null;

                  const isUnlocked = idx <= unlockedLevelIndex;
                  const isSelected = idx === selectedLevelIndex;
                  const best = levelHighScores[item.word] || 0;

                  return (
                    <button
                      key={item.word}
                      disabled={!isUnlocked}
                      onClick={() => {
                        onSelectLevel(idx);
                        onClose();
                      }}
                      className={`pixel-btn p-2.5 flex flex-col items-center justify-between min-h-[95px] transition-all text-left relative ${
                        isSelected && isUnlocked
                          ? 'bg-[#ffd800] text-slate-950 font-bold border-white scale-105 shadow-md'
                          : isUnlocked
                          ? 'bg-[#2b1f47] text-slate-100 hover:bg-[#39295e]'
                          : 'bg-[#140e21] text-slate-600 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[9px] font-pixel opacity-80">
                          LVL {idx + 1}
                        </span>
                        {!isUnlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <span className="text-base">{item.emoji}</span>
                        )}
                      </div>

                      <div className="my-0.5 text-center">
                        <span className="text-sm font-pixel font-bold tracking-wider">
                          {item.word}
                        </span>
                      </div>

                      <div className="w-full text-center">
                        {isUnlocked ? (
                          <span className="text-[8px] font-pixel text-amber-300">
                            {best > 0 ? `BEST: ${best}` : 'UNLOCKED'}
                          </span>
                        ) : (
                          <span className="text-[8px] font-pixel text-slate-600">
                            LOCKED
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 text-xs font-pixel flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
