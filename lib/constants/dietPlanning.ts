export type DietGoalType = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic';

export interface DietGoal {
    id: DietGoalType;
    name: string;
    icon: string;
    description: string;
    calories: number;
    color: string;
}

export const DIET_GOALS: DietGoal[] = [
    {
        id: "weight_loss",
        name: "Weight Loss",
        icon: "📉",
        description: "Calorie deficit plans",
        calories: 1800,
        color: "#3B82F6",
    },
    {
        id: "muscle_gain",
        name: "Muscle Gain",
        icon: "💪",
        description: "High protein plans",
        calories: 2800,
        color: "#EF4444",
    },
    {
        id: "maintenance",
        name: "Maintenance",
        icon: "⚖️",
        description: "Balanced nutrition",
        calories: 2200,
        color: "#10B981",
    },
    {
        id: "athletic",
        name: "Athletic Performance",
        icon: "🏃",
        description: "Endurance focused",
        calories: 2600,
        color: "#F59E0B",
    },
];

export const DEFAULT_WATER_TARGET = 8;
export const DEFAULT_MEALS_PER_DAY = 5;

export const getGoalById = (goalId: DietGoalType): DietGoal | undefined => {
    return DIET_GOALS.find(goal => goal.id === goalId);
};

export const getCalorieTarget = (goalId: DietGoalType): number => {
    const goal = getGoalById(goalId);
    return goal?.calories || 2200;
};
