import { db } from '../db/connection.js';
import {
  cashPeriods,
  cashPayments,
  cashTransactions,
  students,
} from '../db/schema.js';
import { eq, and, gte, lte, desc, isNull, sql } from 'drizzle-orm';

/**
 * Format tanggal menjadi string "YYYY-MM-DD" secara lokal.
 * Menerima Date atau string. Hindari pergeseran timezone saat
 * memformat ulang Date yang berasal dari MySQL/Drizzle.
 */
export function formatLocalDate(value) {
  if (!value) return null;

  // Jika sudah berupa string "YYYY-MM-DD", pakai langsung.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Format nominal menjadi string dengan 2 desimal (konsisten DECIMAL(10,2)).
 */
export function formatAmount(value) {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return null;
  return num.toFixed(2);
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD (waktu lokal server).
 */
export function getTodayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getCurrentBalance() {
  const rows = await db
    .select({
      type: cashTransactions.type,
      total: sql`SUM(${cashTransactions.amount})`,
    })
    .from(cashTransactions)
    .where(isNull(cashTransactions.deletedAt))
    .groupBy(cashTransactions.type);

  let income = 0;
  let expense = 0;
  for (const row of rows) {
    if (row.type === 'INCOME') income = Number(row.total) || 0;
    if (row.type === 'EXPENSE') expense = Number(row.total) || 0;
  }
  return income - expense;
}

/**
 * FITUR 1: buat periode kas baru.
 * - startDate/endDate/amount/dueDate diambil dari body (client boleh set nominal periode).
 * - Validasi startDate <= endDate.
 * - Iterasi periode existing untuk cek overlap.
 * - Biarkan unique constraint (start_date, end_date) menolak duplikat persis.
 * Throws error 400/409 untuk kasus bisnis (controller menangkapnya).
 */
export async function createCashPeriod({ startDate, endDate, amount, dueDate }) {
  // Konversi ke timestamp untuk validasi logis (JANGAN bandingkan string mentah)
  const newStart = new Date(`${startDate}T00:00:00`);
  const newEnd = new Date(`${endDate}T00:00:00`);

  // Validasi startDate <= endDate (tolak 400)
  if (newStart.getTime() > newEnd.getTime()) {
    const err = new Error('startDate tidak boleh lebih besar dari endDate');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Ambil semua periode yang ada untuk iterasi cek overlap
  const existing = await db
    .select({
      id: cashPeriods.id,
      startDate: cashPeriods.startDate,
      endDate: cashPeriods.endDate,
    })
    .from(cashPeriods);

  // Overlap ditemukan jika: newStart <= existing.endDate && newEnd >= existing.startDate
  // Duplikat persis (interval identik) — prioritaskan pesan duplikat.
  for (const row of existing) {
    const exStartStr = formatLocalDate(row.startDate);
    const exEndStr = formatLocalDate(row.endDate);
    const exStart = new Date(`${exStartStr}T00:00:00`);
    const exEnd = new Date(`${exEndStr}T00:00:00`);

    // 1) Interval persis sama -> conflict duplikat (pesan spesifik)
    if (exStartStr === startDate && exEndStr === endDate) {
      const err = new Error('Periode kas sudah ada');
      err.status = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    // 2) Tumpang tindih sebagian -> conflict overlap
    if (newStart.getTime() <= exEnd.getTime() && newEnd.getTime() >= exStart.getTime()) {
      const err = new Error('Periode ini tumpang tindih dengan periode yang sudah ada');
      err.status = 409;
      err.code = 'CONFLICT';
      throw err;
    }
  }

  // Masukkan nilai amount sebagai Number (dikonversi DB ke DECIMAL)
  const numericAmount = Number(amount);

  const [result] = await db
    .insert(cashPeriods)
    .values({
      startDate,
      endDate,
      amount: numericAmount,
      dueDate,
    });

  return {
    id: result.insertId,
    startDate,
    endDate,
    amount: formatAmount(numericAmount),
    dueDate,
  };
}
/**
 * FITUR 2: daftar/browse periode kas dengan filter tanggal opsional.
 * Sort DESC berdasarkan start_date.
 */
export async function listCashPeriods({ startDate, endDate } = {}) {
  const conditions = [];
  if (startDate) conditions.push(gte(cashPeriods.startDate, startDate));
  if (endDate) conditions.push(lte(cashPeriods.endDate, endDate));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: cashPeriods.id,
      startDate: cashPeriods.startDate,
      endDate: cashPeriods.endDate,
      amount: cashPeriods.amount,
      dueDate: cashPeriods.dueDate,
    })
    .from(cashPeriods)
    .where(whereClause)
    .orderBy(desc(cashPeriods.startDate));

  // Format tanggal/nominal agar keluar sebagai string bersih sesuai kontrak
  return rows.map((row) => ({
    id: row.id,
    startDate: formatLocalDate(row.startDate),
    endDate: formatLocalDate(row.endDate),
    amount: formatAmount(row.amount),
    dueDate: formatLocalDate(row.dueDate),
  }));
}

export async function getCashPeriodById(periodId) {
  const periodRows = await db
    .select({
      id: cashPeriods.id,
      startDate: cashPeriods.startDate,
      endDate: cashPeriods.endDate,
      amount: cashPeriods.amount,
      dueDate: cashPeriods.dueDate,
    })
    .from(cashPeriods)
    .where(eq(cashPeriods.id, periodId))
    .limit(1);

  if (periodRows.length === 0) return null;

  const period = periodRows[0];

  const studentRows = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.status, 'ACTIVE'));

  const totalSiswaAktif = studentRows.length;

  const paymentRows = await db
    .select({ id: cashPayments.id })
    .from(cashPayments)
    .where(eq(cashPayments.periodId, periodId));

  const sudahBayar = paymentRows.length;
  const belumBayar = totalSiswaAktif - sudahBayar;

  const totalRows = await db
    .select({ total: sql`SUM(${cashPayments.amountPaid})` })
    .from(cashPayments)
    .where(eq(cashPayments.periodId, periodId));

  const totalTerkumpul = Number(totalRows[0]?.total) || 0;

  return {
    id: period.id,
    startDate: formatLocalDate(period.startDate),
    endDate: formatLocalDate(period.endDate),
    amount: formatAmount(period.amount),
    dueDate: formatLocalDate(period.dueDate),
    summary: {
      totalSiswaAktif,
      sudahBayar,
      belumBayar,
      totalTerkumpul: formatAmount(totalTerkumpul),
    },
  };
}

export async function createCashTransaction({ type, amount, description }, createdBy) {
  // Validasi type harus INCOME atau EXPENSE
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    const err = new Error('type wajib INCOME atau EXPENSE');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Validasi amount harus positif
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const err = new Error('amount wajib berupa angka positif');
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Jika EXPENSE, guard saldo negatif
  if (type === 'EXPENSE') {
    const currentBalance = await getCurrentBalance();
    if (currentBalance - numericAmount < 0) {
      const err = new Error('Saldo kas tidak mencukupi untuk mengevaluasi EXPENSE ini');
      err.status = 422;
      err.code = 'INSUFFICIENT_BALANCE';
      throw err;
    }
  }

  const [result] = await db
    .insert(cashTransactions)
    .values({
      type,
      amount: numericAmount,
      description,
      createdBy,
      referencePaymentId: null, // transaksi manual selalu null
    });

  return {
    id: result.insertId,
    type,
    amount: formatAmount(numericAmount),
    description,
    createdBy,
    createdAt: new Date(),
  };
}

export async function createCashPayment({ studentId, periodId, paymentDate }, receivedBy) {
  // Langkah 1: dapatkan periode by ID
  const periodRows = await db
    .select({
      id: cashPeriods.id,
      startDate: cashPeriods.startDate,
      endDate: cashPeriods.endDate,
      amount: cashPeriods.amount,
      dueDate: cashPeriods.dueDate,
    })
    .from(cashPeriods)
    .where(eq(cashPeriods.id, periodId))
    .limit(1);

  if (periodRows.length === 0) {
    return null; // controller -> 404
  }

  const period = periodRows[0];

  // amount disalin (snapshot) dari cash_periods.amount; konversi Number eksplisit
  const amount = Number(period.amount);
  const finalPaymentDate = paymentDate || getTodayYMD();

  // Langkah 2: transaction atomik pakai db.transaction — semua query pakai tx
  return db.transaction(async (tx) => {
    // a. Insert cash_payments (snapshot amount, received_by dari session)
    const [paymentResult] = await tx
      .insert(cashPayments)
      .values({
        studentId,
        periodId,
        amountPaid: amount,
        paymentDate: finalPaymentDate,
        receivedBy,
      });

    const paymentId = paymentResult.insertId;

    // b. Insert cash_transactions (INCOME) referensi ke payment
    await tx.insert(cashTransactions).values({
      type: 'INCOME',
      amount,
      description: `Pembayaran kas periode #${periodId}`,
      createdBy: receivedBy,
      referencePaymentId: paymentId,
    });

    // c. Return data utuh pembayaran
    return {
      id: paymentId,
      studentId,
      periodId,
      amountPaid: formatAmount(amount),
      paymentDate: finalPaymentDate,
      receivedBy,
    };
  });
}

export async function listCashTransactions({ type, startDate, endDate } = {}) {
  const conditions = [];

  // Filter type jika ada
  if (type) conditions.push(eq(cashTransactions.type, type));

  // Filter berdasarkan tanggal
  if (startDate) conditions.push(gte(cashTransactions.createdAt, startDate));
  if (endDate) conditions.push(lte(cashTransactions.createdAt, endDate));

  // Exclude soft-deleted rows
  conditions.push(isNull(cashTransactions.deletedAt));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Ambil transaksi yang tidak soft-deleted
  const rows = await db
    .select({
      id: cashTransactions.id,
      type: cashTransactions.type,
      amount: cashTransactions.amount,
      description: cashTransactions.description,
      createdBy: cashTransactions.createdBy,
      createdAt: cashTransactions.createdAt,
    })
    .from(cashTransactions)
    .where(whereClause)
    .orderBy(desc(cashTransactions.createdAt));

  // Hitung currentBalance: SUM(INCOME) - SUM(EXPENSE) WHERE deleted_at IS NULL
  const balanceRows = await db
    .select({
      total: sql`SUM(CASE WHEN ${cashTransactions.type} = 'INCOME' THEN ${cashTransactions.amount} ELSE -${cashTransactions.amount} END)`,
    })
    .from(cashTransactions)
    .where(isNull(cashTransactions.deletedAt));

  const currentBalance = Number(balanceRows[0]?.total) || 0;

  return {
    data: rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: formatAmount(row.amount),
      description: row.description,
      createdBy: row.createdBy,
      createdAt: formatLocalDate(row.createdAt),
    })),
    currentBalance: formatAmount(currentBalance),
  };
}

export async function softDeleteCashTransaction(transactionId) {
  // Cek transaksi ada
  const existing = await db
    .select({
      id: cashTransactions.id,
      referencePaymentId: cashTransactions.referencePaymentId,
    })
    .from(cashTransactions)
    .where(eq(cashTransactions.id, transactionId))
    .limit(1);

  if (existing.length === 0) return null;

  // Jangan izinkan delete jika ini transaksi yang terhubung ke payment
  if (existing[0].referencePaymentId !== null) {
    const err = new Error('Transaksi pembayaran tidak bisa dihapus manual');
    err.status = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  await db
    .update(cashTransactions)
    .set({ deletedAt: new Date() })
    .where(eq(cashTransactions.id, transactionId));

  return { id: transactionId, success: true };
}

export async function getStudentCashPayments(studentId) {
  // Verifikasi siswa ada dan ACTIVE
  const studentRows = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.status, 'ACTIVE')))
    .limit(1);

  if (studentRows.length === 0) return null;

  // Ambil semua pembayaran untuk siswa ini, join dengan cashPeriods
  const payments = await db
    .select({
      id: cashPayments.id,
      periodId: cashPayments.periodId,
      amountPaid: cashPayments.amountPaid,
      paymentDate: cashPayments.paymentDate,
      startDate: cashPeriods.startDate,
      endDate: cashPeriods.endDate,
    })
    .from(cashPayments)
    .innerJoin(cashPeriods, eq(cashPayments.periodId, cashPeriods.id))
    .where(eq(cashPayments.studentId, studentId))
    .orderBy(desc(cashPayments.paymentDate));

  return payments.map((p) => ({
    id: p.id,
    periodId: p.periodId,
    amountPaid: formatAmount(p.amountPaid),
    paymentDate: formatLocalDate(p.paymentDate),
    period: {
      startDate: formatLocalDate(p.startDate),
      endDate: formatLocalDate(p.endDate),
    },
  }));
}

export async function getCashMe(userId) {
  // Cari student record berdasarkan userId
  const studentRows = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);

  if (studentRows.length === 0) return null;

  const studentId = studentRows[0].id;
  const payments = await getStudentCashPayments(studentId);

  if (!payments) return { studentId, payments: [] };

  return { studentId, payments };
}