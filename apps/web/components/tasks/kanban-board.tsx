"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ProjectDetail, Task, TaskStatus } from "@/lib/types";
import { formatDate, isOverdue, statusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskModal } from "@/components/tasks/task-modal";

const columns: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function KanbanBoard({
  project,
  canManage,
  onRefresh
}: {
  project: ProjectDetail;
  canManage: boolean;
  onRefresh: () => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const grouped = useMemo(
    () =>
      columns.reduce<Record<TaskStatus, Task[]>>((acc, column) => {
        acc[column] = project.tasks.filter((task) => task.status === column);
        return acc;
      }, {} as Record<TaskStatus, Task[]>),
    [project.tasks]
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    const nextStatus = columns.find((column) => column === overId);

    if (!nextStatus) return;

    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      toast.success(`Task moved to ${statusLabel(nextStatus)}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Unable to move task");
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Kanban board</h3>
          <p className="text-sm text-muted-foreground">A quick read on flow, pressure, and what is actually moving.</p>
        </div>
        {canManage ? <Button onClick={() => setCreateOpen(true)}>Create task</Button> : null}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map((column) => (
            <DroppableColumn key={column} id={column}>
              <Card className="border-white/10 bg-card/65 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{statusLabel(column)}</p>
                <Badge>{grouped[column].length}</Badge>
              </div>
              <SortableContext items={grouped[column].map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {grouped[column].map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                </div>
              </SortableContext>
              </Card>
            </DroppableColumn>
          ))}
        </div>
      </DndContext>

      <TaskModal open={createOpen} onClose={() => setCreateOpen(false)} project={project} canManage={canManage} onSaved={onRefresh} />
      {selectedTask ? (
        <TaskModal open={!!selectedTask} onClose={() => setSelectedTask(null)} project={project} task={selectedTask} canManage={canManage} onSaved={onRefresh} />
      ) : null}
    </>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="w-full rounded-2xl border bg-background/40 p-4 text-left transition hover:border-primary/50 hover:bg-background/70"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{task.title}</p>
        <Badge variant={task.priority === "URGENT" ? "danger" : task.priority === "HIGH" ? "warning" : "default"}>{task.priority}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{task.assignee?.name ?? "Unassigned"}</span>
        <span className={isOverdue(task.dueDate) && task.status !== "DONE" ? "text-rose-400" : ""}>{formatDate(task.dueDate)}</span>
      </div>
    </button>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}
