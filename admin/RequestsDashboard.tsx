import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useSnackbar } from "@/providers/snackbar-provider";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { ActivityIndicator, DataTable, IconButton } from "react-native-paper";

import RequestDetailsContent from "@/content/request-details";
import { useModal } from "@/providers/modal-provider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RequestsDashboard() {
  const { showSnackbar } = useSnackbar();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { open, close } = useModal();
  const isAdminFullAccess = profile?.access === "full";

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      showSnackbar("حدث خطأ");
      return;
    }
    setRequests(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("requests").delete().eq("id", id);

    if (error) {
      showSnackbar("حدث خطأ");
      return;
    }

    setRequests((prev) => prev.filter((req) => req.id !== id));
    showSnackbar("تم الحذف");
  };

  const handleOpenModal = (request: any) => {
    open(
      <SafeAreaView>
        <IconButton icon="close" size={24} onPress={() => close()} />
        <RequestDetailsContent
          from={request.from}
          to={request.to}
          time={request.time}
          phone={request.phone}
          isFull={isAdminFullAccess}
          status={request.status}
          onDelete={() => handleDelete(request.id)}
        />
      </SafeAreaView>,
    );
  };

  if (loading) {
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
          <Text className="text-xl font-semi-bold mb-4">الطلبات</Text>

          {requests.length === 0 ? (
            <Text className="text-gray-500 text-center py-8 font-reg">
              لا توجد طلبات
            </Text>
          ) : (
            <View className="flex-1">
              {/* Full width table container */}
              <View style={{ width: "100%", marginLeft: -4 }}>
                <DataTable style={{ width: "100%" }}>
                  <DataTable.Header style={{ width: "100%" }}>
                    <DataTable.Title style={{ flex: 2 }}>من</DataTable.Title>
                    <DataTable.Title style={{ flex: 2 }}>الوقت</DataTable.Title>

                    <DataTable.Title style={{ flex: 1 }}>
                      الحالة
                    </DataTable.Title>
                    <DataTable.Title style={{ flex: 0.5 }}>
                      مشاهدة
                    </DataTable.Title>
                  </DataTable.Header>

                  {requests.map((request) => (
                    <DataTable.Row key={request.id} style={{ width: "100%" }}>
                      <DataTable.Cell style={{ flex: 2 }}>
                        <Text numberOfLines={1}>{request.from}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={{ flex: 2 }}>
                        <Text>{request.time}</Text>
                      </DataTable.Cell>

                      <DataTable.Cell
                        style={{ flex: 2, justifyContent: "center" }}
                      >
                        {request.status === "pending" ? (
                          <Text className="text-yellow-500 text-xs border-yellow-500 border-[.5px] p-1 rounded-md font-reg">
                            {" "}
                            في انتظار الموافقة
                          </Text>
                        ) : request.status === "processing" ? (
                          <Text className="text-blue-500 border-primary border-[.5px] p-1 rounded-md font-reg text-sm">
                            قيد المعالجة
                          </Text>
                        ) : request.status === "done" ? (
                          <Text className="text-green-500 border-green-500 border-[.5px] rounded-md text-sm font-reg p-1">
                            مكتمل
                          </Text>
                        ) : (
                          <Text className="text-red-500 border-red-500 border-[.5px] p-1 rounded-md text-sm font-reg">
                            مرفوض
                          </Text>
                        )}
                      </DataTable.Cell>
                      <DataTable.Cell style={{ flex: 0.5 }}>
                        <IconButton
                          size={20}
                          icon={"eye"}
                          iconColor="#2563eb"
                          onPress={() => handleOpenModal(request)}
                        />
                      </DataTable.Cell>
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
