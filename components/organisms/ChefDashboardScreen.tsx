"use client"

import { useAuthContext } from "@/context/authContext"
import { apiClient } from "@/lib/api/client"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
  duration: string
  skillLevel: "Beginner" | "Intermediate" | "Advanced"
  category: string
  students: number
  rating: number
  isPremium: boolean
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
  
  // Chef registration states
  const [showChefRegistration, setShowChefRegistration] = useState(false)
  const [isRegisteringChef, setIsRegisteringChef] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showRegErrorDialog, setShowRegErrorDialog] = useState(false)
  const [regErrorMessage, setRegErrorMessage] = useState("")
  
  // Chef dashboard toggle state
  const [chefDashboardTab, setChefDashboardTab] = useState<"feedback" | "content">("content")
  
  // Check if user should see chef registration
  useEffect(() => {
    if (userType === "chef" && profile && !profile.isChef) {
      setShowChefRegistration(true)
    } else {
      setShowChefRegistration(false)
    }
  }, [userType, profile])

  // Dynamic state for user-created content
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([
    {
      id: "chef_recipe_1",
      title: "Signature Truffle Pasta",
      description: "My special truffle pasta with homemade sauce",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5",
      difficulty: "Medium",
      cookTime: "45 min",
      rating: 4.9,
      reviews: 89,
      isPremium: true,
      chefName: "You",
    },
    {
      id: "chef_recipe_2", 
      title: "Classic Beef Wellington",
      description: "Traditional British beef wellington with mushroom duxelles",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947",
      difficulty: "Hard",
      cookTime: "2 hours",
      rating: 4.8,
      reviews: 156,
      isPremium: true,
      chefName: "You",
    }
  ])
  const [userCourses, setUserCourses] = useState<Course[]>([
    {
      id: "chef_course_1",
      title: "Advanced Culinary Techniques",
      description: "Master professional cooking techniques used in top restaurants",
      duration: "8 weeks",
      skillLevel: "Advanced",
      category: "Professional Skills",
      students: 245,
      rating: 4.9,
      isPremium: true,
      chefId: "current_chef",
      chefName: "You",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136",
    }
  ])
  
  // Management tab state
  const [managementTab, setManagementTab] = useState<"recipes" | "courses">("recipes")

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
          students: 1250,
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
          students: 890,
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
          students: 670,
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
          students: 1120,
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
          students: 890,
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

  const [chefStats] = useState({
    totalRecipes: 24,
    premiumRecipes: 8,
    totalStudents: 1250,
    averageRating: 4.8,
    monthlyEarnings: 3450,
  })

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

  const renderChefDashboardTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, chefDashboardTab === "content" && styles.activeTab]}
        onPress={() => setChefDashboardTab("content")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="create-outline"
          size={20}
          color={chefDashboardTab === "content" ? "#22C55E" : "#94A3B8"}
        />
        <Text style={[styles.tabText, chefDashboardTab === "content" && { color: "#22C55E", fontWeight: "700" }]}>
          My Content
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, chefDashboardTab === "feedback" && styles.activeTab]}
        onPress={() => setChefDashboardTab("feedback")}
        activeOpacity={0.8}
      >
        <Ionicons
          name="chatbubble-outline"
          size={20}
          color={chefDashboardTab === "feedback" ? "#22C55E" : "#94A3B8"}
        />
        <Text style={[styles.tabText, chefDashboardTab === "feedback" && { color: "#22C55E", fontWeight: "700" }]}>
          User Feedback
        </Text>
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
        { type: 'chefStats', data: [{}] },
        { type: 'chefActions', data: [{}] },
        { type: 'chefDashboardTabs', data: [{}] },
      );
      
      // Conditionally add content based on selected chef dashboard tab
      if (chefDashboardTab === "feedback") {
        sections.push(
          { type: 'feedbackDropdown', data: [{}] }
        );
      } else {
        sections.push(
          { type: 'contentManagement', data: [{}] }
        );
      }
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
      case 'latestRecipes':
        return renderLatestRecipes();
      case 'latestCourses':
        return renderLatestCourses();
      case 'chefStats':
        return renderChefStats();
      case 'chefDashboardTabs':
        return renderChefDashboardTabs();
      case 'feedbackDropdown':
        return renderFeedbackDropdown();
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
                    <Text style={styles.studentsText}>{item.students} students</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    )
  }

  const renderChefStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsOverviewCard}>
        <View style={styles.statsOverviewRow}>
          <View style={styles.overviewStatItem}>
            <View style={[styles.overviewStatIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="restaurant-outline" size={16} color="#22C55E" />
            </View>
            <Text style={styles.overviewStatValue}>{chefStats.totalRecipes}</Text>
            <Text style={styles.overviewStatLabel}>Recipes</Text>
          </View>

          <View style={styles.overviewStatDivider} />

          <View style={styles.overviewStatItem}>
            <View style={[styles.overviewStatIconContainer, { backgroundColor: 'rgba(250, 204, 21, 0.1)' }]}>
              <Ionicons name="diamond" size={16} color="#FACC15" />
            </View>
            <Text style={styles.overviewStatValue}>{chefStats.premiumRecipes}</Text>
            <Text style={styles.overviewStatLabel}>Premium</Text>
          </View>

          <View style={styles.overviewStatDivider} />

          <View style={styles.overviewStatItem}>
            <View style={[styles.overviewStatIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="people-outline" size={16} color="#3B82F6" />
            </View>
            <Text style={styles.overviewStatValue}>{chefStats.totalStudents}</Text>
            <Text style={styles.overviewStatLabel}>Students</Text>
          </View>

          <View style={styles.overviewStatDivider} />

          <View style={styles.overviewStatItem}>
            <View style={[styles.overviewStatIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.overviewStatValue}>{chefStats.averageRating}</Text>
            <Text style={styles.overviewStatLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </View>
  )

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
    <View key={recipe.id} style={styles.managementCard}>
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
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.statusBadgeText}>Published</Text>
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
            onPress={() => handleEditRecipe(recipe)}
          >
            <Ionicons name="create" size={16} color="#3B82F6" />
            <Text style={styles.managementActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.managementActionButton, styles.deleteButton]}
            onPress={() => handleDeleteRecipe(recipe.id)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={[styles.managementActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderManagementCourseCard = (course: Course, index: number) => (
    <View key={course.id} style={styles.managementCard}>
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
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text style={styles.statusBadgeText}>Published</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.managementCardDescription} numberOfLines={2}>
          {course.description}
        </Text>
        
        <View style={styles.managementCardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{course.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#FACC15" />
            <Text style={styles.metaText}>{course.rating}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={14} color="#64748B" />
            <Text style={styles.metaText}>{course.students} students</Text>
          </View>
        </View>
        
        <View style={styles.coursePriceContainer}>
          <Text style={styles.managementCoursePrice}>{course.category} • {course.skillLevel}</Text>
        </View>
        
        <View style={styles.managementCardActions}>
          <TouchableOpacity 
            style={styles.managementActionButton}
            onPress={() => handleEditCourse(course)}
          >
            <Ionicons name="create" size={16} color="#3B82F6" />
            <Text style={styles.managementActionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.managementActionButton, styles.deleteButton]}
            onPress={() => handleDeleteCourse(course.id)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={[styles.managementActionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  // Handler functions for edit and delete
  const handleEditRecipe = (recipe: Recipe) => {
    // TODO: Open edit modal with pre-filled data
    console.log(`Edit recipe: ${recipe.title}`)
  }

  const handleDeleteRecipe = (recipeId: string) => {
    const recipe = userRecipes.find(r => r.id === recipeId)
    // TODO: Add confirmation dialog
    setUserRecipes(prev => prev.filter(r => r.id !== recipeId))
    console.log(`Recipe deleted: ${recipe?.title}`)
  }

  const handleEditCourse = (course: Course) => {
    // TODO: Open edit modal with pre-filled data
    console.log(`Edit course: ${course.title}`)
  }

  const handleDeleteCourse = (courseId: string) => {
    const course = userCourses.find(c => c.id === courseId)
    // TODO: Add confirmation dialog
    setUserCourses(prev => prev.filter(c => c.id !== courseId))
    console.log(`Course deleted: ${course?.title}`)
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
      console.error('Chef registration error:', error)
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
          onRequestClose={() => setShowRecipeModal(false)}
        >
          <RecipeUploadModal
            onClose={() => setShowRecipeModal(false)}
            onSave={(recipe) => {
              setUserRecipes(prev => [recipe, ...prev])
            }}
          />
        </Modal>

        {/* Course Creation Modal */}
        <Modal
          visible={showCourseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCourseModal(false)}
        >
          <CourseCreationModal
            onClose={() => setShowCourseModal(false)}
            onSave={(course) => {
              setUserCourses(prev => [course, ...prev])
            }}
          />
        </Modal>
      </View>
    </LinearGradient>
  )
}

// Recipe Upload Modal Component
const RecipeUploadModal: React.FC<{ onClose: () => void; onSave: (recipe: Recipe) => void }> = ({ onClose, onSave }) => {
  const [recipeData, setRecipeData] = useState({
    title: "",
    description: "",
    isPremium: false,
    difficulty: "Easy" as "Easy" | "Medium" | "Hard",
    prepTime: "",
    cookTime: "",
    servings: "",
    cuisine: "",
    category: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  })
  const [recipeImage, setRecipeImage] = useState<string | null>(null)
  const [ingredients, setIngredients] = useState<Array<{id: string; name: string; amount: string; unit: string; notes?: string}>>([
    { id: '1', name: '', amount: '', unit: '', notes: '' }
  ])
  const [instructions, setInstructions] = useState<Array<{id: string; step: number; instruction: string; duration?: string; tips?: string}>>([
    { id: '1', step: 1, instruction: '', duration: '', tips: '' }
  ])
  
  // Dialog states
  const [showNoImageDialog, setShowNoImageDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

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
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', amount: '', unit: '', notes: '' }])
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
    // Validation
    if (!recipeData.title.trim()) {
      setErrorMessage("Please enter a recipe title")
      setShowErrorDialog(true)
      return
    }
    if (!recipeData.description.trim()) {
      setErrorMessage("Please enter a recipe description")
      setShowErrorDialog(true)
      return
    }
    if (!recipeData.servings || parseInt(recipeData.servings) <= 0) {
      setErrorMessage("Please enter valid servings")
      setShowErrorDialog(true)
      return
    }
    if (!recipeData.prepTime || parseInt(recipeData.prepTime) <= 0) {
      setErrorMessage("Please enter valid prep time")
      setShowErrorDialog(true)
      return
    }
    if (!recipeData.cookTime || parseInt(recipeData.cookTime) <= 0) {
      setErrorMessage("Please enter valid cook time")
      setShowErrorDialog(true)
      return
    }
    if (ingredients.filter(ing => ing.name.trim()).length === 0) {
      setErrorMessage("Please add at least one ingredient")
      setShowErrorDialog(true)
      return
    }
    if (instructions.filter(inst => inst.instruction.trim()).length === 0) {
      setErrorMessage("Please add at least one instruction")
      setShowErrorDialog(true)
      return
    }

    // Check if image is missing
    if (!recipeImage) {
      setShowNoImageDialog(true)
      return
    }

    // Proceed to save
    saveRecipe()
  }

  const saveRecipe = () => {
    // Create new recipe
    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}`,
      title: recipeData.title,
      description: recipeData.description,
      image: recipeImage || "https://via.placeholder.com/400x300",
      cookTime: `${parseInt(recipeData.prepTime) + parseInt(recipeData.cookTime)}m`,
      difficulty: recipeData.difficulty,
      rating: 5.0,
      isPremium: recipeData.isPremium,
      chefName: "You",
    }

    onSave(newRecipe)
    setShowSuccessDialog(true)
  }

  return (
    <KeyboardAvoidingView 
      style={styles.modalContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={["#09090b", "#18181b"]} style={StyleSheet.absoluteFill} />

      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Upload New Recipe</Text>
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
              <Image source={{ uri: recipeImage }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.imageUploadContent}>
                <Ionicons name="camera" size={40} color="#64748B" />
                <Text style={styles.imageUploadText}>Tap to upload recipe image</Text>
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
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={recipeData.cuisine}
                  onChangeText={(text) => setRecipeData({ ...recipeData, cuisine: text })}
                  placeholder="Cuisine"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>
          </View>

          {/* Premium Toggle */}
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
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={ingredient.unit}
                    onChangeText={(text) => handleUpdateIngredient(ingredient.id, 'unit', text)}
                    placeholder="Unit"
                    placeholderTextColor="#64748B"
                  />
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
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <View style={[styles.saveButtonGradient, { backgroundColor: 'rgba(250, 204, 21, 0.1)', borderWidth: 2, borderRadius: 18, borderColor: 'rgba(250, 204, 21, 0.4)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#FACC15" />
              <Text style={[styles.saveButtonText, { color: '#FACC15', fontSize: 18, fontWeight: '700' }]}>Upload Recipe</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Dialog
        visible={showNoImageDialog}
        type="warning"
        title="No Image Uploaded"
        message="You haven't uploaded a recipe image. Do you want to continue without an image?"
        onClose={() => {
          setShowNoImageDialog(false)
          saveRecipe()
        }}
        onCloseButton={() => setShowNoImageDialog(false)}
        onConfirm={() => {
          setShowNoImageDialog(false)
          saveRecipe()
        }}
        confirmText="Continue"
        cancelText="Add Image"
        showCancelButton={true}
        showCloseButton={true}
      />

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
        title="Recipe Uploaded!"
        message="Your recipe has been uploaded successfully"
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
const CourseCreationModal: React.FC<{ onClose: () => void; onSave: (course: Course) => void }> = ({ onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState<'info' | 'units'>(('info'))
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    duration: "",
    skillLevel: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    category: "",
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
  const [showNoImageDialog, setShowNoImageDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

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
    // Validate course info before moving to units
    if (!courseData.title.trim()) {
      setErrorMessage("Please enter a course title")
      setShowErrorDialog(true)
      return
    }
    if (!courseData.description.trim()) {
      setErrorMessage("Please enter a course description")
      setShowErrorDialog(true)
      return
    }
    if (!courseData.duration.trim()) {
      setErrorMessage("Please enter course duration")
      setShowErrorDialog(true)
      return
    }
    if (!courseData.category.trim()) {
      setErrorMessage("Please enter a course category")
      setShowErrorDialog(true)
      return
    }

    // Check if image is missing
    if (!courseImage) {
      setShowNoImageDialog(true)
      return
    }

    setCurrentStep('units')
  }

  const handleBack = () => {
    setCurrentStep('info')
  }

  const handleSave = () => {
    // Validate units
    if (units.filter(unit => unit.title.trim()).length === 0) {
      setErrorMessage("Please add the unit title")
      setShowErrorDialog(true)
      return
    }

    // Proceed to save
    saveCourse()
  }

  const saveCourse = () => {
    // Create new course
    const newCourse: Course = {
      id: `course_${Date.now()}`,
      title: courseData.title,
      description: courseData.description,
      duration: courseData.duration,
      skillLevel: courseData.skillLevel,
      category: courseData.category,
      students: 0,
      rating: 5.0,
      isPremium: courseData.isPremium,
      chefId: "current_user",
      chefName: "You",
      image: courseImage || "https://via.placeholder.com/400x300",
      units: units.map(unit => ({
        id: unit.id,
        title: unit.title,
        objective: unit.objective,
        content: unit.content,
        steps: unit.steps.map(s => s.text).filter(t => t.trim()),
        commonErrors: unit.commonErrors.map(e => e.text).filter(t => t.trim()),
        bestPractices: unit.bestPractices.map(p => p.text).filter(t => t.trim())
      }))
    }

    onSave(newCourse)
    setShowSuccessDialog(true)
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
                <Image source={{ uri: courseImage }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.imageUploadContent}>
                  <Ionicons name="image-outline" size={40} color="#64748B" />
                  <Text style={styles.imageUploadText}>Tap to upload course image</Text>
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
            <TextInput
              style={styles.textInput}
              value={courseData.category}
              onChangeText={(text) => setCourseData({ ...courseData, category: text })}
              placeholder="e.g., Kitchen Fundamentals"
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration *</Text>
            <TextInput
              style={styles.textInput}
              value={courseData.duration}
              onChangeText={(text) => setCourseData({ ...courseData, duration: text })}
              placeholder="e.g., 1 hour, 4 weeks"
              placeholderTextColor="#64748B"
            />
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

          {/* Premium Toggle */}
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
                  placeholder="Unit title (e.g., Sharpening Fundamentals)"
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
                style={[styles.saveButton, { flex: 1, marginBottom: 0 }]} 
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <View style={[styles.saveButtonGradient, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 2, borderRadius: 16, borderColor: 'rgba(34, 197, 94, 0.4)', paddingVertical: 16 }]}>
                  <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                  <Text style={[styles.saveButtonText, { color: '#22C55E', fontSize: 16, fontWeight: '700', marginLeft: 4 }]}>Create Course</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Dialog
        visible={showNoImageDialog}
        type="warning"
        title="No Image Uploaded"
        message="You haven't uploaded a course image. Do you want to continue without an image?"
        onClose={() => {
          setShowNoImageDialog(false)
          setCurrentStep('units')
        }}
        onCloseButton={() => setShowNoImageDialog(false)}
        onConfirm={() => {
          setShowNoImageDialog(false)
          setCurrentStep('units')
        }}
        confirmText="Continue"
        cancelText="Add Image"
        showCancelButton={true}
        showCloseButton={true}
      />

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
        title="Course Created!"
        message="Your course has been created successfully"
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
  studentsText: {
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
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statsOverviewCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statsOverviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewStatItem: {
    alignItems: "center",
    flex: 1,
  },
  overviewStatIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewStatValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  overviewStatLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "500",
  },
  overviewStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 72) / 2,
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
  statGradient: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  statNumber: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
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
    paddingVertical: 16,
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
    flex: 1,
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
  statusBadgeText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3,
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
})

export default ChefDashboardScreen