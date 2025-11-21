export interface FavoriteRecipe {
  id: string
  _id?: string
  userId: string
  recipeId: string
  title: string
  description: string
  image?: string
  cookTime: number
  prepTime: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisine: string
  category: string
  creator?: string
  ingredients: Array<{
    name: string
    amount: string
    unit: string
    notes?: string
  }>
  instructions: Array<{
    step: number
    instruction: string
    duration?: number
    tips?: string
  }>
  nutritionInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  tips: string[]
  substitutions: Array<{
    original: string
    substitute: string
    ratio: string
    notes?: string
  }>
  createdAt: string
  updatedAt: string
}

export interface FavoriteRecipeMinimal {
  recipeId: string
  title: string
  description: string
  cuisine: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cookTime: number
  prepTime: number
  servings: number
  nutritionInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface AddToFavoritesRequest {
  recipeId: string
  title: string
  description: string
  image?: string
  cookTime: number
  prepTime: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisine: string
  category: string
  creator?: string
  ingredients: Array<{
    name: string
    amount: string
    unit: string
    notes?: string
  }>
  instructions: Array<{
    step: number
    instruction: string
    duration?: number
    tips?: string
  }>
  nutritionInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  tips?: string[]
  substitutions?: Array<{
    original: string
    substitute: string
    ratio: string
    notes?: string
  }>
}

export interface FavoritesResponse {
  success: boolean
  data: {
    favorites: FavoriteRecipe[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  message?: string
}

export interface FavoriteActionResponse {
  success: boolean
  message: string
  data?: FavoriteRecipe
}

export interface IsFavoriteResponse {
  success: boolean
  data: {
    isFavorite: boolean
  }
}