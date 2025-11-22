"use client"

import { useLanguage } from "@/context/LanguageContext"
import * as chefService from "@/lib/api/chefService"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import CustomDialog from "../atoms/CustomDialog"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface Recipe {
  id: string
  title: string
  description: string
  image: string
  isPremium: boolean
  isRestricted?: boolean
  isBanned?: boolean
  difficulty: "Easy" | "Medium" | "Hard"
  cookTime: string
  rating: number
  reviews?: number
}

interface Course {
  id: string
  title: string
  description: string
  duration?: string
  skillLevel: "Beginner" | "Intermediate" | "Advanced"
  category: string
  isPremium: boolean
  isRestricted?: boolean
  isBanned?: boolean
  image: string
  rating?: number
}

interface ChefProfileViewScreenProps {
  visible: boolean
  onClose: () => void
  chef: {
    id: string
    name: string
    avatar: string
    specialty: string
    rating: number
    subscribers: number
    isSubscribed: boolean
    bio?: string
    experience?: string
    recipes: Recipe[]
    courses: Course[]
    stats?: {
      freeRecipesCount: number
      premiumRecipesCount: number
      coursesCount: number
      totalStudents: number
      averageRating: number
      totalRatings: number
    }
  }
  onSubscribeToggle?: (chefId: string) => void
  onReport?: (chefId: string, reason: string, description: string) => void
  onRate?: (chefId: string, rating: number, feedback: string) => void
}

type ContentTab = "recipes" | "courses" | "restricted"

const ChefProfileViewScreen: React.FC<ChefProfileViewScreenProps> = ({
  visible,
  onClose,
  chef,
  onSubscribeToggle,
  onReport,
  onRate,
}) => {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<ContentTab>("recipes")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [userFeedback, setUserFeedback] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>(chef.recipes || [])
  const [courses, setCourses] = useState<Course[]>(chef.courses || [])
  const [isSubscribed, setIsSubscribed] = useState(chef.isSubscribed)
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)
  const [chefStats, setChefStats] = useState(chef.stats)
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [expandedRecipeData, setExpandedRecipeData] = useState<any>(null)
  const [expandedCourseData, setExpandedCourseData] = useState<any>(null)
  const [isLoadingRecipeDetails, setIsLoadingRecipeDetails] = useState(false)
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false)
  const { t } = useLanguage()

  // Recipe/Course specific report and rate dialogs
  const [showRecipeReportDialog, setShowRecipeReportDialog] = useState(false)
  const [showRecipeRatingDialog, setShowRecipeRatingDialog] = useState(false)
  const [showCourseReportDialog, setShowCourseReportDialog] = useState(false)
  const [showCourseRatingDialog, setShowCourseRatingDialog] = useState(false)
  const [recipeReportReason, setRecipeReportReason] = useState("")
  const [recipeReportDescription, setRecipeReportDescription] = useState("")
  const [recipeRating, setRecipeRating] = useState(0)
  const [recipeRatingFeedback, setRecipeRatingFeedback] = useState("")
  const [courseReportReason, setCourseReportReason] = useState("")
  const [courseReportDescription, setCourseReportDescription] = useState("")
  const [courseRating, setCourseRating] = useState(0)
  const [courseRatingFeedback, setCourseRatingFeedback] = useState("")

  // Expandable units and descriptions state
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  // Subscribe confirmation dialog
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false)
  const [subscribeAction, setSubscribeAction] = useState<'subscribe' | 'unsubscribe'>('subscribe')

  // Success and error dialogs
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Load recipes and courses from backend
  useEffect(() => {
    if (visible && chef.id) {
      loadChefProfile()
      loadChefContent()
      checkSubscription()
    }
  }, [visible, chef.id])

  // Handle hardware back button on Android
  useEffect(() => {
    if (!visible) return

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (expandedRecipeId || expandedCourseId) {
        // Close expanded view first
        setExpandedRecipeId(null)
        setExpandedRecipeData(null)
        setExpandedCourseId(null)
        setExpandedCourseData(null)
        return true
      } else {
        // Close the chef profile modal
        onClose()
        return true
      }
    })

    return () => backHandler.remove()
  }, [visible, expandedRecipeId, expandedCourseId, onClose])

  const checkSubscription = async () => {
    try {
      const { isSubscribed: subStatus } = await chefService.checkSubscriptionStatus(chef.id)
      setIsSubscribed(subStatus)
      setSubscriptionChecked(true)
    } catch (error) {
      console.log("Failed to check subscription:", error)
      setSubscriptionChecked(true)
    }
  }

  const loadChefProfile = async () => {
    try {
      console.log('📊 Loading fresh chef profile with stats:', chef.id)
      const freshChefData = await chefService.getChefById(chef.id)

      // Update chef stats with fresh data from backend using setState to trigger re-render
      if (freshChefData.stats) {
        setChefStats({
          freeRecipesCount: freshChefData.stats.freeRecipesCount || 0,
          premiumRecipesCount: freshChefData.stats.premiumRecipesCount || 0,
          coursesCount: freshChefData.stats.coursesCount || 0,
          totalStudents: freshChefData.stats.totalStudents || 0,
          averageRating: freshChefData.stats.averageRating || 0,
          totalRatings: freshChefData.stats.totalRatings || 0
        })
        console.log('✅ Chef stats updated:', freshChefData.stats)
      }
    } catch (error) {
      console.log('❌ Failed to load chef profile:', error)
    }
  }

  const loadChefContent = async () => {
    // Load recipes
    setIsLoadingRecipes(true)
    try {
      const { recipes: fetchedRecipes } = await chefService.getChefRecipes(chef.id, { limit: 50 })
      // Map _id to id if needed
      const mappedRecipes = fetchedRecipes.map((r: any) => ({
        ...r,
        id: r.id || r._id,
      }))
      setRecipes(mappedRecipes as any)
    } catch (error) {
      console.log("Failed to load recipes:", error)
    } finally {
      setIsLoadingRecipes(false)
    }

    // Load courses
    setIsLoadingCourses(true)
    try {
      const { courses: fetchedCourses } = await chefService.getChefCourses(chef.id, { limit: 50 })
      // Map _id to id if needed
      const mappedCourses = fetchedCourses.map((c: any) => ({
        ...c,
        id: c.id || c._id,
      }))
      setCourses(mappedCourses as any)
    } catch (error) {
      console.log("Failed to load courses:", error)
    } finally {
      setIsLoadingCourses(false)
    }
  }

  const reportReasons = [
    "Inappropriate Content",
    "Copyright Violation",
    "Repeated Content",
    "Misleading Information",
    "Spam or Scam",
    "Harassment",
  ]

  // Format error messages for better user experience
  const formatErrorMessage = (error: any): string => {
    // If error.message exists and contains "API Error:"
    if (error.message && typeof error.message === 'string') {
      // Try to extract the actual error message from API Error format
      const apiErrorMatch = error.message.match(/API Error: \d+ - (\{.*\})/);
      if (apiErrorMatch) {
        try {
          const errorData = JSON.parse(apiErrorMatch[1]);
          if (errorData.error) {
            return errorData.error;
          }
          if (errorData.message) {
            return errorData.message;
          }
        } catch (parseError) {
          console.log('Failed to parse error JSON:', parseError);
        }
      }

      // Return the original message if no parsing needed
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  const handleSubscribe = async () => {
    setIsSubscribing(true)
    try {
      if (isSubscribed) {
        // Unsubscribe
        await chefService.unsubscribeFromChef(chef.id)
        setIsSubscribed(false)
        chef.isSubscribed = false
        chef.subscribers = Math.max(0, chef.subscribers - 1)
        onSubscribeToggle?.(chef.id)
        // Reload chef profile to get fresh stats
        await loadChefProfile()
        loadChefContent()
      } else {
        // Subscribe
        await chefService.subscribeToChef(chef.id)
        setIsSubscribed(true)
        chef.isSubscribed = true
        chef.subscribers = chef.subscribers + 1
        onSubscribeToggle?.(chef.id)
        // Reload chef profile to get fresh stats
        await loadChefProfile()
        loadChefContent()
      }
    } catch (error: any) {
      console.log('Subscribe error:', error)
      const formattedError = formatErrorMessage(error)
      setErrorMessage(formattedError || `Failed to ${isSubscribed ? 'unsubscribe from' : 'subscribe to'} chef. Please try again.`)
      setShowErrorDialog(true)
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSubmitReport = async () => {
    const finalReason = customReason.trim() || reportReason
    if (!finalReason) {
      setErrorMessage('Please select a reason or describe your concern')
      setShowErrorDialog(true)
      return
    }

    setIsReporting(true)
    try {
      await chefService.reportChef(chef.id, finalReason, reportDescription)
      setShowReportDialog(false)
      setReportReason("")
      setReportDescription("")
      setCustomReason("")
      setSuccessMessage('Chef reported successfully. Our team will review this report.')
      setShowSuccessDialog(true)
      onReport?.(chef.id, finalReason, reportDescription)
      // Reload chef profile to get fresh stats
      await loadChefProfile()
    } catch (error: any) {
      console.log('Report error:', error)
      setShowReportDialog(false)
      const formattedError = formatErrorMessage(error)
      setErrorMessage(formattedError || 'Failed to submit report. Please try again.')
      setShowErrorDialog(true)
    } finally {
      setIsReporting(false)
    }
  }

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      setErrorMessage('Please select a rating')
      setShowErrorDialog(true)
      return
    }

    setIsRating(true)
    try {
      const result = await chefService.rateChef(chef.id, userRating, userFeedback)
      setShowRatingDialog(false)
      setUserRating(0)
      setUserFeedback("")
      setSuccessMessage('Chef rating submitted successfully!')
      setShowSuccessDialog(true)
      onRate?.(chef.id, userRating, userFeedback)
      // Reload chef profile to get fresh stats
      await loadChefProfile()
    } catch (error: any) {
      console.log('Rating error:', error)
      setShowRatingDialog(false)
      const formattedError = formatErrorMessage(error)
      setErrorMessage(formattedError || 'Failed to submit rating. Please try again.')
      setShowErrorDialog(true)
    } finally {
      setIsRating(false)
    }
  }

  // Handler to view recipe details and track view count
  const handleViewRecipe = async (recipe: Recipe) => {
    try {
      setIsLoadingRecipeDetails(true)
      setExpandedRecipeId(recipe.id)

      console.log('👁️ Fetching recipe details for view:', recipe.id)
      const fullRecipe = await chefService.getRecipeById(recipe.id)

      console.log('✅ Full recipe fetched:', fullRecipe.title)
      setExpandedRecipeData(fullRecipe)

      // Track view count (only for other users viewing, not chef's own content)
      if (fullRecipe.authorId && fullRecipe.authorId !== chef.id) {
        console.log('📊 Tracking recipe view for:', recipe.id)
        // TODO: Call API to increment view count
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch recipe details:', error)
      setExpandedRecipeId(null)
      const formattedError = formatErrorMessage(error)
      setErrorMessage(formattedError || 'Failed to load recipe details. Please try again.')
      setShowErrorDialog(true)
    } finally {
      setIsLoadingRecipeDetails(false)
    }
  }

  // Handler to view course details and track view count
  const handleViewCourse = async (course: Course) => {
    try {
      setIsLoadingCourseDetails(true)
      setExpandedCourseId(course.id)

      console.log('👁️ Fetching course details for view:', course.id)
      const fullCourse = await chefService.getCourseById(course.id)

      console.log('✅ Full course fetched:', fullCourse.title)
      setExpandedCourseData(fullCourse)

      // Track view count (only for other users viewing, not chef's own content)
      const courseChefId = (fullCourse as any).chefId || (fullCourse as any).authorId
      if (courseChefId && courseChefId !== chef.id) {
        console.log('📊 Tracking course view for:', course.id)
        // TODO: Call API to increment view count
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch course details:', error)
      setExpandedCourseId(null)
      const formattedError = formatErrorMessage(error)
      setErrorMessage(formattedError || 'Failed to load course details. Please try again.')
      setShowErrorDialog(true)
    } finally {
      setIsLoadingCourseDetails(false)
    }
  }

  const handleStartCooking = (recipe: any) => {
    if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
      console.log('No instructions available for recipe')
      return
    }

    setExpandedRecipeId(null)
    setExpandedRecipeData(null)

    // Navigate to cooking screen with recipe data
    router.push({
      pathname: '/recipe/cooking' as any,
      params: {
        recipe: JSON.stringify(recipe)
      }
    })
  }

  // Comprehensive share functionality matching FavoritesScreen pattern
  const handleShareRecipe = async (recipe: any): Promise<void> => {
    let recipeText = `🍽️ ${recipe.title}\n\n`
    recipeText += `📝 ${recipe.description || 'Delicious recipe from Meal Mate'}\n\n`

    // Add timing information
    recipeText += `⏱️ Prep: ${recipe.prepTime}m | Cook: ${recipe.cookTime}m | Total: ${recipe.prepTime + recipe.cookTime}m\n`
    recipeText += `🍽️ Servings: ${recipe.servings} | Difficulty: ${recipe.difficulty} | Cuisine: ${recipe.cuisine}\n\n`

    // Add nutrition facts
    recipeText += `📊 Nutrition (per serving):\n`
    recipeText += `• Calories: ${recipe.nutrition?.calories || 0}\n`
    recipeText += `• Protein: ${recipe.nutrition?.protein || 0}g\n`
    recipeText += `• Carbs: ${recipe.nutrition?.carbs || 0}g\n`
    recipeText += `• Fat: ${recipe.nutrition?.fat || 0}g\n\n`

    // Add ingredients list
    recipeText += `🛒 Ingredients:\n`
    recipe.ingredients.forEach((ingredient: any, index: number) => {
      recipeText += `${index + 1}. ${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
      if (ingredient.notes) {
        recipeText += ` (${ingredient.notes})`
      }
      recipeText += `\n`
    })
    recipeText += `\n`

    // Add instructions
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

    // Add chef's tips
    if (recipe.tips && recipe.tips.length > 0) {
      recipeText += `💡 Chef's Tips:\n`
      recipe.tips.forEach((tip: string) => {
        const cleanTip = tip.indexOf('\n') !== -1 ? tip.substring(0, tip.indexOf('\n')).trim() : tip
        recipeText += `• ${cleanTip}\n`
      })
      recipeText += `\n`
    }

    // Add substitutions
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

  // Toggle functions for expandable units
  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet
    })
  }

  const toggleDescription = (descId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(descId)) {
        newSet.delete(descId)
      } else {
        newSet.add(descId)
      }
      return newSet
    })
  }

  const getFilteredContent = () => {
    if (activeTab === "recipes") {
      return recipes.filter((r) => !r.isRestricted)
    } else if (activeTab === "courses") {
      return courses.filter((c) => !c.isRestricted)
    } else {
      // Restricted content - only show restricted, not banned
      return [
        ...recipes.filter((r) => r.isRestricted && !r.isBanned),
        ...courses.filter((c) => c.isRestricted && !c.isBanned),
      ]
    }
  }

  const renderRecipeCard = (recipe: Recipe) => {
    const getImageUrl = (image: any): string => {
      if (!image) return 'https://via.placeholder.com/400x300'
      if (typeof image === 'string') return image
      if (typeof image === 'object' && image.url) return image.url
      if (typeof image === 'object' && image.uri) return image.uri
      return 'https://via.placeholder.com/400x300'
    }
    const imageUri = getImageUrl(recipe.image)
    return (
      <TouchableOpacity
        style={styles.contentCard}
        activeOpacity={0.7}
        onPress={() => handleViewRecipe(recipe)}
      >
        <Image source={{ uri: imageUri }} style={styles.contentImage} />
        <View style={styles.contentInfo}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {recipe.title}
            </Text>
            {recipe.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color="#FACC15" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>

          <Text style={styles.contentDescription} numberOfLines={2}>
            {recipe.description}
          </Text>

          <View style={styles.contentMeta}>
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={14} color="#94A3B8" />
              <Text style={styles.metaText}>{recipe.cookTime}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="star" size={14} color="#FACC15" />
              <Text style={styles.metaText}>{(recipe.rating || 0).toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.contentActions}>
            <TouchableOpacity
              style={styles.contentActionButton}
              onPress={() => {
                setShowRecipeReportDialog(true)
              }}
            >
              <Ionicons name="flag-outline" size={16} color="#EF4444" />
              <Text style={[styles.contentActionText, { color: "#EF4444" }]}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contentActionButton, styles.rateActionButton]}
              onPress={() => {
                setShowRecipeRatingDialog(true)
              }}
            >
              <Ionicons name="star-outline" size={16} color="#FACC15" />
              <Text style={[styles.contentActionText, { color: "#FACC15" }]}>Rate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderCourseCard = (course: Course) => {
    const getImageUrl = (image: any): string => {
      if (!image) return 'https://via.placeholder.com/400x300'
      if (typeof image === 'string') return image
      if (typeof image === 'object' && image.url) return image.url
      if (typeof image === 'object' && image.uri) return image.uri
      return 'https://via.placeholder.com/400x300'
    }
    const courseData = course as any
    const imageUri = getImageUrl(courseData.coverImage || courseData.image)

    // Calculate duration display
    const durationDisplay = courseData.durationValue && courseData.durationUnit
      ? `${courseData.durationValue} ${courseData.durationUnit}`
      : courseData.totalDuration
        ? `${courseData.totalDuration} min`
        : courseData.duration || 'Self-paced'

    return (
      <TouchableOpacity
        style={styles.contentCard}
        activeOpacity={0.7}
        onPress={() => handleViewCourse(course)}
      >
        <Image source={{ uri: imageUri }} style={styles.contentImage} />
        <View style={styles.contentInfo}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {course.title}
            </Text>
            {course.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color="#FACC15" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>

          <Text style={styles.contentDescription} numberOfLines={2}>
            {course.description}
          </Text>

          <View style={styles.contentMeta}>
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={14} color="#94A3B8" />
              <Text style={styles.metaText}>{durationDisplay}</Text>
            </View>
            {course.rating && (
              <View style={styles.metaBadge}>
                <Ionicons name="star" size={14} color="#FACC15" />
                <Text style={styles.metaText}>{(course.rating || 0).toFixed(1)}</Text>
              </View>
            )}
            <View style={styles.metaBadge}>
              <Ionicons name="school-outline" size={14} color="#8B5CF6" />
              <Text style={styles.metaText}>{course.skillLevel}</Text>
            </View>
          </View>

          <View style={styles.contentActions}>
            <TouchableOpacity
              style={styles.contentActionButton}
              onPress={() => {
                setShowCourseReportDialog(true)
              }}
            >
              <Ionicons name="flag-outline" size={16} color="#EF4444" />
              <Text style={[styles.contentActionText, { color: "#EF4444" }]}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contentActionButton, styles.rateActionButton]}
              onPress={() => {
                setShowCourseRatingDialog(true)
              }}
            >
              <Ionicons name="star-outline" size={16} color="#FACC15" />
              <Text style={[styles.contentActionText, { color: "#FACC15" }]}>Rate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container]}>
        <LinearGradient colors={["#1a1a1a", "#0a0a0a"]} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("chef.profileTitle")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Chef Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileTopSection}>
                {/* Avatar on left */}
                <Image
                  source={{
                    uri: typeof chef.avatar === 'string'
                      ? chef.avatar
                      : (chef.avatar as any)?.url || 'https://via.placeholder.com/150'
                  }}
                  style={styles.chefAvatar}
                />

                {/* Info on right */}
                <View style={styles.chefInfo}>
                  <Text style={styles.chefName}>{chef.name}</Text>

                  {/* Expertise Tags */}
                  <View style={styles.expertiseContainer}>
                    <View style={styles.expertiseTag}>
                      <Ionicons name="restaurant-outline" size={14} color="#FACC15" />
                      <Text style={styles.expertiseText}>{chef.specialty}</Text>
                    </View>
                    {chef.experience && (
                      <View style={[styles.expertiseTag, styles.experienceTag]}>
                        <Ionicons name="time-outline" size={14} color="#3B82F6" />
                        <Text style={[styles.expertiseText, styles.experienceText]}>{chef.experience}</Text>
                      </View>
                    )}
                  </View>

                  {/* Subscribe Button */}
                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      isSubscribed && styles.subscribedButton,
                    ]}
                    onPress={handleSubscribe}
                    disabled={isSubscribing}
                    activeOpacity={0.7}
                  >
                    {isSubscribing ? (
                      <ActivityIndicator size="small" color={isSubscribed ? "#22C55E" : "white"} />
                    ) : (
                      <>
                        <Ionicons
                          name={isSubscribed ? "checkmark-circle" : "add-circle-outline"}
                          size={18}
                          color={isSubscribed ? "#22C55E" : "white"}
                        />
                        <Text
                          style={[
                            styles.subscribeButtonText,
                            isSubscribed && styles.subscribedButtonText,
                          ]}
                        >
                          {isSubscribed ? t("chef.subscribed") : t("chef.subscribe")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Chef Bio - Full width below */}
              {chef.bio && (
                <View style={styles.bioContainer}>
                  <Text style={styles.bioText}>{chef.bio}</Text>
                </View>
              )}

              {/* Stats Grid */}
              <View style={styles.statsCard}>
                <Text style={styles.statsSectionTitle}>Performance Statistics</Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                      <Ionicons name="restaurant-outline" size={15} color="#22C55E" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {(chefStats?.freeRecipesCount || 0) + (chefStats?.premiumRecipesCount || 0)}
                    </Text>
                    <Text style={styles.statGridLabel}>Total Recipes</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Ionicons name="book-outline" size={15} color="#8B5CF6" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chefStats?.coursesCount || 0}
                    </Text>
                    <Text style={styles.statGridLabel}>Total Courses</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="people-outline" size={15} color="#3B82F6" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chefStats?.totalStudents || chef.subscribers}
                    </Text>
                    <Text style={styles.statGridLabel}>Subscribers</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Ionicons name="star" size={15} color="#F59E0B" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chefStats?.averageRating?.toFixed(1) || chef.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.statGridLabel}>Avg Rating</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                      <Ionicons name="heart-outline" size={15} color="#EC4899" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {(chef.stats?.premiumRecipesCount || 0) +
                        (chef.courses?.filter(c => c.isPremium).length || 0)}
                    </Text>
                    <Text style={styles.statGridLabel}>Premium Items</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(250, 204, 21, 0.15)' }]}>
                      <Ionicons name="chatbubbles-outline" size={15} color="#FACC15" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chef.stats?.totalRatings || 0}
                    </Text>
                    <Text style={styles.statGridLabel}>Total Ratings</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowReportDialog(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag-outline" size={20} color="#EF4444" />
                  <Text style={styles.actionButtonText}>{t("chef.report")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rateButton]}
                  onPress={() => setShowRatingDialog(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="star-outline" size={20} color="#FACC15" />
                  <Text style={[styles.actionButtonText, styles.rateButtonText]}>
                    {t("chef.rate")} {t("chef.chef")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Content Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "recipes" && styles.activeTab]}
                onPress={() => setActiveTab("recipes")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="restaurant"
                  size={18}
                  color={activeTab === "recipes" ? "#FACC15" : "#94A3B8"}
                />
                <Text
                  style={[styles.tabText, activeTab === "recipes" && styles.activeTabText]}
                >
                  {t("tabs.recipes")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === "courses" && styles.activeTab]}
                onPress={() => setActiveTab("courses")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="book"
                  size={18}
                  color={activeTab === "courses" ? "#FACC15" : "#94A3B8"}
                />
                <Text
                  style={[styles.tabText, activeTab === "courses" && styles.activeTabText]}
                >
                  {t("chef.courses")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === "restricted" && styles.activeTab]}
                onPress={() => setActiveTab("restricted")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={activeTab === "restricted" ? "#FACC15" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "restricted" && styles.activeTabText,
                  ]}
                >
                  {t("chef.restricted")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content List */}
            <View style={styles.contentList}>
              {activeTab === "recipes" && (
                <>
                  {isLoadingRecipes ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#FACC15" />
                      <Text style={styles.loadingText}>Loading recipes...</Text>
                    </View>
                  ) : recipes.filter((r) => !r.isRestricted).length > 0 ? (
                    recipes
                      .filter((r) => !r.isRestricted)
                      .map((recipe) => <View key={recipe.id}>{renderRecipeCard(recipe)}</View>)
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="restaurant-outline" size={48} color="#475569" />
                      <Text style={styles.emptyStateText}>No Recipes Available</Text>
                      <Text style={styles.emptyStateSubtext}>
                        This chef hasn't published any recipes yet
                      </Text>
                    </View>
                  )}
                </>
              )}
              {activeTab === "courses" && (
                <>
                  {isLoadingCourses ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#FACC15" />
                      <Text style={styles.loadingText}>Loading courses...</Text>
                    </View>
                  ) : courses.filter((c) => !c.isRestricted).length > 0 ? (
                    courses
                      .filter((c) => !c.isRestricted)
                      .map((course) => <View key={course.id}>{renderCourseCard(course)}</View>)
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="book-outline" size={48} color="#475569" />
                      <Text style={styles.emptyStateText}>No Courses Available</Text>
                      <Text style={styles.emptyStateSubtext}>
                        This chef hasn't published any courses yet
                      </Text>
                    </View>
                  )}
                </>
              )}
              {activeTab === "restricted" && (
                <>
                  {/* Restricted Section */}
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderBar}>
                      <Ionicons name="lock-closed" size={20} color="#F59E0B" />
                      <Text style={styles.sectionHeaderText}>Restricted Content</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {recipes.filter((r) => r.isRestricted && !r.isBanned).length +
                            courses.filter((c) => c.isRestricted && !c.isBanned).length}
                        </Text>
                      </View>
                    </View>
                    {recipes.filter((r) => r.isRestricted && !r.isBanned).map((recipe) => <View key={`recipe-${recipe.id}`}>{renderRecipeCard(recipe)}</View>)}
                    {courses.filter((c) => c.isRestricted && !c.isBanned).map((course) => <View key={`course-${course.id}`}>{renderCourseCard(course)}</View>)}
                    {recipes.filter((r) => r.isRestricted && !r.isBanned).length === 0 &&
                      courses.filter((c) => c.isRestricted && !c.isBanned).length === 0 && (
                        <View style={styles.emptyState}>
                          <Ionicons name="lock-closed-outline" size={48} color="#475569" />
                          <Text style={styles.emptyStateText}>No Restricted Content</Text>
                          <Text style={styles.emptyStateSubtext}>
                            No restricted recipes or courses
                          </Text>
                        </View>
                      )}
                  </View>

                  {/* Banned Section */}
                  <View style={[styles.sectionContainer, { marginTop: 20 }]}>
                    <View style={styles.sectionHeaderBar}>
                      <Ionicons name="ban" size={20} color="#EF4444" />
                      <Text style={styles.sectionHeaderText}>Banned Content</Text>
                      <View style={[styles.sectionBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                        <Text style={[styles.sectionBadgeText, { color: '#EF4444' }]}>
                          {recipes.filter((r) => r.isBanned).length +
                            courses.filter((c) => c.isBanned).length}
                        </Text>
                      </View>
                    </View>
                    {recipes.filter((r) => r.isBanned).map((recipe) => <View key={`banned-recipe-${recipe.id}`}>{renderRecipeCard(recipe)}</View>)}
                    {courses.filter((c) => c.isBanned).map((course) => <View key={`banned-course-${course.id}`}>{renderCourseCard(course)}</View>)}
                    {recipes.filter((r) => r.isBanned).length === 0 &&
                      courses.filter((c) => c.isBanned).length === 0 && (
                        <View style={styles.emptyState}>
                          <Ionicons name="checkmark-circle-outline" size={48} color="#22C55E" />
                          <Text style={styles.emptyStateText}>No Banned Content</Text>
                          <Text style={styles.emptyStateSubtext}>
                            No banned recipes or courses
                          </Text>
                        </View>
                      )}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Report Dialog */}
      <CustomDialog
        visible={showReportDialog}
        onClose={() => {
          setShowReportDialog(false)
          setReportReason("")
          setReportDescription("")
          setCustomReason("")
        }}
        title="Report Chef Profile"
        height={550}
      >
        <>
          <View style={styles.reportTopSection}>
            <Text style={styles.dialogLabel}>Describe Your Concern:</Text>
            <TextInput
              style={[styles.textInput, styles.reportTextBox]}
              placeholder="Type your reason for reporting this chef..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={customReason}
              onChangeText={(text: string) => {
                setCustomReason(text)
                if (text.trim()) {
                  setReportReason("")
                }
              }}
            />

            <Text style={[styles.dialogLabel, styles.reasonsLabel]}>Or Select Common Reason:</Text>
          </View>

          <ScrollView
            style={styles.reasonScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {reportReasons.filter(r => r !== "Custom").map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  reportReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => {
                  if (reportReason === reason) {
                    setReportReason("")
                  } else {
                    setReportReason(reason)
                    setCustomReason("")
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioButton,
                    reportReason === reason && styles.radioButtonSelected,
                  ]}
                >
                  {reportReason === reason && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dialogButtons}>
            <TouchableOpacity
              style={[styles.dialogButton, styles.cancelButton]}
              onPress={() => {
                setShowReportDialog(false)
                setReportReason("")
                setReportDescription("")
                setCustomReason("")
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogButton, styles.submitButton]}
              onPress={handleSubmitReport}
              disabled={isReporting}
            >
              {isReporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      </CustomDialog>

      {/* Rating Dialog */}
      <CustomDialog
        visible={showRatingDialog}
        onClose={() => {
          setShowRatingDialog(false)
          setUserRating(0)
          setUserFeedback("")
        }}
        title="Rate This Chef"
        height={400}
      >
        <View style={styles.dialogContent}>
          <Text style={styles.dialogLabel}>Select Your Rating:</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setUserRating(star)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= userRating ? "star" : "star-outline"}
                  size={48}
                  color={star <= userRating ? "#FACC15" : "#475569"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dialogLabel}>Feedback (Optional):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your experience..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={userFeedback}
            onChangeText={setUserFeedback}
          />
        </View>

        <View style={styles.dialogButtons}>
          <TouchableOpacity
            style={[styles.dialogButton, styles.cancelButton]}
            onPress={() => {
              setShowRatingDialog(false)
              setUserRating(0)
              setUserFeedback("")
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmitRating}
            disabled={userRating === 0 || isRating}
            style={[styles.dialogButton, styles.submitButton, userRating === 0 && styles.disabledButton]}
          >
            {isRating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.submitButtonText, userRating === 0 && styles.disabledButtonText]}>Submit Rating</Text>
            )}
          </TouchableOpacity>
        </View>
      </CustomDialog>

      {/* Recipe Report Dialog */}
      <CustomDialog
        visible={showRecipeReportDialog}
        onClose={() => {
          setShowRecipeReportDialog(false)
          setRecipeReportReason("")
          setRecipeReportDescription("")
        }}
        title="Report Recipe"
        height={550}
      >
        <>
          <View style={styles.reportTopSection}>
            <Text style={styles.dialogLabel}>Describe Your Concern:</Text>
            <TextInput
              style={[styles.textInput, styles.reportTextBox]}
              placeholder="Type your reason for reporting this recipe..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={recipeReportDescription}
              onChangeText={setRecipeReportDescription}
            />

            <Text style={[styles.dialogLabel, styles.reasonsLabel]}>Or Select Common Reason:</Text>
          </View>

          <ScrollView
            style={styles.reasonScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {reportReasons.filter(r => r !== "Custom").map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  recipeReportReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => {
                  if (recipeReportReason === reason) {
                    setRecipeReportReason("")
                  } else {
                    setRecipeReportReason(reason)
                    setRecipeReportDescription("")
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioButton,
                    recipeReportReason === reason && styles.radioButtonSelected,
                  ]}
                >
                  {recipeReportReason === reason && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dialogButtons}>
            <TouchableOpacity
              style={[styles.dialogButton, styles.cancelButton]}
              onPress={() => {
                setShowRecipeReportDialog(false)
                setRecipeReportReason("")
                setRecipeReportDescription("")
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogButton, styles.submitButton]}
              onPress={() => {
                // TODO: Implement recipe report submission
                console.log('Recipe report submitted successfully')
                setShowRecipeReportDialog(false)
                setRecipeReportReason("")
                setRecipeReportDescription("")
              }}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </>
      </CustomDialog>

      {/* Recipe Rating Dialog */}
      <CustomDialog
        visible={showRecipeRatingDialog}
        onClose={() => {
          setShowRecipeRatingDialog(false)
          setRecipeRating(0)
          setRecipeRatingFeedback("")
        }}
        title="Rate This Recipe"
        height={400}
      >
        <View style={styles.dialogContent}>
          <Text style={styles.dialogLabel}>Select Your Rating:</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRecipeRating(star)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= recipeRating ? "star" : "star-outline"}
                  size={48}
                  color={star <= recipeRating ? "#FACC15" : "#475569"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dialogLabel}>Feedback (Optional):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about this recipe..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={recipeRatingFeedback}
            onChangeText={setRecipeRatingFeedback}
          />
        </View>

        <View style={styles.dialogButtons}>
          <TouchableOpacity
            style={[styles.dialogButton, styles.cancelButton]}
            onPress={() => {
              setShowRecipeRatingDialog(false)
              setRecipeRating(0)
              setRecipeRatingFeedback("")
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              // TODO: Implement recipe rating submission
              console.log('Recipe rating submitted successfully')
              setShowRecipeRatingDialog(false)
              setRecipeRating(0)
              setRecipeRatingFeedback("")
            }}
            disabled={recipeRating === 0}
            style={[styles.dialogButton, styles.submitButton, recipeRating === 0 && styles.disabledButton]}
          >
            <Text style={[styles.submitButtonText, recipeRating === 0 && styles.disabledButtonText]}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      </CustomDialog>

      {/* Course Report Dialog */}
      <CustomDialog
        visible={showCourseReportDialog}
        onClose={() => {
          setShowCourseReportDialog(false)
          setCourseReportReason("")
          setCourseReportDescription("")
        }}
        title="Report Course"
        height={550}
      >
        <>
          <View style={styles.reportTopSection}>
            <Text style={styles.dialogLabel}>Describe Your Concern:</Text>
            <TextInput
              style={[styles.textInput, styles.reportTextBox]}
              placeholder="Type your reason for reporting this course..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={courseReportDescription}
              onChangeText={setCourseReportDescription}
            />

            <Text style={[styles.dialogLabel, styles.reasonsLabel]}>Or Select Common Reason:</Text>
          </View>

          <ScrollView
            style={styles.reasonScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {reportReasons.filter(r => r !== "Custom").map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  courseReportReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => {
                  if (courseReportReason === reason) {
                    setCourseReportReason("")
                  } else {
                    setCourseReportReason(reason)
                    setCourseReportDescription("")
                  }
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioButton,
                    courseReportReason === reason && styles.radioButtonSelected,
                  ]}
                >
                  {courseReportReason === reason && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dialogButtons}>
            <TouchableOpacity
              style={[styles.dialogButton, styles.cancelButton]}
              onPress={() => {
                setShowCourseReportDialog(false)
                setCourseReportReason("")
                setCourseReportDescription("")
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogButton, styles.submitButton]}
              onPress={() => {
                // TODO: Implement course report submission
                console.log('Course report submitted successfully')
                setShowCourseReportDialog(false)
                setCourseReportReason("")
                setCourseReportDescription("")
              }}
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </>
      </CustomDialog>

      {/* Course Rating Dialog */}
      <CustomDialog
        visible={showCourseRatingDialog}
        onClose={() => {
          setShowCourseRatingDialog(false)
          setCourseRating(0)
          setCourseRatingFeedback("")
        }}
        title="Rate This Course"
        height={400}
      >
        <View style={styles.dialogContent}>
          <Text style={styles.dialogLabel}>Select Your Rating:</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setCourseRating(star)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= courseRating ? "star" : "star-outline"}
                  size={48}
                  color={star <= courseRating ? "#FACC15" : "#475569"}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dialogLabel}>Feedback (Optional):</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share your thoughts about this course..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={courseRatingFeedback}
            onChangeText={setCourseRatingFeedback}
          />
        </View>

        <View style={styles.dialogButtons}>
          <TouchableOpacity
            style={[styles.dialogButton, styles.cancelButton]}
            onPress={() => {
              setShowCourseRatingDialog(false)
              setCourseRating(0)
              setCourseRatingFeedback("")
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              // TODO: Implement course rating submission
              console.log('Course rating submitted successfully')
              setShowCourseRatingDialog(false)
              setCourseRating(0)
              setCourseRatingFeedback("")
            }}
            disabled={courseRating === 0}
            style={[styles.dialogButton, styles.submitButton, courseRating === 0 && styles.disabledButton]}
          >
            <Text style={[styles.submitButtonText, courseRating === 0 && styles.disabledButtonText]}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      </CustomDialog>

      {/* Expanded Recipe View Modal */}
      {expandedRecipeId && expandedRecipeData && (
        <Modal visible={true} animationType="slide" transparent={false}>
          <View className="absolute inset-0 bg-zinc-900" style={{ zIndex: 1000 }}>
            {/* Modal Header */}
            <View
              style={{
                paddingTop: insets.top - 8,
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
                  <Text className="text-gray-300 text-base mb-4 leading-relaxed">
                    {expandedRecipeData.description || 'Delicious recipe from your collection'}
                  </Text>

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
                        <Ionicons name="bar-chart-outline" size={14} color="#8B5CF6" />
                        <Text className="text-purple-300 ml-1 text-xs font-semibold">
                          {expandedRecipeData.difficulty || 'Easy'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Share, Report and Rate Buttons */}
                <View className="flex-row mb-6" style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleShareRecipe(expandedRecipeData)}
                    className="bg-blue-500/15 border border-blue-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social-outline" size={18} color="#3B82F6" />
                    <Text className="text-blue-300 font-bold ml-2 text-sm tracking-wide">Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowRecipeReportDialog(true)}
                    className="bg-red-500/15 border border-red-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flag-outline" size={18} color="#EF4444" />
                    <Text className="text-red-300 font-bold ml-2 text-sm tracking-wide">Report</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowRecipeRatingDialog(true)}
                    className="bg-yellow-500/15 border border-yellow-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="star-outline" size={18} color="#FACC15" />
                    <Text className="text-yellow-300 font-bold ml-2 text-sm tracking-wide">Rate</Text>
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
        </Modal>
      )}

      {/* Expanded Course View Modal */}
      {expandedCourseId && expandedCourseData && (
        <View className="absolute inset-0 bg-zinc-900" style={{ zIndex: 1000 }}>
          {/* Modal Header */}
          <View
            style={{
              paddingTop: insets.top - 8,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255, 255, 255, 0.08)",
            }}
            className="px-6"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  setExpandedCourseId(null)
                  setExpandedCourseData(null)
                }}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.06)" }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#FACC15" />
              </TouchableOpacity>

              <Text className="text-white text-lg font-bold flex-1 text-center">
                Course Details
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
              {/* Course Header */}
              <View className="mb-6">
                <Text className="text-white font-bold text-3xl mb-3 leading-tight tracking-tight">
                  {expandedCourseData.title}
                </Text>
                <Text className="text-gray-300 text-base mb-4 leading-relaxed">
                  {expandedCourseData.description || 'Comprehensive course from your collection'}
                </Text>

                {/* Course Stats */}
                <View className="flex-row flex-wrap">
                  <View className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={14} color="#10B981" />
                      <Text className="text-emerald-300 ml-1 text-xs font-semibold">
                        {expandedCourseData.durationValue && expandedCourseData.durationUnit
                          ? `${expandedCourseData.durationValue} ${expandedCourseData.durationUnit}`
                          : expandedCourseData.totalDuration
                            ? `${expandedCourseData.totalDuration} min`
                            : 'Self-paced'}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-blue-500/20 border border-blue-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="book-outline" size={14} color="#3B82F6" />
                      <Text className="text-blue-300 ml-1 text-xs font-semibold">
                        {expandedCourseData.units?.length || 0} units
                      </Text>
                    </View>
                  </View>
                  <View className="bg-purple-500/20 border border-purple-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                    <View className="flex-row items-center">
                      <MaterialIcons name="signal-cellular-alt" size={14} color="#8B5CF6" />
                      <Text className="text-purple-300 ml-1 text-xs font-semibold">
                        {expandedCourseData.skillLevel || 'Beginner'}
                      </Text>
                    </View>
                  </View>
                  {expandedCourseData.category && (
                    <View className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1 mr-2 mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="pricetag-outline" size={14} color="#FBBF24" />
                        <Text className="text-amber-300 ml-1 text-xs font-semibold">
                          {expandedCourseData.category}
                        </Text>
                      </View>
                    </View>
                  )}
                  {expandedCourseData.enrolledStudents > 0 && (
                    <View className="bg-indigo-500/20 border border-indigo-500/40 rounded-full px-3 py-1 mb-2">
                      <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={14} color="#6366F1" />
                        <Text className="text-indigo-300 ml-1 text-xs font-semibold">
                          {expandedCourseData.enrolledStudents} enrolled
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons - Report and Rate */}
              <View className="flex-row mb-6" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowCourseReportDialog(true)}
                  className="bg-red-500/15 border border-red-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                  activeOpacity={0.7}
                >
                  <Ionicons name="flag-outline" size={18} color="#EF4444" />
                  <Text className="text-red-300 font-bold ml-2 text-sm tracking-wide">Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCourseRatingDialog(true)}
                  className="bg-yellow-500/15 border border-yellow-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                  activeOpacity={0.7}
                >
                  <Ionicons name="star-outline" size={18} color="#FACC15" />
                  <Text className="text-yellow-300 font-bold ml-2 text-sm tracking-wide">Rate</Text>
                </TouchableOpacity>
              </View>

              {/* 📚 Course Units Section */}
              {expandedCourseData.units && expandedCourseData.units.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center">
                      <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
                      <Text className="text-white text-xl font-bold tracking-tight">Course Units</Text>
                    </View>
                    <View className="bg-amber-500/20 border-2 border-amber-500/40 px-4 py-2 rounded-full shadow-md">
                      <Text className="text-amber-300 text-xs font-bold">
                        {expandedCourseData.units.length} units
                      </Text>
                    </View>
                  </View>
                  <View className="space-y-4">
                    {expandedCourseData.units.map((unit: any, unitIndex: number) => {
                      const unitId = `${expandedCourseData.id}-${unitIndex}`
                      const isExpanded = expandedUnits.has(unitId)

                      return (
                        <View
                          key={`modal-unit-${expandedCourseData.id}-${unitIndex}`}
                          className="bg-zinc-800/80 border-2 border-zinc-700 rounded-2xl overflow-hidden shadow-xl mb-4"
                        >
                          {/* Unit Header with Gradient Background - Always Visible and Touchable */}
                          <TouchableOpacity
                            onPress={() => toggleUnit(unitId)}
                            activeOpacity={0.8}
                          >
                            <View className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-b-2 border-amber-500/30 px-5 pt-5 pb-3">
                              <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                  <Text className="text-white font-bold text-xl mb-2">
                                    Unit {(unitIndex + 1).toString().padStart(2, '0')}: {unit.title}
                                  </Text>
                                  <Text className="text-amber-200 text-base mb-0">
                                    Objective: {unit.objective}
                                  </Text>
                                  {unit.duration > 0 && (
                                    <View className="flex-row items-center">
                                      <View className="bg-emerald-500/20 border border-emerald-500/40 rounded-full px-3 py-1.5">
                                        <View className="flex-row items-center">
                                          <Ionicons name="time-outline" size={12} color="#10B981" />
                                          <Text className="text-emerald-300 text-sm ml-1.5 font-semibold">{unit.duration} min</Text>
                                        </View>
                                      </View>
                                    </View>
                                  )}
                                </View>
                                <View className="ml-3">
                                  <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color="#F59E0B"
                                  />
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {/* Unit Content Area - Only Visible When Expanded */}
                          {isExpanded && (
                            <View className="p-5">
                              {unit.content && (
                                <View className="mb-4">
                                  <Text className="text-zinc-200 text-base leading-6 mb-1">
                                    {expandedDescriptions.has(`${expandedCourseData.id}-${unitIndex}`)
                                      ? unit.content
                                      : unit.content.length > 100
                                        ? `${unit.content.substring(0, 100)}...`
                                        : unit.content}
                                  </Text>
                                  {unit.content.length > 100 && (
                                    <TouchableOpacity
                                      onPress={() => toggleDescription(`${expandedCourseData.id}-${unitIndex}`)}
                                      className="self-start"
                                    >
                                      <Text className="text-amber-400 text-sm font-semibold">
                                        {expandedDescriptions.has(`${expandedCourseData.id}-${unitIndex}`) ? 'Show less' : 'Show more'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}

                              {/* Learning Steps Section */}
                              {unit.steps && unit.steps.length > 0 && (
                                <View className="mb-4">
                                  <Text className="text-emerald-300 font-bold text-lg mb-3">Learning Steps</Text>
                                  <View className="border border-emerald-500/30 rounded-lg p-3 bg-emerald-500/5">
                                    {unit.steps.map((step: string, stepIndex: number) => (
                                      <Text
                                        key={`step-${unitIndex}-${stepIndex}`}
                                        className="text-zinc-200 text-base leading-6 mb-1"
                                      >
                                        {stepIndex + 1}. {step}
                                      </Text>
                                    ))}
                                  </View>
                                </View>
                              )}

                              {/* Common Errors Section */}
                              {unit.commonErrors && unit.commonErrors.length > 0 && (
                                <View className="mb-4">
                                  <Text className="text-red-400 font-bold text-lg mb-2">Common error</Text>
                                  {unit.commonErrors.map((error: string, errorIndex: number) => (
                                    <Text
                                      key={`error-${unitIndex}-${errorIndex}`}
                                      className="text-zinc-200 text-base leading-6"
                                    >
                                      • {error}
                                    </Text>
                                  ))}
                                </View>
                              )}

                              {/* Tips Section */}
                              {unit.tips && unit.tips.length > 0 && (
                                <View className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-4">
                                  <View className="flex-row items-center mb-3">
                                    <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
                                      <Ionicons name="bulb-outline" size={16} color="#3B82F6" />
                                    </View>
                                    <Text className="text-blue-300 font-bold text-base">Pro Tips</Text>
                                  </View>
                                  <View className="ml-11">
                                    {unit.tips.map((tip: string, tipIndex: number) => (
                                      <Text
                                        key={`tip-${unitIndex}-${tipIndex}`}
                                        className={`text-blue-100 text-base leading-6 ${tipIndex !== unit.tips.length - 1 ? 'mb-2' : ''}`}
                                      >
                                        💡 {tip}
                                      </Text>
                                    ))}
                                  </View>
                                </View>
                              )}

                              {/* Video Section */}
                              {unit.videoUrl && (
                                <View className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4">
                                  <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-lg bg-purple-500/20 items-center justify-center mr-3">
                                      <Ionicons name="videocam-outline" size={16} color="#8B5CF6" />
                                    </View>
                                    <View className="flex-1">
                                      <Text className="text-purple-300 font-bold text-base mb-0.5">Video Lesson</Text>
                                      <Text className="text-purple-200 text-sm">Watch the tutorial for this unit</Text>
                                    </View>
                                    <Ionicons name="play-circle" size={24} color="#A78BFA" />
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Success Dialog */}
      <CustomDialog
        visible={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="Success"
        height={200}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#10B981', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            {successMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setShowSuccessDialog(false)}
            style={{
              backgroundColor: '#10B981',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </CustomDialog>

      {/* Error Dialog */}
      <CustomDialog
        visible={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title="Error"
        height={200}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setShowErrorDialog(false)}
            style={{
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </CustomDialog>

    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileTopSection: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 16,
  },
  chefAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FACC15",
  },
  chefInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  chefName: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  expertiseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 6,
  },
  expertiseTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  expertiseText: {
    color: "#FACC15",
    fontSize: 11,
    fontWeight: "700",
  },
  experienceTag: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  experienceText: {
    color: "#3B82F6",
  },
  subscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
    alignSelf: "flex-start",
  },
  subscribedButton: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  subscribeButtonText: {
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: "700",
  },
  subscribedButtonText: {
    color: "#22C55E",
  },
  bioContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    width: "100%",
  },
  bioText: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statsSectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  statGridItem: {
    width: "30%",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 12,
  },
  statIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statGridValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  statGridLabel: {
    color: "#94A3B8",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  rateButton: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  actionButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  rateButtonText: {
    color: "#FACC15",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  tabText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FACC15",
    fontWeight: "700",
  },
  contentList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  contentImage: {
    width: "100%",
    height: 200,
  },
  contentInfo: {
    padding: 16,
  },
  contentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  contentTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  contentDescription: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  contentMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  metaText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  premiumText: {
    color: "#FACC15",
    fontSize: 11,
    fontWeight: "600",
  },
  contentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  contentActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 10,
    paddingVertical: 8,
    gap: 4,
  },
  rateActionButton: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  contentActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  dialogContent: {
    width: "100%",
  },
  dialogLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  reasonOptionSelected: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: "#FACC15",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FACC15",
  },
  reasonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    color: "white",
    fontSize: 15,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  reportTextBox: {
    minHeight: 60,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.3)",
    backgroundColor: "rgba(250, 204, 21, 0.05)",
  },
  reportTopSection: {
    marginBottom: 8,
  },
  reasonsLabel: {
    marginTop: 0,
    marginBottom: 8,
  },
  reasonScrollView: {
    maxHeight: 120,
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: "row",
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  submitButton: {
    backgroundColor: "#FACC15",
  },
  disabledButton: {
    backgroundColor: "rgba(250, 204, 21, 0.3)",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButtonText: {
    color: "rgba(26, 26, 26, 0.5)",
  },
  ratingStars: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  // Expanded modal styles
  expandedModalContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  expandedModalHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 24,
  },
  expandedModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expandedCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  expandedModalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  expandedModalSpacer: {
    width: 40,
  },
  expandedModalScroll: {
    flex: 1,
  },
  expandedModalContent: {
    padding: 24,
  },
  expandedRecipeHeader: {
    marginBottom: 24,
  },
  expandedRecipeTitle: {
    color: "white",
    fontWeight: "700",
    fontSize: 28,
    marginBottom: 12,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  expandedRecipeDescription: {
    color: "#D1D5DB",
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  expandedRecipeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statBadgeBlue: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  statBadgePurple: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  statBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statBadgeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
  },
  statBadgeTextBlue: {
    color: "#3B82F6",
  },
  statBadgeTextPurple: {
    color: "#8B5CF6",
  },
  expandedActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  expandedActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  expandedReportButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  expandedRateButton: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  expandedShareButton: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  expandedActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  expandedReportText: {
    color: "#EF4444",
  },
  expandedRateText: {
    color: "#FBBF24",
  },
  expandedShareText: {
    color: "#3B82F6",
  },
  expandedSection: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  sectionTitleBar: {
    width: 4,
    height: 24,
    backgroundColor: "#FACC15",
    borderRadius: 2,
  },
  sectionTitleLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    marginLeft: 8,
  },
  expandedSectionTitle: {
    color: "#FACC15",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  ingredientsContainer: {
    backgroundColor: "rgba(39, 39, 42, 1)",
    borderWidth: 4,
    borderColor: "rgba(63, 63, 70, 1)",
    borderRadius: 16,
    padding: 16,
  },
  ingredientItemEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  ingredientItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  ingredientNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    borderWidth: 2,
    borderColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientNumberText: {
    color: "#FACC15",
    fontSize: 14,
    fontWeight: "700",
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientTextEnhanced: {
    color: "white",
    fontSize: 15,
    lineHeight: 22,
  },
  ingredientAmount: {
    fontWeight: "700",
  },
  ingredientNotes: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FACC15",
    marginTop: 7,
    marginRight: 12,
  },
  ingredientText: {
    color: "#E5E7EB",
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  instructionCard: {
    backgroundColor: "rgba(39, 39, 42, 1)",
    borderWidth: 4,
    borderColor: "rgba(63, 63, 70, 1)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  instructionHeader: {
    flexDirection: "row",
  },
  instructionStepBadge: {
    width: 56,
    height: 56,
    backgroundColor: "#FACC15",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.4)",
  },
  instructionStepText: {
    color: "white",
    fontWeight: "700",
    fontSize: 20,
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    lineHeight: 28,
  },
  instructionTipContainer: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  instructionTipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  instructionTipText: {
    color: "#FEF3C7",
    fontSize: 14,
    lineHeight: 24,
    flex: 1,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(250, 204, 21, 0.2)",
    borderWidth: 2,
    borderColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionNumberText: {
    color: "#FACC15",
    fontSize: 14,
    fontWeight: "700",
  },
  courseModuleItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  moduleHeader: {
    marginBottom: 8,
  },
  moduleTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  moduleDescription: {
    color: "#D1D5DB",
    fontSize: 14,
    lineHeight: 20,
  },
  courseContentText: {
    color: "#E5E7EB",
    fontSize: 15,
    lineHeight: 24,
  },
  startCookingButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startCookingGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  startCookingText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 12,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  sectionHeaderText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: "#FACC15",
    fontSize: 14,
    fontWeight: "700",
  },
})

export default ChefProfileViewScreen
