"use client"

import { useFavoritesStore } from "@/hooks/useFavoritesStore"
import { groceryService, type AddGroceryItemData } from "@/lib/services/groceryService"
import { recipeGenerationService } from "@/lib/services/recipeGenerationService"
import type { GeneratedRecipe, RecipeFilters } from "@/lib/types/recipeGeneration"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import LottieView from "lottie-react-native"
import React, { useEffect, useRef, useState, type JSX } from "react"
import { Alert, Animated, BackHandler, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Dialog from "../../atoms/Dialog"

// 🔧 PRODUCTION FIX: Interface for missing ingredients
interface MissingIngredient {
  name: string;
  category?: string;
  priority?: string;
}

const TIMEOUT_DURATION = 50000
const { width: SCREEN_WIDTH } = Dimensions.get("window")

// 🔧 PRODUCTION FIX: Helper function to extract ingredient name
const getIngredientName = (ingredient: string | MissingIngredient): string => {
  return typeof ingredient === 'string' ? ingredient : ingredient.name;
}

// Units for grocery items
const GROCERY_UNITS = [
  "pieces", "kilograms", "grams", "liters", "milliliters", 
  "cups", "tablespoons", "teaspoons", "ounces", "pounds"
]

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
  const [showAddToGroceryModal, setShowAddToGroceryModal] = useState(false)
  const [showGrocerySuccessDialog, setShowGrocerySuccessDialog] = useState(false)
  const [addedGroceryItems, setAddedGroceryItems] = useState<Set<string>>(new Set())
  const [isAddingToGrocery, setIsAddingToGrocery] = useState(false)
  const [showBackDialog, setShowBackDialog] = useState(false)
  const [showGenerateNewDialog, setShowGenerateNewDialog] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<string>("")
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    quantity: "1",
    unit: "pieces",
    urgency: "normal" as "normal" | "urgent",
    purchaseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    notes: ""
  })
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false)
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)
  const [unsafeIngredientsData, setUnsafeIngredientsData] = useState<{
    flaggedIngredients: string[]
    safeIngredients: string[]
    message: string
  } | null>(null)

  const [isGenerating, setIsGenerating] = useState(true)
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missingIngredients, setMissingIngredients] = useState<(string | MissingIngredient)[]>([])
  const [pantryAnalysis, setPantryAnalysis] = useState<any>(null)
  const [sufficiencyWarning, setSufficiencyWarning] = useState<string | null>(null)
  const [adaptationNotes, setAdaptationNotes] = useState<any>(null)
  const [ingredientAnalysis, setIngredientAnalysis] = useState<any>(null)
  const [substitutions, setSubstitutions] = useState<
    {
      original: string
      substitute: string
      ratio: string
      notes: string
    }[]
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

      const response = await recipeGenerationService.generateRecipe(request)

      // 🔧 PRODUCTION FIX: Ensure recipe has a unique ID
      if (!response.recipe.id) {
        response.recipe.id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // 🔧 PRODUCTION FIX: Ensure all ingredients have IDs
      response.recipe.ingredients = response.recipe.ingredients.map((ingredient, index) => ({
        ...ingredient,
        id: ingredient.id || `ing_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`
      }));

      // 🔧 PRODUCTION FIX: Ensure all instructions have IDs  
      response.recipe.instructions = response.recipe.instructions.map((instruction, index) => ({
        ...instruction,
        id: instruction.id || `inst_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`
      }));

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

  const handleStartCooking = (recipe: GeneratedRecipe): void => {
    if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
      Alert.alert('Error', 'No cooking instructions available for this recipe.');
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
    // 🔧 PRODUCTION: Robust validation with auto-fix
    const validatedRecipe = { ...recipe };
    
    // Auto-generate ID if missing
    if (!validatedRecipe.id || validatedRecipe.id.trim() === '') {
      validatedRecipe.id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate and auto-fix critical fields
    if (!validatedRecipe.title || validatedRecipe.title.trim() === '') {
      console.log('❌ Critical: Recipe title is missing');
      Alert.alert('Error', 'Recipe data is corrupted. Please generate a new recipe.');
      return;
    }

    if (!validatedRecipe.ingredients || validatedRecipe.ingredients.length === 0) {
      console.log('❌ Critical: Recipe has no ingredients');
      Alert.alert('Error', 'Recipe has no ingredients. Please generate a new recipe.');
      return;
    }

    if (isFavorite(validatedRecipe.id)) {
      removeFromFavorites(validatedRecipe.id)
      setIsRecipeSaved(false)
      setShowRemoveSuccessDialog(true)
    } else {
      addToFavorites({
        recipeId: validatedRecipe.id,
        title: validatedRecipe.title,
        description: validatedRecipe.description,
        image: validatedRecipe.image,
        cookTime: validatedRecipe.cookTime,
        prepTime: validatedRecipe.prepTime,
        servings: validatedRecipe.servings,
        difficulty: validatedRecipe.difficulty as 'Easy' | 'Medium' | 'Hard',
        cuisine: validatedRecipe.cuisine,
        category: validatedRecipe.category,
        ingredients: validatedRecipe.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          notes: ing.notes,
        })),
        instructions: validatedRecipe.instructions.map((inst) => ({
          step: inst.step,
          instruction: inst.instruction,
          duration: inst.duration,
          tips: inst.tips,
        })),
        nutritionInfo: validatedRecipe.nutritionInfo,
        tips: validatedRecipe.tips,
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

  const formatDisplayDate = (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // 🛒 GROCERY FUNCTIONALITY
  const handleOpenGroceryModal = (ingredientName: string): void => {
    setSelectedIngredient(ingredientName)
    setNewItemForm({
      name: ingredientName,
      quantity: "1",
      unit: "pieces",
      urgency: "normal",
      purchaseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: ""
    })
    setIsUnitDropdownOpen(false)
    setShowAddToGroceryModal(true)
  }

  const handleCloseGroceryModal = (): void => {
    setShowAddToGroceryModal(false)
    setIsUnitDropdownOpen(false)
    setShowPurchaseDatePicker(false)
  }

  const handleAddToGrocery = async (): Promise<void> => {
    if (!newItemForm.name.trim()) {
      Alert.alert("Error", "Please enter an item name")
      return
    }

    if (!newItemForm.quantity || parseFloat(newItemForm.quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity")
      return
    }

    try {
      setIsAddingToGrocery(true)

      const groceryData: AddGroceryItemData = {
        name: newItemForm.name.trim(),
        quantity: parseFloat(newItemForm.quantity),
        unit: newItemForm.unit,
        urgency: newItemForm.urgency,
        purchaseDate: newItemForm.purchaseDate.toISOString(),
        notes: newItemForm.notes.trim()
      }

      const response = await groceryService.addGroceryItem(groceryData)
      
      if (response.success) {
        // Add to tracking set
        setAddedGroceryItems(prev => new Set([...prev, newItemForm.name.trim()]))
        
        // Close modal and show success
        setShowAddToGroceryModal(false)
        setShowGrocerySuccessDialog(true)
        
        // Reset form
        setSelectedIngredient("")
        setNewItemForm({
          name: "",
          quantity: "1",
          unit: "pieces",
          urgency: "normal",
          purchaseDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          notes: ""
        })
      }
    } catch (error) {
      console.log("Error adding grocery item:", error)
      Alert.alert("Error", "Failed to add item to grocery list. Please try again.")
    } finally {
      setIsAddingToGrocery(false)
    }
  }

  const handlePurchaseDateChange = (event: any, selectedDate?: Date): void => {
    setShowPurchaseDatePicker(false)
    if (selectedDate) {
      setNewItemForm(prev => ({ ...prev, purchaseDate: selectedDate }))
    }
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
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000"
        translucent={true}
      />
      <LinearGradient
        colors={["#000000", "#121212"]}
        className="flex-1"
      >
        {isGenerating && !error && !generatedRecipe && (
        <LinearGradient
          colors={["#000000", "#121212"]}
          className="flex-1 justify-center items-center"
        >
          {/* Artistic background with refined glows */}
          <View className="absolute inset-0">
            {/* Primary gold glow - top left */}
            <Animated.View
              className="absolute w-80 h-80 rounded-full"
              style={{
                top: "-10%",
                left: "-25%",
                backgroundColor: "#FACC15",
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

            {/* Secondary orange glow - bottom right */}
            <Animated.View
              className="absolute w-64 h-64 rounded-full"
              style={{
                bottom: "5%",
                right: "-20%",
                backgroundColor: "#F97316",
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
                backgroundColor: "#F59E0B",
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
          </View>

          <Animated.View className="items-center justify-center z-10 px-8" style={{ opacity: fadeAnim }}>
            {/* Premium Lottie with refined glow */}
            <View className="relative mb-12">
              <View className="absolute inset-0 rounded-full blur-3xl scale-150" style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)' }} />
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
              <Text className="text-4xl font-light tracking-tight text-center leading-tight" style={{ color: '#FFFFFF' }}>
                Crafting Your{"\n"}
                <Text className="font-bold" style={{ color: '#FACC15' }}>Perfect Recipe</Text>
              </Text>

              {/* Elegant divider */}
              <View className="w-16 h-px my-2" style={{ backgroundColor: 'rgba(250, 204, 21, 0.3)' }} />

              <Text className="text-center text-base font-light leading-relaxed max-w-xs" style={{ color: '#94A3B8' }}>
                Our AI chef is analyzing ingredients and creating something extraordinary
              </Text>
            </View>

            {/* Sophisticated loading dots */}
            <View className="mt-12 flex-row items-center space-x-3">
              <Animated.View
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: '#FACC15',
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.2, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: '#F97316',
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.4, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: '#FACC15',
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.6, 1],
                  }),
                }}
              />
              <Animated.View
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: '#F97316',
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [1, 0.2],
                  }),
                }}
              />
            </View>
          </Animated.View>
        </LinearGradient>
      )}

      {error &&
        (() => {
          const formattedError = formatErrorMessage(error)
          return (
            <LinearGradient
              colors={["#000000", "#121212"]}
              className="flex-1"
            >
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ justifyContent: "flex-start", paddingTop: 200 }}
              >
              <View className="items-center px-8 py-6">
                <View className="mb-8">
                  <View className="relative">
                    <View className="absolute inset-0 rounded-full blur-2xl scale-125" style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)' }} />
                    <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                      <Ionicons name="alert-circle-outline" size={48} color="#FACC15" />
                    </View>
                  </View>
                </View>

                <View className="items-center space-y-5 mb-10">
                  <Text className="text-4xl font-bold tracking-tight text-center leading-tight px-4" style={{ color: '#FFFFFF' }}>
                    {formattedError.title}
                  </Text>

                  <View className="w-16 h-px" style={{ backgroundColor: 'rgba(250, 204, 21, 0.4)' }} />

                  <Text className="text-center text-base leading-relaxed px-6 max-w-md" style={{ color: '#94A3B8' }}>
                    {formattedError.message}
                  </Text>
                </View>

                <View className="w-full max-w-sm space-y-4">
                  <TouchableOpacity
                    onPress={handleRetry}
                    className="w-full rounded-2xl px-8 py-5"
                    style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.4)' }}
                    activeOpacity={0.8}
                  >
                    <Text className="font-semibold text-base tracking-wide text-center" style={{ color: '#FACC15' }}>
                      {formattedError.isServerError ? "Try Again" : "Retry"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    className="w-full rounded-2xl px-8 py-5"
                    style={{ borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    activeOpacity={0.8}
                  >
                    <Text className="font-semibold text-base tracking-wide text-center" style={{ color: '#94A3B8' }}>Go Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            </LinearGradient>
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
          <LinearGradient
            colors={["#000000", "#121212"]}
            style={{ paddingTop: insets.top }}
          >
            <View className="px-4 py-3">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-row items-center">

                  <TouchableOpacity
                    onPress={() => handleShareRecipe(generatedRecipe)}
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3 shadow-sm"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={20} color="#FACC15" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSaveRecipe(generatedRecipe)}
                    className="w-12 h-12 rounded-xl items-center justify-center shadow-sm"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFavorite(generatedRecipe.id) ? "bookmark" : "bookmark-outline"}
                      size={20}
                      color="#FACC15"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="px-6 pb-4">
              <View className="space-y-3">
                <View>
                  <Text className="text-2xl font-bold leading-tight tracking-tight" style={{ color: '#FFFFFF' }}>
                    {generatedRecipe.title}
                  </Text>
                  <View className="w-8 h-0.5 rounded-full mt-2" style={{ backgroundColor: '#FACC15' }} />
                </View>
              </View>
            </View>
          </LinearGradient>

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
                  <Text className="text-base leading-relaxed" style={{ color: '#94A3B8' }}>
                    {generatedRecipe.description}
                    <Text className="text-sm font-medium" style={{ color: '#FACC15' }}> Show Less</Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(true)}
                  activeOpacity={0.7}
                >
                  <Text className="text-base leading-relaxed" style={{ color: '#94A3B8' }}>
                    {generatedRecipe.description.length > 120
                      ? `${generatedRecipe.description.substring(0, 120)}...`
                      : generatedRecipe.description
                    }
                    <Text className="text-sm font-medium" style={{ color: '#FACC15' }}>
                      {generatedRecipe.description.length > 120 ? ' Read More' : ''}
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recipe Info Bar - Quick Overview */}
            <View className="px-4 mt-4">
              <View className="rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <View className="flex-row items-center justify-between">
                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <Ionicons name="people-outline" size={16} color="#22C55E" />
                  </View>
                  <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{generatedRecipe.servings}</Text>
                  <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>servings</Text>
                </View>

                <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <Ionicons name="time-outline" size={16} color="#3B82F6" />
                  </View>
                  <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                    {generatedRecipe.prepTime + generatedRecipe.cookTime}m
                  </Text>
                  <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>total</Text>
                </View>

                <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                    <Ionicons name="speedometer-outline" size={16} color="#A855F7" />
                  </View>
                  <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{generatedRecipe.difficulty}</Text>
                  <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>level</Text>
                </View>

                <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                <View className="items-center">
                  <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                    <Ionicons name="restaurant-outline" size={16} color="#FACC15" />
                  </View>
                  <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{generatedRecipe.cuisine}</Text>
                  <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>cuisine</Text>
                </View>
              </View>
              </View>
            </View>

            {/* Pantry Match & Nutrition */}
            <View className="px-4 pt-3">
              <View className="flex-row space-x-6">
                {pantryAnalysis && (
                  <TouchableOpacity className="flex-1 mr-1 rounded-xl p-3 flex-row items-center justify-center shadow-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                    <Ionicons name="pie-chart-outline" size={16} color="#22C55E" />
                    <View className="ml-2">
                      <Text className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Pantry Match</Text>
                      <Text className="text-sm font-bold" style={{ color: '#22C55E' }}>{pantryAnalysis.matchPercentage}%</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!showFullNutrition && (
                  <TouchableOpacity
                    onPress={() => setShowFullNutrition(true)}
                    className="flex-1 ml-1 rounded-xl p-3 flex-row items-center justify-between shadow-sm"
                    style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="nutrition-outline" size={16} color="#FACC15" />
                      <View className="ml-2">
                        <Text className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Nutrition</Text>
                        <Text className="text-sm font-bold" style={{ color: '#FACC15' }}>{generatedRecipe.nutritionInfo.calories} kcal</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="#FACC15" />
                  </TouchableOpacity>
                )}

                {showFullNutrition && (
                  <TouchableOpacity
                    onPress={() => setShowFullNutrition(false)}
                    className="flex-1 ml-1 rounded-xl p-3 flex-row items-center justify-between shadow-sm"
                    style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="nutrition-outline" size={16} color="#FACC15" />
                      <View className="ml-2">
                        <Text className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Nutrition</Text>
                        <Text className="text-sm font-bold" style={{ color: '#FACC15' }}>{generatedRecipe.nutritionInfo.calories} kcal</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-up" size={16} color="#FACC15" />
                  </TouchableOpacity>
                )}
              </View>

              {showFullNutrition && (
                <View className="mt-3 rounded-xl p-4 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-1 h-4 rounded-full mr-2" style={{ backgroundColor: '#FACC15' }} />
                      <Text className="text-sm font-bold tracking-wide uppercase" style={{ color: '#FFFFFF' }}>
                        Nutrition Per Serving
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowFullNutrition(false)}
                      className="w-6 h-6 rounded-full items-center justify-center"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                    >
                      <Ionicons name="close" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="items-center flex-1">
                      <Text className="text-xl font-bold mb-1" style={{ color: '#FACC15' }}>
                        {generatedRecipe.nutritionInfo.calories}
                      </Text>
                      <Text className="text-xs tracking-wide font-semibold" style={{ color: '#94A3B8' }}>CALORIES</Text>
                    </View>
                    <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <View className="items-center flex-1">
                      <Text className="text-xl font-bold mb-1" style={{ color: '#22C55E' }}>
                        {generatedRecipe.nutritionInfo.protein}g
                      </Text>
                      <Text className="text-xs tracking-wide font-semibold" style={{ color: '#94A3B8' }}>PROTEIN</Text>
                    </View>
                    <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <View className="items-center flex-1">
                      <Text className="text-xl font-bold mb-1" style={{ color: '#3B82F6' }}>{generatedRecipe.nutritionInfo.carbs}g</Text>
                      <Text className="text-xs tracking-wide font-semibold" style={{ color: '#94A3B8' }}>CARBS</Text>
                    </View>
                    <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <View className="items-center flex-1">
                      <Text className="text-xl font-bold mb-1" style={{ color: '#F97316' }}>{generatedRecipe.nutritionInfo.fat}g</Text>
                      <Text className="text-xs tracking-wide font-semibold" style={{ color: '#94A3B8' }}>FAT</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Missing Ingredients */}
            {missingIngredients.length > 0 && (
              <View className="px-4 pt-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#EF4444' }} />
                    <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Missing Items</Text>
                  </View>
                  <View className="px-4 py-2 rounded-full shadow-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <Text className="text-xs font-bold" style={{ color: '#EF4444' }}>{missingIngredients.length} needed</Text>
                  </View>
                </View>
                <View className="rounded-2xl p-3 shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  {missingIngredients.map((ingredient, index) => (
                    <View
                      key={`missing-${index}`}
                      className={`flex-row items-start justify-between py-2 ${
                        index !== missingIngredients.length - 1 ? "border-b" : ""
                      }`}
                      style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <View className="flex-1 flex-row items-center mr-3">
                        <View className="w-9 h-9 rounded-xl items-center justify-center mr-3 shadow-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                        </View>
                        <Text className="text-base font-medium flex-1 flex-wrap" style={{ color: '#FFFFFF' }}>
                          {getIngredientName(ingredient)}
                        </Text>
                      </View>
                      {addedGroceryItems.has(getIngredientName(ingredient)) ? (
                        <View className="px-4 py-2 rounded-xl shadow-sm min-w-[100px] items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                            <Text className="text-sm font-bold tracking-wide text-center ml-1" style={{ color: '#22C55E' }}>Added</Text>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleOpenGroceryModal(getIngredientName(ingredient))}
                          className="px-4 py-2 rounded-xl shadow-sm min-w-[100px]"
                          style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                          activeOpacity={0.7}
                        >
                          <Text className="text-sm font-bold tracking-wide text-center" style={{ color: '#FACC15' }}>Add to Grocery</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {sufficiencyWarning && (
              <View className="px-4 mt-3">
                <View className="rounded-xl p-3 shadow-sm" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-lg items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                      <Ionicons name="warning" size={14} color="#F59E0B" />
                    </View>
                    <Text className="text-sm leading-5 flex-1 font-medium" style={{ color: '#F59E0B' }}>You provided insufficient ingredients for a standard recipe.</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Ingredients Section */}
            <View className="px-4 py-4">
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Ingredients</Text>
                <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
              </View>
              <View className="rounded-2xl p-3 shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                {generatedRecipe.ingredients.map((ingredient, index) => (
                  <View
                    key={`ingredient-${index}`}
                    className={`flex-row items-start py-2 ${
                      index !== generatedRecipe.ingredients.length - 1 ? "border-b" : ""
                    }`}
                    style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4 mt-0.5 shadow-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 2, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                      <Text className="text-base font-bold" style={{ color: '#22C55E' }}>{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
                        <Text className="font-bold">
                          {ingredient.amount} {ingredient.unit}
                        </Text>
                        <Text> {ingredient.name}</Text>
                      </Text>
                      {ingredient.notes && (
                        <Text className="text-sm mt-2 leading-6 italic" style={{ color: '#94A3B8' }}>{ingredient.notes}</Text>
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
                    <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#3B82F6' }} />
                    <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Substitutions</Text>
                  </View>
                  <View className="px-4 py-2 rounded-full shadow-md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                    <Text className="text-xs font-bold" style={{ color: '#3B82F6' }}>{substitutions.length} options</Text>
                  </View>
                </View>
                <View className="rounded-2xl p-5 space-y-5 shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  {substitutions.map((sub, index) => (
                    <View
                      key={`sub-${index}`}
                      className={`${index !== substitutions.length - 1 ? "pb-5 border-b" : ""}`}
                      style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <View className="flex-row items-center mb-3">
                        <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                          <Ionicons name="swap-horizontal" size={18} color="#3B82F6" />
                        </View>
                        <Text className="font-bold text-base flex-1" style={{ color: '#FFFFFF' }}>
                          {sub.original} → {sub.substitute}
                        </Text>
                      </View>
                      <Text className="text-sm mb-2 ml-12" style={{ color: '#94A3B8' }}>Ratio: {sub.ratio}</Text>
                      <Text className="text-sm leading-6 ml-12" style={{ color: '#94A3B8' }}>{sub.notes}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions Section */}
            <View className="px-4 py-6">
              <View className="flex-row items-center mb-5">
                <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Instructions</Text>
                <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
              </View>
              <View className="space-y-4">
                {generatedRecipe.instructions.map((instruction, index) => (
                  <View
                    key={`instruction-${index}`}
                    className="rounded-2xl p-6 shadow-xl"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <View className="flex-row">
                      <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-xl border-2" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                        <Text className="font-bold text-xl" style={{ color: '#FACC15' }}>{instruction.step}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base leading-7" style={{ color: '#FFFFFF' }}>{instruction.instruction}</Text>
                        {instruction.duration && (
                          <View className="flex-row items-center mt-3 rounded-xl px-4 py-2.5 self-start" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                            <Ionicons name="timer-outline" size={16} color="#FACC15" />
                            <Text className="text-sm ml-2 font-semibold tracking-wide" style={{ color: '#FACC15' }}>
                              {instruction.duration} minutes
                            </Text>
                          </View>
                        )}
                        {instruction.tips && (
                          <View className="rounded-xl p-4 mt-3" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.2)' }}>
                            <View className="flex-row items-start">
                              <View className="w-7 h-7 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)' }}>
                                <Ionicons name="bulb-outline" size={14} color="#FACC15" />
                              </View>
                              <Text className="text-sm leading-6 flex-1" style={{ color: '#FACC15' }}>{instruction.tips}</Text>
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
                  <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                  <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Chef's Tips</Text>
                  <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
                </View>
                <View className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                  {generatedRecipe.tips.map((tip, index) => (
                    <View
                      key={index}
                      className={`flex-row items-start ${
                        index !== generatedRecipe.tips.length - 1 ? "mb-5 pb-5 border-b" : ""
                      }`}
                      style={{ borderBottomColor: 'rgba(250, 204, 21, 0.3)' }}
                    >
                      <View className="w-7 h-7 rounded-lg items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)' }}>
                        <Ionicons name="star" size={14} color="#FACC15" />
                      </View>
                      <Text className="text-base leading-7 flex-1" style={{ color: '#FACC15' }}>{tip}</Text>
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
                    <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                    <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Recipe Notes</Text>
                    <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
                  </View>
                  <View className="rounded-2xl p-6 space-y-6 shadow-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    {adaptationNotes.timing && adaptationNotes.timing.length > 0 && (
                      <View>
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                            <Ionicons name="time-outline" size={18} color="#3B82F6" />
                          </View>
                          <Text className="text-sm font-bold tracking-wide" style={{ color: '#3B82F6' }}>TIMING NOTES</Text>
                        </View>
                        {adaptationNotes.timing.map((note: string, index: number) => (
                          <Text key={`timing-${index}`} className="text-sm leading-7 mb-2 ml-10" style={{ color: '#FFFFFF' }}>
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}

                    {adaptationNotes.general && adaptationNotes.general.length > 0 && (
                      <View className="pt-6 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                            <Ionicons name="information-circle-outline" size={18} color="#22C55E" />
                          </View>
                          <Text className="text-sm font-bold tracking-wide" style={{ color: '#22C55E' }}>GENERAL NOTES</Text>
                        </View>
                        {adaptationNotes.general.map((note: string, index: number) => (
                          <Text key={`general-${index}`} className="text-sm leading-7 mb-2 ml-12" style={{ color: '#FFFFFF' }}>
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}

                    {adaptationNotes.dietary && adaptationNotes.dietary.length > 0 && (
                      <View className="pt-3">
                        <View className="flex-row items-center mb-2">
                          <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                            <Ionicons name="nutrition-outline" size={18} color="#A855F7" />
                          </View>
                          <Text className="text-sm font-bold tracking-wide" style={{ color: '#A855F7' }}>DIETARY NOTES</Text>
                        </View>
                        {adaptationNotes.dietary.map((note: string, index: number) => (
                          <Text key={`dietary-${index}`} className="text-sm leading-6 mb-1 ml-12" style={{ color: '#FFFFFF' }}>
                            • {trimTextBeforeNewline(note)}
                          </Text>
                        ))}
                      </View>
                    )}

                    {adaptationNotes.portion && adaptationNotes.portion.length > 0 && (
                      <View className="pt-6 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                            <Ionicons name="people-outline" size={18} color="#FACC15" />
                          </View>
                          <Text className="text-sm font-bold tracking-wide" style={{ color: '#FACC15' }}>PORTION NOTES</Text>
                        </View>
                        {adaptationNotes.portion.map((note: string, index: number) => (
                          <Text key={`portion-${index}`} className="text-sm leading-7 mb-2 ml-12" style={{ color: '#FFFFFF' }}>
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
                onPress={() => handleStartCooking(generatedRecipe)}
                className="rounded-xl py-3 flex-row items-center justify-center shadow-sm mb-3"
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FACC15', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                  className="rounded-xl"
                />
                <Ionicons name="flame" size={20} color="#FFFFFF" />
                <Text className="font-bold ml-3 text-base tracking-wide text-white">Start Cooking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSaveRecipe(generatedRecipe)}
                className="rounded-xl py-3 flex-row items-center justify-center shadow-sm mb-3"
                style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                activeOpacity={0.7}
              >
                <Ionicons name={isFavorite(generatedRecipe.id) ? "bookmark" : "bookmark-outline"} size={20} color="#FACC15" />
                <Text className="font-bold ml-3 text-base tracking-wide" style={{ color: '#FACC15' }}>
                  {isFavorite(generatedRecipe.id) ? "Saved to Favorites" : "Save to Favorites"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRetry}
                className="rounded-xl py-3 flex-row items-center justify-center shadow-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="#FACC15" />
                <Text className="font-bold ml-3 text-base tracking-wide" style={{ color: '#94A3B8' }}>Generate New Recipe</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Add to Grocery Modal */}
      <Modal
        visible={showAddToGroceryModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseGroceryModal}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <StatusBar barStyle="light-content" />
          <LinearGradient colors={["#000000", "#121212"]} style={StyleSheet.absoluteFill} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCloseGroceryModal}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-outline" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Item</Text>
          </View>

          <View style={styles.modalContentWrapper}>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScrollBeginDrag={() => isUnitDropdownOpen && setIsUnitDropdownOpen(false)}
              keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Item Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="nutrition-outline" size={18} color="#FACC15" />
                    <TextInput
                      style={styles.textInput}
                      value={newItemForm.name}
                      onChangeText={(text) => setNewItemForm((prev) => ({ ...prev, name: text }))}
                      placeholder="Enter item name"
                      placeholderTextColor="#64748B"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Quantity & Unit *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="cube-outline" size={18} color="#FACC15" />
                      <TextInput
                        style={styles.textInput}
                        value={newItemForm.quantity}
                        onChangeText={(text: string) => setNewItemForm((prev) => ({ ...prev, quantity: text }))}
                        placeholder="0"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={styles.unitButton}
                        onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                      >
                        <Text style={styles.unitButtonText}>
                          {newItemForm.unit} <MaterialIcons name="arrow-drop-down" size={16} color="#FACC15" />
                        </Text>
                      </TouchableOpacity>

                      {isUnitDropdownOpen && (
                        <View style={styles.unitDropdown}>
                          <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={styles.unitDropdownScroll}
                            contentContainerStyle={styles.unitDropdownScrollContent}
                            nestedScrollEnabled={true}
                          >
                            {GROCERY_UNITS.map((unit) => (
                              <TouchableOpacity
                                key={unit}
                                style={[
                                  styles.unitDropdownItem,
                                  newItemForm.unit === unit && styles.unitDropdownItemSelected
                                ]}
                                onPress={() => {
                                  setNewItemForm(prev => ({ ...prev, unit }));
                                  setIsUnitDropdownOpen(false);
                                }}
                              >
                                <Text style={[
                                  styles.unitDropdownItemText,
                                  newItemForm.unit === unit && styles.unitDropdownItemTextSelected
                                ]}>
                                  {unit}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Urgency Level</Text>
                  <View style={styles.categorySelection}>
                    <TouchableOpacity
                      onPress={() => setNewItemForm((prev) => ({ ...prev, urgency: "normal" }))}
                      style={[
                        styles.categoryOption,
                        newItemForm.urgency === "normal" && styles.selectedCategoryOption,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={20} color="#FACC15" />
                      <Text style={[styles.categoryOptionText, newItemForm.urgency === "normal" && styles.selectedCategoryOptionText]}>
                        Normal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setNewItemForm((prev) => ({ ...prev, urgency: "urgent" }))}
                      style={[
                        styles.categoryOption,
                        newItemForm.urgency === "urgent" && styles.selectedCategoryOption,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="alert-circle" size={20} color="#FACC15" />
                      <Text style={[styles.categoryOptionText, newItemForm.urgency === "urgent" && styles.selectedCategoryOptionText]}>
                        Urgent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Purchase Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowPurchaseDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#FACC15" />
                    <Text style={styles.dateText}>{formatDisplayDate(newItemForm.purchaseDate)}</Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </TouchableOpacity>
                  {showPurchaseDatePicker && (
                    <DateTimePicker
                      value={newItemForm.purchaseDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handlePurchaseDateChange}
                      minimumDate={new Date()}
                      themeVariant="dark"
                    />
                  )}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Notes (Optional)</Text>
                  <View style={[styles.inputContainer, { minHeight: 80, alignItems: 'flex-start', paddingVertical: 16 }]}>
                    <TextInput
                      style={[styles.textInput, { textAlignVertical: 'top', marginLeft: 0 }]}
                      value={newItemForm.notes}
                      onChangeText={(text: string) => setNewItemForm(prev => ({ ...prev, notes: text }))}
                      placeholder="Add any notes about this item..."
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Bottom Action Buttons - Fixed Position */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleCloseGroceryModal}
            style={[styles.actionButton, styles.secondaryAction]}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
            <Text style={styles.secondaryActionText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddToGrocery}
            style={[styles.actionButton, styles.primaryAction]}
            disabled={isAddingToGrocery}
            activeOpacity={0.7}
          >
            {isAddingToGrocery ? (
              <LottieView
                source={require("@/assets/lottie/loading.json")}
                autoPlay
                loop
                style={{ width: 20, height: 20 }}
              />
            ) : (
              <Ionicons name="add-circle" size={20} color="#FACC15" />
            )}
            <Text style={styles.primaryActionText}>
              {isAddingToGrocery ? 'Adding...' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
        showCloseButton={true}
        onCloseButton={() => setShowTimeoutDialog(false)}
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
        visible={showGrocerySuccessDialog}
        type="success"
        title="Added to Grocery List! 🛒"
        message={`${selectedIngredient} has been added to your grocery list`}
        onClose={() => setShowGrocerySuccessDialog(false)}
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

      <View style={{ backgroundColor: '#000000', height: insets.bottom }} />
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingTop: 18,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 18,
    zIndex: 1,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  modalContentWrapper: {
    flex: 1,
  },
  scrollViewTouchable: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  formField: {
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  unitButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderRadius: 10,
    marginLeft: 16,
  },
  unitButtonText: {
    fontSize: 16,
    color: '#FACC15',
    fontWeight: '500',
  },
  unitDropdown: {
    position: 'absolute',
    top: '100%',
    left: 150,
    right: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.98)',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 1000,
    maxHeight: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  unitDropdownScroll: {
    maxHeight: 200,
  },
  unitDropdownScrollContent: {
    paddingVertical: 4,
  },
  unitDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  unitDropdownItemSelected: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  unitDropdownItemText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '400',
  },
  unitDropdownItemTextSelected: {
    color: '#FACC15',
    fontWeight: '600',
  },
  categorySelection: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedCategoryOption: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
    marginLeft: 8,
  },
  selectedCategoryOptionText: {
    color: '#FACC15',
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.91)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryAction: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FACC15',
  },
});
