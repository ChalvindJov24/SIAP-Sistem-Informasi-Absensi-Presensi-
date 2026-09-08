import { useState } from 'react';
import { createUser } from '../../api/userApi.js';

export default function CreateUserModal({ onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [roleName, setRoleName] = useState('SISWA');
  const [gender, setGender] = useState('L');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        roleName,
        gender,
        phone: phone.trim() || null,
      };
      const result = await createUser(payload);
      // result = { userId, username, password }
      onSuccess({ username: result.username, password: result.password });
    } catch (err) {
      setErrorMessage(err.message || 'Gagal membuat user baru');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div className="bg-canvas rounded-sm border border-hairline p-6 max-w-sm w-full">
        <h2 id="create-user-title" className="font-display text-xl font-semibold mb-4 text-ink">
          Buat Siswa Baru
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <label className="font-mono text-xs uppercase text-ink/60 block mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="border border-hairline rounded-sm px-3 py-2 text-sm w-full mb-4 focus:outline-none focus:ring-2 focus:ring-ink"
          />

          {/* Peran */}
          <label className="font-mono text-xs uppercase text-ink/60 block mb-1">
            Peran
          </label>
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="border border-hairline rounded-sm px-3 py-2 text-sm w-full mb-4 bg-canvas focus:outline-none focus:ring-2 focus:ring-ink"
          >
            <option value="SISWA">Siswa</option>
            <option value="SEKRETARIS">Sekretaris</option>
            <option value="BENDAHARA">Bendahara</option>
          </select>

          {/* Jenis Kelamin */}
          <label className="font-mono text-xs uppercase text-ink/60 block mb-1">
            Jenis Kelamin
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="border border-hairline rounded-sm px-3 py-2 text-sm w-full mb-4 bg-canvas focus:outline-none focus:ring-2 focus:ring-ink"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>

          {/* Nomor HP */}
          <label className="font-mono text-xs uppercase text-ink/60 block mb-1">
            Nomor HP (opsional)
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08123456789"
            className="border border-hairline rounded-sm px-3 py-2 text-sm w-full mb-4 focus:outline-none focus:ring-2 focus:ring-ink"
          />

          {/* Pesan Error Inline */}
          {errorMessage && (
            <p className="text-sm text-error mb-4 font-body" role="alert">
              {errorMessage}
            </p>
          )}

          {/* Tombol Aksi */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-ink text-on-ink rounded-pill px-4 py-2 text-sm font-medium hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-ink"
            >
              {isSubmitting ? 'Membuat...' : 'Buat'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-hairline rounded-pill px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft transition-colors focus:outline-none focus:ring-2 focus:ring-ink"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
