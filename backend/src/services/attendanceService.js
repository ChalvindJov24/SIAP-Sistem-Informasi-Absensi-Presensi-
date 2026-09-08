import { db } from '../db/connection.js';
import { attendanceDays, attendanceDetails, students } from '../db/schema.js';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

/**
 * Buka hari presensi baru.
 * Otomatis mendaftarkan semua siswa aktif (status = 'ACTIVE') dengan status HADIR.
 * Menggunakan transaction untuk konsistensi.
 */
export async function createAttendanceDay(openedById, date, notes) {
  return db.transaction(async (tx) => {
    // Langkah A: Insert ke attendance_days.
    // Biarkan error unique constraint termuntahkan jika tanggal duplikat (hindari race condition).
    const [day] = await tx.insert(attendanceDays).values({
      openedBy: openedById,
      date,
      notes: notes || null,
    });

    const attendanceDayId = day.insertId;

    // Langkah B: Ambil semua ID siswa aktif
    const activeStudents = await tx
      .select({ id: students.id })
      .from(students)
      .where(eq(students.status, 'ACTIVE'));

    // Langkah C (CRITICAL EDGE CASE): jika tidak ada siswa aktif, lewati bulk-insert
    if (activeStudents.length > 0) {
      await tx.insert(attendanceDetails).values(
        activeStudents.map((s) => ({
          attendanceDayId,
          studentId: s.id,
          status: 'HADIR',
        }))
      );
    }

    return { id: attendanceDayId };
  });
}

/**
 * Ambil rekapitulasi 1 hari presensi beserta detail list siswanya.
 * Hasil raw Drizzle JOIN (flat array) diformat menjadi nested JSON object.
 */
export async function getAttendanceDayWithDetails(id) {
  const rows = await db
    .select({
      dayId: attendanceDays.id,
      date: attendanceDays.date,
      notes: attendanceDays.notes,
      status: attendanceDays.status,
      detailId: attendanceDetails.id,
      studentId: attendanceDetails.studentId,
      fullName: students.fullName,
      detailStatus: attendanceDetails.status,
      reason: attendanceDetails.reason,
      specialNote: attendanceDetails.specialNote,
    })
    .from(attendanceDays)
    .leftJoin(
      attendanceDetails,
      eq(attendanceDetails.attendanceDayId, attendanceDays.id)
    )
    .leftJoin(students, eq(students.id, attendanceDetails.studentId))
    .where(eq(attendanceDays.id, id));

  if (rows.length === 0) {
    return null;
  }

  // Format nested JSON object
  return {
    id: rows[0].dayId,
    date: rows[0].date,
    notes: rows[0].notes,
    status: rows[0].status,
    details: rows
      .filter((r) => r.studentId !== null)
      .map((r) => ({
        id: r.detailId,
        studentId: r.studentId,
        fullName: r.fullName,
        status: r.detailStatus,
        reason: r.reason,
        specialNote: r.specialNote,
      })),
  };
}

/**
 * Ambil detail kehadiran satu siswa beserta status hari.
 * Return { detail: data attendanceDetails, dayStatus: 'OPEN' | 'CLOSED' }
 * Return null jika detail tidak ditemukan.
 */
export async function getAttendanceDetailWithDayStatus(id) {
  // Langsung cari di attendanceDetails berdasarkan id
  const [detail] = await db
    .select({
      id: attendanceDetails.id,
      attendanceDayId: attendanceDetails.attendanceDayId,
      studentId: attendanceDetails.studentId,
      status: attendanceDetails.status,
      reason: attendanceDetails.reason,
      specialNote: attendanceDetails.specialNote,
    })
    .from(attendanceDetails)
    .where(eq(attendanceDetails.id, id));

  if (!detail) {
    return null;
  }

  // Ambil status hari dari attendanceDays
  const [day] = await db
    .select({ status: attendanceDays.status })
    .from(attendanceDays)
    .where(eq(attendanceDays.id, detail.attendanceDayId));

  return {
    detail,
    dayStatus: day ? day.status : null,
  };
}

/**
 * Update detail kehadiran satu siswa (partial update).
 * Hanya update field yang dikirim, jangan override field lain.
 */
export async function updateAttendanceDetail(id, fields) {
  // Bangun setValues secara dinamis berdasarkan field yang ada
  const setValues = {};
  if (fields.status !== undefined) {
    setValues.status = fields.status;
  }
  if (fields.reason !== undefined) {
    setValues.reason = fields.reason !== null ? fields.reason : null;
  }
  if (fields.specialNote !== undefined) {
    setValues.specialNote = fields.specialNote !== null ? fields.specialNote : null;
  }

  // Lakukan update dengan Drizzle ORM
  await db.update(attendanceDetails).set(setValues).where(eq(attendanceDetails.id, id));

  // Select ulang data setelah update
  const [result] = await db
    .select({
      id: attendanceDetails.id,
      attendanceDayId: attendanceDetails.attendanceDayId,
      studentId: attendanceDetails.studentId,
      status: attendanceDetails.status,
      reason: attendanceDetails.reason,
      specialNote: attendanceDetails.specialNote,
      updatedAt: attendanceDetails.updatedAt,
    })
    .from(attendanceDetails)
    .where(eq(attendanceDetails.id, id));

  return result || null;
}

/**
 * Ambil data hari presensi berdasarkan id.
 * Return null jika tidak ditemukan.
 */
export async function getAttendanceDayById(id) {
  const [day] = await db
    .select({
      id: attendanceDays.id,
      openedBy: attendanceDays.openedBy,
      date: attendanceDays.date,
      status: attendanceDays.status,
      notes: attendanceDays.notes,
    })
    .from(attendanceDays)
    .where(eq(attendanceDays.id, id));

  return day || null;
}

/**
 * Tutup hari presensi (ubah status menjadi CLOSED).
 */
export async function closeAttendanceDay(id) {
  await db.update(attendanceDays).set({ status: 'CLOSED' }).where(eq(attendanceDays.id, id));

  // Select ulang data setelah update
  const [day] = await db
    .select({
      id: attendanceDays.id,
      openedBy: attendanceDays.openedBy,
      date: attendanceDays.date,
      status: attendanceDays.status,
      notes: attendanceDays.notes,
    })
    .from(attendanceDays)
    .where(eq(attendanceDays.id, id));

  return day || null;
}

/**
 * Fitur 6: Riwayat & rekap kehadiran per siswa.
 * Ambil data siswa terlebih dahulu; jika tidak ada, return null.
 * Lalu query attendance_details JOIN attendance_days, urutkan tanggal terbaru ke terlama.
 */
export async function getStudentAttendanceSummary(studentId) {
  // Langkah 1: Ambil data siswa
  const studentRecord = await db
    .select({
      id: students.id,
      fullName: students.fullName,
    })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (studentRecord.length === 0) return null;

  // Langkah 2: Query gabungan attendance_details JOIN attendance_days
  const rows = await db
    .select({
      detailId: attendanceDetails.id,
      date: attendanceDays.date,
      dayStatus: attendanceDays.status,
      attendanceStatus: attendanceDetails.status,
      reason: attendanceDetails.reason,
      specialNote: attendanceDetails.specialNote,
    })
    .from(attendanceDetails)
    .innerJoin(attendanceDays, eq(attendanceDetails.attendanceDayId, attendanceDays.id))
    .where(eq(attendanceDetails.studentId, studentId))
    .orderBy(desc(attendanceDays.date));

  // Langkah 3: Hitung rekap menggunakan JavaScript
  const summary = {
    totalDays: rows.length,
    hadir: rows.filter((r) => r.attendanceStatus === 'HADIR').length,
    izin: rows.filter((r) => r.attendanceStatus === 'IZIN').length,
    sakit: rows.filter((r) => r.attendanceStatus === 'SAKIT').length,
    alpha: rows.filter((r) => r.attendanceStatus === 'ALPHA').length,
  };

  // Langkah 4: Return data
  return {
    studentId: studentRecord[0].id,
    fullName: studentRecord[0].fullName,
    summary,
    history: rows,
  };
}

/**
 * Fitur 7: Browse / daftar semua hari presensi dengan filter tanggal opsional.
 */
export async function listAttendanceDays(filters) {
  // Bangun kondisi WHERE (Drizzle)
  const conditions = [];
  if (filters.startDate) conditions.push(gte(attendanceDays.date, filters.startDate));
  if (filters.endDate) conditions.push(lte(attendanceDays.date, filters.endDate));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query LEFT JOIN (Drizzle)
  const rows = await db
    .select({
      id: attendanceDays.id,
      date: attendanceDays.date,
      status: attendanceDays.status,
      notes: attendanceDays.notes,
      detailStatus: attendanceDetails.status,
    })
    .from(attendanceDays)
    .leftJoin(attendanceDetails, eq(attendanceDetails.attendanceDayId, attendanceDays.id))
    .where(whereClause)
    .orderBy(desc(attendanceDays.date));

  // Grouping dan kalkulasi menggunakan JavaScript (handle LEFT JOIN nulls)
  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.id]) {
      acc[row.id] = {
        id: row.id,
        date: row.date,
        status: row.status,
        notes: row.notes,
        summary: { hadir: 0, izin: 0, sakit: 0, alpha: 0 },
      };
    }

    // row.detailStatus akan null jika hari tersebut belum ada absensi siswanya
    if (row.detailStatus) {
      const status = row.detailStatus.toLowerCase(); // 'HADIR' -> 'hadir'
      if (acc[row.id].summary[status] !== undefined) {
        acc[row.id].summary[status]++;
      }
    }
    return acc;
  }, {});

  // Ubah object Map kembali jadi Array
  return Object.values(grouped);
}

/**
 * Rekap & riwayat absensi milik user yang sedang login.
 * Endpoint GET /attendance/me.
 * Cari record students berdasarkan userId; jika user tidak terdaftar sebagai
 * siswa (misal ADMIN) return null. Jika ketemu, REUSE getStudentAttendanceSummary
 * untuk menghindari duplikasi logic rekap/histori.
 */
export async function getMyAttendance(userId) {
  // Langkah 1: Cari record students berdasarkan userId
  const studentRecord = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);

  // Jika user tidak punya record students -> return null -> controller 404
  if (studentRecord.length === 0) return null;

  // Langkah 2: Reuse fungsi service yang sudah ada
  return getStudentAttendanceSummary(studentRecord[0].id);
}