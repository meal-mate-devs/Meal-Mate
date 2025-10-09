"use client"

import { communityService } from "@/lib/services/community.service"
import { Post, User } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import type { JSX } from "react"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"

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
    const [isFollowing, setIsFollowing] = useState<boolean>(user?.isFollowing || false)
    const [activeTab, setActiveTab] = useState<"posts" | "recipes" | "badges">("posts")
    const [userPosts, setUserPosts] = useState<Post[] | null>(null)
    const [postsLoading, setPostsLoading] = useState<boolean>(false)
    const [postsError, setPostsError] = useState<string | null>(null)
    const [followerCount, setFollowerCount] = useState<number>(user?.followerCount || 0)
    const [followLoading, setFollowLoading] = useState<boolean>(false)
    const [profileLoading, setProfileLoading] = useState<boolean>(true)

    const isOwnProfile = user?.id === currentUserId


    const fetchUserProfile = async (userId: string) => {
        setProfileLoading(true);
        try {
            const response = await communityService.getUserProfile(userId);
            if (response && response.success && response.user) {
                setIsFollowing(response.user.isFollowing || false);
                setFollowerCount(response.user.followerCount || 0);
                return response.user;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        } finally {
            setProfileLoading(false);
        }
    };

    const handleFollow = async (): Promise<void> => {
        if (isOwnProfile || followLoading) return

        setFollowLoading(true)
        try {
            const response = await communityService.followUser(user!.id)

            if (response && response.success) {
                setIsFollowing(response.isFollowing)
                setFollowerCount(response.followerCount)

                await fetchUserProfile(user!.id);
            }
        } catch (error) {
            console.error('Error toggling follow status:', error)
        } finally {
            setFollowLoading(false)
        }
    }

    useEffect(() => {
        if (!visible || !user) return

        setFollowerCount(user.followerCount || 0)
        setIsFollowing(user.isFollowing || false)

        const initializeUserData = async () => {
            const freshUserData = await fetchUserProfile(user.id);

            setPostsLoading(true)
            setPostsError(null)
            try {
                // Use user.id or user.mongoId for fetching the profile user's posts, not currentUserId
                const userIdToFetch = user.mongoId || user.id;
                console.log('=== USER PROFILE DEBUG ===');
                console.log('Full user object:', JSON.stringify(user, null, 2));
                console.log('user.mongoId:', user.mongoId);
                console.log('user.id:', user.id);
                console.log('userIdToFetch:', userIdToFetch);
                console.log('currentUserId:', currentUserId);
                console.log('========================');
                
                const resp = await communityService.getUserPosts(userIdToFetch, 1, 20)
                console.log('getUserPosts response:', resp);
                
                if (resp && resp.posts) {
                    setUserPosts(resp.posts.map((p: any) => ({
                        ...p,
                        author: p.author || (freshUserData || user),
                        id: p.id || p._id,
                        images: p.images || []
                    })))
                    console.log('Loaded posts for user:', resp.posts.length, 'posts');
                } else {
                    console.log('No posts found for user');
                    setUserPosts([])
                }
            } catch (err) {
                console.error('Error loading user posts', err)
                setPostsError('Failed to load posts')
            } finally {
                setPostsLoading(false)
            }
        }

        initializeUserData()
    }, [visible, user])

    if (!user) {
        return (
            <Modal visible={visible} animationType="slide" transparent={false}>
                <View className="flex-1 bg-zinc-900 justify-center items-center">
                    <ActivityIndicator size="large" color="#FBBF24" />
                </View>
            </Modal>
        )
    }


    console.log("Rendering profile for user:", 
        userPosts && userPosts.length > 0 && userPosts[0].images && userPosts[0].images.length > 0 
            ? userPosts[0].images[0].url || userPosts[0].images[0]
            : "No posts available"
    )

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-zinc-900">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4 py-6 border-b border-zinc-800">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1">
                    {/* Profile Header */}
                    <View className="p-6">
                        {profileLoading ? (
                            /* Skeleton loader for profile header */
                            <View>
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center">
                                        <View className="relative">
                                            <View className="w-20 h-20 rounded-full border-2 border-yellow-400 bg-zinc-700 opacity-50" />
                                        </View>
                                        <View className="ml-4">
                                            <View className="w-36 h-6 bg-zinc-700 rounded opacity-50 mb-2" />
                                            <View className="w-24 h-4 bg-zinc-700 rounded opacity-50 mb-2" />
                                            <View className="w-28 h-4 bg-zinc-700 rounded opacity-50" />
                                        </View>
                                    </View>

                                    <View className="rounded-xl overflow-hidden">
                                        <View className="w-24 h-10 bg-zinc-700 rounded-xl opacity-50" />
                                    </View>
                                </View>

                                {/* Skeleton for stats */}
                                <View className="flex-row justify-around bg-zinc-800 rounded-xl p-4">
                                    {[...Array(4)].map((_, index) => (
                                        <View key={index} className="items-center">
                                            <View className="w-8 h-7 bg-zinc-700 rounded opacity-50 mb-2" />
                                            <View className="w-14 h-4 bg-zinc-700 rounded opacity-50" />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <>
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center">
                                        <View className="relative">
                                            <Image source={{ uri: user.avatar }} className="w-20 h-20 rounded-full border-2 border-yellow-400" />
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
                                        <TouchableOpacity
                                            className="rounded-xl overflow-hidden"
                                            onPress={handleFollow}
                                            disabled={followLoading}
                                        >
                                            <LinearGradient
                                                colors={isFollowing ? ["#6B7280", "#4B5563"] : ["#FBBF24", "#F97416"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                className="px-6 py-3"
                                            >
                                                {followLoading ? (
                                                    <ActivityIndicator size="small" color={isFollowing ? "#FFFFFF" : "#000000"} />
                                                ) : (
                                                    <Text className="text-white font-bold">{isFollowing ? "Following" : "Follow"}</Text>
                                                )}
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
                                        <Text className="text-white text-xl font-bold">{followerCount}</Text>
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
                            </>
                        )}
                    </View>

                    {/* Badges Preview */}
                    {/* Recent Badges */}
                    {!profileLoading && user.badges && user.badges.length > 0 && (
                        <View className="mt-4 px-6">
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

                    {/* Tabs */}
                    <View className="flex-row bg-zinc-800 mx-4 rounded-xl p-1 mb-4">
                        {profileLoading ? (
                            // Skeleton for tabs
                            <View className="flex-row flex-1 p-2 justify-around">
                                {[...Array(3)].map((_, index) => (
                                    <View key={index} className="w-24 h-8 bg-zinc-700 rounded-lg opacity-50" />
                                ))}
                            </View>
                        ) : (
                            <>
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
                            </>
                        )}
                    </View>

                    {/* Tab Content */}
                    <View className="px-4">
                        {profileLoading ? (
                            // Skeleton loading for posts content
                            <View>
                                {postsLoading ? (
                                    <View className="py-8 items-center">
                                        <ActivityIndicator size="large" color="#FBBF24" />
                                        <Text className="text-zinc-400 mt-3">Loading posts...</Text>
                                    </View>
                                ) : postsError ? (
                                    <View className="py-8 items-center">
                                        <Text className="text-zinc-400">{postsError}</Text>
                                    </View>
                                ) : (userPosts && userPosts.length > 0 ? (
                                    userPosts.map((post: Post) => (
                                        <View key={post.id} className="bg-zinc-800 rounded-xl mb-4 overflow-hidden">
                                            <View className="p-4">
                                                <Text className="text-white mb-2">{post.content}</Text>
                                                {post.images && post.images.length > 0 && (
                                                    <Image 
                                                        source={{ uri: post.images[0]?.url || post.images[0] }} 
                                                        className="w-full h-48 rounded-lg" 
                                                        resizeMode="cover" 
                                                    />
                                                )}
                                                <View className="flex-row justify-between mt-3">
                                                    <Text className="text-zinc-400 text-sm">{post.likes || 0} likes</Text>
                                                    <Text className="text-zinc-400 text-sm">{post.timeAgo || ''}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View className="py-8 items-center">
                                        <Text className="text-zinc-400">No posts yet.</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            activeTab === "posts" && (
                                <View>
                                    {postsLoading ? (
                                        <View className="py-8 items-center">
                                            <ActivityIndicator size="large" color="#FBBF24" />
                                            <Text className="text-zinc-400 mt-3">Loading posts...</Text>
                                        </View>
                                    ) : postsError ? (
                                        <View className="py-8 items-center">
                                            <Text className="text-zinc-400">{postsError}</Text>
                                        </View>
                                    ) : (userPosts && userPosts.length > 0 ? (
                                        userPosts.map((post: Post) => (
                                            <View key={post.id} className="bg-zinc-800 rounded-xl mb-4 overflow-hidden">
                                                <View className="p-4">
                                                    <Text className="text-white mb-2">{post.content}</Text>
                                                    {post.images && post.images.length > 0 && (
                                                        <Image source={{ uri: post.images[0].url }} className="w-full h-48 rounded-lg" resizeMode="cover" />
                                                    )}
                                                    <View className="flex-row justify-between mt-3">
                                                        <Text className="text-zinc-400 text-sm">{post.likes || 0} likes</Text>
                                                        <Text className="text-zinc-400 text-sm">{post.timeAgo || ''}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <View className="py-8 items-center">
                                            <Text className="text-zinc-400">No posts yet.</Text>
                                        </View>
                                    ))}
                                </View>
                            )
                        )}

                        {!profileLoading && activeTab === "recipes" && (
                            <View className="items-center py-8">
                                <Ionicons name="restaurant-outline" size={64} color="#6B7280" />
                                <Text className="text-zinc-400 text-lg mt-4">No recipes yet</Text>
                                <Text className="text-zinc-500 text-center mt-2">
                                    {isOwnProfile ? "Share your first recipe!" : `${user.name} hasn't shared any recipes yet`}
                                </Text>
                            </View>
                        )}

                        {!profileLoading && activeTab === "badges" && (
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