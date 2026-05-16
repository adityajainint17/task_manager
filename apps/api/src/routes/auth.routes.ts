import { Router } from "express";
import dayjs from "dayjs";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { comparePassword, hashPassword, makeAvatarColor, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/auth.js";
import { validate } from "../utils/validation.js";
import { env } from "../config/env.js";
import type { AuthenticatedRequest } from "../types.js";
import { USER_ROLES } from "../constants.js";

const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(USER_ROLES).default("TASKER")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/"
};

const serializeUser = (user: { id: string; name: string; email: string; avatarColor: string; role: any }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarColor: user.avatarColor,
  role: user.role
});

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const payload = validate(signupSchema, req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (existingUser) {
      throw new AppError("An account with that email already exists", StatusCodes.CONFLICT);
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        passwordHash: await hashPassword(payload.password),
        avatarColor: makeAvatarColor(payload.email),
        role: payload.role
      }
    });

    const authUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = signAccessToken(authUser);
    const refreshToken = signRefreshToken(authUser);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: dayjs().add(env.REFRESH_TOKEN_TTL_DAYS, "day").toDate()
      }
    });

    res.cookie("refreshToken", refreshToken, {
      ...refreshCookieOptions,
      expires: dayjs().add(env.REFRESH_TOKEN_TTL_DAYS, "day").toDate()
    });

    res.status(StatusCodes.CREATED).json({
      user: serializeUser(user),
      accessToken
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = validate(loginSchema, req.body);

    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (!user || !(await comparePassword(payload.password, user.passwordHash))) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    const authUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = signAccessToken(authUser);
    const refreshToken = signRefreshToken(authUser);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: dayjs().add(env.REFRESH_TOKEN_TTL_DAYS, "day").toDate()
      }
    });

    res.cookie("refreshToken", refreshToken, {
      ...refreshCookieOptions,
      expires: dayjs().add(env.REFRESH_TOKEN_TTL_DAYS, "day").toDate()
    });

    res.json({
      user: serializeUser(user),
      accessToken
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new AppError("Refresh token missing", StatusCodes.UNAUTHORIZED);
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });

    if (!stored || dayjs(stored.expiresAt).isBefore(dayjs())) {
      throw new AppError("Refresh token expired", StatusCodes.UNAUTHORIZED);
    }

    const payload = verifyRefreshToken(refreshToken);
    const authUser = { id: payload.id, email: payload.email, name: payload.name, role: stored.user.role };
    const nextAccessToken = signAccessToken(authUser);
    const nextRefreshToken = signRefreshToken(authUser);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: {
        token: nextRefreshToken,
        userId: stored.userId,
        expiresAt: dayjs().add(env.REFRESH_TOKEN_TTL_DAYS, "day").toDate()
      }
    });

    res.cookie("refreshToken", nextRefreshToken, {
      ...refreshCookieOptions,
      expires: dayjs().add(env.REFRESH_TOKEN_TTL_DAYS, "day").toDate()
    });

    res.json({
      user: serializeUser(stored.user),
      accessToken: nextAccessToken
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }

    res.clearCookie("refreshToken", refreshCookieOptions);
    res.status(StatusCodes.NO_CONTENT).send();
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, avatarColor: true, role: true, createdAt: true }
    });

    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    res.json({ user });
  })
);

export { authRouter };

