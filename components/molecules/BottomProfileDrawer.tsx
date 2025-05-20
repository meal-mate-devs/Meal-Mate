// components/molecules/BottomProfileDrawer.tsx
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

interface BottomProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userData: {
        name: string;
        email: string;
        profileImage: string;
    };
}

const BottomProfileDrawer: React.FC<BottomProfileDrawerProps> = ({ isOpen, onClose, userData }) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const router = useRouter();

    // Form state
    const [fullName, setFullName] = useState(userData.name);
    const [email, setEmail] = useState(userData.email);
    const [gender, setGender] = useState('');
    const [language, setLanguage] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    // Reset form when drawer opens
    useEffect(() => {
        if (isOpen) {
            setFullName(userData.name);
            setEmail(userData.email);
        }
    }, [isOpen, userData]);

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 8,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: DRAWER_HEIGHT,
                    friction: 8,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleSave = () => {
        // Save profile logic would go here
        onClose();
    };


    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        } else {
            const timer = setTimeout(() => {
                setIsRendered(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered && !isOpen) return null;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="absolute inset-0 z-50"
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'black', opacity }
                ]}
            >
                <TouchableOpacity
                    className="absolute inset-0"
                    activeOpacity={1}
                    onPress={onClose}
                />
            </Animated.View>

            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: DRAWER_HEIGHT,
                        backgroundColor: '#18181B', // zinc-900
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        transform: [{ translateY }],
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                        overflow: 'hidden',
                    }
                ]}
            >
                {/* Background image with overlay */}
                <View className="h-32 w-full">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80' }}
                        className="w-full h-full absolute"
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/50" />

                    {/* Back button */}
                    <TouchableOpacity
                        className="absolute top-4 left-4 p-2"
                        onPress={onClose}
                    >
                        <Feather name="chevron-left" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Title */}
                    <View className="absolute bottom-4 left-4 right-4 flex-row justify-between items-center">
                        <Text className="text-white text-xl font-bold">Edit Profile</Text>
                    </View>
                </View>

                {/* Profile image */}
                <View className="items-center -mt-12">
                    <View className="relative">
                        <View className="h-24 w-24 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-700">
                            {userData.profileImage ? (
                                <Image
                                    source={{ uri: userData.profileImage }}
                                    className="w-full h-full"
                                />
                            ) : (
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']} // yellow-400 to orange-400
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="w-full h-full items-center justify-center"
                                >
                                    <Text className="text-3xl font-bold text-white">
                                        {userData.name.charAt(0)}
                                    </Text>
                                </LinearGradient>
                            )}
                        </View>
                        <TouchableOpacity className="absolute bottom-0 right-0 bg-zinc-800 p-2 rounded-full border-2 border-zinc-700">
                            <Feather name="edit-2" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form fields */}
                <View className="px-6 pt-6 pb-4 flex-1">
                    {/* Full Name */}
                    <View className="mb-4">
                        <Text className="text-white text-sm mb-2">Full Name</Text>
                        <View className="bg-zinc-700 rounded-lg overflow-hidden">
                            <TextInput
                                className="px-4 py-3 text-white"
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Full Name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View className="mb-4">
                        <Text className="text-white text-sm mb-2">Email</Text>
                        <View className="bg-zinc-700 rounded-lg overflow-hidden">
                            <TextInput
                                className="px-4 py-3 text-white"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    {/* Gender */}
                    <View className="mb-4">
                        <Text className="text-white text-sm mb-2">Gender</Text>
                        <View className="bg-zinc-700 rounded-lg overflow-hidden">
                            <TextInput
                                className="px-4 py-3 text-white"
                                value={gender}
                                onChangeText={setGender}
                                placeholder="Gender"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Language */}
                    <View className="mb-4">
                        <Text className="text-white text-sm mb-2">Language</Text>
                        <View className="bg-zinc-700 rounded-lg overflow-hidden">
                            <TextInput
                                className="px-4 py-3 text-white"
                                value={language}
                                onChangeText={setLanguage}
                                placeholder="Language"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Date of Birth */}
                    <View className="mb-6">
                        <Text className="text-white text-sm mb-2">Date of Birth</Text>
                        <View className="bg-zinc-700 rounded-lg overflow-hidden">
                            <TextInput
                                className="px-4 py-3 text-white"
                                value={dateOfBirth}
                                onChangeText={setDateOfBirth}
                                placeholder="Date of Birth"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        className="rounded-lg overflow-hidden"
                        onPress={handleSave}
                    >
                        <LinearGradient
                            colors={['#FACC15', '#F97316']} // yellow-400 to orange-400
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 items-center justify-center"
                        >
                            <Text className="text-white font-bold text-base">
                                Save
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

export default BottomProfileDrawer;