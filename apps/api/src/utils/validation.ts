import type { ZodTypeAny } from "zod";
import { AppError } from "../lib/errors.js";

export const validate = <T extends ZodTypeAny>(schema: T, payload: unknown) => {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  return parsed.data;
};
