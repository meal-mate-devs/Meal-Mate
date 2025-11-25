"use client"

import Dialog from "@/components/atoms/Dialog"
import { useLanguage } from "@/context/LanguageContext"
import { dietPlanningService } from "@/lib/services/dietPlanningService"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
    ActivityIndicator,
    BackHandler,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native"

interface HealthCondition {
    id: string
    name: string
    icon: string
    description: string
    color: string
    dietaryFocus: string[]
    avoidFoods: string[]
    recommendedFoods: string[]
    mealSuggestions: {
        breakfast: string[]
        lunch: string[]
        dinner: string[]
        snacks: string[]
    }
    nutritionalGuidelines: {
        calories: string
        protein: string
        carbs: string
        fats: string
        specialNotes: string[]
    }
}

const HealthConditionsScreen = () => {
    const router = useRouter()
    const { t, language } = useLanguage()

    // Get condition data from translations
    const getConditionData = (conditionId: string) => {
        return t(`diet.conditions.${conditionId}`)
    }
    const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showGeneratePlanModal, setShowGeneratePlanModal] = useState(false)
    const [planDuration, setPlanDuration] = useState<"weekly" | "monthly">("weekly")
    const [isGenerating, setIsGenerating] = useState(false)
    const [hasExistingPlan, setHasExistingPlan] = useState(false)

    // Dialog state
    const [showDialog, setShowDialog] = useState(false)
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'info'>('info')
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
                setDialogTitle(t('diet.activePlanExists'))
                setDialogMessage(t('diet.cancelCurrentPlanBeforeGenerating'))
                setShowDialog(true)
                setTimeout(() => router.push("/health"), 2500)
            }
        } catch (error: any) {
            // No plan exists, proceed normally
            setHasExistingPlan(false)
        }
    }

    // Health conditions with detailed plans
    const healthConditions: HealthCondition[] = [
        {
            id: "diabetes",
            name: t('diet.conditions.diabetes.name'),
            icon: "🩺",
            description: t('diet.conditions.diabetes.description'),
            color: "#3B82F6",
            ...getConditionData("diabetes"),
        },
        {
            id: "heart_health",
            name: t('diet.conditions.heart_health.name'),
            icon: "❤️",
            description: t('diet.conditions.heart_health.description'),
            color: "#EF4444",
            ...getConditionData("heart_health"),
        },
        {
            id: "gluten_free",
            name: t('diet.conditions.gluten_free.name'),
            icon: "🌾",
            description: t('diet.conditions.gluten_free.description'),
            color: "#F59E0B",
            ...getConditionData("gluten_free"),
        },
        {
            id: "lactose_intolerance",
            name: t('diet.conditions.lactose_intolerance.name'),
            icon: "🥛",
            description: t('diet.conditions.lactose_intolerance.description'),
            color: "#8B5CF6",
            ...getConditionData("lactose_intolerance"),
        },
        {
            id: "kidney_health",
            name: t('diet.conditions.kidney_health.name'),
            icon: "🫘",
            description: t('diet.conditions.kidney_health.description'),
            color: "#10B981",
            ...getConditionData("kidney_health"),
        },
        {
            id: "ibs",
            name: t('diet.conditions.ibs.name'),
            icon: "🤰",
            description: t('diet.conditions.ibs.description'),
            color: "#EC4899",
            ...getConditionData("ibs"),
        },
    ]

    const handleConditionPress = (condition: HealthCondition) => {
        setSelectedCondition(condition)
        setShowDetailModal(true)
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
                    <Text className="text-white text-xl font-bold">{t('diet.healthConditions')}</Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-400 text-center">{t('diet.specializedDietPlansForYourNeeds')}</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Info Card */}
                <View className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 mb-6">
                    <View className="flex-row items-start">
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <View className="flex-1 ml-3">
                            <Text className="text-blue-400 font-semibold mb-1">{t('diet.importantNotice')}</Text>
                            <Text className="text-blue-300/80 text-sm">
                                {t('diet.consultHealthcareProvider')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Condition Cards */}
                <View className="mb-8">
                    <Text className="text-white text-xl font-bold mb-4">{t('diet.selectYourCondition')}</Text>
                    {healthConditions.map((condition) => (
                        <TouchableOpacity
                            key={condition.id}
                            onPress={() => handleConditionPress(condition)}
                            className="mb-4"
                            activeOpacity={0.8}
                        >
                            <View className="bg-zinc-800 rounded-3xl overflow-hidden">
                                <View className="p-5">
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View
                                                className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                                                style={{ backgroundColor: `${condition.color}20` }}
                                            >
                                                <Text className="text-4xl">{condition.icon}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white text-lg font-bold mb-1">
                                                    {condition.name}
                                                </Text>
                                                <Text className="text-gray-400 text-sm">{condition.description}</Text>
                                                <View className="flex-row flex-wrap mt-2">
                                                    {condition.dietaryFocus.slice(0, 2).map((focus, index) => (
                                                        <View
                                                            key={index}
                                                            className="bg-zinc-700 px-2 py-1 rounded-full mr-2 mb-1"
                                                        >
                                                            <Text className="text-gray-300 text-xs">{focus}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View className="flex-1 bg-black">
                    <SafeAreaView className="flex-1">
                        {/* Modal Header */}
                        <View style={{ paddingTop: 38 }} className="px-4 pb-4 bg-black border-b border-zinc-800">
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity onPress={() => setShowDetailModal(false)} className="p-2">
                                    <Ionicons name="close" size={28} color="white" />
                                </TouchableOpacity>
                                <Text className="text-white text-lg font-bold">{t('diet.dietPlanDetails')}</Text>
                                <TouchableOpacity>
                                    <Ionicons name="bookmark-outline" size={24} color="#FACC15" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {selectedCondition && (
                            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                                {/* Header Card */}
                                <View className="my-6">
                                    <View className="overflow-hidden rounded-3xl">
                                        <LinearGradient
                                            colors={[selectedCondition.color, `${selectedCondition.color}CC`]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            className="p-6"
                                        >
                                            <View className="flex-row items-center mb-3">
                                                <Text className="text-5xl mr-3">{selectedCondition.icon}</Text>
                                                <View className="flex-1">
                                                    <Text className="text-white text-2xl font-bold">
                                                        {selectedCondition.name}
                                                    </Text>
                                                    <Text className="text-white/80 text-sm mt-1">
                                                        {selectedCondition.description}
                                                    </Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                </View>

                                {/* Dietary Focus */}
                                <View className="mb-6">
                                    <Text className="text-white text-lg font-bold mb-3">{t('diet.keyDietaryFocus')}</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4">
                                        {selectedCondition.dietaryFocus.map((focus, index) => (
                                            <View
                                                key={index}
                                                className={`flex-row items-center py-2 ${index < selectedCondition.dietaryFocus.length - 1
                                                    ? "border-b border-zinc-700"
                                                    : ""
                                                    }`}
                                            >
                                                <View className="w-6 h-6 rounded-full bg-green-900/30 items-center justify-center mr-3">
                                                    <Ionicons name="checkmark" size={16} color="#10B981" />
                                                </View>
                                                <Text className="text-white flex-1">{focus}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Foods to Avoid */}
                                <View className="mb-6">
                                    <Text className="text-white text-lg font-bold mb-3">{t('diet.foodsToAvoid')}</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4">
                                        {selectedCondition.avoidFoods.map((food, index) => (
                                            <View
                                                key={index}
                                                className={`flex-row items-center py-2 ${index < selectedCondition.avoidFoods.length - 1
                                                    ? "border-b border-zinc-700"
                                                    : ""
                                                    }`}
                                            >
                                                <View className="w-6 h-6 rounded-full bg-red-900/30 items-center justify-center mr-3">
                                                    <Ionicons name="close" size={16} color="#EF4444" />
                                                </View>
                                                <Text className="text-gray-300 flex-1">{food}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Recommended Foods */}
                                <View className="mb-6">
                                    <Text className="text-white text-lg font-bold mb-3">{t('diet.recommendedFoods')}</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4">
                                        {selectedCondition.recommendedFoods.map((food, index) => (
                                            <View
                                                key={index}
                                                className={`flex-row items-center py-2 ${index < selectedCondition.recommendedFoods.length - 1
                                                    ? "border-b border-zinc-700"
                                                    : ""
                                                    }`}
                                            >
                                                <View className="w-6 h-6 rounded-full bg-green-900/30 items-center justify-center mr-3">
                                                    <Ionicons name="add" size={16} color="#10B981" />
                                                </View>
                                                <Text className="text-white flex-1">{food}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Meal Suggestions */}
                                <View className="mb-6">
                                    <Text className="text-white text-lg font-bold mb-3">{t('diet.mealSuggestions')}</Text>
                                    {Object.entries(selectedCondition.mealSuggestions).map(([mealType, meals]) => (
                                        <View key={mealType} className="bg-zinc-800 rounded-2xl p-4 mb-3">
                                            <Text className="text-orange-500 font-semibold mb-2 capitalize">
                                                {mealType}
                                            </Text>
                                            {meals.map((meal, index) => (
                                                <View key={index} className="flex-row items-start py-1">
                                                    <Text className="text-gray-400 mr-2">•</Text>
                                                    <Text className="text-gray-300 flex-1">{meal}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ))}
                                </View>

                                {/* Nutritional Guidelines */}
                                <View className="mb-8">
                                    <Text className="text-white text-lg font-bold mb-3">{t('diet.nutritionalGuidelines')}</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4 mb-3">
                                        <View className="flex-row items-center justify-between py-2 border-b border-zinc-700">
                                            <Text className="text-gray-400">{t('diet.dailyCalories')}</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.calories}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-between py-2 border-b border-zinc-700">
                                            <Text className="text-gray-400">{t('diet.protein')}</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.protein}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-between py-2 border-b border-zinc-700">
                                            <Text className="text-gray-400">{t('diet.carbohydrates')}</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.carbs}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-400">{t('diet.fats')}</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.fats}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Special Notes */}
                                    <View className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4">
                                        <Text className="text-yellow-500 font-semibold mb-2">{t('diet.specialNotes')}</Text>
                                        {selectedCondition.nutritionalGuidelines.specialNotes.map((note, index) => (
                                            <View key={index} className="flex-row items-start py-1">
                                                <Text className="text-yellow-400 mr-2">•</Text>
                                                <Text className="text-yellow-300/80 flex-1 text-sm">{note}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        setShowDetailModal(false)
                                        setShowGeneratePlanModal(true)
                                    }}
                                    className="overflow-hidden rounded-2xl mb-8"
                                >
                                    <LinearGradient
                                        colors={["#8B5CF6", "#6366F1"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-4"
                                    >
                                        <View className="flex-row items-center justify-center">
                                            <Ionicons name="sparkles" size={20} color="white" />
                                            <Text className="text-white text-center font-bold text-lg ml-2">
                                                {t('diet.generateMealPlan')}
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Generate Plan Modal */}
            <Modal
                visible={showGeneratePlanModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGeneratePlanModal(false)}
            >
                <View className="flex-1 justify-end bg-black/70">
                    <View className="bg-zinc-900 rounded-t-3xl p-6">
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-white text-xl font-bold">{t('diet.generateMealPlan')}</Text>
                            <TouchableOpacity onPress={() => setShowGeneratePlanModal(false)}>
                                <Ionicons name="close" size={28} color="white" />
                            </TouchableOpacity>
                        </View>

                        {selectedCondition && (
                            <View>
                                <View className="bg-zinc-800 rounded-2xl p-4 mb-6">
                                    <View className="flex-row items-center">
                                        <Text className="text-4xl mr-3">{selectedCondition.icon}</Text>
                                        <View className="flex-1">
                                            <Text className="text-white text-lg font-bold">{selectedCondition.name}</Text>
                                            <Text className="text-gray-400 text-sm">{selectedCondition.description}</Text>
                                        </View>
                                    </View>
                                </View>

                                <Text className="text-white text-lg font-bold mb-3">{t('diet.selectDuration')}</Text>
                                <View className="flex-row gap-3 mb-6">
                                    <TouchableOpacity
                                        onPress={() => setPlanDuration("weekly")}
                                        className={`flex-1 rounded-2xl p-4 border-2 ${planDuration === "weekly" ? "border-purple-500 bg-purple-900/20" : "border-zinc-700 bg-zinc-800"
                                            }`}
                                    >
                                        <Text className={`text-center font-bold ${planDuration === "weekly" ? "text-purple-400" : "text-gray-400"
                                            }`}>
                                            📅 Weekly (7 days)
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setPlanDuration("monthly")}
                                        className={`flex-1 rounded-2xl p-4 border-2 ${planDuration === "monthly" ? "border-purple-500 bg-purple-900/20" : "border-zinc-700 bg-zinc-800"
                                            }`}
                                    >
                                        <Text className={`text-center font-bold ${planDuration === "monthly" ? "text-purple-400" : "text-gray-400"
                                            }`}>
                                            📆 Monthly (30 days)
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={async () => {
                                        if (!selectedCondition) {
                                            console.log('No condition selected')
                                            setShowGeneratePlanModal(false)
                                            return
                                        }

                                        setIsGenerating(true)

                                        try {
                                            // Parse calories from string (e.g., "1,800-2,200 per day" -> 2000)
                                            const caloriesStr = selectedCondition.nutritionalGuidelines.calories
                                            const caloriesMatch = caloriesStr.match(/([\d,]+)/g)
                                            const targetCalories = caloriesMatch
                                                ? parseInt(caloriesMatch[0].replace(/,/g, ''))
                                                : 2000

                                            // Determine goal type based on condition
                                            const goalType: 'maintain' | 'lose' | 'gain' =
                                                selectedCondition.id === 'muscle_gain' ? 'gain' :
                                                    selectedCondition.id === 'weight_loss' ? 'lose' : 'maintain'

                                            const planData = {
                                                goalType,
                                                targetCalories,
                                                duration: planDuration === 'weekly' ? 7 : 30,
                                                healthConditions: [selectedCondition.id],
                                                dietaryPreferences: [
                                                    ...selectedCondition.dietaryFocus,
                                                    ...selectedCondition.recommendedFoods.map(f => `prefer:${f}`),
                                                    ...selectedCondition.avoidFoods.map(f => `avoid:${f}`),
                                                ]
                                            }

                                            console.log("Generating health condition plan:", planData)

                                            const response = await dietPlanningService.generateAIMealPlan(planData)

                                            if (response.success) {
                                                const totalMeals = response.plan.dailyPlans.reduce((sum, day) => sum + day.meals.length, 0)
                                                setShowGeneratePlanModal(false)
                                                setShowDetailModal(false)

                                                setDialogType('success')
                                                setDialogTitle(t('diet.success'))
                                                setDialogMessage(t('diet.planGeneratedWithSpecializedMeals', { duration: planDuration, condition: selectedCondition.name, count: totalMeals }))
                                                setShowDialog(true)
                                                setTimeout(() => router.push("/health"), 2500)
                                            } else {
                                                setDialogType('error');
                                                setDialogTitle(t('diet.generationFailed'));
                                                setDialogMessage(response.message || 'Failed to generate meal plan');
                                                setShowDialog(true)
                                            }
                                        } catch (error: any) {
                                            console.log('Error generating plan:', error)
                                            setDialogType('error')
                                            setDialogTitle('Error')
                                            setDialogMessage(error.message || 'Failed to generate meal plan. Please try again.')
                                            setShowDialog(true)
                                        } finally {
                                            setIsGenerating(false)
                                        }
                                    }}
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
                                                        {t('diet.generating')}
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="sparkles" size={24} color="white" />
                                                    <Text className="text-white text-center font-bold text-lg ml-2">
                                                        {t('diet.generateDurationPlan', { duration: planDuration })}
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <Text className="text-gray-400 text-center text-xs mt-3">
                                    {isGenerating
                                        ? 'This may take up to 90 seconds...'
                                        : t('diet.aiWillCreatePlanOptimizedFor', { duration: planDuration, condition: selectedCondition.name.toLowerCase() })
                                    }
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            <Dialog
                visible={showDialog}
                type={dialogType}
                title={dialogTitle}
                message={dialogMessage}
                onClose={() => setShowDialog(false)}
            />
        </SafeAreaView>
    )
}

export default HealthConditionsScreen

