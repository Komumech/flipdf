import React from 'react';
import {
  Upload,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Columns,
  Square,
} from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  documentTitle: string;
  totalPages: number;
  currentPage: number;
  viewMode: ViewMode;
  isDualSpread: boolean;
  soundEnabled: boolean;
  isFullscreen: boolean;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenUpload: () => void;
  onOpenSamples: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  totalPages,
  currentPage,
  viewMode,
  isDualSpread,
  soundEnabled,
  isFullscreen,
  onToggleSound,
  onToggleFullscreen,
  onChangeViewMode,
  onOpenUpload,
  onOpenSamples,
}) => {
  return (
    <header className="w-full bg-[#FBFBFA]/95 backdrop-blur-md border-b border-neutral-200/60 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Document Name */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base font-semibold tracking-tight text-slate-900">
              Folio
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-slate-400 font-medium">
              / Flipbook
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-200/80 hidden sm:block shrink-0" />

          {/* Current Document Meta */}
          <div className="min-w-0 flex items-center gap-2">
            <button
              onClick={onOpenSamples}
              title="Switch publication or view document info"
              className="text-left group cursor-pointer focus:outline-none truncate"
            >
              <h1 className="text-xs sm:text-sm font-medium text-slate-800 truncate group-hover:text-slate-950 transition-colors">
                {documentTitle}
              </h1>
            </button>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-slate-500 bg-stone-100 border border-neutral-200/60 rounded-md shrink-0">
              {totalPages} pages
            </span>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Switch Sample Publications */}
          <button
            onClick={onOpenSamples}
            className="hidden lg:inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 whitespace-nowrap truncate cursor-pointer"
            title="Browse sample publications"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Publications</span>
          </button>

          {/* Layout Mode (Dual vs Single) */}
          <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-xl border border-neutral-200/70">
            <button
              type="button"
              onClick={() => onChangeViewMode('dual')}
              title="Dual-page spread view"
              className={`p-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                viewMode === 'dual' || (viewMode === 'auto' && isDualSpread)
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode('single')}
              title="Single-page view"
              className={`p-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                viewMode === 'single' || (viewMode === 'auto' && !isDualSpread)
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Audio Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute page turn audio' : 'Enable tactile page turn sound'}
            className="p-2 sm:py-2 sm:px-2.5 text-xs font-medium text-slate-600 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'View full screen'}
            className="hidden sm:inline-flex p-2 text-xs font-medium text-slate-600 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-slate-700" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Upload PDF CTA */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 py-2 px-3 sm:px-4 text-xs font-medium text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/80 rounded-xl transition-colors duration-150 whitespace-nowrap truncate cursor-pointer"
            title="Upload any PDF to convert to a flipbook"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <span className="hidden xs:inline">Upload PDF</span>
            <span className="xs:hidden">Upload</span>
          </button>
        </div>
      </div>
    </header>
  );
};
