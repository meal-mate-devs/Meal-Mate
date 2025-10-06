import { auth } from '@/lib/config/clientApp'
import type { FavoriteRecipe } from '@/lib/types/favorites'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.106:5000/api'

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

class FavoritesService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const token = await user.getIdToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  async addToFavorites(recipeData: AddToFavoritesRequest): Promise<FavoriteActionResponse> {
    try {
      const headers = await this.getAuthHeaders()
      
      console.log('🔍 Original recipe data received:', {
        hasRecipeId: !!recipeData.recipeId,
        recipeIdValue: recipeData.recipeId,
        title: recipeData.title,
        ingredientsCount: recipeData.ingredients?.length
      });
      
      // 🔧 PRODUCTION: Robust data validation and cleaning
      const cleanedData = {
        ...recipeData,
        // Ensure recipeId is present and not empty - CRITICAL for DB operations
        recipeId: recipeData.recipeId && recipeData.recipeId.trim() !== '' 
          ? recipeData.recipeId.trim() 
          : `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // Clean and validate ingredients - ensure all required fields
        ingredients: recipeData.ingredients
          .filter(ing => ing.name && ing.name.trim() !== '')
          .map(ing => ({
            name: ing.name.trim(),
            amount: (ing.amount && ing.amount.trim() !== '') ? ing.amount.trim() : '1',
            unit: (ing.unit && ing.unit.trim() !== '') ? ing.unit.trim() : 'piece',
            notes: ing.notes ? ing.notes.trim() : ''
          })),
        // Clean instructions with validation
        instructions: recipeData.instructions.map(inst => ({
          step: inst.step,
          instruction: inst.instruction ? inst.instruction.trim() : '',
          duration: inst.duration || 0,
          tips: inst.tips ? inst.tips.trim() : ''
        })),
        // Ensure required fields are not empty
        title: recipeData.title ? recipeData.title.trim() : 'Untitled Recipe',
        description: recipeData.description ? recipeData.description.trim() : '',
        cuisine: recipeData.cuisine ? recipeData.cuisine.trim() : 'International',
        category: recipeData.category ? recipeData.category.trim() : 'Main Course',
        // Ensure arrays exist
        tips: recipeData.tips || [],
        substitutions: recipeData.substitutions || []
      }
      
      console.log('🔄 Adding to favorites:', `${API_BASE_URL}/favorites`)
      console.log('📦 Cleaned request data:', JSON.stringify(cleanedData, null, 2))
      
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cleanedData)
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('❌ Server returned non-JSON response:', textResponse.substring(0, 500))
        throw new Error(`Server error: Expected JSON but got ${contentType}. Status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📨 Response data:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add recipe to favorites')
      }

      return data
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  async getFavorites(page = 1, limit = 20, search = ''): Promise<FavoritesResponse> {
    try {
      const headers = await this.getAuthHeaders()
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search
      })

      const response = await fetch(`${API_BASE_URL}/favorites?${queryParams}`, {
        method: 'GET',
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get favorites')
      }

      return data
    } catch (error) {
      console.error('Error getting favorites:', error)
      throw error
    }
  }

  async removeFromFavorites(recipeId: string): Promise<FavoriteActionResponse> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_BASE_URL}/favorites/${recipeId}`, {
        method: 'DELETE',
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove recipe from favorites')
      }

      return data
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  async isFavorite(recipeId: string): Promise<IsFavoriteResponse> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_BASE_URL}/favorites/check/${recipeId}`, {
        method: 'GET',
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to check favorite status')
      }

      return data
    } catch (error) {
      console.error('Error checking favorite status:', error)
      throw error
    }
  }

  async getFavoriteById(recipeId: string): Promise<{ success: boolean; data: FavoriteRecipe; message?: string }> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${API_BASE_URL}/favorites/${recipeId}`, {
        method: 'GET',
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get favorite recipe')
      }

      return data
    } catch (error) {
      console.error('Error getting favorite recipe:', error)
      throw error
    }
  }
}

export const favoritesService = new FavoritesService()