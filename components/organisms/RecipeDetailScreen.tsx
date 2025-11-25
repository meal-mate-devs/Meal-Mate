import { dummyRecipes } from '@/lib/utils';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


const RecipeDetailScreen = () => {
    const { id } = useLocalSearchParams();

    const recipe = dummyRecipes.find(r => r.id === id) || dummyRecipes[0];

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <Image
                source={{ uri: recipe.image }}
                className="w-full h-60"
                resizeMode="cover"
            />

            <View className="px-4 py-4">
                <Text className="text-2xl font-bold text-gray-800">{recipe.name}</Text>

                <View className="flex-row justify-between mt-4">
                    <View className="items-center">
                        <Text className="text-xl font-bold text-green-700">{recipe.calories}</Text>
                        <Text className="text-gray-500 text-sm">kcal</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-xl font-bold text-green-700">{recipe.weight}</Text>
                        <Text className="text-gray-500 text-sm">grams</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-xl font-bold text-green-700">{recipe.rating}</Text>
                        <Text className="text-gray-500 text-sm">rating</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-xl font-bold text-green-700">{recipe.prepTime}</Text>
                        <Text className="text-gray-500 text-sm">minutes</Text>
                    </View>
                </View>

                <View className="flex-row mt-4">
                    <View className="bg-gray-100 rounded-full px-4 py-1 mr-2">
                        <Text className="text-gray-600">{recipe.category}</Text>
                    </View>
                    <View className="bg-gray-100 rounded-full px-4 py-1 mr-2">
                        <Text className="text-gray-600">Fast</Text>
                    </View>
                    <View className="bg-gray-100 rounded-full px-4 py-1">
                        <Text className="text-gray-600">Easy</Text>
                    </View>
                </View>
            </View>

            <View className="px-4 pb-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-gray-800">Ingredients</Text>
                    <Text className="text-gray-500">{recipe.ingredients.length} items</Text>
                </View>

                {recipe.ingredients.map((ingredient, index) => (
                    <View
                        key={index}
                        className="flex-row justify-between items-center py-3 border-b border-gray-100"
                    >
                        <View className="flex-row items-center">
                            <Text className="text-2xl mr-4">{ingredient.icon}</Text>
                            <Text className="text-gray-800 text-lg">{ingredient.name}</Text>
                        </View>
                        <Text className="text-gray-600">{ingredient.amount}</Text>
                    </View>
                ))}
            </View>

            <View className="px-4 pb-8 pt-2 flex-row items-center">
                <TouchableOpacity className="mr-4">
                    <View className="w-12 h-12 rounded-full border border-gray-200 items-center justify-center">
                        <Ionicons name="heart-outline" size={24} color="#2E7D66" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 bg-green-700 py-4 rounded-full flex-row items-center justify-center"
                    onPress={() => router.push('/recipe/cooking')}
                >
                    <Text className="text-white font-bold text-lg mr-2">Start cooking</Text>
                    <Feather name="play" size={18} color="white" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default RecipeDetailScreen;