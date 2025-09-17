import { useAuthContext } from '@/context/authContext';
import { getAuthErrorMessage } from '@/lib/utils/registerErrorHandlers';
import { getProfileImagePermission, validateSignupForm } from '@/lib/utils/registerValidation';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import * as ImagePicker from 'expo-image-picker';
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

    const router = useRouter();
    const { register, doesAccountExist } = useAuthContext() as {
        register: (email: string, password: string, username: string, firstName: string, lastName: string, age: number, gender: string, dateOfBirth: string, phoneNumber: string, profileImage: any) => Promise<any>,
        doesAccountExist: (email: string) => Promise<boolean>
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
                const { errorCode, errorMessage } = getAuthErrorMessage(accountCheckError);
                if (errorCode === 'network-error') {
                    showDialog('error', 'Network Error', 'Network error while checking your account. Please check your connection and try again.');
                } else if (errorMessage.toLowerCase().includes('timeout')) {
                    showDialog('error', 'Request Timeout', 'Request timed out. Please try again later.');
                } else {
                    showDialog('error', 'Account Check Error', 'Error checking account. Please try again later.');
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

    // Helper function to format date string as YYYY-MM-DD
    const formatDateString = (date: Date) => {
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            return '';
        }
    };
    
    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateOfBirth(formatDateString(selectedDate));
            if (dateOfBirthError) setDateOfBirthError('');
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
            imageStyle={{ opacity: 0.7 }}
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
                                <TouchableOpacity onPress={pickImage}>
                                    <View className="w-36 h-36 rounded-full overflow-hidden border-2 border-yellow-400">
                                        <Image
                                            source={profileImage ? { uri: profileImage.uri } : require('../../assets/images/avatar.png')}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                        {!profileImage && (
                                            <View className="absolute inset-0 bg-black bg-opacity-20 items-center justify-center">
                                                <Ionicons name="camera" size={28} color="#FFFFFF" />
                                                <Text className="text-white text-xs mt-1">Tap to upload</Text>
                                            </View>
                                        )}
                                        {profileImage && (
                                            <View className="absolute bottom-0 right-0 bg-yellow-400 rounded-full p-1">
                                                <Ionicons name="checkmark" size={18} color="#000000" />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                                {imageError ? (
                                    <Text className="text-red-500 text-s mt-1">{imageError}</Text>
                                ) : null}
                                <View className="flex-row mt-2">
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        className="bg-zinc-800 rounded-full py-1 px-3 mr-2 flex-row items-center"
                                    >
                                        <Ionicons name="images-outline" size={16} color="#FFFFFF" />
                                        <Text className="text-white text-xs ml-1">Gallery</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={takePicture}
                                        className="bg-zinc-800 rounded-full py-1 px-3 flex-row items-center"
                                    >
                                        <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                                        <Text className="text-white text-xs ml-1">Camera</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

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

                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="happy-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="First Name"
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

                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="Last Name"
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

                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                                    <TextInput
                                        className="flex-1 text-white text-base ml-3"
                                        placeholder="Age"
                                        placeholderTextColor="#9CA3AF"
                                        value={age}
                                        onChangeText={(text) => {
                                            // Only allow numbers
                                            const numericText = text.replace(/[^0-9]/g, '');
                                            setAge(numericText);
                                            if (ageError) setAgeError('');
                                        }}
                                        keyboardType="numeric"
                                        maxLength={3}
                                    />
                                </View>
                                {ageError ? (
                                    <Text className="text-red-500 text-s ml-4 mt-1">{ageError}</Text>
                                ) : null}
                            </View>

                            {/* Gender Selection */}
                            <View className="mb-4">
                                <TouchableOpacity
                                    onPress={() => setShowGenderPicker(!showGenderPicker)}
                                    className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center justify-between px-5 h-14 border border-zinc-700"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="person-circle-outline" size={20} color="#FFFFFF" />
                                        <Text className="text-white text-base ml-3">
                                            {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Select Gender'}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={showGenderPicker ? "chevron-up-outline" : "chevron-down-outline"}
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                </TouchableOpacity>

                                {showGenderPicker && (
                                    <View className="mt-1 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                                        <TouchableOpacity
                                            onPress={() => handleSelectGender('male')}
                                            className="flex-row items-center px-5 py-3"
                                        >
                                            <Ionicons
                                                name={gender === 'male' ? "radio-button-on" : "radio-button-off"}
                                                size={20}
                                                color={gender === 'male' ? "#FBBF24" : "#FFFFFF"}
                                            />
                                            <Text className="text-white text-base ml-3">Male</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleSelectGender('female')}
                                            className="flex-row items-center px-5 py-3"
                                        >
                                            <Ionicons
                                                name={gender === 'female' ? "radio-button-on" : "radio-button-off"}
                                                size={20}
                                                color={gender === 'female' ? "#FBBF24" : "#FFFFFF"}
                                            />
                                            <Text className="text-white text-base ml-3">Female</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleSelectGender('other')}
                                            className="flex-row items-center px-5 py-3"
                                        >
                                            <Ionicons
                                                name={gender === 'other' ? "radio-button-on" : "radio-button-off"}
                                                size={20}
                                                color={gender === 'other' ? "#FBBF24" : "#FFFFFF"}
                                            />
                                            <Text className="text-white text-base ml-3">Other</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {genderError ? (
                                    <Text className="text-red-500 text-s ml-4 mt-1">{genderError}</Text>
                                ) : null}
                            </View>

                            {/* Date of Birth */}
                            <View className="mb-4">
                                <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                                    <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                                    <TouchableOpacity 
                                        className="flex-1"
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text className="text-white text-base ml-3">
                                            {dateOfBirth ? dateOfBirth : "Select Date of Birth"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
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

                            <View className="flex-row justify-center items-center">
                                <Text className="text-gray-400 text-sm">Already have an account? </Text>
                                <TouchableOpacity onPress={handleSignIn}>
                                    <Text className="text-yellow-400 text-sm font-bold">Sign In</Text>
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