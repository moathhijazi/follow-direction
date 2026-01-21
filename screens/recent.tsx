import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ActivityIndicator, IconButton } from "react-native-paper";

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
            <Text className="text-gray-700">#</Text>
          </View>
          <View className="flex-1 border-r border-gray-300 p-2">
            <Text className="text-gray-700 text-right font-semi-bold">من</Text>
          </View>
          <View className="flex-1 border-r border-gray-300 p-2">
            <Text className="text-gray-700 text-right font-semi-bold">إلى</Text>
          </View>
          <View className="w-28 border-r border-gray-300 p-2">
            <Text className="text-gray-700 text-right font-semi-bold">
              الوقت
            </Text>
          </View>
          <View className="w-32 p-2">
            <Text className="font-semi-bold text-gray-700 text-right">
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
              <Text
                className="text-gray-800 text-right font-reg"
                numberOfLines={1}
              >
                {item.from}
              </Text>
            </View>
            <View className="flex-1 border-r border-gray-300 p-2">
              <Text
                className="text-gray-800 text-right font-reg"
                numberOfLines={1}
              >
                {item.to}
              </Text>
            </View>
            <View className="w-28 border-r border-gray-300 p-2">
              <Text className="text-gray-800 text-right font-reg">
                {item.time}
              </Text>
            </View>
            <View className="w-32 p-2">
              <Text className="text-gray-800 text-right font-reg">
                {item.number}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLoading = () => {
    return (
      <View className="flex-1 justify-center items-center m-6">
        <ActivityIndicator size="small" className="mb-4" />
        <Text className="text-lg text-gray-600 font-reg">جاري التحميل...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View className="flex-1 justify-center items-center m-6">
        <Text className="text-lg text-gray-600 font-reg">
          لا توجد طلبات سابقة لعرضها.
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      className="flex-1"
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
            <Text className="text-2xl font-semi-bold mb-1 text-right  text-gray-800">
              جدول الطلبات السابقة
            </Text>
            <Text className="text-gray-500 text-right font-reg">
              إجمالي الطلبات: {recents?.length || 0}
            </Text>
          </View>
        </View>

        {loading
          ? renderLoading()
          : recents.length > 0
            ? renderTable()
            : renderEmpty()}

        {/* Footer */}
        <View className="mt-6 items-center">
          <Text className="text-gray-500 text-sm mt-4 font-reg">
            اسحب للأسفل لتحديث الجدول
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
