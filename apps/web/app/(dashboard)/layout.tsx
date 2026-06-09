'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import { useEffect, useState } from 'react';
import { getInitials } from '../../lib/utils';
import {
  LayoutDashboard,
  Dumbbell,
  HeartPulse,
  BookOpen,
  Settings,
  LogOut,
  Zap,
  Utensils,
  ChevronDown,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/health', label: 'Health', icon: HeartPulse },
  { href: '/nutrition', label: 'Nutrition', icon: Utensils },
  { href: '/exercises', label: 'Library', icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, _hasHydrated, logout, fetchMe } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!accessToken) { router.push('/login'); return; }
    if (!user) fetchMe().catch(() => router.push('/login'));
  }, [_hasHydrated, accessToken, user, router, fetchMe]);

  useEffect(() => {
    const close = () => setProfileOpen(false);
    if (profileOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [profileOpen]);

  if (!_hasHydrated || (!user && !!accessToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const currentPage = NAV_ITEMS.find(
    (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-slate-950 flex-col flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Workout Pro</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={17} />
                  {item.label === 'Library' ? 'Exercises' : item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Settings size={17} />Settings
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut size={17} />Sign out
            </button>
          </div>

          {/* User card */}
          <div className="px-3 pb-4">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {getInitials(user.name, user.email)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name ?? 'Athlete'}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20 pt-safe">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-base">
              {currentPage?.label === 'Library' ? 'Exercises' : (currentPage?.label ?? 'Workout Pro')}
            </span>
          </div>

          {/* Profile button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(user.name, user.email)}
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name ?? 'Athlete'}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={15} />Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content — pb-nav leaves room for bottom tab bar on mobile */}
        <main className="flex-1 overflow-auto pb-nav lg:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-stretch pb-safe">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[3.5rem] transition-colors ${
                active ? 'text-violet-600' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-violet-50' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-violet-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
