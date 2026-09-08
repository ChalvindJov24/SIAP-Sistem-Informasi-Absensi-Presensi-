import { useEffect, useState } from 'react';
import { getMyAttendance } from '../api/attendanceApi.js';
import AttendanceStatCard from '../components/attendance/AttendanceStatCard.jsx';
import AttendanceHistoryRow from '../components/attendance/AttendanceHistoryRow.jsx';

/**
 * Halaman "Absensi Saya" khusus role SISWA.
 * Menampilkan rekap kehadiran per status & riwayat absensi milik sendiri.
 * Root elemen TIDAK memakai padding — <main> di DashboardLayout sudah menyediakan p-8.
 * Aturan warna plan ini: HANYA ink, canvas, hairline, surface-soft, block-sage.
 * Error state memakai text-ink/70 (netral), BUKAN text-error.
 */
export default function MyAttendancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getMyAttendance()
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setErrorMessage(null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorMessage(error.message || 'Terjadi kesalahan');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold mb-8">Absensi Saya</h1>

      {/* Tampilkan ini jika loading */}
      {loading && <div className="font-body text-ink/70">Memuat data absensi...</div>}

      {/* Tampilkan ini jika error */}
      {!loading && errorMessage && (
        <div className="font-body text-ink/70">Terjadi kesalahan: {errorMessage}</div>
      )}

      {/* Grid 4 stat card */}
      {!loading && !errorMessage && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <AttendanceStatCard label="Hadir" count={data.summary.hadir} />
          <AttendanceStatCard label="Izin" count={data.summary.izin} />
          <AttendanceStatCard label="Sakit" count={data.summary.sakit} />
          <AttendanceStatCard label="Alpha" count={data.summary.alpha} />
        </div>
      )}

      {/* Daftar riwayat */}
      {!loading && !errorMessage && data && (
        <div className="border border-hairline rounded-sm divide-y divide-hairline">
          {data.history.length === 0 ? (
            <div className="p-4 font-body text-sm text-ink/70">Belum ada data absensi.</div>
          ) : (
            data.history.map((item) => (
              <AttendanceHistoryRow
                key={item.detailId}
                date={item.date}
                status={item.attendanceStatus}
                reason={item.reason}
                specialNote={item.specialNote}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}