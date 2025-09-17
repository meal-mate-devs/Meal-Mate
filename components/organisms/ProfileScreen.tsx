import { useAuthContext } from '@/context/authContext';
import { getProfileImagePermission } from '@/lib/utils/registerValidation';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Dialog from '../atoms/Dialog';

interface EnhancedImageAsset {
    uri: string;
    width?: number;
    height?: number;
    fileName?: string;
    type?: string;
    mimeType?: string;
    [key: string]: any;
}

const ProfileScreen: React.FC = () => {
    const { profile, updateUserProfile, refreshProfile } = useAuthContext();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [userName, setUserName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profileImage, setProfileImage] = useState<EnhancedImageAsset | null>(null);
    const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState<string | null>(null);

    // UI state
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Form errors
    const [formErrors, setFormErrors] = useState({
        userName: '',
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        phoneNumber: ''
    });

    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading');
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');
    const [showGenderPicker, setShowGenderPicker] = useState(false);

    useEffect(() => {
        const loadProfileData = async () => {
            setIsLoading(true);
            try {
                // Only refresh the profile once on component mount
                if (!profile) {
                    await refreshProfile();
                } else {
                    // Initialize form with profile data if it already exists
                    setUserName(profile.userName || '');
                    setFirstName(profile.firstName || '');
                    setLastName(profile.lastName || '');
                    setAge(profile.age ? profile.age.toString() : '');
                    setGender(profile.gender as 'male' | 'female' | 'other' | '' || '');
                    setDateOfBirth(profile.dateOfBirth || '');
                    setPhoneNumber(profile.phoneNumber || '');

                    // Set profile image URL if it exists
                    if (profile.profileImage?.url) {
                        setCurrentProfileImageUrl(profile.profileImage.url);
                    }
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
                showErrorDialog('Failed to load profile. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []); // Remove dependencies to avoid loop

    // Update form fields when profile changes
    useEffect(() => {
        if (profile) {
            setUserName(profile.userName || '');
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');
            setAge(profile.age ? profile.age.toString() : '');
            setGender(profile.gender as 'male' | 'female' | 'other' | '' || '');
            setDateOfBirth(profile.dateOfBirth || '');
            setPhoneNumber(profile.phoneNumber || '');

            // Set profile image URL if it exists
            if (profile.profileImage?.url) {
                setCurrentProfileImageUrl(profile.profileImage.url);
            }
        }
    }, [profile]);    // Handle form submission
    const handleSaveProfile = async () => {
        // Basic validation
        const errors = {
            userName: !userName.trim() ? 'Username is required' : '',
            firstName: !firstName.trim() ? 'First name is required' : '',
            lastName: !lastName.trim() ? 'Last name is required' : '',
            age: !age.trim() ? 'Age is required' : isNaN(Number(age)) ? 'Age must be a number' : '',
            gender: !gender ? 'Gender is required' : '',
            dateOfBirth: !dateOfBirth.trim() ? 'Date of birth is required' : '',
            phoneNumber: !phoneNumber.trim() ? 'Phone number is required' : ''
        };

        setFormErrors(errors);

        // Check if there are any errors
        if (Object.values(errors).some(error => error !== '')) {
            return;
        }

        setIsSaving(true);
        showLoadingDialog('Updating Profile', 'Please wait while we update your profile...');

        try {
            const userData = {
                userName,
                firstName,
                lastName,
                age: Number(age),
                gender,
                dateOfBirth,
                phoneNumber
            };

            const response = await updateUserProfile(userData, profileImage || undefined);
            
            setDialogVisible(false);
            showSuccessDialog('Profile Updated', 'Your profile has been successfully updated.');
            
            // Update the current profile image URL if available in the response
            if (response?.user?.profileImage?.url) {
                console.log('Setting new profile image URL:', response.user.profileImage.url);
                setCurrentProfileImageUrl(response.user.profileImage.url);
                
                // Clear the local profileImage state since we now have the server URL
                setProfileImage(null);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setDialogVisible(false);

            // Check for specific errors
            if (error instanceof Error) {
                if (error.message.includes('Username already taken')) {
                    setFormErrors(prev => ({ ...prev, userName: 'Username already taken' }));
                    showErrorDialog('Username already taken. Please choose another username.');
                } else if (error.message.includes('Phone number already registered')) {
                    setFormErrors(prev => ({ ...prev, phoneNumber: 'Phone number already registered' }));
                    showErrorDialog('Phone number already registered. Please use another number.');
                } else {
                    showErrorDialog('Failed to update profile. Please try again later.');
                }
            } else {
                showErrorDialog('Failed to update profile. Please try again later.');
            }
        } finally {
            setIsSaving(false);
        }
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
            if (formErrors.dateOfBirth) setFormErrors({ ...formErrors, dateOfBirth: '' });
        }
    };

    const handleSelectGender = (selectedGender: 'male' | 'female' | 'other') => {
        setGender(selectedGender);
        setShowGenderPicker(false);
        if (formErrors.gender) {
            setFormErrors(prev => ({ ...prev, gender: '' }));
        }
    };

    // Dialog helper functions
    const showLoadingDialog = (title: string, message: string = '') => {
        setDialogType('loading');
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const showSuccessDialog = (title: string, message: string = '') => {
        setDialogType('success');
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const showErrorDialog = (message: string, title: string = 'Error') => {
        setDialogType('error');
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogVisible(true);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission needed', 'Permission to access camera roll is required!');
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
        }
    };

    const takePicture = async () => {
        const permission = await getProfileImagePermission('camera');
        if (!permission.granted) {
            Alert.alert('Permission needed', permission.error || 'Camera permission is required!');
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
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#FBBF24" />
                <Text className="text-white mt-4">Loading profile...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={['rgba(25, 25, 25, 1)', 'rgba(0, 0, 0, 1)']}
                className="pt-14 pb-4 px-4 rounded-b-3xl"
            >
                <View className="flex-row items-center justify-center">
                    <Text className="text-white text-xl font-bold">My Profile</Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView className="flex-1 px-4 pt-6">
                    {/* Profile Image */}
                    <View className="items-center mb-6">
                        <TouchableOpacity onPress={pickImage}>
                            <View className="w-36 h-36 rounded-full overflow-hidden border-2 border-yellow-400">
                                {profileImage ? (
                                    <Image
                                        source={{ uri: profileImage.uri }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                ) : currentProfileImageUrl ? (
                                    <Image
                                        source={{ uri: `${currentProfileImageUrl}?timestamp=${Date.now()}` }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                                    />
                                ) : (
                                    <Image
                                        source={require('../../assets/images/avatar.png')}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                )}
                                {/* Show camera overlay only when no image is selected */}
                                {!profileImage && !currentProfileImageUrl && (
                                    <View className="absolute inset-0 bg-black bg-opacity-20 items-center justify-center">
                                        <Ionicons name="camera" size={28} color="#FFFFFF" />
                                        <Text className="text-white text-xs mt-1">Tap to change</Text>
                                    </View>
                                )}
                                {/* Show a small camera icon in the corner when an image is selected */}
                                {(profileImage || currentProfileImageUrl) && (
                                    <View className="absolute bottom-0 right-0 bg-black bg-opacity-50 rounded-tl-lg p-2">
                                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

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

                    {/* Form Fields */}
                    {/* Username */}
                    <View className="mb-4">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">Username</Text>
                        <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                            <Ionicons name="at-outline" size={20} color="#FFFFFF" />
                            <TextInput
                                className="flex-1 text-white text-base ml-3"
                                placeholder="Username"
                                placeholderTextColor="#9CA3AF"
                                value={userName}
                                onChangeText={(text) => {
                                    setUserName(text);
                                    if (formErrors.userName) setFormErrors({ ...formErrors, userName: '' });
                                }}
                                autoCapitalize="none"
                            />
                        </View>
                        {formErrors.userName ? (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.userName}</Text>
                        ) : null}
                    </View>

                    {/* First Name */}
                    <View className="mb-4">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">First Name</Text>
                        <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                            <TextInput
                                className="flex-1 text-white text-base ml-3"
                                placeholder="First Name"
                                placeholderTextColor="#9CA3AF"
                                value={firstName}
                                onChangeText={(text) => {
                                    setFirstName(text);
                                    if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                                }}
                                autoCapitalize="words"
                            />
                        </View>
                        {formErrors.firstName ? (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.firstName}</Text>
                        ) : null}
                    </View>

                    {/* Last Name */}
                    <View className="mb-4">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">Last Name</Text>
                        <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                            <TextInput
                                className="flex-1 text-white text-base ml-3"
                                placeholder="Last Name"
                                placeholderTextColor="#9CA3AF"
                                value={lastName}
                                onChangeText={(text) => {
                                    setLastName(text);
                                    if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                                }}
                                autoCapitalize="words"
                            />
                        </View>
                        {formErrors.lastName ? (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.lastName}</Text>
                        ) : null}
                    </View>

                    {/* Age */}
                    <View className="mb-4">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">Age</Text>
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
                                    if (formErrors.age) setFormErrors({ ...formErrors, age: '' });
                                }}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                        {formErrors.age ? (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.age}</Text>
                        ) : null}
                    </View>

                    {/* Gender Selection */}
                    <View className="mb-4">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">Gender</Text>
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

                        {formErrors.gender ? (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.gender}</Text>
                        ) : null}
                    </View>

                    {/* Date of Birth */}
                    <View className="mb-4">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">Date of Birth</Text>
                        <TouchableOpacity 
                            className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700"
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                            <Text className="flex-1 text-white text-base ml-3">
                                {dateOfBirth ? dateOfBirth : "Select Date of Birth"}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                        {formErrors.dateOfBirth && (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.dateOfBirth}</Text>
                        )}
                    </View>

                    {/* Phone Number */}
                    <View className="mb-6">
                        <Text className="text-gray-400 mb-2 text-sm pl-2">Phone Number</Text>
                        <View className="bg-zinc-800 rounded-full overflow-hidden flex-row items-center px-5 h-14 border border-zinc-700">
                            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                            <TextInput
                                className="flex-1 text-white text-base ml-3"
                                placeholder="Phone Number"
                                placeholderTextColor="#9CA3AF"
                                value={phoneNumber}
                                onChangeText={(text) => {
                                    setPhoneNumber(text);
                                    if (formErrors.phoneNumber) setFormErrors({ ...formErrors, phoneNumber: '' });
                                }}
                                keyboardType="phone-pad"
                            />
                        </View>
                        {formErrors.phoneNumber ? (
                            <Text className="text-red-500 text-sm ml-4 mt-1">{formErrors.phoneNumber}</Text>
                        ) : null}
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        className="rounded-full h-14 justify-center items-center mb-8 overflow-hidden"
                        onPress={handleSaveProfile}
                        disabled={isSaving}
                    >
                        <LinearGradient
                            colors={['#FBBF24', '#F97416']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="w-full h-full absolute"
                        />
                        <Text className="text-white text-base font-bold">
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Dialog for feedback */}
            <Dialog
                visible={dialogVisible}
                type={dialogType}
                title={dialogTitle}
                message={dialogMessage}
                onClose={() => setDialogVisible(false)}
                onConfirm={() => setDialogVisible(false)}
                confirmText="OK"
            />
        </View>
    );
};

export default ProfileScreen;