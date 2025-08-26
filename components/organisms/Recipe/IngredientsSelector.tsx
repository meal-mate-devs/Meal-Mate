"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useState } from "react"
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"


interface Ingredient {
    id: string
    name: string
    category: string
}

interface IngredientSelectorProps {
    visible: boolean
    onClose: () => void
    selectedIngredients: string[]
    onIngredientsChange: (ingredients: string[]) => void
}

const COMMON_INGREDIENTS: Ingredient[] = [
    { id: "chicken", name: "Chicken", category: "Protein" },
    { id: "beef", name: "Beef", category: "Protein" },
    { id: "salmon", name: "Salmon", category: "Protein" },
    { id: "eggs", name: "Eggs", category: "Protein" },
    { id: "rice", name: "Rice", category: "Grains" },
    { id: "pasta", name: "Pasta", category: "Grains" },
    { id: "bread", name: "Bread", category: "Grains" },
    { id: "tomatoes", name: "Tomatoes", category: "Vegetables" },
    { id: "onions", name: "Onions", category: "Vegetables" },
    { id: "garlic", name: "Garlic", category: "Vegetables" },
    { id: "carrots", name: "Carrots", category: "Vegetables" },
    { id: "potatoes", name: "Potatoes", category: "Vegetables" },
    { id: "cheese", name: "Cheese", category: "Dairy" },
    { id: "milk", name: "Milk", category: "Dairy" },
    { id: "butter", name: "Butter", category: "Dairy" },
]

export default function IngredientSelector({
    visible,
    onClose,
    selectedIngredients,
    onIngredientsChange,
}: IngredientSelectorProps): JSX.Element {
    const [searchText, setSearchText] = useState<string>("")
    const [customIngredient, setCustomIngredient] = useState<string>("")

    const filteredIngredients = COMMON_INGREDIENTS.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(searchText.toLowerCase()),
    )

    const handleIngredientToggle = (ingredientName: string): void => {
        const newSelection = selectedIngredients.includes(ingredientName)
            ? selectedIngredients.filter((name) => name !== ingredientName)
            : [...selectedIngredients, ingredientName]
        onIngredientsChange(newSelection)
    }

    const handleAddCustomIngredient = (): void => {
        if (customIngredient.trim() && !selectedIngredients.includes(customIngredient.trim())) {
            onIngredientsChange([...selectedIngredients, customIngredient.trim()])
            setCustomIngredient("")
        }
    }

    const groupedIngredients = filteredIngredients.reduce(
        (acc, ingredient) => {
            if (!acc[ingredient.category]) {
                acc[ingredient.category] = []
            }
            acc[ingredient.category].push(ingredient)
            return acc
        },
        {} as Record<string, Ingredient[]>,
    )

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View className="flex-1 bg-black bg-opacity-95">
                <View className="flex-1 bg-zinc-900">
                    <View className="flex-row justify-between items-center p-4 pt-12 border-b border-zinc-800">
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-white text-lg font-bold">My Pantry</Text>
                        <TouchableOpacity>
                            <Ionicons name="checkmark" size={24} color="#FBBF24" />
                        </TouchableOpacity>
                    </View>

                    <View className="p-4">
                        <View className="bg-zinc-800 rounded-full flex-row items-center px-4 py-3 border border-zinc-700">
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 text-white ml-3"
                                placeholder="Search ingredients..."
                                placeholderTextColor="#9CA3AF"
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>
                    </View>

                    <View className="px-4 mb-4">
                        <View className="flex-row">
                            <TextInput
                                className="flex-1 bg-zinc-800 rounded-l-full px-4 py-3 text-white border border-zinc-700"
                                placeholder="Add custom ingredient..."
                                placeholderTextColor="#9CA3AF"
                                value={customIngredient}
                                onChangeText={setCustomIngredient}
                            />
                            <TouchableOpacity
                                className="bg-yellow-400 rounded-r-full px-4 py-3 justify-center"
                                onPress={handleAddCustomIngredient}
                            >
                                <Ionicons name="add" size={20} color="#000000" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {selectedIngredients.length > 0 && (
                        <View className="px-4 mb-4">
                            <Text className="text-white font-bold mb-2">Selected ({selectedIngredients.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View className="flex-row">
                                    {selectedIngredients.map((ingredient) => (
                                        <TouchableOpacity
                                            key={ingredient}
                                            className="bg-yellow-400 rounded-full px-3 py-2 mr-2 flex-row items-center"
                                            onPress={() => handleIngredientToggle(ingredient)}
                                        >
                                            <Text className="text-black font-bold text-sm">{ingredient}</Text>
                                            <Ionicons name="close" size={16} color="#000000" className="ml-1" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}

                    <ScrollView className="flex-1 px-4">
                        {Object.entries(groupedIngredients).map(([category, ingredients]) => (
                            <View key={category} className="mb-6">
                                <Text className="text-white font-bold text-lg mb-3">{category}</Text>
                                <View className="flex-row flex-wrap">
                                    {ingredients.map((ingredient) => {
                                        const isSelected = selectedIngredients.includes(ingredient.name)
                                        return (
                                            <TouchableOpacity
                                                key={ingredient.id}
                                                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${isSelected ? "bg-yellow-400 border-yellow-400" : "bg-zinc-800 border-zinc-700"
                                                    }`}
                                                onPress={() => handleIngredientToggle(ingredient.name)}
                                            >
                                                <Text className={`font-bold ${isSelected ? "text-black" : "text-white"}`}>
                                                    {ingredient.name}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View className="p-4 border-t border-zinc-800">
                        <TouchableOpacity className="rounded-xl overflow-hidden" onPress={onClose}>
                            <LinearGradient
                                colors={["#FBBF24", "#F97416"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-4"
                            >
                                <Text className="text-white text-center font-bold text-lg">
                                    Use Selected Ingredients ({selectedIngredients.length})
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
