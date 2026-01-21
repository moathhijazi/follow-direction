import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function HomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    adminUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    processingRequests: 0,
    completedRequests: 0,
  });

  const fetchStats = async () => {
    try {
      // Fetch all counts in parallel
      const [
        { count: adminCount },
        { count: totalCount },
        { count: pendingCount },
        { count: rejectedCount },
        { count: processingCount },
        { count: completedCount },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin"),
        supabase.from("requests").select("*", { count: "exact", head: true }),
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected"),
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "processing")
          .then((res) => res),

        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "done"),
      ]);

      setStats({
        adminUsers: adminCount || 0,
        totalRequests: totalCount || 0,
        pendingRequests: pendingCount || 0,
        rejectedRequests: rejectedCount || 0,
        processingRequests: processingCount || 0,
        completedRequests: completedCount || 0,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="font-reg mt-2">جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-xl font-semi-bold mb-6">لوحة التحكم</Text>

      <View className="flex-row flex-wrap justify-between">
        {/* Admin Users */}
        <View className="w-[100%] bg-blue-50 p-4 rounded-lg mb-4">
          <Text className="font-reg text-3xl font-bold text-blue-700">
            {stats.adminUsers}
          </Text>
          <Text className="font-reg text-blue-600 mt-1">المسؤولين</Text>
        </View>

        {/* Total Requests */}
        <View className="w-[100%] bg-green-50 p-4 rounded-lg mb-4">
          <Text className="font-reg text-3xl font-bold text-green-700">
            {stats.totalRequests}
          </Text>
          <Text className="font-reg text-green-600 mt-1">إجمالي الطلبات</Text>
        </View>

        {/* Pending */}
        <View className="w-[48%] bg-yellow-50 p-4 rounded-lg mb-4">
          <Text className="font-reg text-3xl font-bold text-yellow-700">
            {stats.pendingRequests}
          </Text>
          <Text className="font-reg text-yellow-600 mt-1">قيد الانتظار</Text>
        </View>

        {/* Rejected */}
        <View className="w-[48%] bg-red-50 p-4 rounded-lg mb-4">
          <Text className="font-reg text-3xl font-bold text-red-700">
            {stats.rejectedRequests}
          </Text>
          <Text className="font-reg text-red-600 mt-1">ملغية</Text>
        </View>

        {/* Processing */}
        <View className="w-[48%] bg-purple-50 p-4 rounded-lg mb-4">
          <Text className="font-reg text-3xl font-bold text-purple-700">
            {stats.processingRequests}
          </Text>
          <Text className="font-reg text-purple-600 mt-1">قيد المعالجة</Text>
        </View>

        {/* Completed */}
        <View className="w-[48%] bg-emerald-50 p-4 rounded-lg mb-4">
          <Text className="font-reg text-3xl font-bold text-emerald-700">
            {stats.completedRequests}
          </Text>
          <Text className="font-reg text-emerald-600 mt-1">مكتملة</Text>
        </View>
      </View>
    </ScrollView>
  );
}
