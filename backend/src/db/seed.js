import { db } from '../config/database.js';
import { roles } from '../schemas/index.js';
import { eq } from 'drizzle-orm';

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

seedRoles()
  .then(() => {
    console.log('\nSeed selesai.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exit(1);
  });