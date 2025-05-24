export interface Cuisine {
    id: string
    name: string
    icon: string
}

export interface FoodCategory {
    id: string
    name: string
    icon: string
}

export interface DietaryPreference {
    id: string
    name: string
    icon: string
}

export interface MealTime {
    id: string
    name: string
    icon: string
}

export interface Ingredient {
    id: string
    name: string
    category: string
    isAvailable?: boolean
}

export interface RecipeFilters {
    cuisines: string[]
    categories: string[]
    dietaryPreferences: string[]
    mealTime: string
    servings: number
    cookingTime: number // in minutes
    ingredients: string[]
    difficulty: "Easy" | "Medium" | "Hard" | "Any"
}

export interface GeneratedRecipe {
    id: string
    title: string
    description: string
    image: string
    cookTime: number
    prepTime: number
    servings: number
    difficulty: string
    cuisine: string
    category: string
    ingredients: RecipeIngredient[]
    instructions: RecipeInstruction[]
    nutritionInfo: NutritionInfo
    tips: string[]
    substitutions: IngredientSubstitution[]
}

export interface RecipeIngredient {
    id: string
    name: string
    amount: string
    unit: string
    notes?: string
}

export interface RecipeInstruction {
    id: string
    step: number
    instruction: string
    duration?: number
    temperature?: string
    tips?: string
}

export interface NutritionInfo {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
}

export interface IngredientSubstitution {
    original: string
    substitute: string
    ratio: string
    notes: string
}
