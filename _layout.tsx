import ProfileSyncProvider from '@/components/providers/ProfileSyncProvider';
import { AuthContextProvider } from '@/context/authContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Slot } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';


export default function RootLayout() {
  return (

    <AuthContextProvider>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        urlScheme="your-url-scheme"
      >
        <ProfileSyncProvider>
          <StatusBar
            backgroundColor="black"
            barStyle="light-content"
            translucent={true}
          />
          <Slot />
        </ProfileSyncProvider>
      </StripeProvider>
    </AuthContextProvider>
  );
}