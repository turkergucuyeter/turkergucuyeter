import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";

export const useApi = () => {
  const { accessToken } = useAuth();

  const request = useCallback(
    async <T>(path: string, options: RequestInit = {}) => {
      return apiRequest<T>(path, options, accessToken ?? undefined);
    },
    [accessToken]
  );

  return { request };
};
