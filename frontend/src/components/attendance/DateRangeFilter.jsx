import { useState } from 'react';

/**
 * Filter rentang tanggal untuk daftar absensi.
 * Komponen self-contained: input dipegang state lokal; tombol Terapkan/Reset
 * memanggil `onApply(startDate, endDate)` (string YYYY-MM-DD, kosong = semua).
 */
export default function DateRangeFilter({ onApply }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function handleReset() {
    setStartDate('');
    setEndDate('');
    onApply('', '');
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
      <div className="flex-1 min-w-0">
        <label className="font-mono text-xs uppercase text-ink/60 block mb-1">Dari Tanggal</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-hairline rounded-sm px-3 py-2 text-sm w-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <label className="font-mono text-xs uppercase text-ink/60 block mb-1">Sampai Tanggal</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-hairline rounded-sm px-3 py-2 text-sm w-full"
        />
      </div>
      <button
        type="button"
        onClick={() => onApply(startDate, endDate)}
        className="border border-hairline rounded-pill px-5 py-2 text-sm font-medium w-fit"
      >
        Terapkan
      </button>
      <button type="button" onClick={handleReset} className="text-sm underline text-ink/60 w-fit">
        Reset
      </button>
    </div>
  );
}