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
├── models/User.js              # User data model
├── controllers/auth.controller.js  # Authentication logic
├── routes/auth.routes.js       # Authentication endpoints
├── middlewares/verifyFirebaseToken.js  # Firebase token verification
└── utils/cloudinaryUpload.js   # File upload utilities
```

### Current Features
1. **User Authentication**
   - Firebase-based authentication
   - User registration and login
   - Profile management with image upload
   - Username availability checking
   - Account deletion

2. **File Upload System**
   - Cloudinary integration for image/video storage
   - Multiple file format support
   - Automatic transformations and optimizations

### API Endpoints Currently Available
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/update-profile` - Update user profile
- `POST /api/auth/check-username` - Check username availability
- `DELETE /api/auth/account` - Delete user account

### Frontend Integration
- **API Client**: Custom ApiClient class with automatic Firebase token management
- **Base URL**: Configurable via `EXPO_PUBLIC_API_URL` environment variable
- **Authentication**: Automatic token refresh and retry logic
- **Error Handling**: Structured error responses

### AI Integration
- **Ingredient Detection**: Separate Python model server
- **API URL**: Configurable via `apiConfig.ingredientDetectionApiUrl`
- **Endpoint**: `/detect` for ingredient detection from images
- **Features**: Confidence scoring, multiple ingredient detection

## Missing Components for Pantry Management

### 1. Database Models Needed
- **PantryItem**: Store user's pantry ingredients
- **Category**: Ingredient categories (vegetables, fruits, etc.)
- **NutritionalInfo**: Optional nutritional data

### 2. API Endpoints Needed
- `GET /api/pantry/items` - Fetch user's pantry items
- `POST /api/pantry/items` - Add new pantry item
- `PUT /api/pantry/items/:id` - Update pantry item
- `DELETE /api/pantry/items/:id` - Delete pantry item
- `GET /api/pantry/categories` - Get ingredient categories

### 3. Frontend Services Needed
- Pantry management service
- Integration with existing ingredient detection
- State management for pantry data

### Environment Variables Required
- `MONGODB_URI` - MongoDB connection string
- `CLOUDINARY_*` - Cloudinary credentials
- Firebase service account configuration
- `EXPO_PUBLIC_API_URL` - Frontend API base URL

### Authentication Flow
1. User authenticates via Firebase on frontend
2. Firebase ID token sent to backend
3. Backend verifies token with Firebase Admin SDK
4. User data stored/retrieved from MongoDB
5. All API requests include Authorization header with Firebase token

### File Upload Flow
1. Frontend selects image via expo-image-picker
2. Image uploaded to backend via multipart/form-data
3. Backend stores image in Cloudinary
4. Cloudinary URL returned and stored in database
5. Optimized images served to frontend

This documentation serves as a reference for understanding the current backend integration and planning future enhancements for pantry management functionality.