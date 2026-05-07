'use client';

import { ShippingInfo } from '../types';

type Props = {
  shipping: ShippingInfo;
  errors: Partial<Record<keyof ShippingInfo, string>>;
  isLookingUp: boolean;
  lookupDone: boolean;
  isPincodeLookingUp?: boolean;
  pincodeLookupDone?: boolean;
  isPaymentLoading: boolean;
  totalPrice: number;
  handlePhoneChange: (val: string) => void;
  updateField: (field: keyof ShippingInfo, value: string) => void;
  onSubmit: () => void;
  onBack?: () => void; // For mobile multi-step
};

export function ShippingForm({
  shipping,
  errors,
  isLookingUp,
  lookupDone,
  isPincodeLookingUp,
  pincodeLookupDone,
  isPaymentLoading,
  totalPrice,
  handlePhoneChange,
  updateField,
  onSubmit,
  onBack,
}: Props) {
  return (
    <div className="checkout-left h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="checkout-section-title mb-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Shipping Details
        </h2>
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs font-semibold text-[#5A7A56] flex md:hidden items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Edit Items
          </button>
        )}
      </div>

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
        <p className="text-[10px] text-[#9a938c] mt-1.5 leading-tight italic">
          If you have ordered from us before, next time based on the mobile number you can autofill your address.       </p>
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

      {/* Email Address */}
      <div className="checkout-field">
        <label htmlFor="checkout-email">Email Address *</label>
        <input
          id="checkout-email"
          type="email"
          value={shipping.email}
          onChange={e => updateField('email', e.target.value)}
          placeholder="your@email.com"
          className={errors.email ? 'field-error' : ''}
          autoComplete="email"
        />
        {errors.email && <span className="field-error-msg">{errors.email}</span>}
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
        <div style={{ position: 'relative' }}>
          <input
            id="checkout-pincode"
            type="text"
            value={shipping.pincode}
            onChange={e => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit"
            className={errors.pincode ? 'field-error' : ''}
            autoComplete="postal-code"
          />
          {isPincodeLookingUp && <span className="field-status searching">Searching…</span>}
          {pincodeLookupDone && !isPincodeLookingUp && <span className="field-status found">✓ Location found</span>}
        </div>
        {errors.pincode && <span className="field-error-msg">{errors.pincode}</span>}
      </div>

      <div className="mt-6 flex md:hidden flex-col">
        <button
          onClick={onSubmit}
          disabled={isPaymentLoading}
          className="pay-btn w-full flex items-center justify-center gap-3 transition-opacity disabled:opacity-50"
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
        <p className="text-center text-[11px] text-[#9a938c] mt-4">
          🔒 Secured by Razorpay · UPI · Cards · Net Banking
        </p>
      </div>
    </div>
  );
}
