import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import { validate } from "../utils/validation.js";
import type { AuthenticatedRequest } from "../types.js";

const taskRouter = Router();

const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(3000),
  assigneeId: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  order: z.number().int().nonnegative().default(0)
});

const taskUpdateSchema = taskSchema.partial().extend({
  projectId: z.string().optional()
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000)
});

taskRouter.use(requireAuth);

const getMembership = async (projectId: string, userId: string) =>
  prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });

taskRouter.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { projectId, status, priority, search, assigneeId, mine } = req.query;

    const accessibleProjectIds = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      select: { projectId: true }
    });
    const accessibleIds = accessibleProjectIds.map((membership: { projectId: string }) => membership.projectId);
    const requestedProjectId = projectId ? String(projectId) : undefined;

    if (requestedProjectId && !accessibleIds.includes(requestedProjectId)) {
      throw new AppError("You do not have access to this project", StatusCodes.FORBIDDEN);
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: requestedProjectId ?? { in: accessibleIds },
        status: status ? (String(status) as Prisma.TaskWhereInput["status"]) : undefined,
        priority: priority ? (String(priority) as Prisma.TaskWhereInput["priority"]) : undefined,
        assigneeId: mine === "true" ? req.user!.id : assigneeId ? String(assigneeId) : undefined,
        OR: search
          ? [
              { title: { contains: String(search) } },
              { description: { contains: String(search) } }
            ]
          : undefined
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarColor: true } },
        creator: { select: { id: true, name: true, email: true, avatarColor: true } },
        project: { select: { id: true, name: true, key: true, color: true } },
        comments: {
          include: { author: { select: { id: true, name: true, email: true, avatarColor: true } } },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ status: "asc" }, { order: "asc" }, { dueDate: "asc" }]
    });

    res.json({ tasks });
  })
);

taskRouter.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = validate(taskSchema, req.body);
    const membership = await getMembership(payload.projectId, req.user!.id);

    if (!membership || membership.role !== "ADMIN") {
      throw new AppError("Only admins can create tasks", StatusCodes.FORBIDDEN);
    }

    if (payload.assigneeId) {
      const assigneeMembership = await getMembership(payload.projectId, payload.assigneeId);
      if (!assigneeMembership) {
        throw new AppError("Assignee must be a member of the project");
      }
    }

    const task = await prisma.task.create({
      data: {
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
        creatorId: req.user!.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarColor: true } },
        creator: { select: { id: true, name: true, email: true, avatarColor: true } }
      }
    });

    await logActivity({
      type: "TASK_CREATED",
      message: `${req.user!.name} created ${task.title}`,
      actorId: req.user!.id,
      projectId: task.projectId,
      taskId: task.id
    });

    res.status(StatusCodes.CREATED).json({ task });
  })
);

taskRouter.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarColor: true } },
        creator: { select: { id: true, name: true, email: true, avatarColor: true } },
        project: true,
        comments: {
          include: { author: { select: { id: true, name: true, email: true, avatarColor: true } } },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const membership = await getMembership(task.projectId, req.user!.id);
    if (!membership) {
      throw new AppError("You do not have access to this task", StatusCodes.FORBIDDEN);
    }

    res.json({ task });
  })
);

taskRouter.put(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const payload = validate(taskUpdateSchema, req.body);
    const current = await prisma.task.findUnique({ where: { id: taskId } });

    if (!current) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const membership = await getMembership(current.projectId, req.user!.id);
    if (!membership) {
      throw new AppError("You do not have access to this task", StatusCodes.FORBIDDEN);
    }

    const isAdmin = membership.role === "ADMIN";
    const isAssignee = current.assigneeId === req.user!.id;

    if (!isAdmin && !isAssignee) {
      throw new AppError("Only admins or assignees can update this task", StatusCodes.FORBIDDEN);
    }

    if (!isAdmin && Object.keys(payload).some((key) => key !== "status")) {
      throw new AppError("Members can only update task status", StatusCodes.FORBIDDEN);
    }

    if (payload.assigneeId) {
      const assigneeMembership = await getMembership(current.projectId, payload.assigneeId);
      if (!assigneeMembership) {
        throw new AppError("Assignee must belong to the project");
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...payload,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : payload.dueDate === null ? null : undefined
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarColor: true } },
        creator: { select: { id: true, name: true, email: true, avatarColor: true } },
        comments: {
          include: { author: { select: { id: true, name: true, email: true, avatarColor: true } } },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    await logActivity({
      type: payload.status && payload.status !== current.status ? "TASK_STATUS_CHANGED" : "TASK_UPDATED",
      message:
        payload.status && payload.status !== current.status
          ? `${req.user!.name} moved ${updated.title} to ${payload.status.replaceAll("_", " ")}`
          : `${req.user!.name} updated ${updated.title}`,
      actorId: req.user!.id,
      projectId: updated.projectId,
      taskId: updated.id
    });

    res.json({ task: updated });
  })
);

taskRouter.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const membership = await getMembership(task.projectId, req.user!.id);
    if (!membership || membership.role !== "ADMIN") {
      throw new AppError("Only admins can delete tasks", StatusCodes.FORBIDDEN);
    }

    await prisma.task.delete({ where: { id: task.id } });

    await logActivity({
      type: "TASK_DELETED",
      message: `${req.user!.name} deleted ${task.title}`,
      actorId: req.user!.id,
      projectId: task.projectId,
      taskId: task.id
    });

    res.status(StatusCodes.NO_CONTENT).send();
  })
);

taskRouter.post(
  "/:id/comments",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const payload = validate(commentSchema, req.body);
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const membership = await getMembership(task.projectId, req.user!.id);
    if (!membership) {
      throw new AppError("You do not have access to this task", StatusCodes.FORBIDDEN);
    }

    const comment = await prisma.comment.create({
      data: {
        content: payload.content,
        projectId: task.projectId,
        taskId: task.id,
        authorId: req.user!.id
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarColor: true } }
      }
    });

    await logActivity({
      type: "COMMENT_ADDED",
      message: `${req.user!.name} commented on ${task.title}`,
      actorId: req.user!.id,
      projectId: task.projectId,
      taskId: task.id
    });

    res.status(StatusCodes.CREATED).json({ comment });
  })
);

const checkPunchIn = async (userId: string) => {
  const attendance = await prisma.attendance.findFirst({
    where: { userId, punchOut: null },
    orderBy: { punchIn: "desc" }
  });
  if (!attendance) {
    throw new AppError("You must punch in before performing task actions", StatusCodes.BAD_REQUEST);
  }
  return attendance;
};

taskRouter.post(
  "/:id/start",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const userId = req.user!.id;

    await checkPunchIn(userId);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new AppError("Task not found", StatusCodes.NOT_FOUND);

    // Check if there's already an active session
    const activeSession = await prisma.taskSession.findFirst({
      where: { userId, endedAt: null }
    });
    if (activeSession) {
      throw new AppError("You already have an active task session. Pause it first.", StatusCodes.BAD_REQUEST);
    }

    const session = await prisma.taskSession.create({
      data: {
        taskId,
        userId,
        startedAt: new Date()
      }
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" }
    });

    await logActivity({
      type: "TASK_STARTED",
      message: `${req.user!.name} started working on ${task.title}`,
      actorId: userId,
      projectId: task.projectId,
      taskId: task.id
    });

    res.status(StatusCodes.CREATED).json(session);
  })
);

taskRouter.post(
  "/:id/pause",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const userId = req.user!.id;

    const session = await prisma.taskSession.findFirst({
      where: { taskId, userId, endedAt: null, pausedAt: null },
      orderBy: { startedAt: "desc" }
    });

    if (!session) {
      throw new AppError("No active session found for this task", StatusCodes.BAD_REQUEST);
    }

    const now = new Date();
    const activeDuration = session.activeDuration + dayjs(now).diff(dayjs(session.startedAt), "second");

    const updatedSession = await prisma.taskSession.update({
      where: { id: session.id },
      data: {
        pausedAt: now,
        activeDuration
      }
    });

    await logActivity({
      type: "TASK_PAUSED",
      message: `${req.user!.name} paused ${session.id}`, // Should probably use task title
      actorId: userId,
      projectId: "system", // Need to get task first if we want title/projectId
      taskId: taskId
    });

    res.json(updatedSession);
  })
);

taskRouter.post(
  "/:id/resume",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const userId = req.user!.id;

    await checkPunchIn(userId);

    const session = await prisma.taskSession.findFirst({
      where: { taskId, userId, endedAt: null, NOT: { pausedAt: null } },
      orderBy: { startedAt: "desc" }
    });

    if (!session) {
      throw new AppError("No paused session found for this task", StatusCodes.BAD_REQUEST);
    }

    const updatedSession = await prisma.taskSession.update({
      where: { id: session.id },
      data: {
        startedAt: new Date(),
        pausedAt: null
      }
    });

    await logActivity({
      type: "TASK_RESUMED",
      message: `${req.user!.name} resumed task`,
      actorId: userId,
      taskId: taskId
    });

    res.json(updatedSession);
  })
);

taskRouter.post(
  "/:id/complete",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const taskId = String(req.params.id);
    const userId = req.user!.id;

    const session = await prisma.taskSession.findFirst({
      where: { taskId, userId, endedAt: null },
      orderBy: { startedAt: "desc" }
    });

    const now = new Date();
    if (session) {
      let activeDuration = session.activeDuration;
      if (!session.pausedAt) {
        activeDuration += dayjs(now).diff(dayjs(session.startedAt), "second");
      }

      await prisma.taskSession.update({
        where: { id: session.id },
        data: {
          endedAt: now,
          activeDuration
        }
      });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: "DONE" }
    });

    await logActivity({
      type: "TASK_COMPLETED",
      message: `${req.user!.name} completed ${task.title}`,
      actorId: userId,
      projectId: task.projectId,
      taskId: task.id
    });

    res.json(task);
  })
);

export { taskRouter };

