"use client"

import { Comment, Post, User } from "@/lib/types"
import { INITIAL_POSTS } from "@/lib/utils"
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
    TextInput,
    TouchableOpacity,
    View,
    type ListRenderItem
} from "react-native"
import PostItem from "../atoms/Post"
const CURRENT_USER: User = {
    id: "current-user",
    name: "You",
    username: "you",
    avatar: require("../../assets/images/avatar.png"),
}



export default function CommunityScreen(): JSX.Element {
    const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS)
    const [newPostText, setNewPostText] = useState<string>("")
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [showComments, setShowComments] = useState<Record<string, boolean>>({})
    const [commentText, setCommentText] = useState<string>("")

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

    const toggleComments = (postId: string): void => {
        setShowComments((prev) => ({
            ...prev,
            [postId]: !prev[postId],
        }))
    }

    const handleAddComment = (postId: string): void => {
        if (commentText.trim()) {
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
            setCommentText("")
        }
    }

    const handleCreatePost = (): void => {
        if (newPostText.trim()) {
            const newPost: Post = {
                id: Date.now().toString(),
                author: CURRENT_USER,
                timeAgo: "Just now",
                content: newPostText,
                likes: 0,
                comments: 0,
                isLiked: false,
                commentsList: [],
            }

            setPosts([newPost, ...posts])
            setNewPostText("")
        }
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

    const renderPost: ListRenderItem<Post> = ({ item }) => (
        <PostItem
            post={item}
            showComments={showComments}
            handleLike={handleLike}
            toggleComments={toggleComments}
            handleAddComment={handleAddComment}
            commentText={commentText}
            setCommentText={setCommentText}

        />
    )

    return (
        <View className="flex-1 bg-black">

            <LinearGradient
                colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.7)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, width: "100%", height: "100%" }}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    {/* <Animated.View style={{ opacity: headerOpacity }} className="pt-12 px-4 pb-2">
                        <Text className="text-center text-white text-2xl font-bold">Recipe Community</Text>
                    </Animated.View> */}

                    <View className="px-4 py-3 bg-zinc-800 mx-4 rounded-xl mb-4 border border-zinc-700 pt-12 pb-2 mt-14">
                        <View className="flex-row items-center">
                            <Image source={CURRENT_USER.avatar} className="w-10 h-10 rounded-full border border-yellow-400" />
                            <TextInput
                                className="flex-1 bg-zinc-700 rounded-full ml-3 px-4 py-2 text-white"
                                placeholder="Share your recipe or cooking tip..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                value={newPostText}
                                onChangeText={setNewPostText}
                            />
                        </View>

                        <View className="flex-row justify-between mt-3">
                            <View className="flex-row">
                                <TouchableOpacity className="flex-row items-center mr-4">
                                    <Ionicons name="image-outline" size={20} color="#FFFFFF" />
                                    <Text className="text-white ml-2">Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity className="flex-row items-center">
                                    <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
                                    <Text className="text-white ml-2">Recipe</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className="rounded-full overflow-hidden"
                                onPress={handleCreatePost}
                                disabled={!newPostText.trim()}
                            >
                                <LinearGradient
                                    colors={["#FBBF24", "#F97416"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="px-4 py-2"
                                >
                                    <Text className="text-white font-bold">Post</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={posts}
                        renderItem={renderPost}
                        keyExtractor={(item: Post) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
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
            </LinearGradient>
        </View>
    )
}
