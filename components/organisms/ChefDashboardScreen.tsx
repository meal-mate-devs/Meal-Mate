"use client"

import { useAuthContext } from "@/context/authContext"
import * as chefService from "@/lib/api/chefService"
import { apiClient } from "@/lib/api/client"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Dialog from "../atoms/Dialog"
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
  chefName?: string
}

interface Chef {
  id: string
  name: string
  avatar: string
  specialty: string
  rating: number
  subscribers: number
  isSubscribed: boolean
  recipes: Recipe[]
  courses: Course[]
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
  
  const [userType, setUserType] = useState<"user" | "chef">("user")
  const [selectedChef, setSelectedChef] = useState<string | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<"recipes" | "courses">("recipes")
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
  
  // Update chef editing values when profile changes
  React.useEffect(() => {
    if (profile?.chefProfile) {
      setChefProfileData(profile.chefProfile)
      setEditedChefName(profile.chefProfile.chefName || '')
      setEditedExpertiseCategory(profile.chefProfile.expertiseCategory || '')
      setEditedProfessionalSummary(profile.chefProfile.professionalSummary || '')
      setEditedYearsOfExperience(profile.chefProfile.yearsOfExperience || 0)
      setEditedPortfolioImage(profile.chefProfile.portfolioImage || '')
    }
  }, [profile])
  
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
  
  // Chef registration states
  const [showChefRegistration, setShowChefRegistration] = useState(false)
  const [isRegisteringChef, setIsRegisteringChef] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showRegErrorDialog, setShowRegErrorDialog] = useState(false)
  const [regErrorMessage, setRegErrorMessage] = useState("")
  
  // Chef dashboard toggle state
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [managementTab, setManagementTab] = useState<"recipes" | "courses">("recipes")
  
  // Check if user should see chef registration
  useEffect(() => {
    if (userType === "chef" && profile && !profile.isChef) {
      setShowChefRegistration(true)
    } else {
      setShowChefRegistration(false)
    }
  }, [userType, profile])

  // Dynamic state for user-created content
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([])
  const [userCourses, setUserCourses] = useState<Course[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)

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

  // Fetch chef's recipes and courses from backend
  useEffect(() => {
    if (userType === "chef" && profile?.isChef) {
      fetchUserRecipes()
      fetchUserCourses()
    }
  }, [userType, profile?.isChef])

  const fetchUserRecipes = async () => {
    setIsLoadingRecipes(true)
    try {
      console.log('📚 Fetching chef recipes from backend...')
      const recipes = await chefService.getMyRecipes('all')
      console.log(`✅ Fetched ${recipes.length} recipes`)
      
      // Convert backend recipes to local Recipe format
      const localRecipes: Recipe[] = recipes.map(r => ({
        id: r._id,
        title: r.title,
        description: r.description,
        image: getImageUrl(r.image),
        cookTime: `${r.prepTime + r.cookTime}m`,
        difficulty: r.difficulty as "Easy" | "Medium" | "Hard",
        rating: r.averageRating || 0,
        isPremium: r.isPremium,
        isPublished: r.isPublished,
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
      const localCourses: Course[] = courses.map(c => ({
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
        isPublished: c.isPublished,
        chefId: c.authorId,
        chefName: "You",
        image: c.coverImage || "https://via.placeholder.com/400x300",
        totalReports: c.totalReports,
        units: c.units.map(u => ({
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

  // Mock data
  const [chefs] = useState<Chef[]>([
    {
      id: "1",
      name: "Gordon Ramsay",
      avatar: "https://images.unsplash.com/photo-1583394293214-28a5b0a4c7c8?w=150&h=150&fit=crop&crop=face",
      specialty: "Fine Dining",
      rating: 4.9,
      subscribers: 125000,
      isSubscribed: true,
      recipes: [
        {
          id: "r1",
          title: "Beef Wellington",
          description: "Classic British dish with tender beef",
          image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",
          isPremium: true,
          difficulty: "Hard",
          cookTime: "2h 30m",
          rating: 4.8,
          reviews: 234,
        },
        {
          id: "r2",
          title: "Hell's Kitchen Pasta",
          description: "Signature pasta dish from the show",
          image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=300&h=200&fit=crop",
          isPremium: false,
          difficulty: "Medium",
          cookTime: "45m",
          rating: 4.6,
          reviews: 189,
        },
      ],
      courses: [
        {
          id: "c1",
          title: "Fine Dining Masterclass",
          description: "Learn the secrets of Michelin-star cooking",
          duration: "8 weeks",
          skillLevel: "Advanced",
          category: "Fine Dining",
          subscribers: 1250,
          rating: 4.9,
          isPremium: true,
          chefId: "1",
          chefName: "Gordon Ramsay",
          image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop",
        },
        {
          id: "c2",
          title: "Restaurant Management",
          description: "How to run a successful restaurant",
          duration: "6 weeks",
          skillLevel: "Advanced",
          category: "Business",
          subscribers: 890,
          rating: 4.7,
          isPremium: true,
          chefId: "1",
          chefName: "Gordon Ramsay",
          image: "https://images.unsplash.com/photo-1577303935007-0d306ee638cf?w=400&h=250&fit=crop",
        },
      ],
    },
    {
      id: "2",
      name: "Julia Child",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c9c0e8e0?w=150&h=150&fit=crop&crop=face",
      specialty: "French Cuisine",
      rating: 4.7,
      subscribers: 89000,
      isSubscribed: true,
      recipes: [
        {
          id: "r3",
          title: "Coq au Vin",
          description: "Traditional French chicken in wine",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          isPremium: true,
          difficulty: "Medium",
          cookTime: "1h 30m",
          rating: 4.8,
          reviews: 156,
        },
      ],
      courses: [
        {
          id: "c3",
          title: "French Cooking Fundamentals",
          description: "Master the basics of French cuisine",
          duration: "5 weeks",
          skillLevel: "Intermediate",
          category: "French Cuisine",
          subscribers: 670,
          rating: 4.8,
          isPremium: true,
          chefId: "2",
          chefName: "Julia Child",
          image: "https://images.unsplash.com/photo-1556909114-a6c5e0d67b9d?w=400&h=250&fit=crop",
        },
      ],
    },
    {
      id: "3",
      name: "Jamie Oliver",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      specialty: "Healthy Cooking",
      rating: 4.6,
      subscribers: 156000,
      isSubscribed: false,
      recipes: [
        {
          id: "r4",
          title: "15-Minute Meals",
          description: "Quick and healthy weeknight dinner",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
          isPremium: false,
          difficulty: "Easy",
          cookTime: "15m",
          rating: 4.5,
          reviews: 298,
        },
        {
          id: "r5",
          title: "Superfood Salad Bowl",
          description: "Nutritious and delicious salad combinations",
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
          isPremium: true,
          difficulty: "Easy",
          cookTime: "10m",
          rating: 4.4,
          reviews: 142,
        },
      ],
      courses: [
        {
          id: "c4",
          title: "Healthy Family Cooking",
          description: "Nutritious meals the whole family will love",
          duration: "4 weeks",
          skillLevel: "Beginner",
          category: "Healthy Cooking",
          subscribers: 1120,
          rating: 4.6,
          isPremium: false,
          chefId: "3",
          chefName: "Jamie Oliver",
          image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=250&fit=crop",
        },
        {
          id: "c5",
          title: "Plant-Based Cooking",
          description: "Delicious vegetarian and vegan recipes",
          duration: "3 weeks",
          skillLevel: "Beginner",
          category: "Plant-Based",
          subscribers: 890,
          rating: 4.5,
          isPremium: true,
          chefId: "3",
          chefName: "Jamie Oliver",
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop",
        },
      ],
    },
  ])

  const [feedbacks] = useState<Feedback[]>([
    {
      id: "1",
      userName: "Sarah Johnson",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616c9c0e8e0?w=50&h=50&fit=crop&crop=face",
      rating: 5,
      comment: "Amazing recipe! The instructions were so clear and the result was perfect.",
      date: "2 hours ago",
      recipeTitle: "Beef Wellington",
    },
    {
      id: "2",
      userName: "Mike Chen",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      rating: 4,
      comment: "Great course content, learned so much about knife skills!",
      date: "1 day ago",
    },
    {
      id: "3",
      userName: "Emma Wilson",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      rating: 5,
      comment: "Best cooking instructor ever! Highly recommend the masterclass.",
      date: "3 days ago",
    },
  ])

  // Compute real chef stats from fetched data
  const chefStats = React.useMemo(() => {
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
    
    // Placeholder for subscribers - backend doesn't provide this yet
    const totalSubscribers = 0;
    
    return {
      totalRecipes,
      totalCourses,
      totalSubscribers,
      averageRating,
    };
  }, [userRecipes, userCourses]);

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

  const renderChefRibbon = () => (
    <View style={styles.chefRibbonContainer}>
      <Text style={styles.sectionTitle}>Your Subscribed Chefs</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={chefs.filter((chef) => chef.isSubscribed)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chefRibbonContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chefCard, selectedChef === item.id && styles.selectedChefCard]}
            onPress={() => setSelectedChef(selectedChef === item.id ? null : item.id)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.avatar }} style={styles.chefAvatar} />
            <Text style={styles.chefName}>{item.name}</Text>
            <Text style={styles.chefSpecialty}>{item.specialty}</Text>
            <View style={styles.chefRating}>
              <Ionicons name="star" size={12} color="#FACC15" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )

  const renderFoodExplorerTabs = () => (
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
        onPress={() => setShowProfileModal(true)}
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
      { type: 'userTypeSelector', data: [{}] },
    ];

    if (userType === "user") {
      sections.push(
        { type: 'chefRibbon', data: [{}] },
        { type: 'foodExplorerTabs', data: [{}] },
        { type: activeTab === "recipes" ? 'latestRecipes' : 'latestCourses', data: [{}] }
      );
    } else {
      sections.push(
        { type: 'profileButton', data: [{}] },
        { type: 'chefActions', data: [{}] },
        { type: 'contentSwitch', data: [{}] },
        { type: 'contentManagement', data: [{}] }
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
        return renderChefRibbon();
      case 'foodExplorerTabs':
        return renderFoodExplorerTabs();
      case 'latestCourses':
        return renderLatestCourses();
      case 'profileButton':
        return renderProfileButton();
      case 'chefActions':
        return renderChefActions();
      case 'contentManagement':
        return renderContentManagement();
      default:
        return null;
    }
  };

  // Update the renderLatestRecipes to not use FlatList
  const renderLatestRecipes = () => {
    const selectedChefData = chefs.find((chef) => chef.id === selectedChef)
    
    // Combine static recipes with user-created recipes
    const allRecipes = [
      ...chefs.flatMap((chef) => chef.recipes),
      ...userRecipes
    ]
    
    const recipesToShow = selectedChefData
      ? selectedChefData.recipes
      : allRecipes.slice(0, 6)

    // Helper function to determine if user can access recipe
    const canAccessRecipe = (recipe: Recipe) => {
      // Find which chef owns this recipe
      const ownerChef = chefs.find(chef => chef.recipes.some(r => r.id === recipe.id))
      // User-created recipes are always accessible
      const isUserCreated = userRecipes.some(r => r.id === recipe.id)
      return isUserCreated || !recipe.isPremium || (ownerChef && ownerChef.isSubscribed)
    }

    return (
      <View style={styles.recipesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedChefData ? `${selectedChefData.name}'s Recipes` : "Latest Recipes"}
        </Text>
        {/* Replace FlatList with mapped Views */}
        <View style={styles.recipesGrid}>
          {recipesToShow.map((item, index) => {
            const hasAccess = canAccessRecipe(item)
            const ownerChef = chefs.find(chef => chef.recipes.some(r => r.id === item.id))
            const isUserCreated = userRecipes.some(r => r.id === item.id)
            
            return (
              <TouchableOpacity
                key={item.id} 
                style={[styles.recipeCard, { width: (SCREEN_WIDTH - 56) / 2 }]}
                onPress={() => {
                  if (!hasAccess) {
                    // Premium recipe - subscription required
                    console.log(`Premium Recipe: Subscribe to ${ownerChef?.name} to access`)
                  } else {
                    // Open recipe
                    console.log(`Opening recipe: ${item.title}`)
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
                {isUserCreated && (
                  <View style={styles.userCreatedBadge}>
                    <Ionicons name="person" size={12} color="#10B981" />
                    <Text style={styles.userCreatedText}>You</Text>
                  </View>
                )}
                {!hasAccess && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
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
                      <Text style={styles.statText}>{item.rating}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  const renderLatestCourses = () => {
    const selectedChefData = chefs.find((chef) => chef.id === selectedChef)
    
    // Combine static courses with user-created courses
    const allCourses = [
      ...chefs.flatMap((chef) => chef.courses),
      ...userCourses
    ]
    
    const coursesToShow = selectedChefData
      ? selectedChefData.courses
      : allCourses.slice(0, 6)

    // Helper function to determine if user can access course
    const canAccessCourse = (course: Course) => {
      const chef = chefs.find(c => c.id === course.chefId)
      // User-created courses are always accessible
      const isUserCreated = userCourses.some(c => c.id === course.id)
      return isUserCreated || !course.isPremium || (chef && chef.isSubscribed)
    }

    return (
      <View style={styles.recipesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedChefData ? `${selectedChefData.name}'s Courses` : "Latest Courses"}
        </Text>
        <View style={styles.recipesGrid}>
          {coursesToShow.map((item, index) => {
            const hasAccess = canAccessCourse(item)
            const isUserCreated = userCourses.some(c => c.id === item.id)
            return (
              <TouchableOpacity
                key={item.id} 
                style={[styles.recipeCard, { width: (SCREEN_WIDTH - 56) / 2 }]}
                onPress={() => {
                  if (!hasAccess) {
                    console.log(`Premium Course: Subscribe to ${item.chefName} to access`)
                  } else {
                    console.log(`Opening course: ${item.title}`)
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
                {isUserCreated && (
                  <View style={styles.userCreatedBadge}>
                    <Ionicons name="person" size={12} color="#10B981" />
                    <Text style={styles.userCreatedText}>You</Text>
                  </View>
                )}
                {!hasAccess && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <Text style={styles.recipeDescription}>{item.description}</Text>
                  <View style={styles.courseStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{item.duration}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FACC15" />
                      <Text style={styles.statText}>{item.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.coursePrice}>
                    <Text style={styles.priceText}>{item.skillLevel}</Text>
                    <Text style={styles.subscribersText}>{item.subscribers} subscribers</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  const handlePortfolioImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setEditedPortfolioImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
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
                  setEditedPortfolioImage(chefProfileData?.portfolioImage || '')
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
                    // Validate professional summary length
                    if (editedProfessionalSummary.trim().length < 50) {
                      Alert.alert('Validation Error', 'Professional summary must be at least 50 characters')
                      return
                    }
                    if (editedProfessionalSummary.trim().length > 500) {
                      Alert.alert('Validation Error', 'Professional summary must not exceed 500 characters')
                      return
                    }
                    
                    // Call backend to update chef profile only
                    await apiClient.put(
                      '/chef/profile',
                      {
                        chefName: editedChefName.trim(),
                        expertiseCategory: editedExpertiseCategory,
                        professionalSummary: editedProfessionalSummary.trim(),
                        yearsOfExperience: editedYearsOfExperience
                      },
                      true
                    )
                    
                    // Refresh profile to get updated data
                    await refreshProfile()
                    setShowExpertiseDropdown(false)
                    setEditMode(false)
                    
                    // Show success message
                    Alert.alert('Success', 'Chef profile updated successfully')
                  } catch (error: any) {
                    console.error('Error updating chef profile:', error)
                    Alert.alert('Error', error.message || 'Failed to update chef profile')
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
              source={{ uri: editedPortfolioImage || chefProfileData?.portfolioImage || profile?.profileImage?.url || 'https://via.placeholder.com/150' }} 
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
                      onChangeText={(text) => {
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
                onChangeText={(text) => {
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
                {(userRecipes.reduce((sum, r) => sum + (r.totalReports || 0), 0) + 
                  userCourses.reduce((sum, c) => sum + (c.totalReports || 0), 0))}
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
                    <View key={recipe.id} style={styles.contentItem}>
                      <Image source={{ uri: recipe.image }} style={styles.contentItemImage} />
                      <View style={styles.contentItemInfo}>
                        <Text style={styles.contentItemTitle} numberOfLines={1}>{recipe.title}</Text>
                        <Text style={[styles.contentItemMeta, { color: '#F97316' }]}>Under Review</Text>
                      </View>
                      <Ionicons name="alert-circle" size={20} color="#F97316" />
                    </View>
                  ))}
                </View>
              )}

              {restrictedCourses.length > 0 && (
                <View style={[styles.contentSubSection, restrictedRecipes.length > 0 && { marginTop: 16 }]}>
                  <Text style={styles.subSectionTitle}>Courses ({restrictedCourses.length})</Text>
                  {restrictedCourses.map(course => (
                    <View key={course.id} style={styles.contentItem}>
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
                    <View key={recipe.id} style={styles.contentItem}>
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
                    <View key={course.id} style={styles.contentItem}>
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
          <Image source={{ uri: feedback.userAvatar }} style={styles.feedbackAvatar} />
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
    return (
      <View style={styles.contentManagementContainer}>
        {/* Minimalist Tab Selector */}
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

        {/* Management Content */}
        <View style={styles.managementContent}>
          {managementTab === "recipes" ? (
            userRecipes.length > 0 ? (
              userRecipes.map((recipe, index) => renderManagementRecipeCard(recipe, index))
            ) : (
              <View style={styles.emptyManagement}>
                <Ionicons name="restaurant-outline" size={32} color="#64748B" />
                <Text style={styles.emptyManagementText}>No recipes uploaded yet</Text>
                <Text style={styles.emptyManagementSubtext}>Start by uploading your first recipe</Text>
              </View>
            )
          ) : (
            userCourses.length > 0 ? (
              userCourses.map((course, index) => renderManagementCourseCard(course, index))
            ) : (
              <View style={styles.emptyManagement}>
                <Ionicons name="school-outline" size={32} color="#64748B" />
                <Text style={styles.emptyManagementText}>No courses created yet</Text>
                <Text style={styles.emptyManagementSubtext}>Start by creating your first course</Text>
              </View>
            )
          )}
        </View>
      </View>
    )
  }

  const renderManagementRecipeCard = (recipe: Recipe, index: number) => (
    <TouchableOpacity 
      key={recipe.id} 
      style={styles.managementCard}
      onPress={() => handleViewRecipe(recipe)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: recipe.image }} style={styles.managementCardImage} />
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
            <Text style={styles.metaText}>{recipe.rating}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble" size={14} color="#64748B" />
            <Text style={styles.metaText}>{recipe.reviews || 0} reviews</Text>
          </View>
        </View>
        
        <View style={styles.managementCardActions}>
          <TouchableOpacity 
            style={styles.managementActionButton}
            onPress={(e) => {
              e.stopPropagation()
              handleEditRecipe(recipe)
            }}
          >
            <Ionicons name="create" size={16} color="#3B82F6" />
            <Text style={styles.managementActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.managementActionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation()
              handleDeleteRecipe(recipe.id)
            }}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={[styles.managementActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderManagementCourseCard = (course: Course, index: number) => (
    <TouchableOpacity 
      key={course.id} 
      style={styles.managementCard}
      onPress={() => handleViewCourse(course)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: course.image }} style={styles.managementCardImage} />
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
            <Text style={styles.metaText}>{course.rating || course.averageRating || '0'}</Text>
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
          <TouchableOpacity 
            style={styles.managementActionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditCourse(course);
            }}
          >
            <Ionicons name="create" size={16} color="#3B82F6" />
            <Text style={styles.managementActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.managementActionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteCourse(course.id);
            }}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={[styles.managementActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  // Handler functions for view, edit and delete
  const handleViewRecipe = async (recipe: Recipe) => {
    try {
      setIsLoadingRecipeDetails(true)
      setExpandedRecipeId(recipe.id)
      
      console.log('👁️ Fetching recipe details for view:', recipe.id)
      const fullRecipe = await chefService.getRecipeById(recipe.id)
      
      console.log('✅ Full recipe fetched:', fullRecipe.title)
      setExpandedRecipeData(fullRecipe)
    } catch (error: any) {
      console.log('❌ Failed to fetch recipe details:', error)
      setExpandedRecipeId(null)
      
      Alert.alert(
        'Unable to Load Recipe',
        'Failed to load recipe details. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      )
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
      Alert.alert(
        'Unable to Edit Recipe',
        'Failed to load recipe details.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      )
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

  const handleStartCooking = (recipe: any) => {
    if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
      Alert.alert('No Instructions', 'This recipe has no cooking instructions available.')
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
      setExpandedCourseId(course.id)
      
      console.log('👁️ Fetching course details for view:', course.id)
      const fullCourse = await chefService.getCourseById(course.id)
      
      console.log('✅ Full course fetched:', fullCourse.title)
      setExpandedCourseData(fullCourse)
    } catch (error: any) {
      console.log('❌ Failed to fetch course details:', error)
      setExpandedCourseId(null)
      
      Alert.alert(
        'Unable to Load Course',
        'Failed to load course details. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      )
    } finally {
      setIsLoadingCourseDetails(false)
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
      
      setShowChefRegistration(false)
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
    setShowChefRegistration(false)
    setUserType("user") // Switch back to user view
  }

  // Show chef registration screen if user is not a chef
  if (showChefRegistration && profile && !profile.isChef) {
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
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: showFeedbackDropdown ? 40 : 0,
          }}
          scrollEnabled={true}
          bounces={showFeedbackDropdown}
          onScrollToIndexFailed={(info) => {
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
            onSave={(recipe) => {
              fetchUserRecipes()
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
            onSave={(course) => {
              fetchUserCourses()
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
                        <MaterialIcons name="signal-cellular-alt" size={14} color="#8B5CF6" />
                        <Text className="text-purple-300 ml-1 text-xs font-semibold">
                          {expandedRecipeData.difficulty || 'Easy'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Share and Edit Buttons */}
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

                {/* Edit and Publish Buttons */}
                <View className="flex-row mb-6" style={{ gap: 12 }}>
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
                        <Image source={{ uri: feedback.userAvatar }} style={styles.feedbackAvatar} />
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
    if (recipeData.description.trim().length > 70) {
      setErrorMessage("Recipe description must not exceed 70 characters")
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
              onChangeText={(text) => setRecipeData({ ...recipeData, title: text })}
              placeholder="Enter recipe title"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={recipeData.description}
              onChangeText={(text) => setRecipeData({ ...recipeData, description: text })}
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
              onChangeText={(text) => setRecipeData({ ...recipeData, cuisine: text })}
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
                  onChangeText={(text) => setRecipeData({ ...recipeData, servings: text })}
                  placeholder="Servings"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.prepTime}
                  onChangeText={(text) => setRecipeData({ ...recipeData, prepTime: text })}
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
                  onChangeText={(text) => setRecipeData({ ...recipeData, cookTime: text })}
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
                  onChangeText={(text) => setRecipeData({ ...recipeData, calories: text })}
                  placeholder="Calories"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.protein}
                  onChangeText={(text) => setRecipeData({ ...recipeData, protein: text })}
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
                  onChangeText={(text) => setRecipeData({ ...recipeData, carbs: text })}
                  placeholder="Carbs (g)"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.fat}
                  onChangeText={(text) => setRecipeData({ ...recipeData, fat: text })}
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
                  onChangeText={(text) => handleUpdateIngredient(ingredient.id, 'name', text)}
                  placeholder="Ingredient name"
                  placeholderTextColor="#64748B"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={ingredient.amount}
                    onChangeText={(text) => handleUpdateIngredient(ingredient.id, 'amount', text)}
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
                  onChangeText={(text) => handleUpdateIngredient(ingredient.id, 'notes', text)}
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
                  onChangeText={(text) => handleUpdateInstruction(instruction.id, 'instruction', text)}
                  placeholder="Enter instruction"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={instruction.duration}
                    onChangeText={(text) => handleUpdateInstruction(instruction.id, 'duration', text)}
                    placeholder="Duration (min)"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 2 }]}
                    value={instruction.tips}
                    onChangeText={(text) => handleUpdateInstruction(instruction.id, 'tips', text)}
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
              onChangeText={(text) => setCourseData({ ...courseData, title: text })}
              placeholder="Enter course title"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={courseData.description}
              onChangeText={(text) => setCourseData({ ...courseData, description: text })}
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
                  onChangeText={(text) => setCourseData({ ...courseData, durationValue: text })}
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
                  onChangeText={(text) => handleUpdateUnit(unit.id, 'title', text)}
                  placeholder="Unit title"
                  placeholderTextColor="#64748B"
                />

                <TextInput
                  style={[styles.textInput, { marginBottom: 8 }]}
                  value={unit.objective}
                  onChangeText={(text) => handleUpdateUnit(unit.id, 'objective', text)}
                  placeholder="Objective (e.g., Maintain edge integrity)"
                  placeholderTextColor="#64748B"
                />

                <TextInput
                  style={[styles.textInput, styles.textArea, { marginBottom: 12 }]}
                  value={unit.content}
                  onChangeText={(text) => handleUpdateUnit(unit.id, 'content', text)}
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
                        onChangeText={(text) => handleUpdateStep(unit.id, step.id, text)}
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
                        onChangeText={(text) => handleUpdateError(unit.id, error.id, text)}
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
                        onChangeText={(text) => handleUpdateBestPractice(unit.id, practice.id, text)}
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
  feedbackAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
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
})

export default ChefDashboardScreen