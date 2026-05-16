"use client";

import { create } from "zustand";
import type { User } from "@/lib/types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  setHydrated: () => void;
  setSession: (user: User, accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  setHydrated: () => set({ isHydrated: true }),
  setSession: (user, accessToken) => {
    localStorage.setItem("ttm_access_token", accessToken);
    localStorage.setItem("ttm_user", JSON.stringify(user));
    set({ user, accessToken, isHydrated: true });
  },
  clearSession: () => {
    localStorage.removeItem("ttm_access_token");
    localStorage.removeItem("ttm_user");
    set({ user: null, accessToken: null, isHydrated: true });
  }
}));
