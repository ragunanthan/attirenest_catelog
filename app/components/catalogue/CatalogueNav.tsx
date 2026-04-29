'use client';

import { useEffect, useRef } from 'react';
import { Category } from './types';

type Props = {
  categories: Category[];
  activeTab: string;
  totalCartCount: number;
  onOpenCart: () => void;
};

export function CatalogueNav({ categories, activeTab, totalCartCount, onOpenCart }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active tab into view when it changes
  useEffect(() => {
    if (!activeTab || !scrollContainerRef.current) return;

    const activeEl = scrollContainerRef.current.querySelector(
      `[data-tab-id="${activeTab}"]`
    ) as HTMLElement | null;

    if (activeEl) {
      const container = scrollContainerRef.current;
      const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#FFF9F5]/80 border-y border-[#A8C3A5]/15" aria-label="Product categories">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-center gap-2.5 py-3">
          {/* Scrollable category tabs */}
          <div ref={scrollContainerRef} className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2.5" id="category-tabs">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  data-tab-id={cat.id}
                  className={`cat-tab whitespace-nowrap px-4 py-2 rounded-full border border-[#A8C3A5]/30 text-sm font-medium hover:bg-white transition ${activeTab === cat.id ? 'tab-active' : ''}`}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {/* Cart button — always visible, pinned right */}
          <button
            onClick={onOpenCart}
            className="relative shrink-0 w-10 h-10 rounded-full bg-white border border-[#A8C3A5]/30 flex items-center justify-center hover:bg-[#A8C3A5]/10 transition"
            title="Open cart"
            id="cart-button"
            aria-label={`Open cart, ${totalCartCount} item${totalCartCount !== 1 ? 's' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {totalCartCount > 0 && (
              <span className="cart-badge" aria-hidden="true">{totalCartCount}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
