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
  const [step, setStep] = useState<1 | 2>(1); // 1: Summary, 2: Shipping
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when dialog opens
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
        setShipping(prev => ({
          ...prev,
          fullName: data.address.fullName || prev.fullName,
          addressLine1: data.address.addressLine1 || '',
          addressLine2: data.address.addressLine2 || '',
          city: data.address.city || '',
          state: data.address.state || '',
          pincode: data.address.pincode || '',
        }));
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
    setShipping(prev => ({ ...prev, phone: digits }));
    setErrors(prev => ({ ...prev, phone: '' }));
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
        setShipping(prev => ({
          ...prev,
          city: data.city,
          state: data.state,
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
    setShipping(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));

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
    if (!shipping.fullName.trim()) newErrors.fullName = 'Name is required';
    
    // Email Validation with Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!shipping.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(shipping.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (shipping.phone.length !== 10) newErrors.phone = 'Enter 10-digit phone number';
    if (!shipping.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!shipping.city.trim()) newErrors.city = 'City is required';
    if (!shipping.state.trim()) newErrors.state = 'State is required';
    if (!shipping.pincode.trim() || shipping.pincode.length !== 6) newErrors.pincode = 'Enter 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onPay(shipping);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[960px] max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col"
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Complete your shipping details and review your order.</DialogDescription>
        </DialogHeader>

        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-center gap-2 py-4 bg-white border-b border-[#f0ede8]">
          <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-[#5A7A56] scale-125' : 'bg-[#e0ddd9]'}`} />
          <div className="w-8 h-[1px] bg-[#e0ddd9]" />
          <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-[#5A7A56] scale-125' : 'bg-[#e0ddd9]'}`} />
        </div>

        <div className="checkout-grid flex flex-col md:grid md:grid-cols-2">
          {/* Step 1: Summary */}
          <div className={`flex-1 md:block ${step === 1 ? 'block' : 'hidden'} md:order-2`}>
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

          {/* Step 2: Shipping */}
          <div className={`flex-1 md:block ${step === 2 ? 'block' : 'hidden'} md:order-1`}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
