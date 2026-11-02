import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { FlipbookViewer } from './components/FlipbookViewer';
import { ControlBar } from './components/ControlBar';
import { ThumbnailsDrawer } from './components/ThumbnailsDrawer';
import { UploadModal } from './components/UploadModal';
import { PageAudioDrawer } from './components/PageAudioDrawer';
import { BgmModal } from './components/BgmModal';
import { ExportCompletionModal } from './components/ExportCompletionModal';
import { SAMPLE_DOCUMENTS } from './utils/sampleDocuments';
import {
  playPageTurnSound,
  startBgm,
  stopBgm,
  setBgmVolume as setBgmVolumeUtil,
  spreadNarration,
  SpreadAudioTrack,
  unlockAudio,
} from './utils/audio';
import { exportStandaloneFlipbook } from './utils/exportBook';
import { saveWorkspace, loadWorkspace } from './utils/storage';
import { FlipbookPage, DocumentInfo, ViewMode, BgmTrack } from './types';

export default function App() {
  const defaultSample = SAMPLE_DOCUMENTS[0];
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({
    id: defaultSample.id,
    title: defaultSample.title,
    totalPages: defaultSample.totalPages,
    sourceType: 'sample',
  });
  const [pages, setPages] = useState<FlipbookPage[]>(defaultSample.pages);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Settings & Audio
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bgmTrack, setBgmTrack] = useState<BgmTrack>('none');
  const [customBgmUrl, setCustomBgmUrl] = useState<string | undefined>(undefined);
  const [customBgmName, setCustomBgmName] = useState<string | undefined>(undefined);
  const [bgmVolume, setBgmVolume] = useState<number>(0.25);
  const [isNarrationPlayingState, setIsNarrationPlayingState] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWorkspaceLoaded, setIsWorkspaceLoaded] = useState<boolean>(false);

  // Modals & Panels (none are pinned, all render as on-demand slide-overs/drawers)
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);
  const [isPageAudioOpen, setIsPageAudioOpen] = useState<boolean>(false);
  const [isBgmModalOpen, setIsBgmModalOpen] = useState<boolean>(false);
  const [isExportCompleteOpen, setIsExportCompleteOpen] = useState<boolean>(false);
  const [exportedFileName, setExportedFileName] = useState<string>('');

  // Viewport responsive dual-spread detection
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDualSpread =
    viewMode === 'dual'
      ? true
      : viewMode === 'single'
      ? false
      : screenWidth >= 768; // auto mode: single-page on mobile (<768px), dual on tablet/desktop

  // Restore saved workspace & reading position on startup from IndexedDB
  useEffect(() => {
    loadWorkspace()
      .then((saved) => {
        if (saved && saved.pages && saved.pages.length > 0) {
          setDocumentInfo(saved.documentInfo);
          setPages(saved.pages);
          const clamped = Math.max(1, Math.min(saved.pages.length, saved.currentPage || 1));
          setCurrentPage(clamped);
          setViewMode(saved.viewMode || 'auto');
          setSoundEnabled(saved.soundEnabled !== false);
          setBgmTrack(saved.bgmTrack || 'none');
          setZoom(saved.zoom || 1.0);

          if (saved.customBgmUrl) {
            setCustomBgmUrl(saved.customBgmUrl);
            setCustomBgmName(saved.customBgmName);
          }

          if (saved.bgmTrack && saved.bgmTrack !== 'none') {
            startBgm(saved.bgmTrack, 0.25, saved.customBgmUrl);
          }
        }
        setIsWorkspaceLoaded(true);
      })
      .catch(() => {
        setIsWorkspaceLoaded(true);
      });
  }, []);

  // Auto-save changes to IndexedDB (debounced) so reloading keeps all pages, audios & settings
  useEffect(() => {
    if (!isWorkspaceLoaded) return;
    const timer = setTimeout(() => {
      saveWorkspace({
        documentInfo,
        pages,
        currentPage,
        viewMode,
        soundEnabled,
        bgmTrack,
        customBgmUrl,
        customBgmName,
        zoom,
        savedAt: Date.now(),
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    documentInfo,
    pages,
    currentPage,
    viewMode,
    soundEnabled,
    bgmTrack,
    customBgmUrl,
    customBgmName,
    zoom,
    isWorkspaceLoaded,
  ]);

  // Sound handler for flipping pages
  const handlePlaySound = useCallback(() => {
    if (soundEnabled) {
      playPageTurnSound();
    }
  }, [soundEnabled]);

  // Compute active pages on screen for the current spread
  const { leftPageNum, rightPageNum } = useMemo(() => {
    if (isDualSpread) {
      if (currentPage === 1) {
        return { leftPageNum: null, rightPageNum: 1 };
      }
      const left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
      const right = left + 1 <= pages.length ? left + 1 : null;
      return { leftPageNum: left, rightPageNum: right };
    }
    return { leftPageNum: null, rightPageNum: currentPage };
  }, [isDualSpread, currentPage, pages.length]);

  const currentSpreadKey = useMemo(() => {
    return isDualSpread
      ? `dual_${leftPageNum || 'cover'}_${rightPageNum || 'end'}`
      : `single_${currentPage}`;
  }, [isDualSpread, leftPageNum, rightPageNum, currentPage]);

  // Gather audio tracks present on the current visible spread (left and/or right page)
  const currentSpreadTracks: SpreadAudioTrack[] = useMemo(() => {
    const visibleNums = isDualSpread
      ? [leftPageNum, rightPageNum].filter((n): n is number => n !== null && n >= 1 && n <= pages.length)
      : [currentPage];

    return visibleNums
      .map((pNum) => {
        const pageObj = pages.find((p) => p.pageNumber === pNum);
        return pageObj && pageObj.audioUrl ? { pageNumber: pNum, audioUrl: pageObj.audioUrl } : null;
      })
      .filter((t): t is SpreadAudioTrack => t !== null);
  }, [isDualSpread, leftPageNum, rightPageNum, currentPage, pages]);

  const hasCurrentSpreadNarration = currentSpreadTracks.length > 0;

  // Listen to spread narration state changes
  useEffect(() => {
    const unsubscribe = spreadNarration.onStateChange((isPlaying) => {
      setIsNarrationPlayingState(isPlaying);
    });
    return unsubscribe;
  }, []);

  // Page change handler
  const handlePageChange = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(pages.length, newPage));
      if (clamped !== currentPage) {
        handlePlaySound();
        setCurrentPage(clamped);

        // Notify narration manager of the new spread
        const nextLeft = isDualSpread ? (clamped === 1 ? null : clamped % 2 === 0 ? clamped : clamped - 1) : null;
        const nextRight = isDualSpread ? (clamped === 1 ? 1 : ((nextLeft || 0) + 1 <= pages.length ? (nextLeft || 0) + 1 : null)) : clamped;
        const nextSpreadKey = isDualSpread ? `dual_${nextLeft || 'cover'}_${nextRight || 'end'}` : `single_${clamped}`;

        spreadNarration.onSpreadChanged(nextSpreadKey);
      }
    },
    [pages.length, currentPage, handlePlaySound, isDualSpread]
  );

  // Background music selection & custom upload handler
  const handleSelectBgmTrack = (track: BgmTrack, customUrl?: string, customName?: string) => {
    unlockAudio();
    setBgmTrack(track);
    if (customUrl) {
      setCustomBgmUrl(customUrl);
    }
    if (customName) {
      setCustomBgmName(customName);
    }
    startBgm(track, bgmVolume, customUrl || customBgmUrl);
  };

  const handleChangeBgmVolume = (vol: number) => {
    setBgmVolume(vol);
    setBgmVolumeUtil(vol);
  };

  const handleRemoveCustomBgm = () => {
    setCustomBgmUrl(undefined);
    setCustomBgmName(undefined);
    if (bgmTrack === 'custom') {
      setBgmTrack('none');
      stopBgm();
    }
  };

  // Narration playback toggle with resume support:
  // - On laptop dual-spread: if left has no audio, right plays!
  // - If both have audio, left plays, then right plays automatically!
  // - If paused and resumed, it resumes from the EXACT stopped time!
  const handleToggleNarration = () => {
    unlockAudio();
    spreadNarration.toggle(currentSpreadTracks, currentSpreadKey, 0);
  };

  // Page audio recording & batch upload updates
  const handleUpdatePageAudio = (pageNumber: number, audioUrl: string | undefined) => {
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, audioUrl } : p))
    );
  };

  const handleBatchUploadAudio = (updates: { pageNumber: number; audioUrl: string }[]) => {
    const updateMap = new Map(updates.map((u) => [u.pageNumber, u.audioUrl]));
    setPages((prev) =>
      prev.map((p) =>
        updateMap.has(p.pageNumber) ? { ...p, audioUrl: updateMap.get(p.pageNumber) } : p
      )
    );
  };

  const handleClearAllAudio = () => {
    spreadNarration.stop();
    setPages((prev) => prev.map((p) => ({ ...p, audioUrl: undefined })));
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Export standalone self-contained HTML book including custom uploaded BGM
  const handleExportBook = () => {
    const fileName = exportStandaloneFlipbook(documentInfo, pages, {
      viewMode,
      soundEnabled,
      zoom,
      bgmTrack,
      bgmVolume,
      customAudioUrl: customBgmUrl,
      autoPlayNarration: true,
    });
    setExportedFileName(fileName);
    setIsExportCompleteOpen(true);
  };

  // Global Drag & Drop PDF onto application
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        setIsUploadOpen(true);
      }
    };
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // Document loader handler
  const handleLoadDocument = (info: DocumentInfo, newPages: FlipbookPage[]) => {
    spreadNarration.stop();
    setIsNarrationPlayingState(false);
    setDocumentInfo(info);
    setPages(newPages);
    setCurrentPage(1);
    setZoom(1.0);
    handlePlaySound();
  };

  const audioRecordedCount = pages.filter((p) => Boolean(p.audioUrl)).length;

  return (
    <div className="h-screen max-h-screen bg-[#FBFBFA] flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-950 overflow-hidden">
      {/* Swiss Minimalist Navigation Header */}
      <Header
        documentTitle={documentInfo.title}
        totalPages={pages.length}
        currentPage={currentPage}
        soundEnabled={soundEnabled}
        bgmTrack={bgmTrack}
        audioRecordedCount={audioRecordedCount}
        isFullscreen={isFullscreen}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onOpenBgmModal={() => setIsBgmModalOpen(true)}
        onOpenPageAudio={() => setIsPageAudioOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSamples={() => setIsUploadOpen(true)}
        onExportBook={handleExportBook}
      />

      {/* Main Tactile Flipbook Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full overflow-hidden">
        <FlipbookViewer
          pages={pages}
          currentPage={currentPage}
          isDualSpread={isDualSpread}
          zoom={zoom}
          onPageChange={handlePageChange}
          onPlaySound={handlePlaySound}
        />
      </main>

      {/* Minimalist Bottom Control Bar */}
      <ControlBar
        currentPage={currentPage}
        totalPages={pages.length}
        zoom={zoom}
        isDualSpread={isDualSpread}
        hasCurrentPageNarration={hasCurrentSpreadNarration}
        isNarrationPlaying={isNarrationPlayingState}
        onPageChange={handlePageChange}
        onZoomChange={(newZoom) => setZoom(newZoom)}
        onToggleThumbnails={() => setIsThumbnailsOpen((prev) => !prev)}
        onToggleNarration={handleToggleNarration}
        onExportBook={handleExportBook}
        isThumbnailsOpen={isThumbnailsOpen}
      />

      {/* Thumbnails Sheet / Drawer (On demand) */}
      <ThumbnailsDrawer
        isOpen={isThumbnailsOpen}
        pages={pages}
        currentPage={currentPage}
        onClose={() => setIsThumbnailsOpen(false)}
        onSelectPage={handlePageChange}
      />

      {/* Page Audio Drawer (Slide-over only on demand, never pinned) */}
      <PageAudioDrawer
        isOpen={isPageAudioOpen}
        onClose={() => setIsPageAudioOpen(false)}
        pages={pages}
        currentPage={currentPage}
        onUpdatePageAudio={handleUpdatePageAudio}
        onBatchUploadAudio={handleBatchUploadAudio}
        onClearAllAudio={handleClearAllAudio}
        onSelectPage={handlePageChange}
        onExportStandalone={handleExportBook}
      />

      {/* Background Music Configuration & Upload Modal */}
      <BgmModal
        isOpen={isBgmModalOpen}
        onClose={() => setIsBgmModalOpen(false)}
        currentTrack={bgmTrack}
        customBgmUrl={customBgmUrl}
        customBgmName={customBgmName}
        bgmVolume={bgmVolume}
        onSelectTrack={handleSelectBgmTrack}
        onChangeVolume={handleChangeBgmVolume}
        onRemoveCustom={handleRemoveCustomBgm}
      />

      {/* Upload & Sample Selector Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadDocument={handleLoadDocument}
      />

      {/* Export "How to Use" Explainer Modal */}
      <ExportCompletionModal
        isOpen={isExportCompleteOpen}
        onClose={() => setIsExportCompleteOpen(false)}
        fileName={exportedFileName || `${documentInfo.title.replace(/\s+/g, '_')}_flipdf_book.html`}
        totalPages={pages.length}
      />
    </div>
  );
}
