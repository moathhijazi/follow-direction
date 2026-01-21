import { useAuth } from "@/hooks/use-auth";
import React from "react";
import { Text, View } from "react-native";
import { Button, Icon } from "react-native-paper";
export default function ProfileDashboard() {
  const { logout, user, profile } = useAuth();

  return (
    <View className="flex-1 p-6 flex justify-center items-center">
      <View className="mt-6">
        <View className="flex justify-center items-center">
          <Icon source={"account"} size={60} />
          <Text className="font-semi-bold text-2xl mt-6">
            {profile?.full_name}
          </Text>
          <Text className="font-semi-bold text-2xl">{user?.email}</Text>
        </View>
      </View>

      <Button className="mt-6" textColor="red" mode="text" onPress={logout}>
        تسجيل الخروج
      </Button>
    </View>
  );
}
