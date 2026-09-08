export default function DeactivateConfirmModal({ student, onConfirm, onCancel, loading }) {
  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-confirm-title"
    >
      <div className="w-full max-w-sm rounded-sm border border-hairline bg-canvas p-6">
        <h2 id="deactivate-confirm-title" className="font-display text-xl font-semibold tracking-tight text-ink">
          Nonaktifkan Akun
        </h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
          Nonaktifkan akun <strong className="text-ink">{student.fullName}</strong>? User ini tidak akan bisa login lagi. Reaktivasi belum bisa dilakukan dari dashboard ini.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-pill bg-ink px-4 py-2 text-sm font-medium text-on-ink hover:bg-ink/90 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ink"
          >
            {loading ? 'Memproses...' : 'Ya, Nonaktifkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
