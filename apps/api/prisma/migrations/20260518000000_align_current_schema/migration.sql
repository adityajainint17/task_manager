-- Align the original production migration with the current Prisma schema.
-- The checks keep this migration safe on databases that were already repaired with `prisma db push`.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'TASKER';

ALTER TABLE "ProjectMember"
  ALTER COLUMN "role" TYPE TEXT USING "role"::text;

ALTER TABLE "Task"
  ALTER COLUMN "status" TYPE TEXT USING "status"::text,
  ALTER COLUMN "priority" TYPE TEXT USING "priority"::text;

ALTER TABLE "ActivityLog"
  ALTER COLUMN "type" TYPE TEXT USING "type"::text,
  ALTER COLUMN "projectId" DROP NOT NULL,
  ALTER COLUMN "metadata" TYPE TEXT USING CASE WHEN "metadata" IS NULL THEN NULL ELSE "metadata"::text END;

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "punchIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "punchOut" TIMESTAMP(3),
  "totalHours" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'PRESENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TaskSession" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pausedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "activeDuration" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Attendance_userId_punchIn_idx" ON "Attendance"("userId", "punchIn");
CREATE INDEX IF NOT EXISTS "TaskSession_taskId_idx" ON "TaskSession"("taskId");
CREATE INDEX IF NOT EXISTS "TaskSession_userId_idx" ON "TaskSession"("userId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_userId_fkey') THEN
    ALTER TABLE "Attendance"
      ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskSession_taskId_fkey') THEN
    ALTER TABLE "TaskSession"
      ADD CONSTRAINT "TaskSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TaskSession_userId_fkey') THEN
    ALTER TABLE "TaskSession"
      ADD CONSTRAINT "TaskSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeaveRequest_userId_fkey') THEN
    ALTER TABLE "LeaveRequest"
      ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
