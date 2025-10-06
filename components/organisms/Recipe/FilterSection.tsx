import React, { JSX } from "react"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
interface FilterItem {
    id: string
    name: string
    icon: string
}

interface FilterSectionProps {
    title: string
    items: FilterItem[]
    selectedItems: string[]
    onSelectionChange: (selected: string[]) => void
    multiSelect: boolean
    disabledItems?: string[]
    disabledMessage?: string
}

export default function FilterSection({
    title,
    items,
    selectedItems,
    onSelectionChange,
    multiSelect,
    disabledItems = [],
    disabledMessage = "",
}: FilterSectionProps): JSX.Element {
    const handleItemPress = (itemId: string): void => {
        // Don't allow selection of disabled items
        if (disabledItems.includes(itemId)) {
            return
        }
        
        if (multiSelect) {
            const newSelection = selectedItems.includes(itemId)
                ? selectedItems.filter((id) => id !== itemId)
                : [...selectedItems, itemId]
            onSelectionChange(newSelection)
        } else {
            onSelectionChange([itemId])
        }
    }

    return (
        <View className="px-4 mb-6">
            <Text className="text-white text-lg font-bold mb-4">{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                    {items.map((item) => {
                        const isSelected = selectedItems.includes(item.id)
                        const isDisabled = disabledItems.includes(item.id)
                        return (
                            <TouchableOpacity
                                key={item.id}
                                className={`mr-3 px-4 py-3 rounded-xl border ${
                                    isDisabled 
                                        ? "bg-zinc-900 border-zinc-700 opacity-40" 
                                        : isSelected 
                                        ? "bg-yellow-400 border-yellow-400" 
                                        : "bg-zinc-800 border-zinc-700"
                                }`}
                                onPress={() => handleItemPress(item.id)}
                                disabled={isDisabled}
                            >
                                <View className="items-center">
                                    <Text className="text-2xl mb-1">{item.icon}</Text>
                                    <Text className={`text-sm font-bold ${
                                        isDisabled 
                                            ? "text-zinc-500" 
                                            : isSelected 
                                            ? "text-black" 
                                            : "text-white"
                                    }`}>{item.name}</Text>
                                    {isDisabled && (
                                        <Text className="text-xs text-zinc-600 mt-1">Unavailable</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    )
}
