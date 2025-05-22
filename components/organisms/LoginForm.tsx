// app/(auth)/login.tsx
import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Dialog from '../atoms/Dialog';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

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

    // Helper to identify network-related issues in errors - reusing your existing function
    const isNetworkRelatedError = (error: any): boolean => {
        if (!error) return false;

        let errorMessage = '';
        let errorCode = '';

        if (typeof error === 'object') {
            errorMessage = error.message || error.toString();
            errorCode = error.code || '';

            if (error.name === 'TimeoutError') return true;

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

    const handleLogin = async () => {
        // Clear previous errors
        clearErrors();

        // Client-side validation
        let hasError = false;

        if (!email.trim()) {
            setEmailError('Please enter your email or username');
            hasError = true;
        } else if (email.includes('@') && !validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            hasError = true;
        }

        if (!password.trim()) {
            setPasswordError('Please enter your password');
            hasError = true;
        }

        if (hasError) return;

        // Check network connectivity before proceeding
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
            showDialog('error', 'Network Error', 'No internet connection. Please check your network and try again.');
            return;
        }

        try {
            setIsLoading(true);
            showDialog('loading', 'Signing In', 'Please wait while we sign you in...');

            // If email contains @, perform additional validations
            if (email.includes('@')) {
                // Basic domain validation
                const domain = email.substring(email.indexOf('@') + 1);
                if (!domain.includes('.') || domain.length < 3) {
                    setDialogVisible(false);
                    setEmailError('The email domain is invalid');
                    setIsLoading(false);
                    return;
                }

                // Check for disposable email domains
                const disposableDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com'];
                if (disposableDomains.includes(domain)) {
                    setDialogVisible(false);
                    setEmailError('Disposable email addresses are not allowed');
                    setIsLoading(false);
                    return;
                }

                // Check if account exists before attempting login
                try {
                    // Set a timeout for the account check
                    const accountCheckPromise = doesAccountExist(email.trim());
                    const accountCheckWithTimeout = Promise.race([
                        accountCheckPromise,
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Account check timed out')), 10000)
                        )
                    ]);

                    const accountExists = await accountCheckWithTimeout as boolean;

                    if (!accountExists) {
                        setDialogVisible(false);
                        setEmailError('Account does not exist. Please sign up first.');
                        setIsLoading(false);
                        return;
                    }
                } catch (accountCheckError) {
                    console.log('Account check error:', accountCheckError);

                    setDialogVisible(false);

                    // Check again if we lost connection during the account check
                    const isStillConnected = await checkNetworkConnectivity();
                    if (!isStillConnected) {
                        showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                        setIsLoading(false);
                        return;
                    }

                    // Process the error from account check
                    if (isNetworkRelatedError(accountCheckError)) {
                        showDialog('error', 'Network Error', 'Network error while checking your account. Please check your connection and try again.');
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
                        showDialog('error', 'Request Timeout', 'Request timed out. Please try again later.');
                    } else {
                        showDialog('error', 'Account Check Error', 'Error checking account. Please try again later.');
                    }

                    setIsLoading(false);
                    return;
                }
            }

            // Attempt login
            await login(email.trim(), password.trim());

            // Show success dialog before navigating
            setDialogVisible(false);
            showDialog('success', 'Success!', 'You have been successfully logged in.');

            // Navigate after a short delay to show the success message
            setTimeout(() => {
                setDialogVisible(false);
                router.push('/(protected)/(tabs)/home');
            }, 1500);

        } catch (error) {
            console.log('Login error:', error);
            setDialogVisible(false);

            // Check if we lost connection during login
            const isStillConnected = await checkNetworkConnectivity();
            if (!isStillConnected) {
                showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
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
                showDialog('error', 'Network Error', 'Network error. Please check your internet connection and try again.');
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
                        showDialog('error', 'Account Disabled', 'Your account has been disabled. Please contact support.');
                        break;
                    case 'auth/too-many-requests':
                        showDialog('warning', 'Too Many Attempts', 'Too many attempts. Please try again later or reset your password.');
                        break;
                    case 'auth/invalid-credential':
                    case 'auth/invalid-login-credentials':
                        showDialog('error', 'Invalid Credentials', 'Your email/username or password is incorrect. Please try again.');
                        break;
                    case 'auth/network-request-failed':
                        showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                        break;
                    case 'auth/account-exists-with-different-credential':
                        showDialog('error', 'Sign-in Method Error', 'This email is registered with a different sign-in method. Try another option.');
                        break;
                    case 'auth/operation-not-allowed':
                        showDialog('error', 'Sign-in Error', 'This sign-in method is not available. Please try another option.');
                        break;
                    case 'auth/requires-recent-login':
                        showDialog('warning', 'Session Expired', 'For security, please log out and log in again before retrying.');
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
                                showDialog('error', 'Sign-in Failed', 'Sign-in failed. Please try again.');
                            }
                        } else {
                            // Some other Firebase error
                            showDialog('error', 'Sign-in Error', 'Unable to sign in. Please try again later.');
                        }
                }
            } else if (errorMessage) {
                // We have an error message but no code
                if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
                    showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('password')) {
                    setPasswordError('Password issue. Please try again or reset your password.');
                } else if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Email issue. Please check again.');
                } else {
                    showDialog('error', 'Sign-in Failed', 'Sign-in failed. Please try again later.');
                }
            } else {
                // Fallback for when we have no useful error information
                showDialog('error', 'Sign-in Failed', 'Sign-in failed. Please try again or contact support if the issue persists.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        router.push('/(auth)/register');
    };

    const handleForgetPassword = () => {
        router.push('/(auth)/forgot-password');
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const toggleRememberMe = () => {
        setRememberMe(!rememberMe);
    };

    const handleDialogConfirm = () => {
        setDialogVisible(false);
    };

    return (
        <>
            <ImageBackground 
                source={require('../../assets/images/authbg.png')} 
                resizeMode="cover" 
                style={{ width: '100%', height: '100%' }}
                imageStyle={{ opacity: 0.8 }}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
                            <View className="flex-1 pt-24 px-6 pb-6">
                                <Text className="text-center text-white text-4xl font-bold mb-16">
                                    Login To Account
                                </Text>

                                <View className="items-center mb-6">
                                    <View className="w-36 h-36 rounded-full overflow-hidden border-2 border-yellow-400">
                                        <Image
                                            source={require('../../assets/images/avatar.png')}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    </View>
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
                                            keyboardType={email.includes('@') ? "email-address" : "default"}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    {emailError ? (
                                        <Text className="text-red-500 text-s ml-4 mt-1">{emailError}</Text>
                                    ) : null}
                                </View>

                                {/* Password Input */}
                                <View className="mb-4">
                                    <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${passwordError ? 'border-red-400' : ''}`}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                                        <TextInput
                                            className="flex-1 text-white text-base ml-3"
                                            placeholder="Password"
                                            placeholderTextColor="#9CA3AF"
                                            value={password}
                                            onChangeText={(text) => {
                                                setPassword(text);
                                                if (passwordError) setPasswordError('');
                                            }}
                                            secureTextEntry={!isPasswordVisible}
                                        />
                                        <TouchableOpacity onPress={togglePasswordVisibility}>
                                            <Ionicons
                                                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color="#FFFFFF"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {passwordError ? (
                                        <Text className="text-red-500 text-s ml-4 mt-1">{passwordError}</Text>
                                    ) : null}
                                </View>

                                {/* Remember Me Checkbox */}
                                <View className='flex-row items-center justify-between py-4 pb-6'>
                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={toggleRememberMe}
                                    >
                                        <View className={`w-5 h-5 rounded-sm mr-3 ${rememberMe ? 'bg-yellow-400' : 'border border-zinc-500'}`}>
                                            {rememberMe && <Ionicons name="checkmark" size={16} color="black" />}
                                        </View>
                                        <Text className="text-zinc-400 text-sm">Remember me</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleForgetPassword} className="items-end">
                                        <Text className="text-yellow-400 text-sm font-semibold">Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Sign In Button - Now with Gradient */}
                                <TouchableOpacity
                                    className="rounded-full h-14 justify-center items-center mb-8 overflow-hidden"
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={['#FBBF24', '#F97416']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="w-full h-full absolute"
                                    />
                                    <Text className="text-white text-base font-bold">
                                        Sign In
                                    </Text>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View className="flex-row items-center justify-center mb-8">
                                    <View className="h-px bg-zinc-700 flex-1" />
                                </View>

                                {/* Or continue with */}
                                <Text className="text-zinc-400 text-center text-sm mb-6">or continue with</Text>

                                {/* Social Login Buttons */}
                                <View className="flex-row gap-4 justify-center mb-8">
                                    <TouchableOpacity className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center">
                                        <Image
                                            source={require('../../assets/images/fblogo.png')}
                                            className="w-8 h-8"
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity className="w-12 h-12 rounded-full bg-white justify-center items-center">
                                        <Image
                                            source={require('../../assets/images/googlelogo.png')}
                                            className="w-8 h-8"
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity className="w-12 h-12 rounded-full bg-white border border-white justify-center items-center">
                                        <Image
                                            source={require('../../assets/images/applelogo.png')}
                                            className="w-8 h-8"
                                            resizeMode="contain"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Sign Up Link */}
                                <View className="flex-row justify-center items-center">
                                    <Text className="text-zinc-400 text-sm">Don't have an account? </Text>
                                    <TouchableOpacity onPress={handleSignUp}>
                                        <Text className="text-yellow-400 text-sm font-bold">Sign Up</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        <Dialog
                            visible={dialogVisible}
                            type={dialogType}
                            title={dialogTitle}
                            message={dialogMessage}
                            onClose={() => setDialogVisible(false)}
                            onConfirm={handleDialogConfirm}
                            confirmText={dialogType === 'success' ? 'Continue' : 'OK'}
                        />
                    </KeyboardAvoidingView>
                </LinearGradient>
            </ImageBackground>
        </>
    );
}