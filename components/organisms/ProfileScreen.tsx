import { useAuthContext } from '@/context/authContext';
import { getProfileImagePermission } from '@/lib/utils/registerValidation';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    BackHandler,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Dialog from '../atoms/Dialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Animation values
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(50)).current;
    const profileImageScale = React.useRef(new Animated.Value(1)).current;

    // Original values for comparison
    const [originalValues, setOriginalValues] = useState({
        userName: '',
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        dateOfBirth: '',
        phoneNumber: ''
    });
    
    // Unsaved changes state
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    
    // Unsaved changes dialog state
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

    useEffect(() => {
        const loadProfileData = async () => {
            setIsLoading(true);
            try {
                // Only refresh the profile once on component mount
                if (!profile) {
                    await refreshProfile();
                } else {
                    // Initialize form with profile data if it already exists
                    const initialData = {
                        userName: profile.userName || '',
                        firstName: profile.firstName || '',
                        lastName: profile.lastName || '',
                        age: profile.age ? profile.age.toString() : '',
                        gender: profile.gender as 'male' | 'female' | 'other' | '' || '',
                        dateOfBirth: profile.dateOfBirth || '',
                        phoneNumber: profile.phoneNumber || ''
                    };
                    
                    setUserName(initialData.userName);
                    setFirstName(initialData.firstName);
                    setLastName(initialData.lastName);
                    setAge(initialData.age);
                    setGender(initialData.gender as 'male' | 'female' | 'other' | '');
                    setDateOfBirth(initialData.dateOfBirth);
                    setPhoneNumber(initialData.phoneNumber);
                    
                    // Store original values for comparison
                    setOriginalValues(initialData);

                    // Set profile image URL if it exists
                    if (profile.profileImage?.url) {
                        setCurrentProfileImageUrl(profile.profileImage.url);
                    }
                }
            } catch (error) {
                console.log('Failed to load profile:', error);
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
            const profileData = {
                userName: profile.userName || '',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                age: profile.age ? profile.age.toString() : '',
                gender: profile.gender as 'male' | 'female' | 'other' | '' || '',
                dateOfBirth: profile.dateOfBirth || '',
                phoneNumber: profile.phoneNumber || ''
            };
            
            setUserName(profileData.userName);
            setFirstName(profileData.firstName);
            setLastName(profileData.lastName);
            setAge(profileData.age);
            setGender(profileData.gender as 'male' | 'female' | 'other' | '');
            setDateOfBirth(profileData.dateOfBirth);
            setPhoneNumber(profileData.phoneNumber);
            
            // Update original values to match loaded profile data
            setOriginalValues(profileData);

            // Set profile image URL if it exists
            if (profile.profileImage?.url) {
                setCurrentProfileImageUrl(profile.profileImage.url);
            }
        }
    }, [profile]);    
    
    // Check for unsaved changes
    useEffect(() => {
        const currentValues = {
            userName,
            firstName,
            lastName,
            age,
            gender,
            dateOfBirth,
            phoneNumber
        };
        
        const hasChanges = Object.keys(originalValues).some(key => 
            originalValues[key as keyof typeof originalValues] !== currentValues[key as keyof typeof currentValues]
        );
        
        console.log('Checking for unsaved changes:', {
            originalValues,
            currentValues,
            hasChanges
        });
        
        setHasUnsavedChanges(hasChanges);
    }, [userName, firstName, lastName, age, gender, dateOfBirth, phoneNumber, originalValues]);
    
    // Handle navigation with unsaved changes
    const handleBackPress = () => {
        console.log('Back press triggered, hasUnsavedChanges:', hasUnsavedChanges);
        if (hasUnsavedChanges) {
            setShowUnsavedDialog(true);
        } else {
            router.back();
        }
    };
    
    // Add navigation event listener to intercept back navigation
    useEffect(() => {
        const onBackPress = () => {
            if (hasUnsavedChanges) {
                setShowUnsavedDialog(true);
                return true; // Prevent default back action
            }
            return false; // Allow default back action
        };

        // Add event listener for hardware back button (Android)
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => backHandler.remove();
    }, [hasUnsavedChanges]);
    
    // Handle discard changes
    const handleDiscardChanges = () => {
        // Reset form to original values
        setUserName(originalValues.userName);
        setFirstName(originalValues.firstName);
        setLastName(originalValues.lastName);
        setAge(originalValues.age);
        setGender(originalValues.gender as 'male' | 'female' | 'other' | '');
        setDateOfBirth(originalValues.dateOfBirth);
        setPhoneNumber(originalValues.phoneNumber);
        
        setShowUnsavedDialog(false);
        router.back();
    };
    
    // Handle save and leave
    const handleSaveAndLeave = async () => {
        setShowUnsavedDialog(false);
        try {
            await handleSaveProfile();
            router.back();
        } catch (error) {
            console.log('Failed to save before leaving:', error);
        }
    };
    
    // Handle form submission
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
            
            // Update original values to reflect saved data
            const updatedValues = {
                userName,
                firstName,
                lastName,
                age,
                gender,
                dateOfBirth,
                phoneNumber
            };
            setOriginalValues(updatedValues);

            // Refresh profile data to ensure all components get updated
            await refreshProfile();
        } catch (error) {
            console.log('Error updating profile:', error);
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

    // Helper function to format date string as DD-MM-YYYY (consistent with RegistrationForm)
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

    // Helper function to format date for display
    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return 'Select Date of Birth';
        try {
            let date;
            
            // Check if dateString is in DD-MM-YYYY format
            if (typeof dateString === 'string' && dateString.includes('-') && dateString.length === 10) {
                const [day, month, year] = dateString.split('-').map(Number);
                date = new Date(year, month - 1, day); // month is 0-indexed
            } else {
                date = new Date(dateString);
            }
            
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
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

    const uploadImageOnly = async (imageAsset: EnhancedImageAsset) => {
        try {
            showLoadingDialog('Uploading Image', 'Please wait while we upload your profile picture...');
            
            const response = await updateUserProfile({}, imageAsset);
            
            setDialogVisible(false);
            showSuccessDialog('Image Uploaded', 'Your profile picture has been successfully updated.');
            
            // Update the current profile image URL if available in the response
            if (response?.user?.profileImage?.url) {
                console.log('Setting new profile image URL:', response.user.profileImage.url);
                setCurrentProfileImageUrl(response.user.profileImage.url);
                setProfileImage(null); // Clear local state
            }
            
            // Refresh profile data to ensure all components get updated
            await refreshProfile();
        } catch (error) {
            console.log('Error uploading image:', error);
            setDialogVisible(false);
            showErrorDialog('Failed to upload image. Please try again later.');
        }
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
            
            // Automatically upload the image
            await uploadImageOnly(enhancedImage);
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
            
            // Automatically upload the image
            await uploadImageOnly(enhancedImage);
        }
    };

    // Initialize animations
    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#121212', '#0a0a0a', '#000000']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />
                <StatusBar barStyle="light-content" backgroundColor="#121212" />
                <View style={styles.loadingContent}>
                    <Animated.View
                        style={[
                            styles.loadingSpinner,
                            {
                                transform: [{
                                    rotate: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    })
                                }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#FACC15', '#F97316']}
                            style={styles.spinnerGradient}
                        />
                    </Animated.View>
                    <Text style={styles.loadingText}>Loading your profile...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#121212', '#0a0a0a', '#000000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            <StatusBar barStyle="light-content" backgroundColor="#121212" />

            {/* Custom Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={handleBackPress}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.headerRight} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Enhanced Profile Image Section */}
                    <Animated.View
                        style={[
                            styles.profileImageSection,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: profileImageScale }]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                Animated.sequence([
                                    Animated.spring(profileImageScale, {
                                        toValue: 0.95,
                                        useNativeDriver: true,
                                    }),
                                    Animated.spring(profileImageScale, {
                                        toValue: 1,
                                        useNativeDriver: true,
                                    }),
                                ]).start();
                                pickImage();
                            }}
                            activeOpacity={0.9}
                        >
                            <View style={styles.profileImageContainer}>
                                <View style={styles.profileImageWrapper}>
                                    {profileImage ? (
                                        <Image
                                            source={{ uri: profileImage.uri }}
                                            style={styles.profileImage}
                                            resizeMode="cover"
                                        />
                                    ) : currentProfileImageUrl ? (
                                        <Image
                                            source={{ uri: `${currentProfileImageUrl}?timestamp=${Date.now()}` }}
                                            style={styles.profileImage}
                                            resizeMode="cover"
                                            onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                                        />
                                    ) : (
                                        <View style={styles.profileImagePlaceholder}>
                                            <Ionicons name="person" size={60} color="#FACC15" />
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Enhanced action buttons */}
                        <View style={styles.imageActionsContainer}>
                            <TouchableOpacity
                                onPress={pickImage}
                                style={styles.actionButton}
                                activeOpacity={0.8}
                            >
                                <View style={styles.actionButtonContent}>
                                    <Ionicons name="images-outline" size={16} color="#D4AF37" />
                                    <Text style={styles.actionButtonText}>Gallery</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={takePicture}
                                style={styles.actionButton}
                                activeOpacity={0.8}
                            >
                                <View style={styles.actionButtonContent}>
                                    <Ionicons name="camera-outline" size={16} color="#D4AF37" />
                                    <Text style={styles.actionButtonText}>Camera</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Simplified Form Fields */}
                    <View style={styles.formContainer}>
                        {/* Username */}
                        <Animated.View
                            style={[
                                styles.formField,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <Text style={styles.fieldLabel}>Username</Text>
                            <View style={[styles.inputContainer, formErrors.userName && styles.inputError]}>
                                <Ionicons name="at-outline" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter username"
                                    placeholderTextColor="#666"
                                    value={userName}
                                    onChangeText={(text) => {
                                        setUserName(text);
                                        if (formErrors.userName) setFormErrors({ ...formErrors, userName: '' });
                                    }}
                                    autoCapitalize="none"
                                    selectionColor="#FACC15"
                                />
                            </View>
                            {formErrors.userName ? (
                                <Text style={styles.errorText}>{formErrors.userName}</Text>
                            ) : null}
                        </Animated.View>

                        {/* First Name */}
                        <Animated.View style={[styles.formField, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.fieldLabel}>First Name</Text>
                            <View style={[styles.inputContainer, formErrors.firstName && styles.inputError]}>
                                <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter first name"
                                    placeholderTextColor="#666"
                                    value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                                    }}
                                    autoCapitalize="words"
                                    selectionColor="#FACC15"
                                />
                            </View>
                            {formErrors.firstName ? (<Text style={styles.errorText}>{formErrors.firstName}</Text>) : null}
                        </Animated.View>

                        {/* Last Name */}
                        <Animated.View style={[styles.formField, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.fieldLabel}>Last Name</Text>
                            <View style={[styles.inputContainer, formErrors.lastName && styles.inputError]}>
                                <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter last name"
                                    placeholderTextColor="#666"
                                    value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                                    }}
                                    autoCapitalize="words"
                                    selectionColor="#FACC15"
                                />
                            </View>
                            {formErrors.lastName ? (<Text style={styles.errorText}>{formErrors.lastName}</Text>) : null}
                        </Animated.View>

                        {/* Age */}
                        <Animated.View style={[styles.formField, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.fieldLabel}>Age</Text>
                            <View style={[styles.inputContainer, formErrors.age && styles.inputError]}>
                                <Ionicons name="calendar-outline" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter your age"
                                    placeholderTextColor="#666"
                                    value={age}
                                    onChangeText={(text) => {
                                        const numericText = text.replace(/[^0-9]/g, '');
                                        setAge(numericText);
                                        if (formErrors.age) setFormErrors({ ...formErrors, age: '' });
                                    }}
                                    keyboardType="numeric"
                                    maxLength={3}
                                    selectionColor="#FACC15"
                                />
                            </View>
                            {formErrors.age ? (<Text style={styles.errorText}>{formErrors.age}</Text>) : null}
                        </Animated.View>

                        {/* Gender Selection */}
                        <Animated.View style={[styles.formField, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.fieldLabel}>Gender</Text>
                            <TouchableOpacity
                                onPress={() => setShowGenderPicker(!showGenderPicker)}
                                style={[styles.inputContainer, formErrors.gender && styles.inputError]}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="person-circle-outline" size={18} color="#666" style={styles.inputIcon} />
                                <Text style={[styles.textInput, { paddingVertical: 18 }]}>
                                    {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Select Gender'}
                                </Text>
                                <Ionicons
                                    name={showGenderPicker ? "chevron-up-outline" : "chevron-down-outline"}
                                    size={20}
                                    color="#666"
                                    style={{ marginRight: 16 }}
                                />
                            </TouchableOpacity>

                            {showGenderPicker && (
                                <View style={styles.genderPicker}>
                                    {['male', 'female', 'other'].map((genderOption) => (
                                        <TouchableOpacity
                                            key={genderOption}
                                            onPress={() => handleSelectGender(genderOption as 'male' | 'female' | 'other')}
                                            style={styles.genderOption}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons
                                                name={gender === genderOption ? "radio-button-on" : "radio-button-off"}
                                                size={20}
                                                color={gender === genderOption ? "#FACC15" : "#666"}
                                            />
                                            <Text style={[
                                                styles.genderOptionText,
                                                gender === genderOption && styles.genderOptionTextActive
                                            ]}>
                                                {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {formErrors.gender ? (<Text style={styles.errorText}>{formErrors.gender}</Text>) : null}
                        </Animated.View>

                        {/* Date of Birth */}
                        <Animated.View style={[styles.formField, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.fieldLabel}>Date of Birth</Text>
                            <TouchableOpacity
                                style={[styles.inputContainer, formErrors.dateOfBirth && styles.inputError]}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="calendar-outline" size={18} color="#666" style={styles.inputIcon} />
                                <Text style={[styles.textInput, { paddingVertical: 18 }]}>
                                    {formatDateForDisplay(dateOfBirth)}
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
                            {formErrors.dateOfBirth && (<Text style={styles.errorText}>{formErrors.dateOfBirth}</Text>)}
                        </Animated.View>

                        {/* Phone Number */}
                        <Animated.View style={[styles.formField, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <View style={[styles.inputContainer, formErrors.phoneNumber && styles.inputError]}>
                                <Ionicons name="call-outline" size={18} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#666"
                                    value={phoneNumber}
                                    onChangeText={(text) => {
                                        setPhoneNumber(text);
                                        if (formErrors.phoneNumber) setFormErrors({ ...formErrors, phoneNumber: '' });
                                    }}
                                    keyboardType="phone-pad"
                                    selectionColor="#FACC15"
                                />
                            </View>
                            {formErrors.phoneNumber ? (<Text style={styles.errorText}>{formErrors.phoneNumber}</Text>) : null}
                        </Animated.View>

                        {/* Save Button */}
                        <Animated.View style={[styles.saveButtonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                disabled={isSaving}
                                activeOpacity={0.8}
                                style={styles.saveButton}
                            >
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#000" />
                                ) : (
                                    <Ionicons name="checkmark-circle" size={20} color="#000" />
                                )}
                                <Text style={styles.saveButtonText}>
                                    {isSaving ? 'Saving...' : 'Save Profile'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
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
            
            {/* Unsaved Changes Dialog */}
            <Dialog
                visible={showUnsavedDialog}
                type="warning"
                title="Unsaved Changes"
                message="You have unsaved changes. What would you like to do?"
                onClose={handleDiscardChanges}
                onConfirm={handleSaveAndLeave}
                confirmText="Save & Leave"
                cancelText="Discard Changes"
                showCancelButton={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: 'transparent',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
        height: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    loadingContent: {
        alignItems: 'center',
        gap: 20,
    },
    loadingSpinner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    spinnerGradient: {
        flex: 1,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    profileImageSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    profileImageContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImageWrapper: {
        width: 160,
        height: 160,
        borderRadius: 80,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageActionsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    actionButton: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.2)',
        backgroundColor: 'rgba(250, 204, 21, 0.05)',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    actionButtonText: {
        color: '#E6B800',
        fontSize: 14,
        fontWeight: '500',
    },
    // Form styles
    formContainer: {
        gap: 16,
    },
    formTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    formField: {
        gap: 8,
    },
    fieldLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        minHeight: 56,
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        paddingVertical: 16,
        paddingRight: 16,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
    // Gender picker styles
    genderPicker: {
        marginTop: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    genderOptionText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '500',
    },
    genderOptionTextActive: {
        color: '#FACC15',
        fontWeight: '600',
    },
    // Save button styles
    saveButtonContainer: {
        marginTop: 20,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    saveButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        position: 'relative',
    },
    saveButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 17,
        letterSpacing: 0.3,
    },
});

export default ProfileScreen;