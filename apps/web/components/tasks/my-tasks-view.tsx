"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Play, Pause, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { formatDate, isOverdue, statusLabel, cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function MyTasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | TaskPriority>("ALL");

  const fetchTasks = async () => {
    try {
      const response = await api.get("/tasks?mine=true");
      setTasks(response.data.tasks);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Unable to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      await api.post(`/tasks/${taskId}/${action}`);
      toast.success(action === "complete" ? "Task completed" : `Task ${action}d`);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? `Failed to ${action} task`);
    }
  };

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const matchesQuery =
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.description.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "ALL" || task.status === status;
        const matchesPriority = priority === "ALL" || task.priority === priority;
        return matchesQuery && matchesStatus && matchesPriority;
      }),
    [priority, query, status, tasks]
  );

  return (
    <div className="space-y-8 animate-in">
      <div className="glass-card p-8 rounded-[2.5rem]">
        <h1 className="text-3xl font-bold tracking-tight">Execution Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal task backlog. Start a session to track your productivity.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-12 rounded-2xl" placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded-2xl">
            <option value="ALL">All Statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="rounded-2xl">
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {filtered.map((task) => {
          const isPaused = task.taskSessions?.some(s => s.pausedAt && !s.endedAt);
          const isInProgress = task.status === "IN_PROGRESS";
          
          return (
            <Card key={task.id} className="p-6 glass-card border-none rounded-[2rem] hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      {task.project?.key}
                    </Badge>
                    <Badge className={cn(
                      "border-none",
                      task.priority === "URGENT" ? "bg-rose-500/10 text-rose-500" : 
                      task.priority === "HIGH" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {task.priority}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{task.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 pt-6 border-t border-border/30">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {formatDate(task.dueDate)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    {statusLabel(task.status)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {task.status !== "DONE" && (
                    <>
                      {isInProgress ? (
                        <>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleTaskAction(task.id, isPaused ? "resume" : "pause")}>
                            {isPaused ? <Play size={14} className="mr-2" /> : <Pause size={14} className="mr-2" />}
                            {isPaused ? "Resume" : "Pause"}
                          </Button>
                          <Button size="sm" variant="primary" className="rounded-xl" onClick={() => handleTaskAction(task.id, "complete")}>
                            <CheckCircle size={14} className="mr-2" /> Complete
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="primary" className="rounded-xl px-6" onClick={() => handleTaskAction(task.id, "start")}>
                          <Play size={14} className="mr-2" /> Start Task
                        </Button>
                      )}
                    </>
                  )}
                  {task.status === "DONE" && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none h-8 px-4 rounded-xl">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
