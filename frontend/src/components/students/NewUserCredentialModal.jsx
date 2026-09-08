import { useState } from 'react';

export default function NewUserCredentialModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  async function handleCopy() {
    try {
      const textToCopy = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abaikan jika clipboard API diblokir browser
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-user-credential-title"
    >
      <div className="bg-canvas rounded-sm border border-hairline p-6 max-w-sm w-full">
        <h2 id="new-user-credential-title" className="font-display text-xl font-semibold mb-4 text-ink">
          Akun Berhasil Dibuat
        </h2>

        <p className="font-mono text-xs uppercase text-ink/60 mb-1">Username</p>
        <p className="font-mono text-sm font-semibold text-ink mb-4 select-all bg-surface-soft p-2 rounded-sm">
          {credentials.username}
        </p>

        <p className="font-mono text-xs uppercase text-ink/60 mb-1">Password</p>
        <p className="font-mono text-sm font-semibold text-ink mb-4 select-all bg-surface-soft p-2 rounded-sm">
          {credentials.password}
        </p>

        <p className="font-body text-xs text-ink/60 mb-6 leading-relaxed">
          Catat sekarang — kredensial ini tidak akan ditampilkan lagi.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 border border-hairline rounded-pill px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft transition-colors focus:outline-none focus:ring-2 focus:ring-ink"
          >
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-ink text-on-ink rounded-pill px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
