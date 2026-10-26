/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CharacterItem, WordItem } from './types';
import { WORDS, CHARACTERS } from './data/words';
import { HomeView } from './components/HomeView';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { InstructionModal } from './components/InstructionModal';
import { GarageModal } from './components/GarageModal';
import { GameOverModal } from './components/GameOverModal';
import { startMusic, stopMusic, setMusicMuted, playCoin, playVictoryFanfare } from './audio';

export default function App() {
  const getStored = <T,>(key: string, defaultVal: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const setStored = <T,>(key: string, val: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // ignore
    }
  };

  // State
  const [view, setView] = useState<'home' | 'game'>('home');
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(0);
  const [unlockedLevelIdx, setUnlockedLevelIdx] = useState<number>(() =>
    getStored('ar-unlocked-level', 0)
  );
  const [chosenCharId, setChosenCharId] = useState<number>(() => getStored('ar-char', 0));
  const [ownedChars, setOwnedChars] = useState<number[]>(() => getStored('ar-own', [0]));
  const [bank, setBank] = useState<number>(() => getStored('ar-bank', 100));
  const [levelHighScores, setLevelHighScores] = useState<Record<string, number>>(() =>
    getStored('ar-level-scores', {})
  );

  // Modals
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showGarageModal, setShowGarageModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [hasShownGuideOnce, setHasShownGuideOnce] = useState(() =>
    getStored('ar-guide-shown', false)
  );

  // Gameplay
  const [isPaused, setIsPaused] = useState(false);
  const [musicMuted, setMusicMutedState] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const currentWord = WORDS[selectedLevelIdx] || WORDS[0];
  const chosenChar = CHARACTERS.find((c) => c.id === chosenCharId) || CHARACTERS[0];

  const [hudStats, setHudStats] = useState({
    currentLetter: currentWord.word[0],
    currentLetterIndex: 0,
    score: 0,
    combo: 0,
    wordsBlended: 0,
    lives: 3,
    isBoosted: false,
    isSlowed: false,
    statusMessage: `Level 1: Blend ${currentWord.word}!`,
    currentSpeed: 68,
    isNextLevelUnlocked: false
  });

  const [gameOverStats, setGameOverStats] = useState({
    score: 0,
    wordsBlended: 0,
    bestCombo: 0,
    unlockedNext: false,
    coinsEarned: 0
  });

  useEffect(() => {
    setStored('ar-char', chosenCharId);
  }, [chosenCharId]);

  useEffect(() => {
    setStored('ar-own', ownedChars);
  }, [ownedChars]);

  useEffect(() => {
    setStored('ar-bank', bank);
  }, [bank]);

  useEffect(() => {
    setStored('ar-unlocked-level', unlockedLevelIdx);
  }, [unlockedLevelIdx]);

  useEffect(() => {
    setStored('ar-level-scores', levelHighScores);
  }, [levelHighScores]);

  const toggleMusic = () => {
    const nextMuted = !musicMuted;
    setMusicMutedState(nextMuted);
    setMusicMuted(nextMuted);
  };

  const handleStartPlay = () => {
    if (!hasShownGuideOnce) {
      setShowGuideModal(true);
      setHasShownGuideOnce(true);
      setStored('ar-guide-shown', true);
    } else {
      launchLevelRun(selectedLevelIdx);
    }
  };

  const launchLevelRun = (levelIdx: number) => {
    setSelectedLevelIdx(levelIdx);
    setView('game');
    setIsPaused(false);
    setShowPauseModal(false);
    setShowGameOverModal(false);
    setShowLevelModal(false);
    setRunKey((k) => k + 1);
    startMusic();
  };

  const handlePause = () => {
    setIsPaused(true);
    setShowPauseModal(true);
  };

  const handleResume = () => {
    setShowPauseModal(false);
    setIsPaused(false);
  };

  const handleExitHome = () => {
    if (view === 'game' && hudStats.score > 0) {
      const exitCoins = Math.floor(hudStats.score + hudStats.wordsBlended * 50);
      setBank((b) => b + exitCoins);
    }
    setShowPauseModal(false);
    setShowGameOverModal(false);
    setIsPaused(false);
    stopMusic();
    setView('home');
  };

  const handleGameOver = (results: {
    score: number;
    wordsBlended: number;
    bestCombo: number;
    unlockedNext: boolean;
  }) => {
    stopMusic();
    const coins = results.score + results.wordsBlended * 50;

    // Check if next level is unlocked
    let nextUnlocked = results.unlockedNext;
    if (results.unlockedNext && selectedLevelIdx + 1 > unlockedLevelIdx) {
      const newMax = Math.min(WORDS.length - 1, selectedLevelIdx + 1);
      setUnlockedLevelIdx(newMax);
    }

    // Save high score for this level word
    const prevBest = levelHighScores[currentWord.word] || 0;
    if (results.score > prevBest) {
      setLevelHighScores((prev) => ({
        ...prev,
        [currentWord.word]: results.score
      }));
    }

    setGameOverStats({
      ...results,
      unlockedNext: nextUnlocked,
      coinsEarned: coins
    });

    setBank((b) => b + coins);
    setShowGameOverModal(true);
  };

  const handleBuyChar = (char: CharacterItem) => {
    if (bank >= char.cost && !ownedChars.includes(char.id)) {
      const nextBank = bank - char.cost;
      const nextOwned = [...ownedChars, char.id];
      setBank(nextBank);
      setOwnedChars(nextOwned);
      setChosenCharId(char.id);
      playVictoryFanfare();
    }
  };

  return (
    <div className="min-h-screen bg-[#181224] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      <main className="w-full flex-1 py-4 sm:py-6">
        {view === 'home' && (
          <HomeView
            chosenCharId={chosenCharId}
            onSelectChar={setChosenCharId}
            ownedChars={ownedChars}
            onBuyChar={handleBuyChar}
            bank={bank}
            selectedLevelIdx={selectedLevelIdx}
            unlockedLevelIdx={unlockedLevelIdx}
            onOpenLevels={() => setShowLevelModal(true)}
            onOpenGarage={() => setShowGarageModal(true)}
            onOpenGuide={() => setShowGuideModal(true)}
            onStartPlay={handleStartPlay}
            musicMuted={musicMuted}
            onToggleMusic={toggleMusic}
          />
        )}

        {view === 'game' && (
          <div className="max-w-4xl mx-auto p-3 sm:p-4 flex flex-col gap-3">
            <GameHUD
              currentWord={currentWord}
              levelNumber={selectedLevelIdx + 1}
              currentLetter={hudStats.currentLetter}
              currentLetterIndex={hudStats.currentLetterIndex}
              score={hudStats.score}
              combo={hudStats.combo}
              wordsBlended={hudStats.wordsBlended}
              lives={hudStats.lives}
              isBoosted={hudStats.isBoosted}
              isSlowed={hudStats.isSlowed}
              isNextLevelUnlocked={hudStats.isNextLevelUnlocked}
              onPauseToggle={handlePause}
              onRestart={() => {
                setIsPaused(false);
                setRunKey((k) => k + 1);
              }}
              onExit={handleExitHome}
              onOpenGuide={() => setShowGuideModal(true)}
              statusMessage={hudStats.statusMessage}
              currentSpeed={hudStats.currentSpeed}
            />

            <div className="flex flex-col items-center">
              <GameCanvas
                key={`${selectedLevelIdx}-${chosenCharId}-${runKey}`}
                wordItem={currentWord}
                levelNumber={selectedLevelIdx + 1}
                character={chosenChar}
                isPaused={isPaused || showPauseModal || showGuideModal || showGameOverModal || showLevelModal}
                onPauseRequested={handlePause}
                onUpdateStats={setHudStats}
                onGameOver={handleGameOver}
              />
            </div>
          </div>
        )}
      </main>

      {/* PAUSE MODAL (WITH RESUME, SELECT LEVEL, EXIT TO HOME) */}
      {showPauseModal && (
        <PauseModal
          word={currentWord.word}
          emoji={currentWord.emoji}
          levelNumber={selectedLevelIdx + 1}
          onResume={handleResume}
          onSelectLevel={() => {
            setShowPauseModal(false);
            setShowLevelModal(true);
          }}
          onExitHome={handleExitHome}
          musicMuted={musicMuted}
          onToggleMusic={toggleMusic}
        />
      )}

      {/* LEVEL SELECT MODAL (SHOWING UNLOCKED/LOCKED STATUS FOR 15 WORDS) */}
      {showLevelModal && (
        <LevelSelectModal
          unlockedLevelIndex={unlockedLevelIdx}
          selectedLevelIndex={selectedLevelIdx}
          levelHighScores={levelHighScores}
          onSelectLevel={(idx) => {
            setShowLevelModal(false);
            if (view === 'game') {
              launchLevelRun(idx);
            } else {
              setSelectedLevelIdx(idx);
            }
          }}
          onClose={() => {
            setShowLevelModal(false);
            if (view === 'game' && isPaused) {
              // Re-open pause modal if paused during game
              setShowPauseModal(true);
            }
          }}
        />
      )}

      {/* Simple Instruction Guide Modal */}
      {showGuideModal && (
        <InstructionModal
          onClose={() => setShowGuideModal(false)}
          onStart={() => {
            setShowGuideModal(false);
            launchLevelRun(selectedLevelIdx);
          }}
        />
      )}

      {/* Driver Garage Modal */}
      {showGarageModal && (
        <GarageModal
          chosenCharId={chosenCharId}
          onSelectChar={setChosenCharId}
          ownedChars={ownedChars}
          onBuyChar={handleBuyChar}
          bank={bank}
          onClose={() => setShowGarageModal(false)}
        />
      )}

      {/* Game Over Modal (when all 3 lives lost) */}
      {showGameOverModal && (
        <GameOverModal
          wordItem={currentWord}
          levelNumber={selectedLevelIdx + 1}
          score={gameOverStats.score}
          wordsBlended={gameOverStats.wordsBlended}
          bestCombo={gameOverStats.bestCombo}
          unlockedNext={gameOverStats.unlockedNext}
          coinsEarned={gameOverStats.coinsEarned}
          onRetry={() => launchLevelRun(selectedLevelIdx)}
          onSelectLevel={() => {
            setShowGameOverModal(false);
            setShowLevelModal(true);
          }}
          onHome={handleExitHome}
          onAddCoins={(c) => setBank((b) => b + c)}
        />
      )}

      {/* Arcade Footer */}
      <footer className="w-full text-center py-3 text-xs font-pixel text-slate-500 border-t border-slate-800">
        ARTICULAT-RACER · 15 ENDLESS WORD COURSES
      </footer>
    </div>
  );
}
