import { PrismaClient, UserRole, Provider } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    { name: 'World',         slug: 'world',         color: '#3B82F6', description: 'International news from around the globe' },
    { name: 'Business',      slug: 'business',      color: '#10B981', description: 'Business, economy, and finance news' },
    { name: 'Technology',    slug: 'technology',    color: '#8B5CF6', description: 'Tech industry news and innovations' },
    { name: 'Sports',        slug: 'sports',        color: '#F59E0B', description: 'Sports news and match updates' },
    { name: 'Entertainment', slug: 'entertainment', color: '#EC4899', description: 'Movies, music, and celebrity news' },
    { name: 'Health',        slug: 'health',        color: '#EF4444', description: 'Health, medicine, and wellness' },
    { name: 'Science',       slug: 'science',       color: '#06B6D4', description: 'Scientific discoveries and research' },
    { name: 'Politics',      slug: 'politics',      color: '#6366F1', description: 'Political news and government updates' },
    { name: 'Education',     slug: 'education',     color: '#F97316', description: 'Education and learning news' },
    { name: 'Environment',   slug: 'environment',   color: '#22C55E', description: 'Climate, nature, and sustainability' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@newsly.app';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@newsly123';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Newsly Admin',
        username: 'admin',
        role: UserRole.ADMIN,
        isEmailVerified: true,
      },
    });

    await prisma.authProvider.create({
      data: {
        userId: admin.id,
        provider: Provider.EMAIL,
        passwordHash,
      },
    });

    console.log(`✅ Admin user created: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Change this password immediately in production!`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
