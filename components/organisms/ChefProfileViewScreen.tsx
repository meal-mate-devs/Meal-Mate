"use client"

import * as chefService from "@/lib/api/chefService"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
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

  // Load recipes and courses from backend
  useEffect(() => {
    if (visible && chef.id) {
      loadChefContent()
      checkSubscription()
    }
  }, [visible, chef.id])

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

  const loadChefContent = async () => {
    // Load recipes
    setIsLoadingRecipes(true)
    try {
      const { recipes: fetchedRecipes } = await chefService.getChefRecipes(chef.id, { limit: 50 })
      setRecipes(fetchedRecipes as any)
    } catch (error) {
      console.log("Failed to load recipes:", error)
    } finally {
      setIsLoadingRecipes(false)
    }

    // Load courses
    setIsLoadingCourses(true)
    try {
      const { courses: fetchedCourses } = await chefService.getChefCourses(chef.id, { limit: 50 })
      setCourses(fetchedCourses as any)
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

  const handleSubscribe = async () => {
    setIsSubscribing(true)
    try {
      await onSubscribeToggle?.(chef.id)
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSubmitReport = () => {
    const finalReason = customReason.trim() || reportReason
    if (!finalReason) {
      alert("Please describe your concern or select a reason")
      return
    }
    onReport?.(chef.id, finalReason, reportDescription)
    setShowReportDialog(false)
    setReportReason("")
    setReportDescription("")
    setCustomReason("")
  }

  const handleSubmitRating = () => {
    if (userRating === 0) {
      alert("Please select a rating")
      return
    }
    onRate?.(chef.id, userRating, userFeedback)
    setShowRatingDialog(false)
    setUserRating(0)
    setUserFeedback("")
  }

  const getFilteredContent = () => {
    if (activeTab === "recipes") {
      return chef.recipes.filter((r) => !r.isRestricted)
    } else if (activeTab === "courses") {
      return chef.courses.filter((c) => !c.isRestricted)
    } else {
      // Restricted content
      return [
        ...chef.recipes.filter((r) => r.isRestricted),
        ...chef.courses.filter((c) => c.isRestricted),
      ]
    }
  }

  const renderRecipeCard = (recipe: Recipe) => (
    <TouchableOpacity 
      style={styles.contentCard} 
      key={recipe.id}
      activeOpacity={0.7}
    >
      <Image source={{ uri: recipe.image }} style={styles.contentImage} />
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
            <Text style={styles.metaText}>{recipe.rating}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="chatbubble-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>{recipe.reviews || 0} reviews</Text>
          </View>
        </View>
        
        <View style={styles.contentActions}>
          <TouchableOpacity 
            style={styles.contentActionButton}
            onPress={(e) => {
              e.stopPropagation()
              // TODO: Implement report recipe
              console.log("Report recipe:", recipe.id)
            }}
          >
            <Ionicons name="flag-outline" size={16} color="#EF4444" />
            <Text style={[styles.contentActionText, { color: "#EF4444" }]}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.contentActionButton, styles.rateActionButton]}
            onPress={(e) => {
              e.stopPropagation()
              // TODO: Implement rate recipe
              console.log("Rate recipe:", recipe.id)
            }}
          >
            <Ionicons name="star-outline" size={16} color="#FACC15" />
            <Text style={[styles.contentActionText, { color: "#FACC15" }]}>Rate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity 
      style={styles.contentCard} 
      key={course.id}
      activeOpacity={0.7}
    >
      <Image source={{ uri: course.image }} style={styles.contentImage} />
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
            <Text style={styles.metaText}>{course.duration || "N/A"}</Text>
          </View>
          {course.rating && (
            <View style={styles.metaBadge}>
              <Ionicons name="star" size={14} color="#FACC15" />
              <Text style={styles.metaText}>{course.rating}</Text>
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
            onPress={(e) => {
              e.stopPropagation()
              // TODO: Implement report course
              console.log("Report course:", course.id)
            }}
          >
            <Ionicons name="flag-outline" size={16} color="#EF4444" />
            <Text style={[styles.contentActionText, { color: "#EF4444" }]}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.contentActionButton, styles.rateActionButton]}
            onPress={(e) => {
              e.stopPropagation()
              // TODO: Implement rate course
              console.log("Rate course:", course.id)
            }}
          >
            <Ionicons name="star-outline" size={16} color="#FACC15" />
            <Text style={[styles.contentActionText, { color: "#FACC15" }]}>Rate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={["#1a1a1a", "#0a0a0a"]} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chef Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Chef Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileTopSection}>
                {/* Avatar on left */}
                <Image source={{ uri: chef.avatar }} style={styles.chefAvatar} />

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
                      chef.isSubscribed && styles.subscribedButton,
                    ]}
                    onPress={handleSubscribe}
                    disabled={isSubscribing}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={chef.isSubscribed ? "checkmark-circle" : "add-circle-outline"}
                      size={18}
                      color={chef.isSubscribed ? "#22C55E" : "white"}
                    />
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        chef.isSubscribed && styles.subscribedButtonText,
                      ]}
                    >
                      {isSubscribing
                        ? "Loading..."
                        : chef.isSubscribed
                        ? "Subscribed"
                        : "Subscribe"}
                    </Text>
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
                      {(chef.stats?.freeRecipesCount || 0) + (chef.stats?.premiumRecipesCount || 0)}
                    </Text>
                    <Text style={styles.statGridLabel}>Total Recipes</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                      <Ionicons name="book-outline" size={15} color="#8B5CF6" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chef.stats?.coursesCount || 0}
                    </Text>
                    <Text style={styles.statGridLabel}>Total Courses</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="people-outline" size={15} color="#3B82F6" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chef.stats?.totalStudents || chef.subscribers}
                    </Text>
                    <Text style={styles.statGridLabel}>Subscribers</Text>
                  </View>

                  <View style={styles.statGridItem}>
                    <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Ionicons name="star" size={15} color="#F59E0B" />
                    </View>
                    <Text style={styles.statGridValue}>
                      {chef.stats?.averageRating?.toFixed(1) || chef.rating.toFixed(1)}
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
                  <Text style={styles.actionButtonText}>Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rateButton]}
                  onPress={() => setShowRatingDialog(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="star-outline" size={20} color="#FACC15" />
                  <Text style={[styles.actionButtonText, styles.rateButtonText]}>
                    Rate Chef
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
                  Recipes
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
                  Courses
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
                  Restricted
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content List */}
            <View style={styles.contentList}>
              {activeTab === "recipes" && (
                <>
                  {chef.recipes.filter((r) => !r.isRestricted).length > 0 ? (
                    chef.recipes
                      .filter((r) => !r.isRestricted)
                      .map((recipe) => renderRecipeCard(recipe))
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
                  {chef.courses.filter((c) => !c.isRestricted).length > 0 ? (
                    chef.courses
                      .filter((c) => !c.isRestricted)
                      .map((course) => renderCourseCard(course))
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
                  {chef.recipes.filter((r) => r.isRestricted).map((recipe) => renderRecipeCard(recipe))}
                  {chef.courses.filter((c) => c.isRestricted).map((course) => renderCourseCard(course))}
                  {chef.recipes.filter((r) => r.isRestricted).length === 0 &&
                    chef.courses.filter((c) => c.isRestricted).length === 0 && (
                      <View style={styles.emptyState}>
                        <Ionicons name="lock-closed-outline" size={48} color="#475569" />
                        <Text style={styles.emptyStateText}>No Restricted Content</Text>
                        <Text style={styles.emptyStateSubtext}>
                          This chef has no restricted content available
                        </Text>
                      </View>
                    )}
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
              onChangeText={(text) => {
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
            >
              <Text style={styles.submitButtonText}>Submit Report</Text>
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
            disabled={userRating === 0}
            style={[styles.dialogButton, styles.submitButton, userRating === 0 && styles.disabledButton]}
          >
            <Text style={[styles.submitButtonText, userRating === 0 && styles.disabledButtonText]}>Submit Rating</Text>
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
})

export default ChefProfileViewScreen
