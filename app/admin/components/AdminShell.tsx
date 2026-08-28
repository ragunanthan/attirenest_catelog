'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  PlusCircle,
  ShoppingBag,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { logoutAction } from '../actions';

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const navItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Add Product',
    href: '/admin/products/new',
    icon: PlusCircle,
  },
  {
    name: 'Categories',
    href: '/admin/categories',
    icon: FolderKanban,
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
];

export function AdminShell({ children, title, subtitle, actions }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2A27] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#2E2A27] hover:bg-[#F3EFE6] transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#5A7A56] text-white flex items-center justify-center font-bold text-base shadow-xs">
              A
            </span>
            <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              AttireNest
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="text-xs font-medium text-[#5A7A56] bg-[#5A7A56]/10 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#5A7A56]/20 transition"
          >
            Live Site <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-50 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border-b border-[#E8E2D9] p-5 shadow-2xl space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#5A7A56] text-white shadow-md shadow-[#5A7A56]/20 font-semibold'
                      : 'text-[#5C564E] hover:bg-[#F3EFE6] hover:text-[#2E2A27]'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t border-[#E8E2D9] flex items-center justify-between">
              <form action={logoutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                >
                  <LogOut size={16} /> Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E8E2D9] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E8E2D9]/60 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5A7A56] to-[#3E5C3B] text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-[#5A7A56]/30 group-hover:scale-105 transition-transform">
              AN
            </div>
            <div>
              <div className="font-bold text-lg leading-tight text-[#2E2A27]" style={{ fontFamily: "'Fraunces', serif" }}>
                AttireNest
              </div>
              <div className="text-[11px] font-medium text-[#8C8479] tracking-wider uppercase flex items-center gap-1 mt-0.5">
                <Sparkles size={11} className="text-[#5A7A56]" /> Admin Portal
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#A39B8F] uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#5A7A56] text-white shadow-md shadow-[#5A7A56]/25 font-semibold translate-x-1'
                    : 'text-[#665F55] hover:bg-[#FAF7F2] hover:text-[#2E2A27]'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-white' : 'text-[#8C8479]'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#E8E2D9]/60 space-y-3 bg-[#FAF7F2]/50">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-xs font-medium text-[#4A443B] hover:border-[#5A7A56] hover:text-[#5A7A56] transition shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Storefront
            </span>
            <ExternalLink size={13} />
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-transparent text-red-600 text-xs font-semibold hover:bg-red-50 hover:border-red-100 transition cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Page Topbar */}
        {(title || actions) && (
          <div className="bg-white border-b border-[#E8E2D9]/70 px-6 lg:px-10 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {title && (
                  <h1
                    className="text-2xl lg:text-3xl font-bold text-[#2E2A27] tracking-tight"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm text-[#7A7367] mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
            </div>
          </div>
        )}

        {/* Page Body */}
        <div className="p-5 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
