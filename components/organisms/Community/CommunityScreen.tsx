"use client"

import type { Comment, Post, User } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useRef, useState } from "react"
import {
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

import { INITIAL_POSTS } from "@/lib/utils"
import CreatePostDrawer from "./CreactPostDrawer"
import LeaderboardScreen from "./LeaderBoardSection"
import OtherUsersProfileModel from "./OtherUsersProfileModel"
import PostItem from "./Post"
import PostDetailModel from "./PostDetailModel"

const CURRENT_USER: User = {
    id: "current-user",
    name: "You",
    username: "you",
    avatar: require("../../../assets/images/avatar.png"),
}


export default function CommunityScreen(): JSX.Element {
    const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [showUserProfile, setShowUserProfile] = useState<boolean>(false)
    const [selectedPost, setSelectedPost] = useState<Post | null>(null)
    const [showRecipeDetail, setShowRecipeDetail] = useState<boolean>(false)
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false)

    const scrollY = useRef(new Animated.Value(0)).current

    const handleLike = (postId: string): void => {
        setPosts(
            posts.map((post) => {
                if (post.id === postId) {
                    return {
                        ...post,
                        likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                        isLiked: !post.isLiked,
                    }
                }
                return post
            }),
        )
    }

    const handleSavePost = (postId: string): void => {
        setPosts(
            posts.map((post) =>
                post.id === postId
                    ? { ...post, isSaved: !post.isSaved, saves: post.isSaved ? post.saves - 1 : post.saves + 1 }
                    : post,
            ),
        )
    }

    const handleAddComment = (postId: string, commentText: string): void => {
        const newComment: Comment = {
            id: Date.now().toString(),
            author: CURRENT_USER,
            text: commentText,
            timeAgo: "Just now",
        }

        setPosts(
            posts.map((post) => {
                if (post.id === postId) {
                    return {
                        ...post,
                        comments: post.comments + 1,
                        commentsList: [...(post.commentsList || []), newComment],
                    }
                }
                return post
            }),
        )
    }

    const onRefresh = (): void => {
        setRefreshing(true)
        setTimeout(() => {
            setRefreshing(false)
        }, 1500)
    }

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50, 100],
        outputRange: [1, 0.8, 0],
        extrapolate: "clamp",
    })

    const handleUserPress = (user: User): void => {
        setSelectedUser(user)
        setShowUserProfile(true)
    }

    const handleCreatePost = (data: any): void => {
        const newPost: Post = {
            id: Date.now().toString(),
            author: CURRENT_USER,
            timeAgo: "Just now",
            content: data.content,
            images: data.images,
            likes: 0,
            comments: 0,
            saves: 0,
            isLiked: false,
            isSaved: false,
            commentsList: [],
            recipeDetails: data.recipeDetails,
        }

        setPosts([newPost, ...posts])
    }

    const handleViewRecipe = (post: Post): void => {
        setSelectedPost(post)
        setShowRecipeDetail(true)
    }

    const renderPost: ListRenderItem<Post> = ({ item }) => (
        <PostItem
            post={item}
            currentUser={CURRENT_USER}
            onLike={handleLike}
            onSave={handleSavePost}
            onUserPress={handleUserPress}
            onViewRecipe={handleViewRecipe}
            onAddComment={handleAddComment}
        />
    )

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
                    <Animated.View style={{ opacity: headerOpacity }} className="pt-16 px-4 pb-4">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-white text-2xl font-bold">Recipe Community</Text>
                            <TouchableOpacity
                                className="bg-zinc-800 rounded-full p-2 border border-zinc-700"
                                onPress={() => setShowLeaderboard(true)}
                            >
                                <Ionicons name="trophy" size={20} color="#FBBF24" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <TouchableOpacity
                        className="mx-4 mb-4 bg-zinc-800 rounded-xl p-4 border border-zinc-700"
                        onPress={() => setShowCreateDrawer(true)}
                    >
                        <View className="flex-row items-center">
                            <Image source={CURRENT_USER.avatar} className="w-10 h-10 rounded-full border border-yellow-400" />
                            <Text className="text-zinc-400 ml-3 flex-1">Share your recipe or cooking tip...</Text>
                            <Ionicons name="camera-outline" size={20} color="#FBBF24" />
                        </View>
                    </TouchableOpacity>

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
                </KeyboardAvoidingView>

                <CreatePostDrawer
                    visible={showCreateDrawer}
                    onClose={() => setShowCreateDrawer(false)}
                    onCreatePost={handleCreatePost}
                    userAvatar={CURRENT_USER.avatar}
                />

                <OtherUsersProfileModel
                    visible={showUserProfile}
                    user={selectedUser}
                    onClose={() => setShowUserProfile(false)}
                    currentUserId={CURRENT_USER.id}
                />

                <PostDetailModel visible={showRecipeDetail} post={selectedPost} onClose={() => setShowRecipeDetail(false)} />
            </LinearGradient>
        </View>
    )
}
