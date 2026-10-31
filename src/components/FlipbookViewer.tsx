import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlipbookPage } from '../types';

interface FlipbookViewerProps {
  pages: FlipbookPage[];
  currentPage: number; // 1-indexed
  isDualSpread: boolean;
  zoom: number;
  onPageChange: (newPage: number) => void;
  onPlaySound: () => void;
}

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({
  pages,
  currentPage,
  isDualSpread,
  zoom,
  onPageChange,
  onPlaySound,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);

  // Touch tracking for mobile swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Measure container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({
          width: clientWidth,
          height: clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const totalPages = pages.length;

  // Determine which page(s) to show
  // In dual spread:
  // Page 1 is cover (shown on right page, left page empty)
  // Page 2 & 3, Page 4 & 5, etc.
  // If currentPage is even (e.g. 2), left is 2, right is 3
  // If currentPage is odd and > 1 (e.g. 3), left is 2, right is 3
  let leftPageNum: number | null = null;
  let rightPageNum: number | null = null;

  if (isDualSpread) {
    if (currentPage === 1) {
      leftPageNum = null;
      rightPageNum = 1;
    } else {
      leftPageNum = currentPage % 2 === 0 ? currentPage : currentPage - 1;
      rightPageNum = leftPageNum + 1 <= totalPages ? leftPageNum + 1 : null;
    }
  } else {
    // Single page mode
    leftPageNum = null;
    rightPageNum = currentPage;
  }

  const leftPage = leftPageNum ? pages.find((p) => p.pageNumber === leftPageNum) : null;
  const rightPage = rightPageNum ? pages.find((p) => p.pageNumber === rightPageNum) : null;

  // Navigation handlers
  const canGoPrev = currentPage > 1;
  const canGoNext = isDualSpread
    ? (rightPageNum ? rightPageNum < totalPages : false) || (currentPage === 1 && totalPages > 1)
    : currentPage < totalPages;

  const handlePrev = useCallback(() => {
    if (!canGoPrev || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    onPlaySound();

    const targetPage = isDualSpread
      ? currentPage === 2 || currentPage === 3
        ? 1
        : Math.max(1, (currentPage % 2 === 0 ? currentPage : currentPage - 1) - 2)
      : Math.max(1, currentPage - 1);

    setTimeout(() => {
      onPageChange(targetPage);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 280);
  }, [canGoPrev, isFlipping, isDualSpread, currentPage, onPageChange, onPlaySound]);

  const handleNext = useCallback(() => {
    if (!canGoNext || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('next');
    onPlaySound();

    const targetPage = isDualSpread
      ? currentPage === 1
        ? 2
        : Math.min(totalPages, (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 2)
      : Math.min(totalPages, currentPage + 1);

    setTimeout(() => {
      onPageChange(targetPage);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 280);
  }, [canGoNext, isFlipping, isDualSpread, currentPage, totalPages, onPageChange, onPlaySound]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (currentPage > 1) onPageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (currentPage < totalPages) onPageChange(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, currentPage, totalPages, onPageChange]);

  // Touch Swipe Handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal swipe threshold: at least 40px, and more horizontal than vertical
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Compute page dimensions to perfectly fit the viewport
  // Standard A4 / Book aspect ratio is around 1:1.35 to 1:1.41
  const pageAspect = 1 / 1.38;
  const paddingH = containerSize.width < 640 ? 16 : containerSize.width < 1024 ? 32 : 48;
  const paddingV = containerSize.height < 600 ? 16 : 32;

  const availW = Math.max(280, containerSize.width - paddingH * 2);
  const availH = Math.max(340, containerSize.height - paddingV * 2);

  let singlePageW: number;
  let singlePageH: number;

  if (isDualSpread) {
    // 2 pages side by side
    const maxBookW = availW;
    const maxBookH = availH;

    // Calculate height constrained by width
    let testH = (maxBookW / 2) / pageAspect;
    let testW = maxBookW / 2;

    if (testH > maxBookH) {
      testH = maxBookH;
      testW = testH * pageAspect;
    }

    singlePageW = Math.round(testW * zoom);
    singlePageH = Math.round(testH * zoom);
  } else {
    // Single page
    let testH = availW / pageAspect;
    let testW = availW;

    if (testH > availH) {
      testH = availH;
      testW = testH * pageAspect;
    }

    singlePageW = Math.round(testW * zoom);
    singlePageH = Math.round(testH * zoom);
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative flex-1 w-full min-h-[320px] flex items-center justify-center p-3 sm:p-6 md:p-8 select-none ${
        zoom > 1.0 ? 'overflow-auto' : 'overflow-hidden'
      }`}
    >
      {/* Outer book wrapper with 3D perspective for realistic flip */}
      <div
        className="relative flex items-center justify-center transition-transform duration-200"
        style={{
          perspective: '2200px',
        }}
      >
        {isDualSpread ? (
          /* DUAL-PAGE SPREAD */
          <div
            className={`flex items-center transition-all duration-300 ${
              isFlipping ? 'pointer-events-none' : ''
            }`}
          >
            {/* LEFT PAGE */}
            <div
              onClick={handlePrev}
              style={{
                width: `${singlePageW}px`,
                height: `${singlePageH}px`,
              }}
              className={`relative bg-white rounded-l-md border-y border-l border-neutral-200/80 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-200 ${
                canGoPrev ? 'cursor-pointer hover:brightness-[0.99]' : ''
              } ${
                leftPageNum === null ? 'bg-stone-100/70 border-r-0 border-neutral-200/50' : ''
              }`}
            >
              {leftPage ? (
                <>
                  <img
                    src={leftPage.dataUrl}
                    alt={`Page ${leftPage.pageNumber}`}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="eager"
                  />
                  {/* Subtle right-edge spine shadow */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/8 via-black/2 to-transparent pointer-events-none" />
                  
                  {/* Page number footer */}
                  <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono bg-white/80 px-1 rounded">
                    {leftPage.pageNumber}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-slate-300 font-light text-xs tracking-wider uppercase">
                  Inside Cover
                </div>
              )}

              {/* Turn left affordance on hover */}
              {canGoPrev && leftPage && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 border border-neutral-200/60 rounded-full text-slate-600 opacity-0 hover:opacity-100 transition-opacity duration-150">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* CENTER SPINE DIVIDER */}
            <div
              style={{ height: `${singlePageH}px` }}
              className="w-[2px] bg-neutral-300 relative z-20 shadow-xs"
            >
              <div className="absolute inset-y-0 -left-1 w-2 bg-black/5" />
            </div>

            {/* RIGHT PAGE */}
            <div
              onClick={handleNext}
              style={{
                width: `${singlePageW}px`,
                height: `${singlePageH}px`,
                transformOrigin: 'left center',
                transform:
                  isFlipping && flipDirection === 'next'
                    ? 'rotateY(-24deg)'
                    : isFlipping && flipDirection === 'prev'
                    ? 'rotateY(16deg)'
                    : 'rotateY(0deg)',
                transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className={`relative bg-white rounded-r-md border-y border-r border-neutral-200/80 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-200 ${
                canGoNext ? 'cursor-pointer hover:brightness-[0.99]' : ''
              } ${
                rightPageNum === null ? 'bg-stone-100/70 border-l-0 border-neutral-200/50' : ''
              }`}
            >
              {rightPage ? (
                <>
                  <img
                    src={rightPage.dataUrl}
                    alt={`Page ${rightPage.pageNumber}`}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="eager"
                  />
                  {/* Subtle left-edge spine shadow */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/8 via-black/2 to-transparent pointer-events-none" />

                  {/* Page number footer */}
                  <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono bg-white/80 px-1 rounded">
                    {rightPage.pageNumber}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-slate-300 font-light text-xs tracking-wider uppercase">
                  End of Publication
                </div>
              )}

              {/* Turn right affordance on hover */}
              {canGoNext && rightPage && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 border border-neutral-200/60 rounded-full text-slate-600 opacity-0 hover:opacity-100 transition-opacity duration-150">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SINGLE-PAGE VIEW (Mobile / Tablet Portrait / Explicit Single) */
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              if (clickX < rect.width * 0.35) {
                handlePrev();
              } else if (clickX > rect.width * 0.65) {
                handleNext();
              }
            }}
            style={{
              width: `${singlePageW}px`,
              height: `${singlePageH}px`,
              transform:
                isFlipping && flipDirection === 'next'
                  ? 'translateX(-12px)'
                  : isFlipping && flipDirection === 'prev'
                  ? 'translateX(12px)'
                  : 'translateX(0)',
              transition: 'transform 240ms ease-out',
            }}
            className="relative bg-white rounded-xl border border-neutral-200/80 shadow-xs flex items-center justify-center overflow-hidden cursor-pointer"
          >
            {rightPage ? (
              <>
                <img
                  src={rightPage.dataUrl}
                  alt={`Page ${rightPage.pageNumber}`}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="eager"
                />

                {/* Page number footer */}
                <div className="absolute bottom-2 right-3 text-[11px] text-slate-400 font-mono bg-white/85 px-1.5 py-0.5 rounded">
                  {rightPage.pageNumber} / {totalPages}
                </div>
              </>
            ) : null}

            {/* Mobile Nav Tap Edge Zones Hints */}
            {canGoPrev && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 border border-neutral-200/80 rounded-full text-slate-700 shadow-xs active:bg-slate-100"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {canGoNext && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 border border-neutral-200/80 rounded-full text-slate-700 shadow-xs active:bg-slate-100"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating navigation chevrons for large screens */}
      <div className="hidden md:flex absolute inset-x-4 top-1/2 -translate-y-1/2 justify-between pointer-events-none max-w-7xl mx-auto">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev}
          className={`pointer-events-auto p-3 rounded-full bg-white/90 border border-neutral-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-all cursor-pointer shadow-xs ${
            !canGoPrev ? 'opacity-20 cursor-not-allowed' : ''
          }`}
          title="Previous page (Left arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          className={`pointer-events-auto p-3 rounded-full bg-white/90 border border-neutral-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-400 transition-all cursor-pointer shadow-xs ${
            !canGoNext ? 'opacity-20 cursor-not-allowed' : ''
          }`}
          title="Next page (Right arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
