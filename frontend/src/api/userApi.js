const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const jsonHeaders = { 'Content-Type': 'application/json' };

/**
 * Ambil daftar siswa (hanya ADMIN).
 * Mengembalikan array siswa: { id, username, fullName, role, isActive }.
 */
export async function listStudents() {
  const response = await fetch(`${BASE_URL}/users/students`, {
    method: 'GET',
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal mengambil daftar siswa');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data.students;
}

/**
 * Reset password siswa (hanya ADMIN).
 * Mengembalikan { userId, username, password } — password plaintext sekali.
 */
export async function resetStudentPassword(id) {
  const response = await fetch(`${BASE_URL}/users/${id}/reset-password`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal reset kata sandi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}