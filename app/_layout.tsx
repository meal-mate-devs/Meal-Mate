import CustomSplashScreen from "@/components/molecules/CustomSplashScreen";
import { AuthContextProvider } from "@/context/authContext";
import useAuth from "@/hooks/useAuth";
import { Poppins_400Regular, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Slot, SplashScreen } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import "../globals.css";




export default function RootLayout() {
  return (
    <AuthContextProvider>
      <RootLayoutContent />
    </AuthContextProvider>
  );
}

function RootLayoutContent() {
  const { isLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_400Regular,
  });

  React.useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return <CustomSplashScreen />;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Slot />
    </>
  );
}
