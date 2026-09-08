import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Guard role generik.
 * - Saat auth masih loading: tampilkan indikator (jangan render children dulu).
 * - User belum login: redirect ke /login.
 * - Role user tidak ada di array `allowed`: redirect ke `redirectTo`
 *   (default `/absensi-saya` — rekap milik sendiri; dipilih untuk mencegah
 *   infinite redirect loop ketika halaman yang dijaga berada di path yang sama,
 *   misal `/absensi` yang dibungkus guard ini sendiri).
 */
export default function RequireRole({ allowed, redirectTo = '/absensi-saya', children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm uppercase tracking-[0.06em] text-ink/60">Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}