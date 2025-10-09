"use client"

import type { Comment, Post, User } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useEffect, useRef, useState } from "react"
import {
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
    type ListRenderItem
} from "react-native"

import { useAuthContext } from "@/context/authContext"
import CommunityAPI from "@/lib/services/community.service"
import EmptyState from "../../atoms/EmptyState"
import PostSkeleton from "../../atoms/PostSkeleton"
import CreatePostDrawer from "./CreactPostDrawer"
import LeaderboardScreen from "./LeaderBoardSection"
import OtherUsersProfileModel from "./OtherUsersProfileModel"
import PostItem from "./Post"
import PostDetailModel from "./PostDetailModel"


export default function CommunityScreen(): JSX.Element {
    const { user, profile } = useAuthContext()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showUserProfile, setShowUserProfile] = useState<boolean>(false)
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [showRecipeDetail, setShowRecipeDetail] = useState<boolean>(false)
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false)

    const scrollY = useRef(new Animated.Value(0)).current

    const currentUser: User = {
        id: user?.uid || "current-user",
        mongoId: profile?._id || '',
        name: profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile?.userName || "You",
        username: profile?.userName || "you",
        avatar: (profile?.profileImage && profile.profileImage.url)
            ? { uri: profile.profileImage.url }
            : require("../../../assets/images/avatar.png"),
    }

    useEffect(() => {
        loadPosts()
    }, [])

    useFocusEffect(
        React.useCallback(() => {
            console.log('Community screen focused, loading posts...');
            loadPosts();
        }, [])
    )

    const loadPosts = async (): Promise<void> => {
        try {
            console.log('Loading posts...');
            setLoading(true)
            const response = await CommunityAPI.getPosts(1, 20, 'latest', 'all')
            console.log('Posts response:', response);

            let postsData = []
            if (response.posts) {
                postsData = response.posts.map((post: any) => ({
                    ...post,
                    id: post._id || post.id,
                    images: post.images || []
                }))
            } else if (response.data) {
                postsData = response.data.map((post: any) => ({
                    ...post,
                    id: post._id || post.id,
                    images: post.images || []
                }))
            } else if (Array.isArray(response)) {
                postsData = response.map((post: any) => ({
                    ...post,
                    id: post._id || post.id,
                    images: post.images || []
                }))
            }

            console.log('Processed posts data:', postsData.length, 'posts');
            setPosts(postsData)
        } catch (error) {
            console.log('Error loading posts:', error)
            setPosts([])
        } finally {
            setLoading(false)
        }
    }

    const handleLike = async (postId: string): Promise<void> => {
        try {
            setPosts(posts.map((post) => {
                if (post.id === postId) {
                    return {
                        ...post,
                        likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                        isLiked: !post.isLiked,
                    }
                }
                return post
            }))

            await CommunityAPI.toggleLikePost(postId)
        } catch (error) {
            console.log('Error toggling like:', error)
            setPosts(posts.map((post) => {
                if (post.id === postId) {
                    return {
                        ...post,
                        likes: post.isLiked ? post.likes + 1 : post.likes - 1,
                        isLiked: !post.isLiked,
                    }
                }
                return post
            }))
            Alert.alert('Error', 'Failed to update like status')
        }
    }

    const handleSavePost = async (postId: string): Promise<void> => {
        try {
            setPosts(posts.map((post) =>
                post.id === postId
                    ? {
                        ...post,
                        isSaved: !post.isSaved,
                        saves: post.isSaved ? post.saves - 1 : post.saves + 1
                    }
                    : post,
            ))

            await CommunityAPI.toggleSavePost(postId)
        } catch (error) {
            console.log('Error saving post:', error)
            setPosts(posts.map((post) =>
                post.id === postId
                    ? {
                        ...post,
                        isSaved: !post.isSaved,
                        saves: post.isSaved ? post.saves + 1 : post.saves - 1
                    }
                    : post,
            ))
            Alert.alert('Error', 'Failed to save post')
        }
    }

    const handleAddComment = async (postId: string, commentText: string): Promise<void> => {
        try {
            const response = await CommunityAPI.addComment(postId, commentText)

            const avatarForComment = (profile?.profileImage && profile.profileImage.url)
                ? profile.profileImage.url
                : "";

            const newComment: Comment = {
                id: response.comment?.id || Date.now().toString(),
                author: {
                    ...currentUser,
                    avatar: avatarForComment
                },
                text: commentText,
                timeAgo: "Just now",
            }

            setPosts(posts.map((post) => {
                if (post.id === postId) {
                    return {
                        ...post,
                        comments: post.comments + 1,
                        commentsList: [...(post.commentsList || []), newComment],
                    }
                }
                return post
            }))
        } catch (error) {
            console.log('Error adding comment:', error)
            Alert.alert('Error', 'Failed to add comment')
        }
    }

    const handleDeletePost = async (postId: string): Promise<void> => {
        try {
            await CommunityAPI.deletePost(postId)
            setPosts(posts.filter(post => post.id !== postId))
        } catch (error) {
            console.log('Error deleting post:', error)
            throw error
        }
    }

    const handleUpdatePost = async (postId: string, updateData: any): Promise<void> => {
        try {
            await CommunityAPI.updatePost(postId, updateData);

            await loadPosts();
        } catch (error) {
            console.error('Error updating post:', error);
            throw error;
        }
    };

    const onRefresh = async (): Promise<void> => {
        console.log('Refreshing posts...');
        setRefreshing(true)
        try {
            await loadPosts()
        } catch (error) {
            console.log('Error during refresh:', error);
        } finally {
            setRefreshing(false)
        }
    }

    const handleUserPress = (user: User): void => {
        setSelectedUser(user)
        setShowUserProfile(true)
    }

    const handleCreatePost = async (data: any): Promise<any> => {
        try {
            const response = await CommunityAPI.createPost(data)

            let processedImages: string[] = [];

            if (response.post?.images && Array.isArray(response.post.images)) {
                processedImages = response.post.images.map((img: any) => {
                    if (typeof img === 'string') return img;
                    if (img?.url) return img.url;
                    return null;
                }).filter(Boolean);
            } else if (data.images && Array.isArray(data.images)) {
                processedImages = data.images.map((img: any) => {
                    if (typeof img === 'string') return img;
                    if (img?.uri) return img.uri;
                    return null;
                }).filter(Boolean);
            }


            const avatarUrl = (profile?.profileImage && profile.profileImage.url) ? profile.profileImage.url : '';

            const newPost: Post = {
                id: response.post?.id || Date.now().toString(),
                author: {
                    ...currentUser,
                    avatar: avatarUrl,
                },
                timeAgo: "Just now",
                content: data.content,
                images: processedImages,
                likes: 0,
                comments: 0,
                saves: 0,
                isLiked: false,
                isSaved: false,
                commentsList: [],
                recipeDetails: data.recipeDetails,
            }

            setPosts([newPost, ...posts])

            return response
        } catch (error) {
            console.error('Error creating post:', error)
            throw error
        }
    }

    const handleViewRecipe = (post: Post): void => {
        setSelectedPost(post)
        setShowRecipeDetail(true)
    }

    const renderPost: ListRenderItem<Post> = ({ item }) => (
        <PostItem
            post={item}
            currentUser={currentUser}
            onLike={handleLike}
            onSave={handleSavePost}
            onUserPress={handleUserPress}
            onViewRecipe={handleViewRecipe}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onUpdatePost={handleUpdatePost}
            loadPosts={loadPosts}
        />
    )

    const renderSkeletonLoader = (): JSX.Element => (
        <View className="px-4">
            {[1, 2, 3].map((item) => (
                <PostSkeleton key={item} />
            ))}
        </View>
    )

    const renderEmptyState = (): JSX.Element => (
        <EmptyState onCreatePost={() => setShowCreateDrawer(true)} />
    )

    const renderContent = (): JSX.Element => {
        if (loading) {
            return renderSkeletonLoader()
        }

        if (posts.length === 0) {
            return renderEmptyState()
        }

        return (
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item: Post) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FBBF24"
                        colors={["#FBBF24", "#F97416"]}
                    />
                }
            />
        )
    }

    if (showLeaderboard) {
        return <LeaderboardScreen onUserPress={handleUserPress} onClose={() => setShowLeaderboard(false)} />
    }

    return (
        <View
            className="bg-black"
            style={{ width: "100%", height: "100%" }}
        >
            <LinearGradient
                colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.7)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, width: "100%", height: "100%" }}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View className="pt-16 px-4 pb-4">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-white text-2xl font-bold">Meal Mate Community</Text>
                            <TouchableOpacity
                                className="bg-zinc-800 rounded-full p-2 border border-zinc-700"
                                onPress={() => setShowLeaderboard(true)}
                            >
                                <Ionicons name="trophy" size={20} color="#FBBF24" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        className="mx-4 mb-4 bg-zinc-800 rounded-xl p-4 border border-zinc-700"
                        onPress={() => setShowCreateDrawer(true)}
                    >
                        <View className="flex-row items-center">
                            <Image source={currentUser.avatar} className="w-10 h-10 rounded-full border border-yellow-400" />
                            <Text className="text-zinc-400 ml-3 flex-1">Share your recipe or cooking tip...</Text>
                            <Ionicons name="camera-outline" size={20} color="#FBBF24" />
                        </View>
                    </TouchableOpacity>

                    {renderContent()}
                </KeyboardAvoidingView>

                <CreatePostDrawer
                    visible={showCreateDrawer}
                    onClose={() => setShowCreateDrawer(false)}
                    onCreatePost={handleCreatePost}
                    userAvatar={currentUser.avatar}
                />

                <OtherUsersProfileModel
                    visible={showUserProfile}
                    user={selectedUser}
                    onClose={() => setShowUserProfile(false)}
                    currentUserId={currentUser.mongoId}
                />

                <PostDetailModel currentUserId={currentUser.mongoId} visible={showRecipeDetail} post={selectedPost} onClose={() => setShowRecipeDetail(false)} />
            </LinearGradient>
        </View>
    )
}
