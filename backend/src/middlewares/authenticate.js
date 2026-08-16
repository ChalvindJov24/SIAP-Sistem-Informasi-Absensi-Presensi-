import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware autentikasi.
 * Memastikan user sudah login (session ada) dan masih aktif di database.
 */
export async function authenticate(req, res, next) {
  try {
    // Cek eksistensi session user
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Belum login',
        },
      });
    }

    // Verifikasi ulang ke database: user masih ada & aktif
    const result = await db
      .select({ isActive: users.isActive, passwordChangedAt: users.passwordChangedAt })
      .from(users)
      .where(eq(users.id, req.session.user.id))
      .limit(1);

    if (result.length === 0) {
      // User sudah dihapus — hancurkan session
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sesi tidak valid',
        },
      });
    }

    if (!result[0].isActive) {
      // User dinonaktifkan — hancurkan session
      req.session.destroy(() => {});
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Akun tidak aktif',
        },
      });
    }

    // Komparasi password_changed_at: jika DB lebih baru dari session, session usang
    const dbTime = result[0].passwordChangedAt
      ? new Date(result[0].passwordChangedAt).getTime()
      : 0;
    const sessionTime = req.session.user.passwordChangedAt
      ? new Date(req.session.user.passwordChangedAt).getTime()
      : 0;

    if (dbTime > sessionTime) {
      // Password telah diubah — hancurkan session
      req.session.destroy(() => {});
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sesi usang karena password telah diubah',
        },
      });
    }

    // Set req.user untuk digunakan middleware lain (authorize, dll)
    req.user = req.session.user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan server',
      },
    });
  }
}