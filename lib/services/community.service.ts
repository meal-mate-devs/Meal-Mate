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

export const getPostById = async (postId: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';
    return await makeAuthRequest(`/community/posts/${postId}${queryString}`);
};

export const createPost = async (postData: any, userId?: string) => {
    const formData = new FormData();

    formData.append('content', postData.content);

    if (postData.postType) {
        formData.append('postType', postData.postType);
    }

    if (postData.recipeDetails) {
        formData.append('recipeDetails', JSON.stringify(postData.recipeDetails));
    }

    if (userId) {
        formData.append('userId', userId);
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
export const updatePost = async (postId: string, updateData: any, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';
    return await makeAuthRequest(`/community/posts/${postId}${queryString}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
};

export const deletePost = async (postId: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';
    return await makeAuthRequest(`/community/posts/${postId}${queryString}`, {
        method: 'DELETE',
    });
};

export const toggleLikePost = async (postId: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';
    return await makeAuthRequest(`/community/posts/${postId}/like${queryString}`, {
        method: 'POST',
    });
};

export const toggleSavePost = async (postId: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';
    return await makeAuthRequest(`/community/posts/${postId}/save${queryString}`, {
        method: 'POST',
    });
};

export const getComments = async (postId: string, page = 1, limit = 20, userId?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(userId && { userId })
    });

    return await makeRequest(`/community/posts/${postId}/comments?${params}`);
};

export const addComment = async (postId: string, content: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeAuthRequest(`/community/posts/${postId}/comments${queryString}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    });
};

export const toggleLikeComment = async (commentId: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeAuthRequest(`/community/comments/${commentId}/like${queryString}`, {
        method: 'POST',
    });
};

export const deleteComment = async (commentId: string, userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeAuthRequest(`/community/comments/${commentId}${queryString}`, {
        method: 'DELETE',
    });
};

export const getUserProfile = async (userId: string, currentUserId?: string) => {
    const params = new URLSearchParams({
        ...(currentUserId && { userId: currentUserId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeRequest(`/community/users/${userId}${queryString}`);
};

export const followUser = async (userId: string, currentUserId?: string) => {
    const params = new URLSearchParams({
        ...(currentUserId && { userId: currentUserId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeAuthRequest(`/community/users/${userId}/follow${queryString}`, {
        method: 'POST',
    });
};

export const getUserPosts = async (userId: string, page = 1, limit = 10, type = 'all', currentUserId?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type,
        ...(currentUserId && { userId: currentUserId })
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

export const getUserFollowers = async (userId: string, page = 1, limit = 20, currentUserId?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(currentUserId && { userId: currentUserId })
    });

    return await makeRequest(`/community/users/${userId}/followers?${params}`);
};

export const getUserFollowing = async (userId: string, page = 1, limit = 20, currentUserId?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(currentUserId && { userId: currentUserId })
    });

    return await makeRequest(`/community/users/${userId}/following?${params}`);
};

export const getLeaderboard = async (period = 'monthly', limit = 50, userId?: string) => {
    const params = new URLSearchParams({
        period,
        limit: limit.toString(),
        ...(userId && { userId })
    });

    return await makeRequest(`/community/leaderboard?${params}`);
};

export const searchContent = async (query: string, type = 'all', page = 1, limit = 20, filters?: any, userId?: string) => {
    const params = new URLSearchParams({
        q: query,
        type,
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.difficulty && { difficulty: filters.difficulty }),
        ...(filters?.tags && { tags: filters.tags.join(',') }),
        ...(userId && { userId })
    });

    return await makeRequest(`/community/search?${params}`);
};

export const getTrendingContent = async (userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeRequest(`/community/trending${queryString}`);
};

export const getPersonalizedFeed = async (page = 1, limit = 15, userId?: string) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(userId && { userId })
    });

    return await makeAuthRequest(`/community/feed?${params}`);
};

export const getRecommendations = async (userId?: string) => {
    const params = new URLSearchParams({
        ...(userId && { userId })
    });
    const queryString = params.toString() ? `?${params}` : '';

    return await makeAuthRequest(`/community/recommendations${queryString}`);
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