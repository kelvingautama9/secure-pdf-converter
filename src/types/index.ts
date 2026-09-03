export type ToolMode = 'image-to-pdf' | 'merge-split' | 'protect-unlock' | 'compress-pdf';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  pageCount?: number;
}

export interface ProgressState {
  isProcessing: boolean;
  progress: number;
  stage: string;
  error: string | null;
  resultBlob: Blob | null;
  resultFileName: string;
  resultSize?: number;
  originalTotalSize?: number;
}

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'LETTER' | 'FIT';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: number; // 0, 18, 36 pt
  quality: number; // 0.1 - 1.0
  compress?: boolean;
  compressPreset?: 'none' | 'recommended' | 'extreme' | 'light' | 'custom';
  customQuality?: number;
  customMaxDimension?: number;
}

export interface MergeSplitOptions {
  mode: 'merge' | 'split-range' | 'split-all';
  range: string; // e.g. "1-3, 5, 7-10"
}

export interface ProtectUnlockOptions {
  mode: 'protect' | 'unlock';
  password: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
}

export interface CompressOptions {
  preset: 'extreme' | 'recommended' | 'light';
  quality: number;
  maxDimension: number;
}
