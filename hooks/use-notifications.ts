// hooks/use-push-notification.ts
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

export default function usePushNotification() {
  const { session, profile, loading: authLoading } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [notificationReady, setNotificationReady] = useState(false);

  // Refs to track initialization
  const initializationAttempted = useRef(false);
  const sessionCheckInterval = useRef<any>(null);

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === "expo";

  // Save token to user's profile
  const saveTokenToProfile = useCallback(
    async (token: string) => {
      if (!session?.user?.id) {
        console.log("No user session available, cannot save token");
        return false;
      }

      setSavingToken(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            expo_push_token: token,
            notification_enabled: true,
          })
          .eq("id", session.user.id);

        if (error) {
          console.error("Error saving push token to profile:", error);
          return false;
        }

        console.log("✅ Push token saved to user profile");
        return true;
      } catch (error) {
        console.error("Exception saving push token:", error);
        return false;
      } finally {
        setSavingToken(false);
      }
    },
    [session?.user?.id],
  );

  // Check if token exists in profile
  const checkExistingToken = useCallback(async () => {
    if (!session?.user?.id) {
      console.log("No user session, skipping token check");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("expo_push_token, notification_enabled")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user token:", error);
        return;
      }

      if (data?.expo_push_token && data.notification_enabled) {
        setExpoPushToken(data.expo_push_token);
        setNotificationReady(true);
        console.log(
          "📱 Found existing token in profile:",
          data.expo_push_token,
        );
      } else {
        setNotificationReady(true);
      }
    } catch (error) {
      console.error("Error checking existing token:", error);
      setNotificationReady(true);
    }
  }, [session?.user?.id]);

  // Initialize notification system when session is ready
  const initializeNotifications = useCallback(async () => {
    // Prevent multiple initialization attempts
    if (initializationAttempted.current) {
      return;
    }

    initializationAttempted.current = true;

    // Clear any existing interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }

    // If auth is still loading, wait for it
    if (authLoading) {
      console.log("⏳ Auth is loading, waiting...");
      return;
    }

    // If no session, setup listeners but don't check token
    if (!session?.user?.id) {
      console.log("👤 No user session, notification system in guest mode");
      setNotificationReady(true);
      return;
    }

    console.log("🔑 User session found, initializing notifications...");

    // Check for existing token
    await checkExistingToken();

    // Setup notification listeners
    setupNotificationListeners();
  }, [session?.user?.id, authLoading, checkExistingToken]);

  // Get all user tokens from database
  const getAllUserTokens = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("expo_push_token, notification_enabled, full_name")
        .eq("notification_enabled", true);

      if (error) {
        console.error("Error fetching user tokens:", error);
        return [];
      }

      const tokens = data
        .map((user) => user.expo_push_token)
        .filter(Boolean) as string[];

      console.log(`📊 Found ${tokens.length} users with push tokens enabled`);
      return tokens;
    } catch (error) {
      console.error("Error getting all user tokens:", error);
      return [];
    }
  }, []);

  // Register for push notifications (works in Expo Go)
  const registerForPushNotificationsAsync = useCallback(async () => {
    try {
      // Wait for notification system to be ready
      if (!notificationReady) {
        await new Promise((resolve) => {
          const checkReady = setInterval(() => {
            if (notificationReady) {
              clearInterval(checkReady);
              resolve(true);
            }
          }, 100);
        });
      }

      // Check if user is logged in
      if (!session?.user?.id) {
        return {
          success: false,
          message: "يجب تسجيل الدخول أولاً",
        };
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return {
          success: false,
          message: "تم رفض الإشعارات",
        };
      }

      setPermissionGranted(true);

      // Get push token
      let token;
      if (isExpoGo) {
        // For Expo Go
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          })
        ).data;
      } else {
        // For development builds
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }

      setExpoPushToken(token);

      // Save token to user's profile
      const saved = await saveTokenToProfile(token);
      if (saved) {
        return {
          success: true,
          message: "تم حفظ رمز الإشعارات بنجاح",
        };
      } else {
        return {
          success: false,
          message: "حدث خطأ أثناء حفظ رمز الإشعارات",
        };
      }
    } catch (error) {
      console.error("Error getting push token:", error);
      return {
        success: false,
        message: "فشل في الحصول على رمز الإشعارات",
      };
    }
  }, [notificationReady, session?.user?.id, isExpoGo, saveTokenToProfile]);

  // Setup notification listeners
  const setupNotificationListeners = useCallback(() => {
    // Listen for notifications
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📨 Notification received:", notification);
        setNotification(notification);
      },
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);

        // Handle notification navigation
        const data = response.notification.request.content.data;
        if (data?.screen) {
          // Navigate to screen using your navigation system
          console.log("Should navigate to:", data.screen);
        }
      });

    // Check initial permission
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionGranted(status === "granted");
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Send notification to single token
  const sendPushNotification = useCallback(
    async (token: string, payload: NotificationPayload) => {
      try {
        const message = {
          to: token,
          sound: payload.sound || "default",
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge || 1,
        };

        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error sending push notification:", error);
        throw error;
      }
    },
    [],
  );

  // Send test notification to current user
  const sendTestNotification = useCallback(async () => {
    // Wait for notification system to be ready
    if (!notificationReady) {
      Alert.alert("جاري التحميل", "الرجاء الانتظار حتى يكتمل تحميل النظام");
      return;
    }

    if (!expoPushToken) {
      Alert.alert("رمز غير متوفر", "الرجاء تفعيل الإشعارات أولاً");
      return;
    }

    try {
      const result = await sendPushNotification(expoPushToken, {
        title: "اختبار الإشعارات 🎉",
        body: "هذا إشعار تجريبي من التطبيق!",
        data: {
          screen: "Home",
          test: true,
          timestamp: new Date().toISOString(),
          userId: session?.user?.id,
        },
      });

      if (result.data?.status === "ok") {
        Alert.alert(
          "تم الإرسال",
          "تم إرسال الإشعار التجريبي! تحقق من الإشعارات خلال 5-10 ثواني.",
          [{ text: "حسناً" }],
        );
      } else {
        Alert.alert("خطأ", `فشل الإرسال: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert("خطأ", "فشل إرسال الإشعار. تحقق من الكونسول.");
    }
  }, [
    notificationReady,
    expoPushToken,
    session?.user?.id,
    sendPushNotification,
  ]);

  // Send notification to all users
  const sendNotificationToAllUsers = useCallback(
    async (
      payload: NotificationPayload,
      options?: {
        batchSize?: number;
        delayBetweenBatches?: number;
        onProgress?: (sent: number, total: number) => void;
      },
    ) => {
      try {
        // Get all user tokens
        const tokens = await getAllUserTokens();
        console.log("no users to send");

        const batchSize = options?.batchSize || 100;
        const delayBetweenBatches = options?.delayBetweenBatches || 1000;
        const totalUsers = tokens.length;
        let sentCount = 0;
        const results = [];

        // Send in batches to avoid rate limits
        for (let i = 0; i < tokens.length; i += batchSize) {
          const batch = tokens.slice(i, i + batchSize);

          try {
            const message = {
              to: batch,
              sound: payload.sound || "default",
              title: payload.title,
              body: payload.body,
              data: {
                ...payload.data,
                sentAt: new Date().toISOString(),
                senderId: session?.user?.id,
                senderName: profile?.full_name,
              },
              badge: payload.badge || 1,
            };

            const response = await fetch(
              "https://exp.host/--/api/v2/push/send",
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
              },
            );

            const result = await response.json();
            results.push(result);

            sentCount += batch.length;
            options?.onProgress?.(sentCount, totalUsers);

            console.log(
              `✅ Sent batch ${i / batchSize + 1}: ${batch.length} users`,
            );

            // Delay between batches
            if (i + batchSize < tokens.length) {
              await new Promise((resolve) =>
                setTimeout(resolve, delayBetweenBatches),
              );
            }
          } catch (batchError) {
            console.error(
              `Error sending batch ${i / batchSize + 1}:`,
              batchError,
            );
          }
        }

        // Log the broadcast in database
        if (session?.user?.id) {
          await supabase.from("notification_broadcasts").insert({
            sender_id: session.user.id,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            recipients_count: totalUsers,
            sent_at: new Date().toISOString(),
          });
        }

        console.log("notification sent");

        return {
          sent: sentCount,
          total: totalUsers,
          results,
          success: sentCount > 0,
        };
      } catch (error: any) {
        console.error("Error sending to all users:", error);
        throw error;
      }
    },
    [notificationReady, session?.user?.id, profile, getAllUserTokens],
  );

  // Quick test - send to all users
  const sendTestToAllUsers = useCallback(async () => {
    if (!notificationReady) {
      Alert.alert("جاري التحميل", "الرجاء الانتظار حتى يكتمل تحميل النظام");
      return;
    }

    const isAdminFullAccess = profile?.access === "full";
    if (!isAdminFullAccess) {
      Alert.alert(
        "غير مصرح",
        "فقط المشرفون لديهم صلاحية إرسال الإشعارات للجميع",
      );
      return;
    }

    Alert.alert(
      "إرسال تجريبي للجميع؟",
      "هذا سيرسل إشعار تجريبي لجميع المستخدمين الذين مفعلين الإشعارات.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إرسال تجريبي",
          onPress: async () => {
            await sendNotificationToAllUsers({
              title: "📢 إعلان",
              body: "هذا إشعار تجريبي مرسل لجميع المستخدمين!",
              data: {
                screen: "Announcements",
                type: "announcement",
                test: true,
              },
            });
          },
        },
      ],
    );
  }, [notificationReady, profile?.access, sendNotificationToAllUsers]);

  // Send custom notification to all users (for admin UI)
  const sendCustomNotification = useCallback(
    async (title: string, body: string, data?: any) => {
      if (!notificationReady) {
        throw new Error("نظام الإشعارات غير جاهز");
      }
      return sendNotificationToAllUsers({
        title,
        body,
        data,
        sound: "default",
      });
    },
    [notificationReady, sendNotificationToAllUsers],
  );

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    if (!notificationReady || !session?.user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_enabled: false,
          expo_push_token: null,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setExpoPushToken(null);
      setPermissionGranted(false);
      return {
        success: true,
      };
    } catch (error) {
      console.error("Error disabling notifications:", error);
      return {
        success: false,
        message: "حدث خطأ أثناء تعطيل الإشعارات",
      };
    }
  }, [notificationReady, session?.user?.id]);

  // Quick send - auto registers if needed
  const quickTest = useCallback(async () => {
    if (!notificationReady) {
      Alert.alert("جاري التحميل", "الرجاء الانتظار حتى يكتمل تحميل النظام");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("تسجيل الدخول مطلوب", "الرجاء تسجيل الدخول أولاً");
      return;
    }

    if (!expoPushToken) {
      Alert.alert("تفعيل الإشعارات", "يجب تفعيل الإشعارات أولاً:", [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تفعيل وإرسال تجريبي",
          onPress: async () => {
            const token = await registerForPushNotificationsAsync();
            if (token?.success) {
              setTimeout(() => sendTestNotification(), 1000);
            }
          },
        },
      ]);
    } else {
      await sendTestNotification();
    }
  }, [
    notificationReady,
    expoPushToken,
    session?.user?.id,
    registerForPushNotificationsAsync,
    sendTestNotification,
  ]);

  // Initialize on mount and when session changes
  useEffect(() => {
    // Reset initialization flag when session changes
    initializationAttempted.current = false;

    // Start initialization
    const initTimeout = setTimeout(() => {
      initializeNotifications();
    }, 500); // Small delay to ensure auth is processed

    return () => {
      clearTimeout(initTimeout);
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [session?.user?.id, authLoading, initializeNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    permissionGranted,
    savingToken,
    notificationReady,
    registerForPushNotificationsAsync,
    sendTestNotification,
    sendNotificationToAllUsers,
    sendTestToAllUsers,
    sendCustomNotification,
    sendPushNotification,
    disableNotifications,
    quickTest,
    hasTokenInProfile: !!expoPushToken,
    isAdminFullAccess: profile?.access === "full",
    isLoading: !notificationReady || authLoading,
  };
}
