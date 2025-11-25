"use client"

import Dialog from "@/components/atoms/Dialog"
import { useFavoritesStore } from "@/hooks/useFavoritesStore"
import { dietPlanningService } from "@/lib/services/dietPlanningService"
import { GeneratedRecipe } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import LottieView from "lottie-react-native"
import React, { useEffect, useRef, useState } from "react"
import {
    Alert,
    Animated,
    BackHandler,
    Modal,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const TIMEOUT_DURATION = 90000 // 90 seconds for meal recipe generation

const ViewRecipeScreen = () => {
    const router = useRouter()
    const params = useLocalSearchParams()
    const insets = useSafeAreaInsets()
    const { addToFavorites, isFavorite, removeFromFavorites } = useFavoritesStore()

    const [fadeAnim] = useState(new Animated.Value(0))
    const [scaleAnim] = useState(new Animated.Value(0.8))
    const [pulseAnim] = useState(new Animated.Value(1))
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
    const [showSaveSuccessDialog, setShowSaveSuccessDialog] = useState(false)
    const [showRemoveSuccessDialog, setShowRemoveSuccessDialog] = useState(false)

    const [isGenerating, setIsGenerating] = useState(true)
    const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showFullDescription, setShowFullDescription] = useState(false)
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

    // Reset state when meal changes
    useEffect(() => {
        const mealId = params.mealId as string
        if (mealId) {
            // Reset all state when navigating to a different meal
            setIsGenerating(true)
            setGeneratedRecipe(null)
            setError(null)
            setIsRecipeSaved(false)
            setShowTimeoutDialog(false)
            setShowSaveSuccessDialog(false)
            setShowRemoveSuccessDialog(false)
            setShowFullDescription(false)

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        }
    }, [params.mealId])

    // Handle hardware back button
    useEffect(() => {
        const backAction = () => {
            router.push("/health")
            return true // Prevent default back behavior
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

        return () => backHandler.remove()
    }, [router])

    const performRecipeGeneration = async (): Promise<void> => {
        timeoutRef.current = setTimeout(() => {
            if (isGenerating) {
                setIsGenerating(false)
                setShowTimeoutDialog(true)
            }
        }, TIMEOUT_DURATION)

        try {
            // Get meal details from params
            const planId = params.planId as string
            const date = params.date as string
            const mealId = params.mealId as string

            if (!planId || !date || !mealId) {
                throw new Error('Missing required parameters: planId, date, or mealId')
            }

            // Call diet planning service to generate meal recipe
            const response = await dietPlanningService.generateMealRecipe({
                planId,
                date,
                mealId
            })

            console.log(`✅ Recipe response - MealID: ${mealId}, Cached: ${response.cached}`)
            console.log(`   Recipe Title: ${response.recipe?.title}`)

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            setGeneratedRecipe(response.recipe)
            setIsRecipeSaved(false)

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
        router.push("/diet-plan/meal-planning")
    }

    const handleRetry = (): void => {
        setIsGenerating(true)
        setError(null)
        setGeneratedRecipe(null)
        setIsRecipeSaved(false)
        setShowTimeoutDialog(false)
        performRecipeGeneration()
    }

    const handleStartCooking = (recipe: GeneratedRecipe): void => {
        if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
            Alert.alert('Error', 'No cooking instructions available for this recipe.')
            return
        }

        router.push({
            pathname: '/recipe/cooking',
            params: {
                recipe: JSON.stringify(recipe),
            },
        })
    }

    const handleSaveRecipe = (recipe: GeneratedRecipe): void => {
        const validatedRecipe = { ...recipe }

        if (!validatedRecipe.id || validatedRecipe.id.trim() === '') {
            validatedRecipe.id = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        if (!validatedRecipe.title || validatedRecipe.title.trim() === '') {
            Alert.alert('Error', 'Recipe data is corrupted. Please generate a new recipe.')
            return
        }

        if (!validatedRecipe.ingredients || validatedRecipe.ingredients.length === 0) {
            Alert.alert('Error', 'Recipe has no ingredients. Please generate a new recipe.')
            return
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
                difficulty: (validatedRecipe.difficulty === 'Easy' || validatedRecipe.difficulty === 'Medium' || validatedRecipe.difficulty === 'Hard')
                    ? validatedRecipe.difficulty
                    : 'Medium',
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
                substitutions: [],
            })
            setIsRecipeSaved(true)
            setShowSaveSuccessDialog(true)
        }
    }

    const handleShareRecipe = async (recipe: GeneratedRecipe): Promise<void> => {
        let textToShare: string = `🍽️ ${recipe.title}\n\n`
        textToShare += `📝 ${recipe.description}\n\n`
        textToShare += `⏱️ Prep: ${recipe.prepTime}m | Cook: ${recipe.cookTime}m | Total: ${recipe.prepTime + recipe.cookTime}m\n`
        textToShare += `🍽️ Servings: ${recipe.servings} | Difficulty: ${recipe.difficulty} | Cuisine: ${recipe.cuisine}\n\n`

        textToShare += `📊 Nutrition (per serving):\n`
        textToShare += `• Calories: ${recipe.nutritionInfo.calories}\n`
        textToShare += `• Protein: ${recipe.nutritionInfo.protein}g\n`
        textToShare += `• Carbs: ${recipe.nutritionInfo.carbs}g\n`
        textToShare += `• Fat: ${recipe.nutritionInfo.fat}g\n\n`

        textToShare += `🛒 Ingredients:\n`
        recipe.ingredients.forEach((ingredient, index) => {
            textToShare += `${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
            if (ingredient.notes) {
                textToShare += ` (${ingredient.notes})`
            }
            textToShare += `\n`
        })
        textToShare += `\n`

        textToShare += `👨‍🍳 Instructions:\n`
        recipe.instructions.forEach((instruction) => {
            textToShare += `${instruction.step}. ${instruction.instruction}`
            if (instruction.duration) {
                textToShare += ` (${instruction.duration} min)`
            }
            textToShare += `\n`
            if (instruction.tips) {
                textToShare += `   💡 ${instruction.tips}\n`
            }
        })
        textToShare += `\n`

        if ((recipe.tips || []).length > 0) {
            const tipsSection = ['💡 Chef\'s Tips:\n']
            ;(recipe.tips || []).forEach((tip: string) => {
                tipsSection.push(`• ${tip || 'No tip available'}\n`)
            })
            textToShare += tipsSection.join('')
        }

        textToShare += `---\nShared from Meal Mate App 🍳`

        try {
            await Share.share({
                message: textToShare,
            })
        } catch (error) {
            console.log("Unable to share recipe", error)
            Alert.alert("Unable to share", "Please try again later.")
        }
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#09090b" translucent={true} />
            <LinearGradient
                colors={["#09090b", "#18181b"]}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.5 }}
            >
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    {/* Full Screen Loading Modal */}
                    <Modal
                        visible={isGenerating && !error && !generatedRecipe}
                        transparent={true}
                        animationType="fade"
                        statusBarTranslucent={true}
                        style={{ margin: 0 }}
                    >
                        <View style={{ flex: 1, backgroundColor: '#0c0c1563', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        width: 320,
                                        height: 320,
                                        borderRadius: 160,
                                        top: "-10%",
                                        left: "-25%",
                                        backgroundColor: "#FACC15",
                                        opacity: 0.08,
                                        transform: [{ scale: pulseAnim }],
                                    }}
                                />
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        width: 256,
                                        height: 256,
                                        borderRadius: 128,
                                        bottom: "5%",
                                        right: "-20%",
                                        backgroundColor: "#F97316",
                                        opacity: 0.06,
                                        transform: [{ scale: pulseAnim }],
                                    }}
                                />
                            </View>

                            <Animated.View style={{ alignItems: 'center', justifyContent: 'center', zIndex: 10, paddingHorizontal: 32, opacity: fadeAnim }}>
                                <View style={{ marginBottom: 48 }}>
                                    <LottieView
                                        source={require("@/assets/lottie/loading.json")}
                                        autoPlay
                                        loop
                                        style={{ width: 160, height: 160 }}
                                    />
                                </View>

                                <View style={{ alignItems: 'center', marginVertical: 16 }}>
                                    <Text style={{ fontSize: 48, fontWeight: '300', letterSpacing: -1, textAlign: 'center', lineHeight: 56, color: '#FFFFFF' }}>
                                        Crafting Your{"\n"}
                                        <Text style={{ fontWeight: 'bold', color: '#FACC15' }}>Perfect Recipe</Text>
                                    </Text>

                                    <View style={{ width: 64, height: 1, marginVertical: 8, backgroundColor: 'rgba(250, 204, 21, 0.3)' }} />

                                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '300', lineHeight: 24, maxWidth: 320, color: '#94A3B8' }}>
                                        Our AI chef is analyzing ingredients and creating something extraordinary
                                    </Text>
                                </View>
                            </Animated.View>
                        </View>
                    </Modal>

                    {/* Error State */}
                    {error && (
                        <View className="flex-1 bg-zinc-900">
                            <ScrollView
                                className="flex-1"
                                contentContainerStyle={{ justifyContent: "flex-start", paddingTop: 200 }}
                            >
                                <View className="items-center px-8 py-6">
                                    <View className="mb-8">
                                        <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                                            <Ionicons name="alert-circle-outline" size={48} color="#FACC15" />
                                        </View>
                                    </View>

                                    <Text className="text-4xl font-bold tracking-tight text-center leading-tight px-4 mb-5" style={{ color: '#FFFFFF' }}>
                                        Something Went Wrong
                                    </Text>

                                    <Text className="text-center text-base leading-relaxed px-6 max-w-md mb-10" style={{ color: '#94A3B8' }}>
                                        {error}
                                    </Text>

                                    <View className="w-full max-w-sm space-y-4">
                                        <TouchableOpacity
                                            onPress={handleRetry}
                                            className="w-full rounded-2xl px-8 py-5"
                                            style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderColor: 'rgba(250, 204, 21, 0.4)' }}
                                            activeOpacity={0.8}
                                        >
                                            <Text className="font-semibold text-base tracking-wide text-center" style={{ color: '#FACC15' }}>
                                                Try Again
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
                        </View>
                    )}

                    {/* Recipe Display */}
                    {generatedRecipe && !isGenerating && (
                        <Animated.View className="flex-1" style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                            <View style={{ paddingTop: insets.top, backgroundColor: 'transparent' }}>
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
                                    <Text className="text-2xl font-bold leading-tight tracking-tight" style={{ color: '#FFFFFF' }}>
                                        {generatedRecipe.title}
                                    </Text>
                                    <View className="w-8 h-0.5 rounded-full mt-2" style={{ backgroundColor: '#FACC15' }} />
                                </View>
                            </View>

                            <ScrollView
                                className="flex-1"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
                            >
                                {/* Description */}
                                <View className="px-6 pt-2 pb-4">
                                    <TouchableOpacity
                                        onPress={() => setShowFullDescription(!showFullDescription)}
                                        activeOpacity={0.7}
                                    >
                                        <Text className="text-base leading-relaxed" style={{ color: '#94A3B8' }}>
                                            {showFullDescription
                                                ? generatedRecipe.description
                                                : (generatedRecipe.description || '').length > 120
                                                    ? `${(generatedRecipe.description || '').substring(0, 120)}...`
                                                    : generatedRecipe.description
                                            }
                                            {(generatedRecipe.description || '').length > 120 && (
                                                <Text className="text-sm font-medium" style={{ color: '#FACC15' }}>
                                                    {showFullDescription ? ' Show Less' : ' Read More'}
                                                </Text>
                                            )}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Recipe Info Bar */}
                                <View className="px-4 mt-4">
                                    <View className="rounded-xl p-4 shadow-lg bg-zinc-800" style={{ borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                        <View className="flex-row items-center justify-between">
                                            <View className="items-center">
                                                <View className="w-8 h-8 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                                                    <Ionicons name="people-outline" size={16} color="#22C55E" />
                                                </View>
                                                <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{generatedRecipe.servings}</Text>
                                                <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>servings</Text>
                                            </View>

                                            <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                                            <View className="items-center">
                                                <View className="w-8 h-8 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                                                    <Ionicons name="time-outline" size={16} color="#3B82F6" />
                                                </View>
                                                <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                                                    {generatedRecipe.prepTime + generatedRecipe.cookTime}m
                                                </Text>
                                                <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>total</Text>
                                            </View>

                                            <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                                            <View className="items-center">
                                                <View className="w-8 h-8 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                                                    <Ionicons name="speedometer-outline" size={16} color="#A855F7" />
                                                </View>
                                                <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{generatedRecipe.difficulty}</Text>
                                                <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>level</Text>
                                            </View>

                                            <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                                            <View className="items-center">
                                                <View className="w-8 h-8 rounded-lg items-center justify-center mb-1" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                                                    <Ionicons name="restaurant-outline" size={16} color="#FACC15" />
                                                </View>
                                                <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{generatedRecipe.cuisine}</Text>
                                                <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>cuisine</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Nutrition */}
                                <View className="px-4 pt-3">
                                    <View className="rounded-xl p-4 shadow-lg bg-zinc-800" style={{ borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                        <View className="flex-row items-center mb-4">
                                            <View className="w-1 h-4 rounded-full mr-2" style={{ backgroundColor: '#FACC15' }} />
                                            <Text className="text-sm font-bold tracking-wide uppercase" style={{ color: '#FFFFFF' }}>
                                                Nutrition Per Serving
                                            </Text>
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
                                </View>

                                {/* Ingredients */}
                                <View className="px-4 py-6">
                                    <View className="flex-row items-center mb-3">
                                        <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                                        <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Ingredients</Text>
                                        <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
                                    </View>
                                    <View className="rounded-2xl p-3 shadow-xl bg-zinc-800" style={{ borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                        {(generatedRecipe.ingredients || []).map((ingredient, index) => (
                                            <View
                                                key={`ingredient-${index}`}
                                                className={`flex-row items-start py-2 ${index !== (generatedRecipe.ingredients || []).length - 1 ? "border-b" : ""
                                                    }`}
                                                style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
                                            >
                                                <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4 mt-0.5 shadow-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 2, borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                                                    <Text className="text-base font-bold" style={{ color: '#22C55E' }}>{index + 1}</Text>
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-base font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                                                        {ingredient.name}
                                                    </Text>
                                                    <Text className="text-sm" style={{ color: '#94A3B8' }}>
                                                        {ingredient.amount} {ingredient.unit}
                                                    </Text>
                                                    {ingredient.notes && (
                                                        <Text className="text-xs mt-1" style={{ color: '#64748B' }}>
                                                            {ingredient.notes}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Instructions */}
                                <View className="px-4 py-6">
                                    <View className="flex-row items-center mb-5">
                                        <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                                        <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Instructions</Text>
                                        <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
                                    </View>
                                    <View>
                                        {(generatedRecipe.instructions || []).map((instruction, index) => (
                                            <View
                                                key={`instruction-${index}`}
                                                className="mb-4 rounded-2xl p-5 shadow-lg bg-zinc-800"
                                                style={{ borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }}
                                            >
                                                <View className="flex-row items-start">
                                                    <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                                                        <Text className="text-base font-bold" style={{ color: '#FACC15' }}>{instruction.step}</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <View className="flex-row items-center justify-between mb-2">
                                                            <Text className="font-bold" style={{ color: '#FFFFFF' }}>Step {instruction.step}</Text>
                                                            {instruction.duration && (
                                                                <View className="bg-zinc-700 px-2 py-1 rounded-full">
                                                                    <Text className="text-gray-300 text-xs">⏱️ {instruction.duration} min</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <Text className="mb-2 leading-relaxed" style={{ color: '#94A3B8' }}>
                                                            {instruction.instruction}
                                                        </Text>
                                                        {instruction.tips && (
                                                            <View className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-2">
                                                                <View className="flex-row items-start">
                                                                    <Ionicons name="bulb-outline" size={16} color="#FACC15" style={{ marginTop: 2, marginRight: 6 }} />
                                                                    <Text className="text-yellow-300 text-xs flex-1">{instruction.tips}</Text>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Tips */}
                                {(generatedRecipe.tips || []).length > 0 && (
                                    <View className="px-4 pb-6">
                                        <View className="flex-row items-center mb-5">
                                            <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: '#FACC15' }} />
                                            <Text className="text-xl font-bold tracking-tight" style={{ color: '#FFFFFF' }}>Chef's Tips</Text>
                                            <View className="flex-1 h-px ml-4" style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} />
                                        </View>
                                        <View className="rounded-2xl p-5 shadow-xl bg-zinc-800" style={{ borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                                            {(generatedRecipe.tips || []).filter(tip => tip && typeof tip === 'string').map((tip, index, filteredTips) => (
                                                <View
                                                    key={`tip-${index}`}
                                                    className={`flex-row items-start py-3 ${index !== filteredTips.length - 1 ? "border-b" : ""
                                                        }`}
                                                    style={{ borderBottomColor: 'rgba(255, 255, 255, 0.1)' }}
                                                >
                                                    <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                                                        <Ionicons name="bulb" size={14} color="#FACC15" />
                                                    </View>
                                                    <Text className="flex-1 leading-relaxed" style={{ color: '#94A3B8' }}>
                                                        {tip || 'No tip available'}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Fixed Bottom Button */}
                            <View
                                className="absolute bottom-0 left-0 right-0 px-4 py-4"
                                style={{
                                    paddingBottom: insets.bottom + 16,
                                    backgroundColor: 'transparent'
                                }}
                            >
                                <View className="rounded-2xl overflow-hidden shadow-2xl">
                                    <TouchableOpacity
                                        onPress={() => handleStartCooking(generatedRecipe)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={["#FACC15", "#F97316"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="py-5"
                                        >
                                            <View className="flex-row items-center justify-center">
                                                <Ionicons name="restaurant" size={24} color="white" />
                                                <Text className="text-white text-center font-bold text-lg ml-3">
                                                    Start Cooking
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </LinearGradient>

            {/* Dialogs */}
            <Dialog
                visible={showTimeoutDialog}
                type="warning"
                title="Request Timeout"
                message="The recipe generation is taking longer than expected. Please check your connection and try again."
                onClose={handleClose}
                onConfirm={handleRetry}
                confirmText="Retry"
                cancelText="Go Back"
                showCancelButton={true}
                showCloseButton={true}
                onCloseButton={() => setShowTimeoutDialog(false)}
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
        </>
    )
}

export default ViewRecipeScreen
