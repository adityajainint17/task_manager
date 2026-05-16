import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../utils/validation.js";
import type { AuthenticatedRequest } from "../types.js";

const leaveRouter = Router();

const leaveApplySchema = z.object({
  reason: z.string().min(5).max(500),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

leaveRouter.use(requireAuth);

leaveRouter.post(
  "/apply",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const payload = validate(leaveApplySchema, req.body);
    const userId = req.user!.id;

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        reason: payload.reason,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        status: "PENDING"
      }
    });

    await prisma.activityLog.create({
      data: {
        type: "LEAVE_APPLIED",
        message: `${req.user!.name} applied for leave`,
        actorId: userId
      }
    });

    res.status(StatusCodes.CREATED).json(leaveRequest);
  })
);

leaveRouter.get(
  "/history",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const history = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(history);
  })
);

// Admin/Lead only: View all leave requests
leaveRouter.get(
  "/all",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "ADMIN" && req.user!.role !== "PLS") {
      return res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden" });
    }

    const requests = await prisma.leaveRequest.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(requests);
  })
);

// Admin/Lead only: Update leave status
leaveRouter.patch(
  "/:id/status",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "ADMIN" && req.user!.role !== "PLS") {
      return res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden" });
    }

    const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
    const leaveId = req.params.id;

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status }
    });

    await prisma.activityLog.create({
      data: {
        type: "LEAVE_STATUS_CHANGED",
        message: `Leave request ${status.toLowerCase()}`,
        actorId: req.user!.id
      }
    });

    res.json(updated);
  })
);

export { leaveRouter };
