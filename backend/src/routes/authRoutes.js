import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import { authenticate } from '../middlewares/authenticate.js';
import { login, logout, me, changePassword } from '../controllers/authController.js';

const router = Router();

// Rate limiting khusus login: 5 percobaan/menit per kombinasi username + IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5,
  keyGenerator: (req) => ipKeyGenerator(req) + '_' + req.body.username,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan login. Coba lagi nanti.',
    },
  },
});

// Rate limiting khusus ubah password: 5 percobaan/menit per user ID
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5,
  keyGenerator: (req) => `user_${req.session.user.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.',
    },
  },
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/auth/me', me);
router.patch('/auth/password', authenticate, changePasswordLimiter, changePassword);

export default router;