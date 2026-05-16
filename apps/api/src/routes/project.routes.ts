import { Prisma } from "@prisma/client";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { PROJECT_ROLES } from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectRole } from "../middleware/project-role.js";
import { logActivity } from "../utils/activity.js";
import { generateProjectKey } from "../utils/auth.js";
import { validate } from "../utils/validation.js";
import type { AuthenticatedRequest } from "../types.js";

const projectRouter = Router();

const projectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(1000),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Color must be a valid hex value")
});

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(PROJECT_ROLES).default("MEMBER")
});

const roleUpdateSchema = z.object({
  role: z.enum(PROJECT_ROLES)
});

projectRouter.use(requireAuth);

projectRouter.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projects = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      include: {
        project: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } }
            },
            tasks: true,
            activities: {
              take: 4,
              orderBy: { createdAt: "desc" }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    res.json({
      projects: projects.map(({ role, project }: { role: string; project: any }) => {
        const totalTasks = project.tasks.length;
        const doneTasks = project.tasks.filter((task: any) => task.status === "DONE").length;

        return {
          id: project.id,
          name: project.name,
          key: project.key,
          description: project.description,
          color: project.color,
          role,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          progress: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
          taskCount: totalTasks,
          doneTasks,
          members: project.members.map((member: any) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatarColor: member.user.avatarColor,
            role: member.role
          })),
          recentActivity: project.activities
        };
      })
    });
  })
);

projectRouter.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = validate(projectSchema, req.body);

    let key = generateProjectKey(payload.name);
    let attempts = 0;

    while (attempts < 5) {
      const exists = await prisma.project.findUnique({ where: { key } });
      if (!exists) break;
      key = `${generateProjectKey(payload.name)}${attempts + 1}`;
      attempts += 1;
    }

    const project = await prisma.project.create({
      data: {
        ...payload,
        key,
        ownerId: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            role: "ADMIN"
          }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } }
        }
      }
    });

    await logActivity({
      type: "PROJECT_CREATED",
      message: `${req.user!.name} created ${project.name}`,
      actorId: req.user!.id,
      projectId: project.id
    });

    res.status(StatusCodes.CREATED).json({ project });
  })
);

projectRouter.get(
  "/:id",
  requireProjectRole(["ADMIN", "MEMBER"]),
  asyncHandler(async (req, res) => {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarColor: true } } }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarColor: true } },
            creator: { select: { id: true, name: true, email: true, avatarColor: true } },
            comments: {
              include: { author: { select: { id: true, name: true, email: true, avatarColor: true } } },
              orderBy: { createdAt: "asc" }
            }
          },
          orderBy: [{ status: "asc" }, { order: "asc" }]
        },
        activities: {
          include: { actor: { select: { id: true, name: true, email: true, avatarColor: true } } },
          orderBy: { createdAt: "desc" },
          take: 15
        }
      }
    });

    if (!project) {
      throw new AppError("Project not found", StatusCodes.NOT_FOUND);
    }

    res.json({ project });
  })
);

projectRouter.put(
  "/:id",
  requireProjectRole(["ADMIN"]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projectId = String(req.params.id);
    const payload = validate(projectSchema, req.body);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: payload
    });

    await logActivity({
      type: "PROJECT_UPDATED",
      message: `${req.user!.name} updated ${project.name}`,
      actorId: req.user!.id,
      projectId: project.id
    });

    res.json({ project });
  })
);

projectRouter.delete(
  "/:id",
  requireProjectRole(["ADMIN"]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new AppError("Project not found", StatusCodes.NOT_FOUND);
    }

    await prisma.project.delete({ where: { id: projectId } });

    res.json({ message: `${project.name} deleted successfully` });
  })
);

projectRouter.post(
  "/:id/members",
  requireProjectRole(["ADMIN"]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projectId = String(req.params.id);
    const payload = validate(memberSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (!user) {
      throw new AppError("User must sign up before being added to a project", StatusCodes.NOT_FOUND);
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id
        }
      },
      update: { role: payload.role },
      create: {
        projectId,
        userId: user.id,
        role: payload.role
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } }
      }
    });

    await logActivity({
      type: "MEMBER_ADDED",
      message: `${req.user!.name} added ${user.name} to the project`,
      actorId: req.user!.id,
      projectId,
      metadata: { role: payload.role } as Prisma.JsonObject
    });

    res.status(StatusCodes.CREATED).json({ member });
  })
);

projectRouter.put(
  "/:id/members/:memberId",
  requireProjectRole(["ADMIN"]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projectId = String(req.params.id);
    const memberId = String(req.params.memberId);
    const payload = validate(roleUpdateSchema, req.body);
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new AppError("Project not found", StatusCodes.NOT_FOUND);
    }

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: memberId },
      include: { user: true }
    });

    if (!member) {
      throw new AppError("Member not found", StatusCodes.NOT_FOUND);
    }

    if (member.userId === project.ownerId && payload.role !== "ADMIN") {
      throw new AppError("Project owner must remain an admin");
    }

    const updated = await prisma.projectMember.update({
      where: { id: member.id },
      data: { role: payload.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } }
      }
    });

    await logActivity({
      type: "ROLE_UPDATED",
      message: `${req.user!.name} changed ${member.user.name}'s role to ${payload.role}`,
      actorId: req.user!.id,
      projectId
    });

    res.json({ member: updated });
  })
);

projectRouter.delete(
  "/:id/members/:memberId",
  requireProjectRole(["ADMIN"]),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const projectId = String(req.params.id);
    const memberId = String(req.params.memberId);
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new AppError("Project not found", StatusCodes.NOT_FOUND);
    }

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: memberId },
      include: { user: true }
    });

    if (!member) {
      throw new AppError("Member not found", StatusCodes.NOT_FOUND);
    }

    if (member.userId === req.user!.id) {
      throw new AppError("Project admins cannot remove themselves");
    }

    if (member.userId === project.ownerId) {
      throw new AppError("Project owner cannot be removed");
    }

    await prisma.projectMember.delete({ where: { id: member.id } });

    await logActivity({
      type: "MEMBER_REMOVED",
      message: `${req.user!.name} removed ${member.user.name} from the project`,
      actorId: req.user!.id,
      projectId
    });

    res.status(StatusCodes.NO_CONTENT).send();
  })
);

export { projectRouter };
