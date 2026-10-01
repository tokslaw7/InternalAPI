import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateInviteCode() {
  return `INV-${randomBytes(4).toString('hex').toUpperCase()}`;
}

async function main() {
  const organizationName = process.env.SEED_ORGANIZATION_NAME ?? 'Internal API Team';
  const organization = await prisma.organization.upsert({
    where: { slug: 'internal-api-team' },
    update: { name: organizationName },
    create: {
      name: organizationName,
      slug: 'internal-api-team',
    },
  });

  const inviteCode = await prisma.inviteCode.create({
    data: {
      organizationId: organization.id,
      code: generateInviteCode(),
      usesRemaining: 25,
    },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: 'Admin',
        passwordHash,
      },
      create: {
        name: 'Admin',
        email: adminEmail,
        passwordHash,
      },
    });

    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: admin.id,
        },
      },
      update: { role: 'ADMIN' },
      create: {
        organizationId: organization.id,
        userId: admin.id,
        role: 'ADMIN',
      },
    });

    console.log(`Admin ready: ${adminEmail}`);
  }

  console.log(`Organization ready: ${organization.name}`);
  console.log(`Invite code created: ${inviteCode.code}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });