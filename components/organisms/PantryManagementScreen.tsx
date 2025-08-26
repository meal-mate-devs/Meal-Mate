"use client"

import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import React, { useEffect, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface PantryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: Date
  addedDate: Date
  location: string
  image?: string
  barcode?: string
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

const CATEGORIES = [
  { id: "vegetables", name: "Vegetables", icon: "leaf", color: "#10B981" },
  { id: "fruits", name: "Fruits", icon: "nutrition", color: "#F59E0B" },
  { id: "dairy", name: "Dairy", icon: "water", color: "#3B82F6" },
  { id: "meat", name: "Meat & Fish", icon: "fish", color: "#EF4444" },
  { id: "grains", name: "Grains", icon: "restaurant", color: "#8B5CF6" },
  { id: "beverages", name: "Beverages", icon: "wine", color: "#06B6D4" },
  { id: "condiments", name: "Condiments", icon: "flask", color: "#F97316" },
  { id: "frozen", name: "Frozen", icon: "snow", color: "#6366F1" },
]

const STORAGE_LOCATIONS = [
  { id: "fridge", name: "Fridge", icon: "cube", color: "#3B82F6" },
  { id: "freezer", name: "Freezer", icon: "snow", color: "#6366F1" },
  { id: "pantry", name: "Pantry", icon: "home", color: "#8B5CF6" },
  { id: "counter", name: "Counter", icon: "desktop", color: "#F59E0B" },
]

const UNITS = ["pcs", "kg", "g", "L", "ml", "cups", "tbsp", "tsp", "oz", "lbs"]

const PantryManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState("active")
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([
    {
      id: "1",
      name: "Fresh Tomatoes",
      category: "vegetables",
      quantity: 6,
      unit: "pcs",
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      addedDate: new Date(),
      location: "fridge",
      image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400",
    },
    {
      id: "2",
      name: "Organic Milk",
      category: "dairy",
      quantity: 1,
      unit: "L",
      expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      addedDate: new Date(),
      location: "fridge",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
    },
    {
      id: "3",
      name: "Expired Bread",
      category: "grains",
      quantity: 1,
      unit: "pcs",
      expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      addedDate: new Date(),
      location: "counter",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showItemDetails, setShowItemDetails] = useState<PantryItem | null>(null)

  // Enhanced animations
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  // Add item form state
  const [newItem, setNewItem] = useState({
    name: "",
    category: "vegetables",
    quantity: "",
    unit: "pcs",
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    location: "fridge",
    image: "",
  })

  // Enhanced animations
  useEffect(() => {
    // Continuous pulse animation for add button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const getItemsByStatus = () => {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const active = pantryItems.filter((item) => item.expiryDate > threeDaysFromNow)
    const expiringSoon = pantryItems.filter((item) => item.expiryDate <= threeDaysFromNow && item.expiryDate > now)
    const expired = pantryItems.filter((item) => item.expiryDate <= now)

    return { active, expiringSoon, expired }
  }

  const filteredItems = () => {
    const { active, expiringSoon, expired } = getItemsByStatus()
    let items = []

    switch (activeTab) {
      case "active":
        items = active
        break
      case "expiring":
        items = expiringSoon
        break
      case "expired":
        items = expired
        break
      default:
        items = active
    }

    if (searchQuery) {
      items = items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory)
    }

    return items
  }

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryColor = (expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate)
    if (days < 0) return "#EF4444"
    if (days <= 3) return "#F59E0B"
    return "#10B981"
  }

  const handleTabChange = (tab: string) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    setActiveTab(tab)
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.quantity) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const item: PantryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      quantity: Number.parseInt(newItem.quantity),
      unit: newItem.unit,
      expiryDate: newItem.expiryDate,
      addedDate: new Date(),
      location: newItem.location,
      image: newItem.image,
    }

    setPantryItems((prev) => [...prev, item])
    setShowAddModal(false)
    setNewItem({
      name: "",
      category: "vegetables",
      quantity: "",
      unit: "pcs",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "fridge",
      image: "",
    })

    // Success animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
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
  }

  const handleRemoveItem = (itemId: string) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setPantryItems((prev) => prev.filter((item) => item.id !== itemId))
        },
      },
    ])
  }

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions to add item photos.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setNewItem((prev) => ({ ...prev, image: result.assets[0].uri }))
      }
    } catch (error) {
      console.error("Error picking image:", error)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
      marginBottom: 8,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: "800",
      color: "white",
      marginBottom: 6,
      letterSpacing: -1,
    },
    headerSubtitle: {
      fontSize: 16,
      color: "#9CA3AF",
      fontWeight: "500",
    },
    addButton: {
      borderRadius: 20,
      overflow: "hidden",
      elevation: 12,
      shadowColor: "#FACC15",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
    },
    addButtonGradient: {
      width: 64,
      height: 64,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },
    searchContainer: {
      marginHorizontal: 24,
      marginBottom: 20,
      borderRadius: 16, // Reduced from 20
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    searchBlur: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12, // Reduced from 16
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.2)",
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      color: "white",
      fontSize: 15, // Reduced from 16
      fontWeight: "500",
    },
    tabBar: {
      flexDirection: "row",
      marginHorizontal: 24,
      marginBottom: 16, // Reduced from 20
      backgroundColor: "rgba(255, 255, 255, 0.05)", // Reduced opacity
      borderRadius: 16, // Smaller radius
      padding: 4, // Reduced padding
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.1)", // Reduced border opacity
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 5,
      paddingHorizontal: 6,
      borderRadius: 12,
      position: "relative",
    },
    tabText: {
      color: "#9CA3AF",
      fontSize: 14,
      fontWeight: "700",
      marginRight: 6,
      textAlign: "center",
    },
    activeTabText: {
      color: "#FACC15",
    },
    activeTabGradient: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 12,
      opacity: 0.2,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      color: "white",
      fontSize: 11,
      fontWeight: "800",
    },
    categoryFilter: {
      marginBottom: -10, // Use negative margin to pull items up more
      paddingLeft: 24,
      paddingVertical: 0,
      height: 30, // Set fixed height for the container
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10, // Reduced from 12
      paddingVertical: 4, // Reduced from 6
      marginRight: 8, // Reduced from 10
      borderRadius: 14, // Reduced from 16
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      height: 26, // Reduced from 32
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    activeCategoryChip: {
      backgroundColor: "rgba(250, 204, 21, 0.2)",
      borderColor: "#FACC15",
      elevation: 8,
      shadowColor: "#FACC15",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    categoryChipText: {
      color: "#9CA3AF",
      fontSize: 12, // Reduced from 13
      fontWeight: "700",
      marginLeft: 4, // Reduced from 6
      lineHeight: 14, // Reduced from 16
    },
    activeCategoryChipText: {
      color: "#FACC15",
    },
    itemsList: {
      flex: 1,
      marginTop: -20, // Increase negative margin even more
    },
    listContent: {
      paddingHorizontal: 24,
      paddingTop: 4, // Reduce top padding
      paddingBottom: 32,
    },
    pantryItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      borderRadius: 20,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    itemBlur: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    itemImageContainer: {
      position: "relative",
      margin: 16,
    },
    itemImage: {
      width: 70,
      height: 70,
      borderRadius: 16,
    },
    itemImagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    expiryBadge: {
      position: "absolute",
      top: -8,
      right: -8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 28,
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    expiryText: {
      color: "white",
      fontSize: 10,
      fontWeight: "800",
    },
    itemDetails: {
      flex: 1,
      paddingVertical: 16,
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
      marginBottom: 6,
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 20,
    },
    quantityText: {
      color: "#9CA3AF",
      fontSize: 14,
      marginLeft: 6,
      fontWeight: "600",
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    locationText: {
      color: "#9CA3AF",
      fontSize: 14,
      marginLeft: 6,
      fontWeight: "600",
    },
    expiryDateText: {
      color: "#6B7280",
      fontSize: 12,
      fontWeight: "500",
    },
    itemActions: {
      paddingHorizontal: 16,
    },
    actionButton: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyStateIcon: {
      marginBottom: 20,
    },
    emptyStateTitle: {
      color: "white",
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    emptyStateSubtitle: {
      color: "#6B7280",
      fontSize: 16,
      textAlign: "center",
      fontWeight: "500",
      lineHeight: 24,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "#000000",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    modalTitle: {
      color: "white",
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    saveButton: {
      color: "#FACC15",
      fontSize: 18,
      fontWeight: "700",
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 24,
    },
    photoUpload: {
      alignItems: "center",
      marginVertical: 24,
    },
    uploadedImage: {
      width: 140,
      height: 140,
      borderRadius: 24,
    },
    photoPlaceholder: {
      width: 140,
      height: 140,
      borderRadius: 24,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(250, 204, 21, 0.3)",
      borderStyle: "dashed",
    },
    photoPlaceholderText: {
      color: "#9CA3AF",
      fontSize: 14,
      marginTop: 12,
      fontWeight: "600",
    },
    formField: {
      marginBottom: 24,
    },
    formRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    fieldLabel: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.2)",
    },
    textInput: {
      flex: 1,
      color: "white",
      fontSize: 16,
      marginLeft: 12,
      fontWeight: "600",
    },
    categorySelection: {
      flexDirection: "row",
      paddingVertical: 8,
    },
    categoryOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginRight: 16,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    selectedCategoryOption: {
      backgroundColor: "rgba(250, 204, 21, 0.2)",
      borderColor: "#FACC15",
    },
    categoryOptionText: {
      color: "#9CA3AF",
      fontSize: 14,
      fontWeight: "700",
      marginLeft: 10,
    },
    selectedCategoryOptionText: {
      color: "#FACC15",
    },
    unitSelection: {
      flexDirection: "row",
      paddingVertical: 8,
    },
    unitOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 10,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    selectedUnitOption: {
      backgroundColor: "rgba(250, 204, 21, 0.2)",
      borderColor: "#FACC15",
    },
    unitText: {
      color: "#9CA3AF",
      fontSize: 14,
      fontWeight: "700",
    },
    selectedUnitText: {
      color: "#FACC15",
    },
    locationSelection: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    locationOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginRight: 16,
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      flex: 1,
      minWidth: "42%",
    },
    selectedLocationOption: {
      backgroundColor: "rgba(250, 204, 21, 0.2)",
      borderColor: "#FACC15",
    },
    locationOptionText: {
      color: "#9CA3AF",
      fontSize: 14,
      fontWeight: "700",
      marginLeft: 10,
    },
    selectedLocationOptionText: {
      color: "#FACC15",
    },
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: "rgba(250, 204, 21, 0.2)",
    },
    dateText: {
      color: "white",
      fontSize: 16,
      flex: 1,
      marginLeft: 12,
      fontWeight: "600",
    },
    detailImageContainer: {
      alignItems: "center",
      marginVertical: 24,
      position: "relative",
    },
    detailImage: {
      width: 180,
      height: 180,
      borderRadius: 28,
    },
    detailImagePlaceholder: {
      width: 180,
      height: 180,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    detailExpiryBadge: {
      position: "absolute",
      top: -12,
      right: -12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: "center",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    detailExpiryText: {
      color: "white",
      fontSize: 12,
      fontWeight: "800",
    },
    detailInfo: {
      paddingBottom: 24,
    },
    detailName: {
      color: "white",
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 32,
      letterSpacing: -1,
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: 24,
    },
    detailItem: {
      flex: 1,
      alignItems: "center",
      padding: 20,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 20,
      marginHorizontal: 8,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    detailLabel: {
      color: "#9CA3AF",
      fontSize: 14,
      marginTop: 12,
      marginBottom: 6,
      fontWeight: "600",
    },
    detailValue: {
      color: "white",
      fontSize: 16,
      fontWeight: "700",
    },
    expirySection: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    expirySectionTitle: {
      color: "white",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    expiryInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    expiryInfoText: {
      color: "#9CA3AF",
      fontSize: 16,
      marginLeft: 12,
      fontWeight: "600",
    },
  })

  const renderTabBar = () => {
    const { active, expiringSoon, expired } = getItemsByStatus()
  
    const tabs = [
      { id: "active", name: "Active", count: active.length, color: "#10B981" },
      { id: "expiring", name: "Expiring", count: expiringSoon.length, color: "#F59E0B" },
      { id: "expired", name: "Expired", count: expired.length, color: "#EF4444" },
    ]
  
    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id ? { backgroundColor: 'rgba(250, 204, 21, 0.05)' } : {}]}
            onPress={() => handleTabChange(tab.id)}
            activeOpacity={0.8}
          >
            {/* Add gradient background for active tab */}
            {activeTab === tab.id && (
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                style={styles.activeTabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.name}
            </Text>
            <LinearGradient colors={[tab.color, `${tab.color}CC`]} style={styles.countBadge}>
              <Text style={styles.countText}>{tab.count}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderCategoryFilter = () => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    style={styles.categoryFilter}
    contentContainerStyle={{ paddingRight: 24 }}
  >
    <TouchableOpacity
      style={[styles.categoryChip, selectedCategory === "all" && styles.activeCategoryChip]}
      onPress={() => setSelectedCategory("all")}
    >
      <Text style={[styles.categoryChipText, selectedCategory === "all" && styles.activeCategoryChipText]}>
        All
      </Text>
    </TouchableOpacity>
    {CATEGORIES.map((category) => (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryChip, selectedCategory === category.id && styles.activeCategoryChip]}
        onPress={() => setSelectedCategory(category.id)}
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
  )

  const renderPantryItem = ({ item }: { item: PantryItem }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate)
    const expiryColor = getExpiryColor(item.expiryDate)
    const category = CATEGORIES.find((cat) => cat.id === item.category)
    const location = STORAGE_LOCATIONS.find((loc) => loc.id === item.location)

    return (
      <TouchableOpacity 
        style={styles.pantryItem} 
        onPress={() => setShowItemDetails(item)} 
        activeOpacity={0.8}
      >
        <BlurView intensity={30} style={StyleSheet.absoluteFill}>
          <View style={styles.itemBlur} />
        </BlurView>

        <View style={styles.itemImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <LinearGradient 
              colors={[category?.color || "#6B7280", `${category?.color || "#6B7280"}80`]} 
              style={styles.itemImagePlaceholder}
            >
              <Ionicons name={category?.icon as any} size={28} color="white" />
            </LinearGradient>
          )}

          <LinearGradient colors={[expiryColor, `${expiryColor}CC`]} style={styles.expiryBadge}>
            <Text style={styles.expiryText}>
              {daysUntilExpiry < 0 ? "Expired" : daysUntilExpiry === 0 ? "Today" : `${daysUntilExpiry}d`}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemMeta}>
            <View style={styles.quantityContainer}>
              <Ionicons name="cube-outline" size={16} color="#FACC15" />
              <Text style={styles.quantityText}>
                {item.quantity} {item.unit}
              </Text>
            </View>
            <View style={styles.locationContainer}>
              <Ionicons name={location?.icon as any} size={16} color={location?.color} />
              <Text style={styles.locationText}>{location?.name}</Text>
            </View>
          </View>
          <Text style={styles.expiryDateText}>Expires: {item.expiryDate.toLocaleDateString()}</Text>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveItem(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  const renderAddItemModal = () => (
    <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <LinearGradient colors={["#000000", "#0F0F0F", "#1A1A1A"]} style={StyleSheet.absoluteFill} />

        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Item</Text>
          <TouchableOpacity onPress={handleAddItem}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.photoUpload} onPress={handleImagePicker}>
            {newItem.image ? (
              <Image source={{ uri: newItem.image }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#FACC15" />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Item Name *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="nutrition-outline" size={20} color="#FACC15" />
              <TextInput
                style={styles.textInput}
                value={newItem.name}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, name: text }))}
                placeholder="Enter item name"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categorySelection}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryOption, newItem.category === category.id && styles.selectedCategoryOption]}
                    onPress={() => setNewItem((prev) => ({ ...prev, category: category.id }))}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={22}
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
            </ScrollView>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>Quantity *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cube-outline" size={20} color="#FACC15" />
                <TextInput
                  style={styles.textInput}
                  value={newItem.quantity}
                  onChangeText={(text) => setNewItem((prev) => ({ ...prev, quantity: text }))}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.formField, { flex: 1, marginLeft: 16 }]}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.unitSelection}>
                  {UNITS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[styles.unitOption, newItem.unit === unit && styles.selectedUnitOption]}
                      onPress={() => setNewItem((prev) => ({ ...prev, unit }))}
                    >
                      <Text style={[styles.unitText, newItem.unit === unit && styles.selectedUnitText]}>{unit}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Storage Location</Text>
            <View style={styles.locationSelection}>
              {STORAGE_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={[styles.locationOption, newItem.location === location.id && styles.selectedLocationOption]}
                  onPress={() => setNewItem((prev) => ({ ...prev, location: location.id }))}
                >
                  <Ionicons
                    name={location.icon as any}
                    size={22}
                    color={newItem.location === location.id ? "#FACC15" : location.color}
                  />
                  <Text
                    style={[
                      styles.locationOptionText,
                      newItem.location === location.id && styles.selectedLocationOptionText,
                    ]}
                  >
                    {location.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Expiry Date</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Ionicons name="calendar-outline" size={20} color="#FACC15" />
              <Text style={styles.dateText}>{newItem.expiryDate.toLocaleDateString()}</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )

  const renderItemDetailsModal = () => {
    if (!showItemDetails) return null

    const daysUntilExpiry = getDaysUntilExpiry(showItemDetails.expiryDate)
    const expiryColor = getExpiryColor(showItemDetails.expiryDate)
    const category = CATEGORIES.find((cat) => cat.id === showItemDetails.category)
    const location = STORAGE_LOCATIONS.find((loc) => loc.id === showItemDetails.location)

    return (
      <Modal visible={!!showItemDetails} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={["#000000", "#0F0F0F", "#1A1A1A"]} style={StyleSheet.absoluteFill} />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowItemDetails(null)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity onPress={() => handleRemoveItem(showItemDetails.id)}>
              <Ionicons name="trash-outline" size={28} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.detailImageContainer}>
              {showItemDetails.image ? (
                <Image source={{ uri: showItemDetails.image }} style={styles.detailImage} />
              ) : (
                <LinearGradient
                  colors={[category?.color || "#6B7280", `${category?.color || "#6B7280"}80`]}
                  style={styles.detailImagePlaceholder}
                >
                  <Ionicons name={category?.icon as any} size={60} color="white" />
                </LinearGradient>
              )}
              <LinearGradient colors={[expiryColor, `${expiryColor}CC`]} style={styles.detailExpiryBadge}>
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
                  <Ionicons name="cube-outline" size={24} color="#FACC15" />
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>
                    {showItemDetails.quantity} {showItemDetails.unit}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name={category?.icon as any} size={24} color={category?.color} />
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{category?.name}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name={location?.icon as any} size={24} color={location?.color} />
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{location?.name}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={24} color="#6B7280" />
                  <Text style={styles.detailLabel}>Added</Text>
                  <Text style={styles.detailValue}>{showItemDetails.addedDate.toLocaleDateString()}</Text>
                </View>
              </View>

              <View style={styles.expirySection}>
                <Text style={styles.expirySectionTitle}>Expiry Information</Text>
                <View style={styles.expiryInfo}>
                  <Ionicons name="time-outline" size={24} color={expiryColor} />
                  <Text style={styles.expiryInfoText}>
                    Expires on {showItemDetails.expiryDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#000000", "#0F0F0F", "#1A1A1A"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pantry Manager</Text>
          <Text style={styles.headerSubtitle}>Keep track of your ingredients</Text>
        </View>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <LinearGradient colors={["#FACC15", "#F97316"]} style={styles.addButtonGradient}>
              <Ionicons name="add" size={28} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.searchContainer}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <View style={styles.searchBlur}>
          <Ionicons name="search" size={22} color="#FACC15" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search pantry items..."
            placeholderTextColor="#6B7280"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={22} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderTabBar()}
      {renderCategoryFilter()}

      <Animated.View style={[styles.itemsList, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
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
                <LinearGradient colors={["#FACC15", "#F97316"]} style={{ borderRadius: 40, padding: 16 }}>
                  <Ionicons name="cube-outline" size={64} color="white" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.emptyStateTitle}>No items found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {activeTab === "active" && "Add some items to your pantry to get started"}
                {activeTab === "expiring" && "No items expiring soon - you're all good!"}
                {activeTab === "expired" && "No expired items - keep up the good work!"}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {renderAddItemModal()}
      {renderItemDetailsModal()}
    </View>
  )
}

export default PantryManagementScreen
