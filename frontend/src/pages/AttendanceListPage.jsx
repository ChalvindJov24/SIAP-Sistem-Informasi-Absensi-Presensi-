import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAttendanceDays } from '../api/attendanceApi.js';
import AttendanceDayListRow from '../components/attendance/AttendanceDayListRow.jsx';
import DateRangeFilter from '../components/attendance/DateRangeFilter.jsx';
import CreateAttendanceDayModal from '../components/attendance/CreateAttendanceDayModal.jsx';

/**
 * Halaman "Kelola Absensi" (daftar hari absensi) untuk ADMIN & SEKRETARIS.
 * Root elemen tidak memakai padding — <main> di DashboardLayout sudah p-8.
 * Menampilkan loading state, filter tanggal, dan daftar hari absensi.
 */
export default function AttendanceListPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    listAttendanceDays(filter)
      .then((result) => {
        if (isMounted) setDays(result);
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(error.message || 'Gagal memuat daftar absensi');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filter]);

  function handleApply(startDate, endDate) {
    setFilter({ startDate, endDate });
  }

  function handleCreated(attendanceDayId) {
    setIsModalOpen(false);
    navigate(`/absensi/${attendanceDayId}`);
  }

  const hasFilter = Boolean(filter.startDate || filter.endDate);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-semibold">Kelola Absensi</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-ink text-on-ink rounded-pill px-6 py-3 font-body text-sm font-medium w-fit"
        >
          Buka Absensi Baru
        </button>
      </div>

      <DateRangeFilter onApply={handleApply} />

      {isLoading && <div className="font-body text-ink/70">Memuat data...</div>}

      {!isLoading && errorMessage && (
        <div className="font-body text-error">Terjadi kesalahan: {errorMessage}</div>
      )}

      {!isLoading && !errorMessage && (
        <div className="border border-hairline rounded-sm divide-y divide-hairline mt-6">
          {days.length === 0 ? (
            <div className="p-4 font-body text-sm text-ink/70">
              {hasFilter ? 'Tidak ada hasil untuk filter ini' : 'Belum ada absensi yang dibuat'}
            </div>
          ) : (
            days.map((day) => (
              <AttendanceDayListRow
                key={day.id}
                id={day.id}
                date={day.date}
                status={day.status}
                notes={day.notes}
              />
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <CreateAttendanceDayModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}