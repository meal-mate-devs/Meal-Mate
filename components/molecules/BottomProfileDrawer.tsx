// components/organisms/BottomProfileDrawer.tsx
import { useAuthContext } from '@/context/authContext';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { JSX, useEffect, useRef } from 'react';
import { Alert, Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

interface BottomProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItem {
    id: string;
    icon: JSX.Element;
    label: string;
    route?: any;
}

const BottomProfileDrawer: React.FC<BottomProfileDrawerProps> = ({ isOpen, onClose }) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const currentPath = usePathname();
    const { logout } = useAuthContext()
    const router = useRouter();



    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/(auth)/login");
        } catch (error) {
            Alert.alert("Error", "Error occured while signing out !")
        }
    }
    const userData = {
        name: 'Mark Johnson',
        title: 'Health Enthusiast',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        stats: {
            recipes: 24,
            followers: 1080,
            following: 245
        }
    };

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

    const menuItems: MenuItem[] = [
        {
            id: 'profile',
            icon: <Feather name="user" size={22} color="#555" />,
            label: 'My Profile',
            route: '/profile'
        },
        {
            id: 'recipes',
            icon: <MaterialCommunityIcons name="food-variant" size={22} color="#555" />,
            label: 'My Recipes',
            route: '/profile/recipes'
        },
        {
            id: 'favorites',
            icon: <MaterialIcons name="favorite-outline" size={22} color="#555" />,
            label: 'Saved Recipes',
            route: '/profile/favorites'
        },
        {
            id: 'health',
            icon: <MaterialCommunityIcons name="heart-pulse" size={22} color="#555" />,
            label: 'Health Tracking',
            route: '/health'
        },
        {
            id: 'meal-plans',
            icon: <MaterialCommunityIcons name="calendar-text-outline" size={22} color="#555" />,
            label: 'Meal Planning',
            route: '/meal-plans'
        },
        {
            id: 'shopping',
            icon: <MaterialIcons name="shopping-cart" size={22} color="#555" />,
            label: 'Shopping List',
            route: '/shopping-list'
        },
        {
            id: 'settings',
            icon: <Feather name="settings" size={22} color="#555" />,
            label: 'Settings',
            route: '/settings'
        },
    ];

    if (!isOpen) return null;

    return (
        <View className="absolute inset-0 z-50" style={{ pointerEvents: isOpen ? 'auto' : 'none' }}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'black', opacity }
                ]}
                className="absolute inset-0"
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
                        backgroundColor: 'white',
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                        transform: [{ translateY }],
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -3,
                        },
                        shadowOpacity: 0.27,
                        shadowRadius: 4.65,
                        elevation: 6,
                    }
                ]}
            >
                <View className="items-center mt-2 mb-4">
                    <View className="w-12 h-1.5 rounded-full bg-gray-300" />
                </View>

                <TouchableOpacity
                    className="flex-row items-center px-6 pb-4 border-b border-gray-100"
                    onPress={() => {
                        router.push('/profile');
                        onClose();
                    }}
                >
                    <Image
                        source={{ uri: userData.avatar }}
                        className="w-16 h-16 rounded-full"
                    />
                    <View className="ml-4 flex-1">
                        <Text className="text-lg font-bold text-gray-800">{userData.name}</Text>
                        <Text className="text-gray-500">{userData.title}</Text>
                    </View>

                    <View className="flex-row items-center">
                        <TouchableOpacity
                            className="mr-3 bg-gray-100 rounded-full p-2"
                            onPress={() => {
                                router.push('/profile');
                                onClose();
                            }}
                        >
                            <Feather name="edit-2" size={18} color="#555" />
                        </TouchableOpacity>
                        <Feather name="chevron-right" size={20} color="#ccc" />
                    </View>
                </TouchableOpacity>

                <View className="flex-row justify-around py-4 border-b border-gray-100 mx-6">
                    <View className="items-center">
                        <Text className="text-lg font-bold text-gray-800">{userData.stats.recipes}</Text>
                        <Text className="text-gray-500 text-xs">Recipes</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-lg font-bold text-gray-800">{userData.stats.followers}</Text>
                        <Text className="text-gray-500 text-xs">Followers</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-lg font-bold text-gray-800">{userData.stats.following}</Text>
                        <Text className="text-gray-500 text-xs">Following</Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1 px-4 pt-2"
                    showsVerticalScrollIndicator={false}
                >
                    {menuItems.map((item) => {
                        const isActive = currentPath === item.route;

                        return (
                            <TouchableOpacity
                                key={item.id}
                                className={`flex-row items-center py-3.5 px-4 my-0.5 rounded-xl ${isActive ? 'bg-green-50' : ''}`}
                                onPress={() => {
                                    if (item.route) {
                                        router.push(item.route);
                                        onClose();
                                    }
                                }}
                            >
                                <View className={`w-8 h-8 rounded-full items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {item.icon}
                                </View>
                                <Text className={`ml-3 text-base ${isActive ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                                    {item.label}
                                </Text>
                                <Feather name="chevron-right" size={18} color="#ccc" className="ml-auto" />
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity
                        className="flex-row items-center py-3.5 px-4 my-2 rounded-xl"
                        onPress={() => {
                            handleLogout()
                            onClose();
                        }}
                    >
                        <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                            <Feather name="log-out" size={18} color="#EF4444" />
                        </View>
                        <Text className="ml-3 text-base text-red-500">
                            Logout
                        </Text>
                    </TouchableOpacity>

                    <View className="h-6" />
                </ScrollView>
            </Animated.View>
        </View>
    );
};

export default BottomProfileDrawer;