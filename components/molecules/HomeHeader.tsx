// components/molecules/HomeHeader.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface HomeHeaderProps {
    username: string;
    profileImage: string;
    onProfilePress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ username, profileImage, onProfilePress }) => {
    const firstName = username.split(' ')[0];

    return (
        <View className="flex-row items-center justify-between py-6">
            <View>
                <Text className="text-gray-400">Hello,</Text>
                <Text className="text-white text-xl font-bold">{firstName}</Text>
            </View>
            <TouchableOpacity onPress={onProfilePress}>
                {profileImage ? (
                    <Image
                        source={{ uri: profileImage }}
                        className="w-10 h-10 rounded-full"
                    />
                ) : (
                    <View className="w-10 h-10 rounded-full overflow-hidden">
                        <LinearGradient
                            colors={['#FACC15', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="w-full h-full items-center justify-center"
                        >
                            <Text className="text-lg font-bold text-white">
                                {firstName.charAt(0)}
                            </Text>
                        </LinearGradient>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default HomeHeader;