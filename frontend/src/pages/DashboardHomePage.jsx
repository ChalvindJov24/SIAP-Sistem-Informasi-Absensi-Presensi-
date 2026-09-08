import { useAuth } from '../context/AuthContext.jsx';

/**
 * Halaman beranda dashboard. Isinya HANYA sapaan "Selamat datang, [username]".
 * Tidak ada statistik tiruan atau grid rumit.
 */
export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <p className="text-lg text-ink">Selamat datang, {user?.username}</p>
    </div>
  );
}