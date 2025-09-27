"use client"

import { Post } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
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
}

export default function EditPostModal({
    visible,
    post,
    onClose,
    onUpdate
}: EditPostModalProps): JSX.Element {
    const [content, setContent] = useState<string>("")
    const [images, setImages] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (post) {
            setContent(post.content || "")
            setImages(post.images || [])
        }
    }, [post])

    const handlePickImages = async (): Promise<void> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.')
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        })

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map(asset => ({
                uri: asset.uri,
                type: asset.type || 'image/jpeg',
                name: asset.fileName || `image_${Date.now()}.jpg`
            }))
            setImages([...images, ...newImages])
        }
    }

    const handleRemoveImage = (index: number): void => {
        setImages(images.filter((_, i) => i !== index))
    }

    const handleUpdate = async (): Promise<void> => {
        if (!post || !content.trim()) {
            Alert.alert('Error', 'Please add some content to your post.')
            return
        }

        try {
            setLoading(true)
            const updateData = {
                content: content.trim(),
                images: images.length > 0 ? images : undefined
            }

            await onUpdate(post.id, updateData)
            onClose()
            Alert.alert('Success', 'Post updated successfully!')
        } catch (error) {
            console.log('Error updating post:', error)
            Alert.alert('Error', 'Failed to update post. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = (): void => {
        setContent("")
        setImages([])
        onClose()
    }

    if (!post) return <></>

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-zinc-900"
            >
                {/* Header */}
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
                    {/* Content Input */}
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

                    {/* Images Section */}
                    {images.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-white text-lg font-bold mb-3">Images</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {images.map((image, index) => (
                                    <View key={index} className="relative mr-3">
                                        <Image
                                            source={typeof image === 'string' ? { uri: image } : image}
                                            className="w-24 h-24 rounded-xl"
                                        />
                                        <TouchableOpacity
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                                            onPress={() => handleRemoveImage(index)}
                                        >
                                            <Ionicons name="close" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Add Images Button */}
                    <TouchableOpacity
                        className="flex-row items-center justify-center p-4 bg-zinc-800 rounded-xl border border-zinc-700 mb-6"
                        onPress={handlePickImages}
                    >
                        <Ionicons name="image-outline" size={24} color="#FBBF24" />
                        <Text className="text-yellow-400 ml-2 font-medium">
                            {images.length > 0 ? 'Add More Images' : 'Add Images'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    )
}