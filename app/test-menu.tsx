import { Link, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TestMenuScreen() {
  const router = useRouter();
  
  const testScreens = [
    { name: 'Google Auth Test', path: '/google-auth-test', description: 'Test Google Sign-In functionality' },
    { name: 'Environment Variables', path: '/env-check', description: 'Check environment variables required for auth' },
    { name: 'Main App', path: '/', description: 'Go to the main application' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 p-6">
        <Text className="text-white text-3xl font-bold mb-8">Test Menu</Text>
        
        <View className="mb-6">
          <Text className="text-zinc-400 text-base mb-4">
            Use the options below to test various features of the application.
          </Text>
        </View>
        
        {testScreens.map((screen, index) => (
          <TouchableOpacity 
            key={index}
            className="mb-4"
            onPress={() => router.push(screen.path as any)}
          >
            <LinearGradient
              colors={['#262626', '#171717']}
              className="rounded-lg p-4 border border-zinc-700"
            >
              <Text className="text-white text-xl font-medium">{screen.name}</Text>
              <Text className="text-zinc-400 mt-1">{screen.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}