import { AuthContextProvider } from '@/context/authContext';
import { Slot } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <StatusBar 
        backgroundColor="black" 
        barStyle="light-content" 
        translucent={true}
      />
      <Slot />
    </AuthContextProvider>
  );
}