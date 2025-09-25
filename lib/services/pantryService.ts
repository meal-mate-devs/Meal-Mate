import { apiClient } from '../api/client';

export interface PantryItem {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  quantity: number;
  unit: string;
  expiryDate: string;
  addedDate: string;
  image?: {
    url: string;
    publicId: string;
  };
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
  imageUri?: string;
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
      console.error('Error fetching pantry items:', error);
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
      // If there's an image, we need to use FormData
      if (itemData.imageUri) {
        const formData = new FormData();
        
        // Add the image file
        formData.append('image', {
          uri: itemData.imageUri,
          type: 'image/jpeg',
          name: 'pantry-item.jpg',
        } as any);

        // Add other fields
        formData.append('name', itemData.name);
        formData.append('categoryId', itemData.categoryId);
        formData.append('quantity', itemData.quantity.toString());
        formData.append('unit', itemData.unit);
        formData.append('expiryDate', itemData.expiryDate);
        
        if (itemData.barcode) formData.append('barcode', itemData.barcode);
        if (itemData.confidenceScore) formData.append('confidenceScore', itemData.confidenceScore.toString());
        if (itemData.detectionMethod) formData.append('detectionMethod', itemData.detectionMethod);
        if (itemData.nutritionalInfo) formData.append('nutritionalInfo', JSON.stringify(itemData.nutritionalInfo));

        // Use fetch directly for FormData
        const token = await this.getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${this.getBaseUrl()}/pantry/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      } else {
        // No image, use regular JSON request
        const { imageUri, ...dataWithoutImage } = itemData;
        return await apiClient.post<{ success: boolean; item: PantryItem }>('/pantry/items', dataWithoutImage, true);
      }
    } catch (error) {
      console.error('Error adding pantry item:', error);
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

      // If there's an image, use FormData
      if (updateData.imageUri) {
        const formData = new FormData();
        
        // Add the image file
        formData.append('image', {
          uri: updateData.imageUri,
          type: 'image/jpeg',
          name: 'pantry-item.jpg',
        } as any);

        // Add other fields that are not undefined
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && key !== 'imageUri') {
            if (key === 'nutritionalInfo') {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        // Use fetch directly for FormData
        const token = await this.getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${this.getBaseUrl()}/pantry/items/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      } else {
        // No image, use regular JSON request
        const { imageUri, ...dataWithoutImage } = updateData;
        return await apiClient.put<{ success: boolean; item: PantryItem }>(`/pantry/items/${id}`, dataWithoutImage, true);
      }
    } catch (error) {
      console.error('Error updating pantry item:', error);
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
      console.error('Error deleting pantry item:', error);
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
      console.error('Error fetching categories:', error);
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
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private getBaseUrl(): string {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
}

export const pantryService = new PantryService();