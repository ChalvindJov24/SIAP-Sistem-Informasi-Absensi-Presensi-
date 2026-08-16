import { useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPlaceholderPage() {
  const { user, refetch } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      await refetch();
      navigate('/login');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-8">
      <div className="w-full max-w-md">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink">
          SIAK
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
          Sudah login sebagai {user?.username || 'pengguna'}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink/60">
          Halaman dashboard masih placeholder. Modul dashboard akan dibangun
          terpisah.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 min-h-11 rounded-pill bg-ink px-6 py-3 text-base font-medium text-on-ink transition-colors hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}