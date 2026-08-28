'use client';

import { CartItem } from '../types';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck, Package } from 'lucide-react';

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
  isPaymentLoading,
}: Props) {
  return (
    <div className="h-full flex flex-col justify-between p-6 sm:p-7 bg-[#FAF7F2]/60 md:bg-[#FAF7F2]/40 border-l border-[#E8E2D9]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5A7A56]/10 text-[#5A7A56] flex items-center justify-center font-bold">
              <ShoppingBag size={16} />
            </div>
            <h2
              className="text-lg font-bold text-[#2E2A27]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Order Summary
            </h2>
          </div>
          <span className="text-xs font-bold text-[#5A7A56] bg-[#5A7A56]/10 px-2.5 py-1 rounded-full">
            {totalCount} item{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cart Items List */}
        <div className="mt-4 space-y-3.5 max-h-[36vh] md:max-h-[38vh] overflow-y-auto pr-1">
          {cart.map((item, i) => (
            <div
              key={`${item.id}-${item.year}`}
              className="p-3.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs flex items-center gap-3.5 group hover:border-[#DCD6CC] transition"
            >
              {/* Product Thumbnail */}
              <div className="w-14 h-16 rounded-xl bg-[#F3EFE6] border border-[#E8E2D9] overflow-hidden shrink-0 relative">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A39B8F]">
                    <Package size={18} />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-[#2E2A27] truncate leading-snug">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-[#5C564E] bg-[#FAF7F2] border border-[#E8E2D9] px-2 py-0.5 rounded-md">
                    Age: {item.year}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7A7367]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="inline-flex items-center rounded-lg border border-[#DCD6CC] bg-[#FAF7F2] p-0.5">
                    <button
                      onClick={() => onChangeQty(i, -1)}
                      aria-label="Decrease quantity"
                      className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-[#5C564E] hover:bg-white hover:shadow-2xs transition cursor-pointer"
                    >
                      −
                    </button>
                    <span className="text-xs font-extrabold text-[#2E2A27] min-w-[22px] text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onChangeQty(i, 1)}
                      disabled={item.qty >= item.maxStock}
                      aria-label="Increase quantity"
                      className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-[#5C564E] hover:bg-white hover:shadow-2xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>

                  {item.qty >= item.maxStock && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Max stock
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Remove */}
              <div className="text-right shrink-0 flex flex-col justify-between items-end self-stretch py-0.5">
                <span className="font-extrabold text-sm text-[#2E2A27]">
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => onRemove(i)}
                  className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Breakdown & Action */}
      <div className="mt-5 pt-4 border-t border-[#E8E2D9] space-y-3.5">
        {/* Subtotal & Delivery Details */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D9] space-y-2 text-xs">
          <div className="flex justify-between text-[#7A7367]">
            <span>Items Subtotal ({totalCount} items)</span>
            <span className="font-semibold text-[#2E2A27]">
              ₹{totalPrice.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex justify-between text-[#7A7367] items-center">
            <span className="flex items-center gap-1">
              <Truck size={13} className="text-[#5A7A56]" /> Delivery Charges
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              FREE
            </span>
          </div>

          <div className="pt-2 border-t border-[#E8E2D9]/70 flex justify-between items-baseline">
            <span className="font-bold text-[#2E2A27] text-sm">Total Payable</span>
            <span className="font-extrabold text-xl text-[#2E2A27]">
              ₹{totalPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Mobile: Proceed Button */}
        {onProceed && (
          <button
            onClick={onProceed}
            className="w-full py-3.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-bold text-sm shadow-md shadow-[#5A7A56]/25 flex md:hidden items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Proceed to Shipping</span>
            <ArrowRight size={16} />
          </button>
        )}

        {/* Desktop: Direct Pay Button if triggered from summary */}
        {onPay && (
          <button
            onClick={onPay}
            disabled={isPaymentLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-[#5A7A56] to-[#3E5C3B] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#5A7A56]/30 hidden md:flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
          >
            {isPaymentLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Pay ₹{totalPrice.toLocaleString('en-IN')} via Razorpay</span>
              </>
            )}
          </button>
        )}

        {/* Security Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C8479] font-medium pt-1">
          <ShieldCheck size={12} className="text-emerald-700" />
          <span>256-bit Encrypted Checkout • UPI, Cards & NetBanking</span>
        </div>
      </div>
    </div>
  );
}
