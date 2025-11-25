"use client"

import Dialog from "@/components/atoms/Dialog"
import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { DIET_GOALS } from "@/lib/constants/dietPlanning"
import { dietPlanningService } from "@/lib/services/dietPlanningService"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
    ActivityIndicator,
    BackHandler,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

const AIMealPlanGenerator = () => {
    const router = useRouter()
    const { selectedGoal, setGoal } = useDietPlanningStore()

    const [planDuration, setPlanDuration] = useState<"weekly" | "monthly">("weekly")
    const [mealsPerDay, setMealsPerDay] = useState(3)
    const [selectedDietType, setSelectedDietType] = useState<string[]>([])
    const [allergies, setAllergies] = useState<string[]>([])
    const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([])
    const [budgetLevel, setBudgetLevel] = useState("moderate")
    const [customNotes, setCustomNotes] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [hasExistingPlan, setHasExistingPlan] = useState(false)

    // Dialog states
    const [showDialog, setShowDialog] = useState(false)
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning'>('success')
    const [dialogTitle, setDialogTitle] = useState('')
    const [dialogMessage, setDialogMessage] = useState('')

    // Check for existing plan on mount
    useEffect(() => {
        checkExistingPlan()
    }, [])

    // Handle hardware back button
    useEffect(() => {
        const backAction = () => {
            router.push("/health")
            return true // Prevent default back behavior
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

        return () => backHandler.remove()
    }, [router])

    const checkExistingPlan = async () => {
        try {
            const response = await dietPlanningService.getActivePlan()
            if (response.plan) {
                setHasExistingPlan(true)
                setDialogType('warning')
                setDialogTitle('Active Plan Exists')
                setDialogMessage('You already have an active meal plan. Please cancel your current plan before generating a new one.')
                setShowDialog(true)
                // Navigate back after dialog closes
                setTimeout(() => router.push("/health"), 2500)
            }
        } catch (error: any) {
            // No plan exists, proceed normally
            setHasExistingPlan(false)
        }
    }

    // Diet types
    const dietTypes = [
        { id: "balanced", name: "Balanced", icon: "⚖️" },
        { id: "high_protein", name: "High Protein", icon: "💪" },
        { id: "low_carb", name: "Low Carb", icon: "🥗" },
        { id: "keto", name: "Keto", icon: "🥑" },
        { id: "vegetarian", name: "Vegetarian", icon: "🌱" },
        { id: "vegan", name: "Vegan", icon: "🥬" },
    ]

    // Common allergies
    const commonAllergies = [
        { id: "dairy", name: "Dairy", icon: "🥛" },
        { id: "nuts", name: "Nuts", icon: "🥜" },
        { id: "gluten", name: "Gluten", icon: "🌾" },
        { id: "shellfish", name: "Shellfish", icon: "🦐" },
        { id: "eggs", name: "Eggs", icon: "🥚" },
        { id: "soy", name: "Soy", icon: "🫘" },
    ]

    // Cuisine preferences
    const cuisines = [
        { id: "mediterranean", name: "Mediterranean", icon: "🇬🇷" },
        { id: "asian", name: "Asian", icon: "🍜" },
        { id: "mexican", name: "Mexican", icon: "🌮" },
        { id: "american", name: "American", icon: "🍔" },
        { id: "indian", name: "Indian", icon: "🍛" },
        { id: "italian", name: "Italian", icon: "🍝" },
    ]

    const toggleSelection = (array: string[], setArray: Function, id: string) => {
        if (array.includes(id)) {
            setArray(array.filter((item) => item !== id))
        } else {
            setArray([...array, id])
        }
    }

    const handleGeneratePlan = async () => {
        // Validate at least one diet type is selected
        if (selectedDietType.length === 0) {
            setDialogType('warning')
            setDialogTitle('Selection Required')
            setDialogMessage('Please select at least one diet type')
            setShowDialog(true)
            return
        }

        if (!selectedGoal) {
            setDialogType('warning')
            setDialogTitle('Goal Required')
            setDialogMessage('Please select a fitness goal')
            setShowDialog(true)
            return
        }

        setIsGenerating(true)

        try {
            const goalData = DIET_GOALS.find(g => g.id === selectedGoal)

            if (!goalData) {
                setDialogType('error'); setDialogTitle('Error'); setDialogMessage('Invalid fitness goal selected'); setShowDialog(true)
                return
            }

            // Map our goal types to backend goal types
            const goalTypeMap: Record<string, 'maintain' | 'lose' | 'gain'> = {
                'weight_loss': 'lose',
                'muscle_gain': 'gain',
                'maintenance': 'maintain',
                'athletic': 'gain'
            }

            const planData = {
                goalType: goalTypeMap[selectedGoal],
                targetCalories: goalData.calories,
                duration: planDuration === 'weekly' ? 7 : 30,
                healthConditions: [], // Empty for general plans
                dietaryPreferences: [
                    ...selectedDietType,
                    ...allergies.map(a => `no-${a}`),
                    ...cuisinePreferences,
                    budgetLevel,
                    customNotes.trim() ? `notes:${customNotes.trim()}` : ''
                ].filter(Boolean),
            }

            console.log("Generating AI meal plan with preferences:", planData)

            const response = await dietPlanningService.generateAIMealPlan(planData)

            if (response.success) {
                const totalMeals = response.plan.dailyPlans.reduce((sum, day) => sum + day.meals.length, 0)
                setDialogType('success')
                setDialogTitle('Success! 🎉')
                setDialogMessage(`Your ${planDuration} meal plan has been generated with ${totalMeals} meals!`)
                setShowDialog(true)
                setTimeout(() => router.push("/health"), 2500)
            } else {
                setDialogType('error'); setDialogTitle('Generation Failed'); setDialogMessage(response.message || 'Failed to generate meal plan'); setShowDialog(true)
            }
        } catch (error: any) {
            console.log('Error generating meal plan:', error)
            setDialogType('error')
            setDialogTitle('Error')
            setDialogMessage(error.message || 'Failed to generate meal plan. Please try again.')
            setShowDialog(true)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity onPress={() => router.push("/health")} className="p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">AI Meal Plan Generator</Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-400 text-center">Customize your perfect meal plan</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Health Conditions Option */}
                <TouchableOpacity
                    onPress={() => router.push('/(protected)/(tabs)/(hidden)/diet-plan/health-conditions')}
                    className="mb-6 overflow-hidden rounded-2xl"
                    activeOpacity={0.8}
                >
                    <View className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/30 p-5">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mr-4">
                                    <Ionicons name="medical" size={24} color="#3B82F6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-lg font-bold mb-1">Have Health Conditions?</Text>
                                    <Text className="text-blue-300 text-sm">Get specialized plans for diabetes, heart health, IBS & more</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Plan Duration */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Plan Duration</Text>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => setPlanDuration("weekly")}
                            className={`flex-1 rounded-2xl p-4 border-2 ${planDuration === "weekly" ? "border-purple-500 bg-purple-900/20" : "border-zinc-700 bg-zinc-800"
                                }`}
                        >
                            <Text className={`text-center font-bold ${planDuration === "weekly" ? "text-purple-400" : "text-gray-400"}`}>
                                📅 Weekly (7 days)
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setPlanDuration("monthly")}
                            className={`flex-1 rounded-2xl p-4 border-2 ${planDuration === "monthly" ? "border-purple-500 bg-purple-900/20" : "border-zinc-700 bg-zinc-800"
                                }`}
                        >
                            <Text className={`text-center font-bold ${planDuration === "monthly" ? "text-purple-400" : "text-gray-400"}`}>
                                📆 Monthly (30 days)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Fitness Goal */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Fitness Goal</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {DIET_GOALS.map((goal) => (
                            <TouchableOpacity
                                key={goal.id}
                                onPress={() => setGoal(goal.id as any)}
                                className={`w-[48%] rounded-2xl p-4 border-2 ${selectedGoal === goal.id ? "border-purple-500" : "border-zinc-700"
                                    }`}
                                style={{
                                    backgroundColor: selectedGoal === goal.id ? `${goal.color}15` : "#27272a",
                                }}
                            >
                                <Text className="text-3xl mb-2">{goal.icon}</Text>
                                <Text className="text-white font-bold text-sm mb-1">{goal.name}</Text>
                                <Text className="text-gray-400 text-xs">{goal.calories.toLocaleString()} cal/day</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Meals Per Day */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Meals Per Day</Text>
                    <View className="bg-zinc-800 rounded-2xl p-5">
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                onPress={() => setMealsPerDay(Math.max(2, mealsPerDay - 1))}
                                className="w-12 h-12 rounded-full bg-zinc-700 items-center justify-center"
                            >
                                <Ionicons name="remove" size={24} color="white" />
                            </TouchableOpacity>
                            <View className="items-center">
                                <Text className="text-white text-4xl font-bold">{mealsPerDay}</Text>
                                <Text className="text-gray-400 text-sm">meals</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setMealsPerDay(Math.min(6, mealsPerDay + 1))}
                                className="w-12 h-12 rounded-full bg-purple-500 items-center justify-center"
                            >
                                <Ionicons name="add" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Diet Type */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Diet Type (Select Multiple)</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {dietTypes.map((diet) => (
                            <TouchableOpacity
                                key={diet.id}
                                onPress={() => toggleSelection(selectedDietType, setSelectedDietType, diet.id)}
                                className={`rounded-2xl px-4 py-3 border-2 ${selectedDietType.includes(diet.id)
                                    ? "border-purple-500 bg-purple-900/20"
                                    : "border-zinc-700 bg-zinc-800"
                                    }`}
                            >
                                <Text className={`font-semibold ${selectedDietType.includes(diet.id) ? "text-purple-400" : "text-gray-400"}`}>
                                    {diet.icon} {diet.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Allergies & Restrictions */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Allergies & Restrictions</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {commonAllergies.map((allergy) => (
                            <TouchableOpacity
                                key={allergy.id}
                                onPress={() => toggleSelection(allergies, setAllergies, allergy.id)}
                                className={`rounded-2xl px-4 py-3 border-2 ${allergies.includes(allergy.id)
                                    ? "border-red-500 bg-red-900/20"
                                    : "border-zinc-700 bg-zinc-800"
                                    }`}
                            >
                                <Text className={`font-semibold ${allergies.includes(allergy.id) ? "text-red-400" : "text-gray-400"}`}>
                                    {allergy.icon} {allergy.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cuisine Preferences */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Cuisine Preferences</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {cuisines.map((cuisine) => (
                            <TouchableOpacity
                                key={cuisine.id}
                                onPress={() => toggleSelection(cuisinePreferences, setCuisinePreferences, cuisine.id)}
                                className={`rounded-2xl px-4 py-3 border-2 ${cuisinePreferences.includes(cuisine.id)
                                    ? "border-blue-500 bg-blue-900/20"
                                    : "border-zinc-700 bg-zinc-800"
                                    }`}
                            >
                                <Text className={`font-semibold ${cuisinePreferences.includes(cuisine.id) ? "text-blue-400" : "text-gray-400"}`}>
                                    {cuisine.icon} {cuisine.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Budget Level */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Budget Level</Text>
                    <View className="flex-row gap-3">
                        {["budget", "moderate", "premium"].map((level) => (
                            <TouchableOpacity
                                key={level}
                                onPress={() => setBudgetLevel(level)}
                                className={`flex-1 rounded-2xl p-4 border-2 ${budgetLevel === level ? "border-green-500 bg-green-900/20" : "border-zinc-700 bg-zinc-800"
                                    }`}
                            >
                                <Text className={`text-center font-bold capitalize ${budgetLevel === level ? "text-green-400" : "text-gray-400"}`}>
                                    {level === "budget" && "💰"} {level === "moderate" && "💵"} {level === "premium" && "💎"} {level}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Custom Notes */}
                <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Additional Preferences</Text>
                    <TextInput
                        value={customNotes}
                        onChangeText={setCustomNotes}
                        placeholder="E.g., I prefer quick meals under 30 minutes, love spicy food..."
                        placeholderTextColor="#6B7280"
                        multiline
                        numberOfLines={4}
                        className="bg-zinc-800 rounded-2xl p-4 text-white"
                        style={{ textAlignVertical: "top" }}
                    />
                </View>

                {/* Generate Button */}
                <View className="mb-8">
                    <TouchableOpacity
                        onPress={handleGeneratePlan}
                        activeOpacity={0.8}
                        disabled={isGenerating}
                        className="overflow-hidden rounded-2xl"
                    >
                        <LinearGradient
                            colors={isGenerating ? ["#6B7280", "#4B5563"] : ["#8B5CF6", "#6366F1"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4"
                        >
                            <View className="flex-row items-center justify-center">
                                {isGenerating ? (
                                    <>
                                        <ActivityIndicator color="white" size="small" />
                                        <Text className="text-white text-center font-bold text-lg ml-2">
                                            Generating Plan...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={24} color="white" />
                                        <Text className="text-white text-center font-bold text-lg ml-2">
                                            Generate AI Meal Plan
                                        </Text>
                                    </>
                                )}
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text className="text-gray-400 text-center text-xs mt-3">
                        {isGenerating
                            ? 'This may take up to 90 seconds...'
                            : `AI will create a personalized ${planDuration} plan based on your preferences`
                        }
                    </Text>
                </View>
            </ScrollView>

            {/* Dialog Component */}
            <Dialog
                visible={showDialog}
                type={dialogType}
                title={dialogTitle}
                message={dialogMessage}
                onClose={() => setShowDialog(false)}
                confirmText="OK"
                autoClose={true}
                autoCloseTime={2500}
            />
        </SafeAreaView>
    )
}

export default AIMealPlanGenerator


