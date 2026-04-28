'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] p-5">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] border border-[#A8C3A5]/15">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-semibold mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Admin Login</h1>
          <p className="text-sm text-[#6b6762]">Enter your credentials to access the dashboard</p>
        </div>

        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4a4642] mb-1.5">User ID</label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4a4642] mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#A8C3A5]/30 focus:outline-none focus:border-[#2E2A27] transition"
              placeholder="Enter password"
            />
          </div>

          {state?.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl bg-[#2E2A27] text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-[#A8C3A5] hover:text-[#2E2A27] transition">← Back to Catalogue</Link>
        </div>
      </div>
    </div>
  );
}
