import ErrorDisplay from "@/components/atoms/ErrorDisplay";
import PantryLoadingAnimation from "@/components/atoms/PantryLoadingAnimation";
import { GroceryItem as BackendGroceryItem, groceryService } from "@/lib/services/groceryService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IoniconName = keyof typeof Ionicons.glyphMap;

type UrgencyLevel = "normal" | "urgent";

// Use the backend GroceryItem type
type GroceryItem = BackendGroceryItem;

interface AddGroceryItemForm {
  name: string;
  quantity: string;
  unit: string;
  urgency: UrgencyLevel;
  purchaseDate: Date;
  notes: string;
}

interface PurchaseFormData {
  quantity: string;
  unit: string;
  categoryId: string;
  expiryDate: Date;
}

const UNITS = [
  "pieces",
  "kilograms",
  "grams",
  "liters",
  "milliliters",
  "cups",
  "tablespoons",
  "teaspoons",
  "ounces",
  "pounds",
];

const CATEGORIES: { id: string; name: string; icon: IoniconName; color: string }[] = [
  { id: "vegetables", name: "Vegetables", icon: "leaf-outline", color: "#22C55E" },
  { id: "fruits", name: "Fruits", icon: "nutrition-outline", color: "#F97316" },
  { id: "meat", name: "Meat", icon: "fish-outline", color: "#EF4444" },
  { id: "dairy", name: "Dairy", icon: "water-outline", color: "#3B82F6" },
  { id: "grains", name: "Grains", icon: "restaurant-outline", color: "#8B5CF6" },
  { id: "other", name: "Other", icon: "apps-outline", color: "#6366F1" },
];

const LOCAL_FALLBACK_ITEMS: GroceryItem[] = [
];

const formatDisplayDate = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getDaysUntil = (value: Date | string) => {
  const target = typeof value === "string" ? new Date(value) : value;
  const today = new Date();
  const diff = target.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getPurchaseStatus = (daysUntil: number) => {
  if (daysUntil < 0) {
    return { text: "Past planned date", color: "#F87171" };
  }
  if (daysUntil === 0) {
    return { text: "Buy today", color: "#FACC15" };
  }
  if (daysUntil === 1) {
    return { text: "Buy tomorrow", color: "#FACC15" };
  }
  return { text: `Buy in ${daysUntil} days`, color: "#94A3B8" };
};

const DEFAULT_PURCHASE_DATE = () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
const DEFAULT_EXPIRY_DATE = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const createInitialAddForm = (): AddGroceryItemForm => ({
  name: "",
  quantity: "",
  unit: UNITS[0],
  urgency: "normal",
  purchaseDate: DEFAULT_PURCHASE_DATE(),
  notes: "",
});

const createInitialPurchaseForm = (): PurchaseFormData => ({
  quantity: "",
  unit: UNITS[0],
  categoryId: CATEGORIES[0].id,
  expiryDate: DEFAULT_EXPIRY_DATE(),
});

const GroceryListScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [cachedGroceryItems, setCachedGroceryItems] = useState<GroceryItem[]>(LOCAL_FALLBACK_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [newItemForm, setNewItemForm] = useState<AddGroceryItemForm>(createInitialAddForm);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>(createInitialPurchaseForm);
  const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<GroceryItem | null>(null);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isPurchaseUnitDropdownOpen, setIsPurchaseUnitDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [errorDetails, setErrorDetails] = useState<{
    type: 'network' | 'server' | 'auth' | 'unknown';
    title: string;
    message: string;
    canRetry: boolean;
  } | null>(null);

  // Dialog state variables
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancelButton: false,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const filteredItems = useMemo(() => {
    let base = groceryItems.filter((item) => !item.isPurchased);

    // Filter by active tab
    switch (activeTab) {
      case "urgent":
        base = base.filter((item) => item.urgency === "urgent");
        break;
      case "normal":
        base = base.filter((item) => item.urgency === "normal");
        break;
      // "all" shows all items
    }

    const searched = searchQuery.trim()
      ? base.filter((item) => item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : base;

    return [...searched].sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return a.urgency === "urgent" ? -1 : 1;
      }
      return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
    });
  }, [groceryItems, searchQuery, activeTab]);

  const urgentCount = useMemo(
    () => filteredItems.filter((item) => item.urgency === "urgent").length,
    [filteredItems]
  );
  const normalCount = useMemo(
    () => filteredItems.filter((item) => item.urgency === "normal").length,
    [filteredItems]
  );

  const resetAddForm = useCallback(() => {
    setNewItemForm(createInitialAddForm());
  }, []);

  const resetPurchaseForm = useCallback(() => {
    setPurchaseForm(createInitialPurchaseForm());
  }, []);

  const showCustomDialog = useCallback((
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: string,
    message: string,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancelButton = false,
    onConfirm = () => {},
    onCancel = () => {}
  ) => {
    setDialogConfig({
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancelButton,
      onConfirm,
      onCancel,
    });
    setShowDialog(true);
  }, []);

  const hideDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  const analyzeError = (error: any) => {
    if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch') || error?.message?.includes('Request timeout')) {
      return {
        type: 'network' as const,
        title: 'Connection Problem',
        message: 'We couldn’t refresh your grocery list. Check your connection and try again.',
        canRetry: true,
      };
    }

    if (error?.message?.includes('401') || error?.message?.includes('auth') || error?.message?.includes('Authentication')) {
      return {
        type: 'auth' as const,
        title: 'Authentication Error',
        message: 'Your session might have expired. Please log in again.',
        canRetry: false,
      };
    }

    if (error?.message?.includes('500') || error?.message?.includes('502') || error?.message?.includes('503') || error?.message?.includes('504')) {
      return {
        type: 'server' as const,
        title: 'Server Error',
        message: 'Our servers are having trouble right now. Please try again shortly.',
        canRetry: true,
      };
    }

    return {
      type: 'unknown' as const,
      title: 'Failed to update groceries',
      message: 'Something went wrong while syncing your grocery list. Try again or use local data instead.',
      canRetry: true,
    };
  };

  // Load grocery items from backend
  const loadGroceryItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorDetails(null);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });

      const response = await Promise.race([
        groceryService.getGroceryItems(),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof groceryService.getGroceryItems>>;

      if (response.success) {
        const items = Array.isArray(response.items) ? response.items : [];
        setGroceryItems(items);
        if (items.length > 0) {
          setCachedGroceryItems(items);
        }
      } else {
        const enhancedError = {
          ...analyzeError(new Error('API returned success: false')),
          title: 'Failed to update groceries',
          message: 'We couldn’t refresh your grocery list. Try again or show local items instead.',
        };
        setErrorDetails(enhancedError);
      }
    } catch (err: any) {
      console.log('Failed to load grocery items:', err);
      const errorInfo = analyzeError(err);
      const enhancedError =
        errorInfo.type === 'auth'
          ? errorInfo
          : {
              ...errorInfo,
              title: 'Failed to update groceries',
              message: 'We couldn’t refresh your grocery list. Try again or show local items instead.',
            };
      setErrorDetails(enhancedError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load items on component mount
  useEffect(() => {
    loadGroceryItems();
  }, [loadGroceryItems]);

  // Refresh grocery data when screen comes into focus (e.g., after adding items)
  useFocusEffect(
    useCallback(() => {
      loadGroceryItems();
    }, [])
  );

  const handleAddItem = useCallback(async () => {
    if (!newItemForm.name.trim()) {
      showCustomDialog('warning', 'Missing name', 'Please enter the item name before saving.');
      return;
    }

    const parsedQuantity = Number(newItemForm.quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      showCustomDialog('warning', 'Invalid quantity', 'Enter a valid quantity greater than zero.');
      return;
    }

    try {
      setIsSyncing(true);
      const itemData = {
        name: newItemForm.name.trim(),
        quantity: parsedQuantity,
        unit: newItemForm.unit,
        urgency: newItemForm.urgency,
        purchaseDate: newItemForm.purchaseDate.toISOString(),
        notes: newItemForm.notes?.trim() || "",
      };

      const response = await groceryService.addGroceryItem(itemData);
      setGroceryItems((prev) => {
        const updated = [response.item, ...prev];
        setCachedGroceryItems(updated);
        return updated;
      });
      setErrorDetails(null);
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.log('Failed to add grocery item:', err);
      showCustomDialog('error', 'Error', 'Failed to add grocery item. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [newItemForm, resetAddForm]);

  const handleDeleteItem = useCallback(async (id: string) => {
    showCustomDialog('confirm', 'Remove item', 'Are you sure you want to remove this grocery item?', 'Remove', 'Cancel', true, async () => {
      try {
        setIsSyncing(true);
        await groceryService.deleteGroceryItem(id);
        setGroceryItems((prev) => {
          const updated = prev.filter((item) => item.id !== id);
          setCachedGroceryItems(updated);
          return updated;
        });
      } catch (err) {
        console.log('Failed to delete grocery item:', err);
        showCustomDialog('error', 'Error', 'Failed to delete grocery item. Please try again.');
      } finally {
        setIsSyncing(false);
      }
    });
  }, []);

  const openPurchaseModal = useCallback((item: GroceryItem) => {
    setSelectedPurchaseItem(item);
    setPurchaseForm({
      quantity: item.quantity ? String(item.quantity) : "",
      unit: item.unit,
      categoryId: CATEGORIES[0].id,
      expiryDate: DEFAULT_EXPIRY_DATE(),
    });
    setShowPurchaseModal(true);
  }, []);

  const handleCompletePurchase = useCallback(async () => {
    if (!selectedPurchaseItem) return;

    const parsedQuantity = Number(purchaseForm.quantity || selectedPurchaseItem.quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      showCustomDialog('warning', 'Invalid quantity', 'Enter a valid quantity before saving.');
      return;
    }

    try {
      setIsSyncing(true);
      const purchaseData = {
        quantity: parsedQuantity,
        unit: purchaseForm.unit,
        categoryId: purchaseForm.categoryId,
        expiryDate: purchaseForm.expiryDate.toISOString(),
      };

      console.log("Completing purchase for item:", selectedPurchaseItem.name);
  await groceryService.markAsPurchased(selectedPurchaseItem.id, purchaseData);

  // Remove from grocery list
      setGroceryItems((prev) => {
        const updated = prev.filter((item) => item.id !== selectedPurchaseItem.id);
        setCachedGroceryItems(updated);
        return updated;
      });
      
      showCustomDialog('success', 'Purchase completed', `${selectedPurchaseItem.name} has been marked as purchased and added to your pantry.`);
      setShowPurchaseModal(false);
      setSelectedPurchaseItem(null);
      resetPurchaseForm();
    } catch (error) {
      console.log("Failed to complete purchase:", error);
      showCustomDialog('error', 'Purchase failed', 'Unable to complete the purchase. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [purchaseForm, resetPurchaseForm, selectedPurchaseItem]);

  const handleShareList = useCallback(async () => {
    if (filteredItems.length === 0) {
      showCustomDialog('info', 'Nothing to share', 'All items are already planned or purchased.');
      return;
    }

    const message = filteredItems
      .map((item, index) => {
        const urgencyTag = item.urgency === "urgent" ? " [URGENT]" : "";
        const purchaseText = formatDisplayDate(item.purchaseDate);
        return `${index + 1}. ${item.name} — ${item.quantity} ${item.unit}${urgencyTag} (Buy by ${purchaseText})`;
      })
      .join("\n");

    try {
      await Share.share({
        message: `🛒 Grocery Plan\n\n${message}\n\nShared from Meal Mate`,
      });
    } catch (error) {
      console.log("Unable to share grocery list", error);
      showCustomDialog('error', 'Unable to share', 'Please try again later.');
    }
  }, [filteredItems]);

  const handlePurchaseDateChange = useCallback(
    (_event: any, selectedDate?: Date) => {
      if (Platform.OS !== "ios") {
        setShowPurchaseDatePicker(false);
      }
      if (selectedDate) {
        setNewItemForm((prev) => ({ ...prev, purchaseDate: selectedDate }));
      }
    },
    []
  );

  const handleExpiryDateChange = useCallback(
    (_event: any, selectedDate?: Date) => {
      if (Platform.OS !== "ios") {
        setShowExpiryDatePicker(false);
      }
      if (selectedDate) {
        setPurchaseForm((prev) => ({ ...prev, expiryDate: selectedDate }));
      }
    },
    []
  );

  // Tab bar for filtering items by status
  const renderTabBar = () => {
    const tabs = [
      { id: "all", name: "All", count: filteredItems.length, color: "#6B7280", icon: "apps-outline" },
      { id: "urgent", name: "Urgent", count: urgentCount, color: "#F59E0B", icon: "alert-circle-outline" },
      { id: "normal", name: "Normal", count: normalCount, color: "#FACC15", icon: "time-outline" },
    ];

    return (
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id ? { backgroundColor: 'rgba(250, 204, 21, 0.05)' } : {}]}
              onPress={() => setActiveTab(tab.id)}
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

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareList}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={["#FACC1530", "#FACC1515"]}
            style={styles.shareButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Ionicons name="share-outline" size={30} color="#FACC15" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGroceryItem = useCallback(
    ({ item }: { item: GroceryItem }) => {
      const daysUntilPurchase = getDaysUntil(item.purchaseDate);
      const status = getPurchaseStatus(daysUntilPurchase);

      return (
        <View style={styles.groceryItem}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]}
            style={styles.itemBlur}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Main content row with icon, details, and stacked buttons */}
            <View style={styles.itemContentRow}>
              {/* Icon on the left */}
              <View style={styles.itemIconContainer}>
                <LinearGradient
                  colors={["#3B82F6", "#d8d21d7c"]}
                  style={styles.itemIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="bag-outline" size={24} color="white" />
                </LinearGradient>
                {/* Urgent badge */}
                {item.urgency === "urgent" && (
                  <LinearGradient
                    colors={["#F59E0B", "#F59E0BCC"]}
                    style={styles.urgentBadgeCompact}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.urgentTextCompact}>URGENT</Text>
                  </LinearGradient>
                )}
              </View>

              {/* Item details in the center */}
              <View style={styles.itemDetailsContainer}>
                <Text style={styles.itemTitleCompact} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.detailRow}>
                  <Ionicons name="cube-outline" size={14} color="#FACC15" style={styles.detailIcon} />
                  <Text style={styles.quantityTextCompact}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={14} color={item.urgency === "urgent" ? "#FACC15" : "#94A3B8"} style={styles.detailIcon} />
                  <Text style={[
                    styles.dateTextUnderQuantity,
                    { color: item.urgency === "urgent" ? "#FACC15" : status.color }
                  ]}>
                    {status.text}
                  </Text>
                </View>
              </View>

              {/* Stacked buttons on the right */}
              <View style={styles.stackedButtonsContainer}>
                <TouchableOpacity
                  onPress={() => openPurchaseModal(item)}
                  style={styles.purchaseBtnCompact}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["rgba(34, 197, 94, 0.3)", "rgba(22, 163, 74, 0.4)"]}
                    style={styles.buttonGradientCompact}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="white" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteItem(item.id)}
                  style={styles.deleteBtnCompact}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["rgba(248, 113, 113, 0.3)", "rgba(239, 68, 68, 0.4)"]}
                    style={styles.buttonGradientCompact}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    },
    [handleDeleteItem, openPurchaseModal]
  );

  // Add item modal with form
  const renderAddItemModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setShowAddModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#000000", "#121212"]} style={StyleSheet.absoluteFill} />

        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowAddModal(false)}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-outline" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Item</Text>
        </View>

        <View style={styles.modalContentWrapper}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => isUnitDropdownOpen && setIsUnitDropdownOpen(false)}
            style={styles.scrollViewTouchable}
          >
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScrollBeginDrag={() => isUnitDropdownOpen && setIsUnitDropdownOpen(false)}
              keyboardShouldPersistTaps="handled"
            >
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Item Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="nutrition-outline" size={18} color="#FACC15" />
                <TextInput
                  style={styles.textInput}
                  value={newItemForm.name}
                  onChangeText={(text) => setNewItemForm((prev) => ({ ...prev, name: text }))}
                  placeholder="Enter item name"
                  placeholderTextColor="#64748B"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Quantity & Unit *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cube-outline" size={18} color="#FACC15" />
                  <TextInput
                    style={styles.textInput}
                    value={newItemForm.quantity}
                    onChangeText={(text) => setNewItemForm((prev) => ({ ...prev, quantity: text }))}
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
                      {newItemForm.unit} <MaterialIcons name="arrow-drop-down" size={16} color="#FACC15" />
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
                              newItemForm.unit === unit && styles.unitDropdownItemSelected
                            ]}
                            onPress={() => {
                              setNewItemForm(prev => ({ ...prev, unit }));
                              setIsUnitDropdownOpen(false);
                            }}
                          >
                            <Text style={[
                              styles.unitDropdownItemText,
                              newItemForm.unit === unit && styles.unitDropdownItemTextSelected
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
              <Text style={styles.fieldLabel}>Urgency Level</Text>
              <View style={styles.categorySelection}>
                <TouchableOpacity
                  onPress={() => setNewItemForm((prev) => ({ ...prev, urgency: "normal" }))}
                  style={[
                    styles.categoryOption,
                    newItemForm.urgency === "normal" && styles.selectedCategoryOption,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={20} color="#FACC15" />
                  <Text style={[styles.categoryOptionText, newItemForm.urgency === "normal" && styles.selectedCategoryOptionText]}>
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewItemForm((prev) => ({ ...prev, urgency: "urgent" }))}
                  style={[
                    styles.categoryOption,
                    newItemForm.urgency === "urgent" && styles.selectedCategoryOption,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="alert-circle" size={20} color="#FACC15" />
                  <Text style={[styles.categoryOptionText, newItemForm.urgency === "urgent" && styles.selectedCategoryOptionText]}>
                    Urgent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Purchase Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowPurchaseDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={18} color="#FACC15" />
                <Text style={styles.dateText}>{formatDisplayDate(newItemForm.purchaseDate)}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
              {showPurchaseDatePicker && (
                <DateTimePicker
                  value={newItemForm.purchaseDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handlePurchaseDateChange}
                  minimumDate={new Date()}
                  themeVariant="dark"
                />
              )}
            </View>
          </ScrollView>
        </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Action Buttons - Fixed Position */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => setShowAddModal(false)}
          style={[styles.actionButton, styles.secondaryAction]}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color="#94A3B8" />
          <Text style={styles.secondaryActionText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddItem}
          style={[styles.actionButton, styles.primaryAction]}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color="#FACC15" />
          <Text style={styles.primaryActionText}>Add</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>

      {/* Error State */}
      {errorDetails && (
        <ErrorDisplay
          errorDetails={errorDetails}
          onRetry={errorDetails.canRetry ? () => loadGroceryItems() : undefined}
          secondaryActionLabel={cachedGroceryItems.length > 0 ? "Show local items" : "Dismiss"}
          onSecondaryAction={() => {
            setErrorDetails(null);

            if (cachedGroceryItems.length > 0) {
              setGroceryItems(cachedGroceryItems);
            } else {
              setGroceryItems(LOCAL_FALLBACK_ITEMS);
              setCachedGroceryItems(LOCAL_FALLBACK_ITEMS);
            }
          }}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              // If accessed from sidebar, go back to home screen
              if (params.from === 'sidebar') {
                router.push('/(protected)/(tabs)/home')
              } else {
                router.back()
              }
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#FACC15" />
            </View>
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Grocery List</Text>
            <Text style={styles.headerSubtitle}>Plan your purchases</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.headerAddButton}
            activeOpacity={0.7}
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
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.04)"]}
            style={styles.searchBlur}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search grocery items..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Grocery List */}
      <FlatList
        data={filteredItems}
        renderItem={renderGroceryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.inlineLoaderContainer}>
              <PantryLoadingAnimation message="Loading your grocery list..." />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="bag-outline" size={80} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateTitle}>No items in your list</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add items to your grocery list to keep track of what you need to buy
              </Text>
            </View>
          )
        }
      />

      {/* Add Item Modal */}
      {renderAddItemModal()}

      {/* Purchase Item Modal */}
      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={["#000000", "#121212"]} style={StyleSheet.absoluteFill} />

            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPurchaseModal(false)}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-outline" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Complete Purchase</Text>
            </View>

            <View style={styles.modalContentWrapper}>
              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.purchaseItemSummary}>
                  <View style={styles.purchaseItemIcon}>
                    <Ionicons name="bag-outline" size={24} color="#FACC15" />
                  </View>
                  <View style={styles.purchaseItemDetails}>
                    <Text style={styles.purchaseItemName}>{selectedPurchaseItem?.name}</Text>
                    <Text style={styles.purchaseItemMeta}>
                      {selectedPurchaseItem?.quantity} {selectedPurchaseItem?.unit} • {selectedPurchaseItem?.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                    </Text>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Quantity & Unit *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="cube-outline" size={18} color="#FACC15" />
                      <TextInput
                        style={styles.textInput}
                        value={purchaseForm.quantity}
                        onChangeText={(text) => setPurchaseForm((prev) => ({ ...prev, quantity: text }))}
                        placeholder="0"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={styles.unitButton}
                        onPress={() => setIsPurchaseUnitDropdownOpen(!isPurchaseUnitDropdownOpen)}
                      >
                        <Text style={styles.unitButtonText}>
                          {purchaseForm.unit} <MaterialIcons name="arrow-drop-down" size={16} color="#FACC15" />
                        </Text>
                      </TouchableOpacity>

                      {isPurchaseUnitDropdownOpen && (
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
                                  purchaseForm.unit === unit && styles.unitDropdownItemSelected
                                ]}
                                onPress={() => {
                                  setPurchaseForm(prev => ({ ...prev, unit }));
                                  setIsPurchaseUnitDropdownOpen(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.unitDropdownItemText,
                                    purchaseForm.unit === unit && styles.unitDropdownItemTextSelected,
                                  ]}
                                >
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
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.categorySelection}>
                    {CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => setPurchaseForm((prev) => ({ ...prev, categoryId: category.id }))}
                        style={[
                          styles.categoryOption,
                          purchaseForm.categoryId === category.id && styles.selectedCategoryOption,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={category.icon} size={20} color={purchaseForm.categoryId === category.id ? "#FACC15" : category.color} />
                        <Text style={[styles.categoryOptionText, purchaseForm.categoryId === category.id && styles.selectedCategoryOptionText]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Expiry Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowExpiryDatePicker(true)}
                    style={styles.dateInput}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      {formatDisplayDate(purchaseForm.expiryDate)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                  {showExpiryDatePicker && (
                    <DateTimePicker
                      value={purchaseForm.expiryDate}
                      mode="date"
                      display="default"
                      onChange={handleExpiryDateChange}
                      style={styles.dateTimePicker}
                    />
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>

          {/* Bottom Action Buttons - Fixed Position */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => setShowPurchaseModal(false)}
              style={[styles.actionButton, styles.secondaryAction]}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
              <Text style={styles.secondaryActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCompletePurchase}
              style={[styles.actionButton, styles.primaryAction]}
              activeOpacity={0.7}
              disabled={isSyncing}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FACC15" />
              <Text style={styles.primaryActionText}>
                {isSyncing ? "Processing..." : "Confirm Purchase"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container and layout
  container: {
    flex: 1,
    backgroundColor: "#000000",
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

  searchRow: {
    marginTop: 0,
    marginBottom: 16,
    paddingHorizontal: 22,
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
    height: 56,
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
  clearSearchButton: {
    position: "absolute",
    right: 16,
    top: 18,
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Items list
  itemsList: {
      flex: 1,
    },
  listContent: {
      paddingHorizontal: 20,
      paddingTop: 0,
      paddingBottom: 30,
    },
  inlineLoaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
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
  // Grocery item styles
  groceryItem: {
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
      alignSelf: 'stretch',
  },
  itemBlur: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 16,
      padding: 16,
      flex: 1,
    },
  itemContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(30, 30, 30, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
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
  itemIconContainer: {
    position: "relative",
    margin: 3,
  },
  itemIcon: {
    width: 70,
      height: 70,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
  },
  urgentBadge: {
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
  urgentText: {
    color: "white",
      fontSize: 10,
      fontWeight: "700",
  },
  itemInfo: {
    flex: 1,
      paddingVertical: 16,
      paddingRight: 8,
  },
  itemTitle: {
    color: "white",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6,
      letterSpacing: -0.5,
  },
  itemDetails: {
    flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 6,
  },
  quantityBadge: {
    flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      marginBottom: 4,
  },
  quantityValue: {
    color: "#94A3B8",
      fontSize: 14,
      marginLeft: 6,
      fontWeight: "600",
  },
  dateBadge: {
    flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
  },
  dateValue: {
    fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
  },
  itemButtons: {
    paddingHorizontal: 14,
  },
  purchaseBtn: {
    padding: 10,
      borderRadius: 10,
  },
  deleteBtn: {
    padding: 10,
      borderRadius: 10,
  },

  // Compact grocery item styles
  itemContentRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemDetailsContainer: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  dateTextUnderQuantity: {
    fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
  },
  stackedButtonsContainer: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  itemTitleCompact: {
    color: "white",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6,
      letterSpacing: -0.5,
  },
  itemDetailsCompact: {
    flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 6,
  },
  quantityTextCompact: {
    color: "#94A3B8",
      fontSize: 14,
      marginLeft: 4,
      fontWeight: "600",
  },
  dateTextCompact: {
    fontSize: 12,
    fontWeight: "500",
  },
  urgentBadgeCompact: {
    position: "absolute",
    top: -6,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  urgentTextCompact: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  detailIcon: {
    marginRight: 4,
  },
  itemButtonsCompact: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  purchaseBtnCompact: {
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deleteBtnCompact: {
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonGradientCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 50,
    borderRadius: 6,
  },
  buttonTextCompact: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 3,
  },
  emptyListContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyListEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  emptyListDescription: {
    fontSize: 14,
    color: "white",
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyListButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  emptyListButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyListButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  modalButtonContainer: {
    flex: 1,
    backgroundColor: "#000000",
    paddingBottom: 0,
    marginBottom: 0,
  },
  modalButton: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  modalButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  urgencyChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  itemInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemQuantity: {
    fontSize: 14,
    color: "white",
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  purchaseButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  modalContentWrapper: {
    flex: 1,
  },
  scrollViewTouchable: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  closeButton: {
    position: "absolute",
    left: 20,
    top: 16,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#0F0F0F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "80%",
  },
  formField: {
    marginBottom: 20,
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
      minHeight: 56,
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
      padding: 0,
      paddingRight: 80,
      height: 24,
    },
    placeholderText: {
      flex: 1,
      color: "#64748B",
      fontSize: 15,
      marginLeft: 12,
      fontWeight: "500",
    },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  unitSelectionRow: {
    flex: 1,
  },
  unitButton: {
    position: "absolute",
    right: 8,
    top: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 70,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FACC15",
  },
  unitSelectedText: {
    fontSize: 16,
    color: "white",
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
  categorySelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 8,
  },
  selectedCategoryOption: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderColor: "#FACC15",
  },
  categoryOptionText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  selectedCategoryOptionText: {
    color: "#FACC15",
    fontWeight: "600",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "white",
    marginLeft: 12,
  },
  dateTimePicker: {
    width: "100%",
    backgroundColor: "#1A1A1A",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#000000",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 1,
    borderColor: "#FACC15",
  },
  secondaryAction: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  destructiveAction: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  disabledAction: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FACC15",
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94A3B8",
  },
  destructiveActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  disabledActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94A3B8",
  },
  purchaseItemSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  purchaseItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseItemDetails: {
    flex: 1,
  },
  purchaseItemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  purchaseItemMeta: {
    fontSize: 14,
    color: "#94A3B8",
  },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 66,
    marginLeft: 2,
    marginBottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  shareButton: {
    marginLeft: -56,
    width: 50,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  shareButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    position: "relative",
    minWidth: 0,
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
  tabText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
    marginBottom: 4,
  },
  activeTabText: {
    color: '#FACC15',
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
});

export default GroceryListScreen;
