"use client";

import { motion } from "framer-motion";
import { UserRole } from "@/lib/types";
import { Shield, Briefcase, CheckCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "ADMIN" as UserRole,
    title: "Admin",
    description: "Organization & system management",
    icon: Shield,
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  {
    id: "PLS" as UserRole,
    title: "Project Lead",
    description: "Project & team management",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: "QLS" as UserRole,
    title: "Quality Lead",
    description: "QA & review management",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    id: "TASKER" as UserRole,
    title: "Tasker",
    description: "Execution & delivery",
    icon: User,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  }
];

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelect: (role: UserRole) => void;
}

export function RoleSelector({ selectedRole, onSelect }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onSelect(role.id)}
          className={cn(
            "relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 text-left",
            selectedRole === role.id
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border/50 bg-secondary/20 hover:border-border hover:bg-secondary/40"
          )}
        >
          <div className={cn("p-2 rounded-xl mb-3", role.bg, role.color)}>
            <role.icon size={20} />
          </div>
          <span className="font-semibold text-sm">{role.title}</span>
          <span className="text-[10px] text-muted-foreground line-clamp-1">
            {role.description}
          </span>
          {selectedRole === role.id && (
            <motion.div
              layoutId="role-check"
              className="absolute top-3 right-3 text-primary"
            >
              <CheckCircle size={16} />
            </motion.div>
          )}
        </button>
      ))}
    </div>
  );
}
