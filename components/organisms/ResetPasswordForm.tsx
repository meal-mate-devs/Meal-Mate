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
        <React.Fragment>
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-12 left-6 z-10"
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View className="items-center mb-8">
                <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-4">
                    <Ionicons name="lock-open-outline" size={40} color="#fff" />
                </View>
            </View>

            <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">Reset Your Password</Text>
            <Text className="text-base text-gray-500 mb-8 text-center">
                Enter your email address and we'll send you a link to reset your password
            </Text>

            <View className="mb-6">
                <View className="mb-6">
                    <Text className="text-sm font-semibold text-gray-800 mb-2">Email Address</Text>
                    <View className="flex-row border border-gray-200 rounded-xl bg-gray-50 h-14 items-center px-4">
                        <Ionicons name="mail-outline" size={20} color="#666" className="mr-2" />
                        <TextInput
                            className="flex-1 text-base text-gray-800 ml-2"
                            placeholder="your@email.com"
                            placeholderTextColor="#A0A0A0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isSubmitting}
                        />
                    </View>
                </View>
                <TouchableOpacity
                    className={`rounded-xl h-14 justify-center items-center shadow-sm ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
                        }`}
                    onPress={handleResetRequest}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-base font-semibold">Send Reset Link</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="items-center mt-6">
                <TouchableOpacity onPress={() => router.push('/')}>
                    <Text className="text-blue-600 text-sm font-semibold">Back to Login</Text>
                </TouchableOpacity>
            </View>
        </React.Fragment>
    );
};
