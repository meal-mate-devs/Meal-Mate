"use client"

import type {
    GeneratedRecipe,
    RecipeFilters
} from "@/lib/types/recipeGeneration"
import { CUISINES, DIETARY_PREFERENCES, FOOD_CATEGORIES, MEAL_TIMES } from "@/lib/utils"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useState } from "react"
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native"
import IngredientSearchModal from "../../molecules/IngredientSearchModal"
import FilterSection from "./FilterSection"
import GeneratedRecipeCard from "./GeneratedRecipeCard"
import IngredientSelector from "./IngredientsSelector"
import RecipeDetailModal from "./RecipieDetailModel"
import VoiceControl from "./VoiceControl"


export default function RecipeGenerationScreen(): JSX.Element {
    const [filters, setFilters] = useState<RecipeFilters>({
        cuisines: [],
        categories: [],
        dietaryPreferences: [],
        mealTime: "",
        servings: 4,
        cookingTime: 30,
        ingredients: [],
        difficulty: "Any",
    })

    const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([])
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [showIngredientSelector, setShowIngredientSelector] = useState<boolean>(false)
    const [showVoiceControl, setShowVoiceControl] = useState<boolean>(false)
    const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(null)
    const [showRecipeDetail, setShowRecipeDetail] = useState<boolean>(false)
    const [showIngredientScanner, setShowIngredientScanner] = useState<boolean>(false)


    const handleFilterChange = (key: keyof RecipeFilters, value: any): void => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    const handleIngredientsDetected = (ingredients: string[]): void => {
        if (ingredients.length === 0) {
            return;
        }
        
        console.log("Selected ingredients:", ingredients);
        
        // Update filters with unique ingredients (combine with existing ones)
        const uniqueIngredients = [...new Set([...filters.ingredients, ...ingredients])];
        handleFilterChange("ingredients", uniqueIngredients);
        
        // Show a notification about added ingredients
        Alert.alert(
            "Ingredients Added!", 
            `Added ${ingredients.length} ingredient${ingredients.length > 1 ? 's' : ''} to your recipe.`,
            [
                { text: "Generate Recipes", onPress: handleGenerateRecipes },
                { text: "OK", style: "cancel" }
            ]
        );
    }


    const handleGenerateRecipes = async (): Promise<void> => {
        if (filters.cuisines.length === 0 && filters.categories.length === 0) {
            Alert.alert("Please select at least one cuisine or category")
            return
        }

        setIsGenerating(true)

        setTimeout(() => {
            const mockRecipes: GeneratedRecipe[] = [
                {
                    id: "1",
                    title: "AI-Generated Spicy Thai Basil Chicken",
                    description:
                        "A perfectly balanced Thai dish with aromatic basil and tender chicken, customized for your preferences.",
                    image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?q=80&w=1000&auto=format&fit=crop",
                    cookTime: filters.cookingTime,
                    prepTime: 15,
                    servings: filters.servings,
                    difficulty: "Medium",
                    cuisine: filters.cuisines[0] || "Thai",
                    category: filters.categories[0] || "Main Course",
                    ingredients: [
                        { id: "1", name: "Chicken breast", amount: "500", unit: "g", notes: "Cut into strips" },
                        { id: "2", name: "Thai basil leaves", amount: "1", unit: "cup", notes: "Fresh" },
                        { id: "3", name: "Garlic", amount: "4", unit: "cloves", notes: "Minced" },
                        { id: "4", name: "Thai chilies", amount: "2-3", unit: "pieces", notes: "Adjust to taste" },
                        { id: "5", name: "Fish sauce", amount: "2", unit: "tbsp" },
                        { id: "6", name: "Soy sauce", amount: "1", unit: "tbsp" },
                        { id: "7", name: "Sugar", amount: "1", unit: "tsp" },
                        { id: "8", name: "Vegetable oil", amount: "2", unit: "tbsp" },
                    ],
                    instructions: [
                        { id: "1", step: 1, instruction: "Heat oil in a wok or large skillet over high heat.", duration: 2 },
                        {
                            id: "2",
                            step: 2,
                            instruction: "Add garlic and chilies, stir-fry for 30 seconds until fragrant.",
                            duration: 1,
                        },
                        {
                            id: "3",
                            step: 3,
                            instruction: "Add chicken and cook until no longer pink, about 5-7 minutes.",
                            duration: 7,
                        },
                        { id: "4", step: 4, instruction: "Add fish sauce, soy sauce, and sugar. Stir to combine.", duration: 1 },
                        { id: "5", step: 5, instruction: "Add Thai basil leaves and stir until wilted.", duration: 1 },
                        { id: "6", step: 6, instruction: "Serve immediately over steamed rice.", duration: 0 },
                    ],
                    nutritionInfo: {
                        calories: 320,
                        protein: 35,
                        carbs: 8,
                        fat: 15,
                        fiber: 2,
                    },
                    tips: [
                        "Use high heat for authentic wok hei flavor",
                        "Don't overcook the basil to maintain its aroma",
                        "Adjust chili amount based on your spice tolerance",
                    ],
                    substitutions: [
                        { original: "Thai basil", substitute: "Regular basil", ratio: "1:1", notes: "Flavor will be milder" },
                        { original: "Fish sauce", substitute: "Soy sauce", ratio: "1:1", notes: "For vegetarian option" },
                    ],
                },
                {
                    id: "2",
                    title: "AI-Crafted Mediterranean Quinoa Bowl",
                    description:
                        "A nutritious and colorful bowl packed with Mediterranean flavors, tailored to your dietary needs.",
                    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop",
                    cookTime: 25,
                    prepTime: 10,
                    servings: filters.servings,
                    difficulty: "Easy",
                    cuisine: "Mediterranean",
                    category: "Main Course",
                    ingredients: [
                        { id: "1", name: "Quinoa", amount: "1", unit: "cup", notes: "Rinsed" },
                        { id: "2", name: "Cherry tomatoes", amount: "200", unit: "g", notes: "Halved" },
                        { id: "3", name: "Cucumber", amount: "1", unit: "medium", notes: "Diced" },
                        { id: "4", name: "Red onion", amount: "1/4", unit: "cup", notes: "Finely chopped" },
                        { id: "5", name: "Feta cheese", amount: "100", unit: "g", notes: "Crumbled" },
                        { id: "6", name: "Kalamata olives", amount: "1/4", unit: "cup", notes: "Pitted" },
                        { id: "7", name: "Olive oil", amount: "3", unit: "tbsp" },
                        { id: "8", name: "Lemon juice", amount: "2", unit: "tbsp" },
                    ],
                    instructions: [
                        { id: "1", step: 1, instruction: "Cook quinoa according to package instructions. Let cool.", duration: 15 },
                        { id: "2", step: 2, instruction: "Prepare all vegetables while quinoa cooks.", duration: 10 },
                        { id: "3", step: 3, instruction: "Whisk together olive oil, lemon juice, salt, and pepper.", duration: 2 },
                        { id: "4", step: 4, instruction: "Combine quinoa with vegetables in a large bowl.", duration: 3 },
                        { id: "5", step: 5, instruction: "Add dressing and toss gently to combine.", duration: 1 },
                        { id: "6", step: 6, instruction: "Top with feta cheese and olives before serving.", duration: 1 },
                    ],
                    nutritionInfo: {
                        calories: 380,
                        protein: 14,
                        carbs: 45,
                        fat: 18,
                        fiber: 6,
                    },
                    tips: [
                        "Let quinoa cool completely for better texture",
                        "Add fresh herbs like parsley or mint for extra flavor",
                        "Can be made ahead and stored in the fridge",
                    ],
                    substitutions: [
                        { original: "Quinoa", substitute: "Brown rice", ratio: "1:1", notes: "Cook time may vary" },
                        { original: "Feta cheese", substitute: "Goat cheese", ratio: "1:1", notes: "For different flavor profile" },
                    ],
                },
            ]

            setGeneratedRecipes(mockRecipes)
            setIsGenerating(false)
        }, 2000)
    }

    const handleVoiceGeneration = (voiceInput: string): void => {
        console.log("Voice input:", voiceInput)
        setShowVoiceControl(false)
        handleGenerateRecipes()
    }

    const handleRecipeSelect = (recipe: GeneratedRecipe): void => {
        setSelectedRecipe(recipe)
        setShowRecipeDetail(true)
    }

    return (
        <View className="flex-1 bg-zinc-900">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="pt-16 px-4 pb-4">
                    <Text className="text-center text-white text-2xl font-bold mb-2">AI Recipe Generator</Text>
                    <Text className="text-center text-zinc-400 text-sm">Create personalized recipes with AI magic ✨</Text>
                </View>

                <View className="mb-6">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        className="py-2"
                    >
                        <TouchableOpacity
                            className="flex-row items-center bg-zinc-800 rounded-full px-4 py-3 mr-3 border border-zinc-700 min-w-[140px]"
                            onPress={() => setShowIngredientSelector(true)}
                        >
                            <Ionicons name="basket-outline" size={18} color="#FBBF24" />
                            <Text className="text-white ml-2 text-sm font-medium">My Pantry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center bg-zinc-800 rounded-full px-4 py-3 mr-3 border border-zinc-700 min-w-[140px]"
                            onPress={() => setShowVoiceControl(true)}
                        >
                            <Ionicons name="mic-outline" size={18} color="#FBBF24" />
                            <Text className="text-white ml-2 text-sm font-medium">Voice Chef</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center bg-zinc-800 rounded-full px-4 py-3 mr-3 border border-zinc-700 min-w-[160px] relative"
                            onPress={() => setShowIngredientScanner(true)}
                        >
                            <Ionicons name="camera-outline" size={18} color="#FBBF24" />
                            <Text className="text-white ml-2 text-sm font-medium">Scan Ingredients</Text>
                            <View className="bg-yellow-400 rounded-full px-2 py-1 ml-2">
                                <Text className="text-black text-xs font-bold">PRO</Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                <FilterSection
                    title="Cuisine Type"
                    items={CUISINES}
                    selectedItems={filters.cuisines}
                    onSelectionChange={(selected) => handleFilterChange("cuisines", selected)}
                    multiSelect={true}
                />

                <FilterSection
                    title="Food Category"
                    items={FOOD_CATEGORIES}
                    selectedItems={filters.categories}
                    onSelectionChange={(selected) => handleFilterChange("categories", selected)}
                    multiSelect={true}
                />

                <FilterSection
                    title="Dietary Preferences"
                    items={DIETARY_PREFERENCES}
                    selectedItems={filters.dietaryPreferences}
                    onSelectionChange={(selected) => handleFilterChange("dietaryPreferences", selected)}
                    multiSelect={true}
                />

                <FilterSection
                    title="Meal Time"
                    items={MEAL_TIMES}
                    selectedItems={filters.mealTime ? [filters.mealTime] : []}
                    onSelectionChange={(selected) => handleFilterChange("mealTime", selected[0] || "")}
                    multiSelect={false}
                />

                <View className="px-4 mb-6">
                    <Text className="text-white text-lg font-bold mb-4">Customize Your Recipe</Text>

                    <View className="bg-zinc-800 rounded-xl p-4 mb-4 border border-zinc-700">
                        <Text className="text-white font-bold mb-2">Number of Servings</Text>
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                onPress={() => handleFilterChange("servings", Math.max(1, filters.servings - 1))}
                            >
                                <Ionicons name="remove" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text className="text-white text-xl font-bold">{filters.servings}</Text>
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                onPress={() => handleFilterChange("servings", Math.min(12, filters.servings + 1))}
                            >
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="bg-zinc-800 rounded-xl p-4 mb-4 border border-zinc-700">
                        <Text className="text-white font-bold mb-2">Max Cooking Time</Text>
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                onPress={() => handleFilterChange("cookingTime", Math.max(10, filters.cookingTime - 10))}
                            >
                                <Ionicons name="remove" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text className="text-white text-xl font-bold">{filters.cookingTime} min</Text>
                            <TouchableOpacity
                                className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center"
                                onPress={() => handleFilterChange("cookingTime", Math.min(180, filters.cookingTime + 10))}
                            >
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="bg-zinc-800 rounded-xl p-4 mb-4 border border-zinc-700">
                        <Text className="text-white font-bold mb-3">Difficulty Level</Text>
                        <View className="flex-row justify-between">
                            {["Any", "Easy", "Medium", "Hard"].map((difficulty) => (
                                <TouchableOpacity
                                    key={difficulty}
                                    className={`flex-1 py-2 mx-1 rounded-lg ${filters.difficulty === difficulty ? "bg-yellow-400" : "bg-zinc-700"
                                        }`}
                                    onPress={() => handleFilterChange("difficulty", difficulty)}
                                >
                                    <Text
                                        className={`text-center font-bold ${filters.difficulty === difficulty ? "text-black" : "text-white"
                                            }`}
                                    >
                                        {difficulty}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View className="px-4 mb-6">
                    <TouchableOpacity
                        className="rounded-xl overflow-hidden"
                        onPress={handleGenerateRecipes}
                        disabled={isGenerating}
                    >
                        <LinearGradient
                            colors={["#FBBF24", "#F97416"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 px-6"
                        >
                            <View className="flex-row items-center justify-center">
                                {isGenerating ? (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                                        <Text className="text-white text-lg font-bold ml-2">Generating Magic...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                                        <Text className="text-white text-lg font-bold ml-2">Generate AI Recipes</Text>
                                    </>
                                )}
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {generatedRecipes.length > 0 && (
                    <View className="px-4 mb-6">
                        <Text className="text-white text-xl font-bold mb-4">✨ AI Generated Recipes</Text>
                        {generatedRecipes.map((recipe) => (
                            <GeneratedRecipeCard key={recipe.id} recipe={recipe} onPress={() => handleRecipeSelect(recipe)} />
                        ))}
                    </View>
                )}
            </ScrollView>

            <IngredientSelector
                visible={showIngredientSelector}
                onClose={() => setShowIngredientSelector(false)}
                selectedIngredients={filters.ingredients}
                onIngredientsChange={(ingredients) => handleFilterChange("ingredients", ingredients)}
            />

            <IngredientSearchModal
                visible={showIngredientScanner}
                onClose={() => setShowIngredientScanner(false)}
                onIngredientsSelected={handleIngredientsDetected}
            />

            <VoiceControl
                visible={showVoiceControl}
                onClose={() => setShowVoiceControl(false)}
                onVoiceInput={handleVoiceGeneration}
            />

            <RecipeDetailModal
                visible={showRecipeDetail}
                recipe={selectedRecipe}
                onClose={() => setShowRecipeDetail(false)}
            />
        </View>
    )
}
