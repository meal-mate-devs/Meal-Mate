"use client"

import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { JSX, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Animated, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import GeneratedRecipeCard from "../../../components/organisms/Recipe/GeneratedRecipeCard"
import RecipeDetailModal from "../../../components/organisms/Recipe/RecipieDetailModel"

const GENERATION_STEPS = [
  "🔍 Analyzing your pantry ingredients...",
  "🧠 Understanding your preferences...",
  "👨‍🍳 Consulting our AI chef...",
  "📝 Crafting your perfect recipe...",
  "✨ Adding finishing touches..."
]

export default function RecipeResponseRoute(): JSX.Element {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [showRecipeDetail, setShowRecipeDetail] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  
  // Get state from route params or global state
  const [isGenerating, setIsGenerating] = useState(true)
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Start animations
    setCurrentStep(0)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start()

    // Simulate the generation steps for better UX
    if (isGenerating) {
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < GENERATION_STEPS.length - 1) {
            return prev + 1
          } else {
            clearInterval(stepInterval)
            return prev
          }
        })
      }, 1200)

      return () => clearInterval(stepInterval)
    }
  }, [isGenerating])

  // Perform recipe generation when component mounts
  useEffect(() => {
    if (isGenerating && !generatedRecipe && !error) {
      performRecipeGeneration()
    }
  }, [])

  const performRecipeGeneration = async (): Promise<void> => {
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
      setGeneratedRecipe(response.recipe)

      // Log additional info if available
      if (response.missingIngredients.length > 0) {
        console.log(`Recipe generated with ${response.missingIngredients.length} missing ingredients:`, response.missingIngredients)
      }

    } catch (error: any) {
      console.log("Recipe generation failed:", error)
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
    setCurrentStep(0)
    performRecipeGeneration()
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
          <ScrollView 
            className="flex-1 px-4" 
            contentContainerStyle={{ justifyContent: 'center', minHeight: '80%' }}
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center space-y-8">
              {/* Main Loading Animation */}
              <View className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 items-center justify-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>

              {/* Current Step */}
              <View className="items-center space-y-4">
                <Text className="text-white text-2xl font-bold text-center">
                  Creating Your Perfect Recipe
                </Text>
                
                <View className="bg-zinc-800 rounded-2xl p-6 mx-4">
                  <Text className="text-orange-400 text-lg font-semibold text-center">
                    {GENERATION_STEPS[currentStep]}
                  </Text>
                </View>
              </View>

              {/* Progress Indicators */}
              <View className="flex-row space-x-2">
                {GENERATION_STEPS.map((_, index) => (
                  <View
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index <= currentStep ? 'bg-orange-400' : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </View>

              <Text className="text-zinc-400 text-center text-sm px-8">
                Our AI chef is analyzing your ingredients and preferences to create something delicious...
              </Text>
            </View>
          </ScrollView>
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
    </View>
  )
}