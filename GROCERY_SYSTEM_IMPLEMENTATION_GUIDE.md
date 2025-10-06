# Grocery System Architecture & Implementation Guide

## Overview
The Grocery System in Meal Mate allows users to create, manage, and track grocery shopping lists with purchase planning, urgency levels, and seamless integration with the pantry system. This document provides a comprehensive breakdown of the entire grocery functionality.

## Table of Contents
1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Database Models](#database-models)
4. [API Endpoints](#api-endpoints)
5. [UI Components & Styling](#ui-components--styling)
6. [Business Logic](#business-logic)
7. [Error Handling](#error-handling)
8. [Integration Points](#integration-points)

## Frontend Architecture

### GroceryListScreen.tsx Structure

#### State Management
```typescript
// Core state variables
const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isSyncing, setIsSyncing] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [showAddModal, setShowAddModal] = useState(false);
const [showPurchaseModal, setShowPurchaseModal] = useState(false);
const [activeTab, setActiveTab] = useState("all");

// Form states
const [newItemForm, setNewItemForm] = useState<AddGroceryItemForm>(createInitialAddForm);
const [purchaseForm, setPurchaseForm] = useState<PurchaseFormData>(createInitialPurchaseForm);
const [selectedPurchaseItem, setSelectedPurchaseItem] = useState<GroceryItem | null>(null);
```

#### Key Functions

##### Data Loading
```typescript
const loadGroceryItems = useCallback(async () => {
  try {
    setIsLoading(true);
    const response = await groceryService.getGroceryItems();
    if (response.success) {
      setGroceryItems(response.items);
    }
  } catch (err) {
    // Error handling with fallback to cached data
  } finally {
    setIsLoading(false);
  }
}, []);
```

##### Item Management
```typescript
const handleAddItem = useCallback(async () => {
  // Validation and API call to add new grocery item
}, [newItemForm]);

const handleDeleteItem = useCallback(async (id: string) => {
  // Confirmation dialog and deletion
}, []);

const handleCompletePurchase = useCallback(async () => {
  // Mark as purchased and move to pantry
}, [purchaseForm, selectedPurchaseItem]);
```

##### Filtering & Sorting
```typescript
const filteredItems = useMemo(() => {
  // Filter by search query and active tab
  // Sort by urgency then purchase date
}, [groceryItems, searchQuery, activeTab]);
```

### Grocery Service (groceryService.ts)

#### Interface Definitions
```typescript
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  urgency: 'normal' | 'urgent';
  purchaseDate: string;
  notes: string;
  isPurchased: boolean;
  purchasedDate?: string;
  daysUntilPurchase: number;
  purchaseStatus: 'purchased' | 'pending' | 'overdue' | 'today';
  createdAt: string;
  updatedAt: string;
}

export interface AddGroceryItemData {
  name: string;
  quantity: number;
  unit: string;
  urgency: 'normal' | 'urgent';
  purchaseDate: string;
  notes?: string;
}

export interface PurchaseItemData {
  quantity: number;
  unit: string;
  categoryId: string;
  expiryDate: string;
}
```

#### Service Methods
```typescript
class GroceryService {
  async getGroceryItems(params?: {...}): Promise<GroceryResponse>
  async addGroceryItem(itemData: AddGroceryItemData): Promise<{...}>
  async updateGroceryItem(itemData: UpdateGroceryItemData): Promise<{...}>
  async deleteGroceryItem(id: string): Promise<{...}>
  async markAsPurchased(id: string, purchaseData: PurchaseItemData): Promise<{...}>
  async getCategories(): Promise<{...}>
}
```

## Backend Architecture

### Grocery Controller (grocery.controller.js)

#### Core Functions

##### getGroceryItems
```javascript
const getGroceryItems = async (req, res) => {
  // Authentication via Firebase UID
  // Query building with filters (status, urgency, search)
  // Status count calculations
  // Response formatting with virtuals
};
```

##### addGroceryItem
```javascript
const addGroceryItem = async (req, res) => {
  // User validation
  // Data validation and sanitization
  // GroceryItem creation and saving
  // Response with created item
};
```

##### markAsPurchased
```javascript
const markAsPurchased = async (req, res) => {
  // Find grocery item
  // Create pantry item from grocery data
  // Mark grocery item as purchased
  // Return both updated grocery and new pantry items
};
```

### Routes (grocery.routes.js)
```javascript
router.get('/categories', getCategories); // Public
router.get('/items', verifyFirebaseToken, getGroceryItems);
router.post('/items', verifyFirebaseToken, addGroceryItem);
router.put('/items/:id', verifyFirebaseToken, updateGroceryItem);
router.delete('/items/:id', verifyFirebaseToken, deleteGroceryItem);
router.post('/items/:id/purchase', verifyFirebaseToken, markAsPurchased);
```

## Database Models

### GroceryItem Model
```javascript
const groceryItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'kilograms', 'grams', 'liters', 'milliliters', 'cups', 'tablespoons', 'teaspoons', 'ounces', 'pounds']
  },
  urgency: {
    type: String,
    required: true,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  purchaseDate: { type: Date, required: true },
  isPurchased: { type: Boolean, default: false },
  purchasedDate: { type: Date, default: null },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Virtuals for computed fields
groceryItemSchema.virtual('daysUntilPurchase').get(function() {...});
groceryItemSchema.virtual('purchaseStatus').get(function() {...});

// Indexes for performance
groceryItemSchema.index({ user: 1, isPurchased: 1 });
groceryItemSchema.index({ user: 1, urgency: 1 });
groceryItemSchema.index({ user: 1, createdAt: -1 });
groceryItemSchema.index({ user: 1, purchaseDate: 1 });
```

## API Endpoints

### GET /api/grocery/items
- **Auth**: Required (Firebase token)
- **Query Params**: status, urgency, search
- **Response**: `{ success: boolean, items: GroceryItem[], counts: {...} }`

### POST /api/grocery/items
- **Auth**: Required
- **Body**: `{ name, quantity, unit, urgency, purchaseDate, notes }`
- **Response**: `{ success: boolean, item: GroceryItem }`

### PUT /api/grocery/items/:id
- **Auth**: Required
- **Body**: Partial grocery item data
- **Response**: `{ success: boolean, item: GroceryItem }`

### DELETE /api/grocery/items/:id
- **Auth**: Required
- **Response**: `{ success: boolean, message: string }`

### POST /api/grocery/items/:id/purchase
- **Auth**: Required
- **Body**: `{ quantity, unit, categoryId, expiryDate }`
- **Response**: `{ success: boolean, message: string, groceryItem: GroceryItem, pantryItem: PantryItem }`

## UI Components & Styling

### Add Grocery Item Modal

#### Color Scheme
```typescript
// Primary Colors
const PRIMARY_YELLOW = "#FACC15"; // Main accent color
const PRIMARY_RED = "#EF4444"; // Destructive actions
const SECONDARY_GRAY = "#94A3B8"; // Secondary text/icons
const BACKGROUND_BLACK = "#000000"; // Main background
const BACKGROUND_DARK = "#121212"; // Secondary background
const SURFACE_LIGHT = "rgba(255, 255, 255, 0.04)"; // Card backgrounds
const SURFACE_MEDIUM = "rgba(255, 255, 255, 0.06)"; // Input backgrounds
const BORDER_LIGHT = "rgba(255, 255, 255, 0.08)"; // Subtle borders
const BORDER_MEDIUM = "rgba(255, 255, 255, 0.1)"; // Input borders
```

#### Modal Structure
```tsx
<Modal
  visible={showAddModal}
  animationType="slide"
  presentationStyle="fullScreen"
  onRequestClose={() => setShowAddModal(false)}
>
  <KeyboardAvoidingView style={styles.keyboardAvoidingContainer}>
    <StatusBar barStyle="light-content" />
    <LinearGradient colors={["#000000", "#121212"]} style={StyleSheet.absoluteFill} />

    {/* Header */}
    <View style={styles.modalHeader}>
      <TouchableOpacity onPress={() => setShowAddModal(false)}>
        <Ionicons name="close-outline" size={28} color="white" />
      </TouchableOpacity>
      <Text style={styles.modalTitle}>Add New Item</Text>
    </View>

    {/* Form Content */}
    <ScrollView style={styles.modalContent}>
      {/* Form Fields */}
    </ScrollView>

    {/* Action Buttons */}
    <View style={styles.actionRow}>
      <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
        <Text style={styles.secondaryActionText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
        <Text style={styles.primaryActionText}>Add</Text>
      </TouchableOpacity>
    </View>
  </Modal>
```

#### Form Fields
1. **Item Name** (Required)
   - Icon: `Ionicons.nutrition-outline`
   - Color: `#FACC15`
   - Validation: Non-empty after trim

2. **Quantity & Unit** (Required)
   - Quantity: Numeric input
   - Unit: Dropdown with predefined units
   - Validation: > 0

3. **Urgency Level**
   - Options: Normal, Urgent
   - Normal: `Ionicons.time-outline`
   - Urgent: `Ionicons.alert-circle`

4. **Purchase Date**
   - Date picker with minimum date = today
   - Default: 2 days from now

5. **Notes** (Optional)
   - Multi-line text input

#### Key Styles
```typescript
const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE_MEDIUM,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER_MEDIUM,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  primaryAction: {
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: PRIMARY_YELLOW,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_YELLOW,
  },
});
```

### Purchase Completion Modal

#### Structure
- **Header**: Item summary with icon and details
- **Form Fields**:
  - Quantity (pre-filled from grocery item)
  - Unit (dropdown)
  - Category (dropdown with icons)
  - Expiry Date (date picker)
- **Actions**: Cancel, Complete Purchase

#### Categories
```typescript
const CATEGORIES = [
  { id: "vegetables", name: "Vegetables", icon: "leaf-outline", color: "#22C55E" },
  { id: "fruits", name: "Fruits", icon: "nutrition-outline", color: "#F97316" },
  { id: "meat", name: "Meat", icon: "fish-outline", color: "#EF4444" },
  { id: "dairy", name: "Dairy", icon: "water-outline", color: "#3B82F6" },
  { id: "grains", name: "Grains", icon: "restaurant-outline", color: "#8B5CF6" },
  { id: "other", name: "Other", icon: "apps-outline", color: "#6366F1" },
];
```

## Business Logic

### Purchase Status Calculation
```javascript
const getPurchaseStatus = (daysUntil: number) => {
  if (daysUntil < 0) return { text: "Past planned date", color: "#F87171" };
  if (daysUntil === 0) return { text: "Buy today", color: "#FACC15" };
  if (daysUntil === 1) return { text: "Buy tomorrow", color: "#FACC15" };
  return { text: `Buy in ${daysUntil} days`, color: "#94A3B8" };
};
```

### Item Sorting
```typescript
// Sort by urgency (urgent first), then by purchase date
items.sort((a, b) => {
  if (a.urgency !== b.urgency) {
    return a.urgency === "urgent" ? -1 : 1;
  }
  return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
});
```

### Purchase Completion Flow
1. Validate purchase data
2. Create pantry item from grocery item data
3. Mark grocery item as purchased
4. Remove from grocery list UI
5. Show success message

## Error Handling

### Frontend Error Types
```typescript
const analyzeError = (error: any) => {
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return { type: 'network', title: 'Connection Problem', canRetry: true };
  }
  if (error?.message?.includes('401') || error?.message?.includes('auth')) {
    return { type: 'auth', title: 'Authentication Error', canRetry: false };
  }
  if (error?.message?.includes('500') || error?.message?.includes('502')) {
    return { type: 'server', title: 'Server Error', canRetry: true };
  }
  return { type: 'unknown', title: 'Failed to update groceries', canRetry: true };
};
```

### Backend Validation
- User authentication via Firebase UID
- Required field validation
- Data type validation
- Category validation for pantry items
- Ownership validation for updates/deletes

## Integration Points

### With Pantry System
- Purchase completion creates pantry items
- Category mapping from grocery to pantry
- Quantity and expiry date transfer

### With Authentication
- Firebase token verification on all protected routes
- User-specific data isolation
- UID to MongoDB ObjectId mapping

### With Recipe System
- Grocery items can be generated from recipes
- Missing ingredients detection
- Pantry analysis integration

## Key Features

### Smart Filtering
- **All**: Shows all pending items
- **Urgent**: Shows only urgent items
- **Normal**: Shows only normal priority items
- Search by item name

### Purchase Planning
- Planned purchase dates
- Days until purchase calculations
- Status indicators (overdue, today, tomorrow, future)

### Offline Support
- Cached grocery items for offline viewing
- Local fallback when network unavailable
- Sync status indicators

### Data Validation
- Comprehensive input validation
- Unit standardization
- Date validation with sensible defaults
- Category validation

This comprehensive system provides users with a complete grocery management experience, from planning purchases to pantry integration, with robust error handling and offline capabilities.