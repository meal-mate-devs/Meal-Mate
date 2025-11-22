"use client"
import { useLanguage } from "@/context/LanguageContext"
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router, useLocalSearchParams } from "expo-router"
import React, { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  BackHandler,
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
  const { favorites, removeFromFavorites, updateFavorite, getFavorites, refreshFavorites, isLoading, error } = useFavoritesStore()
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [recipeToRemove, setRecipeToRemove] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogConfig, setErrorDialogConfig] = useState({
    type: 'error' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: '',
    message: '',
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedRecipe, setEditedRecipe] = useState<any>(null)
  const [showEditSuccessDialog, setShowEditSuccessDialog] = useState(false)

  useEffect(() => {
    const backAction = () => {
      if (expandedRecipeId) {
        setExpandedRecipeId(null)
        return true // Prevent default back action (navigation)
      }
      return false // Allow default back action (navigate away)
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [expandedRecipeId])

  // Show error dialog for network/timeout errors
  useEffect(() => {
    if (error && (error.includes('timeout') || error.includes('connection') || error.includes('network'))) {
      setErrorDialogConfig({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to load favorites. Please check your internet connection and try again.',
      })
      setShowErrorDialog(true)
    }
  }, [error])

  // Loading timeout - show error dialog if loading takes too long
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isLoading && !error) {
      timeoutId = setTimeout(() => {
        console.log('⏰ Loading timeout reached, showing error dialog');
        setErrorDialogConfig({
          type: 'error',
          title: 'Loading Timeout',
          message: 'Taking longer than expected to load your favorites. Please check your connection and try again.',
        });
        setShowErrorDialog(true);
        // Note: We don't force stop loading here as the store will handle it
      }, 15000); // 15 second loading timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, error])

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshFavorites()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshFavorites])

  // test data for UI testing when no backend data

  // Use real favorites data directly, bypass mock data
  const displayFavorites = favorites
  const displayFilteredFavorites = displayFavorites.filter(
    (recipe) =>
      recipe.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const showLoadingState = isLoading
  const showEmptyState = !showLoadingState && !error && displayFilteredFavorites.length === 0

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
      console.log('❌ Error sharing recipe:', error)
    }
  }

  const handleRemoveFromFavorites = async () => {
    if (recipeToRemove) {
      try {
        const success = await removeFromFavorites(recipeToRemove)
        if (success) {
        } else {
          console.log("❌ Failed to remove recipe from favorites")
        }
      } catch (error) {
        console.log("❌ Error removing recipe from favorites:", error)
      }
      setRecipeToRemove(null)
    }
    setShowRemoveDialog(false)
  }

  const handleStartCooking = (recipe: any) => {
    if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
      console.log('❌ No cooking instructions available for this recipe.');
      return;
    }

    // Navigate to cooking screen with recipe data
    router.push({
      pathname: '/recipe/cooking',
      params: {
        recipe: JSON.stringify(recipe),
      },
    });
  }

  const handleSaveEditedRecipe = async (): Promise<void> => {
    if (!editedRecipe) {
      setErrorDialogConfig({
        type: 'error',
        title: 'Update Failed',
        message: 'No recipe data to update.'
      })
      setShowErrorDialog(true)
      return
    }

    try {
      // Extract updatable fields from editedRecipe
      const updateData = {
        recipeId: editedRecipe.recipeId,
        title: editedRecipe.title,
        description: editedRecipe.description,
        cookTime: editedRecipe.cookTime,
        prepTime: editedRecipe.prepTime,
        servings: editedRecipe.servings,
        difficulty: editedRecipe.difficulty,
        cuisine: editedRecipe.cuisine,
        category: editedRecipe.category,
        ingredients: editedRecipe.ingredients,
        instructions: editedRecipe.instructions,
        nutritionInfo: editedRecipe.nutritionInfo,
        tips: editedRecipe.tips,
        substitutions: editedRecipe.substitutions
      }

      const success = await updateFavorite(editedRecipe.recipeId, updateData)
      if (success) {
        setIsEditMode(false)
        setEditedRecipe(null)
        setShowEditSuccessDialog(true)
        // Refresh favorites to show updated data
        await refreshFavorites()
      } else {
        setErrorDialogConfig({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update the recipe. Please try again.'
        })
        setShowErrorDialog(true)
      }
    } catch (error) {
      console.log('❌ Error updating recipe:', error)
      setErrorDialogConfig({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while updating the recipe. Please check your connection and try again.'
      })
      setShowErrorDialog(true)
    }
  }

  return (
    <LinearGradient
      colors={["#09090b", "#18181b"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />

      {/* 🎨 Enhanced Header with Safe Area - Recipe Response Style */}
      <View
        style={{
          paddingTop: insets.top + 18,
          paddingBottom: 20,
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
                router.back()
              } else {
                router.back()
              }
            }}
            className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FACC15" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text className="text-white text-2xl font-bold leading-tight tracking-tight">My Favorites</Text>
            <View className="w-8 h-0.5 rounded-full mt-2" style={{ backgroundColor: "#FACC15" }} />
            <View className="flex-row items-center mt-2">
              <Ionicons name="heart" size={16} color="#FACC15" />
              <Text className="text-gray-300 text-sm ml-1">{displayFavorites.length} saved recipes</Text>
            </View>
          </View>

          <View className="w-12" />
        </View>

        {/* 🔍 Enhanced Search Bar - Recipe Response Style */}
        <View
          className="flex-row items-center px-4 py-3 shadow-lg rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)"
          }}
        >
          <Feather name="search" size={20} color="#FACC15" />
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
              className="rounded-full p-1 ml-2"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color="#94A3B8" />
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
          <View
            className="flex-1 items-center justify-center py-24"
          >
            <ActivityIndicator size="large" color="#FACC15" />
            <Text className="text-gray-300 text-base font-medium mt-4">Loading your favorites...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-24">
            <View
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderWidth: 1,
                borderColor: "rgba(250, 204, 21, 0.3)"
              }}
            >
              <Ionicons name="alert-circle-outline" size={48} color="#FACC15" />
            </View>
            <Text className="text-white text-xl font-bold mb-2">{error}</Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className="rounded-2xl px-6 py-3 mt-4"
              style={{
                backgroundColor: "rgba(250, 204, 21, 0.1)",
                borderWidth: 1,
                borderColor: "rgba(250, 204, 21, 0.3)"
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#FACC15", fontWeight: "600" }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : showEmptyState ? (
          <View
            className="flex-1 items-center justify-center py-20"
          >
            <View className="relative mb-8">
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)"
                }}
              >
                <Ionicons name="heart-outline" size={48} color="#EF4444" />
              </View>
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight text-center leading-tight mb-4">
              {searchQuery ? "No Recipes Found" : "No Favorite Recipes"}
            </Text>
            <View className="w-16 h-px mb-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.4)" }} />
            <Text className="text-gray-300 text-center text-base leading-relaxed px-6 max-w-md">
              {searchQuery
                ? "Try adjusting your search terms to find your saved recipes"
                : "Start adding delicious recipes to your favorites to see them here"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push("/(protected)/(tabs)/home")}
                className="rounded-2xl px-8 py-4 mt-8"
                style={{
                  backgroundColor: "rgba(250, 204, 21, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(250, 204, 21, 0.3)"
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "#FACC15", fontWeight: "600", fontSize: 16, letterSpacing: 0.5 }}>Discover Recipes</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            {displayFilteredFavorites.map((recipe, index) => {
              // Comprehensive ID resolution - check all possible ID fields
              const recipeId = recipe.id || recipe._id || recipe.recipeId || `recipe-${index}`
              const isExpanded = expandedRecipeId === recipeId

              return (
                <View
                  key={`recipe-${recipeId}-${index}`}
                  className="mb-6 rounded-2xl overflow-hidden shadow-xl bg-zinc-800"
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (!isExpanded) {
                        setExpandedRecipeId(recipeId)
                      }
                    }}
                    className="p-6"
                    activeOpacity={0.8}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-4">
                        <Text className="text-white font-bold text-xl mb-2 leading-tight tracking-tight">{recipe.title}</Text>

                        {/* Creator Name - Show who created this recipe */}
                        {recipe.creator && (
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="person" size={14} color="#A78BFA" />
                            <Text className="text-purple-300 text-sm font-semibold ml-1">
                              By: {recipe.creator}
                            </Text>
                          </View>
                        )}

                        <Text className="text-gray-300 text-base mb-4 leading-relaxed" numberOfLines={isExpanded ? undefined : 2}>
                          {recipe.description || 'Delicious recipe from your favorites'}
                        </Text>

                        {/* Recipe Stats - Recipe Response Style */}
                        <View className="flex-row items-center flex-row">
                          <View
                            className="rounded-full px-2 py-1 mr-2 mb-2"
                            style={{
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              borderWidth: 1,
                              borderColor: "rgba(34, 197, 94, 0.3)"
                            }}
                          >
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={14} color="#22C55E" />
                              <Text style={{ color: "#22C55E", marginLeft: 4, fontSize: 12, fontWeight: "600" }}>
                                {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                              </Text>
                            </View>
                          </View>
                          <View
                            className="rounded-full px-2 py-1 mr-2 mb-2"
                            style={{
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              borderWidth: 1,
                              borderColor: "rgba(59, 130, 246, 0.3)"
                            }}
                          >
                            <View className="flex-row items-center">
                              <Ionicons name="people-outline" size={14} color="#3B82F6" />
                              <Text style={{ color: "#3B82F6", marginLeft: 4, fontSize: 12, fontWeight: "600" }}>
                                {recipe.servings || 1} servings
                              </Text>
                            </View>
                          </View>
                          <View
                            className="rounded-full px-2 py-1 mb-2"
                            style={{
                              backgroundColor: "rgba(139, 92, 246, 0.1)",
                              borderWidth: 1,
                              borderColor: "rgba(139, 92, 246, 0.3)"
                            }}
                          >
                            <View className="flex-row items-center">
                              <MaterialIcons name="signal-cellular-alt" size={14} color="#8B5CF6" />
                              <Text style={{ color: "#8B5CF6", marginLeft: 4, fontSize: 12, fontWeight: "600" }}>{recipe.difficulty || 'Easy'}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 🎛️ Enhanced Action Buttons - Right Side */}
                      <View className="flex-col items-center space-y-6">
                        {/* Remove from Favorites Button */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation()
                            // First collapse the recipe
                            setExpandedRecipeId(null)
                            // Use recipeId for deletion (backend expects this field)
                            const removeId = recipe.recipeId || recipe.id || recipe._id || recipeId
                            setRecipeToRemove(removeId)
                            setShowRemoveDialog(true)
                          }}
                          className="w-12 h-12 rounded-lg items-center justify-center shadow-sm mb-3"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            borderWidth: 1,
                            borderColor: "rgba(239, 68, 68, 0.3)"
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="heart" size={20} color="#EF4444" />
                        </TouchableOpacity>

                        {/* Share Button */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation()
                            handleShareRecipe(recipe)
                          }}
                          className="w-12 h-12 rounded-lg items-center justify-center shadow-sm"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                            borderWidth: 1,
                            borderColor: "rgba(250, 204, 21, 0.3)"
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="share-outline" size={20} color="#FACC15" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Expand/Collapse Button - Below Stats */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation()
                        setExpandedRecipeId(isExpanded ? null : recipeId)
                      }}
                      className="flex-row items-center justify-center mt-3"
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                    >
                      <Text style={{ color: "#FACC15", fontSize: 14, marginRight: 8 }}>
                        {isExpanded ? "Show Less" : "Show More"}
                      </Text>
                      <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#FACC15" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* 🎨 Enhanced Expanded Content - Recipe Response Style */}
                  {isExpanded && (
                    <View className="px-6 pb-6">
                      <View
                        className="pt-6"
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: "rgba(255, 255, 255, 0.08)"
                        }}
                      >
                        {/* Creator Name in Expanded View */}
                        {recipe.creator && (
                          <View className="mb-4">
                            <View className="flex-row items-center">
                              <Ionicons name="person-circle-outline" size={18} color="#A78BFA" />
                              <Text className="text-purple-300 text-sm font-semibold ml-2">
                                by {recipe.creator}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* 📊 Enhanced Nutrition Section */}
                        <View className="mb-6">
                          <View className="flex-row items-center mb-4">
                            <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                            <Text className="text-white text-xl font-bold tracking-tight">Nutrition</Text>
                            <View className="flex-1 h-px ml-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }} />
                          </View>
                          <View
                            className="rounded-xl p-4 shadow-lg bg-zinc-800"
                            style={{
                              borderWidth: 1,
                              borderColor: "rgba(255, 255, 255, 0.08)"
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="items-center flex-1">
                                <Text className="text-amber-400 text-xl font-bold mb-1">
                                  {recipe.nutritionInfo.calories}
                                </Text>
                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">CALORIES</Text>
                              </View>
                              <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                              <View className="items-center flex-1">
                                <Text className="text-emerald-400 text-xl font-bold mb-1">
                                  {recipe.nutritionInfo.protein}g
                                </Text>
                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">PROTEIN</Text>
                              </View>
                              <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                              <View className="items-center flex-1">
                                <Text style={{ color: "#3B82F6" }} className="text-xl font-bold mb-1">{recipe.nutritionInfo.carbs}g</Text>
                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">CARBS</Text>
                              </View>
                              <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                              <View className="items-center flex-1">
                                <Text style={{ color: "#F59E0B" }} className="text-xl font-bold mb-1">{recipe.nutritionInfo.fat}g</Text>
                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">FAT</Text>
                              </View>
                            </View>
                          </View>

                          {/* 🥕 Enhanced Ingredients Section - Recipe Response Style */}
                          <View className="mb-6">
                            <View className="flex-row items-center mb-4">
                              <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                              <Text className="text-white text-xl font-bold tracking-tight">Ingredients</Text>
                              <View className="flex-1 h-px ml-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }} />
                            </View>
                            <View
                              className="rounded-2xl p-3 shadow-xl bg-zinc-800"
                              style={{
                                borderWidth: 1,
                                borderColor: "rgba(255, 255, 255, 0.08)"
                              }}
                            >
                              {recipe.ingredients.map((ingredient, index) => (
                                <View
                                  key={`ingredient-${recipe.id}-${index}`}
                                  className={`flex-row items-start py-2 ${index !== recipe.ingredients.length - 1 ? "border-b border-zinc-600" : ""
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
                              <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                              <Text className="text-white text-xl font-bold tracking-tight">Instructions</Text>
                              <View className="flex-1 h-px ml-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }} />
                            </View>
                            <View className="space-y-4">
                              {recipe.instructions.map((instruction, index) => (
                                <View
                                  key={`instruction-${recipe.id}-${index}`}
                                  className="rounded-2xl p-6 shadow-xl bg-zinc-800"
                                  style={{
                                    borderWidth: 1,
                                    borderColor: "rgba(255, 255, 255, 0.08)"
                                  }}
                                >
                                  <View className="flex-row">
                                    <View
                                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-xl"
                                      style={{
                                        backgroundColor: "#FACC15",
                                        borderWidth: 2,
                                        borderColor: "rgba(250, 204, 21, 0.4)"
                                      }}
                                    >
                                      <Text className="text-white font-bold text-xl">{instruction.step}</Text>
                                    </View>
                                    <View className="flex-1">
                                      <Text className="text-white text-base leading-7">{instruction.instruction}</Text>
                                      {instruction.tips && (
                                        <View
                                          className="rounded-xl p-4 mt-3"
                                          style={{
                                            backgroundColor: "rgba(250, 204, 21, 0.1)",
                                            borderWidth: 1,
                                            borderColor: "rgba(250, 204, 21, 0.2)"
                                          }}
                                        >
                                          <View className="flex-row items-start">
                                            <View
                                              className="w-7 h-7 rounded-lg items-center justify-center mr-3"
                                              style={{ backgroundColor: "rgba(250, 204, 21, 0.15)" }}
                                            >
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
                                <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                                <Text className="text-white text-xl font-bold tracking-tight">Chef&apos;s Tips</Text>
                                <View className="flex-1 h-px ml-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }} />
                              </View>
                              <View
                                className="rounded-2xl p-6 shadow-xl"
                                style={{
                                  backgroundColor: "rgba(250, 204, 21, 0.1)",
                                  borderWidth: 1,
                                  borderColor: "rgba(250, 204, 21, 0.3)"
                                }}
                              >
                                {recipe.tips.map((tip, index) => (
                                  <View
                                    key={`tip-${recipe.id}-${index}`}
                                    className={`flex-row items-start ${index !== recipe.tips.length - 1 ? "mb-5 pb-5 border-b border-amber-400/30" : ""
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
                                    className={`${index !== recipe.substitutions.length - 1 ? "pb-5" : ""}`}
                                    style={{
                                      borderBottomWidth: index !== recipe.substitutions.length - 1 ? 1 : 0,
                                      borderBottomColor: "rgba(255, 255, 255, 0.1)"
                                    }}
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

                          {/* � Start Cooking Button - Recipe Response Style */}
                          <View className="flex-row justify-center mt-6 mb-3">
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation()
                                handleStartCooking(recipe)
                              }}
                              className="rounded-xl py-3 flex-row items-center justify-center shadow-sm flex-1"
                              activeOpacity={0.7}
                            >
                              <LinearGradient
                                colors={['#FACC15', '#F97316']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  borderRadius: 12,
                                }}
                              />
                              <Ionicons name="flame" size={20} color="#FFFFFF" />
                              <Text style={{ color: "#FFFFFF", fontWeight: "700", marginLeft: 12, fontSize: 16, letterSpacing: 0.5 }}>Start Cooking</Text>
                            </TouchableOpacity>
                          </View>

                          {/* �🗑️ Enhanced Remove Button - Recipe Response Style */}
                          <View className="flex-row justify-center mt-3">
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation()
                                // First collapse the recipe
                                setExpandedRecipeId(null)
                                // Then set up for removal
                                setRecipeToRemove(recipe.id)
                                setShowRemoveDialog(true)
                              }}
                              className="rounded-xl py-3 flex-row items-center justify-center shadow-sm"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                borderWidth: 1,
                                borderColor: "rgba(239, 68, 68, 0.3)"
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={{ color: "#EF4444", fontWeight: "600", marginLeft: 12, marginRight: 12, fontSize: 16, letterSpacing: 0.5 }}>Remove from Favorites</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Safe Area - Recipe Response Style */}
      <View style={{ height: insets.bottom, backgroundColor: "#000000" }} />

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

      {/* Error Dialog */}
      <Dialog
        visible={showErrorDialog}
        type={errorDialogConfig.type}
        title={errorDialogConfig.title}
        message={errorDialogConfig.message}
        confirmText="Retry"
        cancelText="Cancel"
        showCancelButton={true}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => {
          setShowErrorDialog(false);
          // Clear the error and retry loading
          handleRefresh();
        }}
        onCancel={() => setShowErrorDialog(false)}
      />

      {/* Edit Success Dialog */}
      <Dialog
        visible={showEditSuccessDialog}
        type="success"
        title="Recipe Updated"
        message="Your recipe has been successfully updated!"
        confirmText="OK"
        onClose={() => setShowEditSuccessDialog(false)}
        onConfirm={() => setShowEditSuccessDialog(false)}
      />

      {/* Full Screen Expanded Recipe Modal */}
      {expandedRecipeId && (
        <View className="absolute inset-0 bg-zinc-900" style={{ zIndex: 1000 }}>
          {/* Modal Header */}
          <View
            style={{
              paddingTop: insets.top + 24,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255, 255, 255, 0.08)",
            }}
            className="px-6"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  if (isEditMode) {
                    // Cancel edit mode
                    setIsEditMode(false)
                    setEditedRecipe(null)
                  } else {
                    setExpandedRecipeId(null)
                  }
                }}
                className={`${isEditMode ? 'bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-2' : 'w-10 h-10 rounded-full'} items-center justify-center`}
                style={isEditMode ? {} : { backgroundColor: "rgba(255, 255, 255, 0.06)" }}
                activeOpacity={0.7}
              >
                {isEditMode ? (
                  <>
                    <Text className="text-red-400 font-bold ml-2 text-base">Cancel</Text>
                  </>
                ) : (
                  <Ionicons name="close" size={22} color="#FACC15" />
                )}
              </TouchableOpacity>

              <Text className="text-white text-lg font-bold flex-1 text-center">
                {isEditMode ? t('recipe.edit') : t('recipe.details')}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  const recipe = displayFilteredFavorites.find(r => {
                    const rId = r.id || r._id || r.recipeId
                    return rId === expandedRecipeId
                  })
                  if (recipe && !isEditMode) {
                    // First collapse the recipe
                    setExpandedRecipeId(null)
                    // Then set up for removal
                    const removeId = recipe.id || recipe._id || recipe.recipeId || expandedRecipeId
                    setRecipeToRemove(removeId)
                    setShowRemoveDialog(true)
                  }
                }}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isEditMode ? "rgba(255, 255, 255, 0.03)" : "rgba(239, 68, 68, 0.15)",
                  opacity: isEditMode ? 0.5 : 1
                }}
                activeOpacity={isEditMode ? 1 : 0.7}
                disabled={isEditMode}
              >
                <Ionicons name="heart" size={20} color={isEditMode ? "#666" : "#EF4444"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Content */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {(() => {
              const recipe = displayFilteredFavorites.find(r => {
                const rId = r.id || r._id || r.recipeId
                return rId === expandedRecipeId
              })
              if (!recipe) return null

              return (
                <View className="p-6">
                  {/* Recipe Header */}
                  <View className="mb-6">
                    {isEditMode ? (
                      <View className="mb-4">
                        <TextInput
                          className="text-white font-bold text-3xl mb-3 leading-tight tracking-tight bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-600"
                          value={editedRecipe?.title || ''}
                          onChangeText={(text) => setEditedRecipe((prev: any) => prev ? { ...prev, title: text } : null)}
                          placeholder="Recipe title"
                          placeholderTextColor="#9CA3AF"
                          style={{ color: '#FFFFFF' }}
                        />
                        <TextInput
                          className="text-gray-300 text-base mb-4 leading-relaxed bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-600"
                          value={editedRecipe?.description || ''}
                          onChangeText={(text) => setEditedRecipe((prev: any) => prev ? { ...prev, description: text } : null)}
                          placeholder="Recipe description"
                          placeholderTextColor="#9CA3AF"
                          multiline
                          numberOfLines={3}
                          style={{ color: '#FFFFFF' }}
                        />
                      </View>
                    ) : (
                      <>
                        <Text className="text-white font-bold text-3xl mb-3 leading-tight tracking-tight">{recipe.title}</Text>
                        <Text className="text-gray-300 text-base mb-4 leading-relaxed">
                          {recipe.description || 'Delicious recipe from your favorites'}
                        </Text>
                      </>
                    )}

                    {/* Recipe Stats */}
                    <View className="flex-row flex-wrap">
                      <View className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={14} color="#10B981" />
                          <Text className="text-emerald-300 ml-1 text-xs font-semibold">
                            {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                          </Text>
                        </View>
                      </View>
                      <View className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                        <View className="flex-row items-center">
                          <Ionicons name="people-outline" size={14} color="#3B82F6" />
                          <Text className="text-blue-300 ml-1 text-xs font-semibold">
                            {recipe.servings || 1} servings
                          </Text>
                        </View>
                      </View>
                      <View className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 mb-2">
                        <View className="flex-row items-center">
                          <MaterialIcons name="signal-cellular-alt" size={14} color="#8B5CF6" />
                          <Text className="text-purple-300 ml-1 text-xs font-semibold">{recipe.difficulty || 'Easy'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Share and Edit/Save Buttons */}
                  <View className="flex-row mb-6" style={{ gap: 16 }}>
                    <TouchableOpacity
                      onPress={() => handleShareRecipe(recipe)}
                      className="bg-amber-500/15 border border-amber-500/40 rounded-xl py-3 flex-row items-center justify-center shadow-sm flex-1"
                      activeOpacity={0.7}
                      disabled={isEditMode}
                      style={{ opacity: isEditMode ? 0.5 : 1 }}
                    >
                      <Ionicons name="share-outline" size={20} color="#FBBF24" />
                      <Text className="text-amber-300 font-bold ml-2 text-base tracking-wide">Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (isEditMode) {
                          handleSaveEditedRecipe()
                        } else {
                          setIsEditMode(true)
                          setEditedRecipe({ ...recipe })
                        }
                      }}
                      className={`${isEditMode ? 'bg-gemerald-500/40 border-2 border-emerald-500/40' : 'bg-blue-500/15 border border-blue-500/40'} rounded-xl py-3 flex-row items-center justify-center shadow-sm flex-1`}

                      activeOpacity={0.7}
                      style={isEditMode ? {} : {}}
                    >
                      <Ionicons name={isEditMode ? "checkmark-circle" : "create-outline"} size={20} color={isEditMode ? "#10b981ff" : "#3B82F6"} />
                      <Text className={`${isEditMode ? 'text-white' : 'text-blue-300'} font-bold ml-2 text-base tracking-wide`}>
                        {isEditMode ? "Save Changes" : "Edit"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 📊 Enhanced Nutrition Section */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-4">
                      <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                      <Text className="text-white text-xl font-bold tracking-tight">Nutrition</Text>
                      <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                    </View>
                    <View className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 shadow-lg">
                      <View className="flex-row items-center justify-between">
                        <View className="items-center flex-1">
                          <Text className="text-amber-400 text-xl font-bold mb-1">
                            {recipe.nutritionInfo?.calories || 0}
                          </Text>
                          <Text className="text-gray-300 text-xs tracking-wide font-semibold">CALORIES</Text>
                        </View>
                        <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                        <View className="items-center flex-1">
                          <Text className="text-emerald-400 text-xl font-bold mb-1">
                            {recipe.nutritionInfo?.protein || 0}g
                          </Text>
                          <Text className="text-gray-300 text-xs tracking-wide font-semibold">PROTEIN</Text>
                        </View>
                        <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                        <View className="items-center flex-1">
                          <Text style={{ color: "#3B82F6" }} className="text-xl font-bold mb-1">{recipe.nutritionInfo?.carbs || 0}g</Text>
                          <Text className="text-gray-300 text-xs tracking-wide font-semibold">CARBS</Text>
                        </View>
                        <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                        <View className="items-center flex-1">
                          <Text style={{ color: "#F59E0B" }} className="text-xl font-bold mb-1">{recipe.nutritionInfo?.fat || 0}g</Text>
                          <Text className="text-gray-300 text-xs tracking-wide font-semibold">FAT</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 🥕 Enhanced Ingredients Section */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-4">
                      <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                      <Text className="text-white text-xl font-bold tracking-tight">Ingredients</Text>
                      <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                    </View>
                    <View className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-3 shadow-xl">
                      {(isEditMode ? editedRecipe?.ingredients : recipe.ingredients)?.map((ingredient: any, index: number) => (
                        <View
                          key={`modal-ingredient-${recipe.id}-${index}`}
                          className={`py-2 ${index !== (isEditMode ? editedRecipe?.ingredients : recipe.ingredients).length - 1 ? "border-b border-zinc-600" : ""
                            }`}
                        >
                          {isEditMode ? (
                            <View className="space-y-2">
                              <View className="flex-row items-center space-x-2">
                                <TextInput
                                  value={editedRecipe?.ingredients[index]?.amount?.toString() || ''}
                                  onChangeText={(text) => {
                                    const newIngredients = [...(editedRecipe?.ingredients || [])];
                                    newIngredients[index] = { ...newIngredients[index], amount: text };
                                    setEditedRecipe((prev: any) => prev ? { ...prev, ingredients: newIngredients } : null);
                                  }}
                                  className="flex-1 text-sm bg-zinc-700/50 rounded px-2 py-1 border border-zinc-600"
                                  placeholder="Amount"
                                  placeholderTextColor="#94A3B8"
                                  keyboardType="numeric"
                                  style={{ color: '#FFFFFF' }}
                                />
                                <TextInput
                                  value={editedRecipe?.ingredients[index]?.unit || ''}
                                  onChangeText={(text) => {
                                    const newIngredients = [...(editedRecipe?.ingredients || [])];
                                    newIngredients[index] = { ...newIngredients[index], unit: text };
                                    setEditedRecipe((prev: any) => prev ? { ...prev, ingredients: newIngredients } : null);
                                  }}
                                  className="flex-1 text-sm bg-zinc-700/50 rounded px-2 py-1 border border-zinc-600"
                                  placeholder="Unit"
                                  placeholderTextColor="#94A3B8"
                                  style={{ color: '#FFFFFF' }}
                                />
                              </View>
                              <TextInput
                                value={editedRecipe?.ingredients[index]?.name || ''}
                                onChangeText={(text) => {
                                  const newIngredients = [...(editedRecipe?.ingredients || [])];
                                  newIngredients[index] = { ...newIngredients[index], name: text };
                                  setEditedRecipe((prev: any) => prev ? { ...prev, ingredients: newIngredients } : null);
                                }}
                                className="text-base bg-zinc-700/50 rounded px-2 py-1 border border-zinc-600"
                                placeholder="Ingredient name"
                                placeholderTextColor="#94A3B8"
                                style={{ color: '#FFFFFF' }}
                              />
                              <TextInput
                                value={editedRecipe?.ingredients[index]?.notes || ''}
                                onChangeText={(text) => {
                                  const newIngredients = [...(editedRecipe?.ingredients || [])];
                                  newIngredients[index] = { ...newIngredients[index], notes: text };
                                  setEditedRecipe((prev: any) => prev ? { ...prev, ingredients: newIngredients } : null);
                                }}
                                className="text-sm bg-zinc-700/50 rounded px-2 py-1 border border-zinc-600"
                                placeholder="Notes (optional)"
                                placeholderTextColor="#94A3B8"
                                style={{ color: '#FFFFFF' }}
                              />
                            </View>
                          ) : (
                            <View className="flex-row items-start">
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
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 👨‍🍳 Enhanced Instructions Section */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-5">
                      <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                      <Text className="text-white text-xl font-bold tracking-tight">Instructions</Text>
                      <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                    </View>
                    <View className="space-y-4">
                      {(isEditMode ? editedRecipe?.instructions : recipe.instructions)?.map((instruction: any, index: number) => (
                        <View
                          key={`modal-instruction-${recipe.id}-${index}`}
                          className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-6 shadow-xl"
                        >
                          <View className="flex-row">
                            <View className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl items-center justify-center mr-4 shadow-xl border-2 border-amber-400/40">
                              <Text className="text-white font-bold text-xl">{instruction.step}</Text>
                            </View>
                            <View className="flex-1">
                              {isEditMode ? (
                                <View className="space-y-3">
                                  <TextInput
                                    value={editedRecipe?.instructions[index]?.instruction || ''}
                                    onChangeText={(text) => {
                                      const newInstructions = [...(editedRecipe?.instructions || [])];
                                      newInstructions[index] = { ...newInstructions[index], instruction: text };
                                      setEditedRecipe((prev: any) => prev ? { ...prev, instructions: newInstructions } : null);
                                    }}
                                    multiline
                                    className="text-base leading-7 bg-zinc-700/50 rounded-lg px-3 py-2 border border-zinc-600"
                                    placeholder="Instruction text"
                                    placeholderTextColor="#94A3B8"
                                    style={{ color: '#FFFFFF' }}
                                  />
                                  <TextInput
                                    value={editedRecipe?.instructions[index]?.tips || ''}
                                    onChangeText={(text) => {
                                      const newInstructions = [...(editedRecipe?.instructions || [])];
                                      newInstructions[index] = { ...newInstructions[index], tips: text };
                                      setEditedRecipe((prev: any) => prev ? { ...prev, instructions: newInstructions } : null);
                                    }}
                                    multiline
                                    className="text-sm bg-zinc-700/50 rounded-lg px-3 py-2 border border-zinc-600"
                                    placeholder="Tips (optional)"
                                    placeholderTextColor="#94A3B8"
                                    style={{ color: '#FFFFFF' }}
                                  />
                                </View>
                              ) : (
                                <>
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
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 🔥 Action Buttons */}
                  <View className="mb-6">
                    {isEditMode ? (
                      <View className="flex-row" style={{ gap: 20 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setIsEditMode(false)
                            setEditedRecipe(null)
                          }}
                          className="rounded-xl py-4 flex-row items-center justify-center shadow-lg flex-1"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            borderWidth: 1,
                            borderColor: "rgba(239, 68, 68, 0.3)"
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={24} color="#EF4444" />
                          <Text style={{ color: "#EF4444", fontWeight: "700", marginLeft: 12, fontSize: 16, letterSpacing: 0.5 }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleSaveEditedRecipe}
                          className="bg-emerald-500/40 border-2 border-emerald-500/40 rounded-xl py-4 flex-row items-center justify-center shadow-lg flex-1"
                          style={{
                            borderWidth: 1,
                            borderColor: "#10b981ff"
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#10b981ff" />
                          <Text style={{ color: "#FFFFFF", fontWeight: "700", marginLeft: 6, fontSize: 16, letterSpacing: 0.5 }} >Save Changes</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          const recipe = displayFilteredFavorites.find(r => {
                            const rId = r.id || r._id || r.recipeId
                            return rId === expandedRecipeId
                          })
                          if (recipe) {
                            setExpandedRecipeId(null)
                            handleStartCooking(recipe)
                          }
                        }}
                        className="rounded-xl py-4 flex-row items-center justify-center shadow-lg"
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={['#FACC15', '#F97316']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            borderRadius: 12,
                          }}
                        />
                        <Ionicons name="flame" size={24} color="#FFFFFF" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "700", marginLeft: 12, fontSize: 18, letterSpacing: 0.5 }}>Start Cooking</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* ⭐ Enhanced Chef's Tips */}
                  {recipe.tips && recipe.tips.length > 0 && (
                    <View className="mb-6">
                      <View className="flex-row items-center mb-5">
                        <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                        <Text className="text-white text-xl font-bold tracking-tight">Chef&apos;s Tips</Text>
                        <View className="flex-1 h-px ml-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }} />
                      </View>
                      <View
                        className="rounded-2xl p-6 shadow-xl"
                        style={{
                          backgroundColor: "rgba(250, 204, 21, 0.1)",
                          borderWidth: 1,
                          borderColor: "rgba(250, 204, 21, 0.3)"
                        }}
                      >
                        {(isEditMode ? editedRecipe?.tips : recipe.tips)?.map((tip: string, index: number) => (
                          <View
                            key={`modal-tip-${recipe.id}-${index}`}
                            className={`flex-row items-start ${index !== (isEditMode ? editedRecipe?.tips : recipe.tips).length - 1 ? "mb-5 pb-5 border-b border-amber-400/30" : ""
                              }`}
                          >
                            <View className="w-7 h-7 rounded-lg bg-amber-500/25 items-center justify-center mr-3 mt-0.5">
                              <Ionicons name="star" size={14} color="#FCD34D" />
                            </View>
                            {isEditMode ? (
                              <TextInput
                                value={editedRecipe?.tips[index] || ''}
                                onChangeText={(text) => {
                                  const newTips = [...(editedRecipe?.tips || [])];
                                  newTips[index] = text;
                                  setEditedRecipe((prev: any) => prev ? { ...prev, tips: newTips } : null);
                                }}
                                multiline
                                className="text-amber-100 text-base leading-7 flex-1 bg-zinc-700/50 rounded-lg px-3 py-2 border border-zinc-600"
                                placeholder="Chef's tip"
                                placeholderTextColor="#94A3B8"
                                style={{ color: '#FCD34D' }}
                              />
                            ) : (
                              <Text className="text-amber-100 text-base leading-7 flex-1">{tip}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 🔄 Enhanced Substitutions */}
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
                      <View className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-5 space-y-5 shadow-xl">
                        {recipe.substitutions.map((sub, index) => (
                          <View
                            key={`modal-substitution-${recipe.id}-${index}`}
                            className={`${index !== recipe.substitutions.length - 1 ? "pb-5 border-b border-zinc-600" : ""}`}
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

                  {/* 🗑️ Enhanced Remove Button */}
                  <View className="flex-row justify-center mt-6">
                    <TouchableOpacity
                      onPress={() => {
                        // First collapse the recipe
                        setExpandedRecipeId(null)
                        // Use recipeId for deletion (backend expects this field)
                        const removeId = recipe.recipeId || recipe.id || recipe._id || expandedRecipeId
                        setRecipeToRemove(removeId)
                        setShowRemoveDialog(true)
                      }}
                      className="bg-red-500/10 border border-red-400/40 rounded-xl py-3 flex-row items-center justify-center shadow-sm"
                      activeOpacity={0.7}
                      disabled={isEditMode}
                      style={{ opacity: isEditMode ? 0.5 : 1 }}
                    >
                      <Text className="text-red-400 font-bold ml-3 mr-3 text-base tracking-wide">Remove from Favorites</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })()}
          </ScrollView>
        </View>
      )}
    </LinearGradient>
  )
}

export default FavoritesScreen