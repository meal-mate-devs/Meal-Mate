import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CardData {
    id: string;
    type: 'mastercard' | 'visa';
    last4: string;
    expiry: string;
    isDefault: boolean;
}

const PaymentScreen: React.FC = () => {
    const router = useRouter();

    const cards: CardData[] = [
        {
            id: '1',
            type: 'mastercard',
            last4: '8675',
            expiry: '03/25',
            isDefault: true,
        },
        {
            id: '2',
            type: 'visa',
            last4: '1230',
            expiry: '07/27',
            isDefault: false,
        },
    ];

    const renderCard = (card: CardData) => {
        // In a real app, you'd use actual image assets
        const cardLogo: ImageSourcePropType = card.type === 'mastercard'
            ? require('@/assets/images/mastercard-logo.png')
            : require('@/assets/images/visa-logo.png');

        return (
            <TouchableOpacity
                key={card.id}
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
                onPress={() => router.push('/settings/card-details')}
            >
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 rounded-md items-center justify-center mr-3">
                        <Image
                            source={cardLogo}
                            className="w-6 h-6"
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text className="text-gray-800 font-medium">
                            {card.type === 'mastercard' ? 'Mastercard' : 'Visa'} •••• {card.last4}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                            {card.isDefault ? 'Default • ' : ''}Expires {card.expiry}
                        </Text>
                    </View>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            {/* Header */}
            <View className="flex-row items-center px-4 py-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-gray-800">Payment</Text>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Credit Cards */}
                <View className="mb-6">
                    <Text className="text-gray-500 text-sm mb-1">Credit cards</Text>
                    <View className="bg-gray-100 rounded-xl p-3">
                        {cards.map(renderCard)}
                    </View>
                </View>

                {/* Add Card Button */}
                <TouchableOpacity
                    className="flex-row items-center justify-center p-3"
                    onPress={() => router.push('/settings/add-card')}
                >
                    <Feather name="plus" size={18} color="#2ECC71" />
                    <Text className="text-green-500 font-medium ml-2">Add new card</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PaymentScreen;