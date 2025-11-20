import { useAuthContext } from '@/context/authContext';
import { canUseGoogleSignIn } from '@/lib/utils/developmentMode';
import { validateGoogleEnvironment } from '@/lib/utils/envValidation';
import { checkNetworkConnectivity, handleLoginError, validateEmail } from '@/lib/utils/loginAuthHelpers';
import { configureGoogleSignIn, signInWithGoogle } from '@/lib/utils/safeGoogleAuth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
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
import GooglePasswordSetupDialog from '../molecules/GooglePasswordSetupDialog';

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

    // Google password setup state
    const [showPasswordSetupDialog, setShowPasswordSetupDialog] = useState(false);
    const [pendingGoogleUserName, setPendingGoogleUserName] = useState('');

    // Animated orbs
    const orb1Anim = useRef(new Animated.Value(0)).current;
    const orb2Anim = useRef(new Animated.Value(0)).current;
    const orb3Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Configure Google Sign-In only if not in Expo Go
        if (canUseGoogleSignIn()) {
            try {
                validateGoogleEnvironment();
                configureGoogleSignIn();
                console.log('Google Sign-In configured successfully');
            } catch (error) {
                console.log('Error configuring Google Sign-In:', error);
            }
        }

        // Start orb animations
        const animateOrb = (anim: Animated.Value, delay: number = 0) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 3000 + delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 3000 + delay,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animateOrb(orb1Anim, 0);
        animateOrb(orb2Anim, 1000);
        animateOrb(orb3Anim, 2000);
    }, []);

    const router = useRouter();
    const { login, loginWithGoogle, doesAccountExist, setGoogleUserPassword, profile } = useAuthContext();

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

            // Login successful - keep dialog visible during navigation
            setTimeout(() => {
                setDialogVisible(false);
                setIsLoading(false);
                router.push('/(protected)/(tabs)/home');
            }, 800);

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

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            showDialog('loading', 'Signing In', 'Connecting to Google...');

            const isConnected = await checkNetworkConnectivity();
            if (!isConnected) {
                setDialogVisible(false);
                showDialog('error', 'Network Error', 'No internet connection. Please check your network and try again.');
                setIsLoading(false);
                return;
            }

            // Sign in with Google
            const googleUser = await signInWithGoogle();

            if (googleUser?.success && googleUser.idToken) {
                setDialogVisible(false);
                showDialog('loading', 'Signing In', 'Authenticating with MealMate...');

                // Use Firebase to sign in with Google credential
                const firebaseUser = await loginWithGoogle(googleUser.idToken);

                if (firebaseUser) {
                    // Close loading dialog
                    setDialogVisible(false);
                    setIsLoading(false);

                    // Wait a bit for profile to be updated
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Check if this is a first-time Google user who needs to set a password
                    // We need to fetch the profile again to get the latest data
                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${await firebaseUser.getIdToken()}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const profileData = await response.json();
                        const userProfile = profileData.user;

                        // If user is a Google user and hasn't set a password, show password setup dialog
                        if (userProfile?.isGoogleUser && !userProfile?.hasPassword) {
                            setPendingGoogleUserName(userProfile.userName || userProfile.firstName || 'User');
                            setShowPasswordSetupDialog(true);
                            return; // Don't navigate yet
                        }
                    }

                    // Navigate to home if password is already set or not needed
                    router.push('/(protected)/(tabs)/home');
                } else {
                    throw new Error('Firebase authentication failed');
                }
            } else if (googleUser?.userCancelled) {
                // User cancelled the sign-in
                setDialogVisible(false);
                setIsLoading(false);
                showDialog('warning', 'Sign-In Cancelled', 'Google sign-in was cancelled.');
                return;
            } else {
                // Sign-in failed
                const errorMessage = googleUser?.error || 'Google sign-in failed - no ID token received';
                throw new Error(errorMessage);
            }

        } catch (error: any) {
            console.log('Google sign-in error:', error);
            setDialogVisible(false);

            let errorMessage = 'Google sign-in failed. Please try again.';
            let errorTitle = 'Sign-In Failed';

            if (error.message) {
                if (error.message.includes('cancelled') || error.message.includes('CANCELLED')) {
                    errorMessage = 'Google sign-in was cancelled.';
                    errorTitle = 'Sign-In Cancelled';
                } else if (error.message.includes('native module not available')) {
                    errorMessage = 'Google Sign-In requires a development build. Please create one using EAS Build.';
                    errorTitle = 'Development Build Required';
                } else if (error.message.includes('NETWORK_ERROR') || error.message.includes('network')) {
                    errorMessage = 'Network error. Please check your connection.';
                    errorTitle = 'Network Error';
                } else if (error.message.includes('Play Services')) {
                    errorMessage = 'Google Play Services is required for Google sign-in.';
                    errorTitle = 'Service Required';
                } else if (error.message.includes('not configured')) {
                    errorMessage = 'Google sign-in is not properly configured. Please contact support.';
                    errorTitle = 'Configuration Error';
                } else {
                    errorMessage = error.message;
                }
            }

            showDialog('error', errorTitle, errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const handleDialogConfirm = () => {
        setDialogVisible(false);
    };

    const handleSetPassword = async (password: string) => {
        try {
            await setGoogleUserPassword(password);
            setShowPasswordSetupDialog(false);
            
            // Show success message
            showDialog('success', 'Password Set Successfully', 'Your account is now secured with a password.');
            
            // Navigate to home after a short delay
            setTimeout(() => {
                setDialogVisible(false);
                router.push('/(protected)/(tabs)/home');
            }, 1500);
        } catch (error: any) {
            throw new Error(error.message || 'Failed to set password');
        }
    };

    const handleSkipPasswordSetup = () => {
        setShowPasswordSetupDialog(false);
        // Navigate to home directly
        router.push('/(protected)/(tabs)/home');
    };

    return (
        <>
            <ImageBackground
                source={require('../../assets/images/authbg.png')}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
                imageStyle={{ opacity: 0.9 }}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1, width: '100%', height: '100%' }}
                >
                    {/* Animated Orbs */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: '20%',
                            left: '10%',
                            transform: [{
                                translateY: orb1Anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 50],
                                }),
                            }],
                        }}
                    >
                        <View className="w-4 h-4 bg-yellow-600/30 rounded-full blur-sm" />
                    </Animated.View>

                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: '15%',
                            right: '8%',
                            transform: [{
                                translateY: orb2Anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -40],
                                }),
                            }],
                        }}
                    >
                        <View className="w-6 h-6 bg-yellow-600/20 rounded-full blur-sm" />
                    </Animated.View>

                    <Animated.View
                        style={{
                            position: 'absolute',
                            bottom: '30%',
                            left: '20%',
                            transform: [{
                                translateX: orb3Anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 30],
                                }),
                            }],
                        }}
                    >
                        <View className="w-3 h-3 bg-yellow-600/40 rounded-full blur-sm" />
                    </Animated.View>

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
                                    <View className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-yellow-600">
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
                                <View className='py-4 pb-6 pt-0'>
                                    <TouchableOpacity onPress={handleForgetPassword} className="items-end">
                                        <Text className="text-yellow-600 text-sm font-semibold">Forgot password?</Text>
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
                                {canUseGoogleSignIn() && (
                                    <Text className="text-zinc-400 text-center text-sm mb-6">or continue with</Text>
                                )}

                                {/* Social Login Buttons */}
                                {canUseGoogleSignIn() && (
                                    <View className="flex-row gap-4 justify-center mb-8">
                                        <TouchableOpacity
                                            className="flex-row items-center justify-center bg-white rounded-full h-14 px-6 overflow-hidden"
                                            onPress={handleGoogleSignIn}
                                            disabled={isLoading}
                                        >
                                            <Image
                                                source={require('../../assets/images/googlelogo.png')}
                                                className="w-6 h-6 mr-3"
                                                resizeMode="contain"
                                            />
                                            <Text className="text-gray-800 text-base font-semibold">
                                                Continue with Google
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Expo Go Notice */}
                                {!canUseGoogleSignIn() && (
                                    <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons name="information-circle" size={20} color="#f59e0b" />
                                            <Text className="text-amber-500 font-semibold ml-2">Development Mode</Text>
                                        </View>
                                        <Text className="text-amber-200 text-sm leading-5">
                                            Google Sign-In requires a development build. Create one with{' '}
                                            <Text className="font-mono text-amber-300">`eas build --profile development`</Text>{' '}
                                            to test this feature.
                                        </Text>
                                    </View>
                                )}

                                {/* Sign Up Link */}
                                <View className="flex-row justify-center items-center">
                                    <Text className="text-zinc-400 text-sm">Don't have an account? </Text>
                                    <TouchableOpacity onPress={handleSignUp}>
                                        <Text className="text-yellow-600 text-sm font-bold">Sign Up</Text>
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

            {/* Google Password Setup Dialog */}
            <GooglePasswordSetupDialog
                visible={showPasswordSetupDialog}
                onPasswordSet={handleSetPassword}
                onSkip={handleSkipPasswordSetup}
                userName={pendingGoogleUserName}
            />
        </>
    );
}