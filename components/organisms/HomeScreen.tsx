import { dummyRecipes } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useProfileStore } from '../../hooks/useProfileStore'; // Add this import
import HomeHeader from '../molecules/HomeHeader';
import ProfileSidebar from '../molecules/ProfileSidebar';

const HomeScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('Breakfast');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Animation for progress bar
    const progressAnimation = useRef(new Animated.Value(0)).current;
    
    // Use the profile store instead of static userData
    const { profileData, subscribe } = useProfileStore();
    const [localUserData, setLocalUserData] = useState(profileData);

    // Subscribe to profile updates
    useEffect(() => {
        const unsubscribe = subscribe((updatedData) => {
            console.log('HomeScreen received profile update:', updatedData);
            setLocalUserData(updatedData);
        });
        
        // Initialize with current data
        setLocalUserData(profileData);
        
        return unsubscribe;
    }, [subscribe, profileData]);

    const filteredRecipes = dummyRecipes.filter(recipe =>
        recipe.category === activeTab || activeTab === 'All'
    );

    const tabs = ['Lunch', 'Breakfast', 'Dinner', 'Dessert'];

    // Preload or reset state when the screen is focused
    useFocusEffect(
        useCallback(() => {
            // Reset any state or preload data here
            setActiveTab('Breakfast'); // Example: Reset active tab
            
            // Animate progress bar from 0 to target
            progressAnimation.setValue(0);
            Animated.timing(progressAnimation, {
                toValue: 1850 / 2400, // Target progress ratio
                duration: 1000, // 1 seconds animation
                useNativeDriver: false, // Can't use native driver for width
            }).start();
        }, [])
    );

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleEditProfile = () => {
        router.push('/profile');
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            {/* Header with extra top margin */}
            <View style={{ paddingTop: 38, backgroundColor: 'black' }}>
                <HomeHeader
                    onSidebarPress={toggleSidebar}
                    onProfilePress={handleEditProfile}
                />
            </View>

            {/* Only the content below header and search is scrollable */}
            <ScrollView className="flex-1 px-4 pt-2">
                {/* Health Card - Compact */}
                <TouchableOpacity
                    className="mb-4"
                    onPress={() => router.push('/health')}
                    activeOpacity={0.8}
                >
                    <View className="bg-zinc-800 rounded-xl p-3">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-white text-base font-semibold">Calories</Text>
                            <View className="flex-row items-center">
                                <Text className="text-gray-400 text-xs mr-1">
                                    {Math.round((1850 / 2400) * 100)}%
                                </Text>
                                <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                            </View>
                        </View>
                        <View className="flex-row items-end mb-2">
                            <Text className="text-white text-2xl font-bold">1,850</Text>
                            <Text className="text-gray-400 text-sm ml-1">/ 2,400</Text>
                        </View>
                        <View className="bg-zinc-700 h-2 rounded-full overflow-hidden">
                            <Animated.View
                                className="h-2 rounded-full"
                                style={{
                                    width: progressAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                }}
                            >
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="h-full w-full rounded-full"
                                />
                            </Animated.View>
                        </View>
                    </View>
                </TouchableOpacity>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-6"
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`py-2 px-6 mr-2 rounded-full ${activeTab === tab ? 'overflow-hidden' : 'bg-zinc-800'
                                }`}
                        >
                            {activeTab === tab ? (
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="absolute inset-0"
                                />
                            ) : null}
                            <Text
                                className={`${activeTab === tab ? 'text-white' : 'text-gray-400'
                                    } font-medium`}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {filteredRecipes.map((recipe) => (
                    <TouchableOpacity
                        key={recipe.id}
                        className="bg-zinc-800 mb-6 rounded-3xl overflow-hidden"
                        onPress={() => router.push(`/recipe/${recipe.id}`)}
                    >
                        <Image
                            source={{ uri: recipe.image }}
                            className="w-full h-44"
                            resizeMode="cover"
                        />
                        <View className="p-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-white font-bold text-lg">{recipe.name}</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={16} color="#FACC15" />
                                    <Text className="text-gray-300 ml-1">{recipe.rating}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mt-2">
                                <Text className="text-gray-400 font-medium">{recipe.author}</Text>
                                <View className="flex-row items-center ml-4">
                                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                                    <Text className="text-gray-400 ml-1">{recipe.prepTime} min</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ProfileSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onEditProfile={handleEditProfile}
            />
        </SafeAreaView>
    );
};

export default HomeScreen;