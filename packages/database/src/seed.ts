import bcrypt from 'bcrypt';
import { prisma } from './client';

async function main() {
  console.log('🌱 Starting GovCMS Database Seeding with Enterprise Roles...');

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

  console.log('✅ Agency Ready:', agency.name);

  const allowDemoSeed =
    process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_SEED === 'true';

  if (allowDemoSeed) {
    const demoPassword = process.env.DEMO_ADMIN_PASSWORD?.trim();
    if (!demoPassword || demoPassword.length < 12) {
      throw new Error('DEMO_ADMIN_PASSWORD must be set and contain at least 12 characters when ALLOW_DEMO_SEED=true');
    }

    const defaultPasswordHash = await bcrypt.hash(demoPassword, 10);
    const initialUsers = [
      {
        email: 'superadmin@gov.ph',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN' as const,
      },
      {
        email: 'admin@gov.ph',
        firstName: 'Agency',
        lastName: 'Administrator',
        role: 'ADMINISTRATOR' as const,
      },
      {
        email: 'editor@gov.ph',
        firstName: 'Content',
        lastName: 'Editor',
        role: 'EDITOR' as const,
      },
      {
        email: 'publisher@gov.ph',
        firstName: 'Official',
        lastName: 'Publisher',
        role: 'PUBLISHER' as const,
      },
    ];

    for (const u of initialUsers) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { role: u.role },
        create: {
          email: u.email,
          passwordHash: defaultPasswordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          agencyId: agency.id,
        },
      });
      console.log(`✅ Seeded User [${user.role}]:`, user.email);
    }
  } else {
    console.log('ℹ️ Demo seed users skipped. Set ALLOW_DEMO_SEED=true in non-production to create them.');
  }

  console.log('✨ GovCMS Role & User Seeding Complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
