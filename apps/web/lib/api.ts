"use client";

import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL && process.env.NODE_ENV === "production") {
  console.warn("NEXT_PUBLIC_API_URL is not defined. API calls may fail if not served from the same domain.");
}

const finalBaseURL = baseURL || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "/api");


export const api = axios.create({
  baseURL: finalBaseURL,
  withCredentials: true
});


let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      refreshPromise =
        refreshPromise ??
        api
          .post("/auth/refresh")
          .then((response) => {
            useAuthStore.getState().setSession(response.data.user, response.data.accessToken);
            return response.data.accessToken as string;
          })
          .catch(() => {
            useAuthStore.getState().clearSession();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });

      const token = await refreshPromise;

      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
