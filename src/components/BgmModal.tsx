import React, { useRef } from 'react';
import { X, Music2, Upload, Trash2, Check, Volume2 } from 'lucide-react';
import { BgmTrack } from '../types';

interface BgmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: BgmTrack;
  customBgmUrl?: string;
  customBgmName?: string;
  bgmVolume: number;
  onSelectTrack: (track: BgmTrack, customUrl?: string, customName?: string) => void;
  onChangeVolume: (volume: number) => void;
  onRemoveCustom: () => void;
}

export const BgmModal: React.FC<BgmModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  customBgmUrl,
  customBgmName,
  bgmVolume,
  onSelectTrack,
  onChangeVolume,
  onRemoveCustom,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onSelectTrack('custom', dataUrl, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const tracks: { id: BgmTrack; label: string; desc: string }[] = [
    { id: 'none', label: 'Off', desc: 'No background music' },
    { id: 'ambient', label: 'Ambient Shimmer', desc: 'Warm peaceful synthesizer chords' },
    { id: 'lofi', label: 'Lo-Fi Chill', desc: 'Mellow Fmaj7 Rhodes harmonics' },
    { id: 'zen', label: 'Deep Zen', desc: 'Resonant harmonic grounding tones' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-neutral-200/80 shadow-xl flex flex-col z-10 overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-slate-800 flex items-center justify-center">
              <Music2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                Background Music
              </h2>
              <p className="text-[11px] text-slate-500">
                Play ambient music or upload custom audio for export
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Custom Uploaded Music Card */}
          <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-stone-50/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-900">
                Custom Background Track
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Included in Export
              </span>
            </div>

            {customBgmUrl ? (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-neutral-200/90 rounded-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-900 truncate">
                    {customBgmName || 'custom_bgm.mp3'}
                  </p>
                  <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                    Ready to play &amp; export
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectTrack('custom', customBgmUrl, customBgmName)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      currentTrack === 'custom'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-slate-700 border-neutral-200 hover:border-slate-400'
                    }`}
                  >
                    {currentTrack === 'custom' ? 'Active' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveCustom}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Remove custom music"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-neutral-300 hover:border-slate-500 rounded-xl cursor-pointer transition-colors text-xs font-medium text-slate-700">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="whitespace-nowrap">Upload Background Music File</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>

          {/* Preset Synthesizer Options */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Ambient Harmonics
            </span>

            {tracks.map((t) => {
              const isSelected = currentTrack === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                      : 'bg-white text-slate-800 border-neutral-200/80 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <h3 className="text-xs font-medium tracking-tight">
                      {t.label}
                    </h3>
                    <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {t.desc}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Volume Control */}
          {currentTrack !== 'none' && (
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Volume</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.0}
                step={0.05}
                value={bgmVolume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
              />
              <span className="text-[11px] font-mono text-slate-400 w-8 text-right shrink-0">
                {Math.round(bgmVolume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-100 bg-stone-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 text-xs font-medium text-slate-800 bg-white border border-neutral-200/90 hover:border-slate-400 rounded-xl transition-colors cursor-pointer whitespace-nowrap truncate"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
