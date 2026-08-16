import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyLogin } from '../services/authService.js';

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validasi input dasar
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username dan password wajib diisi',
        },
      });
    }

    const user = await verifyLogin(username, password);

    // Simpan session user
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      passwordChangedAt: user.passwordChangedAt,
    };

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
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

export async function logout(req, res) {
  try {
    if (!req.session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Belum login',
        },
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Gagal menghancurkan session',
          },
        });
      }

      res.clearCookie('connect.sid');
      return res.json({
        success: true,
        data: { message: 'Logout berhasil' },
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan server',
      },
    });
  }
}

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validasi input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'oldPassword dan newPassword wajib diisi',
        },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password baru minimal 8 karakter',
        },
      });
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password baru tidak boleh sama dengan password lama',
        },
      });
    }

    // Ambil user dari database untuk verifikasi password lama
    const result = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, req.session.user.id))
      .limit(1);

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User tidak ditemukan',
        },
      });
    }

    // Verifikasi password lama
    const passwordMatch = await bcrypt.compare(oldPassword, result[0].passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Password lama salah',
        },
      });
    }

    // Hash password baru
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Waktu absolut dari Node.js (bukan NOW() database).
    // Bulatkan ke detik penuh agar konsisten dengan presisi DATETIME MySQL.
    const currentTime = new Date();
    currentTime.setMilliseconds(0);

    // Update password & password_changed_at
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        passwordChangedAt: currentTime,
      })
      .where(eq(users.id, req.session.user.id));

    // KRITIKAL: update session saat ini agar tidak ter-logout
    req.session.user.passwordChangedAt = currentTime;

    return res.json({
      success: true,
      data: { message: 'Password berhasil diubah' },
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

export async function me(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Belum login',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        user: req.session.user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan server',
      },
    });
  }
}