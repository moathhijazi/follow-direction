// app/(admin)/_layout.tsx
import { useAuth } from "@/hooks/use-auth";
import { useSnackbar } from "@/providers/snackbar-provider";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

const PROTECTED_ROUTES = ["(dashboard)"]; // Remove (admin) prefix since we're already in admin context

export default function AdminLayout() {
  const { loading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const lastAuthCheck = useRef<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    // Prevent infinite redirects - only run if auth state changed
    if (lastAuthCheck.current === isAuthenticated) return;
    lastAuthCheck.current = isAuthenticated;

    const path = segments.join("/");
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
      path.includes(route),
    );

    // Handle redirection based on authentication
    if (!isAuthenticated) {
      // User is not authenticated, redirect to auth
      if (!path.includes("(auth)")) {
        router.replace("/(admin)/(auth)");
      }
    } else {
      // User is authenticated, redirect to dashboard if on auth page
      if (path.includes("(auth)")) {
        router.replace("/(admin)/(dashboard)");
      }
    }
  }, [segments, loading, isAuthenticated, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Render the slot (child routes)
  return <Slot />;
}
