import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FlipbookViewer } from './components/FlipbookViewer';
import { ControlBar } from './components/ControlBar';
import { ThumbnailsDrawer } from './components/ThumbnailsDrawer';
import { UploadModal } from './components/UploadModal';
import { PageAudioDrawer } from './components/PageAudioDrawer';
import { SAMPLE_DOCUMENTS } from './utils/sampleDocuments';
import {
  playPageTurnSound,
  startBgm,
  stopBgm,
  playPageNarration,
  stopPageNarration,
} from './utils/audio';
import { exportStandaloneFlipbook } from './utils/exportBook';
import { FlipbookPage, DocumentInfo, ViewMode, BgmTrack } from './types';

export default function App() {
  // Initial sample document
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
  const [isNarrationPlayingState, setIsNarrationPlayingState] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals & Panels (none are pinned, all render as on-demand slide-overs/drawers)
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);
  const [isPageAudioOpen, setIsPageAudioOpen] = useState<boolean>(false);

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

  // Sound handler
  const handlePlaySound = useCallback(() => {
    if (soundEnabled) {
      playPageTurnSound();
    }
  }, [soundEnabled]);

  // Page change handler
  const handlePageChange = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(pages.length, newPage));
      if (clamped !== currentPage) {
        handlePlaySound();
        setCurrentPage(clamped);
        stopPageNarration();
        setIsNarrationPlayingState(false);
      }
    },
    [pages.length, currentPage, handlePlaySound]
  );

  // Background music toggle
  const handleToggleBgm = () => {
    if (bgmTrack === 'none') {
      setBgmTrack('ambient');
      startBgm('ambient', 0.25);
    } else {
      setBgmTrack('none');
      stopBgm();
    }
  };

  // Current page audio narration toggle
  const currentPageObj = pages.find((p) => p.pageNumber === currentPage);
  const handleToggleNarration = () => {
    if (isNarrationPlayingState) {
      stopPageNarration();
      setIsNarrationPlayingState(false);
    } else if (currentPageObj?.audioUrl) {
      playPageNarration(currentPageObj.audioUrl, () => {
        setIsNarrationPlayingState(false);
      });
      setIsNarrationPlayingState(true);
    }
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

  // Export standalone self-contained HTML book
  const handleExportBook = () => {
    exportStandaloneFlipbook(documentInfo, pages, {
      viewMode,
      soundEnabled,
      zoom,
      bgmTrack,
      bgmVolume: 0.3,
      autoPlayNarration: true,
    });
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
    stopPageNarration();
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
        onToggleBgm={handleToggleBgm}
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
        hasCurrentPageNarration={Boolean(currentPageObj?.audioUrl)}
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

      {/* Upload & Sample Selector Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadDocument={handleLoadDocument}
      />
    </div>
  );
}
