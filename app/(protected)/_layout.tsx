import { useAuthContext } from '@/context/authContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

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
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
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
        }} 
      />
    </>
  );
}