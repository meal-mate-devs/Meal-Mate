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

// Embedded condition data with all translations
const englishConditionData = {
    diabetes: {
        name: "Diabetes Management",
        description: "Low glycemic index, controlled carb intake",
        dietaryFocus: ["Low GI foods", "Fiber-rich meals", "Portion control", "Regular meal timing"],
        avoidFoods: ["Sugary drinks & desserts", "White bread & rice", "Processed snacks", "High-sugar fruits", "Fried foods"],
        recommendedFoods: ["Whole grains (quinoa, brown rice)", "Leafy greens & vegetables", "Lean proteins", "Nuts & seeds", "Low-fat dairy"],
        mealSuggestions: {
            breakfast: ["Steel-cut oatmeal with berries", "Greek yogurt with chia seeds", "Egg white scramble with vegetables"],
            lunch: ["Grilled chicken salad", "Lentil soup with whole grain bread", "Quinoa bowl with vegetables"],
            dinner: ["Baked salmon with steamed broccoli", "Turkey meatballs with zucchini noodles", "Stir-fried tofu with mixed vegetables"],
            snacks: ["Apple slices with almond butter", "Raw vegetables with hummus", "Handful of nuts"]
        },
        nutritionalGuidelines: {
            calories: "1,800-2,200 per day",
            protein: "25-30% of daily calories",
            carbs: "45-50% (focus on complex carbs)",
            fats: "25-30% (healthy fats)",
            specialNotes: ["Monitor blood sugar levels regularly", "Eat at consistent times", "Stay hydrated with water", "Limit sodium intake"]
        }
    },
    heart_health: {
        name: "Heart Health",
        description: "Low sodium, heart-healthy fats",
        dietaryFocus: ["Omega-3 fatty acids", "Low sodium", "High fiber", "Lean proteins"],
        avoidFoods: ["Trans fats & saturated fats", "High-sodium foods", "Processed meats", "Excessive red meat", "Refined sugars"],
        recommendedFoods: ["Fatty fish (salmon, mackerel)", "Olive oil & avocados", "Whole grains", "Berries & fruits", "Nuts & legumes"],
        mealSuggestions: {
            breakfast: ["Oatmeal with walnuts & blueberries", "Avocado toast on whole grain", "Smoothie with spinach & berries"],
            lunch: ["Mediterranean salad with olive oil", "Grilled salmon with quinoa", "Bean and vegetable soup"],
            dinner: ["Baked cod with roasted vegetables", "Chicken breast with sweet potato", "Lentil curry with brown rice"],
            snacks: ["Fresh fruit", "Unsalted almonds", "Carrot sticks with hummus"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,400 per day",
            protein: "20-25% of daily calories",
            carbs: "50-55% (whole grains focus)",
            fats: "25-30% (emphasis on unsaturated)",
            specialNotes: ["Limit sodium to 1,500mg daily", "Increase omega-3 intake", "Eat fatty fish 2-3 times per week", "Avoid trans fats completely"]
        }
    },
    gluten_free: {
        name: "Gluten Intolerance",
        description: "Celiac-safe, gluten-free options",
        dietaryFocus: ["Certified gluten-free grains", "Natural whole foods", "Label reading", "Cross-contamination prevention"],
        avoidFoods: ["Wheat, barley, rye", "Regular pasta & bread", "Beer & malt beverages", "Many processed foods", "Soy sauce (regular)"],
        recommendedFoods: ["Rice, quinoa, corn", "Gluten-free oats", "Fresh fruits & vegetables", "Meat, fish, poultry", "Eggs & dairy"],
        mealSuggestions: {
            breakfast: ["Gluten-free oatmeal with fruit", "Rice cereal with almond milk", "Scrambled eggs with vegetables"],
            lunch: ["Quinoa salad bowl", "Rice paper spring rolls", "Corn tortilla tacos"],
            dinner: ["Grilled chicken with rice pilaf", "Baked fish with roasted potatoes", "Stir-fry with rice noodles"],
            snacks: ["Fresh fruit", "Rice cakes with peanut butter", "Veggie sticks"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,500 per day",
            protein: "20-30% of daily calories",
            carbs: "45-55% (gluten-free grains)",
            fats: "25-30%",
            specialNotes: ["Always check labels for hidden gluten", "Use separate cooking utensils", "Focus on naturally gluten-free foods", "May need B-vitamin supplements"]
        }
    },
    lactose_intolerance: {
        name: "Lactose Intolerance",
        description: "Dairy-free alternatives",
        dietaryFocus: ["Lactose-free products", "Plant-based milk", "Calcium-rich alternatives", "Vitamin D sources"],
        avoidFoods: ["Regular milk & cream", "Ice cream", "Most cheeses", "Butter", "Yogurt (regular)"],
        recommendedFoods: ["Almond, soy, oat milk", "Lactose-free dairy", "Leafy greens (calcium)", "Fortified products", "Tofu & tempeh"],
        mealSuggestions: {
            breakfast: ["Oatmeal with almond milk", "Smoothie with coconut yogurt", "Avocado toast"],
            lunch: ["Chicken salad (no cheese)", "Veggie stir-fry with tofu", "Bean burrito with guacamole"],
            dinner: ["Grilled salmon with vegetables", "Pasta with dairy-free sauce", "Chicken curry with coconut milk"],
            snacks: ["Fresh fruit", "Dairy-free yogurt", "Nuts & seeds"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,500 per day",
            protein: "20-30% of daily calories",
            carbs: "45-55%",
            fats: "25-30%",
            specialNotes: ["Ensure adequate calcium intake (1,000mg/day)", "Get vitamin D from sun & supplements", "Read labels for hidden lactose", "Try lactase enzyme supplements"]
        }
    },
    kidney_health: {
        name: "Kidney Health",
        description: "Low protein, controlled minerals",
        dietaryFocus: ["Controlled protein", "Low potassium", "Low phosphorus", "Fluid management"],
        avoidFoods: ["Processed meats", "High-potassium fruits", "Dairy products", "Whole grain bread", "Dark colas"],
        recommendedFoods: ["Lean proteins (limited)", "Apples, berries", "Cauliflower, cabbage", "White bread & rice", "Olive oil"],
        mealSuggestions: {
            breakfast: ["White toast with jam", "Rice cereal with limited milk", "Egg whites scramble"],
            lunch: ["Chicken sandwich (white bread)", "Rice with steamed vegetables", "Small pasta salad"],
            dinner: ["Small portion grilled fish", "Stir-fried vegetables with rice", "Chicken breast with low-K veggies"],
            snacks: ["Apple slices", "Small portions of berries", "Rice crackers"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,400 per day",
            protein: "0.6-0.8g per kg body weight",
            carbs: "50-60%",
            fats: "25-35%",
            specialNotes: ["Limit protein based on kidney function", "Monitor potassium (2,000mg max)", "Limit phosphorus (800-1,000mg)", "Control fluid intake as prescribed"]
        }
    },
    ibs: {
        name: "IBS (Low FODMAP)",
        description: "Gut-friendly, low FODMAP",
        dietaryFocus: ["Low FODMAP foods", "Small frequent meals", "Stress management", "Hydration"],
        avoidFoods: ["High FODMAP fruits (apples, pears)", "Onions & garlic", "Wheat products", "Legumes", "High lactose dairy"],
        recommendedFoods: ["Bananas, oranges, berries", "Rice, quinoa, oats", "Carrots, zucchini, spinach", "Chicken, fish, eggs", "Lactose-free dairy"],
        mealSuggestions: {
            breakfast: ["Gluten-free oats with banana", "Rice porridge", "Scrambled eggs with spinach"],
            lunch: ["Chicken & rice bowl", "Quinoa salad with low FODMAP veggies", "Grilled fish with carrots"],
            dinner: ["Baked chicken with zucchini", "Stir-fry with low FODMAP veggies", "Salmon with green beans"],
            snacks: ["Rice cakes", "Carrots with hummus (small)", "Lactose-free yogurt"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,400 per day",
            protein: "20-30% of daily calories",
            carbs: "50-55% (low FODMAP)",
            fats: "25-30%",
            specialNotes: ["Eat small, frequent meals", "Keep a food diary", "Reintroduce FODMAPs gradually", "Stay well hydrated"]
        }
    }
}

const spanishConditionData = {
    diabetes: {
        name: "Gestión de Diabetes",
        description: "Índice glucémico bajo, ingesta controlada de carbohidratos",
        dietaryFocus: ["Alimentos de IG bajo", "Comidas ricas en fibra", "Control de porciones", "Horarios regulares de comidas"],
        avoidFoods: ["Bebidas azucaradas y postres", "Pan blanco y arroz", "Snacks procesados", "Frutas con alto azúcar", "Alimentos fritos"],
        recommendedFoods: ["Granos enteros (quinoa, arroz integral)", "Verduras de hoja verde", "Proteínas magras", "Nueces y semillas", "Lácteos bajos en grasa"],
        mealSuggestions: {
            breakfast: ["Avena cortada con bayas", "Yogur griego con semillas de chía", "Revoltillo de claras con verduras"],
            lunch: ["Ensalada de pollo a la parrilla", "Sopa de lentejas con pan integral", "Bol de quinoa con verduras"],
            dinner: ["Salmón al horno con brócoli al vapor", "Albóndigas de pavo con noodles de calabacín", "Tofu salteado con verduras mixtas"],
            snacks: ["Rodajas de manzana con mantequilla de almendras", "Verduras crudas con hummus", "Un puñado de nueces"]
        },
        nutritionalGuidelines: {
            calories: "1,800-2,200 por día",
            protein: "25-30% de las calorías diarias",
            carbs: "45-50% (énfasis en carbohidratos complejos)",
            fats: "25-30% (grasas saludables)",
            specialNotes: ["Monitorear niveles de azúcar en sangre regularmente", "Comer a horas consistentes", "Mantenerse hidratado con agua", "Limitar la ingesta de sodio"]
        }
    },
    heart_health: {
        name: "Salud Cardíaca",
        description: "Bajo en sodio, grasas saludables para el corazón",
        dietaryFocus: ["Ácidos grasos omega-3", "Bajo en sodio", "Alto en fibra", "Proteínas magras"],
        avoidFoods: ["Grasas trans y saturadas", "Alimentos altos en sodio", "Carnes procesadas", "Carne roja excesiva", "Azúcares refinados"],
        recommendedFoods: ["Pescado graso (salmón, caballa)", "Aceite de oliva y aguacates", "Granos enteros", "Bayas y frutas", "Nueces y legumbres"],
        mealSuggestions: {
            breakfast: ["Avena con nueces y arándanos", "Tostada de aguacate en grano entero", "Batido con espinacas y bayas"],
            lunch: ["Ensalada mediterránea con aceite de oliva", "Salmón a la parrilla con quinoa", "Sopa de frijoles y verduras"],
            dinner: ["Bacalao al horno con verduras asadas", "Pechuga de pollo con batata dulce", "Curry de lentejas con arroz integral"],
            snacks: ["Fruta fresca", "Almendras sin sal", "Zanahorias con hummus"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,400 por día",
            protein: "20-25% de las calorías diarias",
            carbs: "50-55% (énfasis en granos enteros)",
            fats: "25-30% (énfasis en insaturadas)",
            specialNotes: ["Limitar sodio a 1,500mg diarios", "Aumentar ingesta de omega-3", "Comer pescado graso 2-3 veces por semana", "Evitar grasas trans completamente"]
        }
    },
    gluten_free: {
        name: "Intolerancia al Gluten",
        description: "Seguro para celíacos, opciones sin gluten",
        dietaryFocus: ["Granos certificados sin gluten", "Alimentos naturales enteros", "Lectura de etiquetas", "Prevención de contaminación cruzada"],
        avoidFoods: ["Trigo, cebada, centeno", "Pasta y pan regular", "Cervezas y bebidas de malta", "Muchos alimentos procesados", "Salsa de soja (regular)"],
        recommendedFoods: ["Arroz, quinoa, maíz", "Avena sin gluten", "Frutas y verduras frescas", "Carne, pescado, aves", "Huevos y lácteos"],
        mealSuggestions: {
            breakfast: ["Avena sin gluten con fruta", "Cereal de arroz con leche de almendras", "Huevos revueltos con verduras"],
            lunch: ["Bol de ensalada de quinoa", "Rollos de primavera de papel de arroz", "Tacos de tortilla de maíz"],
            dinner: ["Pollo a la parrilla con pilaf de arroz", "Pescado al horno con papas asadas", "Salteado con fideos de arroz"],
            snacks: ["Fruta fresca", "Galletas de arroz con mantequilla de maní", "Palitos de verduras"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,500 por día",
            protein: "20-30% de las calorías diarias",
            carbs: "45-55% (granos sin gluten)",
            fats: "25-30%",
            specialNotes: ["Siempre revisar etiquetas por gluten oculto", "Usar utensilios de cocina separados", "Enfocarse en alimentos naturalmente sin gluten", "Puede necesitar suplementos de vitamina B"]
        }
    },
    lactose_intolerance: {
        name: "Intolerancia a la Lactosa",
        description: "Alternativas libres de lácteos",
        dietaryFocus: ["Productos libres de lactosa", "Leche basada en plantas", "Alternativas ricas en calcio", "Fuentes de vitamina D"],
        avoidFoods: ["Leche y crema regular", "Helado", "La mayoría de quesos", "Mantequilla", "Yogur (regular)"],
        recommendedFoods: ["Leche de almendras, soja, avena", "Lácteos libres de lactosa", "Verduras de hoja verde (calcio)", "Productos fortificados", "Tofu y tempeh"],
        mealSuggestions: {
            breakfast: ["Avena con leche de almendras", "Batido con yogur de coco", "Tostada de aguacate"],
            lunch: ["Ensalada de pollo (sin queso)", "Salteado de verduras con tofu", "Burrito de frijoles con guacamole"],
            dinner: ["Salmón a la parrilla con verduras", "Pasta con salsa libre de lácteos", "Curry de pollo con leche de coco"],
            snacks: ["Fruta fresca", "Yogur libre de lácteos", "Nueces y semillas"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,500 por día",
            protein: "20-30% de las calorías diarias",
            carbs: "45-55%",
            fats: "25-30%",
            specialNotes: ["Asegurar ingesta adecuada de calcio (1,000mg/día)", "Obtener vitamina D del sol y suplementos", "Leer etiquetas por lactosa oculta", "Probar suplementos de enzima lactasa"]
        }
    },
    kidney_health: {
        name: "Salud Renal",
        description: "Bajo en proteínas, minerales controlados",
        dietaryFocus: ["Proteína controlada", "Bajo en potasio", "Bajo en fósforo", "Manejo de fluidos"],
        avoidFoods: ["Carnes procesadas", "Frutas altas en potasio", "Productos lácteos", "Pan de grano entero", "Colas oscuras"],
        recommendedFoods: ["Proteínas magras (limitadas)", "Manzanas, bayas", "Coliflor, repollo", "Pan blanco y arroz", "Aceite de oliva"],
        mealSuggestions: {
            breakfast: ["Tostada blanca con mermelada", "Cereal de arroz con leche limitada", "Revoltillo de claras de huevo"],
            lunch: ["Sándwich de pollo (pan blanco)", "Arroz con verduras al vapor", "Ensalada pequeña de pasta"],
            dinner: ["Porción pequeña de pescado a la parrilla", "Verduras salteadas con arroz", "Pechuga de pollo con verduras bajas en K"],
            snacks: ["Rodajas de manzana", "Porciones pequeñas de bayas", "Galletas de arroz"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,400 por día",
            protein: "0.6-0.8g por kg de peso corporal",
            carbs: "50-60%",
            fats: "25-35%",
            specialNotes: ["Limitar proteína según función renal", "Monitorear potasio (máximo 2,000mg)", "Limitar fósforo (800-1,000mg)", "Controlar ingesta de fluidos según prescripción"]
        }
    },
    ibs: {
        name: "SII (Bajo FODMAP)",
        description: "Amigable para el intestino, bajo FODMAP",
        dietaryFocus: ["Alimentos bajos en FODMAP", "Comidas pequeñas frecuentes", "Manejo del estrés", "Hidratación"],
        avoidFoods: ["Frutas altas en FODMAP (manzanas, peras)", "Cebollas y ajo", "Productos de trigo", "Legumbres", "Lácteos altos en lactosa"],
        recommendedFoods: ["Plátanos, naranjas, bayas", "Arroz, quinoa, avena", "Zanahorias, calabacín, espinacas", "Pollo, pescado, huevos", "Lácteos libres de lactosa"],
        mealSuggestions: {
            breakfast: ["Avena sin gluten con plátano", "Gachas de arroz", "Huevos revueltos con espinacas"],
            lunch: ["Bol de pollo y arroz", "Ensalada de quinoa con verduras seguras", "Pescado a la parrilla con zanahorias"],
            dinner: ["Pollo al horno con calabacín", "Salteado con verduras bajas en FODMAP", "Salmón con judías verdes"],
            snacks: ["Galletas de arroz", "Zanahorias con hummus (pequeño)", "Yogur libre de lactosa"]
        },
        nutritionalGuidelines: {
            calories: "2,000-2,400 por día",
            protein: "20-30% de las calorías diarias",
            carbs: "50-55% (bajo FODMAP)",
            fats: "25-30%",
            specialNotes: ["Comer comidas pequeñas y frecuentes", "Mantener un diario de alimentos", "Reintroducir FODMAP gradualmente", "Mantenerse bien hidratado"]
        }
    }
}

const conditionTranslations = {
    en: englishConditionData,
    es: spanishConditionData,
    // Add other languages - for now using English as fallback
    fr: englishConditionData,
    de: englishConditionData,
    it: englishConditionData,
    pt: englishConditionData,
    ja: englishConditionData,
    ko: englishConditionData,
    zh: englishConditionData,
    ar: englishConditionData,
    hi: englishConditionData,
    ru: englishConditionData,
}

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

    // Get condition data from embedded translations
    const getConditionData = (conditionId: string) => {
        return conditionTranslations[language as keyof typeof conditionTranslations]?.[conditionId as keyof typeof conditionTranslations.en] ||
            conditionTranslations.en[conditionId as keyof typeof conditionTranslations.en]
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

