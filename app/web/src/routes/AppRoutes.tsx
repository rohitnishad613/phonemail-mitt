import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "../features/auth/AuthContext";
import { AuthPage } from "../features/auth/AuthPage";
import { UserHome } from "../features/users/UserHome";

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading...
      </p>
    </main>
  );
}

function ProtectedLoginRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <UserHome />;
}

function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/" replace />;
}

function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
}

export function AppRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<PublicRoute />} />

        <Route path="/" element={<ProtectedLoginRoute />} />

        <Route path="*" element={<ProtectedRoute />} />
      </Routes>
    </div>
  );
}
