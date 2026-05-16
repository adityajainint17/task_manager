import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types.js";
import dayjs from "dayjs";

const attendanceRouter = Router();

attendanceRouter.use(requireAuth);

// Punch In
attendanceRouter.post(
  "/punch-in",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    // Check if already punched in today
    const today = dayjs().startOf("day").toDate();
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        punchIn: {
          gte: today
        },
        punchOut: null
      }
    });

    if (existing) {
      throw new AppError("You are already punched in", StatusCodes.BAD_REQUEST);
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        punchIn: new Date(),
        status: "PRESENT"
      }
    });

    await prisma.activityLog.create({
      data: {
        type: "PUNCH_IN",
        message: `${req.user!.name} punched in`,
        actorId: userId
      }
    });


    res.status(StatusCodes.CREATED).json(attendance);
  })
);

// Punch Out
attendanceRouter.post(
  "/punch-out",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const active = await prisma.attendance.findFirst({
      where: {
        userId,
        punchOut: null
      },
      orderBy: {
        punchIn: "desc"
      }
    });

    if (!active) {
      throw new AppError("You are not punched in", StatusCodes.BAD_REQUEST);
    }

    const punchOut = new Date();
    const duration = dayjs(punchOut).diff(dayjs(active.punchIn), "hour", true);

    const attendance = await prisma.attendance.update({
      where: { id: active.id },
      data: {
        punchOut,
        totalHours: duration
      }
    });

    // Stop all active task sessions for this user
    await prisma.taskSession.updateMany({
      where: {
        userId,
        endedAt: null
      },
      data: {
        endedAt: punchOut
      }
    });

    await prisma.activityLog.create({
      data: {
        type: "PUNCH_OUT",
        message: `${req.user!.name} punched out`,
        actorId: userId
      }
    });


    res.json(attendance);
  })
);

// Get Today's Attendance
attendanceRouter.get(
  "/today",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const today = dayjs().startOf("day").toDate();

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        punchIn: {
          gte: today
        }
      },
      orderBy: {
        punchIn: "desc"
      }
    });

    res.json(attendance);
  })
);

// Get Attendance History
attendanceRouter.get(
  "/history",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const history = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { punchIn: "desc" },
      take: 30
    });

    res.json(history);
  })
);

export { attendanceRouter };
