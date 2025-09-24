"use client"

import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import DateTimePicker from '@react-native-community/datetimepicker'
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Interface for pantry items
interface PantryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: Date
  addedDate: Date
  image?: string
  barcode?: string
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

// Modern category definitions with refined colors and icons
const CATEGORIES = [
  { id: "vegetables", name: "Vegetables", icon: "leaf-outline", color: "#22C55E" },
  { id: "fruits", name: "Fruits", icon: "nutrition-outline", color: "#F97316" },
  { id: "meat", name: "Meat & Fish", icon: "fish-outline", color: "#EF4444" },
  { id: "other", name: "Other", icon: "apps-outline", color: "#6366F1" },
]



// Common units for food measurement
const UNITS = ["pieces", "kilograms", "grams", "liters", "milliliters", "cups", "tablespoons", "teaspoons", "ounces", "pounds"]

// Status indicators for item expiry
const STATUS = {
  ACTIVE: "active",
  EXPIRING: "expiring",
  EXPIRED: "expired"
}

/**
 * PantryManagementScreen Component
 * A sleek, modern, minimalist interface for managing pantry items
 */
const PantryManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState(STATUS.ACTIVE)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([
    {
      id: "1",
      name: "Fresh Tomatoes",
      category: "vegetables",
      quantity: 6,
      unit: "pieces",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      addedDate: new Date(),
      image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400",
    },
    {
      id: "2",
      name: "Organic Milk",
      category: "dairy",
      quantity: 1,
      unit: "liters",
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days (expiring soon)
      addedDate: new Date(),
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
    },
    {
      id: "3",
      name: "Expired Bread",
      category: "grains",
      quantity: 1,
      unit: "pieces",
      expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (expired)
      addedDate: new Date(),
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    },
    {
      id: "4",
      name: "Chicken Breast",
      category: "meat",
      quantity: 2,
      unit: "kilograms",
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      addedDate: new Date(),
      image: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400",
    },
    {
      id: "5",
      name: "Brown Rice",
      category: "grains",
      quantity: 1,
      unit: "kilograms",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      addedDate: new Date(),
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
    },
  ])

  // State variables
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showItemDetails, setShowItemDetails] = useState<PantryItem | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)

  // Animation references
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const addButtonAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const searchBarAnim = useRef(new Animated.Value(0)).current
  const headerHeightAnim = useRef(new Animated.Value(120)).current

  // Form state for new item
  const [newItem, setNewItem] = useState({
    name: "",
    category: "vegetables",
    quantity: "",
    unit: "pieces",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    image: "",
  })
  
  // State for unit dropdown visibility
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)

  // Animation effects
  useEffect(() => {
    // Static button without continuous animation for better performance
    // Set a static value instead of a resource-intensive continuous animation
    addButtonAnim.setValue(1)

    // Empty state rotation animation - less intensive, slower animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000, // Slower animation
        useNativeDriver: true,
      })
    ).start()
  }, [])

  /**
   * Helper Functions
   */

  // Get items filtered by expiry status
  const getItemsByStatus = useCallback(() => {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const active = pantryItems.filter((item) => item.expiryDate > threeDaysFromNow)
    const expiringSoon = pantryItems.filter((item) => item.expiryDate <= threeDaysFromNow && item.expiryDate > now)
    const expired = pantryItems.filter((item) => item.expiryDate <= now)

    return { active, expiringSoon, expired }
  }, [pantryItems])

  // Get filtered items based on active tab, search, and category
  const filteredItems = useCallback(() => {
    const { active, expiringSoon, expired } = getItemsByStatus()
    let items = []

    switch (activeTab) {
      case STATUS.ACTIVE:
        items = active
        break
      case STATUS.EXPIRING:
        items = expiringSoon
        break
      case STATUS.EXPIRED:
        items = expired
        break
      default:
        items = active
    }

    // Apply search filter if query exists
    if (searchQuery) {
      items = items.filter((item) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter if selected
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory)
    }

    return items
  }, [activeTab, getItemsByStatus, searchQuery, selectedCategory])

  // Calculate days until expiry
  const getDaysUntilExpiry = useCallback((expiryDate: Date) => {
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [])

  // Get color based on expiry status
  const getExpiryColor = useCallback((expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate)
    if (days < 0) return "#EF4444" // Expired (red)
    if (days <= 3) return "#F59E0B" // Expiring soon (amber)
    return "#22C55E" // Active (green)
  }, [getDaysUntilExpiry])

  // Get expiry status text
  const getExpiryText = useCallback((expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate)
    if (days < 0) return `Expired ${Math.abs(days)}d ago`
    if (days === 0) return "Expires today"
    if (days === 1) return "Expires tomorrow"
    return `Expires in ${days} days`
  }, [getDaysUntilExpiry])

  // Handle tab change with animation
  const handleTabChange = useCallback((tab: string) => {
    // Set the tab state immediately for faster UI response
    setActiveTab(tab)
    
    // Apply subtle animation after state change
    Animated.timing(fadeAnim, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start()
    })
  }, [fadeAnim])

  // Handle category selection
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  // Handle adding new item
  const handleAddItem = useCallback(async () => {
    if (!newItem.name || !newItem.quantity) {
      // Show validation error
      Alert.alert(
        "Missing Information", 
        "Please fill in at least the name and quantity fields."
      )
      return
    }

    // Create new pantry item
    const item: PantryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      quantity: Number.parseInt(newItem.quantity),
      unit: newItem.unit,
      expiryDate: newItem.expiryDate,
      addedDate: new Date(),
      image: newItem.image,
    }

    // Add to state
    setPantryItems((prev) => [...prev, item])
    
    // Reset and close modal
    setShowAddModal(false)
    setNewItem({
      name: "",
      category: "vegetables",
      quantity: "",
      unit: "pieces",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      image: "",
    })

    // Success animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [newItem, scaleAnim])

  // Handle item removal with confirmation
  const handleRemoveItem = useCallback((itemId: string) => {
    // Show confirmation dialog
    Alert.alert(
      "Remove Item", 
      "Are you sure you want to remove this item?", 
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // Remove item and close detail modal if open
            setPantryItems((prev) => prev.filter((item) => item.id !== itemId))
            if (showItemDetails?.id === itemId) {
              setShowItemDetails(null)
            }
          },
        },
      ]
    )
  }, [showItemDetails])

  // Unified image picker - offers both camera and gallery options
  const handleImagePicker = useCallback(async () => {
    if (isImagePickerOpen) return
    setIsImagePickerOpen(true)

    try {
      // Show options to user
      Alert.alert(
        "Add Item Photo",
        "Choose a photo source",
        [
          {
            text: "Camera",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync()
              if (status !== "granted") {
                Alert.alert(
                  "Permission Required", 
                  "Please grant camera access to capture food photos."
                )
                return
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              })

              if (!result.canceled && result.assets[0]) {
                setNewItem((prev) => ({ ...prev, image: result.assets[0].uri }))
              }
            }
          },
          {
            text: "Gallery",
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
              if (status !== "granted") {
                Alert.alert(
                  "Permission Required", 
                  "Please grant photo library access to add item photos."
                )
                return
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
              })

              if (!result.canceled && result.assets[0]) {
                setNewItem((prev) => ({ ...prev, image: result.assets[0].uri }))
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      )
    } catch (error) {
      console.error("Error handling image selection:", error)
    } finally {
      setIsImagePickerOpen(false)
    }
  }, [isImagePickerOpen])

  // Handle date change from picker
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNewItem((prev) => ({ ...prev, expiryDate: selectedDate }))
    }
  }, [])

  /**
   * Modern Sleek Style Definitions
   */
  const styles = StyleSheet.create({
    // Main container and layout
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },
    gradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: SCREEN_HEIGHT * 0.4,
    },
    
    // Header styles
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerContent: {
      flex: 1,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: "800",
      color: "white",
      marginBottom: 8,
      letterSpacing: -1,
    },
    headerSubtitle: {
      fontSize: 16,
      color: "#94A3B8",
      fontWeight: "500",
      marginBottom: 8,
    },
    
    // Action buttons
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 19,
      paddingHorizontal: 20,
    },
    addButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#FACC15",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    addButtonGradient: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    
    // Search bar
    searchContainer: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      marginRight: 12,
    },
    searchBlur: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 0,
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.12)",
      height: 56, // Match height with add button
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      color: "white",
      fontSize: 16,
      fontWeight: "500",
      height: "100%",
      paddingTop: 0,
      paddingBottom: 0,
    },
    
    // Status tabs
    tabBar: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 10,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 8,
      position: "relative",
    },
    tabText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "600",
      marginRight: 6,
      textAlign: "center",
      flexShrink: 1,
    },
    activeTabText: {
      color: "#FACC15",
    },
    activeTabGradient: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 2,
      right: 2,
      borderRadius: 8,
      opacity: 0.15,
    },
    countBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      color: "white",
      fontSize: 10,
      fontWeight: "700",
    },
    
    // Category filter
    categoryFilter: {
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    categoryFilterScroll: {
      paddingVertical: 8,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 10,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    activeCategoryChip: {
      backgroundColor: "rgba(250, 204, 21, 0.12)",
      borderColor: "rgba(250, 204, 21, 0.6)",
    },
    categoryChipText: {
      color: "#94A3B8",
      fontSize: 13,
      fontWeight: "600",
      marginLeft: 6,
    },
    activeCategoryChipText: {
      color: "#FACC15",
    },
    
    // Items list
    itemsList: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 40,
    },
    pantryItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
    },
    itemBlur: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    itemBackground: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: "rgba(40, 40, 40, 0.3)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    itemImageContainer: {
      position: "relative",
      margin: 16,
    },
    itemImage: {
      width: 70,
      height: 70,
      borderRadius: 14,
    },
    itemImagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    expiryBadge: {
      position: "absolute",
      top: -6,
      right: -6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      minWidth: 28,
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    expiryText: {
      color: "white",
      fontSize: 10,
      fontWeight: "700",
    },
    itemDetails: {
      flex: 1,
      paddingVertical: 16,
      paddingRight: 8,
    },
    itemName: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    itemMeta: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 6,
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      marginBottom: 4,
    },
    quantityText: {
      color: "#94A3B8",
      fontSize: 14,
      marginLeft: 6,
      fontWeight: "600",
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    locationText: {
      color: "#94A3B8",
      fontSize: 14,
      marginLeft: 6,
      fontWeight: "600",
    },
    expiryDateContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    expiryDateText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    },
    itemActions: {
      paddingHorizontal: 14,
    },
    itemActionButton: {
      padding: 10,
      borderRadius: 10,
    },
    
    // Empty state
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyStateIcon: {
      marginBottom: 24,
      opacity: 0.9,
    },
    emptyStateTitle: {
      color: "white",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 12,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    emptyStateSubtitle: {
      color: "#94A3B8",
      fontSize: 15,
      textAlign: "center",
      fontWeight: "500",
      lineHeight: 22,
    },
    
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: "#000000",
      paddingBottom: 0,
      marginBottom: 0,
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
      fontWeight: "700",
      letterSpacing: -0.5,
    },
    saveButton: {
      color: "#FACC15",
      fontSize: 16,
      fontWeight: "700",
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    
    // Form elements
    imagePickerContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 12,
      height: 26, // Consistent height
    },
    imagePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 120,
    },
    imagePickerButtonText: {
      color: "#94A3B8",
      marginLeft: 8,
      fontWeight: "500",
      fontSize: 14,
    },
    previewContainer: {
      width: 32,
      height: 32,
      position: "absolute",
      right: 12,
      alignSelf: "center",
    },
    previewImage: {
      width: 32,
      height: 32,
      borderRadius: 6,
    },
    photoPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.3)",
      borderStyle: "dashed",
    },
    photoPlaceholderText: {
      color: "#94A3B8",
      fontSize: 14,
      marginTop: 12,
      fontWeight: "500",
    },
    formField: {
      marginBottom: 14,
    },
    formRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 14,
      marginHorizontal: -6,
    },
    fieldLabel: {
      color: "white",
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56, // Min height instead of fixed height
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    activeInputContainer: {
      borderColor: "rgba(250, 204, 21, 0.3)",
      backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
    textInput: {
      flex: 1,
      color: "white",
      fontSize: 15,
      marginLeft: 12,
      fontWeight: "500",
      padding: 0, // Remove default padding that can cause alignment issues
      height: 24, // Explicitly set height for text input
    },
    placeholderText: {
      flex: 1,
      color: "#64748B",
      fontSize: 15,
      marginLeft: 12,
      fontWeight: "500",
    },
    
    // Category selection
    categorySelection: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginVertical: 8,
    },
    categoryOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 15,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      width: '48%',
      marginBottom: 12,
      height: 56, // Standardized height
    },
    selectedCategoryOption: {
      backgroundColor: "rgba(250, 204, 21, 0.12)",
      borderColor: "rgba(250, 204, 21, 0.5)",
    },
    categoryOptionText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 10,
    },
    selectedCategoryOptionText: {
      color: "#FACC15",
    },
    
    // Unit selection
    unitSelectionRow: {
      height: 48,
    },
    unitButton: {
      backgroundColor: "rgba(250, 204, 21, 0.1)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 8,
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.3)",
      minWidth: 70,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center", // Center vertically within container
      position: "absolute", // Position absolutely
      right: 12, // Align to right side of container
    },
    unitButtonText: {
      color: "#FACC15",
      fontSize: 14,
      fontWeight: "600",
    },
    unitSelectedText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
    },
    unitDropdown: {
      position: "absolute",
      top: "100%",
      right: 0,
      width: 160,
      maxHeight: 180,
      backgroundColor: "#1E1E1E",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.3)",
      marginTop: 5,
      zIndex: 9999,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    unitDropdownScroll: {
      maxHeight: 180,
    },
    unitDropdownScrollContent: {
      paddingVertical: 5,
    },
    unitDropdownItem: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    unitDropdownItemSelected: {
      backgroundColor: "rgba(250, 204, 21, 0.1)",
    },
    unitDropdownItemText: {
      color: "white",
      fontSize: 14,
      fontWeight: "500",
    },
    unitDropdownItemTextSelected: {
      color: "#FACC15",
      fontWeight: "600",
    },
    unitOption: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 10,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      minWidth: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedUnitOption: {
      backgroundColor: "rgba(250, 204, 21, 0.12)",
      borderColor: "rgba(250, 204, 21, 0.5)",
    },
    unitText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "600",
    },
    selectedUnitText: {
      color: "#FACC15",
    },
    
    // Location selection
    locationSelection: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -6,
    },
    locationOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      margin: 6,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      minWidth: '45%',
    },
    selectedLocationOption: {
      backgroundColor: "rgba(250, 204, 21, 0.12)",
      borderColor: "rgba(250, 204, 21, 0.5)",
    },
    locationOptionText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
    selectedLocationOptionText: {
      color: "#FACC15",
    },
    
    // Date input
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56, // Min height instead of fixed height
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    dateText: {
      color: "white",
      fontSize: 15,
      flex: 1,
      marginLeft: 12,
      fontWeight: "500",
    },
    
    // Item details modal
    detailsScrollContent: {
      paddingBottom: 40,
    },
    detailImageContainer: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 20,
      position: "relative",
    },
    detailImage: {
      width: 160,
      height: 160,
      borderRadius: 16,
    },
    detailImagePlaceholder: {
      width: 160,
      height: 160,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    detailExpiryBadge: {
      position: "absolute",
      top: -10,
      right: -10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignItems: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    detailExpiryText: {
      color: "white",
      fontSize: 12,
      fontWeight: "700",
    },
    detailInfo: {
      paddingBottom: 24,
    },
    detailName: {
      color: "white",
      fontSize: 26,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 28,
      letterSpacing: -0.7,
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    detailItem: {
      flex: 1,
      alignItems: "center",
      padding: 16,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderRadius: 16,
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    detailLabel: {
      color: "#94A3B8",
      fontSize: 13,
      marginTop: 10,
      marginBottom: 4,
      fontWeight: "500",
    },
    detailValue: {
      color: "white",
      fontSize: 15,
      fontWeight: "600",
    },
    expirySection: {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderRadius: 16,
      padding: 20,
      marginTop: 8,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    expirySectionTitle: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 14,
      letterSpacing: -0.5,
    },
    expiryInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    expiryInfoText: {
      color: "#94A3B8",
      fontSize: 15,
      marginLeft: 12,
      fontWeight: "500",
    },
    actionRow: {
      flexDirection: "row",
      marginTop: 24,
      marginHorizontal: 4,
      justifyContent: "space-between",
    },
    actionButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      marginHorizontal: 6,
    },
    primaryAction: {
      backgroundColor: "rgba(250, 204, 21, 0.1)",
      borderColor: "rgba(250, 204, 21, 0.3)",
    },
    destructiveAction: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderColor: "rgba(239, 68, 68, 0.3)",
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#94A3B8",
      marginTop: 8,
    },
    primaryActionText: {
      color: "#FACC15",
    },
    destructiveActionText: {
      color: "#EF4444",
    },
  })

  /**
   * UI Rendering Components
   */
  
  // Tab bar for filtering items by status
  const renderTabBar = () => {
    const { active, expiringSoon, expired } = getItemsByStatus()
  
    const tabs = [
      { id: STATUS.ACTIVE, name: "Active", count: active.length, color: "#22C55E", icon: "checkmark-circle-outline" },
      { id: STATUS.EXPIRING, name: "Expiring", count: expiringSoon.length, color: "#F59E0B", icon: "time-outline" },
      { id: STATUS.EXPIRED, name: "Expired", count: expired.length, color: "#EF4444", icon: "alert-circle-outline" },
    ]
  
    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id ? { backgroundColor: 'rgba(250, 204, 21, 0.05)' } : {}]}
            onPress={() => handleTabChange(tab.id)}
            activeOpacity={0.7}
          >
            {/* Add gradient background for active tab */}
            {activeTab === tab.id && (
              <LinearGradient
                colors={[tab.color + "30", tab.color + "15"]}
                style={styles.activeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            )}
            
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.name}
            </Text>
            <LinearGradient 
              colors={[tab.color, `${tab.color}CC`]} 
              style={styles.countBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.countText}>{tab.count}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  // Category filter horizontal scrollview
  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoryFilterScroll}
      >
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === "all" && styles.activeCategoryChip]}
          onPress={() => handleCategorySelect("all")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="apps-outline"
            size={16}
            color={selectedCategory === "all" ? "#FACC15" : "#94A3B8"}
          />
          <Text style={[styles.categoryChipText, selectedCategory === "all" && styles.activeCategoryChipText]}>
            All Categories
          </Text>
        </TouchableOpacity>
        
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, selectedCategory === category.id && styles.activeCategoryChip]}
            onPress={() => handleCategorySelect(category.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? "#FACC15" : category.color}
            />
            <Text style={[styles.categoryChipText, selectedCategory === category.id && styles.activeCategoryChipText]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  // Render individual pantry items
  const renderPantryItem = ({ item }: { item: PantryItem }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate)
    const expiryColor = getExpiryColor(item.expiryDate)
    const expiryText = getExpiryText(item.expiryDate)
    const category = CATEGORIES.find((cat) => cat.id === item.category)

    return (
      <TouchableOpacity 
        style={styles.pantryItem} 
        onPress={() => {
          setShowItemDetails(item)
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemBackground} />

        <View style={styles.itemImageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={styles.itemImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient 
              colors={[category?.color || "#6B7280", `${category?.color || "#6B7280"}80`]} 
              style={styles.itemImagePlaceholder}
            >
              <Ionicons name={category?.icon as any} size={24} color="white" />
            </LinearGradient>
          )}

          <View 
            style={[styles.expiryBadge, {backgroundColor: expiryColor}]}
          >
            <Text style={styles.expiryText}>
              {daysUntilExpiry < 0 ? "EXP" : daysUntilExpiry === 0 ? "TODAY" : `${daysUntilExpiry}d`}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.itemMeta}>
            <View style={styles.quantityContainer}>
              <Ionicons name="cube-outline" size={14} color="#FACC15" />
              <Text style={styles.quantityText}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name={category?.icon as any} size={14} color={category?.color} />
              <Text style={styles.locationText}>{category?.name}</Text>
            </View>
          </View>
          
          <View style={styles.expiryDateContainer}>
            <Ionicons name="time-outline" size={12} color={expiryColor} />
            <Text style={[styles.expiryDateText, { color: expiryColor }]}>
              {expiryText}
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.itemActionButton, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}
            onPress={() => handleRemoveItem(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  // Add item modal with form
  const renderAddItemModal = () => (
    <Modal
      visible={showAddModal} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#000000", "#121212"]} style={StyleSheet.absoluteFill} />

        <View style={styles.modalHeader}>
          <TouchableOpacity 
            onPress={() => setShowAddModal(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-outline" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Item</Text>
          <TouchableOpacity 
            onPress={handleAddItem}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => isUnitDropdownOpen && setIsUnitDropdownOpen(false)} 
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 20 }}
            onScrollBeginDrag={() => isUnitDropdownOpen && setIsUnitDropdownOpen(false)}
          >
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Autodetect Ingredient</Text>
            <TouchableOpacity
              style={[styles.inputContainer, { paddingRight: 50 }]}
              onPress={handleImagePicker}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#FACC15" />
              <Text style={[styles.placeholderText, { marginLeft: 12, marginVertical: 0 }]}>
                {newItem.image ? "Image selected" : "Tap to take or select a photo"}
              </Text>
              {newItem.image && (
                <View style={styles.previewContainer}>
                  <Image 
                    source={{ uri: newItem.image }} 
                    style={styles.previewImage}
                    contentFit="cover"
                    transition={300}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Item Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="nutrition-outline" size={18} color="#FACC15" />
              <TextInput
                style={styles.textInput}
                value={newItem.name}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, name: text }))}
                placeholder="Enter item name"
                placeholderTextColor="#64748B"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categorySelection}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption, 
                    newItem.category === category.id && styles.selectedCategoryOption
                  ]}
                  onPress={() => {
                    setNewItem((prev) => ({ ...prev, category: category.id }))
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={18}
                    color={newItem.category === category.id ? "#FACC15" : category.color}
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newItem.category === category.id && styles.selectedCategoryOptionText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1, marginHorizontal: 6 }]}>
              <Text style={styles.fieldLabel}>Quantity & Unit *</Text>
              <View style={[styles.inputContainer, { paddingRight: 95 }]}>
                <Ionicons name="cube-outline" size={18} color="#FACC15" />
                <TextInput
                  style={styles.textInput}
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem((prev) => ({ ...prev, quantity: text }))}
                  placeholder="0"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                <TouchableOpacity 
                  style={styles.unitButton}
                  onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                >
                  <Text style={styles.unitButtonText}>
                    {newItem.unit} <MaterialIcons name="arrow-drop-down" size={16} color="#FACC15" />
                  </Text>
                </TouchableOpacity>
                
                {isUnitDropdownOpen && (
                  <View style={styles.unitDropdown}>
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      style={styles.unitDropdownScroll}
                      contentContainerStyle={styles.unitDropdownScrollContent}
                      nestedScrollEnabled={true}
                    >
                      {UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitDropdownItem,
                            newItem.unit === unit && styles.unitDropdownItemSelected
                          ]}
                          onPress={() => {
                            setNewItem(prev => ({ ...prev, unit }));
                            setIsUnitDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.unitDropdownItemText,
                            newItem.unit === unit && styles.unitDropdownItemTextSelected
                          ]}>
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



          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Expiry Date</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color="#FACC15" />
              <Text style={styles.dateText}>{newItem.expiryDate.toLocaleDateString()}</Text>
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </ScrollView>
        </TouchableOpacity>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={newItem.expiryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
            themeVariant="dark"
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  )

  // Item details modal
  const renderItemDetailsModal = () => {
    if (!showItemDetails) return null

    const daysUntilExpiry = getDaysUntilExpiry(showItemDetails.expiryDate)
    const expiryColor = getExpiryColor(showItemDetails.expiryDate)
    const expiryText = getExpiryText(showItemDetails.expiryDate)
    const category = CATEGORIES.find((cat) => cat.id === showItemDetails.category)
    const daysAdded = Math.floor((new Date().getTime() - showItemDetails.addedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const addedText = daysAdded === 0 
      ? "Added today" 
      : daysAdded === 1 
        ? "Added yesterday" 
        : `Added ${daysAdded} days ago`

    return (
      <Modal 
        visible={!!showItemDetails} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowItemDetails(null)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <LinearGradient 
            colors={["#000000", "#121212"]} 
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowItemDetails(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity 
              onPress={() => handleRemoveItem(showItemDetails.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailsScrollContent}
          >
            <View style={styles.detailImageContainer}>
              {showItemDetails.image ? (
                <Image 
                  source={{ uri: showItemDetails.image }} 
                  style={styles.detailImage}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <LinearGradient
                  colors={[category?.color || "#6B7280", `${category?.color || "#6B7280"}80`]}
                  style={styles.detailImagePlaceholder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={category?.icon as any} size={50} color="white" />
                </LinearGradient>
              )}
              
              <LinearGradient 
                colors={[expiryColor, `${expiryColor}CC`]} 
                style={styles.detailExpiryBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.detailExpiryText}>
                  {daysUntilExpiry < 0
                    ? "Expired"
                    : daysUntilExpiry === 0
                      ? "Expires Today"
                      : `${daysUntilExpiry} days left`}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.detailInfo}>
              <Text style={styles.detailName}>{showItemDetails.name}</Text>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="cube-outline" size={22} color="#FACC15" />
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>
                    {showItemDetails.quantity} {showItemDetails.unit}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name={category?.icon as any} size={22} color={category?.color} />
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{category?.name}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={22} color="#64748B" />
                  <Text style={styles.detailLabel}>Added On</Text>
                  <Text style={styles.detailValue}>
                    {showItemDetails.addedDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.expirySection}>
                <Text style={styles.expirySectionTitle}>Expiry Information</Text>
                <View style={styles.expiryInfo}>
                  <Ionicons name="time-outline" size={22} color={expiryColor} />
                  <Text style={[styles.expiryInfoText, { color: expiryColor }]}>
                    {expiryText}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => {
                    setShowItemDetails(null)
                    // You could add edit functionality here in the future
                  }}
                >
                  <Ionicons name="refresh-outline" size={22} color="#FACC15" />
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                    Update Item
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.destructiveAction]}
                  onPress={() => handleRemoveItem(showItemDetails.id)}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.destructiveActionText]}>
                    Remove Item
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    )
  }

  /**
   * Main Component Render
   */
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Simplified gradient with fewer color stops for better performance */}
      <LinearGradient 
        colors={["#0F0F0F", "#000000"]} 
        style={StyleSheet.absoluteFill} 
      />
      <LinearGradient
        colors={["#171717", "transparent"]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.8 }}
      />

      {/* Header section */}
      <Animated.View style={[styles.header, { height: headerHeightAnim }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pantry Manager</Text>
          <Text style={styles.headerSubtitle}>
            Keep track of your ingredients and expiry dates
          </Text>
        </View>
      </Animated.View>
      
      {/* Add button and search bar */}
      <View style={styles.actionsRow}>
        <View style={styles.searchContainer}>
          {/* Replace BlurView with a simple background color for better performance */}
          <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(30, 30, 30, 0.6)'}]} />
          <View style={styles.searchBlur}>
            <Ionicons name="search-outline" size={22} color="#FACC15" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search pantry items..."
              placeholderTextColor="#64748B"
              autoCorrect={false}
              returnKeyType="search"
              maxLength={50}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery("")
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={22} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: addButtonAnim }] }}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              setShowAddModal(true)
            }}
            activeOpacity={0.85}
          >
            <LinearGradient 
              colors={["#FACC15", "#F97316"]} 
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Tab bar for filtering */}
      {renderTabBar()}
      
      {/* Category filters */}
      {renderCategoryFilter()}

      {/* Items list */}
      <Animated.View 
        style={[
          styles.itemsList, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <FlatList
          data={filteredItems()}
          renderItem={renderPantryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Animated.View 
                style={[
                  styles.emptyStateIcon,
                  {
                    transform: [
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", "360deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient 
                  colors={["#FACC15", "#F97316"]} 
                  style={{ borderRadius: 35, padding: 16 }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons 
                    name={
                      activeTab === STATUS.ACTIVE 
                        ? "nutrition-outline" 
                        : activeTab === STATUS.EXPIRING
                          ? "time-outline"
                          : "alert-circle-outline"
                    } 
                    size={56} 
                    color="white" 
                  />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.emptyStateTitle}>
                {activeTab === STATUS.ACTIVE && "No items in your pantry"}
                {activeTab === STATUS.EXPIRING && "No items expiring soon"}
                {activeTab === STATUS.EXPIRED && "No expired items"}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {activeTab === STATUS.ACTIVE && "Tap the + button to add some ingredients to your pantry"}
                {activeTab === STATUS.EXPIRING && "All your items have plenty of time left - you're all good!"}
                {activeTab === STATUS.EXPIRED && "Great job keeping track of your items!"}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Modals */}
      {renderAddItemModal()}
      {renderItemDetailsModal()}
    </View>
  )
}

export default PantryManagementScreen
