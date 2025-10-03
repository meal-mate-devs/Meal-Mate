# MealMate Backend Analysis

## Overview
The MealMate backend is a Node.js/Express.js REST API with MongoDB database, Firebase authentication, and Cloudinary image storage. It includes comprehensive functionality for user management, community features, pantry/grocery tracking, and AI-powered recipe generation.

## 🏗️ Architecture

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB with Mongoose ODM v8.18.0
- **Authentication**: Firebase Admin SDK v13.5.0
- **File Storage**: Cloudinary v1.41.3
- **Image Processing**: Multer v2.0.2 with Cloudinary integration

### Server Configuration
- **Main Server**: Express app (Port: 5000 or NODE_PORT)
- **Model Server**: Python server for AI features (Port: 8000 or MODEL_PORT)
- **Network Access**: Auto-detects local network IP for mobile access
- **CORS**: Enabled for cross-origin requests

## 📊 Database Models

### User Model (`User.js`)
```javascript
// Core user fields
firebaseUid: String (unique, indexed)
email: String (unique, required)
firstName, lastName: String
userName: String (unique, required)
phoneNumber: String (unique, required)
profileImage: { url: String, publicId: String }

// Profile completion
isProfileComplete: Boolean (default: false)
age: Number
dateOfBirth: Date
gender: String (enum: male/female/other)

// User roles
isChef: Boolean (default: false)
isPro: Boolean (default: false)

// Community stats
followerCount, followingCount: Number (default: 0)
recipeCount, totalLikes, totalPosts: Number (default: 0)
engagementScore: Number (default: 0)
isVerified: Boolean (default: false)
badges: Array of badge objects
rank: Number (default: 0)
```

### Post Model (`Post.js`)
```javascript
// Core post fields
author: ObjectId (ref: User, indexed)
content: String (required, max: 2000)
images: Array of { url, publicId }

// Engagement
likes, comments, saves: Number (default: 0)
likedBy, savedBy: Array of ObjectIds (ref: User)

// Recipe functionality
isRecipePost: Boolean (default: false)
recipeDetails: {
  title, description: String
  cookTime, prepTime, servings: Number
  difficulty: String (enum: Easy/Medium/Hard)
  cuisine: String (default: International)
  ingredients: Array of ingredient objects
  instructions: Array of instruction objects
  nutritionInfo: { calories, protein, carbs, fat }
  tips: Array of strings
  substitutions: Array of substitution objects
  category: String (default: Main Course)
  tags: Array of strings
}
```

### PantryItem Model (`PantryItem.js`)
```javascript
// Core fields
user: ObjectId (ref: User, indexed)
name: String (required, trimmed)
category: String (enum: vegetables/fruits/meat/dairy/grains/other)
quantity: Number (required, min: 0)
unit: String (enum: pieces/kg/g/l/ml/cups/tbsp/tsp/oz/lbs)
expiryDate: Date (required, indexed)
addedDate: Date (default: now)

// Advanced features
barcode: String (optional)
confidenceScore: Number (0-1, for AI detection)
detectionMethod: String (enum: manual/ai/barcode)
nutritionalInfo: { calories, protein, carbs, fat, fiber, sugar, sodium }

// Virtual fields
daysUntilExpiry: Calculated field
expiryStatus: String (expired/expiring/active)
```

### GroceryItem Model (`GroceryItem.js`)
```javascript
// Core fields
user: ObjectId (ref: User, indexed)
name: String (required, trimmed)
quantity: Number (required, min: 0)
unit: String (same enum as PantryItem)
urgency: String (enum: normal/urgent, default: normal)

// Purchase tracking
purchaseDate: Date (required, indexed)
isPurchased: Boolean (default: false, indexed)
purchasedDate: Date (optional)
notes: String (optional)

// Virtual fields
daysUntilPurchase: Calculated field
purchaseStatus: String (purchased/overdue/today/pending)
```

### Comment Model (`Comment.js`)
```javascript
post: ObjectId (ref: Post, indexed)
author: ObjectId (ref: User)
text: String (required, max: 500)
timestamps: createdAt, updatedAt
```

### Follow Model (`Follow.js`)
```javascript
follower: ObjectId (ref: User)
following: ObjectId (ref: User)
// Compound unique index on (follower, following)
```

### Category Model (`Category.js`)
```javascript
name: String (required, unique)
icon: String (required)
color: String (required, hex validation)
```

## 🛠️ API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /register              - User registration with profile image
POST   /login                 - User login/verification
GET    /profile               - Get current user profile
PUT    /update-profile        - Update user profile with image
POST   /check-username        - Check username availability (public)
DELETE /account               - Delete user account
POST   /password-changed      - Log password change event
```

### Community Routes (`/api/community`)
```
// Posts
GET    /posts                 - Get all posts (paginated)
GET    /posts/:postId         - Get specific post
POST   /posts                 - Create new post (with images)
PUT    /posts/:postId         - Update post
DELETE /posts/:postId         - Delete post
POST   /posts/:postId/like    - Toggle like on post
POST   /posts/:postId/save    - Toggle save on post
POST   /posts/:postId/comments - Add comment to post
GET    /users/:userId/posts   - Get user's posts

// Media upload
POST   /upload/images         - Upload post images
DELETE /upload/images/:publicId - Delete post image

// Leaderboard
GET    /leaderboard           - Get community leaderboard
GET    /users/:userId/rank    - Get user's rank
POST   /users/:userId/badge   - Award badge (admin only)

// Social features
GET    /users/:userId/profile - Get user profile
POST   /users/:userId/follow  - Toggle follow user
GET    /users/:userId/followers - Get user followers
GET    /users/:userId/following - Get user following
GET    /users/search          - Search users
```

### Pantry Routes (`/api/pantry`)
```
GET    /categories            - Get pantry categories (public)
GET    /items                 - Get user's pantry items
POST   /items                 - Add pantry item
PUT    /items/:id             - Update pantry item
DELETE /items/:id             - Delete pantry item

// Query parameters for /items:
// - status: active/expiring/expired
// - category: vegetables/fruits/meat/dairy/grains/other
// - search: text search in item names
```

### Grocery Routes (`/api/grocery`)
```
GET    /categories            - Get grocery categories (public)
GET    /items                 - Get user's grocery items
POST   /items                 - Add grocery item
PUT    /items/:id             - Update grocery item
DELETE /items/:id             - Delete grocery item
POST   /items/:id/purchase    - Mark item as purchased

// Query parameters for /items:
// - status: purchased/pending/overdue/today
// - urgency: normal/urgent
// - search: text search in item names
```

### Recipe Generation Routes (`/api/recipe-generation`)
```
POST   /generate              - Generate recipe from pantry items
POST   /pantry-based          - Generate pantry-based recipes
POST   /preference-based      - Generate preference-based recipes
POST   /substitutions         - Suggest ingredient substitutions
POST   /adjust-portions       - Adjust recipe portions
```

## 🔐 Authentication & Security

### Firebase Authentication
- **Middleware**: `verifyFirebaseToken` validates JWT tokens
- **Token Source**: Authorization header (`Bearer <token>`)
- **User Context**: Decoded token available as `req.user`
- **User Lookup**: Firebase UID mapped to MongoDB User document

### File Upload Security
- **Storage**: Cloudinary with secure upload
- **Image Processing**: Automatic optimization and format conversion
- **File Validation**: Size limits and format restrictions
- **Cleanup**: Automatic deletion on errors

## 🖼️ Image Management

### Profile Images
- **Folder**: `profile-images`
- **Formats**: jpg, jpeg, png, webp
- **Size Limit**: 10MB
- **Transformations**: 500x500 crop, quality auto
- **Naming**: `profile_<timestamp>`

### Post Images
- **Folder**: `community-posts`
- **Multiple Images**: Up to 5 images per post
- **Size Limit**: 10MB per image
- **Transformations**: 1200x1200 limit, quality auto
- **Naming**: `post_<timestamp>`

### Pantry Images
- **Folder**: `pantry-items`
- **Size Limit**: 10MB
- **Transformations**: 800x800 limit, quality auto
- **Naming**: `pantry_<timestamp>`

## 🤖 AI Integration

### Recipe Generation Features
1. **Pantry-Based Generation**: Creates recipes using available pantry items
2. **Preference-Based**: Filters recipes by dietary preferences
3. **Ingredient Substitution**: Suggests alternatives for missing ingredients
4. **Portion Adjustment**: Scales recipes for different serving sizes

### Recipe Generation Parameters
```javascript
{
  // Core parameters
  portionSize: Number (required, >0)
  cookingTimeLimit: Number (required, >0 minutes)
  
  // Ingredients
  ingredientOverride: Array (optional, overrides pantry)
  
  // Dietary system
  dietaryToggle: Boolean (default: false)
  dietaryPreferences: Array (used if dietaryToggle true)
  
  // Recipe classification
  cuisine: String (optional, e.g., "Italian")
  foodCategory: String (default: "main course")
  mealTime: String (breakfast/lunch/dinner/snack/brunch)
  recipeDifficulty: String (easy/medium/hard, default: "medium")
}
```

## 📈 Community Features

### Engagement System
- **Likes**: Users can like/unlike posts
- **Saves**: Users can save posts for later
- **Comments**: Text comments on posts
- **Following**: User follow/unfollow relationships

### Leaderboard System
- **Metrics**: Total likes, recipe count, engagement score
- **Badges**: Achievement system with custom badges
- **Ranking**: User ranking based on community engagement
- **Verification**: Verified user status

### Content Management
- **Post Types**: Regular posts and recipe posts
- **Rich Media**: Multiple image support
- **Recipe Details**: Comprehensive recipe information
- **Search**: User search functionality

## 🗄️ Data Management

### Database Indexes
```javascript
// User model
{ firebaseUid: 1 } (unique)
{ email: 1 } (unique)

// Post model
{ author: 1, createdAt: -1 }
{ createdAt: -1 }
{ likes: -1 }

// PantryItem model
{ user: 1, expiryDate: 1 }
{ user: 1, category: 1 }
{ user: 1, createdAt: -1 }

// GroceryItem model
{ user: 1, isPurchased: 1 }
{ user: 1, urgency: 1 }
{ user: 1, createdAt: -1 }
{ user: 1, purchaseDate: 1 }

// Follow model
{ follower: 1, following: 1 } (unique)
{ follower: 1 }
{ following: 1 }

// Comment model
{ post: 1, createdAt: -1 }
{ author: 1 }
```

### Virtual Fields
- **PantryItem**: `daysUntilExpiry`, `expiryStatus`
- **GroceryItem**: `daysUntilPurchase`, `purchaseStatus`

## 🔄 Data Flow Examples

### User Registration Flow
1. Client sends Firebase JWT + user data + optional profile image
2. Server verifies JWT token
3. Server validates user data and image
4. Server uploads image to Cloudinary
5. Server creates User document in MongoDB
6. Server returns success with user data

### Post Creation Flow
1. Client sends post content + images + optional recipe details
2. Server verifies authentication
3. Server uploads images to Cloudinary
4. Server creates Post document with image URLs
5. Server updates author's post count
6. Server returns created post data

### Pantry Item Management Flow
1. Client sends item data (name, category, quantity, expiry)
2. Server validates data and user authentication
3. Server creates PantryItem with virtual fields
4. Server calculates expiry status
5. Server returns item with calculated fields

## 🚀 Development Setup

### Environment Variables Required
```
MONGODB_URI=mongodb://localhost:27017/mealmate
NODE_PORT=5000
MODEL_PORT=8000
DOMAIN=auto
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Scripts Available
```json
{
  "start": "node index.js",
  "start:model": "cd Fruits-And-Vegetables-Detection-Model && python start_server.py",
  "start:both": "node start-servers.js",
  "dev": "node start-servers.js"
}
```

### Server Startup
- `npm start`: Runs only the Node.js backend
- `npm run dev`: Runs both backend and Python model server
- Auto-detects network IP for mobile app access
- Graceful shutdown handling

## 🔧 Utility Functions

### Cloud Storage (`cloudinaryUpload.js`)
- Configurable upload settings per use case
- Automatic image optimization
- Error handling and cleanup
- Multiple format support

### AI Prompt Builder (`aiPromptBuilder.js`)
- Recipe generation prompts
- Pantry recommendation prompts
- Preference filtering prompts
- Ingredient substitution prompts

## 📝 Response Formats

### Standard Success Response
```javascript
{
  success: true,
  data: { ... },
  message: "Optional success message"
}
```

### Standard Error Response
```javascript
{
  success: false,
  error: "Error message",
  details: "Optional detailed error info"
}
```

### Paginated Response
```javascript
{
  success: true,
  data: [...],
  pagination: {
    currentPage: 1,
    totalPages: 5,
    hasNext: true,
    total: 50
  }
}
```

## 🎯 Integration Points for Frontend

### Authentication
- Frontend sends Firebase JWT in Authorization header
- Backend validates and maps to MongoDB user
- User context available for all protected routes

### Real-time Features Ready
- Database structure supports real-time updates
- User engagement tracking in place
- Community features fully implemented

### File Upload Integration
- Cloudinary URLs returned for immediate display
- Automatic image optimization
- Error handling for failed uploads

### Recipe Generation Integration
- Pantry-based recipe suggestions
- Preference filtering
- Portion scaling
- Ingredient substitution suggestions

## 🔮 Extension Points

### Easy to Add Features
1. **Push Notifications**: User engagement events tracked
2. **Recipe Sharing**: Post system supports recipe details
3. **Shopping Lists**: Grocery system foundation in place
4. **Meal Planning**: Recipe and pantry data available
5. **Nutrition Tracking**: Nutritional info fields available
6. **Social Features**: Follow system and engagement tracking ready

### API Versioning Ready
- RESTful design supports versioning
- Modular controller structure
- Database schema extensible

## 📊 Performance Considerations

### Database Optimization
- Strategic indexing for common queries
- Virtual fields for calculated values
- Efficient population of related data

### Image Optimization
- Cloudinary automatic optimization
- Multiple format support
- Proper size limits and validation

### Error Handling
- Comprehensive try-catch blocks
- Proper HTTP status codes
- Development vs production error details

This backend provides a solid foundation for the MealMate application with room for future enhancements and scaling.