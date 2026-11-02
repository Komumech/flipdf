import { FlipbookPage, DocumentInfo, FlipbookSettings } from '../types';

export function exportStandaloneFlipbook(
  info: DocumentInfo,
  pages: FlipbookPage[],
  settings: FlipbookSettings
): string {
  const pagesData = pages.map((p) => p.dataUrl);
  const pageAudioData = pages.map((p) => p.audioUrl || null);
  const flipAudioB64 = (typeof window !== 'undefined' && (window as unknown as { FLIP_SOUND_B64?: string }).FLIP_SOUND_B64) || 'flip.mp3';
  const customBgmB64 = settings.customAudioUrl || null;

  const standaloneHTML = `<!DOCTYPE html>
<html lang="en" class="h-full select-none">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${info.title} - FlipDF Interactive Book</title>
  <script src="https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      background-color: #f7f7f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      touch-action: none;
    }
    .page-stage {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      touch-action: none;
      padding: 0.5rem 0.5rem 4rem 0.5rem;
    }
    .page-flip-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: auto;
      position: relative;
    }
    .stpageflip-page, .page-flip-container canvas {
      background-color: #ffffff !important;
    }
    .stpageflip-page {
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      transform-style: preserve-3d;
      isolation: isolate;
      background-image: linear-gradient(90deg, rgba(112,83,56,0.05), transparent 8%, transparent 92%, rgba(112,83,56,0.05)) !important;
    }
    .stpageflip-page::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, rgba(63,45,31,0.08) 0%, rgba(63,45,31,0.02) 3%, transparent 12%, transparent 88%, rgba(63,45,31,0.02) 97%, rgba(63,45,31,0.08) 100%);
      pointer-events: none;
      z-index: 10;
    }
    /* Floating Bottom Action Bar - Single-Line Guarantee */
    .floating-bar {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 9999px;
      padding: 0.45rem 0.85rem;
      box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.1);
      z-index: 50;
      white-space: nowrap !important;
      max-width: calc(100vw - 1.5rem);
    }
    .floating-bar * {
      white-space: nowrap !important;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      outline: none;
      cursor: pointer;
      padding: 0.55rem;
      min-width: 38px;
      min-height: 38px;
      border-radius: 9999px;
      color: #334155;
      transition: all 0.15s ease;
      white-space: nowrap !important;
    }
    .btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .page-indicator {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      padding: 0 0.6rem;
      font-variant-numeric: tabular-nums;
      white-space: nowrap !important;
      display: inline-block;
      letter-spacing: -0.01em;
      user-select: none;
    }
    /* Side Arrow Turn Buttons - Visible only on large screens */
    .turn-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #1e293b;
      z-index: 30;
      transition: all 0.15s ease;
    }
    .turn-btn:hover { background: #ffffff; box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
    .turn-btn:active { transform: translateY(-50%) scale(0.95); }
    .turn-btn-prev { left: 1.5rem; }
    .turn-btn-next { right: 1.5rem; }

    /* On mobile and tablet, completely hide side buttons so they never block or overlap page text */
    @media (max-width: 768px) {
      .turn-btn {
        display: none !important;
      }
      .page-stage {
        padding: 0.25rem 0.25rem 4.75rem 0.25rem !important;
      }
      .floating-bar {
        bottom: 1rem;
        padding: 0.4rem 0.7rem;
        gap: 0.35rem;
      }
      .btn {
        padding: 0.5rem;
        min-width: 36px;
        min-height: 36px;
      }
      .page-indicator {
        font-size: 0.8rem;
        padding: 0 0.45rem;
      }
    }
  </style>
</head>
<body>

  <div class="page-stage" id="stage-viewport">
    <button class="turn-btn turn-btn-prev" onclick="turnPrev()" aria-label="Previous page">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button class="turn-btn turn-btn-next" onclick="turnNext()" aria-label="Next page">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    <div id="flipbook-root" class="page-flip-container"></div>
  </div>

  <!-- Bottom Floating Reader Bar with strict single-line text -->
  <div class="floating-bar">
    <button class="btn" onclick="turnPrev()" id="btn-prev" title="Previous page">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <span class="page-indicator" id="page-counter">1 / ${pagesData.length}</span>
    <button class="btn" onclick="turnNext()" id="btn-next" title="Next page">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    <div style="width: 1px; height: 18px; background: #e2e8f0; margin: 0 3px;"></div>
    <!-- Sound Toggle -->
    <button class="btn ${settings.soundEnabled ? 'active' : ''}" id="sound-btn" onclick="toggleSound()" title="Toggle Flip Sound">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
    </button>
    <!-- Background Music (Custom uploaded or Synthesizer) -->
    <button class="btn ${settings.bgmTrack !== 'none' ? 'active' : ''}" id="bgm-btn" onclick="toggleBgm()" title="Toggle Background Music">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    </button>
    <!-- Page Narration Toggle with sequential dual-page playback, resume, and natural flip delay -->
    <button class="btn" id="narration-btn" onclick="toggleNarration()" title="Play page audio narration">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>
    </button>
  </div>

  <script>
    const pages = ${JSON.stringify(pagesData)};
    const pageAudios = ${JSON.stringify(pageAudioData)};
    const flipSoundB64 = ${JSON.stringify(flipAudioB64)};
    const customBgmB64 = ${JSON.stringify(customBgmB64)};
    const initialBgmTrack = ${JSON.stringify(settings.bgmTrack || 'none')};
    const docId = ${JSON.stringify(info.id || info.title || 'book')};
    const storageKey = 'flipdf_read_pos_' + encodeURIComponent(docId);
    
    let pageFlipInstance = null;
    let currentPage = 0;
    let soundEnabled = ${settings.soundEnabled};
    let bgmEnabled = false;

    // Sequential dual-spread narration state with resume
    let currentNarrationAudio = null;
    let currentQueue = [];
    let currentTrackIdx = 0;
    let currentSpreadKey = '';
    let pendingStartTimer = null;

    const flipAudio = new Audio(flipSoundB64);
    flipAudio.preload = 'auto';

    function playFlipSound() {
      if (!soundEnabled) return;
      try {
        flipAudio.currentTime = 0;
        flipAudio.volume = 0.65;
        flipAudio.play().catch(function(){});
      } catch(e){}
    }

    // Identifies audio tracks visible on the current screen (left & right on laptop, single on mobile)
    function getVisibleSpreadTracks() {
      const isMobile = window.innerWidth < 768;
      const tracks = [];

      if (isMobile) {
        if (pageAudios[currentPage]) {
          tracks.push({ pageNum: currentPage + 1, url: pageAudios[currentPage] });
        }
      } else {
        // Desktop dual spread: page 0 is standalone cover
        if (currentPage === 0) {
          if (pageAudios[0]) {
            tracks.push({ pageNum: 1, url: pageAudios[0] });
          }
        } else {
          const leftIdx = currentPage % 2 === 0 ? currentPage : currentPage - 1;
          const rightIdx = (leftIdx + 1 < pages.length) ? leftIdx + 1 : null;

          if (leftIdx !== null && pageAudios[leftIdx]) {
            tracks.push({ pageNum: leftIdx + 1, url: pageAudios[leftIdx] });
          }
          if (rightIdx !== null && pageAudios[rightIdx]) {
            tracks.push({ pageNum: rightIdx + 1, url: pageAudios[rightIdx] });
          }
        }
      }
      return tracks;
    }

    function toggleNarration(delayMs) {
      if (pendingStartTimer) {
        clearTimeout(pendingStartTimer);
        pendingStartTimer = null;
      }

      const tracks = getVisibleSpreadTracks();
      const btn = document.getElementById('narration-btn');

      if (tracks.length === 0) {
        if (btn) btn.classList.remove('active');
        return;
      }

      const spreadKey = 'spread_' + currentPage;

      // If already active on this spread: pause/resume without restarting at 0
      if (currentNarrationAudio && currentSpreadKey === spreadKey) {
        if (!currentNarrationAudio.paused) {
          // Pause and retain timestamp
          currentNarrationAudio.pause();
          if (btn) btn.classList.remove('active');
          return;
        } else {
          // Resume from exact timestamp where paused!
          currentNarrationAudio.play().then(function() {
            if (btn) btn.classList.add('active');
          }).catch(function(){});
          return;
        }
      }

      // Fresh start on this spread
      stopNarration();
      currentQueue = tracks;
      currentSpreadKey = spreadKey;
      currentTrackIdx = 0;
      playQueueTrack(0, 0, delayMs || 0);
    }

    function playQueueTrack(idx, startTime, delayMs) {
      const btn = document.getElementById('narration-btn');
      if (idx >= currentQueue.length) {
        stopNarration();
        return;
      }

      currentTrackIdx = idx;
      const track = currentQueue[idx];

      if (currentNarrationAudio) {
        currentNarrationAudio.pause();
        currentNarrationAudio = null;
      }

      const audio = new Audio(track.url);
      if (startTime > 0) {
        audio.currentTime = startTime;
      }

      audio.onended = function() {
        // Natural 350ms breath between pages on a dual spread
        if (currentTrackIdx + 1 < currentQueue.length) {
          playQueueTrack(currentTrackIdx + 1, 0, 350);
        } else {
          stopNarration();
        }
      };

      audio.onerror = function() {
        if (currentTrackIdx + 1 < currentQueue.length) {
          playQueueTrack(currentTrackIdx + 1, 0, 350);
        } else {
          stopNarration();
        }
      };

      const startAction = function() {
        pendingStartTimer = null;
        currentNarrationAudio = audio;
        audio.play().then(function() {
          if (btn) btn.classList.add('active');
        }).catch(function() {
          if (btn) btn.classList.remove('active');
        });
      };

      if (delayMs && delayMs > 0) {
        pendingStartTimer = setTimeout(startAction, delayMs);
      } else {
        startAction();
      }
    }

    function stopNarration() {
      if (pendingStartTimer) {
        clearTimeout(pendingStartTimer);
        pendingStartTimer = null;
      }
      if (currentNarrationAudio) {
        currentNarrationAudio.pause();
        currentNarrationAudio = null;
      }
      currentQueue = [];
      currentTrackIdx = 0;
      currentSpreadKey = '';
      const btn = document.getElementById('narration-btn');
      if (btn) btn.classList.remove('active');
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      document.getElementById('sound-btn')?.classList.toggle('active', soundEnabled);
      if (soundEnabled) playFlipSound();
    }

    // Background music (supports custom uploaded BGM audio file or synthesizer)
    let customBgmAudio = null;
    let audioCtx = null;
    let bgmGain = null;
    let bgmOscs = [];

    function toggleBgm() {
      bgmEnabled = !bgmEnabled;
      const btn = document.getElementById('bgm-btn');
      if (bgmEnabled) {
        if (btn) btn.classList.add('active');
        if (customBgmB64) {
          playCustomBgm();
        } else {
          startSynthesizerBgm();
        }
      } else {
        if (btn) btn.classList.remove('active');
        stopBgm();
      }
    }

    let customBgmAudio = null;
    let customBgmFadeTimer = null;
    const BGM_FADE_DURATION = 2.5;
    const BGM_TARGET_VOLUME = 0.28;

    function playCustomBgm() {
      stopSynthesizerBgm();
      if (customBgmAudio) {
        customBgmAudio.pause();
        customBgmAudio = null;
      }
      if (customBgmFadeTimer) {
        clearInterval(customBgmFadeTimer);
        customBgmFadeTimer = null;
      }
      try {
        customBgmAudio = new Audio(customBgmB64);
        customBgmAudio.loop = false; // Controlled loop with fade-out and fade-in
        customBgmAudio.volume = 0; // Starts at 0 to smoothly fade in

        function updateFade() {
          if (!customBgmAudio || customBgmAudio.paused) return;
          const dur = customBgmAudio.duration;
          if (!dur || isNaN(dur) || dur <= 0) return;
          const fadeDur = Math.min(BGM_FADE_DURATION, dur / 3);
          const ct = customBgmAudio.currentTime;

          // When reaching the end boundary, loop back to 0
          if (ct >= dur - 0.08) {
            customBgmAudio.currentTime = 0;
            customBgmAudio.volume = 0;
            customBgmAudio.play().catch(function(){});
            return;
          }

          if (ct < fadeDur) {
            // Fade-in phase
            const factor = Math.max(0, Math.min(1, ct / fadeDur));
            customBgmAudio.volume = Math.max(0, Math.min(1, BGM_TARGET_VOLUME * factor));
          } else if (dur - ct <= fadeDur) {
            // Fade-out phase
            const remaining = Math.max(0, dur - ct);
            const factor = Math.max(0, Math.min(1, remaining / fadeDur));
            customBgmAudio.volume = Math.max(0, Math.min(1, BGM_TARGET_VOLUME * factor));
          } else {
            // Steady volume
            customBgmAudio.volume = BGM_TARGET_VOLUME;
          }
        }

        customBgmAudio.onended = function() {
          if (!customBgmAudio) return;
          customBgmAudio.currentTime = 0;
          customBgmAudio.volume = 0;
          customBgmAudio.play().catch(function(){});
        };

        customBgmAudio.ontimeupdate = updateFade;
        customBgmFadeTimer = setInterval(updateFade, 50);

        customBgmAudio.play().catch(function(){});
      } catch(e){}
    }

    function stopBgm() {
      if (customBgmFadeTimer) {
        clearInterval(customBgmFadeTimer);
        customBgmFadeTimer = null;
      }
      if (customBgmAudio) {
        customBgmAudio.pause();
        customBgmAudio.currentTime = 0;
        customBgmAudio = null;
      }
      stopSynthesizerBgm();
    }

    function startSynthesizerBgm() {
      stopSynthesizerBgm();
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx();
        bgmGain = audioCtx.createGain();
        bgmGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        bgmGain.connect(audioCtx.destination);
        [220, 277.18, 329.63, 440].forEach(function(freq) {
          const osc = audioCtx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          osc.connect(bgmGain);
          osc.start();
          bgmOscs.push(osc);
        });
      } catch(e){}
    }

    function stopSynthesizerBgm() {
      bgmOscs.forEach(function(o){ try{ o.stop(); }catch(e){} });
      bgmOscs = [];
    }

    function turnPrev() { if (pageFlipInstance) pageFlipInstance.flipPrev(); }
    function turnNext() { if (pageFlipInstance) pageFlipInstance.flipNext(); }

    // Touch & swipe anywhere gesture handler (effortless thumb swipe on mobile)
    function attachTouchSwipe(container) {
      let startX = 0, startY = 0, startTime = 0, isTouch = false;
      container.addEventListener('touchstart', function(e) {
        if (e.target.closest('button, .floating-bar')) return;
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
        isTouch = true;
      }, { passive: true });

      container.addEventListener('touchend', function(e) {
        if (!isTouch) return;
        isTouch = false;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        const dt = Date.now() - startTime;
        if (Math.abs(dx) > Math.abs(dy) * 0.85 && (Math.abs(dx) >= 18 || (Math.abs(dx) >= 12 && dt < 350))) {
          if (dx < 0) turnNext();
          else turnPrev();
          return;
        }
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 400) {
          const rect = container.getBoundingClientRect();
          const tapX = e.changedTouches[0].clientX - rect.left;
          if (tapX < rect.width * 0.35) turnPrev();
          else if (tapX > rect.width * 0.65) turnNext();
        }
      }, { passive: true });
    }

    window.onload = function() {
      const PageFlipClass = window.St?.PageFlip || window.PageFlip?.PageFlip || window.PageFlip;
      if (!PageFlipClass) return;

      const isMobile = window.innerWidth < 768;
      const stage = document.getElementById('stage-viewport');

      // Fill mobile screen generously so text is large and clear
      const availW = isMobile ? Math.max(300, window.innerWidth - 12) : Math.max(300, stage.clientWidth - 48);
      const availH = isMobile ? Math.max(400, window.innerHeight - 75) : Math.max(360, stage.clientHeight - 64);

      const firstImg = new Image();
      firstImg.onload = function() {
        const aspect = (firstImg.width && firstImg.height) ? (firstImg.width / firstImg.height) : (1 / 1.38);
        let pageW, pageH;
        if (isMobile) {
          pageW = Math.floor(availW);
          pageH = Math.floor(pageW / aspect);
          if (pageH > availH) {
            pageH = availH;
            pageW = Math.floor(pageH * aspect);
          }
        } else {
          pageH = Math.min(availH, 800);
          pageW = Math.floor(pageH * aspect);
          if (pageW * 2 > availW) {
            pageW = Math.floor(availW / 2);
            pageH = Math.floor(pageW / aspect);
          }
        }

        pageFlipInstance = new PageFlipClass(document.getElementById('flipbook-root'), {
          width: pageW,
          height: pageH,
          size: "fixed",
          drawShadow: true,
          maxShadowOpacity: isMobile ? 0.2 : 0.3,
          flippingTime: isMobile ? 320 : 450,
          swipeDistance: isMobile ? 12 : 16,
          usePortrait: isMobile,
          startZIndex: 0,
          showCover: !isMobile,
          useMouseEvents: true,
          clickEventForward: true,
          mobileScrollSupport: false
        });

        const els = pages.map(function(src) {
          const wrap = document.createElement('div');
          wrap.className = 'stpageflip-page';
          wrap.setAttribute('data-density', 'soft');
          const img = document.createElement('img');
          img.src = src;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          wrap.appendChild(img);
          return wrap;
        });

        pageFlipInstance.loadFromHTML(els);
        attachTouchSwipe(document.getElementById('stage-viewport'));

        // Restore saved reading position from localStorage on page reload
        try {
          const savedPos = localStorage.getItem(storageKey);
          if (savedPos !== null) {
            const p = parseInt(savedPos, 10);
            if (!isNaN(p) && p > 0 && p < pages.length) {
              setTimeout(function() {
                try {
                  pageFlipInstance.flip(p, 'instant');
                } catch(e) {
                  try { pageFlipInstance.turnToPage(p); } catch(err){}
                }
              }, 120);
            }
          }
        } catch(e){}

        pageFlipInstance.on('flip', function(e) {
          currentPage = e.data;
          try {
            localStorage.setItem(storageKey, String(currentPage));
          } catch(e){}

          document.getElementById('page-counter').innerText = (currentPage + 1) + ' / ' + pages.length;
          document.getElementById('btn-prev').disabled = currentPage <= 0;
          document.getElementById('btn-next').disabled = currentPage >= pages.length - 1;
          playFlipSound();

          const newSpreadKey = 'spread_' + currentPage;
          if (currentSpreadKey !== newSpreadKey) {
            stopNarration();
          }
        });
      };
      firstImg.src = pages[0];

      // Unlock audio on initial user touch or click
      const unlock = function() {
        try {
          flipAudio.volume = 0.65;
          flipAudio.play().then(function(){
            flipAudio.pause();
            flipAudio.currentTime = 0;
          }).catch(function(){});
        } catch(e){}
      };
      document.addEventListener('touchstart', unlock, { once: true });
      document.addEventListener('click', unlock, { once: true });
    };
  </script>
</body>
</html>`;

  const fileName = `${info.title.replace(/\s+/g, '_')}_flipdf_book.html`;
  const blob = new Blob([standaloneHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return fileName;
}
