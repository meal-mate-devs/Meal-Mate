"use client"

import Dialog from "@/components/atoms/Dialog"
import { dietPlanningService } from "@/lib/services/dietPlanningService"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
    ActivityIndicator,
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

    const checkExistingPlan = async () => {
        try {
            const response = await dietPlanningService.getActivePlan()
            if (response.plan) {
                setHasExistingPlan(true)
                setDialogType('warning')
                setDialogTitle('Active Plan Exists')
                setDialogMessage('You already have an active meal plan. Please cancel your current plan from the Diet Planning screen before generating a new one.')
                setShowDialog(true)
                setTimeout(() => router.back(), 2500)
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
            name: "Diabetes Management",
            icon: "🩺",
            description: "Low glycemic index, controlled carb intake",
            color: "#3B82F6",
            dietaryFocus: ["Low GI foods", "Fiber-rich meals", "Portion control", "Regular meal timing"],
            avoidFoods: [
                "Sugary drinks & desserts",
                "White bread & rice",
                "Processed snacks",
                "High-sugar fruits",
                "Fried foods",
            ],
            recommendedFoods: [
                "Whole grains (quinoa, brown rice)",
                "Leafy greens & vegetables",
                "Lean proteins",
                "Nuts & seeds",
                "Low-fat dairy",
            ],
            mealSuggestions: {
                breakfast: [
                    "Steel-cut oatmeal with berries",
                    "Greek yogurt with chia seeds",
                    "Egg white scramble with vegetables",
                ],
                lunch: [
                    "Grilled chicken salad",
                    "Lentil soup with whole grain bread",
                    "Quinoa bowl with vegetables",
                ],
                dinner: [
                    "Baked salmon with steamed broccoli",
                    "Turkey meatballs with zucchini noodles",
                    "Stir-fried tofu with mixed vegetables",
                ],
                snacks: ["Apple slices with almond butter", "Raw vegetables with hummus", "Handful of nuts"],
            },
            nutritionalGuidelines: {
                calories: "1,800-2,200 per day",
                protein: "25-30% of daily calories",
                carbs: "45-50% (focus on complex carbs)",
                fats: "25-30% (healthy fats)",
                specialNotes: [
                    "Monitor blood sugar levels regularly",
                    "Eat at consistent times",
                    "Stay hydrated with water",
                    "Limit sodium intake",
                ],
            },
        },
        {
            id: "heart_health",
            name: "Heart Health",
            icon: "❤️",
            description: "Low sodium, heart-healthy fats",
            color: "#EF4444",
            dietaryFocus: [
                "Omega-3 fatty acids",
                "Low sodium",
                "High fiber",
                "Lean proteins",
            ],
            avoidFoods: [
                "Trans fats & saturated fats",
                "High-sodium foods",
                "Processed meats",
                "Excessive red meat",
                "Refined sugars",
            ],
            recommendedFoods: [
                "Fatty fish (salmon, mackerel)",
                "Olive oil & avocados",
                "Whole grains",
                "Berries & fruits",
                "Nuts & legumes",
            ],
            mealSuggestions: {
                breakfast: [
                    "Oatmeal with walnuts & blueberries",
                    "Avocado toast on whole grain",
                    "Smoothie with spinach & berries",
                ],
                lunch: [
                    "Mediterranean salad with olive oil",
                    "Grilled salmon with quinoa",
                    "Bean and vegetable soup",
                ],
                dinner: [
                    "Baked cod with roasted vegetables",
                    "Chicken breast with sweet potato",
                    "Lentil curry with brown rice",
                ],
                snacks: ["Fresh fruit", "Unsalted almonds", "Carrot sticks with hummus"],
            },
            nutritionalGuidelines: {
                calories: "2,000-2,400 per day",
                protein: "20-25% of daily calories",
                carbs: "50-55% (whole grains focus)",
                fats: "25-30% (emphasis on unsaturated)",
                specialNotes: [
                    "Limit sodium to 1,500mg daily",
                    "Increase omega-3 intake",
                    "Eat fatty fish 2-3 times per week",
                    "Avoid trans fats completely",
                ],
            },
        },
        {
            id: "gluten_free",
            name: "Gluten Intolerance",
            icon: "🌾",
            description: "Celiac-safe, gluten-free options",
            color: "#F59E0B",
            dietaryFocus: [
                "Certified gluten-free grains",
                "Natural whole foods",
                "Label reading",
                "Cross-contamination prevention",
            ],
            avoidFoods: [
                "Wheat, barley, rye",
                "Regular pasta & bread",
                "Beer & malt beverages",
                "Many processed foods",
                "Soy sauce (regular)",
            ],
            recommendedFoods: [
                "Rice, quinoa, corn",
                "Gluten-free oats",
                "Fresh fruits & vegetables",
                "Meat, fish, poultry",
                "Eggs & dairy",
            ],
            mealSuggestions: {
                breakfast: [
                    "Gluten-free oatmeal with fruit",
                    "Rice cereal with almond milk",
                    "Scrambled eggs with vegetables",
                ],
                lunch: [
                    "Quinoa salad bowl",
                    "Rice paper spring rolls",
                    "Corn tortilla tacos",
                ],
                dinner: [
                    "Grilled chicken with rice pilaf",
                    "Baked fish with roasted potatoes",
                    "Stir-fry with rice noodles",
                ],
                snacks: ["Fresh fruit", "Rice cakes with peanut butter", "Veggie sticks"],
            },
            nutritionalGuidelines: {
                calories: "2,000-2,500 per day",
                protein: "20-30% of daily calories",
                carbs: "45-55% (gluten-free grains)",
                fats: "25-30%",
                specialNotes: [
                    "Always check labels for hidden gluten",
                    "Use separate cooking utensils",
                    "Focus on naturally gluten-free foods",
                    "May need B-vitamin supplements",
                ],
            },
        },
        {
            id: "lactose_intolerance",
            name: "Lactose Intolerance",
            icon: "🥛",
            description: "Dairy-free alternatives",
            color: "#8B5CF6",
            dietaryFocus: [
                "Lactose-free products",
                "Plant-based milk",
                "Calcium-rich alternatives",
                "Vitamin D sources",
            ],
            avoidFoods: [
                "Regular milk & cream",
                "Ice cream",
                "Most cheeses",
                "Butter",
                "Yogurt (regular)",
            ],
            recommendedFoods: [
                "Almond, soy, oat milk",
                "Lactose-free dairy",
                "Leafy greens (calcium)",
                "Fortified products",
                "Tofu & tempeh",
            ],
            mealSuggestions: {
                breakfast: [
                    "Oatmeal with almond milk",
                    "Smoothie with coconut yogurt",
                    "Avocado toast",
                ],
                lunch: [
                    "Chicken salad (no cheese)",
                    "Veggie stir-fry with tofu",
                    "Bean burrito with guacamole",
                ],
                dinner: [
                    "Grilled salmon with vegetables",
                    "Pasta with dairy-free sauce",
                    "Chicken curry with coconut milk",
                ],
                snacks: ["Fresh fruit", "Dairy-free yogurt", "Nuts & seeds"],
            },
            nutritionalGuidelines: {
                calories: "2,000-2,500 per day",
                protein: "20-30% of daily calories",
                carbs: "45-55%",
                fats: "25-30%",
                specialNotes: [
                    "Ensure adequate calcium intake (1,000mg/day)",
                    "Get vitamin D from sun & supplements",
                    "Read labels for hidden lactose",
                    "Try lactase enzyme supplements",
                ],
            },
        },
        {
            id: "kidney_health",
            name: "Kidney Health",
            icon: "🫘",
            description: "Low protein, controlled minerals",
            color: "#10B981",
            dietaryFocus: [
                "Controlled protein",
                "Low potassium",
                "Low phosphorus",
                "Fluid management",
            ],
            avoidFoods: [
                "Processed meats",
                "High-potassium fruits",
                "Dairy products",
                "Whole grain bread",
                "Dark colas",
            ],
            recommendedFoods: [
                "Lean proteins (limited)",
                "Apples, berries",
                "Cauliflower, cabbage",
                "White bread & rice",
                "Olive oil",
            ],
            mealSuggestions: {
                breakfast: [
                    "White toast with jam",
                    "Rice cereal with limited milk",
                    "Egg whites scramble",
                ],
                lunch: [
                    "Chicken sandwich (white bread)",
                    "Rice with steamed vegetables",
                    "Small pasta salad",
                ],
                dinner: [
                    "Small portion grilled fish",
                    "Stir-fried vegetables with rice",
                    "Chicken breast with low-K veggies",
                ],
                snacks: ["Apple slices", "Small portions of berries", "Rice crackers"],
            },
            nutritionalGuidelines: {
                calories: "2,000-2,400 per day",
                protein: "0.6-0.8g per kg body weight",
                carbs: "50-60%",
                fats: "25-35%",
                specialNotes: [
                    "Limit protein based on kidney function",
                    "Monitor potassium (2,000mg max)",
                    "Limit phosphorus (800-1,000mg)",
                    "Control fluid intake as prescribed",
                ],
            },
        },
        {
            id: "ibs",
            name: "IBS (Low FODMAP)",
            icon: "🤰",
            description: "Gut-friendly, low FODMAP",
            color: "#EC4899",
            dietaryFocus: ["Low FODMAP foods", "Small frequent meals", "Stress management", "Hydration"],
            avoidFoods: [
                "High FODMAP fruits (apples, pears)",
                "Onions & garlic",
                "Wheat products",
                "Legumes",
                "High lactose dairy",
            ],
            recommendedFoods: [
                "Bananas, oranges, berries",
                "Rice, quinoa, oats",
                "Carrots, zucchini, spinach",
                "Chicken, fish, eggs",
                "Lactose-free dairy",
            ],
            mealSuggestions: {
                breakfast: [
                    "Gluten-free oats with banana",
                    "Rice porridge",
                    "Scrambled eggs with spinach",
                ],
                lunch: [
                    "Chicken & rice bowl",
                    "Quinoa salad with safe veggies",
                    "Grilled fish with carrots",
                ],
                dinner: [
                    "Baked chicken with zucchini",
                    "Stir-fry with low FODMAP veggies",
                    "Salmon with green beans",
                ],
                snacks: ["Rice cakes", "Carrots with hummus (small)", "Lactose-free yogurt"],
            },
            nutritionalGuidelines: {
                calories: "2,000-2,400 per day",
                protein: "20-30% of daily calories",
                carbs: "50-55% (low FODMAP)",
                fats: "25-30%",
                specialNotes: [
                    "Eat small, frequent meals",
                    "Keep a food diary",
                    "Reintroduce FODMAPs gradually",
                    "Stay well hydrated",
                ],
            },
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
                    <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Health Conditions</Text>
                    <View className="w-10" />
                </View>
                <Text className="text-gray-400 text-center">Specialized diet plans for your needs</Text>
            </View>

            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Info Card */}
                <View className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 mb-6">
                    <View className="flex-row items-start">
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <View className="flex-1 ml-3">
                            <Text className="text-blue-400 font-semibold mb-1">Important Notice</Text>
                            <Text className="text-blue-300/80 text-sm">
                                These plans are general guidelines. Always consult with your healthcare provider or
                                registered dietitian before making dietary changes.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Condition Cards */}
                <View className="mb-8">
                    <Text className="text-white text-xl font-bold mb-4">Select Your Condition</Text>
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
                                <Text className="text-white text-lg font-bold">Diet Plan Details</Text>
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
                                    <Text className="text-white text-lg font-bold mb-3">Key Dietary Focus</Text>
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
                                    <Text className="text-white text-lg font-bold mb-3">Foods to Avoid</Text>
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
                                    <Text className="text-white text-lg font-bold mb-3">Recommended Foods</Text>
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
                                    <Text className="text-white text-lg font-bold mb-3">Meal Suggestions</Text>
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
                                    <Text className="text-white text-lg font-bold mb-3">Nutritional Guidelines</Text>
                                    <View className="bg-zinc-800 rounded-2xl p-4 mb-3">
                                        <View className="flex-row items-center justify-between py-2 border-b border-zinc-700">
                                            <Text className="text-gray-400">Daily Calories</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.calories}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-between py-2 border-b border-zinc-700">
                                            <Text className="text-gray-400">Protein</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.protein}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-between py-2 border-b border-zinc-700">
                                            <Text className="text-gray-400">Carbohydrates</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.carbs}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-400">Fats</Text>
                                            <Text className="text-white font-semibold">
                                                {selectedCondition.nutritionalGuidelines.fats}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Special Notes */}
                                    <View className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-4">
                                        <Text className="text-yellow-500 font-semibold mb-2">Special Notes</Text>
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
                                                Generate Meal Plan
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
                            <Text className="text-white text-xl font-bold">Generate Meal Plan</Text>
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

                                <Text className="text-white text-lg font-bold mb-3">Select Duration</Text>
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
                                            console.error('No condition selected')
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
                                                setDialogTitle('Success! 🎉')
                                                setDialogMessage(`Your ${planDuration} plan for ${selectedCondition.name} has been generated with ${totalMeals} specialized meals!`)
                                                setShowDialog(true)
                                                setTimeout(() => router.back(), 2500)
                                            } else {
                                                setDialogType('error');
                                                setDialogTitle('Generation Failed');
                                                setDialogMessage(response.message || 'Failed to generate meal plan');
                                                setShowDialog(true)
                                            }
                                        } catch (error: any) {
                                            console.error('Error generating plan:', error)
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
                                                        Generating...
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="sparkles" size={24} color="white" />
                                                    <Text className="text-white text-center font-bold text-lg ml-2">
                                                        Generate {planDuration === "weekly" ? "Weekly" : "Monthly"} Plan
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <Text className="text-gray-400 text-center text-xs mt-3">
                                    {isGenerating
                                        ? 'This may take up to 90 seconds...'
                                        : `AI will create a ${planDuration} plan optimized for ${selectedCondition.name.toLowerCase()}`
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

