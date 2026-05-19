"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-auth";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isHydrated } = useRequireAuth();

  if (!isHydrated || !user) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
