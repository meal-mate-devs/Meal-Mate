// api/client.ts

import { auth } from "../config/clientApp";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
    private async getAuthToken(): Promise<string | null> {
        try {
            const user = auth.currentUser;
            if (!user) {
                return null;
            }
            return await user.getIdToken();
        } catch (error) {
            console.log('Failed to get auth token:', error);
            return null;
        }
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        requireAuth: boolean = true
    ): Promise<T> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...options.headers as Record<string, string>,
            };

            if (requireAuth) {
                const token = await this.getAuthToken();
                if (!token) {
                    throw new Error('Authentication required but user not authenticated');
                }
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            // Handle 401 specifically for auth refresh
            if (response.status === 401 && requireAuth) {
                const user = auth.currentUser;
                if (user) {
                    const freshToken = await user.getIdToken(true);
                    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                        ...options,
                        headers: {
                            ...headers,
                            'Authorization': `Bearer ${freshToken}`,
                        },
                    });

                    if (!retryResponse.ok) {
                        const errorText = await retryResponse.text();
                        throw new Error(`API Error: ${retryResponse.status} - ${errorText}`);
                    }
                    return await retryResponse.json();
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.log('API Request failed:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' }, requireAuth);
    }

    async post<T>(endpoint: string, data: any, requireAuth: boolean = true): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }, requireAuth);
    }

    async put<T>(endpoint: string, data: any, requireAuth: boolean = true): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, requireAuth);
    }

    async delete<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' }, requireAuth);
    }
}

export const apiClient = new ApiClient();