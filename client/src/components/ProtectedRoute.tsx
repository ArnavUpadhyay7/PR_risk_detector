import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded bg-zinc-900" />
          <div className="h-32 rounded-xl bg-zinc-900" />
          <div className="h-32 rounded-xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
