const STORAGE_KEY = 'kot-vreditel:muted';

let ctx: AudioContext | null = null;
let muted = localStorage.getItem(STORAGE_KEY) === '1';

function context(): AudioContext | null {
  if (muted) return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): boolean {
  muted = !muted;
  localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  if (muted && ctx) {
    void ctx.suspend();
  } else if (!muted && ctx) {
    void ctx.resume();
  }
  return muted;
}

/** Browsers keep the context suspended until a real user gesture happens. */
export function unlock(): void {
  const ac = context();
  if (ac && ac.state === 'suspended') void ac.resume();
}

type ToneOptions = {
  type?: OscillatorType;
  from: number;
  to?: number;
  duration: number;
  gain?: number;
  delay?: number;
};

function tone({ type = 'sine', from, to, duration, gain = 0.2, delay = 0 }: ToneOptions): void {
  const ac = context();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration: number, gain = 0.18, highpass = 700): void {
  const ac = context();
  if (!ac) return;
  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const amp = ac.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start();
}

export const sfx = {
  swipe(): void {
    tone({ type: 'triangle', from: 620, to: 240, duration: 0.09, gain: 0.12 });
  },
  drop(): void {
    tone({ type: 'sine', from: 180, to: 55, duration: 0.22, gain: 0.28 });
    noise(0.26, 0.12, 1200);
  },
  jackpot(): void {
    [523, 659, 784, 1047].forEach((freq, i) => {
      tone({ type: 'triangle', from: freq, duration: 0.14, gain: 0.16, delay: i * 0.07 });
    });
  },
  combo(step: number): void {
    tone({ type: 'square', from: 440 + step * 90, duration: 0.09, gain: 0.09 });
  },
  caught(): void {
    tone({ type: 'sawtooth', from: 380, to: 90, duration: 0.42, gain: 0.2 });
    noise(0.3, 0.14, 400);
  },
  suspicious(): void {
    tone({ type: 'sine', from: 880, duration: 0.07, gain: 0.07 });
    tone({ type: 'sine', from: 1180, duration: 0.07, gain: 0.07, delay: 0.09 });
  },
  tick(): void {
    tone({ type: 'square', from: 1400, duration: 0.04, gain: 0.05 });
  },
  gameOver(): void {
    [392, 330, 262].forEach((freq, i) => {
      tone({ type: 'triangle', from: freq, duration: 0.3, gain: 0.16, delay: i * 0.16 });
    });
  },
};
