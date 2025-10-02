"use client"

import { GeneratedRecipe } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Animated, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import GeneratedRecipeCard from "./GeneratedRecipeCard"
import RecipeDetailModal from "./RecipieDetailModel"

interface RecipeResponseScreenProps {
  visible: boolean
  onClose: () => void
  isGenerating: boolean
  generatedRecipe: GeneratedRecipe | null
  error: string | null
  onRetry: () => void
  onSaveRecipe: (recipe: GeneratedRecipe) => void
  onShareRecipe: (recipe: GeneratedRecipe) => void
}

const GENERATION_STEPS = [
  "🔍 Analyzing your pantry ingredients...",
  "🧠 Understanding your preferences...",
  "👨‍🍳 Consulting our AI chef...",
  "📝 Crafting your perfect recipe...",
  "✨ Adding finishing touches..."
]

export default function RecipeResponseScreen({
  visible,
  onClose,
  isGenerating,
  generatedRecipe,
  error,
  onRetry,
  onSaveRecipe,
  onShareRecipe
}: RecipeResponseScreenProps): JSX.Element {
  const insets = useSafeAreaInsets()
  const [currentStep, setCurrentStep] = useState(0)
  const [showRecipeDetail, setShowRecipeDetail] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))

  useEffect(() => {
    if (visible) {
      setCurrentStep(0)
      // Reset animations
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.8)
      
      if (isGenerating) {
        startGenerationAnimation()
      } else if (generatedRecipe) {
        showSuccessAnimation()
      }
    }
  }, [visible, isGenerating, generatedRecipe])

  const startGenerationAnimation = () => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < GENERATION_STEPS.length - 1) {
          return prev + 1
        } else {
          clearInterval(stepInterval)
          return prev
        }
      })
    }, 1000)

    return () => clearInterval(stepInterval)
  }

  const showSuccessAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start()
  }

  const handleRecipePress = () => {
    if (generatedRecipe) {
      setShowRecipeDetail(true)
    }
  }

  const handleSave = () => {
    if (generatedRecipe) {
      onSaveRecipe(generatedRecipe)
      Alert.alert("Recipe Saved!", "Recipe has been saved to your favorites.")
    }
  }

  const handleShare = () => {
    if (generatedRecipe) {
      onShareRecipe(generatedRecipe)
    }
  }

  const handleGenerateAnother = () => {
    onClose()
  }

  if (!visible) {
    return <></>
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-zinc-900">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
        <TouchableOpacity onPress={onClose} className="p-2">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">
          {isGenerating ? "Generating Recipe..." : error ? "Recipe Error" : "Your Recipe"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Loading State */}
        {isGenerating && (
          <View className="flex-1 justify-center items-center px-6">
            <View className="items-center mb-8">
              <View className="w-32 h-32 rounded-full bg-yellow-400 bg-opacity-20 items-center justify-center mb-6">
                <ActivityIndicator size="large" color="#FBBF24" />
              </View>
              
              <Text className="text-white text-xl font-bold mb-2">Creating Your Recipe</Text>
              <Text className="text-zinc-400 text-center mb-8">
                Our AI chef is working on something delicious for you...
              </Text>

              <View className="w-full max-w-sm">
                <Text className="text-yellow-400 text-center mb-4 min-h-[24px]">
                  {GENERATION_STEPS[currentStep]}
                </Text>
                
                <View className="bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <View 
                    className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / GENERATION_STEPS.length) * 100}%` }}
                  />
                </View>
                
                <Text className="text-zinc-500 text-center mt-2 text-sm">
                  Step {currentStep + 1} of {GENERATION_STEPS.length}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <View className="flex-1 justify-center items-center px-6">
            <View className="items-center mb-8">
              <View className="w-32 h-32 rounded-full bg-red-500 bg-opacity-20 items-center justify-center mb-6">
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
              </View>
              
              <Text className="text-white text-xl font-bold mb-2">Oops! Something went wrong</Text>
              <Text className="text-zinc-400 text-center mb-8">
                {error}
              </Text>

              <TouchableOpacity 
                className="rounded-xl overflow-hidden mb-4"
                onPress={onRetry}
              >
                <LinearGradient
                  colors={["#FBBF24", "#F97416"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 px-8"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-2">Try Again</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-zinc-700 rounded-xl py-4 px-8"
                onPress={onClose}
              >
                <Text className="text-white font-bold">Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Success State */}
        {generatedRecipe && !isGenerating && !error && (
          <Animated.View 
            style={{ 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }}
            className="flex-1"
          >
            <View className="p-4">
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-full bg-green-500 bg-opacity-20 items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                </View>
                <Text className="text-white text-xl font-bold mb-2">Recipe Ready!</Text>
                <Text className="text-zinc-400 text-center">
                  Your personalized recipe has been generated
                </Text>
              </View>

              {/* Recipe Card */}
              <GeneratedRecipeCard 
                recipe={generatedRecipe} 
                onPress={handleRecipePress}
              />

              {/* Action Buttons */}
              <View className="mt-6 space-y-3">
                <TouchableOpacity 
                  className="rounded-xl overflow-hidden"
                  onPress={handleRecipePress}
                >
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4"
                  >
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="book" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">View Full Recipe</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <View className="flex-row space-x-3">
                  <TouchableOpacity 
                    className="flex-1 bg-zinc-700 rounded-xl py-4"
                    onPress={handleSave}
                  >
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="bookmark" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">Save</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    className="flex-1 bg-zinc-700 rounded-xl py-4"
                    onPress={handleShare}
                  >
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="share" size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">Share</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  className="bg-yellow-400 rounded-xl py-4"
                  onPress={handleGenerateAnother}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="add-circle" size={20} color="#000000" />
                    <Text className="text-black font-bold ml-2">Generate Another Recipe</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        visible={showRecipeDetail}
        recipe={generatedRecipe}
        onClose={() => setShowRecipeDetail(false)}
      />
    </View>
  )
}