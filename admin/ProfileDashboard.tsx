import { useAuth } from "@/hooks/use-auth";
import React from "react";
import { Text, View } from "react-native";
import { Icon } from "react-native-paper";
export default function ProfileDashboard() {
  const { logout, user, profile } = useAuth();
  return (
    <View className="flex-1 p-6">
      <View className="">
        <Text className="font-semi-bold text-lg">الحساب</Text>
      </View>
      <View className="mt-6">
        <View className="flex justify-center items-center">
          <Icon source={"account"} size={60} />
          <Text className="font-semi-bold text-2xl mt-6">
            {profile?.full_name}
          </Text>
          <Text className="font-semi-bold text-2xl">{user?.email}</Text>
        </View>
      </View>
    </View>
  );
}
