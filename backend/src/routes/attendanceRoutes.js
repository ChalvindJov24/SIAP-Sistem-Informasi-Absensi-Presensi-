import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { enforceOwnStudentOrElevatedRole } from '../middlewares/enforceOwnStudentOrElevatedRole.js';
import {
  createAttendanceDayController,
  getAttendanceDayController,
  updateAttendanceDetailController,
  closeAttendanceDayController,
  getStudentAttendanceController,
  listAttendanceDaysController,
  getMyAttendanceController,
} from '../controllers/attendanceController.js';

const router = Router();

// Buka hari presensi baru — ADMIN & SEKRETARIS
router.post(
  '/attendance-days',
  authenticate,
  authorize(['ADMIN', 'SEKRETARIS']),
  createAttendanceDayController
);

// GET /attendance-days WAJIB DI ATAS GET /:id
// Daftar semua hari presensi dengan filter tanggal opsional — ADMIN & SEKRETARIS
router.get(
  '/attendance-days',
  authenticate,
  authorize(['ADMIN', 'SEKRETARIS']),
  listAttendanceDaysController
);

// Lihat rekapitulasi 1 hari presensi — ADMIN & SEKRETARIS
router.get(
  '/attendance-days/:id',
  authenticate,
  authorize(['ADMIN', 'SEKRETARIS']),
  getAttendanceDayController
);

// Ubah status kehadiran satu siswa — ADMIN & SEKRETARIS
router.patch(
  '/attendance-details/:id',
  authenticate,
  authorize(['ADMIN', 'SEKRETARIS']),
  updateAttendanceDetailController
);

// Tutup hari presensi — ADMIN & SEKRETARIS
router.patch(
  '/attendance-days/:id/close',
  authenticate,
  authorize(['ADMIN', 'SEKRETARIS']),
  closeAttendanceDayController
);

// GET /students/:id/attendance — riwayat & rekap kehadiran per siswa
// ADMIN, SEKRETARIS, atau SISWA milik sendiri
router.get(
  '/students/:id/attendance',
  authenticate,
  enforceOwnStudentOrElevatedRole(['SEKRETARIS']),
  getStudentAttendanceController
);

// GET /attendance/me — riwayat & rekap kehadiran milik sendiri (login wajib)
// Tanpa authorize: endpoint ini inherently data milik sendiri
router.get(
  '/attendance/me',
  authenticate,
  getMyAttendanceController
);

export default router;