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
        <View className="flex-row items-center justify-between px-5 py-4 pt-5 pb-3">
            <View className="flex-1 ml-1">
                <Text className="text-gray-400 text-base">Hello,</Text>
                <Text className="text-white text-2xl font-bold">{firstName}</Text>
            </View>
            
            <TouchableOpacity 
                onPress={onProfilePress}
                className="p-1 active:opacity-70"
                activeOpacity={0.7}
                style={{
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.5,
                }}
            >
                {profileImage ? (
                    <Image
                        source={{ uri: profileImage }}
                        className="w-14 h-14 rounded-full"
                        style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                ) : (
                    <View className="w-14 h-14 rounded-full overflow-hidden">
                        <LinearGradient
                            colors={['#FACC15', '#F97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="w-full h-full items-center justify-center"
                        >
                            <Text className="text-2xl font-bold text-white">
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