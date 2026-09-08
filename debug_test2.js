import { db } from '../../../../../Desktop/Developments/SIAP (Sistem Informasi Administrasi & Presensi Kelas)/backend/src/db/connection.js';
import { getAttendanceDetailWithDayStatus } from '../../../../../Desktop/Developments/SIAP (Sistem Informasi Administrasi & Presensi Kelas)/backend/src/services/attendanceService.js';
import { attendanceDays, attendanceDetails } from '../../../../../Desktop/Developments/SIAP (Sistem Informasi Administrasi & Presensi Kelas)/backend/src/db/schema.js';
import { eq } from 'drizzle-orm';

async function test() {
  console.log("--- STARTING TEST ---");

  // 1. Ambil salah satu attendance_day yang berstatus CLOSED
  const closedDays = await db.select().from(attendanceDays).where(eq(attendanceDays.status, 'CLOSED')).limit(1);
  if (closedDays.length === 0) {
    console.log("Tidak ada hari berstatus CLOSED di DB. Mari kita tutup ID 1 secara manual untuk test.");
    await db.update(attendanceDays).set({ status: 'CLOSED' }).where(eq(attendanceDays.id, 1));
  }
  
  const day = await db.select().from(attendanceDays).where(eq(attendanceDays.status, 'CLOSED')).limit(1);
  console.log("Day terpilih:", day[0].id, "Status:", day[0].status);

  // 2. Ambil salah satu detail yang berelasi dengan day ini
  const details = await db.select().from(attendanceDetails).where(eq(attendanceDetails.attendanceDayId, day[0].id)).limit(1);
  
  if (details.length === 0) {
    console.log("Day ini tidak punya attendance_details! Bikin dummy...");
    await db.insert(attendanceDetails).values({
      attendanceDayId: day[0].id,
      studentId: 1,
      status: 'HADIR'
    });
  }
  const detail = await db.select().from(attendanceDetails).where(eq(attendanceDetails.attendanceDayId, day[0].id)).limit(1);
  const detailId = detail[0].id;
  console.log("Detail ID terpilih:", detailId, "mengacu ke Day ID:", detail[0].attendanceDayId);

  // 3. Simulasikan getAttendanceDetailWithDayStatus(id)
  const result = await getAttendanceDetailWithDayStatus(detailId);
  console.log("Hasil getAttendanceDetailWithDayStatus:");
  console.log(" - detail.id:", result.detail.id);
  console.log(" - dayStatus:", result.dayStatus, " | Type:", typeof result.dayStatus);

  // 4. Simulasikan Pengecekan di Controller
  const req = { user: { role: 'SEKRETARIS' } };
  console.log("Simulasi role user:", req.user.role);

  if (result.dayStatus === 'CLOSED') {
    if (req.user.role !== 'ADMIN') {
      console.log("BERHASIL DIBLOKIR: 403 Forbidden! Sekretaris tidak bisa edit hari CLOSED.");
    } else {
      console.log("LOLOS: User adalah Admin.");
    }
  } else {
    console.log("GAGAL DIBLOKIR: dayStatus tidak terbaca sebagai 'CLOSED'!");
  }

  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
