"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export const useBootstrapAuth = () => {
  const { user, accessToken, setSession, clearSession, setHydrated, isHydrated } = useAuthStore();

  useEffect(() => {
    const storedToken = localStorage.getItem("ttm_access_token");
    const storedUser = localStorage.getItem("ttm_user");

    if (storedToken && storedUser) {
      try {
        setSession(JSON.parse(storedUser) as Parameters<typeof setSession>[0], storedToken);
      } catch {
        clearSession();
        return;
      }
      api
        .get("/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
        .catch(() => {
          clearSession();
        });
    } else {
      setHydrated();
    }
  }, [clearSession, setHydrated, setSession]);

  return { user, accessToken, isHydrated };
};

export const useRequireAuth = () => {
  const router = useRouter();
  const { user, isHydrated } = useBootstrapAuth();

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, router, user]);

  return { user, isHydrated };
};
