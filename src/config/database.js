import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import { env } from './env.js';
import * as schema from '../schemas/index.js';

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
});

try {
  await pool.query("SELECT 1");
  console.log("✅ Database connected");
} catch (err) {
  console.error("❌ Database connection failed");
  console.error(err);
}

export const db = drizzle(pool, { schema, mode: 'default' });