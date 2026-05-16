"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LeaveRequest } from "@/lib/types";
import { 
  Calendar, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LeavePage() {
  const [history, setHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/leave/history");
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch leave history", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !startDate || !endDate) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await api.post("/leave/apply", {
        reason,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });
      toast.success("Leave application submitted");
      setReason("");
      setStartDate("");
      setEndDate("");
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Failed to apply for leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Time Off Requests</h1>
        <p className="text-muted-foreground mt-1">Submit and track your leave applications.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Apply Form */}
        <Card className="p-8 glass-card border-none rounded-[2.5rem] h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Send size={20} />
            </div>
            <h3 className="text-xl font-bold">Apply for Leave</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Reason</label>
              <Textarea 
                placeholder="Briefly explain your reason for leave..." 
                className="rounded-2xl min-h-[120px]"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button className="w-full h-12 rounded-2xl" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Card>

        {/* History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xl font-bold">Recent Requests</h3>
            <Badge variant="outline" className="rounded-full">{history.length} Total</Badge>
          </div>

          <div className="space-y-4">
            {history.length > 0 ? history.map((req) => (
              <Card key={req.id} className="p-6 glass-card border-none rounded-3xl hover:translate-x-1 transition-transform">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500" :
                      req.status === "REJECTED" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {req.status === "APPROVED" ? <CheckCircle size={24} /> :
                       req.status === "REJECTED" ? <XCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">
                          {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {req.reason}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        <div className="flex items-center gap-1">
                          <FileText size={12} />
                          ID: {req.id.slice(-6)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          Submitted {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge className={cn(
                    "rounded-lg border-none",
                    req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500" :
                    req.status === "REJECTED" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {req.status}
                  </Badge>
                </div>
              </Card>
            )) : (
              <div className="text-center py-20 glass-card rounded-[2.5rem] opacity-50">
                <Calendar size={48} className="mx-auto mb-4" />
                <p>No leave requests found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
