
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function CustomSplashScreen() {
    // Simple fade animation for the logo and text
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Clean fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Simple black background */}
            <View style={styles.background}>
                <Animated.View
                    style={[
                        styles.contentContainer,
                        { opacity: fadeAnim }
                    ]}
                >
                    {/* Clean Lottie Animation */}
                    <LottieView
                        source={require('@/assets/lottie/loading.json')}
                        autoPlay
                        loop
                        style={styles.lottie}
                    />

                    {/* Simple App Title */}
                    <Text style={styles.appTitle}>MealMate</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        backgroundColor: '#000000', // Pure black background
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottie: {
        width: 120,
        height: 120,
        marginBottom: 24,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF', // Clean white text
        letterSpacing: 1,
    },
});
