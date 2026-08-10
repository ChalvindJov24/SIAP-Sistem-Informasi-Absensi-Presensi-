import { db } from '../db/connection.js';
import { students } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware untuk memastikan user hanya mengakses data miliknya sendiri,
 * atau memiliki role yang lebih tinggi (elevated).
 *
 * @param {string[]} elevatedRoles - Daftar role yang diizinkan akses ke semua data
 * @returns {function} Express middleware
 */
export function enforceOwnStudentOrElevatedRole(elevatedRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Belum login',
          },
        });
      }

      // ADMIN selalu diizinkan
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Jika role ada di elevatedRoles, izinkan
      if (elevatedRoles.includes(req.user.role)) {
        return next();
      }

      // Untuk SISWA atau role lain, cek kepemilikan data siswa
      const studentId = req.params.id;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Parameter id siswa diperlukan',
          },
        });
      }

      // Cek apakah studentId tersebut milik user yang login
      const result = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.userId, req.user.id))
        .limit(1);

      if (result.length === 0 || String(result[0].id) !== String(studentId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Akses ditolak',
          },
        });
      }

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
  };
}