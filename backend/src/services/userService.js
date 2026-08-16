import { db } from '../db/connection.js';
import { users, roles, students } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Generate password acak 16-char hex.
 * Dipakai untuk password awal saat create user & reset password oleh admin.
 */
export function generateRandomPassword() {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Generate username unik dari full_name dengan format slug.
 * Jika collision, tambahkan angka di belakang (budi.santoso, budi.santoso2, dst).
 */
export async function generateUniqueUsername(fullName) {
  const base = fullName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.');

  let username = base;
  let suffix = 1;

  while (true) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length === 0) {
      return username;
    }

    suffix += 1;
    username = `${base}${suffix}`;
  }
}

/**
 * Buat akun user baru.
 * Jika role bukan ADMIN, buat juga record di tabel students dalam 1 transaction.
 */
export async function createUser({ fullName, roleName, gender, phone }) {
  // Ambil role
  const roleRows = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);

  if (roleRows.length === 0) {
    throw new Error('Role tidak ditemukan');
  }

  const role = roleRows[0];

  // Generate username unik
  const username = await generateUniqueUsername(fullName);

  // Generate password awal
  const plainPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // Insert user + optional student dalam 1 transaction
  const result = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({
      roleId: role.id,
      username,
      passwordHash,
      isActive: true,
    });

    if (role.name !== 'ADMIN') {
      await tx.insert(students).values({
        userId: user.insertId,
        fullName,
        gender,
        phone,
        status: 'ACTIVE',
      });
    }

    return { userId: user.insertId, username, plainPassword };
  });

  return result;
}