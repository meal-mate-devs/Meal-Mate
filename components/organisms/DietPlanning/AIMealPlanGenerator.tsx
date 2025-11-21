"use client"

import { useDietPlanningStore } from "@/hooks/useDietPlanningStore"
import { DIET_GOALS } from "@/lib/constants/dietPlanning"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useState } from "react"
import {
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

    const handleGeneratePlan = () => {
        // Validate at least one diet type is selected
        if (selectedDietType.length === 0) {
            console.warn('Please select at least one diet type')
            // In a real app, show a toast/alert here
            return
        }

        // This will be connected to Llama AI later
        const planData = {
            fitnessGoal: selectedGoal,
            duration: planDuration,
            mealsPerDay,
            dietType: selectedDietType,
            allergies,
            cuisines: cuisinePreferences,
            budget: budgetLevel,
            notes: customNotes.trim(),
        }

        console.log("Generating AI meal plan with preferences:", planData)

        // For now, navigate back to meal tracking
        router.back()
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={{ paddingTop: 38, backgroundColor: "black" }} className="px-4 pb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">AI Meal Plan Generator</Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-400 text-center">Customize your perfect meal plan</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
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
                        className="overflow-hidden rounded-2xl"
                    >
                        <LinearGradient
                            colors={["#8B5CF6", "#6366F1"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4"
                        >
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="sparkles" size={24} color="white" />
                                <Text className="text-white text-center font-bold text-lg ml-2">
                                    Generate AI Meal Plan
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text className="text-gray-400 text-center text-xs mt-3">
                        AI will create a personalized {planDuration} plan based on your preferences
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default AIMealPlanGenerator
