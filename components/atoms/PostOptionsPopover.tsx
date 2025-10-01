"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { JSX } from "react"
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native"

interface PostOptionsPopoverProps {
    visible: boolean
    onClose: () => void
    onEdit: () => void
    onDelete: () => Promise<void>
    isOwnPost: boolean
    position?: { top: number; right: number } // Add position prop
}

export default function PostOptionsPopover({
    visible,
    onClose,
    onEdit,
    onDelete,
    isOwnPost,
    position // Use position prop
}: PostOptionsPopoverProps): JSX.Element {
    if (!isOwnPost) return <></>

    const handleDelete = (): void => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await onDelete()
                            Alert.alert('Success', 'Post deleted successfully')
                        } catch (error) {
                            console.log('Error deleting post:', error)
                            Alert.alert('Error', 'Failed to delete post')
                        }
                    }
                }
            ]
        )
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                className="flex-1 bg-black/50"
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    className="absolute bg-zinc-800 rounded-xl w-64 overflow-hidden"
                    style={{ top: position?.top || '50%', right: position?.right || '50%' }} // Apply position
                >
                    <TouchableOpacity
                        className="flex-row items-center p-4 border-b border-zinc-700"
                        onPress={() => {
                            onEdit()
                            onClose()
                        }}
                    >
                        <Ionicons name="create-outline" size={20} color="#FBBF24" />
                        <Text className="text-white ml-3 font-medium">Edit Post</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center p-4"
                        onPress={() => {
                            handleDelete()
                            onClose()
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        <Text className="text-red-400 ml-3 font-medium">Delete Post</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    )
}