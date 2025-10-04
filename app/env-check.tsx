import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

/**
 * Utility screen to check environment variables and configurations
 * that are critical for Google Sign-In
 */
export default function EnvCheckScreen() {
  const router = useRouter();
  const [envVariables, setEnvVariables] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Collect all environment variables that start with EXPO_PUBLIC
    const publicVars: Record<string, any> = {};
    
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('EXPO_PUBLIC_')) {
        // For sensitive values like keys, show only first/last few characters
        const value = process.env[key];
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('ID')) {
          if (typeof value === 'string' && value.length > 8) {
            publicVars[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
          } else {
            publicVars[key] = value ? '[Set but too short to mask]' : '[Not set]';
          }
        } else {
          publicVars[key] = value || '[Not set]';
        }
      }
    });
    
    // Add Expo configuration
    publicVars['expo.scheme'] = Constants.expoConfig?.scheme || '[Not set]';
    publicVars['expo.android.package'] = Constants.expoConfig?.android?.package || '[Not set]';
    
    setEnvVariables(publicVars);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => router.push('/test-menu' as any)}
          >
            <Ionicons name="arrow-back" size={24} color="#FFC107" />
            <Text style={{ color: '#FFC107', marginLeft: 8, fontSize: 16 }}>Back to Test Menu</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Environment Variables Check
        </Text>
        
        <View style={{ backgroundColor: '#333', borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>
            Public Environment Variables
          </Text>
          
          {Object.keys(envVariables).length > 0 ? (
            Object.keys(envVariables).map((key) => (
              <View key={key} style={{ marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{key}</Text>
                <Text style={{ color: '#4CAF50' }}>{envVariables[key]}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#ff5252' }}>No public environment variables found</Text>
          )}
        </View>
        
        <View style={{ backgroundColor: '#333', borderRadius: 8, padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>
            Required for Google Sign-In
          </Text>
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>EXPO_PUBLIC_GOOGLE_CLIENT_ID</Text>
            <Text style={{ 
              color: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? '#4CAF50' : '#ff5252'
            }}>
              {process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? 'Set ✓' : 'Not set ✗'}
            </Text>
          </View>
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>app.json scheme</Text>
            <Text style={{ 
              color: Constants.expoConfig?.scheme ? '#4CAF50' : '#ff5252'
            }}>
              {Constants.expoConfig?.scheme || 'Not set ✗'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}