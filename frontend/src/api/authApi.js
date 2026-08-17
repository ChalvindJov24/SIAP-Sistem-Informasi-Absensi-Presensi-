const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const jsonHeaders = { 'Content-Type': 'application/json' };

/**
 * Login dengan username & password.
 * Mengembalikan { id, username, role } dari response data.user.
 */
export async function login(username, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Login gagal');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data.user;
}

/**
 * Logout — menghapus session di server.
 */
export async function logout() {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Logout gagal');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Ubah password sendiri (Fitur A).
 * Mengembalikan { message } dari response data.
 */
export async function changePassword(oldPassword, newPassword) {
  const response = await fetch(`${BASE_URL}/auth/password`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal mengubah kata sandi');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data;
}

/**
 * Ambil data user yang sedang login.
 * Mengembalikan { id, username, role } atau null jika belum login.
 */
export async function getMe() {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(body?.error?.message || 'Gagal mengambil data user');
    err.code = body?.error?.code || 'UNKNOWN_ERROR';
    err.status = response.status;
    throw err;
  }

  return body.data.user;
}