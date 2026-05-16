"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/)
});

type Values = z.infer<typeof schema>;

export function ProjectFormModal({
  open,
  onClose,
  project,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors }
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      color: "#8b5cf6"
    }
  });

  useEffect(() => {
    reset({
      name: project?.name ?? "",
      description: project?.description ?? "",
      color: project?.color ?? "#8b5cf6"
    });
  }, [project, reset]);

  const onSubmit = async (values: Values) => {
    try {
      if (project) {
        await api.put(`/projects/${project.id}`, values);
      } else {
        await api.post("/projects", values);
      }
      toast.success(project ? "Project updated" : "Project created");
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to save project");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "Create project"}
      description="Shape the project, define its tone, and give the team a clear home base."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input placeholder="Project name" {...register("name")} />
          {errors.name ? <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p> : null}
        </div>
        <div>
          <Textarea placeholder="What is this project trying to accomplish?" {...register("description")} />
          {errors.description ? <p className="mt-1 text-xs text-rose-400">{errors.description.message}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted-foreground">Accent color</label>
          <Input type="color" className="h-12" {...register("color")} />
        </div>
        <div className="flex justify-end">
          <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : project ? "Save changes" : "Create project"}</Button>
        </div>
      </form>
    </Modal>
  );
}
