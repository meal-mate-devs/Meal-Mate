import { auth } from '@/lib/config/clientApp';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthToken = async () => {
    if (!auth.currentUser) {
        return null;
    }
    return await auth.currentUser.getIdToken();
};

const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    const response = await Promise.race([
        fetch(`${API_BASE_URL}${endpoint}`, config),
        timeoutPromise
    ]) as Response;

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
};

const makeAuthRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getAuthToken();
    return makeRequest(endpoint, {
        ...options,
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    });
};

export const getPosts = async (page = 1, limit = 10, sort = 'latest', filter = 'all', userId?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        filter,
        ...(userId && { userId })
    });

    const endpoint = `/community/posts?${params}`;
    console.log('Fetching posts from:', `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}${endpoint}`);

    return await makeRequest(endpoint);
};

export const getPostById = async (postId: string) => {
    return await makeAuthRequest(`/community/posts/${postId}`);
};

export const createPost = async (postData: any) => {
    const formData = new FormData();

    formData.append('content', postData.content);

    if (postData.postType) {
        formData.append('postType', postData.postType);
    }

    if (postData.recipeDetails) {
        formData.append('recipeDetails', JSON.stringify(postData.recipeDetails));
    }

    if (postData.images && postData.images.length > 0) {
        postData.images.forEach((image: any, index: number) => {
            formData.append('images', {
                uri: image.uri,
                type: image.type || 'image/jpeg',
                name: image.name || `image_${index}.jpg`,
            } as any);
        });
    }

    if (postData.imageUrls && postData.imageUrls.length > 0) {
        formData.append('images', JSON.stringify(postData.imageUrls));
    }

    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create post');
    }

    return await response.json();
};
export const updatePost = async (postId: string, updateData: any) => {
    return await makeAuthRequest(`/community/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
};

export const deletePost = async (postId: string) => {
    return await makeAuthRequest(`/community/posts/${postId}`, {
        method: 'DELETE',
    });
};

export const toggleLikePost = async (postId: string) => {
    return await makeAuthRequest(`/community/posts/${postId}/like`, {
        method: 'POST',
    });
};

export const toggleSavePost = async (postId: string) => {
    return await makeAuthRequest(`/community/posts/${postId}/save`, {
        method: 'POST',
    });
};

export const getComments = async (postId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    return await makeRequest(`/community/posts/${postId}/comments?${params}`);
};

export const addComment = async (postId: string, content: string) => {
    return await makeAuthRequest(`/community/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
};

export const toggleLikeComment = async (commentId: string) => {
    return await makeAuthRequest(`/community/comments/${commentId}/like`, {
        method: 'POST',
    });
};

export const deleteComment = async (commentId: string) => {
    return await makeAuthRequest(`/community/comments/${commentId}`, {
        method: 'DELETE',
    });
};

export const getUserProfile = async (userId: string) => {
    return await makeRequest(`/community/users/${userId}`);
};

export const followUser = async (userId: string) => {
    return await makeAuthRequest(`/community/users/${userId}/follow`, {
        method: 'POST',
    });
};

export const getUserPosts = async (userId: string, page = 1, limit = 10, type = 'all') => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type
    });

    return await makeRequest(`/community/users/${userId}/posts?${params}`);
};

export const getUserSavedPosts = async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('User not authenticated');
    }

    return await makeAuthRequest(`/community/users/${currentUser.uid}/saved-posts?${params}`);
};

export const getUserFollowers = async (userId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    return await makeRequest(`/community/users/${userId}/followers?${params}`);
};

export const getUserFollowing = async (userId: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    return await makeRequest(`/community/users/${userId}/following?${params}`);
};

export const getLeaderboard = async (period = 'monthly', limit = 50) => {
    const params = new URLSearchParams({
        period,
        limit: limit.toString()
    });

    return await makeRequest(`/community/leaderboard?${params}`);
};

export const searchContent = async (query: string, type = 'all', page = 1, limit = 20, filters?: any) => {
    const params = new URLSearchParams({
        q: query,
        type,
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.difficulty && { difficulty: filters.difficulty }),
        ...(filters?.tags && { tags: filters.tags.join(',') })
    });

    return await makeRequest(`/community/search?${params}`);
};

export const getTrendingContent = async () => {
    return await makeRequest('/community/trending');
};

export const getPersonalizedFeed = async (page = 1, limit = 15) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    return await makeAuthRequest(`/community/feed?${params}`);
};

export const getRecommendations = async () => {
    return await makeAuthRequest('/community/recommendations');
};

const CommunityAPI = {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    toggleLikePost,
    toggleSavePost,
    getComments,
    addComment,
    toggleLikeComment,
    deleteComment,
    getUserProfile,
    followUser,
    getUserPosts,
    getUserSavedPosts,
    getUserFollowers,
    getUserFollowing,
    getLeaderboard,
    searchContent,
    getTrendingContent,
    getPersonalizedFeed,
    getRecommendations,
};

export default CommunityAPI;