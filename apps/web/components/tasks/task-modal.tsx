"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ProjectDetail, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  dueDate: z.string().optional()
});

type Values = z.infer<typeof schema>;

export function TaskModal({
  open,
  onClose,
  project,
  task,
  canManage,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
  task?: Task | null;
  canManage: boolean;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: "",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: ""
    }
  });

  useEffect(() => {
    reset({
      title: task?.title ?? "",
      description: task?.description ?? "",
      assigneeId: task?.assigneeId ?? "",
      priority: (task?.priority ?? "MEDIUM") as TaskPriority,
      status: (task?.status ?? "TODO") as TaskStatus,
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
    });
  }, [task, reset]);

  const onSubmit = async (values: Values) => {
    try {
      const payload = {
        ...values,
        projectId: project.id,
        assigneeId: values.assigneeId || null,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null
      };

      if (task) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post("/tasks", payload);
      }

      toast.success(task ? "Task updated" : "Task created");
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to save task");
    }
  };

  const deleteTask = async () => {
    if (!task) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Task deleted");
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to delete task");
    }
  };

  const addComment = async (content: string) => {
    if (!task || !content.trim()) return;
    try {
      await api.post(`/tasks/${task.id}/comments`, { content });
      toast.success("Comment added");
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to comment");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? task.title : "Create task"}
      description={task ? `Due ${formatDate(task.dueDate)}` : "Capture work with clear owners, status, and timing."}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input placeholder="Task title" {...register("title")} disabled={!canManage && !!task} />
            {errors.title ? <p className="mt-1 text-xs text-rose-400">{errors.title.message}</p> : null}
          </div>
          <div>
            <Textarea placeholder="Task details" {...register("description")} disabled={!canManage && !!task} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select {...register("status")}>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </Select>
            <Select {...register("priority")} disabled={!canManage && !!task}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
            <Select {...register("assigneeId")} disabled={!canManage && !!task}>
              <option value="">Unassigned</option>
              {project.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
            <Input type="date" {...register("dueDate")} disabled={!canManage && !!task} />
          </div>
          <div className="flex items-center justify-between">
            {canManage && task ? (
              <Button type="button" variant="ghost" onClick={deleteTask}>
                Delete task
              </Button>
            ) : (
              <span />
            )}
            <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : task ? "Save task" : "Create task"}</Button>
          </div>
        </form>

        <div className="space-y-4">
          <CommentComposer onSubmit={addComment} disabled={!task} />
          <div className="max-h-[420px] space-y-3 overflow-y-auto">
            {task?.comments?.length ? (
              task.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Comments and decisions will collect here.</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CommentComposer({ onSubmit, disabled }: { onSubmit: (value: string) => Promise<void>; disabled: boolean }) {
  const { register, handleSubmit, reset } = useForm<{ content: string }>({ defaultValues: { content: "" } });

  return (
    <form
      className="space-y-3 rounded-xl border bg-background/30 p-3"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values.content);
        reset();
      })}
    >
      <Textarea placeholder="Add context, decisions, or blockers..." disabled={disabled} {...register("content")} />
      <div className="flex justify-end">
        <Button disabled={disabled}>Post comment</Button>
      </div>
    </form>
  );
}
