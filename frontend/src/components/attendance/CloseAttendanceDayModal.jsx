import { useState } from 'react';
import { closeAttendanceDay } from '../../api/attendanceApi.js';

/**
 * Modal konfirmasi "Tutup Absensi".
 * Props: { dayId, date, onClose, onClosed }.
 * Setelah berhasil menutup, memanggil onClosed() supaya parent me-refetch data.
 */
export default function CloseAttendanceDayModal({ dayId, date, onClose, onClosed }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function handleClose() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await closeAttendanceDay(dayId);
      onClosed();
    } catch (error) {
      setErrorMessage(error.message || 'Gagal menutup absensi');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-canvas rounded-sm p-6 max-w-sm w-full">
        <h2 className="font-display text-xl font-semibold mb-4">Tutup Absensi</h2>

        <p className="font-body text-sm text-ink/70">
          Tutup absensi tanggal {formattedDate}? Setelah ditutup, Sekretaris tidak
          bisa mengubah data lagi (Admin tetap bisa).
        </p>

        {errorMessage && <p className="text-sm text-error mt-2">{errorMessage}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 bg-ink text-on-ink rounded-pill px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Ya, Tutup
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-hairline rounded-pill px-4 py-2 text-sm font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}