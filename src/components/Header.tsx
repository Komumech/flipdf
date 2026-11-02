import React from 'react';
import {
  Upload,
  BookOpen,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Music2,
  Download,
  Mic,
} from 'lucide-react';
import { BgmTrack } from '../types';

interface HeaderProps {
  documentTitle: string;
  totalPages: number;
  currentPage: number;
  soundEnabled: boolean;
  bgmTrack: BgmTrack;
  audioRecordedCount: number;
  isFullscreen: boolean;
  onToggleSound: () => void;
  onToggleBgm: () => void;
  onOpenPageAudio: () => void;
  onToggleFullscreen: () => void;
  onOpenUpload: () => void;
  onOpenSamples: () => void;
  onExportBook: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  totalPages,
  currentPage,
  soundEnabled,
  bgmTrack,
  audioRecordedCount,
  isFullscreen,
  onToggleSound,
  onToggleBgm,
  onOpenPageAudio,
  onToggleFullscreen,
  onOpenUpload,
  onOpenSamples,
  onExportBook,
}) => {
  return (
    <header className="w-full bg-[#FBFBFA]/95 backdrop-blur-md border-b border-neutral-200/60 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Document Name */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              F
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              FlipDF
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
          {/* Sample Publications */}
          <button
            onClick={onOpenSamples}
            className="hidden lg:inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 whitespace-nowrap truncate cursor-pointer"
            title="Browse sample publications"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Samples</span>
          </button>

          {/* Page Audio Drawer Button */}
          <button
            type="button"
            onClick={onOpenPageAudio}
            className={`inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl border transition-colors duration-150 cursor-pointer ${
              audioRecordedCount > 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-white text-slate-700 border-neutral-200/80 hover:border-slate-400'
            }`}
            title="Manage page audio narrations"
          >
            <Mic className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden xs:inline whitespace-nowrap">Page Audio</span>
            {audioRecordedCount > 0 && (
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-semibold px-1.5 py-0.2 rounded-full">
                {audioRecordedCount}
              </span>
            )}
          </button>

          {/* Background Music Toggle */}
          <button
            type="button"
            onClick={onToggleBgm}
            title={bgmTrack !== 'none' ? 'Mute background music' : 'Play ambient background music'}
            className={`p-2 text-xs font-medium rounded-xl border transition-colors duration-150 cursor-pointer ${
              bgmTrack !== 'none'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-slate-600 border-neutral-200/80 hover:border-slate-400'
            }`}
          >
            <Music2 className="w-4 h-4 shrink-0" />
          </button>

          {/* Page Turn Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute page turn sound' : 'Enable flip sound (flip.mp3)'}
            className="p-2 text-xs font-medium text-slate-600 bg-white border border-neutral-200/80 rounded-xl hover:border-slate-400 transition-colors duration-150 cursor-pointer"
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

          {/* Export Standalone HTML Book */}
          <button
            type="button"
            onClick={onExportBook}
            className="hidden sm:inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-800 bg-white border border-neutral-300 hover:border-neutral-400 rounded-xl transition-colors duration-150 whitespace-nowrap truncate cursor-pointer"
            title="Download standalone self-contained flipbook"
          >
            <Download className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span>Export Book</span>
          </button>

          {/* Upload PDF CTA */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 py-2 px-3 sm:px-4 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors duration-150 whitespace-nowrap truncate cursor-pointer shadow-xs"
            title="Upload any PDF to convert to a flipbook"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Upload PDF</span>
            <span className="xs:hidden">Upload</span>
          </button>
        </div>
      </div>
    </header>
  );
};
