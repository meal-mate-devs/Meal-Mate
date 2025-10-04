import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function GoogleAuthTestScreen() {
  const { user, profile, isAuthenticated, googleLogin, logout } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await googleLogin();
      // If successful, the auth state will update automatically
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError('Failed to sign in with Google: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await logout();
      // If successful, the auth state will update automatically
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 p-6">
        <View className="mb-6">
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => router.push('/test-menu' as any)}
          >
            <Ionicons name="arrow-back" size={24} color="#FFC107" />
            <Text className="text-yellow-500 ml-2">Back to Test Menu</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-white text-2xl font-bold mb-6">Google Authentication Test</Text>
        
        <View className="bg-zinc-800 rounded-lg p-6 mb-6">
          <Text className="text-white text-lg mb-2">Authentication Status:</Text>
          <Text className="text-green-400 text-lg font-semibold mb-4">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Text>
          
          {isAuthenticated && user && (
            <>
              <Text className="text-white mb-1">User ID: {user.uid}</Text>
              <Text className="text-white mb-1">Email: {user.email}</Text>
              <Text className="text-white mb-4">Email Verified: {user.emailVerified ? 'Yes' : 'No'}</Text>
              
              {profile && (
                <View className="mt-4">
                  <Text className="text-white text-lg font-semibold mb-2">Profile Information:</Text>
                  <Text className="text-white mb-1">Name: {profile.firstName} {profile.lastName}</Text>
                  <Text className="text-white mb-1">Username: {profile.userName}</Text>
                </View>
              )}
            </>
          )}
          
          {error && (
            <View className="bg-red-900 p-4 rounded-lg mt-4">
              <Text className="text-white">{error}</Text>
            </View>
          )}
        </View>
        
        {isAuthenticated ? (
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoading}
            className="rounded-full h-14 justify-center items-center mb-4 overflow-hidden"
          >
            <LinearGradient
              colors={['#FF5252', '#D32F2F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full absolute"
            />
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Sign Out</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            className="rounded-full h-14 justify-center items-center mb-4 overflow-hidden"
          >
            <LinearGradient
              colors={['#4285F4', '#2A75F3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full absolute"
            />
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">Sign In with Google</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}