"use client"

import { useAuthContext } from "@/context/authContext"
import { useFavoritesStore } from "@/hooks/useFavoritesStore"
import * as chefService from "@/lib/api/chefService"
import { apiClient } from "@/lib/api/client"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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
import Dialog from "../atoms/Dialog"
import ChefProfileViewScreen from "./ChefProfileViewScreen"
import ChefRegistrationScreen, { ChefRegistrationData } from "./ChefRegistrationScreen"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface Recipe {
  id: string
  title: string
  description: string
  image: string
  isPremium: boolean
  isPublished?: boolean
  isRestricted?: boolean
  isBanned?: boolean
  totalReports?: number
  difficulty: "Easy" | "Medium" | "Hard"
  cookTime: string
  rating: number
  reviews?: number
  chefId?: string
  chefName?: string
  creator?: string
}

interface Chef {
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

interface Course {
  id: string
  title: string
  description: string
  durationValue?: number
  durationUnit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'
  duration?: string // Legacy/computed field for display
  totalDuration?: number // Total duration in minutes
  skillLevel: "Beginner" | "Intermediate" | "Advanced"
  category: string
  subscribers?: number // Legacy field
  totalReports?: number
  rating?: number
  averageRating?: number // Current field for average rating
  isPremium: boolean
  isPublished?: boolean
  isRestricted?: boolean
  isBanned?: boolean
  chefId: string
  chefName: string
  image: string
  units?: CourseUnit[]
}

interface CourseUnit {
  id: string
  title: string
  objective: string
  content: string
  steps: string[]
  commonErrors: string[]
  bestPractices?: string[]
  images?: string[]
}

interface Feedback {
  id: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  date: string
  recipeTitle?: string
}

// Helper function to safely get image URL as string
const getImageUrl = (image: any): string => {
  if (!image) return "https://via.placeholder.com/400x300";
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'object' && image.uri) return image.uri;
  return "https://via.placeholder.com/400x300";
}

const ChefDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<FlatList>(null)
  const { profile, refreshProfile } = useAuthContext()
  const { addToFavorites, isFavorite, removeFromFavorites } = useFavoritesStore()
  
  const [userType, setUserType] = useState<"user" | "chef">("user")
  const [selectedChef, setSelectedChef] = useState<string | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<"recipes" | "courses">("recipes")
  const [foodExplorerTab, setFoodExplorerTab] = useState<"recipes" | "courses">("recipes")
  const [foodExplorerSection, setFoodExplorerSection] = useState<"all" | "subscribed">("all")
  const [chefSearchVisible, setChefSearchVisible] = useState(false)
  const [chefSearchQuery, setChefSearchQuery] = useState("")
  const [viewingChefProfile, setViewingChefProfile] = useState<Chef | null>(null)
  const [editMode, setEditMode] = useState(false)
  
  // Chef profile editing states (separate from user profile)
  const [editedChefName, setEditedChefName] = useState('')
  const [editedExpertiseCategory, setEditedExpertiseCategory] = useState('')
  const [editedProfessionalSummary, setEditedProfessionalSummary] = useState('')
  const [editedYearsOfExperience, setEditedYearsOfExperience] = useState(0)
  const [editedPortfolioImage, setEditedPortfolioImage] = useState('')
  const [showExpertiseDropdown, setShowExpertiseDropdown] = useState(false)
  
  // Chef profile data from backend
  const [chefProfileData, setChefProfileData] = useState<any>(null)
  
  const EXPERTISE_CATEGORIES = [
    "Baking", "Desi Cooking", "Knife Skills", "Healthy Cooking",
    "Continental", "Beginner Fundamentals", "Italian Cuisine",
    "Asian Fusion", "Desserts & Pastries", "Grilling & BBQ",
    "Vegan & Vegetarian", "Other"
  ]
  
  // Update chef editing values when chef profile data changes
  React.useEffect(() => {
    if (chefProfileData) {
      setEditedChefName(chefProfileData.chefName || '')
      setEditedExpertiseCategory(chefProfileData.expertiseCategory || '')
      setEditedProfessionalSummary(chefProfileData.professionalSummary || '')
      setEditedYearsOfExperience(chefProfileData.yearsOfExperience || 0)
      // Handle portfolioImage - it could be a string or an object with url property
      const portfolioImageUrl = typeof chefProfileData.portfolioImage === 'string' 
        ? chefProfileData.portfolioImage 
        : (chefProfileData.portfolioImage && typeof chefProfileData.portfolioImage === 'object' && 'url' in chefProfileData.portfolioImage)
          ? (chefProfileData.portfolioImage as any).url 
          : ''
      setEditedPortfolioImage(portfolioImageUrl)
    }
  }, [chefProfileData])
  
  // Edit mode states
  const [editingRecipe, setEditingRecipe] = useState<any>(null)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  
  // Recipe detail modal state
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
  const [expandedRecipeData, setExpandedRecipeData] = useState<any>(null)
  const [isLoadingRecipeDetails, setIsLoadingRecipeDetails] = useState(false)
  
  // Course detail modal state
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [expandedCourseData, setExpandedCourseData] = useState<any>(null)
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  
  // Publish/Unpublish state
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishSuccessDialog, setShowPublishSuccessDialog] = useState(false)
  const [showPublishErrorDialog, setShowPublishErrorDialog] = useState(false)
  const [publishSuccessMessage, setPublishSuccessMessage] = useState('')
  const [publishErrorMessage, setPublishErrorMessage] = useState('')

  // Recipe Report/Rate Dialog States
  const [showRecipeReportDialog, setShowRecipeReportDialog] = useState(false)
  const [showRecipeRatingDialog, setShowRecipeRatingDialog] = useState(false)
  const [recipeReportReason, setRecipeReportReason] = useState('')
  const [recipeReportDescription, setRecipeReportDescription] = useState('')
  const [recipeRating, setRecipeRating] = useState(0)
  const [recipeRatingFeedback, setRecipeRatingFeedback] = useState('')
  const [isReportingRecipe, setIsReportingRecipe] = useState(false)
  const [isRatingRecipe, setIsRatingRecipe] = useState(false)

  // Course Report/Rate Dialog States
  const [showCourseReportDialog, setShowCourseReportDialog] = useState(false)
  const [showCourseRatingDialog, setShowCourseRatingDialog] = useState(false)
  const [courseReportReason, setCourseReportReason] = useState('')
  const [courseReportDescription, setCourseReportDescription] = useState('')
  const [courseRating, setCourseRating] = useState(0)
  const [courseRatingFeedback, setCourseRatingFeedback] = useState('')
  const [isReportingCourse, setIsReportingCourse] = useState(false)
  const [isRatingCourse, setIsRatingCourse] = useState(false)

  const reportReasons = [
    "Inappropriate Content",
    "Copyright Violation",
    "Repeated Content",
    "Misleading Information",
    "Spam or Scam",
  ]
  
  // Chef registration states
  const [isRegisteringChef, setIsRegisteringChef] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showRegErrorDialog, setShowRegErrorDialog] = useState(false)
  const [regErrorMessage, setRegErrorMessage] = useState("")
  
  // Chef dashboard toggle state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [managementTab, setManagementTab] = useState<"recipes" | "courses">("recipes")
  
  // General success and error dialogs
  const [showGeneralSuccessDialog, setShowGeneralSuccessDialog] = useState(false)
  const [showGeneralErrorDialog, setShowGeneralErrorDialog] = useState(false)
  const [generalSuccessMessage, setGeneralSuccessMessage] = useState('')
  const [generalErrorMessage, setGeneralErrorMessage] = useState('')
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)
  
  // Dynamic state for user-created content
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([])
  const [userCourses, setUserCourses] = useState<Course[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [backendChefStats, setBackendChefStats] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Toggle expanded description
  const toggleDescription = (unitId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet
    })
  }

  // Toggle expanded unit
  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet
    })
  }

  // Fetch chef's recipes and courses from backend - only for actual chefs
  useEffect(() => {
    if (profile?.isChef === 'yes') {
      fetchUserRecipes()
      fetchUserCourses()
      fetchChefStatsAndFeedback()
    }
  }, [profile?.isChef])

  const fetchChefStatsAndFeedback = async () => {
    try {
      console.log('📊 Fetching chef stats and feedback from backend...')
      const response = await apiClient.get<any>('/chef/profile/me', true)
      
      if (response.chef) {
        console.log('✅ Chef profile fetched with stats:', response.chef.stats)
        console.log('📈 Backend Stats:', {
          freeRecipes: response.chef.stats?.freeRecipesCount,
          premiumRecipes: response.chef.stats?.premiumRecipesCount,
          courses: response.chef.stats?.coursesCount,
          students: response.chef.stats?.totalStudents,
          avgRating: response.chef.stats?.averageRating,
          totalRatings: response.chef.stats?.totalRatings
        })
        
        // Store chef profile data
        setChefProfileData(response.chef)
        
        // Store backend stats
        setBackendChefStats(response.chef.stats)
        console.log('✅ Backend stats stored in state')
        
        // Transform profileRatings to feedbacks format
        if (response.chef.profileRatings && response.chef.profileRatings.length > 0) {
          const transformedFeedbacks = response.chef.profileRatings.map((rating: any) => ({
            id: rating._id,
            userName: rating.ratedBy?.userName || 'Anonymous',
            userAvatar: rating.ratedBy?.profileImage?.url || 'https://via.placeholder.com/40',
            rating: rating.rating,
            comment: rating.feedback || 'No feedback provided',
            date: new Date(rating.ratedAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }),
            recipeTitle: null
          })).reverse() // Show newest first
          
          console.log(`✅ Loaded ${transformedFeedbacks.length} feedbacks`)
          setFeedbacks(transformedFeedbacks)
        } else {
          console.log('ℹ️ No feedbacks found')
          setFeedbacks([])
        }
      }
    } catch (error) {
      console.log('❌ Failed to fetch chef stats and feedback:', error)
      setFeedbacks([])
      setBackendChefStats(null)
    }
  }

  const fetchUserRecipes = async () => {
    setIsLoadingRecipes(true)
    try {
      console.log('📚 Fetching chef recipes from backend...')
      const recipes = await chefService.getMyRecipes('all')
      console.log(`✅ Fetched ${recipes.length} recipes`)
      
      // Convert backend recipes to local Recipe format
      const localRecipes: Recipe[] = recipes.map((r: any) => ({
        id: r._id,
        title: r.title,
        description: r.description,
        image: getImageUrl(r.image),
        cookTime: `${r.prepTime + r.cookTime}m`,
        difficulty: r.difficulty as "Easy" | "Medium" | "Hard",
        rating: r.averageRating || 0,
        isPremium: r.isPremium,
        isPublished: r.isPublished,
        isRestricted: r.isRestricted || false,
        isBanned: r.isBanned || false,
        totalReports: r.totalReports || 0,
        chefId: r.authorId,
        chefName: "You"
      }))
      
      setUserRecipes(localRecipes)
    } catch (error) {
      console.log('❌ Failed to fetch recipes:', error)
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const fetchUserCourses = async () => {
    setIsLoadingCourses(true)
    try {
      console.log('📚 Fetching chef courses from backend...')
      const courses = await chefService.getMyCourses('all')
      console.log(`✅ Fetched ${courses.length} courses`)
      
      // Convert backend courses to local Course format
      const localCourses: Course[] = courses.map((c: any) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        durationValue: c.durationValue,
        durationUnit: c.durationUnit,
        duration: c.duration,
        totalDuration: c.totalDuration,
        skillLevel: c.skillLevel as "Beginner" | "Intermediate" | "Advanced",
        category: c.category,
        rating: c.averageRating || 0,
        averageRating: c.averageRating,
        isPremium: c.isPremium,
        isRestricted: c.isRestricted || false,
        isBanned: c.isBanned || false,
        totalReports: c.totalReports || 0,
        isPublished: c.isPublished,
        chefId: c.authorId,
        chefName: "You",
        image: c.coverImage || "https://via.placeholder.com/400x300",
        units: c.units.map((u: any) => ({
          id: u._id,
          title: u.title,
          objective: u.objective || '',
          content: u.content,
          steps: u.steps || [],
          commonErrors: u.commonErrors || [],
          bestPractices: u.bestPractices || []
        }))
      }))
      
      setUserCourses(localCourses)
    } catch (error) {
      console.log('❌ Failed to fetch courses:', error)
    } finally {
      setIsLoadingCourses(false)
    }
  }

  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current
  const feedbackAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(1)).current

  // Chef data from backend
  const [chefs, setChefs] = useState<Chef[]>([])
  const [isLoadingChefs, setIsLoadingChefs] = useState(false)
  const [chefsError, setChefsError] = useState<string | null>(null)
  
  // Food Explorer recipes and courses
  const [explorerRecipes, setExplorerRecipes] = useState<any[]>([])
  const [explorerCourses, setExplorerCourses] = useState<any[]>([])
  const [isLoadingExplorerRecipes, setIsLoadingExplorerRecipes] = useState(false)
  const [isLoadingExplorerCourses, setIsLoadingExplorerCourses] = useState(false)

  // Load chefs from backend
  useEffect(() => {
    loadChefs()
    loadExplorerContent()
  }, [])

  const loadExplorerContent = async () => {
    // Load all published recipes
    setIsLoadingExplorerRecipes(true)
    try {
      const recipes = await chefService.getPublishedRecipes()
      // Ensure recipes have 'id' field for consistency and map averageRating to rating
      const normalizedRecipes = recipes.map(r => ({
        ...r,
        id: r._id || (r as any).id,
        rating: r.averageRating || 0
      }))
      setExplorerRecipes(normalizedRecipes)
    } catch (error) {
      console.log('Failed to load explorer recipes:', error)
    } finally {
      setIsLoadingExplorerRecipes(false)
    }

    // Load all published courses
    setIsLoadingExplorerCourses(true)
    try {
      const courses = await chefService.getPublishedCourses()
      // Ensure courses have 'id' field for consistency and map averageRating to rating
      const normalizedCourses = courses.map(c => ({
        ...c,
        id: c._id || (c as any).id,
        rating: c.averageRating || 0,
        image: c.coverImage || "https://via.placeholder.com/400x300"
      }))
      setExplorerCourses(normalizedCourses)
    } catch (error) {
      console.log('Failed to load explorer courses:', error)
    } finally {
      setIsLoadingExplorerCourses(false)
    }
  }

  const loadChefs = async () => {
    setIsLoadingChefs(true)
    setChefsError(null)
    try {
      const { chefs: fetchedChefs } = await chefService.getAllChefs({
        limit: 50,
        sortBy: 'rating'
      })
      
      // Transform backend chef data to match our Chef interface
      const transformedChefs: Chef[] = fetchedChefs.map((chef: any) => ({
        id: chef.id,
        name: chef.chefName,
        avatar: chef.portfolioImage?.url || chef.user?.profileImage?.url || "https://via.placeholder.com/150",
        specialty: chef.expertiseCategory,
        rating: chef.stats?.averageRating || 0,
        subscribers: chef.stats?.totalStudents || 0,
        isSubscribed: false, // Will be updated per user
        bio: chef.professionalSummary || "",
        experience: chef.yearsOfExperience ? `${chef.yearsOfExperience}+ Years` : "N/A",
        recipes: [], // Will be loaded when chef profile is viewed
        courses: [], // Will be loaded when chef profile is viewed
        stats: chef.stats
      }))
      
      setChefs(transformedChefs)
      
      // Check subscription status for each chef if user is authenticated
      if (profile) {
        checkAllSubscriptions(transformedChefs)
      }
    } catch (error: any) {
      console.log('Failed to load chefs:', error)
      setChefsError(error.message || 'Failed to load chefs')
    } finally {
      setIsLoadingChefs(false)
    }
  }

  const checkAllSubscriptions = async (chefList: Chef[]) => {
    try {
      const subscriptions = await chefService.getMySubscriptions()
      const subscribedChefIds = new Set(subscriptions.map((sub: any) => sub.chef._id || sub.chef.id))
      
      setChefs((prevChefs) =>
        prevChefs.map((chef) => ({
          ...chef,
          isSubscribed: subscribedChefIds.has(chef.id)
        }))
      )
    } catch (error) {
      console.log('Failed to check subscriptions:', error)
    }
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 Refreshing dashboard data...')
      
      // Reload based on current mode
      if (userType === "chef") {
        // Chef Dashboard: reload recipes, courses, stats, and feedbacks
        await Promise.all([
          fetchUserRecipes(),
          fetchUserCourses(),
          fetchChefStatsAndFeedback(),
          refreshProfile()
        ])
        console.log('✅ Chef dashboard refreshed')
      } else {
        // Food Explorer: reload chefs and explorer content
        await Promise.all([
          loadChefs(),
          loadExplorerContent(),
          refreshProfile()
        ])
        console.log('✅ Food Explorer refreshed')
      }
    } catch (error) {
      console.log('❌ Failed to refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleChefSubscriptionToggle = async (chefId: string) => {
    // Reload chefs to update subscription status
    await loadChefs()
  }

  // Compute real chef stats from fetched data
  const chefStats = React.useMemo(() => {
    // Use backend stats if available, otherwise compute from local data
    if (backendChefStats) {
      return {
        totalRecipes: (backendChefStats.freeRecipesCount || 0) + (backendChefStats.premiumRecipesCount || 0),
        totalCourses: backendChefStats.coursesCount || 0,
        totalSubscribers: backendChefStats.totalStudents || 0,
        averageRating: backendChefStats.averageRating?.toFixed(1) || '0.0',
        totalRatings: backendChefStats.totalRatings || 0,
      };
    }
    
    // Fallback to computing from local data
    const totalRecipes = userRecipes.length;
    const totalCourses = userCourses.length;
    
    // Calculate cumulative average rating from both recipes and courses
    const allRatings = [
      ...userRecipes.map(r => r.rating || 0),
      ...userCourses.map(c => c.rating || c.averageRating || 0)
    ].filter(rating => rating > 0);
    
    const averageRating = allRatings.length > 0 
      ? (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(1)
      : '0.0';
    
    const totalSubscribers = 0;
    
    return {
      totalRecipes,
      totalCourses,
      totalSubscribers,
      averageRating,
      totalRatings: 0,
    };
  }, [userRecipes, userCourses, backendChefStats]);

  // Animation effects
  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: userType === "chef" ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }, [userType])

  const handleUserTypeSwitch = (type: "user" | "chef") => {
    Animated.sequence([
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        friction: 8,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        friction: 8,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start()
    setUserType(type)
  }

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeSelectorContainer}>
      <View style={styles.userTypeSelector}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === "user" && styles.activeUserType]}
          onPress={() => handleUserTypeSwitch("user")}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant-outline" size={20} color={userType === "user" ? "#FACC15" : "#94A3B8"} />
          <Text style={[styles.userTypeText, userType === "user" && styles.activeUserTypeText]}>Food Explorer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.userTypeButton, userType === "chef" && styles.activeUserType]}
          onPress={() => handleUserTypeSwitch("chef")}
          activeOpacity={0.8}
        >
          <Ionicons name="business-outline" size={20} color={userType === "chef" ? "#FACC15" : "#94A3B8"} />
          <Text style={[styles.userTypeText, userType === "chef" && styles.activeUserTypeText]}>Chef Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderChefSection = () => {
    // Filter by subscription status
    let displayedChefs = foodExplorerSection === "subscribed" 
      ? chefs.filter((chef) => chef.isSubscribed)
      : chefs

    // Apply search filter
    if (chefSearchQuery.trim()) {
      const query = chefSearchQuery.toLowerCase()
      displayedChefs = displayedChefs.filter((chef) => 
        chef.name.toLowerCase().includes(query) || 
        chef.specialty.toLowerCase().includes(query)
      )
    }

    return (
      <View style={styles.chefSectionContainer}>
        {/* Search Bar or Section Tabs */}
        {chefSearchVisible ? (
          <View style={styles.chefSearchContainer}>
            <View style={styles.chefSearchInputWrapper}>
              <Ionicons name="search" size={20} color="#94A3B8" style={styles.chefSearchIcon} />
              <TextInput
                style={styles.chefSearchInput}
                placeholder="Search by chef name or expertise..."
                placeholderTextColor="#64748B"
                value={chefSearchQuery}
                onChangeText={setChefSearchQuery}
                autoFocus
              />
              {chefSearchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setChefSearchQuery("")}
                  style={styles.chefSearchClearButton}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => {
                setChefSearchVisible(false)
                setChefSearchQuery("")
              }}
              style={styles.chefSearchCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chefSearchContainer}>
            <View style={styles.chefSectionTabs}>
          <TouchableOpacity
            style={[
              styles.chefSectionTab,
              foodExplorerSection === "all" && styles.activeChefSectionTab
            ]}
            onPress={() => setFoodExplorerSection("all")}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="people-outline" 
              size={18} 
              color={foodExplorerSection === "all" ? "#FACC15" : "#94A3B8"} 
            />
            <Text style={[
              styles.chefSectionTabText,
              foodExplorerSection === "all" && styles.activeChefSectionTabText
            ]}>
              All Chefs
            </Text>
            <View style={[
              styles.chefCountBadge,
              foodExplorerSection === "all" && styles.activeChefCountBadge
            ]}>
              <Text style={[
                styles.chefCountText,
                foodExplorerSection === "all" && styles.activeChefCountText
              ]}>
                {chefs.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chefSectionTab,
              foodExplorerSection === "subscribed" && styles.activeChefSectionTab
            ]}
            onPress={() => setFoodExplorerSection("subscribed")}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="star" 
              size={18} 
              color={foodExplorerSection === "subscribed" ? "#FACC15" : "#94A3B8"} 
            />
            <Text style={[
              styles.chefSectionTabText,
              foodExplorerSection === "subscribed" && styles.activeChefSectionTabText
            ]}>
              Subscribed
            </Text>
            <View style={[
              styles.chefCountBadge,
              foodExplorerSection === "subscribed" && styles.activeChefCountBadge
            ]}>
              <Text style={[
                styles.chefCountText,
                foodExplorerSection === "subscribed" && styles.activeChefCountText
              ]}>
                {chefs.filter(c => c.isSubscribed).length}
              </Text>
            </View>
          </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setChefSearchVisible(true)}
              style={styles.chefSearchButton}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* Chefs List */}
        {chefsError ? (
          <View style={styles.emptyChefSection}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.emptyChefText}>Failed to load chefs</Text>
            <Text style={styles.emptyChefSubtext}>{chefsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadChefs}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayedChefs.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={displayedChefs}
            keyExtractor={(item: Chef) => item.id}
            contentContainerStyle={styles.chefRibbonContent}
            renderItem={({ item }: { item: Chef }) => (
              <TouchableOpacity
                style={[styles.chefCard, selectedChef === item.id && styles.selectedChefCard]}
                onPress={() => setViewingChefProfile(item)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.avatar }} style={styles.chefAvatar} />
                {item.isSubscribed && (
                  <View style={styles.subscribedBadge}>
                    <Ionicons name="star" size={10} color="#FACC15" />
                  </View>
                )}
                <Text style={styles.chefName}>{item.name}</Text>
                <Text style={styles.chefSpecialty}>{item.specialty}</Text>
                <View style={styles.chefRating}>
                  <Ionicons name="star" size={12} color="#FACC15" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyChefSection}>
            <Ionicons name="people-outline" size={48} color="#475569" />
            <Text style={styles.emptyChefText}>
              {foodExplorerSection === "subscribed" 
                ? "No subscribed chefs yet"
                : "No chefs available"}
            </Text>
            <Text style={styles.emptyChefSubtext}>
              {foodExplorerSection === "subscribed"
                ? "Subscribe to chefs to see them here"
                : "Check back later for new chefs"}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const renderFoodExplorerTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, foodExplorerTab === "recipes" && styles.activeTab]}
        onPress={() => setFoodExplorerTab("recipes")}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="restaurant-outline" 
          size={20} 
          color={foodExplorerTab === "recipes" ? "#22C55E" : "#94A3B8"} 
        />
        <Text style={[styles.tabText, foodExplorerTab === "recipes" && styles.activeTabText]}>
          Recipes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, foodExplorerTab === "courses" && styles.activeTab ]}
        onPress={() => setFoodExplorerTab("courses")}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="school-outline" 
          size={20} 
          color={foodExplorerTab === "courses" ? "#22C55E" : "#94A3B8"} 
        />
        <Text style={[styles.tabText, foodExplorerTab === "courses" && styles.activeTabText ]}>
          Courses
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderContentSwitch = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "recipes" && styles.activeTab]}
        onPress={() => setActiveTab("recipes")}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="restaurant-outline" 
          size={20} 
          color={activeTab === "recipes" ? "#22C55E" : "#94A3B8"} 
        />
        <Text style={[styles.tabText, activeTab === "recipes" && styles.activeTabText]}>
          Recipes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === "courses" && styles.activeTab ]}
        onPress={() => setActiveTab("courses")}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="school-outline" 
          size={20} 
          color={activeTab === "courses" ? "#22C55E" : "#94A3B8"} 
        />
        <Text style={[styles.tabText, activeTab === "courses" && styles.activeTabText ]}>
          Courses
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderProfileButton = () => (
    <View style={styles.profileButtonContainer}>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={async () => {
          // Reload chef data before showing profile
          await Promise.all([
            fetchUserRecipes(),
            fetchUserCourses(),
            fetchChefStatsAndFeedback(),
            refreshProfile()
          ])
          setShowProfileModal(true)
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="person-circle-outline" size={22} color="#06B6D4" />
        <Text style={styles.profileButtonText}>View My Profile</Text>
        <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
      </TouchableOpacity>
    </View>
  )

  // Create sections for FlatList
  const getSections = () => {
    const sections = [
      { type: 'userTypeSelector', data: [{}], id: 'user-type-selector' },
    ];

    if (userType === "user") {
      sections.push(
        { type: 'chefRibbon', data: [{}], id: 'chef-ribbon' },
        { type: 'foodExplorerTabs', data: [{}], id: 'food-explorer-tabs' },
        { type: 'contentManagement', data: [{}], id: 'content-management-user' }
      );
    } else {
      sections.push(
        { type: 'profileButton', data: [{}], id: 'profile-button' },
        { type: 'chefActions', data: [{}], id: 'chef-actions' },
        { type: 'contentManagement', data: [{}], id: 'content-management-chef' }
      );
    }

    return sections;
  };

  const renderSection = ({ item, index }: { item: any; index: number }) => {
    const section = getSections()[index];
    
    switch (section.type) {
      case 'userTypeSelector':
        return renderUserTypeSelector();
      case 'chefRibbon':
        return renderChefSection();
      case 'foodExplorerTabs':
        return renderFoodExplorerTabs();
      case 'latestRecipes':
        return renderLatestRecipes();
      case 'latestCourses':
        return renderLatestCourses();
      case 'profileButton':
        return renderProfileButton();
      case 'chefActions':
        return renderChefActions();
      case 'contentSwitch':
        return renderContentSwitch();
      case 'contentManagement':
        return renderContentManagement();
      default:
        return null;
    }
  };

  // Update the renderLatestRecipes to not use FlatList
  const renderLatestRecipes = () => {
    const selectedChefData = chefs.find((chef) => chef.id === selectedChef)
    
    // For Food Explorer: show only published recipes
    // For Chef Dashboard: show all recipes (published and unpublished)
    let recipesToShow = userType === "user" 
      ? userRecipes.filter(r => r.isPublished).slice(0, 6)
      : userRecipes.slice(0, 6)
    
    // If a chef is selected on Food Explorer, filter recipes by that chef
    if (selectedChefData && userType === "user") {
      recipesToShow = userRecipes.filter(r => r.isPublished && r.chefId === selectedChefData.id).slice(0, 6)
    }

    // Helper function to determine if user can access recipe
    const canAccessRecipe = (recipe: Recipe) => {
      // On Chef Dashboard, chef can access all their own recipes
      if (userType === "chef") return true
      // On Food Explorer, check if recipe is premium and if user is subscribed
      if (!recipe.isPremium) return true
      const ownerChef = chefs.find(chef => chef.id === recipe.chefId)
      return ownerChef?.isSubscribed || false
    }

    return (
      <View style={styles.recipesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedChefData ? `${selectedChefData.name}'s Recipes` : "Latest Recipes"}
        </Text>
        {isLoadingRecipes ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FACC15" />
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        ) : recipesToShow.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#475569" />
            <Text style={styles.emptyStateText}>No Recipes Available</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedChefData 
                ? `${selectedChefData.name} hasn't published any recipes yet`
                : "Check back later for new recipes"}
            </Text>
          </View>
        ) : (
        <View style={styles.recipesGrid}>
          {recipesToShow.map((item) => {
            const hasAccess = canAccessRecipe(item)
            const ownerChef = chefs.find(chef => chef.id === item.chefId)
            
            return (
              <TouchableOpacity
                key={item.id} 
                style={[styles.recipeCard, { width: (SCREEN_WIDTH - 56) / 2 }]}
                onPress={() => {
                  if (userType === "chef") {
                    // Chef viewing their own recipes
                    router.push({
                      pathname: '/recipe/[id]' as any,
                      params: { id: item.id }
                    })
                  } else if (!hasAccess) {
                    // Premium recipe - subscription required
                    setGeneralErrorMessage(`Subscribe to ${ownerChef?.name || 'this chef'} to access this recipe`)
                    setShowGeneralErrorDialog(true)
                  } else {
                    // Navigate to recipe detail screen
                    router.push({
                      pathname: '/recipe/[id]' as any,
                      params: { id: item.id }
                    })
                  }
                }}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.recipeImage} />
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={12} color="#FACC15" />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
                {!hasAccess && userType === "user" && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
                  </View>
                )}
                {!item.isPublished && userType === "chef" && (
                  <View style={styles.draftBadge}>
                    <Ionicons name="document-outline" size={12} color="#94A3B8" />
                    <Text style={styles.draftText}>Draft</Text>
                  </View>
                )}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <Text style={styles.recipeDescription}>{item.description}</Text>
                  <View style={styles.recipeStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{item.cookTime}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FACC15" />
                      <Text style={styles.statText}>{typeof item.rating === 'number' ? item.rating.toFixed(1) : '0.0'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
        )}
      </View>
    )
  }

  const renderLatestCourses = () => {
    const selectedChefData = chefs.find((chef) => chef.id === selectedChef)
    
    // For Food Explorer: show only published courses
    // For Chef Dashboard: show all courses (published and unpublished)
    let coursesToShow = userType === "user" 
      ? userCourses.filter(c => c.isPublished).slice(0, 6)
      : userCourses.slice(0, 6)
    
    // If a chef is selected on Food Explorer, filter courses by that chef
    if (selectedChefData && userType === "user") {
      coursesToShow = userCourses.filter(c => c.isPublished && c.chefId === selectedChefData.id).slice(0, 6)
    }

    // Helper function to determine if user can access course
    const canAccessCourse = (course: Course) => {
      // On Chef Dashboard, chef can access all their own courses
      if (userType === "chef") return true
      // On Food Explorer, check if course is premium and if user is subscribed
      if (!course.isPremium) return true
      const ownerChef = chefs.find(chef => chef.id === course.chefId)
      return ownerChef?.isSubscribed || false
    }

    return (
      <View style={styles.recipesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedChefData ? `${selectedChefData.name}'s Courses` : "Latest Courses"}
        </Text>
        {isLoadingCourses ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FACC15" />
            <Text style={styles.loadingText}>Loading courses...</Text>
          </View>
        ) : coursesToShow.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#475569" />
            <Text style={styles.emptyStateText}>No Courses Available</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedChefData 
                ? `${selectedChefData.name} hasn't published any courses yet`
                : "Check back later for new courses"}
            </Text>
          </View>
        ) : (
        <View style={styles.recipesGrid}>
          {coursesToShow.map((item) => {
            const hasAccess = canAccessCourse(item)
            const ownerChef = chefs.find(chef => chef.id === item.chefId)
            
            return (
              <TouchableOpacity
                key={item.id} 
                style={[styles.recipeCard, { width: (SCREEN_WIDTH - 56) / 2 }]}
                onPress={() => {
                  if (userType === "chef") {
                    // Chef viewing their own courses
                    setGeneralErrorMessage(`Opening: ${item.title}\n\nCourse detail screen coming soon!`)
                    setShowGeneralErrorDialog(true)
                  } else if (!hasAccess) {
                    // Premium course - subscription required
                    setGeneralErrorMessage(`Subscribe to ${ownerChef?.name || 'this chef'} to access this course`)
                    setShowGeneralErrorDialog(true)
                  } else {
                    // Navigate to course detail screen (to be implemented)
                    setGeneralErrorMessage(`Opening: ${item.title}\n\nCourse detail screen coming soon!`)
                    setShowGeneralErrorDialog(true)
                  }
                }}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.recipeImage} />
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={12} color="#FACC15" />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
                {!hasAccess && userType === "user" && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
                  </View>
                )}
                {!item.isPublished && userType === "chef" && (
                  <View style={styles.draftBadge}>
                    <Ionicons name="document-outline" size={12} color="#94A3B8" />
                    <Text style={styles.draftText}>Draft</Text>
                  </View>
                )}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <Text style={styles.recipeDescription}>{item.description}</Text>
                  <View style={styles.courseStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="book-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{item.units?.length || 0} units</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FACC15" />
                      <Text style={styles.statText}>{typeof item.rating === 'number' ? item.rating.toFixed(1) : '0.0'}</Text>
                    </View>
                  </View>
                  <View style={styles.coursePrice}>
                    <Text style={styles.priceText}>{item.skillLevel || 'Beginner'}</Text>
                    <Text style={styles.subscribersText}>{item.duration}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
        )}
      </View>
    )
  }

  const handlePortfolioImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setEditedPortfolioImage(result.assets[0].uri)
      }
    } catch (error) {
      console.log('Error picking image:', error)
      setGeneralErrorMessage('Failed to pick image')
      setShowGeneralErrorDialog(true)
    }
  }

  const renderChefProfile = () => {
    // Filter restricted, and banned content
    const restrictedRecipes = userRecipes.filter(r => r.isRestricted);
    const restrictedCourses = userCourses.filter(c => c.isRestricted);
    const bannedRecipes = userRecipes.filter(r => r.isBanned);
    const bannedCourses = userCourses.filter(c => c.isBanned);

    return (
      <View style={styles.profileContainer}>
        {/* Chef Header Card */}
        <View style={[styles.profileHeaderCard, editMode && { paddingTop: 50 }]}>
          {/* Edit/Save/Cancel Buttons */}
          {editMode ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity 
                style={[styles.editProfileButton, styles.cancelButton]}
                onPress={() => {
                  // Cancel - restore original chef profile values
                  setEditedChefName(chefProfileData?.chefName || '')
                  setEditedExpertiseCategory(chefProfileData?.expertiseCategory || '')
                  setEditedProfessionalSummary(chefProfileData?.professionalSummary || '')
                  setEditedYearsOfExperience(chefProfileData?.yearsOfExperience || 0)
                  // Handle portfolioImage - it could be a string or an object with url property
                  const portfolioImageUrl = typeof chefProfileData?.portfolioImage === 'string'
                    ? chefProfileData?.portfolioImage
                    : chefProfileData?.portfolioImage?.url || ''
                  setEditedPortfolioImage(portfolioImageUrl)
                  setShowExpertiseDropdown(false)
                  setEditMode(false)
                }}
              >
                <Text style={[styles.editProfileButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={async () => {
                  try {
                    console.log('🚀 Updating chef profile...')
                    
                    // Validate professional summary length
                    if (editedProfessionalSummary.trim().length < 50) {
                      setGeneralErrorMessage('Professional summary must be at least 50 characters')
                      setShowGeneralErrorDialog(true)
                      return
                    }
                    if (editedProfessionalSummary.trim().length > 500) {
                      setGeneralErrorMessage('Professional summary must not exceed 500 characters')
                      setShowGeneralErrorDialog(true)
                      return
                    }
                    
                    const formData = new FormData()
                    formData.append('chefName', editedChefName.trim())
                    formData.append('expertiseCategory', editedExpertiseCategory)
                    formData.append('professionalSummary', editedProfessionalSummary.trim())
                    formData.append('yearsOfExperience', editedYearsOfExperience.toString())
                    
                    // Get current portfolio image URL
                    const currentPortfolioImage = typeof chefProfileData?.portfolioImage === 'string'
                      ? chefProfileData?.portfolioImage
                      : chefProfileData?.portfolioImage?.url
                    
                    // Always append portfolio image if it exists and has changed
                    if (editedPortfolioImage && editedPortfolioImage !== currentPortfolioImage) {
                      console.log('📸 Uploading new portfolio image...')
                      const imageUri = editedPortfolioImage
                      const filename = imageUri.split('/').pop() || 'portfolio.jpg'
                      const match = /\.(\w+)$/.exec(filename)
                      const type = match ? `image/${match[1]}` : 'image/jpeg'
                      
                      formData.append('portfolioImage', {
                        uri: imageUri,
                        name: filename,
                        type: type,
                      } as any)
                    }
                    
                    await apiClient.put('/chef/profile', formData, true)
                    await refreshProfile()
                    setShowExpertiseDropdown(false)
                    setEditMode(false)
                    
                    setGeneralSuccessMessage('Chef profile updated successfully')
                    setShowGeneralSuccessDialog(true)
                    console.log('✅ Chef profile updated successfully')
                  } catch (error: any) {
                    console.log('❌ Error updating chef profile:', error.message)
                    setGeneralErrorMessage(error.message || 'Failed to update chef profile')
                    setShowGeneralErrorDialog(true)
                  }
                }}
              >
                <Text style={styles.editProfileButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.editProfileButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: editedPortfolioImage || (typeof chefProfileData?.portfolioImage === 'string' ? chefProfileData?.portfolioImage : chefProfileData?.portfolioImage?.url) || profile?.profileImage?.url || 'https://via.placeholder.com/150' }} 
              style={styles.profileImage}
            />
            {editMode && (
              <TouchableOpacity 
                style={styles.editProfileImageButton}
                onPress={handlePortfolioImagePicker}
              >
                <Ionicons name="camera" size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.profileHeaderInfo}>
            {editMode ? (
              <TextInput
                style={styles.profileChefName}
                value={editedChefName}
                onChangeText={setEditedChefName}
                placeholder="Chef Name"
                placeholderTextColor="#94A3B8"
              />
            ) : (
              <Text style={styles.profileChefName}>
                {chefProfileData?.chefName || profile?.userName || 'Chef Name'}
              </Text>
            )}
            
            <View style={styles.profileBadgesRow}>
              {editMode ? (
                <View style={{ width: '100%', marginTop: 8 }}>
                  <Text style={[styles.profileBadgeText, { color: '#94A3B8', marginBottom: 4 }]}>Expertise Category</Text>
                  <TouchableOpacity
                    style={[styles.profileBadge, { 
                      backgroundColor: 'rgba(139, 92, 246, 0.15)', 
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                      paddingHorizontal: 12,
                      paddingVertical: 8
                    }]}
                    onPress={() => setShowExpertiseDropdown(!showExpertiseDropdown)}
                  >
                    <Ionicons name="school" size={14} color="#8B5CF6" />
                    <Text style={[styles.profileBadgeText, { color: '#8B5CF6', flex: 1 }]}>
                      {editedExpertiseCategory || 'Select expertise'}
                    </Text>
                    <Ionicons name={showExpertiseDropdown ? "chevron-up" : "chevron-down"} size={16} color="#8B5CF6" />
                  </TouchableOpacity>
                  {showExpertiseDropdown && (
                    <View style={[styles.dropdown, { marginTop: 4 }]}>
                      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                        {EXPERTISE_CATEGORIES.map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setEditedExpertiseCategory(category)
                              setShowExpertiseDropdown(false)
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{category}</Text>
                            {editedExpertiseCategory === category && (
                              <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  {chefProfileData?.expertiseCategory && (
                    <View style={[styles.profileBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                      <Ionicons name="school" size={14} color="#8B5CF6" />
                      <Text style={[styles.profileBadgeText, { color: '#FFFFFF' }]}>{chefProfileData.expertiseCategory}</Text>
                    </View>
                  )}
                </>
              )}
              
              {editMode ? (
                <View style={{ width: '100%', marginTop: 8 }}>
                  <Text style={[styles.profileBadgeText, { color: '#94A3B8', marginBottom: 4 }]}>Years of Experience</Text>
                  <View style={[styles.profileBadge, { 
                    backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  }]}>
                    <Ionicons name="time" size={14} color="#3B82F6" />
                    <TextInput
                      style={[styles.profileBadgeText, { color: '#3B82F6', flex: 1, padding: 0 }]}
                      value={editedYearsOfExperience > 0 ? editedYearsOfExperience.toString() : ''}
                      onChangeText={(text: string) => {
                        const num = parseInt(text) || 0
                        setEditedYearsOfExperience(Math.max(0, Math.min(100, num)))
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={[styles.profileBadgeText, { color: '#3B82F6' }]}>years</Text>
                  </View>
                </View>
              ) : (
                <>
                  {chefProfileData?.yearsOfExperience !== undefined && (
                    <View style={[styles.profileBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                      <Ionicons name="time" size={14} color="#3B82F6" />
                      <Text style={[styles.profileBadgeText, { color: '#3B82F6' }]}>{chefProfileData.yearsOfExperience}+ years</Text>
                    </View>
                  )}
                </>
              )}
              
              {!editMode && profile?.isPro && (
                <View style={[styles.profileBadge, { backgroundColor: 'rgba(250, 204, 21, 0.15)', borderColor: 'rgba(250, 204, 21, 0.3)' }]}>
                  <Ionicons name="diamond" size={14} color="#FACC15" />
                  <Text style={[styles.profileBadgeText, { color: '#FACC15' }]}>PRO</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Chef Professional Summary */}
        <View style={styles.chefBioCard}>
          {editMode ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[styles.profileSectionTitle, { fontSize: 14, marginBottom: 0 }]}>Professional Summary</Text>
                <Text style={[styles.profileBadgeText, { color: '#94A3B8' }]}>
                  {editedProfessionalSummary.length}/500
                </Text>
              </View>
              <TextInput
                style={[styles.chefBioText, { minHeight: 100 }]}
                value={editedProfessionalSummary}
                onChangeText={(text: string) => {
                  if (text.length <= 500) {
                    setEditedProfessionalSummary(text)
                  }
                }}
                placeholder="Describe your teaching style and what makes you unique (50-500 characters)"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />
            </>
          ) : (
            <Text style={styles.chefBioText}>
              {chefProfileData?.professionalSummary || 'No professional summary available'}
            </Text>
          )}
        </View>

        {/* Detailed Stats Grid */}
        <View style={styles.detailedStatsCard}>
          <Text style={styles.profileSectionTitle}>Performance Statistics</Text>
          
          <View style={styles.profileStatsGrid}>
            <View style={styles.statGridItem}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Ionicons name="restaurant-outline" size={15} color="#22C55E" />
              </View>
              <Text style={styles.statGridValue}>{chefStats.totalRecipes}</Text>
              <Text style={styles.statGridLabel}>Total Recipes</Text>
            </View>

            <View style={styles.statGridItem}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="book-outline" size={15} color="#8B5CF6" />
              </View>
              <Text style={styles.statGridValue}>{chefStats.totalCourses}</Text>
              <Text style={styles.statGridLabel}>Total Courses</Text>
            </View>

            <View style={styles.statGridItem}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="people-outline" size={15} color="#3B82F6" />
              </View>
              <Text style={styles.statGridValue}>{chefStats.totalSubscribers}</Text>
              <Text style={styles.statGridLabel}>Subscribers</Text>
            </View>

            <View style={styles.statGridItem}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="star" size={15} color="#F59E0B" />
              </View>
              <Text style={styles.statGridValue}>{chefStats.averageRating}</Text>
              <Text style={styles.statGridLabel}>Avg Rating</Text>
            </View>

            <View style={styles.statGridItem}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="flag-outline" size={15} color="#EF4444" />
              </View>
              <Text style={styles.statGridValue}>
                {chefProfileData?.reports?.length || 0}
              </Text>
              <Text style={styles.statGridLabel}>Total Reports</Text>
            </View>

            <View style={styles.statGridItem}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="heart-outline" size={15} color="#EC4899" />
              </View>
              <Text style={styles.statGridValue}>
                {userRecipes.filter(r => r.isPremium).length + userCourses.filter(c => c.isPremium).length}
              </Text>
              <Text style={styles.statGridLabel}>Premium Items</Text>
            </View>
          </View>

          {/* Reports Warning */}
          {(chefProfileData?.reports?.length || 0) >= 8 && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#EF4444',
                  marginBottom: 6
                }}>
                  ⚠️ Account Warning
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#E5E7EB',
                  lineHeight: 20
                }}>
                  Your account has received repeated reports and will be banned if you continue to violate community guidelines. Please review our policies and ensure your content meets our standards.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Restricted Content Section */}
        <View style={styles.contentSectionCard}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="warning-outline" size={20} color="#F97316" />
              <Text style={[styles.profileSectionTitle, { marginBottom: 0 }]}>Restricted Content</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Text style={[styles.countBadgeText, { color: '#F97316' }]}>
                {restrictedRecipes.length + restrictedCourses.length}
              </Text>
            </View>
          </View>

          {restrictedRecipes.length === 0 && restrictedCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#22C55E" />
              <Text style={styles.emptyStateText}>No restricted content</Text>
              <Text style={styles.emptyStateSubtext}>Keep up the great work!</Text>
            </View>
          ) : (
            <>
              {restrictedRecipes.length > 0 && (
                <View style={styles.contentSubSection}>
                  <Text style={styles.subSectionTitle}>Recipes ({restrictedRecipes.length})</Text>
                  {restrictedRecipes.map(recipe => (
                    <View key={`restricted-recipe-${recipe.id}`} style={styles.contentItem}>
                      <Image source={{ uri: recipe.image }} style={styles.contentItemImage} />
                      <View style={styles.contentItemInfo}>
                        <Text style={styles.contentItemTitle} numberOfLines={1}>{recipe.title}</Text>
                        <Text style={[styles.contentItemMeta, { color: '#F97316' }]}>Will be banned if more reports.</Text>
                      </View>
                      <Ionicons name="alert-circle" size={18} color="#F97316" />
                    </View>
                  ))}
                </View>
              )}

              {restrictedCourses.length > 0 && (
                <View style={[styles.contentSubSection, restrictedRecipes.length > 0 && { marginTop: 16 }]}>
                  <Text style={styles.subSectionTitle}>Courses ({restrictedCourses.length})</Text>
                  {restrictedCourses.map(course => (
                    <View key={`restricted-course-${course.id}`} style={styles.contentItem}>
                      <Image source={{ uri: course.image }} style={styles.contentItemImage} />
                      <View style={styles.contentItemInfo}>
                        <Text style={styles.contentItemTitle} numberOfLines={1}>{course.title}</Text>
                        <Text style={[styles.contentItemMeta, { color: '#F97316' }]}>Under Review</Text>
                      </View>
                      <Ionicons name="alert-circle" size={20} color="#F97316" />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Banned Content Section */}
        <View style={[styles.contentSectionCard, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="ban-outline" size={20} color="#EF4444" />
              <Text style={[styles.profileSectionTitle, { marginBottom: 0 }]}>Banned Content</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.countBadgeText, { color: '#EF4444' }]}>
                {bannedRecipes.length + bannedCourses.length}
              </Text>
            </View>
          </View>

          {bannedRecipes.length === 0 && bannedCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#22C55E" />
              <Text style={styles.emptyStateText}>No banned content</Text>
              <Text style={styles.emptyStateSubtext}>All your content is in good standing</Text>
            </View>
          ) : (
            <>
              {bannedRecipes.length > 0 && (
                <View style={styles.contentSubSection}>
                  <Text style={styles.subSectionTitle}>Recipes ({bannedRecipes.length})</Text>
                  {bannedRecipes.map(recipe => (
                    <View key={`banned-recipe-${recipe.id}`} style={styles.contentItem}>
                      <Image source={{ uri: recipe.image }} style={[styles.contentItemImage, { opacity: 0.5 }]} />
                      <View style={styles.contentItemInfo}>
                        <Text style={[styles.contentItemTitle, { color: '#94A3B8' }]} numberOfLines={1}>{recipe.title}</Text>
                        <Text style={[styles.contentItemMeta, { color: '#EF4444' }]}>Permanently Banned</Text>
                      </View>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </View>
                  ))}
                </View>
              )}

              {bannedCourses.length > 0 && (
                <View style={[styles.contentSubSection, bannedRecipes.length > 0 && { marginTop: 16 }]}>
                  <Text style={styles.subSectionTitle}>Courses ({bannedCourses.length})</Text>
                  {bannedCourses.map(course => (
                    <View key={`banned-course-${course.id}`} style={styles.contentItem}>
                      <Image source={{ uri: course.image }} style={[styles.contentItemImage, { opacity: 0.5 }]} />
                      <View style={styles.contentItemInfo}>
                        <Text style={[styles.contentItemTitle, { color: '#94A3B8' }]} numberOfLines={1}>{course.title}</Text>
                        <Text style={[styles.contentItemMeta, { color: '#EF4444' }]}>Permanently Banned</Text>
                      </View>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderFeedbackDropdown = () => (
    <View style={styles.feedbackContainer}>
      {feedbacks.map((feedback) => (
        <View key={feedback.id} style={styles.feedbackItem}>
          <View style={styles.feedbackContent}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackUserName}>{feedback.userName}</Text>
              <View style={styles.feedbackRating}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons key={i} name="star" size={12} color={i < feedback.rating ? "#FACC15" : "#374151"} />
                ))}
              </View>
            </View>
            <Text style={styles.feedbackComment}>{feedback.comment}</Text>
            {feedback.recipeTitle && <Text style={styles.feedbackRecipe}>Recipe: {feedback.recipeTitle}</Text>}
            <Text style={styles.feedbackDate}>{feedback.date}</Text>
          </View>
        </View>
      ))}
    </View>
  )

  const renderChefActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}
        onPress={() => setShowRecipeModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="restaurant-outline" size={20} color="#22C55E" />
        <Text style={[styles.actionText, { color: "#22C55E" }]}>Upload Recipe</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: 'rgba(246, 196, 59, 0.18)', borderColor: 'rgba(246, 196, 59, 0.2)' }]}
        onPress={() => setShowCourseModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="school-outline" size={20} color="#f6c43bfb" />
        <Text style={[styles.actionText, { color: "#f6c43bfb" }]}>Create Course</Text>
      </TouchableOpacity>
    </View>
  )

  const renderContentManagement = () => {
    // For Food Explorer (user), use foodExplorerTab and filter published only
    // For Chef Dashboard, use managementTab and show all
    const currentTab = userType === "user" ? foodExplorerTab : managementTab;
    const recipesToShow = userType === "user" 
      ? explorerRecipes.filter(r => r.isPublished)
      : userRecipes;
    const coursesToShow = userType === "user"
      ? explorerCourses.filter(c => c.isPublished)
      : userCourses;

    return (
      <View style={styles.contentManagementContainer}>
        {/* Minimalist Tab Selector - Only show for Chef Dashboard */}
        {userType === "chef" && (
          <View style={styles.minimalistTabSelector}>
            <TouchableOpacity
              style={styles.minimalistTab}
              onPress={() => setManagementTab("recipes")}
            >
              <Text style={[styles.minimalistTabText, managementTab === "recipes" && styles.minimalistTabTextActive]}>
                Recipes ({userRecipes.length})
              </Text>
              {managementTab === "recipes" && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.minimalistTab}
              onPress={() => setManagementTab("courses")}
            >
              <Text style={[styles.minimalistTabText, managementTab === "courses" && styles.minimalistTabTextActive]}>
                Courses ({userCourses.length})
              </Text>
              {managementTab === "courses" && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          </View>
        )}

        {/* Management Content */}
        <View style={styles.managementContent}>
          {currentTab === "recipes" ? (
            recipesToShow.length > 0 ? (
              recipesToShow.map((recipe, index) => (
                <View key={recipe.id || `recipe-${index}`}>
                  {renderManagementRecipeCard(recipe, index)}
                </View>
              ))
            ) : (
              <View style={styles.emptyManagement}>
                <Ionicons name="restaurant-outline" size={32} color="#64748B" />
                <Text style={styles.emptyManagementText}>
                  {userType === "user" ? "No recipes available" : "No recipes uploaded yet"}
                </Text>
                <Text style={styles.emptyManagementSubtext}>
                  {userType === "user" 
                    ? "Check back later for new recipes" 
                    : "Start by uploading your first recipe"}
                </Text>
              </View>
            )
          ) : (
            coursesToShow.length > 0 ? (
              coursesToShow.map((course, index) => (
                <View key={course.id || `course-${index}`}>
                  {renderManagementCourseCard(course, index)}
                </View>
              ))
            ) : (
              <View style={styles.emptyManagement}>
                <Ionicons name="school-outline" size={32} color="#64748B" />
                <Text style={styles.emptyManagementText}>
                  {userType === "user" ? "No courses available" : "No courses created yet"}
                </Text>
                <Text style={styles.emptyManagementSubtext}>
                  {userType === "user"
                    ? "Check back later for new courses"
                    : "Start by creating your first course"}
                </Text>
              </View>
            )
          )}
        </View>
      </View>
    )
  }

  const renderManagementRecipeCard = (recipe: Recipe, index: number) => {
    const getImageUrl = (image: any): string => {
      if (typeof image === 'string') return image;
      if (image?.url) return image.url;
      if (image?.uri) return image.uri;
      return 'https://via.placeholder.com/400x200?text=No+Image';
    };

    return (
    <TouchableOpacity 
      style={styles.managementCard}
      onPress={() => handleViewRecipe(recipe)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: getImageUrl(recipe.image) }} style={styles.managementCardImage} />
      <View style={styles.managementCardContent}>
        <View style={styles.managementCardHeader}>
          <Text style={styles.managementCardTitle}>{recipe.title}</Text>
          <View style={styles.managementCardBadges}>
            {recipe.isPremium && (
              <View style={styles.managementPremiumBadge}>
                <Ionicons name="diamond" size={12} color="#FACC15" />
                <Text style={styles.managementPremiumBadgeText}>Premium</Text>
              </View>
            )}
            <View style={[styles.statusBadge, !recipe.isPublished && styles.statusBadgeDraft]}>
              <Ionicons 
                name={recipe.isPublished ? "checkmark-circle" : "time-outline"} 
                size={12} 
                color={recipe.isPublished ? "#10B981" : "#F59E0B"} 
              />
              <Text style={[styles.statusBadgeText, !recipe.isPublished && styles.statusBadgeTextDraft]}>
                {recipe.isPublished ? 'Published' : 'Not Published'}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.managementCardDescription} numberOfLines={2}>
          {recipe.description}
        </Text>
        
        <View style={styles.managementCardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{recipe.cookTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#FACC15" />
            <Text style={styles.metaText}>{recipe.rating?.toFixed(1) || '0.0'}</Text>
          </View>
          {recipe.creator && (
            <View style={styles.metaItem}>
              <Ionicons name="person" size={14} color="#a0edf7e0" />
              <Text style={[styles.metaText, { color: '#a0edf7ff' }]}>By: {recipe.creator}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.managementCardActions}>
          {userType === "chef" ? (
            // Chef Dashboard actions: Edit and Delete
            <>
              <TouchableOpacity 
                style={styles.managementActionButton}
                onPress={() => {
                  handleEditRecipe(recipe)
                }}
              >
                <Ionicons name="create" size={16} color="#3B82F6" />
                <Text style={styles.managementActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.managementActionButton, styles.deleteButton]}
                onPress={() => {
                  handleDeleteRecipe(recipe.id)
                }}
              >
                <Ionicons name="trash" size={16} color="#EF4444" />
                <Text style={[styles.managementActionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Food Explorer actions: Report and Rate
            <>
              <TouchableOpacity 
                style={styles.managementActionButton}
                onPress={() => {
                  setExpandedRecipeData(recipe)
                  setShowRecipeReportDialog(true)
                }}
              >
                <Ionicons name="flag" size={16} color="#EF4444" />
                <Text style={styles.managementActionText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.managementActionButton}
                onPress={() => {
                  setExpandedRecipeData(recipe)
                  setShowRecipeRatingDialog(true)
                }}
              >
                <Ionicons name="star" size={16} color="#FACC15" />
                <Text style={styles.managementActionText}>Rate</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  };

  const renderManagementCourseCard = (course: Course, index: number) => {
    const getImageUrl = (image: any): string => {
      if (typeof image === 'string') return image;
      if (image?.url) return image.url;
      if (image?.uri) return image.uri;
      return 'https://via.placeholder.com/400x200?text=No+Image';
    };

    return (
    <TouchableOpacity 
      style={styles.managementCard}
      onPress={() => handleViewCourse(course)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: getImageUrl(course.image) }} style={styles.managementCardImage} />
      <View style={styles.managementCardContent}>
        <View style={styles.managementCardHeader}>
          <Text style={styles.managementCardTitle}>{course.title}</Text>
          <View style={styles.managementCardBadges}>
            {course.isPremium && (
              <View style={styles.managementPremiumBadge}>
                <Ionicons name="diamond" size={12} color="#FACC15" />
                <Text style={styles.managementPremiumBadgeText}>Premium</Text>
              </View>
            )}
            <View style={[styles.statusBadge, !course.isPublished && styles.statusBadgeDraft]}>
              <Ionicons 
                name={course.isPublished ? "checkmark-circle" : "time-outline"} 
                size={12} 
                color={course.isPublished ? "#10B981" : "#F59E0B"} 
              />
              <Text style={[styles.statusBadgeText, !course.isPublished && styles.statusBadgeTextDraft]}>
                {course.isPublished ? 'Published' : 'Not Published'}
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.managementCardDescription} numberOfLines={2}>
          {course.description}
        </Text>
        
        <View style={styles.managementCardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {course.durationValue && course.durationUnit 
                ? `${course.durationValue} ${course.durationUnit}` 
                : course.totalDuration || course.duration || 'N/A'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#FACC15" />
            <Text style={styles.metaText}>{(course.rating || course.averageRating || 0).toFixed(1)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>{course.units?.length || 0} units</Text>
          </View>
        </View>
        
        <View style={styles.coursePriceContainer}>
          <Text style={styles.managementCoursePrice}>{course.category} • {course.skillLevel}</Text>
        </View>
        
        <View style={styles.managementCardActions}>
          {userType === "chef" ? (
            // Chef Dashboard actions: Edit and Delete
            <>
              <TouchableOpacity 
                style={styles.managementActionButton}
                onPress={() => {
                  handleEditCourse(course);
                }}
              >
                <Ionicons name="create" size={16} color="#3B82F6" />
                <Text style={styles.managementActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.managementActionButton, styles.deleteButton]}
                onPress={() => {
                  handleDeleteCourse(course.id);
                }}
              >
                <Ionicons name="trash" size={16} color="#EF4444" />
                <Text style={[styles.managementActionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Food Explorer actions: Report and Rate
            <>
              <TouchableOpacity 
                style={styles.managementActionButton}
                onPress={() => {
                  setExpandedCourseData(course)
                  setShowCourseReportDialog(true)
                }}
              >
                <Ionicons name="flag" size={16} color="#EF4444" />
                <Text style={styles.managementActionText}>Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.managementActionButton}
                onPress={() => {
                  setExpandedCourseData(course)
                  setShowCourseRatingDialog(true)
                }}
              >
                <Ionicons name="star" size={16} color="#FACC15" />
                <Text style={styles.managementActionText}>Rate</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  // Handler functions for view, edit and delete
  const handleViewRecipe = async (recipe: Recipe) => {
    try {
      setIsLoadingRecipeDetails(true)
      // Handle both 'id' and '_id' fields (explorer recipes use _id)
      const recipeId = recipe.id || (recipe as any)._id
      
      console.log('👁️ Fetching recipe details for view:', recipeId)
      const fullRecipe = await chefService.getRecipeById(recipeId)
      
      // Check if premium recipe and user is not pro (but allow author to view)
      const isPro = profile?.isPro && profile?.subscriptionStatus === 'active';
      const isAuthor = (fullRecipe as any).userId?.firebaseUid === profile?.firebaseUid;
      console.log('🔐 Premium Check (ChefDashboard):', { isPremium: fullRecipe.isPremium, isPro, isAuthor, recipeUserFirebaseUid: (fullRecipe as any).userId?.firebaseUid, userFirebaseUid: profile?.firebaseUid })
      
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
      setGeneralErrorMessage('Failed to load recipe details. Please try again.')
      setShowGeneralErrorDialog(true)
    } finally {
      setIsLoadingRecipeDetails(false)
    }
  }

  const handleEditRecipe = async (recipe: Recipe) => {
    try {
      // Fetch full recipe details from backend
      console.log('📝 Fetching recipe details for edit:', recipe.id)
      
      const fullRecipe = await chefService.getRecipeById(recipe.id)
      
      console.log('✅ Full recipe fetched from backend:', fullRecipe)
      console.log('📋 Recipe fields:', {
        title: fullRecipe.title,
        description: fullRecipe.description,
        prepTime: fullRecipe.prepTime,
        cookTime: fullRecipe.cookTime,
        servings: fullRecipe.servings,
        cuisine: fullRecipe.cuisine,
        category: fullRecipe.category,
        difficulty: fullRecipe.difficulty,
        isPremium: fullRecipe.isPremium,
        nutrition: fullRecipe.nutrition,
        ingredientsCount: fullRecipe.ingredients?.length,
        instructionsCount: fullRecipe.instructions?.length,
      })
      
      // Use full recipe data with all fields for editing
      setEditingRecipe(fullRecipe)
      setShowRecipeModal(true)
      console.log('✏️ Opening recipe edit oooo modal for:', fullRecipe.title)
    } catch (error: any) {
      console.log('❌ Failed to fetch recipe for editing:', error)
      console.log('❌ Error details:', error.message)
      console.log(recipe.id)
      
      // Show error to user instead of opening incomplete form
      setGeneralErrorMessage('Failed to load recipe details.')
      setShowGeneralErrorDialog(true)
      return
      
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    const recipe = userRecipes.find(r => r.id === recipeId)
    if (!recipe) return
    
    // TODO: Add confirmation dialog
    try {
      console.log('🗑️ Deleting recipe:', recipe.title)
      await chefService.deleteRecipe(recipeId)
      setUserRecipes(prev => prev.filter(r => r.id !== recipeId))
      await fetchChefStatsAndFeedback()
      console.log('✅ Recipe deleted successfully')
    } catch (error) {
      console.log('❌ Failed to delete recipe:', error)
    }
  }

  const handleTogglePublish = async () => {
    console.log('🔄 handleTogglePublish called')
    console.log('📊 Recipe data:', {
      hasData: !!expandedRecipeData,
      id: expandedRecipeData?._id || expandedRecipeData?.id,
      title: expandedRecipeData?.title,
      currentStatus: expandedRecipeData?.isPublished
    })
    
    if (!expandedRecipeData) {
      console.log('⚠️ No recipe data available')
      return
    }
    
    setIsPublishing(true)
    try {
      const recipeId = expandedRecipeData._id || expandedRecipeData.id
      
      if (expandedRecipeData.isPublished) {
        console.log('📥 Unpublishing recipe:', expandedRecipeData.title)
        await chefService.unpublishRecipe(recipeId)
        console.log('✅ Recipe unpublished successfully')
        
        // Update local state
        setExpandedRecipeData({ ...expandedRecipeData, isPublished: false })
        setUserRecipes(prev => prev.map(r => 
          (r.id === recipeId || r.id === expandedRecipeData.id) 
            ? { ...r, isPublished: false } 
            : r
        ))
        
        // Reload stats
        await fetchChefStatsAndFeedback()
        
        // Show success dialog
        setPublishSuccessMessage('Your recipe is now offline and only visible to you.')
        setShowPublishSuccessDialog(true)
      } else {
        console.log('📢 Publishing recipe:', expandedRecipeData.title)
        await chefService.publishRecipe(recipeId)
        console.log('✅ Recipe published successfully')
        
        // Update local state
        setExpandedRecipeData({ ...expandedRecipeData, isPublished: true })
        setUserRecipes(prev => prev.map(r => 
          (r.id === recipeId || r.id === expandedRecipeData.id) 
            ? { ...r, isPublished: true } 
            : r
        ))
        
        // Reload stats
        await fetchChefStatsAndFeedback()
        
        // Show success dialog
        setPublishSuccessMessage('Your recipe is now live and visible to food explorers!')
        setShowPublishSuccessDialog(true)
      }
    } catch (error: any) {
      console.log('❌ Failed to toggle publish status:', error)
      setPublishErrorMessage(error.message || 'Failed to update recipe status. Please try again.')
      setShowPublishErrorDialog(true)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleToggleCoursePublish = async () => {
    console.log('🔄 handleToggleCoursePublish called')
    console.log('📊 Course data:', {
      hasData: !!expandedCourseData,
      id: expandedCourseData?._id || expandedCourseData?.id,
      title: expandedCourseData?.title,
      currentStatus: expandedCourseData?.isPublished
    })
    
    if (!expandedCourseData) {
      console.log('⚠️ No course data available')
      return
    }
    
    setIsPublishing(true)
    try {
      const courseId = expandedCourseData._id || expandedCourseData.id
      
      if (expandedCourseData.isPublished) {
        console.log('📥 Unpublishing course:', expandedCourseData.title)
        await chefService.unpublishCourse(courseId)
        console.log('✅ Course unpublished successfully')
        
        // Update local state
        setExpandedCourseData({ ...expandedCourseData, isPublished: false })
        setUserCourses(prev => prev.map(c => 
          (c.id === courseId || c.id === expandedCourseData.id) 
            ? { ...c, isPublished: false } 
            : c
        ))
        
        // Reload stats
        await fetchChefStatsAndFeedback()
        
        // Show success dialog
        setPublishSuccessMessage('Your course is now offline and only visible to you.')
        setShowPublishSuccessDialog(true)
      } else {
        console.log('📢 Publishing course:', expandedCourseData.title)
        await chefService.publishCourse(courseId)
        console.log('✅ Course published successfully')
        
        // Update local state
        setExpandedCourseData({ ...expandedCourseData, isPublished: true })
        setUserCourses(prev => prev.map(c => 
          (c.id === courseId || c.id === expandedCourseData.id) 
            ? { ...c, isPublished: true } 
            : c
        ))
        
        // Reload stats
        await fetchChefStatsAndFeedback()
        
        // Show success dialog
        setPublishSuccessMessage('Your course is now live and visible to learners!')
        setShowPublishSuccessDialog(true)
      }
    } catch (error: any) {
      console.log('❌ Failed to toggle course publish status:', error)
      setPublishErrorMessage(error.message || 'Failed to update course status. Please try again.')
      setShowPublishErrorDialog(true)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleToggleFavoriteRecipe = async () => {
    if (!expandedRecipeData) return
    
    const recipeId = expandedRecipeData._id || expandedRecipeData.id
    const isCurrentlyFavorite = isFavorite(recipeId)
    
    if (isCurrentlyFavorite) {
      // Remove from favorites
      const success = await removeFromFavorites(recipeId)
      if (success) {
        setGeneralSuccessMessage('Recipe removed from favorites')
        setShowGeneralSuccessDialog(true)
      } else {
        setGeneralErrorMessage('Failed to remove from favorites')
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
        setGeneralSuccessMessage('Recipe added to favorites')
        setShowGeneralSuccessDialog(true)
      } else {
        setGeneralErrorMessage('Failed to add to favorites')
        setShowGeneralErrorDialog(true)
      }
    }
  }

  const handleStartCooking = (recipe: any) => {
    if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
      setGeneralErrorMessage('This recipe has no cooking instructions available.')
      setShowGeneralErrorDialog(true)
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

  const handleViewCourse = async (course: Course) => {
    try {
      setIsLoadingCourseDetails(true)
      // Handle both 'id' and '_id' fields (explorer courses use _id)
      const courseId = course.id || (course as any)._id
      
      console.log('👁️ Fetching course details for view:', courseId)
      const fullCourse = await chefService.getCourseById(courseId)
      
      // Check if premium course and user is not pro (but allow author to view)
      const isPro = profile?.isPro && profile?.subscriptionStatus === 'active';
      const isAuthor = (fullCourse as any).userId?.firebaseUid === profile?.firebaseUid;
      console.log('🔐 Premium Check (Course):', { isPremium: fullCourse.isPremium, isPro, isAuthor, courseUserFirebaseUid: (fullCourse as any).userId?.firebaseUid, userFirebaseUid: profile?.firebaseUid })
      
      if (fullCourse.isPremium && !isPro && !isAuthor) {
        setShowPremiumDialog(true)
        setIsLoadingCourseDetails(false)
        return
      }

      setExpandedCourseId(courseId)
      console.log('✅ Full course fetched:', fullCourse.title)
      setExpandedCourseData(fullCourse)
    } catch (error: any) {
      console.log('❌ Failed to fetch course details:', error)
      setExpandedCourseId(null)
      setGeneralErrorMessage('Failed to load course details. Please try again.')
      setShowGeneralErrorDialog(true)
    } finally {
      setIsLoadingCourseDetails(false)
    }
  }

  // Recipe Report/Rate Handlers
  const handleSubmitRecipeReport = async () => {
    if (!recipeReportReason && !recipeReportDescription.trim()) {
      setGeneralErrorMessage("Please select a reason or describe your concern")
      setShowGeneralErrorDialog(true)
      return
    }

    const finalReason = recipeReportReason || "Custom"
    const recipeId = expandedRecipeData._id || expandedRecipeData.id
    
    setIsReportingRecipe(true)
    try {
      await apiClient.post(`/recipes/${recipeId}/report`, {
        reason: finalReason,
        description: recipeReportDescription || recipeReportReason
      })
      setShowRecipeReportDialog(false)
      setRecipeReportReason("")
      setRecipeReportDescription("")
      setGeneralSuccessMessage("Recipe reported successfully. Our team will review this report.")
      setShowGeneralSuccessDialog(true)
    } catch (error: any) {
      setShowRecipeReportDialog(false)
      setGeneralErrorMessage(error.message || "Failed to submit report")
      setShowGeneralErrorDialog(true)
    } finally {
      setIsReportingRecipe(false)
    }
  }

  const handleSubmitRecipeRating = async () => {
    if (recipeRating === 0) {
      setGeneralErrorMessage("Please select a rating")
      setShowGeneralErrorDialog(true)
      return
    }
    
    const recipeId = expandedRecipeData._id || expandedRecipeData.id
    
    setIsRatingRecipe(true)
    try {
      const result = await apiClient.post(`/recipes/${recipeId}/rate`, {
        rating: recipeRating,
        feedback: recipeRatingFeedback
      })
      setShowRecipeRatingDialog(false)
      setRecipeRating(0)
      setRecipeRatingFeedback("")
      setGeneralSuccessMessage("Recipe rating submitted successfully!")
      setShowGeneralSuccessDialog(true)
      
      // Reload data to reflect updated ratings
      if (userType === "chef") {
        await fetchUserRecipes()
      } else {
        await loadExplorerContent()
      }
    } catch (error: any) {
      setShowRecipeRatingDialog(false)
      setGeneralErrorMessage(error.message || "Failed to submit rating")
      setShowGeneralErrorDialog(true)
    } finally {
      setIsRatingRecipe(false)
    }
  }

  // Course Report/Rate Handlers
  const handleSubmitCourseReport = async () => {
    if (!courseReportReason && !courseReportDescription.trim()) {
      setGeneralErrorMessage("Please select a reason or describe your concern")
      setShowGeneralErrorDialog(true)
      return
    }

    const finalReason = courseReportReason || "Custom"
    const courseId = expandedCourseData._id || expandedCourseData.id
    
    setIsReportingCourse(true)
    try {
      await apiClient.post(`/courses/${courseId}/report`, {
        reason: finalReason,
        description: courseReportDescription || courseReportReason
      })
      setShowCourseReportDialog(false)
      setCourseReportReason("")
      setCourseReportDescription("")
      setGeneralSuccessMessage("Course reported successfully. Our team will review this report.")
      setShowGeneralSuccessDialog(true)
    } catch (error: any) {
      setShowCourseReportDialog(false)
      setGeneralErrorMessage(error.message || "Failed to submit report")
      setShowGeneralErrorDialog(true)
    } finally {
      setIsReportingCourse(false)
    }
  }

  const handleSubmitCourseRating = async () => {
    if (courseRating === 0) {
      setGeneralErrorMessage("Please select a rating")
      setShowGeneralErrorDialog(true)
      return
    }
    
    const courseId = expandedCourseData._id || expandedCourseData.id
    
    setIsRatingCourse(true)
    try {
      const result = await apiClient.post(`/courses/${courseId}/rate`, {
        rating: courseRating,
        feedback: courseRatingFeedback
      })
      setShowCourseRatingDialog(false)
      setCourseRating(0)
      setCourseRatingFeedback("")
      setGeneralSuccessMessage("Course rating submitted successfully!")
      setShowGeneralSuccessDialog(true)
      
      // Reload data to reflect updated ratings
      if (userType === "chef") {
        await fetchUserCourses()
      } else {
        await loadExplorerContent()
      }
    } catch (error: any) {
      setShowCourseRatingDialog(false)
      setGeneralErrorMessage(error.message || "Failed to submit rating")
      setShowGeneralErrorDialog(true)
    } finally {
      setIsRatingCourse(false)
    }
  }

  const handleEditCourse = async (course: Course) => {
    try {
      // Fetch full course details from backend
      console.log('📝 Fetching course details for edit:', course.id)
      const fullCourse = await chefService.getCourseById(course.id)
      
      // Use full course data with all fields for editing
      setEditingCourse(fullCourse)
      setShowCourseModal(true)
    } catch (error) {
      console.log('❌ Failed to fetch course for editing:', error)
      // Still open modal with basic data
      setEditingCourse(course)
      setShowCourseModal(true)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    const course = userCourses.find(c => c.id === courseId)
    if (!course) return
    
    // TODO: Add confirmation dialog
    try {
      console.log('🗑️ Deleting course:', course.title)
      await chefService.deleteCourse(courseId)
      setUserCourses(prev => prev.filter(c => c.id !== courseId))
      await fetchChefStatsAndFeedback()
      console.log('✅ Course deleted successfully')
    } catch (error) {
      console.log('❌ Failed to delete course:', error)
    }
  }

  const handleModalClose = () => {
    setShowRecipeModal(false)
    setShowCourseModal(false)
    setEditingRecipe(null)
    setEditingCourse(null)
  }

  // Chef registration handler
  const handleChefRegistration = async (chefData: ChefRegistrationData) => {
    setIsRegisteringChef(true)
    
    try {
      // Call API to register as chef
      const result = await apiClient.post<{ message: string; user: any }>(
        '/auth/register-chef',
        chefData,
        true, // require auth
        15000 // 15 second timeout
      )

      console.log('Chef registration successful:', result)

      // Refresh profile to get updated isChef status
      await refreshProfile()
      
      setShowSuccessDialog(true)
      setIsRegisteringChef(false)
    } catch (error: any) {
      console.log('Chef registration error:', error)
      setRegErrorMessage(error.message || 'Failed to register as chef. Please try again.')
      setShowRegErrorDialog(true)
      setIsRegisteringChef(false)
    }
  }

  const handleCancelChefRegistration = () => {
    setUserType("user") // Switch back to user view
  }

  // Show chef registration screen if user wants to be chef but is not registered yet
  if (userType === "chef" && profile?.isChef === 'no') {
    return (
      <>
        <ChefRegistrationScreen
          onComplete={handleChefRegistration}
          onCancel={handleCancelChefRegistration}
        />

        {/* Success Dialog */}
        <Dialog
          visible={showSuccessDialog}
          type="success"
          title="Welcome Chef!"
          message="You've been successfully registered as a chef. You can now create courses and upload recipes!"
          onClose={() => {
            setShowSuccessDialog(false)
          }}
          confirmText="Get Started"
          autoClose={false}
        />

        {/* Error Dialog */}
        <Dialog
          visible={showRegErrorDialog}
          type="error"
          title="Registration Failed"
          message={regErrorMessage}
          onClose={() => setShowRegErrorDialog(false)}
          confirmText="OK"
        />
      </>
    )
  }

  // Render banned screen if chef is banned
  if (userType === "chef" && profile?.isChef === 'banned') {
    return (
      <LinearGradient
        colors={["#09090b", "#18181b"]}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: 'transparent', paddingHorizontal: 24 }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Ionicons name="ban" size={30} color="#EF4444" />
              </View>
              
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: '#FFFFFF',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Account Banned
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: '#94A3B8',
                textAlign: 'center',
                lineHeight: 20,
                paddingHorizontal: 20
              }}>
                Your chef account has been suspended
              </Text>
            </View>

            {/* Info Card */}
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              width: '100%'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <Ionicons name="information-circle" size={20} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#EF4444',
                    marginBottom: 6
                  }}>
                    Why was I banned?
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#E5E7EB',
                    lineHeight: 18
                  }}>
                    Your account received multiple reports for violating our community guidelines. We take these reports seriously to maintain a safe and enjoyable platform for everyone.
                  </Text>
                </View>
              </View>
            </View>

            {/* Appeal Card */}
            <View style={{
              backgroundColor: 'rgba(250, 204, 21, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(250, 204, 21, 0.3)',
              borderRadius: 12,
              padding: 16,
              width: '100%'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Ionicons name="mail" size={20} color="#FACC15" />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#FACC15',
                    marginBottom: 6
                  }}>
                    Think this was a mistake?
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#E5E7EB',
                    lineHeight: 18,
                    marginBottom: 8
                  }}>
                    If you believe your account was banned in error, you can request a review by contacting us at:
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FACC15',
                    textDecorationLine: 'underline'
                  }}>
                    mealmate.fyp@gmail.com
                  </Text>
                </View>
              </View>
            </View>

            {/* Switch to Food Explorer */}
            <TouchableOpacity
              style={{
                backgroundColor: '#FACC15',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 10,
                marginTop: 24,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
              onPress={() => handleUserTypeSwitch('user')}
            >
              <Ionicons name="restaurant" size={18} color="#1a1a1a" />
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#1a1a1a'
              }}>
                Browse as Food Explorer
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={["#09090b", "#18181b"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
        {/* Screen content */}

        {/* Replace ScrollView with FlatList */}
        <FlatList
          ref={scrollRef}
          data={getSections()}
          renderItem={renderSection}
          keyExtractor={(item: any) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: showFeedbackDropdown ? 40 : 0,
          }}
          scrollEnabled={true}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#22C55E"
              colors={["#22C55E"]}
              progressBackgroundColor="#1F2937"
            />
          }
          onScrollToIndexFailed={(info: any) => {
            // Fallback if scrollToIndex fails
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              scrollRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          removeClippedSubviews={false}
        />

        {/* Recipe Upload Modal */}
        <Modal
          visible={showRecipeModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleModalClose}
        >
          <RecipeUploadModal
            onClose={handleModalClose}
            onSave={async (recipe: Recipe) => {
              await fetchUserRecipes()
              await fetchChefStatsAndFeedback()
              handleModalClose()
            }}
            editingRecipe={editingRecipe}
          />
        </Modal>

        {/* Course Creation Modal */}
        <Modal
          visible={showCourseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleModalClose}
        >
          <CourseCreationModal
            onClose={handleModalClose}
            onSave={async (course: Course) => {
              await fetchUserCourses()
              await fetchChefStatsAndFeedback()
              handleModalClose()
            }}
            editingCourse={editingCourse}
          />
        </Modal>

        {/* Recipe Detail Modal */}
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

                {/* Share and Action Buttons - Different for Chef vs Food Explorer */}
                <View className="flex-row mb-6" style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleShareRecipe(expandedRecipeData)}
                    className="bg-amber-500/15 border border-amber-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={18} color="#FBBF24" />
                    <Text className="text-amber-300 font-bold ml-2 text-sm tracking-wide">Share</Text>
                  </TouchableOpacity>

                  {userType === "chef" ? (
                    // Chef Dashboard actions
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setExpandedRecipeId(null)
                          setExpandedRecipeData(null)
                          // Directly set editing recipe since we already have full data
                          setEditingRecipe(expandedRecipeData)
                          setShowRecipeModal(true)
                          console.log('✏️ Opening recipe edit modal for:', expandedRecipeData.title)
                        }}
                        className="bg-blue-500/15 border border-blue-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={18} color="#3B82F6" />
                        <Text className="text-blue-300 font-bold ml-2 text-sm tracking-wide">Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          console.log('🔘 Publish/Hide button pressed')
                          console.log('📊 Current recipe state:', {
                            id: expandedRecipeData._id || expandedRecipeData.id,
                            title: expandedRecipeData.title,
                            isPublished: expandedRecipeData.isPublished
                          })
                          handleTogglePublish()
                        }}
                        disabled={isPublishing}
                        className={`${expandedRecipeData.isPublished ? 'bg-orange-500/15 border-orange-500/40' : 'bg-emerald-500/15 border-emerald-500/40'} border rounded-xl py-3 flex-row items-center justify-center flex-1 ${isPublishing ? 'opacity-50' : ''}`}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={isPublishing ? "hourglass-outline" : (expandedRecipeData.isPublished ? "eye-off-outline" : "eye-outline")} 
                          size={18} 
                          color={expandedRecipeData.isPublished ? "#FB923C" : "#10B981"} 
                        />
                        <Text className={`${expandedRecipeData.isPublished ? 'text-orange-300' : 'text-emerald-300'} font-bold ml-2 text-sm tracking-wide`}>
                          {isPublishing ? 'Processing...' : (expandedRecipeData.isPublished ? 'Hide' : 'Publish')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Food Explorer actions
                    <>
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
                    </>
                  )}
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

        {/* Course Detail Modal */}
        {expandedCourseId && expandedCourseData && (
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

                  {/* Rating Badge */}
                  <View className="mb-4">
                    <View className="bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-2 self-start">
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={16} color="#FBBF24" />
                        <Text className="text-amber-300 ml-2 text-sm font-bold">
                          {(expandedCourseData.averageRating || 0).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>

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

                {/* Edit and Publish Buttons - Different for Chef vs Food Explorer */}
                <View className="flex-row mb-6" style={{ gap: 12 }}>
                  {userType === "chef" ? (
                    // Chef Dashboard actions
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setExpandedCourseId(null)
                          setExpandedCourseData(null)
                          setEditingCourse(expandedCourseData)
                          setShowCourseModal(true)
                          console.log('✏️ Opening course edit modal for:', expandedCourseData.title)
                        }}
                        className="bg-blue-500/15 border border-blue-500/40 rounded-xl py-3 flex-row items-center justify-center flex-1"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="create-outline" size={18} color="#3B82F6" />
                        <Text className="text-blue-300 font-bold ml-2 text-sm tracking-wide">Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          console.log('🔘 Publish/Hide button pressed')
                          console.log('📊 Current course state:', {
                            id: expandedCourseData._id || expandedCourseData.id,
                            title: expandedCourseData.title,
                            isPublished: expandedCourseData.isPublished
                          })
                          handleToggleCoursePublish()
                        }}
                        disabled={isPublishing}
                        className={`${expandedCourseData.isPublished ? 'bg-orange-500/15 border-orange-500/40' : 'bg-emerald-500/15 border-emerald-500/40'} border rounded-xl py-3 flex-row items-center justify-center flex-1 ${isPublishing ? 'opacity-50' : ''}`}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={isPublishing ? "hourglass-outline" : (expandedCourseData.isPublished ? "eye-off-outline" : "eye-outline")} 
                          size={18} 
                          color={expandedCourseData.isPublished ? "#FB923C" : "#10B981"} 
                        />
                        <Text className={`${expandedCourseData.isPublished ? 'text-orange-300' : 'text-emerald-300'} font-bold ml-2 text-sm tracking-wide`}>
                          {isPublishing ? 'Processing...' : (expandedCourseData.isPublished ? 'Hide' : 'Publish')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Food Explorer actions
                    <>
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
                    </>
                  )}
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
      </View>
      
      {/* Chef Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <LinearGradient
          colors={["#09090b", "#18181b"]}
          style={{ flex: 1 }}
        >
          <View style={[styles.container, { paddingTop: Math.max(insets.top - 30, 0), backgroundColor: 'transparent' }]}> 
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chef Profile</Text>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            >
              {renderChefProfile()}
              
              {/* User Feedback Section */}
              <View style={[styles.contentSectionCard, { marginHorizontal: 24 }]}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                    <Text style={[styles.profileSectionTitle, { marginBottom: 0 }]}>User Feedback</Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Text style={[styles.countBadgeText, { color: '#3B82F6' }]}>
                      {feedbacks.length}
                    </Text>
                  </View>
                </View>

                {feedbacks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#64748B" />
                    <Text style={styles.emptyStateText}>No feedback yet</Text>
                    <Text style={styles.emptyStateSubtext}>Users will see their feedback here</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {feedbacks.map((feedback) => (
                      <View key={feedback.id} style={styles.feedbackItem}>
                        <View style={styles.feedbackContent}>
                          <View style={styles.feedbackHeader}>
                            <Text style={styles.feedbackUserName}>{feedback.userName}</Text>
                            <View style={styles.feedbackRating}>
                              {[...Array(5)].map((_, i) => (
                                <Ionicons key={i} name="star" size={12} color={i < feedback.rating ? "#FACC15" : "#374151"} />
                              ))}
                            </View>
                          </View>
                          <Text style={styles.feedbackComment}>{feedback.comment}</Text>
                          {feedback.recipeTitle && <Text style={styles.feedbackRecipe}>Recipe: {feedback.recipeTitle}</Text>}
                          <Text style={styles.feedbackDate}>{feedback.date}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </Modal>
      
      {/* Publish/Unpublish Success Dialog */}
      <Dialog
        visible={showPublishSuccessDialog}
        type="success"
        title="Success!"
        message={publishSuccessMessage}
        onClose={() => setShowPublishSuccessDialog(false)}
        confirmText="OK"
        autoClose={true}
        autoCloseTime={5500}
      />
      
      {/* Publish/Unpublish Error Dialog */}
      <Dialog
        visible={showPublishErrorDialog}
        type="error"
        title="Error"
        message={publishErrorMessage}
        onClose={() => setShowPublishErrorDialog(false)}
        confirmText="OK"
      />

      {/* General Success Dialog */}
      <CustomDialog
        visible={showGeneralSuccessDialog}
        onClose={() => setShowGeneralSuccessDialog(false)}
        title="Success"
        height={250}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#10B981', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            {generalSuccessMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setShowGeneralSuccessDialog(false)}
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

      {/* General Error Dialog */}
      <CustomDialog
        visible={showGeneralErrorDialog}
        onClose={() => setShowGeneralErrorDialog(false)}
        title="Error"
        height={250}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            {generalErrorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => setShowGeneralErrorDialog(false)}
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

      {/* Premium Content Dialog */}
      <CustomDialog
        visible={showPremiumDialog}
        onClose={() => setShowPremiumDialog(false)}
        title="Premium Content"
        height={280}
      >
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ color: '#F59E0B', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            This is premium content. Upgrade to Pro to access exclusive recipes, courses, and features.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setShowPremiumDialog(false)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: '#6B7280',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#9CA3AF', fontSize: 16, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowPremiumDialog(false)
                try {
                  router.push('/settings/subscription')
                } catch (error) {
                  console.log('Navigation error:', error)
                }
              }}
              style={{
                flex: 1,
                backgroundColor: '#FACC15',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700' }}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomDialog>

      {/* Chef Profile View Modal */}
      {viewingChefProfile && (
        <ChefProfileViewScreen
          visible={!!viewingChefProfile}
          onClose={() => setViewingChefProfile(null)}
          chef={{
            ...viewingChefProfile,
            stats: {
              ...viewingChefProfile.stats,
              // These will be loaded dynamically by ChefProfileViewScreen
              freeRecipesCount: viewingChefProfile.stats?.freeRecipesCount || 0,
              premiumRecipesCount: viewingChefProfile.stats?.premiumRecipesCount || 0,
              coursesCount: viewingChefProfile.stats?.coursesCount || 0,
              totalStudents: viewingChefProfile.stats?.totalStudents || viewingChefProfile.subscribers,
              averageRating: viewingChefProfile.stats?.averageRating || viewingChefProfile.rating,
              totalRatings: viewingChefProfile.stats?.totalRatings || 0,
            }
          }}
          currentUserIsPro={(profile?.isPro ?? false) && (profile?.subscriptionStatus === 'active')}
          currentUserFirebaseUid={profile?.firebaseUid}
          onSubscribeToggle={handleChefSubscriptionToggle}
          onReport={(chefId: string, reason: string, description: string) => {
            console.log("Report chef:", chefId, reason, description)
          }}
          onRate={(chefId: string, rating: number, feedback: string) => {
            console.log("Rate chef:", chefId, rating, feedback)
          }}
        />
      )}

      {/* Recipe Report Dialog */}
      <CustomDialog
        visible={showRecipeReportDialog}
        onClose={() => {
          setShowRecipeReportDialog(false)
          setRecipeReportReason("")
          setRecipeReportDescription("")
        }}
        title="Report Recipe"
        height={450}
      >
        <>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Describe Your Concern:</Text>
            <TextInput
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                padding: 12,
                color: "#FFFFFF",
                fontSize: 14,
                height: 60,
                textAlignVertical: "top"
              }}
              placeholder="Type your reason for reporting this recipe..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={recipeReportDescription}
              onChangeText={setRecipeReportDescription}
            />
            <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Or Select Common Reason:</Text>
          </View>
          
          <ScrollView style={{ maxHeight: 100 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: recipeReportReason === reason ? "rgba(250, 204, 21, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: recipeReportReason === reason ? "#FACC15" : "rgba(255, 255, 255, 0.1)",
                }}
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
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: recipeReportReason === reason ? "#FACC15" : "#475569",
                    marginRight: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {recipeReportReason === reason && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FACC15" }} />
                  )}
                </View>
                <Text style={{ color: "#E5E7EB", fontSize: 14 }}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={() => {
                setShowRecipeReportDialog(false)
                setRecipeReportReason("")
                setRecipeReportDescription("")
              }}
            >
              <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#EF4444",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleSubmitRecipeReport}
              disabled={isReportingRecipe}
            >
              {isReportingRecipe ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Submit Report</Text>
              )}
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
        <View>
          <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginBottom: 16 }}>Select Your Rating:</Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 24 }}>
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

          <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Feedback (Optional):</Text>
          <TextInput
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: 12,
              color: "#FFFFFF",
              fontSize: 14,
              height: 100,
              textAlignVertical: "top"
            }}
            placeholder="Share your thoughts about this recipe..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={recipeRatingFeedback}
            onChangeText={setRecipeRatingFeedback}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
            onPress={() => {
              setShowRecipeRatingDialog(false)
              setRecipeRating(0)
              setRecipeRatingFeedback("")
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmitRecipeRating}
            disabled={recipeRating === 0 || isRatingRecipe}
            style={{
              flex: 1,
              backgroundColor: recipeRating === 0 ? "rgba(250, 204, 21, 0.3)" : "#FACC15",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {isRatingRecipe ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: recipeRating === 0 ? "#94A3B8" : "#1a1a1a", fontSize: 14, fontWeight: "600" }}>Submit Rating</Text>
            )}
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
        height={450}
      >
        <>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Describe Your Concern:</Text>
            <TextInput
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 12,
                padding: 12,
                color: "#FFFFFF",
                fontSize: 14,
                height: 60,
                textAlignVertical: "top"
              }}
              placeholder="Type your reason for reporting this course..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
              value={courseReportDescription}
              onChangeText={setCourseReportDescription}
            />
            <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 }}>Or Select Common Reason:</Text>
          </View>
          
          <ScrollView style={{ maxHeight: 100 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: courseReportReason === reason ? "rgba(250, 204, 21, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  borderWidth: 1,
                  borderColor: courseReportReason === reason ? "#FACC15" : "rgba(255, 255, 255, 0.1)",
                }}
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
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: courseReportReason === reason ? "#FACC15" : "#475569",
                    marginRight: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {courseReportReason === reason && (
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FACC15" }} />
                  )}
                </View>
                <Text style={{ color: "#E5E7EB", fontSize: 14 }}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={() => {
                setShowCourseReportDialog(false)
                setCourseReportReason("")
                setCourseReportDescription("")
              }}
            >
              <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#EF4444",
                padding: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleSubmitCourseReport}
              disabled={isReportingCourse}
            >
              {isReportingCourse ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>Submit Report</Text>
              )}
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
        <View>
          <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginBottom: 16 }}>Select Your Rating:</Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 24 }}>
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

          <Text style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Feedback (Optional):</Text>
          <TextInput
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: 12,
              color: "#FFFFFF",
              fontSize: 14,
              height: 100,
              textAlignVertical: "top"
            }}
            placeholder="Share your thoughts about this course..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
            value={courseRatingFeedback}
            onChangeText={setCourseRatingFeedback}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
            onPress={() => {
              setShowCourseRatingDialog(false)
              setCourseRating(0)
              setCourseRatingFeedback("")
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmitCourseRating}
            disabled={courseRating === 0 || isRatingCourse}
            style={{
              flex: 1,
              backgroundColor: courseRating === 0 ? "rgba(250, 204, 21, 0.3)" : "#FACC15",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {isRatingCourse ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: courseRating === 0 ? "#94A3B8" : "#1a1a1a", fontSize: 14, fontWeight: "600" }}>Submit Rating</Text>
            )}
          </TouchableOpacity>
        </View>
      </CustomDialog>
    </LinearGradient>
  )
}

// Recipe Upload Modal Component
const RecipeUploadModal: React.FC<{ 
  onClose: () => void; 
  onSave: (recipe: Recipe) => void;
  editingRecipe?: any;
}> = ({ onClose, onSave, editingRecipe }) => {
  const isEditMode = !!editingRecipe
  
  // Recipe categories
  const RECIPE_CATEGORIES = [
    "Appetizers", "Breakfast", "Lunch", "Dinner", "Desserts", 
    "Snacks", "Beverages", "Salads", "Soups", "Main Course",
    "Side Dishes", "Baking", "Seafood", "Vegetarian", "Vegan", "Other"
  ]

  // Common cooking units
  const COOKING_UNITS = [
    "gram", "kilogram", "milligram", "ounce", "pound",
    "milliliter", "liter", "cup", "tablespoon", "teaspoon",
    "piece", "slice", "whole", "pinch", "handful",
    "can", "package", "bunch", "clove", "to taste"
  ]

  const formatErrorMessage = (error: any): string => {
    // Handle premium upload restrictions with detailed counts
    if (error.message?.includes('Cannot change to premium') || error.message?.includes('Premium recipe upload not allowed') || error.message?.includes('Premium course upload not allowed')) {
      try {
        // Try to parse the error message to get the counts
        const errorMatch = error.message.match(/\{.*\}/);
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0]);
          
          // Check for the new format with counts
          if (errorData.counts) {
            const { free, premium, required, remaining } = errorData.counts;
            const contentType = error.message.includes('course') ? 'course' : 'recipe';
            
            if (remaining > 0) {
              return `You need to create ${remaining} more free ${contentType}${remaining > 1 ? 's' : ''} before you can upload premium content.\n\nCurrent progress: ${free} free ${contentType}${free !== 1 ? 's' : ''} created (${required} required)`;
            }
          }
          
          // Check for custom message
          if (errorData.message) {
            return errorData.message;
          }
        }
      } catch (parseError) {
        console.log('Failed to parse premium restriction error:', parseError);
      }
      
      // Fallback messages
      if (error.message?.includes('course')) {
        return 'Create 1 free course first to unlock premium course uploads!';
      }
      return 'Create 2 free recipes first to unlock premium recipe uploads!';
    }

    // Handle validation errors
    if (error.message?.includes('Validation failed')) {
      try {
        // Try to parse the validation details from the error message
        const errorMatch = error.message.match(/\{.*\}/);
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0]);
          if (errorData.details && Array.isArray(errorData.details)) {
            // Format validation messages in a user-friendly way
            const formattedMessages = errorData.details.map((detail: string) => {
              // Convert technical messages to user-friendly ones
              if (detail.includes('Description must be at least')) {
                const minChars = detail.match(/at least (\d+) characters/)?.[1] || '20';
                return `Description must be at least ${minChars} characters long`;
              }
              if (detail.includes('Title must be at least')) {
                const minChars = detail.match(/at least (\d+) characters/)?.[1] || '5';
                return `Title must be at least ${minChars} characters long`;
              }
              if (detail.includes('must be a valid email')) {
                return 'Please enter a valid email address';
              }
              if (detail.includes('is required')) {
                const field = detail.split(' ')[0].toLowerCase();
                return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
              }
              if (detail.includes('must be at least')) {
                return detail.replace(/must be at least/, 'must be at least');
              }
              if (detail.includes('must be a number')) {
                return detail.replace(/must be a number/, 'must be a valid number');
              }
              // Return the original detail if no specific formatting applies
              return detail;
            });

            return formattedMessages.join('\n• ');
          }
        }
      } catch (parseError) {
        // If parsing fails, fall back to original error
        console.log('Failed to parse validation error:', parseError);
      }
    }

    return error.message || 'An unexpected error occurred. Please try again.'
  }

  const [recipeData, setRecipeData] = useState({
    title: "",
    description: "",
    isPremium: false,
    difficulty: "Easy" as "Easy" | "Medium" | "Hard",
    prepTime: "",
    cookTime: "",
    servings: "",
    cuisine: "",
    category: "Other",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  })
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [recipeImage, setRecipeImage] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<Array<{id: string; name: string; amount: string; unit: string; notes?: string; showUnitDropdown?: boolean}>>([
    { id: '1', name: '', amount: '', unit: 'gram', notes: '', showUnitDropdown: false }
  ])
  const [instructions, setInstructions] = useState<Array<{id: string; step: number; instruction: string; duration?: string; tips?: string}>>([
    { id: '1', step: 1, instruction: '', duration: '', tips: '' }
  ])
  
  // Dialog states
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  // Pre-populate form when editing
  useEffect(() => {
    if (editingRecipe) {
      console.log('📝 Pre-populating recipe form with:', editingRecipe)
      console.log('📝 Raw data check:', {
        prepTime: editingRecipe.prepTime,
        cookTime: editingRecipe.cookTime,
        servings: editingRecipe.servings,
        cuisine: editingRecipe.cuisine,
        category: editingRecipe.category,
        difficulty: editingRecipe.difficulty,
        nutrition: editingRecipe.nutrition,
        nutritionInfo: editingRecipe.nutritionInfo,
        ingredients: editingRecipe.ingredients,
        instructions: editingRecipe.instructions,
        isPublished: editingRecipe.isPublished,
      })
      
      // Handle nutrition data (backend uses 'nutritionInfo', frontend uses 'nutrition')
      const nutritionData = editingRecipe.nutritionInfo || editingRecipe.nutrition || {}
      
      // Set basic recipe data
      setRecipeData({
        title: editingRecipe.title || '',
        description: editingRecipe.description || '',
        isPremium: editingRecipe.isPremium || false,
        difficulty: editingRecipe.difficulty || 'Easy',
        prepTime: editingRecipe.prepTime?.toString() || '',
        cookTime: editingRecipe.cookTime?.toString() || '',
        servings: editingRecipe.servings?.toString() || '',
        cuisine: editingRecipe.cuisine || '',
        category: editingRecipe.category || 'Other',
        calories: nutritionData.calories?.toString() || '',
        protein: nutritionData.protein?.toString() || '',
        carbs: nutritionData.carbs?.toString() || '',
        fat: nutritionData.fat?.toString() || '',
      })
      
      // Set publish status
      setPublishNow(editingRecipe.isPublished !== undefined ? editingRecipe.isPublished : true)
      
      console.log('✅ Recipe data set:', {
        prepTime: editingRecipe.prepTime?.toString(),
        cookTime: editingRecipe.cookTime?.toString(),
        servings: editingRecipe.servings?.toString(),
        cuisine: editingRecipe.cuisine,
        category: editingRecipe.category,
      })
      
      // Set recipe image (handle both string and object formats)
      const imageUrl = typeof editingRecipe.image === 'string' 
        ? editingRecipe.image 
        : editingRecipe.image?.url || null
      setRecipeImage(imageUrl)
      
      // Set ingredients - ensure we always have at least one ingredient row
      if (editingRecipe.ingredients && editingRecipe.ingredients.length > 0) {
        const mappedIngredients = editingRecipe.ingredients.map((ing: any, index: number) => ({
          id: (index + 1).toString(),
          name: ing.name || '',
          amount: ing.amount?.toString() || '',
          unit: ing.unit || 'gram',
          notes: ing.notes || '',
          showUnitDropdown: false
        }))
        console.log('📝 Mapped ingredients:', mappedIngredients)
        setIngredients(mappedIngredients)
      } else {
        setIngredients([{ id: '1', name: '', amount: '', unit: 'gram', notes: '', showUnitDropdown: false }])
      }
      
      // Set instructions - ensure we always have at least one instruction row
      if (editingRecipe.instructions && editingRecipe.instructions.length > 0) {
        const mappedInstructions = editingRecipe.instructions.map((inst: any, index: number) => ({
          id: (index + 1).toString(),
          step: inst.step || index + 1,
          instruction: inst.instruction || '',
          duration: inst.duration?.toString() || '',
          tips: inst.tips || ''
        }))
        console.log('📝 Mapped instructions:', mappedInstructions)
        setInstructions(mappedInstructions)
      } else {
        setInstructions([{ id: '1', step: 1, instruction: '', duration: '', tips: '' }])
      }
    } else {
      // Reset form for new recipe
      setRecipeData({
        title: '',
        description: '',
        isPremium: false,
        difficulty: 'Easy',
        prepTime: '',
        cookTime: '',
        servings: '',
        cuisine: '',
        category: 'Other',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
      })
      setPublishNow(true)
      setRecipeImage(null)
      setIngredients([{ id: '1', name: '', amount: '', unit: 'gram', notes: '', showUnitDropdown: false }])
      setInstructions([{ id: '1', step: 1, instruction: '', duration: '', tips: '' }])
    }
  }, [editingRecipe])

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setRecipeImage(result.assets[0].uri)
    }
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', amount: '', unit: 'gram', notes: '', showUnitDropdown: false }])
  }

  const handleRemoveImage = () => {
    setRecipeImage(null)
  }

  const toggleUnitDropdown = (id: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, showUnitDropdown: !ing.showUnitDropdown } : { ...ing, showUnitDropdown: false }
    ))
  }

  const selectUnit = (id: string, unit: string) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, unit, showUnitDropdown: false } : ing
    ))
  }

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id))
  }

  const handleUpdateIngredient = (id: string, field: string, value: string) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing))
  }

  const handleAddInstruction = () => {
    setInstructions([...instructions, { id: Date.now().toString(), step: instructions.length + 1, instruction: '', duration: '', tips: '' }])
  }

  const handleRemoveInstruction = (id: string) => {
    const filtered = instructions.filter(inst => inst.id !== id)
    setInstructions(filtered.map((inst, index) => ({ ...inst, step: index + 1 })))
  }

  const handleUpdateInstruction = (id: string, field: string, value: string) => {
    setInstructions(instructions.map(inst => inst.id === id ? { ...inst, [field]: value } : inst))
  }

  const handleSave = () => {
    // ==================== COMPREHENSIVE VALIDATION ====================
    
    // 1. Image validation
    if (!recipeImage) {
      setErrorMessage("Recipe image is required. Please upload an image before submitting.")
      setShowErrorDialog(true)
      return
    }

    // 2. Title validation (min 3 characters)
    if (!recipeData.title.trim()) {
      setErrorMessage("Recipe title is required")
      setShowErrorDialog(true)
      return
    }
    if (recipeData.title.trim().length < 3) {
      setErrorMessage("Recipe title must be at least 3 characters long")
      setShowErrorDialog(true)
      return
    }
    if (recipeData.title.trim().length > 100) {
      setErrorMessage("Recipe title must not exceed 100 characters")
      setShowErrorDialog(true)
      return
    }

    // 3. Description validation (min 15 characters, max 50)
    if (!recipeData.description.trim()) {
      setErrorMessage("Recipe description is required")
      setShowErrorDialog(true)
      return
    }
    if (recipeData.description.trim().length < 15) {
      setErrorMessage("Recipe description must be at least 15 characters long. Please provide more details about your recipe.")
      setShowErrorDialog(true)
      return
    }
    if (recipeData.description.trim().length > 150) {
      setErrorMessage("Recipe description must not exceed 150 characters")
      setShowErrorDialog(true)
      return
    }

    // 4. Category validation
    if (!recipeData.category || recipeData.category === 'Other') {
      setErrorMessage("Please select a valid recipe category")
      setShowErrorDialog(true)
      return
    }

    // 5. Cuisine validation
    if (!recipeData.cuisine.trim()) {
      setErrorMessage("Cuisine type is required (e.g., Italian, Mexican, Chinese)")
      setShowErrorDialog(true)
      return
    }
    if (recipeData.cuisine.trim().length < 3) {
      setErrorMessage("Cuisine type must be at least 3 characters long")
      setShowErrorDialog(true)
      return
    }

    // 6. Servings validation
    if (!recipeData.servings || recipeData.servings.trim() === '') {
      setErrorMessage("Number of servings is required")
      setShowErrorDialog(true)
      return
    }
    const servings = parseInt(recipeData.servings)
    if (isNaN(servings) || servings <= 0) {
      setErrorMessage("Servings must be a valid positive number")
      setShowErrorDialog(true)
      return
    }
    if (servings > 100) {
      setErrorMessage("Servings must not exceed 100")
      setShowErrorDialog(true)
      return
    }

    // 7. Prep time validation
    if (!recipeData.prepTime || recipeData.prepTime.trim() === '') {
      setErrorMessage("Preparation time is required")
      setShowErrorDialog(true)
      return
    }
    const prepTime = parseInt(recipeData.prepTime)
    if (isNaN(prepTime) || prepTime <= 0) {
      setErrorMessage("Prep time must be a valid positive number (in minutes)")
      setShowErrorDialog(true)
      return
    }
    if (prepTime > 1440) {
      setErrorMessage("Prep time must not exceed 24 hours (1440 minutes)")
      setShowErrorDialog(true)
      return
    }

    // 8. Cook time validation
    if (!recipeData.cookTime || recipeData.cookTime.trim() === '') {
      setErrorMessage("Cooking time is required")
      setShowErrorDialog(true)
      return
    }
    const cookTime = parseInt(recipeData.cookTime)
    if (isNaN(cookTime) || cookTime <= 0) {
      setErrorMessage("Cook time must be a valid positive number (in minutes)")
      setShowErrorDialog(true)
      return
    }
    if (cookTime > 1440) {
      setErrorMessage("Cook time must not exceed 24 hours (1440 minutes)")
      setShowErrorDialog(true)
      return
    }

    // 9. Ingredients validation
    const validIngredients = ingredients.filter(ing => ing.name.trim())
    if (validIngredients.length === 0) {
      setErrorMessage("Please add at least one ingredient")
      setShowErrorDialog(true)
      return
    }
    
    // Check each ingredient has required fields
    for (let i = 0; i < validIngredients.length; i++) {
      const ing = validIngredients[i]
      if (!ing.name.trim()) {
        setErrorMessage(`Ingredient ${i + 1}: Name is required`)
        setShowErrorDialog(true)
        return
      }
      if (ing.name.trim().length < 3) {
        setErrorMessage(`Ingredient ${i + 1}: Name must be at least 3 characters`)
        setShowErrorDialog(true)
        return
      }
      if (!ing.amount || ing.amount.trim() === '') {
        setErrorMessage(`Ingredient ${i + 1} (${ing.name}): Amount is required`)
        setShowErrorDialog(true)
        return
      }
      if (!ing.unit || ing.unit.trim() === '') {
        setErrorMessage(`Ingredient ${i + 1} (${ing.name}): Unit is required`)
        setShowErrorDialog(true)
        return
      }
    }

    // 10. Instructions validation
    const validInstructions = instructions.filter(inst => inst.instruction.trim())
    if (validInstructions.length === 0) {
      setErrorMessage("Please add at least one instruction")
      setShowErrorDialog(true)
      return
    }

    // Check each instruction has meaningful content
    for (let i = 0; i < validInstructions.length; i++) {
      const inst = validInstructions[i]
      if (!inst.instruction.trim()) {
        setErrorMessage(`Step ${inst.step}: Instruction text is required`)
        setShowErrorDialog(true)
        return
      }
      if (inst.instruction.trim().length < 10) {
        setErrorMessage(`Step ${inst.step}: Instruction must be at least 10 characters long`)
        setShowErrorDialog(true)
        return
      }
    }

    // 11. Optional nutrition validation (if any field is filled)
    if (recipeData.calories || recipeData.protein || recipeData.carbs || recipeData.fat) {
      if (recipeData.calories && (isNaN(parseInt(recipeData.calories)) || parseInt(recipeData.calories) < 0)) {
        setErrorMessage("Calories must be a valid positive number")
        setShowErrorDialog(true)
        return
      }
      if (recipeData.protein && (isNaN(parseInt(recipeData.protein)) || parseInt(recipeData.protein) < 0)) {
        setErrorMessage("Protein must be a valid positive number")
        setShowErrorDialog(true)
        return
      }
      if (recipeData.carbs && (isNaN(parseInt(recipeData.carbs)) || parseInt(recipeData.carbs) < 0)) {
        setErrorMessage("Carbs must be a valid positive number")
        setShowErrorDialog(true)
        return
      }
      if (recipeData.fat && (isNaN(parseInt(recipeData.fat)) || parseInt(recipeData.fat) < 0)) {
        setErrorMessage("Fat must be a valid positive number")
        setShowErrorDialog(true)
        return
      }
    }

    // All validations passed - proceed to save
    saveRecipe()
  }

  const saveRecipe = async () => {
    // Validate image is uploaded
    if (!recipeImage) {
      setErrorMessage('Please upload a recipe image before submitting.')
      setShowErrorDialog(true)
      return
    }

    setIsUploading(true)
    
    try {
      console.log(isEditMode ? '📝 Starting recipe update process...' : '🍳 Starting recipe upload process...')
      
      // Step 1: Upload image to Cloudinary (only if new image)
      let imageUrl: string | undefined = recipeImage
      if (recipeImage && !recipeImage.startsWith('http')) {
        // Only upload if it's a local URI (not already a cloud URL)
        console.log('📸 Uploading image to Cloudinary...')
        try {
          imageUrl = await chefService.uploadImageToCloudinary(recipeImage)
          console.log('✅ Image uploaded:', imageUrl)
        } catch (error) {
          console.log('❌ Image upload failed:', error)
          setErrorMessage('Failed to upload image. Please try again.')
          setShowErrorDialog(true)
          setIsUploading(false)
          return
        }
      }

      // Step 2: Prepare recipe payload
      const payload: chefService.CreateRecipePayload = {
        title: recipeData.title,
        description: recipeData.description,
        image: imageUrl,
        ingredients: ingredients
          .filter(ing => ing.name.trim())
          .map(ing => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            notes: ing.notes
          })),
        instructions: instructions
          .filter(inst => inst.instruction.trim())
          .map(inst => ({
            step: inst.step,
            instruction: inst.instruction,
            duration: inst.duration,
            tips: inst.tips
          })),
        prepTime: parseInt(recipeData.prepTime),
        cookTime: parseInt(recipeData.cookTime),
        servings: parseInt(recipeData.servings),
        difficulty: recipeData.difficulty,
        cuisine: recipeData.cuisine?.trim() || 'General',
        category: recipeData.category?.trim() || 'Other',
        isPremium: recipeData.isPremium,
        isPublished: publishNow
      }

      // Add nutrition if any field is filled
      if (recipeData.calories || recipeData.protein || recipeData.carbs || recipeData.fat) {
        payload.nutrition = {
          calories: recipeData.calories ? parseInt(recipeData.calories) : undefined,
          protein: recipeData.protein ? parseInt(recipeData.protein) : undefined,
          carbs: recipeData.carbs ? parseInt(recipeData.carbs) : undefined,
          fat: recipeData.fat ? parseInt(recipeData.fat) : undefined
        }
      }

      console.log(isEditMode ? '📤 Updating recipe on backend...' : '📤 Sending recipe to backend...')
      
      // Step 3: Create or Update recipe via API
      let savedRecipe: any
      if (isEditMode && editingRecipe) {
        const recipeId =  editingRecipe.id || editingRecipe._id
        console.log('🔄 Updating recipe with ID:', recipeId)
        if (!recipeId) {
          throw new Error('Recipe ID is missing for update operation')
        }
        savedRecipe = await chefService.updateRecipe(recipeId, payload)
        console.log('✅ Recipe updated successfully, ID:', savedRecipe._id)
      } else {
        savedRecipe = await chefService.createRecipe(payload)
        console.log('✅ Recipe created successfully, ID:', savedRecipe._id)
      }

      // Step 4: Convert backend recipe to local Recipe format and notify parent
      const localRecipe: Recipe = {
        id: savedRecipe._id,
        title: savedRecipe.title,
        description: savedRecipe.description,
        image: getImageUrl(savedRecipe.image),
        cookTime: `${savedRecipe.prepTime + savedRecipe.cookTime}m`,
        difficulty: savedRecipe.difficulty as "Easy" | "Medium" | "Hard",
        rating: 5.0,
        isPremium: savedRecipe.isPremium,
        chefName: "You"
      }

      onSave(localRecipe)
      setShowSuccessDialog(true)
      setIsUploading(false)
    } catch (error: any) {
      const formattedError = formatErrorMessage(error)
      console.log('❌ Recipe creation failed:', formattedError)
      setErrorMessage(formattedError)
      setShowErrorDialog(true)
      setIsUploading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.modalContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={["#09090b", "#18181b"]} style={StyleSheet.absoluteFill} />

      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{isEditMode ? 'Edit Recipe' : 'Upload New Recipe'}</Text>
        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.modalContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Image Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recipe Image *</Text>
          <TouchableOpacity 
            style={[styles.imageUploadBox, recipeImage && styles.imageUploadBoxFilled]}
            onPress={handleImagePicker}
          >
            {recipeImage ? (
              <>
                <Image source={{ uri: recipeImage }} style={styles.uploadedImage} />
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#eed52eff' }}
                  onPress={handleRemoveImage}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#f3d411ff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imageUploadContent}>
                <Ionicons name="camera" size={40} color="#64748B" />
                <Text style={styles.imageUploadText}>Tap to upload recipe image *</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Recipe Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipe Title *</Text>
            <TextInput
              style={styles.textInput}
              value={recipeData.title}
              onChangeText={(text: string) => setRecipeData({ ...recipeData, title: text })}
              placeholder="Enter recipe title"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={recipeData.description}
              onChangeText={(text: string) => setRecipeData({ ...recipeData, description: text })}
              placeholder="Describe your recipe"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <TouchableOpacity
              style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={{ color: recipeData.category === 'Other' ? '#64748B' : 'white', fontSize: 16 }}>
                {recipeData.category || 'Select category'}
              </Text>
              <Ionicons name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, marginTop: 8, maxHeight: 200, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {RECIPE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' }}
                      onPress={() => {
                        setRecipeData({ ...recipeData, category: cat })
                        setShowCategoryDropdown(false)
                      }}
                    >
                      <Text style={{ color: recipeData.category === cat ? '#FACC15' : 'white', fontSize: 15, fontWeight: recipeData.category === cat ? '600' : '400' }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Cuisine Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cuisine *</Text>
            <TextInput
              style={styles.textInput}
              value={recipeData.cuisine}
              onChangeText={(text: string) => setRecipeData({ ...recipeData, cuisine: text })}
              placeholder="e.g., Italian, Mexican, Chinese"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Recipe Info Grid */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipe Info *</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.servings}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, servings: text })}
                  placeholder="Servings"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.prepTime}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, prepTime: text })}
                  placeholder="Prep (min)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.cookTime}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, cookTime: text })}
                  placeholder="Cook (min)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Premium & Publish Options */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRecipeData({ ...recipeData, isPremium: !recipeData.isPremium })}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, recipeData.isPremium && styles.checkboxActive]}>
                {recipeData.isPremium && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Premium Recipe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.checkboxRow, { marginTop: 12 }]}
              onPress={() => setPublishNow(!publishNow)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, !publishNow && styles.checkboxActive]}>
                {!publishNow && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.checkboxLabel}>Don't Publish Now</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Difficulty Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Difficulty Level</Text>
            <View style={styles.difficultySelector}>
              {["Easy", "Medium", "Hard"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.difficultyButton, recipeData.difficulty === level && styles.difficultyButtonActive]}
                  onPress={() => setRecipeData({ ...recipeData, difficulty: level as any })}
                >
                  <Text style={[styles.difficultyText, recipeData.difficulty === level && styles.difficultyTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nutrition Info */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nutrition Info (per serving)</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.calories}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, calories: text })}
                  placeholder="Calories"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.protein}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, protein: text })}
                  placeholder="Protein (g)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.carbs}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, carbs: text })}
                  placeholder="Carbs (g)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.fat}
                  onChangeText={(text: string) => setRecipeData({ ...recipeData, fat: text })}
                  placeholder="Fat (g)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.inputLabel}>Ingredients *</Text>
              <TouchableOpacity
                onPress={handleAddIngredient}
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="add" size={16} color="#22C55E" />
                  <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '600' }}>Add</Text>
                </View>
              </TouchableOpacity>
            </View>
            {ingredients.map((ingredient, index) => (
              <View key={ingredient.id} style={{ marginBottom: 12, backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#FACC15', fontSize: 14, fontWeight: '600' }}>Ingredient {index + 1}</Text>
                  {ingredients.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(ingredient.id)}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>Remove</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.textInput, { marginBottom: 8 }]}
                  value={ingredient.name}
                  onChangeText={(text: string) => handleUpdateIngredient(ingredient.id, 'name', text)}
                  placeholder="Ingredient name"
                  placeholderTextColor="#64748B"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={ingredient.amount}
                    onChangeText={(text: string) => handleUpdateIngredient(ingredient.id, 'amount', text)}
                    placeholder="Amount"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                  />
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }]}
                      onPress={() => toggleUnitDropdown(ingredient.id)}
                    >
                      <Text style={{ color: ingredient.unit ? 'white' : '#64748B', fontSize: 15 }}>
                        {ingredient.unit || 'Unit'}
                      </Text>
                      <Ionicons name={ingredient.showUnitDropdown ? "chevron-up" : "chevron-down"} size={18} color="#64748B" />
                    </TouchableOpacity>
                    {ingredient.showUnitDropdown && (
                      <View style={{ position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: 'rgba(30, 30, 30, 0.98)', borderRadius: 8, maxHeight: 180, zIndex: 1000, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}>
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                          {COOKING_UNITS.map((unit) => (
                            <TouchableOpacity
                              key={unit}
                              style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' }}
                              onPress={() => selectUnit(ingredient.id, unit)}
                            >
                              <Text style={{ color: ingredient.unit === unit ? '#FACC15' : 'white', fontSize: 14, fontWeight: ingredient.unit === unit ? '600' : '400' }}>
                                {unit}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  value={ingredient.notes}
                  onChangeText={(text: string) => handleUpdateIngredient(ingredient.id, 'notes', text)}
                  placeholder="Notes (optional)"
                  placeholderTextColor="#64748B"
                />
              </View>
            ))}
          </View>

          {/* Instructions Section */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.inputLabel}>Instructions *</Text>
              <TouchableOpacity
                onPress={handleAddInstruction}
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="add" size={16} color="#3B82F6" />
                  <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '600' }}>Add Step</Text>
                </View>
              </TouchableOpacity>
            </View>
            {instructions.map((instruction, index) => (
              <View key={instruction.id} style={{ marginBottom: 12, backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FACC15', fontSize: 14, fontWeight: 'bold' }}>{instruction.step}</Text>
                    </View>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Step {instruction.step}</Text>
                  </View>
                  {instructions.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveInstruction(instruction.id)}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>Remove</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.textInput, styles.textArea, { marginBottom: 8 }]}
                  value={instruction.instruction}
                  onChangeText={(text: string) => handleUpdateInstruction(instruction.id, 'instruction', text)}
                  placeholder="Enter instruction"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={instruction.duration}
                    onChangeText={(text: string) => handleUpdateInstruction(instruction.id, 'duration', text)}
                    placeholder="Duration (min)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 2 }]}
                    value={instruction.tips}
                    onChangeText={(text: string) => handleUpdateInstruction(instruction.id, 'tips', text)}
                    placeholder="Tips (optional)"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={{ paddingTop: 8, paddingBottom: 32, paddingHorizontal: 20 }}>
          <TouchableOpacity 
            style={[styles.saveButton, isUploading && { opacity: 0.5 }]} 
            onPress={handleSave}
            disabled={isUploading}
          >
            <View style={[styles.saveButtonGradient, { backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderRadius: 18, borderColor: 'rgba(250, 204, 21, 0.4)' }]}>
              {isUploading ? (
                <>
                  <Ionicons name="hourglass-outline" size={20} color="#FACC15" />
                  <Text style={[styles.saveButtonText, { color: '#FACC15', fontSize: 18, fontWeight: '700' }]}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FACC15" />
                  <Text style={[styles.saveButtonText, { color: '#FACC15', fontSize: 18, fontWeight: '700' }]}>{isEditMode ? 'Update Recipe' : 'Upload Recipe'}</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Dialog
        visible={showErrorDialog}
        type="error"
        title="Validation Error"
        message={errorMessage}
        onClose={() => setShowErrorDialog(false)}
        confirmText="OK"
      />

      <Dialog
        visible={showSuccessDialog}
        type="success"
        title={isEditMode ? "Recipe Updated!" : "Recipe Uploaded!"}
        message={isEditMode ? "Your recipe has been updated successfully" : "Your recipe has been uploaded successfully"}
        onClose={() => {
          setShowSuccessDialog(false)
          onClose()
        }}
        confirmText="OK"
        autoClose={true}
        autoCloseTime={2000}
      />
    </KeyboardAvoidingView>
  )
}

// Course Creation Modal Component
const CourseCreationModal: React.FC<{ 
  onClose: () => void; 
  onSave: (course: Course) => void;
  editingCourse?: any;
}> = ({ onClose, onSave, editingCourse }) => {
  const isEditMode = !!editingCourse
  
  // Course categories - Must match backend enum values
  const COURSE_CATEGORIES = [
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
  ]

  const formatErrorMessage = (error: any): string => {
    // Handle premium upload restrictions with detailed counts
    if (error.message?.includes('Cannot change to premium') || error.message?.includes('Premium recipe upload not allowed') || error.message?.includes('Premium course upload not allowed')) {
      try {
        // Try to parse the error message to get the counts
        const errorMatch = error.message.match(/\{.*\}/);
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0]);
          
          // Check for the new format with counts
          if (errorData.counts) {
            const { free, premium, required, remaining } = errorData.counts;
            const contentType = error.message.includes('course') ? 'course' : 'recipe';
            
            if (remaining > 0) {
              return `You need to create ${remaining} more free ${contentType}${remaining > 1 ? 's' : ''} before you can upload premium content.\n\nCurrent progress: ${free} free ${contentType}${free !== 1 ? 's' : ''} created (${required} required)`;
            }
          }
          
          // Check for custom message
          if (errorData.message) {
            return errorData.message;
          }
        }
      } catch (parseError) {
        console.log('Failed to parse premium restriction error:', parseError);
      }
      
      // Fallback messages
      if (error.message?.includes('course')) {
        return 'Create 1 free course first to unlock premium course uploads!';
      }
      return 'Create 2 free recipes first to unlock premium recipe uploads!';
    }

    // Handle validation errors
    if (error.message?.includes('Validation failed')) {
      try {
        // Try to parse the validation details from the error message
        const errorMatch = error.message.match(/\{.*\}/);
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[0]);
          if (errorData.details && Array.isArray(errorData.details)) {
            // Format validation messages in a user-friendly way
            const formattedMessages = errorData.details.map((detail: string) => {
              // Convert technical messages to user-friendly ones
              if (detail.includes('Description must be at least')) {
                const minChars = detail.match(/at least (\d+) characters/)?.[1] || '20';
                return `Description must be at least ${minChars} characters long`;
              }
              if (detail.includes('Title must be at least')) {
                const minChars = detail.match(/at least (\d+) characters/)?.[1] || '5';
                return `Title must be at least ${minChars} characters long`;
              }
              if (detail.includes('must be a valid email')) {
                return 'Please enter a valid email address';
              }
              if (detail.includes('is required')) {
                const field = detail.split(' ')[0].toLowerCase();
                return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
              }
              if (detail.includes('must be at least')) {
                return detail.replace(/must be at least/, 'must be at least');
              }
              if (detail.includes('must be a number')) {
                return detail.replace(/must be a number/, 'must be a valid number');
              }
              // Return the original detail if no specific formatting applies
              return detail;
            });

            return formattedMessages.join('\n• ');
          }
        }
      } catch (parseError) {
        // If parsing fails, fall back to original error
        console.log('Failed to parse validation error:', parseError);
      }
    }

    return error.message || 'An unexpected error occurred. Please try again.'
  }

  const [currentStep, setCurrentStep] = useState<'info' | 'units'>(('info'))
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showDurationUnitDropdown, setShowDurationUnitDropdown] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    durationValue: "",
    durationUnit: "weeks" as "minutes" | "hours" | "days" | "weeks" | "months",
    skillLevel: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    category: "Other",
    isPremium: false,
  })
  const [courseImage, setCourseImage] = useState<string | null>(null)
  const [units, setUnits] = useState<Array<{
    id: string
    title: string
    objective: string
    content: string
    steps: Array<{id: string; text: string}>
    commonErrors: Array<{id: string; text: string}>
    bestPractices: Array<{id: string; text: string}>
  }>>([{
    id: '1',
    title: '',
    objective: '',
    content: '',
    steps: [{id: '1', text: ''}],
    commonErrors: [{id: '1', text: ''}],
    bestPractices: [{id: '1', text: ''}]
  }])
  
  // Dialog states
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  // Pre-populate form when editing
  useEffect(() => {
    if (editingCourse) {
      console.log('📝 Pre-populating course form with:', editingCourse)
      
      // Set basic course data
      setCourseData({
        title: editingCourse.title || '',
        description: editingCourse.description || '',
        durationValue: editingCourse.durationValue?.toString() || '',
        durationUnit: editingCourse.durationUnit || 'weeks',
        skillLevel: editingCourse.skillLevel || 'Beginner',
        category: editingCourse.category || 'Other',
        isPremium: editingCourse.isPremium || false,
      })
      
      // Set publish status
      setPublishNow(editingCourse.isPublished !== undefined ? editingCourse.isPublished : true)
      
      // Set course image - handle both string and object formats
      const imageUrl = editingCourse.image || 
        (editingCourse.coverImage && typeof editingCourse.coverImage === 'object' ? editingCourse.coverImage.url : editingCourse.coverImage) || 
        null
      setCourseImage(imageUrl)
      
      // Set units
      if (editingCourse.units && editingCourse.units.length > 0) {
        setUnits(
          editingCourse.units.map((unit: any, index: number) => ({
            id: (index + 1).toString(),
            title: unit.title || '',
            objective: unit.objective || '',
            content: unit.content || '',
            steps: unit.steps && unit.steps.length > 0 
              ? unit.steps.map((step: any, stepIndex: number) => ({
                  id: (stepIndex + 1).toString(),
                  text: typeof step === 'string' ? step : step.text || ''
                }))
              : [{id: '1', text: ''}],
            commonErrors: unit.commonErrors && unit.commonErrors.length > 0
              ? unit.commonErrors.map((error: any, errorIndex: number) => ({
                  id: (errorIndex + 1).toString(),
                  text: typeof error === 'string' ? error : error.text || ''
                }))
              : [{id: '1', text: ''}],
            bestPractices: unit.bestPractices && unit.bestPractices.length > 0
              ? unit.bestPractices.map((practice: any, practiceIndex: number) => ({
                  id: (practiceIndex + 1).toString(),
                  text: typeof practice === 'string' ? practice : practice.text || ''
                }))
              : [{id: '1', text: ''}]
          }))
        )
      }
    } else {
      // Reset form for new course
      setCourseData({
        title: '',
        description: '',
        durationValue: '',
        durationUnit: 'weeks',
        skillLevel: 'Beginner',
        category: 'Other',
        isPremium: false,
      })
      setPublishNow(true)
      setCourseImage(null)
      setUnits([{
        id: '1',
        title: '',
        objective: '',
        content: '',
        steps: [{id: '1', text: ''}],
        commonErrors: [{id: '1', text: ''}],
        bestPractices: [{id: '1', text: ''}]
      }])
    }
  }, [editingCourse])

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setCourseImage(result.assets[0].uri)
    }
  }

  const handleRemoveCourseImage = () => {
    setCourseImage(null)
  }

  // Unit management functions
  const handleAddUnit = () => {
    setUnits([...units, {
      id: Date.now().toString(),
      title: '',
      objective: '',
      content: '',
      steps: [{id: '1', text: ''}],
      commonErrors: [{id: '1', text: ''}],
      bestPractices: [{id: '1', text: ''}]
    }])
  }

  const handleRemoveUnit = (id: string) => {
    setUnits(units.filter(unit => unit.id !== id))
  }

  const handleUpdateUnit = (id: string, field: string, value: string) => {
    setUnits(units.map(unit => unit.id === id ? { ...unit, [field]: value } : unit))
  }

  const handleAddStep = (unitId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, steps: [...unit.steps, { id: Date.now().toString(), text: '' }] }
        : unit
    ))
  }

  const handleRemoveStep = (unitId: string, stepId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, steps: unit.steps.filter(s => s.id !== stepId) }
        : unit
    ))
  }

  const handleUpdateStep = (unitId: string, stepId: string, value: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, steps: unit.steps.map(s => s.id === stepId ? { ...s, text: value } : s) }
        : unit
    ))
  }

  const handleAddError = (unitId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, commonErrors: [...unit.commonErrors, { id: Date.now().toString(), text: '' }] }
        : unit
    ))
  }

  const handleRemoveError = (unitId: string, errorId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, commonErrors: unit.commonErrors.filter(e => e.id !== errorId) }
        : unit
    ))
  }

  const handleUpdateError = (unitId: string, errorId: string, value: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, commonErrors: unit.commonErrors.map(e => e.id === errorId ? { ...e, text: value } : e) }
        : unit
    ))
  }

  const handleAddBestPractice = (unitId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, bestPractices: [...unit.bestPractices, { id: Date.now().toString(), text: '' }] }
        : unit
    ))
  }

  const handleRemoveBestPractice = (unitId: string, practiceId: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, bestPractices: unit.bestPractices.filter(p => p.id !== practiceId) }
        : unit
    ))
  }

  const handleUpdateBestPractice = (unitId: string, practiceId: string, value: string) => {
    setUnits(units.map(unit => 
      unit.id === unitId 
        ? { ...unit, bestPractices: unit.bestPractices.map(p => p.id === practiceId ? { ...p, text: value } : p) }
        : unit
    ))
  }

  // Navigation functions
  const handleNext = () => {
    // ==================== COMPREHENSIVE COURSE INFO VALIDATION ====================
    
    // 1. Image validation
    if (!courseImage) {
      setErrorMessage("Course cover image is required. Please upload an image before proceeding.")
      setShowErrorDialog(true)
      return
    }

    // 2. Title validation (min 3 characters)
    if (!courseData.title.trim()) {
      setErrorMessage("Course title is required")
      setShowErrorDialog(true)
      return
    }
    if (courseData.title.trim().length < 3) {
      setErrorMessage("Course title must be at least 3 characters long")
      setShowErrorDialog(true)
      return
    }
    if (courseData.title.trim().length > 100) {
      setErrorMessage("Course title must not exceed 100 characters")
      setShowErrorDialog(true)
      return
    }

    // 3. Description validation (min 15 characters, max 50)
    if (!courseData.description.trim()) {
      setErrorMessage("Course description is required")
      setShowErrorDialog(true)
      return
    }
    if (courseData.description.trim().length < 15) {
      setErrorMessage("Course description must be at least 15 characters long. Please provide more details about your course.")
      setShowErrorDialog(true)
      return
    }
    if (courseData.description.trim().length > 500) {
      setErrorMessage("Course description must not exceed 500 characters")
      setShowErrorDialog(true)
      return
    }

    // 4. Category validation
    if (!courseData.category.trim() || courseData.category === 'Other') {
      setErrorMessage("Please select a valid course category")
      setShowErrorDialog(true)
      return
    }

    // 5. Duration validation
    if (!courseData.durationValue || courseData.durationValue.trim() === '') {
      setErrorMessage("Course duration value is required")
      setShowErrorDialog(true)
      return
    }
    
    const durationNum = parseInt(courseData.durationValue)
    if (isNaN(durationNum) || durationNum <= 0) {
      setErrorMessage("Duration must be a positive number")
      setShowErrorDialog(true)
      return
    }
    
    if (durationNum > 1000) {
      setErrorMessage("Duration value seems too high. Please enter a reasonable duration.")
      setShowErrorDialog(true)
      return
    }

    if (!courseData.durationUnit) {
      setErrorMessage("Please select a duration unit")
      setShowErrorDialog(true)
      return
    }

    // 6. Skill level validation
    if (!courseData.skillLevel || !['Beginner', 'Intermediate', 'Advanced'].includes(courseData.skillLevel)) {
      setErrorMessage("Please select a valid skill level (Beginner, Intermediate, or Advanced)")
      setShowErrorDialog(true)
      return
    }

    // All validations passed - proceed to units step
    setCurrentStep('units')
  }

  const handleBack = () => {
    setCurrentStep('info')
  }

  const handleSave = () => {
    // ==================== COMPREHENSIVE UNITS VALIDATION ====================
    
    // 1. Check if at least one unit exists
    const validUnits = units.filter(unit => unit.title.trim())
    if (validUnits.length === 0) {
      setErrorMessage("Please add at least one unit to your course")
      setShowErrorDialog(true)
      return
    }

    // 2. Validate each unit
    for (let i = 0; i < validUnits.length; i++) {
      const unit = validUnits[i]
      const unitNumber = i + 1

      // Title validation
      if (!unit.title.trim()) {
        setErrorMessage(`Unit ${unitNumber}: Unit title is required`)
        setShowErrorDialog(true)
        return
      }
      if (unit.title.trim().length < 5) {
        setErrorMessage(`Unit ${unitNumber}: Unit title must be at least 5 characters long`)
        setShowErrorDialog(true)
        return
      }
      if (unit.title.trim().length > 100) {
        setErrorMessage(`Unit ${unitNumber}: Unit title must not exceed 100 characters`)
        setShowErrorDialog(true)
        return
      }

      // Objective validation
      if (!unit.objective.trim()) {
        setErrorMessage(`Unit ${unitNumber} (${unit.title}): Objective is required`)
        setShowErrorDialog(true)
        return
      }
      if (unit.objective.trim().length < 20) {
        setErrorMessage(`Unit ${unitNumber} (${unit.title}): Objective must be at least 20 characters long`)
        setShowErrorDialog(true)
        return
      }

      // Content validation
      if (!unit.content.trim()) {
        setErrorMessage(`Unit ${unitNumber} (${unit.title}): Content is required`)
        setShowErrorDialog(true)
        return
      }
      if (unit.content.trim().length < 20) {
        setErrorMessage(`Unit ${unitNumber} (${unit.title}): Content must be at least 20 characters long`)
        setShowErrorDialog(true)
        return
      }

      // Steps validation
      const validSteps = unit.steps.filter(step => step.text.trim())
      if (validSteps.length === 0) {
        setErrorMessage(`Unit ${unitNumber} (${unit.title}): Please add at least one step`)
        setShowErrorDialog(true)
        return
      }
      
      // Validate each step
      for (let j = 0; j < validSteps.length; j++) {
        const step = validSteps[j]
        if (!step.text.trim()) {
          setErrorMessage(`Unit ${unitNumber}, Step ${j + 1}: Step text is required`)
          setShowErrorDialog(true)
          return
        }
        if (step.text.trim().length < 5) {
          setErrorMessage(`Unit ${unitNumber}, Step ${j + 1}: Step text must be at least 5 characters long`)
          setShowErrorDialog(true)
          return
        }
      }

      // Common errors validation
      const validErrors = unit.commonErrors.filter(err => err.text.trim())
      if (validErrors.length === 0) {
        setErrorMessage(`Unit ${unitNumber} (${unit.title}): Please add at least one common error`)
        setShowErrorDialog(true)
        return
      }

      // Validate each error
      for (let j = 0; j < validErrors.length; j++) {
        const error = validErrors[j]
        if (!error.text.trim()) {
          setErrorMessage(`Unit ${unitNumber}, Common Error ${j + 1}: Error text is required`)
          setShowErrorDialog(true)
          return
        }
        if (error.text.trim().length < 3) {
          setErrorMessage(`Unit ${unitNumber}, Common Error ${j + 1}: Error text must be at least 3 characters long`)
          setShowErrorDialog(true)
          return
        }
      }

      // Best practices validation (optional but if added, must be valid)
      const validPractices = unit.bestPractices.filter(bp => bp.text.trim())
      if (validPractices.length > 0) {
        for (let j = 0; j < validPractices.length; j++) {
          const practice = validPractices[j]
          if (practice.text.trim() && practice.text.trim().length < 3) {
            setErrorMessage(`Unit ${unitNumber}, Best Practice ${j + 1}: Text must be at least 3 characters long`)
            setShowErrorDialog(true)
            return
          }
        }
      }
    }

    // All validations passed - proceed to save
    saveCourse()
  }

  const saveCourse = async () => {
    // Validate image is uploaded
    if (!courseImage) {
      setErrorMessage('Please upload a course cover image before submitting.')
      setShowErrorDialog(true)
      return
    }

    setIsUploading(true)
    
    try {
      console.log(isEditMode ? '📝 Starting course update process...' : '📚 Starting course upload process...')
      
      // Step 1: Upload image to Cloudinary (only if new image)
      let imageUrl: string | undefined = courseImage
      if (courseImage && !courseImage.startsWith('http')) {
        // Only upload if it's a local URI (not already a cloud URL)
        console.log('📸 Uploading course cover image to Cloudinary...')
        try {
          imageUrl = await chefService.uploadImageToCloudinary(courseImage)
          console.log('✅ Image uploaded:', imageUrl)
        } catch (error) {
          console.log('❌ Image upload failed:', error)
          setErrorMessage('Failed to upload image. Please try again.')
          setShowErrorDialog(true)
          setIsUploading(false)
          return
        }
      }

      // Step 2: Prepare course payload
      const payload: chefService.CreateCoursePayload = {
        title: courseData.title,
        description: courseData.description,
        coverImage: imageUrl,
        category: courseData.category,
        durationValue: parseInt(courseData.durationValue),
        durationUnit: courseData.durationUnit,
        skillLevel: courseData.skillLevel,
        isPremium: courseData.isPremium,
        isPublished: publishNow,
        units: units
          .filter(unit => unit.title.trim())
          .map((unit, index) => ({
            unitNumber: index + 1,
            title: unit.title,
            objective: unit.objective || 'Learn the fundamentals and techniques covered in this unit.',
            content: unit.content,
            steps: unit.steps.map(s => s.text).filter(t => t.trim()),
            commonErrors: unit.commonErrors.map(e => e.text).filter(t => t.trim()),
            bestPractices: unit.bestPractices.map(p => p.text).filter(t => t.trim())
          }))
      }

      console.log(isEditMode ? '📤 Updating course on backend...' : '📤 Sending course to backend...')
      
      // Step 3: Create or Update course via API
      let savedCourse: any
      if (isEditMode && editingCourse) {
        const courseId = editingCourse._id || editingCourse.id
        console.log('🔄 Updating course with ID:', courseId)
        if (!courseId) {
          throw new Error('Course ID is missing for update operation')
        }
        savedCourse = await chefService.updateCourse(courseId, payload)
        console.log('✅ Course updated successfully:', savedCourse._id)
      } else {
        savedCourse = await chefService.createCourse(payload)
        console.log('✅ Course created successfully:', savedCourse._id)
      }

      // Step 4: Convert backend course to local Course format and notify parent
      const localCourse: Course = {
        id: savedCourse._id,
        title: savedCourse.title,
        description: savedCourse.description,
        durationValue: savedCourse.durationValue,
        durationUnit: savedCourse.durationUnit,
        duration: savedCourse.durationValue && savedCourse.durationUnit 
          ? `${savedCourse.durationValue} ${savedCourse.durationUnit}` 
          : undefined,
        skillLevel: savedCourse.skillLevel as "Beginner" | "Intermediate" | "Advanced",
        category: savedCourse.category,
        subscribers: 0,
        rating: savedCourse.averageRating || 0,
        isPremium: savedCourse.isPremium,
        chefId: savedCourse.authorId,
        chefName: "You",
        image: getImageUrl(savedCourse.coverImage),
        units: savedCourse.units.map((u: any) => ({
          id: u._id,
          title: u.title,
          objective: u.objective || '',
          content: u.content,
          steps: u.steps || [],
          commonErrors: u.commonErrors || [],
          bestPractices: u.bestPractices || []
        }))
      }

      onSave(localCourse)
      setShowSuccessDialog(true)
      setIsUploading(false)
    } catch (error: any) {
      const formattedError = formatErrorMessage(error)
      console.log(isEditMode ? '❌ Course update failed:' : '❌ Course creation failed:', formattedError)
      setErrorMessage(formattedError)
      setShowErrorDialog(true)
      setIsUploading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.modalContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={["#000000", "#1F2937"]} style={StyleSheet.absoluteFill} />

      <View style={styles.modalHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {currentStep === 'units' && (
            <TouchableOpacity onPress={handleBack} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.modalTitle}>
            {currentStep === 'info' ? 'Create New Course' : 'Add Course Units'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
        <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: currentStep === 'info' ? '#FACC15' : '#22C55E' }} />
        <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: currentStep === 'units' ? '#FACC15' : 'rgba(255, 255, 255, 0.1)' }} />
      </View>

      <ScrollView 
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {currentStep === 'info' ? (
          // Step 1: Course Information
          <View style={styles.formContainer}>
          {/* Course Image Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Course Image *</Text>
            <TouchableOpacity 
              style={[styles.imageUploadBox, courseImage && styles.imageUploadBoxFilled]}
              onPress={handleImagePicker}
            >
              {courseImage ? (
                <>
                  <Image source={{ uri: courseImage }} style={styles.uploadedImage} />
                  <TouchableOpacity 
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(10, 10, 10, 0.55)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#efd044ff' }}
                    onPress={handleRemoveCourseImage}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color="#efdb44ff" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imageUploadContent}>
                  <Ionicons name="image-outline" size={40} color="#64748B" />
                  <Text style={styles.imageUploadText}>Tap to upload course image *</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Course Title *</Text>
            <TextInput
              style={styles.textInput}
              value={courseData.title}
              onChangeText={(text: string) => setCourseData({ ...courseData, title: text })}
              placeholder="Enter course title"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={courseData.description}
              onChangeText={(text: string) => setCourseData({ ...courseData, description: text })}
              placeholder="Describe your course"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <TouchableOpacity
              style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={{ color: courseData.category === 'Other' ? '#64748B' : 'white', fontSize: 16 }}>
                {courseData.category || 'Select category'}
              </Text>
              <Ionicons name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, marginTop: 8, maxHeight: 200, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {COURSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' }}
                      onPress={() => {
                        setCourseData({ ...courseData, category: cat })
                        setShowCategoryDropdown(false)
                      }}
                    >
                      <Text style={{ color: courseData.category === cat ? '#FACC15' : 'white', fontSize: 15, fontWeight: courseData.category === cat ? '600' : '400' }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration *</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={courseData.durationValue}
                  onChangeText={(text: string) => setCourseData({ ...courseData, durationValue: text })}
                  placeholder="Enter number"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }]}
                  onPress={() => setShowDurationUnitDropdown(!showDurationUnitDropdown)}
                >
                  <Text style={{ color: courseData.durationUnit ? 'white' : '#64748B', fontSize: 16 }}>
                    {courseData.durationUnit || 'Select unit'}
                  </Text>
                  <Ionicons name={showDurationUnitDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                </TouchableOpacity>
                {showDurationUnitDropdown && (
                  <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, marginTop: 8, maxHeight: 200, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', position: 'absolute', top: 60, left: 0, right: 0, zIndex: 1000 }}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {(['minutes', 'hours', 'days', 'weeks', 'months'] as const).map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' }}
                          onPress={() => {
                            setCourseData({ ...courseData, durationUnit: unit })
                            setShowDurationUnitDropdown(false)
                          }}
                        >
                          <Text style={{ color: courseData.durationUnit === unit ? '#FACC15' : 'white', fontSize: 15, fontWeight: courseData.durationUnit === unit ? '600' : '400' }}>
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Skill Level Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Skill Level *</Text>
            <View style={styles.difficultySelector}>
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.difficultyButton, courseData.skillLevel === level && styles.difficultyButtonActive]}
                  onPress={() => setCourseData({ ...courseData, skillLevel: level as any })}
                >
                  <Text style={[styles.difficultyText, courseData.skillLevel === level && styles.difficultyTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Premium & Publish Options */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setCourseData({ ...courseData, isPremium: !courseData.isPremium })}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, courseData.isPremium && styles.checkboxActive]}>
                {courseData.isPremium && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Premium Course</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.checkboxRow, { marginTop: 12 }]}
              onPress={() => setPublishNow(!publishNow)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.checkbox, !publishNow && styles.checkboxActive]}>
                {!publishNow && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.checkboxLabel}>Don't Publish Now</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        ) : (
          // Step 2: Course Units
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={styles.inputLabel}>Course Units *</Text>
                <TouchableOpacity
                  onPress={handleAddUnit}
                  style={{ backgroundColor: 'rgba(250, 204, 21, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(250, 204, 21, 0.3)' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="add" size={18} color="#FACC15" />
                    <Text style={{ color: '#FACC15', fontSize: 15, fontWeight: '700' }}>Add Unit</Text>
                  </View>
                </TouchableOpacity>
              </View>
            {units.map((unit, index) => (
              <View key={unit.id} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(250, 204, 21, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.3)' }}>
                      <Text style={{ color: '#FACC15', fontSize: 16, fontWeight: '800' }}>{index + 1}</Text>
                    </View>
                    <Text style={{ color: '#FACC15', fontSize: 18, fontWeight: '700' }}>Unit {index + 1}</Text>
                  </View>
                  {units.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveUnit(unit.id)}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="trash-outline" size={17} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700' }}>Remove</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[styles.textInput, { marginBottom: 8 }]}
                  value={unit.title}
                  onChangeText={(text: string) => handleUpdateUnit(unit.id, 'title', text)}
                  placeholder="Unit title"
                  placeholderTextColor="#64748B"
                />

                <TextInput
                  style={[styles.textInput, { marginBottom: 8 }]}
                  value={unit.objective}
                  onChangeText={(text: string) => handleUpdateUnit(unit.id, 'objective', text)}
                  placeholder="Objective (e.g., Maintain edge integrity)"
                  placeholderTextColor="#64748B"
                />

                <TextInput
                  style={[styles.textInput, styles.textArea, { marginBottom: 12 }]}
                  value={unit.content}
                  onChangeText={(text: string) => handleUpdateUnit(unit.id, 'content', text)}
                  placeholder="Instructional content"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />

                {/* Steps */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Steps</Text>
                    <TouchableOpacity 
                      onPress={() => handleAddStep(unit.id)}
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="add" size={16} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}>Add</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {unit.steps.map((step, stepIndex) => (
                    <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(59, 130, 246, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '800' }}>{stepIndex + 1}</Text>
                      </View>
                      <TextInput
                        style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                        value={step.text}
                        onChangeText={(text: string) => handleUpdateStep(unit.id, step.id, text)}
                        placeholder="Step description"
                        placeholderTextColor="#64748B"
                      />
                      {unit.steps.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveStep(unit.id, step.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                          <Ionicons name="close" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Common Errors */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Common Errors</Text>
                    <TouchableOpacity 
                      onPress={() => handleAddError(unit.id)}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="add" size={16} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Add</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {unit.commonErrors.map((error, errorIndex) => (
                    <View key={error.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <TextInput
                        style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                        value={error.text}
                        onChangeText={(text: string) => handleUpdateError(unit.id, error.id, text)}
                        placeholder="Common error"
                        placeholderTextColor="#64748B"
                      />
                      {unit.commonErrors.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveError(unit.id, error.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                          <Ionicons name="close" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Best Practices */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: '#22C55E', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Best Practices (Optional)</Text>
                    <TouchableOpacity 
                      onPress={() => handleAddBestPractice(unit.id)}
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="add" size={16} color="#22C55E" />
                        <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '700' }}>Add</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {unit.bestPractices.map((practice, practiceIndex) => (
                    <View key={practice.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <TextInput
                        style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                        value={practice.text}
                        onChangeText={(text: string) => handleUpdateBestPractice(unit.id, practice.id, text)}
                        placeholder="Best practice tip"
                        placeholderTextColor="#64748B"
                      />
                      {unit.bestPractices.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => handleRemoveBestPractice(unit.id, practice.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                          <Ionicons name="close" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ paddingBottom: 32, paddingTop: 8 }}>
          {currentStep === 'info' ? (
            <TouchableOpacity 
              style={[styles.saveButton, { marginBottom: 0 }]} 
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <View style={[styles.saveButtonGradient, { backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderRadius: 16, borderColor: 'rgba(250, 204, 21, 0.4)', paddingVertical: 16 }]}>
                <Text style={[styles.saveButtonText, { color: '#FACC15', fontSize: 16, fontWeight: '700' }]}>Next: Add Units</Text>
                <Ionicons name="arrow-forward" size={22} color="#FACC15" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity 
                style={[styles.saveButton, { flex: 1, marginBottom: 0 }]} 
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <View style={[styles.saveButtonGradient, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 16, paddingVertical: 16 }]}>
                  <Ionicons name="arrow-back" size={22} color="white" />
                  <Text style={[styles.saveButtonText, { color: 'white', fontSize: 16, fontWeight: '700', marginLeft: 4 }]}>Back</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { flex: 1, marginBottom: 0 }, isUploading && { opacity: 0.5 }]} 
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isUploading}
              >
                <View style={[styles.saveButtonGradient, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 2, borderRadius: 16, borderColor: 'rgba(34, 197, 94, 0.4)', paddingVertical: 16 }]}>
                  {isUploading ? (
                    <>
                      <Ionicons name="hourglass-outline" size={22} color="#22C55E" />
                      <Text style={[styles.saveButtonText, { color: '#22C55E', fontSize: 16, fontWeight: '700', marginLeft: 4 }]}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                      <Text style={[styles.saveButtonText, { color: '#22C55E', fontSize: 16, fontWeight: '700', marginLeft: 4 }]}>Create Course</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Dialog
        visible={showErrorDialog}
        type="error"
        title="Validation Error"
        message={errorMessage}
        onClose={() => setShowErrorDialog(false)}
        confirmText="OK"
      />

      <Dialog
        visible={showSuccessDialog}
        type="success"
        title={isEditMode ? "Course Updated!" : "Course Created!"}
        message={isEditMode ? "Your course has been updated successfully" : "Your course has been created successfully"}
        onClose={() => {
          setShowSuccessDialog(false)
          onClose()
        }}
        confirmText="OK"
        autoClose={true}
        autoCloseTime={2000}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentContainer: {
    flex: 1,
  },
  userTypeSelectorContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 8,
  },
  userTypeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  userTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 17,
    gap: 8,
  },
  activeUserType: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  userTypeText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
  activeUserTypeText: {
    color: "#FACC15",
    fontWeight: "700",
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  chefRibbonContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chefRibbonContent: {
    paddingRight: 20,
  },
  chefSectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chefSectionTabs: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  chefSearchButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chefSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  chefSearchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    height: 52,
  },
  chefSearchIcon: {
    marginRight: 8,
  },
  chefSearchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  chefSearchClearButton: {
    padding: 4,
  },
  chefSearchCloseButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  chefSectionTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 12,
    flex: 1,
    gap: 6,
  },
  activeChefSectionTab: {
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  chefSectionTabText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  activeChefSectionTabText: {
    color: "#FACC15",
    fontWeight: "700",
  },
  chefCountBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  activeChefCountBadge: {
    backgroundColor: "rgba(250, 204, 21, 0.2)",
  },
  chefCountText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  activeChefCountText: {
    color: "#FACC15",
  },
  subscribedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(34, 197, 94, 0.9)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emptyChefSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  emptyChefText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  emptyChefSubtext: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  chefCard: {
    width: 120,
    marginRight: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedChefCard: {
    borderColor: "#FACC15",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  chefAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  chefName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  chefSpecialty: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 6,
  },
  chefRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#FACC15",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 3,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderRadius: 17,
    flex: 1,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)', borderWidth: 1
  },
  tabText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#22C55E",
    fontWeight: "700",
  },
  modernTabContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  modernTabButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernTabButtonActive: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderColor: "rgba(250, 204, 21, 0.3)",
  },
  modernTabContent: {
    marginLeft: 8,
  },
  modernTabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  modernTabValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  courseStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  coursePrice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    color: "#FACC15",
    fontSize: 16,
    fontWeight: "bold",
  },
  subscribersText: {
    color: "#64748B",
    fontSize: 12,
  },
  recipesContainer: {
    paddingHorizontal: 20,
  },
  recipesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  recipeImage: {
    width: "100%",
    height: 120,
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userCreatedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: "#FACC15",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  userCreatedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recipeDescription: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "#64748B",
    fontSize: 12,
    marginLeft: 4,
  },
  feedbackContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 16,
  },
  feedbackHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedbackTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  feedbackBadge: {
    backgroundColor: "#FACC15",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  feedbackBadgeText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "bold",
  },
  feedbackDropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  feedbackItem: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  
  feedbackContent: {
    flex: 1,
  },
  feedbackUserName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  feedbackRating: {
    flexDirection: "row",
    marginLeft: 12,
    alignItems: "center",
  },
  feedbackComment: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
  },
  feedbackRecipe: {
    color: "#FACC15",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  feedbackDate: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  modernActionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernActionContent: {
    marginLeft: 8,
  },
  modernActionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  modernActionValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageUploadContainer: {
    height: 200,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginVertical: 20,
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#64748B",
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 16,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  toggleContainer: {
    marginBottom: 20,
  },
  premiumToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  premiumToggleActive: {
    borderColor: "#FACC15",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  toggleText: {
    color: "#64748B",
    fontSize: 16,
    marginLeft: 12,
  },
  toggleTextActive: {
    color: "#FACC15",
  },
  difficultySelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  difficultyButtonActive: {
    backgroundColor: "#FACC15",
  },
  difficultyText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  difficultyTextActive: {
    color: "#000000",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 10,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  
  // Image Upload Styles
  imageUploadBox: {
    height: 120,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageUploadBoxFilled: {
    borderStyle: "solid",
    borderColor: "#FACC15",
  },
  imageUploadContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageUploadText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  
  // Checkbox Styles
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  checkboxActive: {
    backgroundColor: "#FACC15",
    borderColor: "#FACC15",
  },
  checkboxLabel: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  
  // Content Management Styles
  contentManagementContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  managementTabSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  managementTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 17,
    gap: 8,
  },
  managementTabActive: {
    backgroundColor: "#FACC15",
    shadowColor: "#FACC15",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  managementTabText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  managementTabTextActive: {
    color: "#000000",
    fontWeight: "700",
  },
  managementContent: {
    gap: 16,
  },
  managementCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  managementCardImage: {
    width: "100%",
    height: 120,
  },
  managementCardContent: {
    padding: 16,
  },
  managementCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  managementCardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  managementCardBadges: {
    flexDirection: "row",
    gap: 6,
  },
  managementPremiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  managementPremiumBadgeText: {
    color: "#FACC15",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeDraft: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  statusBadgeText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3,
  },
  statusBadgeTextDraft: {
    color: "#F59E0B",
  },
  managementCardDescription: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  managementCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#64748B",
    fontSize: 12,
    marginLeft: 4,
  },
  coursePriceContainer: {
    marginBottom: 12,
  },
  managementCoursePrice: {
    color: "#FACC15",
    fontSize: 18,
    fontWeight: "bold",
  },
  managementCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 12,
    marginTop: 4,
  },
  managementActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    flex: 0.48,
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  managementActionText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  deleteText: {
    color: "#EF4444",
  },
  emptyManagement: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyManagementText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyManagementSubtext: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  // Beautiful stats styles
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  compactBeautifulCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  compactCardGradient: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  beautifulStatCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statCardGradient: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  beautifulStatNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  beautifulStatLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
  },
  // Legacy compact stats styles (keeping for potential future use)
  compactStatItem: {
    flex: 1,
    alignItems: "center",
  },
  compactStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 16,
  },
  // Minimalist tab styles
  minimalistTabSelector: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    marginBottom: 20,
  },
  minimalistTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 0,
    position: "relative",
  },
  minimalistTabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  minimalistTabTextActive: {
    color: "#3B82F6",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#3B82F6",
    borderRadius: 1,
  },
  // Chef Profile Styles
  profileContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 24,
  },
  profileHeaderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  editButtonsContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
    marginBottom: 20,
  },
  editProfileButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(6, 182, 212, 0.1)",
    zIndex: 10,
  },
  cancelButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  editProfileButtonText: {
    color: "#06B6D4",
    fontWeight: "700",
    fontSize: 14,
  },
  cancelButtonText: {
    color: "#EF4444",
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  editProfileImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#22C55E",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileChefName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  profileDescription: {
    color: "#94A3B8",
    fontSize: 14,
    marginBottom: 8,
  },
  profileBio: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  chefBioCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  chefBioText: {
    color: "#E2E8F0",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  profileBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailedStatsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  profileSectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  profileStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  statGridItem: {
    width: '30%',
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
  contentSectionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  contentSubSection: {
    marginTop: 8,
  },
  subSectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.8,
  },
  contentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  contentItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  contentItemInfo: {
    flex: 1,
  },
  contentItemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  contentItemMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
  },
  // Profile Button Styles
  profileButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  profileButton: {
    backgroundColor: "rgba(6, 182, 212, 0.12)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  profileButtonText: {
    color: "#06B6D4",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  dropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    maxHeight: 240,
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    flex: 1,
  },
  loadingChefsContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingChefsText: {
    color: "#94A3B8",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FACC15",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  retryButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  draftBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(148, 163, 184, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  draftText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
})

export default ChefDashboardScreen