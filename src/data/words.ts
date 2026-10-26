import { CharacterItem, WordItem } from '../types';

export const WORDS: WordItem[] = [
  // F words
  { word: 'FAN', group: 'F', emoji: '🪭', phonemes: ['/f/', '/æ/', '/n/'], description: 'A cool breeze machine' },
  { word: 'FAT', group: 'F', emoji: '🍳', phonemes: ['/f/', '/æ/', '/t/'], description: 'Sizzling food in the pan' },
  { word: 'FIN', group: 'F', emoji: '🐟', phonemes: ['/f/', '/ɪ/', '/n/'], description: 'A fish fin swimming fast' },
  // H words
  { word: 'HAT', group: 'H', emoji: '🎩', phonemes: ['/h/', '/æ/', '/t/'], description: 'A stylish racing top hat' },
  { word: 'HEN', group: 'H', emoji: '🐔', phonemes: ['/h/', '/ɛ/', '/n/'], description: 'A clucking farm hen' },
  { word: 'HIT', group: 'H', emoji: '⚾', phonemes: ['/h/', '/ɪ/', '/t/'], description: 'A solid baseball hit' },
  // M words
  { word: 'MAP', group: 'M', emoji: '🗺️', phonemes: ['/m/', '/æ/', '/p/'], description: 'The grand racetrack map' },
  { word: 'MAT', group: 'M', emoji: '🧘', phonemes: ['/m/', '/æ/', '/t/'], description: 'A comfy driver floor mat' },
  { word: 'MAN', group: 'M', emoji: '🧑', phonemes: ['/m/', '/æ/', '/n/'], description: 'The champion kart driver' },
  // N words
  { word: 'NAP', group: 'N', emoji: '😴', phonemes: ['/n/', '/æ/', '/p/'], description: 'A quick pit stop nap' },
  { word: 'NET', group: 'N', emoji: '🥅', phonemes: ['/n/', '/ɛ/', '/t/'], description: 'A goal sports net' },
  // P words
  { word: 'PAN', group: 'P', emoji: '🍳', phonemes: ['/p/', '/æ/', '/n/'], description: 'A shiny cooking pan' },
  { word: 'PAT', group: 'P', emoji: '🐶', phonemes: ['/p/', '/æ/', '/t/'], description: 'A gentle pat on a pet' },
  { word: 'PEN', group: 'P', emoji: '🖊️', phonemes: ['/p/', '/ɛ/', '/n/'], description: 'A sleek racing pen' },
  { word: 'PET', group: 'P', emoji: '🐾', phonemes: ['/p/', '/ɛ/', '/t/'], description: 'A loyal animal friend' }
];

export const IPA_MAP: Record<string, string> = {
  F: '/f/',
  H: '/h/',
  M: '/m/',
  N: '/n/',
  S: '/s/',
  T: '/t/',
  P: '/p/',
  D: '/d/',
  K: '/k/',
  A: '/æ/',
  I: '/ɪ/',
  E: '/ɛ/'
};

// Continuous / stretchable phonemes (fricatives, nasals, vowels)
export const STRETCH_PHONEMES = new Set(['F', 'H', 'M', 'N', 'S', 'A', 'I', 'E']);

// Color palette for 8-bit sprites
export const SPRITE_PALETTE: Record<string, string> = {
  r: '#e52521', // Red
  b: '#2e5cff', // Blue
  s: '#ffc79a', // Skin
  k: '#111111', // Black/dark
  w: '#ffffff', // White
  y: '#ffd800', // Yellow
  p: '#ff7ac8', // Pink
  n: '#7a4a1e', // Brown
  g: '#43b047', // Green
  o: '#ff6a00'  // Orange
};

export const CHARACTERS: CharacterItem[] = [
  {
    id: 0,
    name: 'PETE',
    cost: 0,
    carColor: '#e52521',
    accentColor: '#ffd800',
    headSprite: [
      '..rrrr..',
      '.rrrrrr.',
      '.nssssn.',
      'nsskksn.',
      '.ssssss.',
      '.nnnnnn.',
      '..bbbb..',
      '.bbbbbb.'
    ]
  },
  {
    id: 1,
    name: 'WRECKER',
    cost: 60,
    carColor: '#8a5a2b',
    accentColor: '#e52521',
    headSprite: [
      '.nnnnnn.',
      'nnnnnnnn',
      'nssssssn',
      'sskkkkss',
      'ssskksss',
      'ssssssss',
      'rr....rr',
      'rr....rr'
    ]
  },
  {
    id: 2,
    name: 'FIXIT',
    cost: 120,
    carColor: '#2e5cff',
    accentColor: '#ffd800',
    headSprite: [
      '..bbbb..',
      '.bbbbbb.',
      '.ssssss.',
      '.skssks.',
      '.ssssss.',
      '..ssss..',
      '.bbbbbb.',
      'bbbbbbbb'
    ]
  },
  {
    id: 3,
    name: 'CANDY',
    cost: 180,
    carColor: '#ff7ac8',
    accentColor: '#ffffff',
    headSprite: [
      '.pppppp.',
      'pppppppp',
      'pssssssp',
      'pskssksp',
      'pssrrssp',
      '.ssssss.',
      '..pppp..',
      '.pppppp.'
    ]
  },
  {
    id: 4,
    name: 'SHROOM',
    cost: 250,
    carColor: '#43b047',
    accentColor: '#ffffff',
    headSprite: [
      '..wwww..',
      '.wrwwrw.',
      'wwwrrwww',
      'wwwwwwww',
      '.ssssss.',
      '.skssks.',
      '..ssss..',
      '.bbbbbb.'
    ]
  },
  {
    id: 5,
    name: 'NITRO',
    cost: 350,
    carColor: '#ff6a00',
    accentColor: '#111111',
    headSprite: [
      '..oooo..',
      '.oyyyo..',
      '.ookkoo.',
      'ookkkkoo',
      '.osssso.',
      '.okssko.',
      '..oooo..',
      '.kkkkkk.'
    ]
  },
  {
    id: 6,
    name: 'CYBER',
    cost: 480,
    carColor: '#00e5ff',
    accentColor: '#ff007f',
    headSprite: [
      '..kkkk..',
      '.kbbbbk.',
      '.bbppbb.',
      'kppyyppk',
      '.kppyyk.',
      '..kbbk..',
      '.kbbbbk.',
      'kkkkkkkk'
    ]
  },
  {
    id: 7,
    name: 'GOLDIE',
    cost: 650,
    carColor: '#ffd800',
    accentColor: '#ffffff',
    headSprite: [
      '.y.yy.y.',
      '.yyyyyy.',
      '.yssssy.',
      'ysskksyy',
      '.ssssss.',
      '..ssss..',
      '.yyyyyy.',
      'yyyyyyyy'
    ]
  }
];
