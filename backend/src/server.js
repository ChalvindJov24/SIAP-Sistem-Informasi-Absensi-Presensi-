import express from 'express';
import session from 'express-session';
import mysqlSession from 'express-mysql-session';
import cors from 'cors';
import { env } from './config/env.js';
import { db } from './db/connection.js';
import { sql } from 'drizzle-orm';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// CORS — credentials true, origin dari env
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

// Session store di MySQL
const MySQLStore = mysqlSession(session);
const sessionStore = new MySQLStore({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
});

app.use(
  session({
    secret: env.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 hari
    },
  })
);

app.use(healthRoutes);
app.use(authRoutes);

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