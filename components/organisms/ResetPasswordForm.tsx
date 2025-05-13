import { useAuthContext } from '@/context/authContext';
import { isValidEmail } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ResetPasswordForm() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { sendPasswordReset } = useAuthContext()
    const router = useRouter();

    const handleResetRequest = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            sendPasswordReset(email);
            Alert.alert(
                'Reset Link Sent',
                `We've sent a password reset link to ${email}. Please check your inbox.`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to send reset link. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <View className="bg-green-500 rounded-b-3xl p-6 pt-12 items-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 z-10"
                >
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>

                <View className="items-center py-8">
                    <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
                        <Ionicons name="lock-open-outline" size={40} color="#fff" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2">Reset Password</Text>
                    <Text className="text-white text-center opacity-80">
                        Enter your email address and we'll send you a link to reset your password
                    </Text>
                </View>
            </View>

            <View className="px-6 pt-8">
                <View className="mb-6">
                    <View className="bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-6">
                        <Ionicons name="mail-outline" size={20} color="#4CAF50" className="mr-2" />
                        <TextInput
                            className="flex-1 text-base text-gray-800 ml-2"
                            placeholder="Email Address"
                            placeholderTextColor="#90A4AE"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isSubmitting}
                        />
                    </View>

                    <TouchableOpacity
                        className={`rounded-full h-14 justify-center items-center shadow-sm mb-4 ${isSubmitting ? 'bg-green-400' : 'bg-green-500'}`}
                        onPress={handleResetRequest}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white text-base font-semibold">Send Reset Link</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="items-center mt-4"
                        onPress={() => router.push('/login')}
                    >
                        <Text className="text-green-600 text-sm font-semibold">Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};