import bcrypt from 'bcrypt';
import { prisma } from './prisma';

async function seedBenchmarkData() {
  console.log('🚀 Starting high-volume benchmark seeding (20,000 tasks)...');
  const startTime = Date.now();

  // 1. Clean existing records
  await prisma.task.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create Target Multi-Tenant Workspace & Users
  const targetUser = await prisma.user.create({
    data: {
      email: 'alex.vance@nexus.io',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Vance',
    },
  });

  const secondaryUser = await prisma.user.create({
    data: {
      email: 'jordan.lee@nexus.io',
      passwordHash,
      firstName: 'Jordan',
      lastName: 'Lee',
    },
  });

  const targetWorkspace = await prisma.workspace.create({
    data: {
      name: 'Acme Enterprise Corp',
      slug: 'acme-enterprise',
      memberships: {
        create: [
          { userId: targetUser.id, role: 'OWNER' },
          { userId: secondaryUser.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // 3. Create 5 noise workspaces to simulate realistic multi-tenant distribution
  const noiseWorkspaces = [];
  for (let i = 1; i <= 5; i++) {
    const ws = await prisma.workspace.create({
      data: {
        name: `Noise Workspace ${i}`,
        slug: `noise-ws-${i}`,
      },
    });
    noiseWorkspaces.push(ws);
  }

  const allWorkspaceIds = [targetWorkspace.id, ...noiseWorkspaces.map((w) => w.id)];
  const userIds = [targetUser.id, secondaryUser.id, null];
  const statuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

  const sampleTitles = [
    'Optimize PostgreSQL Composite Indexes',
    'Resolve N+1 Query Loop in Task Controller',
    'Configure Redis Cache Invalidation Hook',
    'Implement Pessimistic Row Lock for Payments',
    'Set up Docker Compose Volume Mounts',
    'Review OWASP Helmet Security Headers',
    'Audit Gemini API Token Consumption Rate',
  ];

  // 4. Batch Insert 20,000 Tasks in chunks of 5,000
  const TOTAL_TASKS = 20000;
  const CHUNK_SIZE = 5000;

  for (let i = 0; i < TOTAL_TASKS; i += CHUNK_SIZE) {
    const taskBatch = Array.from({ length: CHUNK_SIZE }).map((_, index) => {
      const idNum = i + index + 1;
      const title = sampleTitles[idNum % sampleTitles.length];
      return {
        title: `${title} #${idNum}`,
        description: `Automated load test description for benchmarking query response latency #${idNum}`,
        status: statuses[idNum % statuses.length],
        priority: priorities[idNum % priorities.length],
        workspaceId: allWorkspaceIds[idNum % allWorkspaceIds.length],
        assigneeId: userIds[idNum % userIds.length],
        createdAt: new Date(Date.now() - (idNum % 365) * 86400000),
      };
    });

    await prisma.task.createMany({
      data: taskBatch,
    });
    console.log(`📦 Seeded chunk: ${i + CHUNK_SIZE} / ${TOTAL_TASKS} tasks`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Benchmark database populated successfully in ${duration}s!`);
}

seedBenchmarkData()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });