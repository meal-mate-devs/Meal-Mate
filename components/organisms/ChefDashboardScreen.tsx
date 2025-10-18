"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

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
  price: number
  duration: string
  students: number
  rating: number
  isPremium: boolean
  chefId: string
  chefName: string
  image: string
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
  const [userType, setUserType] = useState<"user" | "chef">("user")
  const [selectedChef, setSelectedChef] = useState<string | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<"recipes" | "courses">("recipes")
  
  // Chef dashboard toggle state
  const [chefDashboardTab, setChefDashboardTab] = useState<"feedback" | "content">("content")

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
      price: 199.99,
      duration: "8 weeks",
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
          price: 199.99,
          duration: "8 weeks",
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
          price: 149.99,
          duration: "6 weeks",
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
          price: 129.99,
          duration: "5 weeks",
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
          price: 99.99,
          duration: "4 weeks",
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
          price: 89.99,
          duration: "3 weeks",
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
          <Ionicons name="restaurant-outline" size={20} color={userType === "user" ? "#000000" : "#9CA3AF"} />
          <Text style={[styles.userTypeText, userType === "user" && styles.activeUserTypeText]}>Food Explorer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.userTypeButton, userType === "chef" && styles.activeUserType]}
          onPress={() => handleUserTypeSwitch("chef")}
          activeOpacity={0.8}
        >
          <Ionicons name="business-outline" size={20} color={userType === "chef" ? "#000000" : "#9CA3AF"} />
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
          color={activeTab === "recipes" ? "#000000" : "#9CA3AF"} 
        />
        <Text style={[styles.tabText, activeTab === "recipes" && styles.activeTabText]}>
          Recipes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === "courses" && styles.activeTab]}
        onPress={() => setActiveTab("courses")}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="school-outline" 
          size={20} 
          color={activeTab === "courses" ? "#000000" : "#9CA3AF"} 
        />
        <Text style={[styles.tabText, activeTab === "courses" && styles.activeTabText]}>
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
          color={chefDashboardTab === "content" ? "#000000" : "#9CA3AF"} 
        />
        <Text style={[styles.tabText, chefDashboardTab === "content" && styles.activeTabText]}>
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
          color={chefDashboardTab === "feedback" ? "#000000" : "#9CA3AF"} 
        />
        <Text style={[styles.tabText, chefDashboardTab === "feedback" && styles.activeTabText]}>
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
                    Alert.alert(
                      "Premium Recipe", 
                      `This recipe is only available to subscribers of ${ownerChef?.name}. Subscribe to access this content.`,
                      [{ text: "OK" }]
                    )
                  } else {
                    Alert.alert("Recipe Access", `Opening ${item.title}...`)
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
                    Alert.alert(
                      "Premium Course", 
                      `This course is only available to subscribers of ${item.chefName}. Subscribe to access this content.`,
                      [{ text: "OK" }]
                    )
                  } else {
                    Alert.alert("Course Access", `Opening ${item.title}...`)
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
                    <Text style={styles.priceText}>${item.price}</Text>
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
      <View style={styles.statsRow}>
        <View style={styles.compactBeautifulCard}>
          <LinearGradient
            colors={["#FACC15", "#F59E0B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactCardGradient}
          >
            <Text style={styles.compactStatNumber}>{chefStats.totalRecipes}</Text>
            <Text style={styles.compactStatLabel}>Recipes</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.compactBeautifulCard}>
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactCardGradient}
          >
            <Text style={styles.compactStatNumber}>{chefStats.premiumRecipes}</Text>
            <Text style={styles.compactStatLabel}>Premium</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.compactBeautifulCard}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactCardGradient}
          >
            <Text style={styles.compactStatNumber}>{chefStats.totalStudents}</Text>
            <Text style={styles.compactStatLabel}>Students</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.compactBeautifulCard}>
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compactCardGradient}
          >
            <Text style={styles.compactStatNumber}>{chefStats.averageRating}</Text>
            <Text style={styles.compactStatLabel}>Rating</Text>
          </LinearGradient>
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
      <TouchableOpacity style={styles.actionButton} onPress={() => setShowRecipeModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={["#FACC15", "#F59E0B"]} style={styles.actionGradient}>
          <Ionicons name="restaurant-outline" size={20} color="white" />
          <Text style={styles.actionText}>Upload Recipe</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => setShowCourseModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={["#3B82F6", "#1E40AF"]} style={styles.actionGradient}>
          <Ionicons name="school-outline" size={20} color="white" />
          <Text style={styles.actionText}>Create Course</Text>
        </LinearGradient>
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
                <Ionicons name="restaurant-outline" size={32} color="#6B7280" />
                <Text style={styles.emptyManagementText}>No recipes uploaded yet</Text>
                <Text style={styles.emptyManagementSubtext}>Start by uploading your first recipe</Text>
              </View>
            )
          ) : (
            userCourses.length > 0 ? (
              userCourses.map((course, index) => renderManagementCourseCard(course, index))
            ) : (
              <View style={styles.emptyManagement}>
                <Ionicons name="school-outline" size={32} color="#6B7280" />
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
            <Ionicons name="chatbubble" size={14} color="#6B7280" />
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
            <Ionicons name="people" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{course.students} students</Text>
          </View>
        </View>
        
        <View style={styles.coursePriceContainer}>
          <Text style={styles.managementCoursePrice}>${course.price}</Text>
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
    Alert.alert(
      "Edit Recipe",
      `Edit "${recipe.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Edit", 
          onPress: () => {
            // TODO: Open edit modal with pre-filled data
            Alert.alert("Edit Recipe", "Edit functionality will be implemented here")
          }
        }
      ]
    )
  }

  const handleDeleteRecipe = (recipeId: string) => {
    const recipe = userRecipes.find(r => r.id === recipeId)
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to delete "${recipe?.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setUserRecipes(prev => prev.filter(r => r.id !== recipeId))
            Alert.alert("Success", "Recipe deleted successfully")
          }
        }
      ]
    )
  }

  const handleEditCourse = (course: Course) => {
    Alert.alert(
      "Edit Course",
      `Edit "${course.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Edit", 
          onPress: () => {
            // TODO: Open edit modal with pre-filled data
            Alert.alert("Edit Course", "Edit functionality will be implemented here")
          }
        }
      ]
    )
  }

  const handleDeleteCourse = (courseId: string) => {
    const course = userCourses.find(c => c.id === courseId)
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course?.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setUserCourses(prev => prev.filter(c => c.id !== courseId))
            Alert.alert("Success", "Course deleted successfully")
          }
        }
      ]
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
    cookTime: "",
    ingredients: "",
    instructions: "",
  })
  const [recipeImage, setRecipeImage] = useState<string | null>(null)

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

  const handleSave = () => {
    // Validation
    if (!recipeData.title.trim()) {
      Alert.alert("Error", "Please enter a recipe title")
      return
    }
    if (!recipeData.description.trim()) {
      Alert.alert("Error", "Please enter a recipe description")
      return
    }
    if (!recipeData.cookTime.trim()) {
      Alert.alert("Error", "Please enter cook time")
      return
    }
    if (!recipeImage) {
      Alert.alert("Error", "Please upload a recipe image")
      return
    }

    // Create new recipe
    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}`,
      title: recipeData.title,
      description: recipeData.description,
      image: recipeImage,
      cookTime: recipeData.cookTime,
      difficulty: recipeData.difficulty,
      rating: 5.0,
      isPremium: recipeData.isPremium,
      chefName: "You",
    }

    onSave(newRecipe)
    Alert.alert("Success", "Recipe uploaded successfully!")
    onClose()
  }

  return (
    <KeyboardAvoidingView 
      style={styles.modalContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={["#000000", "#1F2937"]} style={StyleSheet.absoluteFill} />

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
                <Ionicons name="camera" size={40} color="#6B7280" />
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
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={recipeData.description}
              onChangeText={(text) => setRecipeData({ ...recipeData, description: text })}
              placeholder="Describe your recipe"
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cook Time *</Text>
            <TextInput
              style={styles.textInput}
              value={recipeData.cookTime}
              onChangeText={(text) => setRecipeData({ ...recipeData, cookTime: text })}
              placeholder="e.g., 30 minutes"
              placeholderTextColor="#6B7280"
            />
          </View>

          {/* Premium Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, recipeData.isPremium && styles.checkboxActive]}
                onPress={() => setRecipeData({ ...recipeData, isPremium: !recipeData.isPremium })}
              >
                {recipeData.isPremium && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Premium Recipe</Text>
            </View>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cook Time</Text>
            <TextInput
              style={styles.textInput}
              value={recipeData.cookTime}
              onChangeText={(text) => setRecipeData({ ...recipeData, cookTime: text })}
              placeholder="e.g., 30 minutes"
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.saveButtonGradient}>
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.saveButtonText}>Upload Recipe</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Course Creation Modal Component
const CourseCreationModal: React.FC<{ onClose: () => void; onSave: (course: Course) => void }> = ({ onClose, onSave }) => {
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    isPremium: false,
  })
  const [courseImage, setCourseImage] = useState<string | null>(null)

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

  const handleSave = () => {
    // Validation
    if (!courseData.title.trim()) {
      Alert.alert("Error", "Please enter a course title")
      return
    }
    if (!courseData.description.trim()) {
      Alert.alert("Error", "Please enter a course description")
      return
    }
    if (!courseData.price.trim()) {
      Alert.alert("Error", "Please enter a course price")
      return
    }
    if (!courseData.duration.trim()) {
      Alert.alert("Error", "Please enter course duration")
      return
    }
    if (!courseImage) {
      Alert.alert("Error", "Please upload a course image")
      return
    }

    // Create new course
    const newCourse: Course = {
      id: `course_${Date.now()}`,
      title: courseData.title,
      description: courseData.description,
      price: parseFloat(courseData.price),
      duration: courseData.duration,
      students: 0,
      rating: 5.0,
      isPremium: courseData.isPremium,
      chefId: "current_user",
      chefName: "You",
      image: courseImage,
    }

    onSave(newCourse)
    Alert.alert("Success", "Course created successfully!")
    onClose()
  }

  return (
    <KeyboardAvoidingView 
      style={styles.modalContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={["#000000", "#1F2937"]} style={StyleSheet.absoluteFill} />

      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Create New Course</Text>
        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.modalContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                  <Ionicons name="image-outline" size={40} color="#6B7280" />
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
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={courseData.description}
              onChangeText={(text) => setCourseData({ ...courseData, description: text })}
              placeholder="Describe your course"
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price ($) *</Text>
            <TextInput
              style={styles.textInput}
              value={courseData.price}
              onChangeText={(text) => setCourseData({ ...courseData, price: text })}
              placeholder="Course price"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration *</Text>
            <TextInput
              style={styles.textInput}
              value={courseData.duration}
              onChangeText={(text) => setCourseData({ ...courseData, duration: text })}
              placeholder="e.g., 4 weeks"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, courseData.isPremium && styles.checkboxActive]}
                onPress={() => setCourseData({ ...courseData, isPremium: !courseData.isPremium })}
              >
                {courseData.isPremium && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Premium Course</Text>
            </View>
          </View>

          {/* Level Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Course Level</Text>
            <View style={styles.difficultySelector}>
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.difficultyButton, courseData.level === level && styles.difficultyButtonActive]}
                  onPress={() => setCourseData({ ...courseData, level: level as any })}
                >
                  <Text style={[styles.difficultyText, courseData.level === level && styles.difficultyTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.saveButtonGradient}>
            <Ionicons name="school" size={20} color="white" />
            <Text style={styles.saveButtonText}>Create Course</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "#374151",
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
  userTypeText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  activeUserTypeText: {
    color: "#000000",
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
    backgroundColor: "#27272a",
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
    color: "#6B7280",
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
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 3,
    marginHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
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
  tabText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#000000",
    fontWeight: "700",
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
    color: "#6B7280",
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
    backgroundColor: "#27272a",
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
    color: "#6B7280",
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
    color: "#6B7280",
    fontSize: 12,
    marginLeft: 4,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
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
    backgroundColor: "#27272a",
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
    backgroundColor: "#27272a",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  feedbackItem: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#27272a",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
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
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  feedbackRating: {
    flexDirection: "row",
    marginLeft: 12,
    alignItems: "center",
  },
  feedbackComment: {
    color: "#D1D5DB",
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
    color: "#9CA3AF",
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
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
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
    borderBottomColor: "#374151",
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
    backgroundColor: "#27272a",
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
    color: "#6B7280",
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
    backgroundColor: "#27272a",
    borderRadius: 12,
    padding: 16,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#374151",
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
    backgroundColor: "#27272a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  premiumToggleActive: {
    borderColor: "#FACC15",
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  toggleText: {
    color: "#6B7280",
    fontSize: 16,
    marginLeft: 12,
  },
  toggleTextActive: {
    color: "#FACC15",
  },
  difficultySelector: {
    flexDirection: "row",
    backgroundColor: "#27272a",
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
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  difficultyTextActive: {
    color: "#000000",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 20,
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
    backgroundColor: "#27272a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
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
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  
  // Checkbox Styles
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#374151",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#FACC15",
    borderColor: "#FACC15",
  },
  checkboxLabel: {
    color: "#E5E7EB",
    fontSize: 16,
  },
  
  // Content Management Styles
  contentManagementContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  managementTabSelector: {
    flexDirection: "row",
    backgroundColor: "#27272a",
    borderRadius: 20,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#374151",
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
    color: "#9CA3AF",
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
    backgroundColor: "#27272a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
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
    color: "#9CA3AF",
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
    color: "#6B7280",
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
    borderTopColor: "#374151",
    paddingTop: 12,
    marginTop: 4,
  },
  managementActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#374151",
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
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyManagementSubtext: {
    color: "#6B7280",
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
    backgroundColor: "#374151",
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
    color: "#6B7280",
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