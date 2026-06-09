-- Run in Supabase SQL Editor.
-- Deleting a Workspace row cascades to all related workspace data.

-- User.workspaceId -> Workspace.id
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_workspaceId_fkey";
ALTER TABLE "User"
  ADD CONSTRAINT "User_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Project.workspaceId -> Workspace.id
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_workspaceId_fkey";
ALTER TABLE "Project"
  ADD CONSTRAINT "Project_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Task.workspaceId -> Workspace.id
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_workspaceId_fkey";
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Task.projectId -> Project.id
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_projectId_fkey";
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
