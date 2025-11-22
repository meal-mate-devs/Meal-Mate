/**
 * Translation Helper Functions
 * These functions map English backend values to translated UI strings
 */

type TranslationFunction = (key: string) => string

/**
 * Translate difficulty level from English constant to localized string
 * @param difficulty - English difficulty constant ("Easy", "Medium", "Hard")
 * @param t - Translation function
 * @returns Translated difficulty string
 */
export const getDifficultyTranslation = (
    difficulty: string | undefined,
    t: TranslationFunction
): string => {
    if (!difficulty) return ''

    const map: Record<string, string> = {
        'Easy': t('chef.easy'),
        'Medium': t('chef.medium'),
        'Hard': t('chef.hard')
    }
    return map[difficulty] || difficulty
}

/**
 * Translate skill level from English constant to localized string
 * @param level - English skill level constant ("Beginner", "Intermediate", "Advanced")
 * @param t - Translation function
 * @returns Translated skill level string
 */
export const getSkillLevelTranslation = (
    level: string | undefined,
    t: TranslationFunction
): string => {
    if (!level) return ''

    const map: Record<string, string> = {
        'Beginner': t('chef.beginner'),
        'Intermediate': t('chef.intermediate'),
        'Advanced': t('chef.advanced')
    }
    return map[level] || level
}

/**
 * Translate duration unit from English constant to localized string
 * @param unit - English duration unit constant ("minutes", "hours", "days", "weeks", "months")
 * @param t - Translation function
 * @returns Translated duration unit string
 */
export const getDurationUnitTranslation = (
    unit: string | undefined,
    t: TranslationFunction
): string => {
    if (!unit) return ''

    const map: Record<string, string> = {
        'minutes': t('chef.minutes'),
        'hours': t('chef.hours'),
        'days': t('chef.days'),
        'weeks': t('chef.weeks'),
        'months': t('chef.months')
    }
    return map[unit] || unit
}

/**
 * Translate report reason from English constant to localized string
 * @param reason - English report reason constant
 * @param t - Translation function
 * @returns Translated report reason string
 */
export const getReportReasonTranslation = (
    reason: string,
    t: TranslationFunction
): string => {
    const map: Record<string, string> = {
        'Inappropriate Content': t('chef.reportReasons.inappropriateContent'),
        'Copyright Violation': t('chef.reportReasons.copyrightViolation'),
        'Repeated Content': t('chef.reportReasons.repeatedContent'),
        'Misleading Information': t('chef.reportReasons.misleadingInfo'),
        'Spam or Scam': t('chef.reportReasons.spamOrScam'),
        'Harassment': t('chef.reportReasons.harassment')
    }
    return map[reason] || reason
}

/**
 * Translate expertise category from English constant to localized string
 * @param category - English expertise category constant
 * @param t - Translation function
 * @returns Translated expertise category string
 */
export const getExpertiseCategoryTranslation = (
    category: string | undefined,
    t: TranslationFunction
): string => {
    if (!category) return ''

    const map: Record<string, string> = {
        'Baking': t('chef.expertiseCategories.baking'),
        'Desi Cooking': t('chef.expertiseCategories.desiCooking'),
        'Knife Skills': t('chef.expertiseCategories.knifeSkills'),
        'Healthy Cooking': t('chef.expertiseCategories.healthyCooking'),
        'Continental': t('chef.expertiseCategories.continental'),
        'Beginner Fundamentals': t('chef.expertiseCategories.beginnerFundamentals'),
        'Italian Cuisine': t('chef.expertiseCategories.italianCuisine'),
        'Asian Fusion': t('chef.expertiseCategories.asianFusion'),
        'Desserts & Pastries': t('chef.expertiseCategories.dessertsAndPastries'),
        'Grilling & BBQ': t('chef.expertiseCategories.grillingAndBBQ'),
        'Vegan & Vegetarian': t('chef.expertiseCategories.veganAndVegetarian'),
        'Other': t('chef.expertiseCategories.other')
    }
    return map[category] || category
}
