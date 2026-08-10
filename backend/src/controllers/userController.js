import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createUser } from '../services/userService.js';

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