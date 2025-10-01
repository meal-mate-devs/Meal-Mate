import { Stack } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

export default function SettingsLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
            <Stack 
                screenOptions={{ 
                    headerShown: false,
                    // CRITICAL: Black background on content to prevent white flash
                    contentStyle: { backgroundColor: '#000000' },
                    // Platform-optimized smooth animations
                    animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade',
                    // Super fast transition to minimize flash visibility
                    animationDuration: 100,
                    // iOS gesture support
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                    // Ensure smooth back animation
                    animationTypeForReplace: 'pop',
                }}
            >
            <Stack.Screen name="index" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="payment" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="general" />
            <Stack.Screen name="favorites" />
            <Stack.Screen name="cooking" />
            <Stack.Screen name="help" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="device-details" />
            <Stack.Screen name="card-details" />
            <Stack.Screen name="add-card" />
            <Stack.Screen name="grocery-list" />
        </Stack>
        </View>
    );
}