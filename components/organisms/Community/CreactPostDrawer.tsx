"use client"

import { CreatePostData } from "@/lib/types/community"
import { Ionicons } from "@expo/vector-icons"
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
    const [images, setImages] = useState<string[]>([])
    const [recipeTitle, setRecipeTitle] = useState<string>("")
    const [cookTime, setCookTime] = useState<string>("")
    const [servings, setServings] = useState<number>(4)
    const [difficulty, setDifficulty] = useState<string>("Easy")
    const [category, setCategory] = useState<string>("Main Course")
    const [ingredients, setIngredients] = useState<string[]>([""])
    const [instructions, setInstructions] = useState<string[]>([""])
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState<string>("")

    const resetForm = (): void => {
        setPostType("simple")
        setContent("")
        setImages([])
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
        const mockImages = [
            "https://images.unsplash.com/photo-1556761223-4c4282c73f77?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1000&auto=format&fit=crop",
        ]
        const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)]
        setImages([...images, randomImage])
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

    const handleCreatePost = (): void => {
        if (!content.trim()) {
            Alert.alert("Please add some content to your post")
            return
        }

        if (postType === "recipe" && !recipeTitle.trim()) {
            Alert.alert("Please add a recipe title")
            return
        }

        const postData: CreatePostData = {
            content,
            images: images.length > 0 ? images : undefined,
            recipeDetails:
                postType === "recipe"
                    ? {
                        title: recipeTitle,
                        cookTime,
                        servings,
                        difficulty,
                        ingredients: ingredients.filter((i) => i.trim()),
                        instructions: instructions.filter((i) => i.trim()),
                        category,
                        tags,
                    }
                    : undefined,
        }

        onCreatePost(postData)
        handleClose()
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
                                                    <Image source={{ uri: image }} className="w-20 h-20 rounded-xl" />
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
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}
