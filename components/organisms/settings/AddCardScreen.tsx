// app/(protected)/(tabs)/settings/add-card.tsx
import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CardFormData {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
    makeDefault: boolean;
}

const AddCardScreen: React.FC = () => {
    const [formData, setFormData] = useState<CardFormData>({
        cardNumber: '',
        cardholderName: '',
        expiryDate: '',
        cvv: '',
        makeDefault: false,
    });

    const [cardType, setCardType] = useState<'mastercard' | 'visa' | 'unknown'>('unknown');

    // Format card number with spaces
    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const limit = 16;
        const formatted = cleaned.substring(0, limit).replace(/(.{4})/g, '$1 ').trim();

        // Detect card type based on first digit
        if (cleaned.startsWith('4')) {
            setCardType('visa');
        } else if (cleaned.startsWith('5')) {
            setCardType('mastercard');
        } else {
            setCardType('unknown');
        }

        return formatted;
    };

    // Format expiry date with slash
    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/[^0-9]/gi, '');
        const limit = 4;
        if (cleaned.length > 2) {
            return `${cleaned.substring(0, 2)}/${cleaned.substring(2, limit)}`;
        }
        return cleaned;
    };

    const handleInputChange = (field: keyof CardFormData, value: string) => {
        let formattedValue = value;

        if (field === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (field === 'expiryDate') {
            formattedValue = formatExpiryDate(value);
        } else if (field === 'cvv') {
            formattedValue = value.replace(/[^0-9]/gi, '').substring(0, 3);
        }

        setFormData(prev => ({ ...prev, [field]: formattedValue }));
    };

    const handleSaveCard = () => {
        // Simple validation
        if (
            formData.cardNumber.replace(/\s+/g, '').length < 16 ||
            !formData.cardholderName ||
            formData.expiryDate.length < 5 ||
            formData.cvv.length < 3
        ) {
            Alert.alert("Incomplete Information", "Please fill out all card details correctly.");
            return;
        }

        // In a real app, you would validate the card and send to a payment processor
        Alert.alert(
            "Card Added",
            "Your card has been successfully added to your account.",
            [
                {
                    text: "OK",
                    onPress: () => router.back()
                }
            ]
        );
    };

    const renderCardTypeIcon = () => {
        if (cardType === 'visa') {
            return <FontAwesome name="cc-visa" size={24} color="#1a1f71" />;
        } else if (cardType === 'mastercard') {
            return <FontAwesome name="cc-mastercard" size={24} color="#eb001b" />;
        }
        return null;
    };

    const renderInputField = (
        label: string,
        field: keyof CardFormData,
        placeholder: string,
        keyboardType: 'default' | 'numeric' = 'default',
        icon?: React.ReactNode
    ) => (
        <View className="mb-5">
            <Text className="text-gray-600 mb-1">{label}</Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                {icon && <View className="mr-2">{icon}</View>}
                <TextInput
                    className="flex-1 h-12 text-gray-800"
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    value={formData[field] as string}
                    onChangeText={(text) => handleInputChange(field, text)}
                    keyboardType={keyboardType}
                    autoCapitalize={field === 'cardholderName' ? 'characters' : 'none'}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-gray-800">Add New Card</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-4">
                    {/* Card Form */}
                    {renderInputField(
                        'Card Number',
                        'cardNumber',
                        'XXXX XXXX XXXX XXXX',
                        'numeric',
                        renderCardTypeIcon()
                    )}

                    {renderInputField(
                        'Cardholder Name',
                        'cardholderName',
                        'NAME AS APPEARS ON CARD'
                    )}

                    <View className="flex-row mb-5">
                        <View className="flex-1 mr-2">
                            {renderInputField(
                                'Expiry Date',
                                'expiryDate',
                                'MM/YY',
                                'numeric'
                            )}
                        </View>
                        <View className="flex-1 ml-2">
                            {renderInputField(
                                'CVV',
                                'cvv',
                                '•••',
                                'numeric'
                            )}
                        </View>
                    </View>

                    {/* Default Payment Switch */}
                    <View className="flex-row justify-between items-center mb-8 py-2">
                        <Text className="text-gray-600">Make default payment method</Text>
                        <Switch
                            trackColor={{ false: "#d1d5db", true: "#86efac" }}
                            thumbColor={formData.makeDefault ? "#22c55e" : "#f4f3f4"}
                            ios_backgroundColor="#d1d5db"
                            onValueChange={(value) => setFormData(prev => ({ ...prev, makeDefault: value }))}
                            value={formData.makeDefault}
                        />
                    </View>

                    {/* Card Security Notice */}
                    <View className="flex-row items-center mb-8 p-3 bg-blue-50 rounded-lg">
                        <Feather name="shield" size={20} color="#3b82f6" />
                        <Text className="ml-2 text-blue-700 text-sm">
                            Your card information is encrypted and securely stored. We never share your details with merchants.
                        </Text>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        className="bg-green-500 rounded-xl py-4 items-center mb-6"
                        onPress={handleSaveCard}
                    >
                        <Text className="text-white font-bold">Save Card</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddCardScreen;