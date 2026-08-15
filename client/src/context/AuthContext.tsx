import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, captureSessionFromHash, clearSessionToken, type User } from "../services/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { user: currentUser } = await api.getMe();
    setUser(currentUser);
  }

  async function logout() {
    await api.logout();
    clearSessionToken();
    setUser(null);
  }

  useEffect(() => {
    captureSessionFromHash();
    refresh()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
