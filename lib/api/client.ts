// api/client.ts

import { auth } from "../config/clientApp";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
    private async getAuthToken(): Promise<string> {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }
        return await user.getIdToken();
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        try {
            const token = await this.getAuthToken();

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                const freshToken = await auth.currentUser?.getIdToken(true);
                if (freshToken) {
                    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${freshToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`API Error: ${retryResponse.status}`);
                    }
                    return await retryResponse.json();
                }
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();



// how to use this service in the fornt-end
// useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//         if (user) {
//             try {
//                 const userProfile = await apiClient.get<UserProfile>('/api/user/profile');
//                 setProfile(userProfile);
//             } catch (error) {
//                 console.error('Failed to fetch profile:', error);
//             }
//         } else {
//             setProfile(null);
//         }
//         setLoading(false);
//     });

//     return unsubscribe;
// }, []);
