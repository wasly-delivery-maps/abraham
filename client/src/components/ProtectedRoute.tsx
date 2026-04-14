import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/NotFound";

interface ProtectedRouteProps {
  component: React.ComponentType;
  requiredRole?: "customer" | "driver" | "admin";
}

export default function ProtectedRoute({ component: Component, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const navigationAttemptedRef = useRef(false);

  useEffect(() => {
    // Skip if still loading
    if (loading) return;

    // Skip if already authenticated and on correct path
    if (isAuthenticated) {
      if (requiredRole && user?.role !== requiredRole) {
        // User is authenticated but doesn't have the required role
        // We'll let the component render and show NotFound or handle it
        return;
      }
      navigationAttemptedRef.current = false;
      return;
    }

    // Prevent multiple navigation attempts
    if (navigationAttemptedRef.current) return;

    // Navigate to auth if not authenticated
    if (!isAuthenticated && location !== "/auth") {
      // Add a small delay to ensure session is properly checked
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          navigationAttemptedRef.current = true;
          navigate("/auth");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, user?.role, requiredRole, location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has required role
  if (requiredRole && user?.role !== requiredRole) {
    return <NotFound />;
  }

  return <Component />;
}
