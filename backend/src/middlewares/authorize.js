/**
 * Middleware otorisasi berbasis role.
 * @param {string[]} allowedRoles - Daftar role yang diizinkan aksesnya
 */
export function authorize(allowedRoles) {
  return (req, res, next) => {
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

      if (!allowedRoles.includes(req.user.role)) {
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