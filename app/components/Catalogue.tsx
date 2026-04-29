"use client";

import { useState, useCallback } from 'react';
import { CatalogueProps, Product, ShippingInfo } from './catalogue/types';
import { useCart } from './catalogue/hooks/useCart';
import { useScrollSpy } from './catalogue/hooks/useScrollSpy';
import { useRazorpay } from './catalogue/hooks/useRazorpay';
import { useProductState } from './catalogue/hooks/useProductState';
import { CatalogueHeader } from './catalogue/CatalogueHeader';
import { CatalogueNav } from './catalogue/CatalogueNav';
import { ProductCard } from './catalogue/ProductCard';
import { CartModal } from './catalogue/CartModal';
import { CatalogueFooter } from './catalogue/CatalogueFooter';

export default function Catalogue({ initialCategories, initialProducts }: CatalogueProps) {
  const [categories] = useState(initialCategories);
  const [products] = useState(initialProducts);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Custom Hooks
  const { cart, addToCart, changeQty, removeFromCart, clearCart, totalCount, totalPrice } = useCart();
  const { activeTab, sectionsRef } = useScrollSpy(categories, products);
  const { selections, prices, animatingPrices, addedFlags, errorFlags, handleYearChange, setProductAdded, triggerError } = useProductState(products);
  
  const handlePaymentSuccess = useCallback(() => {
    clearCart();
    setIsCartOpen(false);
  }, [clearCart]);

  const { handlePayment, isLoading: isPaymentLoading, paymentSuccess } = useRazorpay(
    cart,
    totalPrice,
    totalCount,
    handlePaymentSuccess
  );

  // Handlers
  const onAddToCart = useCallback((product: Product, openCart: boolean = true) => {
    const year = selections[product.id];
    // Validation is now handled in ProductCard component locally

    const hasVariants = !!product.variants?.length;
    const variant = hasVariants ? product.variants!.find(v => v.year === year) : null;

    if (hasVariants && (!variant || variant.stock <= 0)) {
      alert('Sorry, this size is out of stock!');
      return;
    }

    const price = prices[product.id];
    const maxStock = variant ? variant.stock : 999;

    addToCart({
      id: product.id,
      name: product.name,
      year,
      price,
      qty: 1,
      maxStock
    });

    if (openCart) {
      setIsCartOpen(true);
    }
    setProductAdded(product.id);
  }, [selections, prices, addToCart, setProductAdded]);

  const onPay = useCallback((shippingInfo: ShippingInfo) => {
    handlePayment(shippingInfo);
  }, [handlePayment]);

  return (
    <div className="min-h-screen">
      {/* Payment success toast */}
      {paymentSuccess && (
        <div 
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#5A7A56] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold animate-bounce"
          role="status"
        >
          <span>✅</span> Payment Successful! Thank you for your order.
        </div>
      )}

      <CatalogueHeader onOpenCart={() => setIsCartOpen(true)} />

      <CatalogueNav 
        categories={categories}
        activeTab={activeTab}
        totalCartCount={totalCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-5 py-10 md:py-14" id="main-content">
        <div id="dynamic-categories">
          {categories.map((cat, index) => {
            const catProducts = products.filter(p => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;

            return (
              <section 
                key={cat.id} 
                id={cat.id} 
                className={`scroll-mt-28 ${index > 0 ? 'mt-16' : ''}`}
                ref={el => { sectionsRef.current[index] = el; }}
              >
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-[28px] md:text-[36px] leading-tight">{cat.name}</h2>
                    <p className="text-sm text-[#6b6762] mt-1">{cat.description}</p>
                  </div>
                  <div 
                    className="hidden md:block w-20 h-[3px] rounded-full" 
                    style={{ background: `linear-gradient(90deg,var(--${cat.theme || 'sage'}),transparent)` }} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {catProducts.map(product => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      selectedYear={selections[product.id]}
                      displayPrice={prices[product.id] || product.basePrice}
                      isPriceAnimating={animatingPrices[product.id]}
                      isAdded={addedFlags[product.id]}
                      hasError={errorFlags[product.id]}
                      onYearChange={handleYearChange}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <CatalogueFooter />

      <CartModal 
        isOpen={isCartOpen}
        cart={cart}
        totalPrice={totalPrice}
        totalCount={totalCount}
        isPaymentLoading={isPaymentLoading}
        onClose={() => setIsCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeFromCart}
        onPay={onPay}
      />
    </div>
  );
}
