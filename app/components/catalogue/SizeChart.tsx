import React from 'react';

export function SizeChart() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="flex flex-col items-start space-y-6">
        <div>
          <h2 className="text-[28px] md:text-[36px] leading-tight">Size Chart</h2>
          <div className="w-20 h-[3px] rounded-full mt-2" style={{ background: 'linear-gradient(90deg,var(--sage),transparent)' }} />
        </div>

        <div className="w-full max-w-sm product bg-white rounded-[28px] p-3 md:p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.15)] cursor-pointer">
          <div className="relative rounded-[20px] overflow-hidden bg-[#f5f5f5]">
            <img
              src="/size-chart.png"
              alt="Product Size Chart"
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>

        <div className="w-full max-w-sm text-right mt-1">
          <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">SIZE IN INCHES</span>
        </div>

        {/* Text content placed below the image as requested */}
        <div className="w-full max-w-sm mt-4 text-sm text-[#6b6762] space-y-4">
          <p>
            <strong>Note:</strong> Length measured from the shoulder.<br />
            Chest is full round chest.<br />
            For a comfortable fit, please select 2 inches extra from your child's actual chest measurement.
          </p>
          <p>
            <strong>Example:</strong> If your child's chest is 22 inches, choose size with 24 inches chest.
          </p>
        </div>
      </div>
    </div>
  );
}
