import { useRef, useState } from 'react';
import { updateAttendanceDetail } from '../../api/attendanceApi.js';

/**
 * Satu baris detail kehadiran siswa dengan auto-save.
 * - Select status: PATCH langsung saat onChange.
 * - Input Alasan / Catatan tambahan: PATCH saat onBlur (bukan onChange).
 * - Jika PATCH gagal: nilai UI dikembalikan ke nilai terakhir yang berhasil
 *   disimpan (committedRef) dan pesan error ditampilkan inline.
 * Props: { detail: { id, studentId, fullName, status, reason, specialNote }, isReadOnly }.
 */
export default function AttendanceDetailRow({ detail, isReadOnly }) {
  const [statusValue, setStatusValue] = useState(detail.status);
  const [reasonValue, setReasonValue] = useState(detail.reason || '');
  const [specialNoteValue, setSpecialNoteValue] = useState(detail.specialNote || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Nilai yang SUDAH tersimpan di database (diupdate hanya saat save sukses).
  const committed = useRef({
    status: detail.status,
    reason: detail.reason || '',
    specialNote: detail.specialNote || '',
  });

  async function persist(patch) {
    setIsSaving(true);
    setSaveError(null);

    try {
      await updateAttendanceDetail(detail.id, patch);
      committed.current = { ...committed.current, ...patch };
    } catch (error) {
      // Revert UI ke nilai yang benar-benar tersimpan di database.
      setStatusValue(committed.current.status);
      setReasonValue(committed.current.reason);
      setSpecialNoteValue(committed.current.specialNote);
      setSaveError(error.message || 'Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  }

  function handleStatusChange(value) {
    setStatusValue(value);
    persist({ status: value });
  }

  function handleReasonBlur() {
    if (reasonValue !== committed.current.reason) {
      persist({ reason: reasonValue });
    }
  }

  function handleSpecialNoteBlur() {
    if (specialNoteValue !== committed.current.specialNote) {
      persist({ specialNote: specialNoteValue });
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
      <span className="font-body text-sm sm:w-40 flex-shrink-0 font-medium">{detail.fullName}</span>

      <select
        value={statusValue}
        disabled={isReadOnly}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="border border-hairline rounded-sm px-3 py-2 text-sm font-mono uppercase sm:w-32 flex-shrink-0 disabled:bg-surface-soft disabled:text-ink/40"
      >
        <option value="HADIR">HADIR</option>
        <option value="IZIN">IZIN</option>
        <option value="SAKIT">SAKIT</option>
        <option value="ALPHA">ALPHA</option>
      </select>

      <input
        type="text"
        value={reasonValue}
        disabled={isReadOnly}
        onChange={(e) => setReasonValue(e.target.value)}
        onBlur={handleReasonBlur}
        placeholder="Alasan"
        className="border border-hairline rounded-sm px-3 py-2 text-sm flex-1 min-w-0 disabled:bg-surface-soft disabled:text-ink/40"
      />

      <input
        type="text"
        value={specialNoteValue}
        disabled={isReadOnly}
        onChange={(e) => setSpecialNoteValue(e.target.value)}
        onBlur={handleSpecialNoteBlur}
        placeholder="Catatan tambahan"
        className="border border-hairline rounded-sm px-3 py-2 text-sm flex-1 min-w-0 disabled:bg-surface-soft disabled:text-ink/40"
      />

      {isSaving && <span className="font-mono text-xs text-ink/40">Menyimpan...</span>}
      {saveError && <span className="font-mono text-xs text-error">{saveError}</span>}
    </div>
  );
}