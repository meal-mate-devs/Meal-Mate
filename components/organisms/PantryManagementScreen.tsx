"use client"

import LoadingIndicator from "@/components/atoms/LoadingIndicator"
import IngredientSelectionModal from "@/components/molecules/IngredientSelectionModal"
import { IngredientItem, useIngredientScanner } from "@/hooks/useIngredientScanner"
import { PantryItem as BackendPantryItem, pantryService } from "@/lib/services/pantryService"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import DateTimePicker from '@react-native-community/datetimepicker'
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
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

// Use the backend PantryItem type
type PantryItem = BackendPantryItem;

// Modern category definitions will be loaded from backend
const CATEGORIES = [
  { id: "all", name: "All", icon: "apps-outline", color: "#FACC15" },
  { id: "vegetables", name: "vegetables", icon: "leaf-outline", color: "#22C55E" },
  { id: "fruits", name: "fruits", icon: "nutrition-outline", color: "#F97316" },
  { id: "meat", name: "meat", icon: "fish-outline", color: "#EF4444" },
  { id: "dairy", name: "dairy", icon: "water-outline", color: "#3B82F6" },
  { id: "grains", name: "grains", icon: "restaurant-outline", color: "#8B5CF6" },
  { id: "other", name: "other", icon: "apps-outline", color: "#6366F1" },
]



// Common units for food measurement
const UNITS = ["pieces", "kilograms", "grams", "liters", "milliliters", "cups", "tablespoons", "teaspoons", "ounces", "pounds"]

// Status indicators for item expiry
const STATUS = {
  ALL: "all",
  ACTIVE: "active",
  EXPIRING: "expiring",
  EXPIRED: "expired"
}

// Custom Image Picker Dialog Component
interface ImagePickerDialogProps {
  visible: boolean
  onClose: () => void
  onCamera: () => void
  onLibrary: () => void
}

const ImagePickerDialog: React.FC<ImagePickerDialogProps> = ({ visible, onClose, onCamera, onLibrary }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.9)
    }
  }, [visible])

  const handleCamera = () => {
    onClose()
    setTimeout(onCamera, 300)
  }

  const handleLibrary = () => {
    onClose()
    setTimeout(onLibrary, 300)
  }

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={imagePickerStyles.backdrop}>
        <Animated.View
          style={[
            imagePickerStyles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={imagePickerStyles.dialogContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Camera Icon */}
            <View style={imagePickerStyles.iconContainer}>
              <LinearGradient
                colors={['#FACC15', '#F97316']}
                style={imagePickerStyles.iconBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={32} color="white" />
              </LinearGradient>
            </View>

            <Text style={imagePickerStyles.title}>
              Add Item Photo
            </Text>

            <Text style={imagePickerStyles.message}>
              Choose a photo source for your pantry item
            </Text>

            <View style={imagePickerStyles.buttonContainer}>
              <TouchableOpacity
                style={imagePickerStyles.optionButton}
                onPress={handleCamera}
                activeOpacity={0.8}
              >
                <View style={imagePickerStyles.buttonContent}>
                  <View style={imagePickerStyles.iconCircle}>
                    <LinearGradient
                      colors={['rgba(250, 204, 21, 0.2)', 'rgba(249, 115, 22, 0.2)']}
                      style={imagePickerStyles.iconGradient}
                    />
                    <Ionicons name="camera" size={24} color="#FACC15" />
                  </View>
                  <View style={imagePickerStyles.textContainer}>
                    <Text style={imagePickerStyles.optionTitle}>Camera</Text>
                    <Text style={imagePickerStyles.optionSubtitle}>Capture a new photo</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={imagePickerStyles.optionButton}
                onPress={handleLibrary}
                activeOpacity={0.8}
              >
                <View style={imagePickerStyles.buttonContent}>
                  <View style={imagePickerStyles.iconCircle}>
                    <LinearGradient
                      colors={['rgba(250, 204, 21, 0.2)', 'rgba(249, 115, 22, 0.2)']}
                      style={imagePickerStyles.iconGradient}
                    />
                    <Ionicons name="images" size={24} color="#FACC15" />
                  </View>
                  <View style={imagePickerStyles.textContainer}>
                    <Text style={imagePickerStyles.optionTitle}>Gallery</Text>
                    <Text style={imagePickerStyles.optionSubtitle}>Choose from library</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={imagePickerStyles.cancelButton}
              onPress={onClose}
            >
              <Text style={imagePickerStyles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  )
}

const imagePickerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedContainer: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 340,
  },
  dialogContainer: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 90,
    height: 90,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
    overflow: 'hidden',
  },
  iconBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  optionButton: {
    height: 70,
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cancelButton: {
    height: 50,
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
})

/**
 * PantryManagementScreen Component
 * A sleek, modern, minimalist interface for managing pantry items
 */
const PantryManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(STATUS.ACTIVE)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([
    {
      id: "1",
      name: "Fresh Tomatoes",
      category: { _id: "vegetables", name: "vegetables", icon: "leaf-outline", color: "#22C55E" },
      quantity: 6,
      unit: "pieces",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      addedDate: new Date().toISOString(),
      detectionMethod: 'manual',
      daysUntilExpiry: 7,
      expiryStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])

  // State variables
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showItemDetails, setShowItemDetails] = useState<PantryItem | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [showImagePickerDialog, setShowImagePickerDialog] = useState(false)

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  // Animation references
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const addButtonAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const searchBarAnim = useRef(new Animated.Value(0)).current
  const headerHeightAnim = useRef(new Animated.Value(100)).current

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
  const [showIngredientDetectionModal, setShowIngredientDetectionModal] = useState(false)
  const [detectedIngredients, setDetectedIngredients] = useState<IngredientItem[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  
  // Edit-related state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "vegetables",
    quantity: "",
    unit: "pieces",
    expiryDate: new Date()
  })
  const [showEditDatePicker, setShowEditDatePicker] = useState(false)
  
  // Ingredient scanner hook
  const {
    detectedIngredientsWithConfidence: hookDetectedIngredients,
    setDetectedIngredientsWithConfidence,
    isScanning,
    scanProgress,
    processImage,
    resetIngredients,
  } = useIngredientScanner({
    includeConfidence: true,
    allowMultiple: false,
    onIngredientsDetected: (ingredients, ingredientsWithConfidence) => {
      console.log("Ingredients detected callback:", ingredients);
      console.log("Ingredients with confidence:", ingredientsWithConfidence);
      
      // Hide loading indicator
      setIsDetecting(false);
      
      // Use the ingredientsWithConfidence directly from the callback
      if (ingredientsWithConfidence && ingredientsWithConfidence.length > 0) {
        console.log("Updating detected ingredients with confidence:", JSON.stringify(ingredientsWithConfidence));
        setDetectedIngredients(ingredientsWithConfidence);
      } else if (ingredients && ingredients.length > 0) {
        // Fallback: convert string ingredients to IngredientItem format
        const fallbackIngredients = ingredients.map(name => ({ name }));
        console.log("Using fallback ingredients:", fallbackIngredients);
        setDetectedIngredients(fallbackIngredients);
      } else {
        console.log("No ingredients detected, setting empty array");
        setDetectedIngredients([]);
      }
    },
  })

  // Load pantry items on component mount
  useEffect(() => {
    const loadPantryItems = async () => {
      try {
        setIsLoading(true);
        setLoadingError(null);
        
        const response = await pantryService.getPantryItems();
        
        if (response.success) {
          setPantryItems(response.items);
        } else {
          setLoadingError("Failed to load pantry items");
        }
      } catch (error) {
        console.error('Error loading pantry items:', error);
        setLoadingError("Failed to load pantry items");
      } finally {
        setIsLoading(false);
      }
    };

    loadPantryItems();
  }, []);

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

    const active = pantryItems.filter((item) => new Date(item.expiryDate) > threeDaysFromNow)
    const expiringSoon = pantryItems.filter((item) => new Date(item.expiryDate) <= threeDaysFromNow && new Date(item.expiryDate) > now)
    const expired = pantryItems.filter((item) => new Date(item.expiryDate) <= now)

    return { active, expiringSoon, expired }
  }, [pantryItems])

  // Get filtered items based on active tab, search, and category
  const filteredItems = useCallback(() => {
    const { active, expiringSoon, expired } = getItemsByStatus()
    let items = []

    switch (activeTab) {
      case STATUS.ALL:
        items = [...active, ...expiringSoon, ...expired]
        break
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
        items = [...active, ...expiringSoon, ...expired]
    }

    // Apply search filter if query exists
    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter if selected
    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category.name === selectedCategory)
    }

    return items
  }, [activeTab, getItemsByStatus, searchQuery, selectedCategory])

  // Calculate days until expiry
  const getDaysUntilExpiry = useCallback((expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [])

  // Get color based on expiry status
  const getExpiryColor = useCallback((expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate)
    if (days < 0) return "#EF4444" // Expired (red)
    if (days <= 3) return "#F59E0B" // Expiring soon (amber)
    return "#22C55E" // Active (green)
  }, [getDaysUntilExpiry])

  // Get expiry status text
  const getExpiryText = useCallback((expiryDate: string) => {
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
      Alert.alert(
        "Missing Information",
        "Please fill in at least the name and quantity fields."
      )
      return
    }

    try {
      // Prepare data for backend (no image upload)
      const addItemData = {
        name: newItem.name,
        categoryId: newItem.category,
        quantity: Number.parseInt(newItem.quantity),
        unit: newItem.unit,
        expiryDate: newItem.expiryDate.toISOString(),
        detectionMethod: 'manual' as const
      };

      // Call backend service
      const response = await pantryService.addPantryItem(addItemData);
      
      if (response.success) {
        // Add new item to state
        setPantryItems((prev) => [...prev, response.item]);
        
        // Reset and close modal
        setShowAddModal(false);
        setNewItem({
          name: "",
          category: "vegetables",
          quantity: "",
          unit: "pieces",
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          image: "",
        });

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
            friction: 8,
            tension: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Alert.alert("Error", "Failed to add item to pantry.");
      }
    } catch (error) {
      console.error('Error adding pantry item:', error);
      Alert.alert("Error", "Failed to add item to pantry. Please try again.");
    }
  }, [newItem, scaleAnim])

  // Handle item removal with confirmation
  const handleRemoveItem = useCallback(async (itemId: string) => {
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
          onPress: async () => {
            try {
              const response = await pantryService.deletePantryItem(itemId);
              
              if (response.success) {
                // Remove item from state and close detail modal if open
                setPantryItems((prev) => prev.filter((item) => item.id !== itemId))
                if (showItemDetails?.id === itemId) {
                  setShowItemDetails(null)
                }
              } else {
                Alert.alert("Error", "Failed to remove item from pantry.");
              }
            } catch (error) {
              console.error('Error removing pantry item:', error);
              Alert.alert("Error", "Failed to remove item from pantry. Please try again.");
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
      // Show custom dialog
      setShowImagePickerDialog(true)
    } catch (error) {
      console.log("Error handling image selection:", error)
    } finally {
      setIsImagePickerOpen(false)
    }
  }, [isImagePickerOpen])

  // Handle camera selection
  const handleCamera = useCallback(async () => {
    try {
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
        const imageUri = result.assets[0].uri
        console.log("Camera image captured:", imageUri)
        setNewItem((prev) => ({ ...prev, image: imageUri }))
        
        // Show loading state and open modal immediately
        setIsDetecting(true)
        setShowIngredientDetectionModal(true)
        
        // Process image with ingredient detection
        try {
          console.log("Starting ingredient detection...")
          await processImage(imageUri)
          // The onIngredientsDetected callback in the hook will handle updating ingredients
        } catch (error) {
          console.log("Error detecting ingredients:", error)
          // Keep the modal open but no ingredients will be shown
          setIsDetecting(false)
        }
      }
    } catch (error) {
      console.log("Error opening camera:", error)
    }
  }, [processImage])

  // Handle gallery selection
  const handleGallery = useCallback(async () => {
    try {
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
        const imageUri = result.assets[0].uri
        console.log("Gallery image selected:", imageUri)
        setNewItem((prev) => ({ ...prev, image: imageUri }))
        
        // Show loading state and open modal immediately
        setIsDetecting(true)
        setShowIngredientDetectionModal(true)
        
        // Process image with ingredient detection
        try {
          console.log("Starting ingredient detection for gallery image...");
          
          // Important: Make sure we start with a clean state before processing new image
          setDetectedIngredients([]);
          setDetectedIngredientsWithConfidence([]);
          
          await processImage(imageUri);
          // The onIngredientsDetected callback in the hook will handle updating ingredients
        } catch (error) {
          console.log("Error detecting ingredients from gallery image:", error);
          // Turn off loading state and keep modal open with error message
          setIsDetecting(false);
        }

        // Safety timeout to prevent infinite loading if callback never fires
        const safetyTimeout = setTimeout(() => {
          if (isDetecting) {
            console.log("Safety timeout triggered - stopping loading state");
            setIsDetecting(false);
          }
        }, 15000); // 15 second timeout
        
        return () => clearTimeout(safetyTimeout);
      }
    } catch (error) {
      console.log("Error opening gallery:", error)
    }
  }, [processImage])

  // Handle ingredient selection from detected ingredients
  const handleSelectIngredient = useCallback((ingredientName: string) => {
    console.log("Ingredient selected:", ingredientName);
    
    // Update the new item name with the selected ingredient
    setNewItem((prev) => {
      console.log("Setting item name to:", ingredientName);
      return { ...prev, name: ingredientName };
    });
    
    // First close the modal
    setShowIngredientDetectionModal(false);
    
    // Then clear the ingredients after a short delay to prevent UI flicker
    setTimeout(() => {
      setDetectedIngredients([]);
      // Also update the hook's state to keep everything in sync
      setDetectedIngredientsWithConfidence([]);
    }, 300);
  }, [setDetectedIngredientsWithConfidence])

  // Handle date change from picker
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNewItem((prev) => ({ ...prev, expiryDate: selectedDate }))
    }
  }, [])

  // Handle edit date change
  const handleEditDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowEditDatePicker(false)
    if (selectedDate) {
      setEditFormData((prev) => ({ ...prev, expiryDate: selectedDate }))
    }
  }, [])

  // Handle opening edit modal
  const handleEditItem = useCallback((item: PantryItem) => {
    setEditingItem(item)
    setEditFormData({
      name: item.name,
      category: item.category.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      expiryDate: new Date(item.expiryDate)
    })
    setShowItemDetails(null) // Close the item details modal
    setShowEditModal(true) // Open edit modal
  }, [])

  // Handle updating the item
  const handleUpdateItem = useCallback(async () => {
    if (!editingItem) return

    // Validate required fields
    if (!editFormData.name.trim() || !editFormData.quantity.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in at least the name and quantity fields."
      )
      return
    }

    try {
      // Prepare update data
      const updateData = {
        id: editingItem.id,
        name: editFormData.name.trim(),
        categoryId: editFormData.category,
        quantity: Number.parseInt(editFormData.quantity),
        unit: editFormData.unit,
        expiryDate: editFormData.expiryDate.toISOString()
      }

      // Call backend service
      const response = await pantryService.updatePantryItem(updateData)
      
      if (response.success) {
        // Update the local state
        setPantryItems(prevItems => 
          prevItems.map(item => 
            item.id === editingItem.id ? response.item : item
          )
        )
        
        // Close modal and reset form
        setShowEditModal(false)
        setEditingItem(null)
        setEditFormData({
          name: "",
          category: "vegetables",
          quantity: "",
          unit: "pieces",
          expiryDate: new Date()
        })

        Alert.alert("Success", "Item updated successfully!")
      }
    } catch (error) {
      console.error("Failed to update item:", error)
      Alert.alert("Error", "Failed to update item. Please try again.")
    }
  }, [editingItem, editFormData, pantryService])

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
      paddingVertical: 12,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonInner: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(250, 204, 21, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(250, 204, 21, 0.2)',
    },
    titleSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    headerAddButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#FACC15',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    headerAddButtonGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: "white",
      marginBottom: 2,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 13,
      color: "#9CA3AF",
      fontWeight: "400",
      textAlign: 'center',
      opacity: 0.9,
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
    searchRow: {
      marginTop: 0,
      marginBottom: 16,
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
      borderRadius: 16,
      overflow: "hidden",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
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
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      borderRadius: 12,
      padding: 2,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
      position: "relative",
      minWidth: 0, // Allow flex shrinking
    },
    tabText: {
      color: "#94A3B8",
      fontSize: 14,
      fontWeight: "800",
      textAlign: "center",
      flexShrink: 1,
      marginBottom: 4,
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
      paddingHorizontal: 2,
      paddingVertical: 3,
      borderRadius: 12,
      minWidth: 26,
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
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: -0.7,
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      marginVertical: 8,
    },
    detailHeader: {
      alignItems: "center",
      marginTop: 16,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    detailThumbnail: {
      marginBottom: 12,
    },
    detailThumbnailImage: {
      width: 80,
      height: 80,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    detailTitleContainer: {
      alignItems: "center",
      marginBottom: 16,
    },
    detailStatusBadge: {
      marginTop: 8,
    },
    detailStatusBadgeGradient: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
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
    
    // Loading and error states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    errorText: {
      color: '#F87171',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      fontFamily: 'System',
    },
    retryButton: {
      backgroundColor: '#FBBF24',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#000000',
      fontWeight: '600',
      fontSize: 16,
      fontFamily: 'System',
    },
  })

  /**
   * UI Rendering Components
   */

  // Tab bar for filtering items by status
  const renderTabBar = () => {
    const { active, expiringSoon, expired } = getItemsByStatus()

    const tabs = [
      { id: STATUS.ALL, name: "All", count: active.length + expiringSoon.length + expired.length, color: "#6B7280", icon: "apps-outline" },
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

        {CATEGORIES.filter(cat => cat.id !== "all").map((category) => (
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
    
    // Use the category data from backend directly (populated by MongoDB)
    // If category data is available from backend, use it; otherwise fall back to static CATEGORIES
    const category = item.category || CATEGORIES.find((cat) => cat.name === item.category?.name)

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
          <LinearGradient
            colors={[category?.color || "#6B7280", `${category?.color || "#6B7280"}80`]}
            style={styles.itemImagePlaceholder}
          >
            <Ionicons name={category?.icon as any} size={24} color="white" />
          </LinearGradient>

          <View
            style={[styles.expiryBadge, { backgroundColor: expiryColor }]}
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
                {CATEGORIES.filter(cat => cat.id !== "all").map((category) => (
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

  // Edit item modal
  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEditModal(false)}
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
            onPress={() => setShowEditModal(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-outline" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Item</Text>
          <TouchableOpacity
            onPress={handleUpdateItem}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >            
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Item Name</Text>
            <View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}>
              <Ionicons name="nutrition-outline" size={20} color="#FACC15" />
              <TextInput
                style={styles.textInput}
                value={editFormData.name}
                onChangeText={(text) => setEditFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter item name"
                placeholderTextColor="#666666"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginHorizontal: 6 }}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="calculator-outline" size={20} color="#FACC15" />
                <TextInput
                  style={styles.textInput}
                  value={editFormData.quantity}
                  onChangeText={(text) => setEditFormData(prev => ({ ...prev, quantity: text }))}
                  placeholder="0"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ flex: 1, marginHorizontal: 6 }}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <View style={[styles.inputContainer, { position: 'relative', justifyContent: 'center', paddingHorizontal: 12 }]}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                  onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                >
                  <Text style={[styles.unitButtonText, { fontSize: 15, textAlign: 'left', flex: 1 }]}>{editFormData.unit}</Text>
                  <Ionicons 
                    name={isUnitDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#FACC15" 
                  />
                </TouchableOpacity>
              </View>
              
              {isUnitDropdownOpen && (
                <View style={styles.unitDropdown}>
                  <ScrollView style={styles.unitDropdownScroll} contentContainerStyle={styles.unitDropdownScrollContent} nestedScrollEnabled>
                    {UNITS.map((unit, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.unitDropdownItem,
                          editFormData.unit === unit && styles.unitDropdownItemSelected
                        ]}
                        onPress={() => {
                          setEditFormData(prev => ({ ...prev, unit }))
                          setIsUnitDropdownOpen(false)
                        }}
                      >
                        <Text style={[
                          styles.unitDropdownItemText,
                          editFormData.unit === unit && styles.unitDropdownItemTextSelected
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

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categorySelection}>
              {CATEGORIES.filter(cat => cat.id !== "all").map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    editFormData.category === category.id && styles.selectedCategoryOption
                  ]}
                  onPress={() => {
                    setEditFormData((prev) => ({ ...prev, category: category.id }))
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={18}
                    color={editFormData.category === category.id ? "#FACC15" : category.color}
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      editFormData.category === category.id && styles.selectedCategoryOptionText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Expiry Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEditDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#FACC15" />
              <Text style={styles.dateText}>
                {editFormData.expiryDate.toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#FACC15" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showEditDatePicker && (
          <DateTimePicker
            value={editFormData.expiryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEditDateChange}
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
    
    // Use the category data from backend directly (populated by MongoDB)
    const category = showItemDetails.category || CATEGORIES.find((cat) => cat.name === showItemDetails.category?.name)
    
    const daysAdded = Math.floor((new Date().getTime() - new Date(showItemDetails.addedDate).getTime()) / (1000 * 60 * 60 * 24))

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
            <View style={styles.detailHeader}>
              <View style={styles.detailThumbnail}>
                <LinearGradient
                  colors={[category?.color || "#6B7280", `${category?.color || "#6B7280"}80`]}
                  style={styles.detailThumbnailImage}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={category?.icon as any} size={32} color="white" />
                </LinearGradient>
              </View>

              <View style={styles.detailTitleContainer}>
                <Text style={styles.detailName}>{showItemDetails.name}</Text>
              </View>
            </View>

            <View style={styles.detailInfo}>
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
                    {new Date(showItemDetails.addedDate).toLocaleDateString()}
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
                  onPress={() => handleEditItem(showItemDetails)}
                >
                  <Ionicons name="create-outline" size={22} color="#FACC15" />
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

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <LoadingIndicator message="Loading your pantry..." />
        </View>
      )}

      {/* Error State */}
      {loadingError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{loadingError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              const loadPantryItems = async () => {
                try {
                  setIsLoading(true);
                  setLoadingError(null);
                  
                  const response = await pantryService.getPantryItems();
                  
                  if (response.success) {
                    setPantryItems(response.items);
                  } else {
                    setLoadingError("Failed to load pantry items");
                  }
                } catch (error) {
                  console.error('Error loading pantry items:', error);
                  setLoadingError("Failed to load pantry items");
                } finally {
                  setIsLoading(false);
                }
              };
              loadPantryItems();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content - only show when not loading and no error */}
      {!isLoading && !loadingError && (
        <>
      {/* Header section */}
      <Animated.View style={[styles.header, { height: headerHeightAnim }]}>
        <View style={styles.headerContent}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="chevron-back" size={24} color="#FACC15" />
            </View>
          </TouchableOpacity>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Pantry Manager</Text>
            <Text style={styles.headerSubtitle}>
              Organize, track & reduce food waste
            </Text>
          </View>

          {/* Add Button */}
          <Animated.View style={{ transform: [{ scale: addButtonAnim }] }}>
            <TouchableOpacity
              style={styles.headerAddButton}
              onPress={() => {
                setShowAddModal(true)
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FACC15", "#F97316"]}
                style={styles.headerAddButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          {/* Replace BlurView with a simple background color for better performance */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30, 30, 30, 0.6)' }]} />
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
                          outputRange: ["0deg", "0deg"],
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
                {(() => {
                  const { active, expiringSoon, expired } = getItemsByStatus()
                  const totalItems = active.length + expiringSoon.length + expired.length
                  
                  if (totalItems === 0) {
                    return "No items in your pantry"
                  }
                  
                  if (activeTab === STATUS.ALL && totalItems === 0) {
                    return "No items in your pantry"
                  }
                  
                  if (activeTab === STATUS.ACTIVE && active.length === 0) {
                    if (expiringSoon.length > 0) {
                      return "Check your expiring items"
                    } else if (expired.length > 0) {
                      return "Check your expired items"
                    }
                  }
                  
                  if (activeTab === STATUS.EXPIRING && expiringSoon.length === 0) {
                    if (active.length > 0) {
                      return "All items are fresh!"
                    } else if (expired.length > 0) {
                      return "Check your expired items"
                    }
                  }
                  
                  if (activeTab === STATUS.EXPIRED && expired.length === 0) {
                    if (active.length > 0) {
                      return "All items are still good!"
                    } else if (expiringSoon.length > 0) {
                      return "Check your expiring items"
                    }
                  }
                  
                  return "No items found"
                })()}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {(() => {
                  const { active, expiringSoon, expired } = getItemsByStatus()
                  const totalItems = active.length + expiringSoon.length + expired.length
                  
                  if (totalItems === 0) {
                    return "Tap the + button to add some ingredients to your pantry"
                  }
                  
                  if (activeTab === STATUS.ALL && totalItems === 0) {
                    return "Tap the + button to add some ingredients to your pantry"
                  }
                  
                  if (activeTab === STATUS.ACTIVE && active.length === 0) {
                    if (expiringSoon.length > 0) {
                      return "Some items are about to expire soon"
                    } else if (expired.length > 0) {
                      return "Some items have already expired"
                    }
                  }
                  
                  if (activeTab === STATUS.EXPIRING && expiringSoon.length === 0) {
                    if (active.length > 0) {
                      return "Your pantry is well-stocked with fresh items"
                    } else if (expired.length > 0) {
                      return "Focus on your expired items first"
                    }
                  }
                  
                  if (activeTab === STATUS.EXPIRED && expired.length === 0) {
                    if (active.length > 0) {
                      return "Great job keeping your pantry fresh!"
                    } else if (expiringSoon.length > 0) {
                      return "Some items are expiring soon - check them out"
                    }
                  }
                  
                  return "Try adjusting your search or filters"
                })()}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Modals */}
      {renderAddItemModal()}
      {renderItemDetailsModal()}
      {renderEditModal()}

      {/* Custom Image Picker Dialog */}
      <ImagePickerDialog
        visible={showImagePickerDialog}
        onClose={() => setShowImagePickerDialog(false)}
        onCamera={handleCamera}
        onLibrary={handleGallery}
      />

      {/* Ingredient Detection Modal */}
      <IngredientSelectionModal 
        visible={showIngredientDetectionModal}
        onClose={() => setShowIngredientDetectionModal(false)}
        ingredients={detectedIngredients}
        onSelectIngredient={handleSelectIngredient}
        isLoading={isDetecting}
      />
      </>)}
    </View>
  )
}

export default PantryManagementScreen
