import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

type Role = "supervisor" | "teacher" | "student";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface LoginResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_KEY = "attendance.accessToken";
const USER_KEY = "attendance.user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_KEY));

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(ACCESS_KEY, accessToken);
    } else {
      localStorage.removeItem(ACCESS_KEY);
    }
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(response.data.user);
    setAccessToken(response.data.accessToken);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
  };

  const value = useMemo(() => ({ user, accessToken, login, logout }), [user, accessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
