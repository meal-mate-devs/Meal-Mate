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

    const handleChangeEmail = async () => {
        try {
            // logout the user and send him to register screen to again register with new email !
        } catch (error) {

        }
    };

    const handleContinueToLogin = () => {
        router.push('/login');
    };

    return (
        <React.Fragment>
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-8 mx-auto">
                <Ionicons name="mail-open-outline" size={50} color="#3b82f6" />
            </View>

            <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
                Verify Your Email
            </Text>

            <Text className="text-base text-gray-500 mb-2 text-center">
                We've sent a verification email to:
            </Text>

            <Text className="text-lg font-semibold text-blue-600 mb-6 text-center">
                {user?.email}
            </Text>

            <Text className="text-base text-gray-500 mb-8 text-center">
                Please check your inbox and click the verification link to complete your registration.
            </Text>

            <View className="w-full mb-6">
                <TouchableOpacity
                    className={`flex-row items-center justify-center rounded-xl h-14 shadow-sm ${countdown > 0 || isResending ? 'bg-gray-300' : 'bg-blue-600'
                        }`}
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
                className="w-full rounded-xl h-14 border border-blue-600 justify-center items-center"
                onPress={handleContinueToLogin}
            >
                <Text className="text-blue-600 text-base font-semibold">Continue to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity className="mt-8">
                <Text className="text-blue-600 text-sm font-semibold">Need Help? Contact Support</Text>
            </TouchableOpacity>
        </React.Fragment >
    );
};
