import LoadingIndicator from "@/components/atoms/LoadingIndicator";
import { AuthContextProvider } from "@/context/authContext";
import useAuth from "@/hooks/useAuth";
import { Slot, SplashScreen } from "expo-router";
import React from "react";
import { StatusBar, View } from "react-native";
import "../globals.css";
export default function RootLayout() {
  return (
    <AuthContextProvider>
      <StatusBar barStyle="default" />
      <RootLayoutContent />
    </AuthContextProvider>
  );
}


function RootLayoutContent() {
  const { isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <LoadingIndicator />
      </View>
    );
  }

  return <Slot />;
}
