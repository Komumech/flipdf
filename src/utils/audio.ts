// Audio Management for FlipDF
// Supports Web Audio & fallback flip.mp3 for page turns,
// ambient background synthesizer, custom uploaded BGM,
// and sequential dual-spread narration with pause/resume and natural page-turn delay.

export interface SpreadAudioTrack {
  pageNumber: number;
  audioUrl: string;
}

let audioContext: AudioContext | null = null;
let flipSoundBuffer: AudioBuffer | null = null;
let isAudioContextUnlocked = false;

// Background music state
let bgmGainNode: GainNode | null = null;
let bgmOscillators: { osc: OscillatorNode; lfo: OscillatorNode }[] = [];
let customBgmEl: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

// Preload flip sound into Web Audio Buffer for 0ms latency
export async function initFlipAudio(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx || flipSoundBuffer) return;

  try {
    const b64 = (window as unknown as { FLIP_SOUND_B64?: string }).FLIP_SOUND_B64;
    let arrayBuffer: ArrayBuffer;

    if (b64 && b64.startsWith('data:audio')) {
      const base64Data = b64.split(',')[1];
      const binaryStr = window.atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      const resp = await fetch('/flip.mp3');
      arrayBuffer = await resp.arrayBuffer();
    }

    flipSoundBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn('Could not decode flip sound buffer:', err);
  }
}

// User interaction unlocker
export function unlockAudio(): void {
  if (isAudioContextUnlocked) return;
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  initFlipAudio().catch(() => {});
  isAudioContextUnlocked = true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

/**
 * Plays crisp page turn sound using Web Audio (0ms latency)
 * with HTMLAudioElement clone fallback.
 */
export function playPageTurnSound(volume = 0.65): void {
  try {
    const ctx = getAudioContext();
    if (ctx && flipSoundBuffer) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, volume));
      source.buffer = flipSoundBuffer;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      return;
    }

    // HTMLAudioElement fallback
    const b64 = (window as unknown as { FLIP_SOUND_B64?: string }).FLIP_SOUND_B64;
    const audio = new Audio(b64 || '/flip.mp3');
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
  } catch {
    // Fail silently on restricted autoplay
  }
}

// ==========================================
// BACKGROUND MUSIC (SYNTHESIZER & CUSTOM)
// ==========================================

let customBgmTargetVolume = 0.25;
let customBgmFadeTimer: number | null = null;
const BGM_FADE_DURATION = 2.5; // seconds for smooth fade in & fade out

function clearCustomBgmFadeTimer(): void {
  if (customBgmFadeTimer !== null) {
    window.clearInterval(customBgmFadeTimer);
    customBgmFadeTimer = null;
  }
}

function updateCustomBgmFade(): void {
  if (!customBgmEl || customBgmEl.paused) return;
  const dur = customBgmEl.duration;
  if (!dur || isNaN(dur) || dur <= 0) return;

  const fadeDur = Math.min(BGM_FADE_DURATION, dur / 3);
  const ct = customBgmEl.currentTime;

  // When reaching the end edge, loop back cleanly
  if (ct >= dur - 0.08) {
    customBgmEl.currentTime = 0;
    customBgmEl.volume = 0;
    customBgmEl.play().catch(() => {});
    return;
  }

  if (ct < fadeDur) {
    // Fade in: from 0 up to customBgmTargetVolume
    const factor = Math.max(0, Math.min(1, ct / fadeDur));
    customBgmEl.volume = Math.max(0, Math.min(1, customBgmTargetVolume * factor));
  } else if (dur - ct <= fadeDur) {
    // Fade out: from customBgmTargetVolume down to 0
    const remaining = Math.max(0, dur - ct);
    const factor = Math.max(0, Math.min(1, remaining / fadeDur));
    customBgmEl.volume = Math.max(0, Math.min(1, customBgmTargetVolume * factor));
  } else {
    // Steady playback
    customBgmEl.volume = customBgmTargetVolume;
  }
}

export function startBgm(track: 'none' | 'ambient' | 'lofi' | 'zen' | 'custom', volume = 0.25, customAudioUrl?: string): void {
  stopBgm();
  if (track === 'none') return;
  customBgmTargetVolume = Math.max(0, Math.min(1, volume));

  if (track === 'custom' && customAudioUrl) {
    try {
      customBgmEl = new Audio(customAudioUrl);
      customBgmEl.loop = false; // We handle loop seamlessly with fade-out and fade-in
      customBgmEl.volume = 0; // Starts at 0 to smoothly fade in

      customBgmEl.onended = () => {
        if (!customBgmEl) return;
        customBgmEl.currentTime = 0;
        customBgmEl.volume = 0;
        customBgmEl.play().catch(() => {});
      };

      customBgmEl.ontimeupdate = updateCustomBgmFade;
      customBgmFadeTimer = window.setInterval(updateCustomBgmFade, 50);

      customBgmEl.play().catch(() => {});
    } catch {}
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    bgmGainNode = ctx.createGain();
    bgmGainNode.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
    bgmGainNode.connect(ctx.destination);

    let freqs = [220, 277.18, 329.63, 440]; // A Major 7 (Ambient)
    if (track === 'lofi') freqs = [174.61, 220, 261.63, 329.63]; // Fmaj7 (Lo-Fi)
    if (track === 'zen') freqs = [130.81, 196.0, 261.63, 392.0]; // Deep Zen harmonics

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
  clearCustomBgmFadeTimer();
  if (customBgmEl) {
    customBgmEl.pause();
    customBgmEl.currentTime = 0;
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
  customBgmTargetVolume = Math.max(0, Math.min(1, volume));
  if (bgmGainNode && audioContext) {
    bgmGainNode.gain.setValueAtTime(volume * 0.12, audioContext.currentTime);
  }
  if (customBgmEl) {
    updateCustomBgmFade();
  }
}

// ==========================================
// SEQUENTIAL DUAL-SPREAD NARRATION MANAGER
// WITH RESUME & NATURAL FLIP DELAY SUPPORT
// ==========================================

class SpreadNarrationManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentQueue: SpreadAudioTrack[] = [];
  private currentTrackIndex = 0;
  private currentSpreadKey = '';
  private pendingStartTimer: number | null = null;
  private stateChangeListeners: ((isPlaying: boolean, activePage: number | null) => void)[] = [];

  public onStateChange(listener: (isPlaying: boolean, activePage: number | null) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notify(isPlaying: boolean): void {
    const activePage = isPlaying && this.currentQueue[this.currentTrackIndex]
      ? this.currentQueue[this.currentTrackIndex].pageNumber
      : null;
    this.stateChangeListeners.forEach((l) => l(isPlaying, activePage));
  }

  public isPlaying(): boolean {
    return Boolean(this.currentAudio && !this.currentAudio.paused);
  }

  public isPaused(): boolean {
    return Boolean(this.currentAudio && this.currentAudio.paused && this.currentAudio.currentTime > 0);
  }

  public getActivePage(): number | null {
    if (this.currentAudio && this.currentQueue[this.currentTrackIndex]) {
      return this.currentQueue[this.currentTrackIndex].pageNumber;
    }
    return null;
  }

  private clearPendingTimer(): void {
    if (this.pendingStartTimer !== null) {
      window.clearTimeout(this.pendingStartTimer);
      this.pendingStartTimer = null;
    }
  }

  /**
   * Toggles playback for the current spread.
   * - If already playing on this spread, PAUSES and remembers exact timestamp.
   * - If paused on this spread, RESUMES from where it stopped.
   * - If starting fresh, starts with optional natural settle delay.
   */
  public toggle(tracks: SpreadAudioTrack[], spreadKey: string, startDelayMs = 0): void {
    this.clearPendingTimer();
    if (tracks.length === 0) return;

    // Same spread: toggle play/pause and resume
    if (this.currentAudio && this.currentSpreadKey === spreadKey) {
      if (!this.currentAudio.paused) {
        this.currentAudio.pause();
        this.notify(false);
        return;
      } else {
        // Resume from where user paused!
        this.currentAudio.play().then(() => {
          this.notify(true);
        }).catch(() => {
          this.notify(false);
        });
        return;
      }
    }

    // New spread or fresh start
    this.stop();
    this.currentQueue = [...tracks];
    this.currentSpreadKey = spreadKey;
    this.currentTrackIndex = 0;
    this.playTrackAtIndex(0, 0, startDelayMs);
  }

  private playTrackAtIndex(index: number, startTime = 0, delayMs = 0): void {
    this.clearPendingTimer();
    if (index >= this.currentQueue.length) {
      this.stop();
      return;
    }

    this.currentTrackIndex = index;
    const track = this.currentQueue[index];

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    const audio = new Audio(track.audioUrl);
    if (startTime > 0) {
      audio.currentTime = startTime;
    }

    audio.onended = () => {
      // Natural 350ms breath between pages on a dual spread
      if (this.currentTrackIndex + 1 < this.currentQueue.length) {
        this.playTrackAtIndex(this.currentTrackIndex + 1, 0, 350);
      } else {
        this.stop();
      }
    };

    audio.onerror = () => {
      if (this.currentTrackIndex + 1 < this.currentQueue.length) {
        this.playTrackAtIndex(this.currentTrackIndex + 1, 0, 350);
      } else {
        this.stop();
      }
    };

    const startPlayback = () => {
      this.pendingStartTimer = null;
      this.currentAudio = audio;
      audio.play().then(() => {
        this.notify(true);
      }).catch(() => {
        this.notify(false);
      });
    };

    if (delayMs > 0) {
      this.pendingStartTimer = window.setTimeout(startPlayback, delayMs);
    } else {
      startPlayback();
    }
  }

  /**
   * Called when the reader turns the page to a new spread.
   * Cancels any pending timers and stops the previous spread cleanly.
   */
  public onSpreadChanged(newSpreadKey: string): void {
    if (this.currentSpreadKey !== newSpreadKey) {
      this.clearPendingTimer();
      this.stop();
    }
  }

  public stop(): void {
    this.clearPendingTimer();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.currentQueue = [];
    this.currentTrackIndex = 0;
    this.currentSpreadKey = '';
    this.notify(false);
  }
}

export const spreadNarration = new SpreadNarrationManager();
