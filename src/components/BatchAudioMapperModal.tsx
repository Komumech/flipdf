import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Play, Pause, Upload, Check, SkipForward, ArrowRight } from 'lucide-react';
import { FlipbookPage } from '../types';

interface BatchAudioFile {
  id: string;
  file: File;
  name: string;
  dataUrl: string;
}

interface BatchAudioMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: FlipbookPage[];
  initialStartPage?: number;
  onApplyMapping: (updates: { pageNumber: number; audioUrl: string }[]) => void;
}

export const BatchAudioMapperModal: React.FC<BatchAudioMapperModalProps> = ({
  isOpen,
  onClose,
  pages,
  initialStartPage = 1,
  onApplyMapping,
}) => {
  const [audioFiles, setAudioFiles] = useState<BatchAudioFile[]>([]);
  const [startPage, setStartPage] = useState<number>(initialStartPage);
  const [skippedPages, setSkippedPages] = useState<Set<number>>(new Set());
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync initial start page when opened
  useEffect(() => {
    if (isOpen) {
      setStartPage(Math.max(1, Math.min(pages.length, initialStartPage)));
    }
  }, [isOpen, initialStartPage, pages.length]);

  // Clean up audio on close or unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoadingFiles(true);

    const sortedFiles = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    const loaded: BatchAudioFile[] = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            loaded.push({
              id: `audio-${i}-${file.name}`,
              file,
              name: file.name,
              dataUrl,
            });
          }
          resolve();
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(file);
      });
    }

    setAudioFiles(loaded);
    setIsLoadingFiles(false);
  };

  // Toggle skipping a page
  const handleToggleSkipPage = (pageNum: number) => {
    setSkippedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  };

  // Play preview audio
  const handlePlayPreview = (audioUrl: string, id: string) => {
    if (playingAudioId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const player = new Audio(audioUrl);
    player.onended = () => {
      setPlayingAudioId(null);
    };
    player.play().catch(() => {});
    audioPlayerRef.current = player;
    setPlayingAudioId(id);
  };

  // Mapping calculation
  const mapping = useMemo(() => {
    const list: {
      page: FlipbookPage;
      isSkipped: boolean;
      assignedAudio?: BatchAudioFile;
    }[] = [];

    let audioIndex = 0;
    for (let p = startPage; p <= pages.length; p++) {
      const pageObj = pages.find((item) => item.pageNumber === p);
      if (!pageObj) continue;

      const isSkipped = skippedPages.has(p);
      let assignedAudio: BatchAudioFile | undefined = undefined;

      if (!isSkipped && audioIndex < audioFiles.length) {
        assignedAudio = audioFiles[audioIndex];
        audioIndex++;
      }

      list.push({
        page: pageObj,
        isSkipped,
        assignedAudio,
      });
    }

    return list;
  }, [startPage, pages, skippedPages, audioFiles]);

  const assignedCount = mapping.filter((m) => Boolean(m.assignedAudio)).length;

  const handleApply = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    const updates: { pageNumber: number; audioUrl: string }[] = [];
    mapping.forEach((m) => {
      if (m.assignedAudio) {
        updates.push({
          pageNumber: m.page.pageNumber,
          audioUrl: m.assignedAudio.dataUrl,
        });
      }
    });

    onApplyMapping(updates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-neutral-200/80 shadow-xl flex flex-col max-h-[90vh] z-10 overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Batch Audio Mapping
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your starting page, skip non-audio pages, and verify audio matches each page.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors rounded-lg cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-stone-50/70 border-b border-neutral-200/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Start on Page Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="batch-start-page" className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Start on Page:
            </label>
            <select
              id="batch-start-page"
              value={startPage}
              onChange={(e) => setStartPage(parseInt(e.target.value, 10))}
              className="py-1.5 px-3 bg-white border border-neutral-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-neutral-400 cursor-pointer"
            >
              {pages.map((p) => (
                <option key={p.pageNumber} value={p.pageNumber}>
                  Page {p.pageNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Files Input / Count */}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium text-slate-800 bg-white border border-neutral-200/80 hover:border-slate-400 rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate">
              <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>
                {audioFiles.length > 0
                  ? `${audioFiles.length} Audio Files Selected`
                  : 'Select Audio Files'}
              </span>
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </label>

            {skippedPages.size > 0 && (
              <button
                type="button"
                onClick={() => setSkippedPages(new Set())}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer whitespace-nowrap"
              >
                Reset Skipped ({skippedPages.size})
              </button>
            )}
          </div>
        </div>

        {/* Informational Guidance */}
        {audioFiles.length === 0 ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-neutral-200/60 flex items-center justify-center text-slate-500 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">
              Select Audio Files in Batch
            </h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-4">
              Select multiple narration files (e.g. Chapter 1, Chapter 2, Page 03). You can then choose which page to begin on, skip illustrations or blank pages, and listen to ensure each track aligns with the right page.
            </p>
            <label className="inline-flex items-center gap-2 py-2.5 px-4 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Choose Audio Files (Multi-select)</span>
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </label>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
            <div className="text-xs text-slate-500 flex items-center justify-between pb-1">
              <span>
                Matching {assignedCount} audio file{assignedCount === 1 ? '' : 's'} starting at Page {startPage}
              </span>
              <span className="text-[11px] text-slate-400">
                Click &quot;Skip Page&quot; to leave pages with no audio
              </span>
            </div>

            {mapping.map(({ page, isSkipped, assignedAudio }) => (
              <div
                key={page.pageNumber}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isSkipped
                    ? 'bg-stone-50 border-neutral-200/50 opacity-60'
                    : assignedAudio
                    ? 'bg-white border-neutral-200/90 shadow-2xs'
                    : 'bg-white/60 border-neutral-200/40 text-slate-400'
                }`}
              >
                {/* Left: Thumbnail & Page Number */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-14 bg-stone-100 rounded-md border border-neutral-200/70 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={page.dataUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        Page {page.pageNumber}
                      </span>
                      {isSkipped ? (
                        <span className="text-[10px] text-slate-500 bg-stone-200/60 px-1.5 py-0.5 rounded font-mono">
                          Skipped (No Sound)
                        </span>
                      ) : assignedAudio ? (
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded font-mono truncate max-w-[180px]">
                          {assignedAudio.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          No audio available
                        </span>
                      )}
                    </div>

                    {/* Audio Preview and Match Verification */}
                    {assignedAudio && !isSkipped && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handlePlayPreview(assignedAudio.dataUrl, assignedAudio.id)
                          }
                          className="inline-flex items-center gap-1 py-1 px-2 text-[11px] font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          title="Preview audio for this page"
                        >
                          {playingAudioId === assignedAudio.id ? (
                            <>
                              <Pause className="w-3 h-3 text-emerald-700" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-slate-700" />
                              <span>Play to verify match</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Skip / Include Action */}
                <div className="shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSkipPage(page.pageNumber)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap truncate ${
                      isSkipped
                        ? 'bg-white text-slate-700 border-neutral-300 hover:border-slate-500'
                        : 'bg-stone-50 text-slate-600 border-neutral-200/80 hover:text-slate-900 hover:border-slate-400'
                    }`}
                  >
                    {isSkipped ? 'Include Page' : 'Skip Page'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 text-xs font-medium text-slate-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate"
          >
            Cancel
          </button>

          {audioFiles.length > 0 && (
            <button
              type="button"
              onClick={handleApply}
              disabled={assignedCount === 0}
              className="inline-flex items-center gap-2 py-2 px-5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Apply to {assignedCount} Pages</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
