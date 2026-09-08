import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import {
  createCashPeriodController,
  listCashPeriodsController,
  createCashPaymentController,
  getCashPeriodByIdController,
  listPaymentsForPeriodController,
  updateCashPeriodController,
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

// Daftar status pembayaran semua siswa untuk satu periode — ADMIN & BENDAHARA
router.get(
  '/cash-periods/:id/payments',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  listPaymentsForPeriodController
);

// Edit periode kas — hanya ADMIN
router.patch(
  '/cash-periods/:id',
  authenticate,
  authorize(['ADMIN']),
  updateCashPeriodController
);

// Catat pembayaran siswa untuk satu periode (ATOMIC) — ADMIN & BENDAHARA
router.post(
  '/cash-payments',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  createCashPaymentController
);

export default router;