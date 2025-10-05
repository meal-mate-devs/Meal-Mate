"use client"
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import React, { useState } from "react"
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { useFavoritesStore } from "../../hooks/useFavoritesStore"

const FavoritesScreen: React.FC = () => {
  const params = useLocalSearchParams()
  const { favorites, removeFromFavorites } = useFavoritesStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)

  const filteredFavorites = favorites.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4 mt-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => {
            // If accessed from sidebar, go back to home screen
            if (params.from === 'sidebar') {
              router.push('/(protected)/(tabs)/home')
            } else {
              router.back()
            }
          }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">My Favorites</Text>
          <View className="w-6" />
        </View>
        <Text className="text-gray-400 text-center mt-2">{favorites.length} saved recipes</Text>
      </View>

      {/* Search Bar */}
      <View className="bg-zinc-800 rounded-full flex-row items-center px-4 py-3 mb-4 mx-4">
        <Feather name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search your favorites"
          className="ml-2 flex-1 text-white"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Favorites List */}
      <ScrollView className="flex-1 px-4">
        {filteredFavorites.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="heart-outline" size={64} color="#4B5563" />
            <Text className="text-gray-400 text-lg mt-4 text-center">
              {searchQuery ? "No recipes found" : "No favorite recipes yet"}
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start adding recipes to your favorites to see them here"}
            </Text>
          </View>
        ) : (
          filteredFavorites.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id
            return (
              <View key={recipe.id} className="bg-zinc-800 mb-4 rounded-3xl overflow-hidden">
                <TouchableOpacity onPress={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}>
                  <Image source={{ uri: recipe.image || 'https://via.placeholder.com/400x200?text=No+Image' }} className="w-full h-44" resizeMode="cover" />
                  <View className="absolute top-3 right-3">
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert("Remove from Favorites", "Are you sure you want to remove this recipe from your favorites?", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeFromFavorites(recipe.id),
                          },
                        ])
                      }}
                      className="bg-black/50 rounded-full p-2"
                    >
                      <Ionicons name="heart" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <View className="absolute bottom-3 right-3">
                    <View className="bg-black/50 rounded-full p-2">
                      <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="white" />
                    </View>
                  </View>
                </TouchableOpacity>

                <View className="p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-lg">{recipe.title}</Text>
                      <Text className="text-gray-400 font-medium text-sm" numberOfLines={2}>
                        {recipe.description}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 ml-1">{recipe.prepTime + recipe.cookTime} min</Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <Ionicons name="people-outline" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 ml-1">{recipe.servings} servings</Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <MaterialIcons name="signal-cellular-alt" size={16} color="#9CA3AF" />
                      <Text className="text-gray-400 ml-1">{recipe.difficulty}</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View className="border-t border-zinc-700 pt-4">
                      {/* Nutrition */}
                      <View className="mb-4">
                        <Text className="text-white text-lg font-bold mb-2">Nutrition (per serving)</Text>
                        <View className="flex-row justify-around">
                          <View className="items-center">
                            <Text className="text-yellow-400 text-lg font-bold">{recipe.nutritionInfo.calories}</Text>
                            <Text className="text-zinc-500 text-xs">cal</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-emerald-400 text-lg font-bold">{recipe.nutritionInfo.protein}g</Text>
                            <Text className="text-zinc-500 text-xs">protein</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-blue-400 text-lg font-bold">{recipe.nutritionInfo.carbs}g</Text>
                            <Text className="text-zinc-500 text-xs">carbs</Text>
                          </View>
                          <View className="items-center">
                            <Text className="text-orange-400 text-lg font-bold">{recipe.nutritionInfo.fat}g</Text>
                            <Text className="text-zinc-500 text-xs">fat</Text>
                          </View>
                        </View>
                      </View>

                      {/* Ingredients */}
                      <View className="mb-4">
                        <Text className="text-white text-lg font-bold mb-2">Ingredients</Text>
                        {recipe.ingredients.map((ingredient, index) => (
                          <View key={index} className="flex-row items-center mb-1">
                            <View className="w-2 h-2 bg-emerald-500 rounded-full mr-3" />
                            <Text className="text-gray-300 text-sm">
                              {ingredient.amount} {ingredient.unit} {ingredient.name}
                              {ingredient.notes && ` (${ingredient.notes})`}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Instructions */}
                      <View className="mb-4">
                        <Text className="text-white text-lg font-bold mb-2">Instructions</Text>
                        {recipe.instructions.map((instruction, index) => (
                          <View key={index} className="flex-row mb-3">
                            <View className="bg-amber-500 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                              <Text className="text-black text-sm font-bold">{instruction.step}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-300 text-sm leading-5">{instruction.instruction}</Text>
                              {instruction.tips && (
                                <Text className="text-amber-300 text-xs mt-1 italic">{instruction.tips}</Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Chef's Tips */}
                      {recipe.tips.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-white text-lg font-bold mb-2">Chef's Tips</Text>
                          {recipe.tips.map((tip, index) => (
                            <View key={index} className="flex-row items-start mb-2">
                              <Ionicons name="star" size={14} color="#FBBF24" />
                              <Text className="text-amber-100 text-sm leading-5 flex-1 ml-2">{tip}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Substitutions */}
                      {recipe.substitutions && recipe.substitutions.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-white text-lg font-bold mb-2">Ingredient Substitutions</Text>
                          {recipe.substitutions.map((sub, index) => (
                            <View key={index} className="bg-zinc-700 rounded-lg p-3 mb-2">
                              <Text className="text-white font-semibold">
                                {sub.original} → {sub.substitute}
                              </Text>
                              <Text className="text-zinc-400 text-sm">Ratio: {sub.ratio}</Text>
                              <Text className="text-zinc-300 text-sm">{sub.notes}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Save Button */}
                      <View className="flex-row justify-center mt-4">
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert("Recipe Saved", "This recipe is already in your favorites!")
                          }}
                          className="bg-amber-500/20 border border-amber-500/30 rounded-xl py-3 px-6 flex-row items-center"
                        >
                          <Ionicons name="bookmark" size={18} color="#FBBF24" />
                          <Text className="text-amber-400 font-semibold ml-2">Saved to Favorites</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default FavoritesScreen
