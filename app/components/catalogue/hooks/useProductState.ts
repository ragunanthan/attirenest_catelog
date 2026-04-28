import { useState, useCallback } from 'react';
import { Product } from '../types';

export function useProductState(initialProducts: Product[]) {
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [prices, setPrices] = useState<Record<number, number>>(() => {
    const initPrices: Record<number, number> = {};
    initialProducts.forEach((p) => { initPrices[p.id] = p.basePrice; });
    return initPrices;
  });
  const [animatingPrices, setAnimatingPrices] = useState<Record<number, boolean>>({});
  const [addedFlags, setAddedFlags] = useState<Record<number, boolean>>({});

  const handleYearChange = useCallback((product: Product, yearStr: string) => {
    const year = parseInt(yearStr);
    if (!year) {
      setSelections(prev => ({ ...prev, [product.id]: 0 }));
      setPrices(prev => ({ ...prev, [product.id]: product.basePrice }));
      return;
    }
    setSelections(prev => ({ ...prev, [product.id]: year }));
    const variant = product.variants?.find(v => v.year === year);
    setPrices(prev => ({ ...prev, [product.id]: variant ? variant.price : product.basePrice }));
    setAnimatingPrices(prev => ({ ...prev, [product.id]: false }));
    setTimeout(() => setAnimatingPrices(prev => ({ ...prev, [product.id]: true })), 10);
  }, []);

  const setProductAdded = useCallback((productId: number) => {
    setAddedFlags(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => setAddedFlags(prev => ({ ...prev, [productId]: false })), 1200);
  }, []);

  return {
    selections,
    prices,
    animatingPrices,
    addedFlags,
    handleYearChange,
    setProductAdded
  };
}
