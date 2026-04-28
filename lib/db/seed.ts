import { db } from './drizzle';
import { users, organizations, memberships } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values([
      {
        email: email,
        name: 'Test User',
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

  console.log('Initial user created.');

  const [org] = await db
    .insert(organizations)
    .values({
      name: 'Test Organization',
      slug: 'test-org',
      ownerId: user.id,
    })
    .returning();

  await db.insert(memberships).values({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  console.log('Initial organization created.');
  console.log('\nNote: Product and pricing information is now managed in your GebarBilling dashboard.');
  console.log('Set GEBARBILLING_BASE_PLAN_ID and GEBARBILLING_PLUS_PLAN_ID in your environment.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
