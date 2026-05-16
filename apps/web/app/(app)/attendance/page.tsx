"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Attendance } from "@/lib/types";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Square,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AttendancePage() {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [active, setActive] = useState<Attendance | null>(null);
  const [timer, setTimer] = useState("00:00:00");

  const fetchAttendance = async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        api.get("/attendance/history"),
        api.get("/attendance/today")
      ]);
      setHistory(hRes.data);
      if (aRes.data && !aRes.data.punchOut) {
        setActive(aRes.data);
      } else {
        setActive(null);
      }
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    let interval: any;
    if (active) {
      interval = setInterval(() => {
        const start = new Date(active.punchIn).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimer(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setTimer("00:00:00");
    }
    return () => clearInterval(interval);
  }, [active]);

  const handlePunch = async () => {
    try {
      if (active) {
        await api.post("/attendance/punch-out");
        toast.success("Punched out successfully");
      } else {
        await api.post("/attendance/punch-in");
        toast.success("Punched in successfully");
      }
      fetchAttendance();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Operation failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workforce Attendance</h1>
          <p className="text-muted-foreground mt-1">Track your daily working hours and attendance logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="h-9 px-4 rounded-full bg-primary/10 text-primary border-none text-xs font-bold">
            Today: {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </header>

      {/* Main Punch Card */}
      <Card className="p-10 glass-card border-none rounded-[3rem] text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500" />
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium">
            <Clock size={16} className="text-primary" />
            Current Session
          </div>
          <div className="text-7xl font-mono font-black tracking-tighter py-4">
            {timer}
          </div>
          {active && (
            <p className="text-sm text-muted-foreground">
              Punched in at <span className="text-foreground font-bold">{new Date(active.punchIn).toLocaleTimeString()}</span>
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            variant={active ? "danger" : "primary"}
            className="h-20 px-12 rounded-[2rem] text-xl font-bold shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95]"
            onClick={handlePunch}
          >
            {active ? (
              <><Square className="mr-3 fill-current" size={24} /> Punch Out Now</>
            ) : (
              <><Play className="mr-3 fill-current" size={24} /> Start Working Day</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Average Start</p>
            <p className="text-lg font-bold">09:15 AM</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Hours (Month)</p>
            <p className="text-lg font-bold">164.5 hrs</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Punctuality</p>
            <p className="text-lg font-bold text-emerald-500">98%</p>
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card className="p-8 glass-card border-none rounded-[2.5rem]">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <History size={20} />
          </div>
          <h3 className="text-xl font-bold">Attendance History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="pb-4 px-2">Session Date</th>
                <th className="pb-4 px-2">Start Time</th>
                <th className="pb-4 px-2">End Time</th>
                <th className="pb-4 px-2">Active Hours</th>
                <th className="pb-4 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {history.map((row) => (
                <tr key={row.id} className="group hover:bg-white/5 transition-all">
                  <td className="py-5 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex flex-col items-center justify-center text-[10px] font-bold">
                        <span className="text-primary">{new Date(row.punchIn).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                        <span>{new Date(row.punchIn).getDate()}</span>
                      </div>
                      <span className="text-sm font-bold">{new Date(row.punchIn).toLocaleDateString(undefined, { weekday: 'long' })}</span>
                    </div>
                  </td>
                  <td className="py-5 px-2 text-sm text-muted-foreground font-medium">{new Date(row.punchIn).toLocaleTimeString()}</td>
                  <td className="py-5 px-2 text-sm text-muted-foreground font-medium">
                    {row.punchOut ? new Date(row.punchOut).toLocaleTimeString() : "-"}
                  </td>
                  <td className="py-5 px-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono font-bold">{row.totalHours ? `${row.totalHours.toFixed(1)} hrs` : "In Progress"}</span>
                      {row.totalHours && (
                        <div className="h-1 w-20 bg-secondary rounded-full mt-1">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${Math.min((row.totalHours / 9) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-2 text-right">
                    <Badge className={cn(
                      "rounded-lg border-none px-3 py-1",
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
