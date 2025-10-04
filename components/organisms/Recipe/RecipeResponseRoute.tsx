"use client"

import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import type { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
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
  const [showUnsafeIngredientsDialog, setShowUnsafeIngredientsDialog] = useState(false)
  const [unsafeIngredientsData, setUnsafeIngredientsData] = useState<{
    flaggedIngredients: string[]
    safeIngredients: string[]
    message: string
  } | null>(null)

  // Get state from route params or global state
  const [isGenerating, setIsGenerating] = useState(true)
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missingIngredients, setMissingIngredients] = useState<string[]>([])
  const [pantryAnalysis, setPantryAnalysis] = useState<any>(null)

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
      setMissingIngredients(response.missingIngredients || [])
      setPantryAnalysis(response.pantryAnalysis || null)

      if (response.missingIngredients.length > 0) {
        console.log("Missing ingredients:", response.missingIngredients)
      }
    } catch (error: any) {
      console.log("Recipe generation failed:", error)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Check if this is an unsafe ingredients error
      const errorMessage = error.message || ""
      if (errorMessage.includes("Unsafe ingredients detected") || errorMessage.includes("API Error: 400")) {
        try {
          // Try to extract the error data from the API response
          const errorMatch = errorMessage.match(/\{.*\}/)
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[0])
            if (errorData.flaggedIngredients || errorData.error === "Unsafe ingredients detected") {
              setUnsafeIngredientsData({
                flaggedIngredients: errorData.flaggedIngredients || [],
                safeIngredients: errorData.safeIngredients || [],
                message: errorData.message || "Some ingredients are not safe for cooking."
              })
              setShowUnsafeIngredientsDialog(true)
              return // Don't set generic error
            }
          }
        } catch (parseError) {
          console.log("Could not parse unsafe ingredients error:", parseError)
        }
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

  const handleUnsafeIngredientsClose = (): void => {
    setShowUnsafeIngredientsDialog(false)
    setUnsafeIngredientsData(null)
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

  // Helper function to format error messages user-friendly
  const formatErrorMessage = (errorMessage: string): { title: string; message: string; isServerError: boolean } => {
    // Check if it's a server error (API Error: 500)
    if (errorMessage.includes("API Error: 500") || errorMessage.includes("sufficiencyAnalysis is not defined") || errorMessage.includes("Server Error")) {
      return {
        title: "Server Error",
        message: "We'll be back shortly. Please try again in a few moments.",
        isServerError: true
      }
    }
    
    // Check for timeout errors
    if (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("connection")) {
      return {
        title: "Connection Issue",
        message: "Please check your internet connection and try again.",
        isServerError: false
      }
    }
    
    // All other errors - keep it simple
    return {
      title: "Something Went Wrong",
      message: "Unable to process your request. Please try again.",
      isServerError: false
    }
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
      {error && (() => {
        const formattedError = formatErrorMessage(error)
        return (
              <ScrollView
                className="flex-1 bg-zinc-900"
                contentContainerStyle={{ justifyContent: "flex-start", paddingTop: 180 }}
              >
                <View className="items-center px-12 py-4">
                  {/* Minimal error icon */}
                  <View className="mb-6">
                    <View className="w-20 h-20 rounded-full bg-zinc-800 border border-amber-500/30 items-center justify-center">
                      <Ionicons name="alert-circle-outline" size={40} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Typography section with elegant spacing */}
                  <View className="items-center space-y-4 mb-8">
                    <Text className="text-white text-3xl font-light tracking-tight text-center leading-tight px-4">
                      {formattedError.title}
                    </Text>

                    <View className="w-12 h-px bg-zinc-700 my-4" />

                    <Text className="text-zinc-400 text-center text-base font-light leading-relaxed px-8 max-w-md">
                      {formattedError.message}
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View className="flex-row justify-between w-full max-w-sm">
                    {/* Secondary Go Back button */}
                    <TouchableOpacity
                      onPress={handleClose}
                      className="flex-1 border border-zinc-600 rounded-full px-6 py-4"
                      activeOpacity={0.7}
                    >
                      <Text className="text-zinc-400 font-medium text-sm tracking-widest uppercase text-center">
                        Go Back
                      </Text>
                    </TouchableOpacity>

                    {/* Primary Try Again button */}
                    <TouchableOpacity
                      onPress={handleRetry}
                      className="flex-1 border border-amber-500/50 rounded-full px-6 py-4 ml-4"
                      activeOpacity={0.7}
                    >
                      <Text className="text-amber-400 font-medium text-sm tracking-widest uppercase text-center">
                        {formattedError.isServerError ? "Try Again" : "Retry"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )
      })()}

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
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Compact Recipe Info Bar */}
            <View className="px-5 py-4 bg-zinc-800/50 border-b border-zinc-700">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={16} color="#10b981" />
                  <Text className="text-white text-sm font-semibold ml-2">{generatedRecipe.servings}</Text>
                  <Text className="text-zinc-500 text-xs ml-1">servings</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#3b82f6" />
                  <Text className="text-white text-sm font-semibold ml-2">{generatedRecipe.prepTime + generatedRecipe.cookTime}m</Text>
                  <Text className="text-zinc-500 text-xs ml-1">total</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="speedometer-outline" size={16} color="#8b5cf6" />
                  <Text className="text-white text-sm font-semibold ml-2">{generatedRecipe.difficulty}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="restaurant-outline" size={16} color="#f59e0b" />
                  <Text className="text-white text-sm font-semibold ml-2">{generatedRecipe.cuisine}</Text>
                </View>
              </View>
            </View>

            {/* Compact Nutrition Facts - Single Line */}
            <View className="px-5 py-3 bg-zinc-800/30">
              <View className="flex-row items-center justify-around">
                <View className="items-center">
                  <Text className="text-yellow-400 text-lg font-bold">{generatedRecipe.nutritionInfo.calories}</Text>
                  <Text className="text-zinc-500 text-xs">cal</Text>
                </View>
                <View className="w-px h-8 bg-zinc-700" />
                <View className="items-center">
                  <Text className="text-emerald-400 text-lg font-bold">{generatedRecipe.nutritionInfo.protein}g</Text>
                  <Text className="text-zinc-500 text-xs">protein</Text>
                </View>
                <View className="w-px h-8 bg-zinc-700" />
                <View className="items-center">
                  <Text className="text-blue-400 text-lg font-bold">{generatedRecipe.nutritionInfo.carbs}g</Text>
                  <Text className="text-zinc-500 text-xs">carbs</Text>
                </View>
                <View className="w-px h-8 bg-zinc-700" />
                <View className="items-center">
                  <Text className="text-orange-400 text-lg font-bold">{generatedRecipe.nutritionInfo.fat}g</Text>
                  <Text className="text-zinc-500 text-xs">fat</Text>
                </View>
              </View>
            </View>

            {/* Minimal Ingredients Section */}
            <View className="px-5 py-4">
              <Text className="text-white text-lg font-bold mb-3">Ingredients</Text>
              <View className="bg-zinc-800 rounded-xl p-4">
                {generatedRecipe.ingredients.map((ingredient, index) => (
                  <View
                    key={`ingredient-${index}`}
                    className={`flex-row items-center py-2 ${index !== generatedRecipe.ingredients.length - 1 ? 'border-b border-zinc-700' : ''}`}
                  >
                    <View className="w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                      <Text className="text-emerald-400 text-xs font-bold">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm">
                        <Text className="font-semibold">{ingredient.amount} {ingredient.unit}</Text>
                        <Text className="text-zinc-300"> {ingredient.name}</Text>
                      </Text>
                      {ingredient.notes && (
                        <Text className="text-zinc-500 text-xs mt-0.5">{ingredient.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Missing Ingredients Section */}
            {missingIngredients.length > 0 && (
              <View className="px-5 py-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white text-lg font-bold">Missing Ingredients</Text>
                  <View className="bg-red-500/20 px-3 py-1 rounded-full">
                    <Text className="text-red-400 text-xs font-semibold">{missingIngredients.length} needed</Text>
                  </View>
                </View>
                <View className="bg-zinc-800 rounded-xl p-4">
                  {missingIngredients.map((ingredient, index) => (
                    <View
                      key={`missing-${index}`}
                      className={`flex-row items-center justify-between py-2 ${index !== missingIngredients.length - 1 ? 'border-b border-zinc-700' : ''}`}
                    >
                      <View className="flex-1 flex-row items-center">
                        <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                        <Text className="text-zinc-300 text-sm ml-2">{ingredient}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => Alert.alert("Add to Pantry", `Add ${ingredient} to your pantry?`)}
                        className="bg-amber-500/20 px-3 py-1.5 rounded-lg"
                      >
                        <Text className="text-amber-400 text-xs font-semibold">Add to Pantry</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pantry Match Info */}
            {pantryAnalysis && (
              <View className="px-5 py-2">
                <View className="bg-zinc-800/50 rounded-lg p-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="pie-chart-outline" size={16} color="#10b981" />
                    <Text className="text-zinc-400 text-xs ml-2">Pantry Match:</Text>
                  </View>
                  <Text className="text-emerald-400 text-sm font-bold">{pantryAnalysis.matchPercentage}%</Text>
                </View>
              </View>
            )}

            {/* Minimal Instructions Section */}
            <View className="px-5 py-4">
              <Text className="text-white text-lg font-bold mb-3">Instructions</Text>
              <View className="space-y-3">
                {generatedRecipe.instructions.map((instruction, index) => (
                  <View
                    key={`instruction-${index}`}
                    className="bg-zinc-800 rounded-xl p-4"
                  >
                    <View className="flex-row">
                      <View className="w-7 h-7 bg-amber-500 rounded-lg items-center justify-center mr-3">
                        <Text className="text-black font-bold text-sm">{instruction.step}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-sm leading-6">{instruction.instruction}</Text>
                        {instruction.duration && (
                          <View className="flex-row items-center mt-2">
                            <Ionicons name="timer-outline" size={12} color="#FBBF24" />
                            <Text className="text-amber-400 text-xs ml-1 font-medium">
                              {instruction.duration} min
                            </Text>
                          </View>
                        )}
                        {instruction.tips && (
                          <View className="bg-amber-500/10 rounded-lg p-2 mt-2">
                            <View className="flex-row items-start">
                              <Ionicons name="bulb-outline" size={12} color="#FBBF24" />
                              <Text className="text-amber-200 text-xs leading-5 flex-1 ml-2">{instruction.tips}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Chef's Tips Section */}
            {generatedRecipe.tips.length > 0 && (
              <View className="px-5 py-4">
                <Text className="text-white text-lg font-bold mb-3">Chef's Tips</Text>
                <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  {generatedRecipe.tips.map((tip, index) => (
                    <View key={index} className={`flex-row items-start ${index !== generatedRecipe.tips.length - 1 ? 'mb-3 pb-3 border-b border-amber-500/10' : ''}`}>
                      <Ionicons name="star" size={14} color="#FBBF24" />
                      <Text className="text-amber-100 text-sm leading-6 flex-1 ml-2">{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Compact Action Buttons */}
            <View className="px-5 py-4">
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => handleSaveRecipe(generatedRecipe)}
                  className="flex-1 bg-zinc-800 border border-amber-500/30 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Ionicons name="bookmark-outline" size={18} color="#D97706" />
                  <Text className="text-amber-400 font-semibold ml-2 text-sm">Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRetry}
                  className="flex-1 bg-amber-500/20 border border-amber-500/30 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Ionicons name="refresh" size={18} color="#F59E0B" />
                  <Text className="text-amber-400 font-semibold ml-2 text-sm">New Recipe</Text>
                </TouchableOpacity>
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

      {/* Unsafe Ingredients Dialog */}
      <Dialog
        visible={showUnsafeIngredientsDialog}
        type="warning"
        title="⚠️ Unsafe Ingredients Detected"
        message={
          unsafeIngredientsData ? (
            `\n🚫  ${unsafeIngredientsData.flaggedIngredients.map(ingredient => 
              ingredient.toUpperCase()
            ).join(" • ")}\n\n` +
            "Please remove unsafe ingredients and try again with only edible food items."
          ) : "Please provide only safe, edible ingredients for recipe generation."
        }
        onClose={handleUnsafeIngredientsClose}
        confirmText="Go Back"
        showCancelButton={false}
      />
      
      {/* Black navigation bar background */}
      <View 
        className="bg-black"
        style={{ height: insets.bottom }}
      />
    </View>
  )
}
