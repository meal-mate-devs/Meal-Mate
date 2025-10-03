# Expiry Labels Implementation - Food Waste Prevention

## Problem Addressed
Users needed visual indicators to identify ingredients nearing expiration so they can prioritize using them before they go to waste, promoting sustainable cooking and reducing food waste.

## Solution Overview
Added comprehensive expiry labeling system with visual indicators, priority sections, and smart selection features to encourage users to use expiring ingredients first.

## Implementation Details

### 1. Expiry Status Detection
```typescript
// Helper function to get appropriate expiry label
const getExpiryLabel = (item: PantryItem) => {
    if (item.expiryStatus === 'expiring') {
        const days = item.daysUntilExpiry
        if (days <= 1) {
            return { text: 'Use Today!', color: 'bg-red-500', urgent: true }
        } else if (days <= 3) {
            return { text: `${days} days left`, color: 'bg-orange-500', urgent: true }
        } else {
            return { text: 'Expiring Soon', color: 'bg-yellow-500', urgent: false }
        }
    }
    return null
}
```

### 2. Priority Expiring Section
- **Dedicated Section**: Created a prominent "Use Soon - Expiring Items" section at the top
- **Visual Design**: Red gradient background with warning icon and count badge
- **Educational Message**: "Prioritize these ingredients to reduce food waste"
- **Enhanced Cards**: Expiring items get special card design with colored headers

### 3. Smart Ingredient Sorting
```typescript
// Sort items within each category: expiring first, then by name
Object.keys(groupedIngredients).forEach(category => {
    groupedIngredients[category].sort((a, b) => {
        // Expiring items first
        if (a.expiryStatus === 'expiring' && b.expiryStatus !== 'expiring') return -1
        if (b.expiryStatus === 'expiring' && a.expiryStatus !== 'expiring') return 1
        // Then sort by name
        return a.name.localeCompare(b.name)
    })
})
```

### 4. Enhanced User Actions
- **Select Expiring Button**: Header button to quickly select all expiring items
- **Visual Priority**: Expiring items appear first in all categories
- **Smart Loading**: Includes both active and expiring items (excludes only expired items)

## Visual Design Features

### Expiry Label Colors
- 🔴 **Red (Use Today!)**: Items expiring within 1 day
- 🟠 **Orange (X days left)**: Items expiring within 2-3 days  
- 🟡 **Yellow (Expiring Soon)**: Items expiring within a week

### Priority Section Design
- **Background**: Red gradient with subtle transparency
- **Border**: Red accent border for attention
- **Icon**: Clock icon to indicate time sensitivity
- **Count Badge**: Shows number of expiring items
- **Card Style**: Rounded rectangles instead of pills for more space

### Enhanced Card Design
- **Expiring Items**: Get colored header bars with expiry information
- **Regular Items**: Keep standard design but show expiry labels when applicable
- **Border Accents**: Expiring items get orange/red border hints

## User Experience Improvements

### 1. Immediate Visual Feedback
- Users instantly see which ingredients need priority
- Color-coded urgency levels (red = most urgent)
- Quantity information still visible alongside expiry data

### 2. Convenient Selection Tools
- **"Select Expiring"** button when expiring items exist
- **"Select All"** button when no urgent items need attention
- Individual selection still available for granular control

### 3. Educational Approach
- Clear messaging about food waste reduction
- Encouraging language ("Use Soon" vs harsh warnings)
- Visual hierarchy that guides attention naturally

## Data Integration

### Backend Integration
```typescript
// Load both active and expiring items (exclude only expired)
const usableItems = pantryResponse.items.filter(item => 
    item.expiryStatus === 'active' || item.expiryStatus === 'expiring'
)
```

### Expiry Data Usage
- **expiryStatus**: 'active' | 'expiring' | 'expired'
- **daysUntilExpiry**: Number for precise timing
- **Smart filtering**: Only show usable ingredients

## Benefits

### Food Waste Reduction
- ✅ **Visual Priority**: Users immediately see expiring items
- ✅ **Easy Selection**: One-tap to select all expiring ingredients
- ✅ **Educational**: Promotes sustainable cooking habits
- ✅ **Practical**: Makes expiry dates actionable information

### User Experience
- ✅ **Clear Information**: Know exactly how much time is left
- ✅ **Guided Decision**: Visual cues help prioritize choices
- ✅ **Convenient Actions**: Quick selection of priority items
- ✅ **Seamless Integration**: Works naturally with existing flow

### Technical Implementation
- ✅ **Performance**: Client-side sorting and filtering
- ✅ **Responsive**: Adapts to different expiry scenarios
- ✅ **Scalable**: Works with any number of expiring items
- ✅ **Maintainable**: Clean separation of logic and UI

## Usage Flow

1. **Open Pantry Selector** → Expiring items prominently displayed at top
2. **See Visual Indicators** → Red/orange/yellow labels show urgency
3. **Quick Selection** → "Select Expiring" button for convenience
4. **Generate Recipe** → AI prioritizes expiring ingredients
5. **Reduce Waste** → Use ingredients before they expire

## Result
Users now have a comprehensive system that not only shows what ingredients they have, but actively guides them toward making sustainable choices that reduce food waste. The implementation transforms expiry dates from passive information into actionable priorities, encouraging better meal planning and environmental responsibility.