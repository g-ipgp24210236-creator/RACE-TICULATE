import { CharacterItem } from '../types';
import { SPRITE_PALETTE } from '../data/words';

export const POWERUP_SPRITES: Record<string, string[]> = {
  heart: [
    '..rr..rr.',
    '.rrrrrrrr.',
    'rrrrrrrrrr',
    'rrrrrrrrrr',
    '.rrrrrrrr.',
    '..rrrrrr..',
    '...rrrr...',
    '....rr....',
    '..........'
  ],
  bolt: [
    '....yy....',
    '...yyy....',
    '..yyyy....',
    '.yyyyyyyy.',
    '....yy....',
    '...yyy....',
    '..yy......',
    '.yy.......',
    '..........'
  ],
  clock: [
    '..bbbbbb..',
    '.bwwwwwwb.',
    'bwwbwwbwwb',
    'bwwbbwbwwb',
    'bwwwwwwwwb',
    '.bwwwwwwb.',
    '..bbbbbb..',
    '..........'
  ]
};

export function drawHeadSprite(
  ctx: CanvasRenderingContext2D,
  headMatrix: string[],
  x: number,
  y: number,
  pixelSize = 2
) {
  headMatrix.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      const color = SPRITE_PALETTE[char];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
      }
    }
  });
}

export function drawStandingCharacter(
  ctx: CanvasRenderingContext2D,
  character: CharacterItem,
  x: number,
  y: number,
  scale = 3,
  bobY = 0
) {
  ctx.save();
  ctx.translate(x, y + bobY);

  // Character head
  const headW = 8 * scale;
  drawHeadSprite(ctx, character.headSprite, -headW / 2, -18 * scale, scale);

  // Character body/suit
  ctx.fillStyle = character.carColor;
  ctx.fillRect(-6 * scale, -10 * scale, 12 * scale, 9 * scale);

  // White race bib / belt
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6 * scale, -4 * scale, 12 * scale, 2 * scale);

  // Gloves / hands
  ctx.fillStyle = '#ffc79a';
  ctx.fillRect(-8 * scale, -8 * scale, 2 * scale, 3 * scale);
  ctx.fillRect(6 * scale, -8 * scale, 2 * scale, 3 * scale);

  // Shoes
  ctx.fillStyle = '#111111';
  ctx.fillRect(-5 * scale, -1 * scale, 4 * scale, 3 * scale);
  ctx.fillRect(1 * scale, -1 * scale, 4 * scale, 3 * scale);

  ctx.restore();
}

export function drawKart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  character: CharacterItem,
  scale = 2,
  options: {
    hasDriver?: boolean;
    driverOffsetY?: number;
    showExhaust?: boolean;
    boostFlame?: boolean;
    angle?: number;
  } = {}
) {
  const {
    hasDriver = false,
    driverOffsetY = 0,
    showExhaust = false,
    boostFlame = false,
    angle = 0
  } = options;

  ctx.save();
  ctx.translate(x, y);
  if (angle !== 0) {
    ctx.rotate(angle);
  }

  // 4 Black Rubber Wheels with white rims
  const wheelW = 3 * scale;
  const wheelH = 6 * scale;
  ctx.fillStyle = '#111111';
  // Front-left
  ctx.fillRect(-7 * scale, -8 * scale, wheelW, wheelH);
  // Front-right
  ctx.fillRect(4 * scale, -8 * scale, wheelW, wheelH);
  // Rear-left
  ctx.fillRect(-7 * scale, 4 * scale, wheelW, wheelH);
  // Rear-right
  ctx.fillRect(4 * scale, 4 * scale, wheelW, wheelH);

  // Wheel hubs
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(-6 * scale, -6 * scale, 1 * scale, 2 * scale);
  ctx.fillRect(5 * scale, -6 * scale, 1 * scale, 2 * scale);
  ctx.fillRect(-6 * scale, 6 * scale, 1 * scale, 2 * scale);
  ctx.fillRect(5 * scale, 6 * scale, 1 * scale, 2 * scale);

  // Kart Body Shell
  ctx.fillStyle = character.carColor;
  ctx.fillRect(-6 * scale, -9 * scale, 12 * scale, 17 * scale);

  // Racing Stripe / Accent
  ctx.fillStyle = character.accentColor || '#ffffff';
  ctx.fillRect(-2 * scale, -9 * scale, 4 * scale, 17 * scale);

  // Front bumper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6 * scale, -10 * scale, 12 * scale, 2 * scale);

  // Side trims (dark outline)
  ctx.fillStyle = '#111111';
  ctx.fillRect(-6 * scale, -9 * scale, 1 * scale, 17 * scale);
  ctx.fillRect(5 * scale, -9 * scale, 1 * scale, 17 * scale);

  // Cockpit hole
  ctx.fillStyle = '#1c1b29';
  ctx.fillRect(-4 * scale, -4 * scale, 8 * scale, 8 * scale);

  // Steering wheel (visible especially when empty!)
  ctx.fillStyle = '#555566';
  ctx.fillRect(-2 * scale, -5 * scale, 4 * scale, 2 * scale);

  // Empty seat cushion if no driver
  if (!hasDriver) {
    ctx.fillStyle = '#2d2b3d';
    ctx.fillRect(-3 * scale, -2 * scale, 6 * scale, 5 * scale);
    ctx.fillStyle = '#3f3d54';
    ctx.fillRect(-2 * scale, -1 * scale, 4 * scale, 3 * scale);
  } else {
    // Driver head inside cockpit!
    const headW = 8 * scale;
    drawHeadSprite(
      ctx,
      character.headSprite,
      -headW / 2,
      -10 * scale + driverOffsetY,
      scale
    );
  }

  // Exhaust fire / boost flame
  if (boostFlame) {
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-3 * scale, 8 * scale, 6 * scale, 6 * scale);
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(-1.5 * scale, 11 * scale, 3 * scale, 4 * scale);
  } else if (showExhaust) {
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(-2 * scale, 8 * scale, 4 * scale, 3 * scale);
  }

  ctx.restore();
}

export function drawBlockSprite(
  ctx: CanvasRenderingContext2D,
  letter: string,
  x: number,
  y: number,
  width: number,
  height: number,
  isLong: boolean,
  isTargetActive: boolean,
  isHolding: boolean
) {
  ctx.save();
  // Border
  ctx.fillStyle = isLong ? '#0a4a12' : '#7a3b00';
  ctx.fillRect(x, y, width, height);

  // Inner fill
  if (isLong) {
    ctx.fillStyle = isHolding ? '#afffaf' : (isTargetActive ? '#8af58a' : '#38a83d');
  } else {
    ctx.fillStyle = isTargetActive ? '#fff59a' : '#f8b800';
  }
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);

  // Highlight top bar
  ctx.fillStyle = isLong ? '#a8ffa8' : '#fce08a';
  ctx.fillRect(x + 2, y + 2, width - 4, 3);

  // Texture details
  if (isLong) {
    // Pipe ridge lines along the stretch
    ctx.fillStyle = '#22782b';
    ctx.fillRect(x + width - 6, y + 4, 3, height - 8);
    ctx.fillRect(x + 3, y + 4, 2, height - 8);
  } else {
    // Corner bolt accents
    ctx.fillStyle = '#8a4b00';
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + width - 5, y + 3, 2, 2);
    ctx.fillRect(x + 3, y + height - 5, 2, 2);
    ctx.fillRect(x + width - 5, y + height - 5, 2, 2);
  }

  // Draw Letter
  ctx.font = "bold 18px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const centerY = y + height / 2;
  // Shadow
  ctx.fillStyle = isLong ? '#0a4a12' : '#572700';
  ctx.fillText(letter, x + width / 2 + 1, centerY + 1);
  // Main letter
  ctx.fillStyle = '#ffffff';
  ctx.fillText(letter, x + width / 2, centerY);

  // Glowing stroke when holding stretch block
  if (isHolding) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  }

  ctx.restore();
}

export function drawObstacleCone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1.2
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);

  // Traffic cone base
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(-12, 10, 24, 3);

  // Cone layers
  for (let k = 0; k < 5; k++) {
    ctx.fillStyle = k === 1 || k === 3 ? '#ffffff' : '#ff5500';
    ctx.fillRect(-3 - k * 2, -10 + k * 4, 6 + k * 4, 4);
  }

  ctx.restore();
}

export function drawPowerupSprite(
  ctx: CanvasRenderingContext2D,
  type: 'heart' | 'bolt' | 'clock',
  x: number,
  y: number,
  pixelSize = 2.5
) {
  const sprite = POWERUP_SPRITES[type];
  if (!sprite) return;

  const w = sprite[0].length * pixelSize;
  const h = sprite.length * pixelSize;
  const startX = x - w / 2;
  const startY = y - h / 2;

  sprite.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      let color = '';
      if (char === 'r') color = '#ff2855';
      else if (char === 'y') color = '#ffd800';
      else if (char === 'b') color = '#2e86ff';
      else if (char === 'w') color = '#ffffff';

      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
      }
    }
  });
}
