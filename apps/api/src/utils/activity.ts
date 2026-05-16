import type { ActivityType } from "../constants.js";
import { prisma } from "../lib/prisma.js";

type Input = {
  type: ActivityType;
  message: string;
  projectId: string;
  actorId?: string;
  taskId?: string;
  metadata?: unknown;
};

export const logActivity = async (input: Input) =>
  prisma.activityLog.create({
    data: {
      ...input,
      metadata: input.metadata == null ? undefined : JSON.stringify(input.metadata)
    }
  });
