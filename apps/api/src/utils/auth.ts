import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import type { AuthUser, JwtPayload } from "../types.js";

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signAccessToken = (user: AuthUser) =>
  jwt.sign({ ...user, type: "access" } satisfies JwtPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });

export const signRefreshToken = (user: AuthUser) =>
  jwt.sign({ ...user, type: "refresh" } satisfies JwtPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as jwt.SignOptions["expiresIn"]
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

export const generateProjectKey = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part.slice(0, 2).toUpperCase())
    .join("")
    .slice(0, 6) || crypto.randomBytes(2).toString("hex").toUpperCase();

export const makeAvatarColor = (seed: string) => {
  const palette = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899"];
  const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[sum % palette.length];
};
