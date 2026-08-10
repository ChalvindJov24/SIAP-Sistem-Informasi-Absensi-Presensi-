import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me } from '../controllers/authController.js';

const router = Router();

// Rate limiting khusus login: 5 percobaan/menit per kombinasi username + IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5,
  keyGenerator: (req) => req.ip + '_' + req.body.username,
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

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/auth/me', me);

export default router;