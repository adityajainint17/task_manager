import type { ReactNode } from "react";
import "./globals.css";
import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "A premium collaborative project and task workspace."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
