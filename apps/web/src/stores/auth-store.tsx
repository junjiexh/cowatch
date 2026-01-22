"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  postAuthLogin,
  postAuthRegister,
  postAuthLogout,
  getAuthMe,
  type User,
  type AuthResponse,
  type Error as ApiError,
} from "@/client";
import { client } from "@/client/client.gen";

const TOKEN_KEY = "auth_token";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

// Global logout handler for 401 interceptor
let globalLogoutHandler: (() => void) | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const interceptorRegistered = useRef(false);

  // Configure client auth on token change
  useEffect(() => {
    if (token) {
      client.setConfig({
        auth: () => token,
      });
    } else {
      // Clear auth when token is null
      client.setConfig({
        auth: undefined,
      });
    }
  }, [token]);

  // Register 401 error interceptor - redirects to login on auth failure
  useEffect(() => {
    if (interceptorRegistered.current) return;
    interceptorRegistered.current = true;

    client.interceptors.error.use((error, response, request, options) => {
      // If 401 Unauthorized, clear auth and redirect to login
      if (response && response.status === 401) {
        if (globalLogoutHandler) {
          globalLogoutHandler();
        }
      }
      return error;
    });
  }, []);

  // Set global logout handler
  useEffect(() => {
    globalLogoutHandler = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      router.push("/login");
    };
    return () => {
      globalLogoutHandler = null;
    };
  }, [router]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        client.setConfig({
          auth: () => storedToken,
        });

        // Verify token by fetching current user
        const { data, error } = await getAuthMe();
        if (data && !error) {
          setUser(data);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const { data, error } = await postAuthLogin({
        body: { username, password },
      });

      if (error) {
        const apiError = error as ApiError;
        return { success: false, error: apiError.message || "登录失败" };
      }

      if (data) {
        const authResponse = data as AuthResponse;
        setUser(authResponse.user);
        setToken(authResponse.token);
        localStorage.setItem(TOKEN_KEY, authResponse.token);
        return { success: true };
      }

      return { success: false, error: "未知错误" };
    },
    []
  );

  const register = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const { data, error } = await postAuthRegister({
        body: { username, password },
      });

      if (error) {
        const apiError = error as ApiError;
        return { success: false, error: apiError.message || "注册失败" };
      }

      if (data) {
        const authResponse = data as AuthResponse;
        setUser(authResponse.user);
        setToken(authResponse.token);
        localStorage.setItem(TOKEN_KEY, authResponse.token);
        return { success: true };
      }

      return { success: false, error: "未知错误" };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await postAuthLogout();
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    client.setConfig({
      auth: undefined,
    });
    router.push("/");
  }, [router]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    const { data, error } = await getAuthMe();
    if (data && !error) {
      setUser(data);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
