// app/(admin)/_layout.tsx
import { useAuth } from "@/hooks/use-auth";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

// Protected routes that require authentication
const PROTECTED_ROUTES = ["(admin)/(dashboard)"];

export default function AdminLayout() {
  const { loading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[1] === "(auth)";
      const inProtectedRoute = PROTECTED_ROUTES.some((route) =>
        segments.join("/").includes(route),
      );

      if (!isAuthenticated && inProtectedRoute) {
        // Redirect to login if trying to access protected route without auth
        router.replace("/(admin)/(auth)");
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to dashboard if authenticated and in auth group
        router.replace("/(admin)/(dashboard)");
      }
    }
  }, [segments, loading, isAuthenticated]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        {/* You can add your LoadingPage component here */}
        {/* <LoadingPage text="جار التحقق من صلاحياتك" /> */}
      </View>
    );
  }

  // Render the slot (child routes)
  return <Slot />;
}
