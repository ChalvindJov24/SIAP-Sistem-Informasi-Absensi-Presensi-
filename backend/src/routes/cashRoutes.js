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
  createCashTransactionController,
  listCashTransactionsController,
  softDeleteCashTransactionController,
  getStudentCashPaymentsController,
  getCashMeController,
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

// Buat transaksi manual (INCOME/EXPENSE) — ADMIN & BENDAHARA
router.post(
  '/cash-transactions',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  createCashTransactionController
);

// Daftar transaksi ledger + saldo saat ini — ADMIN & BENDAHARA
router.get(
  '/cash-transactions',
  authenticate,
  authorize(['ADMIN', 'BENDAHARA']),
  listCashTransactionsController
);

// Soft-delete transaksi manual — hanya ADMIN
router.delete(
  '/cash-transactions/:id',
  authenticate,
  authorize(['ADMIN']),
  softDeleteCashTransactionController
);

// Riwayat pembayaran kas per siswa — ADMIN semua, SISWA hanya milik sendiri
router.get(
  '/students/:id/cash-payments',
  authenticate,
  enforceOwnStudentOrElevatedRole(),
  getStudentCashPaymentsController
);

// Ringkas riwayat kas milik user yang login — untuk semua role terotorisasi
router.get(
  '/cash/me',
  authenticate,
  getCashMeController
);

export default router;