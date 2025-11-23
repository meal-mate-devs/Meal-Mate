import { getCalorieTarget } from '@/lib/constants/dietPlanning';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface MealLog {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    time: string;
    completed: boolean;
    completedAt?: string;
    hasRecipe?: boolean; // Flag to indicate if recipe is available
    recipeId?: string;   // ID for fetching recipe from backend
}

export interface DailyLog {
    date: string;
    meals: MealLog[];
    waterIntake: number;
    totalCalories: number;
    targetCalories: number;
    goalsMetPercentage: number;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
}

interface DietPlanningStore {
    // User settings
    selectedGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic';
    dailyCalorieTarget: number;
    dailyWaterTarget: number;
    mealsPerDay: number;

    // Today's data
    todayDate: string;
    todayMeals: MealLog[];
    todayWaterIntake: number;
    todayCaloriesConsumed: number;

    // Historical data
    dailyLogs: Record<string, DailyLog>;
    streakData: StreakData;

    // Actions
    setGoal: (goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic') => Promise<void>;
    toggleMealCompletion: (mealId: string) => Promise<void>;
    addWater: () => Promise<void>;
    removeWater: () => Promise<void>;
    setWaterIntake: (intake: number) => Promise<void>;
    setTodayMeals: (meals: MealLog[]) => Promise<void>;
    getTodayStats: () => {
        mealsCompleted: number;
        totalMeals: number;
        caloriesRemaining: number;
        caloriesTarget: number;
        waterIntake: number;
        waterTarget: number;
    };
}

// Helper functions
const getToday = (): string => {
    return new Date().toISOString().split('T')[0];
};

const getDaysDifference = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Global state
let globalSelectedGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic' = 'muscle_gain';
let globalDailyCalorieTarget = 2800;
let globalDailyWaterTarget = 8;
let globalMealsPerDay = 5;
let globalTodayDate = getToday();
let globalTodayMeals: MealLog[] = [];
let globalTodayWaterIntake = 0;
let globalTodayCaloriesConsumed = 0;
let globalDailyLogs: Record<string, DailyLog> = {};
let globalStreakData: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
};

let subscribers: (() => void)[] = [];
let hasInitialized = false;

// Storage keys
const STORAGE_KEYS = {
    GOAL: '@diet_planning_goal',
    MEALS: '@diet_planning_today_meals',
    WATER: '@diet_planning_today_water',
    DAILY_LOGS: '@diet_planning_daily_logs',
    STREAK: '@diet_planning_streak',
};

// Subscribe to store changes
const subscribe = (callback: () => void) => {
    subscribers.push(callback);
    return () => {
        subscribers = subscribers.filter((sub) => sub !== callback);
    };
};

// Notify all subscribers
const notifySubscribers = () => {
    subscribers.forEach((callback) => callback());
};

// Save to AsyncStorage
const saveToStorage = async (key: string, data: any) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.log('Error saving to storage:', error);
    }
};

// Load from AsyncStorage
const loadFromStorage = async (key: string): Promise<any> => {
    try {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.log('Error loading from storage:', error);
        return null;
    }
};

// Initialize from storage
const initializeFromStorage = async () => {
    if (hasInitialized) return;
    hasInitialized = true;

    try {
        const [goal, meals, water, dailyLogs, streak] = await Promise.all([
            loadFromStorage(STORAGE_KEYS.GOAL),
            loadFromStorage(STORAGE_KEYS.MEALS),
            loadFromStorage(STORAGE_KEYS.WATER),
            loadFromStorage(STORAGE_KEYS.DAILY_LOGS),
            loadFromStorage(STORAGE_KEYS.STREAK),
        ]);

        if (goal) {
            globalSelectedGoal = goal;
            globalDailyCalorieTarget = getCalorieTarget(goal);
        }

        const today = getToday();
        const savedMealsData = meals || {};

        if (savedMealsData.date === today && savedMealsData.meals) {
            globalTodayMeals = savedMealsData.meals;
            globalTodayCaloriesConsumed = savedMealsData.meals
                .filter((m: MealLog) => m.completed)
                .reduce((sum: number, m: MealLog) => sum + m.calories, 0);
        }

        const savedWaterData = water || {};
        if (savedWaterData.date === today) {
            globalTodayWaterIntake = savedWaterData.intake || 0;
        }

        if (dailyLogs) {
            globalDailyLogs = dailyLogs;
        }

        if (streak) {
            globalStreakData = streak;
        }

        globalTodayDate = today;
        notifySubscribers();
    } catch (error) {
        console.log('Error initializing from storage:', error);
    }
};

// Calculate streak
const calculateStreak = () => {
    const logs = globalDailyLogs;
    const sortedDates = Object.keys(logs).sort().reverse();

    if (sortedDates.length === 0) {
        globalStreakData = {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: '',
        };
        return;
    }

    let currentStreak = 0;
    let longestStreak = 0;
    const today = getToday();

    // Calculate current streak
    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const log = logs[date];

        const goalsMet = log.goalsMetPercentage >= 60 || (log.totalCalories / log.targetCalories) * 100 >= 80;

        if (!goalsMet) {
            if (i === 0) currentStreak = 0;
            break;
        }

        const daysDiff = getDaysDifference(date, i === 0 ? today : sortedDates[i - 1]);

        if (daysDiff <= 1) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Calculate longest streak
    let consecutiveDays = 0;
    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const log = logs[date];
        const goalsMet = log.goalsMetPercentage >= 60 || (log.totalCalories / log.targetCalories) * 100 >= 80;

        if (goalsMet) {
            consecutiveDays++;
            if (consecutiveDays > longestStreak) {
                longestStreak = consecutiveDays;
            }
        } else {
            consecutiveDays = 0;
        }
    }

    globalStreakData = {
        currentStreak,
        longestStreak,
        lastActiveDate: sortedDates[0] || '',
    };

    saveToStorage(STORAGE_KEYS.STREAK, globalStreakData);
};

// Save daily log
const saveDailyLog = () => {
    const completedMeals = globalTodayMeals.filter((m) => m.completed).length;
    const totalMeals = globalTodayMeals.length;
    const goalsMetPercentage = totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0;

    const dailyLog: DailyLog = {
        date: globalTodayDate,
        meals: globalTodayMeals,
        waterIntake: globalTodayWaterIntake,
        totalCalories: globalTodayCaloriesConsumed,
        targetCalories: globalDailyCalorieTarget,
        goalsMetPercentage,
    };

    globalDailyLogs[globalTodayDate] = dailyLog;
    saveToStorage(STORAGE_KEYS.DAILY_LOGS, globalDailyLogs);
    calculateStreak();
};

// Hook
export const useDietPlanningStore = (): DietPlanningStore => {
    const [selectedGoal, setSelectedGoal] = useState(globalSelectedGoal);
    const [dailyCalorieTarget, setDailyCalorieTarget] = useState(globalDailyCalorieTarget);
    const [dailyWaterTarget, setDailyWaterTarget] = useState(globalDailyWaterTarget);
    const [mealsPerDay, setMealsPerDay] = useState(globalMealsPerDay);
    const [todayDate, setTodayDateState] = useState(globalTodayDate);
    const [todayMeals, setTodayMealsState] = useState(globalTodayMeals);
    const [todayWaterIntake, setTodayWaterIntake] = useState(globalTodayWaterIntake);
    const [todayCaloriesConsumed, setTodayCaloriesConsumed] = useState(globalTodayCaloriesConsumed);
    const [dailyLogs, setDailyLogs] = useState(globalDailyLogs);
    const [streakData, setStreakData] = useState(globalStreakData);

    // Subscribe to global state changes
    useEffect(() => {
        const unsubscribe = subscribe(() => {
            setSelectedGoal(globalSelectedGoal);
            setDailyCalorieTarget(globalDailyCalorieTarget);
            setDailyWaterTarget(globalDailyWaterTarget);
            setMealsPerDay(globalMealsPerDay);
            setTodayDateState(globalTodayDate);
            setTodayMealsState([...globalTodayMeals]);
            setTodayWaterIntake(globalTodayWaterIntake);
            setTodayCaloriesConsumed(globalTodayCaloriesConsumed);
            setDailyLogs({ ...globalDailyLogs });
            setStreakData({ ...globalStreakData });
        });
        return unsubscribe;
    }, []);

    // Initialize on first mount
    useEffect(() => {
        initializeFromStorage();
    }, []);

    const setGoal = useCallback(async (goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic') => {
        const calorieTarget = getCalorieTarget(goal);
        globalSelectedGoal = goal;
        globalDailyCalorieTarget = calorieTarget;
        await saveToStorage(STORAGE_KEYS.GOAL, goal);
        notifySubscribers();
    }, []);

    const toggleMealCompletion = useCallback(async (mealId: string) => {
        const today = getToday();

        if (globalTodayDate !== today) {
            saveDailyLog();
            globalTodayDate = today;
            globalTodayWaterIntake = 0;
            globalTodayCaloriesConsumed = 0;
        }

        globalTodayMeals = globalTodayMeals.map((meal) => {
            if (meal.id === mealId) {
                const isCompleting = !meal.completed;
                return {
                    ...meal,
                    completed: isCompleting,
                    completedAt: isCompleting ? new Date().toISOString() : undefined,
                };
            }
            return meal;
        });

        globalTodayCaloriesConsumed = globalTodayMeals
            .filter((m) => m.completed)
            .reduce((sum, m) => sum + m.calories, 0);

        await saveToStorage(STORAGE_KEYS.MEALS, {
            date: today,
            meals: globalTodayMeals,
        });

        notifySubscribers();
        saveDailyLog();
    }, []);

    const addWater = useCallback(async () => {
        const today = getToday();

        if (globalTodayDate !== today) {
            saveDailyLog();
            globalTodayDate = today;
            globalTodayWaterIntake = 0;
        }

        if (globalTodayWaterIntake < globalDailyWaterTarget) {
            globalTodayWaterIntake += 1;
            await saveToStorage(STORAGE_KEYS.WATER, {
                date: today,
                intake: globalTodayWaterIntake,
            });
            notifySubscribers();
            saveDailyLog();
        }
    }, []);

    const removeWater = useCallback(async () => {
        if (globalTodayWaterIntake > 0) {
            globalTodayWaterIntake -= 1;
            const today = getToday();
            await saveToStorage(STORAGE_KEYS.WATER, {
                date: today,
                intake: globalTodayWaterIntake,
            });
            notifySubscribers();
            saveDailyLog();
        }
    }, []);

    const setWaterIntake = useCallback(async (intake: number) => {
        const today = getToday();

        if (globalTodayDate !== today) {
            saveDailyLog();
            globalTodayDate = today;
            globalTodayWaterIntake = 0;
            globalTodayCaloriesConsumed = 0;
        }

        globalTodayWaterIntake = intake;
        await saveToStorage(STORAGE_KEYS.WATER, {
            date: today,
            intake: globalTodayWaterIntake,
        });
        notifySubscribers();
        saveDailyLog();
    }, []);

    const setTodayMeals = useCallback(async (meals: MealLog[]) => {
        const today = getToday();

        if (globalTodayDate !== today) {
            saveDailyLog();
            globalTodayDate = today;
            globalTodayWaterIntake = 0;
            globalTodayCaloriesConsumed = 0;
        }

        globalTodayMeals = meals;
        await saveToStorage(STORAGE_KEYS.MEALS, {
            date: today,
            meals: globalTodayMeals,
        });
        notifySubscribers();
    }, []);

    const getTodayStats = useCallback(() => {
        const completedMeals = globalTodayMeals.filter((m) => m.completed).length;
        const totalMeals = globalTodayMeals.length;
        const caloriesRemaining = globalDailyCalorieTarget - globalTodayCaloriesConsumed;

        return {
            mealsCompleted: completedMeals,
            totalMeals,
            caloriesRemaining: Math.max(0, caloriesRemaining),
            caloriesTarget: globalDailyCalorieTarget,
            waterIntake: globalTodayWaterIntake,
            waterTarget: globalDailyWaterTarget,
        };
    }, []);

    return {
        selectedGoal,
        dailyCalorieTarget,
        dailyWaterTarget,
        mealsPerDay,
        todayDate,
        todayMeals,
        todayWaterIntake,
        todayCaloriesConsumed,
        dailyLogs,
        streakData,
        setGoal,
        toggleMealCompletion,
        addWater,
        removeWater,
        setWaterIntake,
        setTodayMeals,
        getTodayStats,
    };
};
