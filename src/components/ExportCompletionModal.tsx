import React, { useState } from 'react';
import { X, Check, Copy, FileText, ArrowRight, FolderDown, Globe } from 'lucide-react';

interface ExportCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  totalPages: number;
}

export const ExportCompletionModal: React.FC<ExportCompletionModalProps> = ({
  isOpen,
  onClose,
  fileName,
  totalPages,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyFileName = async () => {
    try {
      await navigator.clipboard.writeText(fileName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Swiss Minimalist Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-neutral-200/80 shadow-2xl flex flex-col z-10 overflow-hidden font-sans">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-neutral-100 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-medium text-slate-900 tracking-tight">
              Export Complete
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Your publication has been generated as a standalone interactive flipbook.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-xl hover:bg-stone-100 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 3-Step Visual Instruction */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* File Card */}
          <div className="p-4 rounded-xl bg-stone-50 border border-neutral-200/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-slate-700 shrink-0">
                <FileText className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-mono font-medium text-slate-900 truncate">
                  {fileName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {totalPages} pages • Standalone HTML • Offline Ready
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyFileName}
              className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-neutral-200/90 rounded-xl hover:border-slate-400 transition-colors duration-150 whitespace-nowrap truncate cursor-pointer shrink-0"
              title="Copy filename to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Name</span>
                </>
              )}
            </button>
          </div>

          {/* Simple 3-Step Visual Instructions */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              How to view your book
            </h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-neutral-200/60 bg-white hover:border-neutral-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-stone-100 border border-neutral-200 text-slate-900 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <FolderDown className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-slate-900">
                      Open your Downloads folder
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Check your browser or computer&apos;s Downloads directory for the exported file.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-neutral-200/60 bg-white hover:border-neutral-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-stone-100 border border-neutral-200 text-slate-900 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-slate-900">
                      Locate {fileName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    All pages, paper-flip sound, audio narrations, and background music are packaged inside this single file.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-neutral-200/60 bg-white hover:border-neutral-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-stone-100 border border-neutral-200 text-slate-900 font-mono font-semibold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-slate-900">
                      Double-click to view your book
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Opens directly in Chrome, Safari, Edge, or Firefox. No software installation or internet connection required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-[#FBFBFA] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors duration-150 whitespace-nowrap truncate cursor-pointer shadow-xs"
          >
            <span>Done</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
