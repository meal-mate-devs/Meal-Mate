"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX } from "react"
import { Text, TouchableOpacity, View } from "react-native"

interface EmptyStateProps {
    onCreatePost: () => void
}

export default function EmptyState({ onCreatePost }: EmptyStateProps): JSX.Element {
    return (
        <View className="flex-1 justify-center items-center px-8">
            <View className="items-center mb-8">
                <View className="w-24 h-24 bg-zinc-800 rounded-full items-center justify-center mb-6 border border-zinc-700">
                    <Ionicons name="restaurant-outline" size={40} color="#FBBF24" />
                </View>

                <Text className="text-white text-2xl font-bold text-center mb-4">
                    No Posts Yet
                </Text>

                <Text className="text-zinc-400 text-base text-center mb-8 leading-6">
                    Be the first to share your amazing recipes and cooking tips with the Meal Mate community!
                </Text>
            </View>

            <TouchableOpacity
                className="w-full"
                onPress={onCreatePost}
            >
                <LinearGradient
                    colors={["#FBBF24", "#F97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-xl p-4"
                >
                    <View className="flex-row items-center justify-center">
                        <Ionicons name="add-circle-outline" size={24} color="#000000" />
                        <Text className="text-black text-lg font-bold ml-2">
                            Create Your First Post
                        </Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center">
                <View className="flex-row items-center mr-6">
                    <Ionicons name="camera-outline" size={20} color="#FBBF24" />
                    <Text className="text-zinc-400 text-sm ml-2">Share photos</Text>
                </View>
                <View className="flex-row items-center">
                    <Ionicons name="book-outline" size={20} color="#FBBF24" />
                    <Text className="text-zinc-400 text-sm ml-2">Post recipes</Text>
                </View>
            </View>
        </View>
    )
}