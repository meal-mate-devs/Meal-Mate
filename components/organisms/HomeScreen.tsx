import { groceryService } from '@/lib/services/groceryService';
import { pantryService } from '@/lib/services/pantryService';
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
    const [activeTab, setActiveTab] = useState<string>('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Animation state - using fresh values to avoid native driver conflicts
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;
    
    // Create fresh animated values each time to avoid driver conflicts
    const [cardsAnimatedOpacity] = useState(() => new Animated.Value(1));
    const [cardsAnimatedHeight] = useState(() => new Animated.Value(180));

    // Animation for progress bar
    const progressAnimation = useRef(new Animated.Value(0)).current;
    
    // Use the profile store instead of static userData
    const { profileData, subscribe } = useProfileStore();
    const [localUserData, setLocalUserData] = useState(profileData);

    // Pantry and Grocery data
    const [pantryData, setPantryData] = useState({ active: 0, expiring: 0, expired: 0, total: 0 });
    const [groceryData, setGroceryData] = useState({ total: 0, pending: 0, purchased: 0, urgent: 0, overdue: 0 });
    const [pantryLoading, setPantryLoading] = useState(false);
    const [groceryLoading, setGroceryLoading] = useState(false);

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

    const tabs = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert'];

    // Preload or reset state when the screen is focused
    useFocusEffect(
        useCallback(() => {
            // Reset any state or preload data here
            setActiveTab('All'); // Reset to All tab to show all recipes
            
            // Animate progress bar from 0 to target
            progressAnimation.setValue(0);
            Animated.timing(progressAnimation, {
                toValue: 1850 / 2400, // Target progress ratio
                duration: 1000, // 1 seconds animation
                useNativeDriver: false, // Can't use native driver for width
            }).start();

            // Reset scroll animations
            cardsAnimatedOpacity.setValue(1);
            cardsAnimatedHeight.setValue(180);
            setIsScrolledUp(false);

            // Fetch pantry and grocery data
            fetchPantryData();
            fetchGroceryData();
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

    const fetchPantryData = async () => {
        try {
            setPantryLoading(true);
            const response = await pantryService.getPantryItems();
            if (response.success) {
                setPantryData(response.counts);
            }
        } catch (error) {
            console.log('Error fetching pantry data:', error);
        } finally {
            setPantryLoading(false);
        }
    };

    const fetchGroceryData = async () => {
        try {
            setGroceryLoading(true);
            const response = await groceryService.getGroceryItems();
            if (response.success) {
                setGroceryData(response.counts);
            }
        } catch (error) {
            console.log('Error fetching grocery data:', error);
        } finally {
            setGroceryLoading(false);
        }
    };

    // Track previous scroll position for direction detection
    const prevScrollY = useRef(0);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const currentScrollY = event.nativeEvent.contentOffset.y;
                const isScrollingUp = currentScrollY > prevScrollY.current;
                const isScrollingDown = currentScrollY < prevScrollY.current;
                
                // Hide cards when scrolling up past threshold
                const shouldHideFromUp = isScrollingUp && currentScrollY > 50;
                // Show cards immediately when scrolling down (regardless of position)
                const shouldShowFromDown = isScrollingDown;
                
                const shouldHide = shouldHideFromUp && !shouldShowFromDown;
                
                if (shouldHide !== isScrolledUp) {
                    setIsScrolledUp(shouldHide);
                    
                    // Smooth animation for cards only with height collapse
                    Animated.parallel([
                        Animated.timing(cardsAnimatedOpacity, {
                            toValue: shouldHide ? 0 : 1,
                            duration: 800,
                            useNativeDriver: false,
                        }),
                        Animated.timing(cardsAnimatedHeight, {
                            toValue: shouldHide ? 0 : 180, // Approximate height of cards container
                            duration: 800,
                            useNativeDriver: false,
                        })
                    ]).start();
                }
                
                // Update previous scroll position
                prevScrollY.current = currentScrollY;
            }
        }
    );

    return (
        <LinearGradient
            colors={["#09090b", "#18181b"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <StatusBar barStyle="light-content" />
                {/* Header with extra top margin */}
                <View style={{ paddingTop: 30 }}>
                    <HomeHeader
                        onSidebarPress={toggleSidebar}
                        onProfilePress={handleEditProfile}
                    />
                </View>

            {/* Smooth Animated Cards Container */}
            <Animated.View 
                className="px-4"
                style={{
                    opacity: cardsAnimatedOpacity,
                    height: cardsAnimatedHeight,
                    overflow: 'hidden'
                }}
            >
                <View className="py-4">
                {/* Health Card - Compact */}
                <TouchableOpacity
                    className="mb-3 w-full max-w-md"
                    onPress={() => router.push('/health')}
                    activeOpacity={0.8}
                >
                    <View className="rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-800">
                        <View className="p-2">
                        <View className="flex-row items-center justify-between mb-1">
                            <Text className="ml-1 text-white text-xs font-semibold">Calories</Text>
                            <View className="flex-row items-center">
                                <Text className="text-gray-400 text-xs mr-1">
                                    {Math.round((1850 / 2400) * 100)}%
                                </Text>
                                <Ionicons name="chevron-forward" size={8} color="#9CA3AF" />
                            </View>
                        </View>
                        <View className="ml-1 flex-row items-end mb-1">
                            <Text className="text-white text-lg font-bold">1,850</Text>
                            <Text className="text-gray-400 text-xs ml-1">/ 2,400</Text>
                        </View>
                        <View className="ml-1 bg-zinc-700/60 h-2 rounded-full overflow-hidden w-full">
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
                    </View>
                </TouchableOpacity>

                {/* Pantry and Grocery Cards - Half Width */}
                <View className="flex-row justify-between mb-4">
                    {/* Pantry Card */}
                    <TouchableOpacity
                        className="flex-1 mr-2"
                        onPress={() => router.push('/recipe/pantry')}
                        activeOpacity={0.8}
                    >
                        <View className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-800">
                            <View className="p-3">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white text-sm font-semibold">Pantry</Text>
                                    <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                                </View>
                                
                                {/* Expiry Status Bars */}
                                <View className="flex-row h-2 rounded-full overflow-hidden bg-zinc-700/60 mb-2">
                                    {pantryData.total > 0 && (
                                        <>
                                            <View 
                                                className="bg-green-500"
                                                style={{ 
                                                    width: `${(pantryData.active / pantryData.total) * 100}%`,
                                                    height: '100%'
                                                }}
                                            />
                                            <View 
                                                className="bg-yellow-500"
                                                style={{ 
                                                    width: `${(pantryData.expiring / pantryData.total) * 100}%`,
                                                    height: '100%'
                                                }}
                                            />
                                            <View 
                                                className="bg-red-500"
                                                style={{ 
                                                    width: `${(pantryData.expired / pantryData.total) * 100}%`,
                                                    height: '100%'
                                                }}
                                            />
                                        </>
                                    )}
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-yellow-400 text-xs">{pantryData.expiring} Expiring</Text>
                                    <View />
                                    <View />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Grocery Card */}
                    <TouchableOpacity
                        className="flex-1 ml-2"
                        onPress={() => router.push('/settings/grocery-list')}
                        activeOpacity={0.8}
                    >
                        <View className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-800">
                            <View className="p-3">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white text-sm font-semibold">Grocery</Text>
                                    <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                                </View>
                                
                                {/* Grocery Status Bars */}
                                <View className="flex-row h-2 rounded-full overflow-hidden bg-zinc-700/60 mb-2">
                                    {groceryData.total > 0 && (
                                        <>
                                            <View 
                                                className="bg-blue-500"
                                                style={{ 
                                                    width: `${(groceryData.pending / groceryData.total) * 100}%`,
                                                    height: '100%'
                                                }}
                                            />
                                            <View 
                                                className="bg-green-500"
                                                style={{ 
                                                    width: `${(groceryData.purchased / groceryData.total) * 100}%`,
                                                    height: '100%'
                                                }}
                                            />
                                        </>
                                    )}
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-blue-400 text-xs">{groceryData.pending} Pending</Text>
                                    <View />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                </View>
            </Animated.View>

            {/* Static Category Tabs - Always Visible */}
            <View className="px-4 py-2 bg-zinc-900">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
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
            </View>

            {/* Only recipes are scrollable */}
            <ScrollView 
                className="flex-1 px-4"
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* Recipe Cards */}
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
    </LinearGradient>
    );
};

export default HomeScreen;