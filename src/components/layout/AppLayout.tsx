import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Shield, LayoutDashboard, AlertTriangle } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Top bar */}
      <header className="bg-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
          aria-label="Go to dashboard"
        >
          <Shield className="h-5 w-5 text-shield-mid" />
          <span className="font-bold text-base tracking-tight">
            Rent<span className="text-shield-mid">Shield</span>
          </span>
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav
        className="bg-white border-t border-border px-6 py-2 flex items-center justify-around sticky bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 text-xs font-medium transition-colors ${
              isActive ? 'text-shield' : 'text-slate hover:text-navy'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Cases</span>
        </NavLink>
        <NavLink
          to="/report"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 text-xs font-medium transition-colors ${
              isActive ? 'text-shield' : 'text-slate hover:text-navy'
            }`
          }
        >
          <AlertTriangle className="h-5 w-5" />
          <span>Report</span>
        </NavLink>
      </nav>
    </div>
  );
}
