import Carousel from "@/components/caoursel";
import React, { useRef, useState } from "react";
import { Alert, View } from "react-native";
import { Button } from "react-native-paper";
import FirstPage from "./caoursel/page-1";
import SecondPage from "./caoursel/page-2";
import ThirdPage from "./caoursel/page-3";

import { useModal } from "@/providers/modal-provider";

import { useRequestStore } from "@/store/use-request-store";
import FourthPage from "./caoursel/page-4";

import { createNewRequest } from "@/actions";

import useNotification from "@/hooks/use-notifications";

export default function NewCar() {
  const [loading, setLoading] = useState(false);
  const storeData = useRequestStore().data;
  const { close } = useModal();
  const nextRef = useRef<{ goNext: () => void; getIndex: () => number }>(null);

  const { sendToAllUsers } = useNotification();

  const handleGoNext = () => {
    nextRef?.current?.goNext();
  };

  const handleContinue = () => {
    const currentPageIndex = nextRef?.current?.getIndex();
    if (currentPageIndex === 0 && storeData?.from) {
      handleGoNext();
    } else if (currentPageIndex === 1 && storeData?.to) {
      handleGoNext();
    } else if (currentPageIndex === 2 && storeData?.time) {
      handleGoNext();
    } else if (currentPageIndex === 3 && storeData?.number) {
      setLoading(true);
      createNewRequest(storeData).then((res: any) => {
        if (res.status !== 201) return;
        // send notification to admin about new request
        // TODO: implement notification to admin
        sendToAllUsers("طلب جديد", "تم إنشاء طلب جديد لفحص السيارة");
        close();
        setLoading(false);
        Alert.alert(
          "تم ارسال الطلب",
          "لقد تم حجز موعدك بنجاح",
          [
            {
              text: "حسنا",
            },
          ],
          { cancelable: true },
        );
      });
    }
  };

  const data = [
    { id: "1", component: <FirstPage /> },
    {
      id: "2",
      component: <SecondPage />,
    },
    { id: "3", component: <ThirdPage /> },
    { id: "4", component: <FourthPage /> },
  ];

  return (
    <View className="flex-1">
      <View className="flex-1">
        <Carousel data={data} ref={nextRef} />
      </View>
      <View className="p-4">
        <Button mode="contained" loading={loading} onPress={handleContinue}>
          متابعة
        </Button>
      </View>
    </View>
  );
}
