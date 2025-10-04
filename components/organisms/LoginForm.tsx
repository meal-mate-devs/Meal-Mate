import { useAuthContext } from '@/context/authContext';
import { checkNetworkConnectivity, handleLoginError, validateEmail } from '@/lib/utils/loginAuthHelpers';
import { Ionicons } from '@expo/vector-icons';
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
    const [isLoading, setIsLoading] = useState(false);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

    const router = useRouter();
    const { login, googleLogin, doesAccountExist } = useAuthContext();

    const clearErrors = () => {
        setEmailError('');
        setPasswordError('');
    };

    const showDialog = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string = '') => {
        setDialogType(type);
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const handleLogin = async () => {
        clearErrors();

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

        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
            showDialog('error', 'Network Error', 'No internet connection. Please check your network and try again.');
            return;
        }

        try {
            setIsLoading(true);
            showDialog('loading', 'Signing In', 'Please wait while we sign you in...');

            if (email.includes('@')) {
                const domain = email.substring(email.indexOf('@') + 1);
                if (!domain.includes('.') || domain.length < 3) {
                    setDialogVisible(false);
                    setEmailError('The email domain is invalid');
                    setIsLoading(false);
                    return;
                }

                const disposableDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com'];
                if (disposableDomains.includes(domain)) {
                    setDialogVisible(false);
                    setEmailError('Disposable email addresses are not allowed');
                    setIsLoading(false);
                    return;
                }

                try {
                    const accountCheckPromise = doesAccountExist(email.trim());
                    const accountCheckWithTimeout = Promise.race([
                        accountCheckPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Account check timed out')), 10000))
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

                    const isStillConnected = await checkNetworkConnectivity();
                    if (!isStillConnected) {
                        showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                        setIsLoading(false);
                        return;
                    }

                    handleLoginError(accountCheckError, setEmailError, setPasswordError, showDialog);
                    setIsLoading(false);
                    return;
                }
            }

            const userCredential = await login(email.trim(), password.trim());

            if (userCredential && !userCredential.emailVerified) {
                setDialogVisible(false);
                showDialog('warning', 'Email Not Verified', 'Please verify your email address before continuing. Check your inbox for the verification email.');
                return;
            }

            setDialogVisible(false);
            showDialog('success', 'Success!', 'You have been successfully logged in.');

            setTimeout(() => {
                setDialogVisible(false);
                router.push('/(protected)/(tabs)/home');
            }, 1500);

        } catch (error) {
            console.log('Login error:', error);
            setDialogVisible(false);
            handleLoginError(error, setEmailError, setPasswordError, showDialog);
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

    // Handle Google Sign In
    const onGoogleSignInPress = async () => {
        try {
            setIsLoading(true);
            showDialog('loading', 'Signing In with Google', 'Please wait...');

            const isConnected = await checkNetworkConnectivity();
            if (!isConnected) {
                setDialogVisible(false);
                showDialog('error', 'Network Error', 'No internet connection. Please check your network and try again.');
                return;
            }

            const userCredential = await googleLogin();

            if (!userCredential) {
                // User cancelled the sign-in
                setDialogVisible(false);
                return;
            }

            setDialogVisible(false);
            showDialog('success', 'Success!', 'You have been successfully logged in with Google.');

            setTimeout(() => {
                setDialogVisible(false);
                router.push('/(protected)/(tabs)/home');
            }, 1500);

        } catch (error) {
            console.log('Google Sign-In error:', error);
            setDialogVisible(false);
            showDialog('error', 'Google Sign-In Failed', 'An error occurred during Google Sign-In. Please try again.');
        } finally {
            setIsLoading(false);
        }
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

                                {/* Forget Password */}
                                <View className='py-4 pb-6'>
                                    <TouchableOpacity onPress={handleForgetPassword} className="items-end">
                                        <Text className="text-yellow-400 text-sm font-semibold">Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Sign In Button - Now with Gradient */}
                                <TouchableOpacity
                                    className="rounded-full h-14 justify-center items-center mb-4 mt-6 overflow-hidden"
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
                                {/* <View className="flex-row items-center justify-center mb-8">
                                    <View className="h-px bg-zinc-700 flex-1" />
                                </View> */}

                                {/* Or continue with */}
                                <Text className="text-zinc-400 text-center text-sm mb-3">or continue with</Text>

                                {/* Google Sign-In Button */}
                                <TouchableOpacity
                                    className="flex-row items-center justify-center bg-white rounded-full h-14 mb-8 px-4"
                                    onPress={onGoogleSignInPress}
                                    disabled={isLoading}
                                >
                                    <Image
                                        source={require('../../assets/images/googlelogo.png')}
                                        className="w-6 h-6 mr-3"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-gray-800 font-semibold text-base">
                                        Continue with Google
                                    </Text>
                                </TouchableOpacity>

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