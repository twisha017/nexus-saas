import { prisma } from '../db/prisma';

async function runDiagnostics() {
  console.log('\n--- 🔍 STARTING QUERY PERFORMANCE PROFILING ---');

  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'acme-enterprise' },
  });

  if (!workspace) {
    throw new Error('Target workspace not found. Run benchmark seeder first.');
  }

  // TEST 1: Filtered Scan (Multi-Column Workspace + Status Filter)
  console.log('\n[Test 1] Filtering tasks by workspaceId + status (IN_PROGRESS)...');
  const t1Start = performance.now();
  
  const filteredTasks = await prisma.task.findMany({
    where: {
      workspaceId: workspace.id,
      status: 'IN_PROGRESS',
    },
  });
  
  const t1End = performance.now();
  console.log(`⏱️ Unindexed Query Latency: ${(t1End - t1Start).toFixed(2)}ms (Found ${filteredTasks.length} rows)`);

  // TEST 2: The N+1 Antipattern (Fetching each assignee in a loop)
  console.log('\n[Test 2] Simulating N+1 Query Loop (fetching assignee per task)...');
  const nPlusOneTasks = await prisma.task.findMany({
    where: { workspaceId: workspace.id },
    take: 100,
  });

  const nPlusOneStart = performance.now();
  for (const task of nPlusOneTasks) {
    if (task.assigneeId) {
      await prisma.user.findUnique({ where: { id: task.assigneeId } });
    }
  }
  const nPlusOneEnd = performance.now();
  console.log(`❌ N+1 Loop Latency (100 rows): ${(nPlusOneEnd - nPlusOneStart).toFixed(2)}ms`);

  // TEST 3: The Optimized Relational Join (Single SQL Query)
  console.log('\n[Test 3] Single Query Eager Fetching with JOIN (Prisma `include`)...');
  const eagerStart = performance.now();
  
  await prisma.task.findMany({
    where: { workspaceId: workspace.id },
    take: 100,
    include: {
      assignee: {
        select: { id: true, firstName: true, email: true },
      },
    },
  });
  
  const eagerEnd = performance.now();
  console.log(`✅ Single Batch Join Latency (100 rows): ${(eagerEnd - eagerStart).toFixed(2)}ms`);

  console.log('\n-----------------------------------------------\n');
}

runDiagnostics()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });