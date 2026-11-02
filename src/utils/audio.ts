// Audio Management for FlipDF
// Supports flip.mp3 for page turns, Web Audio synthesizer for ambient background music,
// and narration audio playback.

let flipAudioEl: HTMLAudioElement | null = null;
let bgmAudioCtx: AudioContext | null = null;
let bgmOscillators: { osc: OscillatorNode; lfo: OscillatorNode }[] = [];
let bgmGainNode: GainNode | null = null;
let customBgmEl: HTMLAudioElement | null = null;
let narrationEl: HTMLAudioElement | null = null;

// Initialize or get flip audio
function getFlipAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!flipAudioEl) {
    const b64 = (window as unknown as { FLIP_SOUND_B64?: string }).FLIP_SOUND_B64;
    flipAudioEl = new Audio(b64 || '/flip.mp3');
    flipAudioEl.preload = 'auto';
  }
  return flipAudioEl;
}

export function playPageTurnSound(volume = 0.6): void {
  try {
    const audio = getFlipAudio();
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  } catch {
    // Fail silently on restricted autoplay
  }
}

// Background Music Synthesizer
function getBgmContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!bgmAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      bgmAudioCtx = new AudioContextClass();
    }
  }
  if (bgmAudioCtx && bgmAudioCtx.state === 'suspended') {
    bgmAudioCtx.resume().catch(() => {});
  }
  return bgmAudioCtx;
}

export function startBgm(track: 'ambient' | 'lofi' | 'zen' | 'custom', volume = 0.3, customAudioUrl?: string): void {
  stopBgm();
  if (track === 'custom' && customAudioUrl) {
    try {
      customBgmEl = new Audio(customAudioUrl);
      customBgmEl.loop = true;
      customBgmEl.volume = volume;
      customBgmEl.play().catch(() => {});
    } catch {}
    return;
  }

  try {
    const ctx = getBgmContext();
    if (!ctx) return;

    bgmGainNode = ctx.createGain();
    bgmGainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    bgmGainNode.connect(ctx.destination);

    let freqs = [220, 277.18, 329.63, 440]; // A Major 7 (Ambient)
    if (track === 'lofi') freqs = [174.61, 220, 261.63, 329.63]; // Fmaj7 (Lo-Fi)
    if (track === 'zen') freqs = [130.81, 196.00, 261.63, 392.00]; // Deep Zen harmonics

    bgmOscillators = freqs.map((freq) => {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = track === 'zen' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      lfo.frequency.setValueAtTime(0.2 + Math.random() * 0.1, ctx.currentTime);
      lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
      lfo.connect(osc.frequency);
      lfo.start();

      osc.connect(bgmGainNode!);
      osc.start();
      return { osc, lfo };
    });
  } catch {}
}

export function stopBgm(): void {
  if (customBgmEl) {
    customBgmEl.pause();
    customBgmEl = null;
  }
  if (bgmOscillators.length) {
    bgmOscillators.forEach(({ osc, lfo }) => {
      try {
        osc.stop();
        lfo.stop();
      } catch {}
    });
    bgmOscillators = [];
  }
}

export function setBgmVolume(volume: number): void {
  if (bgmGainNode && bgmAudioCtx) {
    bgmGainNode.gain.setValueAtTime(volume * 0.15, bgmAudioCtx.currentTime);
  }
  if (customBgmEl) {
    customBgmEl.volume = volume;
  }
}

// Page Narration Playback
export function playPageNarration(audioUrl: string, onEnded?: () => void): HTMLAudioElement {
  stopPageNarration();
  narrationEl = new Audio(audioUrl);
  if (onEnded) {
    narrationEl.onended = onEnded;
  }
  narrationEl.play().catch(() => {});
  return narrationEl;
}

export function stopPageNarration(): void {
  if (narrationEl) {
    narrationEl.pause();
    narrationEl.currentTime = 0;
    narrationEl = null;
  }
}

export function isNarrationPlaying(): boolean {
  return Boolean(narrationEl && !narrationEl.paused);
}
