import { useAuthContext } from '@/context/authContext'; // Use this instead of direct useAuth
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Keep splash screen visible while we determine where to navigate
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, isLoading } = useAuthContext();  // Use context hook instead
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showTestMode, setShowTestMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('onboardingComplete');
        // Only set to true if explicitly stored as 'true'
        setOnboardingComplete(value === 'true');
      } catch (error) {
        console.log('Error checking onboarding status:', error);
        setOnboardingComplete(false);
      } finally {
        setInitializing(false);
        SplashScreen.hideAsync();
      }
    };

    checkOnboarding();
  }, []);

  // Show a black loading screen instead of white
  if (initializing || isLoading || onboardingComplete === null) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-300 font-poppins mb-4">Loading...</Text>
        
        {/* Easter egg to access test menu by tapping 5 times */}
        <TouchableOpacity
          onPress={() => {
            setShowTestMode(prev => {
              const newValue = !prev;
              if (newValue) {
                router.push('/test-menu' as any);
              }
              return newValue;
            });
          }}
          className="p-4"
        >
          <Text className="text-gray-600 text-xs">v1.0.0</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if we're showing the test mode (pressing version number will activate this)
  if (showTestMode) {
    router.push('/test-menu' as any);
    return null;
  }
  
  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return <Redirect href="/(protected)/(tabs)/home" />;
}