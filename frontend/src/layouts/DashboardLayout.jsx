import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { KeyRound, LayoutDashboard, LogOut, Menu, Star, Store, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { roleLabel } from '../utils/validators';

const NAV = {
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/stores', label: 'Stores', icon: Store },
  ],
  USER: [{ to: '/user/stores', label: 'Stores', icon: Store }],
  STORE_OWNER: [{ to: '/owner/dashboard', label: 'My store', icon: LayoutDashboard }],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const links = [...NAV[user.role], { to: '/password', label: 'Change password', icon: KeyRound }];

  const doLogout = () => {
    logout();
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-ink-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {open && <div className="fixed inset-0 z-30 bg-ink-900/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-ink-900 p-4 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-2 text-lg font-extrabold text-white"><Star className="h-5 w-5 fill-star text-star" /> Rollex</div>
          <button className="text-slate-300 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">{roleLabel(user.role)}</div>
          <div className="flex items-center gap-3">
            <div className="max-w-[10rem] truncate text-right text-sm font-semibold text-slate-800 sm:max-w-xs" title={user.name}>
              {user.name}
            </div>
            <button className="btn-secondary px-3 py-1.5" onClick={() => setConfirmLogout(true)}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
