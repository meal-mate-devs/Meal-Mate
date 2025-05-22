import { useAuthContext } from '@/context/authContext'; // Use this instead of direct useAuth
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

// Keep splash screen visible while we determine where to navigate
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, isLoading } = useAuthContext();  // Use context hook instead
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);

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
        <Text className="text-gray-300 font-poppins">Loading...</Text>
      </View>
    );
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