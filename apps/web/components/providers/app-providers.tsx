import type { ReactNode } from "react";
"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useBootstrapAuth } from "@/hooks/use-auth";

export function AppProviders({ children }: { children: ReactNode }) {
  useBootstrapAuth();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  );
}
