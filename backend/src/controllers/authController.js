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