"use client"

import { PantryItem } from "@/lib/services/pantryService"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React, { JSX, useState } from "react"
import { ActivityIndicator, Keyboard, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"


interface IngredientSelectorProps {
    visible: boolean
    onClose: () => void
    selectedIngredients: string[]
    onIngredientsChange: (ingredients: string[]) => void
    pantryItems: PantryItem[]
    isLoadingPantry: boolean
    showIngredientScanner: boolean
    setShowIngredientScanner: (show: boolean) => void
    scannedIngredients?: string[]
}

export default function IngredientSelector({
    visible,
    onClose,
    selectedIngredients,
    onIngredientsChange,
    pantryItems,
    isLoadingPantry,
    showIngredientScanner,
    setShowIngredientScanner,
    scannedIngredients = [],
}: IngredientSelectorProps): JSX.Element {
    const [searchText, setSearchText] = useState<string>("")
    const [customIngredient, setCustomIngredient] = useState<string>("")

    // Filter pantry items based on search text
    const filteredPantryItems = pantryItems.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()),
    )

    // Separate expiring items for priority display (from original pantry, not filtered)
    const allExpiringItems = pantryItems.filter(item => item.expiryStatus === 'expiring')
    const unselectedExpiringItems = allExpiringItems.filter(item => 
        !selectedIngredients.includes(item.name)
    )

    // Special categories
    const selectedPantryItems = filteredPantryItems.filter(item =>
        selectedIngredients.includes(item.name)
    )

    // Get custom ingredients (those not in pantry)
    const customIngredients = selectedIngredients.filter(ingredient =>
        !pantryItems.some(item => item.name === ingredient)
    )
    
    // Scanned items - create pseudo-items for scanned ingredients not in pantry
    const scannedItems = (scannedIngredients || [])
        .filter(ingredientName => typeof ingredientName === 'string' && ingredientName.trim() !== '')
        .map(ingredientName => {
            // Check if this scanned ingredient exists in pantry
            const pantryItem = pantryItems.find(item => item.name.toLowerCase() === ingredientName.toLowerCase())
            if (pantryItem) {
                return pantryItem
            } else {
                // Create a pseudo pantry item for scanned ingredients not in pantry
                return {
                    id: `scanned-${ingredientName}`,
                    name: ingredientName.trim(),
                    category: 'Scanned',
                    quantity: 0,
                    unit: 'piece',
                    expiryDate: '',
                    addedDate: new Date().toISOString(),
                    detectionMethod: 'ai' as const,
                    daysUntilExpiry: 999,
                    expiryStatus: 'active' as const,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                } as PantryItem
            }
        }).filter(item => 
            // Only show if matches search filter
            item.name.toLowerCase().includes(searchText.toLowerCase())
        )

    // Regular pantry items (excluding selected and scanned to avoid duplicates)
    const regularItems = filteredPantryItems.filter(item => 
        !selectedIngredients.includes(item.name) && 
        !scannedIngredients.includes(item.name)
    )

    // Group regular pantry items by category
    const groupedIngredients = regularItems.reduce(
        (groups, item) => {
            const category = item.category || "Other"
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category].push(item)
            return groups
        },
        {} as Record<string, PantryItem[]>,
    )

    // Sort items within each category: expiring first, then by name
    Object.keys(groupedIngredients).forEach(category => {
        groupedIngredients[category].sort((a, b) => {
            // Expiring items first
            if (a.expiryStatus === 'expiring' && b.expiryStatus !== 'expiring') return -1
            if (b.expiryStatus === 'expiring' && a.expiryStatus !== 'expiring') return 1
            // Then sort by name
            return a.name.localeCompare(b.name)
        })
    })

    // Helper function to get expiry label
    const getExpiryLabel = (item: PantryItem) => {
        if (item.expiryStatus === 'expiring') {
            const days = item.daysUntilExpiry
            if (days <= 1) {
                return { text: 'Use Today!', color: 'bg-red-500', urgent: true }
            } else if (days <= 3) {
                return { text: `${days} days left`, color: 'bg-orange-500', urgent: true }
            } else {
                return { text: 'Expiring Soon', color: 'bg-yellow-500', urgent: false }
            }
        }
        return null
    }

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

    const handleSelectAll = (): void => {
        const allIngredientNames = pantryItems.map(item => item.name)
        onIngredientsChange(allIngredientNames)
    }

    const handleSelectExpiring = (): void => {
        const expiringIngredientNames = allExpiringItems.map(item => item.name)
        const currentSelection = [...selectedIngredients]
        expiringIngredientNames.forEach(name => {
            if (!currentSelection.includes(name)) {
                currentSelection.push(name)
            }
        })
        onIngredientsChange(currentSelection)
    }

    const handleClearAll = (): void => {
        onIngredientsChange([])
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View className="flex-1 bg-black bg-opacity-95">
                <View className="flex-1 bg-zinc-900">
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-6 pt-8 border-b border-zinc-800">
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text className="text-white text-lg font-bold">
                            My Pantry{!isLoadingPantry && ` (${pantryItems.length})`}
                        </Text>
                        <TouchableOpacity onPress={() => setShowIngredientScanner(true)}>
                            <View className="flex-row items-center">
                                <Ionicons name="camera" size={20} color="#FBBF24" />
                                <Text className="text-yellow-400 font-semibold ml-1">Scan</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Search and Actions */}
                    <View className="p-4">
                        <View className="bg-zinc-800 rounded-full flex-row items-center px-4 py-3 border border-zinc-700 mb-4">
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 text-white ml-3"
                                placeholder="Search your pantry..."
                                placeholderTextColor="#9CA3AF"
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>

                        {/* Selected Count and Select/Unselect */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-zinc-400">
                                {selectedIngredients.length} ingredient{selectedIngredients.length > 1 ? 's' : ''} selected
                            </Text>
                            {selectedIngredients.length > 0 ? (
                                <TouchableOpacity onPress={handleClearAll}>
                                    <Text className="text-red-400 font-semibold">Unselect All</Text>
                                </TouchableOpacity>
                            ) : unselectedExpiringItems.length > 0 ? (
                                <TouchableOpacity onPress={handleSelectExpiring}>
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={16} color="#EF4444" />
                                        <Text className="text-red-400 font-semibold ml-1">Select Expiring</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={handleSelectAll}>
                                    <Text className="text-yellow-400 font-semibold">Select All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Loading State */}
                    {isLoadingPantry ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#FBBF24" />
                            <Text className="text-zinc-400 mt-4">Loading your pantry...</Text>
                        </View>
                    ) : (
                        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                            {/* Empty State */}
                            {pantryItems.length === 0 ? (
                                <View className="flex-1 justify-center items-center py-20">
                                    <Ionicons name="basket-outline" size={64} color="#4B5563" />
                                    <Text className="text-zinc-400 text-lg font-medium mt-4">Your pantry is empty</Text>
                                    <Text className="text-zinc-500 text-center mt-2">
                                        Add ingredients to your pantry to see them here
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Priority: Expiring Items */}
                                    {unselectedExpiringItems.length > 0 && (
                                        <View className="mb-4 p-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl border border-red-500/30">
                                            <View className="flex-row items-center">
                                                <Ionicons name="time-outline" size={16} color="#EF4444" />
                                                <Text className="text-red-400 font-bold ml-3 flex-1">Use Soon</Text>
                                                <View className="bg-red-500 rounded-full px-2 py-0.5">
                                                    <Text className="text-white text-xs font-bold">{unselectedExpiringItems.length}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    {/* Selected Ingredients Category */}
                                    {(selectedPantryItems.length > 0 || customIngredients.length > 0) && (
                                        <View className="mb-6">
                                            <View className="flex-row items-center mb-3">
                                                <Text className="text-green-400 text-lg font-bold">Selected</Text>
                                                <View className="bg-green-500 rounded-full px-2 py-1 ml-2">
                                                    <Text className="text-white text-xs font-bold">{selectedIngredients.length}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row flex-wrap">
                                                {/* Selected Pantry Items */}
                                                {selectedPantryItems.map((item) => {
                                                    const isSelected = selectedIngredients.includes(item.name)
                                                    const expiryLabel = getExpiryLabel(item)
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.id}
                                                            onPress={() => handleIngredientToggle(item.name)}
                                                            className="mr-3 mb-3 rounded-2xl border bg-yellow-400 border-yellow-400"
                                                        >
                                                            {expiryLabel && (
                                                                <View className={`${expiryLabel.color} rounded-t-xl px-3 py-1`}>
                                                                    <Text className="text-white text-xs font-bold text-center">
                                                                        {expiryLabel.text}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            <View className={`px-4 py-3 ${expiryLabel ? '' : 'rounded-2xl'}`}>
                                                                <View className="flex-row items-center">
                                                                    <Text className="font-medium text-black">
                                                                        {typeof item.name === 'string' ? item.name : 'Unknown Ingredient'}
                                                                    </Text>
                                                                    {item.quantity > 0 && item.unit && (
                                                                        <Text className="ml-2 text-sm text-black opacity-70">
                                                                            ({item.quantity} {item.unit})
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                                {/* Custom Ingredients */}
                                                {customIngredients.map((ingredient) => (
                                                    <TouchableOpacity
                                                        key={`custom-${ingredient}`}
                                                        onPress={() => handleIngredientToggle(ingredient)}
                                                        className="mr-3 mb-3 rounded-2xl border bg-purple-500 border-purple-500"
                                                    >
                                                        <View className="px-4 py-3 rounded-2xl">
                                                            <View className="flex-row items-center">
                                                                <Text className="font-medium text-white">
                                                                    {ingredient}
                                                                </Text>
                                                                <View className="ml-2 bg-purple-700 rounded-full px-2 py-0.5">
                                                                    <Text className="text-xs font-bold text-white">Custom</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Scanned Ingredients Category */}
                                    {scannedItems.length > 0 && (
                                        <View className="mb-6">
                                            <View className="flex-row items-center mb-3">
                                                <Ionicons name="camera" size={20} color="#8B5CF6" />
                                                <Text className="text-purple-400 text-lg font-bold ml-2">Scanned</Text>
                                                <View className="bg-purple-500 rounded-full px-2 py-1 ml-2">
                                                    <Text className="text-white text-xs font-bold">{scannedItems.length}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row flex-wrap">
                                                {scannedItems.map((item) => {
                                                    const isSelected = selectedIngredients.includes(item.name)
                                                    const expiryLabel = getExpiryLabel(item)
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.id}
                                                            onPress={() => handleIngredientToggle(item.name)}
                                                            className={`mr-3 mb-3 rounded-2xl border ${
                                                                isSelected
                                                                    ? "bg-yellow-400 border-yellow-400"
                                                                    : "bg-zinc-800 border-purple-500/50"
                                                            }`}
                                                        >
                                                            {expiryLabel && (
                                                                <View className={`${expiryLabel.color} rounded-t-xl px-3 py-1`}>
                                                                    <Text className="text-white text-xs font-bold text-center">
                                                                        {expiryLabel.text}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            <View className={`px-4 py-3 ${expiryLabel ? '' : 'rounded-2xl'}`}>
                                                                <View className="flex-row items-center">
                                                                    <Text
                                                                        className={`font-medium ${
                                                                            isSelected ? "text-black" : "text-white"
                                                                        }`}
                                                                    >
                                                                        {item.name || 'Unknown Ingredient'}
                                                                    </Text>
                                                                    {item.quantity > 0 && item.unit && (
                                                                        <Text
                                                                            className={`ml-2 text-sm ${
                                                                                isSelected ? "text-black opacity-70" : "text-zinc-400"
                                                                            }`}
                                                                        >
                                                                            ({item.quantity} {item.unit})
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    )}

                                    {/* Regular Grouped Ingredients */}
                                    {Object.entries(groupedIngredients).map(([category, items]) => (
                                        <View key={category} className="mb-6">
                                            <Text className="text-white text-lg font-bold mb-3 capitalize">
                                                {category}
                                            </Text>
                                            <View className="flex-row flex-wrap">
                                                {items.map((item) => {
                                                    const isSelected = selectedIngredients.includes(item.name)
                                                    const expiryLabel = getExpiryLabel(item)
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.id}
                                                            onPress={() => handleIngredientToggle(item.name)}
                                                            className={`mr-3 mb-3 rounded-2xl border ${
                                                                isSelected
                                                                    ? "bg-yellow-400 border-yellow-400"
                                                                    : expiryLabel
                                                                    ? "bg-zinc-800 border-orange-500/50"
                                                                    : "bg-zinc-800 border-zinc-600"
                                                            }`}
                                                        >
                                                            {expiryLabel && (
                                                                <View className={`${expiryLabel.color} rounded-t-xl px-3 py-1`}>
                                                                    <Text className="text-white text-xs font-bold text-center">
                                                                        {expiryLabel.text}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            <View className={`px-4 py-3 ${expiryLabel ? '' : 'rounded-2xl'}`}>
                                                                <View className="flex-row items-center">
                                                                    <Text
                                                                        className={`font-medium ${
                                                                            isSelected ? "text-black" : "text-white"
                                                                        }`}
                                                                    >
                                                                        {item.name || 'Unknown Ingredient'}
                                                                    </Text>
                                                                    {item.quantity > 0 && item.unit && (
                                                                        <Text
                                                                            className={`ml-2 text-sm ${
                                                                                isSelected ? "text-black opacity-70" : "text-zinc-400"
                                                                            }`}
                                                                        >
                                                                            ({item.quantity} {item.unit})
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                    )
                                                })}
                                            </View>
                                        </View>
                                    ))}

                                    {/* Custom Ingredient Section */}
                                    <View className="mb-6 pb-6">
                                        <Text className="text-white text-lg font-bold mb-3">Add Custom Ingredient</Text>
                                        
                                        <TouchableOpacity
                                            onPress={() => setShowIngredientScanner(true)}
                                            className="flex-row items-center justify-center bg-zinc-800 border border-zinc-600 rounded-full px-4 py-3"
                                        >
                                            <Ionicons name="add-outline" size={20} color="#FBBF24" />
                                            <Ionicons name="camera-outline" size={20} color="#FBBF24" />
                                            <Text className="text-white ml-2 text-sm font-medium">Manually Add Ingredients</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    )}

                    {/* Bottom Action */}
                    <View className="p-4 border-t border-zinc-800">
                        <TouchableOpacity onPress={onClose} className="rounded-2xl overflow-hidden">
                            <LinearGradient
                                colors={["#FBBF24", "#F97316"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-4 px-6"
                            >
                                <Text className="text-center text-black text-lg font-bold">
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