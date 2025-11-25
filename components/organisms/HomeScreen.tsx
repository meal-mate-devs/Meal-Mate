import { useAuthContext } from '@/context/authContext';
import { useLanguage } from '@/context/LanguageContext';
import * as chefService from '@/lib/api/chefService';
import { groceryService } from '@/lib/services/groceryService';
import { pantryService } from '@/lib/services/pantryService';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDietPlanningStore } from '../../hooks/useDietPlanningStore';
import { useFavoritesStore } from '../../hooks/useFavoritesStore';
import { useProfileStore } from '../../hooks/useProfileStore';
import Dialog from '../atoms/Dialog';
import HomeHeader from '../molecules/HomeHeader';
import ProfileSidebar from '../molecules/ProfileSidebar';

interface Recipe {
    id: string
    _id?: string
    title: string
    description: string
    image: string
    isPremium: boolean
    isPublished?: boolean
    difficulty: "Easy" | "Medium" | "Hard"
    cookTime: number
    prepTime: number
    servings: number
    rating: number
    averageRating?: number
    cuisine: string
    category: string
    creator?: string
    authorId?: string
    chefId?: string
    ingredients?: Array<{
        name: string
        amount: string
        unit: string
        notes?: string
    }>
    instructions?: Array<{
        step: number
        instruction: string
        duration?: number
        tips?: string
    }>
    nutrition?: {
        calories: number
        protein: number
        carbs: number
        fat: number
    }
    tips?: string[]
    substitutions?: Array<{
        original: string
        substitute: string
        ratio: string
        notes: string
    }>
}

const HomeScreen: React.FC = () => {
    const { t } = useLanguage();
    const insets = useSafeAreaInsets()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Animation state
    const progressAnimation = useRef(new Animated.Value(0)).current;

    // Profile and pantry/grocery data
    const { profile } = useAuthContext();
    const { profileData, subscribe } = useProfileStore();
    const { streakData, getTodayStats, todayCaloriesConsumed } = useDietPlanningStore();
    const [localUserData, setLocalUserData] = useState(profileData);
    const [pantryData, setPantryData] = useState({ active: 0, expiring: 0, expired: 0, total: 0 });
    const [groceryData, setGroceryData] = useState({ total: 0, pending: 0, purchased: 0, urgent: 0, overdue: 0 });
    const [pantryLoading, setPantryLoading] = useState(false);
    const [groceryLoading, setGroceryLoading] = useState(false);

    // Recipe data - Food Explorer style
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
    const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
    const [expandedRecipeData, setExpandedRecipeData] = useState<any>(null)
    const [isLoadingRecipeDetails, setIsLoadingRecipeDetails] = useState(false)

    // Favorites functionality
    const { addToFavorites, isFavorite, removeFromFavorites } = useFavoritesStore()

    // Dialogs
    const [showRecipeRatingDialog, setShowRecipeRatingDialog] = useState(false)
    const [showGeneralErrorDialog, setShowGeneralErrorDialog] = useState(false)
    const [generalErrorMessage, setGeneralErrorMessage] = useState('')
    const [showGeneralSuccessDialog, setShowGeneralSuccessDialog] = useState(false)
    const [generalSuccessMessage, setGeneralSuccessMessage] = useState('')
    const [showPremiumDialog, setShowPremiumDialog] = useState(false)

    // Refresh functionality
    const [refreshing, setRefreshing] = useState(false)
    useEffect(() => {
        const unsubscribe = subscribe((updatedData) => {
            setLocalUserData(updatedData);
        });
        setLocalUserData(profileData);
        return unsubscribe;
    }, [subscribe, profileData]);

    // Filter recipes by category
    const filteredRecipes = recipes.filter(recipe => recipe.rating === 0 || recipe.rating >= 3);

    const loadRecipes = async () => {
        setIsLoadingRecipes(true)
        try {
            const fetchedRecipes = await chefService.getPublishedRecipes()
            const normalizedRecipes = fetchedRecipes.map((r: any) => ({
                ...r,
                id: r._id || r.id,
                rating: r.averageRating || 0
            }))
            // Sort by createdAt in descending order (latest first)
            const sortedRecipes = normalizedRecipes.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setRecipes(sortedRecipes)
            console.log('✅ Loaded', sortedRecipes.length, 'recipes (sorted by latest)')
        } catch (error) {
            console.log('❌ Failed to load recipes:', error)
        } finally {
            setIsLoadingRecipes(false)
        }
    }

    // Preload or reset state when the screen is focused
    useFocusEffect(
        useCallback(() => {
            // Animate progress bar
            progressAnimation.setValue(0);
            Animated.timing(progressAnimation, {
                toValue: 1850 / 2400,
                duration: 1000,
                useNativeDriver: false,
            }).start();

            // Fetch data
            loadRecipes();
            fetchPantryData();
            fetchGroceryData();
        }, [])
    );

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleEditProfile = () => {
        if (!router) {
            console.log('Router not available');
            return;
        }
        try {
            router.push('/profile');
        } catch (error) {
            console.log('Navigation error:', error);
        }
    };

    const fetchPantryData = async () => {
        try {
            setPantryLoading(true);
            const response = await pantryService.getPantryItems();
            if (response.success) {
                setPantryData(response.counts);
            }
        } catch (error) {
            console.log('Error fetching pantry data:', error);
        } finally {
            setPantryLoading(false);
        }
    };

    const fetchGroceryData = async () => {
        try {
            setGroceryLoading(true);
            const response = await groceryService.getGroceryItems();
            if (response.success) {
                setGroceryData(response.counts);
            }
        } catch (error) {
            console.log('Error fetching grocery data:', error);
        } finally {
            setGroceryLoading(false);
        }
    };

    // Pull to refresh functionality
    const onRefresh = async () => {
        setRefreshing(true);
        await loadRecipes();
        await fetchPantryData();
        await fetchGroceryData();
        setRefreshing(false);
    };

    // Handle viewing a recipe - fetch full details
    const handleViewRecipe = async (recipe: Recipe) => {
        try {
            setIsLoadingRecipeDetails(true)
            const recipeId = recipe.id || recipe._id
            if (!recipeId) {
                setGeneralErrorMessage(t('home.recipeIdMissing'))
                setShowGeneralErrorDialog(true)
                return
            }

            console.log('👁️ Fetching recipe details:', recipeId)
            const fullRecipe = await chefService.getRecipeById(recipeId)

            // Check if premium recipe and user is not pro (but allow author to view)
            const isPro = profile?.isPro && profile?.subscriptionStatus === 'active';
            const isAuthor = (fullRecipe as any).userId?.firebaseUid === profile?.firebaseUid;
            console.log('🔐 Premium Check:', { isPremium: fullRecipe.isPremium, isPro, isAuthor, recipeUserFirebaseUid: (fullRecipe as any).userId?.firebaseUid, userFirebaseUid: profile?.firebaseUid })

            if (fullRecipe.isPremium && !isPro && !isAuthor) {
                setShowPremiumDialog(true)
                setIsLoadingRecipeDetails(false)
                return
            }

            setExpandedRecipeId(recipeId)
            console.log('✅ Full recipe fetched:', fullRecipe.title)
            setExpandedRecipeData(fullRecipe)
        } catch (error: any) {
            console.log('❌ Failed to fetch recipe details:', error)
            setExpandedRecipeId(null)
            setGeneralErrorMessage(t('home.failedToLoadRecipeDetails'))
            setShowGeneralErrorDialog(true)
        } finally {
            setIsLoadingRecipeDetails(false)
        }
    }

    // Handle Start Cooking
    const handleStartCooking = (recipe: any) => {
        if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
            setGeneralErrorMessage(t('home.noInstructionsAvailable'))
            setShowGeneralErrorDialog(true)
            return
        }

        setExpandedRecipeId(null)
        setExpandedRecipeData(null)

        try {
            router.push({
                pathname: '/recipe/cooking' as any,
                params: {
                    recipe: JSON.stringify(recipe)
                }
            })
        } catch (error) {
            console.log('Navigation error:', error);
        }
    }

    // Handle Share Recipe
    const handleShareRecipe = async (recipe: any): Promise<void> => {
        let recipeText = `🍽️ ${recipe.title}\n\n`
        recipeText += `📝 ${recipe.description || 'Delicious recipe from Meal Mate'}\n\n`

        recipeText += `⏱️ Prep: ${recipe.prepTime}m | Cook: ${recipe.cookTime}m | Total: ${recipe.prepTime + recipe.cookTime}m\n`
        recipeText += `🍽️ Servings: ${recipe.servings} | Difficulty: ${recipe.difficulty} | Cuisine: ${recipe.cuisine}\n\n`

        if (recipe.nutrition) {
            recipeText += `📊 Nutrition (per serving):\n`
            recipeText += `• Calories: ${recipe.nutrition.calories}\n`
            recipeText += `• Protein: ${recipe.nutrition.protein}g\n`
            recipeText += `• Carbs: ${recipe.nutrition.carbs}g\n`
            recipeText += `• Fat: ${recipe.nutrition.fat}g\n\n`
        }

        if (recipe.ingredients) {
            recipeText += `🛒 Ingredients:\n`
            recipe.ingredients.forEach((ingredient: any, index: number) => {
                recipeText += `${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
                if (ingredient.notes) {
                    recipeText += ` (${ingredient.notes})`
                }
                recipeText += `\n`
            })
            recipeText += `\n`
        }

        if (recipe.instructions) {
            recipeText += `👨‍🍳 Instructions:\n`
            recipe.instructions.forEach((instruction: any) => {
                recipeText += `${instruction.step}. ${instruction.instruction}`
                if (instruction.duration) {
                    recipeText += ` (${instruction.duration} min)`
                }
                recipeText += `\n`
                if (instruction.tips) {
                    recipeText += `   💡 ${instruction.tips}\n`
                }
            })
            recipeText += `\n`
        }

        if (recipe.tips && recipe.tips.length > 0) {
            recipeText += `💡 Chef's Tips:\n`
            recipe.tips.forEach((tip: string) => {
                const cleanTip = tip.indexOf('\n') !== -1 ? tip.substring(0, tip.indexOf('\n')).trim() : tip
                recipeText += `• ${cleanTip}\n`
            })
            recipeText += `\n`
        }

        if (recipe.substitutions && recipe.substitutions.length > 0) {
            recipeText += `🔄 Ingredient Substitutions:\n`
            recipe.substitutions.forEach((sub: any) => {
                recipeText += `• ${sub.original} → ${sub.substitute} (Ratio: ${sub.ratio})\n`
                if (sub.notes) {
                    recipeText += `  ${sub.notes}\n`
                }
            })
            recipeText += `\n`
        }

        recipeText += `---\n${t('home.sharedFrom')}`

        try {
            await Share.share({
                title: recipe.title,
                message: recipeText,
            })
        } catch (error) {
            console.log('❌ Error sharing recipe:', error)
        }
    }

    // Handle Toggle Favorite
    const handleToggleFavoriteRecipe = async () => {
        if (!expandedRecipeData) return

        const recipeId = expandedRecipeData._id || expandedRecipeData.id
        const isCurrentlyFavorite = isFavorite(recipeId)

        if (isCurrentlyFavorite) {
            // Remove from favorites
            const success = await removeFromFavorites(recipeId)
            if (success) {
                setGeneralSuccessMessage(t('home.recipeRemovedFromFavorites'))
                setShowGeneralSuccessDialog(true)
            } else {
                setGeneralErrorMessage(t('home.failedToRemoveFromFavorites'))
                setShowGeneralErrorDialog(true)
            }
        } else {
            // Add to favorites - mold the schema to match FavoriteRecipe
            const success = await addToFavorites({
                recipeId: recipeId,
                title: expandedRecipeData.title,
                description: expandedRecipeData.description || '',
                image: expandedRecipeData.image?.url || expandedRecipeData.image || '',
                cookTime: expandedRecipeData.cookTime || 0,
                prepTime: expandedRecipeData.prepTime || 0,
                servings: expandedRecipeData.servings || 1,
                difficulty: (expandedRecipeData.difficulty || 'Easy') as 'Easy' | 'Medium' | 'Hard',
                cuisine: expandedRecipeData.cuisine || 'General',
                category: expandedRecipeData.category || 'Other',
                creator: expandedRecipeData.creator || 'Unknown Chef', // Include creator field
                ingredients: (expandedRecipeData.ingredients || []).map((ing: any) => ({
                    name: ing.name || '',
                    amount: ing.amount || '',
                    unit: ing.unit || '',
                    notes: ing.notes || ''
                })),
                instructions: (expandedRecipeData.instructions || []).map((inst: any) => ({
                    step: inst.step || 0,
                    instruction: inst.instruction || '',
                    duration: inst.duration || 0,
                    tips: inst.tips || ''
                })),
                nutritionInfo: {
                    calories: expandedRecipeData.nutrition?.calories || expandedRecipeData.nutritionInfo?.calories || 0,
                    protein: expandedRecipeData.nutrition?.protein || expandedRecipeData.nutritionInfo?.protein || 0,
                    carbs: expandedRecipeData.nutrition?.carbs || expandedRecipeData.nutritionInfo?.carbs || 0,
                    fat: expandedRecipeData.nutrition?.fat || expandedRecipeData.nutritionInfo?.fat || 0,
                    fiber: expandedRecipeData.nutrition?.fiber || expandedRecipeData.nutritionInfo?.fiber || 0,
                    sugar: expandedRecipeData.nutrition?.sugar || expandedRecipeData.nutritionInfo?.sugar || 0,
                    sodium: expandedRecipeData.nutrition?.sodium || expandedRecipeData.nutritionInfo?.sodium || 0
                },
                tips: expandedRecipeData.tips || [],
                substitutions: expandedRecipeData.substitutions || []
            })

            if (success) {
                setGeneralSuccessMessage(t('home.recipeAddedToFavorites'))
                setShowGeneralSuccessDialog(true)
            } else {
                setGeneralErrorMessage(t('home.failedToAddToFavorites'))
                setShowGeneralErrorDialog(true)
            }
        }
    }

    const getImageUrl = (image: any): string => {
        if (typeof image === 'string') return image;
        if (image?.url) return image.url;
        if (image?.uri) return image.uri;
        return 'https://via.placeholder.com/400x200?text=No+Image';
    };

    return (
        <LinearGradient
            colors={["#09090b", "#18181b"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <StatusBar barStyle="light-content" />

                {/* Header */}
                <View style={{ paddingTop: 30 }}>
                    <HomeHeader
                        onSidebarPress={toggleSidebar}
                        onProfilePress={handleEditProfile}
                    />
                </View>

                {/* Stats Container */}
                <View className="px-4 mt-1 mb-3">
                    <View className="rounded-3xl p-2 shadow-lg bg-zinc-800" style={{ borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                        <View className="flex-row items-center justify-between ml-6 mr-6">
                            <View className="items-center">
                                <TouchableOpacity
                                    onPress={() => {
                                        try {
                                            router.push('/recipe/pantry');
                                        } catch (error) {
                                            console.log('Navigation error:', error);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    className="items-center"
                                >
                                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                                        <Ionicons name="basket-outline" size={16} color="#22C55E" />
                                    </View>
                                    <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{pantryData.total}</Text>
                                    <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>{t('home.pantry')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                            <View className="items-center">
                                <TouchableOpacity
                                    onPress={() => {
                                        try {
                                            router.push('/settings/grocery-list');
                                        } catch (error) {
                                            console.log('Navigation error:', error);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    className="items-center"
                                >
                                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                                        <Ionicons name="cart-outline" size={16} color="#3B82F6" />
                                    </View>
                                    <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{groceryData.total}</Text>
                                    <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>{t('home.grocery')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                            <View className="items-center">
                                <TouchableOpacity
                                    onPress={() => {
                                        try {
                                            router.push('/health');
                                        } catch (error) {
                                            console.log('Navigation error:', error);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    className="items-center"
                                >
                                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                                        <Ionicons name="fitness-outline" size={16} color="#F97316" />
                                    </View>
                                    <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{todayCaloriesConsumed}</Text>
                                    <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>{t('home.calories')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="w-px h-12" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

                            <View className="items-center">
                                <TouchableOpacity
                                    onPress={() => {
                                        try {
                                            router.push('/diet-plan');
                                        } catch (error) {
                                            console.log('Navigation error:', error);
                                        }
                                    }}
                                    activeOpacity={0.8}
                                    className="items-center"
                                >
                                    <View className="w-8 h-8 rounded-lg items-center justify-center mb-1 shadow-sm" style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)' }}>
                                        <Ionicons name="trophy-outline" size={16} color="#FACC15" />
                                    </View>
                                    <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{streakData.currentStreak}</Text>
                                    <Text className="text-xs font-medium" style={{ color: '#94A3B8' }}>{t('diet.streak')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recipes ScrollView - Food Explorer Style */}
                <ScrollView
                    className="flex-1 px-4"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={onRefresh}
                            tintColor="transparent"
                            colors={["transparent"]}
                            progressBackgroundColor="transparent"
                        />
                    }
                >
                    {isLoadingRecipes ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#FACC15" />
                            <Text className="text-gray-400 mt-4">{t('home.loadingRecipes')}</Text>
                        </View>
                    ) : filteredRecipes.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20">
                            <Ionicons name="restaurant-outline" size={64} color="#6B7280" />
                            <Text className="text-gray-400 mt-4 text-center">
                                {t('home.noRecipesAvailable')}
                            </Text>
                        </View>
                    ) : (
                        filteredRecipes.map((recipe) => (
                            <TouchableOpacity
                                key={recipe.id}
                                style={styles.managementCard}
                                onPress={() => handleViewRecipe(recipe)}
                                activeOpacity={0.7}
                            >
                                <Image source={{ uri: getImageUrl(recipe.image) }} style={styles.managementCardImage} />
                                <View style={styles.managementCardContent}>
                                    <View style={styles.managementCardHeader}>
                                        <Text style={styles.managementCardTitle}>{recipe.title}</Text>
                                        {recipe.isPremium && (
                                            <View style={styles.managementPremiumBadge}>
                                                <Ionicons name="diamond" size={12} color="#FACC15" />
                                                <Text style={styles.managementPremiumBadgeText}>{t('home.premium')}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.managementCardDescription} numberOfLines={2}>
                                        {recipe.description}
                                    </Text>

                                    <View style={styles.managementCardMeta}>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="time" size={14} color="#6B7280" />
                                            <Text style={styles.metaText}>{recipe.cookTime}m</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="star" size={14} color="#FACC15" />
                                            <Text style={styles.metaText}>{recipe.rating?.toFixed(1) || '0.0'}</Text>
                                        </View>
                                        {recipe.creator && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="person" size={14} color="#A78BFA" />
                                                <Text style={[styles.metaText, { color: '#A78BFA' }]}>{t('home.by')} {recipe.creator}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>

                {/* Expanded Recipe Modal */}
                {expandedRecipeId && expandedRecipeData && (
                    <View className="absolute inset-0 bg-zinc-900" style={{ zIndex: 1000 }}>
                        {/* Modal Header */}
                        <View
                            style={{
                                paddingTop: insets.top + 24,
                                paddingBottom: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: "rgba(255, 255, 255, 0.08)",
                            }}
                            className="px-6"
                        >
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={() => {
                                        setExpandedRecipeId(null)
                                        setExpandedRecipeData(null)
                                    }}
                                    className="w-10 h-10 rounded-full items-center justify-center"
                                    style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={22} color="#FACC15" />
                                </TouchableOpacity>

                                <Text className="text-white text-lg font-bold flex-1 text-center">
                                    {t('home.recipeDetails')}
                                </Text>

                                <View className="w-10" />
                            </View>
                        </View>

                        {/* Modal Content */}
                        <ScrollView
                            className="flex-1"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                        >
                            <View className="p-6">
                                {/* Recipe Header */}
                                <View className="mb-6">
                                    <Text className="text-white font-bold text-3xl mb-3 leading-tight tracking-tight">
                                        {expandedRecipeData.title}
                                    </Text>

                                    {/* Creator Name - Display who created this recipe */}
                                    {expandedRecipeData.creator && (
                                        <View className="mb-3">
                                            <View className="flex-row items-center">
                                                <Ionicons name="person-circle-outline" size={18} color="#A78BFA" />
                                                <Text className="text-purple-300 text-sm font-semibold ml-2">
                                                    by {expandedRecipeData.creator}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <Text className="text-gray-300 text-base mb-4 leading-relaxed">
                                        {expandedRecipeData.description || 'Delicious recipe from your collection'}
                                    </Text>

                                    {/* Rating Badge */}
                                    <View className="mb-4">
                                        <View className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-2 self-start">
                                            <View className="flex-row items-center">
                                                <Ionicons name="star" size={16} color="#FBBF24" />
                                                <Text className="text-amber-300 ml-2 text-sm font-bold">
                                                    {(expandedRecipeData.averageRating || 0).toFixed(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Recipe Stats */}
                                    <View className="flex-row flex-wrap">
                                        <View className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                                            <View className="flex-row items-center">
                                                <Ionicons name="time-outline" size={14} color="#10B981" />
                                                <Text className="text-emerald-300 ml-1 text-xs font-semibold">
                                                    {(expandedRecipeData.prepTime || 0) + (expandedRecipeData.cookTime || 0)} min
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                                            <View className="flex-row items-center">
                                                <Ionicons name="people-outline" size={14} color="#3B82F6" />
                                                <Text className="text-blue-300 ml-1 text-xs font-semibold">
                                                    {expandedRecipeData.servings || 1} servings
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 mb-2">
                                            <View className="flex-row items-center">
                                                <MaterialIcons name="signal-cellular-alt" size={14} color="#8B5CF6" />
                                                <Text className="text-purple-300 ml-1 text-xs font-semibold">
                                                    {expandedRecipeData.difficulty || 'Easy'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Share and Action Buttons - Food Explorer Mode */}
                                <View className="flex-row mb-6" style={{ gap: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => handleShareRecipe(expandedRecipeData)}
                                        className="bg-amber-500/15 border border-amber-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="share-outline" size={18} color="#FBBF24" />
                                        <Text className="text-amber-300 font-bold ml-2 text-sm tracking-wide">{t('home.share')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleToggleFavoriteRecipe}
                                        className={`${isFavorite(expandedRecipeData._id || expandedRecipeData.id) ? 'bg-pink-500/15 border-pink-500/40' : 'bg-purple-500/15 border-purple-500/40'} border rounded-xl py-3 flex-row items-center justify-center flex-1`}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={isFavorite(expandedRecipeData._id || expandedRecipeData.id) ? "heart" : "heart-outline"}
                                            size={18}
                                            color={isFavorite(expandedRecipeData._id || expandedRecipeData.id) ? "#EC4899" : "#A78BFA"}
                                        />
                                        <Text className={`${isFavorite(expandedRecipeData._id || expandedRecipeData.id) ? 'text-pink-300' : 'text-purple-300'} font-bold ml-2 text-sm tracking-wide`}>
                                            {isFavorite(expandedRecipeData._id || expandedRecipeData.id) ? t('home.saved') : t('home.favorite')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 📊 Enhanced Nutrition Section */}
                                {(expandedRecipeData.nutrition?.calories || expandedRecipeData.nutrition?.protein || expandedRecipeData.nutrition?.carbs || expandedRecipeData.nutrition?.fat) && (
                                    <View className="mb-6">
                                        <View className="flex-row items-center mb-4">
                                            <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                                            <Text className="text-white text-xl font-bold tracking-tight">{t('home.nutrition')}</Text>
                                            <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                                        </View>
                                        <View className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 shadow-lg">
                                            <View className="flex-row items-center justify-between">
                                                <View className="items-center flex-1">
                                                    <Text className="text-amber-400 text-xl font-bold mb-1">
                                                        {expandedRecipeData.nutrition?.calories || 0}
                                                    </Text>
                                                    <Text className="text-gray-300 text-xs tracking-wide font-semibold">{t('home.calories').toUpperCase()}</Text>
                                                </View>
                                                <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                                                <View className="items-center flex-1">
                                                    <Text className="text-emerald-400 text-xl font-bold mb-1">
                                                        {expandedRecipeData.nutrition?.protein || 0}g
                                                    </Text>
                                                    <Text className="text-gray-300 text-xs tracking-wide font-semibold">{t('home.protein').toUpperCase()}</Text>
                                                </View>
                                                <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                                                <View className="items-center flex-1">
                                                    <Text style={{ color: "#3B82F6" }} className="text-xl font-bold mb-1">
                                                        {expandedRecipeData.nutrition?.carbs || 0}g
                                                    </Text>
                                                    <Text className="text-gray-300 text-xs tracking-wide font-semibold">{t('home.carbs').toUpperCase()}</Text>
                                                </View>
                                                <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                                                <View className="items-center flex-1">
                                                    <Text style={{ color: "#F59E0B" }} className="text-xl font-bold mb-1">
                                                        {expandedRecipeData.nutrition?.fat || 0}g
                                                    </Text>
                                                    <Text className="text-gray-300 text-xs tracking-wide font-semibold">{t('home.fat').toUpperCase()}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* 🥕 Enhanced Ingredients Section */}
                                <View className="mb-6">
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                                        <Text className="text-white text-xl font-bold tracking-tight">{t('home.ingredients')}</Text>
                                        <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                                    </View>
                                    <View className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-3 shadow-xl">
                                        {expandedRecipeData.ingredients?.map((ingredient: any, index: number) => (
                                            <View
                                                key={`modal-ingredient-${expandedRecipeData.id}-${index}`}
                                                className={`py-2 ${index !== expandedRecipeData.ingredients.length - 1 ? "border-b border-zinc-600" : ""
                                                    }`}
                                            >
                                                <View className="flex-row items-start">
                                                    <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border-2 border-emerald-400/40 items-center justify-center mr-4 mt-0.5 shadow-lg">
                                                        <Text className="text-emerald-100 text-base font-bold">{index + 1}</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-white text-base leading-relaxed">
                                                            <Text className="font-bold">
                                                                {ingredient.amount} {ingredient.unit}
                                                            </Text>
                                                            <Text> {ingredient.name}</Text>
                                                        </Text>
                                                        {ingredient.notes && (
                                                            <Text className="text-gray-300 text-sm mt-2 leading-6 italic">{ingredient.notes}</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* 👨‍🍳 Enhanced Instructions Section */}
                                <View className="mb-6">
                                    <View className="flex-row items-center mb-5">
                                        <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                                        <Text className="text-white text-xl font-bold tracking-tight">{t('home.instructions')}</Text>
                                        <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                                    </View>
                                    <View className="space-y-4">
                                        {expandedRecipeData.instructions?.map((instruction: any, index: number) => (
                                            <View
                                                key={`modal-instruction-${expandedRecipeData.id}-${index}`}
                                                className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-6 shadow-xl"
                                                style={{ marginBottom: 16 }}
                                            >
                                                <View className="flex-row">
                                                    <View className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl items-center justify-center mr-4 shadow-xl border-2 border-amber-400/40">
                                                        <Text className="text-white font-bold text-xl">{instruction.step}</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-white text-base leading-7">{instruction.instruction}</Text>
                                                        {instruction.tips && (
                                                            <View className="bg-amber-500/10 border-2 border-amber-500/20 rounded-xl p-4 mt-3">
                                                                <View className="flex-row items-start">
                                                                    <View className="w-7 h-7 rounded-lg bg-amber-500/15 items-center justify-center mr-3">
                                                                        <Ionicons name="bulb-outline" size={14} color="#FCD34D" />
                                                                    </View>
                                                                    <Text className="text-amber-100 text-sm leading-6 flex-1">{instruction.tips}</Text>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Start Cooking Button */}
                                <TouchableOpacity
                                    onPress={() => handleStartCooking(expandedRecipeData)}
                                    className="rounded-xl py-4 flex-row items-center justify-center shadow-lg mb-6"
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={['#FACC15', '#F97316']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            borderRadius: 12,
                                        }}
                                    />
                                    <Ionicons name="flame" size={24} color="#FFFFFF" />
                                    <Text style={{ color: "#FFFFFF", fontWeight: "700", marginLeft: 12, fontSize: 18, letterSpacing: 0.5 }}>
                                        {t('home.startCooking')}
                                    </Text>
                                </TouchableOpacity>

                                {/* ⭐ Enhanced Chef's Tips */}
                                {expandedRecipeData.tips && expandedRecipeData.tips.length > 0 && (
                                    <View className="mb-6">
                                        <View className="flex-row items-center mb-5">
                                            <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                                            <Text className="text-white text-xl font-bold tracking-tight">{t('recipe.chefsTips')}</Text>
                                            <View className="flex-1 h-px ml-4" style={{ backgroundColor: "rgba(250, 204, 21, 0.2)" }} />
                                        </View>
                                        <View
                                            className="rounded-2xl p-6 shadow-xl"
                                            style={{
                                                backgroundColor: "rgba(250, 204, 21, 0.1)",
                                                borderWidth: 1,
                                                borderColor: "rgba(250, 204, 21, 0.3)"
                                            }}
                                        >
                                            {expandedRecipeData.tips.map((tip: string, index: number) => (
                                                <View
                                                    key={`modal-tip-${expandedRecipeData.id}-${index}`}
                                                    className={`flex-row items-start ${index !== expandedRecipeData.tips.length - 1 ? "mb-5 pb-5 border-b border-amber-400/30" : ""
                                                        }`}
                                                >
                                                    <View className="w-7 h-7 rounded-lg bg-amber-500/25 items-center justify-center mr-3 mt-0.5">
                                                        <Ionicons name="star" size={14} color="#FCD34D" />
                                                    </View>
                                                    <Text className="text-amber-100 text-base leading-7 flex-1">{tip}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* 🔄 Enhanced Substitutions */}
                                {expandedRecipeData.substitutions && expandedRecipeData.substitutions.length > 0 && (
                                    <View className="mb-6">
                                        <View className="flex-row items-center justify-between mb-5">
                                            <View className="flex-row items-center">
                                                <View className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
                                                <Text className="text-white text-xl font-bold tracking-tight">{t('home.substitutions')}</Text>
                                            </View>
                                            <View className="bg-blue-500/20 border-2 border-blue-500/40 px-4 py-2 rounded-full shadow-md">
                                                <Text className="text-blue-300 text-xs font-bold">
                                                    {expandedRecipeData.substitutions.length} {t('recipe.options')}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-5 shadow-xl">
                                            {expandedRecipeData.substitutions.map((sub: any, index: number) => (
                                                <View
                                                    key={`modal-substitution-${expandedRecipeData.id}-${index}`}
                                                    className={`${index !== expandedRecipeData.substitutions.length - 1 ? "pb-5 mb-5 border-b border-zinc-600" : ""
                                                        }`}
                                                >
                                                    <View className="flex-row items-center mb-3">
                                                        <View className="w-9 h-9 rounded-xl bg-blue-500/15 items-center justify-center mr-3">
                                                            <Ionicons name="swap-horizontal" size={18} color="#3b82f6" />
                                                        </View>
                                                        <Text className="text-zinc-100 font-bold text-base flex-1">
                                                            {sub.original} → {sub.substitute}
                                                        </Text>
                                                    </View>
                                                    <Text className="text-zinc-300 text-sm mb-2 ml-12">{t('recipe.ratio')}: {sub.ratio}</Text>
                                                    <Text className="text-zinc-200 text-sm leading-6 ml-12">{sub.notes}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}

                <ProfileSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onEditProfile={handleEditProfile}
                />

                {/* Dialogs */}
                <Dialog
                    visible={showGeneralErrorDialog}
                    type="error"
                    title="Error"
                    message={generalErrorMessage}
                    onClose={() => setShowGeneralErrorDialog(false)}
                    confirmText="OK"
                />

                <Dialog
                    visible={showGeneralSuccessDialog}
                    type="success"
                    title="Success"
                    message={generalSuccessMessage}
                    onClose={() => setShowGeneralSuccessDialog(false)}
                    confirmText="OK"
                />

                <Dialog
                    visible={showPremiumDialog}
                    type="warning"
                    title={t('home.premiumContent')}
                    message={t('home.premiumRecipeMessage')}
                    onClose={() => setShowPremiumDialog(false)}
                    onConfirm={() => {
                        setShowPremiumDialog(false)
                        try {
                            router.push('/settings/subscription')
                        } catch (error) {
                            console.log('Navigation error:', error)
                        }
                    }}
                    confirmText={t('home.upgradeToPro')}
                    cancelText={t('common.cancel')}
                    showCancelButton={true}
                />
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    managementCard: {
        backgroundColor: '#27272A',
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    managementCardImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    managementCardContent: {
        padding: 12,
    },
    managementCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    managementCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 8,
    },
    managementPremiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    managementPremiumBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FACC15',
    },
    managementCardDescription: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 8,
        lineHeight: 18,
    },
    managementCardMeta: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});

export default HomeScreen;