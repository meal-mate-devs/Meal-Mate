import { apiClient } from '../api/client';

export interface PantryItem {
  id: string;
  name: string;
  category: string; // Now stored as string name instead of object
  quantity: number;
  unit: string;
  expiryDate: string;
  addedDate: string;
  barcode?: string;
  confidenceScore?: number;
  detectionMethod: 'manual' | 'ai' | 'barcode';
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  daysUntilExpiry: number;
  expiryStatus: 'active' | 'expiring' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface PantryResponse {
  success: boolean;
  items: PantryItem[];
  counts: {
    active: number;
    expiring: number;
    expired: number;
    total: number;
  };
}

export interface AddPantryItemData {
  name: string;
  categoryId: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  imageUri?: string; // For ingredient detection only, not saved to DB
  barcode?: string;
  confidenceScore?: number;
  detectionMethod?: 'manual' | 'ai' | 'barcode';
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
}

export interface UpdatePantryItemData extends Partial<AddPantryItemData> {
  id: string;
}

class PantryService {
  /**
   * Get all pantry items for the authenticated user
   * @param params Query parameters for filtering
   * @returns Promise<PantryResponse>
   */
  async getPantryItems(params?: {
    status?: 'active' | 'expiring' | 'expired';
    category?: string;
    search?: string;
  }): Promise<PantryResponse> {
    try {
      const response = await apiClient.get<PantryResponse>('/pantry/items', true);
      return response;
    } catch (error) {
      throw new Error('Failed to fetch pantry items');
    }
  }

  /**
   * Add a new pantry item
   * @param itemData The pantry item data
   * @returns Promise<{ success: boolean; item: PantryItem }>
   */
  async addPantryItem(itemData: AddPantryItemData): Promise<{ success: boolean; item: PantryItem }> {
    try {
      // Filter out imageUri before sending to backend (used only for ingredient detection)
      const { imageUri, ...dataForBackend } = itemData;
      
      // Use regular JSON request (no image handling in backend)
      return await apiClient.post<{ success: boolean; item: PantryItem }>('/pantry/items', dataForBackend, true);
    } catch (error) {
      throw new Error('Failed to add pantry item');
    }
  }

  /**
   * Update an existing pantry item
   * @param itemData The updated pantry item data
   * @returns Promise<{ success: boolean; item: PantryItem }>
   */
  async updatePantryItem(itemData: UpdatePantryItemData): Promise<{ success: boolean; item: PantryItem }> {
    try {
      const { id, ...updateData } = itemData;
      
      // Use regular JSON request (no image handling)
      return await apiClient.put<{ success: boolean; item: PantryItem }>(`/pantry/items/${id}`, updateData, true);
    } catch (error) {
      throw new Error('Failed to update pantry item');
    }
  }

  /**
   * Delete a pantry item
   * @param id The pantry item ID
   * @returns Promise<{ success: boolean; message: string }>
   */
  async deletePantryItem(id: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.delete<{ success: boolean; message: string }>(`/pantry/items/${id}`, true);
    } catch (error) {
      throw new Error('Failed to delete pantry item');
    }
  }

  /**
   * Get all available categories
   * @returns Promise<{ success: boolean; categories: Category[] }>
   */
  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    try {
      return await apiClient.get<{ success: boolean; categories: Category[] }>('/pantry/categories', false);
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  // Helper methods (these would normally be in the apiClient)
  private async getAuthToken(): Promise<string | null> {
    try {
      const { auth } = await import('../config/clientApp');
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      return null;
    }
  }

  private getBaseUrl(): string {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
}

export const pantryService = new PantryService();