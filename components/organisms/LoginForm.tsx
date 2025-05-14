import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginForm() {
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login, doesAccountExist } = useAuthContext();

    // Regex for email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const validateEmail = (email: string): boolean => {
        return emailRegex.test(email);
    };

    // Clear all errors
    const clearErrors = () => {
        setEmailError('');
        setPasswordError('');
        setGeneralError('');
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

    // Helper to identify network-related issues in errors
    const isNetworkRelatedError = (error: any): boolean => {
        if (!error) return false;
        
        // Extract error information
        let errorMessage = '';
        let errorCode = '';
        
        if (typeof error === 'object') {
            errorMessage = error.message || error.toString();
            errorCode = error.code || '';
            
            // Check for connection timeout errors
            if (error.name === 'TimeoutError') return true;
            
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

    const handleLogin = async () => {
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

        if (!password.trim()) {
            setPasswordError('Please enter your password');
            return;
        }

        // Check network connectivity before proceeding
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
            setGeneralError('No internet connection. Please check your network and try again.');
            return;
        }

        try {
            setIsLoading(true);

            // Basic domain validation
            const domain = email.substring(email.indexOf('@') + 1);
            if (!domain.includes('.') || domain.length < 3) {
                setEmailError('The email domain is invalid');
                setIsLoading(false);
                return;
            }

            // Check for disposable email domains
            const disposableDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com'];
            if (disposableDomains.includes(domain)) {
                setEmailError('Disposable email addresses are not allowed');
                setIsLoading(false);
                return;
            }

            // Check if account exists before attempting login
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
                
                // Await the result with timeout protection
                accountExists = await accountCheckWithTimeout as boolean;
                
                if (!accountExists) {
                    setEmailError('Account does not exist. Please sign up first.');
                    setIsLoading(false);
                    return;
                }
            } catch (accountCheckError) {
                console.log('Account check error:', accountCheckError);
                
                // Check again if we lost connection during the account check
                const isStillConnected = await checkNetworkConnectivity();
                if (!isStillConnected) {
                    setGeneralError('Network connection lost. Please check your internet and try again.');
                    setIsLoading(false);
                    return;
                }
                
                // Process the error from account check
                if (isNetworkRelatedError(accountCheckError)) {
                    setGeneralError('Network error while checking your account. Please check your connection and try again.');
                    setIsLoading(false);
                    return;
                }
                
                // For other types of errors during account check
                let errorMessage = '';
                if (typeof accountCheckError === 'object' && accountCheckError !== null) {
                    errorMessage = (accountCheckError as any).message || accountCheckError.toString();
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
                
                setIsLoading(false);
                return;
            }

            // Attempt login
            await login(email.trim(), password.trim());
            router.push('/home');

        } catch (error) {
            console.log('Login error:', error);
            
            // Check if we lost connection during login
            const isStillConnected = await checkNetworkConnectivity();
            if (!isStillConnected) {
                setGeneralError('Network connection lost. Please check your internet and try again.');
                setIsLoading(false);
                return;
            }
            
            // Extract error message and code properly
            let errorMessage = '';
            let errorCode = '';
            
            // Check if error is a FirebaseError
            const errorStr = typeof error === 'string' ? error : (error && typeof error === 'object' && 'toString' in error) ? (error as any).toString() : '';
            if (errorStr.includes('FirebaseError:')) {
                // Extract error code from the error message
                const match = errorStr.match(/\(([^)]+)\)/);
                if (match && match[1]) {
                    errorCode = match[1];
                }
                errorMessage = errorStr;
            } else {
                // For other types of errors
                if (typeof error === 'object' && error !== null) {
                    errorMessage = (error as any).message || errorStr;
                    errorCode = (error as any).code || '';
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
                        setEmailError('Account does not exist. Please sign up first.');
                        break;
                    case 'auth/wrong-password':
                        setPasswordError('Wrong password. Please try again.');
                        break;
                    case 'auth/invalid-email':
                        setEmailError('Invalid email format');
                        break;
                    case 'auth/user-disabled':
                        setEmailError('Account disabled. Contact support.');
                        break;
                    case 'auth/too-many-requests':
                        setGeneralError('Too many attempts. Please try again later or reset your password.');
                        break;
                    case 'auth/invalid-credential':
                        // More specific message when credentials are invalid
                        setGeneralError('Your email or password is incorrect. Please try again.');
                        break;
                    case 'auth/invalid-login-credentials':
                        // Similar to invalid-credential
                        setGeneralError('Wrong email or password');
                        break;
                    case 'auth/network-request-failed':
                        setGeneralError('Network issue. Please check your connection and try again.');
                        break;
                    case 'auth/account-exists-with-different-credential':
                        setEmailError('This email is registered with a different sign-in method. Try another option.');
                        break;
                    case 'auth/operation-not-allowed':
                        setGeneralError('This sign-in method is not available. Please try another option.');
                        break;
                    case 'auth/email-already-in-use':
                        setEmailError('Email already registered. Please log in instead of signing up.');
                        break;
                    case 'auth/requires-recent-login':
                        setGeneralError('For security, please log out and log in again before retrying.');
                        break;
                    default:
                        // If we have a Firebase error code but it's not in our list
                        if (errorCode.startsWith('auth/')) {
                            // It's an auth error, but not one we specifically handled
                            if (errorMessage.toLowerCase().includes('password')) {
                                setPasswordError('Password issue. Please try again or reset your password.');
                            } else if (errorMessage.toLowerCase().includes('email')) {
                                setEmailError('Email issue. Please check again.');
                            } else {
                                setGeneralError('Sign-in failed. Please try again.');
                            }
                        } else {
                            // Some other Firebase error
                            setGeneralError('Unable to sign in. Please try again later.');
                        }
                }
            } else if (errorMessage) {
                // We have an error message but no code
                if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
                    setGeneralError('Network issue. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('password')) {
                    setPasswordError('Password issue. Please try again or reset your password.');
                } else if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Email issue. Please check again.');
                } else {
                    setGeneralError('Sign-in failed. Please try again later.');
                }
            } else {
                // Fallback for when we have no useful error information
                setGeneralError('Sign-in failed. Please try again or contact support if the issue persists.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        router.push('/register');
    };

    const handleForgetPassword = () => {
        router.push('/forgot-password');
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View className="flex-1 bg-green-500">
            <View className="flex-1 bg-green-500 rounded-b-3xl p-6 pt-12 pb-12 items-center justify-center">
                <View className="items-center">
                    <Image
                        source={require('@/assets/images/plants.png')}
                        className="w-64 h-64"
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View className="flex-1 px-6 pt-6 -mt-6">
                <View className="bg-white rounded-3xl shadow-md p-6 -mt-12">
                    <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</Text>

                    {generalError ? (
                        <View className="mb-4 p-3 bg-red-50 rounded-lg" testID="general-error-container">
                            <Text className="text-red-600 text-center" testID="general-error">{generalError}</Text>
                        </View>
                    ) : null}

                    <View className="mb-4">
                        <View className={`bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-1 ${emailError ? 'border border-red-400' : ''}`}>
                            <TextInput
                                className="flex-1 text-base text-gray-800"
                                placeholder="Email"
                                placeholderTextColor="#90A4AE"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (emailError) setEmailError('');
                                    // Clear general error when typing in any field
                                    if (generalError) setGeneralError('');
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                testID="email-input"
                            />
                        </View>
                        {emailError ? (
                            <Text className="text-red-500 text-sm ml-4 mb-2" testID="email-error">{emailError}</Text>
                        ) : (
                            <View className="mb-4" />
                        )}

                        <View className={`bg-green-100 rounded-full h-14 flex-row items-center px-4 mb-3 ${passwordError ? 'border border-red-400' : ''}`}>
                            <TextInput
                                className="flex-1 text-base text-gray-800"
                                placeholder="Password"
                                placeholderTextColor="#90A4AE"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (passwordError) setPasswordError('');
                                    // Clear general error when typing in any field
                                    if (generalError) setGeneralError('');
                                }}
                                secureTextEntry={!isPasswordVisible}
                                testID="password-input"
                            />
                            <TouchableOpacity onPress={togglePasswordVisibility} className="p-2">
                                <Ionicons
                                    name={isPasswordVisible ? "eye-off" : "eye"}
                                    size={20}
                                    color="#66BB6A"
                                />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? (
                            <Text className="text-red-500 text-sm ml-4 mb-2" testID="password-error">{passwordError}</Text>
                        ) : null}

                        <TouchableOpacity onPress={handleForgetPassword} className="items-end mb-3">
                            <Text className="text-green-600 text-sm font-semibold">Forgot password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-green-500 rounded-full h-12 justify-center items-center shadow-md"
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text className="text-white text-base font-semibold">
                                {isLoading ? "Signing in..." : "Login"}
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center items-center my-4">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="text-gray-500 px-4 text-sm">OR</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        <View className="flex-row justify-center space-x-5 mb-6">
                            <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                                <Text className="text-lg font-medium text-gray-800">G</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                                <Text className="text-lg font-medium text-gray-800">F</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="w-14 h-14 rounded-full border border-gray-200 justify-center items-center">
                                <Text className="text-lg font-medium text-gray-800">T</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-center">
                            <Text className="text-gray-500 text-sm">Don't have an account? </Text>
                            <TouchableOpacity onPress={handleSignUp}>
                                <Text className="text-green-600 text-sm font-semibold">Sign up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};