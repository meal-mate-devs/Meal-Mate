"use client"

import { useLanguage } from "@/context/LanguageContext"
import { Post, User } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useState } from "react"
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native"
import CustomDialog from "../../atoms/CustomDialog"
import PostOptionsPopover from "../../atoms/PostOptionsPopover"
import EditPostModal from "../../molecules/EditPostModal"
import PostImageCarousel from "./PostImageCarousel"


interface PostItemProps {
    post: Post
    currentUser: User
    onLike: (postId: string) => Promise<void>
    onSave: (postId: string) => Promise<void>
    onUserPress: (user: User) => void
    onViewRecipe: (post: Post) => void
    onAddComment: (postId: string, comment: string) => Promise<void>
    onDeletePost: (postId: string) => Promise<void>
    onUpdatePost?: (postId: string, updateData: any) => Promise<void>
    onDeleteComment?: (commentId: string, postId: string) => Promise<void>
    loadPosts?: () => Promise<void>
}

export default function PostItem({
    post,
    currentUser,
    onLike,
    onSave,
    onUserPress,
    onViewRecipe,
    onAddComment,
    onDeletePost,
    onUpdatePost,
    onDeleteComment,
    loadPosts,
}: PostItemProps): JSX.Element {
    const { t } = useLanguage()
    const [showComments, setShowComments] = useState<boolean>(false)
    const [commentText, setCommentText] = useState<string>("")
    const [showOptionsPopover, setShowOptionsPopover] = useState<boolean>(false)
    const [showEditModal, setShowEditModal] = useState<boolean>(false)
    const [isCommenting, setIsCommenting] = useState<boolean>(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
    const isOwnPost = post.author.id === currentUser.mongoId

    const handleAddComment = async (): Promise<void> => {
        if (!commentText.trim() || isCommenting) return

        setIsCommenting(true)
        try {
            await onAddComment(post.id, commentText)
            setCommentText("")
        } catch (err) {
            console.log('Error adding comment:', err)
        } finally {
            setIsCommenting(false)
        }
    }

    const handleDeleteCommentClick = (commentId: string): void => {
        setCommentToDelete(commentId)
        setShowDeleteConfirmation(true)
    }

    const handleConfirmDelete = async (): Promise<void> => {
        if (commentToDelete && onDeleteComment) {
            await onDeleteComment(commentToDelete, post.id)
        }
        setShowDeleteConfirmation(false)
        setCommentToDelete(null)
    }

    const handleCancelDelete = (): void => {
        setShowDeleteConfirmation(false)
        setCommentToDelete(null)
    }

    const toggleComments = (): void => {
        setShowComments(!showComments)
    }

    const handleOptionsPress = (): void => {
        if (isOwnPost) {
            setShowOptionsPopover(true)
        }
    }

    const handleEditPost = (): void => {
        setShowEditModal(true)
    }

    const handleUpdatePost = async (postId: string, updateData: any): Promise<void> => {
        if (onUpdatePost) {
            await onUpdatePost(postId, updateData)
        }
    }

    const toSafeString = (val: any): string => {
        if (val === null || val === undefined) return ''
        if (typeof val === 'string') return val
        if (typeof val === 'number' || typeof val === 'boolean') return String(val)
        if (typeof val === 'object') {
            if ('title' in val && typeof val.title === 'string') return val.title
            if ('name' in val && typeof val.name === 'string') return val.name
            if ('label' in val && typeof val.label === 'string') return val.label
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


    return (
        <>
            <View className="bg-zinc-800 rounded-xl mb-4 overflow-hidden border border-zinc-700">
                <TouchableOpacity className="flex-row items-center p-4" onPress={() => onUserPress(post.author)}>
                    <Image
                        source={post.author.avatar && typeof post.author.avatar === 'string'
                            ? { uri: post.author.avatar }
                            : post.author.avatar || require("../../../assets/images/avatar.png")
                        }
                        className="w-10 h-10 rounded-full border border-yellow-400"
                    />
                    <View className="ml-3 flex-1">
                        <Text className="text-white font-bold">{post.author.name}</Text>
                        <Text className="text-zinc-400 text-xs">{post.timeAgo}</Text>
                    </View>
                    {isOwnPost && (
                        <TouchableOpacity onPress={handleOptionsPress} className="absolute top-4 right-4">
                            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <View className="px-4 pb-3">
                    {post.recipeDetails?.title ? (
                        <Text className="text-white text-lg font-bold mb-1">{toSafeString(post.recipeDetails.title)}</Text>
                    ) : null}
                    <Text className="text-white text-base leading-5">{toSafeString(post.content)}</Text>
                </View>

                {post.images && post.images.length > 0 && <PostImageCarousel images={post.images} />}

                {post.recipeDetails && (
                    <View className="px-4 py-3 bg-zinc-700 border-t border-zinc-600">
                        <View className="flex-row justify-between mb-2">
                            {post.recipeDetails.cookTime && (
                                <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={16} color="#FBBF24" />
                                    <Text className="text-white text-xs ml-1">{post.recipeDetails.cookTime}</Text>
                                </View>
                            )}
                            {post.recipeDetails.servings && (
                                <View className="flex-row items-center">
                                    <Ionicons name="people-outline" size={16} color="#FBBF24" />
                                    <Text className="text-white text-xs ml-1">{t('community.post.serves', { count: post.recipeDetails.servings.toString() })}</Text>
                                </View>
                            )}
                            {post.recipeDetails.difficulty && (
                                <View className="flex-row items-center">
                                    <Ionicons name="speedometer-outline" size={16} color="#FBBF24" />
                                    <Text className="text-white text-xs ml-1">{post.recipeDetails.difficulty}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity className="mt-1" onPress={() => onViewRecipe(post)}>
                            <Text className="text-yellow-400 text-sm font-medium">{t('community.post.viewFullRecipe')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row items-center justify-between px-4 py-3 border-t border-zinc-700">
                    <TouchableOpacity className="flex-row items-center" onPress={() => onLike(post.id)}>
                        <Ionicons
                            name={post.isLiked ? "heart" : "heart-outline"}
                            size={22}
                            color={post.isLiked ? "#FBBF24" : "#FFFFFF"}
                        />
                        <Text className="text-white ml-2 font-medium">{post.likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center" onPress={toggleComments}>
                        <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                        <Text className="text-white ml-2 font-medium">{post.comments}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center" onPress={() => onSave(post.id)}>
                        <Ionicons
                            name={post.isSaved ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={post.isSaved ? "#FBBF24" : "#FFFFFF"}
                        />
                        <Text className="text-white ml-2 font-medium">{post.saves}</Text>
                    </TouchableOpacity>
                </View>

                {showComments && (
                    <View className="px-4 py-4 border-t border-zinc-700 bg-zinc-750">
                        <Text className="text-white font-bold mb-3">{t('community.post.commentsCount', { count: post.comments.toString() })}</Text>

                        {post.commentsList && post.commentsList.length > 0 ? (
                            <View className="mb-4">
                                {post.commentsList.map((comment) => (
                                    <View key={comment.id} className="mb-3">
                                        <View className="flex-row items-start">
                                            <Image
                                                source={comment.author.avatar && typeof comment.author.avatar === 'string'
                                                    ? { uri: comment.author.avatar }
                                                    : require("../../../assets/images/avatar.png")
                                                }
                                                className="w-8 h-8 rounded-full mr-3"
                                            />
                                            <View className="flex-1">
                                                <View className="bg-zinc-700 rounded-xl p-3">
                                                    <View className="flex-row justify-between items-start">
                                                        <View className="flex-1">
                                                            <Text className="text-white font-bold text-sm mb-1">{comment.author.name}</Text>
                                                            <Text className="text-white text-sm leading-4">{comment.text}</Text>
                                                        </View>
                                                        {(isOwnPost || comment.author.id === currentUser.mongoId) && onDeleteComment && (
                                                            <TouchableOpacity 
                                                                className="ml-2 w-6 h-6 rounded-lg justify-center items-center overflow-hidden"
                                                                onPress={() => handleDeleteCommentClick(comment.id)}
                                                            >
                                                                <LinearGradient
                                                                    colors={["#ef4444ca", "#dc26268a"]}
                                                                    className="w-full h-full flex justify-center items-center"
                                                                >
                                                                    <Ionicons name="trash-outline" size={12} color="#FFFFFF" />
                                                                </LinearGradient>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                                <Text className="text-zinc-400 text-xs mt-1 ml-3">{comment.timeAgo}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View className="mb-4">
                                <Text className="text-zinc-400 text-sm text-center py-2">{t('community.post.noCommentsYet')}</Text>
                            </View>
                        )}

                        <View className="flex-row items-center">
                            <Image
                                source={currentUser.avatar && currentUser.avatar.uri
                                    ? { uri: currentUser.avatar.uri }
                                    : currentUser.avatar || require("../../../assets/images/avatar.png")
                                }
                                className="w-8 h-8 rounded-full mr-3"
                            />
                            <View className="flex-1 flex-row items-center bg-zinc-700 rounded-full">
                                <TextInput
                                    className="flex-1 px-4 py-3 text-white text-sm"
                                    placeholder={t('community.post.addComment')}
                                    placeholderTextColor="#9CA3AF"
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline={false}
                                />
                                <TouchableOpacity
                                    className="mr-2 w-8 h-8 rounded-xl justify-center items-center overflow-hidden"
                                    onPress={handleAddComment}
                                    disabled={!commentText.trim() || isCommenting}
                                >
                                    {isCommenting ? (
                                        <View className="flex-row items-center">
                                            <ActivityIndicator size="small" color="#FBBF24" />
                                        </View>
                                    ) : (
                                        <LinearGradient
                                            colors={commentText.trim() ? ["#FBBF24", "#F97416"] : ["#6B7280", "#6B7280"]}
                                            className="w-full h-full flex justify-center items-center"
                                        >
                                            <Ionicons name="send" size={16} color="#FFFFFF" />
                                        </LinearGradient>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            <PostOptionsPopover
                visible={showOptionsPopover}
                onClose={() => setShowOptionsPopover(false)}
                onEdit={handleEditPost}
                onDelete={() => onDeletePost(post.id)}
                isOwnPost={isOwnPost}
                position={{ top: 40, right: 10 }}
            />

            <EditPostModal
                visible={showEditModal}
                post={post}
                onClose={() => setShowEditModal(false)}
                onUpdate={handleUpdatePost}
                loadPosts={loadPosts}
            />

            <CustomDialog
                visible={showDeleteConfirmation}
                onClose={handleCancelDelete}
                title="Delete Comment"
            >
                <Text className="text-white text-base mb-4">
                    Are you sure you want to delete this comment? This action cannot be undone.
                </Text>
                <View className="flex-row justify-end space-x-3">
                    <TouchableOpacity
                        className="bg-zinc-600 rounded-lg py-3 px-6 mr-3"
                        onPress={handleCancelDelete}
                    >
                        <Text className="text-white font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="bg-red-600 rounded-lg py-3 px-6"
                        onPress={handleConfirmDelete}
                    >
                        <Text className="text-white font-semibold">Delete</Text>
                    </TouchableOpacity>
                </View>
            </CustomDialog>
        </>
    )
}
