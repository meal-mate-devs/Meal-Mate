import { dummyRecipes } from '@/lib/utils';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BottomProfileDrawer from '../molecules/BottomProfileDrawer';
import HomeHeader from '../molecules/HomeHeader';
import ProfileSidebar from '../molecules/ProfileSidebar';

const userData = {
    name: 'Umar Farooq',
    email: 'umarf9834@gmail.com',
    profileImage: '',
};

const HomeScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('Breakfast');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const filteredRecipes = dummyRecipes.filter(recipe =>
        recipe.category === activeTab || activeTab === 'All'
    );

    const tabs = ['Lunch', 'Breakfast', 'Dinner', 'Dessert'];

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 px-4">
                <HomeHeader
                    username={userData.name}
                    profileImage={userData.profileImage}
                    onProfilePress={toggleSidebar}
                />

                <View className="bg-zinc-800 rounded-full flex-row items-center px-4 py-3 mb-6">
                    <Feather name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search by recipes"
                        className="ml-2 flex-1 text-white"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <TouchableOpacity className="rounded-3xl overflow-hidden mb-6 relative">
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1548&q=80' }}
                        className="w-full h-40"
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 flex items-center justify-center">
                        <View className="bg-white/30 rounded-full p-3">
                            <Feather name="play" size={24} color="white" />
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
                                <Text className="text-white font-bold text-lg">{recipe.title}</Text>
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
                userData={userData}
                onProfilePress={toggleDrawer}
            />

            <BottomProfileDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                userData={userData}
            />
        </SafeAreaView>
    );
};

export default HomeScreen;