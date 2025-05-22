// app/(protected)/(tabs)/settings/card-details.tsx
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// This would normally come from a route param or context
const cardData = {
    id: '1',
    type: 'mastercard',
    last4: '8675',
    fullNumber: '•••• •••• •••• 8675',
    cardholderName: 'MAX MUSTERMANN',
    expiry: '03/25',
    cvv: '•••',
    isDefault: true,
    billingAddress: {
        street: 'Musterstraße 123',
        city: 'Berlin',
        zip: '10115',
        country: 'Germany'
    }
};

const CardDetailsScreen: React.FC = () => {
    const [isDefault, setIsDefault] = useState(cardData.isDefault);

    // Card logo based on card type
    const cardLogo: ImageSourcePropType =
        cardData.type === 'mastercard'
            ? require('@/assets/images/mastercard-logo.png')
            : require('@/assets/images/visa-logo.png');

    const handleMakeDefault = (value: boolean) => {
        setIsDefault(value);
        // In a real app, you would save this change to your backend
    };

    const handleRemoveCard = () => {
        Alert.alert(
            "Remove Card",
            "Are you sure you want to remove this card from your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        // In a real app, you would call an API to remove the card
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-gray-800">Card Details</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Card Visual */}
                <View className="mb-6">
                    <View className="bg-gray-800 rounded-xl p-5">
                        <View className="flex-row justify-between items-center mb-10">
                            <Image
                                source={cardLogo}
                                className="w-10 h-10"
                                resizeMode="contain"
                            />
                            <MaterialCommunityIcons name="contactless-payment" size={24} color="#FFF" />
                        </View>

                        <Text className="text-gray-300 mb-2">Card Number</Text>
                        <Text className="text-white text-lg mb-4">{cardData.fullNumber}</Text>

                        <View className="flex-row justify-between">
                            <View>
                                <Text className="text-gray-300 text-xs">CARDHOLDER NAME</Text>
                                <Text className="text-white">{cardData.cardholderName}</Text>
                            </View>
                            <View>
                                <Text className="text-gray-300 text-xs">EXPIRY DATE</Text>
                                <Text className="text-white">{cardData.expiry}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Card Details */}
                <View className="mb-6">
                    <Text className="text-gray-500 text-sm mb-1">Card Information</Text>
                    <View className="bg-gray-100 rounded-xl p-3">
                        <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                            <Text className="text-gray-600">Type</Text>
                            <Text className="text-gray-800 font-medium">
                                {cardData.type === 'mastercard' ? 'Mastercard' : 'Visa'}
                            </Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                            <Text className="text-gray-600">Last 4 digits</Text>
                            <Text className="text-gray-800 font-medium">{cardData.last4}</Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                            <Text className="text-gray-600">Expiry date</Text>
                            <Text className="text-gray-800 font-medium">{cardData.expiry}</Text>
                        </View>

                        <View className="flex-row justify-between items-center py-3">
                            <Text className="text-gray-600">Default payment method</Text>
                            <Switch
                                trackColor={{ false: "#d1d5db", true: "#86efac" }}
                                thumbColor={isDefault ? "#22c55e" : "#f4f3f4"}
                                ios_backgroundColor="#d1d5db"
                                onValueChange={handleMakeDefault}
                                value={isDefault}
                            />
                        </View>
                    </View>
                </View>

                {/* Billing Address */}
                <View className="mb-6">
                    <Text className="text-gray-500 text-sm mb-1">Billing Address</Text>
                    <View className="bg-gray-100 rounded-xl p-3">
                        <View className="py-3">
                            <Text className="text-gray-800 font-medium">{cardData.billingAddress.street}</Text>
                            <Text className="text-gray-600">
                                {cardData.billingAddress.zip} {cardData.billingAddress.city}
                            </Text>
                            <Text className="text-gray-600">{cardData.billingAddress.country}</Text>
                        </View>
                    </View>
                </View>

                {/* Remove Card Button */}
                <TouchableOpacity
                    className="flex-row items-center justify-center p-4 mb-6"
                    onPress={handleRemoveCard}
                >
                    <Feather name="trash-2" size={18} color="#ef4444" />
                    <Text className="text-red-500 font-medium ml-2">Remove this card</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CardDetailsScreen;