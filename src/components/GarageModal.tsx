import React from 'react';
import { CharacterItem } from '../types';
import { CHARACTERS } from '../data/words';
import { drawKart, drawHeadSprite } from '../utils/sprites';
import { playCoin } from '../audio';
import { Sparkles, Check, Lock } from 'lucide-react';

interface GarageModalProps {
  chosenCharId: number;
  onSelectChar: (id: number) => void;
  ownedChars: number[];
  onBuyChar: (char: CharacterItem) => void;
  bank: number;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  chosenCharId,
  onSelectChar,
  ownedChars,
  onBuyChar,
  bank,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#241a3a] pixel-box-lg max-w-2xl w-full text-slate-100 p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-4 border-[#100a1c] pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏎️</span>
            <div>
              <div className="text-[10px] text-amber-300 font-pixel">CUSTOMIZE YOUR RACER</div>
              <h2 className="text-base sm:text-xl font-pixel text-white">DRIVER GARAGE</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#171126] pixel-box-sm px-3 py-1.5 font-pixel text-xs text-[#ffd800] flex items-center gap-1.5">
              <span>⭐ COINS:</span>
              <span className="text-white font-bold">{bank}</span>
            </div>
            <button
              onClick={onClose}
              className="pixel-btn bg-[#e52521] text-white px-2.5 py-1.5 text-xs font-pixel"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="bg-[#171126] pixel-box-sm p-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-pixel">
          <div className="text-slate-300">
            EARN <span className="text-[#ffd800]">⭐ COINS</span> BY RACING &amp; BLENDING WORDS!
          </div>
          <div className="text-amber-300">
            {ownedChars.length} OF {CHARACTERS.length} DRIVERS UNLOCKED
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {CHARACTERS.map((char) => {
            const isOwned = ownedChars.includes(char.id);
            const isChosen = chosenCharId === char.id;
            const canAfford = bank >= char.cost;

            return (
              <div
                key={char.id}
                className={`p-3 pixel-box-sm flex flex-col items-center justify-between gap-2.5 text-center transition-all ${
                  isChosen
                    ? 'bg-[#1b3d22] border-[#43b047] ring-2 ring-[#43b047]/60'
                    : isOwned
                    ? 'bg-[#1d162e] border-slate-700'
                    : canAfford
                    ? 'bg-[#291726] border-amber-500/70'
                    : 'bg-[#151021] opacity-80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-pixel text-xs text-white font-bold">{char.name}</span>
                  {isChosen ? (
                    <span className="text-[9px] font-pixel text-[#43b047] flex items-center gap-1 font-bold">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : isOwned ? (
                    <span className="text-[9px] font-pixel text-slate-400">
                      OWNED
                    </span>
                  ) : (
                    <span className="text-[9px] font-pixel text-[#ffd800] bg-black/50 px-1.5 py-0.5 border border-amber-500/40">
                      ⭐ {char.cost}
                    </span>
                  )}
                </div>

                {/* Preview Avatar Box */}
                <div className="w-20 h-20 bg-[#100a1c] pixel-box-sm flex items-center justify-center relative overflow-hidden">
                  <div
                    className="w-12 h-12 rounded-sm border-2 border-black flex items-center justify-center shadow-inner"
                    style={{ backgroundColor: char.carColor }}
                  >
                    <div className="scale-125">
                      {/* Character head render */}
                      <CharacterHeadCanvas sprite={char.headSprite} />
                    </div>
                  </div>
                  {!isOwned && (
                    <div className="absolute top-1 right-1 bg-black/70 p-1 rounded-xs">
                      <Lock className="w-3 h-3 text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="w-full">
                  {isChosen ? (
                    <button
                      disabled
                      className="pixel-btn w-full bg-[#43b047] text-white py-2 text-[10px] font-pixel opacity-90 cursor-default"
                    >
                      EQUIPPED
                    </button>
                  ) : isOwned ? (
                    <button
                      onClick={() => {
                        onSelectChar(char.id);
                        playCoin();
                      }}
                      className="pixel-btn w-full bg-[#ffd800] hover:bg-[#ffe340] text-slate-950 py-2 text-[10px] font-pixel font-bold"
                    >
                      SELECT DRIVER
                    </button>
                  ) : canAfford ? (
                    <button
                      onClick={() => onBuyChar(char)}
                      className="pixel-btn w-full bg-[#e52521] hover:bg-[#ff3b37] text-white py-2 text-[10px] font-pixel flex items-center justify-center gap-1 shadow-md animate-pulse font-bold"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>BUY (⭐{char.cost})</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="pixel-btn w-full bg-slate-800 text-slate-400 py-2 text-[9px] font-pixel opacity-60 cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>NEED {char.cost - bank} MORE ⭐</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="pixel-btn bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 text-xs font-pixel"
          >
            CLOSE GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};

const CharacterHeadCanvas: React.FC<{ sprite: string[] }> = ({ sprite }) => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawHeadSprite(ctx, sprite, 0, 0, 2);
  }, [sprite]);

  return <canvas ref={ref} width={16} height={16} className="w-8 h-8 block" />;
};
