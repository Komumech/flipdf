import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Upload,
  Music2,
  Trash2,
  Search,
  RefreshCw,
  Download,
  ListFilter,
} from 'lucide-react';
import { FlipbookPage } from '../types';
import { BatchAudioMapperModal } from './BatchAudioMapperModal';

interface PageAudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pages: FlipbookPage[];
  currentPage: number;
  onUpdatePageAudio: (pageNumber: number, audioUrl: string | undefined) => void;
  onBatchUploadAudio: (recordings: { pageNumber: number; audioUrl: string }[]) => void;
  onClearAllAudio: () => void;
  onSelectPage: (pageNumber: number) => void;
  onExportStandalone: () => void;
}

export const PageAudioDrawer: React.FC<PageAudioDrawerProps> = ({
  isOpen,
  onClose,
  pages,
  currentPage,
  onUpdatePageAudio,
  onBatchUploadAudio,
  onClearAllAudio,
  onSelectPage,
  onExportStandalone,
}) => {
  const [jumpPage, setJumpPage] = useState('');
  const [recordingPage, setRecordingPage] = useState<number | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);
  const [isBatchMapperOpen, setIsBatchMapperOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Auto-scroll to current page when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const el = document.getElementById(`audio-drawer-row-${currentPage}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [isOpen, currentPage]);

  if (!isOpen) return null;

  const totalPages = pages.length;
  const recordedCount = pages.filter((p) => Boolean(p.audioUrl)).length;

  const handleSingleFileUpload = (pageNumber: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onUpdatePageAudio(pageNumber, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartMic = async (pageNumber: number) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone access is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        stream.getTracks().forEach((track) => track.stop());
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          if (dataUrl) {
            onUpdatePageAudio(pageNumber, dataUrl);
          }
        };
        reader.readAsDataURL(blob);
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setRecordingPage(pageNumber);
      setRecSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Could not access microphone.');
    }
  };

  const handleStopMic = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingPage(null);
    setRecSeconds(0);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onSelectPage(p);
      const el = document.getElementById(`audio-drawer-row-${p}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-neutral-900');
        setTimeout(() => el.classList.remove('ring-2', 'ring-neutral-900'), 1500);
      }
    }
  };

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Slide-over Drawer Panel */}
        <aside className="relative w-full sm:w-[520px] max-w-full bg-[#FBFBFA] z-10 shadow-2xl flex flex-col border-l border-neutral-200/80 transition-transform duration-300 ease-out h-full">
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-neutral-300" />
          </div>

          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200/70 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
                <Music2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Page Audio Narration
                  </h2>
                  <span className="text-[11px] bg-neutral-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                    {recordedCount} of {totalPages} pages
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Upload or record voice for each page (included in exported book)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-800 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions & Jump Toolbar */}
          <div className="px-4 py-3 bg-white border-b border-neutral-200/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center space-x-2">
              {/* Batch Upload / Mapping Modal Launcher */}
              <button
                type="button"
                onClick={() => setIsBatchMapperOpen(true)}
                className="inline-flex items-center space-x-2 text-xs sm:text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                title="Select start page, skip non-audio pages, and verify audio match"
              >
                <ListFilter className="w-4 h-4" />
                <span>Batch Audio Mapper</span>
              </button>

              {/* Clear All */}
              {recordedCount > 0 && (
                <button
                  type="button"
                  onClick={onClearAllAudio}
                  className="inline-flex items-center space-x-1.5 text-xs sm:text-sm text-neutral-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Jump to Page */}
            <form onSubmit={handleJumpSubmit} className="flex items-center space-x-2 bg-neutral-50 border border-neutral-200/80 rounded-xl px-3 py-1.5 text-xs text-neutral-600 focus-within:border-neutral-400">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                placeholder="Jump to page…"
                className="w-24 bg-transparent outline-none text-xs sm:text-sm text-neutral-800"
              />
            </form>
          </div>

          {/* Live Mic Recording Banner */}
          {recordingPage !== null && (
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 text-red-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="font-medium">Recording for Page {recordingPage}…</span>
                <span className="font-mono text-red-700 font-semibold">
                  {formatTimer(recSeconds)}
                </span>
              </div>
              <button
                onClick={handleStopMic}
                className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-medium text-[11px] hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Stop & Save
              </button>
            </div>
          )}

          {/* Scrollable Page Rows List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pages.map((p) => {
              const hasAudio = Boolean(p.audioUrl);
              const isCurrent = p.pageNumber === currentPage;
              const isRecThis = recordingPage === p.pageNumber;

              return (
                <div
                  key={p.pageNumber}
                  id={`audio-drawer-row-${p.pageNumber}`}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasAudio
                      ? isCurrent
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-white border-neutral-200/90 shadow-2xs'
                      : isCurrent
                      ? 'bg-neutral-50 border-neutral-300'
                      : 'bg-white/80 border-neutral-200/60 hover:border-neutral-300'
                  }`}
                >
                  {/* Left: Thumbnail + Title + Audio Preview Player */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="w-12 h-16 object-contain rounded-lg border border-neutral-200/80 bg-neutral-50 shrink-0 cursor-pointer"
                      onClick={() => onSelectPage(p.pageNumber)}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-neutral-900">
                          Page {p.pageNumber}
                        </span>
                        {hasAudio ? (
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded-md font-medium">
                            Audio Attached
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-normal">
                            No Audio
                          </span>
                        )}
                      </div>

                      {hasAudio ? (
                        <audio
                          controls
                          src={p.audioUrl}
                          className="h-7 w-full max-w-[230px] mt-1.5 block"
                        />
                      ) : (
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Upload narration file or record voice
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                    {!hasAudio ? (
                      <>
                        {/* Direct Upload Audio Button */}
                        <label className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors whitespace-nowrap shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Audio</span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleSingleFileUpload(p.pageNumber, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {/* Mic Record Button */}
                        <button
                          type="button"
                          onClick={() => handleStartMic(p.pageNumber)}
                          disabled={isRecThis}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-600 rounded-xl border border-neutral-200 transition-colors cursor-pointer"
                          title={`Record with mic for Page ${p.pageNumber}`}
                        >
                          <Mic className="w-3.5 h-3.5 text-neutral-700" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Replace */}
                        <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shadow-2xs">
                          <RefreshCw className="w-3 h-3 text-neutral-500" />
                          <span>Change</span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleSingleFileUpload(p.pageNumber, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => onUpdatePageAudio(p.pageNumber, undefined)}
                          className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                          title={`Remove audio from Page ${p.pageNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-neutral-200/70 bg-white flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onExportStandalone}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-xs sm:text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Book with Audio</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Batch Audio Mapper Modal */}
      <BatchAudioMapperModal
        isOpen={isBatchMapperOpen}
        onClose={() => setIsBatchMapperOpen(false)}
        pages={pages}
        initialStartPage={currentPage}
        onApplyMapping={onBatchUploadAudio}
      />
    </>
  );
};
