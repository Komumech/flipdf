import React, { useState, useRef } from 'react';
import { X, Upload, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { renderPdfFile, RenderProgress } from '../utils/pdfRenderer';
import { SAMPLE_DOCUMENTS } from '../utils/sampleDocuments';
import { FlipbookPage, DocumentInfo } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDocument: (info: DocumentInfo, pages: FlipbookPage[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onLoadDocument,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF document.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgress({ currentPage: 0, totalPages: 1, percent: 0 });

    try {
      const result = await renderPdfFile(file, (p) => {
        setProgress(p);
      });

      if (result.pages.length === 0) {
        throw new Error('No renderable pages found in this PDF.');
      }

      onLoadDocument(result.info, result.pages);
      setIsProcessing(false);
      onClose();
    } catch (err: unknown) {
      console.error('PDF parsing error', err);
      const msg = err instanceof Error ? err.message : 'Unable to parse this PDF document.';
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (found) {
      onLoadDocument(
        {
          id: found.id,
          title: found.title,
          totalPages: found.totalPages,
          sourceType: 'sample',
        },
        found.pages
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-150"
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl border border-neutral-200/80 p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-sm z-10">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
          <div>
            <h3 className="text-base font-normal text-slate-900 tracking-tight">
              Open Document
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or drop any PDF to convert into an interactive tactile flipbook.
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors duration-150 rounded-lg cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Drag and Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-colors duration-150 cursor-pointer ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50/40'
              : 'border-neutral-200/90 hover:border-slate-400 bg-stone-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleProcessFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200/80 mx-auto flex items-center justify-center text-slate-600 mb-3 shadow-2xs">
            <Upload className="w-5 h-5 text-emerald-800" />
          </div>

          <h4 className="text-sm font-medium text-slate-800 mb-1">
            {isProcessing ? 'Processing PDF Pages...' : 'Click to select or drop a PDF'}
          </h4>

          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            All rendering happens directly inside your web browser. No files are transferred to external servers.
          </p>
        </div>

        {/* Progress Bar */}
        {isProcessing && progress && (
          <div className="mt-6 p-4 rounded-xl border border-neutral-200/70 bg-stone-50">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-mono">
              <span>Rendering pages</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-800 transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Page {progress.currentPage} of {progress.totalPages}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Curated Sample Publications Section */}
        <div className="mt-8 pt-6 border-t border-neutral-100">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-3">
            Or Explore Curated Publications
          </span>

          <div className="space-y-2.5">
            {SAMPLE_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectSample(doc.id)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200/70 hover:border-slate-400 bg-white transition-colors duration-150 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 border border-neutral-200/60 flex items-center justify-center text-slate-600 shrink-0">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-medium text-slate-900 group-hover:text-slate-950 truncate">
                      {doc.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {doc.meta}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 py-1.5 px-3 rounded-lg shrink-0 whitespace-nowrap truncate">
                  Load
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
