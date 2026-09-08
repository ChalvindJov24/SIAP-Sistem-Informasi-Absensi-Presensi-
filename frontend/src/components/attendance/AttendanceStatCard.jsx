/**
 * Satu kartu statistik rekap absensi (Hadir/Izin/Sakit/Alpha).
 * Props: label (string), count (number).
 */
export default function AttendanceStatCard({ label, count }) {
  return (
    <div className="border border-hairline rounded-sm p-4">
      <p className="font-mono text-xs uppercase tracking-wide text-ink/60 mb-1">{label}</p>
      <p className="font-display text-3xl font-semibold">{count}</p>
    </div>
  );
}