"use client"

import { PantryItem, pantryService } from "@/lib/services/pantryService"
import type {
    GeneratedRecipe,
    RecipeFilters
} from "@/lib/types/recipeGeneration"
import { CUISINES, DIETARY_PREFERENCES, FOOD_CATEGORIES, MEAL_TIMES } from "@/lib/utils"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import React, { JSX, useEffect, useState } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import Dialog from "../../atoms/Dialog"
import IngredientSearchModal from "../../molecules/IngredientSearchModal"
import FilterSection from "./FilterSection"
import GeneratedRecipeCard from "./GeneratedRecipeCard"
import IngredientSelector from "./IngredientsSelector"
import RecipeDetailModal from "./RecipieDetailModel"
import VoiceControl from "./VoiceControl"


export default function RecipeGenerationScreen(): JSX.Element {
    const router = useRouter()
    const [filters, setFilters] = useState<RecipeFilters>({
        cuisines: [],
        categories: [],
        dietaryPreferences: [],
        mealTime: "",
        servings: 1,
        cookingTime: 20,
        ingredients: [],
        difficulty: "Any",
    })

    const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([])
    const [showIngredientSelector, setShowIngredientSelector] = useState<boolean>(false)
    const [showVoiceControl, setShowVoiceControl] = useState<boolean>(false)
    const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(null)
    const [showRecipeDetail, setShowRecipeDetail] = useState<boolean>(false)
    const [showIngredientScanner, setShowIngredientScanner] = useState<boolean>(false)
    const [scannedIngredients, setScannedIngredients] = useState<string[]>([])
    const [pantryIngredients, setPantryIngredients] = useState<string[]>([])
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
    const [isLoadingPantry, setIsLoadingPantry] = useState<boolean>(false)
    const [selectedPantryCategories, setSelectedPantryCategories] = useState<Set<string>>(new Set())

    // Dialog state variables
    const [showIngredientsAddedDialog, setShowIngredientsAddedDialog] = useState<boolean>(false)
    const [showSelectionRequiredDialog, setShowSelectionRequiredDialog] = useState<boolean>(false)
    const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false)
    const [dialogMessage, setDialogMessage] = useState<string>("")

    // Load pantry ingredients on component mount
    useEffect(() => {
        loadPantryIngredients()
    }, [])

    // Monitor ingredient changes to update dietary restrictions
    useEffect(() => {
        if (filters.ingredients.length > 0) {
            updatePantryCategories(filters.ingredients)
        }
    }, [filters.ingredients])

    const loadPantryIngredients = async () => {
        setIsLoadingPantry(true)
        try {
            // Load full pantry items for the ingredient selector (including expiring items)
            const pantryResponse = await pantryService.getPantryItems()
            const usableItems = pantryResponse.items.filter(item => 
                item.expiryStatus === 'active' || item.expiryStatus === 'expiring'
            )

            // Set full pantry items for the selector
            setPantryItems(usableItems)

            // Also get just ingredient names for recipe generation
            const ingredientNames = usableItems.map(item => item.name)
            setPantryIngredients(ingredientNames)
            
            console.log(`Loaded ${usableItems.length} pantry items for recipe generation (${pantryResponse.items.filter(item => item.expiryStatus === 'expiring').length} expiring)`)
        } catch (error) {
            console.log('Failed to load pantry ingredients:', error)
            // Don't show error alert, just continue with empty pantry
        } finally {
            setIsLoadingPantry(false)
        }
    }


    const handleFilterChange = (key: keyof RecipeFilters, value: any): void => {
        // Special handling for dietary preferences with smart restrictions
        if (key === 'dietaryPreferences') {
            const newPreferences = Array.isArray(value) ? value : []
            
            // Check for conflicts with selected pantry categories
            const filteredPreferences = newPreferences.filter(pref => {
                // Don't allow vegan/vegetarian if meat is selected (neither can eat meat)
                if ((pref === 'vegan' || pref === 'vegetarian') && selectedPantryCategories.has('meat')) {
                    return false
                }
                // Don't allow vegan if dairy is selected (vegetarians can eat dairy, vegans cannot)
                if (pref === 'vegan' && selectedPantryCategories.has('dairy')) {
                    return false
                }
                // Don't allow dairy-free if dairy is selected
                if (pref === 'dairy-free' && selectedPantryCategories.has('dairy')) {
                    return false
                }
                return true
            })
            
            setFilters((prev) => ({
                ...prev,
                [key]: filteredPreferences,
            }))
        } else {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
            }))
            
            // If ingredients are being updated, update pantry categories for dietary restrictions
            if (key === 'ingredients') {
                updatePantryCategories(value)
            }
        }
    }

    const handleIngredientsDetected = (ingredients: string[]): void => {
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return;
        }

        // Sanitize ingredients to ensure they are valid strings
        const sanitizedIngredients = ingredients
            .filter(ingredient => typeof ingredient === 'string' && ingredient.trim() !== '')
            .map(ingredient => ingredient.trim());

        if (sanitizedIngredients.length === 0) {
            return;
        }
        
        console.log("Selected ingredients:", sanitizedIngredients);
        
        // Update filters with unique ingredients (combine with existing ones)
        const uniqueIngredients = [...new Set([...filters.ingredients, ...sanitizedIngredients])];
        handleFilterChange("ingredients", uniqueIngredients);
        
        // Track scanned ingredients separately
        const uniqueScannedIngredients = [...new Set([...scannedIngredients, ...sanitizedIngredients])];
        setScannedIngredients(uniqueScannedIngredients);
        
        // Update pantry categories for dietary restrictions logic
        updatePantryCategories(uniqueIngredients);
        
        // Show a notification about added ingredients
        setDialogMessage(`Added ${sanitizedIngredients.length} ingredient${sanitizedIngredients.length > 1 ? 's' : ''} to your recipe.`)
        setShowIngredientsAddedDialog(true)
    }

    // Function to categorize ingredients and update dietary restrictions logic
    const updatePantryCategories = (ingredients: string[]) => {
        const categories = new Set<string>()
        
        // Map ingredients to their likely categories based on pantry items
        ingredients.forEach(ingredient => {
            const lowerIngredient = ingredient.toLowerCase()
            
            // Meat category detection (including seafood)
            if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
                lowerIngredient.includes('pork') || lowerIngredient.includes('lamb') || 
                lowerIngredient.includes('fish') || lowerIngredient.includes('salmon') ||
                lowerIngredient.includes('tuna') || lowerIngredient.includes('meat') ||
                lowerIngredient.includes('bacon') || lowerIngredient.includes('ham') ||
                lowerIngredient.includes('turkey') || lowerIngredient.includes('duck') ||
                lowerIngredient.includes('seafood') || lowerIngredient.includes('shrimp') ||
                lowerIngredient.includes('crab') || lowerIngredient.includes('lobster') ||
                lowerIngredient.includes('cod') || lowerIngredient.includes('mackerel')) {
                categories.add('meat')
            }
            
            // Dairy category detection
            if (lowerIngredient.includes('milk') || lowerIngredient.includes('cheese') || 
                lowerIngredient.includes('butter') || lowerIngredient.includes('cream') ||
                lowerIngredient.includes('yogurt') || lowerIngredient.includes('dairy') ||
                lowerIngredient.includes('mozzarella') || lowerIngredient.includes('cheddar') ||
                lowerIngredient.includes('parmesan') || lowerIngredient.includes('cottage cheese') ||
                lowerIngredient.includes('sour cream') || lowerIngredient.includes('heavy cream')) {
                categories.add('dairy')
            }
        })
        
        // Also check pantry items for categories
        pantryItems.forEach(item => {
            if (ingredients.includes(item.name)) {
                categories.add(item.category)
            }
        })
        
        setSelectedPantryCategories(categories)
        
        // Auto-adjust dietary preferences based on selected categories
        const currentDietary = new Set(filters.dietaryPreferences)
        
        // If meat is selected, remove both vegan and vegetarian options (neither can eat meat)
        if (categories.has('meat')) {
            currentDietary.delete('vegan')
            currentDietary.delete('vegetarian')
        }
        
        // If dairy is selected, only remove vegan option (vegetarians can eat dairy, vegans cannot)
        if (categories.has('dairy')) {
            currentDietary.delete('vegan')
            currentDietary.delete('dairy-free')
        }
        
        // Update dietary preferences if changes were made
        const newDietaryArray = Array.from(currentDietary)
        if (newDietaryArray.length !== filters.dietaryPreferences.length || 
            !newDietaryArray.every(pref => filters.dietaryPreferences.includes(pref))) {
            setFilters((prev) => ({
                ...prev,
                dietaryPreferences: newDietaryArray
            }))
        }
    }

    const handleGenerateRecipes = (): void => {
        // Validate that user has selected at least one cuisine or category
        if (filters.cuisines.length === 0 && filters.categories.length === 0) {
            setDialogMessage("Please select at least one cuisine or food category to generate recipes.")
            setShowSelectionRequiredDialog(true)
            return
        }

        // Check if we have ingredients (either from pantry or manual selection)
        const availableIngredients = filters.ingredients.length > 0 ? filters.ingredients : pantryIngredients
        if (availableIngredients.length === 0) {
            setDialogMessage("Please add ingredients to your pantry or select ingredients manually to generate recipes.")
            setShowErrorDialog(true)
            return
        }

        // Navigate immediately to response screen with the recipe data
        console.log('Starting recipe generation flow - navigating to response screen')
        
        // Pass filters and ingredients as route params
        const params = {
            cuisines: JSON.stringify(filters.cuisines),
            categories: JSON.stringify(filters.categories),
            dietaryPreferences: JSON.stringify(filters.dietaryPreferences),
            mealTime: filters.mealTime,
            servings: filters.servings.toString(),
            cookingTime: filters.cookingTime.toString(),
            ingredients: JSON.stringify(availableIngredients),
            difficulty: filters.difficulty,
        }
        
        router.push({
            pathname: '/(protected)/recipe/response',
            params
        })
    }

    const handleVoiceGeneration = (voiceInput: string): void => {
        console.log("Voice input:", voiceInput)
        setShowVoiceControl(false)
        // TODO: Parse voice input to set filters appropriately
        handleGenerateRecipes()
    }

    const handleRecipeSelect = (recipe: GeneratedRecipe): void => {
        setSelectedRecipe(recipe)
        setShowRecipeDetail(true)
    }

    // Dialog handlers
    const handleIngredientsAddedDialog = (action: string) => {
        setShowIngredientsAddedDialog(false)
        if (action === 'generate') {
            handleGenerateRecipes()
        }
    }

    const handleSelectionRequiredDialog = () => {
        setShowSelectionRequiredDialog(false)
    }

    const handleNoIngredientsDialog = (action: string) => {
        setShowErrorDialog(false)
        if (action === 'add') {
            setShowIngredientSelector(true)
        }
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
                            disabled={isLoadingPantry}
                        >
                            <Ionicons name="basket-outline" size={18} color="#FBBF24" />
                            <Text className="text-white ml-2 text-sm font-medium">
                                {isLoadingPantry ? "Loading..." : `My Pantry${pantryIngredients.length > 0 ? ` (${pantryIngredients.length})` : ""}`}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center bg-zinc-800 rounded-full px-4 py-3 mr-3 border border-zinc-700 min-w-[140px]"
                            onPress={() => router.push('/(protected)/recipe/favorites')}
                        >
                            <Ionicons name="heart-outline" size={18} color="#FBBF24" />
                            <Text className="text-white ml-2 text-sm font-medium">Favorites</Text>
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

                {/* Selected Pantry Ingredients */}
                {filters.ingredients.length > 0 && (
                    <View className="bg-zinc-800 rounded-xl p-4 mb-4 border border-zinc-700">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text className="text-green-400 text-lg font-bold ml-2">Selected Ingredients</Text>
                            <View className="bg-green-500 rounded-full px-2 py-1 ml-2">
                                <Text className="text-white text-xs font-bold">{filters.ingredients.length}</Text>
                            </View>
                        </View>
                        <View className="flex-row flex-wrap">
                            {filters.ingredients.map((ingredient, index) => {
                                const isScanned = scannedIngredients.includes(ingredient)
                                const ingredientLabel = typeof ingredient === 'string'
                                    ? ingredient.trim()
                                    : ''

                                if (!ingredientLabel) {
                                    return null
                                }

                                return (
                                    <TouchableOpacity
                                        key={`${ingredientLabel}-${index}`}
                                        onPress={() => {
                                            const newIngredients = filters.ingredients.filter(item => item !== ingredient)
                                            handleFilterChange("ingredients", newIngredients)
                                            // Also remove from scanned if it was scanned
                                            if (isScanned) {
                                                setScannedIngredients(prev => prev.filter(item => item !== ingredient))
                                            }
                                        }}
                                        className={`mr-2 mb-2 rounded-full px-3 py-2 items-center ${
                                            isScanned ? 'bg-purple-500 border border-purple-400' : 'bg-green-500 border border-green-400'
                                        }`}
                                    >
                                        <View className="flex-row items-center">
                                            {isScanned && (
                                                <Ionicons name="camera" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                                            )}
                                            <Text className="text-white text-sm font-medium">{ingredientLabel}</Text>
                                            <Ionicons name="close" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                                        </View>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </View>
                )}

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
                    disabledItems={Array.from(selectedPantryCategories).reduce((disabled: string[], category) => {
                        if (category === 'meat') {
                            disabled.push('vegan', 'vegetarian')
                        }
                        if (category === 'dairy') {
                            disabled.push('dairy-free')
                        }
                        return disabled
                    }, [])}
                />

                {/* Smart Dietary Restrictions Info */}
                {(selectedPantryCategories.has('meat') || selectedPantryCategories.has('dairy')) && (
                    <View className="px-4 mb-4">
                        <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                                <Text className="text-amber-500 font-bold ml-2">Smart Dietary Filtering</Text>
                            </View>
                            <Text className="text-amber-200 text-sm leading-relaxed">
                                {selectedPantryCategories.has('meat') && selectedPantryCategories.has('dairy') 
                                    ? "Vegan, vegetarian, and dairy-free options are unavailable due to selected meat and dairy ingredients."
                                    : selectedPantryCategories.has('meat')
                                    ? "Vegan and vegetarian options are unavailable due to selected meat ingredients."
                                    : "Dairy-free options are unavailable due to selected dairy ingredients."
                                }
                            </Text>
                        </View>
                    </View>
                )}

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
                    >
                        <LinearGradient
                            colors={["#FBBF24", "#F97416"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 px-6"
                        >
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                                <Text className="text-white text-lg font-bold ml-2">Generate AI Recipes</Text>
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
                pantryItems={pantryItems}
                isLoadingPantry={isLoadingPantry}
                showIngredientScanner={showIngredientScanner}
                setShowIngredientScanner={setShowIngredientScanner}
                scannedIngredients={scannedIngredients}
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

            <Dialog
                visible={showIngredientsAddedDialog}
                type="success"
                title="Ingredients Added!"
                message={dialogMessage}
                onClose={() => handleIngredientsAddedDialog('ok')}
                onConfirm={() => handleIngredientsAddedDialog('generate')}
                confirmText="Generate Recipes"
                cancelText="OK"
                showCancelButton={true}
            />

            <Dialog
                visible={showSelectionRequiredDialog}
                type="warning"
                title="Selection Required"
                message={dialogMessage}
                onClose={handleSelectionRequiredDialog}
                confirmText="OK"
                showCancelButton={false}
            />

            <Dialog
                visible={showErrorDialog}
                type="warning"
                title="No Ingredients Available"
                message={dialogMessage}
                onClose={() => handleNoIngredientsDialog('cancel')}
                onConfirm={() => handleNoIngredientsDialog('add')}
                confirmText="Add to Pantry"
                cancelText="Cancel"
                showCancelButton={true}
            />
        </View>
    )
}
