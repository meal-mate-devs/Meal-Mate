import { AuthContextProvider } from '@/context/authContext';
import { ExpoRoot } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { View } from 'react-native';

// Initialize WebBrowser at root level for auth redirects
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  // Log environment variables on startup to help with debugging
  useEffect(() => {
    console.log('App started');
    console.log('Expo scheme:', process.env.EXPO_PUBLIC_SCHEME || 'authapp');
    console.log('API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set');
    console.log('Google Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <AuthContextProvider>
        <ExpoRoot context={require.context('app')} />
      </AuthContextProvider>
    </View>
  );
}