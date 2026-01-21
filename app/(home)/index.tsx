import * as React from "react";
import { BottomNavigation } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeScreen from "@/screens/home";
import RecentScreen from "@/screens/recent";

const MainScreen = () => {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {
      key: "home",
      title: "الرئيسية",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },

    { key: "recents", title: "السجل", focusedIcon: "history" },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeScreen,
    recents: RecentScreen,
  });

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        sceneAnimationType="shifting"
        activeColor="#2563eb"
        activeIndicatorStyle={{
          backgroundColor: "#2563eb",
        }}
        barStyle={{
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        }}
      />
    </SafeAreaView>
  );
};

export default MainScreen;
