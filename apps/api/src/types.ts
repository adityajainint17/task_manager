import type { Request } from "express";
import type { ProjectRole, UserRole } from "./constants.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type JwtPayload = AuthUser & {
  type: "access" | "refresh";
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
  projectRole?: ProjectRole;
};

