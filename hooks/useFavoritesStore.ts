"use client"

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from "react"

export interface FavoriteRecipe {
  id: string
  title: string
  description: string
  image?: string
  cookTime: number
  prepTime: number
  servings: number
  difficulty: string
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
  }
  tips: string[]
  substitutions?: Array<{
    original: string
    substitute: string
    ratio: string
    notes: string
  }>
  dateAdded: string
}

// Global state store
let globalFavorites: FavoriteRecipe[] = []
let subscribers: Array<(favorites: FavoriteRecipe[]) => void> = []

const FAVORITES_STORAGE_KEY = '@meal_mate_favorites'

export const useFavoritesStore = () => {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>(globalFavorites)

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
        if (stored) {
          const parsedFavorites = JSON.parse(stored)
          globalFavorites = parsedFavorites
          setFavorites(parsedFavorites)
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }

    loadFavorites()
  }, [])

  // Save favorites to AsyncStorage whenever globalFavorites changes
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(globalFavorites))
      } catch (error) {
        console.error('Error saving favorites:', error)
      }
    }

    saveFavorites()
  }, [])

  const subscribe = useCallback((callback: (favorites: FavoriteRecipe[]) => void) => {
    subscribers.push(callback)
    return () => {
      subscribers = subscribers.filter(sub => sub !== callback)
    }
  }, [])

  const addToFavorites = useCallback((recipe: Omit<FavoriteRecipe, 'dateAdded'>) => {
    const favoriteRecipe: FavoriteRecipe = {
      ...recipe,
      dateAdded: new Date().toISOString()
    }

    // Check if recipe already exists
    const existingIndex = globalFavorites.findIndex(fav => fav.id === recipe.id)
    if (existingIndex >= 0) {
      // Update existing recipe
      globalFavorites[existingIndex] = favoriteRecipe
    } else {
      // Add new recipe
      globalFavorites = [favoriteRecipe, ...globalFavorites]
    }

    setFavorites([...globalFavorites])
    subscribers.forEach(callback => callback(globalFavorites))
  }, [])

  const removeFromFavorites = useCallback((recipeId: string) => {
    globalFavorites = globalFavorites.filter(recipe => recipe.id !== recipeId)
    setFavorites([...globalFavorites])
    subscribers.forEach(callback => callback(globalFavorites))
  }, [])

  const isFavorite = useCallback((recipeId: string) => {
    return globalFavorites.some(recipe => recipe.id === recipeId)
  }, [])

  const clearAllFavorites = useCallback(() => {
    globalFavorites = []
    setFavorites([])
    subscribers.forEach(callback => callback(globalFavorites))
  }, [])

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearAllFavorites,
    subscribe
  }
}