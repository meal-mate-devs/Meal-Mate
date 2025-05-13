import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function VerifyEmailForm() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [countdown, setCountdown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const { user, sendEmailVerificationLink } = useAuthContext();

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResendEmail = async () => {
        if (countdown > 0) return;
        if (!user) return;
        setIsResending(true);
        try {
            await sendEmailVerificationLink(user)
            setCountdown(60);
            Alert.alert('Success', 'Verification email has been resent.');
        } catch (error) {
            Alert.alert('Error', 'Failed to resend verification email.');
        } finally {
            setIsResending(false);
        }
    };

    const handleContinueToLogin = () => {
        router.push('/login');
    };

    return (
        <View className="flex-1 bg-white">
            <View className="bg-green-500 rounded-b-3xl p-6 pt-12 items-center">
                <View className="items-center py-8">
                    <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
                        <Ionicons name="mail-open-outline" size={40} color="#fff" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2">Verify Your Email</Text>
                    <Text className="text-white text-center opacity-80">
                        We've sent a verification email to your inbox
                    </Text>
                </View>
            </View>

            <View className="px-6 pt-8 items-center">
                <Text className="text-base text-gray-500 mb-2 text-center">
                    We've sent a verification email to:
                </Text>

                <Text className="text-lg font-semibold text-green-600 mb-6 text-center">
                    {user?.email}
                </Text>

                <Text className="text-base text-gray-500 mb-8 text-center">
                    Please check your inbox and click the verification link to complete your registration.
                </Text>

                <View className="w-full mb-6">
                    <TouchableOpacity
                        className={`flex-row items-center justify-center rounded-full h-14 shadow-sm ${countdown > 0 || isResending ? 'bg-gray-300' : 'bg-green-500'}`}
                        onPress={handleResendEmail}
                        disabled={countdown > 0 || isResending}
                    >
                        {isResending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons
                                    name="refresh-outline"
                                    size={20}
                                    color="#fff"
                                    style={{ marginRight: 8 }}
                                />
                                <Text className="text-white text-base font-semibold">
                                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-500 text-center mb-8">
                    Didn't receive an email? Check your spam folder or try resending.
                </Text>

                <TouchableOpacity
                    className="w-full rounded-full h-14 border border-green-500 justify-center items-center"
                    onPress={handleContinueToLogin}
                >
                    <Text className="text-green-600 text-base font-semibold">Continue to Login</Text>
                </TouchableOpacity>

                <TouchableOpacity className="mt-8">
                    <Text className="text-green-600 text-sm font-semibold">Need Help? Contact Support</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};