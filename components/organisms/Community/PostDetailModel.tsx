"use client"

import CommunityAPI from "@/lib/services/community.service"
import { Post } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import React, { JSX, useEffect, useState } from "react"
import { Alert, Image, Modal, ScrollView, Share, Text, TouchableOpacity, View } from "react-native"
import PostImageCarousel from "./PostImageCarousel"

interface PostDetailModelProps {
    visible: boolean
    post: Post | null
    onClose: () => void
    currentUserId: string
}

export default function PostDetailModel({ visible, post, onClose, currentUserId }: PostDetailModelProps): JSX.Element {
    const [isLiked, setIsLiked] = useState<boolean>(false)
    const [isSaved, setIsSaved] = useState<boolean>(false)
    const [likes, setLikes] = useState<number>(0)
    const [saves, setSaves] = useState<number>(0)

    useEffect(() => {
        if (post) {
            setIsLiked(post.isLiked || false)
            setIsSaved(post.isSaved || false)
            setLikes(post.likes || 0)
            setSaves(post.saves || 0)
        }
    }, [post])

    if (!post || !post.recipeDetails) return <></>

    console.log("recipe details------------------------------------------")
    console.log(post.recipeDetails)

    const toSafeString = (val: any): string => {
        if (val === null || val === undefined) return ''
        if (typeof val === 'string') return val
        if (typeof val === 'number' || typeof val === 'boolean') return String(val)
        if (typeof val === 'object') {
            if ('name' in val && typeof val.name === 'string') return val.name
            if ('title' in val && typeof val.title === 'string') return val.title
            if ('label' in val && typeof val.label === 'string') return val.label
            if ('instruction' in val && typeof val.instruction === 'string') return val.instruction
            if ('_id' in val) return String(val._id)
            try {
                const s = JSON.stringify(val)
                return s.length > 60 ? s.substring(0, 57) + '...' : s
            } catch {
                return String(val)
            }
        }
        return String(val)
    }

    const handleLike = async (): Promise<void> => {
        try {
            setIsLiked(!isLiked)
            setLikes(isLiked ? likes - 1 : likes + 1)

            await CommunityAPI.toggleLikePost(post.id)
        } catch (error) {
            console.error('Error toggling like:', error)
            setIsLiked(!isLiked)
            setLikes(isLiked ? likes + 1 : likes - 1)
            Alert.alert('Error', 'Failed to update like status')
        }
    }

    const handleSave = async (): Promise<void> => {
        try {
            setIsSaved(!isSaved)
            setSaves(isSaved ? saves - 1 : saves + 1)

            await CommunityAPI.toggleSavePost(post.id)
        } catch (error) {
            console.error('Error saving post:', error)
            setIsSaved(!isSaved)
            setSaves(isSaved ? saves + 1 : saves - 1)
            Alert.alert('Error', 'Failed to save post')
        }
    }

    const handleShare = async (): Promise<void> => {
        try {
            const recipeTitle = post.recipeDetails?.title || 'Delicious Recipe'
            const content = `Check out this amazing recipe: ${recipeTitle}\n\n${post.content}`

            await Share.share({
                message: content,
                title: recipeTitle,
            })
        } catch (error) {
            console.log('Error sharing recipe:', error)
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View className="flex-1 bg-zinc-900">
                <View className="flex-row justify-between items-center p-4 pt-12 border-b border-zinc-800">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">Recipe Details</Text>
                    <TouchableOpacity onPress={handleShare}>
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1">
                    {post.images && post.images.length > 0 && <PostImageCarousel images={post.images} />}

                    <View className="p-4">
                        <View className="flex-row items-center mb-4">
                            <Image source={{ uri: post.author.avatar }} className="w-12 h-12 rounded-full border-2 border-yellow-400" />
                            <View className="ml-3 flex-1">
                                <Text className="text-white font-bold text-lg">{toSafeString(post.author.name)}</Text>
                                <Text className="text-zinc-400">@{toSafeString(post.author.username)}</Text>
                            </View>
                            <Text className="text-zinc-400 text-sm">{post.timeAgo}</Text>
                        </View>

                        <Text className="text-white text-2xl font-bold mb-2">{toSafeString(post.recipeDetails.title) || "Delicious Recipe"}</Text>

                        <Text className="text-zinc-300 text-base mb-4">{toSafeString(post.content)}</Text>

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
                                        <Text className="text-white flex-1">{toSafeString(ingredient)}</Text>
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
                                        <Text className="text-white flex-1">{toSafeString(instruction)}</Text>
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
                                            <Text className="text-black font-bold text-sm">#{toSafeString(tag)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    )
}
