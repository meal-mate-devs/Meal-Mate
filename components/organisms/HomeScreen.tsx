import * as chefService from '@/lib/api/chefService';
import { groceryService } from '@/lib/services/groceryService';
import { pantryService } from '@/lib/services/pantryService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
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
    const insets = useSafeAreaInsets()
    const [activeTab, setActiveTab] = useState<string>('All');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Animation state
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [cardsAnimatedOpacity] = useState(() => new Animated.Value(1));
    const [cardsAnimatedHeight] = useState(() => new Animated.Value(180));
    const progressAnimation = useRef(new Animated.Value(0)).current;
    
    // Profile and pantry/grocery data
    const { profileData, subscribe } = useProfileStore();
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

    // Track previous scroll position
    const prevScrollY = useRef(0);

    // Subscribe to profile updates
    useEffect(() => {
        const unsubscribe = subscribe((updatedData) => {
            setLocalUserData(updatedData);
        });
        setLocalUserData(profileData);
        return unsubscribe;
    }, [subscribe, profileData]);

    const tabs = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert'];

    // Filter recipes by category
    const filteredRecipes = recipes.filter(recipe =>
        activeTab === 'All' || recipe.category === activeTab
    );

    const loadRecipes = async () => {
        setIsLoadingRecipes(true)
        try {
            const fetchedRecipes = await chefService.getPublishedRecipes()
            const normalizedRecipes = fetchedRecipes.map((r: any) => ({
                ...r,
                id: r._id || r.id,
                rating: r.averageRating || 0
            }))
            setRecipes(normalizedRecipes)
            console.log('✅ Loaded', normalizedRecipes.length, 'recipes')
        } catch (error) {
            console.error('❌ Failed to load recipes:', error)
        } finally {
            setIsLoadingRecipes(false)
        }
    }

    // Preload or reset state when the screen is focused
    useFocusEffect(
        useCallback(() => {
            setActiveTab('All');
            
            // Animate progress bar
            progressAnimation.setValue(0);
            Animated.timing(progressAnimation, {
                toValue: 1850 / 2400,
                duration: 1000,
                useNativeDriver: false,
            }).start();

            // Reset scroll animations
            cardsAnimatedOpacity.setValue(1);
            cardsAnimatedHeight.setValue(180);
            setIsScrolledUp(false);

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
        router.push('/profile');
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

    // Handle viewing a recipe - fetch full details
    const handleViewRecipe = async (recipe: Recipe) => {
        try {
            setIsLoadingRecipeDetails(true)
            const recipeId = recipe.id || recipe._id
            setExpandedRecipeId(recipeId)
            
            console.log('👁️ Fetching recipe details:', recipeId)
            const fullRecipe = await chefService.getRecipeById(recipeId!)
            
            console.log('✅ Full recipe fetched:', fullRecipe.title)
            setExpandedRecipeData(fullRecipe)
        } catch (error: any) {
            console.log('❌ Failed to fetch recipe details:', error)
            setExpandedRecipeId(null)
            setGeneralErrorMessage('Failed to load recipe details. Please try again.')
            setShowGeneralErrorDialog(true)
        } finally {
            setIsLoadingRecipeDetails(false)
        }
    }

    // Handle Start Cooking
    const handleStartCooking = (recipe: any) => {
        if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
            setGeneralErrorMessage('This recipe has no cooking instructions available.')
            setShowGeneralErrorDialog(true)
            return
        }
        
        setExpandedRecipeId(null)
        setExpandedRecipeData(null)
        
        router.push({
            pathname: '/recipe/cooking' as any,
            params: {
                recipe: JSON.stringify(recipe)
            }
        })
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

        recipeText += `---\nShared from Meal Mate App 🍳`

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
            const success = await removeFromFavorites(recipeId)
            if (success) {
                setGeneralSuccessMessage('Recipe removed from favorites')
                setShowGeneralSuccessDialog(true)
            }
        } else {
            // Mold the recipe data to match FavoriteRecipe schema
            const favoriteData = {
                recipeId: recipeId,
                title: expandedRecipeData.title,
                description: expandedRecipeData.description,
                image: expandedRecipeData.image,
                cookTime: expandedRecipeData.cookTime || 0,
                prepTime: expandedRecipeData.prepTime || 0,
                servings: expandedRecipeData.servings || 1,
                difficulty: expandedRecipeData.difficulty || 'Easy',
                cuisine: expandedRecipeData.cuisine || '',
                category: expandedRecipeData.category || '',
                creator: expandedRecipeData.creator || 'Unknown Chef',
                ingredients: expandedRecipeData.ingredients || [],
                instructions: expandedRecipeData.instructions || [],
                nutritionInfo: expandedRecipeData.nutrition || {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                },
                tips: expandedRecipeData.tips || [],
                substitutions: expandedRecipeData.substitutions || []
            }
            
            const success = await addToFavorites(favoriteData)
            if (success) {
                setGeneralSuccessMessage('Recipe added to favorites')
                setShowGeneralSuccessDialog(true)
            }
        }
    }

    const getImageUrl = (image: any): string => {
        if (typeof image === 'string') return image;
        if (image?.url) return image.url;
        if (image?.uri) return image.uri;
        return 'https://via.placeholder.com/400x200?text=No+Image';
    };

    // Track previous scroll position for direction detection
    const prevScrollY2 = useRef(0);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: false,
            listener: (event: any) => {
                const currentScrollY = event.nativeEvent.contentOffset.y;
                const isScrollingUp = currentScrollY > prevScrollY2.current;
                const isScrollingDown = currentScrollY < prevScrollY2.current;
                
                // Hide cards when scrolling up past threshold
                const shouldHideFromUp = isScrollingUp && currentScrollY > 50;
                // Show cards immediately when scrolling down (regardless of position)
                const shouldShowFromDown = isScrollingDown;
                
                const shouldHide = shouldHideFromUp && !shouldShowFromDown;
                
                if (shouldHide !== isScrolledUp) {
                    setIsScrolledUp(shouldHide);
                    
                    // Smooth animation for cards only with height collapse
                    Animated.parallel([
                        Animated.timing(cardsAnimatedOpacity, {
                            toValue: shouldHide ? 0 : 1,
                            duration: 800,
                            useNativeDriver: false,
                        }),
                        Animated.timing(cardsAnimatedHeight, {
                            toValue: shouldHide ? 0 : 180, // Approximate height of cards container
                            duration: 800,
                            useNativeDriver: false,
                        })
                    ]).start();
                }
                
                // Update previous scroll position
                prevScrollY2.current = currentScrollY;
            }
        }
    );

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

            {/* Animated Cards Container */}
            <Animated.View 
                className="px-4"
                style={{
                    opacity: cardsAnimatedOpacity,
                    height: cardsAnimatedHeight,
                    overflow: 'hidden'
                }}
            >
                <View className="py-4">
                {/* Health Card */}
                <TouchableOpacity
                    className="mb-3 w-full max-w-md"
                    onPress={() => router.push('/health')}
                    activeOpacity={0.8}
                >
                    <View className="rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-800">
                        <View className="p-2">
                            <View className="flex-row items-center justify-between mb-1">
                                <Text className="ml-1 text-white text-xs font-semibold">Calories</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-gray-400 text-xs mr-1">
                                        {Math.round((1850 / 2400) * 100)}%
                                    </Text>
                                    <Ionicons name="chevron-forward" size={8} color="#9CA3AF" />
                                </View>
                            </View>
                            <View className="ml-1 flex-row items-end mb-1">
                                <Text className="text-white text-lg font-bold">1,850</Text>
                                <Text className="text-gray-400 text-xs ml-1">/ 2,400</Text>
                            </View>
                            <View className="ml-1 bg-zinc-700/60 h-2 rounded-full overflow-hidden w-full">
                                <Animated.View
                                    className="h-2 rounded-full"
                                    style={{
                                        width: progressAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#FACC15', '#F97316']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="h-full w-full rounded-full"
                                    />
                                </Animated.View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Pantry and Grocery Cards */}
                <View className="flex-row justify-between mb-4">
                    <TouchableOpacity
                        className="flex-1 mr-2"
                        onPress={() => router.push('/recipe/pantry')}
                        activeOpacity={0.8}
                    >
                        <View className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-800">
                            <View className="p-3">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white text-sm font-semibold">Pantry</Text>
                                    <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                                </View>
                                <View className="flex-row h-2 rounded-full overflow-hidden bg-zinc-700/60 mb-2">
                                    {pantryData.total > 0 && (
                                        <>
                                            <View className="bg-green-500" style={{ width: `${(pantryData.active / pantryData.total) * 100}%`, height: '100%' }} />
                                            <View className="bg-yellow-500" style={{ width: `${(pantryData.expiring / pantryData.total) * 100}%`, height: '100%' }} />
                                            <View className="bg-red-500" style={{ width: `${(pantryData.expired / pantryData.total) * 100}%`, height: '100%' }} />
                                        </>
                                    )}
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-yellow-400 text-xs">{pantryData.expiring} Expiring</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 ml-2"
                        onPress={() => router.push('/settings/grocery-list')}
                        activeOpacity={0.8}
                    >
                        <View className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-800">
                            <View className="p-3">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-white text-sm font-semibold">Grocery</Text>
                                    <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                                </View>
                                <View className="flex-row h-2 rounded-full overflow-hidden bg-zinc-700/60 mb-2">
                                    {groceryData.total > 0 && (
                                        <>
                                            <View className="bg-blue-500" style={{ width: `${(groceryData.pending / groceryData.total) * 100}%`, height: '100%' }} />
                                            <View className="bg-green-500" style={{ width: `${(groceryData.purchased / groceryData.total) * 100}%`, height: '100%' }} />
                                        </>
                                    )}
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-blue-400 text-xs">{groceryData.pending} Pending</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                </View>
            </Animated.View>

            {/* Category Tabs */}
            <View className="px-4 py-2 bg-zinc-900">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`py-2 px-6 mr-2 rounded-full ${activeTab === tab ? 'overflow-hidden' : 'bg-zinc-800'}`}
                        >
                            {activeTab === tab ? (
                                <LinearGradient
                                    colors={['#FACC15', '#F97316']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="absolute inset-0"
                                />
                            ) : null}
                            <Text className={`${activeTab === tab ? 'text-white' : 'text-gray-400'} font-medium`}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Recipes ScrollView - Food Explorer Style */}
            <ScrollView 
                className="flex-1 px-4"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {isLoadingRecipes ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <ActivityIndicator size="large" color="#FACC15" />
                        <Text className="text-gray-400 mt-4">Loading recipes...</Text>
                    </View>
                ) : filteredRecipes.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Ionicons name="restaurant-outline" size={64} color="#6B7280" />
                        <Text className="text-gray-400 mt-4 text-center">
                            No recipes available in this category
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
                                            <Text style={styles.managementPremiumBadgeText}>Premium</Text>
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
                                            <Text style={[styles.metaText, { color: '#A78BFA' }]}>By: {recipe.creator}</Text>
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
                                Recipe Details
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
                                    <Text className="text-amber-300 font-bold ml-2 text-sm tracking-wide">Share</Text>
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
                                        {isFavorite(expandedRecipeData._id || expandedRecipeData.id) ? 'Saved' : 'Save'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* 📊 Enhanced Nutrition Section */}
                            {(expandedRecipeData.nutrition?.calories || expandedRecipeData.nutrition?.protein || expandedRecipeData.nutrition?.carbs || expandedRecipeData.nutrition?.fat) && (
                                <View className="mb-6">
                                    <View className="flex-row items-center mb-4">
                                        <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                                        <Text className="text-white text-xl font-bold tracking-tight">Nutrition</Text>
                                        <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                                    </View>
                                    <View className="bg-zinc-800 border-2 border-zinc-700 rounded-xl p-4 shadow-lg">
                                        <View className="flex-row items-center justify-between">
                                            <View className="items-center flex-1">
                                                <Text className="text-amber-400 text-xl font-bold mb-1">
                                                    {expandedRecipeData.nutrition?.calories || 0}
                                                </Text>
                                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">CALORIES</Text>
                                            </View>
                                            <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                                            <View className="items-center flex-1">
                                                <Text className="text-emerald-400 text-xl font-bold mb-1">
                                                    {expandedRecipeData.nutrition?.protein || 0}g
                                                </Text>
                                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">PROTEIN</Text>
                                            </View>
                                            <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                                            <View className="items-center flex-1">
                                                <Text style={{ color: "#3B82F6" }} className="text-xl font-bold mb-1">
                                                    {expandedRecipeData.nutrition?.carbs || 0}g
                                                </Text>
                                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">CARBS</Text>
                                            </View>
                                            <View style={{ width: 1, height: 48, backgroundColor: "rgba(255, 255, 255, 0.1)" }} />
                                            <View className="items-center flex-1">
                                                <Text style={{ color: "#F59E0B" }} className="text-xl font-bold mb-1">
                                                    {expandedRecipeData.nutrition?.fat || 0}g
                                                </Text>
                                                <Text className="text-gray-300 text-xs tracking-wide font-semibold">FAT</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* 🥕 Enhanced Ingredients Section */}
                            <View className="mb-6">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                                    <Text className="text-white text-xl font-bold tracking-tight">Ingredients</Text>
                                    <View className="flex-1 h-px bg-amber-500/20 ml-4" />
                                </View>
                                <View className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-3 shadow-xl">
                                    {expandedRecipeData.ingredients?.map((ingredient: any, index: number) => (
                                        <View
                                            key={`modal-ingredient-${expandedRecipeData.id}-${index}`}
                                            className={`py-2 ${
                                                index !== expandedRecipeData.ingredients.length - 1 ? "border-b border-zinc-600" : ""
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
                                    <Text className="text-white text-xl font-bold tracking-tight">Instructions</Text>
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
                                    Start Cooking
                                </Text>
                            </TouchableOpacity>

                            {/* ⭐ Enhanced Chef's Tips */}
                            {expandedRecipeData.tips && expandedRecipeData.tips.length > 0 && (
                                <View className="mb-6">
                                    <View className="flex-row items-center mb-5">
                                        <View className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: "#FACC15" }} />
                                        <Text className="text-white text-xl font-bold tracking-tight">Chef&apos;s Tips</Text>
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
                                                className={`flex-row items-start ${
                                                    index !== expandedRecipeData.tips.length - 1 ? "mb-5 pb-5 border-b border-amber-400/30" : ""
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
                                            <Text className="text-white text-xl font-bold tracking-tight">Substitutions</Text>
                                        </View>
                                        <View className="bg-blue-500/20 border-2 border-blue-500/40 px-4 py-2 rounded-full shadow-md">
                                            <Text className="text-blue-300 text-xs font-bold">
                                                {expandedRecipeData.substitutions.length} options
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="bg-zinc-800 border-4 border-zinc-700 rounded-2xl p-5 shadow-xl">
                                        {expandedRecipeData.substitutions.map((sub: any, index: number) => (
                                            <View
                                                key={`modal-substitution-${expandedRecipeData.id}-${index}`}
                                                className={`${
                                                    index !== expandedRecipeData.substitutions.length - 1 ? "pb-5 mb-5 border-b border-zinc-600" : ""
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
                                                <Text className="text-zinc-300 text-sm mb-2 ml-12">Ratio: {sub.ratio}</Text>
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
        </SafeAreaView>
    </LinearGradient>
    );
};

const styles = StyleSheet.create({
    managementCard: {
        backgroundColor: '#27272A',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    managementCardImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    managementCardContent: {
        padding: 16,
    },
    managementCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    managementCardTitle: {
        fontSize: 18,
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
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 12,
        lineHeight: 20,
    },
    managementCardMeta: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});

export default HomeScreen;