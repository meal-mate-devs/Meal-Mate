// components/molecules/ProfileSidebar.tsx
import { useAuthContext } from '@/context/authContext';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface ProfileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userData: {
        name: string;
        email: string;
        profileImage: string;
    };
    onProfilePress: () => void;
}

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    route?: string;
    action?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose, userData, onProfilePress }) => {
    const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const router = useRouter();
    const { logout } = useAuthContext();
    const [isRendered, setIsRendered] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 300,
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
                Animated.timing(translateX, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setTimeout(() => {
                    setIsRendered(false);
                }, 100);
            });
        }
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/(auth)/login");
            onClose();
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const menuItems: MenuItem[] = [
        {
            id: 'profile',
            icon: <Ionicons name="person-outline" size={22} color="#FFFFFF" />,
            label: 'Profile',
            action: onProfilePress
        },
        {
            id: 'note',
            icon: <MaterialIcons name="credit-card" size={22} color="#FFFFFF" />,
            label: 'Personal Note',
            route: '/notes'
        },
        {
            id: 'about',
            icon: <Ionicons name="shield-outline" size={22} color="#FFFFFF" />,
            label: 'About App',
            route: '/about'
        },
        {
            id: 'notification',
            icon: <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />,
            label: 'Notification',
            route: '/notifications'
        },
        {
            id: 'device',
            icon: <Ionicons name="phone-portrait-outline" size={22} color="#FFFFFF" />,
            label: 'My Device',
            route: '/devices'
        },
        {
            id: 'contact',
            icon: <Ionicons name="call-outline" size={22} color="#FFFFFF" />,
            label: 'Contact Us',
            route: '/contact'
        },
        {
            id: 'settings',
            icon: <Ionicons name="settings-outline" size={22} color="#FFFFFF" />,
            label: 'Settings',
            route: '/settings'
        },
    ];

    if (!isRendered && !isOpen) return null;

    return (
        <View className="absolute inset-0 z-50" style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
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
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: SIDEBAR_WIDTH,
                        backgroundColor: '#101010',
                        transform: [{ translateX }],
                        zIndex: 100,
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                    }
                ]}
            >
                <View className="h-40 w-full">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80' }}
                        className="absolute w-full h-full"
                        style={{ opacity: 0.4 }}
                    />

                    <TouchableOpacity
                        className="absolute top-4 left-4 p-2"
                        onPress={onClose}
                    >
                        <Feather name="chevron-left" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="p-4 flex-1 justify-center">
                        <View className="flex-row items-center">
                            <View className="mr-3">
                                {userData.profileImage ? (
                                    <Image
                                        source={{ uri: userData.profileImage }}
                                        className="w-16 h-16 rounded-full"
                                    />
                                ) : (
                                    <View className="w-16 h-16 rounded-full overflow-hidden">
                                        <LinearGradient
                                            colors={['#FACC15', '#F97316']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            className="w-full h-full items-center justify-center"
                                        >
                                            <Text className="text-2xl font-bold text-white">
                                                {userData.name.charAt(0)}
                                            </Text>
                                        </LinearGradient>
                                    </View>
                                )}
                            </View>

                            <View className="flex-1">
                                <Text className="text-white text-lg font-semibold">{userData.name}</Text>
                                <Text className="text-gray-300 text-sm">{userData.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="flex-1 gap-4">
                    {menuItems.map((item: any) => (
                        <TouchableOpacity
                            key={item.id}
                            className="flex-row items-center py-4 px-6 border-b border-gray-800"
                            onPress={() => {
                                if (item.action) {
                                    item.action();
                                    onClose();
                                } else if (item.route) {
                                    router.push(item.route);
                                    onClose();
                                }
                            }}
                        >
                            <View className="w-6">
                                {item.icon}
                            </View>
                            <Text className="text-white text-base ml-4 flex-1">{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    className="flex-row items-center py-4 px-6 mt-auto bg-orange-500 rounded-full mx-2"
                    onPress={handleLogout}
                >
                    <View className="w-6">
                        <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                    </View>
                    <Text className="text-white text-base ml-4 flex-1">Logout</Text>
                </TouchableOpacity>

                <View style={{ height: insets.bottom > 0 ? insets.bottom : 16 }} />
            </Animated.View>
        </View>
    );
};

export default ProfileSidebar;