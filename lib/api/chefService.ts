// lib/api/chefService.ts
// Comprehensive API service for chef content uploads (recipes and courses)

import { apiClient } from './client';

// ==================== Types ====================

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
  notes?: string;
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  duration?: string;
  tips?: string;
}

export interface CreateRecipePayload {
  title: string;
  description: string;
  image?: string; // Cloudinary URL (optional)
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string; // Required by backend
  category: string; // Required by backend
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  isPremium?: boolean;
  isPublished?: boolean;
}

export interface UpdateRecipePayload extends Partial<CreateRecipePayload> {}

export interface CourseUnit {
  title: string;
  objective?: string;
  content: string;
  steps?: string[];
  commonErrors?: string[];
  bestPractices?: string[];
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  coverImage?: string; // Cloudinary URL (optional)
  category: string;
  durationValue: number;
  durationUnit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  units: CourseUnit[];
  isPremium?: boolean;
  isPublished?: boolean;
}

export interface UpdateCoursePayload extends Partial<Omit<CreateCoursePayload, 'units'>> {}

export interface Recipe {
  averageRating: number;
  _id: string;
  title: string;
  description: string;
  image?: string | { url: string; publicId: string };
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  cuisine?: string;
  category?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  authorType: 'chef';
  authorId: string;
  userId: string;
  isPublished: boolean;
  isPremium: boolean;
  stats: {
    views: number;
    saves: number;
    likes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  category: string;
  durationValue?: number;
  durationUnit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
  duration?: string; // Legacy field for display (computed from durationValue + durationUnit)
  totalDuration?: number; // Total duration in minutes
  skillLevel: string;
  units: Array<{
    _id: string;
    title: string;
    objective?: string;
    content: string;
    steps?: string[];
    commonErrors?: string[];
    bestPractices?: string[];
  }>;
  authorId: string;
  userId: string;
  isPublished: boolean;
  isPremium: boolean;
  totalReports?: number;
  reportReasons?: Array<{
    reason: string;
    count: number;
  }>;
  averageRating?: number;
  rating?: number; // Legacy field for compatibility
  totalReviews?: number;
  views?: number;
  subscribers?: number; // Legacy field for compatibility
  createdAt: string;
  updatedAt: string;
}

export interface PremiumEligibility {
  canUpload: boolean;
  currentStats: {
    totalRecipes?: number;
    freeRecipes?: number;
    premiumRecipes?: number;
    totalCourses?: number;
    freeCourses?: number;
    premiumCourses?: number;
  };
  reason?: string;
}

// ==================== Cloudinary Image Upload ====================

/**
 * Upload image to Cloudinary via backend
 * 
 * IMPORTANT: Update the endpoint path based on your actual backend route
 * Common patterns:
 * - '/upload' (if registered as app.use('/api/upload', uploadRoutes))
 * - '/cloudinary/upload' (if registered as app.use('/api/cloudinary', ...))
 * - '/images/upload' (if registered as app.use('/api/images', ...))
 * 
 * Check your backend index.js to see which routes are registered
 */
export async function uploadImageToCloudinary(imageUri: string): Promise<string> {
  try {
    console.log('📸 Uploading image to Cloudinary:', imageUri);

    // Create FormData for image upload
    const formData = new FormData();
    
    // Extract filename from URI or generate one
    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `upload_${Date.now()}.jpg`;
    
    // Detect file type from URI
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    const mimeType = mimeTypes[fileExtension] || 'image/jpeg';
    
    // Append the image file
    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: fileName,
    } as any);

    console.log('📤 Sending image to backend...');
    
    // TODO: Update this endpoint to match your backend
    // Check your backend index.js for the actual route
    const endpoint = '/upload'; // Change this to match your backend route
    
    try {
      const response = await apiClient.postForm<{ url: string; publicId?: string }>(
        endpoint,
        formData,
        true,
        60000 // 60 second timeout for image uploads
      );

      console.log('✅ Image uploaded successfully:', response.url);
      return response.url;
    } catch (error) {
      console.log(`❌ Upload to ${endpoint} failed:`, error);
      throw error;
    }
    
  } catch (error) {
    console.log('❌ Image upload failed:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ==================== Recipe Endpoints ====================

/**
 * Create a new recipe
 * POST /api/recipes/chef/create
 */
export async function createRecipe(payload: CreateRecipePayload): Promise<Recipe> {
  try {
    console.log('🍳 Creating new recipe:', payload.title);
    const response = await apiClient.post<{ recipe: Recipe }>(
      '/recipes/chef/create',
      payload,
      true,
      30000
    );
    console.log('✅ Recipe created successfully, ID:', response.recipe._id);
    return response.recipe;
  } catch (error) {
    console.log('❌ Failed to create recipe:', error);
    throw error;
  }
}

/**
 * Get chef's own recipes (with optional status filter)
 * GET /api/recipes/chef/my-recipes?status=all|published|draft
 */
export async function getMyRecipes(status: 'all' | 'published' | 'draft' = 'all'): Promise<Recipe[]> {
  try {
    console.log(`📚 Fetching my recipes (status: ${status})`);
    const response = await apiClient.get<{ recipes: Recipe[] }>(
      `/recipes/chef/my-recipes?status=${status}`,
      true,
      20000
    );
    console.log(`✅ Fetched ${response.recipes.length} recipes`);
    return response.recipes;
  } catch (error) {
    console.log('❌ Failed to fetch recipes:', error);
    throw error;
  }
}

/**
 * Get a single recipe by ID
 * GET /api/recipes/chef/:id
 */
export async function getRecipeById(id: string): Promise<Recipe> {
  try {
    console.log(`🔍 Fetching recipe: ${id}`);
    const response = await apiClient.get<{ recipe: Recipe }>(
      `/recipes/chef/${id}`,
      true,
      15000
    );
    console.log('✅ Recipe fetched:', response.recipe.title);
    return response.recipe;
  } catch (error) {
    console.log('❌ Failed to fetch recipe:', error);
    throw error;
  }
}

/**
 * Update a recipe
 * PUT /api/recipes/chef/:id
 */
export async function updateRecipe(id: string, payload: UpdateRecipePayload): Promise<Recipe> {
  try {
    console.log(`✏️ Updating recipe: ${id}`);
    const response = await apiClient.put<{ recipe: Recipe }>(
      `/recipes/chef/${id}`,
      payload,
      true,
      30000
    );
    console.log('✅ Recipe updated:', response.recipe.title);
    return response.recipe;
  } catch (error) {
    console.log('❌ Failed to update recipe:', error);
    throw error;
  }
}

/**
 * Delete a recipe
 * DELETE /api/recipes/chef/:id
 */
export async function deleteRecipe(id: string): Promise<{ message: string }> {
  try {
    console.log(`🗑️ Deleting recipe: ${id}`);
    const response = await apiClient.delete<{ message: string }>(
      `/recipes/chef/${id}`,
      true,
      15000
    );
    console.log('✅ Recipe deleted');
    return response;
  } catch (error) {
    console.log('❌ Failed to delete recipe:', error);
    throw error;
  }
}

/**
 * Publish a recipe
 * PATCH /api/recipes/chef/:id/publish
 */
export async function publishRecipe(id: string): Promise<Recipe> {
  try {
    console.log(`📢 Publishing recipe: ${id}`);
    const response = await apiClient.patch<{ recipe: Recipe }>(
      `/recipes/chef/${id}/publish`,
      {},
      true,
      15000
    );
    console.log('✅ Recipe published:', response.recipe.title);
    return response.recipe;
  } catch (error) {
    console.log('❌ Failed to publish recipe:', error);
    throw error;
  }
}

/**
 * Unpublish a recipe
 * PATCH /api/recipes/chef/:id/unpublish
 */
export async function unpublishRecipe(id: string): Promise<Recipe> {
  try {
    console.log(`📥 Unpublishing recipe: ${id}`);
    const response = await apiClient.patch<{ recipe: Recipe }>(
      `/recipes/chef/${id}/unpublish`,
      {},
      true,
      15000
    );
    console.log('✅ Recipe unpublished:', response.recipe.title);
    return response.recipe;
  } catch (error) {
    console.log('❌ Failed to unpublish recipe:', error);
    throw error;
  }
}

/**
 * Toggle recipe premium status
 * PATCH /api/recipes/chef/:id/premium
 */
export async function toggleRecipePremium(id: string, isPremium: boolean): Promise<Recipe> {
  try {
    console.log(`💎 Setting recipe premium status: ${id} -> ${isPremium}`);
    const response = await apiClient.patch<{ recipe: Recipe }>(
      `/recipes/chef/${id}/premium`,
      { isPremium },
      true,
      15000
    );
    console.log('✅ Recipe premium status updated:', response.recipe.isPremium);
    return response.recipe;
  } catch (error) {
    console.log('❌ Failed to toggle recipe premium:', error);
    throw error;
  }
}

/**
 * Check if chef can upload a premium recipe
 * GET /api/recipes/chef/premium-eligibility
 */
export async function checkRecipePremiumEligibility(): Promise<PremiumEligibility> {
  try {
    console.log('🔐 Checking recipe premium eligibility');
    const response = await apiClient.get<PremiumEligibility>(
      '/recipes/chef/premium-eligibility',
      true,
      10000
    );
    console.log('✅ Eligibility checked:', response.canUpload);
    return response;
  } catch (error) {
    console.log('❌ Failed to check eligibility:', error);
    throw error;
  }
}

/**
 * Search chef's own recipes
 * GET /api/recipes/chef/search?q=query
 */
export async function searchMyRecipes(query: string): Promise<Recipe[]> {
  try {
    console.log(`🔎 Searching recipes: "${query}"`);
    const response = await apiClient.get<{ recipes: Recipe[] }>(
      `/recipes/chef/search?q=${encodeURIComponent(query)}`,
      true,
      15000
    );
    console.log(`✅ Found ${response.recipes.length} recipes`);
    return response.recipes;
  } catch (error) {
    console.log('❌ Failed to search recipes:', error);
    throw error;
  }
}

// ==================== Course Endpoints ====================

/**
 * Create a new course
 * POST /api/courses/chef/create
 */
export async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  try {
    console.log('📚 Creating new course:', payload.title);
    const response = await apiClient.post<{ course: Course }>(
      '/courses/chef/create',
      payload,
      true,
      30000
    );
    console.log('✅ Course created:', response.course._id);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to create course:', error);
    throw error;
  }
}

/**
 * Get chef's own courses (with optional status filter)
 * GET /api/courses/chef/my-courses?status=all|published|draft
 */
export async function getMyCourses(status: 'all' | 'published' | 'draft' = 'all'): Promise<Course[]> {
  try {
    console.log(`📚 Fetching my courses (status: ${status})`);
    const response = await apiClient.get<{ courses: Course[] }>(
      `/courses/chef/my-courses?status=${status}`,
      true,
      20000
    );
    console.log(`✅ Fetched ${response.courses.length} courses`);
    return response.courses;
  } catch (error) {
    console.log('❌ Failed to fetch courses:', error);
    throw error;
  }
}

/**
 * Get a single course by ID
 * GET /api/courses/chef/:id
 */
export async function getCourseById(id: string): Promise<Course> {
  try {
    console.log(`🔍 Fetching course: ${id}`);
    const response = await apiClient.get<{ course: Course }>(
      `/courses/chef/${id}`,
      true,
      15000
    );
    console.log('✅ Course fetched:', response.course.title);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to fetch course:', error);
    throw error;
  }
}

/**
 * Update a course (metadata only, not units)
 * PUT /api/courses/chef/:id
 */
export async function updateCourse(id: string, payload: UpdateCoursePayload): Promise<Course> {
  try {
    console.log(`✏️ Updating course: ${id}`);
    const response = await apiClient.put<{ course: Course }>(
      `/courses/chef/${id}`,
      payload,
      true,
      30000
    );
    console.log('✅ Course updated:', response.course.title);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to update course:', error);
    throw error;
  }
}

/**
 * Delete a course
 * DELETE /api/courses/chef/:id
 */
export async function deleteCourse(id: string): Promise<{ message: string }> {
  try {
    console.log(`🗑️ Deleting course: ${id}`);
    const response = await apiClient.delete<{ message: string }>(
      `/courses/chef/${id}`,
      true,
      15000
    );
    console.log('✅ Course deleted');
    return response;
  } catch (error) {
    console.log('❌ Failed to delete course:', error);
    throw error;
  }
}

/**
 * Add a unit to a course
 * POST /api/courses/chef/:id/units
 */
export async function addCourseUnit(id: string, unit: CourseUnit): Promise<Course> {
  try {
    console.log(`➕ Adding unit to course: ${id}`);
    const response = await apiClient.post<{ course: Course }>(
      `/courses/chef/${id}/units`,
      unit,
      true,
      20000
    );
    console.log('✅ Unit added:', unit.title);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to add unit:', error);
    throw error;
  }
}

/**
 * Update a specific unit in a course
 * PUT /api/courses/chef/:id/units/:unitId
 */
export async function updateCourseUnit(
  courseId: string,
  unitId: string,
  unit: Partial<CourseUnit>
): Promise<Course> {
  try {
    console.log(`✏️ Updating unit ${unitId} in course ${courseId}`);
    const response = await apiClient.put<{ course: Course }>(
      `/courses/chef/${courseId}/units/${unitId}`,
      unit,
      true,
      20000
    );
    console.log('✅ Unit updated');
    return response.course;
  } catch (error) {
    console.log('❌ Failed to update unit:', error);
    throw error;
  }
}

/**
 * Delete a unit from a course
 * DELETE /api/courses/chef/:id/units/:unitId
 */
export async function deleteCourseUnit(courseId: string, unitId: string): Promise<Course> {
  try {
    console.log(`🗑️ Deleting unit ${unitId} from course ${courseId}`);
    const response = await apiClient.delete<{ course: Course }>(
      `/courses/chef/${courseId}/units/${unitId}`,
      true,
      15000
    );
    console.log('✅ Unit deleted');
    return response.course;
  } catch (error) {
    console.log('❌ Failed to delete unit:', error);
    throw error;
  }
}

/**
 * Publish a course
 * PATCH /api/courses/chef/:id/publish
 */
export async function publishCourse(id: string): Promise<Course> {
  try {
    console.log(`📢 Publishing course: ${id}`);
    const response = await apiClient.patch<{ course: Course }>(
      `/courses/chef/${id}/publish`,
      {},
      true,
      15000
    );
    console.log('✅ Course published:', response.course.title);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to publish course:', error);
    throw error;
  }
}

/**
 * Unpublish a course
 * PATCH /api/courses/chef/:id/unpublish
 */
export async function unpublishCourse(id: string): Promise<Course> {
  try {
    console.log(`📥 Unpublishing course: ${id}`);
    const response = await apiClient.patch<{ course: Course }>(
      `/courses/chef/${id}/unpublish`,
      {},
      true,
      15000
    );
    console.log('✅ Course unpublished:', response.course.title);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to unpublish course:', error);
    throw error;
  }
}

/**
 * Toggle course premium status
 * POST /api/courses/chef/:id/premium
 */
export async function toggleCoursePremium(id: string, isPremium: boolean): Promise<Course> {
  try {
    console.log(`💎 Setting course premium status: ${id} -> ${isPremium}`);
    const response = await apiClient.post<{ course: Course }>(
      `/courses/chef/${id}/premium`,
      { isPremium },
      true,
      15000
    );
    console.log('✅ Course premium status updated:', response.course.isPremium);
    return response.course;
  } catch (error) {
    console.log('❌ Failed to toggle course premium:', error);
    throw error;
  }
}

/**
 * Check if chef can upload a premium course
 * GET /api/courses/chef/premium-eligibility
 */
export async function checkCoursePremiumEligibility(): Promise<PremiumEligibility> {
  try {
    console.log('🔐 Checking course premium eligibility');
    const response = await apiClient.get<PremiumEligibility>(
      '/courses/chef/premium-eligibility',
      true,
      10000
    );
    console.log('✅ Eligibility checked:', response.canUpload);
    return response;
  } catch (error) {
    console.log('❌ Failed to check eligibility:', error);
    throw error;
  }
}

/**
 * Search chef's own courses
 * GET /api/courses/chef/search?q=query
 */
export async function searchMyCourses(query: string): Promise<Course[]> {
  try {
    console.log(`🔎 Searching courses: "${query}"`);
    const response = await apiClient.get<{ courses: Course[] }>(
      `/courses/chef/search?q=${encodeURIComponent(query)}`,
      true,
      15000
    );
    console.log(`✅ Found ${response.courses.length} courses`);
    return response.courses;
  } catch (error) {
    console.log('❌ Failed to search courses:', error);
    throw error;
  }
}

// ==================== Public Endpoints (for viewing published content) ====================

/**
 * Get all published recipes from chefs
 * GET /api/recipes/published
 */
export async function getPublishedRecipes(): Promise<Recipe[]> {
  try {
    console.log('📚 Fetching published recipes');
    const response = await apiClient.get<{ recipes: Recipe[] }>(
      '/recipes/published',
      false, // No auth required for public content
      20000
    );
    console.log(`✅ Fetched ${response.recipes.length} published recipes`);
    return response.recipes;
  } catch (error) {
    console.log('❌ Failed to fetch published recipes:', error);
    throw error;
  }
}

/**
 * Get published recipes from a specific chef
 * GET /api/recipes/chef/:chefId/published
 */
export async function getChefPublishedRecipes(chefId: string): Promise<Recipe[]> {
  try {
    console.log(`📚 Fetching published recipes from chef: ${chefId}`);
    const response = await apiClient.get<{ recipes: Recipe[] }>(
      `/recipes/chef/${chefId}/published`,
      false,
      20000
    );
    console.log(`✅ Fetched ${response.recipes.length} recipes from chef`);
    return response.recipes;
  } catch (error) {
    console.log('❌ Failed to fetch chef recipes:', error);
    throw error;
  }
}

/**
 * Get all published courses from chefs
 * GET /api/courses/published
 */
export async function getPublishedCourses(): Promise<Course[]> {
  try {
    console.log('📚 Fetching published courses');
    const response = await apiClient.get<{ courses: Course[] }>(
      '/courses/published',
      false,
      20000
    );
    console.log(`✅ Fetched ${response.courses.length} published courses`);
    return response.courses;
  } catch (error) {
    console.log('❌ Failed to fetch published courses:', error);
    throw error;
  }
}

/**
 * Get published courses from a specific chef
 * GET /api/courses/chef/:chefId/published
 */
export async function getChefPublishedCourses(chefId: string): Promise<Course[]> {
  try {
    console.log(`📚 Fetching published courses from chef: ${chefId}`);
    const response = await apiClient.get<{ courses: Course[] }>(
      `/courses/chef/${chefId}/published`,
      false,
      20000
    );
    console.log(`✅ Fetched ${response.courses.length} courses from chef`);
    return response.courses;
  } catch (error) {
    console.log('❌ Failed to fetch chef courses:', error);
    throw error;
  }
}
