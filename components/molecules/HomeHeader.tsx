import { Image, Text, TouchableOpacity, View } from "react-native";


interface HomeHeaderProps {
    username: string;
    profileImage: string;
    onProfilePress: () => void;
    notifications?: number;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    username,
    profileImage,
    onProfilePress
}) => {
    return (
        <View className="flex-row justify-between items-center mt-4 mb-6">
            <View>
                <Text className="text-gray-500 text-base">Hello, {username} 👋</Text>
                <Text className="text-gray-600 text-lg font-medium">What do you want to cook today?</Text>
            </View>
            <TouchableOpacity onPress={onProfilePress}>
                <Image
                    source={{ uri: profileImage }}
                    className="h-12 w-12 rounded-full"
                />
            </TouchableOpacity>
        </View>
    );
};

export default HomeHeader;