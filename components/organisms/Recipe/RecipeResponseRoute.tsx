"use client"

import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import LottieView from "lottie-react-native"
import React, { JSX, useEffect, useRef, useState } from "react"
import { Alert, Animated, Image, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Dialog from "../../atoms/Dialog"

const TIMEOUT_DURATION = 40000 // 40 seconds timeout

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
      })
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
        ])
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
        servings: params.servings ? parseInt(params.servings as string) : 0,
        cookingTime: params.cookingTime ? parseInt(params.cookingTime as string) : 0,
        ingredients: params.ingredients ? JSON.parse(params.ingredients as string) : [],
        difficulty: (params.difficulty as "Easy" | "Medium" | "Hard" | "Any") || "Any",
      }

      // Validate required parameters
      if (!filters.servings || filters.servings <= 0) {
        throw new Error('Serving size is required and must be greater than 0')
      }
      
      if (!filters.cookingTime || filters.cookingTime <= 0) {
        throw new Error('Cooking time is required and must be greater than 0')
      }

      const availableIngredients = filters.ingredients

      // Build request using the service helper
      const request = recipeGenerationService.buildRecipeRequest(filters, availableIngredients)
      
      // Validate the request
      const validation = recipeGenerationService.validateRequest(request)
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      console.log('Generating recipe with request:', request)
      console.log('Requested servings:', request.portionSize)
      
      // Call the backend API
      const response = await recipeGenerationService.generateRecipe(request)
      
      console.log('Recipe generation successful:', response.recipe.title)
      console.log('Server returned servings:', response.recipe.servings)
      console.log('Server settings portionSize:', response.settings?.portionSize)
      console.log('Full server response:', response)
      
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
      {/* Minimal Header - Only show when not generating */}
      {!isGenerating && (
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ paddingTop: insets.top + 8 }}
        >
          <TouchableOpacity
            onPress={handleClose}
            className="w-8 h-8 rounded-full bg-zinc-800/50 items-center justify-center"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white text-base font-semibold">Recipe Generation</Text>

          <View className="w-8" />
        </View>
      )}

      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        {isGenerating && !error && !generatedRecipe && (
          <LinearGradient
            colors={["#0F0F23", "#1A1A2E", "#16213E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 justify-center items-center"
          >
            {/* Subtle animated background elements */}
            <View className="absolute inset-0">
              {/* Floating circles with gentle animation */}
              <Animated.View
                className="absolute w-32 h-32 rounded-full border border-orange-400/10"
                style={{
                  top: '15%',
                  left: '10%',
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.05]
                    })
                  }]
                }}
              />
              <Animated.View
                className="absolute w-24 h-24 rounded-full border border-amber-400/15"
                style={{
                  top: '70%',
                  right: '15%',
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1.05, 1]
                    })
                  }]
                }}
              />
              <Animated.View
                className="absolute w-20 h-20 rounded-full border border-yellow-400/20"
                style={{
                  bottom: '20%',
                  left: '70%',
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.03]
                    })
                  }]
                }}
              />

              {/* Subtle gradient orbs */}
              <View className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-400/30 rounded-full" />
              <View className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-amber-400/40 rounded-full" />
              <View className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-yellow-400/50 rounded-full" />
            </View>

            <Animated.View
              className="items-center justify-center"
              style={{
                opacity: fadeAnim
              }}
            >
              {/* Clean Lottie Animation */}
              <LottieView
                source={require('@/assets/lottie/loading.json')}
                autoPlay
                loop
                style={{ width: 120, height: 120, marginBottom: 24 }}
              />

              {/* Simple App Title Style Text */}
              <Text className="text-white text-2xl font-semibold tracking-wide mb-2">
                Generating Recipe
              </Text>
              
              <Text className="text-zinc-400 text-center text-base">
                Please wait...
              </Text>
            </Animated.View>
          </LinearGradient>
        )}

        {error && (
          <ScrollView 
            className="flex-1 px-4" 
            contentContainerStyle={{ justifyContent: 'center', minHeight: '80%' }}
          >
            <View className="items-center space-y-6">
              <View className="w-20 h-20 rounded-full bg-red-500/20 items-center justify-center">
                <Ionicons name="warning" size={40} color="#EF4444" />
              </View>
              
              <View className="items-center space-y-2">
                <Text className="text-white text-xl font-bold">Oops! Something went wrong</Text>
                <Text className="text-zinc-400 text-center px-4">
                  {error}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-orange-500 rounded-2xl px-8 py-4"
              >
                <Text className="text-white font-bold text-lg">Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {generatedRecipe && !isGenerating && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Recipe Header */}
            <View className="relative">
              <Image 
                source={{ uri: generatedRecipe.image }} 
                className="w-full h-56" 
                resizeMode="cover" 
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                className="absolute bottom-0 left-0 right-0 h-20"
              />
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="text-white text-2xl font-bold mb-1">
                  {generatedRecipe.title}
                </Text>
                <Text className="text-zinc-300 text-sm">
                  {generatedRecipe.description}
                </Text>
              </View>
            </View>

            {/* Recipe Info */}
            <View className="px-4 py-6">
              <View className="flex-row justify-between bg-zinc-800/50 rounded-xl p-4 mb-6">
                <View className="items-center flex-1">
                  <Ionicons name="time-outline" size={20} color="#F97316" />
                  <Text className="text-zinc-400 text-xs mt-1">Total Time</Text>
                  <Text className="text-white font-semibold">
                    {generatedRecipe.cookTime + generatedRecipe.prepTime} min
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Ionicons name="people-outline" size={20} color="#F97316" />
                  <Text className="text-zinc-400 text-xs mt-1">Servings</Text>
                  <Text className="text-white font-semibold">
                    {generatedRecipe.servings}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Ionicons name="restaurant-outline" size={20} color="#F97316" />
                  <Text className="text-zinc-400 text-xs mt-1">Cuisine</Text>
                  <Text className="text-white font-semibold">
                    {generatedRecipe.cuisine}
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Ionicons name="speedometer-outline" size={20} color="#F97316" />
                  <Text className="text-zinc-400 text-xs mt-1">Difficulty</Text>
                  <Text className="text-white font-semibold">
                    {generatedRecipe.difficulty}
                  </Text>
                </View>
              </View>

              {/* Nutrition Info */}
              <View className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                <Text className="text-white font-bold text-lg mb-3">Nutrition (per serving)</Text>
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-orange-400 font-bold text-lg">
                      {generatedRecipe.nutritionInfo.calories}
                    </Text>
                    <Text className="text-zinc-400 text-xs">Calories</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-blue-400 font-bold text-lg">
                      {generatedRecipe.nutritionInfo.protein}g
                    </Text>
                    <Text className="text-zinc-400 text-xs">Protein</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-green-400 font-bold text-lg">
                      {generatedRecipe.nutritionInfo.carbs}g
                    </Text>
                    <Text className="text-zinc-400 text-xs">Carbs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-yellow-400 font-bold text-lg">
                      {generatedRecipe.nutritionInfo.fat}g
                    </Text>
                    <Text className="text-zinc-400 text-xs">Fat</Text>
                  </View>
                </View>
              </View>

              {/* Ingredients */}
              <View className="mb-6">
                <Text className="text-white font-bold text-lg mb-4">Ingredients</Text>
                {generatedRecipe.ingredients.map((ingredient, index) => (
                  <View key={`ingredient-${index}`} className="flex-row items-center py-3 border-b border-zinc-800">
                    <View className="w-6 h-6 rounded-full bg-orange-500/20 items-center justify-center mr-3">
                      <Text className="text-orange-400 text-xs font-bold">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </Text>
                      {ingredient.notes && (
                        <Text className="text-zinc-400 text-sm mt-1">{ingredient.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Instructions */}
              <View className="mb-6">
                <Text className="text-white font-bold text-lg mb-4">Instructions</Text>
                {generatedRecipe.instructions.map((instruction, index) => (
                  <View key={`instruction-${index}`} className="flex-row mb-4">
                    <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-4 mt-1">
                      <Text className="text-white font-bold text-sm">{instruction.step}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white leading-6">{instruction.instruction}</Text>
                      {instruction.duration && (
                        <Text className="text-orange-400 text-sm mt-1">
                          ⏱️ {instruction.duration} minutes
                        </Text>
                      )}
                      {instruction.tips && (
                        <Text className="text-zinc-400 text-sm mt-1 italic">
                          💡 {instruction.tips}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Tips */}
              {generatedRecipe.tips.length > 0 && (
                <View className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <Text className="text-amber-400 font-bold text-lg mb-3">Chef's Tips</Text>
                  {generatedRecipe.tips.map((tip, index) => (
                    <Text key={index} className="text-amber-200 mb-2 leading-5">
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-8">
                <TouchableOpacity 
                  onPress={() => handleSaveRecipe(generatedRecipe)}
                  className="flex-1 bg-zinc-800 rounded-xl py-3 items-center"
                >
                  <Ionicons name="bookmark-outline" size={20} color="#F97316" />
                  <Text className="text-white font-medium mt-1">Save</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleShareRecipe(generatedRecipe)}
                  className="flex-1 bg-zinc-800 rounded-xl py-3 items-center"
                >
                  <Ionicons name="share-outline" size={20} color="#F97316" />
                  <Text className="text-white font-medium mt-1">Share</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleRetry}
                  className="flex-1 bg-orange-500 rounded-xl py-3 items-center"
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text className="text-white font-medium mt-1">New Recipe</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </Animated.View>

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
    </View>
  )
}