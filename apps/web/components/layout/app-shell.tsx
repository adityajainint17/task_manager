"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  FolderKanban, 
  LayoutDashboard, 
  LogOut, 
  Moon, 
  Search, 
  SunMedium, 
  UserSquare2,
  Clock,
  Calendar,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  Bell,
  Menu,
  X,
  Play,
  Square
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [timer, setTimer] = useState("00:00:00");

  const initials = useMemo(
    () =>
      user?.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2) ?? "TT",
    [user]
  );

  const navItems = useMemo(() => {
    const items = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PLS", "QLS", "TASKER"] },
      { href: "/my-tasks", label: "My Tasks", icon: CheckCircle2, roles: ["TASKER", "PLS", "QLS"] },
      { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["ADMIN", "PLS", "QLS", "TASKER"] },
      { href: "/attendance", label: "Attendance", icon: Clock, roles: ["ADMIN", "PLS", "QLS", "TASKER"] },
      { href: "/leave", label: "Apply Leave", icon: Calendar, roles: ["ADMIN", "PLS", "QLS", "TASKER"] },
      { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["ADMIN", "PLS", "QLS"] },
      { href: "/team", label: "Team Members", icon: Users, roles: ["ADMIN", "PLS"] },
      { href: "/reviews", label: "Reviews", icon: ShieldCheck, roles: ["QLS", "ADMIN"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "PLS", "QLS", "TASKER"] },
    ];
    return items.filter(item => item.roles.includes(user?.role || ""));
  }, [user?.role]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data } = await api.get("/attendance/today");
        if (data && !data.punchOut) {
          setIsPunchedIn(true);
          setPunchInTime(data.punchIn);
        }
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      }
    };
    if (user) fetchAttendance();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (isPunchedIn && punchInTime) {
      interval = setInterval(() => {
        const start = new Date(punchInTime).getTime();
        const now = new Date().getTime();
        const diff = now - start;
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        
        setTimer(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else {
      setTimer("00:00:00");
    }
    return () => clearInterval(interval);
  }, [isPunchedIn, punchInTime]);

  const handlePunchToggle = async () => {
    try {
      if (isPunchedIn) {
        await api.post("/attendance/punch-out");
        setIsPunchedIn(false);
        setPunchInTime(null);
        toast.success("Punched out successfully");
      } else {
        const { data } = await api.post("/attendance/punch-in");
        setIsPunchedIn(true);
        setPunchInTime(data.punchIn);
        toast.success("Punched in successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Operation failed");
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    clearSession();
    toast.success("Signed out");
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">TeamFlow</h1>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Workforce OS</span>
            </div>
          </div>

          <div className="mb-8 p-4 rounded-3xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Attendance</span>
              {isPunchedIn && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <div className="text-2xl font-mono font-bold mb-3">{timer}</div>
            <Button 
              variant={isPunchedIn ? "danger" : "primary"} 
              className="w-full h-10 rounded-xl"
              onClick={handlePunchToggle}
            >
              {isPunchedIn ? <Square size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
              {isPunchedIn ? "Punch Out" : "Punch In"}
            </Button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    active 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon size={20} className={cn("transition-colors", active ? "text-primary-foreground" : "group-hover:text-primary")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner"
              style={{ backgroundColor: user?.avatarColor }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter px-1.5 py-0 h-4 border-primary/20 bg-primary/5 text-primary">
                {user?.role}
              </Badge>
            </div>
            <button 
              onClick={logout}
              className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl lg:hidden flex flex-col"
            >
              {/* Similar content as desktop sidebar */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <ShieldCheck className="text-primary-foreground" size={18} />
                    </div>
                    <h1 className="font-bold">TeamFlow</h1>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                {/* ... existing nav items ... */}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 border-b border-border/50 bg-background/50 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold tracking-tight">
                {pathname === "/dashboard" ? "Operational Overview" : pathname.split("/").pop()?.replace("-", " ")}
              </h2>
              <p className="text-xs text-muted-foreground">Welcome back, {user?.name.split(" ")[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-2xl px-4 py-2 w-64 group focus-within:w-80 transition-all duration-300">
              <Search size={16} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Search workspace..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50"
              />
              <span className="text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">⌘K</span>
            </div>
            
            <Button variant="outline" size="icon" className="rounded-xl border-border/50" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <SunMedium size={20} /> : <Moon size={20} />}
            </Button>
            
            <Button variant="outline" size="icon" className="rounded-xl border-border/50 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
