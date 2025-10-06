"use client"
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFavoritesStore } from "../../hooks/useFavoritesStore"
import Dialog from "../atoms/Dialog"

const FavoritesScreen: React.FC = () => {
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { favorites, removeFromFavorites, getFavorites, refreshFavorites, isLoading, error } = useFavoritesStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [recipeToRemove, setRecipeToRemove] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))

  // Fetch favorites on screen focus with debug logging
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 FavoritesScreen: Fetching favorites on focus')
      console.log('🔄 Current favorites count:', favorites.length)
      getFavorites().then(() => {
        console.log('✅ getFavorites completed')
      }).catch((err) => {
        console.error('❌ getFavorites error:', err)
      })
      return () => undefined
    }, [getFavorites, favorites.length])
  )

  // Initial load if no favorites with debug logging
  useEffect(() => {
    console.log('📊 FavoritesScreen state:', { favoritesCount: favorites.length, isLoading, error })
    if (!favorites.length && !isLoading && !error) {
      console.log('🚀 FavoritesScreen: Initial fetch triggered')
      getFavorites().then(() => {
        console.log('✅ Initial getFavorites completed')
      }).catch((err) => {
        console.error('❌ Initial getFavorites error:', err)
      })
    }
  }, [favorites.length, getFavorites, isLoading, error])

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshFavorites()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshFavorites])

  // Add test data for UI testing when no backend data
  const mockFavorites = favorites.length === 0 && !isLoading && !error ? [
    {
      id: 'test-1',
      userId: 'test-user',
      recipeId: 'test-recipe-1',
      title: 'Delicious Pasta Carbonara',
      description: 'A classic Italian pasta dish with eggs, cheese, and pancetta that comes together in just 20 minutes.',
      cookTime: 15,
      prepTime: 5,
      servings: 4,
      difficulty: 'Medium' as const,
      cuisine: 'Italian',
      category: 'Main Course',
      ingredients: [
        { name: 'Spaghetti', amount: '400', unit: 'g' },
        { name: 'Pancetta', amount: '150', unit: 'g', notes: 'diced' },
        { name: 'Eggs', amount: '3', unit: 'large' },
        { name: 'Parmesan cheese', amount: '100', unit: 'g', notes: 'grated' }
      ],
      instructions: [
        { step: 1, instruction: 'Cook spaghetti in salted boiling water until al dente', duration: 10 },
        { step: 2, instruction: 'Fry pancetta until crispy', duration: 5 },
        { step: 3, instruction: 'Mix eggs and cheese in a bowl' },
        { step: 4, instruction: 'Combine everything and toss quickly', tips: 'Work fast to avoid scrambling eggs' }
      ],
      nutritionInfo: {
        calories: 520,
        protein: 25,
        carbs: 65,
        fat: 18
      },
      tips: ['Use room temperature eggs for best results', 'Reserve pasta water for consistency'],
      substitutions: [
        { original: 'Pancetta', substitute: 'Bacon', ratio: '1:1', notes: 'Bacon works well as substitute' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] : []

  // Use mock data for testing if no real favorites
  const displayFavorites = favorites.length > 0 ? favorites : mockFavorites
  const displayFilteredFavorites = displayFavorites.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const showLoadingState = isLoading && !displayFavorites.length && !isRefreshing
  const showEmptyState = !showLoadingState && !error && displayFilteredFavorites.length === 0
  
  // Debug logging and test data
  console.log('🔍 FavoritesScreen render state:', {
    realFavoritesCount: favorites.length,
    displayFavoritesCount: displayFavorites.length,
    filteredCount: displayFilteredFavorites.length,
    isLoading,
    error,
    showLoadingState,
    showEmptyState,
    searchQuery,
    usingMockData: displayFavorites.length > 0 && favorites.length === 0
  })

  // Comprehensive share functionality matching Recipe Response pattern
  const handleShareRecipe = async (recipe: any): Promise<void> => {
    let recipeText = `🍽️ ${recipe.title}\n\n`
    recipeText += `📝 ${recipe.description || 'Delicious recipe from Meal Mate'}\n\n`
    
    // Add timing information
    recipeText += `⏱️ Prep: ${recipe.prepTime}m | Cook: ${recipe.cookTime}m | Total: ${recipe.prepTime + recipe.cookTime}m\n`
    recipeText += `🍽️ Servings: ${recipe.servings} | Difficulty: ${recipe.difficulty} | Cuisine: ${recipe.cuisine}\n\n`

    // Add nutrition facts
    recipeText += `📊 Nutrition (per serving):\n`
    recipeText += `• Calories: ${recipe.nutritionInfo.calories}\n`
    recipeText += `• Protein: ${recipe.nutritionInfo.protein}g\n`
    recipeText += `• Carbs: ${recipe.nutritionInfo.carbs}g\n`
    recipeText += `• Fat: ${recipe.nutritionInfo.fat}g\n\n`

    // Add ingredients list
    recipeText += `🛒 Ingredients:\n`
    recipe.ingredients.forEach((ingredient: any, index: number) => {
      recipeText += `${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
      if (ingredient.notes) {
        recipeText += ` (${ingredient.notes})`
      }
      recipeText += `\n`
    })
    recipeText += `\n`

    // Add instructions
    recipeText += `👨‍🍳 Instructions:\n`
    recipe.instructions.forEach((instruction: any) => {
      recipeText += `${instruction.step}. ${instruction.instruction}`
      if (instruction.duration) {
        recipeText += ` (${instruction.duration} min)`
      }
      recipeText += `\n`
      if (instruction.tips) {
        recipeText += `   💡 ${instruction.tips}\n`
      }
    })
    recipeText += `\n`

    // Add chef's tips
    if (recipe.tips && recipe.tips.length > 0) {
      recipeText += `💡 Chef's Tips:\n`
      recipe.tips.forEach((tip: string) => {
        const cleanTip = tip.indexOf('\n') !== -1 ? tip.substring(0, tip.indexOf('\n')).trim() : tip
        recipeText += `• ${cleanTip}\n`
      })
      recipeText += `\n`
    }

    // Add substitutions
    if (recipe.substitutions && recipe.substitutions.length > 0) {
      recipeText += `🔄 Ingredient Substitutions:\n`
      recipe.substitutions.forEach((sub: any) => {
        recipeText += `• ${sub.original} → ${sub.substitute} (Ratio: ${sub.ratio})\n`
        if (sub.notes) {
          recipeText += `  ${sub.notes}\n`
        }
      })
      recipeText += `\n`
    }

    recipeText += `---\nShared from Meal Mate App 🍳`

    try {
      await Share.share({
        title: recipe.title,
        message: recipeText,
      })
    } catch (error) {
      console.error('❌ Error sharing recipe:', error)
    }
  }

  const handleRemoveFromFavorites = async () => {
    if (recipeToRemove) {
      try {
        await removeFromFavorites(recipeToRemove)
        console.log("✅ Recipe removed from favorites")
      } catch (error) {
        console.error("❌ Error removing recipe from favorites:", error)
      }
      setRecipeToRemove(null)
    }
    setShowRemoveDialog(false)
  }

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar barStyle="light-content" backgroundColor="#111827" translucent={false} />

      {/* 🎨 Enhanced Header with Safe Area - Recipe Response Style */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 20,
          backgroundColor: "#111827",
          borderBottomWidth: 2,
          borderBottomColor: "#374151",
          zIndex: 100,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
        }}
        className="px-6"
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => {
              if (params.from === "sidebar") {
                router.push("/(protected)/(tabs)/home")
              } else {
                router.back()
              }
            }}
            className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center shadow-lg"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#F9FAFB" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-white text-2xl font-bold leading-tight tracking-tight">My Favorites</Text>
            <View className="w-8 h-0.5 bg-amber-500 rounded-full mt-2" />
            <View className="flex-row items-center mt-2">
              <Ionicons name="heart" size={16} color="#EF4444" />
              <Text className="text-gray-300 text-sm ml-1">{displayFavorites.length} saved recipes</Text>
            </View>
          </View>

          <View className="w-12" />
        </View>

        {/* 🔍 Enhanced Search Bar - Recipe Response Style */}
        <View className="bg-gray-800 border-2 border-gray-600 rounded-2xl flex-row items-center px-4 py-3 shadow-lg">
          <Feather name="search" size={20} color="#FBBF24" />
          <TextInput
            placeholder="Search your favorites..."
            className="ml-3 flex-1 text-white text-base"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="bg-gray-600 rounded-full p-1 ml-2"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 🍽️ Enhanced Favorites List - Recipe Response Style */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FBBF24"
            colors={["#FBBF24", "#F59E0B"]}
          />
        }
      >
        {showLoadingState ? (
          <Animated.View 
            className="flex-1 items-center justify-center py-24"
            style={{ opacity: fadeAnim }}
          >
            <ActivityIndicator size="large" color="#FBBF24" />
            <Text className="text-gray-300 text-base font-medium mt-4">Loading your favorites...</Text>
          </Animated.View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-24">
            <View className="w-24 h-24 rounded-full bg-gray-800/90 border-2 border-amber-500/30 items-center justify-center mb-6">
              <Ionicons name="alert-circle-outline" size={48} color="#FCD34D" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">{error}</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl px-6 py-3 mt-4"
              activeOpacity={0.8}
            >
              <Text className="text-amber-300 font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : showEmptyState ? (
          <Animated.View 
            className="flex-1 items-center justify-center py-20"
            style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          >
            <View className="relative mb-8">
              <View className="absolute inset-0 bg-red-500/15 rounded-full blur-2xl scale-125" />
              <View className="w-24 h-24 rounded-full bg-gray-800/90 border-2 border-red-500/30 items-center justify-center">
                <Ionicons name="heart-outline" size={48} color="#EF4444" />
              </View>
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight text-center leading-tight mb-4">
              {searchQuery ? "No Recipes Found" : "No Favorite Recipes"}
            </Text>
            <View className="w-16 h-px bg-amber-500/40 mb-4" />
            <Text className="text-gray-300 text-center text-base leading-relaxed px-6 max-w-md">
              {searchQuery
                ? "Try adjusting your search terms to find your saved recipes"
                : "Start adding delicious recipes to your favorites to see them here"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push("/(protected)/(tabs)/home")}
                className="bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl px-8 py-4 mt-8"
                activeOpacity={0.8}
              >
                <Text className="text-amber-300 font-semibold text-base tracking-wide">Discover Recipes</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            {displayFilteredFavorites.map((recipe, index) => {
              const isExpanded = expandedRecipeId === recipe.id

              return (
                <View key={recipe.id} className="bg-gray-800 border-2 border-gray-600 mb-6 rounded-2xl overflow-hidden shadow-xl">
                  <TouchableOpacity
                    onPress={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                    className="p-6"
                    activeOpacity={0.8}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-4">
                        <Text className="text-white font-bold text-xl mb-2 leading-tight tracking-tight">{recipe.title}</Text>
                        <Text className="text-gray-300 text-base mb-4 leading-relaxed" numberOfLines={isExpanded ? undefined : 2}>
                          {recipe.description || 'Delicious recipe from your favorites'}
                        </Text>

                        {/* 📊 Enhanced Recipe Stats - Recipe Response Style */}
                        <View className="flex-row items-center flex-row">
                          <View className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={14} color="#10B981" />
                              <Text className="text-emerald-300 ml-1 text-xs font-semibold">
                                {recipe.prepTime + recipe.cookTime} min
                              </Text>
                            </View>
                          </View>
                          <View className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                            <View className="flex-row items-center">
                              <Ionicons name="people-outline" size={14} color="#3B82F6" />
                              <Text className="text-blue-300 ml-1 text-xs font-semibold">
                                {recipe.servings} servings
                              </Text>
                            </View>
                          </View>
                          <View className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 mb-2">
                            <View className="flex-row items-center">
                              <MaterialIcons name="signal-cellular-alt" size={14} color="#8B5CF6" />
                              <Text className="text-purple-300 ml-1 text-xs font-semibold">{recipe.difficulty}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 🎛️ Enhanced Action Buttons - Column Layout */}
                      <View className="flex-col items-center space-y-3">
                      {/* Expand/Collapse Indicator */}
                        <View className="bg-gray-700/60 border border-gray-600 rounded-xl p-2 shadow-lg">
                          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="white" />
                        </View>
                        {/* Share Button */}
                        <TouchableOpacity
                          onPress={() => handleShareRecipe(recipe)}
                          className="w-12 h-12 rounded-xl bg-gray-700/10 border border-gray-600/40 items-center justify-center shadow-sm"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="share-outline" size={20} color="#FBBF24" />
                        </TouchableOpacity>
                        
                        {/* Remove from Favorites Button */}
                        <TouchableOpacity
                          onPress={() => {
                            setRecipeToRemove(recipe.id)
                            setShowRemoveDialog(true)
                          }}
                          className="w-12 h-12 rounded-xl bg-gray-700/10 border border-gray-600/40 items-center p-2 justify-center shadow-sm"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="heart" size={20} color="#EF4444" />
                        </TouchableOpacity>


                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* 🎨 Enhanced Expanded Content - Recipe Response Style */}
                  {isExpanded && (
                  <View className="px-6 pb-6">
                    <View className="border-t border-gray-600/50 pt-6">
                      {/* 📊 Enhanced Nutrition Section */}
                      <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                          <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                          <Text className="text-white text-xl font-bold tracking-tight">Nutrition</Text>
                          <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                        </View>
                        <View className="bg-gray-800 border-2 border-gray-600 rounded-xl p-4 shadow-lg">
                          <View className="flex-row items-center justify-between">
                            <View className="items-center flex-1">
                              <Text className="text-amber-400 text-xl font-bold mb-1">
                                {recipe.nutritionInfo.calories}
                              </Text>
                              <Text className="text-gray-300 text-xs tracking-wide font-semibold">CALORIES</Text>
                            </View>
                            <View className="w-px h-12 bg-gray-500" />
                            <View className="items-center flex-1">
                              <Text className="text-emerald-400 text-xl font-bold mb-1">
                                {recipe.nutritionInfo.protein}g
                              </Text>
                              <Text className="text-gray-300 text-xs tracking-wide font-semibold">PROTEIN</Text>
                            </View>
                            <View className="w-px h-12 bg-gray-500" />
                            <View className="items-center flex-1">
                              <Text className="text-blue-400 text-xl font-bold mb-1">{recipe.nutritionInfo.carbs}g</Text>
                              <Text className="text-gray-300 text-xs tracking-wide font-semibold">CARBS</Text>
                            </View>
                            <View className="w-px h-12 bg-gray-500" />
                            <View className="items-center flex-1">
                              <Text className="text-orange-400 text-xl font-bold mb-1">{recipe.nutritionInfo.fat}g</Text>
                              <Text className="text-gray-300 text-xs tracking-wide font-semibold">FAT</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 🥕 Enhanced Ingredients Section - Recipe Response Style */}
                      <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                          <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                          <Text className="text-white text-xl font-bold tracking-tight">Ingredients</Text>
                          <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                        </View>
                        <View className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-3 shadow-xl">
                          {recipe.ingredients.map((ingredient, index) => (
                            <View
                              key={`ingredient-${recipe.id}-${index}`}
                              className={`flex-row items-start py-2 ${
                                index !== recipe.ingredients.length - 1 ? "border-b border-gray-500" : ""
                              }`}
                            >
                              <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border-2 border-emerald-400/40 items-center justify-center mr-4 mt-0.5 shadow-lg">
                                <Text className="text-emerald-100 text-base font-bold">{index + 1}</Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-white text-base leading-relaxed">
                                  <Text className="font-bold">
                                    {ingredient.amount} {ingredient.unit}
                                  </Text>
                                  <Text> {ingredient.name}</Text>
                                </Text>
                                {ingredient.notes && (
                                  <Text className="text-gray-300 text-sm mt-2 leading-6 italic">{ingredient.notes}</Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* 👨‍🍳 Enhanced Instructions Section - Recipe Response Style */}
                      <View className="mb-6">
                        <View className="flex-row items-center mb-5">
                          <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                          <Text className="text-white text-xl font-bold tracking-tight">Instructions</Text>
                          <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                        </View>
                        <View className="space-y-4">
                          {recipe.instructions.map((instruction, index) => (
                            <View
                              key={`instruction-${recipe.id}-${index}`}
                              className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-6 shadow-xl"
                            >
                              <View className="flex-row">
                                <View className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl items-center justify-center mr-4 shadow-xl border-2 border-amber-400/40">
                                  <Text className="text-white font-bold text-xl">{instruction.step}</Text>
                                </View>
                                <View className="flex-1">
                                  <Text className="text-white text-base leading-7">{instruction.instruction}</Text>
                                  {instruction.tips && (
                                    <View className="bg-amber-500/10 border-2 border-amber-500/20 rounded-xl p-4 mt-3">
                                      <View className="flex-row items-start">
                                        <View className="w-7 h-7 rounded-lg bg-amber-500/15 items-center justify-center mr-3">
                                          <Ionicons name="bulb-outline" size={14} color="#FCD34D" />
                                        </View>
                                        <Text className="text-amber-100 text-sm leading-6 flex-1">{instruction.tips}</Text>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* ⭐ Enhanced Chef's Tips - Recipe Response Style */}
                      {recipe.tips && recipe.tips.length > 0 && (
                        <View className="mb-6">
                          <View className="flex-row items-center mb-5">
                            <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                            <Text className="text-white text-xl font-bold tracking-tight">Chef's Tips</Text>
                            <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                          </View>
                          <View className="bg-amber-500/20 border-2 border-amber-400/60 rounded-2xl p-6 shadow-xl">
                            {recipe.tips.map((tip, index) => (
                              <View
                                key={`tip-${recipe.id}-${index}`}
                                className={`flex-row items-start ${
                                  index !== recipe.tips.length - 1 ? "mb-5 pb-5 border-b border-amber-400/30" : ""
                                }`}
                              >
                                <View className="w-7 h-7 rounded-lg bg-amber-500/25 items-center justify-center mr-3 mt-0.5">
                                  <Ionicons name="star" size={14} color="#FCD34D" />
                                </View>
                                <Text className="text-amber-100 text-base leading-7 flex-1">{tip}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* 🔄 Enhanced Substitutions - Recipe Response Style */}
                      {recipe.substitutions && recipe.substitutions.length > 0 && (
                        <View className="mb-6">
                          <View className="flex-row items-center justify-between mb-5">
                            <View className="flex-row items-center">
                              <View className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
                              <Text className="text-white text-xl font-bold tracking-tight">Substitutions</Text>
                            </View>
                            <View className="bg-blue-500/20 border-2 border-blue-500/40 px-4 py-2 rounded-full shadow-md">
                              <Text className="text-blue-300 text-xs font-bold">{recipe.substitutions.length} options</Text>
                            </View>
                          </View>
                          <View className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-5 space-y-5 shadow-xl">
                            {recipe.substitutions.map((sub, index) => (
                              <View
                                key={`substitution-${recipe.id}-${index}`}
                                className={`${index !== recipe.substitutions.length - 1 ? "pb-5 border-b border-gray-500" : ""}`}
                              >
                                <View className="flex-row items-center mb-3">
                                  <View className="w-9 h-9 rounded-xl bg-blue-500/15 items-center justify-center mr-3">
                                    <Ionicons name="swap-horizontal" size={18} color="#3b82f6" />
                                  </View>
                                  <Text className="text-zinc-100 font-bold text-base flex-1">
                                    {sub.original} → {sub.substitute}
                                  </Text>
                                </View>
                                <Text className="text-zinc-300 text-sm mb-2 ml-12">Ratio: {sub.ratio}</Text>
                                <Text className="text-zinc-200 text-sm leading-6 ml-12">{sub.notes}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* 🗑️ Enhanced Remove Button - Recipe Response Style */}
                      <View className="flex-row justify-center mt-6">
                        <TouchableOpacity
                          onPress={() => {
                            setRecipeToRemove(recipe.id)
                            setShowRemoveDialog(true)
                          }}
                          className="bg-red-500/10 border border-red-400/40 rounded-xl py-3 flex-row items-center justify-center shadow-sm"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="heart-dislike" size={20} color="#EF4444" />
                          <Text className="text-red-400 font-bold ml-3 text-base tracking-wide">Remove from Favorites</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  )}
                </View>
              )
            })}
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Bottom Safe Area - Recipe Response Style */}
      <View className="bg-gray-900" style={{ height: insets.bottom }} />

      {/* 🎨 Enhanced Dialog */}
      <Dialog
        visible={showRemoveDialog}
        type="warning"
        title="Remove from Favorites"
        message="Are you sure you want to remove this recipe from your favorites? This action cannot be undone."
        onClose={() => setShowRemoveDialog(false)}
        onConfirm={handleRemoveFromFavorites}
        confirmText="Remove"
        cancelText="Cancel"
        showCancelButton={true}
      />
    </View>
  )
}

export default FavoritesScreen