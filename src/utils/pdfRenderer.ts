import * as pdfjsLib from 'pdfjs-dist';
import { FlipbookPage, DocumentInfo } from '../types';

// Set worker source for PDF.js to high-availability CDN matching library version
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('Could not set workerSrc from unpkg, will use internal thread fallback', err);
  }
}

export interface RenderProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
}

export async function renderPdfFile(
  file: File,
  onProgress?: (progress: RenderProgress) => void
): Promise<{ info: DocumentInfo; pages: FlipbookPage[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://unpkg.com/pdfjs-dist@' + (pdfjsLib.version || '4.10.38') + '/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: FlipbookPage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    // Render at crisp 2x resolution for retina and zoom clarity
    const unscaledViewport = page.getViewport({ scale: 1 });
    const targetScale = Math.min(2.0, Math.max(1.2, 1600 / Math.max(unscaledViewport.width, unscaledViewport.height)));
    const viewport = page.getViewport({ scale: targetScale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // Default white background for pages that don't paint background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    pages.push({
      pageNumber: pageNum,
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      width: viewport.width,
      height: viewport.height,
    });

    if (onProgress) {
      onProgress({
        currentPage: pageNum,
        totalPages,
        percent: Math.round((pageNum / totalPages) * 100),
      });
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

  const info: DocumentInfo = {
    id: `pdf-${Date.now()}`,
    title: cleanTitle,
    totalPages,
    fileSize: formatSize(file.size),
    sourceType: 'upload',
  };

  return { info, pages };
}
