'use client';

import { CartItem } from '../types';

type Props = {
  cart: CartItem[];
  totalPrice: number;
  totalCount: number;
  onChangeQty: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  onProceed?: () => void;
  onPay?: () => void;
  isPaymentLoading?: boolean;
};

export function CartSummary({
  cart,
  totalPrice,
  totalCount,
  onChangeQty,
  onRemove,
  onProceed,
  onPay,
  isPaymentLoading
}: Props) {
  return (
    <div className="checkout-right h-full flex flex-col">
      <h2 className="checkout-section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
        Order Summary
        <span className="checkout-item-count">{totalCount} item{totalCount !== 1 ? 's' : ''}</span>
      </h2>

      <div className="checkout-items flex-1 overflow-y-auto max-h-[40vh] md:max-h-none">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#9a938c]">
            <p className="text-4xl mb-4">🛍️</p>
            <p>Your cart is empty.</p>
          </div>
        ) : (
          cart.map((item, i) => (
            <div key={`${item.id}-${item.year}`} className="cart-item border-b border-[#f0f0f0] py-3 md:py-4 last:border-0">
              <div className="flex-1">
                <div className="font-semibold text-sm text-[#2E2A27]">{item.name}</div>
                <div className="text-xs text-[#7a766f] mt-1">
                  Age: {item.year} &middot; ₹{item.price.toLocaleString('en-IN')} each
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => onChangeQty(i, -1)} aria-label="Decrease quantity" className="qty-btn">−</button>
                  <span className="text-sm font-bold min-w-[20px] text-center">{item.qty}</span>
                  <button
                    onClick={() => onChangeQty(i, 1)}
                    disabled={item.qty >= item.maxStock}
                    aria-label="Increase quantity"
                    className="qty-btn disabled:opacity-40 disabled:cursor-not-allowed"
                  >+</button>
                  {item.qty >= item.maxStock && (
                    <span className="text-[10px] color-[#e57373] font-semibold">Max stock</span>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <div className="font-bold text-base text-[#2E2A27]">
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </div>
                <button onClick={() => onRemove(i)} className="remove-btn text-red-500 text-[11px] mt-2 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="checkout-total mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#e0ddd9]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-xs text-[#9a938c]">Order Total</div>
              <div className="text-2xl font-extrabold text-[#2E2A27] tracking-tight">
                ₹{totalPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {onProceed && (
            <button
              onClick={onProceed}
              className="pay-btn w-full flex md:hidden items-center justify-center gap-2"
            >
              Proceed to Shipping
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}

          {onPay && (
            <button
              onClick={onPay}
              disabled={isPaymentLoading}
              className="pay-btn w-full hidden md:flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isPaymentLoading ? (
                <>
                  <span className="pay-spinner" />
                  Processing…
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <path d="M1 10h22" />
                  </svg>
                  Pay ₹{totalPrice.toLocaleString('en-IN')}
                </>
              )}
            </button>
          )}

          <p className="text-center text-[11px] text-[#9a938c] mt-4 hidden md:block">
            🔒 Secured by Razorpay · UPI · Cards · Net Banking
          </p>
        </div>
      )}
    </div>
  );
}
