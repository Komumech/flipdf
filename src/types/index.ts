export interface FlipbookPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  audioUrl?: string; // DataURL or audio URL for per-page narration
}

export interface DocumentInfo {
  id: string;
  title: string;
  totalPages: number;
  fileSize?: string;
  sourceType: 'sample' | 'upload';
}

export type ViewMode = 'auto' | 'dual' | 'single';

export type BgmTrack = 'none' | 'ambient' | 'lofi' | 'zen' | 'custom';

export interface FlipbookSettings {
  viewMode: ViewMode;
  soundEnabled: boolean;
  zoom: number; // 0.8 to 1.6
  bgmTrack: BgmTrack;
  bgmVolume: number;
  customAudioUrl?: string;
  autoPlayNarration: boolean;
}
