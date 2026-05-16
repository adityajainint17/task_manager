import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ProjectRole } from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import type { AuthenticatedRequest } from "../types.js";

export const requireProjectRole =
  (roles: ProjectRole[]) => async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const projectId = String(req.params.id ?? req.params.projectId ?? req.body.projectId ?? "");

    if (!req.user || !projectId) {
      return next(new AppError("Project context missing", StatusCodes.BAD_REQUEST));
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id
        }
      }
    });

    if (!membership) {
      return next(new AppError("You do not have access to this project", StatusCodes.FORBIDDEN));
    }

    req.projectRole = membership.role as ProjectRole;

    if (!roles.includes(membership.role as ProjectRole)) {
      return next(new AppError("Insufficient permissions", StatusCodes.FORBIDDEN));
    }

    return next();
  };
