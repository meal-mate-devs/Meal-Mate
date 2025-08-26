import { GeneratedRecipe } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import React, { JSX } from "react"
import { Image, Text, TouchableOpacity, View } from "react-native"


interface GeneratedRecipeCardProps {
    recipe: GeneratedRecipe
    onPress: () => void
}

export default function GeneratedRecipeCard({ recipe, onPress }: GeneratedRecipeCardProps): JSX.Element {
    return (
        <TouchableOpacity className="bg-zinc-800 rounded-xl mb-4 overflow-hidden border border-zinc-700" onPress={onPress}>
            {/* Recipe Image */}
            <View className="relative">
                <Image source={{ uri: recipe.image }} className="w-full h-48" resizeMode="cover" />
                <View className="absolute top-3 left-3 bg-black bg-opacity-70 rounded-full px-3 py-1">
                    <Text className="text-yellow-400 text-xs font-bold">✨ AI Generated</Text>
                </View>
                <View className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">{recipe.difficulty}</Text>
                </View>
            </View>

            <View className="p-4">
                <Text className="text-white text-lg font-bold mb-2">{recipe.title}</Text>
                <Text className="text-zinc-400 text-sm mb-3">{recipe.description}</Text>

                <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#FBBF24" />
                        <Text className="text-white text-sm ml-1">{recipe.cookTime + recipe.prepTime} min</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={16} color="#FBBF24" />
                        <Text className="text-white text-sm ml-1">{recipe.servings} servings</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="restaurant-outline" size={16} color="#FBBF24" />
                        <Text className="text-white text-sm ml-1">{recipe.cuisine}</Text>
                    </View>
                </View>

                <View className="flex-row justify-between bg-zinc-700 rounded-lg p-3">
                    <View className="items-center">
                        <Text className="text-yellow-400 text-xs">Calories</Text>
                        <Text className="text-white font-bold">{recipe.nutritionInfo.calories}</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-yellow-400 text-xs">Protein</Text>
                        <Text className="text-white font-bold">{recipe.nutritionInfo.protein}g</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-yellow-400 text-xs">Carbs</Text>
                        <Text className="text-white font-bold">{recipe.nutritionInfo.carbs}g</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-yellow-400 text-xs">Fat</Text>
                        <Text className="text-white font-bold">{recipe.nutritionInfo.fat}g</Text>
                    </View>
                </View>

                <View className="flex-row justify-between mt-4">
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
                        <Text className="text-white ml-2">Like</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
                        <Text className="text-white ml-2">Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                        <Text className="text-white ml-2">Share</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    )
}
