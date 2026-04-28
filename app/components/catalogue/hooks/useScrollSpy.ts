import { useEffect, useRef, useState } from 'react';
import { Category, Product } from '../types';

export function useScrollSpy(categories: Category[], products: Product[]) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id ?? '');
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveTab(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );

    sectionsRef.current.forEach(s => { if (s) observer.observe(s); });

    return () => { observer.disconnect(); };
  }, [categories, products]);

  return { activeTab, sectionsRef };
}
