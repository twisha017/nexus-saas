import bcrypt from 'bcrypt';
import { prisma } from './prisma';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data in reverse order of foreign key dependencies
  await prisma.task.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Demo Users
  const owner = await prisma.user.create({
    data: {
      email: 'owner@nexus.io',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Vance',
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'dev@nexus.io',
      passwordHash,
      firstName: 'Jordan',
      lastName: 'Lee',
    },
  });

  // 4. Create Workspace with Memberships
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Engineering',
      slug: 'acme-eng',
      memberships: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 5. Create Initial Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Configure CI/CD Pipelines',
        description: 'Set up GitHub actions for automated testing and linting',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        workspaceId: workspace.id,
        assigneeId: member.id,
      },
      {
        title: 'Implement Redis Caching Layer',
        description: 'Cache high-throughput read queries with TTL',
        status: 'TODO',
        priority: 'MEDIUM',
        workspaceId: workspace.id,
        assigneeId: member.id,
      },
      {
        title: 'Design Multi-Tenant Database Architecture',
        description: 'Completed relational modeling with Prisma schema',
        status: 'DONE',
        priority: 'URGENT',
        workspaceId: workspace.id,
        assigneeId: owner.id,
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });