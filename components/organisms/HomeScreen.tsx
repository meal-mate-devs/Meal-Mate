import { dummyRecipes } from '@/lib/utils';
import { Feather, Ionicons } from '@expo/vector-icons';
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


const userData = {
    name: 'Mark',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
};

const HomeScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('Breakfast');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const filteredRecipes = dummyRecipes.filter(recipe =>
        recipe.category === activeTab || activeTab === 'All'
    );

    const tabs = ['Lunch', 'Breakfast', 'Dinner', 'Dessert'];

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1 px-4">
                <HomeHeader
                    username={userData.name}
                    profileImage={userData.profileImage}
                    onProfilePress={toggleDrawer}
                />

                <View className="bg-gray-100 rounded-full flex-row items-center px-4 py-2 mb-6">
                    <Feather name="search" size={20} color="gray" />
                    <TextInput
                        placeholder="Search by recipes"
                        className="ml-2 flex-1 text-gray-700"
                        placeholderTextColor="gray"
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
                            className={`py-2 px-6 mr-2 rounded-full ${activeTab === tab ? 'bg-green-700' : 'bg-gray-100'
                                }`}
                        >
                            <Text
                                className={`${activeTab === tab ? 'text-white' : 'text-gray-600'
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
                        className="bg-white mb-6 rounded-3xl overflow-hidden shadow-sm"
                        onPress={() => router.push(`/recipe/${recipe.id}`)}
                    >
                        <Image
                            source={{ uri: recipe.image }}
                            className="w-full h-44"
                            resizeMode="cover"
                        />
                        <View className="p-3">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-800 font-bold text-lg">{recipe.title}</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                    <Text className="text-gray-600 ml-1">{recipe.rating}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mt-2">
                                <Text className="text-gray-500 font-medium">{recipe.author}</Text>
                                <View className="flex-row items-center ml-4">
                                    <Ionicons name="time-outline" size={16} color="gray" />
                                    <Text className="text-gray-500 ml-1">{recipe.prepTime} min</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <BottomProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        </SafeAreaView>
    );
};

export default HomeScreen;