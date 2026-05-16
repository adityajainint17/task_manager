"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Task, Attendance } from "@/lib/types";
import { 
  CheckCircle2, 
  Clock, 
  Zap, 
  AlertCircle,
  Play,
  Pause,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { toast } from "sonner";

export function TaskerDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [productivity, setProductivity] = useState<any[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, pRes, tRes, aRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/productivity"),
          api.get("/tasks?mine=true&status=IN_PROGRESS"),
          api.get("/attendance/history")
        ]);
        setMetrics(mRes.data.metrics);
        setProductivity(pRes.data);
        setActiveTasks(tRes.data.tasks);
        setRecentAttendance(aRes.data);
      } catch (error) {
        console.error("Failed to fetch tasker data", error);
      }
    };
    fetchData();
  }, []);

  const handleTaskAction = async (taskId: string, action: "start" | "pause" | "resume" | "complete") => {
    try {
      await api.post(`/tasks/${taskId}/${action}`);
      toast.success(`Task ${action}ed successfully`);
      // Refresh tasks
      const { data } = await api.get("/tasks?mine=true&status=IN_PROGRESS");
      setActiveTasks(data.tasks);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? `Failed to ${action} task`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <Card key={i} className="p-6 glass-card border-none rounded-3xl group hover:scale-[1.02] transition-transform duration-300">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-bold">{stat.value}</h3>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {i === 0 ? <CheckCircle2 size={20} /> : i === 1 ? <Zap size={20} /> : i === 2 ? <Clock size={20} /> : <AlertCircle size={20} />}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Productivity Chart */}
        <Card className="lg:col-span-2 p-8 glass-card border-none rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Productivity Trend</h3>
              <p className="text-sm text-muted-foreground">Your working hours over the last 7 days</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-none">Active</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivity}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderRadius: "16px", 
                    border: "1px solid hsl(var(--border)/0.5)",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Active Tasks Sidebar */}
        <Card className="p-8 glass-card border-none rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6">Active Focus</h3>
          <div className="space-y-4">
            {activeTasks.length > 0 ? activeTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <div>
                  <h4 className="font-bold text-sm leading-tight">{task.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1">{task.project?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 rounded-xl"
                    onClick={() => handleTaskAction(task.id, "pause")}
                  >
                    <Pause size={14} className="mr-1" /> Pause
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex-1 rounded-xl"
                    onClick={() => handleTaskAction(task.id, "complete")}
                  >
                    <Check size={14} className="mr-1" /> Done
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-50">
                <Zap size={32} className="mx-auto mb-2" />
                <p className="text-sm">No active tasks</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Attendance Log */}
      <Card className="p-8 glass-card border-none rounded-[2.5rem]">
        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="pb-4 px-2">Date</th>
                <th className="pb-4 px-2">Punch In</th>
                <th className="pb-4 px-2">Punch Out</th>
                <th className="pb-4 px-2">Duration</th>
                <th className="pb-4 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recentAttendance.map((row) => (
                <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2 text-sm font-medium">{new Date(row.punchIn).toLocaleDateString()}</td>
                  <td className="py-4 px-2 text-sm text-muted-foreground">{new Date(row.punchIn).toLocaleTimeString()}</td>
                  <td className="py-4 px-2 text-sm text-muted-foreground">
                    {row.punchOut ? new Date(row.punchOut).toLocaleTimeString() : "-"}
                  </td>
                  <td className="py-4 px-2 text-sm font-mono font-bold">
                    {row.totalHours ? `${row.totalHours.toFixed(1)} hrs` : "Active"}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <Badge className={cn(
                      "rounded-lg border-none",
                      row.status === "PRESENT" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
