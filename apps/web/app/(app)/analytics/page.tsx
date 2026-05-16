"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap,
  ArrowUpRight,
  PieChart as PieChartIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useAuthStore } from "@/store/auth-store";

const COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899"];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [productivity, setProductivity] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/productivity")
        ]);
        setMetrics(mRes.data.metrics);
        setProductivity(pRes.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      }
    };
    fetchData();
  }, []);

  const pieData = [
    { name: "Completed", value: 45 },
    { name: "In Progress", value: 30 },
    { name: "Pending", value: 25 },
  ];

  return (
    <div className="space-y-10 animate-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into productivity metrics and operational efficiency.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-border/50">Export PDF</Button>
          <Button variant="primary" className="rounded-xl">Schedule Report</Button>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <Card key={i} className="p-8 glass-card border-none rounded-[2rem] group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-primary/5 text-primary">
                {i === 0 ? <Target size={24} /> : i === 1 ? <Zap size={24} /> : i === 2 ? <BarChart3 size={24} /> : <TrendingUp size={24} />}
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none">+12%</Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-4xl font-bold mt-2">{stat.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Productivity Trend */}
        <Card className="p-10 glass-card border-none rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-bold">Productivity Velocity</h3>
              <p className="text-sm text-muted-foreground">Work hours distribution across the last 7 days</p>
            </div>
            <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 text-center min-w-[100px]">
              <p className="text-[10px] font-bold text-primary uppercase">Avg Daily</p>
              <p className="text-lg font-bold">7.4h</p>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivity}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="hsl(var(--muted)/0.1)" />
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
                    borderRadius: "24px", 
                    border: "none",
                    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.5)"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorArea)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Distribution */}
        <Card className="p-10 glass-card border-none rounded-[3rem] flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-bold">Task Distribution</h3>
              <p className="text-sm text-muted-foreground">Current workload breakdown by status</p>
            </div>
            <PieChartIcon className="text-muted-foreground" size={24} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderRadius: "16px", 
                      border: "none"
                    }} 
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Top Performer</p>
                <p className="font-bold">Aditya S.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Efficiency</p>
                <p className="font-bold">94.2%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit List */}
      <Card className="p-10 glass-card border-none rounded-[3rem]">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-bold">Recent Operational Audit</h3>
          <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-xl">View Full Audit Trail</Button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-sm font-bold">
                  AS
                </div>
                <div>
                  <p className="font-bold text-sm">Aditya completed Task #1042</p>
                  <p className="text-xs text-muted-foreground">Marketing • 14 minutes ago</p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
