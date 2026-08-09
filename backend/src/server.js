import express from 'express';
import { env } from './config/env.js';
import { db } from './config/database.js';
import { sql } from 'drizzle-orm';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

app.use(express.json());
app.use(healthRoutes);

async function startServer() {
  try {
    // Verifikasi koneksi database saat startup
    await db.execute(sql`SELECT 1`);
    console.log('✅ Koneksi ke database MySQL berhasil.');

    app.listen(env.port, () => {
      console.log(`🚀 SIAP API berjalan di http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('❌ Gagal terhubung ke database:', error.message);
    process.exit(1);
  }
}

startServer();