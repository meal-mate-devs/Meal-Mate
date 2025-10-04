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
                // Default Content-Type is application/json, but if body is FormData we must NOT set it
                ...options.headers as Record<string, string>,
            };

            const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

            // Log request details for debugging
            console.log(`API Request to ${endpoint}:`, {
                method: options.method,
                isFormData,
                hasBody: !!options.body
            });

            if (!isFormData && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }

            // IMPORTANT: When using FormData, do NOT set Content-Type header
            // The browser/fetch will set it with the proper boundary
            if (isFormData && headers['Content-Type']) {
                console.log('Removing Content-Type for FormData request');
                delete headers['Content-Type'];
            }

            if (requireAuth) {
                const token = await this.getAuthToken();
                if (!token) {
                    throw new Error('Authentication required but user not authenticated');
                }
                headers['Authorization'] = `Bearer ${token}`;
                console.log('Added Authorization header');
            }

            const fetchOptions: RequestInit = { ...options, headers };

            if (fetchOptions.body && !isFormData && typeof fetchOptions.body !== 'string') {
                try {
                    fetchOptions.body = JSON.stringify(fetchOptions.body);
                    console.log('📤 Stringified request body:', fetchOptions.body);
                } catch (e) {
                    console.warn('Could not stringify request body:', e);
                }
            }

            console.log(`Fetching ${API_BASE_URL}${endpoint}`);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
            console.log(`Response status: ${response.status}`);

            // Handle 401 specifically for auth refresh
            if (response.status === 401 && requireAuth) {
                console.log('Got 401, refreshing token');
                const user = auth.currentUser;
                if (user) {
                    const freshToken = await user.getIdToken(true);
                    console.log('Token refreshed, retrying request');

                    // For FormData requests, we need special handling on retry
                    if (isFormData) {
                        console.log('FormData request needs special retry handling');
                        // We can't reuse FormData, so we need the caller to handle this
                        throw new Error('Token expired. Please try again.');
                    }

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
                console.log(`API Error: ${response.status}`, errorText);
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
            body: data,
        }, requireAuth);
    }

    async postForm<T>(endpoint: string, formData: FormData, requireAuth: boolean = true): Promise<T> {
        console.log(`postForm to ${endpoint}: Starting request`);
        try {
            // Note: We're explicitly NOT setting Content-Type header for FormData
            // The browser/fetch API will set it with correct boundary automatically
            const result = await this.request<T>(endpoint, {
                method: 'POST',
                body: formData,
            }, requireAuth);
            console.log(`postForm to ${endpoint}: Success`);
            return result;
        } catch (error) {
            console.log(`postForm to ${endpoint}: Error`, error);
            throw error;
        }
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