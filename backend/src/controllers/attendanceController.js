import {
  createAttendanceDay,
  getAttendanceDayWithDetails,
  getAttendanceDetailWithDayStatus,
  updateAttendanceDetail,
  getAttendanceDayById,
  closeAttendanceDay,
  getStudentAttendanceSummary,
  listAttendanceDays,
  getMyAttendance,
} from '../services/attendanceService.js';

/**
 * POST /attendance-days — buka hari presensi baru.
 * Otorisasi: ADMIN, SEKRETARIS (via middleware).
 */
export async function createAttendanceDayController(req, res) {
  try {
    const { date, notes } = req.body;

    // Validasi input date (YYYY-MM-DD)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tanggal wajib diisi dengan format YYYY-MM-DD',
        },
      });
    }

    // req.user.id — di-set oleh middleware authenticate (req.user = req.session.user)
    const result = await createAttendanceDay(req.user.id, date, notes);

    return res.status(201).json({
      success: true,
      data: {
        attendanceDayId: result.id,
      },
    });
  } catch (error) {
    // Drizzle ORM kadang membungkus error asli di dalam error.cause
    const actualError = error.cause || error;
    const errorCode = actualError.code || '';
    const errorErrno = actualError.errno;
    const errorMessage = actualError.message || error.message || '';
    const normalizedMessage = errorMessage.toLowerCase();

    // Cek kode error MySQL untuk Duplicate Entry (ER_DUP_ENTRY / 1062)
    const isDirectDupEntry = errorCode === 'ER_DUP_ENTRY' || errorErrno === 1062;

    // Cek kata kunci pada pesan error
    const hasConstraintKeyword = [
      'unique', 'constraint', 'duplicate', 'already exists'
    ].some((kw) => normalizedMessage.includes(kw));

    const isDuplicate = isDirectDupEntry || hasConstraintKeyword;

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Hari presensi untuk tanggal tersebut sudah ada',
        },
      });
    }

    // Hanya log error ke console jika itu bukan error constraint/duplikat (error sistem sebenarnya)
    console.error('Error in createAttendanceDayController:', error);

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

/**
 * GET /attendance-days/:id — lihat rekapitulasi 1 hari presensi.
 * Otorisasi: ADMIN, SEKRETARIS (via middleware).
 */
export async function getAttendanceDayController(req, res) {
  try {
    const id = Number(req.params.id);

    // Validasi id wajib integer
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter id wajib berupa integer positif',
        },
      });
    }

    const data = await getAttendanceDayWithDetails(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hari presensi tidak ditemukan',
        },
      });
    }

    return res.json({
      success: true,
      data,
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

/**
 * PATCH /attendance-details/:id — ubah status kehadiran satu siswa.
 * Otorisasi: ADMIN, SEKRETARIS (via middleware).
 */
export async function updateAttendanceDetailController(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Validasi id wajib integer positif
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter id wajib berupa integer positif',
        },
      });
    }

    // Ekstrak body request
    const { status, reason, specialNote } = req.body;

    // Validasi: minimal satu field wajib ada
    if (status === undefined && reason === undefined && specialNote === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu field (status, reason, atau specialNote) wajib diisi',
      });
    }

    // Validasi tipe data status
    if (status !== undefined && !['HADIR', 'IZIN', 'SAKIT', 'ALPHA'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status wajib salah satu dari: HADIR, IZIN, SAKIT, ALPHA',
        },
      });
    }

    // Validasi tipe data reason dan special_note (wajib string jika dikirim)
    if (reason !== undefined && typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Reason wajib berupa string',
        },
      });
    }
    if (specialNote !== undefined && typeof specialNote !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Special note wajib berupa string',
        },
      });
    }

    const serviceFields = {};
    if (status !== undefined) serviceFields.status = status;
    if (reason !== undefined) serviceFields.reason = reason || null;
    if (specialNote !== undefined) serviceFields.specialNote = specialNote || null;

    // Ambil detail dan status hari dari service
    const result = await getAttendanceDetailWithDayStatus(id);

    if (!result || !result.detail) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Detail kehadiran siswa tidak ditemukan',
        },
      });
    }

    const { detail, dayStatus } = result;

    // Cek otorisasi berdasarkan status hari
    if (dayStatus === 'CLOSED') {
      // Hanya ADMIN yang diizinkan jika hari sudah ditutup
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Hari presensi sudah ditutup. Hanya Admin yang dapat mengubah data.',
          },
        });
      }
    }

    // Lakukan update detail kehadiran
    const updatedDetail = await updateAttendanceDetail(id, serviceFields);

    return res.json({
      success: true,
      data: updatedDetail,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /students/:id/attendance — riwayat & rekap kehadiran per siswa.
 * Otorisasi: ADMIN, SEKRETARIS, atau SISWA milik sendiri (via middleware).
 */
export async function getStudentAttendanceController(req, res) {
  try {
    const id = Number(req.params.id);

    // Validasi id wajib integer positif
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ID Siswa harus berupa integer',
        },
      });
    }

    const result = await getStudentAttendanceSummary(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Data siswa tidak ditemukan',
        },
      });
    }

    return res.json({
      success: true,
      data: result,
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

/**
 * GET /attendance/me — rekap & riwayat absensi milik sendiri.
 * Otorisasi: siapa saja yang login (authenticate). Jika user tidak punya
 * record students (misal ADMIN), kembalikan 404 "Anda tidak terdaftar sebagai siswa".
 */
export async function getMyAttendanceController(req, res) {
  try {
    const userId = req.user.id;

    const result = await getMyAttendance(userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Anda tidak terdaftar sebagai siswa',
        },
      });
    }

    return res.json({
      success: true,
      data: result,
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
/**
 * GET /attendance-days — daftar semua hari presensi dengan filter tanggal opsional.
 * Otorisasi: ADMIN, SEKRETARIS (via middleware).
 */
export async function listAttendanceDaysController(req, res) {
  try {
    const { startDate, endDate } = req.query;

    // Validasi format startDate (YYYY-MM-DD)
    if (startDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || isNaN(new Date(startDate).getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate harus berformat YYYY-MM-DD yang valid',
          },
        });
      }
    }

    // Validasi format endDate (YYYY-MM-DD)
    if (endDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || isNaN(new Date(endDate).getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'endDate harus berformat YYYY-MM-DD yang valid',
          },
        });
      }
    }

    // Validasi startDate <= endDate
    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate tidak boleh lebih besar dari endDate',
        },
      });
    }

    const data = await listAttendanceDays({ startDate, endDate });

    return res.json({
      success: true,
      data,
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

/**
 * PATCH /attendance-days/:id/close — tutup hari presensi.
 * Otorisasi: ADMIN, SEKRETARIS (via middleware).
 */
export async function closeAttendanceDayController(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Validasi id wajib integer positif
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter id wajib berupa integer positif',
        },
      });
    }

    // Ambil data hari presensi dari service
    const day = await getAttendanceDayById(id);

    if (!day) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hari presensi tidak ditemukan',
        },
      });
    }

    // Cek apakah hari sudah ditutup sebelumnya
    if (day.status === 'CLOSED') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Hari presensi ini sudah ditutup sebelumnya.',
        },
      });
    }

    // Tutup hari presensi
    const updatedDay = await closeAttendanceDay(id);

    return res.json({
      success: true,
      data: updatedDay,
    });
  } catch (error) {
    next(error);
  }
}