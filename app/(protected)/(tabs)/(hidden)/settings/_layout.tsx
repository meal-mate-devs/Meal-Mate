import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
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
        </Stack>
    );
}