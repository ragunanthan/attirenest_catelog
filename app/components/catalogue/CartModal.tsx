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
import { ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';

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
        setErrors({}); // Clear all errors as we found a complete address
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

    // Email Validation with Regex
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
      // If validation failed on desktop or mobile, ensure user is viewing the shipping form
      setStep(2);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[960px] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col rounded-3xl border border-[#E8E2D9] bg-white shadow-2xl"
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Shopping Cart Checkout</DialogTitle>
          <DialogDescription>Review your bag items and complete delivery details.</DialogDescription>
        </DialogHeader>

        {/* 1. EMPTY CART EXPERIENCE */}
        {cart.length === 0 ? (
          <div className="py-14 px-6 sm:px-12 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5">
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

            {/* Quality Perks Strip */}
            <div className="pt-6 border-t border-[#E8E2D9] w-full grid grid-cols-3 gap-2 text-[11px] text-[#7A7367]">
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
          <div className="flex flex-col h-full">
            {/* Mobile Step Switcher Bar */}
            <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#FAF7F2] border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(1)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    step === 1
                      ? 'bg-[#5A7A56] text-white shadow-xs'
                      : 'bg-white text-[#5C564E] border border-[#E8E2D9]'
                  }`}
                >
                  1. Bag ({totalCount})
                </button>
                <button
                  onClick={() => setStep(2)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    step === 2
                      ? 'bg-[#5A7A56] text-white shadow-xs'
                      : 'bg-white text-[#5C564E] border border-[#E8E2D9]'
                  }`}
                >
                  2. Delivery
                </button>
              </div>

              <span className="font-extrabold text-sm text-[#2E2A27]">
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Desktop & Mobile 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[520px] max-h-[85vh]">
              {/* Left Column (Shipping Details) - 7 cols */}
              <div
                className={`md:col-span-7 h-full ${
                  step === 2 ? 'block' : 'hidden md:block'
                }`}
              >
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
              </div>

              {/* Right Column (Cart Summary & Line Items) - 5 cols */}
              <div
                className={`md:col-span-5 h-full ${
                  step === 1 ? 'block' : 'hidden md:block'
                }`}
              >
                <CartSummary
                  cart={cart}
                  totalPrice={totalPrice}
                  totalCount={totalCount}
                  onChangeQty={onChangeQty}
                  onRemove={onRemove}
                  onProceed={() => setStep(2)}
                  onPay={handleSubmit}
                  isPaymentLoading={isPaymentLoading}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
