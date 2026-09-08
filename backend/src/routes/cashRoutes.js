import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import {
  createCashPeriodController,
  listCashPeriodsController,
  createCashPaymentController,
  getCashPeriodByIdController,
} from '../controllers/cashController.js';

const router = Router();

// Buat periode kas baru — ADMIN saja
router.post(
  '/cash-periods',
  authenticate,
  authorize(['ADMIN']),
  createCashPeriodController
);

// Daftar/browse periode kas — ADMIN & BENDAHARA
router.get(
  '/cash-periods',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  listCashPeriodsController
);

router.get(
  '/cash-periods/:id',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  getCashPeriodByIdController
);

// Catat pembayaran siswa untuk satu periode (ATOMIC) — ADMIN & BENDAHARA
router.post(
  '/cash-payments',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  createCashPaymentController
);

export default router;