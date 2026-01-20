import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useSnackbar } from "@/providers/snackbar-provider";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  DataTable,
  IconButton,
} from "react-native-paper";

import CreateAccountContent from "@/content/create-account";
import { useModal } from "@/providers/modal-provider";

export default function UsersDashboard() {
  const { showSnackbar } = useSnackbar();
  const { profile, session, loading: authLoading } = useAuth(); // Destructure properly
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { open } = useModal();
  const isAdminFullAccess = profile?.access === "full";

  const showModal = () => {
    open(<CreateAccountContent />);
  };

  const fetchAdmins = useCallback(async () => {
    try {
      // Don't fetch if session is not available yet
      if (!session?.user?.id) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin") // ADD THIS: Filter by admin role
        .not("id", "eq", session.user.id);

      if (error) {
        showSnackbar("حدث خطأ في تحميل المسؤولين");
        console.log(error);
        return;
      }
      setAdmins(data || []);
    } catch (error) {
      showSnackbar("حدث خطأ غير متوقع");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id, showSnackbar]);

  useEffect(() => {
    // Only fetch if auth loading is complete and session exists
    if (!authLoading && session) {
      fetchAdmins();
    }
  }, [authLoading, session, fetchAdmins]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdmins();
  }, [fetchAdmins]);

  const handleDeleteAdmin = async (id: string) => {
    if (!isAdminFullAccess) {
      showSnackbar("غير مصرح لك بهذا الإجراء");
      return;
    }

    // Prevent deleting yourself
    if (id === profile?.id) {
      showSnackbar("لا يمكنك حذف حسابك الخاص");
      return;
    }

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);

      if (error) {
        showSnackbar("حدث خطأ في حذف المسؤول");
        return;
      }

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      showSnackbar("تم حذف المسؤول بنجاح");
    } catch (error) {
      showSnackbar("حدث خطأ غير متوقع");
    }
  };

  const handleToggleAccess = async (admin: any) => {
    if (!isAdminFullAccess) {
      showSnackbar("غير مصرح لك بهذا الإجراء");
      return;
    }

    try {
      const newAccess = admin.access === "full" ? "limit" : "full";

      const { error } = await supabase
        .from("profiles")
        .update({ access: newAccess })
        .eq("id", admin.id);

      if (error) {
        showSnackbar("حدث خطأ في تحديث الصلاحيات");
        return;
      }

      // Update local state
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, access: newAccess } : a)),
      );

      showSnackbar(`تم ${newAccess === "full" ? "منح" : "تقييد"} الصلاحيات`);
    } catch (error) {
      showSnackbar("حدث خطأ غير متوقع");
    }
  };

  const getAccessColor = (access: string) => {
    return access === "full" ? "#10b981" : "#f59e0b";
  };

  const getAccessText = (access: string) => {
    return access === "full" ? "صلاحية كاملة" : "صلاحية محدودة";
  };

  // Show loading only when auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="p-4 flex-1">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semi-bold">المسؤولين</Text>
            {isAdminFullAccess && (
              <Button mode="contained" onPress={showModal} icon="account-plus">
                إضافة مسؤول
              </Button>
            )}
          </View>

          {admins.length === 0 ? (
            <Text className="text-gray-500 text-center py-8 font-reg">
              لا يوجد مسؤولين
            </Text>
          ) : (
            <View className="flex-1">
              {/* Full width table container */}
              <View style={{ width: "100%", marginLeft: -4 }}>
                <DataTable style={{ width: "100%" }}>
                  <DataTable.Header style={{ width: "100%" }}>
                    <DataTable.Title style={{ flex: 2 }}>الاسم</DataTable.Title>
                    <DataTable.Title style={{ flex: 2 }}>
                      البريد الإلكتروني
                    </DataTable.Title>
                    <DataTable.Title style={{ flex: 1 }}>
                      الصلاحية
                    </DataTable.Title>
                    {isAdminFullAccess && (
                      <DataTable.Title style={{ flex: 1 }}>
                        إجراءات
                      </DataTable.Title>
                    )}
                  </DataTable.Header>

                  {admins.map((admin) => (
                    <DataTable.Row key={admin.id} style={{ width: "100%" }}>
                      <DataTable.Cell style={{ flex: 2 }}>
                        <Text numberOfLines={1} className="font-medium">
                          {admin.full_name || "بدون اسم"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={{ flex: 2 }}>
                        <Text
                          numberOfLines={1}
                          className="text-gray-600 text-sm"
                        >
                          {admin.email}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={{ flex: 1 }}>
                        <View className="flex-row items-center">
                          <View
                            className="w-2 h-2 rounded-full mr-2"
                            style={{
                              backgroundColor: getAccessColor(admin.access),
                            }}
                          />
                          <Text
                            className="text-xs"
                            style={{ color: getAccessColor(admin.access) }}
                          >
                            {getAccessText(admin.access)}
                          </Text>
                        </View>
                      </DataTable.Cell>
                      {isAdminFullAccess && (
                        <DataTable.Cell style={{ flex: 1 }}>
                          <View className="flex-row">
                            <IconButton
                              size={18}
                              icon={
                                admin.access === "full" ? "lock" : "lock-open"
                              }
                              iconColor={
                                admin.access === "full" ? "#f59e0b" : "#10b981"
                              }
                              onPress={() => handleToggleAccess(admin)}
                              disabled={admin.id === profile?.id}
                            />
                            <IconButton
                              size={18}
                              icon="delete"
                              iconColor="red"
                              onPress={() => handleDeleteAdmin(admin.id)}
                              disabled={admin.id === profile?.id}
                            />
                          </View>
                        </DataTable.Cell>
                      )}
                    </DataTable.Row>
                  ))}
                </DataTable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
