"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Users, 
  FolderKanban, 
  CheckCircle2, 
  Activity,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899"];

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [productivity, setProductivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/productivity")
        ]);
        setMetrics(mRes.data.metrics);
        setProductivity(pRes.data);
      } catch {
        toast.error("Unable to load admin dashboard");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {metrics.map((stat, i) => (
          <Card key={i} className="p-6 glass-card border-none rounded-3xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 relative z-10">{stat.label}</p>
            <div className="flex items-end justify-between relative z-10">
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {i === 0 ? <Users size={16} /> : i === 1 ? <FolderKanban size={16} /> : i === 2 ? <CheckCircle2 size={16} /> : <Activity size={16} />}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 p-8 glass-card border-none rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Organization Productivity</h3>
              <p className="text-sm text-muted-foreground">Workforce hours trend across the organization</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp size={14} />
              +12.5%
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivity}>
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
                  cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderRadius: "16px", 
                    border: "1px solid hsl(var(--border)/0.5)",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }} 
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} barSize={40}>
                  {productivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-8 glass-card border-none rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6">System Monitoring</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Sessions</span>
                <span className="font-bold">84%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[84%] rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Task Completion Rate</span>
                <span className="font-bold">67%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[67%] rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resource Utilization</span>
                <span className="font-bold">92%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[92%] rounded-full" />
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <Button variant="outline" className="w-full rounded-2xl group">
                System Audit Logs
                <ArrowUpRight size={16} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
