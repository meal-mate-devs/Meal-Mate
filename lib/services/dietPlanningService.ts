import { apiClient } from '../api/client';

export interface DietPlanRequest {
    goalType: 'maintain' | 'lose' | 'gain';
    targetCalories: number;
    duration?: number; // days, default 7
    healthConditions?: string[];
    dietaryPreferences?: string[];
}

export interface Meal {
    mealId: string;
    name: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    completed: boolean;
    hasRecipe: boolean;
    recipeId: string | null;
    recipe: GeneratedRecipe | null;
}

export interface DailyPlan {
    date: string; // YYYY-MM-DD
    meals: Meal[];
    waterIntake: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
}

export interface DietPlan {
    _id: string;
    planId: string;
    user: string;
    goalType: 'maintain' | 'lose' | 'gain';
    targetCalories: number;
    macroTargets: {
        protein: number;
        carbs: number;
        fats: number;
    };
    dailyWaterTarget: number;
    healthConditions: string[];
    dietaryPreferences: string[];
    startDate: string;
    endDate: string;
    duration: number;
    dailyPlans: DailyPlan[];
    isActive: boolean;
    generatedBy: 'ai' | 'manual';
    generatedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface GeneratedRecipe {
    id: string;
    title: string;
    description: string;
    image: string;
    cookTime: number;
    prepTime: number;
    servings: number;
    difficulty: string;
    cuisine: string;
    category: string;
    ingredients: Array<{
        id: string;
        name: string;
        amount: string;
        unit: string;
        notes?: string;
    }>;
    instructions: Array<{
        id: string;
        step: number;
        instruction: string;
        duration?: number;
        tips?: string;
    }>;
    nutritionInfo: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        vitamins?: {
            vitaminC?: number;
            vitaminD?: number;
            vitaminB12?: number;
            vitaminA?: number;
            vitaminE?: number;
            vitaminK?: number;
        };
        minerals?: {
            calcium?: number;
            iron?: number;
            magnesium?: number;
            potassium?: number;
            zinc?: number;
            sodium?: number;
        };
    };
    tips: string[];
    substitutions: Array<{
        original: string;
        substitute: string;
        ratio: string;
        notes: string;
    }>;
}

export interface GenerateMealRecipeRequest {
    planId: string;
    date: string; // YYYY-MM-DD
    mealId: string;
}

export interface GenerateMealRecipeResponse {
    success: boolean;
    message: string;
    recipe: GeneratedRecipe;
    cached: boolean;
}

export interface UpdateMealStatusRequest {
    planId: string;
    date: string;
    mealId: string;
    completed: boolean;
}

export interface UpdateWaterIntakeRequest {
    planId: string;
    date: string;
    waterIntake: number;
}

class DietPlanningService {
    /**
     * Generate AI meal plan
     */
    async generateAIMealPlan(request: DietPlanRequest): Promise<{ success: boolean; plan: DietPlan; message: string }> {
        try {
            const response = await apiClient.post<{ success: boolean; plan: DietPlan; message: string }>(
                '/diet-planning/generate',
                request,
                true,
                60000 // 60 second timeout
            );

            return response;
        } catch (error: any) {
            console.log('Diet plan generation error:', error);
            throw new Error(error.message || 'Failed to generate diet plan');
        }
    }

    /**
     * Get active diet plan
     */
    async getActivePlan(): Promise<{ success: boolean; plan: DietPlan }> {
        try {
            const response = await apiClient.get<{ success: boolean; plan: DietPlan }>(
                '/diet-planning/active',
                true,
                30000 // 30 second timeout
            );

            return response;
        } catch (error: any) {
            console.log('Get active plan error:', error);
            throw new Error(error.message || 'Failed to get active plan');
        }
    }

    /**
     * Generate recipe for a specific meal
     */
    async generateMealRecipe(request: GenerateMealRecipeRequest): Promise<GenerateMealRecipeResponse> {
        try {
            console.log('🍳 Requesting recipe for:', request);
            const response = await apiClient.post<GenerateMealRecipeResponse>(
                '/diet-planning/meal/recipe',
                request,
                true,
                90000 // 90 second timeout for AI recipe generation
            );

            console.log('✅ Recipe response received:', response.cached ? 'CACHED' : 'GENERATED');
            return response;
        } catch (error: any) {
            console.log('Meal recipe generation error:', error);
            throw new Error(error.message || 'Failed to generate meal recipe');
        }
    }

    /**
     * Update meal completion status
     */
    async updateMealStatus(request: UpdateMealStatusRequest): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiClient.patch<{ success: boolean; message: string }>(
                '/diet-planning/meal/status',
                request,
                true,
                10000 // 10 second timeout
            );

            return response;
        } catch (error: any) {
            console.log('Update meal status error:', error);
            throw new Error(error.message || 'Failed to update meal status');
        }
    }

    /**
     * Update water intake
     */
    async updateWaterIntake(request: UpdateWaterIntakeRequest): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiClient.patch<{ success: boolean; message: string }>(
                '/diet-planning/water',
                request,
                true,
                10000 // 10 second timeout
            );

            return response;
        } catch (error: any) {
            console.log('Update water intake error:', error);
            throw new Error(error.message || 'Failed to update water intake');
        }
    }

    /**
     * Delete diet plan
     */
    async deletePlan(planId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await apiClient.delete<{ success: boolean; message: string }>(
                `/diet-planning/${planId}`,
                true,
                10000 // 10 second timeout
            );

            return response;
        } catch (error: any) {
            console.log('Delete plan error:', error);
            throw new Error(error.message || 'Failed to delete plan');
        }
    }

    /**
     * Get today's plan from active plan
     */
    getTodayPlan(plan: DietPlan): DailyPlan | null {
        const today = new Date().toISOString().split('T')[0];
        return plan.dailyPlans.find(dayPlan => dayPlan.date === today) || null;
    }

    /**
     * Get meal by ID from a daily plan
     */
    getMealById(dailyPlan: DailyPlan, mealId: string): Meal | null {
        return dailyPlan.meals.find(meal => meal.mealId === mealId) || null;
    }

    /**
     * Calculate progress for a daily plan
     */
    calculateDayProgress(dailyPlan: DailyPlan): {
        completedMeals: number;
        totalMeals: number;
        percentage: number;
        consumedCalories: number;
        consumedProtein: number;
        consumedCarbs: number;
        consumedFats: number;
    } {
        const completedMeals = dailyPlan.meals.filter(meal => meal.completed);
        const totalMeals = dailyPlan.meals.length;

        const consumedCalories = completedMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const consumedProtein = completedMeals.reduce((sum, meal) => sum + meal.protein, 0);
        const consumedCarbs = completedMeals.reduce((sum, meal) => sum + meal.carbs, 0);
        const consumedFats = completedMeals.reduce((sum, meal) => sum + meal.fats, 0);

        return {
            completedMeals: completedMeals.length,
            totalMeals,
            percentage: totalMeals > 0 ? Math.round((completedMeals.length / totalMeals) * 100) : 0,
            consumedCalories,
            consumedProtein,
            consumedCarbs,
            consumedFats
        };
    }

    /**
     * Get plan statistics
     */
    getPlanStatistics(plan: DietPlan): {
        totalDays: number;
        daysCompleted: number;
        currentDay: number;
        daysRemaining: number;
        averageCompletion: number;
    } {
        const today = new Date();
        const startDate = new Date(plan.startDate);
        const endDate = new Date(plan.endDate);

        const totalDays = plan.duration;
        const currentDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysRemaining = Math.max(0, totalDays - currentDay + 1);

        // Calculate average completion
        const completionRates = plan.dailyPlans.map(dayPlan => {
            const progress = this.calculateDayProgress(dayPlan);
            return progress.percentage;
        });
        const averageCompletion = completionRates.length > 0
            ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
            : 0;

        return {
            totalDays,
            daysCompleted: Math.min(currentDay - 1, totalDays),
            currentDay: Math.min(currentDay, totalDays),
            daysRemaining,
            averageCompletion
        };
    }
}

export const dietPlanningService = new DietPlanningService();
