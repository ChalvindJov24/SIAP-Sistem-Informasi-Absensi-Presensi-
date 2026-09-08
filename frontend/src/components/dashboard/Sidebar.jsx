import { useAuth } from '../../context/AuthContext.jsx';
import { MENU_ITEMS } from '../../config/menuConfig.js';
import SidebarNavItem from './SidebarNavItem.jsx';
import { X } from 'lucide-react';

/**
 * Sidebar navigasi. Merender menu dari satu array MENU_ITEMS (menuConfig.js),
 * difilter berdasarkan role user yang login (toUpperCase untuk mencegah bug case-sensitive).
 *
 * Digunakan di dua tempat:
 *  1. Desktop (>= md): ditampilkan sebagai kolom tetap di DashboardLayout (tanpa props).
 *  2. Mobile drawer (< md): menerima prop `showClose` untuk menampilkan tombol ✕
 *     dan `onNavigate` untuk menutup drawer setelah memilih menu.
 */
export default function Sidebar({ showClose = false, onNavigate = () => {} }) {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const items = MENU_ITEMS.filter((item) => item.allowedRoles.includes(role));

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between px-4 py-5">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink">SIAK</p>
        {/* Tombol tutup drawer — hanya muncul di mobile ketika drawer terbuka */}
        {showClose && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Tutup menu"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-ink/70 transition-colors hover:bg-surface-soft hover:text-ink md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Menu utama">
        {items.map((item) => (
          <SidebarNavItem key={item.path} item={item} onClick={onNavigate} />
        ))}
      </nav>
    </div>
  );
}