export default function ResetPasswordConfirmModal({ student, onConfirm, onCancel, loading }) {
  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
    >
      <div className="w-full max-w-sm rounded-sm border border-hairline bg-canvas p-6">
        <h2 id="reset-confirm-title" className="text-xl font-semibold tracking-tight text-ink">
          Reset Kata Sandi
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink/70">
          Reset kata sandi {student.fullName}? Kata sandi lama akan langsung tidak berlaku.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-11 flex-1 rounded-pill border border-hairline px-6 py-3 text-base font-medium text-ink transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ink"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-11 flex-1 rounded-pill bg-ink px-6 py-3 text-base font-medium text-on-ink transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
          >
            {loading ? 'Merreset...' : 'Ya, Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
