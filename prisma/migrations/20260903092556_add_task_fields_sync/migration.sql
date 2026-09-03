/*
  Warnings:

  - You are about to alter the column `title` on the `tasks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- DropIndex
DROP INDEX "tasks_assignee_id_idx";

-- DropIndex
DROP INDEX "tasks_workspace_id_idx";

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "due_date" TIMESTAMP(3),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "tasks_workspace_id_status_idx" ON "tasks"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "tasks_workspace_id_created_at_idx" ON "tasks"("workspace_id", "created_at");
