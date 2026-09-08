import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAttendanceDay } from '../api/attendanceApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import AttendanceDetailRow from '../components/attendance/AttendanceDetailRow.jsx';
import CloseAttendanceDayModal from '../components/attendance/CloseAttendanceDayModal.jsx';

/**
 * Halaman detail satu hari absensi untuk ADMIN & SEKRETARIS.
 * Menampilkan status hari, catatan, daftar siswa (dengan auto-save), dan tombol tutup.
 * isReadOnly = true hanya jika hari CLOSED dan login adalah SEKRETARIS
 * (Admin tetap bisa mengubah data saat hari sudah ditutup).
 */
export default function AttendanceDayDetailPage() {
  const { dayId } = useParams();
  const { user } = useAuth();

  const [day, setDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    getAttendanceDay(dayId)
      .then((result) => {
        if (isMounted) setDay(result);
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(error.message || 'Gagal memuat detail absensi');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dayId]);

  function refetch() {
    getAttendanceDay(dayId)
      .then(setDay)
      .catch(() => {});
  }

  if (isLoading) {
    return <div className="font-body text-ink/70">Memuat data...</div>;
  }

  if (errorMessage) {
    return <div className="font-body text-error">Terjadi kesalahan: {errorMessage}</div>;
  }

  if (!day) {
    return null;
  }

  const formattedDate = new Date(day.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const statusBadgeClassName =
    day.status === 'OPEN'
      ? 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-block-sage text-block-sage-ink w-fit'
      : 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-surface-soft text-ink w-fit';

  const isClosedForSekretaris = day.status === 'CLOSED' && user?.role === 'SEKRETARIS';
  const isReadOnly = isClosedForSekretaris;

  return (
    <div className="max-w-4xl">
      <div className="mb-2">
        <Link to="/absensi" className="text-sm text-ink/60 underline">
          &larr; Kembali ke Daftar
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <h1 className="font-display text-3xl font-semibold">{formattedDate}</h1>
        <span className={statusBadgeClassName}>{day.status}</span>
      </div>

      {day.notes && <p className="font-body text-sm text-ink/60 mb-4">{day.notes}</p>}

      {isClosedForSekretaris && (
        <div className="bg-surface-soft rounded-sm p-4 mb-6 font-body text-sm">
          Absensi ini sudah ditutup. Hanya Admin yang dapat mengubah data.
        </div>
      )}

      {day.status === 'OPEN' && (
        <button
          type="button"
          onClick={() => setIsCloseModalOpen(true)}
          className="border border-hairline rounded-pill px-5 py-2 text-sm font-medium mb-6 w-fit"
        >
          Tutup Absensi
        </button>
      )}

      <div className="border border-hairline rounded-sm divide-y divide-hairline">
        {day.details.length === 0 ? (
          <div className="p-4 font-body text-sm text-ink/70">
            Belum ada data siswa pada hari ini.
          </div>
        ) : (
          day.details.map((detail) => (
            <AttendanceDetailRow key={detail.id} detail={detail} isReadOnly={isReadOnly} />
          ))
        )}
      </div>

      {isCloseModalOpen && (
        <CloseAttendanceDayModal
          dayId={day.id}
          date={day.date}
          onClose={() => setIsCloseModalOpen(false)}
          onClosed={() => {
            setIsCloseModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}