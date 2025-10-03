import { AuthContextProvider } from '@/context/authContext';
import { ExpoRoot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <AuthContextProvider>
        <ExpoRoot context={require.context('app')} />
      </AuthContextProvider>
    </View>
  );
}