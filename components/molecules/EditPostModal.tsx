"use client"

import { Post } from "@/lib/types/community"
import React, { JSX, useEffect, useState } from "react"
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native"

interface EditPostModalProps {
    visible: boolean
    post: Post | null
    onClose: () => void
    onUpdate: (postId: string, updateData: any) => Promise<void>
    loadPosts?: () => Promise<void>
}

export default function EditPostModal({
    visible,
    post,
    onClose,
    onUpdate,
    loadPosts
}: EditPostModalProps): JSX.Element {
    const [content, setContent] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [images, setImages] = useState<any[]>([])

    useEffect(() => {
        if (post) {
            setContent(post.content || "")
            setImages(post.images || [])
        }
    }, [post])

    const handleUpdate = async (): Promise<void> => {
        if (!post || !content.trim()) {
            Alert.alert('Error', 'Please add some content to your post.')
            return
        }

        try {
            setLoading(true)

            const updateData = {
                content: content.trim(),
            }

            await onUpdate(post.id, updateData)
            Alert.alert('Success', 'Post updated successfully!')
            onClose()
            if (typeof loadPosts === 'function') {
                await loadPosts();
            }

        } catch (error) {
            console.log('Error updating post:', error)
            Alert.alert('Error', 'Failed to update post. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = (): void => {
        setContent("")
        onClose()
    }

    if (!post) return <></>

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-zinc-900"
            >
                <View className="flex-row justify-between items-center p-4 pt-12 border-b border-zinc-800">
                    <TouchableOpacity onPress={handleClose}>
                        <Text className="text-white text-lg">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold">Edit Post</Text>
                    <TouchableOpacity
                        onPress={handleUpdate}
                        disabled={loading || !content.trim()}
                        className={`px-4 py-2 rounded-lg ${loading || !content.trim()
                            ? 'bg-zinc-700'
                            : 'bg-yellow-400'
                            }`}
                    >
                        <Text className={`font-bold ${loading || !content.trim()
                            ? 'text-zinc-400'
                            : 'text-black'
                            }`}>
                            {loading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-4">
                    <View className="mb-6">
                        <Text className="text-white text-lg font-bold mb-3">Edit your post</Text>
                        <TextInput
                            className="text-white text-base bg-zinc-800 rounded-xl p-4 border border-zinc-700 min-h-[120px]"
                            placeholder="What's on your mind?"
                            placeholderTextColor="#9CA3AF"
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {images.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-white text-lg font-bold mb-3">Images (Cannot be modified)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {images.map((image, index) => (
                                    <View key={index} className="relative mr-3">
                                        <Image
                                            source={typeof image === 'string' ? { uri: image } : image}
                                            className="w-24 h-24 rounded-xl"
                                        />
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    )
}