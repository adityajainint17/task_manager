import dayjs from "dayjs";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";

const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/stats",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user!.id },
      select: { projectId: true, role: true }
    });
    const projectIds = memberships.map((item: { projectId: string }) => item.projectId);

    const [tasks, activities, projects] = await Promise.all([
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, name: true, avatarColor: true } }
        }
      }),
      prisma.activityLog.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          actor: { select: { id: true, name: true, avatarColor: true } },
          project: { select: { name: true, key: true, color: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      prisma.project.findMany({
        where: { id: { in: projectIds } },
        include: { tasks: true }
      })
    ]);

    const today = dayjs().startOf("day");
    const overdueTasks = tasks.filter((task: (typeof tasks)[number]) => task.dueDate && dayjs(task.dueDate).isBefore(today) && task.status !== "DONE");
    const dueTodayTasks = tasks.filter((task: (typeof tasks)[number]) => task.dueDate && dayjs(task.dueDate).isSame(today, "day") && task.status !== "DONE");
    const assignedTasks = tasks.filter((task: (typeof tasks)[number]) => task.assigneeId === req.user!.id);
    const completedTasks = tasks.filter((task: (typeof tasks)[number]) => task.status === "DONE");

    const statusBreakdown = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((status) => ({
      status,
      count: tasks.filter((task: (typeof tasks)[number]) => task.status === status).length
    }));

    const priorityBreakdown = ["LOW", "MEDIUM", "HIGH", "URGENT"].map((priority) => ({
      priority,
      count: tasks.filter((task: (typeof tasks)[number]) => task.priority === priority).length
    }));

    const projectProgress = projects.map((project: (typeof projects)[number]) => {
      const total = project.tasks.length;
      const completed = project.tasks.filter((task: (typeof project.tasks)[number]) => task.status === "DONE").length;

      return {
        id: project.id,
        name: project.name,
        key: project.key,
        color: project.color,
        progress: total ? Math.round((completed / total) * 100) : 0,
        total,
        completed
      };
    });

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks: tasks.length,
        assignedTasks: assignedTasks.length,
        overdueTasks: overdueTasks.length,
        dueTodayTasks: dueTodayTasks.length,
        completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0
      },
      overdueTasks,
      dueTodayTasks,
      assignedTasks,
      statusBreakdown,
      priorityBreakdown,
      projectProgress,
      recentActivity: activities
    });
  })
);

export { dashboardRouter };
