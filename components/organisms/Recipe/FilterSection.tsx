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
}

export default function FilterSection({
    title,
    items,
    selectedItems,
    onSelectionChange,
    multiSelect,
}: FilterSectionProps): JSX.Element {
    const handleItemPress = (itemId: string): void => {
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
                        return (
                            <TouchableOpacity
                                key={item.id}
                                className={`mr-3 px-4 py-3 rounded-xl border ${isSelected ? "bg-yellow-400 border-yellow-400" : "bg-zinc-800 border-zinc-700"
                                    }`}
                                onPress={() => handleItemPress(item.id)}
                            >
                                <View className="items-center">
                                    <Text className="text-2xl mb-1">{item.icon}</Text>
                                    <Text className={`text-sm font-bold ${isSelected ? "text-black" : "text-white"}`}>{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    )
}
