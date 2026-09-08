import { useState } from 'react';

export default function NewPasswordRevealModal({ result, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abaikan error clipboard — user tetap bisa mencatat manual
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-password-title"
    >
      <div className="w-full max-w-sm rounded-sm border border-hairline bg-canvas p-6">
        <h2 id="new-password-title" className="text-xl font-semibold tracking-tight text-ink">
          Kata sandi baru untuk {result.username}
        </h2>
        <p className="mt-4 font-mono text-2xl tracking-wide text-ink">
          {result.password}
        </p>
        <p className="mt-3 text-sm text-ink/60">
          Catat sekarang — kata sandi ini tidak akan ditampilkan lagi.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-11 flex-1 rounded-pill border border-hairline px-6 py-3 text-base font-medium text-ink transition-colors hover:bg-surface-soft focus:outline-none focus:ring-2 focus:ring-ink"
          >
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-pill bg-ink px-6 py-3 text-base font-medium text-on-ink transition-colors hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
