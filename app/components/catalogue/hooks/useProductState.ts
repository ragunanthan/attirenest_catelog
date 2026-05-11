import { useState, useCallback } from 'react';
import { Product } from '../types';

export function useProductState(initialProducts: Product[]) {
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [prices, setPrices] = useState<Record<number, number>>(() => {
    const initPrices: Record<number, number> = {};
    initialProducts.forEach((p) => { initPrices[p.id] = p.basePrice; });
    return initPrices;
  });
  const [animatingPrices, setAnimatingPrices] = useState<Record<number, boolean>>({});
  const [addedFlags, setAddedFlags] = useState<Record<number, boolean>>({});
  const [errorFlags, setErrorFlags] = useState<Record<number, boolean>>({});

  const handleYearChange = useCallback((product: Product, yearStr: string) => {
    setErrorFlags(prev => ({ ...prev, [product.id]: false }));
    if (!yearStr) {
      setSelections(prev => ({ ...prev, [product.id]: '' }));
      setPrices(prev => ({ ...prev, [product.id]: product.basePrice }));
      return;
    }
    setSelections(prev => ({ ...prev, [product.id]: yearStr }));
    const variant = product.variants?.find(v => v.year === yearStr);
    setPrices(prev => ({ ...prev, [product.id]: variant ? variant.price : product.basePrice }));
    setAnimatingPrices(prev => ({ ...prev, [product.id]: false }));
    setTimeout(() => setAnimatingPrices(prev => ({ ...prev, [product.id]: true })), 10);
  }, []);

  const setProductAdded = useCallback((productId: number) => {
    setAddedFlags(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => setAddedFlags(prev => ({ ...prev, [productId]: false })), 1200);
  }, []);

  const triggerError = useCallback((productId: number) => {
    setErrorFlags(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => setErrorFlags(prev => ({ ...prev, [productId]: false })), 1500);
  }, []);

  const resetSelections = useCallback(() => {
    setSelections({});
    setAddedFlags({});
    setErrorFlags({});
    const initPrices: Record<number, number> = {};
    initialProducts.forEach((p) => { initPrices[p.id] = p.basePrice; });
    setPrices(initPrices);
  }, [initialProducts]);

  return {
    selections,
    prices,
    animatingPrices,
    addedFlags,
    errorFlags,
    handleYearChange,
    setProductAdded,
    triggerError,
    resetSelections
  };
}
