/**
 * App.jsx – Root application with routing.
 * Routes are code-split for performance.
 * Protected routes redirect to /login if unauthenticated.
 */

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/ui/Navbar";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const LoginPage      = lazy(() => import("./pages/LoginPage"));
const RegisterPage   = lazy(() => import("./pages/RegisterPage"));
const DashboardPage  = lazy(() => import("./pages/DashboardPage"));
const GoalsPage      = lazy(() => import("./pages/GoalsPage"));
const GoalDetailPage = lazy(() => import("./pages/GoalDetailPage"));
const MentorPage     = lazy(() => import("./pages/MentorPage"));
const ProgressPage   = lazy(() => import("./pages/ProgressPage"));
const ProfilePage    = lazy(() => import("./pages/ProfilePage"));
const GoalWizard     = lazy(() => import("./components/goals/GoalWizard"));

// Full-screen loading spinner
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-dark-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        <p className="text-sm text-gray-400 font-body">Loading FocusOn...</p>
      </div>
    </div>
  );
}

// Layout wrapper for authenticated pages
function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-dark-900 bg-mesh-light dark:bg-mesh-dark">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// Guard: redirects unauthenticated users to /login
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Guard: redirects authenticated users away from auth pages
function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/goals"          element={<GoalsPage />} />
            <Route path="/goals/new"      element={<GoalWizard />} />
            <Route path="/goals/:id"      element={<GoalDetailPage />} />
            <Route path="/mentor"         element={<MentorPage />} />
            <Route path="/progress"       element={<ProgressPage />} />
            <Route path="/profile"        element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          {/* Toast notifications — theme-aware */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                borderRadius: "12px",
                padding: "12px 16px",
              },
              success: { iconTheme: { primary: "#6470f3", secondary: "#fff" } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
