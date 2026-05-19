import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";
import dayjs from "dayjs";

const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get(
  "/dashboard",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === "ADMIN") {
      // Organization overview
      const totalUsers = await prisma.user.count();
      const totalProjects = await prisma.project.count();
      const totalTasks = await prisma.task.count();
      const activeSessions = await prisma.taskSession.count({ where: { endedAt: null } });
      const currentAttendance = await prisma.attendance.count({ where: { punchOut: null } });

      return res.json({
        metrics: [
          { label: "Total Employees", value: totalUsers },
          { label: "Active Projects", value: totalProjects },
          { label: "Total Tasks", value: totalTasks },
          { label: "Active Sessions", value: activeSessions },
          { label: "Punched In", value: currentAttendance }
        ]
      });
    }

    // Default: Tasker/Lead metrics
    const tasksCompleted = await prisma.task.count({
      where: { assigneeId: userId, status: "DONE" }
    });

    const activeTasks = await prisma.task.count({
      where: { assigneeId: userId, status: "IN_PROGRESS" }
    });

    const attendance = await prisma.attendance.findMany({
      where: { userId },
      select: { totalHours: true }
    });
    const totalWorkHours = attendance.reduce((acc: number, curr: { totalHours: number | null }) => acc + (curr.totalHours || 0), 0);


    const sessions = await prisma.taskSession.findMany({
      where: { userId, endedAt: { not: null } },
      select: { activeDuration: true }
    });
    const avgTaskTime = sessions.length > 0 
      ? sessions.reduce((acc: number, curr: { activeDuration: number }) => acc + curr.activeDuration, 0) / sessions.length / 3600 
      : 0;

    res.json({
      metrics: [
        { label: "Tasks Completed", value: tasksCompleted },
        { label: "Active Tasks", value: activeTasks },
        { label: "Total Work Hours", value: totalWorkHours.toFixed(1) },
        { label: "Avg Task Time (hrs)", value: avgTaskTime.toFixed(1) }
      ]
    });
  })
);

analyticsRouter.get(
  "/productivity",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const last7Days = Array.from({ length: 7 }).map((_, i) => 
      dayjs().subtract(i, "day").startOf("day")
    ).reverse();

    const chartData = await Promise.all(last7Days.map(async (date) => {
      const attendance = await prisma.attendance.findMany({
        where: {
          userId,
          punchIn: {
            gte: date.toDate(),
            lt: date.add(1, "day").toDate()
          }
        },
        select: { totalHours: true }
      });

      const hours = attendance.reduce((acc: number, curr: { totalHours: number | null }) => acc + (curr.totalHours || 0), 0);

      
      return {
        date: date.format("MMM DD"),
        hours: parseFloat(hours.toFixed(1))
      };
    }));

    res.json(chartData);
  })
);

export { analyticsRouter };
