import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analyses", label: "Analyses" },
  { to: "/repositories", label: "Repositories" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <NavLink to="/dashboard" className="text-sm font-semibold tracking-tight text-white">
              PR Risk Detector
            </NavLink>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/analyze"
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              + Analyze PR
            </NavLink>
            {user && (
              <div className="relative group">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-label={`Account menu for ${user.username}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-900 transition-colors"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-7 w-7 rounded-full border border-zinc-700"
                  />
                  <span className="hidden sm:inline text-sm text-zinc-300">{user.username}</span>
                </button>
                <div className="absolute right-0 top-full hidden w-40 pt-1 group-hover:block group-focus-within:block">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 mt-1 text-left text-sm text-zinc-300 shadow-lg hover:bg-zinc-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
