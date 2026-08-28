'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import Link from 'next/link';
import { Lock, ArrowLeft, Sparkles, User } from 'lucide-react';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-5">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-black/5 border border-[#E8E2D9]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5A7A56] to-[#3E5C3B] text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#5A7A56]/30 font-bold text-xl">
            AN
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#2E2A27] tracking-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Admin Portal
          </h1>
          <p className="text-xs text-[#7A7367] mt-1.5 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-[#5A7A56]" />
            Sign in to manage catalog, orders & stock
          </p>
        </div>

        {/* Login Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
              Admin User ID
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                placeholder="Enter admin username"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5C564E] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8479]" />
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#DCD6CC] bg-[#FAF7F2]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A7A56]/40 focus:border-[#5A7A56] transition text-sm text-[#2E2A27]"
              />
            </div>
          </div>

          {state?.error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl bg-[#5A7A56] hover:bg-[#486345] text-white font-bold text-sm shadow-md shadow-[#5A7A56]/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isPending ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-8 text-center pt-5 border-t border-[#E8E2D9]/70">
          <Link
            href="/"
            className="text-xs font-semibold text-[#5A7A56] hover:text-[#2E2A27] transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
