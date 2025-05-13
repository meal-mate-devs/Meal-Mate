import { Slot } from 'expo-router';
import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar
} from 'react-native';


export default function AuthLayout() {
    return (
        <SafeAreaView className="flex-1 bg-[#4CAF50]">
            <StatusBar barStyle="dark-content" backgroundColor="#4CAF50" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="flex-grow" showsVerticalScrollIndicator={false}>
                    <Slot />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}