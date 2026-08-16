import { db } from '../db/connection.js';
import { users, roles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Verifikasi kredensial login.
 * Mengembalikan { id, username, role } jika valid, atau throw error.
 */
export async function verifyLogin(username, password) {
  // Query user + JOIN roles untuk mendapatkan role name
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      passwordChangedAt: users.passwordChangedAt,
      role: roles.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.username, username))
    .limit(1);

  if (result.length === 0) {
    const error = new Error('Username atau password salah');
    error.code = 'INVALID_CREDENTIALS';
    error.status = 401;
    throw error;
  }

  const user = result[0];

  // Cek password
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    const error = new Error('Username atau password salah');
    error.code = 'INVALID_CREDENTIALS';
    error.status = 401;
    throw error;
  }

  // Cek status aktif
  if (!user.isActive) {
    const error = new Error('Akun tidak aktif');
    error.code = 'ACCOUNT_INACTIVE';
    error.status = 403;
    throw error;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    passwordChangedAt: user.passwordChangedAt,
  };
}