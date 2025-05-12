import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingScreenProps {
    message?: string;
}

export default function LoadingIndicator({ message = 'Loading...' }: LoadingScreenProps) {
    return (
        <View className="flex-col justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-4 text-gray-700 font-medium">{message}</Text>
        </View>
    );
}