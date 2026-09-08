import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { logout } from '../../api/authApi.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Dictionary statis pathname -> judul halaman. Tidak memakai Context/Redux untuk judul.
const titleMap = {
  '/dashboard': 'Dashboard',
  '/absensi': 'Absensi',
  '/kas': 'Kas',
  '/kelola-siswa': 'Kelola Siswa',
  '/ubah-password': 'Ubah Password',
};

/**
 * Top bar: judul halaman (dari location.pathname), info user (username + role badge),
 * dan tombol logout. Padding px-8 py-4 + justify-between sesuai struktur shell.
 * Tombol hamburger (onOpenMenu) hanya muncul di mobile (< md) untuk membuka drawer.
 */
export default function TopBar({ onOpenMenu }) {
  const { user, refetch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = titleMap[location.pathname] || 'Dashboard';

  async function handleLogout() {
    try {
      await logout();
    } finally {
      await refetch();
      navigate('/login');
    }
  }

  return (
    <header className="px-8 py-4 border-b border-hairline flex items-center justify-between bg-canvas">
      <div className="flex min-w-0 items-center gap-3">
        {/* Hamburger — hanya muncul di < md (mobile). Sidebar desktop tidak butuh ini. */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Buka menu"
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-hairline text-ink transition-colors hover:bg-surface-soft md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <h1 className="truncate text-lg font-semibold tracking-tight text-ink md:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink/70 sm:inline">{user?.username}</span>
        <span className="rounded-pill bg-surface-soft px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink/70">
          {user?.role}
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-pill bg-ink px-3 py-2 text-sm font-medium text-on-ink transition-colors hover:bg-ink/90"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}