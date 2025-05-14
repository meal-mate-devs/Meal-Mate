import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ResetPasswordForm() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { sendPasswordReset, doesAccountExist } = useAuthContext();
    const router = useRouter();

    // Regex for email validation (same as in RegistrationForm)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const validateEmail = (email: string) => {
        return emailRegex.test(email);
    };

    // Clear all errors
    const clearErrors = () => {
        setEmailError('');
        setGeneralError('');
    };

    // Helper function to check network connectivity
    const checkNetworkConnectivity = async () => {
        try {
            // For newer React Native versions (>= 0.63)
            if (Platform.OS === 'web') {
                return navigator.onLine;
            } else {
                const netInfoState = await NetInfo.fetch();
                return netInfoState.isConnected && netInfoState.isInternetReachable;
            }
        } catch (error) {
            console.log('Network check error:', error);
            // Fall back to assuming online if check fails
            return true;
        }
    };

    // Helper to identify network-related issues in errors
    const isNetworkRelatedError = (error: unknown) => {
        if (!error) return false;
        
        // Extract error information
        let errorMessage = '';
        let errorCode = '';
        
        if (typeof error === 'object') {
            errorMessage = (error as { message?: string }).message || error.toString();
            errorCode = (error as { code?: string }).code || '';
            
            // Check for connection timeout errors
            if ('name' in error && (error as { name?: string }).name === 'TimeoutError') return true;
            
            // Check for fetch/XMLHttpRequest errors
            if (error instanceof TypeError && 
                (errorMessage.includes('Failed to fetch') || 
                 errorMessage.includes('Network request failed'))) {
                return true;
            }
        } else {
            errorMessage = String(error);
        }
        
        // Check common network error codes
        if (errorCode === 'auth/network-request-failed' || 
            errorCode === 'NETWORK_ERROR' || 
            errorCode === 'ENOTFOUND' ||
            errorCode === 'ECONNREFUSED' ||
            errorCode === 'ECONNRESET' ||
            errorCode === 'ETIMEDOUT') {
            return true;
        }
        
        // Check for network-related phrases in the error message
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
            setGeneralError('No internet connection. Please check your network and try again.');
            return;
        }

        setIsSubmitting(true);

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
                    setEmailError('No account found with this email. Please Sign Up.');
                    setIsSubmitting(false);
                    return;
                }
            } catch (accountCheckError) {
                console.log('Account check error:', accountCheckError);
                
                // Check again if we lost connection during the account check
                const isStillConnected = await checkNetworkConnectivity();
                if (!isStillConnected) {
                    setGeneralError('Network connection lost. Please check your internet and try again.');
                    setIsSubmitting(false);
                    return;
                }
                
                // Process the error from account check
                if (isNetworkRelatedError(accountCheckError)) {
                    setGeneralError('Network error while checking your account. Please check your connection and try again.');
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
                    setGeneralError('Request timed out. Please try again later.');
                } else {
                    setGeneralError('Error checking account. Please try again later.');
                }
                
                setIsSubmitting(false);
                return;
            }

            // If account exists, send password reset
            await sendPasswordReset(email.trim());
            clearErrors(); // Clear any previous errors
            setGeneralError(''); 
            // Show success message below the form instead of Alert
            setEmailError('');
            router.push({
                pathname: '/login',
                params: { resetSent: 'true', email: email.trim() }
            });
        } catch (error) {
            console.log('Password reset error:', error);
            
            // Check if we lost connection during reset request
            const isStillConnected = await checkNetworkConnectivity();
            if (!isStillConnected) {
                setGeneralError('Network connection lost. Please check your internet and try again.');
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
                setGeneralError('Network error. Please check your internet connection and try again.');
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
                        setGeneralError('Network issue. Please check your connection and try again.');
                        break;
                    case 'auth/too-many-requests':
                        setGeneralError('Too many attempts. Please try again later.');
                        break;
                    default:
                        // If we have a Firebase error code but it's not in our list
                        if (errorCode.startsWith('auth/')) {
                            // It's an auth error, but not one we specifically handled
                            if (errorMessage.toLowerCase().includes('email')) {
                                setEmailError('Email issue. Please check again.');
                            } else {
                                setGeneralError('Password reset failed. Please try again.');
                            }
                        } else {
                            // Some other Firebase error
                            setGeneralError('Unable to process your request. Please try again later.');
                        }
                }
            } else if (errorMessage) {
                // We have an error message but no code
                if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
                    setGeneralError('Network issue. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Email issue. Please check again.');
                } else {
                    setGeneralError('Password reset failed. Please try again later.');
                }
            } else {
                // Fallback for when we have no useful error information
                setGeneralError('Request failed. Please try again or contact support if the issue persists.');
            }
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
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </View>
            </View>

            <View className="px-6 pt-8">
                <View className="mb-4">
                    <View className={`bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-4 ${emailError ? 'border border-red-500' : ''}`}>
                        <Ionicons name="mail-outline" size={20} color="#4CAF50" className="mr-2" />
                        <TextInput
                            className="flex-1 text-base text-gray-800 ml-2"
                            placeholder="Email Address"
                            placeholderTextColor="#90A4AE"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) clearErrors();
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isSubmitting}
                        />
                    </View>
                    
                    {/* Error message for email */}
                    {emailError ? (
                        <Text className="text-red-500 text-sm ml-4 mb-4">{emailError}</Text>
                    ) : null}

                    {/* General error message */}
                    {generalError ? (
                        <View className="bg-red-100 p-3 rounded-lg mb-4">
                            <Text className="text-red-600 text-sm">{generalError}</Text>
                        </View>
                    ) : null}

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