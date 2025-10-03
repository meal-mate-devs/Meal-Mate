import { useAuthContext } from '@/context/authContext';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';

export default function AuthLayout() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  // Redirect logged-in users away from auth screens
  useEffect(() => {
    if (user) {
      if (user.emailVerified) {
        router.replace('/(protected)/(tabs)/home');
      } else {
        router.replace('/(auth)/verify-email');
      }
    }
  }, [user]);

  // Navigation bar styling
  useEffect(() => {
    // No Android-specific styling needed
  }, []);

  return (
    <>
      <StatusBar 
        backgroundColor="black" 
        barStyle="light-content" 
        translucent={true}
      />
      
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'fade',
          animationDuration: 200,
          presentation: 'transparentModal',
        }} 
      />
    </>
  );
}