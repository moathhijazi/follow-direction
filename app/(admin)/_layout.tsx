// app/(admin)/_layout.tsx
import { useAuth } from "@/hooks/use-auth";
import usePushNotification from "@/hooks/use-notifications";
import { useSnackbar } from "@/providers/snackbar-provider";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const PROTECTED_ROUTES = ["(admin)/(dashboard)"];

export default function AdminLayout() {
  const { loading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { registerForPushNotificationsAsync } = usePushNotification();
  const { showSnackbar } = useSnackbar();

  const [notificationRegistered, setNotificationRegistered] = useState(false);
  const registrationInProgress = useRef(false);

  useEffect(() => {
    if (loading) return;

    const path = segments.join("/");
    const inAuthGroup = segments[1] === "(auth)";
    const inProtectedRoute = PROTECTED_ROUTES.some((route) =>
      path.includes(route),
    );

    // Handle authentication redirection
    if (!isAuthenticated && inProtectedRoute) {
      router.replace("/(admin)/(auth)");
      return;
    }

    // Handle successful login (from auth to dashboard)
    if (isAuthenticated && inAuthGroup && !notificationRegistered) {
      // Prevent multiple registration attempts
      if (registrationInProgress.current) return;

      registrationInProgress.current = true;

      const registerNotifications = async () => {
        try {
          const res = await registerForPushNotificationsAsync();

          if (res?.success !== true) {
            showSnackbar(
              res?.message || "حدث خطأ أثناء تسجيل الاشتراك في الإشعارات",
            );
            // Still navigate to dashboard even if notifications fail
            router.replace("/(admin)/(dashboard)");
          } else {
            setNotificationRegistered(true);
            router.replace("/(admin)/(dashboard)");
          }
        } catch (error) {
          console.error("Error in notification registration:", error);
          // Navigate to dashboard even if there's an error
          router.replace("/(admin)/(dashboard)");
        } finally {
          registrationInProgress.current = false;
        }
      };

      registerNotifications();
    }
  }, [segments, loading, isAuthenticated, notificationRegistered]);

  // Reset notification registration when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setNotificationRegistered(false);
      registrationInProgress.current = false;
    }
  }, [isAuthenticated]);

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
