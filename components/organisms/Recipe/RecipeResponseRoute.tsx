"use client"

import { useFavoritesStore } from "@/hooks/useFavoritesStore"
import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import type { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import LottieView from "lottie-react-native"
import React, { type JSX, useEffect, useRef, useState } from "react"
import { Alert, Animated, BackHandler, Dimensions, ScrollView, Share, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Dialog from "../../atoms/Dialog"

const TIMEOUT_DURATION = 40000
const { width: SCREEN_WIDTH } = Dimensions.get("window")

export default function RecipeResponseRoute(): JSX.Element {
  const router = useRouter()
  const params = useLocalSearchParams()
  const insets = useSafeAreaInsets()
  const { addToFavorites, isFavorite, removeFromFavorites } = useFavoritesStore()

  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))
  const [pulseAnim] = useState(new Animated.Value(1))
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [showUnsafeIngredientsDialog, setShowUnsafeIngredientsDialog] = useState(false)
  const [showSaveSuccessDialog, setShowSaveSuccessDialog] = useState(false)
  const [showRemoveSuccessDialog, setShowRemoveSuccessDialog] = useState(false)
  const [showAddToPantryDialog, setShowAddToPantryDialog] = useState(false)
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [showGenerateNewDialog, setShowGenerateNewDialog] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<string>("")
  const [unsafeIngredientsData, setUnsafeIngredientsData] = useState<{
    flaggedIngredients: string[]
    safeIngredients: string[]
    message: string
  } | null>(null)

  const [isGenerating, setIsGenerating] = useState(true)
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missingIngredients, setMissingIngredients] = useState<string[]>([])
  const [pantryAnalysis, setPantryAnalysis] = useState<any>(null)
  const [sufficiencyWarning, setSufficiencyWarning] = useState<string | null>(null)
  const [adaptationNotes, setAdaptationNotes] = useState<any>(null)
  const [ingredientAnalysis, setIngredientAnalysis] = useState<any>(null)
  const [substitutions, setSubstitutions] = useState<
    Array<{
      original: string
      substitute: string
      ratio: string
      notes: string
    }>
  >([])
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showFullNutrition, setShowFullNutrition] = useState(false)
  const [isRecipeSaved, setIsRecipeSaved] = useState(false)

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

  useEffect(() => {
    if (isGenerating && !generatedRecipe && !error) {
      performRecipeGeneration()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Handle hardware back button
  useEffect(() => {
    const handleBackPress = () => {
      if (generatedRecipe && !isRecipeSaved) {
        setShowBackDialog(true)
        return true // Prevent default back action
      }
      return false // Allow default back action
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress)

    return () => backHandler.remove()
  }, [generatedRecipe, isRecipeSaved])

  const performRecipeGeneration = async (): Promise<void> => {
    timeoutRef.current = setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false)
        setShowTimeoutDialog(true)
      }
    }, TIMEOUT_DURATION)

    try {
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

      if (!filters.servings || filters.servings <= 0) {
        throw new Error("Serving size is required and must be greater than 0")
      }

      if (!filters.cookingTime || filters.cookingTime <= 0) {
        throw new Error("Cooking time is required and must be greater than 0")
      }

      const availableIngredients = filters.ingredients
      const request = recipeGenerationService.buildRecipeRequest(filters, availableIngredients)
      const validation = recipeGenerationService.validateRequest(request)

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      console.log("Generating recipe with request:", request)
      console.log("Requested servings:", request.portionSize)

      const response = await recipeGenerationService.generateRecipe(request)

      console.log("Recipe generation successful:", response.recipe.title)
      console.log("Server returned servings:", response.recipe.servings)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      setGeneratedRecipe(response.recipe)
      setIsRecipeSaved(false) // Reset saved state for new recipe
      setMissingIngredients(response.missingIngredients || [])
      setPantryAnalysis(response.pantryAnalysis || null)
      setSufficiencyWarning(response.sufficiencyWarning || null)
      setAdaptationNotes(response.adaptationNotes || null)
      setIngredientAnalysis(response.ingredientAnalysis || null)
      setSubstitutions(response.substitutions || [])

      if (response.missingIngredients.length > 0) {
        console.log("Missing ingredients:", response.missingIngredients)
      }
      if (response.sufficiencyWarning) {
        console.log("⚠️ Sufficiency warning:", response.sufficiencyWarning)
      }
    } catch (error: any) {
      console.log("Recipe generation failed:", error)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const errorMessage = error.message || ""
      if (errorMessage.includes("Unsafe ingredients detected") || errorMessage.includes("API Error: 400")) {
        try {
          const errorMatch = errorMessage.match(/\{.*\}/)
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[0])
            if (errorData.flaggedIngredients || errorData.error === "Unsafe ingredients detected") {
              setUnsafeIngredientsData({
                flaggedIngredients: errorData.flaggedIngredients || [],
                safeIngredients: errorData.safeIngredients || [],
                message: errorData.message || "Some ingredients are not safe for cooking.",
              })
              setShowUnsafeIngredientsDialog(true)
              return
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
    if (generatedRecipe && !isRecipeSaved) {
      setShowBackDialog(true)
    } else {
      router.back()
    }
  }

  const handleRetry = (): void => {
    if (generatedRecipe && !isRecipeSaved) {
      setShowGenerateNewDialog(true)
    } else {
      setIsGenerating(true)
      setError(null)
      setGeneratedRecipe(null)
      setIsRecipeSaved(false)
      setShowTimeoutDialog(false)
      performRecipeGeneration()
    }
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
    if (isFavorite(recipe.id)) {
      removeFromFavorites(recipe.id)
      setIsRecipeSaved(false)
      setShowRemoveSuccessDialog(true)
    } else {
      addToFavorites({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        image: recipe.image,
        cookTime: recipe.cookTime,
        prepTime: recipe.prepTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        category: recipe.category,
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes,
        })),
        instructions: recipe.instructions.map((inst) => ({
          step: inst.step,
          instruction: inst.instruction,
          duration: inst.duration,
          tips: inst.tips,
        })),
        nutritionInfo: recipe.nutritionInfo,
        tips: recipe.tips,
        substitutions: substitutions,
      })
      setIsRecipeSaved(true)
      setShowSaveSuccessDialog(true)
    }
  }

  const handleShareRecipe = async (recipe: GeneratedRecipe): Promise<void> => {
    let recipeText = `🍽️ ${recipe.title}\n\n`
    recipeText += `📝 ${recipe.description}\n\n`
    recipeText += `⏱️ Prep: ${recipe.prepTime}m | Cook: ${recipe.cookTime}m | Total: ${recipe.prepTime + recipe.cookTime}m\n`
    recipeText += `🍽️ Servings: ${recipe.servings} | Difficulty: ${recipe.difficulty} | Cuisine: ${recipe.cuisine}\n\n`

    recipeText += `📊 Nutrition (per serving):\n`
    recipeText += `• Calories: ${recipe.nutritionInfo.calories}\n`
    recipeText += `• Protein: ${recipe.nutritionInfo.protein}g\n`
    recipeText += `• Carbs: ${recipe.nutritionInfo.carbs}g\n`
    recipeText += `• Fat: ${recipe.nutritionInfo.fat}g\n\n`

    recipeText += `🛒 Ingredients:\n`
    recipe.ingredients.forEach((ingredient, index) => {
      recipeText += `${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
      if (ingredient.notes) {
        recipeText += ` (${ingredient.notes})`
      }
      recipeText += `\n`
    })
    recipeText += `\n`

    recipeText += `👨‍🍳 Instructions:\n`
    recipe.instructions.forEach((instruction) => {
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

    if (recipe.tips.length > 0) {
      recipeText += `💡 Chef's Tips:\n`
      recipe.tips.forEach((tip, index) => {
        recipeText += `• ${trimTextBeforeNewline(tip)}\n`
      })
      recipeText += `\n`
    }

    if (substitutions.length > 0) {
      recipeText += `🔄 Ingredient Substitutions:\n`
      substitutions.forEach((sub) => {
        recipeText += `• ${sub.original} → ${sub.substitute} (Ratio: ${sub.ratio})\n`
        if (sub.notes) {
          recipeText += `  ${sub.notes}\n`
        }
      })
      recipeText += `\n`
    }

    if (adaptationNotes) {
      if (adaptationNotes.timing?.length > 0) {
        recipeText += `⏰ Timing Notes:\n`
        adaptationNotes.timing.forEach((note: string) => {
          recipeText += `• ${trimTextBeforeNewline(note)}\n`
        })
        recipeText += `\n`
      }

      if (adaptationNotes.general?.length > 0) {
        recipeText += `📋 General Notes:\n`
        adaptationNotes.general.forEach((note: string) => {
          recipeText += `• ${trimTextBeforeNewline(note)}\n`
        })
        recipeText += `\n`
      }

      if (adaptationNotes.dietary?.length > 0) {
        recipeText += `🥗 Dietary Notes:\n`
        adaptationNotes.dietary.forEach((note: string) => {
          recipeText += `• ${trimTextBeforeNewline(note)}\n`
        })
        recipeText += `\n`
      }

      if (adaptationNotes.portion?.length > 0) {
        recipeText += `👥 Portion Notes:\n`
        adaptationNotes.portion.forEach((note: string) => {
          recipeText += `• ${trimTextBeforeNewline(note)}\n`
        })
        recipeText += `\n`
      }
    }

    recipeText += `---\nShared from Meal Mate App 🍳`

    try {
      await Share.share({
        message: recipeText,
      })
    } catch (error) {
      console.log("Unable to share recipe", error)
      Alert.alert("Unable to share", "Please try again later.")
    }
  }

  const trimTextBeforeNewline = (text: string): string => {
    const newlineIndex = text.indexOf("\n")
    return newlineIndex !== -1 ? text.substring(0, newlineIndex).trim() : text
  }

  const formatErrorMessage = (errorMessage: string): { title: string; message: string; isServerError: boolean } => {
    if (
      errorMessage.includes("API Error: 500") ||
      errorMessage.includes("sufficiencyAnalysis is not defined") ||
      errorMessage.includes("Server Error")
    ) {
      return {
        title: "Server Error",
        message: "We'll be back shortly. Please try again in a few moments.",
        isServerError: true,
      }
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("connection")) {
      return {
        title: "Connection Issue",
        message: "Please check your internet connection and try again.",
        isServerError: false,
      }
    }

    return {
      title: "Something Went Wrong",
      message: "Unable to process your request. Please try again.",
      isServerError: false,
    }
  }

  return (
    <View className="flex-1 bg-gray-900">
      {isGenerating && !error && !generatedRecipe && (
        <View className="flex-1 justify-center items-center bg-gray-900">
          {/* Artistic background with refined glows */}
          <View className="absolute inset-0">
            {/* Primary amber glow - top left */}
            <Animated.View
              className="absolute w-80 h-80 rounded-full"
              style={{
                top: "-10%",
                left: "-25%",
                backgroundColor: "#F59E0B",
                opacity: 0.08,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              }}
            />

            {/* Secondary amber glow - bottom right */}
            <Animated.View
              className="absolute w-64 h-64 rounded-full"
              style={{
                bottom: "5%",
                right: "-20%",
                backgroundColor: "#FBBF24",
                opacity: 0.06,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1.15, 0.95],
                    }),
                  },
                ],
              }}
            />

            {/* Accent glow - center */}
            <Animated.View
              className="absolute w-96 h-96 rounded-full"
              style={{
                top: "40%",
                left: "50%",
                marginLeft: -192,
                marginTop: -192,
                backgroundColor: "#D97706",
                opacity: 0.04,
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.9, 1.1],
                    }),
                  },
                ],
              }}
            />

            {/* Elegant divider lines */}
            <View className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />
            <View className="absolute bottom-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />

            {/* Vertical accent lines */}
            <View className="absolute top-0 bottom-0 left-1/4 w-px bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
            <View className="absolute top-0 bottom-0 right-1/4 w-px bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
          </View>

          <Animated.View className="items-center justify-center z-10 px-8" style={{ opacity: fadeAnim }}>
            {/* Premium Lottie with refined glow */}
            <View className="relative mb-12">
              <View className="absolute inset-0 bg-amber-500/15 rounded-full blur-3xl scale-150" />
              <View className="relative">
                <LottieView
                  source={require("@/assets/lottie/loading.json")}
                  autoPlay
                  loop
                  style={{ width: 160, height: 160 }}
                />
              </View>
            </View>

            {/* Refined typography */}
            <View className="items-center space-y-4">
              <Text className="text-white text-4xl font-light tracking-tight text-center leading-tight">
                Crafting Your{"\n"}
                <Text className="font-bold text-amber-400">Perfect Recipe</Text>
              </Text>

              {/* Elegant divider */}
              <View className="w-16 h-px bg-amber-500/30 my-2" />

              <Text className="text-zinc-300 text-center text-base font-light leading-relaxed max-w-xs">
                Our AI chef is analyzing ingredients and creating something extraordinary
              </Text>
            </View>

            {/* Sophisticated loading dots */}
            <View className="mt-12 flex-row items-center space-x-3">
              <Animated.View
                className="w-2.5 h-2.5 rounded-full bg-amber-500"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.2, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2.5 h-2.5 rounded-full bg-amber-400"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.4, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2.5 h-2.5 rounded-full bg-amber-500"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.6, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2.5 h-2.5 rounded-full bg-amber-400"
                style={{
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [1, 0.2],
                  }),
                }}
              />
            </View>
          </Animated.View>
        </View>
      )}

      {error &&
        (() => {
          const formattedError = formatErrorMessage(error)
          return (
            <ScrollView
              className="flex-1 bg-zinc-900"
              contentContainerStyle={{ justifyContent: "flex-start", paddingTop: 200 }}
            >
              <View className="items-center px-8 py-6">
                <View className="mb-8">
                  <View className="relative">
                    <View className="absolute inset-0 bg-amber-500/15 rounded-full blur-2xl scale-125" />
                    <View className="w-24 h-24 rounded-full bg-zinc-800/90 border-2 border-amber-500/30 items-center justify-center">
                      <Ionicons name="alert-circle-outline" size={48} color="#FCD34D" />
                    </View>
                  </View>
                </View>

                <View className="items-center space-y-5 mb-10">
                  <Text className="text-zinc-100 text-4xl font-bold tracking-tight text-center leading-tight px-4">
                    {formattedError.title}
                  </Text>

                  <View className="w-16 h-px bg-amber-500/40" />

                  <Text className="text-zinc-200 text-center text-base leading-relaxed px-6 max-w-md">
                    {formattedError.message}
                  </Text>
                </View>

                <View className="w-full max-w-sm space-y-4">
                  <TouchableOpacity
                    onPress={handleRetry}
                    className="w-full bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl px-8 py-5"
                    activeOpacity={0.8}
                  >
                    <Text className="text-amber-300 font-semibold text-base tracking-wide text-center">
                      {formattedError.isServerError ? "Try Again" : "Retry"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    className="w-full border-2 border-zinc-500 rounded-2xl px-8 py-5"
                    activeOpacity={0.8}
                  >
                    <Text className="text-zinc-200 font-semibold text-base tracking-wide text-center">Go Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )
        })()}

      {generatedRecipe && !isGenerating && (
        <Animated.View
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View className="bg-gray-900" style={{ paddingTop: insets.top }}>
            <View className="px-4 py-3">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color="#F9FAFB" />
                </TouchableOpacity>

                <View className="flex-row items-center">

                  <TouchableOpacity
                    onPress={() => handleShareRecipe(generatedRecipe)}
                    className="w-12 h-12 rounded-2xl bg-gray-700 border-2 border-gray-600 items-center justify-center mr-3 shadow-xl"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={22} color="#FBBF24" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSaveRecipe(generatedRecipe)}
                    className="w-12 h-12 rounded-2xl bg-gray-700 border-2 border-gray-600 items-center justify-center shadow-xl"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFavorite(generatedRecipe.id) ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color="#F59E0B"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="px-6 pb-4">
              <View className="space-y-3">
                <View>
                  <Text className="text-white text-2xl font-bold leading-tight tracking-tight">
                    {generatedRecipe.title}
                  </Text>
                  <View className="w-8 h-0.5 bg-amber-500 rounded-full mt-2" />
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {/* Recipe Description */}
            <View className="px-6 pt-2 pb-4">
              {showFullDescription ? (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(false)}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-300 text-base leading-relaxed">
                    {generatedRecipe.description}
                    <Text className="text-amber-400 text-sm font-medium"> Show Less</Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(true)}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-300 text-base leading-relaxed">
                    {generatedRecipe.description.length > 120
                      ? `${generatedRecipe.description.substring(0, 120)}...`
                      : generatedRecipe.description
                    }
                    <Text className="text-amber-400 text-sm font-medium">
                      {generatedRecipe.description.length > 120 ? ' Read More' : ''}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recipe Info Bar - Quick Overview */}
            <View className="px-4 mt-4">
              <View className="bg-gray-800 border-2 border-gray-600 rounded-xl p-4 shadow-lg">
              <View className="flex-row items-center justify-between">
                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg bg-emerald-500/20 items-center justify-center mb-1 shadow-sm">
                    <Ionicons name="people-outline" size={16} color="#34d399" />
                  </View>
                  <Text className="text-white text-sm font-bold">{generatedRecipe.servings}</Text>
                  <Text className="text-gray-300 text-xs font-medium">servings</Text>
                </View>

                <View className="w-px h-12 bg-gray-500" />

                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mb-1 shadow-sm">
                    <Ionicons name="time-outline" size={16} color="#60a5fa" />
                  </View>
                  <Text className="text-white text-sm font-bold">
                    {generatedRecipe.prepTime + generatedRecipe.cookTime}m
                  </Text>
                  <Text className="text-gray-300 text-xs font-medium">total</Text>
                </View>

                <View className="w-px h-12 bg-gray-500" />

                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg bg-purple-500/20 items-center justify-center mb-1 shadow-sm">
                    <Ionicons name="speedometer-outline" size={16} color="#a78bfa" />
                  </View>
                  <Text className="text-white text-sm font-bold">{generatedRecipe.difficulty}</Text>
                  <Text className="text-gray-300 text-xs font-medium">level</Text>
                </View>

                <View className="w-px h-12 bg-gray-500" />

                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg bg-amber-500/20 items-center justify-center mb-1 shadow-sm">
                    <Ionicons name="restaurant-outline" size={16} color="#fbbf24" />
                  </View>
                  <Text className="text-white text-sm font-bold">{generatedRecipe.cuisine}</Text>
                  <Text className="text-gray-300 text-xs font-medium">cuisine</Text>
                </View>
              </View>
              </View>
            </View>

            {/* Pantry Match & Nutrition */}
            <View className="px-4 pt-3">
              <View className="flex-row space-x-3">
                {pantryAnalysis && (
                  <TouchableOpacity className="flex-1 bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 flex-row items-center justify-center shadow-md">
                    <Ionicons name="pie-chart-outline" size={16} color="#10b981" />
                    <View className="ml-2">
                      <Text className="text-emerald-200 text-xs font-semibold">Pantry Match</Text>
                      <Text className="text-emerald-300 text-sm font-bold">{pantryAnalysis.matchPercentage}%</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!showFullNutrition && (
                  <TouchableOpacity
                    onPress={() => setShowFullNutrition(true)}
                    className="flex-1 bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 flex-row items-center justify-between shadow-md"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="nutrition-outline" size={16} color="#F59E0B" />
                      <View className="ml-2">
                        <Text className="text-amber-200 text-xs font-semibold">Nutrition</Text>
                        <Text className="text-amber-300 text-sm font-bold">{generatedRecipe.nutritionInfo.calories} kcal</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="#F59E0B" />
                  </TouchableOpacity>
                )}

                {showFullNutrition && (
                  <TouchableOpacity
                    onPress={() => setShowFullNutrition(false)}
                    className="flex-1 bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 flex-row items-center justify-between shadow-md"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="nutrition-outline" size={16} color="#F59E0B" />
                      <View className="ml-2">
                        <Text className="text-amber-200 text-xs font-semibold">Nutrition</Text>
                        <Text className="text-amber-300 text-sm font-bold">{generatedRecipe.nutritionInfo.calories} kcal</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-up" size={16} color="#F59E0B" />
                  </TouchableOpacity>
                )}
              </View>

              {showFullNutrition && (
                <View className="mt-3 bg-gray-800 border-2 border-gray-600 rounded-xl p-4 shadow-lg">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-1 h-4 bg-amber-500 rounded-full mr-2" />
                      <Text className="text-white text-sm font-bold tracking-wide uppercase">
                        Nutrition Per Serving
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowFullNutrition(false)}
                      className="w-6 h-6 rounded-full bg-gray-700 items-center justify-center"
                    >
                      <Ionicons name="close" size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-amber-400 text-xl font-bold mb-1">
                        {generatedRecipe.nutritionInfo.calories}
                      </Text>
                      <Text className="text-gray-300 text-xs tracking-wide font-semibold">CALORIES</Text>
                    </View>
                    <View className="w-px h-12 bg-gray-500" />
                    <View className="items-center flex-1">
                      <Text className="text-emerald-400 text-xl font-bold mb-1">
                        {generatedRecipe.nutritionInfo.protein}g
                      </Text>
                      <Text className="text-gray-300 text-xs tracking-wide font-semibold">PROTEIN</Text>
                    </View>
                    <View className="w-px h-12 bg-gray-500" />
                    <View className="items-center flex-1">
                      <Text className="text-blue-400 text-xl font-bold mb-1">{generatedRecipe.nutritionInfo.carbs}g</Text>
                      <Text className="text-gray-300 text-xs tracking-wide font-semibold">CARBS</Text>
                    </View>
                    <View className="w-px h-12 bg-gray-500" />
                    <View className="items-center flex-1">
                      <Text className="text-orange-400 text-xl font-bold mb-1">{generatedRecipe.nutritionInfo.fat}g</Text>
                      <Text className="text-gray-300 text-xs tracking-wide font-semibold">FAT</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Missing Ingredients */}
            {missingIngredients.length > 0 && (
              <View className="px-4 pt-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-1 h-6 bg-red-500 rounded-full mr-3" />
                    <Text className="text-white text-xl font-bold tracking-tight">Missing Items</Text>
                  </View>
                  <View className="bg-red-500/20 border-2 border-red-500/40 px-4 py-2 rounded-full shadow-md">
                    <Text className="text-red-200 text-xs font-bold">{missingIngredients.length} needed</Text>
                  </View>
                </View>
                <View className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-5 shadow-xl">
                  {missingIngredients.map((ingredient, index) => (
                    <View
                      key={`missing-${index}`}
                      className={`flex-row items-start justify-between py-4 ${
                        index !== missingIngredients.length - 1 ? "border-b border-gray-500" : ""
                      }`}
                    >
                      <View className="flex-1 flex-row items-center mr-3">
                        <View className="w-9 h-9 rounded-xl bg-red-500/20 items-center justify-center mr-3 shadow-sm">
                          <Ionicons name="alert-circle-outline" size={20} color="#f87171" />
                        </View>
                        <Text className="text-white text-base font-medium flex-1 flex-wrap">{ingredient}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedIngredient(ingredient)
                          setShowAddToPantryDialog(true)
                        }}
                        className="bg-amber-500/25 border-2 border-amber-400/60 px-6 py-3 rounded-xl shadow-lg min-w-[70px]"
                        activeOpacity={0.7}
                      >
                        <Text className="text-amber-100 text-sm font-bold tracking-wide text-center">Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {sufficiencyWarning && (
              <View className="px-4 mt-5">
                <View className="bg-amber-500/20 border-2 border-amber-400/60 rounded-2xl p-6 shadow-lg">
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-xl bg-amber-500/25 items-center justify-center mr-4 mt-1">
                      <Ionicons name="warning" size={20} color="#FCD34D" />
                    </View>
                    <Text className="text-amber-100 text-base leading-7 flex-1 font-medium">You provided insufficient ingredients for a standard recipe.</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Ingredients Section */}
            <View className="px-4 py-4">
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                <Text className="text-white text-xl font-bold tracking-tight">Ingredients</Text>
                <View className="flex-1 h-px bg-amber-500/20 ml-4" />
              </View>
              <View className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-3 shadow-xl">
                {generatedRecipe.ingredients.map((ingredient, index) => (
                  <View
                    key={`ingredient-${index}`}
                    className={`flex-row items-start py-2 ${
                      index !== generatedRecipe.ingredients.length - 1 ? "border-b border-gray-500" : ""
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

            {/* Substitutions */}
            {substitutions.length > 0 && (
              <View className="px-4 pb-6">
                <View className="flex-row items-center justify-between mb-5">
                  <View className="flex-row items-center">
                    <View className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
                    <Text className="text-white text-xl font-bold tracking-tight">Substitutions</Text>
                  </View>
                  <View className="bg-blue-500/20 border-2 border-blue-500/40 px-4 py-2 rounded-full shadow-md">
                    <Text className="text-blue-300 text-xs font-bold">{substitutions.length} options</Text>
                  </View>
                </View>
                <View className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-5 space-y-5 shadow-xl">
                  {substitutions.map((sub, index) => (
                    <View
                      key={`sub-${index}`}
                      className={`${index !== substitutions.length - 1 ? "pb-5 border-b border-gray-500" : ""}`}
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

            {/* Instructions Section */}
            <View className="px-4 py-6">
              <View className="flex-row items-center mb-5">
                <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                <Text className="text-white text-xl font-bold tracking-tight">Instructions</Text>
                <View className="flex-1 h-px bg-amber-500/20 ml-4" />
              </View>
              <View className="space-y-4">
                {generatedRecipe.instructions.map((instruction, index) => (
                  <View
                    key={`instruction-${index}`}
                    className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-6 shadow-xl"
                  >
                    <View className="flex-row">
                      <View className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl items-center justify-center mr-4 shadow-xl border-2 border-amber-400/40">
                        <Text className="text-white font-bold text-xl">{instruction.step}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base leading-7">{instruction.instruction}</Text>
                        {instruction.duration && (
                          <View className="flex-row items-center mt-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl px-4 py-2.5 self-start">
                            <Ionicons name="timer-outline" size={16} color="#FCD34D" />
                            <Text className="text-amber-200 text-sm ml-2 font-semibold tracking-wide">
                              {instruction.duration} minutes
                            </Text>
                          </View>
                        )}
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

            {/* Chef's Tips */}
            {generatedRecipe.tips.length > 0 && (
              <View className="px-4 pb-6">
                <View className="flex-row items-center mb-5">
                  <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                  <Text className="text-white text-xl font-bold tracking-tight">Chef's Tips</Text>
                  <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                </View>
                <View className="bg-amber-500/20 border-2 border-amber-400/60 rounded-2xl p-6 shadow-xl">
                  {generatedRecipe.tips.map((tip, index) => (
                    <View
                      key={index}
                      className={`flex-row items-start ${
                        index !== generatedRecipe.tips.length - 1 ? "mb-5 pb-5 border-b border-amber-400/30" : ""
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

            {/* Adaptation Notes */}
            {adaptationNotes &&
              (adaptationNotes.timing?.length > 0 ||
                adaptationNotes.general?.length > 0 ||
                adaptationNotes.dietary?.length > 0 ||
                adaptationNotes.portion?.length > 0) && (
                <View className="px-4 pb-6">
                  <View className="flex-row items-center mb-5">
                    <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                    <Text className="text-white text-xl font-bold tracking-tight">Recipe Notes</Text>
                    <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                  </View>
                  <View className="bg-gray-800 border-4 border-gray-600 rounded-2xl p-6 space-y-6 shadow-xl">
                    {adaptationNotes.timing && adaptationNotes.timing.length > 0 && (
                      <View>
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl bg-blue-500/15 items-center justify-center mr-3">
                            <Ionicons name="time-outline" size={18} color="#60a5fa" />
                          </View>
                          <Text className="text-blue-300 text-sm font-bold tracking-wide">TIMING NOTES</Text>
                        </View>
                        {adaptationNotes.timing.map((note: string, index: number) => (
                          <Text key={`timing-${index}`} className="text-white text-sm leading-7 mb-2 ml-10">
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}

                    {adaptationNotes.general && adaptationNotes.general.length > 0 && (
                      <View className="pt-6 border-t border-gray-500">
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl bg-emerald-500/15 items-center justify-center mr-3">
                            <Ionicons name="information-circle-outline" size={18} color="#34d399" />
                          </View>
                          <Text className="text-emerald-300 text-sm font-bold tracking-wide">GENERAL NOTES</Text>
                        </View>
                        {adaptationNotes.general.map((note: string, index: number) => (
                          <Text key={`general-${index}`} className="text-white text-sm leading-7 mb-2 ml-12">
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}

                    {adaptationNotes.dietary && adaptationNotes.dietary.length > 0 && (
                      <View className="pt-3">
                        <View className="flex-row items-center mb-2">
                          <View className="w-9 h-9 rounded-xl bg-purple-500/15 items-center justify-center mr-3">
                            <Ionicons name="nutrition-outline" size={18} color="#a78bfa" />
                          </View>
                          <Text className="text-purple-300 text-sm font-bold tracking-wide">DIETARY NOTES</Text>
                        </View>
                        {adaptationNotes.dietary.map((note: string, index: number) => (
                          <Text key={`dietary-${index}`} className="text-white text-sm leading-6 mb-1 ml-12">
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}

                    {adaptationNotes.portion && adaptationNotes.portion.length > 0 && (
                      <View className="pt-6 border-t border-gray-500">
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl bg-amber-500/15 items-center justify-center mr-3">
                            <Ionicons name="people-outline" size={18} color="#fbbf24" />
                          </View>
                          <Text className="text-amber-300 text-sm font-bold tracking-wide">PORTION NOTES</Text>
                        </View>
                        {adaptationNotes.portion.map((note: string, index: number) => (
                          <Text key={`portion-${index}`} className="text-white text-sm leading-7 mb-2 ml-12">
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

            <View className="px-4 pb-6">
              <TouchableOpacity
                onPress={() => handleSaveRecipe(generatedRecipe)}
                className="bg-amber-600 border-2 border-amber-500 rounded-2xl py-5 flex-row items-center justify-center shadow-xl mb-3"
                activeOpacity={0.8}
              >
                <Ionicons name="bookmark-outline" size={24} color="#FCD34D" />
                <Text className="text-white font-bold ml-3 text-lg tracking-wide">Save to Favorites</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRetry}
                className="bg-gray-700 border-2 border-gray-600 rounded-2xl py-5 flex-row items-center justify-center shadow-xl"
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={24} color="#FCD34D" />
                <Text className="text-white font-bold ml-3 text-lg tracking-wide">Generate New Recipe</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Dialogs */}
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

      <Dialog
        visible={showUnsafeIngredientsDialog}
        type="warning"
        title="⚠️ Unsafe Ingredients Detected"
        message={
          unsafeIngredientsData
            ? `\n🚫  ${unsafeIngredientsData.flaggedIngredients
                .map((ingredient) => ingredient.toUpperCase())
                .join(" • ")}\n\n` + "Please remove unsafe ingredients and try again with only edible food items."
            : "Please provide only safe, edible ingredients for recipe generation."
        }
        onClose={handleUnsafeIngredientsClose}
        confirmText="Go Back"
        showCancelButton={false}
      />

      <Dialog
        visible={showSaveSuccessDialog}
        type="success"
        title="Recipe Saved!"
        message="Recipe has been added to your favorites"
        onClose={() => setShowSaveSuccessDialog(false)}
        confirmText="OK"
        autoClose={true}
        autoCloseTime={2000}
      />

      <Dialog
        visible={showRemoveSuccessDialog}
        type="success"
        title="Recipe Removed!"
        message="Recipe has been removed from your favorites"
        onClose={() => setShowRemoveSuccessDialog(false)}
        confirmText="OK"
        autoClose={true}
        autoCloseTime={2000}
      />

      <Dialog
        visible={showBackDialog}
        type="warning"
        title="Recipe Not Saved"
        message="You haven't saved this recipe yet. Do you want to save it before leaving?"
        onClose={() => {
          setShowBackDialog(false)
          router.back()
        }}
        onCloseButton={() => {
          setShowBackDialog(false)
        }}
        onConfirm={() => {
          handleSaveRecipe(generatedRecipe!)
          setShowBackDialog(false)
          router.back()
        }}
        confirmText="Save & Exit"
        cancelText="Exit"
        showCancelButton={true}
        showCloseButton={true}
      />

      <Dialog
        visible={showGenerateNewDialog}
        type="warning"
        title="Recipe Not Saved"
        message="You haven't saved this recipe yet. Do you want to save it before generating a new one?"
        onClose={() => {
          setShowGenerateNewDialog(false)
          setIsGenerating(true)
          setError(null)
          setGeneratedRecipe(null)
          setIsRecipeSaved(false)
          performRecipeGeneration()
        }}
        onCloseButton={() => {
          setShowGenerateNewDialog(false)
        }}
        onConfirm={() => {
          handleSaveRecipe(generatedRecipe!)
          setShowGenerateNewDialog(false)
          setIsGenerating(true)
          setError(null)
          setGeneratedRecipe(null)
          setIsRecipeSaved(false)
          performRecipeGeneration()
        }}
        confirmText="Generate & Save"
        cancelText="Generate"
        showCancelButton={true}
        showCloseButton={true}
      />

      <Dialog
        visible={showAddToPantryDialog}
        type="warning"
        title="Add to Pantry"
        message={`Add ${selectedIngredient} to your pantry?`}
        onClose={() => setShowAddToPantryDialog(false)}
        onConfirm={() => {
          console.log(`Adding ${selectedIngredient} to pantry`)
          setShowAddToPantryDialog(false)
        }}
        confirmText="Add"
        cancelText="Cancel"
        showCancelButton={true}
      />

      <View className="bg-gray-900" style={{ height: insets.bottom }} />
    </View>
  )
}
