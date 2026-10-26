export interface WordItem {
  word: string;
  group: string;
  emoji: string;
  phonemes: string[];
  description?: string;
}

export interface CharacterItem {
  id: number;
  name: string;
  cost: number;
  carColor: string;
  accentColor: string;
  headSprite: string[];
}

export interface BlockLaneItem {
  lane: number; // 0: left, 1: middle, 2: right
  type: 'letter' | 'obstacle' | 'powerup' | 'empty';
  letter?: string;
  powerupType?: 'bolt' | 'clock';
  isTarget?: boolean;
  isLong?: boolean; // Green pipe stretch sound
  height: number;
  offsetY: number;
  active: boolean;
  soundStarted?: boolean;
  holdTime?: number;
}

export interface TrackRow {
  index: number;
  y: number;
  height: number;
  done: boolean;
  blocks: BlockLaneItem[];
  letterIndex?: number; // Index in spelling cycle
  letter?: string;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size?: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export type ViewState = 'home' | 'levels' | 'guide' | 'game' | 'challenge' | 'garage';
