import { apiClient } from '../api/client';

class CommunityService {
    private normalizeId(item: any) {
        if (!item) return item;
        if (item._id && !item.id) return { ...item, id: item._id };
        return item;
    }


    async getPosts(page = 1, limit = 10, sort = 'latest', filter = 'all') {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sort,
            filter,
        });

        const res = await apiClient.get<any>(`/community/posts?${params}`, true);
        if (res && res.posts) res.posts = res.posts.map((p: any) => this.normalizeId(p));
        if (res && res.data) res.data = res.data.map((p: any) => this.normalizeId(p));
        console.log("-----------------------------------------------")
        console.log("Posts response:", res.posts[0]);
        console.log("-----------------------------------------------")
        return res;
    }

    async getPostById(postId: string) {
        return await apiClient.get<any>(`/community/posts/${postId}`, true);
    }

    async createPost(postData: any) {
        const formData = new FormData();
        formData.append('content', postData.content);
        if (postData.postType) formData.append('postType', postData.postType);
        if (postData.recipeDetails) formData.append('recipeDetails', JSON.stringify(postData.recipeDetails));

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

        const data = await apiClient.postForm<any>(`/community/posts`, formData, true);
        if (data.post) data.post = this.normalizeId(data.post);
        return data;
    }

    async updatePost(postId: string, updateData: any) {
        return await apiClient.put<any>(`/community/posts/${postId}`, updateData, true);
    }

    async deletePost(postId: string) {
        return await apiClient.delete<any>(`/community/posts/${postId}`, true);
    }

    async toggleLikePost(postId: string) {
        return await apiClient.post<any>(`/community/posts/${postId}/like`, {}, true);
    }

    async toggleSavePost(postId: string) {
        return await apiClient.post<any>(`/community/posts/${postId}/save`, {}, true);
    }

    async getComments(postId: string, page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return await apiClient.get<any>(`/community/posts/${postId}/comments?${params}`, false);
    }

    async addComment(postId: string, content: string) {
        return await apiClient.post<any>(`/community/posts/${postId}/comments`, { content }, true);
    }

    async toggleLikeComment(commentId: string) {
        return await apiClient.post<any>(`/community/comments/${commentId}/like`, {}, true);
    }

    async deleteComment(commentId: string) {
        return await apiClient.delete<any>(`/community/comments/${commentId}`, true);
    }

    async getUserProfile(userId: string) {
        return await apiClient.get<any>(`/community/users/${userId}`, false);
    }

    async followUser(userId: string) {
        return await apiClient.post<any>(`/community/users/${userId}/follow`, {}, true);
    }

    async getUserPosts(userId: string, page = 1, limit = 10, type = 'all') {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), type });
        return await apiClient.get<any>(`/community/users/${userId}/posts?${params}`, false);
    }

    async getUserSavedPosts() {
        return await apiClient.get<any>(`/community/users/saved-posts`, true);
    }

    async getUserFollowers(userId: string, page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return await apiClient.get<any>(`/community/users/${userId}/followers?${params}`, false);
    }

    async getUserFollowing(userId: string, page = 1, limit = 20) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return await apiClient.get<any>(`/community/users/${userId}/following?${params}`, false);
    }

    async getLeaderboard(period = 'monthly', limit = 50) {
        const params = new URLSearchParams({ period, limit: limit.toString() });
        return await apiClient.get<any>(`/community/leaderboard?${params}`, false);
    }

    async searchContent(query: string, type = 'all', page = 1, limit = 20, filters?: any) {
        const params = new URLSearchParams({
            q: query,
            type,
            page: page.toString(),
            limit: limit.toString(),
            ...(filters?.category && { category: filters.category }),
            ...(filters?.difficulty && { difficulty: filters.difficulty }),
            ...(filters?.tags && { tags: filters.tags.join(',') }),
        });
        return await apiClient.get<any>(`/community/search?${params}`, false);
    }

    async getTrendingContent() {
        return await apiClient.get<any>('/community/trending', false);
    }

    async getPersonalizedFeed(page = 1, limit = 15) {
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
        return await apiClient.get<any>(`/community/feed?${params}`, true);
    }

    async getRecommendations() {
        return await apiClient.get<any>('/community/recommendations', true);
    }
}

export const communityService = new CommunityService();

// Backwards-compatible default export (original code expected CommunityAPI object)
const CommunityAPI = {
    getPosts: communityService.getPosts.bind(communityService),
    getPostById: communityService.getPostById.bind(communityService),
    createPost: communityService.createPost.bind(communityService),
    updatePost: communityService.updatePost.bind(communityService),
    deletePost: communityService.deletePost.bind(communityService),
    toggleLikePost: communityService.toggleLikePost.bind(communityService),
    toggleSavePost: communityService.toggleSavePost.bind(communityService),
    getComments: communityService.getComments.bind(communityService),
    addComment: communityService.addComment.bind(communityService),
    toggleLikeComment: communityService.toggleLikeComment.bind(communityService),
    deleteComment: communityService.deleteComment.bind(communityService),
    getUserProfile: communityService.getUserProfile.bind(communityService),
    followUser: communityService.followUser.bind(communityService),
    getUserPosts: communityService.getUserPosts.bind(communityService),
    getUserSavedPosts: communityService.getUserSavedPosts.bind(communityService),
    getUserFollowers: communityService.getUserFollowers.bind(communityService),
    getUserFollowing: communityService.getUserFollowing.bind(communityService),
    getLeaderboard: communityService.getLeaderboard.bind(communityService),
    searchContent: communityService.searchContent.bind(communityService),
    getTrendingContent: communityService.getTrendingContent.bind(communityService),
    getPersonalizedFeed: communityService.getPersonalizedFeed.bind(communityService),
    getRecommendations: communityService.getRecommendations.bind(communityService),
};

export default CommunityAPI;
