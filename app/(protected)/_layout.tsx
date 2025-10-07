import { useAuthContext } from '@/context/authContext';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';

export default function ProtectedLayout() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  // Protect routes from unauthenticated users
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    } else if (!user.emailVerified) {
      router.replace('/(auth)/verify-email');
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
          animation: 'slide_from_right',
          animationDuration: 600,
          presentation: 'modal',
          gestureEnabled: false,
        }} 
      />
    </>
  );
}