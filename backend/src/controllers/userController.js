import { db } from '../db/connection.js';
import { users, roles, students } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createUser, generateRandomPassword } from '../services/userService.js';

/**
 * POST /users — buat akun baru (hanya ADMIN).
 */
export async function createUserController(req, res) {
  try {
    const { fullName, roleName, gender, phone } = req.body;

    // Validasi input dasar
    if (!fullName || !roleName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'fullName dan roleName wajib diisi',
        },
      });
    }

    const result = await createUser({ fullName, roleName, gender, phone });

    return res.status(201).json({
      success: true,
      data: {
        userId: result.userId,
        username: result.username,
        password: result.plainPassword,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan server',
      },
    });
  }
}

/**
 * GET /users/students — daftar user dengan role SISWA (hanya ADMIN).
 * JOIN ke tabel students untuk menyertakan fullName.
 */
export async function listStudentsController(req, res) {
  try {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: students.fullName,
        role: roles.name,
        isActive: users.isActive,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(students, eq(users.id, students.userId))
      .where(eq(roles.name, 'SISWA'));

    return res.json({
      success: true,
      data: {
        students: result,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan server',
      },
    });
  }
}

/**
 * PATCH /users/:id/reset-password — reset password user lain (hanya ADMIN).
 * Tanpa verifikasi password lama. Mengembalikan password plaintext sekali.
 */
export async function resetPasswordController(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter id diperlukan',
        },
      });
    }

    // Cek eksistensi user target
    const target = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (target.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User tidak ditemukan',
        },
      });
    }

    // Generate password baru (reuse fungsi dari userService)
    const plainPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Waktu absolut dari Node.js.
    // Bulatkan ke detik penuh agar konsisten dengan presisi DATETIME MySQL.
    const currentTime = new Date();
    currentTime.setMilliseconds(0);

    // Update password, password_changed_at, dan last_password_reset_by
    await db
      .update(users)
      .set({
        passwordHash,
        passwordChangedAt: currentTime,
        lastPasswordResetBy: req.session.user.id,
      })
      .where(eq(users.id, userId));

    return res.json({
      success: true,
      data: {
        userId: target[0].id,
        username: target[0].username,
        password: plainPassword,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan server',
      },
    });
  }
}

/**
 * PATCH /users/:id/deactivate — nonaktifkan akun (hanya ADMIN).
 */
export async function deactivateUserController(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter id diperlukan',
        },
      });
    }

    // Update is_active = false (MySQL tidak support .returning())
    await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

    // Ambil data user terbaru
    const updated = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User tidak ditemukan',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        user: updated[0],
      },
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan server',
      },
    });
  }
}