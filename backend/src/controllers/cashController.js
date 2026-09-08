import {
  createCashPeriod,
  listCashPeriods,
  createCashPayment,
  getCashPeriodById,
} from '../services/cashService.js';

/**
 * POST /cash-periods â€” buat periode kas baru.
 * Otorisasi: ADMIN (via middleware).
 */
export async function createCashPeriodController(req, res) {
  try {
    const { startDate, endDate, amount, dueDate } = req.body;

    // Validasi field wajib
    if (!startDate || !endDate || amount === undefined || !dueDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate, endDate, amount, dan dueDate wajib diisi',
        },
      });
    }

    // Validasi format tanggal YYYY-MM-DD
    const dateFields = { startDate, endDate, dueDate };
    for (const [field, value] of Object.entries(dateFields)) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(new Date(`${value}T00:00:00`).getTime())
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${field} harus berformat YYYY-MM-DD yang valid`,
          },
        });
      }
    }

    // Validasi amount harus angka positif
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'amount wajib berupa angka positif',
        },
      });
    }

    const period = await createCashPeriod({
      startDate,
      endDate,
      amount: numericAmount,
      dueDate,
    });

    return res.status(201).json({
      success: true,
      data: period,
    });
  } catch (error) {
    // Handle error yang dilempar service (VALIDATION_ERROR / CONFLICT overlap)
    const actualError = error.cause || error;
    const errorCode = actualError.code || '';
    const errorErrno = actualError.errno;
    const isDupEntry = errorCode === 'ER_DUP_ENTRY' || errorErrno === 1062;

    if (isDupEntry) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Periode kas sudah ada',
        },
      });
    }

    // Error bisnis yang dilempar service (sudah punya status/code)
    if (actualError.status && actualError.code) {
      return res.status(actualError.status).json({
        success: false,
        error: {
          code: actualError.code,
          message: actualError.message,
        },
      });
    }

    console.error('Error in createCashPeriodController:', error);
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
 * GET /cash-periods â€” daftar/browse periode kas dengan filter tanggal opsional.
 * Otorisasi: ADMIN, BENDAHARA (via middleware).
 */
export async function listCashPeriodsController(req, res) {
  try {
    const { startDate, endDate } = req.query;

    // Validasi format startDate
    if (startDate !== undefined) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        Number.isNaN(new Date(`${startDate}T00:00:00`).getTime())
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate harus berformat YYYY-MM-DD yang valid',
          },
        });
      }
    }

    // Validasi format endDate
    if (endDate !== undefined) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
        Number.isNaN(new Date(`${endDate}T00:00:00`).getTime())
      ) {
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

    const data = await listCashPeriods({ startDate, endDate });

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
 * POST /cash-payments â€” catat pembayaran siswa untuk satu periode (ATOMIC).
 * Otorisasi: ADMIN, BENDAHARA (via middleware).
 */
export async function createCashPaymentController(req, res) {
  try {
    const { studentId, periodId, paymentDate } = req.body;

    // Validasi studentId integer positif
    const studentIdNum = Number(studentId);
    if (!Number.isInteger(studentIdNum) || studentIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'studentId wajib berupa integer positif',
        },
      });
    }

    // Validasi periodId integer positif
    const periodIdNum = Number(periodId);
    if (!Number.isInteger(periodIdNum) || periodIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'periodId wajib berupa integer positif',
        },
      });
    }

    // Validasi paymentDate opsional (kalau diisi harus YYYY-MM-DD valid)
    if (paymentDate !== undefined && paymentDate !== null && paymentDate !== '') {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ||
        Number.isNaN(new Date(`${paymentDate}T00:00:00`).getTime())
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'paymentDate harus berformat YYYY-MM-DD yang valid',
          },
        });
      }
    }

    // received_by diambil eksklusif dari session, bukan dari body
    const payment = await createCashPayment(
      { studentId: studentIdNum, periodId: periodIdNum, paymentDate: paymentDate || null },
      req.user.id
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Periode kas tidak ditemukan',
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    // Tangkap duplikat (student_id, period_id) -> 409
    const actualError = error.cause || error;
    const errorCode = actualError.code || '';
    const errorErrno = actualError.errno;
    const isDupEntry = errorCode === 'ER_DUP_ENTRY' || errorErrno === 1062;

    if (isDupEntry) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Siswa ini sudah tercatat lunas untuk periode ini',
        },
      });
    }

    console.error('Error in createCashPaymentController:', error);
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

export async function getCashPeriodByIdController(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'id harus berupa integer positif',
        },
      });
    }

    const period = await getCashPeriodById(id);

    if (!period) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Periode kas tidak ditemukan',
        },
      });
    }

    return res.json({ success: true, data: period });
  } catch (error) {
    console.error('Error in getCashPeriodByIdController:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan server',
      },
    });
  }
}
