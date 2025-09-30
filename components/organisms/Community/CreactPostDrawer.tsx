"use client"

import { CreatePostData } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import React, { JSX, useState } from "react"
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import Dialog from "../../atoms/Dialog"
interface CreatePostDrawerProps {
    visible: boolean
    onClose: () => void
    onCreatePost: (data: CreatePostData) => void
    userAvatar: any
}

const { height } = Dimensions.get("window")

const RECIPE_CATEGORIES = [
    "Appetizer",
    "Main Course",
    "Dessert",
    "Soup",
    "Salad",
    "Pasta",
    "Seafood",
    "Vegetarian",
    "Snack",
    "Beverage",
]

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"]

export default function CreatePostDrawer({
    visible,
    onClose,
    onCreatePost,
    userAvatar,
}: CreatePostDrawerProps): JSX.Element {
    const [postType, setPostType] = useState<"simple" | "recipe">("simple")
    const [content, setContent] = useState<string>("")
    const [images, setImages] = useState<any[]>([])
    const [showImagePicker, setShowImagePicker] = useState<boolean>(false)
    const [recipeTitle, setRecipeTitle] = useState<string>("")
    const [cookTime, setCookTime] = useState<string>("")
    const [servings, setServings] = useState<number>(4)
    const [difficulty, setDifficulty] = useState<string>("Easy")
    const [category, setCategory] = useState<string>("Main Course")
    const [ingredients, setIngredients] = useState<string[]>([""])
    const [instructions, setInstructions] = useState<string[]>([""])
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState<string>("")

    const [dialogVisible, setDialogVisible] = useState(false)
    const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning' | 'loading'>('loading')
    const [dialogTitle, setDialogTitle] = useState('')
    const [dialogMessage, setDialogMessage] = useState('')

    const showDialog = (type: 'success' | 'error' | 'warning' | 'loading', title: string, message: string = '') => {
        setDialogType(type)
        setDialogTitle(title)
        setDialogMessage(message)
        setDialogVisible(true)
    }

    const resetForm = (): void => {
        setPostType("simple")
        setContent("")
        setImages([])
        setShowImagePicker(false)
        setRecipeTitle("")
        setCookTime("")
        setServings(4)
        setDifficulty("Easy")
        setCategory("Main Course")
        setIngredients([""])
        setInstructions([""])
        setTags([])
        setNewTag("")
    }

    const handleClose = (): void => {
        resetForm()
        onClose()
    }

    const handleAddImage = (): void => {
        setShowImagePicker(true)
    }

    const pickImageFromGallery = async (): Promise<void> => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.')
                return
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                aspect: [1, 1],
                allowsEditing: false,
            })

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map(asset => {
                    const uriParts = asset.uri.split('.');
                    const fileExtension = uriParts[uriParts.length - 1];
                    const fileName = asset.fileName || `image_${Date.now()}.${fileExtension}`;

                    return {
                        uri: asset.uri,
                        type: asset.mimeType || `image/${fileExtension}`,
                        name: fileName,
                        width: asset.width,
                        height: asset.height
                    };
                });

                setImages([...images, ...newImages]);
            }
        } catch (error) {
            console.error('Error picking image from gallery:', error)
            Alert.alert('Error', 'Failed to pick image from gallery')
        } finally {
            setShowImagePicker(false)
        }
    }

    const pickImageFromCamera = async (): Promise<void> => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera permissions to take photos.')
                return
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                aspect: [1, 1],
                allowsEditing: true,
            })

            if (!result.canceled && result.assets) {
                const asset = result.assets[0]
                // Extract file extension from URI
                const uriParts = asset.uri.split('.');
                const fileExtension = uriParts[uriParts.length - 1];

                const newImage = {
                    uri: asset.uri,
                    type: asset.mimeType || `image/${fileExtension}`,
                    name: `camera_${Date.now()}.${fileExtension}`,
                    width: asset.width,
                    height: asset.height
                }

                console.log('Added camera image:', newImage);
                setImages([...images, newImage])
            }
        } catch (error) {
            console.error('Error taking photo:', error)
            Alert.alert('Error', 'Failed to take photo')
        } finally {
            setShowImagePicker(false)
        }
    }

    const handleRemoveImage = (index: number): void => {
        setImages(images.filter((_, i) => i !== index))
    }

    const handleAddIngredient = (): void => {
        setIngredients([...ingredients, ""])
    }

    const handleUpdateIngredient = (index: number, value: string): void => {
        const updated = [...ingredients]
        updated[index] = value
        setIngredients(updated)
    }

    const handleRemoveIngredient = (index: number): void => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter((_, i) => i !== index))
        }
    }

    const handleAddInstruction = (): void => {
        setInstructions([...instructions, ""])
    }

    const handleUpdateInstruction = (index: number, value: string): void => {
        const updated = [...instructions]
        updated[index] = value
        setInstructions(updated)
    }

    const handleRemoveInstruction = (index: number): void => {
        if (instructions.length > 1) {
            setInstructions(instructions.filter((_, i) => i !== index))
        }
    }

    const handleAddTag = (): void => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()])
            setNewTag("")
        }
    }

    const handleRemoveTag = (tag: string): void => {
        setTags(tags.filter((t) => t !== tag))
    }

    const handleCreatePost = async (): Promise<void> => {
        if (!content.trim()) {
            Alert.alert("Please add some content to your post")
            return
        }

        if (postType === "recipe" && !recipeTitle.trim()) {
            Alert.alert("Please add a recipe title")
            return
        }

        const normalizedRecipeDetails = postType === "recipe" ? {
            title: recipeTitle.trim(),
            cookTime: cookTime.toString().trim(),
            servings: Number.isFinite(Number(servings)) ? Number(servings) : 1,
            difficulty,
            category,
            ingredients: ingredients.filter(i => i.trim()).map(i => i.trim()),
            instructions: instructions.filter(i => i.trim()).map(i => i.trim()),
            tags: tags.filter(t => t.trim()),
        } : undefined

        // Ensure images are properly formatted for upload
        const preparedImages = images.length > 0
            ? images.map((img, index) => {
                // Make sure each image has the required properties for FormData
                const fileName = img.name || `image_${Date.now()}_${index}.jpg`;
                const mimeType = img.type || 'image/jpeg';

                return {
                    uri: img.uri,
                    type: mimeType,
                    name: fileName
                };
            })
            : undefined;

        console.log('Prepared images for upload:', preparedImages);

        const postData: CreatePostData = {
            content,
            images: preparedImages,
            recipeDetails: normalizedRecipeDetails,
            postType: postType,
        }

        showDialog('loading', 'Posting', 'Please wait while we create your post...')

        try {

            await onCreatePost(postData)
            showDialog('success', 'Post Created', 'Your post was created successfully.')
            setTimeout(() => {
                setDialogVisible(false)
                resetForm()
                onClose()
            }, 1000)

        } catch (err: any) {
            console.error('Error creating post (drawer):', err)
            showDialog('error', 'Failed to Create Post', err?.message || 'An error occurred while creating your post.')
            return Promise.reject(err)
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <View className="flex-1 bg-black bg-opacity-50 justify-end">
                    <View className="bg-zinc-900 rounded-t-3xl" style={{ height: height * 0.95, maxHeight: height * 0.95 }}>
                        <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
                            <TouchableOpacity onPress={handleClose}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text className="text-white text-lg font-bold">Create Post</Text>
                            <TouchableOpacity onPress={handleCreatePost}>
                                <Text className="text-yellow-400 font-bold text-lg">Post</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            className="flex-1"
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            <View className="flex-row items-center p-4">
                                <Image source={userAvatar} className="w-12 h-12 rounded-full border-2 border-yellow-400" />
                                <View className="ml-3">
                                    <Text className="text-white font-bold">You</Text>
                                    <Text className="text-zinc-400 text-sm">Sharing with Recipe Community</Text>
                                </View>
                            </View>

                            <View className="px-4 mb-4">
                                <View className="flex-row bg-zinc-800 rounded-xl p-1">
                                    <TouchableOpacity
                                        className={`flex-1 py-3 rounded-lg ${postType === "simple" ? "bg-yellow-400" : ""}`}
                                        onPress={() => setPostType("simple")}
                                    >
                                        <Text className={`text-center font-bold ${postType === "simple" ? "text-black" : "text-white"}`}>
                                            Simple Post
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className={`flex-1 py-3 rounded-lg ${postType === "recipe" ? "bg-yellow-400" : ""}`}
                                        onPress={() => setPostType("recipe")}
                                    >
                                        <Text className={`text-center font-bold ${postType === "recipe" ? "text-black" : "text-white"}`}>
                                            Recipe Post
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="px-4 mb-4">
                                <TextInput
                                    className="bg-zinc-800 rounded-xl p-4 text-white text-base"
                                    style={{ minHeight: 100, maxHeight: 150 }}
                                    placeholder={
                                        postType === "recipe"
                                            ? "Share your cooking experience, tips, or story behind this recipe..."
                                            : "What's cooking? Share your culinary thoughts..."
                                    }
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    textAlignVertical="top"
                                    value={content}
                                    onChangeText={setContent}
                                    scrollEnabled={true}

                                />
                            </View>

                            {postType === "recipe" && (
                                <View className="px-4 mb-4">
                                    <Text className="text-white font-bold text-lg mb-4">Recipe Details</Text>

                                    <View className="mb-4">
                                        <Text className="text-white font-bold mb-2">Recipe Title</Text>
                                        <TextInput
                                            className="bg-zinc-800 rounded-xl p-4 text-white"
                                            placeholder="Enter recipe title..."
                                            placeholderTextColor="#9CA3AF"
                                            value={recipeTitle}
                                            onChangeText={setRecipeTitle}
                                        />
                                    </View>

                                    <View className="flex-row justify-between mb-4">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-white font-bold mb-2">Cook Time</Text>
                                            <TextInput
                                                className="bg-zinc-800 rounded-xl p-4 text-white"
                                                placeholder="30 min"
                                                placeholderTextColor="#9CA3AF"
                                                value={cookTime}
                                                onChangeText={setCookTime}
                                            />
                                        </View>
                                        <View className="flex-1 ml-2">
                                            <Text className="text-white font-bold mb-2">Servings</Text>
                                            <View className="bg-zinc-800 rounded-xl p-4 flex-row items-center justify-between">
                                                <TouchableOpacity onPress={() => setServings(Math.max(1, servings - 1))}>
                                                    <Ionicons name="remove" size={20} color="#FFFFFF" />
                                                </TouchableOpacity>
                                                <Text className="text-white font-bold">{servings}</Text>
                                                <TouchableOpacity onPress={() => setServings(Math.min(12, servings + 1))}>
                                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-white font-bold mb-2">Difficulty</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View className="flex-row">
                                                {DIFFICULTY_LEVELS.map((level) => (
                                                    <TouchableOpacity
                                                        key={level}
                                                        className={`mr-2 px-4 py-2 rounded-full ${difficulty === level ? "bg-yellow-400" : "bg-zinc-800"
                                                            }`}
                                                        onPress={() => setDifficulty(level)}
                                                    >
                                                        <Text className={`font-bold ${difficulty === level ? "text-black" : "text-white"}`}>
                                                            {level}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-white font-bold mb-2">Category</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View className="flex-row">
                                                {RECIPE_CATEGORIES.map((cat) => (
                                                    <TouchableOpacity
                                                        key={cat}
                                                        className={`mr-2 px-4 py-2 rounded-full ${category === cat ? "bg-yellow-400" : "bg-zinc-800"
                                                            }`}
                                                        onPress={() => setCategory(cat)}
                                                    >
                                                        <Text className={`font-bold ${category === cat ? "text-black" : "text-white"}`}>{cat}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>

                                    <View className="mb-4">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-white font-bold">Ingredients</Text>
                                            <TouchableOpacity onPress={handleAddIngredient}>
                                                <Ionicons name="add-circle" size={24} color="#FBBF24" />
                                            </TouchableOpacity>
                                        </View>
                                        {ingredients.map((ingredient, index) => (
                                            <View key={index} className="flex-row items-center mb-2">
                                                <TextInput
                                                    className="flex-1 bg-zinc-800 rounded-xl p-3 text-white mr-2"
                                                    placeholder={`Ingredient ${index + 1}`}
                                                    placeholderTextColor="#9CA3AF"
                                                    value={ingredient}
                                                    onChangeText={(value) => handleUpdateIngredient(index, value)}
                                                />
                                                {ingredients.length > 1 && (
                                                    <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                                                        <Ionicons name="remove-circle" size={24} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>

                                    <View className="mb-4">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-white font-bold">Instructions</Text>
                                            <TouchableOpacity onPress={handleAddInstruction}>
                                                <Ionicons name="add-circle" size={24} color="#FBBF24" />
                                            </TouchableOpacity>
                                        </View>
                                        {instructions.map((instruction, index) => (
                                            <View key={index} className="flex-row items-start mb-2">
                                                <View className="w-6 h-6 rounded-full bg-yellow-400 items-center justify-center mr-2 mt-2">
                                                    <Text className="text-black font-bold text-xs">{index + 1}</Text>
                                                </View>
                                                <TextInput
                                                    className="flex-1 bg-zinc-800 rounded-xl p-3 text-white mr-2"
                                                    style={{ minHeight: 40 }}
                                                    placeholder={`Step ${index + 1}`}
                                                    placeholderTextColor="#9CA3AF"
                                                    multiline
                                                    value={instruction}
                                                    onChangeText={(value) => handleUpdateInstruction(index, value)}
                                                />
                                                {instructions.length > 1 && (
                                                    <TouchableOpacity onPress={() => handleRemoveInstruction(index)} className="mt-2">
                                                        <Ionicons name="remove-circle" size={24} color="#EF4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>

                                    <View className="mb-4">
                                        <Text className="text-white font-bold mb-2">Tags</Text>
                                        <View className="flex-row items-center mb-2">
                                            <TextInput
                                                className="flex-1 bg-zinc-800 rounded-xl p-3 text-white mr-2"
                                                placeholder="Add tag..."
                                                placeholderTextColor="#9CA3AF"
                                                value={newTag}
                                                onChangeText={setNewTag}
                                            />
                                            <TouchableOpacity onPress={handleAddTag}>
                                                <Ionicons name="add-circle" size={24} color="#FBBF24" />
                                            </TouchableOpacity>
                                        </View>
                                        <View className="flex-row flex-wrap">
                                            {tags.map((tag) => (
                                                <TouchableOpacity
                                                    key={tag}
                                                    className="bg-yellow-400 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                                                    onPress={() => handleRemoveTag(tag)}
                                                >
                                                    <Text className="text-black font-bold text-sm">{tag}</Text>
                                                    <Ionicons name="close" size={16} color="#000000" className="ml-1" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            )}

                            <View className="px-4 mb-6">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-white font-bold">Photos</Text>
                                    <TouchableOpacity onPress={handleAddImage}>
                                        <Ionicons name="camera" size={24} color="#FBBF24" />
                                    </TouchableOpacity>
                                </View>
                                {images.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View className="flex-row">
                                            {images.map((image, index) => (
                                                <View key={index} className="relative mr-3">
                                                    <Image
                                                        source={{ uri: typeof image === 'string' ? image : image.uri }}
                                                        className="w-20 h-20 rounded-xl"
                                                    />
                                                    <TouchableOpacity
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                                                        onPress={() => handleRemoveImage(index)}
                                                    >
                                                        <Ionicons name="close" size={16} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </ScrollView>
                                )}
                            </View>

                        </ScrollView>
                    </View>

                    {/* Image Picker Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showImagePicker}
                        onRequestClose={() => setShowImagePicker(false)}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white rounded-t-xl p-6">
                                <Text className="text-lg font-semibold text-center mb-6 text-gray-800">
                                    Add Image
                                </Text>

                                <TouchableOpacity
                                    onPress={pickImageFromCamera}
                                    className="bg-green-500 rounded-xl p-4 mb-3 flex-row items-center justify-center"
                                >
                                    <Text className="text-white font-medium text-lg">Take Photo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={pickImageFromGallery}
                                    className="bg-blue-500 rounded-xl p-4 mb-3 flex-row items-center justify-center"
                                >
                                    <Text className="text-white font-medium text-lg">Choose from Gallery</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setShowImagePicker(false)}
                                    className="bg-gray-200 rounded-xl p-4 flex-row items-center justify-center"
                                >
                                    <Text className="text-gray-700 font-medium text-lg">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Dialog for posting status */}
                    <Dialog
                        visible={dialogVisible}
                        type={dialogType}
                        title={dialogTitle}
                        message={dialogMessage}
                        onClose={() => setDialogVisible(false)}
                        autoClose={dialogType !== 'loading'}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}
