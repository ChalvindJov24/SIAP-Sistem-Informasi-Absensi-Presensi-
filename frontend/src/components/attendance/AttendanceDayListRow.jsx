import { Link } from 'react-router-dom';

/**
 * Satu baris daftar hari absensi (di AttendanceListPage).
 * Props: { id, date, status, notes } — seluruhnya camelCase dari api layer.
 * `min-w-0` + `truncate` di elemen notes mencegah layout melebar di mobile.
 */
export default function AttendanceDayListRow({ id, date, status, notes }) {
  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statusBadgeClassName =
    status === 'OPEN'
      ? 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-block-sage text-block-sage-ink w-fit'
      : 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-surface-soft text-ink w-fit';

  return (
    <Link
      to={`/absensi/${id}`}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 hover:bg-surface-soft"
    >
      <span className="font-body text-sm sm:w-40 flex-shrink-0 font-medium">{formattedDate}</span>
      <span className={statusBadgeClassName}>{status}</span>
      <span className="font-body text-sm text-ink/60 flex-1 min-w-0 truncate">{notes || '-'}</span>
    </Link>
  );
}