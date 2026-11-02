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

  // Live touch & mouse drag tracking to follow finger/cursor
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // px horizontal movement
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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
    // Single page mode on mobile / tablet portrait
    leftPageNum = null;
    rightPageNum = currentPage;
  }

  const leftPage = leftPageNum ? pages.find((p) => p.pageNumber === leftPageNum) : null;
  const rightPage = rightPageNum ? pages.find((p) => p.pageNumber === rightPageNum) : null;

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
      setDragOffset(0);
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
      setDragOffset(0);
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

  // Interactive Touch handlers (follows finger anywhere on screen seamlessly)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isFlipping) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsPointerDown(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPointerDown || startXRef.current === null || startYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - startXRef.current;
    const dy = currentY - startYRef.current;

    // Follow horizontal swipe if primarily horizontal
    if (Math.abs(dx) > Math.abs(dy) * 0.75) {
      setDragOffset(dx);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isPointerDown || startXRef.current === null || startYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - startXRef.current;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    const deltaTime = Date.now() - startTimeRef.current;

    setIsPointerDown(false);

    // Effortless threshold: 18px swipe or 12px fast flick flips in the direction of the finger
    if (
      Math.abs(deltaX) > Math.abs(deltaY) * 0.85 &&
      (Math.abs(deltaX) >= 18 || (Math.abs(deltaX) >= 12 && deltaTime < 350))
    ) {
      if (deltaX < 0) {
        // Swiped finger to the left -> flip forward
        handleNext();
      } else {
        // Swiped finger to the right -> flip backward
        handlePrev();
      }
    } else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && deltaTime < 400) {
      // Tap detected: left 35% flips prev, right 35% flips next
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX - rect.left;
        if (tapX < rect.width * 0.35) {
          handlePrev();
        } else if (tapX > rect.width * 0.65) {
          handleNext();
        }
      }
    }

    setDragOffset(0);
    startXRef.current = null;
    startYRef.current = null;
  };

  const handleTouchCancel = () => {
    setIsPointerDown(false);
    setDragOffset(0);
    startXRef.current = null;
    startYRef.current = null;
  };

  // Interactive Desktop Mouse Drag Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isFlipping) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    setIsPointerDown(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDown || startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    setDragOffset(dx);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isPointerDown || startXRef.current === null) return;
    const deltaX = e.clientX - startXRef.current;
    const deltaTime = Date.now() - startTimeRef.current;
    setIsPointerDown(false);

    if (Math.abs(deltaX) >= 20 || (Math.abs(deltaX) >= 12 && deltaTime < 300)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (Math.abs(deltaX) < 10) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width * 0.35) {
          handlePrev();
        } else if (clickX > rect.width * 0.65) {
          handleNext();
        }
      }
    }

    setDragOffset(0);
    startXRef.current = null;
    startYRef.current = null;
  };

  // Compute page dimensions - maximize on mobile so text is large and clear
  const pageAspect = 1 / 1.38;
  const isMobile = containerSize.width < 768;
  const paddingH = isMobile ? 8 : containerSize.width < 1024 ? 20 : 40;
  const paddingV = isMobile ? 8 : 20;

  const availW = Math.max(280, containerSize.width - paddingH * 2);
  const availH = Math.max(380, containerSize.height - paddingV * 2);

  let singlePageW: number;
  let singlePageH: number;

  if (isDualSpread) {
    const maxBookW = availW;
    const maxBookH = availH;
    let testH = (maxBookW / 2) / pageAspect;
    let testW = maxBookW / 2;

    if (testH > maxBookH) {
      testH = maxBookH;
      testW = testH * pageAspect;
    }

    singlePageW = Math.round(testW * zoom);
    singlePageH = Math.round(testH * zoom);
  } else {
    // Single page mode on mobile / tablet portrait (fills viewport generously)
    let testW = availW;
    let testH = Math.round(testW / pageAspect);

    if (testH > availH) {
      testH = availH;
      testW = Math.round(testH * pageAspect);
    }

    singlePageW = Math.round(testW * zoom);
    singlePageH = Math.round(testH * zoom);
  }

  // Calculate live 3D curl rotation following finger/cursor
  const liveAngle = isPointerDown
    ? Math.max(-28, Math.min(28, (dragOffset / (singlePageW || 300)) * 40))
    : 0;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isPointerDown) {
          setIsPointerDown(false);
          setDragOffset(0);
          startXRef.current = null;
        }
      }}
      className={`relative flex-1 w-full min-h-[320px] flex items-center justify-center p-1 sm:p-6 md:p-8 select-none touch-none ${
        zoom > 1.0 ? 'overflow-auto' : 'overflow-hidden'
      }`}
    >
      {/* Outer book wrapper with 3D perspective for realistic flip */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: '2400px',
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
                transformOrigin: 'right center',
                transform:
                  isFlipping && flipDirection === 'prev'
                    ? 'rotateY(24deg) scale(0.98)'
                    : isPointerDown && liveAngle > 0
                    ? `rotateY(${liveAngle}deg) scale(${1 - liveAngle * 0.001})`
                    : 'rotateY(0deg)',
                transition: isPointerDown
                  ? 'none'
                  : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className={`relative bg-white rounded-l-md border-y border-l border-neutral-200/80 shadow-md flex items-center justify-center overflow-hidden transition-all duration-200 ${
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
                    className="w-full h-full object-contain pointer-events-none bg-white"
                    loading="eager"
                  />
                  {/* Spine shadow */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/8 via-black/2 to-transparent pointer-events-none" />

                  {/* Page number footer */}
                  <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono bg-white/80 px-1 rounded">
                    {leftPage.pageNumber}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-slate-300 font-light text-xs tracking-wider uppercase">
                  Cover
                </div>
              )}

              {/* Hover turn affordance on desktop */}
              {canGoPrev && leftPage && (
                <div className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 border border-neutral-200/60 rounded-full text-slate-600 opacity-0 hover:opacity-100 transition-opacity duration-150">
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
                    ? 'rotateY(-24deg) scale(0.98)'
                    : isPointerDown && liveAngle < 0
                    ? `rotateY(${liveAngle}deg) scale(${1 + liveAngle * 0.001})`
                    : 'rotateY(0deg)',
                transition: isPointerDown
                  ? 'none'
                  : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className={`relative bg-white rounded-r-md border-y border-r border-neutral-200/80 shadow-md flex items-center justify-center overflow-hidden transition-all duration-200 ${
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
                    className="w-full h-full object-contain pointer-events-none bg-white"
                    loading="eager"
                  />
                  {/* Spine shadow */}
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

              {/* Hover turn affordance on desktop */}
              {canGoNext && rightPage && (
                <div className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 border border-neutral-200/60 rounded-full text-slate-600 opacity-0 hover:opacity-100 transition-opacity duration-150">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SINGLE-PAGE VIEW (Mobile / Tablet Portrait - 1 Big Clear Page without obstructive buttons) */
          <div
            style={{
              width: `${singlePageW}px`,
              height: `${singlePageH}px`,
              transformOrigin:
                isPointerDown
                  ? liveAngle < 0
                    ? 'left center'
                    : 'right center'
                  : flipDirection === 'next'
                  ? 'left center'
                  : 'right center',
              transform:
                isFlipping && flipDirection === 'next'
                  ? 'rotateY(-22deg) translateX(-10px) scale(0.98)'
                  : isFlipping && flipDirection === 'prev'
                  ? 'rotateY(22deg) translateX(10px) scale(0.98)'
                  : isPointerDown
                  ? `rotateY(${liveAngle}deg) translateX(${dragOffset * 0.12}px)`
                  : 'rotateY(0deg) translateX(0) scale(1)',
              transition: isPointerDown
                ? 'none'
                : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className="relative bg-white rounded-xl border border-neutral-200/80 shadow-md flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {rightPage ? (
              <>
                <img
                  src={rightPage.dataUrl}
                  alt={`Page ${rightPage.pageNumber}`}
                  className="w-full h-full object-contain pointer-events-none bg-white"
                  loading="eager"
                />

                {/* Subtle paper lighting gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/4 via-transparent to-black/4 pointer-events-none" />

                {/* Page number footer */}
                <div className="absolute bottom-2 right-3 text-[11px] text-slate-400 font-mono bg-white/85 px-1.5 py-0.5 rounded shadow-2xs">
                  {rightPage.pageNumber} / {totalPages}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Floating navigation chevrons for large screens only (placed in stage margins, never overlapping text) */}
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
