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
  reviews: number
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
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  duration: string
  students: number
  rating: number
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
  const [userType, setUserType] = useState<"user" | "chef">("user")
  const [selectedChef, setSelectedChef] = useState<string | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false)

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
      recipes: [],
    },
    {
      id: "3",
      name: "Jamie Oliver",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      specialty: "Healthy Cooking",
      rating: 4.6,
      subscribers: 156000,
      isSubscribed: false,
      recipes: [],
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
  useEffect(() => {
    Animated.timing(feedbackAnimation, {
      toValue: showFeedbackDropdown ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [showFeedbackDropdown])

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeSelectorContainer}>
      <Text style={styles.selectorTitle}>Choose Your Experience</Text>
      <View style={styles.userTypeSelector}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === "user" && styles.activeUserType]}
          onPress={() => handleUserTypeSwitch("user")}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant-outline" size={24} color={userType === "user" ? "#FACC15" : "#6B7280"} />
          <Text style={[styles.userTypeText, userType === "user" && styles.activeUserTypeText]}>Food Explorer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.userTypeButton, userType === "chef" && styles.activeUserType]}
          onPress={() => handleUserTypeSwitch("chef")}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant" size={24} color={userType === "chef" ? "#FACC15" : "#6B7280"} />
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

  // Create sections for FlatList
  const getSections = () => {
    const sections = [
      { type: 'userTypeSelector', data: [{}] },
    ];

    if (userType === "user") {
      sections.push(
        { type: 'chefRibbon', data: [{}] },
        { type: 'latestRecipes', data: [{}] }
      );
    } else {
      sections.push(
        { type: 'chefStats', data: [{}] },
        { type: 'chefActions', data: [{}] },
        { type: 'feedbackDropdown', data: [{}] }
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
      case 'latestRecipes':
        return renderLatestRecipes();
      case 'chefStats':
        return renderChefStats();
      case 'feedbackDropdown':
        return renderFeedbackDropdown();
      case 'chefActions':
        return renderChefActions();
      default:
        return null;
    }
  };

  // Update the renderLatestRecipes to not use FlatList
  const renderLatestRecipes = () => {
    const selectedChefData = chefs.find((chef) => chef.id === selectedChef)
    const recipesToShow = selectedChefData
      ? selectedChefData.recipes
      : chefs
          .filter((chef) => chef.isSubscribed)
          .flatMap((chef) => chef.recipes)
          .slice(0, 6)

    return (
      <View style={styles.recipesContainer}>
        <Text style={styles.sectionTitle}>
          {selectedChefData ? `${selectedChefData.name}'s Recipes` : "Latest Recipes"}
        </Text>
        {/* Replace FlatList with mapped Views */}
        <View style={styles.recipesGrid}>
          {recipesToShow.map((item, index) => (
            <View key={item.id} style={[styles.recipeCard, { width: (SCREEN_WIDTH - 56) / 2 }]}>
              <Image source={{ uri: item.image }} style={styles.recipeImage} />
              {item.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={12} color="#FACC15" />
                  <Text style={styles.premiumText}>Premium</Text>
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
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderChefStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Your Performance</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.statGradient}>
            <Ionicons name="restaurant" size={24} color="white" />
            <Text style={styles.statNumber}>{chefStats.totalRecipes}</Text>
            <Text style={styles.statLabel}>Total Recipes</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.statGradient}>
            <Ionicons name="diamond" size={24} color="white" />
            <Text style={styles.statNumber}>{chefStats.premiumRecipes}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={["#10B981", "#059669"]} style={styles.statGradient}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.statNumber}>{chefStats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.statGradient}>
            <Ionicons name="star" size={24} color="white" />
            <Text style={styles.statNumber}>{chefStats.averageRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  )

  const renderFeedbackDropdown = () => (
    <View style={styles.feedbackContainer}>
      <TouchableOpacity
        style={styles.feedbackHeader}
        onPress={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
        activeOpacity={0.8}
      >
        <View style={styles.feedbackHeaderContent}>
          <Ionicons name="chatbubbles" size={20} color="#FACC15" />
          <Text style={styles.feedbackTitle}>User Feedback</Text>
          <View style={styles.feedbackBadge}>
            <Text style={styles.feedbackBadgeText}>{feedbacks.length}</Text>
          </View>
        </View>
        <Animated.View
          style={{
            transform: [
              {
                rotate: feedbackAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          }}
        >
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.feedbackDropdown,
          {
            opacity: feedbackAnimation,
            transform: [
              {
                translateY: feedbackAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showFeedbackDropdown ? "auto" : "none"}
      >
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
      </Animated.View>
    </View>
  )

  const renderChefActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={() => setShowRecipeModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.actionGradient}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.actionText}>Upload Recipe</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => setShowCourseModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.actionGradient}>
          <Ionicons name="school" size={24} color="white" />
          <Text style={styles.actionText}>Create Course</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#000000", "#1F2937"]} style={StyleSheet.absoluteFill} />

      {/* Replace ScrollView with FlatList */}
      <FlatList
        data={getSections()}
        renderItem={renderSection}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />

      {/* Recipe Upload Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <RecipeUploadModal onClose={() => setShowRecipeModal(false)} />
      </Modal>

      {/* Course Creation Modal */}
      <Modal
        visible={showCourseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <CourseCreationModal onClose={() => setShowCourseModal(false)} />
      </Modal>
    </View>
  )
}

// Recipe Upload Modal Component
const RecipeUploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
    // Save recipe logic here
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
        <TouchableOpacity style={styles.imageUploadContainer} onPress={handleImagePicker}>
          {recipeImage ? (
            <Image source={{ uri: recipeImage }} style={styles.uploadedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#6B7280" />
              <Text style={styles.imagePlaceholderText}>Add Recipe Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Recipe Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipe Title</Text>
            <TextInput
              style={styles.textInput}
              value={recipeData.title}
              onChangeText={(text) => setRecipeData({ ...recipeData, title: text })}
              placeholder="Enter recipe title"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
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

          {/* Premium Toggle */}
          <View style={styles.toggleContainer}>
            <Text style={styles.inputLabel}>Recipe Type</Text>
            <TouchableOpacity
              style={[styles.premiumToggle, recipeData.isPremium && styles.premiumToggleActive]}
              onPress={() => setRecipeData({ ...recipeData, isPremium: !recipeData.isPremium })}
            >
              <Ionicons
                name={recipeData.isPremium ? "diamond" : "diamond-outline"}
                size={20}
                color={recipeData.isPremium ? "#FACC15" : "#6B7280"}
              />
              <Text style={[styles.toggleText, recipeData.isPremium && styles.toggleTextActive]}>
                {recipeData.isPremium ? "Premium Recipe" : "Free Recipe"}
              </Text>
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
const CourseCreationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
  })

  const handleSave = () => {
    // Save course logic here
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
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Course Title</Text>
            <TextInput
              style={styles.textInput}
              value={courseData.title}
              onChangeText={(text) => setCourseData({ ...courseData, title: text })}
              placeholder="Enter course title"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
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
            <Text style={styles.inputLabel}>Price ($)</Text>
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
            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.textInput}
              value={courseData.duration}
              onChangeText={(text) => setCourseData({ ...courseData, duration: text })}
              placeholder="e.g., 4 weeks"
              placeholderTextColor="#6B7280"
            />
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
  scrollContent: {
    paddingBottom: 120, // Increased from 100 to give more space at bottom
  },
  contentContainer: {
    flex: 1,
  },
  userTypeSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  selectorTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  userTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeUserType: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
  userTypeText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  activeUserTypeText: {
    color: "#FACC15",
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
    backgroundColor: "#1F2937",
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
    backgroundColor: "#1F2937",
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
  premiumText: {
    color: "#FACC15",
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  statGradient: {
    padding: 20,
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  feedbackContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F2937",
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
    backgroundColor: "#1F2937",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  feedbackItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  feedbackAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackUserName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  feedbackRating: {
    flexDirection: "row",
    marginLeft: 8,
  },
  feedbackComment: {
    color: "#D1D5DB",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  feedbackRecipe: {
    color: "#FACC15",
    fontSize: 12,
    marginTop: 4,
  },
  feedbackDate: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24, // Add bottom margin for spacing
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
    backgroundColor: "#1F2937",
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
    backgroundColor: "#1F2937",
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
    backgroundColor: "#1F2937",
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
    backgroundColor: "#1F2937",
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
})

export default ChefDashboardScreen