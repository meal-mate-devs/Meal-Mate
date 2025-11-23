"use client"

import { useLanguage } from "@/context/LanguageContext"
import { GeneratedRecipe } from "@/lib/types/recipeGeneration"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useState } from "react"
import { Alert, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"

interface RecipeDetailModalProps {
    visible: boolean
    recipe: GeneratedRecipe | null
    onClose: () => void
}

export default function RecipeDetailModal({ visible, recipe, onClose }: RecipeDetailModalProps): JSX.Element {
    const [isReading, setIsReading] = useState<boolean>(false)
    const [currentStep, setCurrentStep] = useState<number>(0)
    const [scaledServings, setScaledServings] = useState<number>(recipe?.servings || 4)
    const { t } = useLanguage()

    if (!recipe) return <></>

    const handleStartReading = (): void => {
        setIsReading(true)
        setCurrentStep(0)
        Alert.alert(t("recipe.voiceReading"), t("recipe.voiceReadingDescription"))
    }

    const handleStopReading = (): void => {
        setIsReading(false)
        setCurrentStep(0)
    }

    const handleNextStep = (): void => {
        if (currentStep < recipe.instructions.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            setIsReading(false)
            setCurrentStep(0)
            Alert.alert(t("recipe.recipeCompleteTitle"), t("recipe.recipeCompleteMessage"))
        }
    }

    const handlePreviousStep = (): void => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const scaleIngredient = (amount: string, originalServings: number, newServings: number): string => {
        const numericAmount = Number.parseFloat(amount)
        if (isNaN(numericAmount)) return amount

        const scaledAmount = (numericAmount * newServings) / originalServings
        return scaledAmount % 1 === 0 ? scaledAmount.toString() : scaledAmount.toFixed(1)
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View className="flex-1 bg-zinc-900">
                <View className="flex-row justify-between items-center p-4 pt-12 border-b border-zinc-800">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">{t("recipe.details")}</Text>
                    <TouchableOpacity>
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1">
                    <View className="relative">
                        <Image source={{ uri: recipe.image }} className="w-full h-64" resizeMode="cover" />
                        <View className="absolute bottom-4 left-4 bg-black bg-opacity-70 rounded-full px-3 py-1">
                            <Text className="text-yellow-400 text-sm font-bold">{t("recipe.aiGenerated")}</Text>
                        </View>
                    </View>

                    <View className="p-4">
                        <Text className="text-white text-2xl font-bold mb-2">{recipe.title}</Text>
                        <Text className="text-zinc-400 mb-4">{recipe.description}</Text>

                        <View className="flex-row justify-between bg-zinc-800 rounded-lg p-4 mb-6">
                            <View className="items-center">
                                <Ionicons name="time-outline" size={20} color="#FBBF24" />
                                <Text className="text-white text-xs mt-1">{t("recipe.totalTime")}</Text>
                                <Text className="text-white font-bold">{recipe.cookTime + recipe.prepTime} min</Text>
                            </View>
                            <View className="items-center">
                                <Ionicons name="people-outline" size={20} color="#FBBF24" />
                                <Text className="text-white text-xs mt-1">{t("recipe.servings")}</Text>
                                <Text className="text-white font-bold">{scaledServings}</Text>
                            </View>
                            <View className="items-center">
                                <Ionicons name="speedometer-outline" size={20} color="#FBBF24" />
                                <Text className="text-white text-xs mt-1">{t("recipe.difficulty")}</Text>
                                <Text className="text-white font-bold">{recipe.difficulty}</Text>
                            </View>
                            <View className="items-center">
                                <Ionicons name="restaurant-outline" size={20} color="#FBBF24" />
                                <Text className="text-white text-xs mt-1">{t("recipe.cuisine")}</Text>
                                <Text className="text-white font-bold">{recipe.cuisine}</Text>
                            </View>
                        </View>

                        <View className="bg-zinc-800 rounded-xl p-4 mb-6 border border-zinc-700">
                            <Text className="text-white font-bold mb-3">{t("recipe.adjustPortions")}</Text>
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                    onPress={() => setScaledServings(Math.max(1, scaledServings - 1))}
                                >
                                    <Ionicons name="remove" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                                <Text className="text-white text-xl font-bold">{scaledServings} {t("recipe.servings")}</Text>
                                <TouchableOpacity
                                    className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                    onPress={() => setScaledServings(Math.min(12, scaledServings + 1))}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="bg-zinc-800 rounded-xl p-4 mb-6 border border-zinc-700">
                            <Text className="text-white font-bold mb-3">{t("recipe.voiceAssistant")}</Text>
                            <View className="flex-row justify-between">
                                <TouchableOpacity
                                    className="flex-1 mr-2 rounded-xl overflow-hidden"
                                    onPress={isReading ? handleStopReading : handleStartReading}
                                >
                                    <LinearGradient
                                        colors={isReading ? ["#EF4444", "#DC2626"] : ["#FBBF24", "#F97416"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-3"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name={isReading ? "stop" : "play"} size={16} color="#FFFFFF" />
                                            <Text className="text-white font-bold ml-2">{isReading ? t("recipe.stopReading") : t("recipe.readAloud")}</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {isReading && (
                                    <View className="flex-row">
                                        <TouchableOpacity
                                            className="bg-zinc-700 rounded-xl px-4 py-3 mr-2"
                                            onPress={handlePreviousStep}
                                            disabled={currentStep === 0}
                                        >
                                            <Ionicons name="play-back" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="bg-zinc-700 rounded-xl px-4 py-3" onPress={handleNextStep}>
                                            <Ionicons name="play-forward" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            {isReading && (
                                <Text className="text-yellow-400 text-sm mt-2 text-center">
                                    {t("recipe.stepOf", { current: currentStep + 1, total: recipe.instructions.length })}
                                </Text>
                            )}
                        </View>

                        <View className="mb-6">
                            <Text className="text-white text-xl font-bold mb-4">{t("recipe.ingredients")}</Text>
                            {recipe.ingredients.map((ingredient) => (
                                <View key={ingredient.id} className="flex-row items-center mb-3 bg-zinc-800 rounded-lg p-3">
                                    <View className="w-3 h-3 rounded-full bg-yellow-400 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-white font-bold">
                                            {scaleIngredient(ingredient.amount, recipe.servings, scaledServings)} {ingredient.unit}{" "}
                                            {ingredient.name}
                                        </Text>
                                        {ingredient.notes && <Text className="text-zinc-400 text-sm">{ingredient.notes}</Text>}
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View className="mb-6">
                            <Text className="text-white text-xl font-bold mb-4">{t("recipe.instructions")}</Text>
                            {recipe.instructions.map((instruction, index) => (
                                <View
                                    key={instruction.id}
                                    className={`mb-4 p-4 rounded-lg ${isReading && currentStep === index ? "bg-yellow-400" : "bg-zinc-800"
                                        }`}
                                >
                                    <View className="flex-row items-start">
                                        <View
                                            className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isReading && currentStep === index ? "bg-black" : "bg-yellow-400"
                                                }`}
                                        >
                                            <Text
                                                className={`font-bold ${isReading && currentStep === index ? "text-yellow-400" : "text-black"}`}
                                            >
                                                {instruction.step}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`${isReading && currentStep === index ? "text-black" : "text-white"}`}>
                                                {instruction.instruction}
                                            </Text>
                                            {instruction.duration && (
                                                <Text
                                                    className={`text-sm mt-1 ${isReading && currentStep === index ? "text-black" : "text-zinc-400"
                                                        }`}
                                                >
                                                    ⏱️ {instruction.duration} minutes
                                                </Text>
                                            )}
                                            {instruction.temperature && (
                                                <Text
                                                    className={`text-sm mt-1 ${isReading && currentStep === index ? "text-black" : "text-zinc-400"
                                                        }`}
                                                >
                                                    🌡️ {instruction.temperature}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View className="bg-zinc-800 rounded-xl p-4 mb-6">
                            <Text className="text-white font-bold mb-3">{t("recipe.nutritionPerServing")}</Text>
                            <View className="flex-row justify-between">
                                <View className="items-center">
                                    <Text className="text-yellow-400 text-sm">{t("recipe.calories")}</Text>
                                    <Text className="text-white font-bold">
                                        {Math.round((recipe.nutritionInfo.calories * scaledServings) / recipe.servings)}
                                    </Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-yellow-400 text-sm">{t("recipe.protein")}</Text>
                                    <Text className="text-white font-bold">
                                        {Math.round((recipe.nutritionInfo.protein * scaledServings) / recipe.servings)}g
                                    </Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-yellow-400 text-sm">{t("recipe.carbs")}</Text>
                                    <Text className="text-white font-bold">
                                        {Math.round((recipe.nutritionInfo.carbs * scaledServings) / recipe.servings)}g
                                    </Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-yellow-400 text-sm">{t("recipe.fat")}</Text>
                                    <Text className="text-white font-bold">
                                        {Math.round((recipe.nutritionInfo.fat * scaledServings) / recipe.servings)}g
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {recipe.tips.length > 0 && (
                            <View className="bg-zinc-800 rounded-xl p-4 mb-6">
                                <Text className="text-white font-bold mb-3">{t("recipe.chefsTips")}</Text>
                                {recipe.tips.map((tip, index) => (
                                    <Text key={index} className="text-zinc-300 mb-2">
                                        • {tip}
                                    </Text>
                                ))}
                            </View>
                        )}

                        {recipe.substitutions.length > 0 && (
                            <View className="bg-zinc-800 rounded-xl p-4 mb-6">
                                <Text className="text-white font-bold mb-3">{t("recipe.ingredientSubstitutions")}</Text>
                                {recipe.substitutions.map((sub, index) => (
                                    <View key={index} className="mb-3 p-3 bg-zinc-700 rounded-lg">
                                        <Text className="text-white font-bold">
                                            {sub.original} → {sub.substitute}
                                        </Text>
                                        <Text className="text-zinc-400 text-sm">Ratio: {sub.ratio}</Text>
                                        <Text className="text-zinc-300 text-sm">{sub.notes}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View className="flex-row justify-between items-center p-4 border-t border-zinc-800">
                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
                        <Text className="text-white ml-2">{t("recipe.like")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="bookmark-outline" size={24} color="#FFFFFF" />
                        <Text className="text-white ml-2">{t("recipe.saveRecipe")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="people-outline" size={24} color="#FFFFFF" />
                        <Text className="text-white ml-2">{t("recipe.share")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}
