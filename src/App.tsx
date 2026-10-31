import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FlipbookViewer } from './components/FlipbookViewer';
import { ControlBar } from './components/ControlBar';
import { ThumbnailsDrawer } from './components/ThumbnailsDrawer';
import { UploadModal } from './components/UploadModal';
import { SAMPLE_DOCUMENTS } from './utils/sampleDocuments';
import { playPageTurnSound } from './utils/audio';
import { FlipbookPage, DocumentInfo, ViewMode } from './types';

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

  // Settings
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Modals & Panels
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);

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
      : screenWidth >= 768; // auto mode: dual on tablet landscape, laptops and desktop

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
      }
    },
    [pages.length, currentPage, handlePlaySound]
  );

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
    setDocumentInfo(info);
    setPages(newPages);
    setCurrentPage(1);
    setZoom(1.0);
    handlePlaySound();
  };

  return (
    <div className="h-screen max-h-screen bg-[#FBFBFA] flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-950 overflow-hidden">
      {/* Swiss Minimalist Navigation Header */}
      <Header
        documentTitle={documentInfo.title}
        totalPages={pages.length}
        currentPage={currentPage}
        viewMode={viewMode}
        isDualSpread={isDualSpread}
        soundEnabled={soundEnabled}
        isFullscreen={isFullscreen}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onToggleFullscreen={handleToggleFullscreen}
        onChangeViewMode={(mode) => setViewMode(mode)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSamples={() => setIsUploadOpen(true)}
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
        onPageChange={handlePageChange}
        onZoomChange={(newZoom) => setZoom(newZoom)}
        onToggleThumbnails={() => setIsThumbnailsOpen((prev) => !prev)}
        isThumbnailsOpen={isThumbnailsOpen}
      />

      {/* Thumbnails Sheet / Drawer */}
      <ThumbnailsDrawer
        isOpen={isThumbnailsOpen}
        pages={pages}
        currentPage={currentPage}
        onClose={() => setIsThumbnailsOpen(false)}
        onSelectPage={handlePageChange}
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
