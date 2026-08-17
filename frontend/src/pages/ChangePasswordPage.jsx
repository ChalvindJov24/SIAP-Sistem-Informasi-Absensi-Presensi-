import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/authApi.js';
import ChangePasswordForm from '../components/password/ChangePasswordForm.jsx';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(oldPassword, newPassword) {
    setError(null);
    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      if (err.status === 401) {
        setError('Kata sandi lama salah.');
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
    <div className="flex min-h-screen items-center justify-center bg-canvas p-8">
      <div className="w-full max-w-md">
        <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink">
          SIAK
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
          Ubah Kata Sandi
        </h1>

        {success ? (
          <div className="mt-8">
            <p className="text-base text-ink" role="status">
              Kata sandi berhasil diubah.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-8 min-h-11 rounded-pill bg-ink px-6 py-3 text-base font-medium text-on-ink transition-colors hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            >
              Kembali ke Dashboard
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <ChangePasswordForm onSubmit={handleSubmit} error={error} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}