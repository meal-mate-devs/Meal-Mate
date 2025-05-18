// app/(auth)/forgot-password.tsx
import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Dialog from '../atoms/Dialog';

export default function ResetPasswordForm() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

    const { sendPasswordReset, doesAccountExist } = useAuthContext();
    const router = useRouter();

    // Regex for email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const validateEmail = (email: string) => {
        return emailRegex.test(email);
    };

    // Clear errors
    const clearErrors = () => {
        setEmailError('');
    };

    // Show dialog helper function
    const showDialog = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string = '') => {
        setDialogType(type);
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    // Helper function to check network connectivity
    const checkNetworkConnectivity = async () => {
        try {
            if (Platform.OS === 'web') {
                return navigator.onLine;
            } else {
                const netInfoState = await NetInfo.fetch();
                return netInfoState.isConnected && netInfoState.isInternetReachable;
            }
        } catch (error) {
            console.log('Network check error:', error);
            return true;
        }
    };

    // Helper to identify network-related issues in errors (using your existing function)
    const isNetworkRelatedError = (error: unknown) => {
        if (!error) return false;

        let errorMessage = '';
        let errorCode = '';

        if (typeof error === 'object') {
            errorMessage = (error as { message?: string }).message || error.toString();
            errorCode = (error as { code?: string }).code || '';

            if ('name' in error && (error as { name?: string }).name === 'TimeoutError') return true;

            if (error instanceof TypeError &&
                (errorMessage.includes('Failed to fetch') ||
                    errorMessage.includes('Network request failed'))) {
                return true;
            }
        } else {
            errorMessage = String(error);
        }

        if (errorCode === 'auth/network-request-failed' ||
            errorCode === 'NETWORK_ERROR' ||
            errorCode === 'ENOTFOUND' ||
            errorCode === 'ECONNREFUSED' ||
            errorCode === 'ECONNRESET' ||
            errorCode === 'ETIMEDOUT') {
            return true;
        }

        const networkErrorPhrases = [
            'network', 'connection', 'internet', 'offline', 'timeout',
            'unreachable', 'connect', 'dns', 'host', 'socket', 'request failed',
            'cannot reach', 'server unavailable', 'no internet'
        ];

        return networkErrorPhrases.some(phrase =>
            errorMessage.toLowerCase().includes(phrase));
    };

    const handleResetRequest = async () => {
        // Clear previous errors
        clearErrors();

        // Client-side validation
        if (!email.trim()) {
            setEmailError('Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Basic domain validation
        const domain = email.substring(email.indexOf('@') + 1);
        if (!domain.includes('.') || domain.length < 3) {
            setEmailError('The email domain is invalid');
            return;
        }

        // Check for disposable email domains
        const disposableDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com'];
        if (disposableDomains.includes(domain)) {
            setEmailError('Disposable email addresses are not allowed');
            return;
        }

        // Check network connectivity before proceeding
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
            showDialog('error', 'Network Error', 'No internet connection. Please check your network and try again.');
            return;
        }

        setIsSubmitting(true);
        showDialog('loading', 'Processing Request', 'Please wait while we process your request...');

        try {
            // First check if the account exists
            let accountExists = false;

            try {
                // Set a timeout for the account check
                const accountCheckPromise = doesAccountExist(email.trim());
                const accountCheckWithTimeout = Promise.race([
                    accountCheckPromise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Account check timed out')), 10000)
                    )
                ]);

                accountExists = await accountCheckWithTimeout as boolean;

                if (!accountExists) {
                    setDialogVisible(false);
                    setEmailError('No account found with this email. Please Sign Up.');
                    setIsSubmitting(false);
                    return;
                }
            } catch (accountCheckError) {
                console.log('Account check error:', accountCheckError);
                setDialogVisible(false);

                // Check again if we lost connection during the account check
                const isStillConnected = await checkNetworkConnectivity();
                if (!isStillConnected) {
                    showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                    setIsSubmitting(false);
                    return;
                }

                // Process the error from account check
                if (isNetworkRelatedError(accountCheckError)) {
                    showDialog('error', 'Network Error', 'Network error while checking your account. Please check your connection and try again.');
                    setIsSubmitting(false);
                    return;
                }

                // For other types of errors during account check
                let errorMessage = '';
                if (typeof accountCheckError === 'object' && accountCheckError !== null) {
                    errorMessage = (accountCheckError as { message?: string }).message || accountCheckError.toString();
                } else {
                    errorMessage = String(accountCheckError);
                }

                if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Error validating email. Please check your email and try again.');
                } else if (errorMessage.toLowerCase().includes('timeout') ||
                    errorMessage.toLowerCase().includes('timed out')) {
                    showDialog('error', 'Request Timeout', 'Request timed out. Please try again later.');
                } else {
                    showDialog('error', 'Account Check Error', 'Error checking account. Please try again later.');
                }

                setIsSubmitting(false);
                return;
            }

            // If account exists, send password reset
            await sendPasswordReset(email.trim());
            setDialogVisible(false);

            // Show success message
            showDialog(
                'success',
                'Reset Link Sent!',
                'Check your email for instructions to reset your password.'
            );

            // After showing success dialog, navigate to login page when user confirms
        } catch (error) {
            console.log('Password reset error:', error);
            setDialogVisible(false);

            // Check if we lost connection during reset request
            const isStillConnected = await checkNetworkConnectivity();
            if (!isStillConnected) {
                showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                setIsSubmitting(false);
                return;
            }

            // Extract error message and code properly
            let errorMessage = '';
            let errorCode = '';

            // Type guard for error
            if (typeof error === 'object' && error !== null) {
                // Check if error is a FirebaseError by inspecting its message property
                const errorStr = (typeof (error as any).message === 'string') ? (error as any).message : error.toString();
                if (errorStr.includes('FirebaseError:')) {
                    // Extract error code from the error message
                    const match = errorStr.match(/\(([^)]+)\)/);
                    if (match && match[1]) {
                        errorCode = match[1];
                    }
                    errorMessage = errorStr;
                } else {
                    // For other types of errors
                    errorMessage = (typeof (error as any).message === 'string') ? (error as any).message : error.toString();
                    errorCode = (error as any).code || '';
                }
            } else {
                // error is not an object, fallback to string conversion
                const errorStr = String(error);
                if (errorStr.includes('FirebaseError:')) {
                    const match = errorStr.match(/\(([^)]+)\)/);
                    if (match && match[1]) {
                        errorCode = match[1];
                    }
                    errorMessage = errorStr;
                } else {
                    errorMessage = errorStr;
                    errorCode = '';
                }
            }

            console.log('Error code:', errorCode);
            console.log('Error message:', errorMessage);

            // Network-related error detection
            if (isNetworkRelatedError(error)) {
                showDialog('error', 'Network Error', 'Network error. Please check your internet connection and try again.');
            } else if (errorCode) {
                switch (errorCode) {
                    case 'auth/user-not-found':
                        setEmailError('No account exists with this email. Please Sign Up.');
                        break;
                    case 'auth/invalid-email':
                        setEmailError('Invalid email format');
                        break;
                    case 'auth/missing-email':
                        setEmailError('Please enter your email address');
                        break;
                    case 'auth/network-request-failed':
                        showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                        break;
                    case 'auth/too-many-requests':
                        showDialog('warning', 'Too Many Attempts', 'Too many attempts. Please try again later.');
                        break;
                    default:
                        // If we have a Firebase error code but it's not in our list
                        if (errorCode.startsWith('auth/')) {
                            // It's an auth error, but not one we specifically handled
                            if (errorMessage.toLowerCase().includes('email')) {
                                setEmailError('Email issue. Please check again.');
                            } else {
                                showDialog('error', 'Reset Failed', 'Password reset failed. Please try again.');
                            }
                        } else {
                            // Some other Firebase error
                            showDialog('error', 'Request Failed', 'Unable to process your request. Please try again later.');
                        }
                }
            } else if (errorMessage) {
                // We have an error message but no code
                if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
                    showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Email issue. Please check again.');
                } else {
                    showDialog('error', 'Reset Failed', 'Password reset failed. Please try again later.');
                }
            } else {
                // Fallback for when we have no useful error information
                showDialog('error', 'Request Failed', 'Request failed. Please try again or contact support if the issue persists.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDialogConfirm = () => {
        setDialogVisible(false);

        // If success dialog was shown, navigate to login page
        if (dialogType === 'success') {
            router.push('/(auth)/login');
        }
    };

    const handleBackToLogin = () => {
        router.push('/(auth)/login');

    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-black"
        >
            <View className="flex-1 justify-center px-6">
                <View className="mb-8">
                    <Text className="text-white text-3xl font-bold mb-3">
                        Forgot Password
                    </Text>
                    <Text className="text-gray-400 text-base">
                        Fill in current email to reset your password.
                    </Text>
                </View>

                {/* Email/Username Input */}
                <View className="mb-4">
                    <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${emailError ? 'border-red-400' : ''}`}>
                        <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                        <TextInput
                            className="flex-1 text-white text-base ml-3"
                            placeholder="Email/Username"
                            placeholderTextColor="#9CA3AF"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) setEmailError('');
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isSubmitting}
                        />
                    </View>
                    {emailError ? (
                        <Text className="text-red-500 text-xs ml-4 mt-1">{emailError}</Text>
                    ) : null}
                </View>

                <Text className="text-gray-400 text-sm mb-6">
                    To recover your account, an OTP will be sent to the mail you provided.
                </Text>

                {/* Proceed Button */}
                <View className='flex pt-6'>
                    <TouchableOpacity
                        className="bg-orange-400 rounded-full h-14 justify-center items-center mb-8"
                        onPress={handleResetRequest}
                        disabled={isSubmitting}
                    >
                        <Text className="text-white text-base font-bold">
                            Proceed
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleBackToLogin} className="items-center">
                        <Text className="text-orange-400 text-sm font-semibold">Back To Login</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dialog Component */}
            <Dialog
                visible={dialogVisible}
                type={dialogType}
                title={dialogTitle}
                message={dialogMessage}
                onClose={() => setDialogVisible(false)}
                onConfirm={handleDialogConfirm}
                confirmText={dialogType === 'success' ? 'Back to Login' : 'OK'}
            />
        </KeyboardAvoidingView>
    );
}