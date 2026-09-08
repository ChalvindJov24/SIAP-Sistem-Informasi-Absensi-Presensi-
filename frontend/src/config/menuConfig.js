// Konfigurasi menu sidebar. Satu array untuk semua role.
// Dipakai oleh Sidebar.jsx untuk merender menu (filter by role) — BUKAN 4 komponen terpisah.
// Value `icon` adalah string key yang di-map ke komponen lucide-react di SidebarNavItem.
// Urutan array = urutan menu yang tampil.
export const MENU_ITEMS = [
  {
    label: 'Absensi Saya',
    path: '/absensi-saya',
    icon: 'CalendarCheck',
    // Semua role yang punya record students (Backend GET /attendance/me).
    // ADMIN tidak punya record students, jadi tidak relevan.
    allowedRoles: ['SEKRETARIS', 'SISWA', 'BENDAHARA'],
  },
  {
    label: 'Kelola Absensi',
    path: '/absensi',
    icon: 'LayoutDashboard',
    allowedRoles: ['ADMIN', 'SEKRETARIS'],
  },
  {
    label: 'Kelola Siswa',
    path: '/kelola-siswa',
    icon: 'Users',
    allowedRoles: ['ADMIN'],
  },
  {
    label: 'Kas',
    path: '/kas',
    icon: 'Wallet',
    allowedRoles: ['BENDAHARA'],
    badge: 'Segera Hadir',
  },
  {
    label: 'Ubah Password',
    path: '/ubah-password',
    icon: 'KeyRound',
    allowedRoles: ['ADMIN', 'SEKRETARIS', 'SISWA', 'BENDAHARA'],
  },
];