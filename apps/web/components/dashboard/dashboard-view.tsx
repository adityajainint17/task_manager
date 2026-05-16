"use client";

import { useAuthStore } from "@/store/auth-store";
import { AdminDashboard } from "./admin-dashboard";
import { LeadDashboard } from "./lead-dashboard";
import { TaskerDashboard } from "./tasker-dashboard";
import { motion } from "framer-motion";

export function DashboardView() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </header>

      {user.role === "ADMIN" && <AdminDashboard />}
      {(user.role === "PLS" || user.role === "QLS") && <LeadDashboard role={user.role} />}
      {user.role === "TASKER" && <TaskerDashboard />}
    </motion.div>
  );
}
