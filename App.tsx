import { AuthContextProvider } from '@/context/authContext';
import { ExpoRoot } from 'expo-router';
import React from 'react';

export default function App() {
  return (
    <AuthContextProvider>
      <ExpoRoot context={require.context('app')} />
    </AuthContextProvider>
  );
}