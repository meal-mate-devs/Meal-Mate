"use client"

import { Post, User } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { JSX } from "react"
import React, { useState } from "react"
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"

interface OtherUsersProfileModelProps {
    visible: boolean
    user: User | null
    onClose: () => void
    currentUserId: string
}

export default function OtherUsersProfileModel({
    visible,
    user,
    onClose,
    currentUserId,
}: OtherUsersProfileModelProps): JSX.Element {
    const [isFollowing, setIsFollowing] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"posts" | "recipes" | "badges">("posts")

    if (!user) return <></>

    const isOwnProfile = user.id === currentUserId

    const handleFollow = (): void => {
        setIsFollowing(!isFollowing)
    }

    const mockUserPosts: Post[] = [
        {
            id: "1",
            author: user,
            timeAgo: "2h ago",
            content: "Just made this amazing pasta dish!",
            images: ["https://images.unsplash.com/photo-1556761223-4c4282c73f77?q=80&w=1000&auto=format&fit=crop"],
            likes: 24,
            comments: 8,
            saves: 5,
            isLiked: false,
            isSaved: false,
        },
        {
            id: "2",
            author: user,
            timeAgo: "1d ago",
            content: "Sharing my grandmother's secret recipe!",
            images: ["https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1000&auto=format&fit=crop"],
            likes: 56,
            comments: 12,
            saves: 18,
            isLiked: true,
            isSaved: false,
        },
    ]

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-zinc-900">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4 pt-12 border-b border-zinc-800">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">{user.name}</Text>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1">
                    {/* Profile Header */}
                    <View className="p-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="relative">
                                    <Image source={user.avatar} className="w-20 h-20 rounded-full border-2 border-yellow-400" />
                                    {user.isVerified && (
                                        <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full items-center justify-center">
                                            <Ionicons name="checkmark" size={16} color="#000000" />
                                        </View>
                                    )}
                                </View>
                                <View className="ml-4">
                                    <View className="flex-row items-center">
                                        <Text className="text-white text-xl font-bold">{user.name}</Text>
                                        {user.rank && user.rank <= 3 && (
                                            <View className="ml-2 px-2 py-1 bg-yellow-400 rounded-full">
                                                <Text className="text-black text-xs font-bold">#{user.rank}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-zinc-400">@{user.username}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="star" size={16} color="#FBBF24" />
                                        <Text className="text-yellow-400 text-sm ml-1">{user.totalLikes || 0} total likes</Text>
                                    </View>
                                </View>
                            </View>

                            {!isOwnProfile && (
                                <TouchableOpacity className="rounded-xl overflow-hidden" onPress={handleFollow}>
                                    <LinearGradient
                                        colors={isFollowing ? ["#6B7280", "#4B5563"] : ["#FBBF24", "#F97416"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="px-6 py-3"
                                    >
                                        <Text className="text-white font-bold">{isFollowing ? "Following" : "Follow"}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Stats */}
                        <View className="flex-row justify-around bg-zinc-800 rounded-xl p-4">
                            <View className="items-center">
                                <Text className="text-white text-xl font-bold">{user.recipeCount || 0}</Text>
                                <Text className="text-zinc-400 text-sm">Recipes</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-white text-xl font-bold">{user.followerCount || 0}</Text>
                                <Text className="text-zinc-400 text-sm">Followers</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-white text-xl font-bold">{user.totalLikes || 0}</Text>
                                <Text className="text-zinc-400 text-sm">Likes</Text>
                            </View>
                            <View className="items-center">
                                <Text className="text-white text-xl font-bold">{user.badges?.length || 0}</Text>
                                <Text className="text-zinc-400 text-sm">Badges</Text>
                            </View>
                        </View>

                        {/* Badges Preview */}
                        {user.badges && user.badges.length > 0 && (
                            <View className="mt-4">
                                <Text className="text-white font-bold mb-2">Recent Badges</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row">
                                        {user.badges.slice(0, 5).map((badge) => (
                                            <View key={badge.id} className="mr-3 items-center">
                                                <View className={`w-12 h-12 rounded-full items-center justify-center bg-${badge.color}-500`}>
                                                    <Text className="text-2xl">{badge.icon}</Text>
                                                </View>
                                                <Text className="text-white text-xs mt-1 text-center">{badge.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Tabs */}
                    <View className="flex-row bg-zinc-800 mx-4 rounded-xl p-1 mb-4">
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg ${activeTab === "posts" ? "bg-yellow-400" : ""}`}
                            onPress={() => setActiveTab("posts")}
                        >
                            <Text className={`text-center font-bold ${activeTab === "posts" ? "text-black" : "text-white"}`}>
                                Posts
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg ${activeTab === "recipes" ? "bg-yellow-400" : ""}`}
                            onPress={() => setActiveTab("recipes")}
                        >
                            <Text className={`text-center font-bold ${activeTab === "recipes" ? "text-black" : "text-white"}`}>
                                Recipes
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg ${activeTab === "badges" ? "bg-yellow-400" : ""}`}
                            onPress={() => setActiveTab("badges")}
                        >
                            <Text className={`text-center font-bold ${activeTab === "badges" ? "text-black" : "text-white"}`}>
                                Badges
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab Content */}
                    <View className="px-4">
                        {activeTab === "posts" && (
                            <View>
                                {mockUserPosts.map((post) => (
                                    <View key={post.id} className="bg-zinc-800 rounded-xl mb-4 overflow-hidden">
                                        <View className="p-4">
                                            <Text className="text-white mb-2">{post.content}</Text>
                                            {post.images && post.images.length > 0 && (
                                                <Image source={{ uri: post.images[0] }} className="w-full h-48 rounded-lg" resizeMode="cover" />
                                            )}
                                            <View className="flex-row justify-between mt-3">
                                                <Text className="text-zinc-400 text-sm">{post.likes} likes</Text>
                                                <Text className="text-zinc-400 text-sm">{post.timeAgo}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {activeTab === "recipes" && (
                            <View className="items-center py-8">
                                <Ionicons name="restaurant-outline" size={64} color="#6B7280" />
                                <Text className="text-zinc-400 text-lg mt-4">No recipes yet</Text>
                                <Text className="text-zinc-500 text-center mt-2">
                                    {isOwnProfile ? "Share your first recipe!" : `${user.name} hasn't shared any recipes yet`}
                                </Text>
                            </View>
                        )}

                        {activeTab === "badges" && (
                            <View>
                                {user.badges && user.badges.length > 0 ? (
                                    <View className="flex-row flex-wrap">
                                        {user.badges.map((badge) => (
                                            <View key={badge.id} className="w-1/3 p-2">
                                                <View className="bg-zinc-800 rounded-xl p-4 items-center">
                                                    <View className={`w-16 h-16 rounded-full items-center justify-center bg-${badge.color}-500`}>
                                                        <Text className="text-3xl">{badge.icon}</Text>
                                                    </View>
                                                    <Text className="text-white font-bold mt-2 text-center">{badge.name}</Text>
                                                    <Text className="text-zinc-400 text-xs text-center mt-1">{badge.description}</Text>
                                                    {badge.unlockedAt && <Text className="text-yellow-400 text-xs mt-1">{badge.unlockedAt}</Text>}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <View className="items-center py-8">
                                        <Ionicons name="medal-outline" size={64} color="#6B7280" />
                                        <Text className="text-zinc-400 text-lg mt-4">No badges yet</Text>
                                        <Text className="text-zinc-500 text-center mt-2">
                                            {isOwnProfile ? "Start cooking to earn badges!" : `${user.name} hasn't earned any badges yet`}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    )
}
