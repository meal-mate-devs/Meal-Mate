
import LottieView from "lottie-react-native";
import React from "react";
import { View } from "react-native";

export default function CustomSplashScreen() {

    return (
        <View className="flex-1 items-center justify-center">
            <LottieView
                source={require('@/assets/lottie/splashscrreenloading.json')}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
            />
        </View >
    );
};
