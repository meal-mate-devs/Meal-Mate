import { apiClient } from '../api/client';
import { GeneratedRecipe, RecipeFilters } from '../types/recipeGeneration';

export interface RecipeGenerationRequest {
  portionSize: number;
  cookingTimeLimit: number;
  dietaryToggle: boolean;
  dietaryPreferences: string[];
  cuisine: string;
  foodCategory: string;
  mealTime: string;
  recipeDifficulty: string;
  ingredientOverride?: string[];
  additionalRequirements?: string;
}

export interface RecipeGenerationResponse {
  success: boolean;
  recipe: GeneratedRecipe;
  pantryAnalysis: {
    fromPantry: string[];
    missing: string[];
    utilizationRate: number;
    matchPercentage?: number;
    availableFromPantry?: string[];
    needToPurchase?: string[];
    substitutionsUsed?: any[];
    totalRequired?: number;
  };
  missingIngredients: string[];
  substitutions: Array<{
    original: string;
    substitute: string;
    ratio: string;
    notes: string;
  }>;
  adaptationNotes: {
    difficulty?: string;
    cookingTime?: string;
    dietaryAdaptations?: string[];
    dietary?: string[];
    general?: string[];
    portion?: string[];
    timing?: string[];
  };
  settings: {
    portionSize: number;
    cookingTimeLimit: number;
    dietaryToggle: boolean;
    appliedDietaryPreferences: string[];
    cuisine: string;
    foodCategory: string;
    mealTime: string;
    recipeDifficulty: string;
  };
  sufficiencyWarning?: string;
  ingredientAnalysis?: {
    categoriesCovered: string[];
    isMinimallyViable: boolean;
    isWellRounded: boolean;
    totalAvailable: number;
  };
}

export interface RecipeGenerationError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      required?: number;
      available?: number;
      suggestions?: string[];
    };
  };
}

class RecipeGenerationService {
  async generateRecipe(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    try {
      console.log('🚀 Sending request to /recipe-generation/generate endpoint:', JSON.stringify(request, null, 2));
      console.log('📊 Request portionSize being sent:', request.portionSize);
      
      const response = await apiClient.post<RecipeGenerationResponse | RecipeGenerationError>(
        '/recipe-generation/generate',
        request
      );
            
      if (!response.success) {
        const errorResponse = response as RecipeGenerationError;
        throw new Error(errorResponse.error?.message || 'Recipe generation failed');
      }
      
      const successResponse = response as RecipeGenerationResponse;
      console.log('✅ Recipe servings in response:', successResponse.recipe.servings);
      console.log('⚙️ Settings portionSize in response:', successResponse.settings?.portionSize);
      
      return successResponse;
    } catch (error: any) {
      console.log('Recipe generation error:', error);
      throw new Error(error.message || 'Failed to generate recipe');
    }
  }

  /**
   * Generate multiple recipes based on pantry ingredients
   */
  async generatePantryBasedRecipes(
    pantryIngredients: string[],
    dietaryRestrictions: string[] = [],
    mealType: string = '',
    excludedIngredients: string[] = [],
    maxAdditionalIngredients: number = 2
  ): Promise<{ success: boolean; recipes: GeneratedRecipe[] }> {
    try {
      const response = await apiClient.post<{ success: boolean; recipes: GeneratedRecipe[] }>(
        '/recipe-generation/pantry-based',
        {
          pantryIngredients,
          dietaryRestrictions,
          mealType,
          excludedIngredients,
          maxAdditionalIngredients
        }
      );
      
      return response;
    } catch (error: any) {
      console.log('Pantry-based recipe generation error:', error);
      throw new Error(error.message || 'Failed to generate pantry-based recipes');
    }
  }

  /**
   * Generate recipes based on user preferences
   */
  async generatePreferenceBasedRecipes(
    preferences: {
      cuisines: string[];
      dietaryRestrictions: string[];
      cookingTime: number;
      difficulty: string;
      mealType: string;
    }
  ): Promise<{ success: boolean; recipes: GeneratedRecipe[] }> {
    try {
      const response = await apiClient.post<{ success: boolean; recipes: GeneratedRecipe[] }>(
        '/recipe-generation/preference-based',
        preferences
      );
      
      return response;
    } catch (error: any) {
      console.log('Preference-based recipe generation error:', error);
      throw new Error(error.message || 'Failed to generate preference-based recipes');
    }
  }

  /**
   * Get ingredient substitutions for a recipe
   */
  async getIngredientSubstitutions(
    ingredients: string[],
    dietaryRestrictions: string[] = []
  ): Promise<{ success: boolean; substitutions: Array<{ original: string; alternatives: string[] }> }> {
    try {
      const response = await apiClient.post<{ success: boolean; substitutions: Array<{ original: string; alternatives: string[] }> }>(
        '/recipe-generation/substitutions',
        {
          ingredients,
          dietaryRestrictions
        }
      );
      
      return response;
    } catch (error: any) {
      console.log('Ingredient substitutions error:', error);
      throw new Error(error.message || 'Failed to get ingredient substitutions');
    }
  }

  /**
   * Adjust recipe portions
   */
  async adjustRecipePortions(
    recipeId: string,
    originalServings: number,
    newServings: number
  ): Promise<{ success: boolean; adjustedRecipe: GeneratedRecipe }> {
    try {
      const response = await apiClient.post<{ success: boolean; adjustedRecipe: GeneratedRecipe }>(
        '/recipe-generation/adjust-portions',
        {
          recipeId,
          originalServings,
          newServings
        }
      );
      
      return response;
    } catch (error: any) {
      console.log('Recipe portion adjustment error:', error);
      throw new Error(error.message || 'Failed to adjust recipe portions');
    }
  }

  /**
   * Map frontend filters to backend request format
   */
  buildRecipeRequest(
    filters: RecipeFilters, 
    pantryIngredients: string[] = []
  ): RecipeGenerationRequest {
    return {
      portionSize: filters.servings,
      cookingTimeLimit: filters.cookingTime,
      dietaryToggle: filters.dietaryPreferences.length > 0,
      dietaryPreferences: filters.dietaryPreferences,
      cuisine: filters.cuisines[0] || '',
      foodCategory: filters.categories[0] || 'main course',
      mealTime: filters.mealTime,
      recipeDifficulty: filters.difficulty.toLowerCase(),
      ingredientOverride: filters.ingredients.length > 0 ? filters.ingredients : pantryIngredients
    };
  }

  /**
   * Validate recipe generation request
   */
  validateRequest(request: RecipeGenerationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.portionSize || request.portionSize <= 0 || request.portionSize > 12) {
      errors.push('Portion size must be between 1 and 12');
    }

    if (!request.cookingTimeLimit || request.cookingTimeLimit <= 0 || request.cookingTimeLimit > 300) {
      errors.push('Cooking time must be between 1 and 300 minutes');
    }

    if (!request.recipeDifficulty || !['easy', 'medium', 'hard', 'any'].includes(request.recipeDifficulty)) {
      errors.push('Recipe difficulty must be easy, medium, hard, or any');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const recipeGenerationService = new RecipeGenerationService();