import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface GroceryItem {
    id: string;
    name: string;
    quantity: string;
    category: string;
    isCompleted: boolean;
    isUrgent?: boolean;
}

const GroceryListScreen: React.FC = () => {
    const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([
        { id: '1', name: 'Tomatoes', quantity: '2 kg', category: 'Vegetables', isCompleted: false, isUrgent: true },
        { id: '2', name: 'Chicken Breast', quantity: '1 kg', category: 'Meat', isCompleted: false },
        { id: '3', name: 'Milk', quantity: '2 liters', category: 'Dairy', isCompleted: true },
        { id: '4', name: 'Rice', quantity: '5 kg', category: 'Grains', isCompleted: false },
        { id: '5', name: 'Eggs', quantity: '12 pieces', category: 'Dairy', isCompleted: false },
        { id: '6', name: 'Onions', quantity: '1 kg', category: 'Vegetables', isCompleted: true },
        { id: '7', name: 'Olive Oil', quantity: '500 ml', category: 'Pantry', isCompleted: false, isUrgent: true },
    ]);

    const [newItem, setNewItem] = useState('');
    const [newQuantity, setNewQuantity] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const toggleItemCompletion = (id: string) => {
        setGroceryItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
            )
        );
    };

    const deleteItem = (id: string) => {
        setGroceryItems(prev => prev.filter(item => item.id !== id));
    };

    const addNewItem = () => {
        if (newItem.trim() && newQuantity.trim()) {
            const newGroceryItem: GroceryItem = {
                id: Date.now().toString(),
                name: newItem.trim(),
                quantity: newQuantity.trim(),
                category: 'Other',
                isCompleted: false,
            };
            setGroceryItems(prev => [...prev, newGroceryItem]);
            setNewItem('');
            setNewQuantity('');
            setShowAddForm(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Vegetables': return '🥕';
            case 'Meat': return '🥩';
            case 'Dairy': return '🥛';
            case 'Grains': return '🌾';
            case 'Pantry': return '🏺';
            default: return '🛒';
        }
    };

    const completedItems = groceryItems.filter(item => item.isCompleted);
    const pendingItems = groceryItems.filter(item => !item.isCompleted);
    const urgentItems = pendingItems.filter(item => item.isUrgent);

    const renderGroceryItem = ({ item }: { item: GroceryItem }) => (
        <View className={`bg-zinc-800 rounded-xl p-4 mb-3 ${item.isUrgent && !item.isCompleted ? 'border border-orange-500' : ''}`}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={() => toggleItemCompletion(item.id)}
                        className="mr-3"
                    >
                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            item.isCompleted 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-400'
                        }`}>
                            {item.isCompleted && (
                                <Ionicons name="checkmark" size={14} color="white" />
                            )}
                        </View>
                    </TouchableOpacity>
                    
                    <Text className="text-2xl mr-3">{getCategoryIcon(item.category)}</Text>
                    
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className={`text-lg font-semibold ${
                                item.isCompleted ? 'text-gray-500 line-through' : 'text-white'
                            }`}>
                                {item.name}
                            </Text>
                            {item.isUrgent && !item.isCompleted && (
                                <View className="ml-2 bg-orange-500 px-2 py-1 rounded-full">
                                    <Text className="text-white text-xs font-bold">URGENT</Text>
                                </View>
                            )}
                        </View>
                        <Text className={`text-sm ${
                            item.isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                            {item.quantity} • {item.category}
                        </Text>
                    </View>
                </View>
                
                <TouchableOpacity
                    onPress={() => deleteItem(item.id)}
                    className="ml-2 p-2"
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
                >
                    <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
                
                <Text className="text-white text-xl font-bold">Grocery List</Text>
                
                <TouchableOpacity
                    onPress={() => setShowAddForm(!showAddForm)}
                    className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center"
                >
                    <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View className="px-4 mb-4">
                <View className="flex-row space-x-4">
                    <LinearGradient
                        colors={['#FACC15', '#F97316']}
                        className="flex-1 rounded-xl p-4"
                    >
                        <Text className="text-white text-2xl font-bold">{pendingItems.length}</Text>
                        <Text className="text-white/80 text-sm">Items Left</Text>
                    </LinearGradient>
                    
                    <View className="flex-1 bg-zinc-800 rounded-xl p-4">
                        <Text className="text-white text-2xl font-bold">{completedItems.length}</Text>
                        <Text className="text-gray-400 text-sm">Completed</Text>
                    </View>
                    
                    {urgentItems.length > 0 && (
                        <View className="flex-1 bg-red-600 rounded-xl p-4">
                            <Text className="text-white text-2xl font-bold">{urgentItems.length}</Text>
                            <Text className="text-white/80 text-sm">Urgent</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Add New Item Form */}
            {showAddForm && (
                <View className="mx-4 mb-4 bg-zinc-800 rounded-xl p-4">
                    <TextInput
                        value={newItem}
                        onChangeText={setNewItem}
                        placeholder="Item name..."
                        placeholderTextColor="#9CA3AF"
                        className="bg-zinc-700 text-white p-3 rounded-lg mb-3"
                    />
                    <TextInput
                        value={newQuantity}
                        onChangeText={setNewQuantity}
                        placeholder="Quantity (e.g., 2 kg, 500g)..."
                        placeholderTextColor="#9CA3AF"
                        className="bg-zinc-700 text-white p-3 rounded-lg mb-3"
                    />
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            onPress={addNewItem}
                            className="flex-1 bg-green-600 py-3 rounded-lg items-center"
                        >
                            <Text className="text-white font-semibold">Add Item</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowAddForm(false)}
                            className="flex-1 bg-gray-600 py-3 rounded-lg items-center"
                        >
                            <Text className="text-white font-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Grocery List */}
            <FlatList
                data={groceryItems}
                renderItem={renderGroceryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Text className="text-6xl mb-4">🛒</Text>
                        <Text className="text-white text-xl font-semibold mb-2">Your grocery list is empty</Text>
                        <Text className="text-gray-400 text-center">
                            Add items to your grocery list to keep track of what you need to buy
                        </Text>
                    </View>
                }
            />

            {/* Quick Actions Footer */}
            <View className="absolute bottom-0 left-0 right-0 bg-black/90 border-t border-zinc-800 p-4">
                <View className="flex-row space-x-3">
                    <TouchableOpacity className="flex-1 bg-zinc-800 py-3 rounded-lg flex-row items-center justify-center">
                        <Feather name="share" size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">Share List</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity className="flex-1 bg-zinc-800 py-3 rounded-lg flex-row items-center justify-center">
                        <Ionicons name="checkmark-done" size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">Clear All</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default GroceryListScreen;
