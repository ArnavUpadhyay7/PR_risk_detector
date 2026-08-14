import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AnalysesPage } from "./pages/AnalysesPage";
import { AnalysisDetailPage } from "./pages/AnalysisDetailPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { RepositoriesPage } from "./pages/RepositoriesPage";
import { ComparePage } from "./pages/ComparePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/analyses" element={<AnalysesPage />} />
              <Route path="/analyses/compare/:id1/:id2" element={<ComparePage />} />
              <Route path="/analyses/:id" element={<AnalysisDetailPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/repositories" element={<RepositoriesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
