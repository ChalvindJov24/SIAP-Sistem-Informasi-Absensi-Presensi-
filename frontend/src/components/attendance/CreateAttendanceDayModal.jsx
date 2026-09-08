import { useState } from 'react';
import { createAttendanceDay } from '../../api/attendanceApi.js';

/**
 * Modal "Buka Absensi Baru".
 * Props: { onClose, onCreated(attendanceDayId) }.
 * Error 409 (tanggal sudah ada) ditampilkan inline berwarna error di bawah input date.
 */
export default function CreateAttendanceDayModal({ onClose, onCreated }) {
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit() {
    if (!date) {
      setErrorMessage('Tanggal wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createAttendanceDay({ date, notes: notes || null });
      onCreated(result.attendanceDayId);
    } catch (error) {
      const message =
        error.status === 409 || error.code === 'CONFLICT'
          ? 'Hari presensi untuk tanggal tersebut sudah ada'
          : error.message || 'Gagal membuka absensi baru';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-canvas rounded-sm p-6 max-w-sm w-full">
        <h2 className="font-display text-xl font-semibold mb-4">Buka Absensi Baru</h2>

        <label className="font-mono text-xs uppercase text-ink/60 block mb-1">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-hairline rounded-sm px-3 py-2 text-sm w-full mb-4"
        />

        <label className="font-mono text-xs uppercase text-ink/60 block mb-1">Catatan (opsional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan"
          className="border border-hairline rounded-sm px-3 py-2 text-sm w-full"
        />

        {errorMessage && <p className="text-sm text-error mt-2">{errorMessage}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-ink text-on-ink rounded-pill px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Buka
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