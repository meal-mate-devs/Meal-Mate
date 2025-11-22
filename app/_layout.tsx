import CustomSplashScreen from "@/components/molecules/CustomSplashScreen";
import { AuthContextProvider, useAuthContext } from "@/context/authContext";
import { NotificationProvider } from "@/context/notificationContext";
import { Poppins_400Regular, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import * as NavigationBar from 'expo-navigation-bar';
import { SplashScreen, Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../globals.css";

export default function RootLayout() {
  // Load fonts outside the context
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Poppins_400Regular,
  });

  // Set background colors on app startup
  useEffect(() => {
    // Force dark mode and set navigation bar to black
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  // Handle splash screen - prevent auto-hide and show immediately
  React.useEffect(() => {
    // Prevent the splash screen from auto-hiding
    SplashScreen.preventAutoHideAsync();
    
    // Show our custom splash screen immediately with dark background
    // The splash screen will be hidden when fonts are loaded
  }, []);

  // Handle splash screen based on font loading only
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Handle splash screen - prevent auto-hide and show immediately
  React.useEffect(() => {
    // Prevent the splash screen from auto-hiding
    SplashScreen.preventAutoHideAsync();
    
    // Show our custom splash screen immediately with dark background
    // The splash screen will be hidden when fonts are loaded
  }, []);

  // Handle splash screen based on font loading only
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Always show custom splash screen first, regardless of font loading
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {!fontsLoaded ? (
        <CustomSplashScreen />
      ) : (
        <AuthContextProvider>
          <NotificationProvider>
            <RootLayoutContent />
          </NotificationProvider>
        </AuthContextProvider>
      )}
    </View>
  );
}

function RootLayoutContent() {
  const pathname = usePathname();
  const router = useRouter();
  // Use useAuthContext (from AuthContextProvider) instead of direct useAuth
  const { user, isLoading } = useAuthContext();
  const [navigationHistory, setNavigationHistory] = React.useState<string[]>([]);
  
  // Track navigation history
  useEffect(() => {
    setNavigationHistory(prev => [...prev, pathname]);
  }, [pathname]);

  // Now handle loading state from context
  if (isLoading) {
    return <CustomSplashScreen />;
  }

  return (
    <>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View style={styles.container}>
            {/* Status bar background for edge-to-edge support */}
            <View style={styles.statusBarBackground} />
            
            <ExpoStatusBar 
              style="light" 
              backgroundColor="#000000"
              translucent={true}
            />
            
            <Stack 
              screenOptions={{
                headerShown: false,  // Hide header by default
                contentStyle: { backgroundColor: '#000000' },
                animation: 'fade',  // Use fade instead of default slide
                animationDuration: 200,
                presentation: 'transparentModal',  // Prevent white flash
              }} 
            />
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 24,
    backgroundColor: '#000000',
    zIndex: 1,
  },
});
