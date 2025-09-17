import ProfileSyncProvider from '@/components/providers/ProfileSyncProvider';
import { AuthContextProvider } from '@/context/authContext';
import { Slot } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <ProfileSyncProvider>
        <StatusBar
          backgroundColor="black"
          barStyle="light-content"
          translucent={true}
        />
        <Slot />
      </ProfileSyncProvider>
    </AuthContextProvider>
  );
}