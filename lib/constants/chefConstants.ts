/**
 * Chef Module Constants
 * These constants are used for backend communication and should NEVER be translated.
 * Display translations are handled separately using the translation system.
 */

export const DIFFICULTY_LEVELS = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard'
} as const

export const SKILL_LEVELS = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced'
} as const

export const DURATION_UNITS = {
    MINUTES: 'minutes',
    HOURS: 'hours',
    DAYS: 'days',
    WEEKS: 'weeks',
    MONTHS: 'months'
} as const

export const RECIPE_CATEGORIES = [
    "Appetizers",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Desserts",
    "Snacks",
    "Beverages",
    "Salads",
    "Soups",
    "Main Course",
    "Side Dishes",
    "Baking",
    "Seafood",
    "Vegetarian",
    "Vegan",
    "Other"
] as const

export const COURSE_CATEGORIES = [
    "Baking",
    "Desi Cooking",
    "Knife Skills",
    "Healthy Cooking",
    "Continental",
    "Beginner Fundamentals",
    "Italian Cuisine",
    "Asian Fusion",
    "Desserts & Pastries",
    "Grilling & BBQ",
    "Vegan & Vegetarian",
    "Other"
] as const

export const REPORT_REASONS = [
    "Inappropriate Content",
    "Copyright Violation",
    "Repeated Content",
    "Misleading Information",
    "Spam or Scam",
    "Harassment"
] as const

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS]
export type SkillLevel = typeof SKILL_LEVELS[keyof typeof SKILL_LEVELS]
export type DurationUnit = typeof DURATION_UNITS[keyof typeof DURATION_UNITS]
export type RecipeCategory = typeof RECIPE_CATEGORIES[number]
export type CourseCategory = typeof COURSE_CATEGORIES[number]
export type ReportReason = typeof REPORT_REASONS[number]
