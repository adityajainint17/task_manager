"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelector } from "./role-selector";
import { UserRole } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name is required"),
  role: z.string()
});

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("TASKER");
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "TASKER"
    }
  });

  const onSubmit = async (values: any) => {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const payload = mode === "login" ? values : { ...values, role: selectedRole };
      
      const { data } = await api.post(endpoint, payload);
      setSession(data.user, data.accessToken);
      toast.success(mode === "login" ? "Welcome back" : "Account created successfully");
      router.replace("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? "Authentication failed");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 p-8 glass-card rounded-[2.5rem]">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "login" 
            ? "Enter your credentials to access the platform" 
            : "Join the workforce and start tracking your productivity"}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Full Name
                </label>
                <Input placeholder="Aditya" {...register("name")} />
                {errors.name && <p className="text-rose-500 text-[10px] ml-1">{errors.name.message as string}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Select Your Role
                </label>
                <RoleSelector 
                  selectedRole={selectedRole} 
                  onSelect={setSelectedRole} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Email Address
            </label>
            <Input placeholder="aditya@company.com" {...register("email")} />
            {errors.email && <p className="text-rose-500 text-[10px] ml-1">{errors.email.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Password
            </label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                {...register("password")} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-rose-500 text-[10px] ml-1">{errors.password.message as string}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded-sm border-border bg-secondary" />
            <span className="text-xs text-muted-foreground">Remember me</span>
          </label>
          <button type="button" className="text-xs text-primary hover:underline">
            Forgot password?
          </button>
        </div>

        <Button className="w-full h-12" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} />
              Please wait...
            </>
          ) : (
            mode === "login" ? "Sign In" : "Register Now"
          )}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "login" ? (
            <>Don&apos;t have an account? <span className="text-primary font-semibold">Sign up</span></>
          ) : (
            <>Already have an account? <span className="text-primary font-semibold">Sign in</span></>
          )}
        </button>
      </div>
    </div>
  );
}
