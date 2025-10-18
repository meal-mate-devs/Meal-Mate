import { favoritesService } from "@/lib/services/favoritesService";
import type { AddToFavoritesRequest, FavoriteRecipe } from "@/lib/types/favorites";
import { useCallback, useEffect, useState } from "react";

interface FavoritesStore {
  favorites: FavoriteRecipe[];
  isLoading: boolean;
  error: string | null;
  addToFavorites: (recipe: AddToFavoritesRequest) => Promise<boolean>;
  removeFromFavorites: (recipeId: string) => Promise<boolean>;
  updateFavorite: (recipeId: string, updateData: Partial<AddToFavoritesRequest>) => Promise<boolean>;
  isFavorite: (recipeId: string) => boolean;
  getFavorites: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

// Global store state
let globalFavorites: FavoriteRecipe[] = [];
let globalIsLoading = false;
let globalError: string | null = null;
let subscribers: (() => void)[] = [];
let hasInitialized = false; // Track if we've attempted initial load

// Subscribe to store changes
const subscribe = (callback: () => void) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
};

// Notify all subscribers of store changes
const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

// Update global state and notify subscribers
const updateGlobalState = (updates: Partial<{ favorites: FavoriteRecipe[], isLoading: boolean, error: string | null }>) => {
  if (updates.favorites !== undefined) globalFavorites = updates.favorites;
  if (updates.isLoading !== undefined) globalIsLoading = updates.isLoading;
  if (updates.error !== undefined) globalError = updates.error;
  notifySubscribers();
};

export const useFavoritesStore = (): FavoritesStore => {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>(globalFavorites);
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [error, setError] = useState<string | null>(globalError);

  // Subscribe to global state changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setFavorites(globalFavorites);
      setIsLoading(globalIsLoading);
      setError(globalError);
    });
    return unsubscribe;
  }, []);

  // Auto-load favorites on first hook usage
  useEffect(() => {
    if (!hasInitialized) {
      hasInitialized = true;
      updateGlobalState({ isLoading: true, error: null });
      
      // Add timeout wrapper for auto-load
      const loadWithTimeout = async () => {
        try {
          const response = await Promise.race([
            favoritesService.getFavorites(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout - please check your connection')), 12000)
            )
          ]) as any;
          
          if (response.success) {
            updateGlobalState({ favorites: response.data.favorites, isLoading: false });
          } else {
            updateGlobalState({ isLoading: false, error: response.message || 'Failed to get favorites' });
          }
        } catch (error) {
          console.log('❌ Auto-load getFavorites error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to get favorites';
          updateGlobalState({ isLoading: false, error: errorMessage });
        }
      };
      
      loadWithTimeout();
    }
  }, []);

  const addToFavorites = useCallback(async (recipe: AddToFavoritesRequest): Promise<boolean> => {
    try {
      updateGlobalState({ isLoading: true, error: null });
      
      const response = await favoritesService.addToFavorites(recipe);
      
      if (response.success && response.data) {
        const newFavorites = [...globalFavorites, response.data];
        updateGlobalState({ favorites: newFavorites, isLoading: false });
        return true;
      }
      
      updateGlobalState({ isLoading: false, error: response.message || 'Failed to add to favorites' });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to favorites';
      updateGlobalState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  const removeFromFavorites = useCallback(async (recipeId: string): Promise<boolean> => {
    try {
      updateGlobalState({ isLoading: true, error: null });
      
      const response = await favoritesService.removeFromFavorites(recipeId);
      
      if (response.success) {
        const newFavorites = globalFavorites.filter(fav => fav.recipeId !== recipeId);
        updateGlobalState({ favorites: newFavorites, isLoading: false });
        return true;
      }
      
      updateGlobalState({ isLoading: false, error: response.message || 'Failed to remove from favorites' });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from favorites';
      updateGlobalState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  const updateFavorite = useCallback(async (recipeId: string, updateData: Partial<AddToFavoritesRequest>): Promise<boolean> => {
    try {
      updateGlobalState({ isLoading: true, error: null });
      
      const response = await favoritesService.updateFavorite(recipeId, updateData);
      
      if (response.success) {
        const newFavorites = globalFavorites.map(fav => 
          fav.recipeId === recipeId ? { ...fav, ...updateData } : fav
        );
        updateGlobalState({ favorites: newFavorites, isLoading: false });
        return true;
      }
      
      updateGlobalState({ isLoading: false, error: response.message || 'Failed to update favorite' });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update favorite';
      updateGlobalState({ isLoading: false, error: errorMessage });
      return false;
    }
  }, []);

  const isFavorite = useCallback((recipeId: string): boolean => {
    return globalFavorites.some(fav => fav.recipeId === recipeId);
  }, []);

  const getFavorites = useCallback(async (): Promise<void> => {
    try {
      updateGlobalState({ isLoading: true, error: null });
      
      const response = await favoritesService.getFavorites();
      
      if (response.success) {
        updateGlobalState({ favorites: response.data.favorites, isLoading: false });
      } else {
        updateGlobalState({ isLoading: false, error: response.message || 'Failed to get favorites' });
        console.log('❌ getFavorites: Failed with message:', response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get favorites';
      console.log('❌ getFavorites: Exception caught:', error);
      updateGlobalState({ isLoading: false, error: errorMessage });
    }
  }, []);

  const refreshFavorites = useCallback(async (): Promise<void> => {
    await getFavorites();
  }, [getFavorites]);

  return {
    favorites,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    updateFavorite,
    isFavorite,
    getFavorites,
    refreshFavorites
  };
};