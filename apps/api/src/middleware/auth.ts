import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../utils/auth.js";
import type { AuthenticatedRequest } from "../types.js";

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new AppError("Authentication required", StatusCodes.UNAUTHORIZED));
  }

  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role
  };


  return next();
};
