import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getMe, logout as logoutApi } from "./auth-api";
import type { User } from "./auth-types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser(): Promise<User | null> {
    try {
      const response = await getMe();
      setUser(response.user);

      return response.user;
    } catch {
      setUser(null);
      return null;
    }
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshUser().finally(() => {
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}