import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar.jsx';
import TopBar from '../components/dashboard/TopBar.jsx';

/**
 * Dashboard Shell: wadah semua halaman setelah login.
 * Responsive:
 *  - >= md (768px): sidebar tampil sebagai kolom flexbox biasa (flex-shrink-0),
 *    konten utama di sebelah kanannya.
 *  - < md (mobile): sidebar TERSEMBUNYI total (hidden), diganti drawer yang
 *    digeser dari kiri (translate-x), dibuka lewat tombol hamburger di TopBar.
 * Drawer otomatis tertutup saat route berubah (useEffect pathname).
 */
export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Tutup otomatis saat route berubah (kontrak paling sederhana).
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar desktop (>= md): kolom flexbox biasa, tidak fixed */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-hairline bg-canvas md:flex md:flex-col">
        <Sidebar />
      </aside>

      {/* Sidebar mobile drawer (< md): tersembunyi total default, digeser dari kiri saat dibuka */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform flex-col border-r border-hairline bg-canvas transition-transform duration-200 ease-in-out md:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar showClose={menuOpen} onNavigate={closeMenu} />
      </aside>

      {/* Overlay gelap di belakang drawer mobile — klik untuk menutup */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}