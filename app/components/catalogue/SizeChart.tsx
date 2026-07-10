'use client';

import React, { useState, useEffect } from 'react';

const charts = [
  '/chart1.jpeg',
  '/chart2.jpeg',
  '/chart3.jpeg',
];

export function SizeChart() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % charts.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="flex flex-col items-start space-y-6">
        <div>
          <h2 className="text-[28px] md:text-[36px] leading-tight">Size Chart</h2>
          <div className="w-20 h-[3px] rounded-full mt-2" style={{ background: 'linear-gradient(90deg,var(--sage),transparent)' }} />
        </div>

        <div 
          className="w-full max-w-sm product bg-white rounded-[28px] p-3 md:p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.15)] cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <div className="relative rounded-[20px] overflow-hidden bg-[#f5f5f5] grid">
            {charts.map((src, idx) => (
              <img
                key={src}
                src={src}
                alt={`Product Size Chart ${idx + 1}`}
                className={`w-full h-auto object-contain transition-opacity duration-500 ease-in-out col-start-1 row-start-1 ${
                  idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
          {/* Carousel indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {charts.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-[#6b6762]' : 'bg-gray-300'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
