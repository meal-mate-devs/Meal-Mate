import { Link } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Image, StatusBar, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    image: any;
}

const slides: OnboardingSlide[] = [
    {
        id: "1",
        title: "Healthy Recipe",
        description: "Your body needs energy to work normally and keep you alive. You obtain this energy from food.",
        image: require("../../assets/images/healthyRecipe.png"),
    },
    {
        id: "2",
        title: "Healthy Eating",
        description: "A healthy diet may help to prevent certain long-term (chronic) diseases such as heart disease, stroke and diabetes.",
        image: require("../../assets/images/healthyEating.png"),
    },
    {
        id: "3",
        title: "Eat Healthy",
        description: "Minerals and vitamins are other nutrients that are also important in your diet to help your body stay healthy.",
        image: require("../../assets/images/eatHealthy.png"),
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const renderItem = ({ item }: { item: OnboardingSlide }) => {
        return (
            <View className="flex-1 items-center justify-center px-6" style={{ width }}>
                <View className="bg-zinc-900 rounded-2xl mb-6 p-6 items-center justify-center">
                    <Image
                        source={item.image}
                        className="h-56 w-56"
                        resizeMode="contain"
                    />
                </View>
                <Text className="text-2xl font-bold text-center mb-3 font-poppins-bold text-white">{item.title}</Text>
                <Text className="text-base text-center text-gray-300 font-poppins px-4">{item.description}</Text>
            </View>
        );
    };

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        }
    };

    return (
        <View className="flex-1 bg-black pt-12">
            <StatusBar barStyle="light-content" />
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const contentOffset = event.nativeEvent.contentOffset;
                    const viewSize = event.nativeEvent.layoutMeasurement;
                    const newIndex = Math.floor(contentOffset.x / viewSize.width);
                    setCurrentIndex(newIndex);
                }}
                keyExtractor={(item) => item.id}
                className="flex-1"
            />

            <View className="flex-row justify-center mb-6">
                {slides.map((_, index) => (
                    <View
                        key={index}
                        className={`h-2 ${index === currentIndex ? "w-8 bg-yellow-400" : "w-2 bg-gray-600"} rounded-full mx-1`}
                    />
                ))}
            </View>

            <View className="px-8 mb-12">
                {currentIndex === slides.length - 1 ? (
                    <Link href="/(onboarding)/finish" asChild>
                        <TouchableOpacity className="bg-yellow-400 py-4 rounded-xl items-center">
                            <Text className="text-black font-bold text-lg font-poppins-bold">Get Started</Text>
                        </TouchableOpacity>
                    </Link>
                ) : (
                    <TouchableOpacity
                        className="bg-yellow-400 py-4 rounded-xl items-center"
                        onPress={handleNext}
                    >
                        <Text className="text-black font-bold text-lg font-poppins-bold">Next</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}