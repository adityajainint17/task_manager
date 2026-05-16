"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, FolderKanban, CheckCircle2, PlusCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "My Tasks", href: "/my-tasks", icon: CheckCircle2 },
  { label: "Create Project", href: "/projects?compose=project", icon: PlusCircle }
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  return (
    <Modal open={open} onClose={onClose} title="Command palette" description="Jump to the next thing that matters.">
      <div className="space-y-2">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Button
              key={shortcut.href}
              variant="ghost"
              className="h-14 w-full justify-start rounded-xl border"
              onClick={() => {
                router.push(shortcut.href);
                onClose();
              }}
            >
              <Icon className="h-4 w-4" />
              {shortcut.label}
            </Button>
          );
        })}
      </div>
    </Modal>
  );
}
