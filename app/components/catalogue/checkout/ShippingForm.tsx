'use client';

import { ShippingInfo } from '../types';
import {
  MapPin,
  Phone,
  User,
  Mail,
  Home,
  Building,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

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
  onBack?: () => void;
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
    <div className="h-full flex flex-col justify-between p-6 sm:p-7 overflow-y-auto bg-white">
      <div>
        {/* Header & Back Action */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5A7A56]/10 text-[#5A7A56] flex items-center justify-center font-bold">
              <MapPin size={16} />
            </div>
            <h2
              className="text-lg font-bold text-[#2E2A27]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Delivery Details
            </h2>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-bold text-[#5A7A56] flex md:hidden items-center gap-1 hover:underline cursor-pointer"
            >
              <ArrowLeft size={13} /> Edit Bag
            </button>
          )}
        </div>

        {/* Returning Customer Autofill Notice */}
        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] mb-4 flex items-center gap-2.5 text-xs text-[#5C564E]">
          <Sparkles size={15} className="text-[#5A7A56] shrink-0" />
          <span>
            <strong>Returning customer?</strong> Enter mobile number to auto-fill your saved address.
          </span>
        </div>

        {/* Input Fields Grid */}
        <div className="space-y-3.5">
          {/* Phone Number */}
          <div>
            <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="tel"
                value={shipping.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="10-digit mobile number"
                className={`w-full pl-10 pr-24 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                  errors.phone ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                }`}
                autoComplete="tel"
              />
              {isLookingUp && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8C8479] font-medium animate-pulse">
                  Searching...
                </span>
              )}
              {lookupDone && !isLookingUp && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 size={11} /> Saved
                </span>
              )}
            </div>
            {errors.phone && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.phone}</p>}
          </div>

          {/* Name & Email (2 columns on md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
                <input
                  type="text"
                  value={shipping.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Receiver's name"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                    errors.fullName ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                  }`}
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
                <input
                  type="email"
                  value={shipping.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Receipt & updates"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                    errors.email ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                  }`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
              Flat / House No / Building / Street <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Home size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="text"
                value={shipping.addressLine1}
                onChange={(e) => updateField('addressLine1', e.target.value)}
                placeholder="Door No, Building Name, Street address"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                  errors.addressLine1 ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                }`}
                autoComplete="address-line1"
              />
            </div>
            {errors.addressLine1 && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.addressLine1}</p>}
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
              Landmark / Area <span className="text-[#8C8479] font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="text"
                value={shipping.addressLine2}
                onChange={(e) => updateField('addressLine2', e.target.value)}
                placeholder="Nearby landmark or sector"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition"
                autoComplete="address-line2"
              />
            </div>
          </div>

          {/* Pincode + City + State (Placed right below for instant autofill) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pincode */}
            <div>
              <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={shipping.pincode}
                  onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit PIN"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-mono font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                    errors.pincode ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                  }`}
                  autoComplete="postal-code"
                />
                {isPincodeLookingUp && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#8C8479] animate-pulse">
                    Lookup...
                  </span>
                )}
                {pincodeLookupDone && !isPincodeLookingUp && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-700">
                    ✓
                  </span>
                )}
              </div>
              {errors.pincode && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.pincode}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={shipping.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="City / Town"
                className={`w-full px-3.5 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                  errors.city ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                }`}
                autoComplete="address-level2"
              />
              {errors.city && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.city}</p>}
            </div>

            {/* State */}
            <div>
              <label className="block text-[11px] font-bold text-[#5C564E] uppercase tracking-wider mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={shipping.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="State"
                className={`w-full px-3.5 py-2.5 rounded-2xl border bg-[#FAF7F2]/40 text-xs font-medium text-[#2E2A27] focus:bg-white focus:outline-none focus:border-[#5A7A56] transition ${
                  errors.state ? 'border-red-400 bg-red-50/30' : 'border-[#DCD6CC]'
                }`}
                autoComplete="address-level1"
              />
              {errors.state && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.state}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Pay Bar */}
      <div className="mt-5 pt-4 border-t border-[#E8E2D9] space-y-2.5 flex md:hidden flex-col">
        <button
          onClick={onSubmit}
          disabled={isPaymentLoading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-[#5A7A56] to-[#3E5C3B] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#5A7A56]/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
        >
          {isPaymentLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Initiating Razorpay...</span>
            </>
          ) : (
            <>
              <Lock size={15} />
              <span>Pay ₹{totalPrice.toLocaleString('en-IN')} via Razorpay</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#8C8479]">
          <ShieldCheck size={12} className="text-emerald-700" />
          <span>Secured by Razorpay • UPI, Credit/Debit Cards, NetBanking</span>
        </div>
      </div>
    </div>
  );
}
