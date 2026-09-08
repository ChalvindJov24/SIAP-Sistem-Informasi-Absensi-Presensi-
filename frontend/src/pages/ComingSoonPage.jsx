/**
 * Placeholder generik dan reusable untuk halaman yang belum dibangun.
 * Wajib menerima props `title`.
 */
export default function ComingSoonPage({ title }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink/60">
        Segera Hadir
      </p>
    </div>
  );
}