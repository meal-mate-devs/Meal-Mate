"use client"

import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import type { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import LottieView from "lottie-react-native"
import React, { type JSX, useEffect, useRef, useState } from "react"
import { Alert, Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Dialog from "../../atoms/Dialog"

const TIMEOUT_DURATION = 40000 // 40 seconds timeout
const { width: SCREEN_WIDTH } = Dimensions.get("window")

export default function RecipeResponseRoute(): JSX.Element {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()

  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [pulseAnim] = useState(new Animated.Value(1))
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dialog states
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)

  // Get state from route params or global state
  const [isGenerating, setIsGenerating] = useState(true)
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Start animations
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

    // Start pulse animation for loading
    if (isGenerating) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      )
      pulseAnimation.start()

      return () => {
        pulseAnimation.stop()
      }
    }
  }, [isGenerating])

  // Perform recipe generation when component mounts
  useEffect(() => {
    if (isGenerating && !generatedRecipe && !error) {
      performRecipeGeneration()
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const performRecipeGeneration = async (): Promise<void> => {
    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false)
        setShowTimeoutDialog(true)
      }
    }, TIMEOUT_DURATION)

    try {
      // Parse filters from route params
      const filters: RecipeFilters = {
        cuisines: params.cuisines ? JSON.parse(params.cuisines as string) : [],
        categories: params.categories ? JSON.parse(params.categories as string) : [],
        dietaryPreferences: params.dietaryPreferences ? JSON.parse(params.dietaryPreferences as string) : [],
        mealTime: (params.mealTime as string) || "",
        servings: params.servings ? Number.parseInt(params.servings as string) : 0,
        cookingTime: params.cookingTime ? Number.parseInt(params.cookingTime as string) : 0,
        ingredients: params.ingredients ? JSON.parse(params.ingredients as string) : [],
        difficulty: (params.difficulty as "Easy" | "Medium" | "Hard" | "Any") || "Any",
      }

      // Validate required parameters
      if (!filters.servings || filters.servings <= 0) {
        throw new Error("Serving size is required and must be greater than 0")
      }

      if (!filters.cookingTime || filters.cookingTime <= 0) {
        throw new Error("Cooking time is required and must be greater than 0")
      }

      const availableIngredients = filters.ingredients

      // Build request using the service helper
      const request = recipeGenerationService.buildRecipeRequest(filters, availableIngredients)

      // Validate the request
      const validation = recipeGenerationService.validateRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      console.log("Generating recipe with request:", request)
      console.log("Requested servings:", request.portionSize)

      // Call the backend API
      const response = await recipeGenerationService.generateRecipe(request)

      console.log("Recipe generation successful:", response.recipe.title)
      console.log("Server returned servings:", response.recipe.servings)
      console.log("Server settings portionSize:", response.settings?.portionSize)
      console.log("Full server response:", response)

      // Clear timeout if successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setGeneratedRecipe(response.recipe)

      if (response.missingIngredients.length > 0) {
      }
    } catch (error: any) {
      console.log("Recipe generation failed:", error)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setError(error.message || "Failed to generate recipe. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = (): void => {
    router.back()
  }

  const handleRetry = (): void => {
    setIsGenerating(true)
    setError(null)
    setGeneratedRecipe(null)
    setShowTimeoutDialog(false)
    performRecipeGeneration()
  }

  const handleTimeoutClose = (): void => {
    setShowTimeoutDialog(false)
    router.back()
  }

  const handleSaveRecipe = (recipe: GeneratedRecipe): void => {
    // TODO: Implement save to favorites
    Alert.alert("Saved!", "Recipe saved to your favorites")
  }

  const handleShareRecipe = (recipe: GeneratedRecipe): void => {
    // TODO: Implement recipe sharing
    Alert.alert("Shared!", "Recipe link copied to clipboard")
  }

  return (
    <View className="flex-1 bg-zinc-900">
      {/* Loading Screen */}
      {isGenerating && !error && !generatedRecipe && (
        <View className="flex-1 justify-center items-center bg-zinc-900">
          {/* Sophisticated animated background elements */}
          <View className="absolute inset-0">
            {/* Glowing yellow orbs */}
            <Animated.View
              className="absolute w-64 h-64 rounded-full"
              style={{
                top: "10%",
                left: "-20%",
                backgroundColor: "#FBBF24",
                opacity: 0.05,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.15],
                    }),
                  },
                ],
              }}
            />
            <Animated.View
              className="absolute w-48 h-48 rounded-full"
              style={{
                bottom: "15%",
                right: "-15%",
                backgroundColor: "#F59E0B",
                opacity: 0.06,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1.1, 1],
                    }),
                  },
                ],
              }}
            />

            {/* Geometric accent lines */}
            <View className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/15 to-transparent" />
            <View className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/15 to-transparent" />
          </View>

          <Animated.View className="items-center justify-center z-10" style={{ opacity: fadeAnim }}>
            {/* Premium Lottie Animation with glow effect */}
            <View className="relative mb-8">
              <View className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl" />
              <LottieView
                source={require("@/assets/lottie/loading.json")}
                autoPlay
                loop
                style={{ width: 140, height: 140 }}
              />
            </View>

            <Text className="text-white text-3xl font-bold tracking-tight mb-3 text-center">Crafting Your Recipe</Text>

            <Text className="text-neutral-400 text-center text-base leading-relaxed px-8">
              Our AI chef is preparing something special...
            </Text>

            {/* Elegant loading indicator */}
            <View className="mt-8 flex-row space-x-2">
              <Animated.View
                className="w-2 h-2 rounded-full bg-yellow-500"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2 h-2 rounded-full bg-yellow-500"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.5, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2 h-2 rounded-full bg-yellow-500"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [1, 0.3],
                  }),
                }}
              />
            </View>
          </Animated.View>
        </View>
      )}

      {/* Error Screen */}
      {error && (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ justifyContent: "center", minHeight: "80%" }}>
          <View className="items-center space-y-8">
            {/* Premium error icon */}
            <View className="relative">
              <View className="absolute inset-0 bg-yellow-500/15 rounded-full blur-2xl" />
              <View className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-yellow-500/30 items-center justify-center">
                <Ionicons name="warning-outline" size={48} color="#FBBF24" />
              </View>
            </View>

            <View className="items-center space-y-3">
              <Text className="text-white text-2xl font-bold tracking-tight">Something Went Wrong</Text>
              <Text className="text-zinc-400 text-center text-base leading-relaxed px-4">{error}</Text>
            </View>

            <TouchableOpacity
              onPress={handleRetry}
              className="rounded-xl overflow-hidden"
            >
              <LinearGradient
                colors={["#FBBF24", "#F97416"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 px-10"
              >
                <Text className="text-white font-bold text-lg tracking-wide text-center">Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Recipe Display - Premium Black & Yellow Design */}
      {generatedRecipe && !isGenerating && (
        <Animated.View
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Compact Header */}
          <View
            className="bg-zinc-800 border-b border-zinc-700"
            style={{ paddingTop: insets.top }}
          >
            <View className="px-5 py-4">
              <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center"
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => handleSaveRecipe(generatedRecipe)}
                    className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center"
                  >
                    <Ionicons name="bookmark-outline" size={18} color="#FBBF24" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShareRecipe(generatedRecipe)}
                    className="w-10 h-10 rounded-xl bg-zinc-700 items-center justify-center"
                  >
                    <Ionicons name="share-outline" size={18} color="#FBBF24" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Compact Recipe Title */}
              <View>
                <Text className="text-white text-xl font-bold leading-tight mb-2">
                  {generatedRecipe.title}
                </Text>
                <Text className="text-zinc-400 text-sm leading-relaxed">{generatedRecipe.description}</Text>
              </View>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          >
            {/* Premium Metrics Grid */}
            <View className="px-6 py-8">
              <View className="bg-zinc-800 border border-zinc-700 rounded-3xl p-6">
                <View className="flex-row flex-wrap justify-between">
                  {/* Servings */}
                  <View className="items-center w-[48%] mb-6">
                    <View className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl items-center justify-center mb-3">
                      <Ionicons name="people-outline" size={26} color="#10b981" />
                    </View>
                    <Text className="text-neutral-500 text-xs font-semibold uppercase tracking-widest mb-2">
                      Servings
                    </Text>
                    <Text className="text-white text-2xl font-bold">{generatedRecipe.servings}</Text>
                  </View>

                  {/* Total Time */}
                  <View className="items-center w-[48%] mb-6">
                    <View className="w-14 h-14 bg-blue-500/20 border border-blue-500/40 rounded-2xl items-center justify-center mb-3">
                      <Ionicons name="time-outline" size={26} color="#3b82f6" />
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
                      Total Time
                    </Text>
                    <Text className="text-white text-2xl font-bold">
                      {generatedRecipe.cookTime + generatedRecipe.prepTime}m
                    </Text>
                  </View>

                  {/* Difficulty */}
                  <View className="items-center w-[48%]">
                    <View className="w-14 h-14 bg-purple-500/20 border border-purple-500/40 rounded-2xl items-center justify-center mb-3">
                      <Ionicons name="speedometer-outline" size={26} color="#8b5cf6" />
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
                      Difficulty
                    </Text>
                    <Text className="text-white text-2xl font-bold">{generatedRecipe.difficulty}</Text>
                  </View>

                  {/* Cuisine */}
                  <View className="items-center w-[48%]">
                    <View className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-2xl items-center justify-center mb-3">
                      <Ionicons name="restaurant-outline" size={26} color="#f59e0b" />
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
                      Cuisine
                    </Text>
                    <Text className="text-white text-xl font-bold">{generatedRecipe.cuisine}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sophisticated Nutrition Panel */}
            <View className="px-6 mb-8">
              <View className="flex-row items-center mb-5">
                <View className="w-1 h-6 bg-yellow-500 rounded-full mr-3" />
                <Text className="text-white text-2xl font-bold tracking-tight">Nutrition Facts</Text>
              </View>

              <View className="bg-zinc-800 border border-zinc-700 rounded-3xl p-6">
                <Text className="text-zinc-400 text-sm font-semibold text-center mb-6 uppercase tracking-wider">
                  Per Serving
                </Text>
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <View className="w-20 h-20 bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl items-center justify-center mb-3">
                      <Text className="text-yellow-400 font-bold text-xl">
                        {generatedRecipe.nutritionInfo.calories}
                      </Text>
                      <Text className="text-yellow-400/60 text-xs font-medium">kcal</Text>
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Calories</Text>
                  </View>
                  <View className="items-center flex-1">
                    <View className="w-20 h-20 bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl items-center justify-center mb-3">
                      <Text className="text-yellow-400 font-bold text-xl">{generatedRecipe.nutritionInfo.protein}</Text>
                      <Text className="text-yellow-400/60 text-xs font-medium">g</Text>
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Protein</Text>
                  </View>
                  <View className="items-center flex-1">
                    <View className="w-20 h-20 bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl items-center justify-center mb-3">
                      <Text className="text-yellow-400 font-bold text-xl">{generatedRecipe.nutritionInfo.carbs}</Text>
                      <Text className="text-yellow-400/60 text-xs font-medium">g</Text>
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Carbs</Text>
                  </View>
                  <View className="items-center flex-1">
                    <View className="w-20 h-20 bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl items-center justify-center mb-3">
                      <Text className="text-yellow-400 font-bold text-xl">{generatedRecipe.nutritionInfo.fat}</Text>
                      <Text className="text-yellow-400/60 text-xs font-medium">g</Text>
                    </View>
                    <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Fat</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Refined Ingredients Section */}
            <View className="px-6 mb-8">
              <View className="flex-row items-center mb-5">
                <View className="w-1 h-6 bg-yellow-400 rounded-full mr-3" />
                <Text className="text-white text-2xl font-bold tracking-tight">Ingredients</Text>
              </View>

              <View className="space-y-3">
                {generatedRecipe.ingredients.map((ingredient, index) => (
                  <View
                    key={`ingredient-${index}`}
                    className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl items-center justify-center mr-4">
                        <Text className="text-emerald-400 text-sm font-bold">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-base leading-relaxed">
                          {ingredient.amount} {ingredient.unit} {ingredient.name}
                        </Text>
                        {ingredient.notes && (
                          <Text className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{ingredient.notes}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Premium Instructions Section */}
            <View className="px-6 mb-8">
              <View className="flex-row items-center mb-5">
                <View className="w-1 h-6 bg-yellow-400 rounded-full mr-3" />
                <Text className="text-white text-2xl font-bold tracking-tight">Instructions</Text>
              </View>

              <View className="space-y-4">
                {generatedRecipe.instructions.map((instruction, index) => (
                  <View
                    key={`instruction-${index}`}
                    className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6"
                  >
                    <View className="flex-row">
                      <View className="w-12 h-12 bg-yellow-400 rounded-xl items-center justify-center mr-4 mt-1">
                        <Text className="text-black font-bold text-base">{instruction.step}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base leading-7 mb-3">{instruction.instruction}</Text>
                        {instruction.duration && (
                          <View className="flex-row items-center mb-3">
                            <View className="w-6 h-6 bg-yellow-500/15 rounded-lg items-center justify-center mr-2">
                              <Ionicons name="timer-outline" size={14} color="#FBBF24" />
                            </View>
                            <Text className="text-yellow-400 text-sm font-semibold">
                              {instruction.duration} minutes
                            </Text>
                          </View>
                        )}
                        {instruction.tips && (
                          <View className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mt-2">
                            <View className="flex-row items-start">
                              <View className="w-5 h-5 bg-yellow-500/20 rounded-lg items-center justify-center mr-3 mt-0.5">
                                <Ionicons name="bulb-outline" size={12} color="#FBBF24" />
                              </View>
                              <Text className="text-yellow-200 text-sm leading-6 flex-1">{instruction.tips}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Elegant Chef's Tips Section */}
            {generatedRecipe.tips.length > 0 && (
              <View className="px-6 mb-8">
                <View className="flex-row items-center mb-5">
                  <View className="w-1 h-6 bg-yellow-400 rounded-full mr-3" />
                  <Text className="text-white text-2xl font-bold tracking-tight">Chef's Tips</Text>
                </View>

                <View className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6">
                  <View className="space-y-4">
                    {generatedRecipe.tips.map((tip, index) => (
                      <View key={index} className="flex-row items-start">
                        <View className="w-7 h-7 bg-yellow-500/20 border border-yellow-500/30 rounded-xl items-center justify-center mr-4 mt-0.5">
                          <Ionicons name="star" size={14} color="#FBBF24" />
                        </View>
                        <Text className="text-yellow-100 text-base leading-7 flex-1">{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Premium Action Buttons */}
            <View className="px-6">
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => handleSaveRecipe(generatedRecipe)}
                  className="flex-1 bg-zinc-800 border-2 border-yellow-500/30 rounded-2xl py-5 items-center"
                >
                  <Ionicons name="bookmark" size={22} color="#FBBF24" />
                  <Text className="text-yellow-400 font-bold mt-2 text-base tracking-wide">Save Recipe</Text>
                </TouchableOpacity>

                <LinearGradient
                  colors={["#FBBF24", "#F97416"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-1 rounded-2xl"
                >
                  <TouchableOpacity
                    onPress={handleRetry}
                    className="py-5 items-center"
                  >
                    <Ionicons name="refresh" size={22} color="#FFFFFF" />
                    <Text className="text-white font-bold mt-2 text-base tracking-wide">New Recipe</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Timeout Dialog */}
      <Dialog
        visible={showTimeoutDialog}
        type="warning"
        title="Request Timeout"
        message="The recipe generation is taking longer than expected. Please check your connection and try again."
        onClose={handleTimeoutClose}
        onConfirm={handleRetry}
        confirmText="Retry"
        cancelText="Go Back"
        showCancelButton={true}
      />
      
      {/* Black navigation bar background */}
      <View 
        className="bg-black"
        style={{ height: insets.bottom }}
      />
    </View>
  )
}
