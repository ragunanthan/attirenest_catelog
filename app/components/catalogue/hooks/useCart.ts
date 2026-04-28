import { useState, useCallback } from 'react';
import { CartItem } from '../types';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.id === item.id && c.year === item.year);
      if (idx >= 0) {
        if (prev[idx].qty >= item.maxStock) {
          alert(`Only ${item.maxStock} left in stock!`);
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const changeQty = useCallback((idx: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const item = next[idx];
      const newQty = item.qty + delta;
      if (newQty > item.maxStock) {
        alert(`Only ${item.maxStock} available!`);
        return prev;
      }
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...item, qty: newQty };
      }
      return next;
    });
  }, []);

  const removeFromCart = useCallback((idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalCount = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return { cart, addToCart, changeQty, removeFromCart, clearCart, totalCount, totalPrice };
}
