// hooks/use-push-notification.ts
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import { useAuth } from "./use-auth";

// Configure notification handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function usePushNotification() {
  const { user, loading } = useAuth();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Configure notification channels for Android
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  // Setup notification listeners
  useEffect(() => {
    // Listen for incoming notifications while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📨 Notification received in foreground:", notification);
        // Handle foreground notifications here
      });

    // Listen for notification responses (user taps on notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
        handleNotificationResponse(response);
      });

    // Handle notifications when app is launched from closed state
    const handleLaunchFromNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        console.log("App launched from notification:", response);
        // Small delay to ensure app is ready
        setTimeout(() => {
          handleNotificationResponse(response);
        }, 500);
      }
    };

    handleLaunchFromNotification();

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Handle notification response (tapping on notification)
  const handleNotificationResponse = useCallback((response: any) => {
    const data = response.notification.request.content.data;

    // Show alert for test notifications
    if (data?.type === "test") {
      Alert.alert("Test Notification", "You tapped a test notification!");
    }
  }, []);

  // Auto-register token when user logs in
  useEffect(() => {
    if (user && !loading) {
      registerToken();
    }
  }, [user, loading]);

  // Register for push notifications
  const registerToken = useCallback(async () => {
    try {
      // Request permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notifications permission denied");
        return null;
      }

      console.log("Notification permission granted");

      // Get push token
      const token =
        Constants.appOwnership === "expo"
          ? (
              await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
              })
            ).data
          : (await Notifications.getExpoPushTokenAsync()).data;

      console.log("Expo push token:", token);

      // Save token to user's profile
      const { error } = await supabase
        .from("profiles")
        .update({
          expo_push_token: token,
          notification_enabled: true,
        })
        .eq("id", user?.id);

      if (error) {
        console.error("Error saving push token:", error);
        return null;
      }

      console.log("Push token saved to profile");
      return token;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }, [user]);

  // Send notification to all users
  const sendToAllUsers = useCallback(
    async (title: string, body: string, data?: any) => {
      try {
        // Get all users with push tokens
        const { data: users, error } = await supabase
          .from("profiles")
          .select("expo_push_token")
          .eq("notification_enabled", true)
          .not("expo_push_token", "is", null);

        if (error) throw error;

        const tokens = users
          .map((user) => user.expo_push_token)
          .filter(Boolean) as string[];

        if (tokens.length === 0) {
          Alert.alert("لا يوجد مستخدمين مفعلين للإشعارات");
          return { sent: 0, total: 0 };
        }

        // Create notification content
        const notificationContent = {
          to: tokens,
          sound: "default",
          title,
          body,
          data: {
            ...data,
            sentAt: new Date().toISOString(),
            senderId: user?.id,
          },
          // Important: These ensure notifications work in background
          priority: "high",
          _displayInForeground: true,
          channelId: Platform.OS === "android" ? "default" : undefined,
        };

        console.log("Sending to tokens:", tokens.length);

        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notificationContent),
        });

        const result = await response.json();
        console.log("Push notification result:", result);

        // Log the notification in database
        if (user?.id) {
          await supabase.from("notification_broadcasts").insert({
            sender_id: user.id,
            title,
            body,
            data,
            recipients_count: tokens.length,
            sent_at: new Date().toISOString(),
          });
        }

        Alert.alert(`تم الإرسال إلى ${tokens.length} مستخدم`);
        return { sent: tokens.length, total: tokens.length, result };
      } catch (error) {
        console.error("Error sending to all users:", error);
        Alert.alert("حدث خطأ أثناء الإرسال");
        throw error;
      }
    },
    [user],
  );

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const token = await registerToken();
      if (!token) {
        Alert.alert("فشل الحصول على رمز الإشعارات");
        return;
      }

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token,
          sound: "default",
          title: "📱 اختبار الإشعارات",
          body: "هذا إشعار تجريبي!",
          data: {
            screen: "Home",
            type: "test",
            timestamp: new Date().toISOString(),
          },
          priority: "high",
          _displayInForeground: true,
          channelId: Platform.OS === "android" ? "default" : undefined,
        }),
      });

      const result = await response.json();
      console.log("Test notification result:", result);

      if (result.data) {
        Alert.alert(
          "تم الإرسال",
          "تم إرسال الإشعار التجريبي! تحقق من الإشعارات.",
        );
      } else {
        Alert.alert("خطأ", JSON.stringify(result));
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("خطأ", "فشل إرسال الإشعار التجريبي");
    }
  }, [registerToken]);

  return {
    registerToken,
    sendToAllUsers,
    sendTestNotification,
  };
}
