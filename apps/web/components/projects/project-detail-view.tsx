"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, CheckCircle2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { ProjectDetail } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { MemberManager } from "@/components/projects/member-manager";

export function ProjectDetailView() {
  const params = useParams<{ projectId: string }>();
  const user = useAuthStore((state) => state.user);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/projects/${params.projectId}`);
      setProject(data.project);
    } catch (err: unknown) {
      setProject(null);
      const message =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message ?? "Unable to load this project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [params.projectId]);

  if (loading) {
    return <Skeleton className="h-[600px]" />;
  }

  if (error) {
    return (
      <Card className="border-white/10 bg-card/70 p-8">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!project) {
    return null;
  }

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((task) => task.status === "DONE").length;
  const canManage = project.members.some((member) => member.id === user?.id && member.role === "ADMIN");

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-card/70 p-0">
        <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
        <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: project.color }}>
              {project.key}
            </div>
            <h1 className="mt-4 text-3xl font-semibold">{project.name}</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="info">{project.members.length} teammates</Badge>
              <Badge variant="success">{completedTasks} completed</Badge>
              <Badge>{totalTasks} total tasks</Badge>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-white/10 bg-background/35">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="mt-4 text-2xl font-semibold">{project.members.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">active members</p>
            </Card>
            <Card className="border-white/10 bg-background/35">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <p className="mt-4 text-2xl font-semibold">{Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)}%</p>
              <p className="mt-1 text-sm text-muted-foreground">completion rate</p>
            </Card>
            <Card className="border-white/10 bg-background/35">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="mt-4 text-2xl font-semibold">{project.activities.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">recent events</p>
            </Card>
          </div>
        </div>
      </Card>

      <KanbanBoard project={project} canManage={canManage} onRefresh={fetchProject} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <MemberManager project={project} canManage={canManage} onUpdated={fetchProject} />

        <Card className="border-white/10 bg-card/70">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Activity timeline</h3>
            <p className="text-sm text-muted-foreground">The story of the project, without needing to ask around.</p>
          </div>
          <div className="space-y-4">
            {project.activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: activity.actor?.avatarColor ?? project.color }}
                >
                  {activity.actor?.name?.slice(0, 1) ?? "P"}
                </div>
                <div>
                  <p className="text-sm">{activity.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
