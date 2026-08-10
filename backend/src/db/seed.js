import { db } from './connection.js';
import { roles, users } from './schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const roleNames = ['ADMIN', 'SEKRETARIS', 'BENDAHARA', 'SISWA'];

async function seedRoles() {
  console.log('Seeding roles...');

  for (const name of roleNames) {
    const existing = await db.select().from(roles).where(eq(roles.name, name));
    if (existing.length === 0) {
      await db.insert(roles).values({ name });
      console.log(`  + Inserted role: ${name}`);
    } else {
      console.log(`  = Role already exists: ${name}`);
    }
  }

  const allRoles = await db.select().from(roles);
  console.log(`\nTotal roles di database: ${allRoles.length}`);
  allRoles.forEach((r) => console.log(`  - id=${r.id}, name=${r.name}`));
}

async function seedAdmin() {
  console.log('\nSeeding admin...');

  // Cek apakah sudah ada user dengan role ADMIN
  const adminRole = await db.select().from(roles).where(eq(roles.name, 'ADMIN'));
  if (adminRole.length === 0) {
    throw new Error('Role ADMIN tidak ditemukan — seed roles harus dijalankan terlebih dahulu');
  }

  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(roles.name, 'ADMIN'));

  if (existingAdmin.length > 0) {
    console.log('  = Akun ADMIN sudah ada, skip pembuatan.');
    return;
  }

  // Generate password awal secara aman (16 karakter hex)
  const plainPassword = crypto.randomBytes(8).toString('hex');
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const username = 'admin';

  await db.insert(users).values({
    roleId: adminRole[0].id,
    username,
    passwordHash,
    isActive: true,
  });

  console.log('  + Akun ADMIN berhasil dibuat.');
  console.log('  ============================================');
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${plainPassword}`);
  console.log('  ============================================');
  console.log('  Simpan kredensial ini untuk login pertama.');
}

async function main() {
  await seedRoles();
  await seedAdmin();
  console.log('\nSeed selesai.');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exit(1);
  });