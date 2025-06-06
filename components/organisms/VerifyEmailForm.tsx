import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Dialog from '../atoms/Dialog';

export default function VerifyEmailForm() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [countdown, setCountdown] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const { user, sendEmailVerificationLink } = useAuthContext();

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Show dialog helper function
    const showDialog = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string = '') => {
        setDialogType(type);
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const handleResendEmail = async () => {
        if (countdown > 0) return;
        if (!user) return;

        setIsResending(true);
        showDialog('loading', 'Sending Email', 'Please wait while we send you a new verification email...');

        try {
            await sendEmailVerificationLink(user);
            setCountdown(60);
            setDialogVisible(false);
            showDialog('success', 'Email Sent', 'Verification email has been resent. Please check your inbox.');
        } catch (error) {
            setDialogVisible(false);
            showDialog('error', 'Failed to Send', 'We could not resend the verification email. Please try again later.');
        } finally {
            setIsResending(false);
        }
    };

    const handleContinueToLogin = () => {
        router.push('/(auth)/login');
    };

    const handleDialogConfirm = () => {
        setDialogVisible(false);
    };

    return (
        <View className="flex-1 bg-black">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className="flex-1 pt-12 px-6 pb-6">
                    <Text className="text-white text-3xl font-bold mb-8">
                        Verify Your Email
                    </Text>

                    <View className="items-center mb-10">
                        <View className="w-24 h-24 rounded-full bg-zinc-800 items-center justify-center mb-6">
                            <Ionicons name="mail-open-outline" size={48} color="#FACC15" />
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-gray-300 text-base mb-4 text-center">
                            We've sent a verification email to:
                        </Text>

                        <Text className="text-yellow-400 text-lg font-semibold mb-8 text-center">
                            {user?.email}
                        </Text>

                        <Text className="text-gray-400 text-base mb-2 text-center">
                            Please check your inbox and click the verification link to complete your registration.
                        </Text>
                    </View>

                    <View className="w-full mb-6">
                        <TouchableOpacity
                            className={`rounded-full overflow-hidden ${(countdown > 0 || isResending) ? 'opacity-70' : ''}`}
                            onPress={handleResendEmail}
                            disabled={countdown > 0 || isResending}
                        >
                            {countdown > 0 ? (
                                <View className="h-14 bg-zinc-800 items-center justify-center flex-row">
                                    <Ionicons
                                        name="time-outline"
                                        size={20}
                                        color="#FFFFFF"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text className="text-white text-base font-semibold">
                                        Resend in {countdown}s
                                    </Text>
                                </View>
                            ) : (
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']} // yellow-400 to orange-400
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="h-14 items-center justify-center flex-row"
                                >
                                    <Ionicons
                                        name="refresh-outline"
                                        size={20}
                                        color="#FFFFFF"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text className="text-white text-base font-bold">
                                        Resend Email
                                    </Text>
                                </LinearGradient>
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-400 text-center mb-8">
                        Didn't receive an email? Check your spam folder or try resending.
                    </Text>

                    <TouchableOpacity
                        className="w-full rounded-full border border-zinc-700 h-14 justify-center items-center mb-8"
                        onPress={handleContinueToLogin}
                    >
                        <Text className="text-white text-base font-semibold">Continue to Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="items-center">
                        <Text className="text-yellow-400 text-sm font-semibold">Need Help? Contact Support</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Dialog Component */}
            <Dialog
                visible={dialogVisible}
                type={dialogType}
                title={dialogTitle}
                message={dialogMessage}
                onClose={() => setDialogVisible(false)}
                onConfirm={handleDialogConfirm}
                confirmText="OK"
            />
        </View>
    );
}