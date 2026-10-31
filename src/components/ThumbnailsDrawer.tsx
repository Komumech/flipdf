import React from 'react';
import { X } from 'lucide-react';
import { FlipbookPage } from '../types';

interface ThumbnailsDrawerProps {
  isOpen: boolean;
  pages: FlipbookPage[];
  currentPage: number;
  onClose: () => void;
  onSelectPage: (pageNum: number) => void;
}

export const ThumbnailsDrawer: React.FC<ThumbnailsDrawerProps> = ({
  isOpen,
  pages,
  currentPage,
  onClose,
  onSelectPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Drawer / Sheet */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl border border-neutral-200/80 p-6 max-h-[85vh] flex flex-col shadow-sm z-10">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4 shrink-0">
          <div>
            <h3 className="text-sm font-medium text-slate-900 tracking-tight">
              Page Overview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any thumbnail to jump immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors duration-150 rounded-lg cursor-pointer"
            title="Close thumbnails"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="overflow-y-auto pr-1 flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {pages.map((p) => {
            const isCurrent = p.pageNumber === currentPage;
            return (
              <div
                key={p.pageNumber}
                onClick={() => {
                  onSelectPage(p.pageNumber);
                  onClose();
                }}
                className={`group flex flex-col items-center p-2 rounded-xl border transition-colors duration-150 cursor-pointer ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500/30'
                    : 'border-neutral-200/80 bg-stone-50/50 hover:border-slate-400'
                }`}
              >
                <div className="w-full aspect-[1/1.38] bg-white border border-neutral-200/60 rounded-lg overflow-hidden shadow-2xs flex items-center justify-center">
                  <img
                    src={p.dataUrl}
                    alt={`Thumbnail page ${p.pageNumber}`}
                    className="w-full h-full object-contain pointer-events-none group-hover:scale-[1.02] transition-transform duration-150"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`mt-2 text-xs font-mono font-medium ${
                    isCurrent ? 'text-emerald-900' : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                >
                  Page {p.pageNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
