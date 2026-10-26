// Sound and speech engine for Articulat-Racer

let ac: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let currentSoundNode: GainNode | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let shortFAudioBuffer: AudioBuffer | null = null;
let elongatedFAudioBuffer: AudioBuffer | null = null;
let nAudioBuffer: AudioBuffer | null = null;
let iAudioBuffer: AudioBuffer | null = null;
let hAudioBuffer: AudioBuffer | null = null;
let isFLoading = false;
let isNLoading = false;
let isILoading = false;
let isHLoading = false;
let isMusicMuted = false;
let tempoFactor = 1.0;
let beatIndex = 0;
let nextBeatTime = 0;

export async function preloadFAudio(ctx?: AudioContext) {
  if (isFLoading || (shortFAudioBuffer && elongatedFAudioBuffer)) return;
  isFLoading = true;
  try {
    const audioCtx = ctx || getAudioContext();
    const [shortRes, longRes] = await Promise.all([
      fetch('/assets/aistudio/short_f_e1049780.mp3'),
      fetch('/assets/aistudio/short_f__1__164fca83.mp3')
    ]);
    const [shortArray, longArray] = await Promise.all([
      shortRes.arrayBuffer(),
      longRes.arrayBuffer()
    ]);
    const [shortBuf, longBuf] = await Promise.all([
      audioCtx.decodeAudioData(shortArray),
      audioCtx.decodeAudioData(longArray)
    ]);
    shortFAudioBuffer = shortBuf;
    elongatedFAudioBuffer = longBuf;
  } catch (err) {
    console.warn('Failed to load F audio buffers:', err);
  } finally {
    isFLoading = false;
  }
}

export async function preloadNAudio(ctx?: AudioContext) {
  if (isNLoading || nAudioBuffer) return;
  isNLoading = true;
  try {
    const audioCtx = ctx || getAudioContext();
    const res = await fetch('/assets/aistudio/n_8c066433.mp3');
    const arrayBuffer = await res.arrayBuffer();
    nAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('Failed to load N audio buffer:', err);
  } finally {
    isNLoading = false;
  }
}

export async function preloadIAudio(ctx?: AudioContext) {
  if (isILoading || iAudioBuffer) return;
  isILoading = true;
  try {
    const audioCtx = ctx || getAudioContext();
    const res = await fetch('/assets/aistudio/n__1__8d32ed5d.mp3');
    const arrayBuffer = await res.arrayBuffer();
    iAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('Failed to load I audio buffer:', err);
  } finally {
    isILoading = false;
  }
}

export async function preloadHAudio(ctx?: AudioContext) {
  if (isHLoading || hAudioBuffer) return;
  isHLoading = true;
  try {
    const audioCtx = ctx || getAudioContext();
    const res = await fetch('/assets/aistudio/short_H_725ab7ae.mp3');
    const arrayBuffer = await res.arrayBuffer();
    hAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('Failed to load H audio buffer:', err);
  } finally {
    isHLoading = false;
  }
}

export function getAudioContext(): AudioContext {
  if (!ac) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ac = new AudioContextClass();
    preloadFAudio(ac);
    preloadNAudio(ac);
    preloadIAudio(ac);
    preloadHAudio(ac);
  }
  if (ac.state === 'suspended') {
    ac.resume();
  }
  if ((!shortFAudioBuffer || !elongatedFAudioBuffer) && !isFLoading) {
    preloadFAudio(ac);
  }
  if (!nAudioBuffer && !isNLoading) {
    preloadNAudio(ac);
  }
  if (!iAudioBuffer && !isILoading) {
    preloadIAudio(ac);
  }
  if (!hAudioBuffer && !isHLoading) {
    preloadHAudio(ac);
  }
  return ac;
}

export function setMusicMuted(muted: boolean) {
  isMusicMuted = muted;
  if (musicGain && ac) {
    musicGain.gain.setValueAtTime(muted ? 0 : 1.0, ac.currentTime);
  }
  if (!muted && !musicTimer) {
    startMusic();
  } else if (muted) {
    stopMusic();
  }
}

export function isMuted(): boolean {
  return isMusicMuted;
}

export function setMusicTempo(speedRatio: number) {
  // speedRatio from 1.0 to ~1.6
  tempoFactor = Math.max(0.85, Math.min(1.7, speedRatio));
}

function createEnvelope(gain: GainNode, startTime: number, duration: number, peakAmp: number) {
  const attack = Math.min(duration < 0.2 ? 0.008 : 0.03, duration / 2);
  const safePeak = Math.max(0.0002, peakAmp);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(safePeak, startTime + attack);
  gain.gain.setValueAtTime(safePeak, startTime + Math.max(attack + 0.005, duration - 0.1));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
}

function playNoise(duration: number, filterType: BiquadFilterType, freq: number, Q: number, amp: number, startTime: number, outGain: GainNode) {
  if (!ac) return;
  const sampleRate = ac.sampleRate;
  const buffer = ac.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = Q;

  const gain = ac.createGain();
  createEnvelope(gain, startTime, duration, amp);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(outGain);

  source.start(startTime);
}

function playVoice(f0: number, formants: [number, number, number][], duration: number, startTime: number, amp: number, outGain: GainNode) {
  if (!ac) return;
  formants.forEach(([freq, q, relAmp]) => {
    if (!ac) return;
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = f0;

    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;

    createEnvelope(gain, startTime, duration, amp * relAmp);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}

export function stopCurrentPhoneme() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore
    }
    currentSourceNode = null;
  }
  if (currentSoundNode && ac) {
    try {
      currentSoundNode.gain.cancelScheduledValues(0);
      currentSoundNode.gain.setValueAtTime(currentSoundNode.gain.value, ac.currentTime);
      currentSoundNode.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.04);
    } catch {
      // ignore
    }
    currentSoundNode = null;
  }
}

// Synthesize pure phonetic sound (no letter names)
export function playPhoneme(letter: string, duration = 0.32) {
  const ctx = getAudioContext();
  stopCurrentPhoneme();

  const out = ctx.createGain();
  out.connect(ctx.destination);
  currentSoundNode = out;

  const t = ctx.currentTime + 0.01;
  const d = Math.max(0.12, duration);
  const char = letter.toUpperCase();

  switch (char) {
    case 'F': {
      // Use elongated recording for stretch/hold sounds (d > 0.45s), short recording for standard hits
      const targetBuffer = (d > 0.45 && elongatedFAudioBuffer)
        ? elongatedFAudioBuffer
        : (shortFAudioBuffer || elongatedFAudioBuffer);

      if (targetBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = targetBuffer;
        currentSourceNode = source;

        if (d > targetBuffer.duration) {
          // Elongate by looping the steady friction sound
          source.loop = true;
          source.loopStart = Math.min(0.15, targetBuffer.duration * 0.2);
          source.loopEnd = Math.max(0.35, targetBuffer.duration * 0.85);

          out.gain.setValueAtTime(0.001, t);
          out.gain.linearRampToValueAtTime(0.95, t + 0.03);
          out.gain.setValueAtTime(0.95, t + Math.max(0.05, d - 0.08));
          out.gain.exponentialRampToValueAtTime(0.001, t + d);

          source.connect(out);
          source.start(t);
          source.stop(t + d);
        } else {
          source.loop = false;
          out.gain.setValueAtTime(0.95, t);
          source.connect(out);
          source.start(t);
          source.stop(t + targetBuffer.duration);
        }
      } else {
        // Fallback synthesized highpass noise
        playNoise(d, 'highpass', 1500, 0.5, 0.45, t, out);
        preloadFAudio(ctx);
      }
      break;
    }
    case 'S':
      playNoise(d, 'bandpass', 6500, 3, 0.8, t, out);
      break;
    case 'H': {
      if (hAudioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = hAudioBuffer;
        currentSourceNode = source;

        if (d > hAudioBuffer.duration) {
          // Elongate sustain portion
          source.loop = true;
          source.loopStart = Math.min(0.08, hAudioBuffer.duration * 0.15);
          source.loopEnd = Math.max(0.24, hAudioBuffer.duration * 0.85);

          out.gain.setValueAtTime(0.001, t);
          out.gain.linearRampToValueAtTime(1.0, t + 0.02);
          out.gain.setValueAtTime(1.0, t + Math.max(0.04, d - 0.06));
          out.gain.exponentialRampToValueAtTime(0.001, t + d);

          source.connect(out);
          source.start(t);
          source.stop(t + d);
        } else {
          source.loop = false;
          out.gain.setValueAtTime(1.0, t);
          source.connect(out);
          source.start(t);
          source.stop(t + hAudioBuffer.duration);
        }
      } else {
        playNoise(d, 'bandpass', 1400, 0.7, 0.6, t, out);
        preloadHAudio(ctx);
      }
      break;
    }
    case 'M':
      playVoice(115, [[250, 6, 1], [1100, 4, 0.18]], d, t, 0.8, out);
      break;
    case 'N': {
      if (nAudioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = nAudioBuffer;
        currentSourceNode = source;

        if (d > nAudioBuffer.duration) {
          // Elongate sustain portion
          source.loop = true;
          source.loopStart = Math.min(0.2, nAudioBuffer.duration * 0.25);
          source.loopEnd = Math.max(0.4, nAudioBuffer.duration * 0.85);

          out.gain.setValueAtTime(0.001, t);
          out.gain.linearRampToValueAtTime(0.95, t + 0.03);
          out.gain.setValueAtTime(0.95, t + Math.max(0.05, d - 0.08));
          out.gain.exponentialRampToValueAtTime(0.001, t + d);

          source.connect(out);
          source.start(t);
          source.stop(t + d);
        } else {
          source.loop = false;
          out.gain.setValueAtTime(0.95, t);
          source.connect(out);
          source.start(t);
          source.stop(t + nAudioBuffer.duration);
        }
      } else {
        playVoice(125, [[280, 6, 1], [1700, 5, 0.3]], d, t, 0.8, out);
        preloadNAudio(ctx);
      }
      break;
    }
    case 'T':
      playNoise(0.07, 'highpass', 3500, 0.8, 0.85, t, out);
      break;
    case 'P':
      playNoise(0.08, 'lowpass', 900, 0.8, 0.95, t, out);
      break;
    case 'K':
      playNoise(0.09, 'bandpass', 1900, 1.5, 0.95, t, out);
      break;
    case 'D':
      playNoise(0.05, 'bandpass', 2600, 1, 0.45, t, out);
      playVoice(120, [[300, 5, 1]], 0.12, t, 0.85, out);
      break;
    case 'A': // /æ/ like "cat"
      playVoice(130, [[660, 8, 1], [1720, 10, 0.6]], d, t, 0.8, out);
      break;
    case 'I': {
      if (iAudioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = iAudioBuffer;
        currentSourceNode = source;

        if (d > iAudioBuffer.duration) {
          // Elongate sustain portion
          source.loop = true;
          source.loopStart = Math.min(0.12, iAudioBuffer.duration * 0.2);
          source.loopEnd = Math.max(0.35, iAudioBuffer.duration * 0.85);

          out.gain.setValueAtTime(0.001, t);
          out.gain.linearRampToValueAtTime(0.95, t + 0.03);
          out.gain.setValueAtTime(0.95, t + Math.max(0.05, d - 0.08));
          out.gain.exponentialRampToValueAtTime(0.001, t + d);

          source.connect(out);
          source.start(t);
          source.stop(t + d);
        } else {
          source.loop = false;
          out.gain.setValueAtTime(0.95, t);
          source.connect(out);
          source.start(t);
          source.stop(t + iAudioBuffer.duration);
        }
      } else {
        playVoice(130, [[400, 8, 1], [1900, 10, 0.6]], d, t, 0.8, out);
        preloadIAudio(ctx);
      }
      break;
    }
    case 'E': // /ɛ/ like "hen"
      playVoice(130, [[530, 8, 1], [1840, 10, 0.6]], d, t, 0.8, out);
      break;
    default:
      playNoise(0.1, 'bandpass', 1200, 1, 0.5, t, out);
  }
}

// Sound effects
export function playRevEngine(duration = 1.1) {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  // Pitch ramp up: idle rumble 80Hz -> throttle 260Hz
  osc.frequency.setValueAtTime(75, t);
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);
  osc.frequency.exponentialRampToValueAtTime(290, t + duration * 0.85);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, t);
  filter.frequency.linearRampToValueAtTime(1600, t + duration * 0.7);

  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.1);
  gain.gain.setValueAtTime(0.12, t + duration * 0.75);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + duration);
}

export function playCoin() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  playTone(988, 0.08, t, 0.09);
  playTone(1319, 0.22, t + 0.07, 0.1);
}

export function playHeart() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  playTone(523.25, 0.1, t, 0.08); // C5
  playTone(659.25, 0.1, t + 0.08, 0.08); // E5
  playTone(783.99, 0.2, t + 0.16, 0.1); // G5
}

export function playSpeedBoost() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(950, t + 0.25);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

export function playSlowMotion() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.4);
}

export function playObstacleHit() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  playTone(110, 0.16, t, 0.2, 'sawtooth');
  playTone(82, 0.2, t + 0.06, 0.22, 'sawtooth');
}

export function playVictoryFanfare() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, idx) => {
    playTone(freq, 0.12, t + idx * 0.1, 0.1, 'square');
  });
  playTone(659.25, 0.45, t + 0.45, 0.14, 'square');
}

function getMusicGain(ctx: AudioContext): GainNode {
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(isMusicMuted ? 0 : 1.0, ctx.currentTime);
    musicGain.connect(ctx.destination);
  }
  return musicGain;
}

function playTone(
  freq: number,
  duration: number,
  startTime: number,
  amp = 0.08,
  type: OscillatorType = 'square',
  dest?: AudioNode
) {
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(amp, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(dest || ac.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// Chiptune background racing arpeggio
const RACING_ARPEGGIO = [0, 4, 7, 12, 7, 4, 0, -5];

function scheduleMusic() {
  if (!ac || isMusicMuted) return;
  const mGain = getMusicGain(ac);
  // Dynamic tempo scaled with car speed
  const baseBPM = 136 * tempoFactor;
  const beatDuration = 60 / baseBPM / 2;

  while (nextBeatTime < ac.currentTime + 0.16) {
    const semitone = RACING_ARPEGGIO[beatIndex % 8];
    const freq = 261.63 * Math.pow(2, semitone / 12);
    // Punchy, louder lead arpeggio (boosted volume)
    playTone(freq, 0.09, nextBeatTime, 0.11, 'square', mGain);
    // Driving retro bass pulse (boosted volume)
    if (beatIndex % 2 === 0) {
      const bassFreq = 65.41 * (beatIndex % 16 < 8 ? 1 : 1.334);
      playTone(bassFreq, 0.18, nextBeatTime, 0.17, 'triangle', mGain);
    }
    // Upbeat 8-bit hi-hat & snare rhythm
    if (beatIndex % 4 === 2) {
      playNoise(0.035, 'highpass', 3200, 1.2, 0.065, nextBeatTime, mGain);
    } else if (beatIndex % 2 === 1) {
      playNoise(0.018, 'highpass', 5500, 1.8, 0.035, nextBeatTime, mGain);
    }
    nextBeatTime += beatDuration;
    beatIndex++;
  }
}

export function startMusic() {
  if (isMusicMuted) return;
  const ctx = getAudioContext();
  stopMusic();
  nextBeatTime = ctx.currentTime + 0.05;
  beatIndex = 0;
  musicTimer = window.setInterval(scheduleMusic, 35);
}

export function stopMusic() {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// Speech Synthesis Engine
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeoutId: number | null = null;

// Pre-warm voices list on supported browsers
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  } catch {
    // ignore
  }
}

export function speakWord(word: string, delayMs = 200) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (speechTimeoutId !== null) {
      window.clearTimeout(speechTimeoutId);
      speechTimeoutId = null;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    speechTimeoutId = window.setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(word.toLowerCase());
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // Clear, measured pace for young phonics learners
        utterance.pitch = 1.05; // Friendly and upbeat
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const preferredVoice = voices.find(v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel') || v.name.includes('Victoria'))
          ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        activeUtterance = utterance;
        utterance.onend = () => {
          if (activeUtterance === utterance) activeUtterance = null;
        };
        utterance.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('SpeechSynthesis error:', e.error);
          }
          if (activeUtterance === utterance) activeUtterance = null;
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('speakWord error:', err);
      }
    }, Math.max(40, delayMs));
  } catch (err) {
    console.warn('Speech synthesis initialization error:', err);
  }
}
