/**
 * Satu baris riwayat absensi.
 * Hanya 2 varian warna badge: sage untuk HADIR, surface-soft untuk selain HADIR (netral).
 * Props: date (string YYYY-MM-DD), status (string), reason (string|null), specialNote (string|null).
 */
export default function AttendanceHistoryRow({ date, status, reason, specialNote }) {
  const badgeClassName =
    status === 'HADIR'
      ? 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-block-sage text-block-sage-ink w-fit'
      : 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-surface-soft text-ink w-fit';

  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4">
      <span className="font-body text-sm sm:w-32 flex-shrink-0">{formattedDate}</span>
      <span className={badgeClassName}>{status}</span>
      <span className="font-body text-sm text-ink/70">{reason || specialNote || '-'}</span>
    </div>
  );
}