import { useState } from 'react';

export default function ChangePasswordForm({ onSubmit, error, loading }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);

    // Validasi frontend sebelum submit
    if (newPassword.length < 8) {
      setLocalError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword === oldPassword) {
      setLocalError('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!loading) {
      onSubmit(oldPassword, newPassword);
    }
  }

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="oldPassword" className="text-sm font-medium leading-normal text-ink">
          Kata Sandi Lama
        </label>
        <input
          id="oldPassword"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Masukkan kata sandi lama"
          autoComplete="current-password"
          required
          className="rounded-sm border border-hairline bg-canvas px-4 py-3 text-base leading-normal text-ink outline-none transition-colors placeholder:text-ink/40 focus:ring-2 focus:ring-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="newPassword" className="text-sm font-medium leading-normal text-ink">
          Kata Sandi Baru
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          autoComplete="new-password"
          required
          className="rounded-sm border border-hairline bg-canvas px-4 py-3 text-base leading-normal text-ink outline-none transition-colors placeholder:text-ink/40 focus:ring-2 focus:ring-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium leading-normal text-ink">
          Konfirmasi Kata Sandi Baru
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ulangi kata sandi baru"
          autoComplete="new-password"
          required
          className="rounded-sm border border-hairline bg-canvas px-4 py-3 text-base leading-normal text-ink outline-none transition-colors placeholder:text-ink/40 focus:ring-2 focus:ring-ink"
        />
      </div>

      {displayError && (
        <p className="text-sm text-error" role="alert">
          {displayError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="min-h-11 rounded-pill bg-ink px-6 py-3 text-base font-medium text-on-ink transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
      </button>
    </form>
  );
}