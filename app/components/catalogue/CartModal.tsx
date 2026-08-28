'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CartItem, ShippingInfo } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { CartSummary } from './checkout/CartSummary';
import { ShippingForm } from './checkout/ShippingForm';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
  Lock,
  ArrowLeft,
} from 'lucide-react';

type Props = {
  isOpen: boolean;
  cart: CartItem[];
  totalPrice: number;
  totalCount: number;
  isPaymentLoading: boolean;
  onClose: () => void;
  onChangeQty: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  onPay: (shippingInfo: ShippingInfo) => void;
};

const EMPTY_SHIPPING: ShippingInfo = {
  fullName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

export function CartModal({
  isOpen,
  cart,
  totalPrice,
  totalCount,
  isPaymentLoading,
  onClose,
  onChangeQty,
  onRemove,
  onPay,
}: Props) {
  const [shipping, setShipping] = useState<ShippingInfo>(EMPTY_SHIPPING);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [isPincodeLookingUp, setIsPincodeLookingUp] = useState(false);
  const [pincodeLookupDone, setPincodeLookupDone] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const [step, setStep] = useState<1 | 2>(1); // 1: Bag Review, 2: Shipping
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setShipping(EMPTY_SHIPPING);
      setErrors({});
      setLookupDone(false);
      setStep(1);
    }
  };

  // Phone number lookup with debounce
  const lookupPhone = useCallback(async (phone: string) => {
    if (phone.length < 10) {
      setLookupDone(false);
      return;
    }
    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/customer/lookup?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.address) {
        setShipping((prev) => ({
          ...prev,
          fullName: data.address.fullName || prev.fullName,
          email: data.address.email || prev.email,
          addressLine1: data.address.addressLine1 || '',
          addressLine2: data.address.addressLine2 || '',
          city: data.address.city || '',
          state: data.address.state || '',
          pincode: data.address.pincode || '',
        }));
        setErrors({});
        setLookupDone(true);
      } else {
        setLookupDone(false);
      }
    } catch {
      setLookupDone(false);
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setShipping((prev) => ({ ...prev, phone: digits }));
    setErrors((prev) => ({ ...prev, phone: '' }));
    setLookupDone(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (digits.length >= 10) {
      debounceRef.current = setTimeout(() => lookupPhone(digits), 400);
    }
  };

  // Pincode lookup
  const lookupPincode = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) return;
    setIsPincodeLookingUp(true);
    try {
      const res = await fetch(`/api/pincode/lookup?pincode=${encodeURIComponent(pincode)}`);
      const data = await res.json();
      if (data.city && data.state) {
        setShipping((prev) => ({
          ...prev,
          city: data.city,
          state: data.state,
        }));
        setErrors((prev) => ({
          ...prev,
          city: '',
          state: '',
        }));
        setPincodeLookupDone(true);
      }
    } catch {
      setPincodeLookupDone(false);
    } finally {
      setIsPincodeLookingUp(false);
    }
  }, []);

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));

    if (field === 'pincode') {
      setPincodeLookupDone(false);
      const digits = value.replace(/\D/g, '').slice(0, 6);
      if (digits.length === 6) {
        lookupPincode(digits);
      }
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingInfo, string>> = {};
    if (!shipping.fullName.trim()) newErrors.fullName = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!shipping.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(shipping.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (shipping.phone.length !== 10) newErrors.phone = 'Enter 10-digit phone number';
    if (!shipping.addressLine1.trim()) newErrors.addressLine1 = 'Street address is required';
    if (!shipping.city.trim()) newErrors.city = 'City is required';
    if (!shipping.state.trim()) newErrors.state = 'State is required';
    if (!shipping.pincode.trim() || shipping.pincode.length !== 6) newErrors.pincode = 'Enter 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onPay(shipping);
    } else {
      setStep(2);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-md:fixed max-md:inset-0 max-md:top-0 max-md:left-0 max-md:translate-x-0 max-md:translate-y-0 max-md:w-screen max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:max-w-none max-md:rounded-none max-md:p-0 md:fixed md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-[960px] md:max-h-[90vh] md:w-[92vw] md:rounded-[32px] md:p-0 overflow-hidden flex flex-col bg-white border border-[#E8E2D9] shadow-2xl z-50 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Shopping Cart Checkout</DialogTitle>
          <DialogDescription>Review your bag items and complete delivery details.</DialogDescription>
        </DialogHeader>

        {/* 1. EMPTY CART EXPERIENCE */}
        {cart.length === 0 ? (
          <div className="h-full flex flex-col justify-between p-6 sm:p-10 max-h-[100dvh] overflow-y-auto">
            {/* Top Close Bar */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#2E2A27] flex items-center justify-center transition cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Empty State Card */}
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 my-auto">
              <div className="w-20 h-20 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D9] flex items-center justify-center text-[#5A7A56] shadow-sm">
                <ShoppingBag size={36} />
              </div>

              <div className="space-y-2">
                <h3
                  className="text-2xl sm:text-3xl font-bold text-[#2E2A27]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Your Bag is Empty
                </h3>
                <p className="text-xs sm:text-sm text-[#7A7367] leading-relaxed">
                  Looks like you haven&apos;t added any clothing pieces yet. Explore our handcrafted collections to find something special.
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-bold text-sm shadow-md shadow-[#5A7A56]/25 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Collection</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Quality Perks Strip */}
            <div className="pt-6 border-t border-[#E8E2D9] w-full max-w-lg mx-auto grid grid-cols-3 gap-2 text-[11px] text-[#7A7367]">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck size={16} className="text-[#5A7A56]" />
                <span>Free Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Sparkles size={16} className="text-[#5A7A56]" />
                <span>100% Pure Cotton</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck size={16} className="text-[#5A7A56]" />
                <span>Encrypted Payments</span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. FILLED CART EXPERIENCE */
          <div className="flex flex-col h-full max-h-[100dvh] md:max-h-[90vh]">
            {/* Top Navigation & Stepper Header (Always Sticky) */}
            <div className="sticky top-0 z-40 px-5 py-3.5 bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] flex items-center justify-between shadow-2xs shrink-0">
              {/* Mobile Left action */}
              <div className="flex items-center gap-2">
                {step === 2 ? (
                  <button
                    onClick={() => setStep(1)}
                    className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-xs font-bold text-[#5C564E] hover:bg-[#E8E2D9] transition cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Bag ({totalCount})
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-bold text-[#2E2A27]">
                    <ShoppingBag size={16} className="text-[#5A7A56]" />
                    <span style={{ fontFamily: "'Fraunces', serif" }}>Shopping Bag</span>
                  </div>
                )}
              </div>

              {/* Center Stepper Indicator */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStep(1)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer ${
                    step === 1
                      ? 'bg-[#5A7A56] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9]'
                  }`}
                >
                  1. Bag ({totalCount})
                </button>
                <span className="text-[#8C8479] text-xs">→</span>
                <button
                  onClick={() => setStep(2)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer ${
                    step === 2
                      ? 'bg-[#5A7A56] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5C564E] hover:bg-[#E8E2D9]'
                  }`}
                >
                  2. Delivery
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#FAF7F2] hover:bg-[#E8E2D9] text-[#2E2A27] flex items-center justify-center transition cursor-pointer"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Middle Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {/* Desktop 2-Column Split View */}
              <div className="hidden md:grid md:grid-cols-12 h-full">
                {/* Left: Shipping Details (7 cols) */}
                <div className="col-span-7 h-full overflow-y-auto">
                  <ShippingForm
                    shipping={shipping}
                    errors={errors}
                    isLookingUp={isLookingUp}
                    lookupDone={lookupDone}
                    isPincodeLookingUp={isPincodeLookingUp}
                    pincodeLookupDone={pincodeLookupDone}
                    isPaymentLoading={isPaymentLoading}
                    totalPrice={totalPrice}
                    handlePhoneChange={handlePhoneChange}
                    updateField={updateField}
                    onSubmit={handleSubmit}
                  />
                </div>

                {/* Right: Order Summary (5 cols) */}
                <div className="col-span-5 h-full overflow-y-auto">
                  <CartSummary
                    cart={cart}
                    totalPrice={totalPrice}
                    totalCount={totalCount}
                    onChangeQty={onChangeQty}
                    onRemove={onRemove}
                    onPay={handleSubmit}
                    isPaymentLoading={isPaymentLoading}
                  />
                </div>
              </div>

              {/* Mobile View (Single Column Scrollable with ample bottom padding) */}
              <div className="block md:hidden pb-32">
                {step === 1 ? (
                  <CartSummary
                    cart={cart}
                    totalPrice={totalPrice}
                    totalCount={totalCount}
                    onChangeQty={onChangeQty}
                    onRemove={onRemove}
                    onProceed={() => setStep(2)}
                    isPaymentLoading={isPaymentLoading}
                  />
                ) : (
                  <ShippingForm
                    shipping={shipping}
                    errors={errors}
                    isLookingUp={isLookingUp}
                    lookupDone={lookupDone}
                    isPincodeLookingUp={isPincodeLookingUp}
                    pincodeLookupDone={pincodeLookupDone}
                    isPaymentLoading={isPaymentLoading}
                    totalPrice={totalPrice}
                    handlePhoneChange={handlePhoneChange}
                    updateField={updateField}
                    onSubmit={handleSubmit}
                    onBack={() => setStep(1)}
                  />
                )}
              </div>
            </div>

            {/* Mobile Sticky Bottom Action Bar */}
            <div className="md:hidden sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D9] p-4 shadow-xl flex items-center justify-between gap-3 shrink-0">
              <div>
                <div className="text-[10px] uppercase font-bold text-[#8C8479]">
                  Total Amount
                </div>
                <div className="text-lg font-extrabold text-[#2E2A27] leading-tight">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </div>
              </div>

              {step === 1 ? (
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-bold text-xs shadow-md shadow-[#5A7A56]/25 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Proceed to Delivery</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPaymentLoading}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-br from-[#5A7A56] to-[#3E5C3B] text-white font-bold text-xs shadow-md shadow-[#5A7A56]/25 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  {isPaymentLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Pay ₹{totalPrice.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
