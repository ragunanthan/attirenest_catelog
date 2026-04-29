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
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingInfo, string>>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setShipping(EMPTY_SHIPPING);
      setErrors({});
      setLookupDone(false);
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

  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShipping(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
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
        className="sm:max-w-[960px] max-h-[92vh] p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Complete your shipping details and review your order.</DialogDescription>
        </DialogHeader>

        <div className="checkout-grid">
          {/* ─── Left: Shipping Form ─── */}
          <div className="checkout-left">
            <h2 className="checkout-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Shipping Details
            </h2>

            {/* Phone */}
            <div className="checkout-field">
              <label htmlFor="checkout-phone">Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={shipping.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className={errors.phone ? 'field-error' : ''}
                  autoComplete="tel"
                />
                {isLookingUp && <span className="field-status searching">Searching…</span>}
                {lookupDone && !isLookingUp && <span className="field-status found">✓ Address found</span>}
              </div>
              {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
            </div>

            {/* Full Name */}
            <div className="checkout-field">
              <label htmlFor="checkout-name">Full Name *</label>
              <input
                id="checkout-name"
                type="text"
                value={shipping.fullName}
                onChange={e => updateField('fullName', e.target.value)}
                placeholder="Enter your full name"
                className={errors.fullName ? 'field-error' : ''}
                autoComplete="name"
              />
              {errors.fullName && <span className="field-error-msg">{errors.fullName}</span>}
            </div>

            {/* Address Line 1 */}
            <div className="checkout-field">
              <label htmlFor="checkout-addr1">Address Line 1 *</label>
              <input
                id="checkout-addr1"
                type="text"
                value={shipping.addressLine1}
                onChange={e => updateField('addressLine1', e.target.value)}
                placeholder="House / Flat / Street"
                className={errors.addressLine1 ? 'field-error' : ''}
                autoComplete="address-line1"
              />
              {errors.addressLine1 && <span className="field-error-msg">{errors.addressLine1}</span>}
            </div>

            {/* Address Line 2 */}
            <div className="checkout-field">
              <label htmlFor="checkout-addr2">Address Line 2</label>
              <input
                id="checkout-addr2"
                type="text"
                value={shipping.addressLine2}
                onChange={e => updateField('addressLine2', e.target.value)}
                placeholder="Landmark, Area (optional)"
                autoComplete="address-line2"
              />
            </div>

            {/* City + State */}
            <div className="checkout-row">
              <div className="checkout-field">
                <label htmlFor="checkout-city">City *</label>
                <input
                  id="checkout-city"
                  type="text"
                  value={shipping.city}
                  onChange={e => updateField('city', e.target.value)}
                  placeholder="City"
                  className={errors.city ? 'field-error' : ''}
                  autoComplete="address-level2"
                />
                {errors.city && <span className="field-error-msg">{errors.city}</span>}
              </div>
              <div className="checkout-field">
                <label htmlFor="checkout-state">State *</label>
                <input
                  id="checkout-state"
                  type="text"
                  value={shipping.state}
                  onChange={e => updateField('state', e.target.value)}
                  placeholder="State"
                  className={errors.state ? 'field-error' : ''}
                  autoComplete="address-level1"
                />
                {errors.state && <span className="field-error-msg">{errors.state}</span>}
              </div>
            </div>

            {/* Pincode */}
            <div className="checkout-field" style={{ maxWidth: '180px' }}>
              <label htmlFor="checkout-pincode">Pincode *</label>
              <input
                id="checkout-pincode"
                type="text"
                value={shipping.pincode}
                onChange={e => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit"
                className={errors.pincode ? 'field-error' : ''}
                autoComplete="postal-code"
              />
              {errors.pincode && <span className="field-error-msg">{errors.pincode}</span>}
            </div>
          </div>

          {/* ─── Right: Order Summary ─── */}
          <div className="checkout-right">
            <h2 className="checkout-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              Order Summary
              <span className="checkout-item-count">{totalCount} item{totalCount !== 1 ? 's' : ''}</span>
            </h2>

            <div className="checkout-items">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9a938c', marginTop: '40px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</p>
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={`${item.id}-${item.year}`} className="cart-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#7a766f', marginTop: '2px' }}>
                        Age: {item.year}Y &middot; ₹{item.price.toLocaleString('en-IN')} each
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <button onClick={() => onChangeQty(i, -1)} aria-label="Decrease quantity" className="qty-btn">−</button>
                        <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                        <button
                          onClick={() => onChangeQty(i, 1)}
                          disabled={item.qty >= item.maxStock}
                          aria-label="Increase quantity"
                          className="qty-btn"
                          style={{ opacity: item.qty >= item.maxStock ? 0.4 : 1, cursor: item.qty >= item.maxStock ? 'not-allowed' : 'pointer' }}
                        >+</button>
                        {item.qty >= item.maxStock && (
                          <span style={{ fontSize: '10px', color: '#e57373', fontWeight: 600 }}>Max stock</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#2E2A27' }}>
                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                      </div>
                      <button onClick={() => onRemove(i)} className="remove-btn" aria-label={`Remove ${item.name} from cart`}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total + Pay */}
            {cart.length > 0 && (
              <div className="checkout-total">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#9a938c' }}>Order Total</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#2E2A27', letterSpacing: '-0.5px' }}>
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isPaymentLoading || cart.length === 0}
                  className="pay-btn"
                  aria-live="polite"
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

                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9a938c', marginTop: '8px' }}>
                  🔒 Secured by Razorpay · UPI · Cards · Net Banking
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
