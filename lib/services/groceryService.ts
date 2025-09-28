import { apiClient } from '../api/client';

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

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface GroceryResponse {
  success: boolean;
  items: GroceryItem[];
  counts: {
    total: number;
    pending: number;
    purchased: number;
    urgent: number;
    overdue: number;
  };
}

export interface AddGroceryItemData {
  name: string;
  quantity: number;
  unit: string;
  urgency: 'normal' | 'urgent';
  purchaseDate: string;
  notes?: string;
}

export interface UpdateGroceryItemData extends Partial<AddGroceryItemData> {
  id: string;
}

export interface PurchaseItemData {
  quantity: number;
  unit: string;
  categoryId: string;
  expiryDate: string;
}

class GroceryService {
  /**
   * Get all grocery items for the authenticated user
   * @param params Query parameters for filtering
   * @returns Promise<GroceryResponse>
   */
  async getGroceryItems(params?: {
    status?: 'purchased' | 'pending' | 'urgent';
    urgency?: 'normal' | 'urgent';
    search?: string;
  }): Promise<GroceryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.urgency) queryParams.append('urgency', params.urgency);
      if (params?.search) queryParams.append('search', params.search);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/grocery/items?${queryString}` : '/grocery/items';
      
      const response = await apiClient.get<GroceryResponse>(endpoint, true);
      return response;
    } catch (error) {
      throw new Error('Failed to fetch grocery items');
    }
  }

  /**
   * Add a new grocery item
   * @param itemData The grocery item data
   * @returns Promise<{ success: boolean; item: GroceryItem }>
   */
  async addGroceryItem(itemData: AddGroceryItemData): Promise<{ success: boolean; item: GroceryItem }> {
    try {
      return await apiClient.post<{ success: boolean; item: GroceryItem }>('/grocery/items', itemData, true);
    } catch (error) {
      throw new Error('Failed to add grocery item');
    }
  }

  /**
   * Update an existing grocery item
   * @param itemData The updated grocery item data
   * @returns Promise<{ success: boolean; item: GroceryItem }>
   */
  async updateGroceryItem(itemData: UpdateGroceryItemData): Promise<{ success: boolean; item: GroceryItem }> {
    try {
      const { id, ...updateData } = itemData;
      
      return await apiClient.put<{ success: boolean; item: GroceryItem }>(`/grocery/items/${id}`, updateData, true);
    } catch (error) {
      throw new Error('Failed to update grocery item');
    }
  }

  /**
   * Delete a grocery item
   * @param id The grocery item ID
   * @returns Promise<{ success: boolean; message: string }>
   */
  async deleteGroceryItem(id: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.delete<{ success: boolean; message: string }>(`/grocery/items/${id}`, true);
    } catch (error) {
      throw new Error('Failed to delete grocery item');
    }
  }

  /**
   * Mark grocery item as purchased and move to pantry
   * @param id The grocery item ID
   * @param purchaseData The purchase completion data
   * @returns Promise<{ success: boolean; message: string; groceryItem: GroceryItem; pantryItem: any }>
   */
  async markAsPurchased(
    id: string, 
    purchaseData: PurchaseItemData
  ): Promise<{ 
    success: boolean; 
    message: string; 
    groceryItem: GroceryItem; 
    pantryItem: any 
  }> {
    try {
      return await apiClient.post<{ 
        success: boolean; 
        message: string; 
        groceryItem: GroceryItem; 
        pantryItem: any 
      }>(`/grocery/items/${id}/purchase`, purchaseData, true);
    } catch (error) {
      throw new Error('Failed to mark item as purchased');
    }
  }

  /**
   * Get all available categories
   * @returns Promise<{ success: boolean; categories: Category[] }>
   */
  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    try {
      return await apiClient.get<{ success: boolean; categories: Category[] }>('/grocery/categories', false);
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }
}

export const groceryService = new GroceryService();