"use client"

import { Post } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import React, { JSX, useState } from "react"
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import PostImageCarousel from "./PostImageCarousel"

interface PostDetailModelProps {
    visible: boolean
    post: Post | null
    onClose: () => void
}

export default function PostDetailModel({ visible, post, onClose }: PostDetailModelProps): JSX.Element {
    const [isLiked, setIsLiked] = useState<boolean>(post?.isLiked || false)
    const [isSaved, setIsSaved] = useState<boolean>(post?.isSaved || false)

    if (!post || !post.recipeDetails) return <></>

    const handleLike = (): void => {
        setIsLiked(!isLiked)
    }

    const handleSave = (): void => {
        setIsSaved(!isSaved)
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-zinc-900">
                <View className="flex-row justify-between items-center p-4 pt-12 border-b border-zinc-800">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">Recipe Details</Text>
                    <TouchableOpacity>
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1">
                    {post.images && post.images.length > 0 && <PostImageCarousel images={post.images} />}

                    <View className="p-4">
                        <View className="flex-row items-center mb-4">
                            <Image source={post.author.avatar} className="w-12 h-12 rounded-full border-2 border-yellow-400" />
                            <View className="ml-3 flex-1">
                                <Text className="text-white font-bold text-lg">{post.author.name}</Text>
                                <Text className="text-zinc-400">@{post.author.username}</Text>
                            </View>
                            <Text className="text-zinc-400 text-sm">{post.timeAgo}</Text>
                        </View>

                        <Text className="text-white text-2xl font-bold mb-2">{post.recipeDetails.title || "Delicious Recipe"}</Text>

                        <Text className="text-zinc-300 text-base mb-4">{post.content}</Text>

                        <View className="flex-row justify-between bg-zinc-800 rounded-xl p-4 mb-6">
                            {post.recipeDetails.cookTime && (
                                <View className="items-center">
                                    <Ionicons name="time-outline" size={24} color="#FBBF24" />
                                    <Text className="text-white text-xs mt-1">Cook Time</Text>
                                    <Text className="text-white font-bold">{post.recipeDetails.cookTime}</Text>
                                </View>
                            )}
                            {post.recipeDetails.servings && (
                                <View className="items-center">
                                    <Ionicons name="people-outline" size={24} color="#FBBF24" />
                                    <Text className="text-white text-xs mt-1">Servings</Text>
                                    <Text className="text-white font-bold">{post.recipeDetails.servings}</Text>
                                </View>
                            )}
                            {post.recipeDetails.difficulty && (
                                <View className="items-center">
                                    <Ionicons name="speedometer-outline" size={24} color="#FBBF24" />
                                    <Text className="text-white text-xs mt-1">Difficulty</Text>
                                    <Text className="text-white font-bold">{post.recipeDetails.difficulty}</Text>
                                </View>
                            )}
                            {post.recipeDetails.category && (
                                <View className="items-center">
                                    <Ionicons name="restaurant-outline" size={24} color="#FBBF24" />
                                    <Text className="text-white text-xs mt-1">Category</Text>
                                    <Text className="text-white font-bold">{post.recipeDetails.category}</Text>
                                </View>
                            )}
                        </View>

                        {post.recipeDetails.ingredients && post.recipeDetails.ingredients.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-white text-xl font-bold mb-4">Ingredients</Text>
                                {post.recipeDetails.ingredients.map((ingredient, index) => (
                                    <View key={index} className="flex-row items-center mb-3 bg-zinc-800 rounded-lg p-3">
                                        <View className="w-3 h-3 rounded-full bg-yellow-400 mr-3" />
                                        <Text className="text-white flex-1">{ingredient}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {post.recipeDetails.instructions && post.recipeDetails.instructions.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-white text-xl font-bold mb-4">Instructions</Text>
                                {post.recipeDetails.instructions.map((instruction, index) => (
                                    <View key={index} className="flex-row mb-4 bg-zinc-800 rounded-lg p-4">
                                        <View className="w-8 h-8 rounded-full bg-yellow-400 items-center justify-center mr-3">
                                            <Text className="text-black font-bold">{index + 1}</Text>
                                        </View>
                                        <Text className="text-white flex-1">{instruction}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {post.recipeDetails.tags && post.recipeDetails.tags.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-white text-xl font-bold mb-4">Tags</Text>
                                <View className="flex-row flex-wrap">
                                    {post.recipeDetails.tags.map((tag, index) => (
                                        <View key={index} className="bg-yellow-400 rounded-full px-3 py-1 mr-2 mb-2">
                                            <Text className="text-black font-bold text-sm">#{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View className="flex-row justify-between items-center p-4 border-t border-zinc-800">
                    <TouchableOpacity className="flex-row items-center" onPress={handleLike}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#FBBF24" : "#FFFFFF"} />
                        <Text className="text-white ml-2">{post.likes + (isLiked && !post.isLiked ? 1 : 0)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
                        <Text className="text-white ml-2">{post.comments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center" onPress={handleSave}>
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={24}
                            color={isSaved ? "#FBBF24" : "#FFFFFF"}
                        />
                        <Text className="text-white ml-2">{post.saves + (isSaved && !post.isSaved ? 1 : 0)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center">
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                        <Text className="text-white ml-2">Share</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}
