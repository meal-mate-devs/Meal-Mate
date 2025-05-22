// app/(auth)/signup.tsx (or wherever your registration form is located)
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

export default function RegistrationForm() {
    // Existing state variables
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Error states
    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

    const router = useRouter();
    const { register, doesAccountExist } = useAuthContext();

    // Regex for validations
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;

    // Clear all errors
    const clearErrors = () => {
        setEmailError('');
        setUsernameError('');
        setPhoneError('');
        setPasswordError('');
        setConfirmPasswordError('');
    };

    // Helper function to check network connectivity (keeping your existing implementation)
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

    // Helper for network-related errors (keeping your existing implementation)
    const isNetworkRelatedError = (error: any): boolean => {
        // Your existing implementation
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

    // Show dialog helper function
    const showDialog = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string = '') => {
        setDialogType(type);
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const handleSignup = async () => {
        // Clear previous errors
        clearErrors();

        // Client-side validation
        let hasError = false;

        if (!email.trim()) {
            setEmailError('Please enter your email address');
            hasError = true;
        } else if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            hasError = true;
        }

        if (!username.trim()) {
            setUsernameError('Please enter a username');
            hasError = true;
        }

        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
            setPhoneError('Please enter a valid phone number');
            hasError = true;
        }

        if (!password.trim()) {
            setPasswordError('Please enter a password');
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
            hasError = true;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
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
            showDialog('loading', 'Creating Account', 'Please wait while we set up your account...');

            // Check if account already exists
            let accountExists = false;

            try {
                const accountCheckPromise = doesAccountExist(email.trim());
                const accountCheckWithTimeout = Promise.race([
                    accountCheckPromise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Account check timed out')), 10000)
                    )
                ]);

                accountExists = await accountCheckWithTimeout as boolean;

                if (accountExists) {
                    setIsLoading(false);
                    setDialogVisible(false);
                    setEmailError('Account already exists. Please login instead.');
                    return;
                }
            } catch (accountCheckError) {
                console.log('Account check error:', accountCheckError);

                const isStillConnected = await checkNetworkConnectivity();
                if (!isStillConnected) {
                    setIsLoading(false);
                    setDialogVisible(false);
                    showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                    return;
                }

                if (isNetworkRelatedError(accountCheckError)) {
                    setIsLoading(false);
                    setDialogVisible(false);
                    showDialog('error', 'Network Error', 'Network error while checking your account. Please check your connection and try again.');
                    return;
                }

                let errorMessage = '';
                if (typeof accountCheckError === 'object' && accountCheckError !== null) {
                    errorMessage = (accountCheckError as any).message || accountCheckError.toString();
                } else {
                    errorMessage = String(accountCheckError);
                }

                setIsLoading(false);
                setDialogVisible(false);

                if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Error validating email. Please check your email and try again.');
                } else if (errorMessage.toLowerCase().includes('timeout') ||
                    errorMessage.toLowerCase().includes('timed out')) {
                    showDialog('error', 'Request Timeout', 'Request timed out. Please try again later.');
                } else {
                    showDialog('error', 'Account Check Error', 'Error checking account. Please try again later.');
                }
                return;
            }

            // Attempt registration
            await register(email.trim(), password.trim());

            setIsLoading(false);
            showDialog('success', 'Congratulations!', 'Your account has been created successfully.');

            // After showing success dialog, we'll navigate to verify-email page when user confirms
        } catch (error) {
            console.log('Registration error:', error);
            setIsLoading(false);
            setDialogVisible(false);

            // Check if we lost connection during registration
            const isStillConnected = await checkNetworkConnectivity();
            if (!isStillConnected) {
                showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                return;
            }

            // Extract error message and code properly
            let errorMessage = '';
            let errorCode = '';

            // Type guard for error
            if (typeof error === 'object' && error !== null) {
                const errorStr = (error as { message?: string }).message ?? error.toString();
                if (errorStr.includes('FirebaseError:')) {
                    const match = errorStr.match(/\(([^)]+)\)/);
                    if (match && match[1]) {
                        errorCode = match[1];
                    }
                    errorMessage = errorStr;
                } else {
                    errorMessage = (error as { message?: string }).message || '';
                    errorCode = (error as { code?: string }).code || '';
                }
            } else {
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
                    case 'auth/email-already-in-use':
                        setEmailError('This email is already registered. Please login instead.');
                        break;
                    case 'auth/invalid-email':
                        setEmailError('Invalid email format');
                        break;
                    case 'auth/weak-password':
                        setPasswordError('Password is too weak. Please use a stronger password.');
                        break;
                    case 'auth/operation-not-allowed':
                        showDialog('error', 'Registration Error', 'Registration is currently not allowed. Please try again later.');
                        break;
                    case 'auth/network-request-failed':
                        showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                        break;
                    case 'auth/invalid-credential':
                        showDialog('error', 'Invalid Credentials', 'Invalid credentials. Please check your information and try again.');
                        break;
                    case 'auth/too-many-requests':
                        showDialog('warning', 'Too Many Attempts', 'Too many attempts. Please try again later.');
                        break;
                    default:
                        if (errorCode.startsWith('auth/')) {
                            if (errorMessage.toLowerCase().includes('password')) {
                                setPasswordError('Password issue. Please try again with a different password.');
                            } else if (errorMessage.toLowerCase().includes('email')) {
                                setEmailError('Email issue. Please check again.');
                            } else {
                                showDialog('error', 'Registration Failed', 'Registration failed. Please try again.');
                            }
                        } else {
                            showDialog('error', 'Registration Error', 'Unable to register. Please try again later.');
                        }
                }
            } else if (errorMessage) {
                if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('connection')) {
                    showDialog('error', 'Network Error', 'Network issue. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('password')) {
                    setPasswordError('Password issue. Please try with a different password.');
                } else if (errorMessage.toLowerCase().includes('email')) {
                    setEmailError('Email issue. Please check again.');
                } else {
                    showDialog('error', 'Registration Failed', 'Registration failed. Please try again later.');
                }
            } else {
                showDialog('error', 'Registration Failed', 'Registration failed. Please try again or contact support if the issue persists.');
            }
        }
    };

    const handleDialogConfirm = () => {
        setDialogVisible(false);

        if (dialogType === 'success') {
            router.push('/(auth)/verify-email');
        }
    };

    const handleSignIn = () => {
        router.push('/(auth)/login');
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
    };

    return (
        <ImageBackground 
            source={require('../../assets/images/authbg.png')} 
            resizeMode="cover" 
            style={{ width: '100%', height: '100%' }}  // Explicit dimensions
            imageStyle={{ opacity: 0.7 }}  // Makes overlay more effective
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
                            <Text className="text-center text-white text-4xl font-bold mb-6">
                                Create An Account
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

                            {/* Email Input */}
                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="Email"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (emailError) setEmailError('');
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {emailError ? (
                                    <Text className="text-red-500 text-s ml-4 mt-1">{emailError}</Text>
                                ) : null}
                            </View>

                            {/* Username Input */}
                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="Username"
                                        placeholderTextColor="#9CA3AF"
                                        value={username}
                                        onChangeText={(text) => {
                                            setUsername(text);
                                            if (usernameError) setUsernameError('');
                                        }}
                                        autoCapitalize="none"
                                    />
                                </View>
                                {usernameError ? (
                                    <Text className="text-red-500 text-s ml-4 mt-1">{usernameError}</Text>
                                ) : null}
                            </View>

                            {/* Phone Number Input */}
                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="Phone Number"
                                        placeholderTextColor="#9CA3AF"
                                        value={phoneNumber}
                                        onChangeText={(text) => {
                                            setPhoneNumber(text);
                                            if (phoneError) setPhoneError('');
                                        }}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                {phoneError ? (
                                    <Text className="text-red-500 text-s ml-4 mt-1">{phoneError}</Text>
                                ) : null}
                            </View>

                            {/* Password Input */}
                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
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

                            {/* Confirm Password Input */}
                            <View className="mb-6">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#9CA3AF"
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (confirmPasswordError) setConfirmPasswordError('');
                                        }}
                                        secureTextEntry={!isConfirmPasswordVisible}
                                    />
                                    <TouchableOpacity onPress={toggleConfirmPasswordVisibility}>
                                        <Ionicons
                                            name={isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#FFFFFF"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {confirmPasswordError ? (
                                    <Text className="text-red-500 text-s ml-4 mt-1">{confirmPasswordError}</Text>
                                ) : null}
                            </View>

                            {/* Sign Up Button - Updated with Gradient */}
                            <TouchableOpacity
                                className="rounded-full h-14 justify-center items-center mb-4 overflow-hidden"
                                onPress={handleSignup}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#FBBF24', '#F97416']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="w-full h-full absolute"
                                />
                                <Text className="text-white text-base font-bold">
                                    Sign Up
                                </Text>
                            </TouchableOpacity>

                            {/* Already have account */}
                            <View className="flex-row justify-center items-center">
                                <Text className="text-gray-400 text-sm">Already have an account? </Text>
                                <TouchableOpacity onPress={handleSignIn}>
                                    <Text className="text-yellow-400 text-sm font-bold">Sign In</Text>
                                </TouchableOpacity>
                            </View>
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
                        confirmText={dialogType === 'success' ? 'Continue' : 'OK'}
                    />
                </KeyboardAvoidingView>
            </LinearGradient>
        </ImageBackground>
    );
}