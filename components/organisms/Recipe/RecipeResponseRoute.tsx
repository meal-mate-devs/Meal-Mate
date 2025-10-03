"use client"

import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { JSX, useEffect, useRef, useState } from "react"
import { Alert, Animated, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import GeneratedRecipeCard from "../../../components/organisms/Recipe/GeneratedRecipeCard"
import RecipeDetailModal from "../../../components/organisms/Recipe/RecipieDetailModel"
import Dialog from "../../atoms/Dialog"

const TIMEOUT_DURATION = 30000 // 30 seconds timeout

export default function RecipeResponseRoute(): JSX.Element {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  
  const [showRecipeDetail, setShowRecipeDetail] = useState(false)
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
        servings: parseInt(params.servings as string) || 4,
        cookingTime: parseInt(params.cookingTime as string) || 30,
        ingredients: params.ingredients ? JSON.parse(params.ingredients as string) : [],
        difficulty: (params.difficulty as "Easy" | "Medium" | "Hard" | "Any") || "Any",
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
      
      // Call the backend API
      const response = await recipeGenerationService.generateRecipe(request)
      
      console.log('Recipe generation successful:', response.recipe.title)
      
      // Clear timeout if successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      setGeneratedRecipe(response.recipe)

      // Log additional info if available
      if (response.missingIngredients.length > 0) {
        console.log(`Recipe generated with ${response.missingIngredients.length} missing ingredients:`, response.missingIngredients)
      }

    } catch (error: any) {
      console.log("Recipe generation failed:", error)
      
      // Clear timeout if error occurred
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
    console.log("Save recipe:", recipe.title)
    Alert.alert("Saved!", "Recipe saved to your favorites")
  }

  const handleShareRecipe = (recipe: GeneratedRecipe): void => {
    // TODO: Implement recipe sharing
    console.log("Share recipe:", recipe.title)
    Alert.alert("Shared!", "Recipe link copied to clipboard")
  }

  const handleRecipeDetail = (recipe: GeneratedRecipe): void => {
    setShowRecipeDetail(true)
  }

  return (
    <View className="flex-1 bg-zinc-900">
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-4 py-2"
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity 
          onPress={handleClose}
          className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-bold">Recipe Generation</Text>
        
        <View className="w-10" />
      </View>

      <Animated.View 
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        {isGenerating && !error && !generatedRecipe && (
          <View className="flex-1">
            {/* Beautiful gradient background */}
            <LinearGradient
              colors={["#0F0F23", "#1A1A2E", "#16213E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="flex-1 justify-center items-center px-6"
            >
              {/* Floating particles background effect */}
              <View className="absolute inset-0">
                <Animated.View 
                  className="absolute top-20 left-10 w-2 h-2 bg-orange-400/30 rounded-full"
                  style={{
                    transform: [{
                      translateY: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0, -10]
                      })
                    }]
                  }}
                />
                <Animated.View 
                  className="absolute top-40 right-16 w-3 h-3 bg-amber-400/20 rounded-full"
                  style={{
                    transform: [{
                      translateY: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0, 15]
                      })
                    }]
                  }}
                />
                <Animated.View 
                  className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-yellow-400/40 rounded-full"
                  style={{
                    transform: [{
                      translateY: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0, -8]
                      })
                    }]
                  }}
                />
              </View>

              <Animated.View 
                className="items-center"
                style={{
                  transform: [{ scale: pulseAnim }]
                }}
              >
                {/* Beautiful loading animation container */}
                <View className="relative mb-12">
                  {/* Outer glow ring */}
                  <Animated.View 
                    className="absolute -inset-4 rounded-full border-2 border-orange-400/30"
                    style={{
                      transform: [{
                        rotate: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}
                  />
                  
                  {/* Main loading container with gradient background */}
                  <LinearGradient
                    colors={["#F97316", "#F59E0B", "#EAB308"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-28 h-28 rounded-full items-center justify-center shadow-2xl"
                  >
                    {/* Chef hat icon instead of lottie */}
                    <Ionicons name="restaurant" size={40} color="#FFFFFF" />
                  </LinearGradient>
                  
                  {/* Rotating dots around the circle */}
                  <Animated.View 
                    className="absolute inset-0"
                    style={{
                      transform: [{
                        rotate: pulseAnim.interpolate({
                          inputRange: [1, 1.1],
                          outputRange: ['0deg', '180deg']
                        })
                      }]
                    }}
                  >
                    <View className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1" />
                    <View className="absolute -bottom-1 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1" />
                    <View className="absolute top-1/2 -left-1 w-2 h-2 bg-white rounded-full transform -translate-y-1" />
                    <View className="absolute top-1/2 -right-1 w-2 h-2 bg-white rounded-full transform -translate-y-1" />
                  </Animated.View>
                </View>

                {/* Beautiful typography */}
                <View className="items-center space-y-4 mb-8">
                  <Text className="text-white text-2xl font-bold text-center">
                    ✨ Crafting Your Recipe
                  </Text>
                  
                  <Text className="text-zinc-300 text-center text-lg max-w-sm leading-7 font-medium">
                    Our AI chef is carefully selecting the perfect ingredients and cooking methods just for you
                  </Text>
                </View>

                {/* Modern progress bar with better contrast */}
                <View className="w-64 h-2 bg-zinc-700/50 rounded-full overflow-hidden shadow-inner">
                  <Animated.View 
                    className="h-full rounded-full"
                    style={{
                      width: '40%',
                      transform: [{
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 200]
                        })
                      }]
                    }}
                  >
                    <LinearGradient
                      colors={["#F97316", "#F59E0B", "#EAB308"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="h-full rounded-full"
                    />
                  </Animated.View>
                </View>

                {/* Loading tips */}
                <Text className="text-zinc-400 text-center text-sm mt-6 max-w-xs">
                  💡 Tip: The longer it takes, the more personalized your recipe will be!
                </Text>
              </Animated.View>
            </LinearGradient>
          </View>
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
          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            <View className="space-y-6 pb-8">
              <View className="items-center space-y-4 py-6">
                <View className="w-16 h-16 rounded-full bg-green-500 items-center justify-center">
                  <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                </View>
                <Text className="text-white text-2xl font-bold text-center">
                  Recipe Ready! 🎉
                </Text>
                <Text className="text-zinc-400 text-center">
                  Your personalized recipe has been created
                </Text>
              </View>

              <GeneratedRecipeCard 
                recipe={generatedRecipe} 
                onPress={() => handleRecipeDetail(generatedRecipe)}
              />

              {/* Action Buttons */}
              <View className="flex-row space-x-4">
                <TouchableOpacity 
                  onPress={() => handleSaveRecipe(generatedRecipe)}
                  className="flex-1 bg-zinc-800 rounded-2xl py-4 items-center"
                >
                  <View className="flex-row items-center space-x-2">
                    <Ionicons name="bookmark" size={20} color="#F97316" />
                    <Text className="text-white font-semibold">Save</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleShareRecipe(generatedRecipe)}
                  className="flex-1 bg-zinc-800 rounded-2xl py-4 items-center"
                >
                  <View className="flex-row items-center space-x-2">
                    <Ionicons name="share" size={20} color="#F97316" />
                    <Text className="text-white font-semibold">Share</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={handleRetry}
                className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl py-4 items-center"
              >
                <LinearGradient
                  colors={["#F97316", "#F59E0B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="w-full py-4 rounded-2xl items-center"
                >
                  <View className="flex-row items-center space-x-2">
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-lg">Generate Another Recipe</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        visible={showRecipeDetail}
        recipe={generatedRecipe}
        onClose={() => setShowRecipeDetail(false)}
      />

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