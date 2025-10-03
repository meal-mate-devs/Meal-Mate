# Backend Integration Documentation - Meal Mate Project

## Current Backend Architecture

### Technology Stack
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **File Storage**: Cloudinary
- **AI Model**: Python-based ingredient detection model (separate server)

### Backend Structure
```
backend/
├── index.js                    # Main server file
├── connections/connectDB.js    # MongoDB connection
├── config/firebase.js          # Firebase Admin configuration
├── models/
│   ├── User.js                 # User data model
│   └── PantryItem.js           # Pantry items model
├── controllers/
│   ├── auth.controller.js      # Authentication logic
│   ├── pantry.controller.js    # Pantry management logic
│   └── recipeGeneration.controller.js # Recipe generation logic
├── routes/
│   ├── auth.routes.js          # Authentication endpoints
│   ├── pantry.routes.js        # Pantry endpoints
│   └── recipeGeneration.routes.js # Recipe generation endpoints
├── middlewares/verifyFirebaseToken.js # Firebase token verification
└── utils/
    ├── cloudinaryUpload.js     # File upload utilities
    └── aiPromptBuilder.js      # AI prompt construction utilities
```

## Recipe Generation Backend Analysis

### Current Recipe Generation Endpoints
- `POST /api/recipe-generation/generate` - Main recipe generation
- `POST /api/recipe-generation/pantry-based` - Generate recipes using pantry items
- `POST /api/recipe-generation/preference-based` - Generate recipes with preferences
- `POST /api/recipe-generation/substitutions` - Suggest ingredient substitutions
- `POST /api/recipe-generation/adjust-portions` - Adjust recipe portions

### Recipe Generation Request Format
```json
{
  "ingredientOverride": [],           // Optional: override pantry ingredients
  "portionSize": 4,                  // Required: number of servings
  "cookingTimeLimit": 60,            // Required: max cooking time in minutes
  "dietaryToggle": false,            // Boolean: apply dietary preferences
  "dietaryPreferences": [],          // Array: if dietaryToggle is true
  "cuisine": "",                     // Optional: cuisine type
  "foodCategory": "main course",     // Category: main course, dessert, soup, etc.
  "mealTime": "",                    // Optional: breakfast, lunch, dinner, etc.
  "recipeDifficulty": "medium"       // Difficulty: easy, medium, hard
}
```

### Recipe Generation Response Format
```json
{
  "success": true,
  "recipe": {
    "id": "generated_id",
    "title": "Recipe Title",
    "description": "Recipe description",
    "image": "image_url",
    "cookTime": 30,
    "prepTime": 15,
    "servings": 4,
    "difficulty": "medium",
    "cuisine": "Italian",
    "category": "main course",
    "ingredients": [
      {
        "id": "1",
        "name": "Ingredient name",
        "amount": "1",
        "unit": "cup",
        "notes": "Optional notes"
      }
    ],
    "instructions": [
      {
        "id": "1",
        "step": 1,
        "instruction": "Step description",
        "duration": 5,
        "temperature": "180°C"
      }
    ],
    "nutritionInfo": {
      "calories": 400,
      "protein": 25,
      "carbs": 45,
      "fat": 15,
      "fiber": 8
    },
    "tips": ["Tip 1", "Tip 2"],
    "substitutions": [
      {
        "original": "Original ingredient",
        "substitute": "Substitute ingredient",
        "ratio": "1:1",
        "notes": "Substitution notes"
      }
    ]
  },
  "pantryAnalysis": {},
  "missingIngredients": [],
  "settings": {}
}
```

## Frontend Recipe UI Analysis

### Current Recipe Components Structure
```
components/organisms/Recipe/
├── RecipeGenerationScreen.tsx     # Main recipe generation screen
├── FilterSection.tsx              # Cuisine/category filter UI
├── GeneratedRecipeCard.tsx        # Recipe card display
├── RecipieDetailModel.tsx         # Full recipe details modal
├── IngredientsSelector.tsx        # Pantry ingredient selector
├── VoiceControl.tsx               # Voice input for recipe generation
└── IngredientSearchModal.tsx      # Camera/gallery ingredient detection
```

### Current UI Features
1. **Filter Selection**: Cuisine, food category, dietary preferences, meal time
2. **Custom Settings**: Servings (1-12), cooking time (10-180 min), difficulty level
3. **Ingredient Input**: Pantry selector, voice control, camera/gallery scanning
4. **Recipe Display**: Cards with nutrition info, cooking time, servings
5. **Recipe Details**: Full instructions, scaled ingredients, voice reading
6. **Interactive Features**: Like, save, share buttons

### Current UI Issues
1. **Mock Data**: All recipe generation uses hardcoded mock data
2. **No Backend Connection**: No API integration for recipe generation
3. **Static Pantry**: Ingredient selector uses hardcoded ingredients
4. **No Response Screen**: Generated recipes are shown inline, not on separate screen

## COMPREHENSIVE INTEGRATION PLAN

### Phase 1: Backend API Integration Service

#### 1.1 Create Recipe Generation Service
**File**: `lib/services/recipeGenerationService.ts`
```typescript
// Service to handle all recipe generation API calls
interface RecipeGenerationRequest {
  portionSize: number;
  cookingTimeLimit: number;
  dietaryToggle: boolean;
  dietaryPreferences: string[];
  cuisine: string;
  foodCategory: string;
  mealTime: string;
  recipeDifficulty: string;
  ingredientOverride?: string[];
}

interface RecipeGenerationResponse {
  success: boolean;
  recipe: GeneratedRecipe;
  pantryAnalysis: any;
  missingIngredients: string[];
  settings: any;
}
```

#### 1.2 Integrate Pantry Service
- **Existing**: `lib/services/pantryService.ts` already exists
- **Enhancement**: Add method to get all pantry ingredients for recipe generation
- **Integration**: Fetch user's pantry items before recipe generation

### Phase 2: Frontend Request Preparation

#### 2.1 Modify RecipeGenerationScreen.tsx
**Current State**: Uses mock data and local state
**Required Changes**:
1. **Pantry Integration**: Fetch user's pantry ingredients on screen load
2. **API Request Building**: Convert UI filters to backend request format
3. **Loading States**: Add proper loading indicators during API calls
4. **Error Handling**: Handle API errors gracefully

#### 2.2 Request Mapping
```typescript
// Map frontend filters to backend request
const buildRecipeRequest = (filters: RecipeFilters, pantryIngredients: string[]) => {
  return {
    portionSize: filters.servings,
    cookingTimeLimit: filters.cookingTime,
    dietaryToggle: filters.dietaryPreferences.length > 0,
    dietaryPreferences: filters.dietaryPreferences,
    cuisine: filters.cuisines[0] || '',
    foodCategory: filters.categories[0] || 'main course',
    mealTime: filters.mealTime,
    recipeDifficulty: filters.difficulty.toLowerCase(),
    ingredientOverride: filters.ingredients.length > 0 ? filters.ingredients : pantryIngredients
  };
};
```

### Phase 3: Recipe Response Screen

#### 3.1 Create New Screen Component
**File**: `components/organisms/Recipe/RecipeResponseScreen.tsx`
**Purpose**: Dedicated screen to display generated recipe response
**Features**:
- Loading animation during recipe generation
- Error state handling
- Recipe display with full details
- Navigation back to generation screen
- Save/share functionality

#### 3.2 Navigation Integration
- **Current**: Recipe displayed inline in RecipeGenerationScreen
- **New**: Navigate to RecipeResponseScreen after generation
- **Stack Navigation**: Add route for recipe response screen

### Phase 4: UI/UX Improvements

#### 4.1 Enhanced Loading States
1. **Recipe Generation**: Progress indicator with steps
2. **Pantry Loading**: Skeleton loaders for ingredient lists
3. **Image Loading**: Placeholder for recipe images

#### 4.2 Better Error Handling
1. **Network Errors**: Retry mechanisms
2. **Validation Errors**: Clear field-specific error messages
3. **Empty States**: When no pantry items or recipes available

#### 4.3 Improved User Flow
1. **Onboarding**: Guide users to add pantry items first
2. **Smart Defaults**: Pre-select common preferences
3. **Quick Actions**: Generate recipes with minimal input

### Phase 5: Backend Enhancements

#### 5.1 Response Optimization
**Current**: Backend returns complex response with extra data
**Enhancement**: 
- Add response formatting specifically for mobile UI
- Optimize image URLs for different screen sizes
- Include confidence scores for recipe suggestions

#### 5.2 Error Response Standardization
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INGREDIENTS",
    "message": "Not enough pantry ingredients for recipe generation",
    "details": {
      "required": 3,
      "available": 1,
      "suggestions": ["Add more vegetables", "Include protein sources"]
    }
  }
}
```

### Phase 6: Advanced Features

#### 6.1 Real-time Pantry Integration
- **Auto-sync**: Recipe generation automatically uses latest pantry
- **Smart Suggestions**: Suggest recipes based on expiring ingredients
- **Inventory Updates**: Option to mark ingredients as used after cooking

#### 6.2 Recipe Personalization
- **Learning**: Backend learns from user preferences
- **Favorites**: Save and categorize favorite recipes
- **Modifications**: Track user modifications to recipes

## IMPLEMENTATION ROADMAP

### Week 1: Foundation
1. ✅ **Backend Analysis**: Review existing recipe generation API
2. ✅ **Frontend Analysis**: Review current UI components and data flow
3. 🔲 **Service Creation**: Create recipeGenerationService.ts
4. 🔲 **Pantry Integration**: Enhance pantry service for recipe generation

### Week 2: Core Integration
1. 🔲 **API Connection**: Modify RecipeGenerationScreen to use real API
2. 🔲 **Request Building**: Implement proper request format mapping
3. 🔲 **Response Handling**: Process backend response into UI format
4. 🔲 **Error Handling**: Implement comprehensive error states

### Week 3: Response Screen
1. 🔲 **Screen Creation**: Build RecipeResponseScreen component
2. 🔲 **Navigation Setup**: Add routing for recipe response
3. 🔲 **Loading States**: Implement progress indicators
4. 🔲 **Result Display**: Show generated recipe with full details

### Week 4: Polish & Testing
1. 🔲 **UI Refinement**: Improve visual design and animations
2. 🔲 **Error Recovery**: Add retry mechanisms and fallbacks
3. 🔲 **Performance**: Optimize API calls and image loading
4. 🔲 **Testing**: Test entire flow end-to-end

## CURRENT STATUS
- ✅ Backend recipe generation API is fully functional
- ✅ Frontend UI components are well-designed and complete
- ❌ No connection between frontend and backend
- ❌ Frontend uses only mock data
- ❌ No dedicated response screen for generated recipes
- ❌ Pantry integration not connected to recipe generation

## NEXT IMMEDIATE STEPS
1. Create recipeGenerationService.ts
2. Modify RecipeGenerationScreen.tsx to fetch pantry ingredients
3. Replace mock recipe generation with real API call
4. Create RecipeResponseScreen.tsx for displaying results
5. Add proper loading states and error handling

### AI Integration
- **Ingredient Detection**: Separate Python model server
- **API URL**: Configurable via `apiConfig.ingredientDetectionApiUrl`
- **Endpoint**: `/detect` for ingredient detection from images
- **Features**: Confidence scoring, multiple ingredient detection
- **Recipe Generation**: Advanced AI prompt system with contextual recipe generation

## Environment Variables Required
- `MONGODB_URI` - MongoDB connection string
- `CLOUDINARY_*` - Cloudinary credentials
- Firebase service account configuration
- `EXPO_PUBLIC_API_URL` - Frontend API base URL

## Authentication Flow
1. User authenticates via Firebase on frontend
2. Firebase ID token sent to backend
3. Backend verifies token with Firebase Admin SDK
4. User data stored/retrieved from MongoDB
5. All API requests include Authorization header with Firebase token

## File Upload Flow
1. Frontend selects image via expo-image-picker
2. Image uploaded to backend via multipart/form-data
3. Backend stores image in Cloudinary
4. Cloudinary URL returned and stored in database
5. Optimized images served to frontend

This documentation serves as a reference for understanding the current backend integration and planning future enhancements for recipe generation functionality.