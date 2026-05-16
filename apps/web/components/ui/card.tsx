import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-card/75 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
