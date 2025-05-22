import CustomSplashScreen from "@/components/molecules/CustomSplashScreen";
import { AuthContextProvider, useAuthContext } from "@/context/authContext";
import { Poppins_400Regular, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { SplashScreen, Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import { BackHandler, Platform, StyleSheet, View, StatusBar } from "react-native";
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
    // Force dark mode
    if (Platform.OS === 'android') {
      // Set navigation bar color (Android only)
      if (Platform.Version >= 21) {
        try {
          const { NavigationBar } = require('react-native').NativeModules;
          if (NavigationBar && NavigationBar.setBackgroundColor) {
            NavigationBar.setBackgroundColor('#000000');
          }
        } catch (error) {
          console.log('Failed to set navigation bar color:', error);
        }
      }
    }
  }, []);

  // Handle splash screen based on font loading only
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <CustomSplashScreen />;
  }

  return (
    <AuthContextProvider>
      <RootLayoutContent />
    </AuthContextProvider>
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
  
  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Don't allow navigation from protected routes to auth routes when logged in
      if (user) {
        if (pathname.includes('/(protected)') && 
            (pathname === '/(protected)/(tabs)/home' || pathname === '/(protected)/(tabs)')) {
          // Don't go back from home screen when logged in, exit app instead
          BackHandler.exitApp();
          return true;
        }
        
        // Prevent going back to auth screens when logged in
        if (pathname.includes('/(protected)') && 
            (router.canGoBack() && navigationHistory.some(path => path.includes('/(auth)')))) {
          return true; // Block navigation
        }
      }
      
      // Don't allow navigation from auth routes to onboarding when completed
      if (pathname.includes('/(auth)') && 
          (router.canGoBack() && navigationHistory.some(path => path.includes('/(onboarding)')))) {
        return true; // Block navigation to onboarding
      }
      
      // Allow default back behavior for other cases
      return false;
    });
    
    return () => backHandler.remove();
  }, [pathname, user, navigationHistory]);

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
              backgroundColor="black" 
              style="light" 
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
