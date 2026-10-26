import React, { useEffect, useRef } from 'react';
import { WordItem, CharacterItem, TrackRow, BlockLaneItem, SparkParticle } from '../types';
import { STRETCH_PHONEMES } from '../data/words';
import {
  drawKart,
  drawBlockSprite,
  drawObstacleCone,
  drawPowerupSprite
} from '../utils/sprites';
import {
  playPhoneme,
  stopCurrentPhoneme,
  playSpeedBoost,
  playSlowMotion,
  playObstacleHit,
  playCoin,
  playVictoryFanfare,
  speakWord,
  setMusicTempo
} from '../audio';

interface SingleWordEndlessCanvasProps {
  wordItem: WordItem;
  levelNumber: number;
  character: CharacterItem;
  isPaused: boolean;
  onPauseRequested: () => void;
  onUpdateStats: (stats: {
    currentLetter: string;
    currentLetterIndex: number;
    score: number;
    combo: number;
    wordsBlended: number;
    lives: number;
    isBoosted: boolean;
    isSlowed: boolean;
    statusMessage: string;
    currentSpeed: number;
    isNextLevelUnlocked: boolean;
  }) => void;
  onGameOver: (results: {
    score: number;
    wordsBlended: number;
    bestCombo: number;
    unlockedNext: boolean;
  }) => void;
}

export const GameCanvas: React.FC<SingleWordEndlessCanvasProps> = ({
  wordItem,
  levelNumber,
  character,
  isPaused,
  onPauseRequested,
  onUpdateStats,
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const CANVAS_WIDTH = 240;
  const CANVAS_HEIGHT = 360;
  const CAR_Y = 280;
  const CAR_HEIGHT = 42;
  const CAR_WIDTH = 34;
  const BLOCK_WIDTH = 46;

  const getLaneX = (lane: number) => {
    const laneWidth = (CANVAS_WIDTH - 24) / 3;
    return 12 + laneWidth * (lane + 0.5);
  };

  const word = wordItem.word;

  const stateRef = useRef({
    rows: [] as TrackRow[],
    sparks: [] as SparkParticle[],
    floatingTexts: [] as { x: number; y: number; text: string; alpha: number; color: string }[],
    lane: 1, // 0: left, 1: center, 2: right
    currentX: 120,
    targetX: 120,
    roadOffset: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: 3,
    wordsBlended: 0,
    consecutiveHitsInWord: 0,
    spawnLetterIdx: 0,
    totalRowsSpawned: 0,
    timeElapsed: 0,
    currentSpeed: 70,
    boostTimer: 0,
    slowTimer: 0,
    flashTimer: 0,
    lastTime: performance.now(),
    isGameOver: false,
    statusMsg: `Hit the letter blocks in order: ${word.split('').join(' - ')}!`,
    activeHoldingBlock: null as BlockLaneItem | null
  });

  // Spawn row for this word, always placing next row above the topmost existing row
  const spawnNextRow = () => {
    const s = stateRef.current;
    const letterIdx = s.spawnLetterIdx;
    const letter = word[letterIdx];
    // Gap between letters:
    // User request: after blending 5 times, reduce the time gap between blocks to ease them to blend
    let gap: number;
    const progressInCycle = letterIdx / Math.max(1, word.length - 1);

    if (s.wordsBlended >= 5) {
      // Reduced rapid gap after 5 blends to ease physical sound blending
      gap = Math.max(28, Math.round(42 - 12 * progressInCycle));
    } else {
      // Standard gap tightening towards the end of each word cycle
      const speedTightening = Math.min(25, s.wordsBlended * 2.5);
      gap = Math.max(38, Math.round(155 - 110 * Math.pow(progressInCycle, 1.2) - speedTightening));
    }

    // Stretch phoneme on earlier letter if stretchable sound
    const isStretchable = STRETCH_PHONEMES.has(letter);
    const isLong = isStretchable && letterIdx === 0 && Math.random() < 0.5;
    const height = isLong ? 72 : 34;

    // Calculate position: always placed above the current topmost row
    let topY = -60;
    if (s.rows.length > 0) {
      let minY = s.rows[0].y;
      for (let i = 1; i < s.rows.length; i++) {
        if (s.rows[i].y < minY) {
          minY = s.rows[i].y;
        }
      }
      topY = minY - gap - height;
    } else {
      topY = -80;
    }

    // Pick 1 lane for this single letter block (never 2 or 3 letters in one row)
    const targetLane = Math.floor(Math.random() * 3);
    const otherLanes = [0, 1, 2].filter((l) => l !== targetLane);

    // Power-up placement (only Bolt or Clock, NO HEART)
    let powerupLane = -1;
    let powerupType: 'bolt' | 'clock' | undefined = undefined;
    if (s.totalRowsSpawned > 0 && s.totalRowsSpawned % 4 === 0) {
      powerupLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
      powerupType = Math.random() > 0.5 ? 'bolt' : 'clock';
    }

    // Obstacle placement: scales up as you survive longer and blend more words!
    const obstacleChance = Math.min(0.50, 0.18 + s.wordsBlended * 0.035 + s.timeElapsed * 0.003);
    const obstacleLane =
      powerupLane === -1 && Math.random() < obstacleChance
        ? otherLanes[Math.floor(Math.random() * otherLanes.length)]
        : -1;

    // Exactly 1 letter in this row
    const blocks: BlockLaneItem[] = [0, 1, 2].map((lane) => {
      if (lane === targetLane) {
        return {
          lane,
          type: 'letter',
          letter,
          isTarget: true,
          isLong,
          height,
          offsetY: 0,
          active: true,
          soundStarted: false,
          holdTime: 0
        };
      }

      if (lane === powerupLane && powerupType) {
        return {
          lane,
          type: 'powerup',
          powerupType,
          height: 24,
          offsetY: Math.max(0, (height - 24) / 2),
          active: true
        };
      }

      if (lane === obstacleLane) {
        return {
          lane,
          type: 'obstacle',
          height: 24,
          offsetY: Math.max(0, (height - 24) / 2),
          active: true
        };
      }

      return {
        lane,
        type: 'empty',
        height,
        offsetY: 0,
        active: false
      };
    });

    s.rows.push({
      index: s.totalRowsSpawned,
      y: topY,
      height,
      done: false,
      blocks,
      letterIndex: letterIdx,
      letter
    });

    s.totalRowsSpawned++;
    s.spawnLetterIdx = (s.spawnLetterIdx + 1) % word.length;
  };

  const steerToLane = (lane: number) => {
    const clamped = Math.max(0, Math.min(2, lane));
    stateRef.current.lane = clamped;
    stateRef.current.targetX = getLaneX(clamped);
  };

  // Keyboard controls & pause shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        onPauseRequested();
        return;
      }

      if (isPaused || stateRef.current.isGameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        steerToLane(stateRef.current.lane - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        steerToLane(stateRef.current.lane + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, onPauseRequested]);

  // Touch/pointer steering
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || stateRef.current.isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const targetLane = Math.floor(ratio * 3);
    steerToLane(targetLane);
  };

  const addSparks = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.8) * 130,
        life: 0.45,
        color,
        size: Math.random() * 3 + 2
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color = '#ffd800') => {
    stateRef.current.floatingTexts.push({
      x,
      y,
      text,
      alpha: 1.0,
      color
    });
  };

  // Accurately update HUD with currently approaching letter block
  const updateHUD = () => {
    const s = stateRef.current;
    // Find the next active row approaching the car
    const activeRow = s.rows.find((r) => !r.done && r.y + r.height >= CAR_Y - CAR_HEIGHT);
    const activeLetterIndex = activeRow && activeRow.letterIndex !== undefined ? activeRow.letterIndex : 0;
    const activeLetter = word[activeLetterIndex] || word[0];

    onUpdateStats({
      currentLetter: activeLetter,
      currentLetterIndex: activeLetterIndex,
      score: s.score,
      combo: s.combo,
      wordsBlended: s.wordsBlended,
      lives: s.lives,
      isBoosted: s.boostTimer > 0,
      isSlowed: s.slowTimer > 0,
      statusMessage: s.statusMsg,
      currentSpeed: s.currentSpeed,
      isNextLevelUnlocked: s.wordsBlended >= 3
    });
  };

  // Main 60fps Endless Game Loop
  useEffect(() => {
    const initialLane = 1;
    const initialX = getLaneX(initialLane);

    stateRef.current = {
      rows: [],
      sparks: [],
      floatingTexts: [],
      lane: initialLane,
      currentX: initialX,
      targetX: initialX,
      roadOffset: 0,
      score: 0,
      combo: 0,
      bestCombo: 0,
      lives: 3,
      wordsBlended: 0,
      consecutiveHitsInWord: 0,
      spawnLetterIdx: 0,
      totalRowsSpawned: 0,
      timeElapsed: 0,
      currentSpeed: 70,
      boostTimer: 0,
      slowTimer: 0,
      flashTimer: 0,
      lastTime: performance.now(),
      isGameOver: false,
      statusMsg: `Hit the letters in order: ${word.split('').join(' - ')}!`,
      activeHoldingBlock: null
    };

    // Pre-populate initial buffer of rows
    for (let i = 0; i < 10; i++) {
      spawnNextRow();
    }
    updateHUD();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    const gameLoop = (now: number) => {
      const s = stateRef.current;
      const dt = Math.min(0.05, (now - (s.lastTime || now)) / 1000);
      s.lastTime = now;

      if (!isPaused && !s.isGameOver) {
        s.timeElapsed += dt;
        s.boostTimer = Math.max(0, s.boostTimer - dt);
        s.slowTimer = Math.max(0, s.slowTimer - dt);
        s.flashTimer = Math.max(0, s.flashTimer - dt);

        // Gradually speeds up over time and words blended
        const acceleratedBaseSpeed =
          70 + Math.min(125, s.timeElapsed * 0.75 + s.wordsBlended * 7.0);
        const effectiveSpeed =
          acceleratedBaseSpeed * (s.boostTimer > 0 ? 1.45 : 1) * (s.slowTimer > 0 ? 0.6 : 1);

        s.currentSpeed = effectiveSpeed;
        setMusicTempo(effectiveSpeed / 85);

        s.roadOffset = (s.roadOffset + effectiveSpeed * dt) % 32;
        s.currentX += (s.targetX - s.currentX) * Math.min(1, dt * 16);

        // Move rows forward
        for (let ri = 0; ri < s.rows.length; ri++) {
          const row = s.rows[ri];
          row.y += effectiveSpeed * dt;

          if (row.done || row.y > CANVAS_HEIGHT + 30) continue;

          for (let bi = 0; bi < row.blocks.length; bi++) {
            const block = row.blocks[bi];
            if (!block.active) continue;

            const blockX = getLaneX(block.lane);
            const blockY = row.y + block.offsetY;
            const blockH = block.height;

            const kartTop = CAR_Y - CAR_HEIGHT / 2;
            const kartBottom = CAR_Y + CAR_HEIGHT / 2;
            const bTop = blockY;
            const bBottom = blockY + blockH;

            // Physical collision check
            const isOverlapY = kartBottom >= bTop && kartTop <= bBottom;
            const isOverlapX = Math.abs(s.currentX - blockX) < 32 || block.lane === s.lane;
            const isColliding = isOverlapX && isOverlapY;

            // 1. Target Letter Block
            if (block.type === 'letter' && block.isTarget) {
              if (block.isLong) {
                // Green stretch block
                if (isColliding) {
                  if (!block.soundStarted) {
                    block.soundStarted = true;
                    s.activeHoldingBlock = block;
                    const soundDuration = (blockH + 40) / effectiveSpeed + 0.15;
                    playPhoneme(block.letter!, soundDuration);
                    s.statusMsg = `Hold lane! Stretch /${block.letter!.toLowerCase()}/...`;
                  }
                  block.holdTime = (block.holdTime || 0) + dt;
                } else if (block.soundStarted && isOverlapY) {
                  stopCurrentPhoneme();
                  s.activeHoldingBlock = null;
                  block.active = false;
                  row.done = true;
                  s.combo = 0;
                  s.consecutiveHitsInWord = 0;
                  s.statusMsg = 'Stay on the green pipe to stretch!';
                  updateHUD();
                }

                if (bTop >= CAR_Y + 8) {
                  block.active = false;
                  row.done = true;
                  s.activeHoldingBlock = null;

                  const requiredHold = (blockH / effectiveSpeed) * 0.6;
                  if ((block.holdTime || 0) >= requiredHold) {
                    s.combo++;
                    if (row.letterIndex === 0) {
                      s.consecutiveHitsInWord = 1;
                    } else if (s.consecutiveHitsInWord === row.letterIndex) {
                      s.consecutiveHitsInWord++;
                    } else {
                      s.consecutiveHitsInWord = 0;
                    }
                    s.bestCombo = Math.max(s.bestCombo, s.combo);
                    s.score += 150 + Math.min(s.combo, 15) * 15;
                    addSparks(blockX, CAR_Y, '#43b047', 16);
                    addFloatingText(blockX, CAR_Y - 20, `+150 /${block.letter!.toLowerCase()}/`, '#8aff8a');

                    // Check if word completed
                    if (row.letterIndex === word.length - 1 && s.consecutiveHitsInWord === word.length) {
                      s.wordsBlended++;
                      s.consecutiveHitsInWord = 0;
                      s.score += 300;
                      playCoin();
                      speakWord(word, 220);
                      addFloatingText(120, CAR_Y - 40, `✨ ${word}! +300`, '#ffd800');

                      if (s.wordsBlended === 3) {
                        playVictoryFanfare();
                        s.statusMsg = `Level Cleared! Next level unlocked! Keep racing!`;
                      } else if (s.wordsBlended === 5) {
                        playVictoryFanfare();
                        s.statusMsg = `🔥 5 Blends! Rapid gap mode activated!`;
                        addFloatingText(120, CAR_Y - 55, '⚡ RAPID BLENDING ACTIVATED!', '#fbd000');
                      } else if (s.wordsBlended > 5) {
                        s.statusMsg = `Blended ${word}! (${s.wordsBlended}x · Rapid Gaps)`;
                      } else {
                        s.statusMsg = `Blended ${word}! (${s.wordsBlended}/3 for next level)`;
                      }
                    } else {
                      s.statusMsg = `Hit /${block.letter!.toLowerCase()}/! Next block coming!`;
                    }
                  } else {
                    s.combo = 0;
                    s.consecutiveHitsInWord = 0;
                    s.statusMsg = 'Hold longer next time!';
                  }
                  updateHUD();
                }
              } else {
                // Standard yellow block: immediate satisfying hit
                if (isColliding) {
                  block.active = false;
                  row.done = true;
                  playPhoneme(block.letter!, 0.32);
                  s.combo++;
                  if (row.letterIndex === 0) {
                    s.consecutiveHitsInWord = 1;
                  } else if (s.consecutiveHitsInWord === row.letterIndex) {
                    s.consecutiveHitsInWord++;
                  } else {
                    s.consecutiveHitsInWord = 0;
                  }
                  s.bestCombo = Math.max(s.bestCombo, s.combo);
                  s.score += 100 + Math.min(s.combo, 15) * 10;
                  addSparks(blockX, CAR_Y, '#ffd800', 16);
                  addFloatingText(blockX, CAR_Y - 18, `+100 /${block.letter!.toLowerCase()}/`, '#ffd800');

                  // Completed word
                  if (row.letterIndex === word.length - 1 && s.consecutiveHitsInWord === word.length) {
                    s.wordsBlended++;
                    s.consecutiveHitsInWord = 0;
                    s.score += 300;
                    playCoin();
                    speakWord(word, 220);
                    addFloatingText(120, CAR_Y - 40, `✨ ${word}! +300`, '#ffd800');

                    if (s.wordsBlended === 3) {
                      playVictoryFanfare();
                      s.statusMsg = `Level Cleared! Next level unlocked! Keep racing!`;
                    } else if (s.wordsBlended === 5) {
                      playVictoryFanfare();
                      s.statusMsg = `🔥 5 Blends! Rapid gap mode activated!`;
                      addFloatingText(120, CAR_Y - 55, '⚡ RAPID BLENDING ACTIVATED!', '#fbd000');
                    } else if (s.wordsBlended > 5) {
                      s.statusMsg = `Blended ${word}! (${s.wordsBlended}x · Rapid Gaps)`;
                    } else {
                      s.statusMsg = `Blended ${word}! (${s.wordsBlended}/3 for next level)`;
                    }
                  } else {
                    const nextLetter = word[row.letterIndex! + 1] || word[0];
                    s.statusMsg = `Hit /${block.letter!.toLowerCase()}/! Next: /${nextLetter.toLowerCase()}/`;
                  }
                  updateHUD();
                } else if (bTop > CAR_Y + 12) {
                  // Missed block drove by
                  block.active = false;
                  row.done = true;
                  s.combo = 0;
                  s.consecutiveHitsInWord = 0;
                  s.statusMsg = `Missed /${block.letter!.toLowerCase()}/!`;
                  addSparks(blockX, CAR_Y, '#777788', 6);
                  updateHUD();
                }
              }
            } else if (isColliding) {
              // 2. Obstacle or Power-Up collision
              block.active = false;

              if (block.type === 'obstacle') {
                playObstacleHit();
                s.lives--;
                s.combo = 0;
                s.consecutiveHitsInWord = 0;
                s.flashTimer = 0.25;
                addSparks(blockX, CAR_Y, '#ff2222', 16);
                addFloatingText(blockX, CAR_Y - 20, '-1 ♥', '#ff4444');
                s.statusMsg = `Ouch! Avoid the cones! (${s.lives} ♥ left)`;
                updateHUD();

                if (s.lives <= 0) {
                  s.isGameOver = true;
                  stopCurrentPhoneme();
                  setTimeout(() => {
                    onGameOver({
                      score: s.score,
                      wordsBlended: s.wordsBlended,
                      bestCombo: s.bestCombo,
                      unlockedNext: s.wordsBlended >= 3
                    });
                  }, 400);
                  return;
                }
              } else if (block.type === 'powerup') {
                if (block.powerupType === 'bolt') {
                  playSpeedBoost();
                  s.boostTimer = 1.6;
                  s.score += 100;
                  addSparks(blockX, CAR_Y, '#ffd800', 16);
                  addFloatingText(blockX, CAR_Y - 20, '⚡ SPEED BOOST!', '#ffd800');
                  s.statusMsg = '⚡ TURBO SPEED BOOST!';
                } else if (block.powerupType === 'clock') {
                  playSlowMotion();
                  s.slowTimer = 3.2;
                  s.score += 100;
                  addSparks(blockX, CAR_Y, '#2e86ff', 14);
                  addFloatingText(blockX, CAR_Y - 20, '⏱ SLOW-MO!', '#55aaff');
                  s.statusMsg = '⏱ Slow-Motion Time Dilator!';
                }
                updateHUD();
              }
            }
          }
        }

        // Filter out passed rows
        s.rows = s.rows.filter((r) => r.y <= CANVAS_HEIGHT + 40);

        // ALWAYS keep spawning rows ahead so the trail is truly ENDLESS!
        let currentTopY = 0;
        if (s.rows.length > 0) {
          let minY = s.rows[0].y;
          for (let i = 1; i < s.rows.length; i++) {
            if (s.rows[i].y < minY) minY = s.rows[i].y;
          }
          currentTopY = minY;
        }

        // If topmost row is within 1.5 screen heights above, spawn more rows!
        while (currentTopY > -CANVAS_HEIGHT * 2.0) {
          spawnNextRow();
          if (s.rows.length > 0) {
            let minY = s.rows[0].y;
            for (let i = 1; i < s.rows.length; i++) {
              if (s.rows[i].y < minY) minY = s.rows[i].y;
            }
            currentTopY = minY;
          }
        }

        // Sparks physics
        for (let i = s.sparks.length - 1; i >= 0; i--) {
          const sp = s.sparks[i];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 180 * dt;
          sp.life -= dt;
          if (sp.life <= 0) {
            s.sparks.splice(i, 1);
          }
        }

        // Floating texts physics
        for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
          const ft = s.floatingTexts[i];
          ft.y -= 30 * dt;
          ft.alpha -= 1.4 * dt;
          if (ft.alpha <= 0) {
            s.floatingTexts.splice(i, 1);
          }
        }
      }

      renderCanvas(ctx, canvas.width, canvas.height);

      rafId = requestAnimationFrame(gameLoop);
    };

    const renderCanvas = (c: CanvasRenderingContext2D, W: number, H: number) => {
      const s = stateRef.current;

      // 1. Road Surface
      c.fillStyle = '#2c2542';
      c.fillRect(0, 0, W, H);

      // Red & white curbs
      const curbH = 16;
      for (let y = -curbH; y < H + curbH; y += curbH) {
        const yy = y + s.roadOffset;
        const isRed = ((Math.floor(y / curbH)) & 1) === 0;

        c.fillStyle = isRed ? '#e52521' : '#ffffff';
        c.fillRect(0, yy, 10, curbH);

        c.fillStyle = isRed ? '#ffffff' : '#e52521';
        c.fillRect(W - 10, yy, 10, curbH);
      }

      // Lane dividers
      const laneWidth = (W - 20) / 3;
      c.fillStyle = '#ffffff';
      for (let i = 1; i < 3; i++) {
        const lineX = 10 + laneWidth * i - 1.5;
        for (let y = -32; y < H; y += 32) {
          c.fillRect(lineX, y + s.roadOffset, 3, 16);
        }
      }

      // 2. Draw blocks and powerups
      s.rows.forEach((row) => {
        if (row.y > H + 40 || row.y + row.height < -20) return;

        row.blocks.forEach((block) => {
          if (!block.active) return;
          const x = getLaneX(block.lane);
          const y = row.y + block.offsetY;

          if (block.type === 'letter' && block.letter) {
            const isHolding = s.activeHoldingBlock === block;
            drawBlockSprite(
              c,
              block.letter,
              x - BLOCK_WIDTH / 2,
              y,
              BLOCK_WIDTH,
              block.height,
              !!block.isLong,
              true,
              isHolding
            );
          } else if (block.type === 'obstacle') {
            drawObstacleCone(c, x, y + 10, 1.25);
          } else if (block.type === 'powerup' && block.powerupType) {
            drawPowerupSprite(c, block.powerupType, x, y + 12, 2.5);
          }
        });
      });

      // 3. Player Kart
      const isExhaust = s.currentSpeed > 90;
      const isBoostFlame = s.boostTimer > 0;
      drawKart(c, s.currentX, CAR_Y, character, 2.5, {
        hasDriver: true,
        showExhaust: isExhaust,
        boostFlame: isBoostFlame
      });

      // 4. Sparks
      s.sparks.forEach((sp) => {
        c.fillStyle = sp.color;
        c.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size || 3, sp.size || 3);
      });

      // 5. Floating text labels (+100, /f/, etc.)
      s.floatingTexts.forEach((ft) => {
        c.save();
        c.globalAlpha = Math.max(0, ft.alpha);
        c.fillStyle = ft.color;
        c.font = "bold 10px 'Press Start 2P', monospace";
        c.textAlign = 'center';
        c.fillText(ft.text, ft.x, ft.y);
        c.restore();
      });

      // 6. Red Flash on cone hit
      if (s.flashTimer > 0) {
        c.fillStyle = `rgba(229, 37, 33, ${Math.min(0.4, s.flashTimer * 1.5)})`;
        c.fillRect(0, 0, W, H);
      }
    };

    rafId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafId);
      stopCurrentPhoneme();
    };
  }, [wordItem, levelNumber, character, isPaused]);

  return (
    <div className="relative pixel-box-lg bg-[#181224] mx-auto select-none touch-none overflow-hidden max-w-[340px] sm:max-w-[380px] w-full aspect-[2/3]">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={handlePointerDown}
        className="w-full h-full block cursor-pointer"
      />

      <div className="absolute bottom-2 inset-x-2 flex justify-between pointer-events-none opacity-40">
        <div className="text-[9px] font-pixel text-white bg-black/60 px-2 py-1 rounded">
          ◀ LANE 1
        </div>
        <div className="text-[9px] font-pixel text-white bg-black/60 px-2 py-1 rounded">
          LANE 2
        </div>
        <div className="text-[9px] font-pixel text-white bg-black/60 px-2 py-1 rounded">
          LANE 3 ▶
        </div>
      </div>
    </div>
  );
};
