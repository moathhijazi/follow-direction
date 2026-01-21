import * as React from "react";
import { View } from "react-native";
import { ActivityIndicator, BottomNavigation } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "react-native";

import HomeDashboard from "@/admin/HomeDashboard";
import ProfileDashboard from "@/admin/ProfileDashboard";
import RequestsDashboard from "@/admin/RequestsDashboard";
import UsersDashboard from "@/admin/UsersDashboard";

import { useAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const { profile, loading } = useAuth();
  const [index, setIndex] = React.useState(0); // This MUST be unconditional

  // Show loading while checking auth
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600 font-reg">
          جاري تحميل البيانات...
        </Text>
      </View>
    );
  }

  // If no profile, show error or loading
  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>حدث خطأ في تحميل البيانات</Text>
      </View>
    );
  }

  // Determine user access level
  const userAccess = profile.access || "limit";

  // Define routes based on access level
  const routes = React.useMemo(() => {
    if (userAccess === "full") {
      return [
        {
          key: "dashboard",
          title: "الرئيسية",
          focusedIcon: "monitor-dashboard",
          unfocusedIcon: "monitor-dashboard",
        },
        { key: "requests", title: "الطلبات", focusedIcon: "car-arrow-left" },
        { key: "users", title: "المستخدمين", focusedIcon: "account-group" },
        { key: "profile", title: "الحساب", focusedIcon: "account" },
      ];
    } else {
      return [
        { key: "requests", title: "الطلبات", focusedIcon: "car-arrow-left" },
        { key: "profile", title: "الحساب", focusedIcon: "account" },
      ];
    }
  }, [userAccess]);

  // Define scene map based on access level
  const renderScene = React.useMemo(() => {
    const sceneMap: any = {
      requests: RequestsDashboard,
      profile: ProfileDashboard,
    };

    if (userAccess === "full") {
      sceneMap.dashboard = HomeDashboard;
      sceneMap.users = UsersDashboard;
    }

    return BottomNavigation.SceneMap(sceneMap);
  }, [userAccess]);

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        sceneAnimationType="shifting"
        activeColor="#2563eb"
        inactiveColor="#6b7280"
        activeIndicatorStyle={{ backgroundColor: "#2563eb" }}
        barStyle={{
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        }}
      />
    </SafeAreaView>
  );
};

export default Dashboard;
