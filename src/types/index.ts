export interface FlipbookPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface DocumentInfo {
  id: string;
  title: string;
  totalPages: number;
  fileSize?: string;
  sourceType: 'sample' | 'upload';
}

export type ViewMode = 'auto' | 'dual' | 'single';

export interface FlipbookSettings {
  viewMode: ViewMode;
  soundEnabled: boolean;
  zoom: number; // 0.8 to 1.6
}
