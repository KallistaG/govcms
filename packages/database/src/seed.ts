import { prisma } from './client';

async function main() {
  console.log('🌱 Starting GovCMS Database Seeding...');

  // Seed Default Agency
  const agency = await prisma.agency.upsert({
    where: { code: 'DICT' },
    update: {},
    create: {
      name: 'Department of Information and Communications Technology',
      code: 'DICT',
      slug: 'dict',
      contactEmail: 'contact@dict.gov.ph',
    },
  });

  console.log('✅ Created Agency:', agency.name);

  // Seed Initial Admin User (password: Password123!)
  // bcrypt hash for Password123!
  const defaultPasswordHash = '$2b$10$w8T0M4j6lX3kG0Z/h2i3.u5E90j/A9bE1mX9F5K6L7M8N9O0P1Q2R';

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gov.ph' },
    update: {},
    create: {
      email: 'admin@gov.ph',
      passwordHash: defaultPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      agencyId: agency.id,
    },
  });

  console.log('✅ Created Super Admin User:', admin.email);

  console.log('✨ GovCMS Seeding Complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
