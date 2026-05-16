"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FolderPlus, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectsView() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(searchParams.get("compose") === "project");
  const [editing, setEditing] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data.projects);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message ?? "Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = useMemo(
    () => projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase())),
    [projects, search]
  );

  const deleteProject = async (projectId: string) => {
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to delete project");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-56" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/70 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Keep every project legible: scope, ownership, delivery health, and the people moving it forward.
          </p>
        </div>
        <div className="flex w-full gap-3 lg:w-auto">
          <Input placeholder="Search projects" className="lg:w-72" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Button onClick={() => setOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            New project
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((project) => (
          <Card key={project.id} className="flex flex-col border-white/10 bg-card/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: project.color }}>
                  {project.key}
                </div>
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="info">{project.role}</Badge>
              <Badge>{project.taskCount} tasks</Badge>
              <Badge variant="success">{project.doneTasks} done</Badge>
            </div>

            <div className="mt-5 flex -space-x-3">
              {project.members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card text-xs font-semibold text-white"
                  style={{ backgroundColor: member.avatarColor }}
                  title={member.name}
                >
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:scale-[1.01]"
              >
                Open workspace
              </Link>
              {project.role === "ADMIN" ? (
                <>
                  <Button variant="secondary" size="icon" onClick={() => { setEditing(project); setOpen(true); }}>
                    <PenLine className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProject(project.id)}>
                    <Trash2 className="h-4 w-4 text-rose-400" />
                  </Button>
                </>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <ProjectFormModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        project={editing}
        onSaved={fetchProjects}
      />
    </div>
  );
}
