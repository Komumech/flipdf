import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Headphones,
  Download,
  Pause,
} from 'lucide-react';

interface ControlBarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  isDualSpread: boolean;
  hasCurrentPageNarration: boolean;
  isNarrationPlaying: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (newZoom: number) => void;
  onToggleThumbnails: () => void;
  onToggleNarration: () => void;
  onExportBook: () => void;
  isThumbnailsOpen: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  currentPage,
  totalPages,
  zoom,
  isDualSpread,
  hasCurrentPageNarration,
  isNarrationPlaying,
  onPageChange,
  onZoomChange,
  onToggleThumbnails,
  onToggleNarration,
  onExportBook,
  isThumbnailsOpen,
}) => {
  const [jumpInput, setJumpInput] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrev = () => {
    if (canGoPrev) {
      if (isDualSpread && currentPage > 2) {
        onPageChange(currentPage % 2 === 0 ? currentPage - 2 : currentPage - 3);
      } else {
        onPageChange(Math.max(1, currentPage - 1));
      }
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      if (isDualSpread) {
        if (currentPage === 1) {
          onPageChange(2);
        } else {
          onPageChange(Math.min(totalPages, (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 2));
        }
      } else {
        onPageChange(Math.min(totalPages, currentPage + 1));
      }
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
      setIsEditingPage(false);
      setJumpInput('');
    } else {
      setIsEditingPage(false);
      setJumpInput('');
    }
  };

  return (
    <div className="w-full bg-[#FBFBFA]/95 border-t border-neutral-200/60 py-3 px-4 sm:px-6 z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Thumbnails Toggle & Narration Play */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleThumbnails}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl border transition-colors duration-150 cursor-pointer ${
              isThumbnailsOpen
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-slate-700 border-neutral-200/80 hover:border-slate-400'
            }`}
            title="Toggle thumbnail overview"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pages</span>
          </button>

          {/* Current Page Narration Play Button */}
          {hasCurrentPageNarration && (
            <button
              type="button"
              onClick={onToggleNarration}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl border transition-colors duration-150 cursor-pointer whitespace-nowrap truncate ${
                isNarrationPlaying
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
              }`}
              title={isNarrationPlaying ? 'Pause narration' : 'Play narration for this page'}
            >
              {isNarrationPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Headphones className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline whitespace-nowrap truncate">
                {isNarrationPlaying ? 'Pause' : 'Play Narration'}
              </span>
            </button>
          )}
        </div>

        {/* Center: Prev / Scrub / Next Controls */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center max-w-md">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="p-2 rounded-xl bg-white border border-neutral-200/80 text-slate-700 hover:border-slate-400 transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Counter & Direct Jump */}
          <div className="flex items-center gap-1.5 min-w-[90px] justify-center">
            {isEditingPage ? (
              <form onSubmit={handleJumpSubmit} className="inline-block">
                <input
                  type="number"
                  autoFocus
                  min={1}
                  max={totalPages}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  onBlur={() => setIsEditingPage(false)}
                  className="w-12 text-center text-xs font-mono py-1 px-1 border border-neutral-400 rounded-md focus:outline-none"
                  placeholder={currentPage.toString()}
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setJumpInput(currentPage.toString());
                  setIsEditingPage(true);
                }}
                className="text-xs font-mono text-slate-700 hover:text-slate-950 px-2 py-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                title="Click to jump to page"
              >
                <span className="font-semibold text-slate-900">{currentPage}</span>
                <span className="text-slate-400 mx-1">/</span>
                <span className="text-slate-500">{totalPages}</span>
              </button>
            )}
          </div>

          {/* Quick Slider Scrubber */}
          <div className="hidden sm:flex items-center flex-1 max-w-[160px] mx-1">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              title="Drag to browse pages"
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-2 rounded-xl bg-white border border-neutral-200/80 text-slate-700 hover:border-slate-400 transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom & Mobile Export */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.75, zoom - 0.1))}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(1.0)}
            className="hidden xs:inline-block px-2 py-1 text-[11px] font-mono text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(1.5, zoom + 0.1))}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Export Button */}
          <button
            type="button"
            onClick={onExportBook}
            className="sm:hidden p-2 text-slate-700 hover:text-slate-900 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 cursor-pointer"
            title="Export Standalone Book"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
