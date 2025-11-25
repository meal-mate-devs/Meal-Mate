import { useAuthContext } from '@/context/authContext';
import { getAuthErrorMessage } from '@/lib/utils/registerErrorHandlers';
import { getProfileImagePermission, validateSignupForm } from '@/lib/utils/registerValidation';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
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

export default function RegistrationForm() {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    interface EnhancedImageAsset {
        uri: string;
        width?: number;
        height?: number;
        fileName?: string;
        type?: string;
        mimeType?: string;
        [key: string]: any;
    }

    const [profileImage, setProfileImage] = useState<EnhancedImageAsset | null>(null);

    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [ageError, setAgeError] = useState('');
    const [genderError, setGenderError] = useState('');
    const [dateOfBirthError, setDateOfBirthError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [imageError, setImageError] = useState('');

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');

    // Animated orbs
    const orb1Anim = useRef(new Animated.Value(0)).current;
    const orb2Anim = useRef(new Animated.Value(0)).current;
    const orb3Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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
    const { register, doesAccountExist, doesUsernameExist, refreshProfile } = useAuthContext() as {
        register: (email: string, password: string, username: string, firstName: string, lastName: string, age: number, gender: string, dateOfBirth: string, phoneNumber: string, profileImage: any) => Promise<any>,
        doesAccountExist: (email: string) => Promise<boolean>,
        doesUsernameExist: (username: string) => Promise<boolean>,
        refreshProfile: () => Promise<void>
    };

    const clearErrors = () => {
        setEmailError('');
        setUsernameError('');
        setFirstNameError('');
        setLastNameError('');
        setAgeError('');
        setGenderError('');
        setDateOfBirthError('');
        setPhoneError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setImageError('');
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const validateCurrentStep = () => {
        clearErrors();
        let hasError = false;

        if (currentStep === 1) {
            // Validate email and username with all checks
            if (!email.trim()) {
                setEmailError('Email is required');
                hasError = true;
            } else {
                // Check for multiple @ symbols
                const atCount = (email.match(/@/g) || []).length;
                if (atCount === 0) {
                    setEmailError('Email must contain @ symbol');
                    hasError = true;
                } else if (atCount > 1) {
                    setEmailError('Email cannot contain multiple @ symbols');
                    hasError = true;
                } else if (!/\S+@\S+\.\S+/.test(email)) {
                    setEmailError('Please enter a valid email address');
                    hasError = true;
                } else {
                    // Extract and validate domain
                    const atIndex = email.indexOf('@');
                    const localPart = email.substring(0, atIndex);
                    const domain = email.substring(atIndex + 1).toLowerCase();
                    
                    // Check if local part exists
                    if (!localPart || localPart.length === 0) {
                        setEmailError('Email must have a username before @');
                        hasError = true;
                    }
                    // Gmail-specific validation
                    else if (domain.includes('gmail')) {
                        // Check if it's exactly gmail.com (not gmail.com.com or other variations)
                        if (domain !== 'gmail.com') {
                            setEmailError('Invalid Gmail address. Must end with @gmail.com');
                            hasError = true;
                        }
                        // Gmail username validation (1-30 characters, only letters, numbers, dots)
                        else if (localPart.length < 1 || localPart.length > 30) {
                            setEmailError('Please input valid email address');
                            hasError = true;
                        }
                        else if (!/^[a-zA-Z0-9.]+$/.test(localPart)) {
                            setEmailError('Gmail username can only contain letters, numbers, and dots');
                            hasError = true;
                        }
                        else if (localPart.startsWith('.') || localPart.endsWith('.')) {
                            setEmailError('Gmail username cannot start or end with a dot');
                            hasError = true;
                        }
                        else if (localPart.includes('..')) {
                            setEmailError('Gmail username cannot contain consecutive dots');
                            hasError = true;
                        }
                    }
                    // General domain validation for non-Gmail addresses
                    else {
                        if (!domain.includes('.') || domain.length < 3) {
                            setEmailError('The email domain is invalid');
                            hasError = true;
                        } else if (domain.startsWith('.') || domain.endsWith('.')) {
                            setEmailError('Domain cannot start or end with a dot');
                            hasError = true;
                        } else if (domain.includes('..')) {
                            setEmailError('Domain cannot contain consecutive dots');
                            hasError = true;
                        } else {
                            // Check for disposable email domains
                            const disposableDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com'];
                            if (disposableDomains.includes(domain)) {
                                setEmailError('Disposable email addresses are not allowed');
                                hasError = true;
                            }
                        }
                    }
                }
            }

            if (!username.trim()) {
                setUsernameError('Username is required');
                hasError = true;
            } else if (username.length < 3) {
                setUsernameError('Username must be at least 3 characters');
                hasError = true;
            }

            // If basic validation passes, check existence
            if (!hasError) {
                return new Promise(async (resolve) => {
                    try {
                        // Check email availability
                        const accountCheckPromise = doesAccountExist(email.trim());
                        const accountCheckWithTimeout = Promise.race([
                            accountCheckPromise,
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Account check timed out')), 10000)
                            )
                        ]);

                        const accountExists = await accountCheckWithTimeout as boolean;

                        if (accountExists) {
                            setEmailError('Account already exists. Please login instead.');
                            resolve(false);
                            return;
                        }

                        // Check username availability
                        const usernameCheckPromise = doesUsernameExist(username.trim());
                        const usernameCheckWithTimeout = Promise.race([
                            usernameCheckPromise,
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Username check timed out')), 10000)
                            )
                        ]);

                        const usernameExists = await usernameCheckWithTimeout as boolean;

                        if (usernameExists) {
                            setUsernameError('Username already taken. Please choose a different username.');
                            resolve(false);
                            return;
                        }

                        resolve(true);
                    } catch (checkError) {
                        console.log('Account/Username check error:', checkError);
                        const isStillConnected = await checkNetworkConnectivity();
                        if (!isStillConnected) {
                            showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                            resolve(false);
                            return;
                        }
                        const { errorCode, errorMessage } = getAuthErrorMessage(checkError);
                        if (errorCode === 'network-error') {
                            showDialog('error', 'Network Error', 'Network error while checking account availability. Please check your connection and try again.');
                        } else if (errorMessage.toLowerCase().includes('timeout')) {
                            showDialog('error', 'Request Timeout', 'Request timed out. Please try again later.');
                        } else {
                            showDialog('error', 'Check Error', 'Error checking account availability. Please try again later.');
                        }
                        resolve(false);
                    }
                });
            }
        } else if (currentStep === 2) {
            // Validate personal details
            if (!firstName.trim()) {
                setFirstNameError('First name is required');
                hasError = true;
            }

            if (!lastName.trim()) {
                setLastNameError('Last name is required');
                hasError = true;
            }

            if (!age.trim()) {
                setAgeError('Age is required');
                hasError = true;
            } else if (parseInt(age) < 13 || parseInt(age) > 120) {
                setAgeError('Age must be between 13 and 120');
                hasError = true;
            }

            if (!gender) {
                setGenderError('Please select your gender');
                hasError = true;
            }

            if (!dateOfBirth) {
                setDateOfBirthError('Please select your date of birth using the date picker');
                hasError = true;
            } else {
                try {
                    // Parse DD-MM-YYYY format
                    const [day, month, year] = dateOfBirth.split('-').map(Number);
                    const birthDate = new Date(year, month - 1, day);
                    const today = new Date();
                    
                    // Check if date is valid
                    if (isNaN(birthDate.getTime()) || day < 1 || day > 31 || month < 1 || month > 12) {
                        setDateOfBirthError('Please enter a valid date');
                        hasError = true;
                    } else {
                        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            calculatedAge--;
                        }
                        
                        if (calculatedAge < 13) {
                            setDateOfBirthError('You must be at least 13 years old');
                            hasError = true;
                        } else if (calculatedAge > 120) {
                            setDateOfBirthError('Please enter a valid date of birth');
                            hasError = true;
                        } else if (birthDate > today) {
                            setDateOfBirthError('Date of birth cannot be in the future');
                            hasError = true;
                        }
                    }
                } catch (error) {
                    setDateOfBirthError('Please enter a valid date in DD-MM-YYYY format');
                    hasError = true;
                }
            }

            if (!phoneNumber.trim()) {
                setPhoneError('Phone number is required');
                hasError = true;
            } else if (phoneNumber.length < 10) {
                setPhoneError('Phone number must be at least 10 digits');
                hasError = true;
            } else if (!/^\+?[\d\s\-\(\)]+$/.test(phoneNumber)) {
                setPhoneError('Please enter a valid phone number');
                hasError = true;
            }
        } else if (currentStep === 3) {
            // Validate password and profile image
            if (!password) {
                setPasswordError('Password is required');
                hasError = true;
            } else if (password.length < 6) {
                setPasswordError('Password must be at least 6 characters');
                hasError = true;
            }

            if (!confirmPassword) {
                setConfirmPasswordError('Please confirm your password');
                hasError = true;
            } else if (password !== confirmPassword) {
                setConfirmPasswordError('Passwords do not match');
                hasError = true;
            }

            if (!profileImage) {
                setImageError('Profile image is required');
                hasError = true;
            }
        }

        return hasError ? false : true;
    };

    const handleNext = async () => {
        const validationResult = validateCurrentStep();

        if (validationResult instanceof Promise) {
            // For step 1, wait for async validation
            const isValid = await validationResult;
            if (isValid) {
                nextStep();
            }
        } else {
            // For other steps, use synchronous validation
            if (validationResult) {
                nextStep();
            }
        }
    };

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

    const showDialog = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string = '') => {
        setDialogType(type);
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const handleSignup = async () => {
        clearErrors();

        const { errors, hasError } = validateSignupForm(
            email,
            username,
            firstName,
            lastName,
            age,
            gender,
            dateOfBirth,
            phoneNumber,
            password,
            confirmPassword
        );

        if (hasError) {
            setEmailError(errors.emailError || '');
            setUsernameError(errors.usernameError || '');
            setFirstNameError(errors.firstNameError || '');
            setLastNameError(errors.lastNameError || '');
            setAgeError(errors.ageError || '');
            setGenderError(errors.genderError || '');
            setDateOfBirthError(errors.dateOfBirthError || '');
            setPhoneError(errors.phoneError || '');
            setPasswordError(errors.passwordError || '');
            setConfirmPasswordError(errors.confirmPasswordError || '');
            return;
        }

        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
            showDialog('error', 'Network Error', 'No internet connection. Please check your network and try again.');
            return;
        }

        try {
            setIsLoading(true);
            showDialog('loading', 'Creating Account', 'Please wait while we set up your account...');

            let accountExists = false;
            let usernameExists = false;
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

                // Check username availability
                const usernameCheckPromise = doesUsernameExist(username.trim());
                const usernameCheckWithTimeout = Promise.race([
                    usernameCheckPromise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Username check timed out')), 10000)
                    )
                ]);

                usernameExists = await usernameCheckWithTimeout as boolean;

                if (usernameExists) {
                    setIsLoading(false);
                    setDialogVisible(false);
                    setUsernameError('Username already taken. Please choose a different username.');
                    return;
                }
            } catch (checkError) {
                console.log('Account/Username check error:', checkError);
                const isStillConnected = await checkNetworkConnectivity();
                if (!isStillConnected) {
                    setIsLoading(false);
                    setDialogVisible(false);
                    showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                    return;
                }
                const { errorCode, errorMessage } = getAuthErrorMessage(checkError);
                if (errorCode === 'network-error') {
                    showDialog('error', 'Network Error', 'Network error while checking account availability. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('timeout')) {
                    showDialog('error', 'Request Timeout', 'Request timed out. Please try again later.');
                } else {
                    showDialog('error', 'Check Error', 'Error checking account availability. Please try again later.');
                }
                setIsLoading(false);
                setDialogVisible(false);
                return;
            }

            console.log('Sending registration request with profileImage:', profileImage ? {
                uri: profileImage.uri,
                type: profileImage.type,
                fileName: profileImage.fileName
            } : 'No image selected');

            const response = await register(
                email.trim(),
                password.trim(),
                username.trim(),
                firstName.trim(),
                lastName.trim(),
                parseInt(age.trim()),
                gender,
                dateOfBirth,
                phoneNumber.trim(),
                profileImage
            );

            console.log('Registration response:', response);
            
            // Refresh the profile to ensure the UI has the latest user data
            try {
                await refreshProfile();
                console.log('Profile refreshed after registration');
            } catch (profileError) {
                console.log('Profile refresh failed after registration:', profileError);
                // Don't fail the registration process if profile refresh fails
            }
            
            setIsLoading(false);
            showDialog('success', 'Account Created!', 'Your account has been created successfully. We\'ve sent a verification email to your inbox. Please verify your email to complete registration.');

        } catch (error) {
            console.log('Registration error:', error);
            setIsLoading(false);
            setDialogVisible(false);

            const isStillConnected = await checkNetworkConnectivity();
            if (!isStillConnected) {
                showDialog('error', 'Network Error', 'Network connection lost. Please check your internet and try again.');
                return;
            }

            const { errorCode, errorMessage } = getAuthErrorMessage(error);
            switch (errorCode) {
                case 'auth/email-already-in-use':
                    setEmailError(errorMessage);
                    break;
                case 'auth/invalid-email':
                    setEmailError(errorMessage);
                    break;
                case 'auth/weak-password':
                    setPasswordError(errorMessage);
                    break;
                case 'network-error':
                    showDialog('error', 'Network Error', errorMessage);
                    break;
                default:
                    showDialog('error', 'Registration Failed', errorMessage);
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

    // Helper function to format date string as DD-MM-YYYY
    const formatDateString = (date: Date) => {
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}-${month}-${year}`;
        } catch (error) {
            return '';
        }
    };

    // Helper function to calculate age from date of birth
    const calculateAgeFromDate = (dateString: string) => {
        try {
            // Parse DD-MM-YYYY format
            const [day, month, year] = dateString.split('-').map(Number);
            const birthDate = new Date(year, month - 1, day);
            const today = new Date();
            
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            
            return calculatedAge.toString();
        } catch (error) {
            return '';
        }
    };
    
    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = formatDateString(selectedDate);
            setDateOfBirth(formattedDate);
            
            // Automatically calculate and set age
            const calculatedAge = calculateAgeFromDate(formattedDate);
            console.log('Date selected:', formattedDate, 'Calculated age:', calculatedAge);
            setAge(calculatedAge);
            
            if (dateOfBirthError) setDateOfBirthError('');
            if (ageError) setAgeError('');
        }
    };

    const handleSelectGender = (selectedGender: 'male' | 'female' | 'other') => {
        setGender(selectedGender);
        setShowGenderPicker(false);
        if (genderError) setGenderError('');
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            setImageError('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: false,
            exif: false,
        });

        if (!result.canceled) {
            const asset = result.assets[0];

            const fileExtension = asset.uri.split('.').pop();
            const fileName = `profile_${Date.now()}.${fileExtension}`;

            const enhancedImage: EnhancedImageAsset = {
                uri: asset.uri,
                width: asset.width,
                height: asset.height,
                fileName: fileName,
                type: `image/${fileExtension}`,
                mimeType: asset.mimeType || `image/${fileExtension}`,
                fileSize: asset.fileSize,
                assetId: asset.assetId
            };

            console.log('Selected image:', enhancedImage);
            setProfileImage(enhancedImage);
            setImageError('');
        }
    };

    const takePicture = async () => {
        const permission = await getProfileImagePermission('camera');
        if (!permission.granted) {
            setImageError(permission.error || '');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            // Get the selected asset
            const asset = result.assets[0];

            // Add file extension info if missing
            const fileExtension = asset.uri.split('.').pop();
            const fileName = `profile_${Date.now()}.${fileExtension}`;

            // Create an EnhancedImageAsset object from the camera image
            const enhancedImage: EnhancedImageAsset = {
                uri: asset.uri,
                width: asset.width,
                height: asset.height,
                fileName: fileName,
                type: `image/${fileExtension}`,
                mimeType: asset.mimeType || `image/${fileExtension}`,
                // Add other properties as needed
                fileSize: asset.fileSize,
                assetId: asset.assetId
            };

            console.log('Captured image:', enhancedImage);
            setProfileImage(enhancedImage);
            setImageError('');
        }
    };

    return (
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
                        <View className="flex-1 pt-32 px-6 pb-6">
                            {/* Header */}
                            <View className="items-center mb-8">
                                <Text className="text-center text-white text-3xl font-bold mb-2">
                                    Create Your Account
                                </Text>
                                <Text className="text-center text-gray-300 text-sm">
                                    Join Meal Mate and start your healthy journey
                                </Text>
                            </View>

                            {/* Progress Indicator */}
                            <View className="flex-row justify-center items-center mb-8">
                                {[1, 2, 3].map((step) => (
                                    <View key={step} className="flex-row items-center">
                                        <View
                                            className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                                                step <= currentStep
                                                    ? 'bg-yellow-600 border-yellow-600'
                                                    : 'bg-zinc-800 border-zinc-600'
                                            }`}
                                        >
                                            {step < currentStep ? (
                                                <Ionicons name="checkmark" size={20} color="#000000" />
                                            ) : (
                                                <Text className={`font-bold ${
                                                    step <= currentStep ? 'text-black' : 'text-zinc-400'
                                                }`}>
                                                    {step}
                                                </Text>
                                            )}
                                        </View>
                                        {step < 3 && (
                                            <View
                                                className={`w-12 h-0.5 mx-2 ${
                                                    step < currentStep ? 'bg-yellow-600' : 'bg-zinc-600'
                                                }`}
                                            />
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* Step Content */}
                            {currentStep === 1 && (
                                <View className="space-y-8">
                                    {/* Email Field */}
                                    <View className="mb-4 mx-2 my-1">
                                        <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${emailError ? 'border-red-400' : ''}`}>
                                            <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                                            <TextInput
                                                className="flex-1 text-white text-base ml-3"
                                                placeholder="Enter your email"
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

                                    {/* Username Field */}
                                    <View className="mb-4 mx-2 my-1">
                                        <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${usernameError ? 'border-red-400' : ''}`}>
                                            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                                            <TextInput
                                                className="flex-1 text-white text-base ml-3"
                                                placeholder="Choose a username"
                                                placeholderTextColor="#9CA3AF"
                                                value={username}
                                                onChangeText={(text) => {
                                                    setUsername(text);
                                                    if (usernameError) setUsernameError('');
                                                }}
                                                onBlur={async () => {
                                                    const trimmedUsername = username.trim();
                                                    if (trimmedUsername.length > 0) {
                                                        try {
                                                            const exists = await doesUsernameExist(trimmedUsername);
                                                            if (exists) {
                                                                setUsernameError('Username already taken. Please choose a different username.');
                                                            } else {
                                                                if (usernameError) setUsernameError('');
                                                            }
                                                        } catch (error) {
                                                            console.log('Username check error:', error);
                                                        }
                                                    }
                                                }}
                                                autoCapitalize="none"
                                            />
                                        </View>
                                        {usernameError ? (
                                            <Text className="text-red-500 text-s ml-4 mt-1">{usernameError}</Text>
                                        ) : null}
                                    </View>
                                </View>
                            )}

                            {currentStep === 2 && (
                                <View className="space-y-8">
                                    {/* Name Fields - Side by Side */}
                                    <View className="flex-row space-x-4 mx-2">
                                        <View className="flex-1 mb-4 my-1 mr-2">
                                            <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${firstNameError ? 'border-red-400' : ''}`}>
                                                <Ionicons name="happy-outline" size={20} color="#FFFFFF" />
                                                <TextInput
                                                    className="flex-1 text-white text-base ml-3"
                                                    placeholder="First name"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={firstName}
                                                    onChangeText={(text) => {
                                                        setFirstName(text);
                                                        if (firstNameError) setFirstNameError('');
                                                    }}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                            {firstNameError ? (
                                                <Text className="text-red-500 text-s ml-4 mt-1">{firstNameError}</Text>
                                            ) : null}
                                        </View>

                                        <View className="flex-1 mb-4 my-1 mr-1">
                                            <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${lastNameError ? 'border-red-400' : ''}`}>
                                                <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                                                <TextInput
                                                    className="flex-1 text-white text-base ml-3"
                                                    placeholder="Last name"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={lastName}
                                                    onChangeText={(text) => {
                                                        setLastName(text);
                                                        if (lastNameError) setLastNameError('');
                                                    }}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                            {lastNameError ? (
                                                <Text className="text-red-500 text-s ml-4 mt-1">{lastNameError}</Text>
                                            ) : null}
                                        </View>
                                    </View>

                                    {/* Age and Gender - Side by Side */}
                                    <View className="flex-row space-x-4 mx-2">
                                        <View className="flex-1 mb-4 my-1 mr-2">
                                            <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${ageError ? 'border-red-400' : ''}`}>
                                                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                                                <TextInput
                                                    className="flex-1 text-white text-base ml-3"
                                                    placeholder="Your age"
                                                    placeholderTextColor="#9CA3AF"
                                                    value={age}
                                                    onChangeText={(text) => {
                                                        const numericText = text.replace(/[^0-9]/g, '');
                                                        setAge(numericText);
                                                        if (ageError) setAgeError('');
                                                    }}
                                                    keyboardType="numeric"
                                                    maxLength={3}
                                                />
                                            </View>
                                            {!age && !ageError ? (
                                                <Text className="text-gray-400 text-xs ml-4 mt-1">Enter manually or select date of birth</Text>
                                            ) : ageError ? (
                                                <Text className="text-red-500 text-s ml-4 mt-1">{ageError}</Text>
                                            ) : null}
                                        </View>

                                        <View className="flex-1 mb-4 my-1 mr-1">
                                            <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${genderError ? 'border-red-400' : ''}`}>
                                                <Ionicons name="person-circle-outline" size={20} color="#FFFFFF" />
                                                <TouchableOpacity
                                                    onPress={() => setShowGenderPicker(!showGenderPicker)}
                                                    className="flex-row items-center justify-between flex-1"
                                                >
                                                    <Text className={`text-base ml-2 ${gender ? 'text-white' : 'text-gray-400'}`}>
                                                        {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Gender'}
                                                    </Text>
                                                    <Ionicons
                                                        name={showGenderPicker ? "chevron-up-outline" : "chevron-down-outline"}
                                                        size={16}
                                                        color="#FFFFFF"
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                            {showGenderPicker && (
                                                <View className="mt-2 bg-white/6 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
                                                    {['male', 'female', 'other'].map((option) => (
                                                        <TouchableOpacity
                                                            key={option}
                                                            onPress={() => handleSelectGender(option as 'male' | 'female' | 'other')}
                                                            className="flex-row items-center px-3 py-2"
                                                        >
                                                            <Ionicons
                                                                name={gender === option ? "radio-button-on" : "radio-button-off"}
                                                                size={16}
                                                                color={gender === option ? "#FACC15" : "#64748B"}
                                                            />
                                                            <Text className={`text-sm ml-2 capitalize ${gender === option ? 'text-white' : 'text-gray-400'}`}>{option}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                            {genderError ? (
                                                <Text className="text-red-500 text-s ml-4 mt-1">{genderError}</Text>
                                            ) : null}
                                        </View>
                                    </View>

                                    {/* Date of Birth */}
                                    <View className="mb-4 mx-2 my-1">
                                        <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${dateOfBirthError ? 'border-red-400' : ''}`}>
                                            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                                            <TouchableOpacity
                                                onPress={() => setShowDatePicker(true)}
                                                className="flex-row items-center flex-1"
                                            >
                                                <Text className={`text-base ml-2 flex-1 ${dateOfBirth ? 'text-white' : 'text-gray-400'}`}>
                                                    {dateOfBirth ? dateOfBirth : "Select your date of birth"}
                                                </Text>
                                                <Ionicons name="chevron-forward-outline" size={16} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        </View>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={dateOfBirth ? (() => {
                                                    try {
                                                        const [day, month, year] = dateOfBirth.split('-').map(Number);
                                                        return new Date(year, month - 1, day);
                                                    } catch {
                                                        return new Date();
                                                    }
                                                })() : new Date()}
                                                mode="date"
                                                display="default"
                                                onChange={handleDateChange}
                                                maximumDate={new Date()}
                                            />
                                        )}
                                        {dateOfBirthError ? (
                                            <Text className="text-red-500 text-s ml-4 mt-1">{dateOfBirthError}</Text>
                                        ) : null}
                                    </View>

                                    {/* Phone Number */}
                                    <View className="mb-4 mx-2 my-1">
                                        <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${phoneError ? 'border-red-400' : ''}`}>
                                            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                                            <TextInput
                                                className="flex-1 text-white text-base ml-3"
                                                placeholder="Your phone number"
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
                                </View>
                            )}

                            {currentStep === 3 && (
                                <View className="space-y-8">
                                    {/* Profile Image */}
                                    <View className="bg-white/6 backdrop-blur-sm rounded-xl p-6 border border-white/10 items-center mx-2 my-1">
                                        <Text className="text-white text-sm font-medium mb-4">Profile Picture</Text>
                                        <TouchableOpacity onPress={pickImage} className="items-center">
                                            <View className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-600 mb-3">
                                                <Image
                                                    source={profileImage ? { uri: profileImage.uri } : require('../../assets/images/avatar.png')}
                                                    className="w-full h-full"
                                                    resizeMode="cover"
                                                />
                                                {!profileImage && (
                                                    <View className="absolute inset-0 bg-black bg-opacity-30 items-center justify-center">
                                                        <Ionicons name="camera" size={24} color="#FFFFFF" />
                                                    </View>
                                                )}
                                                {profileImage && (
                                                    <View className="absolute bottom-0 right-0 bg-yellow-600 rounded-full p-1">
                                                        <Ionicons name="checkmark" size={14} color="#000000" />
                                                    </View>
                                                )}
                                            </View>
                                            <Text className="text-yellow-400 text-sm font-medium">
                                                {profileImage ? 'Change Photo' : 'Add Profile Photo'}
                                            </Text>
                                            <Text className="text-gray-400 text-xs mt-1">Tap to select from gallery</Text>
                                        </TouchableOpacity>
                                        {imageError ? (
                                            <Text className="text-red-400 text-xs mt-2">{imageError}</Text>
                                        ) : null}
                                    </View>

                                    {/* Password Fields */}
                                    <View className="mb-4 mx-2 my-1">
                                        <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${passwordError ? 'border-red-400' : ''}`}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                                            <TextInput
                                                className="flex-1 text-white text-base ml-3"
                                                placeholder="Create a password"
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

                                    <View className="mb-4 mx-2 my-1">
                                        <View className={`bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700 ${confirmPasswordError ? 'border-red-400' : ''}`}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
                                            <TextInput
                                                className="flex-1 text-white text-base ml-3"
                                                placeholder="Confirm your password"
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
                                </View>
                            )}

                            {/* Navigation Buttons */}
                            <View className="flex-row justify-between items-center mt-8">
                                {currentStep > 1 ? (
                                    <TouchableOpacity
                                        onPress={prevStep}
                                        className="w-36 rounded-full h-14 justify-center items-center mb-8 ml-3 overflow-hidden bg-zinc-700"
                                    >
                                        <Text className="text-white text-base font-bold">
                                            Back
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View />
                                )}

                                {currentStep < totalSteps ? (
                                    <TouchableOpacity
                                        onPress={handleNext}
                                        className="w-36 rounded-full h-14 justify-center items-center mb-8 mr-2 overflow-hidden"
                                    >
                                        <LinearGradient
                                            colors={['#FBBF24', '#F97416']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="w-full h-full absolute"
                                        />
                                        <Text className="text-white text-base font-bold">
                                            Next
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={handleSignup}
                                        disabled={isLoading}
                                        className="w-36 rounded-full h-14 justify-center items-center mb-8 overflow-hidden"
                                    >
                                        <LinearGradient
                                            colors={['#FBBF24', '#F97416']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="w-full h-full items-center justify-center"
                                        >
                                            <Text className="text-white text-base font-bold">
                                                {isLoading ? 'Creating...' : 'Create Account'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Sign In Link */}
                            <View className="flex-row justify-center items-center mt-6">
                                <Text className="text-gray-400 text-sm">Already have an account? </Text>
                                <TouchableOpacity onPress={handleSignIn}>
                                    <Text className="text-yellow-600 text-sm font-bold">Sign In</Text>
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
    );
}