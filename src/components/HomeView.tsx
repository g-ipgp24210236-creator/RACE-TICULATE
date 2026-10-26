import React, { useEffect, useRef, useState } from 'react';
import { CharacterItem, WordItem } from '../types';
import { CHARACTERS, WORDS } from '../data/words';
import { drawKart, drawStandingCharacter } from '../utils/sprites';
import { playRevEngine, playCoin } from '../audio';
import { Volume2, VolumeX, BookOpen, Play, Flag, Sparkles, Lock, Check } from 'lucide-react';

interface HomeViewProps {
  chosenCharId: number;
  onSelectChar: (id: number) => void;
  ownedChars: number[];
  onBuyChar: (char: CharacterItem) => void;
  bank: number;
  selectedLevelIdx: number;
  unlockedLevelIdx: number;
  onOpenLevels: () => void;
  onOpenGarage: () => void;
  onOpenGuide: () => void;
  onStartPlay: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  chosenCharId,
  onSelectChar,
  ownedChars,
  onBuyChar,
  bank,
  selectedLevelIdx,
  unlockedLevelIdx,
  onOpenLevels,
  onOpenGarage,
  onOpenGuide,
  onStartPlay,
  musicMuted,
  onToggleMusic
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animState, setAnimState] = useState<'idle' | 'jumping' | 'driving'>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const animStateRef = useRef<'idle' | 'jumping' | 'driving'>('idle');
  animStateRef.current = animState;

  const currentWord = WORDS[selectedLevelIdx] || WORDS[0];
  const chosenChar = CHARACTERS.find((c) => c.id === chosenCharId) || CHARACTERS[0];

  const animRef = useRef({
    t: 0,
    driverInKart: false,
    kartX: 190,
    kartY: 155,
    charX: 110,
    charY: 175,
    speed: 0,
    exhaust: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[]
  });

  const handlePlayClicked = () => {
    if (animStateRef.current !== 'idle') return;

    setAnimState('jumping');
    playCoin();

    // Step 1: Hop character into car over 550ms
    const jumpDuration = 550;
    const startTime = performance.now();
    const startCharX = animRef.current.charX;
    const startCharY = animRef.current.charY;
    const targetKartX = animRef.current.kartX;
    const targetKartY = animRef.current.kartY;

    const hopInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(1, elapsed / jumpDuration);
      animRef.current.charX = startCharX + (targetKartX - startCharX) * p;
      const arc = Math.sin(p * Math.PI) * 45;
      animRef.current.charY = startCharY + (targetKartY - startCharY) * p - arc;

      if (p >= 1) {
        clearInterval(hopInterval);
        animRef.current.driverInKart = true;
        setAnimState('driving');
        playRevEngine(1.2);
        animRef.current.exhaust = true;

        let driveSpeed = 2;
        const driveTimer = setInterval(() => {
          driveSpeed = driveSpeed * 1.08 + 2.2;
          animRef.current.kartX += driveSpeed;
          animRef.current.kartY -= driveSpeed * 0.25;

          for (let i = 0; i < 3; i++) {
            animRef.current.particles.push({
              x: animRef.current.kartX - 25,
              y: animRef.current.kartY + 12 + (Math.random() - 0.5) * 8,
              vx: -Math.random() * 3 - 2,
              vy: (Math.random() - 0.5) * 2,
              r: Math.random() * 6 + 4,
              alpha: 0.9,
              color: Math.random() > 0.4 ? '#888899' : '#ff7700'
            });
          }

          if (animRef.current.kartX > 480) {
            clearInterval(driveTimer);
            onStartPlay();
          }
        }, 16);
      }
    }, 16);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let localT = 0;

    const render = () => {
      localT += 0.035;
      animRef.current.t = localT;

      const W = canvas.width;
      const H = canvas.height;

      ctx.fillStyle = '#221e33';
      ctx.fillRect(0, 0, W, H);

      const curbSize = 16;
      for (let x = 0; x < W; x += curbSize * 2) {
        ctx.fillStyle = '#e52521';
        ctx.fillRect(x, 0, curbSize, 14);
        ctx.fillRect(x + curbSize, 0, curbSize, 14);
        ctx.fillRect(x, H - 14, curbSize, 14);
        ctx.fillRect(x + curbSize, H - 14, curbSize, 14);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + curbSize, 0, curbSize, 14);
        ctx.fillRect(x, H - 14, curbSize, 14);
      }

      ctx.strokeStyle = '#37324f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.lineTo(W, 70);
      ctx.moveTo(0, 210);
      ctx.lineTo(W, 210);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(130, 85, 120, 110);
      ctx.strokeStyle = '#fbd000';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(130, 85, 120, 110);
      ctx.setLineDash([]);

      ctx.fillStyle = '#100a1c';
      ctx.fillRect(18, 24, 98, 28);
      ctx.fillStyle = '#fbd000';
      ctx.font = "bold 9px 'Press Start 2P', monospace";
      ctx.fillText(`LVL ${selectedLevelIdx + 1}`, 28, 42);

      const pList = animRef.current.particles;
      for (let i = pList.length - 1; i >= 0; i--) {
        const p = pList[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        p.r += 0.3;
        if (p.alpha <= 0) {
          pList.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Kart with no driver initially
      const { kartX, kartY, driverInKart, exhaust } = animRef.current;
      drawKart(ctx, kartX, kartY, chosenChar, 3.4, {
        hasDriver: driverInKart,
        showExhaust: exhaust,
        boostFlame: animStateRef.current === 'driving'
      });

      // Standing character beside kart
      if (!driverInKart) {
        const bob = Math.sin(localT * 5) * 3;
        drawStandingCharacter(ctx, chosenChar, animRef.current.charX, animRef.current.charY, 3.2, bob);
      }

      if (animStateRef.current === 'idle') {
        const bubbleX = 110;
        const bubbleY = 85 + Math.sin(localT * 3) * 2;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#100a1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bubbleX - 45, bubbleY - 14, 90, 26, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#100a1c';
        ctx.font = "bold 8px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('READY!', bubbleX, bubbleY + 3);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [chosenChar, selectedLevelIdx]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-5">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#241a3a] pixel-box p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e52521] pixel-box-sm flex items-center justify-center text-xl">
            🏎️
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-pixel text-white tracking-wider flex items-center gap-2">
              ARTICULAT<span className="text-[#fbd000]">-RACER</span>
            </h1>
            <p className="text-xs text-slate-300 font-ui font-medium">
              Endless Word Phonics Speedway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenGarage}
            className="pixel-btn bg-[#ffd800] text-slate-900 px-3 py-2 text-xs font-pixel flex items-center gap-2"
          >
            <span>🛒 GARAGE</span>
            <span className="bg-[#100a1c] text-[#ffd800] px-1.5 py-0.5 text-[10px]">
              ⭐ {bank}
            </span>
          </button>

          <button
            onClick={onOpenGuide}
            className="pixel-btn bg-[#5c94fc] text-white px-3 py-2 text-xs font-pixel flex items-center gap-1.5"
            title="Read instructions"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>GUIDE</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`pixel-btn px-3 py-2 text-xs font-pixel flex items-center gap-1.5 ${
              musicMuted ? 'bg-slate-700 text-slate-300' : 'bg-[#43b047] text-white'
            }`}
          >
            {musicMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{musicMuted ? 'OFF' : 'ON'}</span>
          </button>
        </div>
      </header>

      {/* Main Home Stage */}
      <div className="bg-[#241a3a] pixel-box-lg p-5 flex flex-col items-center">
        {/* Selected Course Banner with SELECT LEVEL button */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#171126] pixel-box-sm px-4 py-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentWord.emoji}</span>
            <div>
              <div className="text-[10px] text-amber-300 font-pixel">
                LEVEL {selectedLevelIdx + 1} OF {WORDS.length}
              </div>
              <div className="text-lg font-pixel text-white flex items-center gap-2">
                TARGET WORD: <span className="text-[#fbd000]">{currentWord.word}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenLevels}
            className="pixel-btn bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-2 text-xs font-pixel flex items-center gap-1.5"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>SELECT LEVEL</span>
          </button>
        </div>

        {/* Canvas Displaying Selected Car with No Driver and Character beside it */}
        <div className="relative pixel-box-lg overflow-hidden bg-[#221e33] w-full max-w-[540px] aspect-[16/10]">
          <canvas
            ref={canvasRef}
            width={380}
            height={240}
            className="w-full h-full block"
          />

          <div className="absolute top-3 left-3 bg-[#100a1c]/85 text-amber-300 text-[10px] font-pixel px-2.5 py-1.5 border border-amber-400/50">
            {animState === 'idle'
              ? '🚗 EMPTY KART READY'
              : animState === 'jumping'
              ? '⚡ HOPPING INTO DRIVER SEAT!'
              : '🔥 ACCELERATING TO TRACK!'}
          </div>

          <div className="absolute bottom-3 right-3 bg-[#100a1c]/85 text-white text-[10px] font-pixel px-2.5 py-1.5 border border-slate-700">
            DRIVER: <span className="text-[#fbd000]">{chosenChar.name}</span>
          </div>
        </div>

        {/* Action Buttons: PLAY and SELECT LEVEL */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={handlePlayClicked}
            disabled={animState !== 'idle'}
            className="pixel-btn bg-[#e52521] hover:bg-[#ff3b37] disabled:opacity-50 text-white text-base sm:text-lg px-8 py-4 flex items-center justify-center gap-3 flex-1 shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY</span>
          </button>

          <button
            onClick={onOpenLevels}
            disabled={animState !== 'idle'}
            className="pixel-btn bg-[#ffd800] hover:bg-[#ffe340] text-slate-950 text-sm sm:text-base px-6 py-4 flex items-center justify-center gap-2 flex-1"
          >
            <Flag className="w-4 h-4" />
            <span>SELECT LEVEL</span>
          </button>
        </div>

        {/* Driver Quick Selector & Currency Shop Bar */}
        <div className="mt-6 w-full max-w-lg bg-[#1a132b] pixel-box-sm p-3">
          <div className="text-[10px] font-pixel text-slate-300 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-white">
              <span>🏎️ DRIVER ROSTER</span>
              <span className="text-[9px] text-amber-300">({ownedChars.length}/{CHARACTERS.length} OWNED)</span>
            </span>
            <button
              onClick={onOpenGarage}
              className="text-amber-400 hover:text-amber-300 underline text-[10px] font-pixel flex items-center gap-1"
            >
              <span>OPEN GARAGE</span>
              <span className="bg-[#ffd800] text-black px-1 rounded-xs font-bold">⭐ {bank}</span>
            </button>
          </div>

          {toastMsg && (
            <div className="mb-2 p-1.5 bg-[#100a1c] border border-amber-400/60 text-center font-pixel text-[10px] text-amber-300 animate-pulse">
              {toastMsg}
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {CHARACTERS.map((char) => {
              const isOwned = ownedChars.includes(char.id);
              const isSelected = chosenCharId === char.id;
              const canAfford = bank >= char.cost;

              const handleClick = () => {
                if (animState !== 'idle') return;
                if (isOwned) {
                  onSelectChar(char.id);
                  playCoin();
                  setToastMsg(`Driver equipped: ${char.name}!`);
                  setTimeout(() => setToastMsg(null), 2200);
                } else if (canAfford) {
                  onBuyChar(char);
                  setToastMsg(`🎉 UNLOCKED ${char.name} for ${char.cost} ⭐! Equipped!`);
                  setTimeout(() => setToastMsg(null), 3000);
                } else {
                  setToastMsg(`🔒 Need ${char.cost - bank} more ⭐ coins for ${char.name}!`);
                  setTimeout(() => setToastMsg(null), 2500);
                  onOpenGarage();
                }
              };

              return (
                <button
                  key={char.id}
                  disabled={animState !== 'idle'}
                  onClick={handleClick}
                  title={
                    isSelected
                      ? `${char.name} (Equipped)`
                      : isOwned
                      ? `Select ${char.name}`
                      : canAfford
                      ? `Unlock ${char.name} for ${char.cost} coins!`
                      : `Requires ${char.cost} coins (Need ${char.cost - bank} more)`
                  }
                  className={`p-1.5 pixel-box-sm flex flex-col items-center justify-between gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#1b3d22] border-[#43b047] ring-1 ring-[#43b047] scale-105'
                      : isOwned
                      ? 'bg-[#291f42] text-slate-200 hover:bg-[#342754]'
                      : canAfford
                      ? 'bg-[#3b1c1c] hover:bg-[#522525] border-amber-500/80 animate-pulse cursor-pointer'
                      : 'bg-slate-800/60 text-slate-400 opacity-65 hover:opacity-90'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-sm border border-black flex items-center justify-center relative shadow-sm"
                    style={{ backgroundColor: char.carColor }}
                  >
                    {!isOwned && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-white/90" />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-pixel truncate max-w-full">
                    {char.name}
                  </span>
                  {isSelected ? (
                    <span className="text-[7px] text-[#43b047] font-pixel font-bold">
                      USED
                    </span>
                  ) : isOwned ? (
                    <span className="text-[7px] text-slate-300 font-pixel">
                      OWNED
                    </span>
                  ) : canAfford ? (
                    <span className="text-[7px] text-amber-300 font-pixel font-bold">
                      BUY ⭐{char.cost}
                    </span>
                  ) : (
                    <span className="text-[7px] text-slate-400 font-pixel">
                      ⭐{char.cost}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
