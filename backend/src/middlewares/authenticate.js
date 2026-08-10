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
      .select({ isActive: users.isActive })
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