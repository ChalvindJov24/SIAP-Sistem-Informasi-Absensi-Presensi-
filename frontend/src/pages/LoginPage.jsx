import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthSignaturePanel from '../components/auth/AuthSignaturePanel.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';

export default function LoginPage() {
  const { refetch } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(username, password) {
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      await refetch();
      navigate('/dashboard');
    } catch (err) {
      if (err.status === 401) {
        setError('Username atau kata sandi salah.');
      } else if (err.status === 403) {
        setError('Akun ini sudah tidak aktif. Hubungi wali kelas.');
      } else if (err.status === 429) {
        setError('Terlalu banyak percobaan. Coba lagi dalam 1 menit.');
      } else {
        setError('Tidak bisa terhubung ke server. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="md:w-1/2">
        <AuthSignaturePanel />
      </div>

      <div className="flex flex-1 items-center justify-center bg-canvas p-8 md:p-12">
        <div className="w-full max-w-sm opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]">
          <div className="mb-8">
            <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink">
              SIAK
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              Masuk ke akun Anda
            </h2>
          </div>

          <LoginForm onSubmit={handleSubmit} error={error} loading={loading} />
        </div>
      </div>
    </div>
  );
}