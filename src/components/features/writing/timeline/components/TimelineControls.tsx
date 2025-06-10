
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimelineControlsProps {
  children: React.ReactNode;
}

const TimelineControls = ({ children }: TimelineControlsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Enable horizontal mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        scrollRef.current.scrollBy({
          left: e.deltaY,
          behavior: 'auto'
        });
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => scrollElement.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={scrollLeft}
        className="h-8 w-8 p-0 flex-shrink-0 hover:bg-slate-100"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center mx-3 max-w-6xl overflow-hidden">
        <div
          ref={scrollRef}
          className="flex items-center overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            minHeight: '16px'
          }}
        >
          {children}
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={scrollRight}
        className="h-8 w-8 p-0 flex-shrink-0 hover:bg-slate-100"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </>
  );
};

export default TimelineControls;
