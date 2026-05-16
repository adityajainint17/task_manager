import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.issues[0]?.message ?? "Invalid input" });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({ message: "Resource already exists" });
    }
  }

  if (error instanceof Error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Unexpected server error" });
};
