const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Ambil riwayat & rekap absensi milik user yang sedang login.
 * Mengembalikan { studentId, fullName, summary, history } dari response data.
 */
export async function getMyAttendance() {
  const response = await fetch(`${BASE_URL}/attendance/me`, {
    method: 'GET',
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal mengambil data absensi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Daftar hari absensi dengan filter tanggal opsional (YYYY-MM-DD).
 * Mengembalikan array { id, date, status, notes, summary }.
 */
export async function listAttendanceDays({ startDate, endDate } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const queryString = params.toString();

  const response = await fetch(
    `${BASE_URL}/attendance-days${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal mengambil daftar absensi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Buka hari absensi baru.
 * Body dikirim dalam camelCase ({ date, notes }).
 * Mengembalikan { attendanceDayId }. Lempar error ber-status 409 untuk tanggal duplikat.
 */
export async function createAttendanceDay({ date, notes }) {
  const response = await fetch(`${BASE_URL}/attendance-days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ date, notes }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal membuka absensi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Detail satu hari absensi.
 * Mengembalikan { id, date, notes, status, details: [{ id, studentId, fullName, status, reason, specialNote }] }.
 */
export async function getAttendanceDay(dayId) {
  const response = await fetch(`${BASE_URL}/attendance-days/${dayId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal mengambil detail absensi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Ubah detail kehadiran satu siswa (partial update).
 * Hanya field yang disertakan (tidak undefined) yang dikirim ke backend — semua camelCase.
 */
export async function updateAttendanceDetail(detailId, { status, reason, specialNote }) {
  const payload = {};
  if (status !== undefined) payload.status = status;
  if (reason !== undefined) payload.reason = reason;
  if (specialNote !== undefined) payload.specialNote = specialNote;

  const response = await fetch(`${BASE_URL}/attendance-details/${detailId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal menyimpan perubahan');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Tutup hari absensi.
 * Mengembalikan data hari yang diperbarui { id, openedBy, date, status, notes }.
 */
export async function closeAttendanceDay(dayId) {
  const response = await fetch(`${BASE_URL}/attendance-days/${dayId}/close`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal menutup absensi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}