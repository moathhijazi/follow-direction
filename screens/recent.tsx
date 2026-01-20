import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ActivityIndicator, Button, IconButton } from "react-native-paper";

export default function RecentScreen() {
  const [recents, setRecents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getRecents = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);

      const parsedItems = items
        .map(([key, value]) => {
          try {
            return JSON.parse(value || "{}");
          } catch {
            return null;
          }
        })
        .filter(
          (item) => item && item.from && item.to && item.time && item.number,
        );

      setRecents(parsedItems);
    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getRecents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getRecents();
  };

  const renderTable = () => {
    return (
      <View className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Table Header */}
        <View className="flex-row bg-gray-100 border-b border-gray-300">
          <View className="w-12 border-r border-gray-300 p-2 items-center justify-center">
            <Text className="font-bold text-gray-700">#</Text>
          </View>
          <View className="flex-1 border-r border-gray-300 p-2">
            <Text className="font-bold text-gray-700 text-right">من</Text>
          </View>
          <View className="flex-1 border-r border-gray-300 p-2">
            <Text className="font-bold text-gray-700 text-right">إلى</Text>
          </View>
          <View className="w-28 border-r border-gray-300 p-2">
            <Text className="font-bold text-gray-700 text-right">الوقت</Text>
          </View>
          <View className="w-32 p-2">
            <Text className="font-bold text-gray-700 text-right">
              رقم الهاتف
            </Text>
          </View>
        </View>

        {/* Table Rows */}
        {recents.map((item, index) => (
          <View
            key={index}
            className={`flex-row border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
          >
            <View className="w-12 border-r border-gray-300 p-2 items-center justify-center">
              <Text className="text-gray-600">{index + 1}</Text>
            </View>
            <View className="flex-1 border-r border-gray-300 p-2">
              <Text className="text-gray-800 text-right" numberOfLines={1}>
                {item.from}
              </Text>
            </View>
            <View className="flex-1 border-r border-gray-300 p-2">
              <Text className="text-gray-800 text-right" numberOfLines={1}>
                {item.to}
              </Text>
            </View>
            <View className="w-28 border-r border-gray-300 p-2">
              <Text className="text-gray-800 text-right">{item.time}</Text>
            </View>
            <View className="w-32 p-2">
              <Text className="text-gray-800 text-right">{item.number}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" className="mb-4" />
        <Text className="text-lg text-gray-600">جاري التحميل...</Text>
      </View>
    );
  }

  // Empty state
  if (recents.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-8">
        <View className="border-2 border-gray-300 border-dashed rounded-lg p-12 items-center">
          <Text className="text-4xl mb-4">📋</Text>
          <Text className="text-2xl font-bold mb-2 text-gray-700 text-center">
            لا توجد طلبات
          </Text>
          <Text className="text-gray-500 text-center mb-6">
            الجدول فارغ، قم بإضافة طلبات جديدة
          </Text>
          <Button
            mode="outlined"
            onPress={getRecents}
            className="rounded-lg px-6 border-gray-400"
            icon="refresh"
          >
            تحديث الجدول
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6 flex flex-row justify-between">
          <IconButton
            icon={"account"}
            onPress={() => router.push("/(admin)/(dashboard)")}
          />
          <View>
            <Text className="text-2xl font-bold mb-1 text-right text-gray-800">
              جدول الطلبات السابقة
            </Text>
            <Text className="text-gray-500 text-right">
              إجمالي الطلبات: {recents.length}
            </Text>
          </View>
        </View>

        {/* Table */}
        {renderTable()}

        {/* Footer */}
        <View className="mt-6 items-center">
          <Text className="text-gray-500 text-sm mt-4">
            اسحب للأسفل لتحديث الجدول
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
