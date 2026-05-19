"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LeadDashboard({ role }: { role: string }) {
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
        toast.error("Unable to load dashboard data");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <Card key={i} className="p-6 glass-card border-none rounded-3xl group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                {i === 0 ? <Briefcase size={22} /> : i === 1 ? <CheckCircle2 size={22} /> : i === 2 ? <Clock size={22} /> : <ShieldCheck size={22} />}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
              <TrendingUp size={14} />
              <span>+5.2% from last week</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Productivity */}
        <Card className="lg:col-span-2 p-8 glass-card border-none rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">{role === "PLS" ? "Team Progress" : "Review Velocity"}</h3>
              <p className="text-sm text-muted-foreground">Performance metrics for your current sprint</p>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-primary text-primary-foreground border-none px-3 py-1">Sprint 24</Badge>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
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
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions / Queue */}
        <Card className="p-8 glass-card border-none rounded-[2.5rem] flex flex-col">
          <h3 className="text-xl font-bold mb-6">Pending {role === "QLS" ? "Reviews" : "Assignments"}</h3>
          <div className="space-y-4 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase h-5 border-primary/20 bg-primary/5 text-primary">
                    Project Alpha
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">2h ago</span>
                </div>
                <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">Implement enterprise SSO flow</h4>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2].map(j => (
                      <div key={j} className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold">
                        JD
                      </div>
                    ))}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-6 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-none">
            View All Pending
          </Button>
        </Card>
      </div>
    </div>
  );
}
