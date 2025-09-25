"use client"

import CommunityAPI from "@/lib/services/community.service"
import { LeaderboardEntry, User } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useEffect, useState } from "react"
import { Alert, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from "react-native"

interface LeaderboardScreenProps {
    onUserPress: (user: User) => void
    onClose: () => void
}

export default function LeaderboardScreen({ onUserPress, onClose }: LeaderboardScreenProps): JSX.Element {
    const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("month")
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Mock data fallback
    const MOCK_LEADERBOARD: LeaderboardEntry[] = [
        {
            user: {
                id: "1",
                name: "Chef Maria",
                username: "chef_maria",
                avatar: require("../../../assets/images/avatar.png"),
                isVerified: true,
                totalLikes: 1250,
                recipeCount: 45,
                badges: [
                    { id: "1", name: "Master Chef", icon: "👨‍🍳", color: "yellow", description: "Posted 50+ recipes" },
                    { id: "2", name: "Crowd Favorite", icon: "❤️", color: "red", description: "1000+ total likes" },
                ],
            },
            position: 1,
            totalLikes: 1250,
            totalPosts: 45,
            engagementScore: 95.8,
            change: 0,
        },
        {
            user: {
                id: "2",
                name: "Baker John",
                username: "baker_john",
                avatar: require("../../../assets/images/avatar.png"),
                isVerified: true,
                totalLikes: 980,
                recipeCount: 38,
                badges: [
                    { id: "3", name: "Sweet Tooth", icon: "🍰", color: "pink", description: "Dessert specialist" },
                    { id: "4", name: "Rising Star", icon: "⭐", color: "blue", description: "Fast growing creator" },
                ],
            },
            position: 2,
            totalLikes: 980,
            totalPosts: 38,
            engagementScore: 89.2,
            change: 1,
        },
        {
            user: {
                id: "3",
                name: "Spice Queen",
                username: "spice_queen",
                avatar: require("../../../assets/images/avatar.png"),
                totalLikes: 756,
                recipeCount: 32,
                badges: [{ id: "5", name: "Spice Master", icon: "🌶️", color: "red", description: "Spicy food expert" }],
            },
            position: 3,
            totalLikes: 756,
            totalPosts: 32,
            engagementScore: 82.1,
            change: -1,
        },
        {
            user: {
                id: "4",
                name: "Healthy Cook",
                username: "healthy_cook",
                avatar: require("../../../assets/images/avatar.png"),
                totalLikes: 645,
                recipeCount: 28,
            },
            position: 4,
            totalLikes: 645,
            totalPosts: 28,
            engagementScore: 78.5,
            change: 2,
        },
        {
            user: {
                id: "5",
                name: "Pasta Master",
                username: "pasta_master",
                avatar: require("../../../assets/images/avatar.png"),
                totalLikes: 523,
                recipeCount: 25,
            },
            position: 5,
            totalLikes: 523,
            totalPosts: 25,
            engagementScore: 71.3,
            change: -1,
        },
    ]

    useEffect(() => {
        loadLeaderboard()
    }, [timeframe])

    const loadLeaderboard = async (): Promise<void> => {
        try {
            setLoading(true)
            const period = timeframe === "all" ? "all-time" : timeframe === "week" ? "weekly" : "monthly"
            const response = await CommunityAPI.getLeaderboard(period, 50)
            setLeaderboard(response.leaderboard || response.data || response || MOCK_LEADERBOARD)
        } catch (error) {
            console.error('Error loading leaderboard:', error)
            setLeaderboard(MOCK_LEADERBOARD) // Fallback to mock data
            Alert.alert('Info', 'Using demo leaderboard data')
        } finally {
            setLoading(false)
        }
    }

    const getPositionIcon = (position: number): string => {
        switch (position) {
            case 1:
                return "🥇"
            case 2:
                return "🥈"
            case 3:
                return "🥉"
            default:
                return `#${position}`
        }
    }

    const getChangeIcon = (change: number): JSX.Element => {
        if (change > 0) {
            return <Ionicons name="trending-up" size={16} color="#10B981" />
        } else if (change < 0) {
            return <Ionicons name="trending-down" size={16} color="#EF4444" />
        }
        return <Ionicons name="remove" size={16} color="#6B7280" />
    }

    const handleTimeframeChange = (newTimeframe: "week" | "month" | "all"): void => {
        setTimeframe(newTimeframe)
    }

    return (
        <ImageBackground
            source={require("../../../assets/images/authbg.png")}
            resizeMode="cover"
            style={{ width: "100%", height: "100%" }}
            imageStyle={{ opacity: 0.8 }}
        >
            <LinearGradient
                colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.7)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, width: "100%", height: "100%" }}
            >
                <View className="flex-1">
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-4 pt-12">
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-white text-xl font-bold">🏆 Leaderboard</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        {/* Timeframe Toggle */}
                        <View className="px-4 mb-6">
                            <View className="flex-row bg-zinc-800 rounded-xl p-1">
                                {["week", "month", "all"].map((period) => (
                                    <TouchableOpacity
                                        key={period}
                                        className={`flex-1 py-3 rounded-lg ${timeframe === period ? "bg-yellow-400" : ""}`}
                                        onPress={() => handleTimeframeChange(period as "week" | "month" | "all")}
                                    >
                                        <Text
                                            className={`text-center font-bold capitalize ${timeframe === period ? "text-black" : "text-white"
                                                }`}
                                        >
                                            {period === "all" ? "All Time" : period}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Top 3 Podium */}
                        <View className="px-4 mb-6">
                            <View className="flex-row justify-center items-end">
                                {leaderboard.length >= 3 && (
                                    <>
                                        {/* 2nd Place */}
                                        <TouchableOpacity className="items-center mx-2" onPress={() => onUserPress(leaderboard[1].user)}>
                                            <View className="w-16 h-16 rounded-full border-2 border-gray-400 overflow-hidden mb-2">
                                                <Image source={leaderboard[1].user.avatar} className="w-full h-full" />
                                            </View>
                                            <View className="bg-gray-400 rounded-lg px-3 py-6 items-center min-h-[60px]">
                                                <Text className="text-black font-bold text-lg">🥈</Text>
                                                <Text className="text-black text-xs font-bold text-center">{leaderboard[1].user.name}</Text>
                                                <Text className="text-black text-xs">{leaderboard[1].totalLikes}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* 1st Place */}
                                        <TouchableOpacity className="items-center mx-2" onPress={() => onUserPress(leaderboard[0].user)}>
                                            <View className="w-20 h-20 rounded-full border-2 border-yellow-400 overflow-hidden mb-2">
                                                <Image source={leaderboard[0].user.avatar} className="w-full h-full" />
                                            </View>
                                            <View className="bg-yellow-400 rounded-lg px-3 py-8 items-center min-h-[80px]">
                                                <Text className="text-black font-bold text-xl">🥇</Text>
                                                <Text className="text-black text-sm font-bold text-center">{leaderboard[0].user.name}</Text>
                                                <Text className="text-black text-xs">{leaderboard[0].totalLikes}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* 3rd Place */}
                                        <TouchableOpacity className="items-center mx-2" onPress={() => onUserPress(leaderboard[2].user)}>
                                            <View className="w-16 h-16 rounded-full border-2 border-amber-600 overflow-hidden mb-2">
                                                <Image source={leaderboard[2].user.avatar} className="w-full h-full" />
                                            </View>
                                            <View className="bg-amber-600 rounded-lg px-3 py-4 items-center min-h-[40px]">
                                                <Text className="text-black font-bold text-lg">🥉</Text>
                                                <Text className="text-black text-xs font-bold text-center">{leaderboard[2].user.name}</Text>
                                                <Text className="text-black text-xs">{leaderboard[2].totalLikes}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Full Leaderboard */}
                        <View className="bg-zinc-800 rounded-xl mx-4 mb-6 overflow-hidden">
                            <View className="p-4">
                                <Text className="text-white font-bold text-lg mb-4">Full Rankings</Text>
                                {loading ? (
                                    <View className="py-8">
                                        <Text className="text-zinc-400 text-center">Loading leaderboard...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {leaderboard.map((entry) => (
                                            <TouchableOpacity
                                                key={entry.user.id}
                                                className="flex-row items-center py-4 border-b border-zinc-700 last:border-b-0"
                                                onPress={() => onUserPress(entry.user)}
                                            >
                                                <View className="w-8 items-center mr-3">
                                                    <Text className="text-white font-bold">{getPositionIcon(entry.position)}</Text>
                                                </View>

                                                <Image source={entry.user.avatar} className="w-12 h-12 rounded-full mr-3" />

                                                <View className="flex-1">
                                                    <View className="flex-row items-center">
                                                        <Text className="text-white font-bold">{entry.user.name}</Text>
                                                        {entry.user.isVerified && (
                                                            <Ionicons name="checkmark-circle" size={16} color="#FBBF24" className="ml-1" />
                                                        )}
                                                    </View>
                                                    <Text className="text-zinc-400 text-sm">
                                                        {entry.totalLikes} likes • {entry.totalPosts} posts
                                                    </Text>
                                                </View>

                                                <View className="items-end">
                                                    <View className="flex-row items-center">
                                                        {getChangeIcon(entry.change)}
                                                        <Text className="text-zinc-400 text-sm ml-1">{Math.abs(entry.change)}</Text>
                                                    </View>
                                                    <Text className="text-yellow-400 text-sm font-bold">{entry.engagementScore}%</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </LinearGradient>
        </ImageBackground>
    )
}
