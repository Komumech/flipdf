// Synthetic page-turn paper sound using Web Audio API
// Lightweight, instant, requires no external sound assets or network requests

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playPageTurnSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 0.16;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate gentle paper swoosh noise
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const envelope = Math.sin(progress * Math.PI);
      const whiteNoise = Math.random() * 2 - 1;
      data[i] = whiteNoise * envelope * 0.15;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to paper rustle frequency
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
  } catch {
    // Fail silently if browser blocks autoplay before user gesture
  }
}
