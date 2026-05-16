import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (value?: string | Date | null) => {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value)
  );
};

export const isOverdue = (value?: string | Date | null) =>
  value ? new Date(value).getTime() < Date.now() : false;

export const statusLabel = (status: string) => status.replaceAll("_", " ");
