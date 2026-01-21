import { useModal } from "@/providers/modal-provider";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Divider } from "react-native-paper";
type RequestDetailsContentProps = {
  from: string;
  to: string;
  time: string;
  phone: number;
  isFull: boolean;
  status: "pending" | "rejected" | "processing" | "done";
  onDelete?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
};

export default function RequestDetailsContent({
  from,
  to,
  time,
  phone,
  isFull,
  onDelete,
  onAccept,
  onReject,
  status,
}: RequestDetailsContentProps) {
  const { close } = useModal();

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    close();
  };

  const handleAccept = async () => {
    if (onAccept) {
      onAccept();
    }
    close();
  };

  const handleReject = async () => {
    if (onReject) {
      onReject();
    }
    close();
  };

  return (
    <ScrollView className="h-full w-full p-12">
      <View>
        <Text className="text-lg font-semi-bold mb-2 text-center">
          تفاصيل الطلب
        </Text>
        <View className="flex-row justify-between my-6">
          <Text className="font-reg">{from}</Text>
          <Text className="font-semi-bold text-xl text-primary">من</Text>
        </View>
        <Divider className="my-2" />
        <View className="flex-row justify-between my-6">
          <Text className="font-reg">{from}</Text>
          <Text className="font-semi-bold text-xl text-primary">من</Text>
        </View>
        <Divider className="my-2" />
        <View className="flex-row justify-between my-6">
          <Text className="font-reg">{to}</Text>
          <Text className="font-semi-bold text-xl text-primary">إلى</Text>
        </View>
        <Divider className="my-2" />
        <View className="flex-row justify-between my-6">
          <Text className="font-reg">{time}</Text>
          <Text className="font-semi-bold text-xl text-primary">الوقت</Text>
        </View>
        <Divider className="my-2" />
        <View className="flex-row justify-between my-6">
          <Text className="font-reg text-lg">+962{phone}</Text>
          <Text className="font-semi-bold text-xl text-primary">
            رقم الهاتف
          </Text>
        </View>
        {status === "done" ? (
          <Text className="text-center text-green-500 font-reg mt-4">
            تم قبول الطلب
          </Text>
        ) : status === "rejected" ? (
          <Text className="text-center text-red-500 mt-4 font-reg">
            تم رفض الطلب
          </Text>
        ) : status === "processing" ? (
          <Text className="text-primary text-center font-reg mt-4">
            الطلب قيد المعالجة
          </Text>
        ) : (
          <>
            <Text className="text-yellow-500 text-center font-reg my-4">
              الطلب قيد الانتظار
            </Text>
            <View className="mt-4 gap-y-4">
              <Button
                icon={"check"}
                className=""
                mode="contained"
                onPress={handleAccept}
              >
                قبول الطلب
              </Button>
              <Button
                icon={"close"}
                mode="outlined"
                textColor="gray"
                onPress={handleReject}
              >
                رفض الطلب
              </Button>
            </View>
          </>
        )}
        {isFull && (
          <Button
            onPress={handleDelete}
            icon={"trash-can"}
            mode="outlined"
            textColor="red"
            className="mt-2"
          >
            حذف الطلب نهائياً
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
