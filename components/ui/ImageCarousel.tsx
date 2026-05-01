'use client';

import { useState, useEffect } from 'react';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  autoSlide?: boolean;
  interval?: number;
  className?: string;
  isAllOutOfStock?: boolean;
}

export default function ImageCarousel({
  images = [],
  alt,
  autoSlide = true,
  interval = 3000,
  className = "",
  isAllOutOfStock = false,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!autoSlide || images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, autoSlide, interval, isHovered]);

  if (!images.length) {
    return (
      <div className={`bg-[#f5f5f5] flex items-center justify-center ${className}`}>
        <span className="text-[#A8C3A5]/50">No Image</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="min-w-full h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`${alt} - view ${idx + 1}`}
              className={`w-full h-full object-cover ${isAllOutOfStock ? 'grayscale opacity-60' : ''}`}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* Indicators (Dots) */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
